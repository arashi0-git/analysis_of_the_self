import uuid

from sqlalchemy.orm import Session

from . import models, schemas
from .core import security


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserRegister):
    hashed_password = security.hash_password(user.password)
    db_user = models.User(
        email=user.email, name=user.name, hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


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


def get_user_answer_by_question(
    db: Session, user_id: uuid.UUID, question_id: uuid.UUID
):
    return (
        db.query(models.UserAnswer)
        .filter(
            models.UserAnswer.user_id == user_id,
            models.UserAnswer.question_id == question_id,
        )
        .first()
    )


def update_user_answer(
    db: Session,
    user_id: uuid.UUID,
    question_id: uuid.UUID,
    answer_text: str,
    embedding_id: uuid.UUID | None = None,
):
    answer = get_user_answer_by_question(db, user_id, question_id)
    if not answer:
        return None

    answer.answer_text = answer_text
    if embedding_id is not None:
        answer.embedding_id = embedding_id

    db.commit()
    db.refresh(answer)
    return answer


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
