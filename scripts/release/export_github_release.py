"""Build a fresh, source-only GitHub release tree under outputs/github-release."""

from __future__ import annotations

import json
import re
import shutil
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "outputs" / "github-release"
MARKER = ".release-export"

ROOT_FILES = (
    ".env.example",
    ".env.production.example",
    ".gitignore",
    "LICENSE",
    "README.md",
    "API_DESIGN.md",
    "ARCHITECTURE.md",
    "BACKUP_RESTORE.md",
    "CONTRIBUTING.md",
    "DATA_MODEL.md",
    "DEPLOYMENT.md",
    "PAGE_MAP.md",
    "PRIVACY.md",
    "PRODUCT_REQUIREMENTS.md",
    "RISK_REGISTER.md",
    "SETUP_WINDOWS.md",
    "THIRD_PARTY_NOTICES.md",
    "backup.ps1",
    "create_desktop_shortcut.ps1",
    "docker-compose.yml",
    "docker-compose.gpu.yml",
    "docker-compose.harness.yml",
    "docker-compose.production.yml",
    "restore.ps1",
    "start.ps1",
    "stop.ps1",
    "test_compose_security.ps1",
)

TREE_DIRS = (
    ".github/workflows",
    "backend/alembic",
    "backend/app",
    "backend/scripts",
    "backend/tests",
    "deploy",
    "docs/research",
    "docs/github",
    "frontend/app",
    "frontend/components",
    "frontend/lib",
    "frontend/public",
    "frontend/scripts",
    "frontend/tests",
    "launcher",
    "scripts/release",
)

TREE_FILES = (
    "backend/.dockerignore",
    "backend/Dockerfile",
    "backend/alembic.ini",
    "backend/locustfile.py",
    "backend/openapi.json",
    "backend/pyproject.toml",
    "backend/requirements.txt",
    "backend/requirements.lock.txt",
    "backend/requirements-dev.txt",
    "frontend/.dockerignore",
    "frontend/Dockerfile",
    "frontend/next-env.d.ts",
    "frontend/next.config.ts",
    "frontend/package.json",
    "frontend/package-lock.json",
    "frontend/tsconfig.json",
    "scripts/test_backup_script.ps1",
    "scripts/test_restore_script.ps1",
)

# Retired 3D scene code and its old preview routes are not used by /dashboard.
SKIP_PATHS = {
    "frontend/app/hero-integration",
    "frontend/app/hero-visual-lab",
    "frontend/app/hero-workspace",
    "frontend/components/home-hero/Scene.tsx",
    "frontend/components/home-hero/StillLife.tsx",
    "frontend/components/home-hero/DeskObjects.tsx",
    "frontend/components/home-hero/LightDesk.tsx",
    "frontend/components/home-hero/NightWindow.tsx",
    "frontend/components/home-hero/activation-effects.ts",
    "frontend/components/home-hero/campus.ts",
    "frontend/components/home-hero/earth-land.json",
    "frontend/components/home-hero/earth-textures.ts",
    "frontend/components/home-hero/interactions.ts",
    "frontend/components/home-hero/orb-baseline.js",
    "frontend/components/home-hero/orb-live.ts",
    "frontend/components/home-hero/orb-network.ts",
    "frontend/public/home-hero/models",
    "frontend/public/home-hero/motion",
    "frontend/public/home-hero/city-theme.json",
    "frontend/public/home-hero/scene-layout.json",
    "frontend/public/home-hero/environment-light.png",
    "frontend/public/home-hero/ivory-mineral-albedo.png",
    "frontend/public/home-hero/still-life-atlas.png",
}

FORBIDDEN_SUFFIXES = {
    ".db", ".sqlite", ".sqlite3", ".pem", ".key", ".p12", ".pfx",
    ".glb", ".gltf", ".blend", ".fbx", ".obj", ".mtl", ".stl",
    ".usd", ".usdz", ".pdf", ".docx", ".pptx", ".xlsx", ".zip",
    ".exe", ".dll", ".so", ".dylib", ".pyc",
}
TEXT_SUFFIXES = {
    ".css", ".csv", ".html", ".js", ".json", ".md", ".mjs", ".ps1",
    ".py", ".sh", ".svg", ".toml", ".ts", ".tsx", ".txt", ".yml", ".yaml",
}
SECRET_PATTERNS = (
    re.compile(r"(?<![A-Za-z0-9])(?:sk-[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|AIza[A-Za-z0-9_-]{20,})"),
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"(?i)(?:C:" + r"\\Users\\" + r"|C:/" + r"Users/)[^\\/\s]+"),
)


