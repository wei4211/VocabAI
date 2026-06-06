from fastapi import APIRouter, Request, HTTPException, Header, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal, get_db
from app.models.word import Word, WordSource
from app.models.user import User
from app.services.ai_service import generate_word_card
from app.services.review_service import create_review_schedule
from app.utils.auth import get_current_user
from app.config import settings
from datetime import datetime, timedelta
import hashlib
import hmac
import base64
import json
import random
import string
import httpx

router = APIRouter(prefix="/line", tags=["line"])

LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply"


def verify_line_signature(body: bytes, signature: str) -> bool:
    if not settings.LINE_CHANNEL_SECRET:
        return True
    expected = base64.b64encode(
        hmac.new(settings.LINE_CHANNEL_SECRET.encode(), body, hashlib.sha256).digest()
    ).decode()
    return hmac.compare_digest(expected, signature)


async def reply_to_line(reply_token: str, message: str):
    if not settings.LINE_CHANNEL_ACCESS_TOKEN:
        print("LINE_CHANNEL_ACCESS_TOKEN not set")
        return
    async with httpx.AsyncClient() as client:
        res = await client.post(
            LINE_REPLY_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.LINE_CHANNEL_ACCESS_TOKEN}",
            },
            json={
                "replyToken": reply_token,
                "messages": [{"type": "text", "text": message}],
            },
            timeout=10,
        )
        print(f"LINE reply status: {res.status_code}, body: {res.text}")


def generate_bind_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


# ── API：產生綁定碼（需登入）──────────────────────────
@router.post("/generate-bind-code")
def generate_bind_code_api(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    code = generate_bind_code()
    current_user.line_bind_code = code
    current_user.line_bind_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    return {"code": code, "expires_in_minutes": 10}


# ── API：取得綁定狀態（需登入）──────────────────────────
@router.get("/bind-status")
def get_bind_status(
    current_user: User = Depends(get_current_user),
):
    return {
        "is_bound": current_user.line_user_id is not None,
        "line_user_id": current_user.line_user_id,
    }


# ── API：解除綁定（需登入）──────────────────────────
@router.delete("/unbind")
def unbind_line(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.line_user_id = None
    current_user.line_bind_code = None
    current_user.line_bind_expires = None
    db.commit()
    return {"message": "已解除 LINE 綁定"}


# ── Webhook ──────────────────────────────────────────
@router.post("/webhook")
async def line_webhook(
    request: Request,
    x_line_signature: str = Header(None),
):
    body = await request.body()

    if not verify_line_signature(body, x_line_signature or ""):
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    db: Session = SessionLocal()
    try:
        for event in data.get("events", []):
            if event.get("type") != "message":
                continue
            if event.get("message", {}).get("type") != "text":
                continue

            text = event["message"]["text"].strip()
            line_user_id = event["source"]["userId"]
            reply_token = event.get("replyToken", "")

            # ── 綁定流程 ──
            if text.upper().startswith("BIND "):
                code = text[5:].strip().upper()
                user = db.query(User).filter(
                    User.line_bind_code == code,
                    User.line_bind_expires > datetime.utcnow(),
                ).first()

                if not user:
                    await reply_to_line(reply_token, "❌ 綁定碼無效或已過期，請在 VocabAI 網站重新產生。")
                    continue

                # 確認這個 LINE 帳號沒有綁定其他用戶
                existing = db.query(User).filter(User.line_user_id == line_user_id).first()
                if existing and existing.id != user.id:
                    await reply_to_line(reply_token, "❌ 此 LINE 帳號已綁定其他 VocabAI 帳號。")
                    continue

                user.line_user_id = line_user_id
                user.line_bind_code = None
                user.line_bind_expires = None
                db.commit()
                await reply_to_line(reply_token, f"✅ 綁定成功！歡迎 {user.username}！\n\n現在你可以直接傳英文單字給我，我會幫你加入單字庫。\n\n輸入「幫助」查看更多指令。")
                continue

            # ── 查詢已綁定用戶 ──
            user = db.query(User).filter(User.line_user_id == line_user_id).first()

            if not user:
                await reply_to_line(reply_token, "👋 你好！請先在 VocabAI 網站（個人資料頁）產生綁定碼，然後傳送：\n\nBIND 你的綁定碼")
                continue

            # ── 指令處理 ──
            if text in ["幫助", "help", "Help", "HELP"]:
                await reply_to_line(reply_token,
                    "📚 VocabAI 指令列表：\n\n"
                    "• 直接傳英文單字 → 加入單字庫\n"
                    "• 幫助 → 顯示此訊息\n"
                    "• 單字數 → 查看你的單字數量"
                )
                continue

            if text in ["單字數", "stats"]:
                count = db.query(Word).filter(Word.user_id == user.id).count()
                await reply_to_line(reply_token, f"📖 你目前共有 {count} 個單字！")
                continue

            # ── 新增單字 ──
            word_text = text.lower().split()[0]
            if not word_text.isalpha():
                await reply_to_line(reply_token, "請傳送英文單字，例如：sustain")
                continue

            existing_word = db.query(Word).filter(
                Word.user_id == user.id,
                Word.word == word_text,
            ).first()

            if existing_word:
                await reply_to_line(reply_token,
                    f"⚠️「{word_text}」已在你的單字庫中！\n\n"
                    f"📖 {existing_word.meaning or '（尚無解釋）'}"
                )
                continue

            # 呼叫 AI 產生單字卡
            ai_data = generate_word_card(word_text)
            word = Word(
                user_id=user.id,
                word=word_text,
                meaning=ai_data.get("meaning"),
                part_of_speech=ai_data.get("part_of_speech"),
                example_sentence=ai_data.get("example_sentence"),
                synonyms=ai_data.get("synonyms"),
                antonyms=ai_data.get("antonyms"),
                source=WordSource.line,
            )
            db.add(word)
            db.commit()
            db.refresh(word)
            create_review_schedule(db, user.id, word.id)

            msg = f"✅ 已加入「{word_text}」！\n\n"
            if ai_data.get("meaning"):
                msg += f"📖 {ai_data['meaning']}\n"
            if ai_data.get("part_of_speech"):
                msg += f"詞性：{ai_data['part_of_speech']}\n"
            if ai_data.get("example_sentence"):
                msg += f"\n💬 {ai_data['example_sentence']}"
            await reply_to_line(reply_token, msg)

    finally:
        db.close()

    return {"status": "ok"}
