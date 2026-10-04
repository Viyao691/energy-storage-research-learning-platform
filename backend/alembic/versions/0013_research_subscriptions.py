"""add research subscriptions

Revision ID: 0013
Revises: 0012
"""

from alembic import op
import sqlalchemy as sa


revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "research_subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("query", sa.String(length=300), nullable=False),
        sa.Column("sources_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("year_from", sa.Integer(), nullable=True),
        sa.Column("year_to", sa.Integer(), nullable=True),
        sa.Column("open_access_only", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("interval_hours", sa.Integer(), nullable=False, server_default="168"),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("last_started_at", sa.DateTime(), nullable=True),
        sa.Column("last_success_at", sa.DateTime(), nullable=True),
        sa.Column("next_run_at", sa.DateTime(), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint(
            "interval_hours >= 24 AND interval_hours <= 720",
            name="ck_research_subscriptions_interval_hours",
        ),
    )
    op.create_index(
        "ix_research_subscriptions_next_run_at",
        "research_subscriptions",
        ["next_run_at"],
    )
    op.create_table(
        "research_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("subscription_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("discovered_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("recommended_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("source_statuses_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("warnings_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("error", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["subscription_id"],
            ["research_subscriptions.id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index("ix_research_runs_subscription_id", "research_runs", ["subscription_id"])
    op.create_table(
        "research_recommendations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("subscription_id", sa.Integer(), nullable=False),
        sa.Column("run_id", sa.Integer(), nullable=True),
        sa.Column("source", sa.String(length=80), nullable=False),
        sa.Column("external_id", sa.String(length=500), nullable=False),
        sa.Column("identity_key", sa.String(length=600), nullable=False),
        sa.Column("paper_snapshot_json", sa.Text(), nullable=False),
        sa.Column("relevance_score", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("read_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["subscription_id"],
            ["research_subscriptions.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["run_id"], ["research_runs.id"], ondelete="SET NULL"),
        sa.UniqueConstraint(
            "subscription_id",
            "identity_key",
            name="uq_research_recommendations_subscription_identity",
        ),
    )
    op.create_index(
        "ix_research_recommendations_subscription_id",
        "research_recommendations",
        ["subscription_id"],
    )
    op.create_index(
        "ix_research_recommendations_run_id",
        "research_recommendations",
        ["run_id"],
    )
    op.create_index(
        "ix_research_recommendations_read_at",
        "research_recommendations",
        ["read_at"],
    )
    op.create_table(
        "research_notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("subscription_id", sa.Integer(), nullable=False),
        sa.Column("run_id", sa.Integer(), nullable=True),
        sa.Column("kind", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("read_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["subscription_id"],
            ["research_subscriptions.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["run_id"], ["research_runs.id"], ondelete="SET NULL"),
    )
    op.create_index(
        "ix_research_notifications_subscription_id",
        "research_notifications",
        ["subscription_id"],
    )
    op.create_index("ix_research_notifications_run_id", "research_notifications", ["run_id"])
    op.create_index(
        "ix_research_notifications_read_at",
        "research_notifications",
        ["read_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_research_notifications_read_at", table_name="research_notifications")
    op.drop_index("ix_research_notifications_run_id", table_name="research_notifications")
    op.drop_index("ix_research_notifications_subscription_id", table_name="research_notifications")
    op.drop_table("research_notifications")
    op.drop_index("ix_research_recommendations_run_id", table_name="research_recommendations")
    op.drop_index("ix_research_recommendations_read_at", table_name="research_recommendations")
    op.drop_index(
        "ix_research_recommendations_subscription_id",
        table_name="research_recommendations",
    )
    op.drop_table("research_recommendations")
    op.drop_index("ix_research_runs_subscription_id", table_name="research_runs")
    op.drop_table("research_runs")
    op.drop_index("ix_research_subscriptions_next_run_at", table_name="research_subscriptions")
    op.drop_table("research_subscriptions")
