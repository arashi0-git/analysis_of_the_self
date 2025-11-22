from uuid import UUID

from pydantic import BaseModel, Field


class MemoCreate(BaseModel):
    text: str = Field(..., min_length=1, description="Memo content cannot be empty")


class SearchResult(BaseModel):
    id: UUID
    content: str
    source_type: str
    similarity: float


class GeneratedAnswer(BaseModel):
    reasoning: str
    answer_text: str
    referenced_memo_ids: list[UUID]


class AnswerRequest(BaseModel):
    query_text: str = Field(..., min_length=1, description="Query cannot be empty")
