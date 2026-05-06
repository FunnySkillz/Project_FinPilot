# FinPilot

FinPilot is a mobile-first personal finance and insurance cockpit built with Expo Router.

The current MVP is local-first and backend-ready:

- Manual expense tracking with fixed and variable monthly summaries
- Document vault for PDF/JPG/PNG uploads plus editable metadata
- Seeded sample data for contracts, insurance, fines, and warranty receipts
- Placeholder OCR analysis behind a replaceable service boundary
- Grounded document Q&A placeholders that always state uncertainty
- Purchase risk checks based on income, savings, fixed costs, and buffer targets
- Blueprint production shell with onboarding, runtime theme mode, i18n, and app lock

## UI stack

- gluestack-style local primitives for Box, Card, Button, Heading, Text, VStack, HStack, and form controls
- NativeWind + Tailwind className styling for custom React Native components
- Custom FinPilot theme tokens in `constants/finpilot.ts` as the design source of truth
- lucide-react-native for all active app icons

## Production shell

The app shell follows the reusable Blueprint pattern from `Project_Blueprint`:

- Root bootstrap restores local state, language, theme mode, onboarding status, and app lock state.
- Fresh installs enter onboarding before the main tabs.
- Settings is a native stack with Appearance, Language, Security, Legal, and Data pages.
- Light, dark, and system theme modes share the same token source of truth.
- English and German dictionaries drive navigation and shell/settings copy.
- App lock uses biometrics first with SecureStore-backed PIN fallback.
- Local data reset clears PIN/app-lock state.

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

This version intentionally does not include bank sync, real OCR, real AI calls, cloud auth, SteuerFuchs integration, or multi-user household support. Those should plug into the existing services layer later.
