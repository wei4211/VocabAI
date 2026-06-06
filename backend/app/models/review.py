from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

REVIEW_INTERVALS = [1, 3, 7, 14, 30]  # days


class ReviewSchedule(Base):
    __tablename__ = "review_schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    word_id = Column(Integer, ForeignKey("words.id"), nullable=False)
    next_review_date = Column(DateTime(timezone=True), nullable=False)
    review_level = Column(Integer, default=0)  # 0-4 maps to REVIEW_INTERVALS
    is_completed = Column(Boolean, default=False)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="review_schedules")
    word = relationship("Word", back_populates="review_schedules")
