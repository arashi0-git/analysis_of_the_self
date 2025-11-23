import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    ARRAY,
    JSON,
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    email = Column(Text, unique=True, nullable=False)
    university = Column(Text)
    major = Column(Text)
    desired_roles = Column(ARRAY(Text))
    job_axis_raw = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    life_events = relationship(
        "LifeEvent", back_populates="user", cascade="all, delete-orphan"
    )
    episodes = relationship(
        "Episode", back_populates="user", cascade="all, delete-orphan"
    )
    strengths = relationship(
        "Strength", back_populates="user", cascade="all, delete-orphan"
    )
    value_axes = relationship(
        "ValueAxis", back_populates="user", cascade="all, delete-orphan"
    )
    ai_insights = relationship(
        "AIInsight", back_populates="user", cascade="all, delete-orphan"
    )
    ai_logs = relationship("AILog", back_populates="user", cascade="all, delete-orphan")
    chat_logs = relationship(
        "ChatLog", back_populates="user", cascade="all, delete-orphan"
    )
    rag_embeddings = relationship(
        "RagEmbedding", back_populates="user", cascade="all, delete-orphan"
    )


class LifeEvent(Base):
    __tablename__ = "life_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    age = Column(Integer, CheckConstraint("age >= 0"))
    school_year = Column(Text, nullable=False)
    category = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text)
    context = Column(Text)
    action = Column(Text)
    result = Column(Text)
    learned = Column(Text)
    emotion = Column(Text)
    impact_level = Column(Integer, CheckConstraint("impact_level >= 0"))
    tags = Column(ARRAY(Text))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="life_events")


class Episode(Base):
    __tablename__ = "episodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(Text, nullable=False)
    purpose = Column(Text, nullable=False)
    situation = Column(Text, nullable=False)
    task = Column(Text, nullable=False)
    action = Column(Text, nullable=False)
    result = Column(Text, nullable=False)
    learning = Column(Text)
    life_event_ids = Column(ARRAY(UUID(as_uuid=True)))
    confidence = Column(
        Integer, CheckConstraint("confidence >= 0 AND confidence <= 100")
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="episodes")


class Strength(Base):
    __tablename__ = "strengths"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(Text, nullable=False)
    description = Column(Text)
    evidence_episode_ids = Column(ARRAY(UUID(as_uuid=True)))
    consistency_score = Column(
        Integer, CheckConstraint("consistency_score >= 0 AND consistency_score <= 100")
    )
    ai_generated = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="strengths")


class ValueAxis(Base):
    __tablename__ = "value_axes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(Text, nullable=False)
    description = Column(Text)
    priority = Column(Integer, CheckConstraint("priority >= 0"))
    evidence_episode_ids = Column(ARRAY(UUID(as_uuid=True)))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="value_axes")


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    life_summary = Column(Text)
    strengths_summary = Column(Text)
    value_axes_summary = Column(Text)
    risk_points = Column(Text)
    growth_pattern = Column(Text)
    related_event_ids = Column(ARRAY(UUID(as_uuid=True)))
    version = Column(Integer, default=1)
    previous_version_id = Column(UUID(as_uuid=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="ai_insights")


class AILog(Base):
    __tablename__ = "ai_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    request_text = Column(Text, nullable=False)
    ai_output_text = Column(Text, nullable=False)
    referenced_episode_ids = Column(ARRAY(UUID(as_uuid=True)))
    referenced_strength_ids = Column(ARRAY(UUID(as_uuid=True)))
    need_more_info = Column(Boolean, default=False)
    followup_questions = Column(ARRAY(Text))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="ai_logs")


class ChatLog(Base):
    __tablename__ = "chat_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    user_message = Column(Text, nullable=False)
    ai_message = Column(Text, nullable=False)
    used_episode_ids = Column(ARRAY(UUID(as_uuid=True)))
    used_insight_ids = Column(ARRAY(UUID(as_uuid=True)))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="chat_logs")


class RagEmbedding(Base):
    __tablename__ = "rag_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    source_type = Column(
        Text,
        CheckConstraint("source_type IN ('episode', 'insight', 'strength', 'memo')"),
        nullable=False,
    )
    source_id = Column(UUID(as_uuid=True), nullable=True)
    embedding = Column(Vector(1536), nullable=False)
    content = Column(Text, nullable=False)
    question_id = Column(
        UUID(as_uuid=True),
        ForeignKey("questions.id", ondelete="SET NULL"),
        nullable=True,
    )
    weight = Column(Float, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="rag_embeddings")
    question = relationship("Question")


class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category = Column(Text, nullable=False)
    question_text = Column(Text, nullable=False)
    display_order = Column(Integer, nullable=False)
    weight = Column(Float, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    answers = relationship(
        "UserAnswer", back_populates="question", cascade="all, delete-orphan"
    )


class UserAnswer(Base):
    __tablename__ = "user_answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    question_id = Column(
        UUID(as_uuid=True),
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
    )
    answer_text = Column(Text, nullable=False)
    embedding_id = Column(
        UUID(as_uuid=True),
        ForeignKey("rag_embeddings.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    question = relationship("Question", back_populates="answers")
    embedding = relationship("RagEmbedding")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    analysis_type = Column(Text, nullable=False)
    result_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
