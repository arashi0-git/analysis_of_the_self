import openai
from app.core.openai import client
from fastapi import HTTPException
from pydantic import BaseModel


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


def generate_structured_response(
    prompt: str,
    response_model: type[BaseModel],
    model_name: str = "gpt-4o-mini",
    system_instruction: str = "You are a helpful assistant.",
) -> BaseModel:
    """
    Generates a structured response using OpenAI's Structured Outputs.

    Args:
        prompt (str): The user's input prompt.
        response_model (type[BaseModel]): The Pydantic model to parse the response into.
        model_name (str): The model to use. Defaults to "gpt-4o-mini".
        system_instruction (str): System instruction for the AI.

    Returns:
        BaseModel: The parsed response object.

    Raises:
        HTTPException: If the API call fails.
    """
    try:
        completion = client.beta.chat.completions.parse(
            model=model_name,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt},
            ],
            response_format=response_model,
        )
        return completion.choices[0].message.parsed
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
