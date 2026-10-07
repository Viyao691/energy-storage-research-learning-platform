# Release verification

## 2026-10-07 Paper diagrams and output budget

- Subsequent offline Codex repair: six private report diagram tails were completed from local evidence, preserving existing prose. An isolated Edge preview rendered all eight diagrams in those six reports with no page errors; saved API content then matched each repaired field. No DeepSeek calls ran. Compatible report versions were retained, and diagram captions/evidence status identify the Codex contribution. Private evidence and backups are not included here.
- Flowchart pipe-label regression: red1 failed/12 skipped; green13 passed. Final backend targeted group12 passed/57 deselected, covering incomplete fenced/unfenced diagrams, CRLF, valid diagram prose, DeepSeek64000 report budgets, length responses and failed-report preservation.
- One frontend build and a backend source refresh using installed dependencies passed. Frontend/backend deployment passed; after backend health became ready, health and the frontend paper proxy succeeded.
- Isolated Edge confirmed both quick-understanding diagrams render for the affected example. Existing truncated diagrams in other report tabs remain incomplete; no missing scientific content was invented. No page errors occurred.
- No paid-model calls, full suites or Windows archive rebuilds ran. Actual64000 model completion has not been verified; prior failed response details are unavailable. The later offline repair changed only the targeted local report diagram tails and provenance; private contents remain excluded from GitHub.

## 2026-10-07 Quiz layout and notation

- Focused quiz regression: red 1 failed/22 skipped (missing subscript rendering), green 1 passed/22 skipped. The test verifies rendering and original option-letter submission after clicking the label.
- Initial frontend build found optional explanation text passed to a string-only renderer. After adding a presence check, the necessary rebuild and frontend deployment passed. Green regression preceded that small type fix; the final build and runtime checks cover the final source.
- Isolated Edge at desktop-dark 1920px and narrow-screen-light 390px: radios22×22px, fixed12px text gap, minimum44px rows, aligned controls, options within viewport and label click selection. A scientific-notation question rendered one subscript and four powers with no math or page errors.
- No real answers were submitted, personal data changed, models called, full suites run or Windows ZIP rebuilt.

## 2026-10-07 PDF navigation

- Reader regression: red 2 failed/3 passed; green 5 passed. Related paper-detail test: 1 passed/39 skipped.
- The broader paper-experience file returned 35 passed/5 failed; only help and external-comparison heading failures were identifiable in truncated output. It is not reported as passing; no full suites ran.
- One frontend production build and local-only frontend update passed. Isolated Edge confirmed next, thumbnail and previous replace the iframe and reload the local PDF (4 requests including initial load), with no page errors.
- No manual inspection of the internal PDF toolbar; its independent controls do not report page changes to outer state. The existing Windows release archive remains unchanged.

## Windows x64 portable runtime cold-start acceptance

- One Windows portable build succeeded and complete Windows backend dependencies were installed. The runtime bundles Python 3.12, Node 24, Pandoc and OCR runtime libraries, with a local runtime proxy, Mock defaults and empty `data`.
- Cold-start passed from a temporary path containing Chinese characters and spaces, with neither Python nor Node on system PATH. Health, home, dashboard and runtime proxy returned HTTP 200; the empty database initialized Alembic 0029 and campus seed 67. Synthetic PDF upload returned 201; page image and figure card returned 200; DOCX/PPTX creation returned 201 and downloads had PK container format.
- With port 3100 occupied, the launcher selected 3101. On exit, 8100/3101 closed; temporary data was deleted and stage data is empty. Existing 3001/8001 were untouched.
- Final asset `Energy-Research-Copilot-Windows-x64.zip`: 926,812,896 bytes (about 884 MiB), empty `data`, bundled licenses and asset manifest. GitHub API confirmed `v0.1.0-windows-portable` is published and the asset is uploaded at the expected size: [Release](https://github.com/Viyao691/energy-storage-research-learning-platform/releases/tag/v0.1.0-windows-portable) · [Download](https://github.com/Viyao691/energy-storage-research-learning-platform/releases/download/v0.1.0-windows-portable/Energy-Research-Copilot-Windows-x64.zip).
- No Office rendering, real-model/OCR-weight acceptance, or full suites ran.

Release preparation on 2026-10-04:

- Docker frontend image build: exit 0.
- Docker backend image build: exit 0.
- TypeScript check: 0 errors.
- Independent release runtime: ports 3018/8019; health, dashboard, paper API proxy, paper 1 figure thumbnail (image/png, 61,989 bytes), and campus sources returned HTTP 200.
- Six public screenshots exist at 1280×720 initial viewport. Home-dark was captured from the viewport after fullPage capture failed; the other five used fullPage capture. No image edits were made.
- Full frontend/backend test suites: not run for this release-preparation pass.
- Initial push to public `main` succeeded; both release commits used `[skip ci]`. Temporary release containers/dev server and synthetic preview data were removed; original local 3001/8001 were not changed.

These results cover the release-preparation revision only. They do not claim full-suite, end-to-end, or production deployment acceptance.
