"""Offline acceptance with a synthetic PDF; never opens the user's library."""
import json
from pathlib import Path
import tempfile

import fitz

from app.document_parsers import DoclingDocumentParser


def main():
    with tempfile.TemporaryDirectory(prefix="harness-docling-smoke-") as directory:
        path = Path(directory) / "synthetic.pdf"
        with fitz.open() as document:
            page = document.new_page()
            page.insert_text((72, 72), "Synthetic sodium battery research", fontsize=18)
            page.insert_text((72, 110), "A controlled experiment compares capacity retention after 100 cycles.")
            page.insert_text((72, 140), "This synthetic document is for local parser acceptance only.")
            document.save(path)
        parsed = DoclingDocumentParser(artifacts_path=Path("/app/models/docling")).parse(
            path, is_cancelled=lambda: False
        )
        assert len(parsed.pages) == 1
        assert "capacity retention" in parsed.full_text
        assert parsed.pages[0].width > 0 and parsed.pages[0].height > 0
        assert parsed.pages[0].elements
        print(json.dumps({"pages": len(parsed.pages), "characters": len(parsed.full_text),
                          "elements": len(parsed.pages[0].elements), "offline_smoke": "passed"}))


if __name__ == "__main__":
    main()
