from unittest.mock import patch
from uuid import uuid4

from app import schemas


def test_generate_answer_success(client):
    """
    Test successful answer generation.
    Mocks embedding, vector search, and LLM.
    """
    # Mock data
    query_text = "What are my strengths?"
    mock_embedding = [0.1] * 1536
    mock_search_result = schemas.SearchResult(
        id=uuid4(), content="I am good at Python.", source_type="memo", similarity=0.9
    )
    mock_answer = schemas.GeneratedAnswer(
        reasoning="Based on the memo...",
        answer_text="You are good at Python.",
        referenced_memo_ids=[mock_search_result.id],
    )

    # Patch services
    with (
        patch("app.services.embedding.get_embedding") as mock_get_embedding,
        patch("app.services.vector_search.search_similar_items") as mock_search,
        patch("app.services.llm.generate_structured_response") as mock_llm,
    ):
        # Setup mocks
        mock_get_embedding.return_value = mock_embedding
        mock_search.return_value = [mock_search_result]
        mock_llm.return_value = mock_answer

        # Execute request
        response = client.post("/answer", json={"query_text": query_text})

        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert data["answer_text"] == "You are good at Python."
        assert data["reasoning"] == "Based on the memo..."
        assert data["referenced_memo_ids"] == [str(mock_search_result.id)]

        # Verify calls
        mock_get_embedding.assert_called_once_with(query_text)
        mock_search.assert_called_once()
        mock_llm.assert_called_once()
