from unittest.mock import patch
from uuid import uuid4

from app import models


def test_read_questions(client, db_session):
    # Insert a question
    question = models.Question(
        category="test", question_text="Test Question?", display_order=1, weight=1.0
    )
    db_session.add(question)
    db_session.commit()

    response = client.get("/questions")
    assert response.status_code == 200
    data = response.json()
    assert len(data["questions"]) == 1
    assert data["questions"][0]["question_text"] == "Test Question?"


def test_submit_answers(client, db_session):
    # Insert a question
    question = models.Question(
        category="test", question_text="Test Question?", display_order=1, weight=1.0
    )
    db_session.add(question)
    db_session.commit()
    question_id = str(question.id)

    payload = {
        "answers": [{"question_id": question_id, "answer_text": "This is an answer."}]
    }

    with patch("app.routers.questionnaire.get_embedding") as mock_embedding:
        mock_embedding.return_value = [0.1] * 1536

        response = client.post("/answers/submit", json=payload)
        assert response.status_code == 200
        assert response.json()["status"] == "success"

        # Verify DB
        answer = db_session.query(models.UserAnswer).first()
        assert answer is not None
        assert answer.answer_text == "This is an answer."
        assert answer.embedding_id is not None

        embedding = db_session.query(models.RagEmbedding).first()
        assert embedding is not None
        assert embedding.source_type == "episode"
        assert str(embedding.question_id) == question_id


def test_get_analysis(client, db_session):
    user_id = str(uuid4())
    response = client.get(f"/analysis/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert "keywords" in data
    assert "strengths" in data
