# Current status

Updated: 2026-10-04

## Release scope

The clean public GitHub release of Energy Research Copilot has been pushed to [`Viyao691/energy-storage-research-learning-platform`](https://github.com/Viyao691/energy-storage-research-learning-platform) on `main`. The public version was created in the independent Git directory `outputs/github-release`; the original development directory, its Git history, and personal data remain preserved and must not be pushed to the new repository. Continue future cloud collaboration from the GitHub repository. A clean download starts with an empty personal library and default Mock model configuration.

The first two commits used `[skip ci]` as requested; no full test suites ran. Docker frontend/backend image builds exited successfully and standalone TypeScript check reported 0 errors. Isolated runtime checks on ports 3018/8019 returned HTTP 200 for health, dashboard, paper API proxy, paper 1 figure thumbnail (PNG), and campus sources. Temporary 3018/8019 services, 3019 dev server, and `outputs/github-preview` synthetic demo data have been removed. Original local 3001/8001 services were left untouched.

The GitHub release includes the Next.js frontend, FastAPI backend, SQLite/Docker Compose local runtime, current feature source, and materials listed in the source/credit manifests. Personal papers, data, local database contents, model weights, and secrets are excluded. Code license: MIT; media follows separate asset rights and attribution records.

## Product boundary

- Responsive Web app; no native Android/iOS client yet.
- Single-user local application. Public multi-user hosting requires authentication, user isolation, and production storage choices.
- Campus information connects to Xi'an Jiaotong University public information sources. Availability follows the source sites and network.
- Record only checks actually completed during the release; the first release used `[skip ci]` and no full test suites ran.

## Release docs

- `README.md`: public overview and screenshots.
- `docs/github/SETUP.md`: Docker installation and local development setup.
- Backend Docker dependencies use `requirements.lock.txt` for the current Python 3.12 Linux CPU image; Windows local venv uses `requirements.txt`. Frontend Docker build defaults to npmjs and supports optional `NPM_REGISTRY`.
- `docs/github/WORKFLOWS.md`: paper-to-learning and research-data workflows.
- `docs/github/ASSETS.md`: media sources and license boundary.
- `docs/github/RELEASE.md`: public-release handoff.
