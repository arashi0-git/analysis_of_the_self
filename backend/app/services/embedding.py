import openai
from app.core.openai import client
from fastapi import HTTPException


def get_embedding(text: str, model: str = "text-embedding-3-small") -> list[float]:
    """
    Generates an embedding for the given text using OpenAI's API.

    Args:
        text (str): The text to embed.
        model (str): The model to use. Defaults to "text-embedding-3-small".

    Returns:
        list[float]: The embedding vector.

    Raises:
        HTTPException: If the API call fails.
    """
    try:
        response = client.embeddings.create(input=text, model=model)
        return response.data[0].embedding
    except openai.APIStatusError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"OpenAI API Error: {exc!s}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI API Error: {exc!s}",
        ) from exc
