from uuid import UUID

from pydantic import BaseModel


class MemoCreate(BaseModel):
    text: str


class SearchResult(BaseModel):
    id: UUID
    content: str
    source_type: str
    similarity: float
