"""contest workspace

Revision ID: 0020
Revises: 0019
"""

from alembic import op
import sqlalchemy as sa


revision = "0020"
down_revision = "0019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "contest_projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("competition_name", sa.String(300), nullable=False, server_default=""),
        sa.Column("summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("research_question", sa.Text(), nullable=False, server_default=""),
        sa.Column("innovation", sa.Text(), nullable=False, server_default=""),
        sa.Column("method", sa.Text(), nullable=False, server_default=""),
        sa.Column("evidence", sa.Text(), nullable=False, server_default=""),
        sa.Column("feasibility", sa.Text(), nullable=False, server_default=""),
        sa.Column("expected_outcomes", sa.Text(), nullable=False, server_default=""),
        sa.Column("risks", sa.Text(), nullable=False, server_default=""),
        sa.Column("resources", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "contest_sources",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("contest_projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(500), nullable=False),
        sa.Column("source_type", sa.String(20), nullable=False),
        sa.Column("sha256", sa.String(64), nullable=False),
        sa.Column("file_path", sa.String(1000), nullable=True),
        sa.Column("extracted_text", sa.Text(), nullable=False, server_default=""),
        sa.Column("locators_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("status", sa.String(30), nullable=False, server_default="ready"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("project_id", "sha256", name="uq_contest_sources_project_hash"),
    )
    op.create_index("ix_contest_sources_project_id", "contest_sources", ["project_id"])
    op.create_table(
        "contest_rules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("contest_projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("citations_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_contest_rules_project_id", "contest_rules", ["project_id"])
    op.create_table(
        "contest_rubric_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("contest_projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("weight", sa.Float(), nullable=True),
        sa.Column("citations_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_contest_rubric_items_project_id", "contest_rubric_items", ["project_id"])
    op.create_table(
        "contest_milestones",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("contest_projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("source", sa.String(20), nullable=False, server_default="manual"),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_contest_milestones_project_id", "contest_milestones", ["project_id"])
    op.create_table(
        "contest_rubric_checks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("contest_projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rubric_item_id", sa.Integer(), sa.ForeignKey("contest_rubric_items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("evidence_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("questions_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_contest_rubric_checks_project_id", "contest_rubric_checks", ["project_id"])
    op.create_table(
        "contest_defense_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("contest_projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("mode", sa.String(20), nullable=False, server_default="text"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_contest_defense_sessions_project_id", "contest_defense_sessions", ["project_id"])
    op.create_table(
        "contest_defense_turns",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("session_id", sa.Integer(), sa.ForeignKey("contest_defense_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False, server_default=""),
        sa.Column("feedback", sa.Text(), nullable=False, server_default=""),
        sa.Column("audio_file_path", sa.String(1000), nullable=True),
        sa.Column("transcript", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_contest_defense_turns_session_id", "contest_defense_turns", ["session_id"])


def downgrade() -> None:
    for table in (
        "contest_defense_turns",
        "contest_defense_sessions",
        "contest_rubric_checks",
        "contest_milestones",
        "contest_rubric_items",
        "contest_rules",
        "contest_sources",
        "contest_projects",
    ):
        op.drop_table(table)
