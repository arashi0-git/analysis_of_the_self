import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import models


def get_or_create_default_user(db: Session):
    # For MVP, we assume a single user.
    # Check if any user exists
    user = db.query(models.User).first()
    if user:
        return user

    # Create a default user
    try:
        default_user = models.User(email="user@example.com", name="Default User")
        db.add(default_user)
        db.commit()
        db.refresh(default_user)
        return default_user
    except IntegrityError:
        db.rollback()
        # Another request created the user, fetch it
        user = db.query(models.User).first()
        if user:
            return user
        raise


def create_rag_embedding(
    db: Session,
    user_id: uuid.UUID,
    content: str,
    embedding: list[float],
    source_type: str = "memo",
    question_id: uuid.UUID | None = None,
    weight: float = 1.0,
):
    if len(embedding) != 1536:
        raise ValueError(
            f"Embedding dimension mismatch: expected 1536, got {len(embedding)}"
        )
    db_item = models.RagEmbedding(
        user_id=user_id,
        content=content,
        embedding=embedding,
        source_type=source_type,
        question_id=question_id,
        weight=weight,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def get_questions(db: Session):
    return db.query(models.Question).order_by(models.Question.display_order).all()


def create_user_answer(
    db: Session,
    user_id: uuid.UUID,
    question_id: uuid.UUID,
    answer_text: str,
    embedding_id: uuid.UUID | None = None,
):
    # Check if answer already exists for this user and question
    existing_answer = (
        db.query(models.UserAnswer)
        .filter(
            models.UserAnswer.user_id == user_id,
            models.UserAnswer.question_id == question_id,
        )
        .first()
    )

    if existing_answer:
        existing_answer.answer_text = answer_text
        existing_answer.embedding_id = embedding_id
        db.commit()
        db.refresh(existing_answer)
        return existing_answer

    db_answer = models.UserAnswer(
        user_id=user_id,
        question_id=question_id,
        answer_text=answer_text,
        embedding_id=embedding_id,
    )
    db.add(db_answer)
    db.commit()
    db.refresh(db_answer)
    return db_answer


def get_user_answers(db: Session, user_id: uuid.UUID):
    from sqlalchemy.orm import joinedload

    return (
        db.query(models.UserAnswer)
        .options(joinedload(models.UserAnswer.question))
        .filter(models.UserAnswer.user_id == user_id)
        .all()
    )


def create_analysis_result(
    db: Session, user_id: uuid.UUID, analysis_type: str, result_data: dict
):
    db_result = models.AnalysisResult(
        user_id=user_id, analysis_type=analysis_type, result_data=result_data
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result


def get_analysis_result(db: Session, user_id: uuid.UUID, analysis_type: str):
    return (
        db.query(models.AnalysisResult)
        .filter(
            models.AnalysisResult.user_id == user_id,
            models.AnalysisResult.analysis_type == analysis_type,
        )
        .order_by(models.AnalysisResult.created_at.desc())
        .first()
    )
