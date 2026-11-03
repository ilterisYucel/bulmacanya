# AGENTS-APP.md

Client app guidance for Bulmacanya. Read root `AGENTS.md` first; see README §3 for spec details.

## Stack and structure

- Ionic/React + Capacitor: one codebase ships web (PWA) and iOS/Android.
- Lives under `apps/` (Nx workspace); shared types/contracts in `packages/shared`.
- UI strings and user-facing copy are **Turkish**.

## Game shell

- All games run inside a shared **game shell** that centrally handles score, level completion, hints, saves, and ad triggering (README §3.3).
- Games attach as independent, lazy-loaded modules.

## Ads

- Rewarded video only, shown solely on user request (hint, extra life, retry); 8/day cap. No banners, no interstitials (README §7.5).

## Accounts and sync

- Free users: local device only, no cross-device sync. Web↔mobile sync is a subscriber feature (README §7.2.4) — don't build sync UI for free users.
