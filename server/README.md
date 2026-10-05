# FinPilot AI proxy

Small local backend for FinPilot's cloud AI features. It keeps `OPENAI_API_KEY` off the phone and exposes only app-specific endpoints.

## Run locally

```powershell
Copy-Item .env.example .env
$env:OPENAI_API_KEY = "sk-..."
npm run dev
```

The mobile app reads `expo.extra.aiBaseUrl` from `app.json`; use `http://localhost:8787` for web/iOS simulator and your machine LAN IP for physical devices.

## Endpoints

- `GET /health`
- `POST /v1/documents/analyze`
- `POST /v1/ask`

The server logs request IDs, route, status, and latency only. It does not log document text, file bytes, prompts, or answers.

## Bank transaction import

`POST /v1/transactions/extract` accepts a base64 PDF, PNG, JPEG or WebP (maximum 8 MB), `mimeType`, `language` and explicit `cloudConsent: true`. Consent is checked before any provider call. The app additionally requires cloud AI, document consent and cloud/hybrid OCR settings, plus a per-file Upload and read action.

This implementation uses the configured OpenAI model for both PDF text/page images and screenshot extraction. It is not on-device OCR. Files are not added to the document vault; reviewed expenses are persisted together only on final save. Credits and unknown directions require review, and only expenses in the configured app currency can be saved (no currency conversion). Maximum 200 extracted rows per file; larger statements must be split.

Set OPENAI_API_KEY on the server and configure expo.extra.aiBaseUrl to a reachable server address (localhost does not reach your computer from a physical iPhone). Rebuild an existing native development client after adding expo-clipboard.

Validation: npm run test:bank-import from the project root. Tests use synthetic data and do not call OpenAI. For device acceptance, import a PDF with selectable text, a scanned PDF and a screenshot; edit/skip/back through entries, confirm duplicate warnings, finish saving, then verify Home totals and persistence after restart. Test extraction errors, cancellation and storage failures without losing reviewed drafts.
