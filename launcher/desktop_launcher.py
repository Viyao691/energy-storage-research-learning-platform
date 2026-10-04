"""Windows desktop launcher for Energy Research Copilot.

This wrapper intentionally contains no model credentials. It starts the existing
Docker Compose stack next to the executable, waits for the web UI, and opens it.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time
import urllib.request
import webbrowser
from pathlib import Path


APP_URL = "http://127.0.0.1:3000"


def compose_command(*, rebuild: bool = False, standard: bool = False) -> list[str]:
    # Default to the harness override so the app reads local_state/ data and
    # the already-installed OCR models (no re-download). standard=True falls
    # back to plain docker-compose.yml with named volumes.
    # NOTE: -f flags must precede the compose subcommand (docker compose -f a -f b up).
    command = ["docker", "compose"]
    if not standard:
        command += ["-f", "docker-compose.yml", "-f", "docker-compose.harness.yml"]
    command += ["up", "-d"]
    if rebuild:
        command.append("--build")
    return command


def wait_for_url(url: str, timeout_seconds: int = 90, probe=None) -> bool:
    """Return when the local UI responds; injectable probe keeps tests offline."""
    if probe is None:
        def probe(target: str) -> bool:
            try:
                with urllib.request.urlopen(target, timeout=3) as response:
                    return 200 <= response.status < 500
            except OSError:
                return False
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        if probe(url):
            return True
        time.sleep(2)
    return probe(url)


def project_root() -> Path:
    return Path(sys.executable if getattr(sys, "frozen", False) else __file__).resolve().parent.parent


def show_error(message: str) -> None:
    try:
        import tkinter.messagebox
        tkinter.messagebox.showerror("储能科研 AI 助手", message)
    except Exception:
        print(message, file=sys.stderr)


def docker_ready() -> bool:
    return shutil.which("docker") is not None


def start_docker_desktop() -> None:
    candidate = Path(os.environ.get("ProgramFiles", r"C:\Program Files")) / "Docker" / "Docker" / "Docker Desktop.exe"
    if candidate.exists():
        subprocess.Popen([str(candidate)], creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))


def main() -> int:
    root = project_root()
    if not (root / "docker-compose.yml").exists():
        show_error("未找到 docker-compose.yml。请把启动器放在项目根目录后再运行。")
        return 1
    if not docker_ready():
        start_docker_desktop()
        show_error("未检测到 Docker Desktop。请安装并启动 Docker Desktop 后再次双击启动器。")
        return 1
    env_file = root / ".env"
    if not env_file.exists():
        shutil.copyfile(root / ".env.example", env_file)
    try:
        result = subprocess.run(compose_command(), cwd=root, check=False, capture_output=True, text=True, timeout=300)
    except OSError as exc:
        show_error(f"无法启动 Docker：{exc}")
        return 1
    except subprocess.TimeoutExpired:
        show_error("Docker 启动超时。请打开 Docker Desktop，稍后再试。")
        return 1
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "未知 Docker 错误").strip()
        show_error(f"系统启动失败：{detail[:800]}")
        return 1
    if not wait_for_url(APP_URL):
        show_error("服务正在启动，但 90 秒内未能打开网页。请运行 docker compose logs 查看日志。")
        return 1
    webbrowser.open(APP_URL)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
