"""initial Phase 1 schema

Revision ID: 0001
Revises:
Create Date: 2026-07-26
"""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("papers", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("original_filename", sa.String(255), nullable=False), sa.Column("title", sa.String(500), nullable=False), sa.Column("file_path", sa.String(1000), nullable=False), sa.Column("file_hash", sa.String(64), nullable=False), sa.Column("file_size", sa.Integer(), nullable=False), sa.Column("page_count", sa.Integer(), nullable=False), sa.Column("extracted_text", sa.Text(), nullable=False), sa.Column("parse_confidence", sa.Float(), nullable=False), sa.Column("extraction_warning", sa.Text(), nullable=True), sa.Column("fulltext_status", sa.String(50), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_papers_file_hash", "papers", ["file_hash"], unique=True)
    op.create_table("analyses", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("paper_id", sa.Integer(), nullable=False), sa.Column("summary", sa.Text(), nullable=False), sa.Column("plain_explanation", sa.Text(), nullable=False), sa.Column("deep_analysis", sa.Text(), nullable=False), sa.Column("evidence_status", sa.String(80), nullable=False), sa.Column("provider", sa.String(80), nullable=False), sa.Column("model_name", sa.String(200), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_analyses_paper_id", "analyses", ["paper_id"], unique=True)
    op.create_table("notes", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("paper_id", sa.Integer(), nullable=False), sa.Column("content", sa.Text(), nullable=False), sa.Column("updated_at", sa.DateTime(), nullable=False))
    op.create_index("ix_notes_paper_id", "notes", ["paper_id"], unique=True)
    op.create_table("user_settings", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("model_provider", sa.String(80), nullable=False), sa.Column("model_name", sa.String(200), nullable=False), sa.Column("model_base_url", sa.String(500), nullable=False), sa.Column("timeout_seconds", sa.Integer(), nullable=False), sa.Column("backup_model", sa.String(200), nullable=False), sa.Column("paper_budget", sa.Float(), nullable=False), sa.Column("daily_budget", sa.Float(), nullable=False), sa.Column("monthly_budget", sa.Float(), nullable=False), sa.Column("onboarding_completed", sa.Boolean(), nullable=False), sa.Column("study_mode", sa.String(100), nullable=False), sa.Column("research_topics", sa.Text(), nullable=False), sa.Column("keywords", sa.Text(), nullable=False), sa.Column("daily_task_time", sa.String(20), nullable=False))
    op.create_table("task_runs", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("task_name", sa.String(100), nullable=False), sa.Column("status", sa.String(50), nullable=False), sa.Column("detail", sa.Text(), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False))


def downgrade() -> None:
    op.drop_table("task_runs")
    op.drop_table("user_settings")
    op.drop_index("ix_notes_paper_id", table_name="notes"); op.drop_table("notes")
    op.drop_index("ix_analyses_paper_id", table_name="analyses"); op.drop_table("analyses")
    op.drop_index("ix_papers_file_hash", table_name="papers"); op.drop_table("papers")
