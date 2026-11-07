# AGENTS.md

## Layered guides (binding)

This instruction set is split by layer — read the file(s) matching the work you're doing; all are binding:

- [AGENTS-BACKEND.md](AGENTS-BACKEND.md) — Bun/Fastify/PostgreSQL service
- [AGENTS-APP.md](AGENTS-APP.md) — Ionic/React client app + shared game shell
- [AGENTS-GAMES.md](AGENTS-GAMES.md) — individual game modules

## Geliştirme İş Akışı (mandatory order)

1. **SPEC** — `docs/<MODUL>-SPEC.md`: scope, components, contracts, FR-x requirements, GWT acceptance scenarios, AK acceptance criteria, T task list. Canonical format: [`docs/SPEC-SABLONU.md`](docs/SPEC-SABLONU.md).
2. **JSDoc** — interface/type + behavior contract: states, edge cases, error categories, side effects, limits.
3. **TEST** — `*.test.ts` (**RED**): pins the contract; must fail while no implementation exists.
4. **IMPL** — minimal implementation (**GREEN**) + refactor: only code that turns tests green; Elegant Object + DI rules.
5. **KAPANIŞ** — **no separate doc**: update the same SPEC doc with §A DOĞRULAMA (change matrix, test evidence, AK evidence, deviations, visual check) + §B TEST KAPSAMI (scenario matrix + KAPSANMAYAN gaps), with `review_date`.

> The ponytail plugin (`.opencode`, project-scoped) applies **on top of** this workflow: it may simplify *how* a task is implemented, but it never overrides the SPEC → JSDoc → TEST (RED) → IMPL order, the KAPANIŞ update, or the acceptance gates.

Doc naming: SPEC postfix is `-SPEC.md`.

## Plan Modu Kuralı (OpenCode)

- Plan modunda repo dosyası DEĞİŞTİRİLMEZ — SPEC/plan içeriği dahil hiçbir dosya yazılmaz; tek ürün konuşmadaki plandır.
- SPEC dahil tüm plan içeriği plan modunda konuşmada üretilir; **dosyaya yazım implementasyon moduna (build) geçişte yapılır.**
- `~/.opencode/plan/` dizini KULLANILMAZ (VSCode'da görünmeyen gereksiz kopya — 2026-11-04 kararı).
- İstisna: kullanıcı aynı mesajda açıkça "docs'a yaz" derse plan modunda da yazılır.

## Architecture (decided)

- **Nx monorepo**: `apps/` holds client app, games, backend; `packages/shared` holds common types + contracts.
- **`packages/shared` placement rule**: only types used by MORE THAN ONE app go to shared; a single-app type lives under that app (e.g. `IDatabasePort` is in `apps/backend/src/domain/ports/`, NOT in shared).
- Backend: pure hexagonal — `domain/`/`application/`/`infra/`/`presentation/`; REST, CLI, desktop attach simultaneously; 3rd-party deps only via contracts, facades in packages → [AGENTS-BACKEND.md](AGENTS-BACKEND.md)
- App: Ionic/React + Capacitor, one codebase (web PWA + iOS/Android); shared game shell owns score/hints/saves/ad triggers → [AGENTS-APP.md](AGENTS-APP.md)
- Games: `@pixi/react` engine, lazy-loaded modules on the game shell → [AGENTS-GAMES.md](AGENTS-GAMES.md)

## Conventions

- Numbers marked "başlangıç" in README (skill coefficients, level thresholds, prices) are initial values to be tuned, not final.
- When product decisions change, bump the "Sürüm" line and "Değişiklik notu" at the top of `README.md` — that's the repo's changelog.
- Review gate: `bun run check` includes `check:contracts` (contract `I`-prefix + DIP audit) — a constructor typed with a concrete class or third-party type in `domain/`/`application/` fails the gate.


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax


<!-- nx configuration end-->