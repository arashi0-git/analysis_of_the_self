from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, schemas
from .database import get_db

# Create tables (safe for dev)
# models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS setup
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def read_health():
    return {"status": "ok"}


@app.post("/memos")
def create_memo(memo: schemas.MemoCreate, db: Session = Depends(get_db)):  # noqa: B008
    # 1. Get default user
    user = crud.get_or_create_default_user(db)

    # 2. Generate Embedding
    from app.services.embedding import get_embedding

    embedding = get_embedding(memo.text)

    # 3. Save to DB
    crud.create_rag_embedding(db, user.id, memo.text, embedding, source_type="memo")

    return {"status": "success", "message": "Memo saved successfully"}


@app.post("/answer", response_model=schemas.GeneratedAnswer)
def generate_answer(request: schemas.AnswerRequest, db: Session = Depends(get_db)):  # noqa: B008
    from app.services.answer_generation import generate_answer

    return generate_answer(db, request.query_text)
