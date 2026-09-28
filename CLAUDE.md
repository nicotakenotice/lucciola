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
- Code style is enforced by ESLint (`@stylistic`): Allman braces, 4 spaces; run `npx eslint . --fix`.
- Commits: Conventional Commits in English (`feat(scope): …`, `fix: …`, `refactor: …`, `test: …`,
  `docs: …`, `chore: …`). Never add `Co-Authored-By` or other attribution trailers.
- Every game lives in its own folder under `~/Repos/games`; never write files outside `lucciola/`.
- The repository is public on GitHub (`nicotakenotice/lucciola`) and every push to `main` deploys the
  game to GitHub Pages: push only commits that passed `npm run verify`, and only when the owner asks.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server on http://localhost:8080 |
| `npm run verify:fast` | Typecheck + lint + unit tests |
| `npm run verify` | `verify:fast` + end-to-end tests (including the production build) + bundle check |
| `npm run test:unit` | Vitest unit tests |
| `npm run test:e2e` | Playwright: desktop Chromium, Android Chromium, iPhone WebKit, production build (built first) |
| `npm run balance` | Headless bot playing seeded nights; see `docs/BALANCE.md` |
| `npm run build` | Production build into `dist/` |
| `npm run package` | Build, check and zip `dist/` into `lucciola-web.zip` for itch.io |
| `npm run images` | Regenerate icon PNGs (from `public/logo.svg`) and README screenshots; rerun after visual changes |

## Where things are

See `docs/ARCHITECTURE.md` for the module map, `docs/TESTING.md` for the test strategy,
`docs/BALANCE.md` for difficulty measurements and `docs/DEPLOY.md` for publishing.
Tooling lives in `scripts/` (`bot.mjs`, `balance.mjs`, `images.mjs`, `check-dist.mjs`, `package.mjs`)
and `.githooks/`.

## Gotchas learned the hard way

- Phaser 4 `RenderTexture` buffers commands: call `.render()` after drawing, or nothing shows.
  Erasing uses `stamp(..., { blendMode: BlendModes.ERASE })`.
- The stylesheet must be imported from `src/main.tsx`; a `<link>` in `index.html` is not hot-reloaded.
- Chrome throttles `requestAnimationFrame` and timers in background tabs: when driving the game from
  automation, step it manually (`game.step`) and yield with `MessageChannel`, not `setTimeout`.
- Browsers start audio only after a user gesture; iOS needs `touchend`/`click`, not `pointerdown`.
- Phaser 4 tweens run on the wall clock (`Date.now()`), not on the step delta: when stepping the game
  faster than real time (bot), tweened visuals lag behind. Gameplay is unaffected; for screenshots the
  bot plays the last seconds in real time (`realtimeTail`).
- In dev builds `window.__LUCCIOLA__` exposes the game, the debug API and `TUNING` for tests, the balance
  bot and debugging (stripped in production). Tests use only `GameDebugApi` (`src/game/debug.ts`).
- Subscribe to the EventBus before the event can fire: `PhaserGame` subscribes to `scene-ready`
  before `StartGame`, because iOS Safari readies the Menu before React's passive effects run.
- Playwright's WebKit is not iOS Safari: check mobile changes in the iOS Simulator too (`verify` skill).
- The production build installs a service worker: a browser profile that opened `vite preview` may
  keep serving the previous build until the next launch. Use a fresh context (tests do) or unregister it.
- Clean up EventBus subscriptions with `onSceneExit()` (`src/game/lifecycle.ts`), not `once('destroy')`.
- Gameplay numbers belong in `TUNING`/`SHADOWS`; after changing one, run `npm run balance` and record it.
- Shell pitfalls seen here: zsh does not split unquoted variables into words and macOS `grep -Z` means
  "decompress"; prefer a short Python script for bulk edits, and re-grep to confirm.
- Other projects in `~/Repos/games` may run headless browsers and load the CPU: if e2e timings look
  flaky, check `uptime` and run with `PW_WORKERS=1` before changing tests.
- The player's real best score lives in `localStorage` (`lucciola.best`): tests must use isolated
  browser contexts and never touch the user's own browser profile.
