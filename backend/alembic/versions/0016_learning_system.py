"""add phase 5a learning system

Revision ID: 0016
Revises: 0015
"""

from alembic import op
import sqlalchemy as sa

revision = "0016"
down_revision = "0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "learning_packs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("learning_goal", sa.Text(), nullable=False, server_default=""),
        sa.Column("cards_status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("quiz_status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("cards_prompt_version", sa.String(80), nullable=False, server_default="learning-cards-v1"),
        sa.Column("cards_schema_version", sa.String(80), nullable=False, server_default="learning-cards-schema-v1"),
        sa.Column("quiz_prompt_version", sa.String(80), nullable=False, server_default="learning-quiz-v1"),
        sa.Column("quiz_schema_version", sa.String(80), nullable=False, server_default="learning-quiz-schema-v1"),
        sa.Column("provider", sa.String(80), nullable=False, server_default=""),
        sa.Column("model_name", sa.String(200), nullable=False, server_default=""),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("cards_started_at", sa.DateTime(), nullable=True),
        sa.Column("quiz_started_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "learning_pack_sources",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pack_id", sa.Integer(), sa.ForeignKey("learning_packs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("paper_id", sa.Integer(), sa.ForeignKey("papers.id", ondelete="SET NULL"), nullable=True),
        sa.Column("paper_title", sa.String(500), nullable=False),
        sa.Column("available_reports_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("analysis_versions_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("analysis_hash", sa.String(64), nullable=False, server_default=""),
        sa.Column("evidence_scope", sa.String(50), nullable=False, server_default="fulltext"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("pack_id", "paper_id", name="uq_learning_pack_sources_pack_paper"),
    )
    op.create_index("ix_learning_pack_sources_pack_id", "learning_pack_sources", ["pack_id"])
    op.create_index("ix_learning_pack_sources_paper_id", "learning_pack_sources", ["paper_id"])
    op.create_table(
        "learning_cards",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pack_id", sa.Integer(), sa.ForeignKey("learning_packs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("concept", sa.String(200), nullable=False),
        sa.Column("generated_content", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("importance", sa.Text(), nullable=False, server_default=""),
        sa.Column("common_mistake", sa.Text(), nullable=False, server_default=""),
        sa.Column("evidence_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("is_user_edited", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("mastery_status", sa.String(20), nullable=False, server_default="未学习"),
        sa.Column("mastery_confirmed_at", sa.DateTime(), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_learning_cards_pack_id", "learning_cards", ["pack_id"])
    op.create_table(
        "learning_questions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pack_id", sa.Integer(), sa.ForeignKey("learning_packs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_type", sa.String(20), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("options_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("correct_answer", sa.Text(), nullable=False, server_default=""),
        sa.Column("explanation", sa.Text(), nullable=False, server_default=""),
        sa.Column("reference_points_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("related_card_ids_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("evidence_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_learning_questions_pack_id", "learning_questions", ["pack_id"])
    op.create_table(
        "learning_attempts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("question_id", sa.Integer(), sa.ForeignKey("learning_questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("result", sa.String(30), nullable=True),
        sa.Column("self_rating", sa.String(20), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_learning_attempts_question_id", "learning_attempts", ["question_id"])
    op.create_table(
        "learning_weaknesses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pack_id", sa.Integer(), sa.ForeignKey("learning_packs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("card_id", sa.Integer(), sa.ForeignKey("learning_cards.id", ondelete="SET NULL"), nullable=True),
        sa.Column("concept", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("source", sa.String(20), nullable=False, server_default="manual"),
        sa.Column("occurrence_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("recurrence_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_resolved", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_learning_weaknesses_pack_id", "learning_weaknesses", ["pack_id"])
    op.create_table(
        "learning_plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pack_id", sa.Integer(), sa.ForeignKey("learning_packs.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("weekdays_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_learning_plans_pack_id", "learning_plans", ["pack_id"], unique=True)
    op.create_table(
        "learning_plan_tasks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("plan_id", sa.Integer(), sa.ForeignKey("learning_plans.id", ondelete="CASCADE"), nullable=False),
        sa.Column("task_date", sa.Date(), nullable=False),
        sa.Column("task_type", sa.String(20), nullable=False),
        sa.Column("card_id", sa.Integer(), sa.ForeignKey("learning_cards.id", ondelete="SET NULL"), nullable=True),
        sa.Column("question_id", sa.Integer(), sa.ForeignKey("learning_questions.id", ondelete="SET NULL"), nullable=True),
        sa.Column("weakness_id", sa.Integer(), sa.ForeignKey("learning_weaknesses.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_learning_plan_tasks_plan_id", "learning_plan_tasks", ["plan_id"])
    op.create_index("ix_learning_plan_tasks_task_date", "learning_plan_tasks", ["task_date"])


def downgrade() -> None:
    for table in ("learning_plan_tasks", "learning_plans", "learning_weaknesses", "learning_attempts", "learning_questions", "learning_cards", "learning_pack_sources", "learning_packs"):
        op.drop_table(table)
