from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit, urlunsplit
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import AliasChoices, AnyHttpUrl, Field, SecretStr, TypeAdapter, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


_HTTP_URL_ADAPTER = TypeAdapter(AnyHttpUrl)


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./data/energy_copilot.db"
    paper_storage_path: str = "./data/papers"
    document_ai_model_path: str = ""
    whisper_model_path: str = ""
    model_provider: str = "mock"
    model_name: str = "mock-energy-research-v1"
    model_vision_model: str = ""
    model_api_key: str = ""
    model_base_url: str = "https://api.openai.com/v1"
    model_timeout_seconds: int = 60
    max_upload_size_mb: int = Field(default=30, validation_alias=AliasChoices("MAX_UPLOAD_MB", "MAX_UPLOAD_SIZE_MB"))
    paper_budget: float = Field(default=1.0, validation_alias=AliasChoices("PAPER_BUDGET_CNY", "PAPER_BUDGET"))
    daily_budget: float = Field(default=5.0, validation_alias=AliasChoices("DAILY_BUDGET_CNY", "DAILY_BUDGET"))
    monthly_budget: float = Field(default=50.0, validation_alias=AliasChoices("MONTHLY_BUDGET_CNY", "MONTHLY_BUDGET"))
    daily_task_time: str = "08:00"
    user_timezone: str = "Asia/Shanghai"
    openalex_enabled: bool = True
    openalex_base_url: str = "https://api.openalex.org"
    crossref_enabled: bool = True
    crossref_base_url: str = "https://api.crossref.org"
    crossref_mailto: str = ""
    arxiv_enabled: bool = True
    arxiv_base_url: str = "https://export.arxiv.org/api"
    semantic_scholar_enabled: bool = False
    semantic_scholar_base_url: str = "https://api.semanticscholar.org"
    semantic_scholar_api_key: SecretStr = Field(
        default_factory=lambda: SecretStr(""),
        repr=False,
    )
    paper_source_timeout_seconds: int = Field(default=15, ge=1, le=120)
    paper_download_timeout_seconds: int = Field(default=30, ge=1, le=600)
    paper_download_max_mb: int = Field(default=50, ge=1, le=1000)
    embedding_provider: str = "ollama"
    embedding_model: str = "bge-m3"
    embedding_base_url: str = "http://host.docker.internal:11434"
    embedding_timeout_seconds: int = Field(default=120, ge=5, le=600)
    knowledge_chunk_size: int = Field(default=1600, ge=500, le=4000)
    knowledge_chunk_overlap: int = Field(default=180, ge=0, le=800)
    redis_url: str = ""
    rq_queue_name: str = "energy-research"
    storage_backend: Literal["local", "s3"] = "local"
    s3_endpoint_url: str = ""
    s3_bucket: str = ""
    s3_region: str = "us-east-1"
    s3_access_key: SecretStr = Field(default_factory=lambda: SecretStr(""), repr=False)
    s3_secret_key: SecretStr = Field(default_factory=lambda: SecretStr(""), repr=False)
    backup_path: str = ""
    backup_retention: int = Field(default=7, ge=1, le=365)
    backup_interval_hours: int = Field(default=24, ge=1, le=720)

    @field_validator("user_timezone")
    @classmethod
    def validate_user_timezone(cls, value: str) -> str:
        candidate = value.strip()
        try:
            ZoneInfo(candidate)
        except (ValueError, ZoneInfoNotFoundError) as exc:
            raise ValueError("user timezone must be a valid IANA timezone") from exc
        return candidate

    @field_validator(
        "openalex_base_url",
        "crossref_base_url",
        "arxiv_base_url",
        "semantic_scholar_base_url",
        "embedding_base_url",
        mode="before",
    )
    @classmethod
    def validate_paper_source_base_url(cls, value: object) -> str:
        if not isinstance(value, str) or not (candidate := value.strip()):
            raise ValueError("paper source base URL must be a nonempty HTTP(S) URL")
        _HTTP_URL_ADAPTER.validate_python(candidate)
        parsed = urlsplit(candidate)
        if parsed.username is not None or parsed.password is not None:
            raise ValueError("paper source base URL must not contain credentials")
        if parsed.query or parsed.fragment:
            raise ValueError(
                "paper source base URL must not contain query or fragment"
            )
        return urlunsplit(
            (
                parsed.scheme,
                parsed.netloc,
                parsed.path.rstrip("/"),
                "",
                "",
            )
        )

    @property
    def paper_storage_dir(self) -> Path:
        return Path(self.paper_storage_path).resolve()

    @property
    def document_ai_model_dir(self) -> Path:
        return Path(self.document_ai_model_path).resolve() if self.document_ai_model_path.strip() else self.paper_storage_dir.parent / "document-ai-models"

    @property
    def whisper_model_dir(self) -> Path:
        return Path(self.whisper_model_path).resolve() if self.whisper_model_path.strip() else self.paper_storage_dir.parent / "models" / "faster-whisper-small"

    @property
    def backup_dir(self) -> Path:
        return Path(self.backup_path).resolve() if self.backup_path.strip() else self.paper_storage_dir.parent / "backups"


@lru_cache
def get_settings() -> AppSettings:
    return AppSettings()


def reset_settings_cache() -> None:
    get_settings.cache_clear()
