from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://vocabai:vocabai_pass@db:5432/vocabai"
    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    GEMINI_API_KEY: str = ""

    LINE_CHANNEL_SECRET: Optional[str] = None
    LINE_CHANNEL_ACCESS_TOKEN: Optional[str] = None

    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://frontend:3000"]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
