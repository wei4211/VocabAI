from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.word import Word, WordSource
from app.schemas.word import WordCreate, WordUpdate, WordResponse, WordListResponse
from app.utils.auth import get_current_user
from app.services.ai_service import generate_word_card
from app.services.review_service import create_review_schedule

router = APIRouter(prefix="/words", tags=["words"])


def _enrich_word_with_ai(db: Session, word_id: int, user_meaning: str | None = None):
    """Background task to enrich word with AI data."""
    word = db.query(Word).filter(Word.id == word_id).first()
    if not word:
        return
    ai_data = generate_word_card(word.word, user_meaning=user_meaning)
    if not word.meaning and ai_data.get("meaning"):
        word.meaning = ai_data["meaning"]
    if not word.part_of_speech and ai_data.get("part_of_speech"):
        word.part_of_speech = ai_data["part_of_speech"]
    if not word.example_sentence and ai_data.get("example_sentence"):
        word.example_sentence = ai_data["example_sentence"]
    if not word.synonyms and ai_data.get("synonyms"):
        word.synonyms = ai_data["synonyms"]
    if not word.antonyms and ai_data.get("antonyms"):
        word.antonyms = ai_data["antonyms"]
    db.commit()


@router.post("/", response_model=WordResponse)
def create_word(
    word_data: WordCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(Word).filter(Word.user_id == current_user.id, Word.word == word_data.word.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Word already exists in your vocabulary")

    word = Word(
        user_id=current_user.id,
        word=word_data.word.lower().strip(),
        meaning=word_data.meaning,
        part_of_speech=word_data.part_of_speech,
        example_sentence=word_data.example_sentence,
        synonyms=word_data.synonyms,
        antonyms=word_data.antonyms,
        source=word_data.source,
    )
    db.add(word)
    db.commit()
    db.refresh(word)

    create_review_schedule(db, current_user.id, word.id)

    # Always enrich missing fields with AI, passing user_meaning so AI generates matching content
    background_tasks.add_task(_enrich_word_with_ai, db, word.id, word_data.meaning or None)

    return word


@router.get("/", response_model=WordListResponse)
def list_words(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    source: Optional[WordSource] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Word).filter(Word.user_id == current_user.id)
    if search:
        query = query.filter(Word.word.ilike(f"%{search}%"))
    if source:
        query = query.filter(Word.source == source)

    total = query.count()
    words = query.order_by(Word.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return WordListResponse(items=words, total=total, page=page, page_size=page_size)


@router.get("/{word_id}", response_model=WordResponse)
def get_word(
    word_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    word = db.query(Word).filter(Word.id == word_id, Word.user_id == current_user.id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    return word


@router.put("/{word_id}", response_model=WordResponse)
def update_word(
    word_id: int,
    word_data: WordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    word = db.query(Word).filter(Word.id == word_id, Word.user_id == current_user.id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    for field, value in word_data.model_dump(exclude_none=True).items():
        setattr(word, field, value)

    db.commit()
    db.refresh(word)
    return word


@router.delete("/{word_id}")
def delete_word(
    word_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    word = db.query(Word).filter(Word.id == word_id, Word.user_id == current_user.id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    db.delete(word)
    db.commit()
    return {"message": "Word deleted successfully"}


@router.post("/{word_id}/regenerate-ai", response_model=WordResponse)
def regenerate_ai_card(
    word_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    word = db.query(Word).filter(Word.id == word_id, Word.user_id == current_user.id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    ai_data = generate_word_card(word.word)
    word.meaning = ai_data.get("meaning", word.meaning)
    word.part_of_speech = ai_data.get("part_of_speech", word.part_of_speech)
    word.example_sentence = ai_data.get("example_sentence", word.example_sentence)
    word.synonyms = ai_data.get("synonyms", word.synonyms)
    word.antonyms = ai_data.get("antonyms", word.antonyms)
    db.commit()
    db.refresh(word)
    return word
