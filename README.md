# VocabAI — AI 智慧英文單字學習平台

> 用 AI 加速英文單字學習。新增單字後自動產生單字卡、安排間隔複習、每日測驗。

---

## 畫面預覽

| 登入頁面 | Dashboard |
|---------|-----------|
| ![登入](docs/註冊登入畫面.png) | ![Dashboard](docs/網站主頁.png) |

| 單字庫 | LINE Bot |
|--------|---------|
| ![單字庫](docs/單字庫.png) | ![LINE](docs/line展示圖.jpg) |

---

## 線上網址

- **網站**：https://vocabai-frontend.onrender.com
- **API 文件**（開發用）：https://vocabai-backend.onrender.com/docs

> ⚠️ 使用 Render 免費方案，閒置一段時間後服務會休眠，第一次開啟需等約 30 秒。

---

## 技術架構

| 層級 | 技術 |
|------|------|
| Frontend | Next.js 15 + TypeScript + TailwindCSS |
| Backend | FastAPI + SQLAlchemy |
| Database | PostgreSQL 16 |
| AI | Google Gemini 2.5 Flash |
| Auth | JWT（7 天有效期） |
| Deployment | Render |

---

## 功能總覽

### Phase 1 — MVP
- **帳號系統**：註冊 / 登入 / 個人資料修改
- **單字管理**：新增 / 編輯 / 刪除 / 搜尋 / 篩選 / 批次新增
- **AI 單字卡**：自動產生中文解釋、詞性、例句、同義詞、反義詞（使用者自填的欄位不會被覆蓋）
- **單字發音**：Web Speech API 播放英文發音
- **單字詳細頁**：完整資訊 + 例句發音
- **每日測驗**：選擇題 / 填空題 / 中翻英，結果顯示每題正確答案
- **每週測驗**：測驗本週新增單字
- **間隔複習**：Day 1 → 3 → 7 → 14 → 30，答對升級答錯降級
- **Dashboard**：總覽學習數據 + 連續學習天數
- **深色模式**：Sidebar 切換按鈕，設定記憶於 localStorage

### Phase 2 — OCR
- 上傳圖片（講義、考卷、書籍），Gemini 視覺辨識
- 自動提取難字並建議加入單字庫

### Phase 3 — LINE Bot
- 綁定流程：網站產生綁定碼 → LINE 傳送 `BIND XXXXXX`
- 傳英文單字 → AI 即時回覆解釋 + 存入單字庫
- 指令：`幫助`、`單字數`

### Phase 4 — Chrome Extension
- 選取網頁英文文字 → 右鍵「加入 VocabAI」
- Popup 手動新增單字
- 需先在 Popup 登入帳號

---

## 本地開發

### 前置需求
- Docker（跑 PostgreSQL）
- Python 3.11+
- Node.js 20+
- Google Gemini API Key

### 步驟

**1. 啟動資料庫**
```bash
docker compose -f docker-compose.dev.yml up -d
```

**2. 啟動 Backend**
```bash
cd backend
python3 -m venv venv5
source venv5/bin/activate
pip install -r requirements.txt
cp .env.example .env
# 編輯 .env，填入 GEMINI_API_KEY
venv5/bin/uvicorn app.main:app --reload --port 8080
```

**3. 啟動 Frontend**
```bash
cd frontend
npm install --legacy-peer-deps
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
npm run dev
```

- Frontend：http://localhost:3000
- API 文件：http://localhost:8080/docs

---

## Chrome Extension 安裝

1. 打開 `chrome://extensions`
2. 開啟右上角「開發人員模式」
3. 點「載入未封裝項目」
4. 選擇 `extension/` 資料夾
5. 點擊工具列的 VocabAI icon 登入帳號

---

## LINE Bot 設定

1. 去 [LINE Developers](https://developers.line.biz) 建立 Messaging API Channel
2. 取得 `Channel Secret` 和 `Channel Access Token`
3. Webhook URL 設為：`https://vocabai-backend.onrender.com/api/line/webhook`
4. 開啟 **Use webhook**
5. 將兩個 Token 設定到 Render 的環境變數

---

## 環境變數

### Backend `.env`
```
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-key
LINE_CHANNEL_SECRET=（選填）
LINE_CHANNEL_ACCESS_TOKEN=（選填）
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 專案結構

```
VocabAI/
├── backend/
│   └── app/
│       ├── models/        # User, Word, Quiz, ReviewSchedule
│       ├── schemas/       # Pydantic 驗證
│       ├── routers/       # auth, words, quiz, review, dashboard, ocr, extensions, line_bot
│       ├── services/      # ai_service (Gemini), review_service
│       └── utils/         # JWT auth
├── frontend/
│   └── src/
│       ├── app/           # 登入, 單字庫, 測驗, 複習, OCR, 個人資料
│       ├── components/    # Sidebar, AppLayout
│       ├── hooks/         # useAuth (Zustand)
│       └── lib/           # axios API 客戶端
├── extension/             # Chrome Extension
├── docker-compose.yml
├── docker-compose.dev.yml
└── .env.example
```

---

## AI 邏輯說明

- 新增單字時，使用者**自填的欄位不會被 AI 覆蓋**，只補空白欄位
- AI 在背景執行，新增後幾秒刷新頁面即可看到結果
- 可點刷新圖示手動重新產生 AI 單字卡

---

## 常見問題

**Q: 新增單字後沒有 AI 解釋？**
A: AI 在背景執行，等幾秒後刷新頁面。若仍無效，確認 `GEMINI_API_KEY` 是否設定正確。

**Q: LINE Bot 沒有回應？**
A: 確認 LINE Developers 有開啟 **Use webhook**，且 Webhook URL 正確。

**Q: Render 服務很慢？**
A: 免費方案閒置後會休眠，第一個 request 需等 30 秒喚醒。

**Q: 如何重置資料庫（本地）？**
A: `docker compose down -v` 刪除 volume，再重新啟動即可。
