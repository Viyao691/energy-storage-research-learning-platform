"""document intelligence OCR and scientific analysis storage

Revision ID: 0019
Revises: 0018
"""

from alembic import op
import sqlalchemy as sa


revision = "0019"
down_revision = "0018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("papers", sa.Column("active_parse_run_id", sa.Integer(), nullable=True))
    op.add_column("papers", sa.Column("ocr_file_path", sa.String(1000), nullable=True))
    op.add_column("papers", sa.Column("knowledge_index_stale", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("analyses", sa.Column("source_parse_run_id", sa.Integer(), nullable=True))
    op.add_column("analyses", sa.Column("is_stale", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("analyses", sa.Column("stale_reason", sa.Text(), nullable=False, server_default=""))
    op.add_column("user_settings", sa.Column("document_vision_provider", sa.String(80), nullable=False, server_default="mock"))
    op.add_column("user_settings", sa.Column("document_vision_model", sa.String(200), nullable=False, server_default=""))
    op.add_column("user_settings", sa.Column("document_vision_base_url", sa.String(500), nullable=False, server_default=""))
    op.add_column("user_settings", sa.Column("document_vision_timeout_seconds", sa.Integer(), nullable=False, server_default="90"))

    op.create_table(
        "paper_parse_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("paper_id", sa.Integer(), sa.ForeignKey("papers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("mode", sa.String(20), nullable=False, server_default="auto"),
        sa.Column("status", sa.String(20), nullable=False, server_default="queued"),
        sa.Column("engine", sa.String(80), nullable=False, server_default="pymupdf+pp-structurev3"),
        sa.Column("device", sa.String(20), nullable=False, server_default="cpu"),
        sa.Column("progress", sa.Float(), nullable=False, server_default="0"),
        sa.Column("quality_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("source_quality_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("derivative_file_path", sa.String(1000), nullable=True),
        sa.Column("warnings_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("error_message", sa.Text(), nullable=False, server_default=""),
        sa.Column("cancel_requested", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint("status IN ('queued','running','completed','failed','cancelled')", name="ck_paper_parse_runs_status"),
        sa.UniqueConstraint("paper_id", "version_number", name="uq_paper_parse_runs_version"),
    )
    op.create_index("ix_paper_parse_runs_paper_id", "paper_parse_runs", ["paper_id"])
    op.create_index("ix_paper_parse_runs_status", "paper_parse_runs", ["status"])
    op.create_table(
        "paper_page_extractions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("parse_run_id", sa.Integer(), sa.ForeignKey("paper_parse_runs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("paper_id", sa.Integer(), sa.ForeignKey("papers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=False),
        sa.Column("source_type", sa.String(30), nullable=False),
        sa.Column("text", sa.Text(), nullable=False, server_default=""),
        sa.Column("layout_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("tables_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("formulas_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("figures_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("coordinates_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0"),
        sa.Column("confirmation_status", sa.String(20), nullable=False, server_default="not_required"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("parse_run_id", "page_number", name="uq_page_extractions_run_page"),
    )
    op.create_index("ix_paper_page_extractions_parse_run_id", "paper_page_extractions", ["parse_run_id"])
    op.create_index("ix_paper_page_extractions_paper_id", "paper_page_extractions", ["paper_id"])
    op.create_table(
        "scientific_datasets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("paper_id", sa.Integer(), sa.ForeignKey("papers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("parse_run_id", sa.Integer(), sa.ForeignKey("paper_parse_runs.id", ondelete="SET NULL"), nullable=True),
        sa.Column("visual_id", sa.Integer(), sa.ForeignKey("paper_visuals.id", ondelete="SET NULL"), nullable=True),
        sa.Column("crop_id", sa.Integer(), sa.ForeignKey("paper_visual_crops.id", ondelete="SET NULL"), nullable=True),
        sa.Column("source_type", sa.String(30), nullable=False),
        sa.Column("domain", sa.String(50), nullable=False),
        sa.Column("dataset_type", sa.String(80), nullable=False),
        sa.Column("data_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("units_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("parameters_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("revision_history_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0"),
        sa.Column("confirmation_status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("is_stale", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_scientific_datasets_paper_id", "scientific_datasets", ["paper_id"])
    op.create_table(
        "scientific_analysis_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("dataset_id", sa.Integer(), sa.ForeignKey("scientific_datasets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("recipe_key", sa.String(100), nullable=False),
        sa.Column("parameters_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("algorithm_version", sa.String(50), nullable=False),
        sa.Column("results_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("diagnostics_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("report_markdown", sa.Text(), nullable=False, server_default=""),
        sa.Column("artifacts_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("status", sa.String(20), nullable=False, server_default="queued"),
        sa.Column("is_stale", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("error_message", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_scientific_analysis_runs_dataset_id", "scientific_analysis_runs", ["dataset_id"])


def downgrade() -> None:
    op.drop_table("scientific_analysis_runs")
    op.drop_table("scientific_datasets")
    op.drop_table("paper_page_extractions")
    op.drop_table("paper_parse_runs")
    for table, columns in (
        ("user_settings", ["document_vision_timeout_seconds", "document_vision_base_url", "document_vision_model", "document_vision_provider"]),
        ("analyses", ["stale_reason", "is_stale", "source_parse_run_id"]),
        ("papers", ["knowledge_index_stale", "ocr_file_path", "active_parse_run_id"]),
    ):
        for column in columns:
            op.drop_column(table, column)
