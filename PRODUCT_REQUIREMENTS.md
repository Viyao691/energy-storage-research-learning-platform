# Product Requirements — Phase 0/1

## Users and outcomes

The primary user is an undergraduate storage-science researcher who needs a local, Chinese-language research workspace. They can upload a legal PDF, see extraction status, save it, receive a clearly labelled explanation/analysis, and retain notes after a restart.

## Functional requirements

1. Upload PDFs safely; reject non-PDF, oversize, duplicate or malformed files with Chinese errors.
2. Extract text and page count, persist a paper record and the original file hash.
3. List and open papers, show source availability, extracted text preview, analysis and user note.
4. Run a Mock analysis without any key; configurable real providers use a backend-only OpenAI-compatible adapter.
5. First-run wizard captures usage mode, model choice, research topics/keywords, digest time and budgets.
6. Settings mask keys and may test a provider connection; diagnostics exposes service health without secrets.

## Non-functional requirements

Local-first persistent SQLite/files; Windows-friendly scripts; Compose deployment; model cost fields; migration path; no Codex runtime dependency; explicit analysis provenance.
