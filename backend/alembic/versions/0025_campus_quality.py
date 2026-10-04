"""Campus quality metadata and bounded model analysis cache.

Revision ID: 0025
Revises: 0024
"""

from alembic import op
import sqlalchemy as sa


revision = "0025"
down_revision = "0024"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("campus_sources") as batch:
        batch.add_column(sa.Column("ever_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))
        batch.add_column(sa.Column("access_state", sa.String(30), nullable=False, server_default="unknown"))
        batch.add_column(sa.Column("coverage", sa.String(30), nullable=False, server_default="unverified"))
    op.execute("UPDATE campus_sources SET ever_enabled=1 WHERE enabled=1 OR status!='pending'")
    op.execute("UPDATE campus_sources SET access_state='login_required' WHERE status='blocked' AND (detail LIKE '%401%' OR detail LIKE '%登录%')")
    op.execute("UPDATE campus_sources SET access_state='unreachable' WHERE detail LIKE '%ConnectError%' OR detail LIKE '%Timeout%' ")
    op.execute("UPDATE campus_sources SET access_state='public' WHERE last_success_at IS NOT NULL AND access_state='unknown'")
    with op.batch_alter_table("campus_pages") as batch:
        batch.add_column(sa.Column("published_on", sa.Date(), nullable=True))
        batch.add_column(sa.Column("publication_evidence", sa.String(120), nullable=False, server_default=""))
        batch.add_column(sa.Column("content_hash", sa.String(64), nullable=False, server_default=""))
    with op.batch_alter_table("campus_events") as batch:
        batch.add_column(sa.Column("analysis_json", sa.Text(), nullable=False, server_default="{}"))
        batch.add_column(sa.Column("content_hash", sa.String(64), nullable=False, server_default=""))
    op.create_table("campus_analysis_cache",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("cache_key", sa.String(64), nullable=False, unique=True),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("provider", sa.String(80), nullable=False),
        sa.Column("model", sa.String(200), nullable=False),
        sa.Column("prompt_version", sa.String(40), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("result_json", sa.Text(), nullable=False),
        sa.Column("input_text", sa.Text(), nullable=False),
        sa.Column("attempted_at", sa.DateTime(), nullable=True),
        sa.Column("retry_after", sa.DateTime(), nullable=True),
        sa.Column("error_code", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("campus_analysis_cache")
    with op.batch_alter_table("campus_events") as batch:
        batch.drop_column("content_hash")
        batch.drop_column("analysis_json")
    with op.batch_alter_table("campus_pages") as batch:
        batch.drop_column("content_hash")
        batch.drop_column("publication_evidence")
        batch.drop_column("published_on")
    with op.batch_alter_table("campus_sources") as batch:
        batch.drop_column("coverage")
        batch.drop_column("access_state")
        batch.drop_column("ever_enabled")
