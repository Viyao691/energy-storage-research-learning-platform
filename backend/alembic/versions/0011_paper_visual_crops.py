"""add saved paper visual crops

Revision ID: 0011
Revises: 0010
"""

from alembic import op
import sqlalchemy as sa


revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "paper_visual_crops",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("paper_id", sa.Integer(), sa.ForeignKey("papers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("visual_id", sa.Integer(), sa.ForeignKey("paper_visuals.id", ondelete="CASCADE"), nullable=False),
        sa.Column("left", sa.Float(), nullable=False),
        sa.Column("top", sa.Float(), nullable=False),
        sa.Column("width", sa.Float(), nullable=False),
        sa.Column("height", sa.Float(), nullable=False),
        sa.Column("label", sa.String(length=100), nullable=False),
        sa.Column("analysis_markdown", sa.Text(), nullable=False),
        sa.Column("evidence_status", sa.String(length=160), nullable=False),
        sa.Column("provider", sa.String(length=80), nullable=False),
        sa.Column("model_name", sa.String(length=200), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_paper_visual_crops_paper_id", "paper_visual_crops", ["paper_id"])
    op.create_index("ix_paper_visual_crops_visual_id", "paper_visual_crops", ["visual_id"])


def downgrade() -> None:
    op.drop_table("paper_visual_crops")
