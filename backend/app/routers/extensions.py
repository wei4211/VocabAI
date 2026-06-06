from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.word import Word, WordSource
from app.utils.auth import get_current_user
from app.services.ai_service import generate_word_card
from app.services.review_service import create_review_schedule

router = APIRouter(prefix="/extensions", tags=["extensions"])


class SaveWordRequest(BaseModel):
    word: str
    context: str = ""


@router.post("/save-word")
def save_word_from_extension(
    request: SaveWordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    word_lower = request.word.lower().strip()
    existing = db.query(Word).filter(Word.user_id == current_user.id, Word.word == word_lower).first()
    if existing:
        return {"message": "Word already exists", "word_id": existing.id}

    ai_data = generate_word_card(word_lower)
    word = Word(
        user_id=current_user.id,
        word=word_lower,
        meaning=ai_data.get("meaning"),
        part_of_speech=ai_data.get("part_of_speech"),
        example_sentence=ai_data.get("example_sentence") or request.context,
        synonyms=ai_data.get("synonyms"),
        antonyms=ai_data.get("antonyms"),
        source=WordSource.extension,
    )
    db.add(word)
    db.commit()
    db.refresh(word)
    create_review_schedule(db, current_user.id, word.id)

    return {"message": "Word saved", "word_id": word.id}
