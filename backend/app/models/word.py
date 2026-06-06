from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class WordSource(str, enum.Enum):
    manual = "manual"
    line = "line"
    ocr = "ocr"
    extension = "extension"


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    word = Column(String(200), nullable=False, index=True)
    meaning = Column(Text, nullable=True)
    part_of_speech = Column(String(50), nullable=True)
    example_sentence = Column(Text, nullable=True)
    synonyms = Column(Text, nullable=True)
    antonyms = Column(Text, nullable=True)
    source = Column(Enum(WordSource), default=WordSource.manual)
    review_level = Column(Integer, default=0)
    wrong_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="words")
    review_schedules = relationship("ReviewSchedule", back_populates="word", cascade="all, delete-orphan")
