import os

import openai
from fastapi import Depends, FastAPI, HTTPException
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

# OpenAI Client
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@app.get("/health")
def read_health():
    return {"status": "ok"}


@app.post("/memos")
def create_memo(memo: schemas.MemoCreate, db: Session = Depends(get_db)):  # noqa: B008
    # 1. Get default user
    user = crud.get_or_create_default_user(db)

    # 2. Generate Embedding
    try:
        response = client.embeddings.create(
            input=memo.text, model="text-embedding-3-small"
        )
        embedding = response.data[0].embedding
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"OpenAI API Error: {str(e)}"
        ) from e

    # 3. Save to DB
    crud.create_rag_embedding(db, user.id, memo.text, embedding, source_type="memo")

    return {"status": "success", "message": "Memo saved successfully"}
