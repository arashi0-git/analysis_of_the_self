from uuid import UUID

from app import crud, models, schemas
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.services.analysis import run_analysis_background
from app.services.embedding import get_embedding
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/questions", response_model=schemas.QuestionList)
def read_questions(db: Session = Depends(get_db)):  # noqa: B008
    questions = crud.get_questions(db)
    return {"questions": questions}


@router.get("/answers", response_model=schemas.UserAnswersResponse)
def get_user_answers(
    current_user: models.User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
):
    answers = crud.get_user_answers(db, current_user.id)
    return {"answers": answers}


@router.post("/answers/submit")
def submit_answers(
    submit_data: schemas.UserAnswerSubmit,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
):
    user_id = current_user.id

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


@router.put("/answers/{question_id}")
def update_answer(
    question_id: UUID,
    answer_data: schemas.SingleAnswerUpdate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
):
    user_id = current_user.id

    # Check if answer exists
    existing_answer = crud.get_user_answer_by_question(db, user_id, question_id)
    if not existing_answer:
        raise HTTPException(
            status_code=404, detail="Answer not found for this question"
        )

    # Generate new embedding
    embedding_vector = get_embedding(answer_data.answer_text)

    # Fetch question to get weight
    question = db.get(models.Question, question_id)
    if question is None:
        raise HTTPException(status_code=404, detail=f"Question {question_id} not found")
    weight = question.weight

    # Update or create RagEmbedding
    if existing_answer.embedding_id:
        # Update existing embedding
        rag_embedding = db.get(models.RagEmbedding, existing_answer.embedding_id)
        if rag_embedding:
            rag_embedding.content = answer_data.answer_text
            rag_embedding.embedding = embedding_vector
            rag_embedding.weight = weight
            db.commit()
            db.refresh(rag_embedding)
        else:
            # Create new embedding if old one doesn't exist
            rag_embedding = crud.create_rag_embedding(
                db=db,
                user_id=user_id,
                content=answer_data.answer_text,
                embedding=embedding_vector,
                source_type="episode",
                question_id=question_id,
                weight=weight,
            )
    else:
        # Create new embedding
        rag_embedding = crud.create_rag_embedding(
            db=db,
            user_id=user_id,
            content=answer_data.answer_text,
            embedding=embedding_vector,
            source_type="episode",
            question_id=question_id,
            weight=weight,
        )

    # Update UserAnswer
    crud.update_user_answer(
        db=db,
        user_id=user_id,
        question_id=question_id,
        answer_text=answer_data.answer_text,
        embedding_id=rag_embedding.id,
    )

    # Trigger analysis in background
    background_tasks.add_task(run_analysis_background, user_id)

    return {"status": "success", "message": "Answer updated successfully"}


@router.get("/analysis", response_model=schemas.AnalysisResponse)
def get_analysis(
    current_user: models.User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
):
    # Fetch analysis result
    analysis_result = crud.get_analysis_result(db, current_user.id, "self_analysis")
    if not analysis_result:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return analysis_result.result_data


@router.post(
    "/answers/{question_id}/feedback", response_model=schemas.AnswerFeedbackResponse
)
def get_answer_feedback(
    question_id: UUID,
    request: schemas.AnswerFeedbackRequest,
    _: models.User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
):
    """
    回答に対するAIフィードバックを生成
    """
    import openai

    # Fetch question
    question = db.get(models.Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Create prompt for feedback
    prompt = (
        f"あなたは自己分析の専門家です。以下の質問に対するユーザーの回答を評価し、\n"
        f"より具体的で詳細な回答にするためのアドバイスを提供してください。\n\n"
        f"質問: {question.question_text}\n"
        f"回答: {request.answer_text}\n\n"
        f"以下の観点でフィードバックを提供してください:\n"
        f"1. 具体性: 抽象的な表現を具体例に置き換える提案\n"
        f"2. 深掘り: より詳細な情報を引き出す質問\n"
        f"3. 強みの明確化: 回答から読み取れる強みと、さらに強調できる点\n\n"
        f"フィードバックは建設的で、ユーザーが改善しやすい形で提供してください。\n"
        f"日本語で回答してください。"
    )
    try:
        # Call OpenAI API
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
    except Exception as e:
        # Log full error for debugging (in production, use proper logging)
        import logging

        logging.error(f"Failed to generate feedback: {e!s}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate feedback",
        ) from e

    feedback_text = response.choices[0].message.content

    # Extract suggestions (simple split by newline for now)
    suggestions = [
        line.strip("- ").strip()
        for line in feedback_text.split("\n")
        if line.strip().startswith("-") or line.strip().startswith("•")
    ]

    return {
        "feedback": feedback_text,
        "suggestions": suggestions
        if suggestions
        else ["より具体的な例を追加してください"],
    }
