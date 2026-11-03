# AGENTS-BACKEND.md

Backend guidance for Bulmacanya. Read root [AGENTS.md](AGENTS.md) first. Business rules live in module SPECs (`docs/<MODUL>-SPEC.md`) and README §3.4/§4/§7 — this file only covers how backend code is structured.

## Stack and structure

- Bun + Fastify + PostgreSQL, REST API, JWT/session auth (README §3.1).
- Lives under `apps/` (Nx workspace); shared types/contracts in `packages/shared`.

## Hexagonal architecture (pure)

- Layers: `domain/`, `application/`, `infra/`, `presentation/`. Strict dependency direction toward the domain.
- `presentation/` is transport-agnostic: REST, CLI, and desktop clients attach to the same domain/application and can connect **simultaneously**.
- All third-party dependencies (DB, etc.) are consumed **only through contracts/interfaces** defined by domain/application; concrete adapters live in `infra/`. Packages expose facades — no third-party classes leak into domain/application code.

## Contract rules

- Method-bearing contract interfaces carry an **`I` prefix** (`IDatabasePort`); data shapes, classes, enums do not.
- `domain/` and `application/` take constructor dependencies **only through I-contracts** — a concrete class or third-party type as constructor param fails `bun run check:contracts` (root `scripts/check-contracts.ts`, wired into `bun run check`).
- Single-app types stay in this app: `IDatabasePort` lives in `apps/backend/src/domain/ports/`, NOT in `packages/shared` (shared = multi-app types only).

## Business rules

- Business rules are **not defined here** — they live in the module's SPEC (`docs/<MODUL>-SPEC.md`: FR-x, AK, K-x decisions) and in README §7 (monetization), §4 (progression). Read the relevant SPEC before implementing.
- Data model tables are listed in README §3.4 (`users`, `skills`, `profile`, `progress`, `sessions`, `achievements`, `hints`, `coins`, `subscriptions`, `daily_puzzle`).
