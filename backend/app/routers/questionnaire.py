from uuid import UUID

from app import crud, models, schemas
from app.database import get_db
from app.services.analysis import run_analysis_background
from app.services.embedding import get_embedding
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/questions", response_model=schemas.QuestionList)
def read_questions(db: Session = Depends(get_db)):  # noqa: B008
    questions = crud.get_questions(db)
    return {"questions": questions}


@router.post("/answers/submit")
def submit_answers(
    submit_data: schemas.UserAnswerSubmit,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),  # noqa: B008
):
    # For MVP, assume single user or get from auth (hardcoded for now)
    user = crud.get_or_create_default_user(db)
    user_id = user.id

    for answer in submit_data.answers:
        # Generate embedding
        embedding_vector = get_embedding(answer.answer_text)

        # Fetch question to get weight
        # Fetch question to get weight
        question = db.get(models.Question, answer.question_id)
        if question is None:
            # Question not found - this should be an error
            raise HTTPException(
                status_code=404, detail=f"Question {answer.question_id} not found"
            )
        weight = question.weight

        # Create RagEmbedding
        rag_embedding = crud.create_rag_embedding(
            db=db,
            user_id=user_id,
            content=answer.answer_text,
            embedding=embedding_vector,
            source_type="episode",  # Using 'episode' for questionnaire answers
            question_id=answer.question_id,
            weight=weight,
        )

        # Create UserAnswer
        crud.create_user_answer(
            db=db,
            user_id=user_id,
            question_id=answer.question_id,
            answer_text=answer.answer_text,
            embedding_id=rag_embedding.id,
        )

    # Trigger analysis in background
    background_tasks.add_task(run_analysis_background, user_id)

    return {"status": "success", "message": "Answers submitted successfully"}


@router.get("/analysis/{user_id}", response_model=schemas.AnalysisResponse)
def get_analysis(user_id: UUID, db: Session = Depends(get_db)):  # noqa: B008
    # Fetch analysis result
    analysis_result = crud.get_analysis_result(db, user_id, "self_analysis")
    if not analysis_result:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return analysis_result.result_data
