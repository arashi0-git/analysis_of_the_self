"""add questionnaire tables

Revision ID: 7a1ca3001aea
Revises: 3d063043e759
Create Date: 2025-11-22 09:47:56.385475

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7a1ca3001aea"
down_revision: Union[str, None] = "3d063043e759"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create questions table
    op.create_table(
        "questions",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("weight", sa.Float(), server_default="1.0", nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create user_answers table
    op.create_table(
        "user_answers",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("question_id", sa.UUID(), nullable=False),
        sa.Column("answer_text", sa.Text(), nullable=False),
        sa.Column("embedding_id", sa.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["question_id"],
            ["questions.id"],
        ),
        sa.ForeignKeyConstraint(
            ["embedding_id"],
            ["rag_embeddings.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "question_id"),
    )

    # Create analysis_results table
    op.create_table(
        "analysis_results",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("analysis_type", sa.String(length=50), nullable=False),
        sa.Column("result_data", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Add columns to rag_embeddings
    op.add_column("rag_embeddings", sa.Column("question_id", sa.UUID(), nullable=True))
    op.add_column(
        "rag_embeddings",
        sa.Column("weight", sa.Float(), server_default="1.0", nullable=True),
    )
    op.create_foreign_key(None, "rag_embeddings", "questions", ["question_id"], ["id"])


def downgrade() -> None:
    # Remove columns from rag_embeddings
    op.drop_constraint(None, "rag_embeddings", type_="foreignkey")
    op.drop_column("rag_embeddings", "weight")
    op.drop_column("rag_embeddings", "question_id")

    # Drop tables
    op.drop_table("analysis_results")
    op.drop_table("user_answers")
    op.drop_table("questions")
