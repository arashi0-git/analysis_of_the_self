from unittest.mock import MagicMock, patch

from app import models


def test_create_memo_success(client, db_session):
    """
    Test successful memo creation.
    Mocks OpenAI API to avoid real calls and costs.
    """
    # Mock OpenAI client
    mock_embedding = [0.1] * 1536

    # We need to patch the 'client' object in app.main, NOT openai.embeddings
    # Because we switched to instantiating a client: client = openai.OpenAI(...)
    with patch("app.main.client.embeddings.create") as mock_create:
        # Setup mock response
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=mock_embedding)]
        mock_create.return_value = mock_response

        response = client.post("/memos", json={"text": "This is a test memo."})

        assert response.status_code == 200
        assert response.json() == {
            "status": "success",
            "message": "Memo saved successfully",
        }

        # Verify DB content
        # 1. User should exist
        user = (
            db_session.query(models.User)
            .filter(models.User.email == "user@example.com")
            .first()
        )
        assert user is not None

        # 2. Embedding should exist
        embedding = (
            db_session.query(models.RagEmbedding)
            .filter(models.RagEmbedding.content == "This is a test memo.")
            .first()
        )
        assert embedding is not None
        assert embedding.user_id == user.id
        assert embedding.source_type == "memo"
        # pgvector returns numpy array or list, check length/values roughly
        # Note: exact float comparison might be tricky, checking existence is
        # good for now


def test_create_memo_openai_error(client):
    """
    Test handling of OpenAI API errors.
    """
    import openai

    with patch("app.main.client.embeddings.create") as mock_create:
        # Simulate OpenAI API error (e.g. 401 Unauthorized)
        # APIStatusError requires message, response, body
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_create.side_effect = openai.APIStatusError(
            message="Unauthorized", response=mock_response, body=None
        )

        response = client.post("/memos", json={"text": "This will fail."})

        assert response.status_code == 401
        assert "Unauthorized" in response.json()["detail"]
