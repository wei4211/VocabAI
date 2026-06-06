from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.quiz import QuizType, QuestionType


class QuizCreate(BaseModel):
    quiz_type: QuizType = QuizType.daily


class QuestionResponse(BaseModel):
    id: int
    question_type: QuestionType
    question_text: str
    correct_answer: str
    options: Optional[str]  # JSON string

    class Config:
        from_attributes = True


class QuizResponse(BaseModel):
    id: int
    quiz_type: QuizType
    total_questions: int
    created_at: datetime
    questions: list[QuestionResponse]

    class Config:
        from_attributes = True


class AnswerSubmit(BaseModel):
    question_id: int
    user_answer: str


class QuizSubmit(BaseModel):
    answers: list[AnswerSubmit]
    duration_seconds: int


class QuizResult(BaseModel):
    quiz_id: int
    score: float
    correct_count: int
    total_questions: int
    duration_seconds: int
    wrong_words: list[str]
