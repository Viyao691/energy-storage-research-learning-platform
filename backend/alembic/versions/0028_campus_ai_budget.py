"""Add configurable campus AI attempt and output limits.

Revision ID: 0028
Revises: 0027
"""

from alembic import op
import sqlalchemy as sa


revision = "0028"
down_revision = "0027"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user_settings", sa.Column("campus_ai_daily_limit", sa.Integer(), nullable=False, server_default="20"))
    op.add_column("user_settings", sa.Column("campus_ai_max_tokens", sa.Integer(), nullable=False, server_default="2400"))


def downgrade() -> None:
    op.drop_column("user_settings", "campus_ai_max_tokens")
    op.drop_column("user_settings", "campus_ai_daily_limit")
