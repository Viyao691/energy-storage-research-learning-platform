"""independent research data, ideas, experiment checks and exports

Revision ID: 0021
Revises: 0020
"""

from alembic import op
import sqlalchemy as sa


revision = "0021"
down_revision = "0020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "scientific_imports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("original_filename", sa.String(500), nullable=False),
        sa.Column("file_path", sa.String(1000), nullable=False),
        sa.Column("sha256", sa.String(64), nullable=False, unique=True),
        sa.Column("file_format", sa.String(20), nullable=False),
        sa.Column("available_sheets_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("selected_sheet", sa.String(300), nullable=True),
        sa.Column("row_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("column_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("column_types_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("missing_values_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("preview_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("status", sa.String(30), nullable=False, server_default="preview"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "research_ideas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("source_mode", sa.String(30), nullable=False, server_default="user"),
        sa.Column("selected_paper_ids_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("selected_dataset_ids_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("hypothesis", sa.Text(), nullable=False, server_default=""),
        sa.Column("evidence", sa.Text(), nullable=False, server_default=""),
        sa.Column("novelty", sa.Text(), nullable=False, server_default=""),
        sa.Column("falsification", sa.Text(), nullable=False, server_default=""),
        sa.Column("feasibility", sa.Text(), nullable=False, server_default=""),
        sa.Column("resources", sa.Text(), nullable=False, server_default=""),
        sa.Column("evidence_gaps", sa.Text(), nullable=False, server_default=""),
        sa.Column("ai_review", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "experiment_designs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("idea_id", sa.Integer(), sa.ForeignKey("research_ideas.id", ondelete="SET NULL"), nullable=True),
        sa.Column("contest_project_id", sa.Integer(), sa.ForeignKey("contest_projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("variables", sa.Text(), nullable=False, server_default=""),
        sa.Column("controls", sa.Text(), nullable=False, server_default=""),
        sa.Column("replication", sa.Text(), nullable=False, server_default=""),
        sa.Column("randomization", sa.Text(), nullable=False, server_default=""),
        sa.Column("measurement", sa.Text(), nullable=False, server_default=""),
        sa.Column("statistics", sa.Text(), nullable=False, server_default=""),
        sa.Column("stopping_criteria", sa.Text(), nullable=False, server_default=""),
        sa.Column("resources", sa.Text(), nullable=False, server_default=""),
        sa.Column("risks", sa.Text(), nullable=False, server_default=""),
        sa.Column("deterministic_findings_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("ai_review", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "research_exports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("export_type", sa.String(20), nullable=False),
        sa.Column("selected_paper_ids_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("selected_dataset_ids_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("selected_analysis_ids_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("markdown", sa.Text(), nullable=False, server_default=""),
        sa.Column("file_path", sa.String(1000), nullable=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="completed"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    with op.batch_alter_table("scientific_datasets") as batch:
        batch.alter_column("paper_id", existing_type=sa.Integer(), nullable=True)
        batch.add_column(sa.Column("name", sa.String(500), nullable=False, server_default="未命名数据集"))
        batch.add_column(sa.Column("import_id", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("idea_id", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("contest_project_id", sa.Integer(), nullable=True))
        batch.create_foreign_key("fk_scientific_datasets_import", "scientific_imports", ["import_id"], ["id"], ondelete="SET NULL")
        batch.create_foreign_key("fk_scientific_datasets_idea", "research_ideas", ["idea_id"], ["id"], ondelete="SET NULL")
        batch.create_foreign_key("fk_scientific_datasets_contest", "contest_projects", ["contest_project_id"], ["id"], ondelete="SET NULL")


def downgrade() -> None:
    with op.batch_alter_table("scientific_datasets") as batch:
        batch.drop_constraint("fk_scientific_datasets_contest", type_="foreignkey")
        batch.drop_constraint("fk_scientific_datasets_idea", type_="foreignkey")
        batch.drop_constraint("fk_scientific_datasets_import", type_="foreignkey")
        batch.drop_column("contest_project_id")
        batch.drop_column("idea_id")
        batch.drop_column("import_id")
        batch.drop_column("name")
        batch.alter_column("paper_id", existing_type=sa.Integer(), nullable=False)
    op.drop_table("research_exports")
    op.drop_table("experiment_designs")
    op.drop_table("research_ideas")
    op.drop_table("scientific_imports")
