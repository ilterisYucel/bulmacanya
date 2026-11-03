# AGENTS-BACKEND.md

Backend guidance for Bulmacanya. Read root `AGENTS.md` first; see README §3.4, §4, §7 for spec details.

## Stack and structure

- Bun + Fastify + PostgreSQL, REST API, JWT/session auth (README §3.1).
- Lives under `apps/` (Nx workspace); shared types/contracts in `packages/shared`.

## Hexagonal architecture (pure)

- Layers: `domain/`, `application/`, `infra/`, `presentation/`. Strict dependency direction toward the domain.
- `presentation/` is transport-agnostic: REST, CLI, and desktop clients attach to the same domain/application and can connect **simultaneously**.
- All third-party dependencies (DB, etc.) are consumed **only through contracts/interfaces** defined by domain/application; concrete adapters live in `infra/`. Packages expose facades — no third-party classes leak into domain/application code.

## Business rules to enforce (spec in README)

- Hint quotas (§7.3): 2 free/day, 15 subscriber/day, +8 via rewarded ads (8 ads/day cap), reset at midnight local; coin-purchased hints accumulate.
- Coin economy (§7.3.2, §7.4): 1 coin = 1 standard hint; per-game costs 1–3 coins. Subscribers get +5 coins/month, no purchase discount.
- Subscription (§7.2): 25 TL/month, 250 TL/year, 7-day free trial (valid payment method required); trial→paid conversion tracked (target ≥20%).
- Sync (§7.2.4): cross-device progress sync only for subscribers.
- Progression (§4.4-4.5): skill points = base × coefficient × success × difficulty; daily skill caps; replaying a solved level yields 20%.
- Data model: tables in README §3.4 (`users`, `skills`, `profile`, `progress`, `sessions`, `achievements`, `hints`, `coins`, `subscriptions`, `daily_puzzle`).