def skipped(relative: Path) -> bool:
    path = relative.as_posix()
    return any(path == item or path.startswith(item + "/") for item in SKIP_PATHS)


def copy_file(relative: Path, stage: Path) -> None:
    source = ROOT / relative
    if not source.is_file() or skipped(relative):
        return
    if source.suffix.lower() in FORBIDDEN_SUFFIXES or source.name.startswith(".env") and source.name not in {".env.example", ".env.production.example"}:
        raise ValueError(f"Forbidden release file: {relative.as_posix()}")
    if source.stat().st_size > 100 * 1024 * 1024:
        raise ValueError(f"Release file exceeds 100 MB: {relative.as_posix()}")
    target = stage / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def copy_tree(directory: Path, stage: Path) -> None:
    source = ROOT / directory
    if not source.is_dir():
        return
    for item in source.rglob("*"):
        if not item.is_file():
            continue
        relative = item.relative_to(ROOT)
        if skipped(relative) or any(part in {"__pycache__", "node_modules", ".next", ".venv", ".pytest_cache"} for part in relative.parts):
            continue
        if directory == Path("docs/research") and item.suffix.lower() not in {".md", ".json"}:
            continue
        copy_file(relative, stage)


def remove_retired_references(stage: Path) -> None:
    layout = stage / "frontend/components/home-hero/feature-layout.ts"
    text = layout.read_text(encoding="utf-8")
    marker = "export type PhotographicFeatureId"
    if marker not in text:
        raise ValueError("Photographic home layout changed; review release transform")
    layout.write_text(text[text.index(marker):], encoding="utf-8")

    shell = stage / "frontend/components/workspace/WorkspaceShell.tsx"
    text = shell.read_text(encoding="utf-8")
    old = 'pathname === "/" || pathname === "/dashboard" || pathname.startsWith("/hero-")'
    if old not in text:
        raise ValueError("Legacy route reference changed; review release transform")
    shell.write_text(text.replace(old, 'pathname === "/" || pathname === "/dashboard"'), encoding="utf-8")

    test = stage / "frontend/tests/workspace-shell.test.tsx"
    text = test.read_text(encoding="utf-8")
    old = '["/dashboard", "/hero-workspace", "/hero-integration", "/hero-visual-lab"]'
    if old not in text:
        raise ValueError("Legacy route test changed; review release transform")
    test.write_text(text.replace(old, '["/dashboard"]'), encoding="utf-8")

    package = stage / "frontend/package.json"
    data = json.loads(package.read_text(encoding="utf-8"))
    retired = ("@react-three/drei", "@react-three/fiber", "@react-three/postprocessing", "postprocessing")
    for name in retired:
        data["dependencies"].pop(name, None)
    package.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lock = stage / "frontend/package-lock.json"
    lock_data = json.loads(lock.read_text(encoding="utf-8"))
    for name in retired:
        lock_data["packages"][""]["dependencies"].pop(name, None)
    lock.write_text(json.dumps(lock_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def scan_text(stage: Path) -> None:
    findings: list[str] = []
    for path in stage.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES and path.name not in {".env.example", ".env.production.example", "Caddyfile", "Dockerfile", ".gitignore"}:
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for line_number, line in enumerate(content.splitlines(), 1):
            if any(pattern.search(line) for pattern in SECRET_PATTERNS):
                findings.append(f"{path.relative_to(stage).as_posix()}:{line_number}")
    if findings:
        print("Possible secret or personal path in candidate text (values withheld):", file=sys.stderr)
        print("\n".join(findings), file=sys.stderr)
        raise ValueError("Release text requires review")


def main() -> None:
    if (OUTPUT / ".git").exists():
        raise ValueError(f"Refusing to replace a Git repository: {OUTPUT}")
    OUTPUT.parent.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="github-release-", dir=OUTPUT.parent) as temp:
        stage = Path(temp)
        for name in ROOT_FILES + TREE_FILES:
            copy_file(Path(name), stage)
        for name in TREE_DIRS:
            copy_tree(Path(name), stage)
        remove_retired_references(stage)
        scan_text(stage)
        (stage / MARKER).write_text("Generated by scripts/release/export_github_release.py\n", encoding="utf-8")
        if OUTPUT.exists():
            if not (OUTPUT / MARKER).is_file():
                raise ValueError(f"Refusing to replace an unmarked directory: {OUTPUT}")
            shutil.rmtree(OUTPUT)
        shutil.copytree(stage, OUTPUT)
    count = sum(path.is_file() for path in OUTPUT.rglob("*"))
    print(f"Exported {count} files to {OUTPUT}")


if __name__ == "__main__":
    main()
