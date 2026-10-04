"""add saved comparison snapshots

Revision ID: 0010
Revises: 0009
"""

from alembic import op
import sqlalchemy as sa


revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "saved_comparisons",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("paper_ids_json", sa.Text(), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("comparison_markdown", sa.Text(), nullable=False),
        sa.Column("papers_json", sa.Text(), nullable=False),
        sa.Column("citations_json", sa.Text(), nullable=False),
        sa.Column("fairness_warnings_json", sa.Text(), nullable=False),
        sa.Column("evidence_status", sa.String(length=160), nullable=False),
        sa.Column("confidence_level", sa.String(length=10), nullable=False),
        sa.Column("confidence_explanation", sa.Text(), nullable=False),
        sa.Column("provider", sa.String(length=80), nullable=False),
        sa.Column("model_name", sa.String(length=200), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("saved_comparisons")
