"""complete learning lifecycle, review history, quiz and feedback storage

Revision ID: 0018
Revises: 0017
"""

from alembic import op
import sqlalchemy as sa


revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("learning_packs", sa.Column("lineage_id", sa.String(64), nullable=True))
    op.add_column(
        "learning_packs",
        sa.Column("version_number", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column(
        "learning_packs",
        sa.Column("lifecycle_status", sa.String(20), nullable=False, server_default="active"),
    )
    op.add_column("learning_packs", sa.Column("archived_at", sa.DateTime(), nullable=True))
    op.execute("UPDATE learning_packs SET lineage_id = 'legacy-pack-' || CAST(id AS TEXT)")
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        op.execute(
            "CREATE TRIGGER ck_learning_packs_lifecycle_insert "
            "BEFORE INSERT ON learning_packs FOR EACH ROW "
            "WHEN NEW.lineage_id IS NULL OR NEW.lifecycle_status NOT IN ('active','draft','archived') "
            "BEGIN SELECT RAISE(ABORT, 'invalid learning pack lifecycle'); END"
        )
        op.execute(
            "CREATE TRIGGER ck_learning_packs_lifecycle_update "
            "BEFORE UPDATE OF lineage_id,lifecycle_status ON learning_packs FOR EACH ROW "
            "WHEN NEW.lineage_id IS NULL OR NEW.lifecycle_status NOT IN ('active','draft','archived') "
            "BEGIN SELECT RAISE(ABORT, 'invalid learning pack lifecycle'); END"
        )
    else:
        op.alter_column("learning_packs", "lineage_id", existing_type=sa.String(64), nullable=False)
        op.create_check_constraint(
            "ck_learning_packs_lifecycle_status",
            "learning_packs",
            "lifecycle_status IN ('active', 'draft', 'archived')",
        )
    op.create_index(
        "uq_learning_packs_lineage_version",
        "learning_packs",
        ["lineage_id", "version_number"],
        unique=True,
    )
    op.create_index(
        "uq_learning_packs_active_lineage",
        "learning_packs",
        ["lineage_id"],
        unique=True,
        sqlite_where=sa.text("lifecycle_status = 'active'"),
        postgresql_where=sa.text("lifecycle_status = 'active'"),
    )

    op.create_table(
        "learning_review_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "pack_id",
            sa.Integer(),
            sa.ForeignKey("learning_packs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "card_id",
            sa.Integer(),
            sa.ForeignKey("learning_cards.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("rating", sa.String(20), nullable=False),
        sa.Column("next_review_date", sa.Date(), nullable=False),
        sa.Column("is_lapse", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("resulting_mastery", sa.String(20), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint(
            "rating IN ('不会', '模糊', '基本掌握', '已掌握')",
            name="ck_learning_review_events_rating",
        ),
    )
    op.create_index("ix_learning_review_events_pack_id", "learning_review_events", ["pack_id"])
    op.create_index("ix_learning_review_events_card_id", "learning_review_events", ["card_id"])
    op.create_index("ix_learning_review_events_reviewed_at", "learning_review_events", ["reviewed_at"])

    op.add_column(
        "learning_questions",
        sa.Column("accepted_answers_json", sa.Text(), nullable=False, server_default="[]"),
    )
    op.add_column(
        "learning_attempts",
        sa.Column("feedback_markdown", sa.Text(), nullable=False, server_default=""),
    )
    op.add_column(
        "learning_attempts",
        sa.Column("feedback_provider", sa.String(80), nullable=False, server_default=""),
    )
    op.add_column(
        "learning_attempts",
        sa.Column("feedback_model_name", sa.String(200), nullable=False, server_default=""),
    )
    op.add_column(
        "learning_attempts",
        sa.Column("feedback_prompt_version", sa.String(80), nullable=False, server_default=""),
    )
    op.add_column(
        "learning_attempts",
        sa.Column("feedback_evidence_status", sa.String(50), nullable=False, server_default=""),
    )
    op.add_column("learning_attempts", sa.Column("feedback_generated_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    for column in (
        "feedback_generated_at",
        "feedback_evidence_status",
        "feedback_prompt_version",
        "feedback_model_name",
        "feedback_provider",
        "feedback_markdown",
    ):
        op.drop_column("learning_attempts", column)
    op.drop_column("learning_questions", "accepted_answers_json")
    op.drop_index("ix_learning_review_events_reviewed_at", table_name="learning_review_events")
    op.drop_index("ix_learning_review_events_card_id", table_name="learning_review_events")
    op.drop_index("ix_learning_review_events_pack_id", table_name="learning_review_events")
    op.drop_table("learning_review_events")
    op.drop_index("uq_learning_packs_active_lineage", table_name="learning_packs")
    op.drop_index("uq_learning_packs_lineage_version", table_name="learning_packs")
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        op.execute("DROP TRIGGER ck_learning_packs_lifecycle_update")
        op.execute("DROP TRIGGER ck_learning_packs_lifecycle_insert")
    else:
        op.drop_constraint(
            "ck_learning_packs_lifecycle_status", "learning_packs", type_="check"
        )
    op.drop_column("learning_packs", "archived_at")
    op.drop_column("learning_packs", "lifecycle_status")
    op.drop_column("learning_packs", "version_number")
    op.drop_column("learning_packs", "lineage_id")
