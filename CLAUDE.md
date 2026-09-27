# Lucciola — working notes for Claude

Atmospheric survival game: Phaser 4 (gameplay) + React 19 (UI) + TypeScript, bundled with Vite.
Everything needed to resume work lives in this repository, not in chat history.

## Resume protocol

1. Read `docs/ROADMAP.md`: pick the first task that is not `done` (or the one `in progress`).
2. Read the latest entry of `docs/PROGRESS.md` to see what happened last and any open issue.
3. Run `git status` and `git log --oneline -5`; uncommitted changes belong to the task in progress.
4. Run `npm run verify:fast` to confirm the baseline is green before touching anything.

## Work loop (every task, no exceptions)

1. Implement the smallest coherent change for the task.
2. Run `npm run verify` (typecheck, lint, unit tests, build, end-to-end tests).
   Fix failures; never mark a task done with a red check.
3. Update `docs/ROADMAP.md` (status) and append an entry to `docs/PROGRESS.md` with:
   date, task id, what changed, verification commands and their real results, known issues.
   Be objective: record failures, skipped checks and limitations as they are.
4. Record non-obvious choices in `docs/DECISIONS.md`.
5. Commit (see conventions). The git hooks re-check lint/types/unit tests and the message format.

## Conventions

- Code, identifiers, comments and docs in English. Player-facing texts live in `src/i18n/` (it, en).
- Comments only when they explain something the code doesn't (why, constraints, units).
- Commits: Conventional Commits in English (`feat(scope): …`, `fix: …`, `refactor: …`, `test: …`,
  `docs: …`, `chore: …`). Never add `Co-Authored-By` or other attribution trailers.
- Every game lives in its own folder under `~/Repos/games`; never write files outside `lucciola/`.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev-nolog` | Dev server on http://localhost:8080 (the `dev` script also pings Phaser's analytics) |
| `npm run verify:fast` | Typecheck + lint + unit tests |
| `npm run verify` | `verify:fast` + production build + end-to-end tests |
| `npm run test:unit` | Vitest unit tests |
| `npm run test:e2e` | Playwright tests (desktop Chromium, Android Chromium, iPhone WebKit) |
| `npm run balance` | Headless bot playing seeded nights; see `docs/BALANCE.md` |
| `npm run build-nolog` | Production build into `dist/` |

## Where things are

See `docs/ARCHITECTURE.md` for the module map, `docs/TESTING.md` for the test strategy.

## Gotchas learned the hard way

- Phaser 4 `RenderTexture` buffers commands: call `.render()` after drawing, or nothing shows.
  Erasing uses `stamp(..., { blendMode: BlendModes.ERASE })`.
- The stylesheet must be imported from `src/main.tsx`; a `<link>` in `index.html` is not hot-reloaded.
- Chrome throttles `requestAnimationFrame` and timers in background tabs: when driving the game from
  automation, step it manually (`game.step`) and yield with `MessageChannel`, not `setTimeout`.
- Browsers start audio only after a user gesture; iOS needs `touchend`/`click`, not `pointerdown`.
- In dev builds `window.__LUCCIOLA__` exposes the game for tests and debugging (stripped in production).
- The player's real best score lives in `localStorage` (`lucciola.best`): tests must use isolated
  browser contexts and never touch the user's own browser profile.
