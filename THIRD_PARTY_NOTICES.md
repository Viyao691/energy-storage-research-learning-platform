# Third-Party Reuse Notices

This file records third-party code, APIs, and product behavior used by Energy Research Copilot. It does not replace the upstream license texts.

## Direct dependency

### Docling

- Upstream: <https://github.com/docling-project/docling>
- Version: `v2.123.1`
- Audited commit/tag revision: `d745e97`
- License: MIT
- Use: public `DocumentConverter`, `DoclingDocument`, provenance, bounding-box, and pipeline-option APIs behind a local adapter.
- Boundary: remote services and external plugins are disabled; model artifacts are stored locally and are never downloaded implicitly by application actions or automated tests.

### Locally installed experimental model: CodeFormulaV2

- Upstream: <https://huggingface.co/docling-project/CodeFormulaV2>
- Revision: `ecedbe111d15c2dc60bfd4a823cbe80127b58af4`
- Model-card license: CDLA-Permissive-2.0 (separate from Docling's MIT code license).
- Use: explicitly downloaded local model, exercised by `backend/scripts/formula_probe.py` and the opt-in saved-crop endpoint through `backend/app/formula_worker.py` and Docling's existing `CodeFormulaModel`. Not activated in full-paper parsing and not redistributed in Git. `formula_ocr.py` adds offline subprocess execution, a 180-second deadline, and per-process concurrency control.
- Weights SHA-256: `4b04e77af34c4e682a7ab1617628340d658f3c3dcd12456dd2a7fff805cf79d2`.
- Boundary: a single successful crop transcription does not establish automatic formula detection or population accuracy. No user paper or remote inference was used.

## Design and behavior references (not installed)

### Docling-eval

- Upstream: <https://github.com/docling-project/docling-eval>
- Use: reviewed the documented separation of content/layout/table evaluation. The small Harness synthetic regression corpus and scorer are original; no upstream code, datasets, TEDS implementation, or benchmark runtime is included. Results are not official Docling-eval scores.

### Docling Studio

- Upstream: <https://github.com/scub-france/Docling-Studio>
- Version: `v0.7.1`
- Audited commit/tag revision: `e95680a`
- License: MIT
- Use: candidate conversion lifecycle, local converter boundary, bounding-box normalization, and page-overlay interaction were studied and reimplemented for this repository.

### Kotaemon

- Upstream: <https://github.com/Cinnamon/kotaemon>
- License: Apache-2.0
- Use: citation-to-source location propagation behavior was studied. No package or source file is included.

### Open Notebook

- Upstream: <https://github.com/lfnovo/open-notebook>
- License: MIT
- Use: source chat, citations, and editable-note workflow was studied. Phase B2 implements explicit append into the existing note editor with server-verified citation snapshots; no upstream package or source file is included.

### PaperQA2

- Upstream: <https://github.com/Future-House/paper-qa>
- License: MIT
- Use: future offline evidence-quality evaluation reference only. It is not a production dependency.

### RD-Agent

- Upstream: <https://github.com/microsoft/RD-Agent>
- License: MIT
- Use: Phase B2 uses a fixed evidence / limitation / minimum-validation challenge with self-review criteria. No RD-Agent runtime, automated experiment runner, or upstream source is included.

No GPL or AGPL source is copied into this repository by Phase B1.
