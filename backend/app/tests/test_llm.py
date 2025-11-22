from unittest.mock import MagicMock, patch

import openai
import pytest
from app.services.llm import generate_response
from fastapi import HTTPException


def test_generate_response_success():
    """
    Test successful response generation using mocked OpenAI API.
    """
    # Patch the client imported in app.services.llm
    with patch("app.services.llm.client.chat.completions.create") as mock_create:
        # Setup mock response
        mock_response = MagicMock()
        mock_response.choices = [
            MagicMock(message=MagicMock(content="Generated response"))
        ]
        mock_create.return_value = mock_response

        response = generate_response("Test prompt")

        assert response == "Generated response"
        mock_create.assert_called_once()
        # Check arguments
        call_args = mock_create.call_args
        assert call_args.kwargs["model"] == "gpt-4o-mini"
        assert call_args.kwargs["messages"][1]["content"] == "Test prompt"


def test_generate_response_api_error():
    """
    Test handling of OpenAI API errors.
    """
    with patch("app.services.llm.client.chat.completions.create") as mock_create:
        # Simulate OpenAI API error
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_create.side_effect = openai.APIStatusError(
            message="Rate limit exceeded", response=mock_response, body=None
        )

        with pytest.raises(HTTPException) as excinfo:
            generate_response("Test prompt")

        assert excinfo.value.status_code == 429
        assert "Rate limit exceeded" in excinfo.value.detail
