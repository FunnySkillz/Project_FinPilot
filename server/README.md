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
