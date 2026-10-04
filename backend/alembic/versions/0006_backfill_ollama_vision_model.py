"""backfill Ollama visual model for upgraded settings

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-29
"""

from alembic import op
import sqlalchemy as sa


revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    settings = sa.table(
        "user_settings",
        sa.column("model_provider", sa.String()),
        sa.column("vision_model", sa.String()),
    )
    op.execute(
        settings.update()
        .where(settings.c.model_provider == "ollama")
        .where(settings.c.vision_model == "")
        .values(vision_model="qwen2.5vl:3b")
    )


def downgrade() -> None:
    # A downgrade must not erase a visual model that the user may have edited.
    pass
