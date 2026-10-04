"""Offline diagnosis of the synthetic fraction: detection versus known-region OCR.

The ground-truth crop is supplied, NOT automatically detected. This script never
connects to the application database or activates a parser candidate.
"""
import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path
from time import perf_counter


def formula_matches(actual, expected):
    # Only whitespace equivalence; retain order, case and fraction structure.
    return "".join(actual.split()) == "".join(expected.split())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--corpus", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--artifacts", type=Path, default=Path("/app/models/docling"))
    args = parser.parse_args()

    import fitz
    from PIL import Image
    from docling_core.types.doc import DoclingDocument, DocItemLabel
    from docling.models.stages.code_formula.code_formula_model import (
        AcceleratorOptions, CodeFormulaModel, CodeFormulaModelOptions,
        ItemAndImageEnrichmentElement,
    )
    from app.document_parsers import DoclingDocumentParser

    manifest = json.loads((args.corpus / "expected.json").read_text(encoding="utf-8"))
    case = next(case for case in manifest["cases"] if case["file"] == "fraction-formula.pdf")
    block = case["blocks"][0]
    pdf = args.corpus / case["file"]
    args.output.mkdir(parents=True, exist_ok=True)
    baseline = DoclingDocumentParser(artifacts_path=args.artifacts).parse(
        pdf, is_cancelled=lambda: False)
    model = CodeFormulaModel(
        enabled=True, artifacts_path=args.artifacts,
        options=CodeFormulaModelOptions(do_code_enrichment=False, do_formula_enrichment=True),
        accelerator_options=AcceleratorOptions(device="cpu", num_threads=4),
    )
    document = DoclingDocument(name="synthetic-fraction-probe")
    eligible = []
    for page in baseline.pages:
        for element in page.elements:
            if element.label not in {"text", "formula"}:
                continue
            item = document.add_text(label=DocItemLabel(element.label), text=element.text)
            if model.is_processable(document, item):
                eligible.append(element.element_id)
    with fitz.open(pdf) as source:
        pixmap = source[block["page"] - 1].get_pixmap(
            matrix=fitz.Matrix(120 / 72, 120 / 72), clip=fitz.Rect(block["bbox"]), alpha=False)
        crop = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
    crop.save(args.output / "known-region.png")
    item = document.add_text(label=DocItemLabel.FORMULA, text="")
    started = perf_counter()
    output = list(model(document, [ItemAndImageEnrichmentElement(item=item, image=crop)]))[0].text
    # Independent fixture transcription, never passed to the recognition model.
    expected = r"Q=\frac{It}{m}"
    report = {
        "scope": "Synthetic known-region probe; NOT automatic formula detection or real-paper accuracy",
        "docling_version": importlib.metadata.version("docling"),
        "model": "docling-project/CodeFormulaV2",
        "pdf_sha256": hashlib.sha256(pdf.read_bytes()).hexdigest(),
        "automatic_eligible_regions": eligible,
        "known_region_bbox": block["bbox"], "dpi": 120,
        "expected_latex": expected, "actual_latex": output,
        "known_region_exact_match": formula_matches(output, expected),
        "recognition_seconds": round(perf_counter() - started, 2),
        "automatic_detection_fixed": False,
    }
    (args.output / "report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)
    raise SystemExit(0 if report["known_region_exact_match"] else 2)


if __name__ == "__main__":
    main()
