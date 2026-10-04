"""Settings, diagnostics and onboarding routes."""

from __future__ import annotations

import asyncio
import json

from fastapi import Depends
from sqlalchemy.orm import Session

from app.config import get_settings
from app.providers import make_provider, provider_base_url
from app.schemas import ModelListResponse, OnboardingComplete, SettingsResponse, SettingsUpdate
from app.secrets import (
    bind_legacy_document_vision_api_key,
    bind_legacy_model_api_key,
    get_model_api_key,
    save_document_vision_api_key,
    save_model_api_key,
)

from ._shared import (
    _academic_search_diagnostic,
    _collect_source_statuses,
    _get_setting,
    _setting_response,
)


def register_settings_routes(app, get_db) -> None:
    @app.get("/api/v1/settings", response_model=SettingsResponse)
    def get_settings_endpoint(db: Session = Depends(get_db)) -> SettingsResponse:
        return _setting_response(_get_setting(db))

    @app.post("/api/v1/settings", response_model=SettingsResponse)
    def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db)) -> SettingsResponse:
        item = _get_setting(db)
        if payload.api_key is None and item.model_provider == payload.model_provider and (
            provider_base_url(item.model_provider, item.model_base_url)
            != provider_base_url(payload.model_provider, payload.model_base_url)
        ):
            bind_legacy_model_api_key(item.model_provider, item.model_base_url)
        if payload.document_vision_api_key is None and item.document_vision_provider.replace("-", "_") == payload.document_vision_provider.replace("-", "_") and (
            provider_base_url(item.document_vision_provider, item.document_vision_base_url)
            != provider_base_url(payload.document_vision_provider, payload.document_vision_base_url)
        ):
            bind_legacy_document_vision_api_key(item.document_vision_provider, item.document_vision_base_url)
        for field in (
            "model_provider", "model_name", "vision_model", "model_base_url",
            "timeout_seconds", "backup_model", "paper_budget", "daily_budget",
            "monthly_budget", "document_vision_provider", "document_vision_model",
            "document_vision_base_url", "document_vision_timeout_seconds",
        ):
            setattr(item, field, getattr(payload, field))
        for field in ("campus_ai_daily_limit", "campus_ai_max_tokens"):
            if field in payload.model_fields_set:
                setattr(item, field, getattr(payload, field))
        if payload.api_key is not None:
            save_model_api_key(payload.model_provider, payload.api_key, payload.model_base_url)
        if payload.document_vision_api_key is not None:
            save_document_vision_api_key(payload.document_vision_provider, payload.document_vision_api_key, payload.document_vision_base_url)
        db.commit()
        db.refresh(item)
        return _setting_response(item)

    @app.post("/api/v1/settings/test-model")
    def test_model(db: Session = Depends(get_db)) -> dict[str, object]:
        item = _get_setting(db)
        provider = make_provider(item.model_provider, get_model_api_key(item.model_provider, item.model_base_url), item.model_base_url, item.model_name, item.timeout_seconds, item.vision_model)
        ok, message = provider.test_connection()
        return {"ok": ok, "message": message, "provider": provider.name}

    @app.get(
        "/api/v1/settings/models",
        response_model=ModelListResponse,
    )
    def list_models(db: Session = Depends(get_db)) -> ModelListResponse:
        item = _get_setting(db)
        provider = make_provider(
            item.model_provider,
            get_model_api_key(item.model_provider, item.model_base_url),
            item.model_base_url,
            item.model_name,
            item.timeout_seconds,
            item.vision_model,
        )
        result = provider.list_models()
        return ModelListResponse(
            provider=provider.name,
            ok=result.ok,
            models=result.models,
            message=result.message,
        )

    @app.get("/api/v1/diagnostics")
    async def diagnostics() -> dict[str, object]:
        with app.state.session_factory() as db:
            item = _get_setting(db)
            model_api_key = get_model_api_key(item.model_provider, item.model_base_url)
            provider = make_provider(
                item.model_provider,
                model_api_key,
                item.model_base_url,
                item.model_name,
                item.timeout_seconds,
                item.vision_model,
            )
            if db.in_transaction():
                db.rollback()

        settings = get_settings()
        model_task = asyncio.create_task(
            asyncio.to_thread(provider.test_connection)
        )
        source_task = asyncio.create_task(
            _collect_source_statuses(app, settings)
        )
        (model_ok, model_message), source_statuses = await asyncio.gather(
            model_task,
            source_task,
        )
        storage_ok = settings.paper_storage_dir.exists()
        redis_ok, redis_message = app.state.task_queue.health()
        storage_provider_ok, storage_message = app.state.storage_provider.health()
        backups = app.state.backup_manager.list()
        return {
            "frontend": {
                "status": "unknown",
                "message": "前端由 localhost:3000 提供",
            },
            "backend": {"status": "ok"},
            "database": {"status": "ok"},
            "model_api": {
                "status": (
                    "ok"
                    if model_ok
                    else "error"
                    if model_api_key
                    or item.model_provider in {"mock", "ollama"}
                    else "not_configured"
                ),
                "message": model_message,
            },
            "academic_search": _academic_search_diagnostic(
                source_statuses
            ),
            "pdf_storage": {
                "status": "ok" if storage_ok else "error"
            },
            "scheduler": app.state.research_scheduler.diagnostic_status(),
            "email": {
                "status": "not_configured",
                "message": "尚未配置邮件服务",
            },
            "redis": {"status": "ok" if redis_ok else "error", "message": redis_message},
            "worker": {"status": "ok" if redis_ok else "error", "message": "RQ worker 需在配置 Redis 后单独运行" if settings.redis_url else "未配置队列时使用本地同步能力"},
            "storage": {"status": "ok" if storage_provider_ok else "error", "message": storage_message},
            "backups": {"status": "ok" if backups else "not_configured", "message": f"可用备份 {len(backups)} 份"},
        }

    @app.post("/api/v1/onboarding/complete")
    def onboarding_complete(payload: OnboardingComplete, db: Session = Depends(get_db)) -> dict[str, bool]:
        item = _get_setting(db)
        item.onboarding_completed, item.study_mode = True, payload.study_mode
        item.research_topics, item.keywords = json.dumps(payload.research_topics, ensure_ascii=False), json.dumps(payload.keywords, ensure_ascii=False)
        item.daily_task_time, item.daily_budget, item.monthly_budget = payload.daily_task_time, payload.daily_budget, payload.monthly_budget
        db.commit()
        return {"completed": True}
