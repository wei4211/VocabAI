from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
from app.database import get_db
from app.models.user import User
from app.models.word import Word
from app.models.quiz import Quiz, QuizQuestion, QuizAnswer, QuizType, QuestionType
from app.schemas.quiz import QuizCreate, QuizResponse, QuizSubmit, QuizResult, QuestionResponse
from app.utils.auth import get_current_user
from app.services.ai_service import generate_quiz_questions

router = APIRouter(prefix="/quiz", tags=["quiz"])


def _build_quiz_questions(db: Session, user_id: int, quiz_type: QuizType, quiz_id: int):
    """Fetch words and create quiz questions."""
    if quiz_type == QuizType.weekly:
        week_ago = datetime.utcnow() - timedelta(days=7)
        words = db.query(Word).filter(Word.user_id == user_id, Word.created_at >= week_ago).all()
    else:
        # Daily: prioritize wrong words and low review level
        words = (
            db.query(Word)
            .filter(Word.user_id == user_id)
            .order_by(Word.wrong_count.desc(), Word.review_level.asc())
            .limit(20)
            .all()
        )

    if len(words) < 3:
        return []

    word_dicts = [{"word": w.word, "meaning": w.meaning or "", "id": w.id} for w in words]
    ai_questions = generate_quiz_questions(word_dicts, question_count=10)

    word_map = {w.word.lower(): w.id for w in words}
    created = []

    for q in ai_questions:
        word_id = word_map.get(q.get("word", "").lower())
        question_type = q.get("question_type", "multiple_choice")

        try:
            qtype = QuestionType(question_type)
        except ValueError:
            qtype = QuestionType.multiple_choice

        options = q.get("options")
        options_json = json.dumps(options) if options else None

        qq = QuizQuestion(
            quiz_id=quiz_id,
            word_id=word_id,
            question_type=qtype,
            question_text=q.get("question_text", ""),
            correct_answer=q.get("correct_answer", ""),
            options=options_json,
        )
        db.add(qq)
        created.append(qq)

    db.commit()
    return created


@router.post("/generate", response_model=QuizResponse)
def generate_quiz(
    quiz_data: QuizCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    word_count = db.query(Word).filter(Word.user_id == current_user.id).count()
    if word_count < 3:
        raise HTTPException(status_code=400, detail="You need at least 3 words to generate a quiz")

    quiz = Quiz(user_id=current_user.id, quiz_type=quiz_data.quiz_type)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    questions = _build_quiz_questions(db, current_user.id, quiz_data.quiz_type, quiz.id)
    if not questions:
        db.delete(quiz)
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to generate quiz questions. Check OpenAI API key.")

    quiz.total_questions = len(questions)
    db.commit()
    db.refresh(quiz)

    return QuizResponse(
        id=quiz.id,
        quiz_type=quiz.quiz_type,
        total_questions=quiz.total_questions,
        created_at=quiz.created_at,
        questions=[
            QuestionResponse(
                id=q.id,
                question_type=q.question_type,
                question_text=q.question_text,
                correct_answer=q.correct_answer,
                options=q.options,
            )
            for q in questions
        ],
    )


@router.post("/{quiz_id}/submit", response_model=QuizResult)
def submit_quiz(
    quiz_id: int,
    submission: QuizSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.completed_at:
        raise HTTPException(status_code=400, detail="Quiz already submitted")

    answer_map = {a.question_id: a.user_answer for a in submission.answers}
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()

    correct_count = 0
    wrong_words = []

    for question in questions:
        user_answer = answer_map.get(question.id, "")
        is_correct = user_answer.strip().lower() == question.correct_answer.strip().lower()
        if is_correct:
            correct_count += 1
        else:
            if question.word_id:
                word = db.query(Word).filter(Word.id == question.word_id).first()
                if word:
                    wrong_words.append(word.word)
                    word.wrong_count += 1

        answer = QuizAnswer(
            question_id=question.id,
            user_answer=user_answer,
            is_correct=is_correct,
        )
        db.add(answer)

    score = (correct_count / len(questions) * 100) if questions else 0
    quiz.score = score
    quiz.correct_count = correct_count
    quiz.duration_seconds = submission.duration_seconds
    quiz.completed_at = datetime.utcnow()
    db.commit()

    return QuizResult(
        quiz_id=quiz_id,
        score=score,
        correct_count=correct_count,
        total_questions=len(questions),
        duration_seconds=submission.duration_seconds,
        wrong_words=list(set(wrong_words)),
    )


@router.get("/history")
def get_quiz_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quizzes = (
        db.query(Quiz)
        .filter(Quiz.user_id == current_user.id, Quiz.completed_at != None)
        .order_by(Quiz.completed_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": q.id,
            "quiz_type": q.quiz_type,
            "score": q.score,
            "correct_count": q.correct_count,
            "total_questions": q.total_questions,
            "completed_at": q.completed_at,
        }
        for q in quizzes
    ]
