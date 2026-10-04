from __future__ import annotations

import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def _resolve_port(occupied: str) -> str:
    script = ROOT / "launcher" / "port_selection.ps1"
    command = (
        f". '{script}'; "
        f"Resolve-BackendHostPort -OccupiedPorts @({occupied})"
    )
    result = subprocess.run(
        ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
        check=True,
        capture_output=True,
        text=True,
        timeout=10,
    )
    return result.stdout.strip()


def test_launcher_selects_8000_when_available_and_next_free_port_on_conflict() -> None:
    assert _resolve_port("") == "8000"
    assert _resolve_port("8000,8001") == "8002"


def test_compose_and_launcher_use_the_selected_backend_host_port() -> None:
    compose = (ROOT / "docker-compose.yml").read_text(encoding="utf-8")
    launcher = (ROOT / "start.ps1").read_text(encoding="utf-8")
    assert "${BACKEND_HOST_PORT:-8000}:8000" in compose
    assert "Resolve-BackendHostPort" in launcher
    assert '$env:BACKEND_HOST_PORT = [string]$backendHostPort' in launcher
    assert '& $docker inspect --format' in launcher
    assert '& $docker port $currentBackendId' not in launcher


def test_backend_docker_context_excludes_test_and_local_runtime_artifacts() -> None:
    dockerignore = (ROOT / "backend" / ".dockerignore").read_text(encoding="utf-8")
    assert ".pytest-*" in dockerignore
    assert ".venv" in dockerignore
