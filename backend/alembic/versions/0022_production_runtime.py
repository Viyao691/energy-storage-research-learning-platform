"""persistent production task runtime

Revision ID: 0022
Revises: 0021
"""

from alembic import op
import sqlalchemy as sa


revision = "0022"
down_revision = "0021"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("task_runs") as batch:
        batch.add_column(sa.Column("resource_type", sa.String(80), nullable=True))
        batch.add_column(sa.Column("resource_id", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("queue_job_id", sa.String(100), nullable=True))
        batch.add_column(sa.Column("progress", sa.Float(), nullable=False, server_default="0"))
        batch.add_column(sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"))
        batch.add_column(sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="1"))
        batch.add_column(sa.Column("error_code", sa.String(80), nullable=False, server_default=""))
        batch.add_column(sa.Column("cancel_requested", sa.Boolean(), nullable=False, server_default=sa.false()))
        batch.add_column(sa.Column("started_at", sa.DateTime(), nullable=True))
        batch.add_column(sa.Column("completed_at", sa.DateTime(), nullable=True))
        batch.add_column(sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()))
        batch.create_index("ix_task_runs_status", ["status"])
        batch.create_index("ix_task_runs_resource", ["resource_type", "resource_id"])


def downgrade() -> None:
    with op.batch_alter_table("task_runs") as batch:
        batch.drop_index("ix_task_runs_resource")
        batch.drop_index("ix_task_runs_status")
        for column in ("updated_at", "completed_at", "started_at", "cancel_requested", "error_code", "max_attempts", "attempt_count", "progress", "queue_job_id", "resource_id", "resource_type"):
            batch.drop_column(column)
