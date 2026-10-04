"""add saved knowledge conversations

Revision ID: 0009
Revises: 0008
"""

from alembic import op
import sqlalchemy as sa


revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "knowledge_conversations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("scope", sa.String(length=20), nullable=False),
        sa.Column("paper_id", sa.Integer(), sa.ForeignKey("papers.id", ondelete="CASCADE"), nullable=True),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_knowledge_conversations_paper_id", "knowledge_conversations", ["paper_id"])
    op.create_table(
        "knowledge_conversation_turns",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("conversation_id", sa.Integer(), sa.ForeignKey("knowledge_conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("turn_index", sa.Integer(), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer_markdown", sa.Text(), nullable=False),
        sa.Column("citations_json", sa.Text(), nullable=False),
        sa.Column("evidence_status", sa.String(length=160), nullable=False),
        sa.Column("confidence_level", sa.String(length=10), nullable=False),
        sa.Column("confidence_explanation", sa.Text(), nullable=False),
        sa.Column("provider", sa.String(length=80), nullable=False),
        sa.Column("model_name", sa.String(length=200), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("conversation_id", "turn_index", name="uq_knowledge_conversation_turns_conversation_turn"),
    )
    op.create_index("ix_knowledge_conversation_turns_conversation_id", "knowledge_conversation_turns", ["conversation_id"])


def downgrade() -> None:
    op.drop_table("knowledge_conversation_turns")
    op.drop_table("knowledge_conversations")
