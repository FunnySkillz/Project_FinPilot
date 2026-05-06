# FinPilot

FinPilot is a mobile-first personal finance and insurance cockpit built with Expo Router.

The current MVP is local-first and backend-ready:

- Manual expense tracking with fixed and variable monthly summaries
- Document vault for PDF/JPG/PNG uploads plus editable metadata
- Seeded sample data for contracts, insurance, fines, and warranty receipts
- Placeholder OCR analysis behind a replaceable service boundary
- Grounded document Q&A placeholders that always state uncertainty
- Purchase risk checks based on income, savings, fixed costs, and buffer targets

## Run locally

```bash
npm install
npm run web
```

For native development:

```bash
npm run android
npm run ios
```

## Checks

```bash
npm run lint
npx tsc --noEmit
npx expo export --platform web
```

## MVP boundary

This version intentionally does not include bank sync, real OCR, real AI calls, auth, SteuerFuchs integration, or multi-user household support. Those should plug into the existing services layer later.

