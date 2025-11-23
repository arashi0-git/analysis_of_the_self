from uuid import UUID

from app import crud, schemas
from app.prompts.analysis_prompts import (
    ANALYSIS_SYSTEM_PROMPT,
    ANALYSIS_USER_PROMPT_TEMPLATE,
)
from app.services.llm import generate_structured_response
from sqlalchemy.orm import Session


def analyze_user_answers(user_id: UUID, db: Session) -> schemas.AnalysisResult:
    """
    Analyze user answers and save the result.
    """
    # 1. Fetch user answers
    answers = crud.get_user_answers(db, user_id)
    if not answers:
        # No answers to analyze
        return None

    # 2. Format Q&A text
    q_and_a_list = []
    for answer in answers:
        # Accessing answer.question.question_text (lazy loading)
        if answer.question:
            question_text = answer.question.question_text
        else:
            question_text = "Unknown Question"
        q_and_a_list.append(f"Q: {question_text}\nA: {answer.answer_text}")

    q_and_a_text = "\n\n".join(q_and_a_list)

    # 3. Construct prompt
    prompt = ANALYSIS_USER_PROMPT_TEMPLATE.format(q_and_a_text=q_and_a_text)

    # 4. Call LLM
    analysis_content = generate_structured_response(
        prompt=prompt,
        response_model=schemas.AnalysisResultContent,
        system_instruction=ANALYSIS_SYSTEM_PROMPT,
    )

    # 5. Save result
    # Convert Pydantic model to dict for JSON storage
    result_data = analysis_content.model_dump()

    db_result = crud.create_analysis_result(
        db=db, user_id=user_id, analysis_type="self_analysis", result_data=result_data
    )

    return db_result


def run_analysis_background(user_id: UUID):
    """
    Wrapper to run analysis in background with a new DB session.
    """
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        analyze_user_answers(user_id, db)
    finally:
        db.close()
