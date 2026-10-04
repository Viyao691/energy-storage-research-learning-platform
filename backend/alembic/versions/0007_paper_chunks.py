"""add page-aware paper chunks and vector storage

Revision ID: 0007
Revises: 0006
Create Date: 2026-07-30
"""

from alembic import op
import sqlalchemy as sa


revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "paper_chunks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("paper_id", sa.Integer(), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=True),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column(
            "section",
            sa.String(length=255),
            nullable=False,
            server_default="",
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("source_scope", sa.String(length=30), nullable=False),
        sa.Column(
            "parse_confidence",
            sa.Float(),
            nullable=False,
            server_default="0",
        ),
        sa.Column("embedding_json", sa.Text(), nullable=False),
        sa.Column("embedding_model", sa.String(length=200), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(
            ["paper_id"],
            ["papers.id"],
            name="fk_paper_chunks_paper_id_papers",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_paper_chunks"),
        sa.UniqueConstraint(
            "paper_id",
            "content_hash",
            "embedding_model",
            name="uq_paper_chunks_paper_content_model",
        ),
    )
    op.create_index(
        "ix_paper_chunks_paper_id",
        "paper_chunks",
        ["paper_id"],
        unique=False,
    )
    op.create_index(
        "ix_paper_chunks_content_hash",
        "paper_chunks",
        ["content_hash"],
        unique=False,
    )
    op.create_index(
        "ix_paper_chunks_embedding_model",
        "paper_chunks",
        ["embedding_model"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_paper_chunks_embedding_model", table_name="paper_chunks")
    op.drop_index("ix_paper_chunks_content_hash", table_name="paper_chunks")
    op.drop_index("ix_paper_chunks_paper_id", table_name="paper_chunks")
    op.drop_table("paper_chunks")
