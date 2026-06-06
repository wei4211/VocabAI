from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, words, quiz, review, dashboard, ocr, extensions, line_bot

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VocabAI API",
    description="AI-powered English vocabulary learning platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(words.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(review.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(ocr.router, prefix="/api")
app.include_router(extensions.router, prefix="/api")
app.include_router(line_bot.router)


@app.get("/")
def root():
    return {"message": "VocabAI API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
