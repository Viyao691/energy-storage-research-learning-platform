from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime
import json
import logging
from pathlib import Path
from time import perf_counter

import httpx
from alembic import command
from alembic.config import Config
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import get_settings, reset_settings_cache
from app.database import ensure_database_directory, make_engine, make_session_factory
from app.document_ai import DocumentAIManager
from app.knowledge import make_embedding_provider
from app.document_ai_api import register_document_ai_routes
from app.learning_api import register_learning_routes
from app.learning_analytics_api import register_learning_analytics_routes
from app.learning_feedback_api import register_learning_feedback_routes
from app.learning_lifecycle_api import register_learning_lifecycle_routes
from app.learning_ordering_api import register_learning_ordering_routes
from app.learning_review_api import register_learning_review_routes
from app.paper_sources.registry import build_paper_sources
from app.routers import knowledge as knowledge_routes
from app.routers.paper_research import register_paper_research_routes
from app.routers import contests as contest_routes
from app.routers import papers as papers_routes
from app.routers import research as research_routes
from app.routers import research_assistance as research_assistance_routes
from app.routers import search as search_routes
from app.routers import settings as settings_routes
from app.routers import runtime as runtime_routes
from app.routers import campus as campus_routes
from app.campus_sources import seed_sources
from app.services.campus import CampusService
from app.routers._shared import _managed_paper_pdf
from app.scientific_analysis_api import register_scientific_analysis_routes
from app.secrets import SecretStoreError
from app.services.research import ResearchService
from app.services.research_news import FEEDS, ResearchNewsSource, ResearchNewsDigest
from app.services.research_scheduler import ResearchScheduler
from app.backups import BackupManager, BackupScheduler
from app.observability import observe
from app.storage import make_storage_provider
from app.task_queue import TaskQueue
from app.worker import recover_interrupted_tasks


_REQUEST_LOGGER = logging.getLogger("energy_research.http")


def _apply_migrations() -> None:
    """Keep direct uvicorn startup usable while Docker also migrates explicitly."""
    ensure_database_directory()
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    command.upgrade(config, "head")


def create_app() -> FastAPI:
    reset_settings_cache()
    engine = make_engine()
    factory = make_session_factory()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        _apply_migrations()
        with app.state.session_factory() as db:
            seed_sources(db)
        get_settings().paper_storage_dir.mkdir(parents=True, exist_ok=True)
        app.state.document_ai_manager.recover_interrupted(app.state.session_factory)
        recover_interrupted_tasks(app.state.session_factory)
        await app.state.research_scheduler.start()
        await app.state.campus_service.start()
        await app.state.backup_scheduler.start()
        try:
            yield
        finally:
            await app.state.backup_scheduler.stop()
            await app.state.research_scheduler.stop()
            await app.state.campus_service.stop()
            app.state.engine.dispose()
            session_engine = app.state.session_factory.kw.get("bind")
            if session_engine is not None and session_engine is not app.state.engine:
                session_engine.dispose()

    app = FastAPI(title="Energy Research Copilot API", version="0.1.0", lifespan=lifespan)
    app.state.engine = engine
    app.state.session_factory = factory
    app.state.paper_source_builder = build_paper_sources
    app.state.paper_source_client_factory = lambda: httpx.AsyncClient(
        trust_env=False
    )
    app.state.research_service = ResearchService(
        session_factory=factory,
        paper_source_builder=lambda settings, client: app.state.paper_source_builder(
            settings, client
        ),
        paper_source_client_factory=lambda: app.state.paper_source_client_factory(),
        settings_provider=get_settings,
        now_provider=datetime.utcnow,
        news_source_builder=lambda client: [ResearchNewsSource(client, feed) for feed in FEEDS],
    )
    app.state.research_news = ResearchNewsDigest(lambda: app.state.paper_source_client_factory())
    app.state.research_scheduler = ResearchScheduler(
        session_factory=factory,
        research_service=app.state.research_service,
        now_provider=datetime.utcnow,
    )
    app.state.campus_service = CampusService(factory)
    app.state.document_ai_manager = DocumentAIManager(
        get_settings().document_ai_model_dir
    )
    app.state.embedding_provider_factory = make_embedding_provider
    app.state.storage_provider = make_storage_provider(get_settings())
    app.state.backup_manager = BackupManager(get_settings())
    app.state.backup_scheduler = BackupScheduler(app.state.backup_manager)
    app.state.task_queue = TaskQueue(get_settings())

    @app.middleware("http")
    async def record_metrics(request: Request, call_next):
        started = perf_counter()
        response = await call_next(request)
        route = request.scope.get("route")
        path = getattr(route, "path", request.url.path)
        duration = perf_counter() - started
        observe(request.method, path, response.status_code, duration)
        _REQUEST_LOGGER.info(json.dumps({
            "event": "http_request",
            "method": request.method,
            "path": path,
            "status": response.status_code,
            "duration_ms": round(duration * 1000, 2),
        }, separators=(",", ":")))
        return response
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:3001",  # local `npm run dev` frontend
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(SecretStoreError)
    async def secret_store_error_handler(request: Request, exc: SecretStoreError) -> JSONResponse:
        return JSONResponse(status_code=503, content={"detail": str(exc)})

    @app.exception_handler(RequestValidationError)
    async def request_validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        first_error = exc.errors()[0] if exc.errors() else {}
        location = ".".join(str(part) for part in first_error.get("loc", []) if part != "body")
        detail = f"请求参数不合法：{location}" if location else "请求参数不合法"
        return JSONResponse(status_code=422, content={"detail": detail})

    def get_db():
        db = app.state.session_factory()
        try:
            yield db
        finally:
            db.close()

    register_learning_routes(app, get_db)
    register_paper_research_routes(app, get_db)
    register_learning_review_routes(app, get_db)
    register_learning_analytics_routes(app, get_db)
    register_learning_lifecycle_routes(app, get_db)
    register_learning_feedback_routes(app, get_db)
    register_learning_ordering_routes(app, get_db)
    register_document_ai_routes(app, get_db, _managed_paper_pdf)
    register_scientific_analysis_routes(app, get_db)
    settings_routes.register_settings_routes(app, get_db)
    research_routes.register_research_routes(app, get_db)
    search_routes.register_search_routes(app, get_db)
    papers_routes.register_papers_routes(app, get_db)
    knowledge_routes.register_knowledge_routes(app, get_db)
    contest_routes.register_contest_routes(app, get_db)
    research_assistance_routes.register_research_assistance_routes(app, get_db)
    runtime_routes.register_runtime_routes(app, get_db)
    campus_routes.register_campus_routes(app, get_db)

    @app.get("/health")
    def health() -> dict[str, str]:
        try:
            with app.state.engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return {"status": "ok", "database": "ok"}
        except Exception:
            return {"status": "degraded", "database": "error"}

    return app


app = create_app()
