from app import models, schemas
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.services.answer_generation import generate_answer
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/answer", response_model=schemas.GeneratedAnswer)
def generate_chat_answer(
    request: schemas.AnswerRequest,
    current_user: models.User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
):
    return generate_answer(db, request.query_text, current_user.id)
