from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.models.user import User
from app.utils.auth import get_current_user
from app.services.ai_service import ocr_extract_words_from_image
import base64

router = APIRouter(prefix="/ocr", tags=["ocr"])


@router.post("/extract")
async def extract_text_from_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    result = ocr_extract_words_from_image(contents, file.content_type)

    if result is None:
        raise HTTPException(status_code=500, detail="請設定 GEMINI_API_KEY")

    return result
