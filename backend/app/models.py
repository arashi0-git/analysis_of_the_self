import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import ARRAY, Boolean, Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text)
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
    age = Column(Integer)
    school_year = Column(Text)
    category = Column(Text)
    title = Column(Text)
    description = Column(Text)
    context = Column(Text)
    action = Column(Text)
    result = Column(Text)
    learned = Column(Text)
    emotion = Column(Text)
    impact_level = Column(Integer)
    tags = Column(ARRAY(Text))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="life_events")


class Episode(Base):
    __tablename__ = "episodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(Text)
    purpose = Column(Text)
    situation = Column(Text)
    task = Column(Text)
    action = Column(Text)
    result = Column(Text)
    learning = Column(Text)
    life_event_ids = Column(ARRAY(UUID(as_uuid=True)))
    confidence = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="episodes")


class Strength(Base):
    __tablename__ = "strengths"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(Text)
    description = Column(Text)
    evidence_episode_ids = Column(ARRAY(UUID(as_uuid=True)))
    consistency_score = Column(Integer)
    ai_generated = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="strengths")


class ValueAxis(Base):
    __tablename__ = "value_axes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(Text)
    description = Column(Text)
    priority = Column(Integer)
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
    request_text = Column(Text)
    ai_output_text = Column(Text)
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
    user_message = Column(Text)
    ai_message = Column(Text)
    used_episode_ids = Column(ARRAY(UUID(as_uuid=True)))
    used_insight_ids = Column(ARRAY(UUID(as_uuid=True)))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="chat_logs")


class RagEmbedding(Base):
    __tablename__ = "rag_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    source_type = Column(Text)
    source_id = Column(UUID(as_uuid=True))
    embedding = Column(Vector(1536))
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="rag_embeddings")
