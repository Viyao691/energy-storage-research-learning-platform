"""Build a Windows x64 portable ZIP from the clean public release export.

Run after export_github_release.py has prepared outputs/github-release. This
script never imports the private backend data, environment, or model cache.
"""

from __future__ import annotations

import os
from pathlib import Path
import shutil
import subprocess
import sys
import urllib.request
import zipfile


ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "outputs/github-release" if (ROOT / "outputs/github-release/.release-export").is_file() else ROOT
BUILD = ROOT / "outputs/windows-portable"
STAGE = ROOT / "outputs/p"
PACKAGE_NAME = "Energy-Research-Copilot-Windows-x64"
RELEASES = ROOT / "outputs/releases"
PYTHON_BASE = Path(os.environ.get("PORTABLE_PYTHON_BASE", sys.base_prefix))
VENV = BUILD / "build-venv"
NODE = Path(os.environ.get("PORTABLE_NODE", shutil.which("node") or "node.exe"))


def run(*args: str | Path, cwd: Path = ROOT, env: dict[str, str] | None = None) -> None:
    subprocess.run([str(arg) for arg in args], cwd=cwd, env=env, check=True)


def ignore_cache(directory: str, names: list[str]) -> set[str]:
    return {name for name in names if name in {"__pycache__", ".git", ".pytest_cache", ".next", "node_modules", "tests", "test"} or name.endswith(".pyc")}


def ignore_bytecode(directory: str, names: list[str]) -> set[str]:
    return {name for name in names if name == "__pycache__" or name.endswith(".pyc")}


def ignore_python_base(directory: str, names: list[str]) -> set[str]:
    ignored = ignore_cache(directory, names)
    if Path(directory).resolve() == (PYTHON_BASE / "Lib").resolve():
        ignored.add("site-packages")  # Base pip is a build tool, not a runtime dependency.
    return ignored


def long_path(path: Path) -> Path:
    return Path("\\\\?\\" + str(path.resolve()))


def get_pandoc() -> Path:
    explicit = os.environ.get("PORTABLE_PANDOC")
    local = Path(explicit) if explicit and Path(explicit).is_file() else None
    if local is None and (found := shutil.which("pandoc")):
        local = Path(found)
    archive = BUILD / "pandoc.zip"
    import json
    request = urllib.request.Request("https://api.github.com/repos/jgm/pandoc/releases/latest", headers={"User-Agent": "energy-research-portable-builder"})
    with urllib.request.urlopen(request, timeout=30) as response:
        release = json.load(response)
    if local is None and not archive.exists():
        asset = next(item for item in release["assets"] if item["name"].endswith("-windows-x86_64.zip"))
        urllib.request.urlretrieve(asset["browser_download_url"], archive)
    if local is None:
        with zipfile.ZipFile(archive) as zf:
            member = next(name for name in zf.namelist() if name.endswith("/pandoc.exe"))
            target = BUILD / "pandoc.exe"
            target.write_bytes(zf.read(member))
    else:
        target = local
    for name in ("COPYRIGHT", "COPYING.md"):
        urllib.request.urlretrieve(f"https://raw.githubusercontent.com/jgm/pandoc/{release['tag_name']}/{name}", BUILD / f"pandoc-{name}")
    return target


def make_zip() -> None:
    if any((STAGE / "data").iterdir()):
        raise SystemExit("Stage data must be empty before creating ZIP")
    RELEASES.mkdir(exist_ok=True)
    archive = RELEASES / f"{PACKAGE_NAME}.zip"
    long_stage = long_path(STAGE)
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=True) as zf:
        for path in long_stage.rglob("*"):
            if path.is_file():
                zf.write(path, Path(PACKAGE_NAME) / path.relative_to(long_stage))
    print(f"{archive} {archive.stat().st_size} bytes")
    if archive.stat().st_size >= 2_000_000_000:
        raise SystemExit("ZIP exceeds the 2 GB GitHub Releases asset limit")


def collect_frontend_licenses() -> Path:
    source = PUBLIC / "frontend/node_modules"
    if not source.is_dir():
        raise SystemExit("Frontend node_modules missing; run npm ci before packaging licenses")
    target = STAGE / "licenses/frontend"
    target.mkdir(parents=True, exist_ok=True)
    manifest = ["bundled filename\tsource path"]
    candidates = sorted(
        path for path in source.rglob("*")
        if path.is_file() and path.name.upper().startswith(("LICENSE", "LICENCE", "COPYING", "NOTICE"))
    )
    for index, path in enumerate(candidates, 1):
        name = f"{index:04d}-{path.name}"
        shutil.copy2(path, target / name)
        manifest.append(f"{name}\tnode_modules/{path.relative_to(source).as_posix()}")
    (target / "manifest.tsv").write_text("\n".join(manifest) + "\n", encoding="utf-8")
    return target


