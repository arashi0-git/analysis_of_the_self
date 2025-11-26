from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


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


class QuestionBase(BaseModel):
    category: str
    question_text: str
    display_order: int
    weight: float = 1.0
    has_deep_dive: bool = False


class Question(QuestionBase):
    id: UUID

    class Config:
        from_attributes = True


class QuestionList(BaseModel):
    questions: list[Question]


class UserAnswerCreate(BaseModel):
    question_id: UUID
    answer_text: str = Field(..., min_length=1)


class UserAnswerSubmit(BaseModel):
    answers: list[UserAnswerCreate]


class SingleAnswerUpdate(BaseModel):
    answer_text: str = Field(..., min_length=1)


class UserAnswer(BaseModel):
    id: UUID
    user_id: UUID
    question_id: UUID
    answer_text: str
    embedding_id: Optional[UUID] = None

    class Config:
        from_attributes = True


class UserAnswersResponse(BaseModel):
    answers: list[UserAnswer]


class AnalysisRequest(BaseModel):
    user_id: UUID


class Strength(BaseModel):
    strength: str
    evidence: str


class AnalysisResponse(BaseModel):
    keywords: list[str]
    strengths: list[Strength]
    values: list[str]
    summary: str


class AnalysisResultContent(BaseModel):
    keywords: list[str]
    strengths: list[Strength]
    values: list[str]
    summary: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str

    class Config:
        from_attributes = True


class AnswerFeedbackRequest(BaseModel):
    answer_text: str = Field(..., min_length=1)


class AnswerFeedbackResponse(BaseModel):
    feedback: str
    suggestions: list[str]


# Episode Detail Schemas
class EpisodeDetailBase(BaseModel):
    method_type: Literal["STAR", "5W1H"]
    # STAR fields
    situation: Optional[str] = None
    task: Optional[str] = None
    action: Optional[str] = None
    result: Optional[str] = None
    # 5W1H fields
    what: Optional[str] = None
    why: Optional[str] = None
    when_detail: Optional[str] = None
    where_detail: Optional[str] = None
    who_detail: Optional[str] = None
    how_detail: Optional[str] = None
    # Common
    summary: Optional[str] = None


class EpisodeDetailCreate(EpisodeDetailBase):
    pass


class EpisodeDetailUpdate(EpisodeDetailBase):
    pass


class EpisodeDetailResponse(EpisodeDetailBase):
    id: UUID
    user_id: UUID
    question_id: UUID
    ai_feedback: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EpisodeFeedbackRequest(BaseModel):
    original_answer: str
    episode_detail: EpisodeDetailBase


class EpisodeSummaryRequest(BaseModel):
    episode_detail: EpisodeDetailBase
