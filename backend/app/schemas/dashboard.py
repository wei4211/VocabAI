from pydantic import BaseModel
from typing import Optional


class DashboardStats(BaseModel):
    total_words: int
    today_added: int
    today_review: int
    week_added: int
    accuracy_rate: float
    streak_days: int
