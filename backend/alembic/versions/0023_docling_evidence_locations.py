"""Docling candidate provenance and evidence locations.

Revision ID: 0023
Revises: 0022
"""

from alembic import op
import sqlalchemy as sa


revision = "0023"
down_revision = "0022"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("paper_parse_runs") as batch:
        batch.add_column(
            sa.Column("engine_version", sa.String(80), nullable=False, server_default="")
        )
        batch.add_column(sa.Column("comparison_viewed_at", sa.DateTime(), nullable=True))
        batch.add_column(sa.Column("comparison_active_parse_run_id", sa.Integer(), nullable=True))
    with op.batch_alter_table("paper_page_extractions") as batch:
        batch.add_column(sa.Column("page_width", sa.Float(), nullable=True))
        batch.add_column(sa.Column("page_height", sa.Float(), nullable=True))
    with op.batch_alter_table("paper_chunks") as batch:
        batch.add_column(sa.Column("parse_run_id", sa.Integer(), nullable=True))
        batch.add_column(
            sa.Column("source_locations_json", sa.Text(), nullable=False, server_default="[]")
        )
        batch.create_foreign_key(
            "fk_paper_chunks_parse_run_id_paper_parse_runs",
            "paper_parse_runs",
            ["parse_run_id"],
            ["id"],
            ondelete="SET NULL",
        )
        batch.create_index("ix_paper_chunks_parse_run_id", ["parse_run_id"])


def downgrade() -> None:
    with op.batch_alter_table("paper_chunks") as batch:
        batch.drop_index("ix_paper_chunks_parse_run_id")
        batch.drop_constraint(
            "fk_paper_chunks_parse_run_id_paper_parse_runs", type_="foreignkey"
        )
        batch.drop_column("source_locations_json")
        batch.drop_column("parse_run_id")
    with op.batch_alter_table("paper_page_extractions") as batch:
        batch.drop_column("page_height")
        batch.drop_column("page_width")
    with op.batch_alter_table("paper_parse_runs") as batch:
        batch.drop_column("comparison_viewed_at")
        batch.drop_column("comparison_active_parse_run_id")
        batch.drop_column("engine_version")
