# Use in-memory SQLite for testing, or a separate test DB
# For this project using pgvector, we might need a real Postgres instance.
# However, setting up a separate test Postgres container is complex.
# For now, we will mock the DB or use the existing dev DB with transaction
# rollback (careful!).
# Given the constraints, using the dev DB with rollback is a common pattern
# for local dev.
# BUT, we need to be careful not to commit data.
# Better approach for pgvector: Use the existing DATABASE_URL but wrap in transaction.
import os

import pytest
from app.database import get_db
from app.main import app
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

# Use the same DB URL but ensure we are careful
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """
    Creates a fresh database session for a test.
    Rolls back the transaction after the test completes.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    """
    FastAPI TestClient with overridden dependency.
    """

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
