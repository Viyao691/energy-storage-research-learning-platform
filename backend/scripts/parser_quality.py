"""Small offline regression corpus, not a population-level scientific benchmark."""
import argparse
from collections import Counter
from dataclasses import asdict
import hashlib
import importlib.metadata
import json
from pathlib import Path
import re
from time import perf_counter

from app.document_parsers import DoclingDocumentParser


def _normalize(text):
    return " ".join(text.replace("|", " ").replace("−", "-").split())


def _iou(a, b):
    intersection = max(0, min(a[2], b[2]) - max(a[0], b[0])) * max(
        0, min(a[3], b[3]) - max(a[1], b[1]))
    union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - intersection
    return intersection / union if union > 0 else 0


def evaluate(document, expected):
    if not expected["blocks"]:
        raise ValueError("A nonempty independent ground truth is required")
    results = []
    for block in expected["blocks"]:
        candidates = [
            element for page in document.pages if page.page_number == block["page"]
            for element in page.elements if element.label == block["label"]
        ]
        best = max(candidates, key=lambda e: _iou(
            [e.left, e.top, e.right, e.bottom], block["bbox"]), default=None)
        overlap = _iou([best.left, best.top, best.right, best.bottom], block["bbox"]) if best else 0
        text = best.text if best and overlap >= 0.5 else ""
        lines = [_normalize(line) for line in text.splitlines()]
        rows = block["rows"]
        row_recall = sum(_normalize(row) in lines for row in rows) / len(rows)
        pattern = r"(?<![\w.])[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?"
        wanted = Counter(re.findall(pattern, "\n".join(rows)))
        actual = Counter(re.findall(pattern, text.replace("−", "-")))
        numeric_recall = sum((wanted & actual).values()) / sum(wanted.values()) if wanted else None
        results.append({
            "page": block["page"], "label": block["label"], "bbox_iou": round(overlap, 4),
            "row_recall": row_recall, "numeric_recall": numeric_recall,
            "expected_rows": rows, "actual_text": text,
            "passed": overlap >= 0.5 and row_recall == 1 and numeric_recall in (None, 1),
        })
    return {"blocks": results, "passed": all(result["passed"] for result in results)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--corpus", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--artifacts", type=Path, default=Path("/app/models/docling"))
    args = parser.parse_args()
    manifest = json.loads((args.corpus / "expected.json").read_text(encoding="utf-8"))
    args.output.mkdir(parents=True, exist_ok=True)
    converter = DoclingDocumentParser(artifacts_path=args.artifacts)
    report = {"scope": "Synthetic regression only; not real-paper accuracy",
              "docling_version": importlib.metadata.version("docling"), "cases": []}
    for case in manifest["cases"]:
        pdf = args.corpus / case["file"]
        started = perf_counter()
        parsed = converter.parse(pdf, is_cancelled=lambda: False)
        result = evaluate(parsed, case)
        result.update(file=case["file"], sha256=hashlib.sha256(pdf.read_bytes()).hexdigest(),
                      seconds=round(perf_counter() - started, 2), warnings=parsed.warnings)
        (args.output / (pdf.stem + ".parsed.json")).write_text(
            json.dumps(asdict(parsed), ensure_ascii=False, indent=2), encoding="utf-8")
        report["cases"].append(result)
        print(json.dumps({"file": case["file"], "passed": result["passed"],
                          "metrics": [{k: v for k, v in b.items() if k not in ("actual_text", "expected_rows")}
                                      for b in result["blocks"]]}), flush=True)
    report["passed"] = all(case["passed"] for case in report["cases"])
    (args.output / "report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    # A failed quality gate is data, never silently presented as success.
    raise SystemExit(0 if report["passed"] else 2)


if __name__ == "__main__":
    main()
