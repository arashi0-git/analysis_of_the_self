import os

import pytest
from app.database import Base, get_db
from app.main import app
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()

# Use a separate test database
# We assume the user/password is the same, just different DB name
BASE_DATABASE_URL = os.getenv("DATABASE_URL")
# Example: postgresql://user:pass@db:5432/analysis_of_the_self
# We want: postgresql://user:pass@db:5432/analysis_of_the_self_test

if not BASE_DATABASE_URL:
    raise ValueError("DATABASE_URL must be set")

# Simple string manipulation to change DB name
# This is a bit fragile but works for standard connection strings
if "/analysis_of_the_self" in BASE_DATABASE_URL:
    TEST_DATABASE_URL = BASE_DATABASE_URL.replace(
        "/analysis_of_the_self", "/analysis_of_the_self_test"
    )
else:
    # Fallback or error
    TEST_DATABASE_URL = BASE_DATABASE_URL + "_test"


@pytest.fixture(scope="session")
def test_db_setup():
    """
    Create test database and tables.
    Runs once per test session.
    """
    # Connect to default DB to create test DB
    default_engine = create_engine(BASE_DATABASE_URL, isolation_level="AUTOCOMMIT")

    # Extract DB name from TEST_DATABASE_URL
    test_db_name = TEST_DATABASE_URL.split("/")[-1]

    with default_engine.connect() as conn:
        # Check if DB exists
        result = conn.execute(
            text(f"SELECT 1 FROM pg_database WHERE datname = '{test_db_name}'")
        )
        if not result.scalar():
            conn.execute(text(f"CREATE DATABASE {test_db_name}"))

    # Connect to Test DB
    test_engine = create_engine(TEST_DATABASE_URL)

    # Enable pgvector
    with test_engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()

    # Create tables
    Base.metadata.create_all(bind=test_engine)

    yield test_engine

    # Cleanup (Optional: Drop DB after tests? For dev speed, maybe keep it)
    # Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


@pytest.fixture(scope="function")
def db_session(test_db_setup):
    """
    Creates a fresh database session for a test.
    Rolls back the transaction after the test completes.
    """
    engine = test_db_setup
    connection = engine.connect()
    transaction = connection.begin()
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
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
