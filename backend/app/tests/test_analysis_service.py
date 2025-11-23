import uuid
from unittest.mock import patch

from app import models, schemas
from app.services.analysis import analyze_user_answers


def test_analyze_user_answers_no_answers(db_session):
    user_id = uuid.uuid4()
    result = analyze_user_answers(user_id, db_session)
    assert result is None


@patch("app.services.analysis.generate_structured_response")
def test_analyze_user_answers_success(mock_generate, db_session):
    # Setup user
    user = models.User(email="test@example.com", name="Test User")
    db_session.add(user)
    db_session.commit()
    user_id = user.id

    # Setup question
    question = models.Question(
        category="test", question_text="What is your strength?", display_order=1
    )
    db_session.add(question)
    db_session.commit()

    # Setup answer
    answer = models.UserAnswer(
        user_id=user_id, question_id=question.id, answer_text="I am good at coding."
    )
    db_session.add(answer)
    db_session.commit()

    # Mock LLM response
    mock_content = schemas.AnalysisResultContent(
        keywords=["coding", "tech"],
        strengths=[
            schemas.StrengthItem(
                strength="Coding", evidence="I am good at coding.", confidence=0.9
            )
        ],
        values=["Growth"],
        summary="User is a coder.",
    )
    mock_generate.return_value = mock_content

    # Run analysis
    result = analyze_user_answers(user_id, db_session)

    # Verify
    assert result is not None
    assert result.user_id == user_id
    assert result.analysis_type == "self_analysis"
    assert result.result_data["keywords"] == ["coding", "tech"]
    assert result.result_data["summary"] == "User is a coder."

    # Verify DB persistence
    db_result = (
        db_session.query(models.AnalysisResult)
        .filter_by(user_id=user_id, analysis_type="self_analysis")
        .first()
    )
    assert db_result is not None
    assert db_result.result_data["keywords"] == ["coding", "tech"]
