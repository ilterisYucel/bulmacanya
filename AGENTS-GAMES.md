# AGENTS-GAMES.md

Game module guidance for Bulmacanya. Read root [AGENTS.md](AGENTS.md) first. Product rules are distilled here; check README §2, §3.3, §4, §7.3.2 only when full spec detail is needed.

## Engine

- `@pixi/react` is the main engine.

## Portfolio and status (README §2)

- Existing vanilla JS games to modernize and integrate: Tetris-based image-forming game (vanilla Pixi.js), Reflex, Calculation.
- New games by phase: Memory and Word (idea stage), Maze and Programming (planned). Platformer is out of scope.

## Integration contract (game shell)

- Every game is an independent module plugged into the shared game shell (lazy-loaded); the shell owns score, level completion, hints, saves, and ad triggers (README §3.3).
- Game result → skill coefficient matrix (README §4.3) → skill points formula (§4.4) → profile level → content unlock.
- Respect per-game hint costs (README §7.3.2): 1 coin standard, 1–2 for Word, 2 for Maze, 2–3 for Programming and hard/special daily puzzles.
