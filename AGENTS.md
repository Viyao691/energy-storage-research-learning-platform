# Repository collaboration rules

## Work style

- Before making a material change, identify the user-visible goal, state assumptions, and ask only when a real product choice is unresolved.
- Prefer a concise plan and the smallest change that solves the request. Do not add speculative features or reformat unrelated code.
- For multi-step work, define a practical success condition and use one targeted check when behavior changes. Avoid repeated scans, full suites, hashes, and cosmetic rechecks unless a concrete failure requires them.
- Use a high-capability model for planning/review and Sol or Luna for implementation when available. Be clear if a requested model is unavailable.

## Project boundaries

- This is Energy Research Copilot: a local-first Chinese energy-storage research and learning Web application built with Next.js, FastAPI, SQLite, and Docker Compose.
- Preserve the existing frontend/backend architecture and established user workflows. Inspect the relevant source before describing or changing a feature.
- Keep API keys, `.env` files, local databases, uploaded papers, personal datasets, generated private analysis, and machine-local models out of Git. Never request secrets in chat; use `.env.example` and local configuration.
- Public UI, research teaching materials, and their source/credit manifests belong in the release. MIT covers project code only; follow per-asset rights and attribution records for media.
- Fresh installs should start with an empty user library while retaining application features and public interface assets.
- The app is a responsive Web application. Do not describe it as a native mobile app or claim multi-user public hosting is ready without authentication and user-data isolation.

## Architecture invariants

- Preserve the accepted homepage in `frontend/components/home-hero/` and `frontend/public/home-hero/`.
- Business services use `ModelProvider`; FastAPI routes remain grouped by domain under `backend/app/routers/`.
- Generate API response types from the backend OpenAPI schema; keep `backend/openapi.json` and `frontend/lib/api.generated.d.ts` in sync.
- Store uploaded PDFs in private local storage outside static web assets and preserve file validation and path-safety rules.
- Keep evidence states explicit: Mock output, full text, abstract-only, metadata-only, and model inference must not be conflated.

## Changes and documentation

- Persist database schema changes through Alembic migrations.
- Keep generated OpenAPI and frontend API types in sync with schema changes.
- Update the root README and `docs/github/` setup/material notes when public setup, behavior, or licensing scope changes.
- Report only checks that were actually run and the practical scope they cover.
