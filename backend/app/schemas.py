from uuid import UUID

from pydantic import BaseModel


class MemoCreate(BaseModel):
    text: str


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
    query_text: str
