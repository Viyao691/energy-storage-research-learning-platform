"""Copy a test SQLite database into an empty PostgreSQL database and verify it."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from contextlib import contextmanager

from alembic import command
from alembic.config import Config
from sqlalchemy import MetaData, create_engine, func, select, text

from app.config import reset_settings_cache


@contextmanager
def _database_environment(url: str):
    previous = os.environ.get("DATABASE_URL")
    os.environ["DATABASE_URL"] = url
    reset_settings_cache()
    try:
        yield
    finally:
        if previous is None: os.environ.pop("DATABASE_URL", None)
        else: os.environ["DATABASE_URL"] = previous
        reset_settings_cache()


def _row_hash(rows: list[dict[str, object]]) -> str:
    payload = json.dumps(rows, ensure_ascii=False, sort_keys=True, default=str, separators=(",", ":"))
    return hashlib.sha256(payload.encode()).hexdigest()


def migrate(source_url: str, target_url: str) -> dict[str, dict[str, object]]:
    if not source_url.startswith("sqlite"):
        raise ValueError("source must be SQLite")
    if not target_url.startswith("postgresql"):
        raise ValueError("target must be PostgreSQL")
    with _database_environment(target_url):
        command.upgrade(Config("alembic.ini"), "head")
    source_engine, target_engine = create_engine(source_url), create_engine(target_url)
    source_meta, target_meta = MetaData(), MetaData()
    source_meta.reflect(bind=source_engine); target_meta.reflect(bind=target_engine)
    report: dict[str, dict[str, object]] = {}
    try:
        with source_engine.connect() as source, target_engine.begin() as target:
            for table in target_meta.sorted_tables:
                if table.name == "alembic_version": continue
                existing = target.scalar(select(func.count()).select_from(table)) or 0
                if existing: raise RuntimeError(f"target table is not empty: {table.name}")
            for source_table in source_meta.sorted_tables:
                if source_table.name == "alembic_version" or source_table.name not in target_meta.tables: continue
                target_table = target_meta.tables[source_table.name]
                columns = [column.name for column in target_table.columns if column.name in source_table.c]
                rows = [dict(row._mapping) for row in source.execute(select(*[source_table.c[name] for name in columns]).order_by(*[source_table.c[name] for name in source_table.primary_key.columns]))]
                for offset in range(0, len(rows), 500):
                    if rows[offset:offset + 500]: target.execute(target_table.insert(), rows[offset:offset + 500])
                report[source_table.name] = {"count": len(rows), "sha256": _row_hash(rows)}
            for table in target_meta.sorted_tables:
                if "id" in table.c:
                    target.execute(text("SELECT setval(pg_get_serial_sequence(:table, 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM " + f'"{table.name}"'), {"table": table.name})
        with target_engine.connect() as target:
            for table_name, expected in report.items():
                table = target_meta.tables[table_name]
                columns = [column.name for column in table.columns]
                rows = [dict(row._mapping) for row in target.execute(select(*[table.c[name] for name in columns]).order_by(*[table.c[name] for name in table.primary_key.columns]))]
                if len(rows) != expected["count"] or _row_hash(rows) != expected["sha256"]:
                    raise RuntimeError(f"verification failed: {table_name}")
            target.execute(text("SET CONSTRAINTS ALL IMMEDIATE"))
    finally:
        source_engine.dispose(); target_engine.dispose()
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True)
    parser.add_argument("--target", required=True)
    parser.add_argument("--confirm-test-copy", action="store_true")
    args = parser.parse_args()
    if not args.confirm_test_copy: raise SystemExit("Refusing to copy without --confirm-test-copy")
    report = migrate(args.source, args.target)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
