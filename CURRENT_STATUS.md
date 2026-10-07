# Current status

Updated: 2026-10-07

## Quiz layout and scientific notation

Quiz radio controls are now 22×22px, aligned beside their option text with a 12px gap and at least a 44px clickable row. Prompts, options, explanations and reference points use the existing Markdown/math renderer; common k0 and numeric powers are formatted for display while source text and answer letters remain unchanged. Focused regression and production build passed; isolated desktop-dark and narrow-screen-light checks confirmed alignment, math rendering and label selection. The local frontend was updated. Backend and personal records were unchanged; the existing Windows release ZIP has not been rebuilt.

## PDF page navigation fix

The embedded reader now remounts when paper, PDF variant or selected page changes. Previously only the URL fragment changed while the native PDF viewer stayed on its prior page. Targeted reader tests (5) and the related detail test (1) passed. One frontend build and local frontend deployment succeeded; isolated Edge confirmed next/thumbnail/previous navigation reloads the PDF with no page errors. Backend and personal data were unchanged. The October 4 Windows portable ZIP has not been rebuilt; this fix is in current source.

## Windows x64 portable ZIP — released

GitHub Release [v0.1.0-windows-portable](https://github.com/Viyao691/energy-storage-research-learning-platform/releases/tag/v0.1.0-windows-portable) is published from public `main` commit `d1da8994aa19a128acc5be7bd54b0b433985b7e5`. The asset [Energy-Research-Copilot-Windows-x64.zip](https://github.com/Viyao691/energy-storage-research-learning-platform/releases/download/v0.1.0-windows-portable/Energy-Research-Copilot-Windows-x64.zip) is 926,812,896 bytes (about 884 MiB); GitHub API confirmed the release is published and the uploaded asset size matches.

Cold-start validation passed from a Chinese/space-containing path without Python or Node on system PATH: health, home, dashboard, and local runtime proxy returned HTTP 200; Alembic 0029 and campus seed 67 initialized; synthetic PDF upload returned 201, page image and figure card returned 200, DOCX/PPTX creation returned 201 and downloads had valid PK container signatures. With 3100 occupied, the launcher chose 3101; 8100/3101 closed on exit, temporary data was removed, and stage data was empty. Existing 3001/8001 were untouched. No Office rendering, real-model/OCR-weight acceptance, or full suites ran.

## Release scope

The clean public GitHub release of Energy Research Copilot has been pushed to [`Viyao691/energy-storage-research-learning-platform`](https://github.com/Viyao691/energy-storage-research-learning-platform) on `main`. The public version was created in the independent Git directory `outputs/github-release`; the original development directory, its Git history, and personal data remain preserved and must not be pushed to the new repository. Continue future cloud collaboration from the GitHub repository. A clean download starts with an empty personal library and default Mock model configuration.

The first two commits used `[skip ci]` as requested; no full test suites ran. Docker frontend/backend image builds exited successfully and standalone TypeScript check reported 0 errors. Isolated runtime checks on ports 3018/8019 returned HTTP 200 for health, dashboard, paper API proxy, paper 1 figure thumbnail (PNG), and campus sources. Temporary 3018/8019 services, 3019 dev server, and `outputs/github-preview` synthetic demo data have been removed. Original local 3001/8001 services were left untouched.

The GitHub release includes the Next.js frontend, FastAPI backend, SQLite/Docker Compose local runtime, current feature source, and materials listed in the source/credit manifests. Personal papers, data, local database contents, model weights, and secrets are excluded. Code license: MIT; media follows separate asset rights and attribution records.

## Product boundary

- Runs locally and is operated through a browser; no public website or native mobile apps are provided.
- Single-user local application. Public multi-user hosting requires authentication, user isolation, and production storage choices.
- Campus information connects to Xi'an Jiaotong University public information sources. Availability follows the source sites and network.
- Record only checks actually completed during the release; the first release used `[skip ci]` and no full test suites ran.

## Release docs

- `README.md`: public overview and screenshots.
- `docs/github/PORTABLE.md`: Windows portable package instructions.
- Portable package README/setup link to the published ZIP and release page.
- `docs/github/SETUP.md`: Docker installation and local development setup.
- Backend Docker dependencies use `requirements.lock.txt` for the current Python 3.12 Linux CPU image; Windows local venv uses `requirements.txt`. Frontend Docker build defaults to npmjs and supports optional `NPM_REGISTRY`.
- `docs/github/WORKFLOWS.md`: paper-to-learning and research-data workflows.
- `docs/github/ASSETS.md`: media sources and license boundary.
- `docs/github/RELEASE.md`: public-release handoff.
