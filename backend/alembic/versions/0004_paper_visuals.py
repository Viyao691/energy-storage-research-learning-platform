"""add paper visual catalog

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-29
"""

from alembic import op
import sqlalchemy as sa


revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "paper_visuals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("paper_id", sa.Integer(), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=False),
        sa.Column("kind", sa.String(length=20), nullable=False),
        sa.Column("label", sa.String(length=100), nullable=False),
        sa.Column("caption", sa.Text(), nullable=False),
        sa.Column(
            "analysis_markdown",
            sa.Text(),
            nullable=False,
            server_default="",
        ),
        sa.Column(
            "evidence_status",
            sa.String(length=80),
            nullable=False,
            server_default="",
        ),
        sa.Column(
            "provider",
            sa.String(length=80),
            nullable=False,
            server_default="",
        ),
        sa.Column(
            "model_name",
            sa.String(length=200),
            nullable=False,
            server_default="",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(
            ["paper_id"],
            ["papers.id"],
            name="fk_paper_visuals_paper_id_papers",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_paper_visuals"),
        sa.UniqueConstraint(
            "paper_id",
            "page_number",
            "kind",
            "label",
            name="uq_paper_visuals_paper_page_kind_label",
        ),
    )
    op.create_index(
        "ix_paper_visuals_paper_id",
        "paper_visuals",
        ["paper_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_paper_visuals_paper_id",
        table_name="paper_visuals",
    )
    op.drop_table("paper_visuals")
