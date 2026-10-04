"""Encrypted backend-only local secret storage.

The encryption key is kept in a separate local file; the JSON store only
contains Fernet ciphertext. Neither file is returned by the API or stored in
SQLite. A deployment-supplied environment key always takes precedence.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from uuid import uuid4

from cryptography.fernet import Fernet, InvalidToken

from app.config import get_settings
from app.providers import provider_base_url


class SecretStoreError(RuntimeError):
    """A safe, user-facing configuration failure without sensitive details."""


def _vision_identity(provider: str) -> str:
    return "openai_compatible" if provider == "openai-compatible" else provider


def _runtime_directory() -> Path:
    return get_settings().paper_storage_dir.parent


def secret_store_path() -> Path:
    return _runtime_directory() / "runtime-secrets.json"


def secret_key_path() -> Path:
    return _runtime_directory() / "runtime-secret.key"


def _set_private_permissions(path: Path) -> None:
    if os.name == "posix":
        path.chmod(0o600)


def _load_or_create_fernet() -> Fernet:
    key_path = secret_key_path()
    key_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        if key_path.exists():
            key = key_path.read_bytes()
        else:
            temporary = key_path.with_name(f".{key_path.name}.{uuid4().hex}.tmp")
            try:
                key = Fernet.generate_key()
                temporary.write_bytes(key)
                _set_private_permissions(temporary)
                os.replace(temporary, key_path)
                _set_private_permissions(key_path)
            finally:
                temporary.unlink(missing_ok=True)
        return Fernet(key)
    except (OSError, ValueError) as exc:
        raise SecretStoreError("本地机密配置无法读取，请重新在系统设置中保存 API 密钥。") from exc


def get_model_api_key(model_provider: str | None = None, base_url: str | None = None) -> str:
    """Return key material only when it belongs to the requested provider."""
    settings = get_settings()
    requested_provider = (model_provider or settings.model_provider).strip()
    environment_key = settings.model_api_key.strip()
    if environment_key and requested_provider == settings.model_provider.strip() and (
        base_url is None or provider_base_url(requested_provider, base_url) == provider_base_url(requested_provider, settings.model_base_url)
    ):
        return environment_key
    try:
        payload = json.loads(secret_store_path().read_text(encoding="utf-8"))
    except FileNotFoundError:
        return ""
    except (OSError, json.JSONDecodeError) as exc:
        raise SecretStoreError("本地机密配置无法解密，请重新在系统设置中保存 API 密钥。") from exc
    ciphertext = payload.get("model_api_key_ciphertext") if isinstance(payload, dict) else None
    stored_provider = payload.get("model_provider") if isinstance(payload, dict) else None
    if not isinstance(stored_provider, str):
        # Legacy stores did not bind a key to its provider. Reusing such a key
        # after a provider switch could leak credentials, so fail closed while
        # keeping Mock and local-only workflows available.
        return ""
    if stored_provider != requested_provider:
        return ""
    if not isinstance(ciphertext, str):
        return ""
    try:
        value = _load_or_create_fernet().decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except (InvalidToken, OSError, UnicodeDecodeError) as exc:
        raise SecretStoreError("本地机密配置无法解密，请重新在系统设置中保存 API 密钥。") from exc
    stored_url = payload.get("model_base_url")
    if base_url is not None and stored_url is not None and stored_url != provider_base_url(requested_provider, base_url):
        return ""
    return value


def get_document_vision_api_key(provider: str | None = None, base_url: str | None = None) -> str:
    try:
        payload = json.loads(secret_store_path().read_text(encoding="utf-8"))
    except FileNotFoundError:
        return ""
    except (OSError, json.JSONDecodeError) as exc:
        raise SecretStoreError("本地文档视觉密钥无法读取，请重新保存。") from exc
    requested = (provider or "").strip()
    if _vision_identity(str(payload.get("document_vision_provider", ""))) != _vision_identity(requested):
        return ""
    ciphertext = payload.get("document_vision_api_key_ciphertext")
    if not isinstance(ciphertext, str):
        return ""
    try:
        value = _load_or_create_fernet().decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except (InvalidToken, OSError, UnicodeDecodeError) as exc:
        raise SecretStoreError("本地文档视觉密钥无法解密，请重新保存。") from exc
    stored_url = payload.get("document_vision_base_url")
    if base_url is not None and stored_url is not None and stored_url != provider_base_url(requested, base_url):
        return ""
    return value


def _read_secret_payload() -> dict[str, object]:
    try:
        value = json.loads(secret_store_path().read_text(encoding="utf-8"))
        return value if isinstance(value, dict) else {}
    except FileNotFoundError:
        return {}
    except (OSError, json.JSONDecodeError) as exc:
        raise SecretStoreError("本地机密配置无法读取，请重新保存 API 密钥。") from exc


def _write_secret_payload(payload: dict[str, object]) -> None:
    destination = secret_store_path()
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(f".{destination.name}.{uuid4().hex}.tmp")
    try:
        temporary.write_text(json.dumps(payload), encoding="utf-8")
        _set_private_permissions(temporary)
        os.replace(temporary, destination)
        _set_private_permissions(destination)
    except OSError as exc:
        raise SecretStoreError("本地机密配置无法保存，请检查数据目录权限。") from exc
    finally:
        temporary.unlink(missing_ok=True)


def bind_legacy_model_api_key(provider: str, base_url: str) -> None:
    payload = _read_secret_payload()
    if payload.get("model_provider") == provider and isinstance(payload.get("model_api_key_ciphertext"), str) and "model_base_url" not in payload:
        payload["model_base_url"] = provider_base_url(provider, base_url)
        _write_secret_payload(payload)


def bind_legacy_document_vision_api_key(provider: str, base_url: str) -> None:
    payload = _read_secret_payload()
    if _vision_identity(str(payload.get("document_vision_provider", ""))) == _vision_identity(provider) and isinstance(payload.get("document_vision_api_key_ciphertext"), str) and "document_vision_base_url" not in payload:
        payload["document_vision_base_url"] = provider_base_url(provider, base_url)
        _write_secret_payload(payload)


def save_model_api_key(model_provider: str, api_key: str, base_url: str = "") -> None:
    """Atomically persist encrypted key material; plaintext never reaches SQLite."""
    try:
        ciphertext = _load_or_create_fernet().encrypt(api_key.encode("utf-8")).decode("utf-8")
        payload = _read_secret_payload()
        payload.update({
            "model_provider": model_provider.strip(),
            "model_base_url": provider_base_url(model_provider.strip(), base_url),
            "model_api_key_ciphertext": ciphertext,
        })
        _write_secret_payload(payload)
    except (OSError, SecretStoreError) as exc:
        raise SecretStoreError("本地机密配置无法保存，请检查数据目录权限。") from exc


def save_document_vision_api_key(provider: str, api_key: str, base_url: str = "") -> None:
    try:
        ciphertext = _load_or_create_fernet().encrypt(api_key.encode("utf-8")).decode("utf-8")
        payload = _read_secret_payload()
        payload.update(
            {
                "document_vision_provider": provider.strip(),
                "document_vision_base_url": provider_base_url(provider.strip(), base_url),
                "document_vision_api_key_ciphertext": ciphertext,
            }
        )
        _write_secret_payload(payload)
    except (OSError, SecretStoreError) as exc:
        raise SecretStoreError("本地文档视觉密钥无法保存，请检查数据目录权限。") from exc
