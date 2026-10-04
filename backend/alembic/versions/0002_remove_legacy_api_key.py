"""remove legacy persisted API key

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-26
"""

from alembic import op
import sqlalchemy as sa


revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Drop a key column left by early Phase 1 builds, if one exists."""
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("user_settings")}
    if "api_key" in columns:
        with op.batch_alter_table("user_settings") as batch:
            batch.drop_column("api_key")


def downgrade() -> None:
    # Intentionally irreversible: restoring a persisted secret column would violate the
    # local-first security boundary introduced by this revision.
    pass
