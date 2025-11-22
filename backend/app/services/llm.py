import openai
from app.core.openai import client
from fastapi import HTTPException


def generate_response(
    prompt: str,
    model_name: str = "gpt-4o-mini",
    system_instruction: str = "You are a helpful assistant.",
) -> str:
    """
    Generates a response using OpenAI's Chat Completion API.

    Args:
        prompt (str): The user's input prompt.
        model_name (str): The model to use. Defaults to "gpt-4o-mini".
        system_instruction (str): System instruction for the AI.

    Returns:
        str: The generated response text.

    Raises:
        HTTPException: If the API call fails.
    """
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content
    except openai.APIStatusError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=f"OpenAI API Error: {exc!s}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI API Error: {exc!s}",
        ) from exc
