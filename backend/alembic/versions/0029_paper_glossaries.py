"""Persist generated paper glossary lists."""
from alembic import op
import sqlalchemy as sa
revision = "0029"
down_revision = "0028"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table("paper_glossaries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("paper_id", sa.Integer(), sa.ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("response_json", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False))

def downgrade() -> None:
    op.drop_table("paper_glossaries")
