"""add Phase 2 paper-search metadata and source records

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-27

Downgrade note: metadata-only papers have NULL legacy file fields and cannot be
represented by revision 0002. Downgrade therefore deletes those papers and
their notes, analyses, and source records before restoring the legacy NOT NULL
constraints.
"""

import unicodedata

from alembic import op
import sqlalchemy as sa


revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def _normalize_title(value: object | None) -> str:
    """Keep this historical data transform independent from application code."""
    if not isinstance(value, str):
        return ""
    normalized = unicodedata.normalize("NFKC", value).strip().lower()
    without_punctuation = "".join(
        " " if unicodedata.category(character)[0] in {"P", "S"} else character
        for character in normalized
    )
    return " ".join(without_punctuation.split())


def upgrade() -> None:
    with op.batch_alter_table("papers", recreate="always") as batch:
        batch.alter_column(
            "original_filename",
            existing_type=sa.String(length=255),
            nullable=True,
        )
        batch.alter_column(
            "file_path",
            existing_type=sa.String(length=1000),
            nullable=True,
        )
        batch.alter_column(
            "file_hash",
            existing_type=sa.String(length=64),
            nullable=True,
        )
        batch.add_column(sa.Column("doi", sa.String(length=255), nullable=True))
        batch.add_column(sa.Column("arxiv_id", sa.String(length=100), nullable=True))
        batch.add_column(
            sa.Column(
                "normalized_title",
                sa.String(length=500),
                nullable=False,
                server_default="",
            )
        )
        batch.add_column(
            sa.Column(
                "authors_json",
                sa.Text(),
                nullable=False,
                server_default="[]",
            )
        )
        batch.add_column(
            sa.Column("abstract", sa.Text(), nullable=False, server_default="")
        )
        batch.add_column(
            sa.Column(
                "journal",
                sa.String(length=500),
                nullable=False,
                server_default="",
            )
        )
        batch.add_column(
            sa.Column("published_date", sa.String(length=32), nullable=True)
        )
        batch.add_column(
            sa.Column(
                "keywords_json",
                sa.Text(),
                nullable=False,
                server_default="[]",
            )
        )
        batch.add_column(
            sa.Column(
                "landing_url",
                sa.String(length=1000),
                nullable=False,
                server_default="",
            )
        )
        batch.add_column(
            sa.Column("pdf_url", sa.String(length=1000), nullable=True)
        )
        batch.add_column(
            sa.Column(
                "oa_status",
                sa.String(length=50),
                nullable=False,
                server_default="unknown",
            )
        )
        batch.add_column(
            sa.Column("license", sa.String(length=255), nullable=True)
        )
        batch.add_column(
            sa.Column(
                "source_type",
                sa.String(length=80),
                nullable=False,
                server_default="upload",
            )
        )
        batch.add_column(
            sa.Column(
                "acquisition_status",
                sa.String(length=50),
                nullable=False,
                server_default="fulltext",
            )
        )

    connection = op.get_bind()
    rows = connection.execute(
        sa.text("SELECT id, title FROM papers WHERE normalized_title = ''")
    ).mappings()
    updates = [
        {
            "paper_id": row["id"],
            "normalized_title": _normalize_title(row["title"]),
        }
        for row in rows
    ]
    if updates:
        connection.execute(
            sa.text(
                """
                UPDATE papers
                SET normalized_title = :normalized_title
                WHERE id = :paper_id
                """
            ),
            updates,
        )

    op.create_index("ix_papers_doi", "papers", ["doi"], unique=True)
    op.create_index("ix_papers_arxiv_id", "papers", ["arxiv_id"], unique=True)
    op.create_index(
        "ix_papers_normalized_title",
        "papers",
        ["normalized_title"],
        unique=False,
    )

    op.create_table(
        "paper_source_records",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("paper_id", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(length=80), nullable=False),
        sa.Column("external_id", sa.String(length=500), nullable=False),
        sa.Column(
            "landing_url",
            sa.String(length=1000),
            nullable=False,
            server_default="",
        ),
        sa.Column("pdf_url", sa.String(length=1000), nullable=True),
        sa.Column(
            "is_open_access",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column("license", sa.String(length=255), nullable=True),
        sa.Column(
            "raw_metadata_json",
            sa.Text(),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(
            ["paper_id"],
            ["papers.id"],
            name="fk_paper_source_records_paper_id_papers",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_paper_source_records"),
        sa.UniqueConstraint(
            "source",
            "external_id",
            name="uq_paper_source_records_source_external_id",
        ),
    )
    op.create_index(
        "ix_paper_source_records_paper_id",
        "paper_source_records",
        ["paper_id"],
        unique=False,
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            DELETE FROM notes
            WHERE paper_id IN (
                SELECT id
                FROM papers
                WHERE original_filename IS NULL
                   OR file_path IS NULL
                   OR file_hash IS NULL
            )
            """
        )
    )
    op.execute(
        sa.text(
            """
            DELETE FROM analyses
            WHERE paper_id IN (
                SELECT id
                FROM papers
                WHERE original_filename IS NULL
                   OR file_path IS NULL
                   OR file_hash IS NULL
            )
            """
        )
    )
    op.execute(
        sa.text(
            """
            DELETE FROM paper_source_records
            WHERE paper_id IN (
                SELECT id
                FROM papers
                WHERE original_filename IS NULL
                   OR file_path IS NULL
                   OR file_hash IS NULL
            )
            """
        )
    )
    op.execute(
        sa.text(
            """
            DELETE FROM papers
            WHERE original_filename IS NULL
               OR file_path IS NULL
               OR file_hash IS NULL
            """
        )
    )

    op.drop_index(
        "ix_paper_source_records_paper_id",
        table_name="paper_source_records",
    )
    op.drop_table("paper_source_records")

    op.drop_index("ix_papers_normalized_title", table_name="papers")
    op.drop_index("ix_papers_arxiv_id", table_name="papers")
    op.drop_index("ix_papers_doi", table_name="papers")

    with op.batch_alter_table("papers", recreate="always") as batch:
        batch.drop_column("acquisition_status")
        batch.drop_column("source_type")
        batch.drop_column("license")
        batch.drop_column("oa_status")
        batch.drop_column("pdf_url")
        batch.drop_column("landing_url")
        batch.drop_column("keywords_json")
        batch.drop_column("published_date")
        batch.drop_column("journal")
        batch.drop_column("abstract")
        batch.drop_column("authors_json")
        batch.drop_column("normalized_title")
        batch.drop_column("arxiv_id")
        batch.drop_column("doi")
        batch.alter_column(
            "file_hash",
            existing_type=sa.String(length=64),
            nullable=False,
        )
        batch.alter_column(
            "file_path",
            existing_type=sa.String(length=1000),
            nullable=False,
        )
        batch.alter_column(
            "original_filename",
            existing_type=sa.String(length=255),
            nullable=False,
        )
