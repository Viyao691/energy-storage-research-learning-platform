"""Public campus sources, metadata, page state, and in-app notices.

Revision ID: 0024
Revises: 0023
"""

from alembic import op
import sqlalchemy as sa


revision = "0024"
down_revision = "0023"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("campus_sources",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("key", sa.String(80), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("group", sa.String(40), nullable=False),
        sa.Column("url", sa.String(1000), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("detail", sa.String(300), nullable=False),
        sa.Column("robots_status", sa.String(60), nullable=False),
        sa.Column("last_checked_at", sa.DateTime(), nullable=True),
        sa.Column("last_success_at", sa.DateTime(), nullable=True),
        sa.Column("next_check_at", sa.DateTime(), nullable=True),
    )
    op.create_table("campus_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("identity", sa.String(500), nullable=False, unique=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("category", sa.String(30), nullable=False),
        sa.Column("excerpt", sa.String(350), nullable=False),
        sa.Column("dates_json", sa.Text(), nullable=False),
        sa.Column("published_on", sa.Date(), nullable=True),
        sa.Column("priority", sa.Integer(), nullable=False),
        sa.Column("followed", sa.Boolean(), nullable=False),
        sa.Column("conflict", sa.Boolean(), nullable=False),
        sa.Column("first_seen_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table("campus_pages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_id", sa.Integer(), sa.ForeignKey("campus_sources.id", ondelete="CASCADE"), nullable=False),
        sa.Column("url", sa.String(1000), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("event_id", sa.Integer(), sa.ForeignKey("campus_events.id", ondelete="SET NULL"), nullable=True),
        sa.Column("fingerprint", sa.String(64), nullable=False),
        sa.Column("dates_json", sa.Text(), nullable=False),
        sa.Column("last_attempt_at", sa.DateTime(), nullable=True),
        sa.Column("last_error", sa.String(300), nullable=False),
        sa.UniqueConstraint("source_id", "url", name="uq_campus_pages_source_url"),
    )
    op.create_index("ix_campus_pages_source_id", "campus_pages", ["source_id"])
    op.create_index("ix_campus_pages_event_id", "campus_pages", ["event_id"])
    op.create_table("campus_notices",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_id", sa.Integer(), sa.ForeignKey("campus_events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("body", sa.String(300), nullable=False),
        sa.Column("kind", sa.String(30), nullable=False),
        sa.Column("dedupe_key", sa.String(500), nullable=False, unique=True),
        sa.Column("read_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_campus_notices_event_id", "campus_notices", ["event_id"])


def downgrade() -> None:
    op.drop_index("ix_campus_notices_event_id", table_name="campus_notices")
    op.drop_table("campus_notices")
    op.drop_index("ix_campus_pages_event_id", table_name="campus_pages")
    op.drop_index("ix_campus_pages_source_id", table_name="campus_pages")
    op.drop_table("campus_pages")
    op.drop_table("campus_events")
    op.drop_table("campus_sources")
