from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.review import ReviewSchedule, REVIEW_INTERVALS
from app.models.word import Word


def create_review_schedule(db: Session, user_id: int, word_id: int):
    """Create initial review schedule for a new word."""
    next_date = datetime.utcnow() + timedelta(days=REVIEW_INTERVALS[0])
    schedule = ReviewSchedule(
        user_id=user_id,
        word_id=word_id,
        next_review_date=next_date,
        review_level=0,
    )
    db.add(schedule)
    db.commit()
    return schedule


def update_review_after_answer(db: Session, schedule: ReviewSchedule, is_correct: bool):
    """Update review schedule based on answer correctness."""
    word = db.query(Word).filter(Word.id == schedule.word_id).first()

    if is_correct:
        new_level = min(schedule.review_level + 1, len(REVIEW_INTERVALS) - 1)
        if word:
            word.review_level = new_level
    else:
        new_level = max(schedule.review_level - 1, 0)
        if word:
            word.wrong_count += 1
            word.review_level = new_level

    schedule.review_level = new_level
    schedule.reviewed_at = datetime.utcnow()

    if new_level < len(REVIEW_INTERVALS):
        schedule.next_review_date = datetime.utcnow() + timedelta(days=REVIEW_INTERVALS[new_level])
        schedule.is_completed = False
    else:
        schedule.is_completed = True

    db.commit()
    return schedule


def get_due_reviews(db: Session, user_id: int):
    """Get all review items due today."""
    now = datetime.utcnow()
    return (
        db.query(ReviewSchedule)
        .filter(
            ReviewSchedule.user_id == user_id,
            ReviewSchedule.next_review_date <= now,
            ReviewSchedule.is_completed == False,
        )
        .all()
    )
