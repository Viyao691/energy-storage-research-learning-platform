"""Small repository secret-pattern gate with an explicit detector self-test."""

from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path


PATTERNS = [
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"sk-[A-Za-z0-9]{32,}"),
    re.compile(r"(?i)(api[_-]?key|secret[_-]?key|password)[ \t]*[=:][ \t]*['\"]?[A-Za-z0-9+/=_-]{20,}"),
]


def detect(text: str) -> bool:
    return any(pattern.search(text) for pattern in PATTERNS)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test and not detect("API_KEY=" + "sk-" + "a" * 40):
        raise SystemExit("secret detector self-test failed")
    root = Path(__file__).resolve().parents[2]
    files = subprocess.run(["git", "ls-files"], cwd=root, capture_output=True, text=True, check=True).stdout.splitlines()
    findings = []
    for name in files:
        path = root / name
        try: content = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError): continue
        if any(detect(line) and "secret-scan: allow" not in line for line in content.splitlines()): findings.append(name)
    if findings: raise SystemExit("possible secrets in tracked files: " + ", ".join(findings))
    print(f"secret scan passed ({len(files)} tracked files)")


if __name__ == "__main__":
    main()
