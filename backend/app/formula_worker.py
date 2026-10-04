"""Short-lived Docling worker, launched only by an explicit crop action."""
from pathlib import Path
import sys


def main():
    from PIL import Image
    from docling_core.types.doc import DoclingDocument, DocItemLabel
    from docling.models.stages.code_formula.code_formula_model import (
        AcceleratorOptions, CodeFormulaModel, CodeFormulaModelOptions,
        ItemAndImageEnrichmentElement,
    )
    source, output, artifacts = map(Path, sys.argv[1:])
    model = CodeFormulaModel(
        enabled=True, artifacts_path=artifacts,
        options=CodeFormulaModelOptions(do_code_enrichment=False, do_formula_enrichment=True),
        accelerator_options=AcceleratorOptions(device="cpu", num_threads=4),
    )
    document = DoclingDocument(name="manual-formula-crop")
    item = document.add_text(label=DocItemLabel.FORMULA, text="")
    with Image.open(source) as image:
        result = list(model(document, [ItemAndImageEnrichmentElement(
            item=item, image=image.convert("RGB"))]))[0].text
    output.write_text(result, encoding="utf-8")


if __name__ == "__main__":
    main()
