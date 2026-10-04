"""Store official-campus-page links to public WeChat articles only.

Revision ID: 0026
Revises: 0025
"""

from alembic import op
import sqlalchemy as sa


revision = "0026"
down_revision = "0025"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "campus_public_links",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_id", sa.Integer(), sa.ForeignKey("campus_sources.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_page_url", sa.String(1000), nullable=False),
        sa.Column("url", sa.String(1200), nullable=False),
        sa.Column("title", sa.String(500), nullable=False, server_default=""),
        sa.Column("published_on", sa.Date(), nullable=True),
        sa.Column("first_seen_at", sa.DateTime(), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("source_id", "url", name="uq_campus_public_links_source_url"),
    )
    op.create_index("ix_campus_public_links_source_id", "campus_public_links", ["source_id"])
    op.create_index("ix_campus_public_links_url", "campus_public_links", ["url"])


def downgrade() -> None:
    op.drop_index("ix_campus_public_links_url", table_name="campus_public_links")
    op.drop_index("ix_campus_public_links_source_id", table_name="campus_public_links")
    op.drop_table("campus_public_links")
