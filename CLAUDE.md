# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server (http://localhost:5173)
npm test          # Vitest – all unit/integration tests (run mode, exits)
npm run test:watch
npm run build     # tsc -b && vite build (typecheck is part of the build)
npm run typecheck # tsc -b --noEmit only
npm run preview   # serve the production build
```

Run a single test file or test by name:

```bash
npx vitest run src/game/trick.test.ts
npx vitest run -t "Stechen"
```

Tests are colocated as `src/**/*.test.ts` and run in Node (no DOM); the UI is validated
manually / via the Playwright MCP server, not unit-tested.

## Architecture

Single-page, fully client-side game (no backend). Strict layering — **dependencies only point
downward**: `ui → state → ai → game`. The `game` engine never imports React/ai/state.

- **`src/game/`** — pure, framework-independent rules engine, the source of truth and the
  most heavily tested layer. `GameState` is a plain serializable object. All transitions
  (`placeBid`, `playCard`, `nextRound` in `engine.ts`) are pure: they `structuredClone` the
  state and return a new one — never mutate in place. `currentActor(state)` tells you whose
  turn it is and whether a bid or a card is expected; the engine is a UI-driven state machine
  (it does not loop on its own).

- **`src/ai/`** — three difficulty strategies behind one `Ai` interface (`decideBid`,
  `chooseCard`). The AI must only use legally visible information: always go through
  `buildView(state, playerId)` (`observation.ts`), which redacts hidden hands. `decideBid`
  Monte-Carlo–samples consistent worlds (`sampling.ts`) and rolls them out (`simulate.ts`,
  which reuses `game/trick.ts` for rule-correct stechen/erben). `chooseCard` is a
  target-aware heuristic (`policy.ts`) for all levels.

- **`src/state/store.ts`** — Zustand store wrapping the engine. The human calls `humanBid` /
  `humanPlay`; `runAi()` is an async loop that advances every AI actor with delays for
  watchability and stops when it's the human's turn or the round/game ends. When a trick
  completes, it sets `trickFlash` so the UI can show the finished trick before the engine's
  already-started next trick renders. Audio (`sound.ts`) is synthesized via Web Audio — no
  asset files. Player-facing options (sound/music + the configurable rule set) are persisted
  to `localStorage` via `src/state/settings.ts` and fed into the game as `GameConfig.rules`.

- **`src/ui/`** — React + Tailwind v4 + Framer Motion. Components read `game` from the store
  and import engine selectors (`legalBids`, `legalPlays`, `currentActor`) directly. German
  UI strings and rank/suit labels live in `src/i18n/de.ts`.

## Rules that the code encodes (easy to get wrong)

- **Custom rank order** (one place: `RANKS` in `game/cards.ts`, ascending strength):
  `6 < 7 < 8 < banner(10) < under < ober < koenig < 9 < ass`. The **9 is second-highest**;
  the 10/Banner sits below the Under. Suits have **no** value (no follow-suit) — only rank wins.
- **Scoring** (`game/scoring.ts`, overrides the PDF): exact bid → **+10 flat**; otherwise
  **−5 × |bid − tricks|**. The +10 / −5 values are configurable via `GameConfig.rules`
  (`hitScore` / `missPenalty`); the constants are only defaults.
- **Stechen / multi-credit**: a tie replays a layer for everyone; the eventual winner is
  credited one trick *per layer consumed*, so **Σ tricks in a round always equals the card
  count** (an invariant asserted in `engine.test.ts`). On the last card a tie is resolved by
  the next-lower card ("Erben", `trick.ts`).
- **Bidding constraints** (`game/bidding.ts`): the dealer bids last and may not make the
  sum of bids equal the card count (hook rule); nobody may bid 0 twice in a row; the hook
  rule wins if the two constraints conflict. The no-double-zero rule never applies in the
  1-card round and can be toggled off via `GameConfig.rules.doubleZeroRule`.
- The engine is **rule-configurable** via the optional `GameConfig.rules` (`GameRules` in
  `game/types.ts`, defaults in `DEFAULT_RULES`): `doubleZeroRule`, `hitScore`, `missPenalty`.
  Engine code reads these instead of the bare constants. Add further variants here rather
  than hard-coding them into the UI.