def main() -> None:
    if os.environ.get("PORTABLE_ADD_LICENSES_ONLY") == "1":
        directory = collect_frontend_licenses()
        archive = RELEASES / f"{PACKAGE_NAME}.zip"
        with zipfile.ZipFile(archive, "a", compression=zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=True) as zf:
            for path in directory.iterdir():
                zf.write(path, Path(PACKAGE_NAME) / "licenses/frontend" / path.name)
        print(f"{archive} {archive.stat().st_size} bytes")
        return
    if os.environ.get("PORTABLE_ZIP_ONLY") == "1":
        make_zip()
        return
    if not (PUBLIC / "backend/app").is_dir() or not (PUBLIC / "frontend/next.config.ts").is_file():
        raise SystemExit("Public backend/frontend source missing")
    if PUBLIC != ROOT:
        for source, target in ((ROOT / "frontend/next.config.ts", PUBLIC / "frontend/next.config.ts"), (ROOT / "frontend/app/backend-api/[...path]/route.ts", PUBLIC / "frontend/app/backend-api/[...path]/route.ts")):
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
        for name in ("portable_launcher.py", "portable_start.cmd", "build_windows_portable.py"):
            shutil.copy2(Path(__file__).with_name(name), PUBLIC / "scripts/release" / name)
    if not PYTHON_BASE.is_dir() or not NODE.is_file():
        raise SystemExit("Set PORTABLE_PYTHON_BASE to CPython 3.12 directory and PORTABLE_NODE to node.exe")
    uv = shutil.which("uv")
    if not uv:
        raise SystemExit("Build needs uv on the developer machine")
    uv_env = os.environ.copy()
    uv_env["UV_CACHE_DIR"] = str(BUILD / "uv-cache")
    if not VENV.is_dir():
        run(uv, "venv", VENV, "--python", PYTHON_BASE / "python.exe", env=uv_env)
    probe = subprocess.run([str(VENV / "Scripts/python.exe"), "-c", "import torch,torchvision,docling,paddle,paddleocr,uvicorn"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if probe.returncode:
        run(uv, "pip", "install", "--python", VENV / "Scripts/python.exe", "torch==2.14.0+cpu", "torchvision==0.29.0+cpu", "--index-url", "https://download.pytorch.org/whl/cpu", env=uv_env)
        # antlr4 4.9.3's source wheel exceeds MAX_PATH under uv's nested cache.
        # pip builds it successfully from Windows' short default TEMP location.
        run(uv, "pip", "install", "--python", VENV / "Scripts/python.exe", "pip", "wheel", env=uv_env)
        run(VENV / "Scripts/python.exe", "-m", "pip", "install", "antlr4-python3-runtime==4.9.3", "--no-build-isolation")
        run(uv, "pip", "install", "--python", VENV / "Scripts/python.exe", "-r", PUBLIC / "backend/requirements.txt", env=uv_env)
    env = os.environ.copy()
    env["PORTABLE_BUILD"] = "1"
    env["NEXT_TELEMETRY_DISABLED"] = "1"
    if os.environ.get("PORTABLE_SKIP_FRONTEND_BUILD") != "1":
        npm = NODE.parent / "npm.cmd"
        run(npm if npm.exists() else "npm.cmd", "ci", "--prefer-offline", cwd=PUBLIC / "frontend", env=env)
        run(npm if npm.exists() else "npm.cmd", "run", "build", cwd=PUBLIC / "frontend", env=env)
    elif not (PUBLIC / "frontend/.next/standalone/server.js").is_file():
        raise SystemExit("PORTABLE_SKIP_FRONTEND_BUILD requires an existing Windows standalone build")
    if not STAGE.resolve().is_relative_to((ROOT / "outputs").resolve()):
        raise SystemExit("Refusing to replace stage outside outputs")
    if STAGE.exists():
        shutil.rmtree(long_path(STAGE))
    STAGE.mkdir(parents=True)
    shutil.copytree(PYTHON_BASE, STAGE / "runtime/python", ignore=ignore_python_base)
    site_packages = STAGE / "runtime/python/Lib/site-packages"
    shutil.copytree(long_path(VENV / "Lib/site-packages"), long_path(site_packages), dirs_exist_ok=True, ignore=ignore_cache)
    # scikit-learn's Windows wheel carries the MSVC OpenMP/C++ runtimes used
    # by scientific extensions; put them next to python.exe for DLL loading.
    for name in ("msvcp140.dll", "vcomp140.dll"):
        bundled_dll = site_packages / "sklearn/.libs" / name
        if bundled_dll.is_file():
            shutil.copy2(bundled_dll, STAGE / "runtime/python" / name)
    # Deep vendor-license paths in torch exceed Windows Explorer's extraction
    # path limit. Keep every license in a shallow, distributable directory.
    for dist_info in long_path(site_packages).glob("*.dist-info"):
        licenses = dist_info / "licenses"
        if not licenses.is_dir():
            continue
        destination = STAGE / "licenses/python" / dist_info.name
        destination.mkdir(parents=True, exist_ok=True)
        for index, license_file in enumerate((path for path in licenses.rglob("*") if path.is_file()), 1):
            shutil.copy2(license_file, destination / f"{index:04d}-{license_file.name}")
        shutil.rmtree(licenses)
    for path in site_packages.glob("*.pth"):
        if any(token in path.read_text(encoding="utf-8", errors="ignore") for token in ("C:\\", "D:\\", "/Users/")):
            path.unlink()
    for direct_url in site_packages.rglob("direct_url.json"):
        direct_url.unlink()
    (STAGE / "runtime/node").mkdir(parents=True)
    shutil.copy2(NODE, STAGE / "runtime/node/node.exe")
    urllib.request.urlretrieve("https://raw.githubusercontent.com/nodejs/node/v24.16.0/LICENSE", STAGE / "runtime/node/LICENSE")
    pandoc = get_pandoc()
    (STAGE / "runtime/pandoc").mkdir(parents=True)
    shutil.copy2(pandoc, STAGE / "runtime/pandoc/pandoc.exe")
    for name in ("COPYRIGHT", "COPYING.md"):
        shutil.copy2(BUILD / f"pandoc-{name}", STAGE / "runtime/pandoc" / name)
    shutil.copytree(PUBLIC / "backend/app", STAGE / "backend/app", ignore=ignore_cache)
    shutil.copytree(PUBLIC / "backend/alembic", STAGE / "backend/alembic", ignore=ignore_cache)
    shutil.copy2(PUBLIC / "backend/alembic.ini", STAGE / "backend/alembic.ini")
    frontend = PUBLIC / "frontend"
    shutil.copytree(frontend / ".next/standalone", STAGE / "frontend", ignore=ignore_bytecode)
    shutil.copytree(frontend / ".next/static", STAGE / "frontend/.next/static")
    shutil.copytree(frontend / "public", STAGE / "frontend/public", ignore=ignore_cache)
    (STAGE / "docs/github").mkdir(parents=True)
    shutil.copy2(PUBLIC / "docs/github/ASSETS.md", STAGE / "docs/github/ASSETS.md")
    (STAGE / "frontend/lib/chronicle").mkdir(parents=True)
    shutil.copy2(PUBLIC / "frontend/lib/chronicle/assets.json", STAGE / "frontend/lib/chronicle/assets.json")
    collect_frontend_licenses()
    shutil.copy2(Path(__file__).with_name("portable_launcher.py"), STAGE / "portable_launcher.py")
    shutil.copy2(Path(__file__).with_name("portable_start.cmd"), STAGE / "启动储能科研平台.cmd")
    shutil.copy2(PUBLIC / "LICENSE", STAGE / "LICENSE")
    (STAGE / "data").mkdir()
    (STAGE / "使用说明.txt").write_text("Windows x64：解压完整文件夹，双击“启动储能科研平台.cmd”。首次启动建库稍等，浏览器会自动打开。按 Ctrl+C 停止。个人数据保存在 data 文件夹。OCR/语音等模型首次使用时会下载到 data/models；部分功能需要联网。\n", encoding="utf-8")
    if os.environ.get("PORTABLE_SKIP_ZIP") == "1":
        print(f"Staged: {STAGE}")
        return
    make_zip()


if __name__ == "__main__":
    main()
