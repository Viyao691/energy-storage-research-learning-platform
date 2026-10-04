"""add deterministic learning review states

Revision ID: 0017
Revises: 0016
"""

from alembic import op
import sqlalchemy as sa


revision = "0017"
down_revision = "0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "learning_review_states",
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
        sa.Column("last_rating", sa.String(20), nullable=False),
        sa.Column("next_review_date", sa.Date(), nullable=False),
        sa.Column("review_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("lapse_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_paused", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("last_reviewed_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint(
            "last_rating IN ('不会', '模糊', '基本掌握', '已掌握')",
            name="ck_learning_review_states_rating",
        ),
        sa.CheckConstraint("review_count >= 1", name="ck_learning_review_states_review_count"),
        sa.CheckConstraint("lapse_count >= 0", name="ck_learning_review_states_lapse_count"),
        sa.UniqueConstraint("card_id", name="uq_learning_review_states_card_id"),
    )
    op.create_index(
        "ix_learning_review_states_pack_id",
        "learning_review_states",
        ["pack_id"],
    )
    op.create_index(
        "ix_learning_review_states_next_review_date",
        "learning_review_states",
        ["next_review_date"],
    )


def downgrade() -> None:
    op.drop_index("ix_learning_review_states_next_review_date", table_name="learning_review_states")
    op.drop_index("ix_learning_review_states_pack_id", table_name="learning_review_states")
    op.drop_table("learning_review_states")
