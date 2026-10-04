# Risk Register

| Risk | Mitigation |
|---|---|
| Malformed or hostile PDF | MIME/signature/size validation, parse errors handled, never execute embedded content |
| Unsupported scanned PDF | report low parse confidence and advise high-quality PDF; OCR is Phase 2 |
| Duplicate papers | SHA-256 uniqueness and HTTP 409 with existing record |
| Key disclosure | server-only env loading; masked settings DTO; no front-end env key |
| Hallucinated analysis | provenance/evidence labels and Mock-demo notice |
| Paid-source infringement | Phase 1 accepts only user uploads; no automated acquisition |
| Docker absent on developer machine | compose files supplied; local non-Docker verification documented |
| Provider outage/cost | mock fallback, timeout/budget preferences, diagnostic and connection test |
