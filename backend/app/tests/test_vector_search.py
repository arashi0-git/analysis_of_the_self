from app import models, schemas
from app.services.vector_search import search_similar_items
from sqlalchemy.orm import Session


def test_search_similar_items(db_session: Session):
    """
    Test vector search functionality.
    """
    # 1. Setup Test Data
    # Create a dummy user
    user = models.User(email="search_test@example.com", name="Search Test User")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Create embeddings
    # Vector dimension is 1536.
    # We'll use simplified vectors for testing logic, but they must be 1536 dims.
    # Let's pretend first 3 dims are significant.

    vec1 = [1.0, 0.0, 0.0] + [0.0] * 1533
    vec2 = [0.0, 1.0, 0.0] + [0.0] * 1533
    vec3 = [0.5, 0.5, 0.0] + [0.0] * 1533  # Between 1 and 2

    item1 = models.RagEmbedding(
        user_id=user.id, source_type="memo", content="Item 1", embedding=vec1
    )
    item2 = models.RagEmbedding(
        user_id=user.id, source_type="memo", content="Item 2", embedding=vec2
    )
    item3 = models.RagEmbedding(
        user_id=user.id, source_type="memo", content="Item 3", embedding=vec3
    )

    db_session.add_all([item1, item2, item3])
    db_session.commit()

    # 2. Execute Search
    # Query close to Item 1
    query_vec = [0.9, 0.1, 0.0] + [0.0] * 1533

    results = search_similar_items(db_session, query_vec, limit=3)

    # 3. Verify Results
    assert len(results) == 3

    # Item 1 should be first (most similar)
    assert results[0].content == "Item 1"
    assert results[0].similarity > 0.9

    # Item 3 should be second (mix of 1 and 2)
    assert results[1].content == "Item 3"

    # Item 2 should be last (orthogonal-ish)
    assert results[2].content == "Item 2"

    # Check return type
    assert isinstance(results[0], schemas.SearchResult)


def test_search_threshold(db_session: Session):
    """
    Test similarity threshold filtering.
    """
    user = models.User(email="threshold_test@example.com", name="Threshold User")
    db_session.add(user)
    db_session.commit()

    vec1 = [1.0, 0.0, 0.0] + [0.0] * 1533  # Target
    vec2 = [0.0, 1.0, 0.0] + [0.0] * 1533  # Orthogonal (sim ~ 0)

    item1 = models.RagEmbedding(
        user_id=user.id, source_type="memo", content="Match", embedding=vec1
    )
    item2 = models.RagEmbedding(
        user_id=user.id, source_type="memo", content="No Match", embedding=vec2
    )

    db_session.add_all([item1, item2])
    db_session.commit()

    query_vec = [1.0, 0.0, 0.0] + [0.0] * 1533

    # High threshold, should only get item1
    results = search_similar_items(db_session, query_vec, similarity_threshold=0.9)
    assert len(results) == 1
    assert results[0].content == "Match"
