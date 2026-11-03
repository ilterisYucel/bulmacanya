# AGENTS.md

## Repo status

- This repo contains **no code yet**: the only file is `README.md`, a Turkish product/design spec (doc version "Sürüm 0.5"). There are no manifests, build configs, tests, or CI. Don't hunt for source files or a build system — neither exists.
- `README.md` is the canonical spec. Read it before writing code; implementation is expected to follow its tech stack and roadmap phases (Faz 0 → 4).
- Useful sections: §3 tech stack, §4-5 skill/profile systems, §7 monetization rules, §11 roadmap, §12 risks, §13 open questions.

## Split instruction set

Agent guidance is split by layer. Read the file(s) matching the work you're doing; all are binding:

- `AGENTS-BACKEND.md` — Bun/Fastify/PostgreSQL service
- `AGENTS-APP.md` — Ionic/React client app and the shared game shell
- `AGENTS-GAMES.md` — individual game modules

## Language

- Project content is Turkish (docs, design terms, future UI strings). Keep product-facing text in Turkish. Instruction files are in English.

## Architecture (decided, not yet in code)

- **Nx monorepo**: `apps/` holds the client app, games, and backend; `packages/shared` holds common types and contracts shared across apps.
- Backend is pure hexagonal (see `AGENTS-BACKEND.md`); app is Ionic/React + Capacitor (see `AGENTS-APP.md`); games use `@pixi/react` (see `AGENTS-GAMES.md`).

## Product decisions to respect (from README)

These were made deliberately and are easy to violate by "simplifying":

- Stack: Ionic/React + Capacitor (one codebase, web = PWA); game engine `@pixi/react`, **Phaser only if necessary**; backend Bun + Fastify + PostgreSQL (REST, JWT auth).
- Platformer game is **out of scope**.
- Ads: **rewarded video only** — no banners, no interstitials, 8 rewarded ads/day cap.
- Coins and subscription are **independent products**: no coin discount for subscribers (subscribers get +5 coins/month instead).
- "Sezgi" skill stays **passive** in the first version (activates later via profile level).
- Web↔mobile progress sync is **subscriber-only**; free users play on one device only.
- Content is unlocked by playing, never paywalled; subscription is a speed advantage only.

## Conventions when code lands

- Numbers marked "başlangıç" in README (skill coefficients, level thresholds, prices) are initial values to be tuned, not final.
- When product decisions change, bump the "Sürüm" line and "Değişiklik notu" at the top of `README.md` — that's the repo's changelog.
