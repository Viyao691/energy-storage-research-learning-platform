"""Run the Windows portable build from any writable extracted directory."""

from __future__ import annotations

import ctypes
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
import urllib.request
import webbrowser


ROOT = Path(__file__).resolve().parent
KERNEL = ctypes.WinDLL("kernel32", use_last_error=True)
KERNEL.CreateJobObjectW.restype = ctypes.c_void_p
KERNEL.SetInformationJobObject.argtypes = (ctypes.c_void_p, ctypes.c_int, ctypes.c_void_p, ctypes.c_uint32)
KERNEL.AssignProcessToJobObject.argtypes = (ctypes.c_void_p, ctypes.c_void_p)
KERNEL.CloseHandle.argtypes = (ctypes.c_void_p,)
JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x2000


class IO_COUNTERS(ctypes.Structure):
    _fields_ = [(name, ctypes.c_ulonglong) for name in ("ReadOperationCount", "WriteOperationCount", "OtherOperationCount", "ReadTransferCount", "WriteTransferCount", "OtherTransferCount")]


class BASIC_LIMIT(ctypes.Structure):
    _fields_ = [("PerProcessUserTimeLimit", ctypes.c_longlong), ("PerJobUserTimeLimit", ctypes.c_longlong), ("LimitFlags", ctypes.c_uint32), ("MinimumWorkingSetSize", ctypes.c_size_t), ("MaximumWorkingSetSize", ctypes.c_size_t), ("ActiveProcessLimit", ctypes.c_uint32), ("Affinity", ctypes.c_size_t), ("PriorityClass", ctypes.c_uint32), ("SchedulingClass", ctypes.c_uint32)]


class EXTENDED_LIMIT(ctypes.Structure):
    _fields_ = [("BasicLimitInformation", BASIC_LIMIT), ("IoInfo", IO_COUNTERS), ("ProcessMemoryLimit", ctypes.c_size_t), ("JobMemoryLimit", ctypes.c_size_t), ("PeakProcessMemoryUsed", ctypes.c_size_t), ("PeakJobMemoryUsed", ctypes.c_size_t)]


def choose_port(start: int) -> int:
    for port in range(start, start + 100):
        with socket.socket() as sock:
            try:
                sock.bind(("127.0.0.1", port))
            except OSError:
                continue
            return port
    raise RuntimeError(f"No free localhost port in {start}-{start + 99}")


def wait_for(url: str, process: subprocess.Popen, seconds: int = 90) -> None:
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    for _ in range(seconds * 2):
        if process.poll() is not None:
            raise RuntimeError(f"Service exited ({process.returncode}): {url}")
        try:
            with opener.open(url, timeout=1) as response:
                if response.status == 200:
                    return
        except Exception:
            time.sleep(0.5)
    raise RuntimeError(f"Service did not become ready: {url}")


def main() -> int:
    data = ROOT / "data"
    for name in ("papers", "models", "backups", "appdata", "localappdata", "profile", "tmp"):
        (data / name).mkdir(parents=True, exist_ok=True)
    backend_port = choose_port(8100)
    frontend_port = choose_port(3100)
    # Do not inherit model-provider keys or user-specific Python/Node settings.
    env = {key: value for key in ("SystemRoot", "WINDIR", "ComSpec", "PATHEXT") if (value := os.environ.get(key))}
    env.update({
        "PATH": os.pathsep.join(str(ROOT / "runtime" / item) for item in ("python", "node", "pandoc")) + os.pathsep + str(Path(os.environ["SystemRoot"]) / "System32"),
        "APPDATA": str(data / "appdata"), "LOCALAPPDATA": str(data / "localappdata"),
        "USERPROFILE": str(data / "profile"), "TEMP": str(data / "tmp"), "TMP": str(data / "tmp"),
        "PYTHONPATH": str(ROOT / "backend"), "PYTHONNOUSERSITE": "1", "PYTHONDONTWRITEBYTECODE": "1",
        "DATABASE_URL": f"sqlite:///{(data / 'energy_copilot.db').as_posix()}",
        "PAPER_STORAGE_PATH": str(data / "papers"),
        "DOCUMENT_AI_MODEL_PATH": str(data / "models"),
        "PADDLE_PDX_CACHE_HOME": str(data / "models" / "paddlex"),
        "DOCLING_ARTIFACTS_PATH": str(data / "models" / "docling"),
        "DOCLING_ENABLE_REMOTE_SERVICES": "false", "DOCLING_ALLOW_EXTERNAL_PLUGINS": "false",
        "WHISPER_MODEL_PATH": str(data / "models" / "faster-whisper-small"),
        "BACKUP_PATH": str(data / "backups"),
        "MODEL_PROVIDER": "mock", "MODEL_NAME": "mock-energy-research-v1", "MODEL_API_KEY": "",
        "EMBEDDING_BASE_URL": "http://127.0.0.1:11434",
        "NEXT_TELEMETRY_DISABLED": "1", "HOSTNAME": "127.0.0.1", "PORT": str(frontend_port),
        "BACKEND_API_URL": f"http://127.0.0.1:{backend_port}",
    })
    job = KERNEL.CreateJobObjectW(None, None)
    limits = EXTENDED_LIMIT()
    limits.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
    if not KERNEL.SetInformationJobObject(job, 9, ctypes.byref(limits), ctypes.sizeof(limits)):
        raise ctypes.WinError(ctypes.get_last_error())
    processes: list[subprocess.Popen] = []
    try:
        backend = subprocess.Popen([str(ROOT / "runtime/python/python.exe"), "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(backend_port)], cwd=ROOT / "backend", env=env)
        processes.append(backend)
        if not KERNEL.AssignProcessToJobObject(job, ctypes.c_void_p(backend._handle)):
            backend.kill()
            raise ctypes.WinError(ctypes.get_last_error())
        wait_for(f"http://127.0.0.1:{backend_port}/health", backend)
        frontend = subprocess.Popen([str(ROOT / "runtime/node/node.exe"), "server.js"], cwd=ROOT / "frontend", env=env)
        processes.append(frontend)
        if not KERNEL.AssignProcessToJobObject(job, ctypes.c_void_p(frontend._handle)):
            frontend.kill()
            raise ctypes.WinError(ctypes.get_last_error())
        url = f"http://127.0.0.1:{frontend_port}"
        wait_for(url, frontend)
        print(f"本机界面：{url}\n数据目录：{data}\n按 Ctrl+C 停止。", flush=True)
        if os.environ.get("PORTABLE_NO_BROWSER") != "1":
            webbrowser.open(url)
        while all(process.poll() is None for process in processes):
            time.sleep(1)
        return 1
    except KeyboardInterrupt:
        return 0
    finally:
        KERNEL.CloseHandle(job)
        for process in processes:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"启动失败：{error}", file=sys.stderr)
        raise SystemExit(1)
