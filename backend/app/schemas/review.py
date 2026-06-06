from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.schemas.word import WordResponse


class ReviewScheduleResponse(BaseModel):
    id: int
    word_id: int
    next_review_date: datetime
    review_level: int
    is_completed: bool
    word: Optional[WordResponse]

    class Config:
        from_attributes = True
