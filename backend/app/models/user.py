from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    streak_days = Column(Integer, default=0)
    last_active_date = Column(DateTime(timezone=True), nullable=True)
    line_user_id = Column(String, unique=True, nullable=True, index=True)
    line_bind_code = Column(String, nullable=True)
    line_bind_expires = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    words = relationship("Word", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    review_schedules = relationship("ReviewSchedule", back_populates="user", cascade="all, delete-orphan")
