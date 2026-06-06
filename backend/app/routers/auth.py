from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, UserUpdate
from app.utils.auth import verify_password, get_password_hash, create_access_token, get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, token_type="bearer", user=user)


def _update_streak(user: User, db: Session):
    today = date.today()
    last_active = user.last_active_date.date() if user.last_active_date else None

    if last_active == today:
        return  # 今天已經算過了
    elif last_active == today - timedelta(days=1):
        user.streak_days += 1  # 昨天有登入，連續+1
    else:
        user.streak_days = 1  # 中斷，重新計算

    user.last_active_date = datetime.utcnow()
    db.commit()


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    _update_streak(user, db)
    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, token_type="bearer", user=user)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_data.username:
        existing = db.query(User).filter(User.username == user_data.username, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = user_data.username
    if user_data.email:
        existing = db.query(User).filter(User.email == user_data.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_data.email
    if user_data.password:
        current_user.hashed_password = get_password_hash(user_data.password)

    db.commit()
    db.refresh(current_user)
    return current_user
