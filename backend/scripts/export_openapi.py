"""Export the FastAPI OpenAPI schema as the single source of truth for types.

Writes ``backend/openapi.json`` from the live app.  The frontend type generator
(``frontend/scripts/generate-api-types.mjs``) consumes this file; never edit the
generated frontend types by hand.

Run from the backend directory (or with ``backend`` on sys.path):

    python -m scripts.export_openapi
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import create_app  # noqa: E402


def main() -> None:
    spec = create_app().openapi()
    destination = Path(__file__).resolve().parents[1] / "openapi.json"
    destination.write_text(
        json.dumps(spec, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"wrote {destination} ({len(spec['paths'])} paths, "
          f"{len(spec.get('components', {}).get('schemas', {}))} schemas)")


if __name__ == "__main__":
    main()
