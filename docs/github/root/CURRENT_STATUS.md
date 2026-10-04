# Current status

Updated: 2026-10-04

## Release scope

Preparing the clean public GitHub release of Energy Research Copilot. The public `main` repository [Viyao691/energy-storage-research-learning-platform](https://github.com/Viyao691/energy-storage-research-learning-platform) has been created; the release source is awaiting its first push. The release preserves public interface assets, research teaching imagery, and campus public-information feature. A clean download starts with an empty personal library and default Mock model configuration.

Current release-preparation checks: Docker frontend and backend image builds exited successfully; standalone TypeScript check reported 0 errors. In the isolated release runtime on ports 3018/8019, backend health, dashboard, paper API proxy, paper 1 figure thumbnail (PNG), and campus sources returned HTTP 200. The full test suites were not run in this release-preparation pass.

The GitHub release includes the Next.js frontend, FastAPI backend, SQLite/Docker Compose local runtime, current feature source, and materials listed in the source/credit manifests. Personal papers, data, local database contents, model weights, and secrets are excluded. Code license: MIT; media follows separate asset rights and attribution records.

## Product boundary

- Responsive Web app; no native Android/iOS client yet.
- Single-user local application. Public multi-user hosting requires authentication, user isolation, and production storage choices.
- Campus information connects to Xi'an Jiaotong University public information sources. Availability follows the source sites and network.
- Do not infer that a build, test suite, live server, or public GitHub repository is verified from this status file. Record only checks actually completed during the current release task.

## Release docs

- `README.md`: public overview and screenshots.
- `docs/github/SETUP.md`: Docker installation and local development setup.
- Backend Docker dependencies use `requirements.lock.txt` for the current Python 3.12 Linux CPU image; Windows local venv uses `requirements.txt`. Frontend Docker build defaults to npmjs and supports optional `NPM_REGISTRY`.
- `docs/github/WORKFLOWS.md`: paper-to-learning and research-data workflows.
- `docs/github/ASSETS.md`: media sources and license boundary.
- `docs/github/RELEASE.md`: public-release handoff.
