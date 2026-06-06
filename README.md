# VocabAI — AI 智慧英文單字學習平台

> 用 AI 加速英文單字學習。新增單字後自動產生單字卡、安排間隔複習、每日測驗。

---

## 技術架構

| 層級 | 技術 |
|------|------|
| Frontend | Next.js 15 + TypeScript + TailwindCSS |
| Backend | FastAPI + SQLAlchemy |
| Database | PostgreSQL 16 |
| AI | OpenAI GPT-4o-mini |
| Auth | JWT (7天有效期) |
| Deployment | Docker + Docker Compose |

---

## 功能（Phase 1 MVP）

- **帳號系統**：註冊 / 登入 / 個人資料修改
- **單字管理**：新增 / 編輯 / 刪除 / 搜尋 / 篩選
- **AI 單字卡**：自動產生中文解釋、詞性、例句、同義詞、反義詞
- **每日測驗**：選擇題 / 填空題 / 中翻英，優先考錯誤率高的單字
- **每週測驗**：測驗本週新增單字
- **間隔複習**：Day 1 → 3 → 7 → 14 → 30，答對升級答錯降級
- **OCR 辨識**（Phase 2）：上傳圖片提取單字
- **LINE Bot API**（Phase 3）：預留 Webhook
- **Chrome Extension API**（Phase 4）：`POST /api/extensions/save-word`
- **Dashboard**：總覽學習數據

---

## 本地開發（推薦方式）

### 前置需求

- Docker & Docker Compose
- Python 3.11+
- Node.js 20+
- OpenAI API Key

### 步驟 1：複製環境變數

```bash
cp .env.example .env
# 編輯 .env，填入 OPENAI_API_KEY
```

### 步驟 2：啟動資料庫

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 步驟 3：啟動 Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 複製 .env
cp .env.example .env
# 編輯 .env 填入 OPENAI_API_KEY

uvicorn app.main:app --reload --port 8080
```

後端啟動後自動建立資料庫 Table。

API 文件：http://localhost:8080/docs

### 步驟 4：啟動 Frontend

```bash
cd frontend
npm install

cp .env.example .env.local
# .env.local 內容：NEXT_PUBLIC_API_URL=http://localhost:8080

npm run dev
```

前端：http://localhost:3000

---

## Docker 全套部署

```bash
cp .env.example .env
# 填入 OPENAI_API_KEY 和 SECRET_KEY

docker compose up -d --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- API Docs: http://localhost:8080/docs

停止：
```bash
docker compose down
```

---

## 專案結構

```
VocabAI/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 入口
│   │   ├── config.py            # 環境設定
│   │   ├── database.py          # DB 連線
│   │   ├── models/              # SQLAlchemy Models
│   │   │   ├── user.py
│   │   │   ├── word.py
│   │   │   ├── quiz.py
│   │   │   └── review.py
│   │   ├── schemas/             # Pydantic Schemas
│   │   ├── routers/             # API Routes
│   │   │   ├── auth.py
│   │   │   ├── words.py
│   │   │   ├── quiz.py
│   │   │   ├── review.py
│   │   │   ├── dashboard.py
│   │   │   ├── ocr.py
│   │   │   ├── extensions.py
│   │   │   └── line_bot.py
│   │   ├── services/            # 業務邏輯
│   │   │   ├── ai_service.py    # OpenAI 整合
│   │   │   └── review_service.py
│   │   └── utils/
│   │       └── auth.py          # JWT 工具
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── auth/login/
│   │   │   ├── auth/register/
│   │   │   ├── dashboard/
│   │   │   ├── words/
│   │   │   ├── quiz/
│   │   │   ├── review/
│   │   │   ├── ocr/
│   │   │   └── profile/
│   │   ├── components/
│   │   │   └── layout/          # Sidebar, AppLayout
│   │   ├── hooks/
│   │   │   └── useAuth.ts       # Zustand auth store
│   │   ├── lib/
│   │   │   ├── api.ts           # axios API 客戶端
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml       # 僅啟動 DB
├── .env.example
└── README.md
```

---

## API 端點總覽

### Auth
| Method | Endpoint | 說明 |
|--------|----------|------|
| POST | /api/auth/register | 註冊 |
| POST | /api/auth/login | 登入 |
| GET | /api/auth/me | 取得個人資料 |
| PUT | /api/auth/me | 更新個人資料 |

### Words
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | /api/words | 取得單字列表（支援搜尋、篩選） |
| POST | /api/words | 新增單字（背景 AI 產生） |
| GET | /api/words/{id} | 取得單字 |
| PUT | /api/words/{id} | 編輯單字 |
| DELETE | /api/words/{id} | 刪除單字 |
| POST | /api/words/{id}/regenerate-ai | 重新用 AI 產生單字卡 |

### Quiz
| Method | Endpoint | 說明 |
|--------|----------|------|
| POST | /api/quiz/generate | 產生測驗 |
| POST | /api/quiz/{id}/submit | 提交答案 |
| GET | /api/quiz/history | 測驗歷史 |

### Review
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | /api/review/due | 今日待複習 |
| POST | /api/review/{id}/answer | 提交複習結果 |

### Dashboard
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | /api/dashboard/stats | 取得統計數據 |

### Extensions（Phase 4）
| Method | Endpoint | 說明 |
|--------|----------|------|
| POST | /api/extensions/save-word | Chrome Extension 新增單字 |

### LINE Bot（Phase 3）
| Method | Endpoint | 說明 |
|--------|----------|------|
| POST | /line/webhook | LINE Bot Webhook |

---

## 開發分工建議（4 人 × 4 週）

### Phase 1（Week 1-2）MVP
| 成員 | 負責 |
|------|------|
| 成員 A | FastAPI Backend：Auth + Words + AI Service |
| 成員 B | FastAPI Backend：Quiz + Review + Dashboard |
| 成員 C | Frontend：登入/註冊 + Dashboard + 單字庫 |
| 成員 D | Frontend：測驗 + 複習 + OCR 頁面 |

### Phase 2（Week 3）OCR
- 成員 A：Backend OCR endpoint + Tesseract
- 成員 C：Frontend OCR 頁面

### Phase 3（Week 4）LINE Bot
- 成員 B：LINE Bot Webhook 實作
- 成員 D：測試 + Bug Fix

---

## 常見問題

**Q: AI 沒有自動填充單字資料？**
A: 確認 `.env` 中 `OPENAI_API_KEY` 已正確設定。新增單字後 AI 在背景執行，可能需要幾秒後刷新頁面。

**Q: 資料庫連線失敗？**
A: 確認 Docker 中的 PostgreSQL 正在執行：`docker compose -f docker-compose.dev.yml ps`

**Q: OCR 辨識失敗？**
A: 確認已安裝 `tesseract-ocr`。Docker 版本已包含。本地開發需手動安裝：`brew install tesseract`（macOS）

**Q: 如何重置資料庫？**
A: `docker compose down -v` 會刪除 volume，再 `docker compose up -d` 重新建立。
