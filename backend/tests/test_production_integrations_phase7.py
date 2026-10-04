from __future__ import annotations

import os

import pytest
from sqlalchemy import create_engine, inspect, text


@pytest.mark.skipif(not os.getenv("POSTGRES_TEST_URL"), reason="POSTGRES_TEST_URL not configured")
def test_postgres_migrations_reach_phase7_head() -> None:
    engine = create_engine(os.environ["POSTGRES_TEST_URL"])
    try:
        tables = set(inspect(engine).get_table_names())
        assert {"contest_projects", "scientific_imports", "research_ideas", "task_runs"}.issubset(tables)
        with engine.connect() as connection:
            assert connection.scalar(text("SELECT version_num FROM alembic_version")) == "0022"
    finally:
        engine.dispose()


@pytest.mark.skipif(not os.getenv("REDIS_TEST_URL"), reason="REDIS_TEST_URL not configured")
def test_real_redis_rq_job_uses_json_serializer(monkeypatch: pytest.MonkeyPatch) -> None:
    from redis import Redis
    from rq import Queue
    from rq.serializers import JSONSerializer
    from app.config import AppSettings
    from app.task_queue import TaskQueue

    url = os.environ["REDIS_TEST_URL"]
    redis = Redis.from_url(url)
    redis.flushdb()
    settings = AppSettings(redis_url=url)
    job_id = TaskQueue(settings).enqueue(17, retry_once=True)
    queue = Queue(settings.rq_queue_name, connection=redis, serializer=JSONSerializer)
    job = queue.fetch_job(job_id)
    assert job is not None
    assert job.args == (17,)
    assert job.func_name == "app.worker.run_task"
    queue.empty(); redis.flushdb()
