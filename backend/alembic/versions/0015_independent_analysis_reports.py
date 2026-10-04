"""add independent versioned analysis reports

Revision ID: 0015
Revises: 0014
"""

from alembic import op
import sqlalchemy as sa


revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    columns = (
        sa.Column("quick_understanding", sa.Text(), nullable=False, server_default=""),
        sa.Column("quick_prompt_version", sa.String(length=80), nullable=False, server_default=""),
        sa.Column("quick_schema_version", sa.String(length=80), nullable=False, server_default=""),
        sa.Column("quick_evidence_status", sa.String(length=80), nullable=False, server_default=""),
        sa.Column("layman_understanding", sa.Text(), nullable=False, server_default=""),
        sa.Column("layman_prompt_version", sa.String(length=80), nullable=False, server_default=""),
        sa.Column("layman_schema_version", sa.String(length=80), nullable=False, server_default=""),
        sa.Column("layman_evidence_status", sa.String(length=80), nullable=False, server_default=""),
        sa.Column("reviewer_analysis", sa.Text(), nullable=False, server_default=""),
        sa.Column("reviewer_prompt_version", sa.String(length=80), nullable=False, server_default=""),
        sa.Column("reviewer_schema_version", sa.String(length=80), nullable=False, server_default=""),
        sa.Column("reviewer_evidence_status", sa.String(length=80), nullable=False, server_default=""),
    )
    with op.batch_alter_table("analyses") as batch_op:
        for column in columns:
            batch_op.add_column(column)


def downgrade() -> None:
    with op.batch_alter_table("analyses") as batch_op:
        for name in (
            "reviewer_evidence_status", "reviewer_schema_version", "reviewer_prompt_version", "reviewer_analysis",
            "layman_evidence_status", "layman_schema_version", "layman_prompt_version", "layman_understanding",
            "quick_evidence_status", "quick_schema_version", "quick_prompt_version", "quick_understanding",
        ):
            batch_op.drop_column(name)
