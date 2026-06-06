from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.review import ReviewSchedule
from app.schemas.review import ReviewScheduleResponse
from app.utils.auth import get_current_user
from app.services.review_service import get_due_reviews, update_review_after_answer

router = APIRouter(prefix="/review", tags=["review"])


@router.get("/due", response_model=list[ReviewScheduleResponse])
def get_due_review_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = get_due_reviews(db, current_user.id)
    return items


@router.post("/{schedule_id}/answer")
def submit_review_answer(
    schedule_id: int,
    is_correct: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    schedule = db.query(ReviewSchedule).filter(
        ReviewSchedule.id == schedule_id,
        ReviewSchedule.user_id == current_user.id,
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Review schedule not found")

    updated = update_review_after_answer(db, schedule, is_correct)
    return {
        "message": "Review updated",
        "new_level": updated.review_level,
        "next_review_date": updated.next_review_date,
    }
