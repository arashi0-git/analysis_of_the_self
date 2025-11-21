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
):
    if len(embedding) != 1536:
        raise ValueError(
            f"Embedding dimension mismatch: expected 1536, got {len(embedding)}"
        )
    db_item = models.RagEmbedding(
        user_id=user_id, content=content, embedding=embedding, source_type=source_type
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
