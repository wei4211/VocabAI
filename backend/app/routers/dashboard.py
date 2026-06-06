from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User
from app.models.word import Word
from app.models.quiz import Quiz
from app.models.review import ReviewSchedule
from app.schemas.dashboard import DashboardStats
from app.utils.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)

    total_words = db.query(Word).filter(Word.user_id == current_user.id).count()
    today_added = db.query(Word).filter(
        Word.user_id == current_user.id,
        Word.created_at >= today_start
    ).count()
    today_review = db.query(ReviewSchedule).filter(
        ReviewSchedule.user_id == current_user.id,
        ReviewSchedule.next_review_date <= now,
        ReviewSchedule.is_completed == False,
    ).count()
    week_added = db.query(Word).filter(
        Word.user_id == current_user.id,
        Word.created_at >= week_start,
    ).count()

    # Accuracy rate from completed quizzes
    quizzes = db.query(Quiz).filter(
        Quiz.user_id == current_user.id,
        Quiz.completed_at != None,
    ).all()
    if quizzes:
        total_q = sum(q.total_questions for q in quizzes)
        total_correct = sum(q.correct_count for q in quizzes)
        accuracy = (total_correct / total_q * 100) if total_q > 0 else 0
    else:
        accuracy = 0

    return DashboardStats(
        total_words=total_words,
        today_added=today_added,
        today_review=today_review,
        week_added=week_added,
        accuracy_rate=round(accuracy, 1),
        streak_days=current_user.streak_days,
    )
