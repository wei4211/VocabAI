from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class QuizType(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"


class QuestionType(str, enum.Enum):
    multiple_choice = "multiple_choice"
    fill_blank = "fill_blank"
    translation = "translation"


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quiz_type = Column(Enum(QuizType), nullable=False)
    score = Column(Float, nullable=True)
    total_questions = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    duration_seconds = Column(Integer, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    word_id = Column(Integer, ForeignKey("words.id"), nullable=True)
    question_type = Column(Enum(QuestionType), nullable=False)
    question_text = Column(Text, nullable=False)
    correct_answer = Column(Text, nullable=False)
    options = Column(Text, nullable=True)  # JSON string for multiple choice
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quiz = relationship("Quiz", back_populates="questions")
    answer = relationship("QuizAnswer", back_populates="question", uselist=False)


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("quiz_questions.id"), nullable=False)
    user_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, default=False)
    answered_at = Column(DateTime(timezone=True), server_default=func.now())

    question = relationship("QuizQuestion", back_populates="answer")
