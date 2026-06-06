from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.word import WordSource


class WordCreate(BaseModel):
    word: str
    meaning: Optional[str] = None
    part_of_speech: Optional[str] = None
    example_sentence: Optional[str] = None
    synonyms: Optional[str] = None
    antonyms: Optional[str] = None
    source: WordSource = WordSource.manual


class WordUpdate(BaseModel):
    word: Optional[str] = None
    meaning: Optional[str] = None
    part_of_speech: Optional[str] = None
    example_sentence: Optional[str] = None
    synonyms: Optional[str] = None
    antonyms: Optional[str] = None


class WordResponse(BaseModel):
    id: int
    user_id: int
    word: str
    meaning: Optional[str]
    part_of_speech: Optional[str]
    example_sentence: Optional[str]
    synonyms: Optional[str]
    antonyms: Optional[str]
    source: WordSource
    review_level: int
    wrong_count: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class WordListResponse(BaseModel):
    items: list[WordResponse]
    total: int
    page: int
    page_size: int
