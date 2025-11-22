from app import schemas
from app.services import embedding, llm, vector_search
from sqlalchemy.orm import Session


def generate_answer(
    db: Session,
    query_text: str,
) -> schemas.GeneratedAnswer:
    """
    Generates an answer to the user's query using RAG.

    1. Generate embedding for the query.
    2. Search for similar items in the vector DB.
    3. Construct a prompt with the search results.
    4. Call LLM to generate a structured answer.

    Args:
        db: Database session.
        query_text: The user's query.

    Returns:
        schemas.GeneratedAnswer: The structured answer.
    """
    # 1. Generate Embedding
    query_vec = embedding.get_embedding(query_text)

    # 2. Vector Search
    # Limit to top 5 results for context
    search_results = vector_search.search_similar_items(
        db, query_vec, limit=5, similarity_threshold=0.3
    )

    if not search_results:
        return schemas.GeneratedAnswer(
            reasoning="関連するメモが見つかりませんでした。",
            answer_text="申し訳ありませんが、あなたの質問に関連する過去のメモや記録が見つかりませんでした。",
            referenced_memo_ids=[],
        )

    # 3. Construct Prompt
    context_str = ""
    for result in search_results:
        context_str += (
            f"ID: {result.id}\nSource ({result.source_type}): {result.content}\n---\n"
        )

    system_instruction = """
    You are an AI assistant helping a student with self-analysis for job hunting.
    Use the provided context (past memos, episodes, etc.) to answer the user's question.
    If the context doesn't contain enough information, admit it but try to provide
    general advice based on the context available.

    Output must be in the specified JSON format.
    - reasoning: Explain your thought process and how you used the context.
    - answer_text: The actual answer to the user.
    - referenced_memo_ids: List of IDs of the context items you actually used.
    """

    prompt = f"""
    User Query: {query_text}

    Context:
    {context_str}

    Please answer the query based on the context above.
    """

    # 4. Generate Structured Response
    response = llm.generate_structured_response(
        prompt=prompt,
        response_model=schemas.GeneratedAnswer,
        system_instruction=system_instruction,
    )

    return response
