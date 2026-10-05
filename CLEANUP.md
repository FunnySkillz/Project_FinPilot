# FinPilot redundancy review

Review scope: app screens, components, contexts, services, hooks, utilities and server. Existing uncommitted feature work is preserved. Generated output and dependencies are excluded.

## Prioritized work list

All six tasks completed. The descriptions below record the original findings and planned fixes.

- [x] **P1 - Shared form parsing.** Amount parsing is copied across expenses, onboarding, documents, purchases, settings and bank import. Only bank import handles German thousands separators consistently; purchase validation also lets NaN through. Date defaults and comma-separated tags are repeated. Extract shared parsers, retain optional-field rules, validate invalid values and use local calendar dates.
- [x] **P1 - Shared context operations.** Three document picker actions repeat selection, analysis and persistence; single/batch expense insertion repeats the same update; initial/retry state loading repeats success/error handling. Consolidate these paths while preserving cancel, failure and persistence behavior.
- [x] **P2 - One document ranking algorithm.** Local assistant scoring and cloud snippet selection use different tokenization, searchable fields and tie breaking. Share Unicode-aware ranking and preserve the five-document / 4,000-character cloud limits.
- [x] **P2 - Shared domain helpers.** Payment method lists, expense/document/theme label functions and cloud-extraction eligibility checks are copied in multiple files. Reuse one definition per rule, keeping cloud extraction permission distinct from general document-chat permission.
- [x] **P2 - One source of preference state.** Theme/language memory caches duplicate persisted settings and change before persistence succeeds. Remove those caches; resolve the active theme once for navigation and content.
- [x] **P3 - Remove confirmed unused/redundant code.** Unreferenced color-scheme hooks and formatShortDate are leftover helpers. Expense validation repeats checks already enforced above. Remove only verified unused code and redundant branches.

## Deliberately separate

- Bank imports keep temporary file input and explicit upload consent; document imports copy files into the vault. Their file lifecycle is intentionally different.
- Native bank review navigation blocks leaving during extraction/save; ordinary forms use a discard confirmation. They are related but not interchangeable.
- Stored-data migration normalization is distinct from new-form validation; legacy expense kinds/cadences must remain supported.
- Server validation remains independent of client checks because API input is untrusted.
- Reset-project tooling is explicitly exposed by package.json, so it is not dead code.

## Verification

Passed:

- npm run release:preflight: lint, TypeScript and English/German parity.
- npm run test:bank-import: 7 tests, including permission gating and extraction validation.
- npm run test:cleanup: 10 tests covering shared parsers, Unicode ranking, local calendar dates, saved preferences, migration, cancelled/failed imports, single/batch persistence, cloud payload limits and load/retry lifecycle.
- Expo web export: all 30 routes built successfully into .expo/cleanup-web.
- git diff --check: passed.

Native device UI and live cloud extraction were not exercised in this cleanup.

## Resulting shared code

- utils/form-input.ts and utils/dates.ts own form amount/tag parsing and calendar-date handling. Forms retain their own required/optional and positive/zero business rules.
- context/finpilot-context.tsx owns one document insertion pipeline, one expense insertion path and one state-loading path. The documents screen shares picker/loading/error handling.
- utils/document-search.ts ranks documents for both assistant paths.
- i18n/index.ts owns repeated label mappings; utils/finance.ts owns the payment method list; utils/ai-permissions.ts owns cloud consent/eligibility rules.
- Persisted settings are the sole language/theme preference source, and ThemedShell consumes the theme provider's resolved mode.
- Removed the two preference-cache services, two unreferenced color-scheme hooks, unused short-date formatter and redundant expense validation branches.

Behavior fixes: German grouped amounts work consistently; invalid purchase/document amounts cannot pass silently; dates reject calendar rollovers; calendar-only dates stay on the local day; invalid expense end dates are rejected. Existing bank import and Ask FinPilot accordion work was preserved.
