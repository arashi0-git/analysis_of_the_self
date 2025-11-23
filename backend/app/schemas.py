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


class QuestionBase(BaseModel):
    category: str
    question_text: str
    display_order: int
    weight: float = 1.0


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


class UserAnswer(UserAnswerCreate):
    id: UUID
    user_id: UUID
    embedding_id: UUID | None

    class Config:
        from_attributes = True


class AnalysisResult(BaseModel):
    id: UUID
    user_id: UUID
    analysis_type: str
    result_data: dict

    class Config:
        from_attributes = True


class StrengthItem(BaseModel):
    strength: str
    evidence: str
    confidence: float


class AnalysisResultContent(BaseModel):
    keywords: list[str]
    strengths: list[StrengthItem]
    values: list[str]
    summary: str


class AnalysisResponse(AnalysisResultContent):
    pass
