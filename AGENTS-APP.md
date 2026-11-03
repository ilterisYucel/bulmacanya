# AGENTS-APP.md

Client app guidance for Bulmacanya. Read root [AGENTS.md](AGENTS.md) first. Product rules are distilled here; check README §3 only when full spec detail is needed.

## Stack and structure

- Ionic/React + Capacitor: one codebase ships web (PWA) and iOS/Android.
- Lives under `apps/` (Nx workspace); shared types/contracts in `packages/shared`.

## Frontend architecture

- **FSD (Feature-Sliced Design)**: organize code in slices — `app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/`; imports flow inward only (upper layers depend on lower, never vice versa).
- **FSD lint = Steiger** (official linter): dev deps `steiger` + `@feature-sliced/steiger-plugin`, root `steiger.config.ts` with `fsd.configs.recommended`; runs as part of the lint stage (`npx steiger ./src`).
- **FSD agent skill**: `.opencode/skills/feature-sliced-design` — load it when structuring new slices/deciding code placement.
- **Atomic Design**: compose UI bottom-up — atoms → molecules → organisms → templates → pages.

## Game shell

- All games run inside a shared **game shell** that centrally handles score, level completion, hints, saves, and ad triggering (README §3.3).
- Games attach as independent, lazy-loaded modules.

## Ads

- Rewarded video only, shown solely on user request (hint, extra life, retry); 8/day cap. No banners, no interstitials (README §7.5).

## Accounts and sync

- Free users: local device only, no cross-device sync. Web↔mobile sync is a subscriber feature (README §7.2.4) — don't build sync UI for free users.
