from app import models, schemas
from sqlalchemy import select
from sqlalchemy.orm import Session


def search_similar_items(
    db: Session,
    query_embedding: list[float],
    limit: int = 5,
    similarity_threshold: float = 0.0,
) -> list[schemas.SearchResult]:
    """
    Search for similar items in the database using vector similarity.
    Uses Cosine Distance (<=>) operator provided by pgvector.

    Args:
        db: Database session
        query_embedding: The embedding vector of the query text
        limit: Maximum number of results to return
        similarity_threshold: Minimum similarity score (0-1) to include in results

    Returns:
        List of SearchResult Pydantic models
    """
    # pgvector's <=> operator returns cosine distance
    # (0 = identical, 1 = opposite, 2 = opposite direction)
    # We want similarity, which is 1 - distance for normalized vectors.
    # However, pgvector's cosine distance is 1 - cosine_similarity.
    # So, similarity = 1 - (embedding <=> query_embedding)

    similarity_expr = 1 - models.RagEmbedding.embedding.cosine_distance(query_embedding)

    # Apply weight (default to 1.0 if null)
    # weighted_score = similarity * weight
    from sqlalchemy import func

    weighted_score = similarity_expr * func.coalesce(models.RagEmbedding.weight, 1.0)

    stmt = (
        select(models.RagEmbedding, weighted_score.label("score"))
        .filter(weighted_score >= similarity_threshold)
        .order_by(weighted_score.desc())
        .limit(limit)
    )

    results = db.execute(stmt).all()

    search_results: list[schemas.SearchResult] = []
    for row in results:
        rag_item: models.RagEmbedding = row[0]
        score: float = row[1]

        search_results.append(
            schemas.SearchResult(
                id=rag_item.id,
                content=rag_item.content,
                source_type=rag_item.source_type,
                similarity=score,
            )
        )

    return search_results
