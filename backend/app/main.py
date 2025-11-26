from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import get_db
from .dependencies.auth import get_current_user
from .routers import auth, chat, episodes, questionnaire

# Create tables (safe for dev)
# models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(questionnaire.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(episodes.router)

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
def create_memo(
    memo: schemas.MemoCreate,
    current_user: models.User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
):
    # 1. Generate Embedding
    from app.services.embedding import get_embedding

    embedding = get_embedding(memo.text)

    # 2. Save to DB
    crud.create_rag_embedding(
        db, current_user.id, memo.text, embedding, source_type="memo"
    )

    return {"status": "success", "message": "Memo saved successfully"}
