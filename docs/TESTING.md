# Testing

## Layers

| Layer | Tool | Where | Covers |
|---|---|---|---|
| Types and style | `tsc`, ESLint (`@stylistic`) | `npm run typecheck`, `npm run lint` | app code, tests, scripts |
| Unit | Vitest (jsdom) | `src/**/*.test.ts(x)`, `scripts/**/*.test.mjs` | pure rules, NightDirector, i18n, storage, best score, `<Rich>`, balance CLI arguments |
| End-to-end, desktop | Playwright, Chromium 1280×800 | `e2e/desktop/` | menu, language, sound, pause, game over, dawn, controls, fonts; gameplay: rescue, swarm shields, Colossus, Radiance, combo, new best, blur pause, hints |
| End-to-end, mobile | Playwright, Pixel 7 (Chromium) and iPhone 14 (WebKit), landscape, touch | `e2e/mobile/` | layout fit, text sizes, touch controls, audio unlock, portrait notice |
| End-to-end, production | Playwright against `vite preview` of `dist/` | `e2e/production/` | the shipped build runs, no dev hook, no external requests |
| Bundle check | `scripts/check-dist.mjs` | `npm run check:dist` | no dev hook or Google Fonts URLs in `dist/` |
| Balance | `scripts/balance.mjs` | `npm run balance` | difficulty, measured on seeded nights (not a pass/fail test) |

`npm run verify` runs all of them except balance (the production project builds `dist/` itself).
The pre-commit hook runs `verify:fast`.

## Writing end-to-end tests

- Use the fixtures in `e2e/fixtures.ts`: `openMenu`, `startGame`, `snapshot`, `setGame`,
  `advanceGameTime`, `gameToPage`, `fontSize`. The `errors` fixture fails any test whose page logs
  an error.
- Read and drive the game only through `GameDebugApi` (`src/game/debug.ts`), never through scene
  internals: the contract is what keeps refactors cheap.
- On a machine already busy with other headless browsers, run with fewer workers:
  `PW_WORKERS=1 npm run test:e2e`.
- With `CI` set (GitHub Actions), Playwright uses one worker, longer timeouts, and game-time waits
  get 3× more room: GitHub runners render WebGL in software on 2 vCPUs and the game can drop to a
  couple of frames per second there.
- Wait for **game time** (`advanceGameTime`), not wall time. WebGL is software-rendered in headless
  browsers and slows down under load; the game clamps long frames, so game time lags wall time.
- Prefer specific selectors (`[data-audio-toggle]`) over positional ones (`.icon-button` became
  ambiguous when the fullscreen button arrived).
- Every test runs in a fresh browser context: `localStorage` starts empty and the owner's real
  browser profile is never touched.
- After a suite passes on the first try, check it can fail: break the behaviour on purpose, confirm
  the test goes red, restore. PROGRESS records the mutation checks done so far.

## Runtime verification

`.claude/skills/verify/SKILL.md` describes how to run the game and the CLIs and observe a change
like a player (desktop, phone profile, packaged build from a sub-path). T17 came from such a run.

## Manual checks on real devices

Emulation catches layout and input logic, not everything. Before publishing, on a real phone:

1. iPhone (Safari) in landscape: music starts after the first tap, the Flash button responds
   without zooming, a long press shows no callout, the notch does not cover the HUD.
2. Android (Chrome): the fullscreen button works and locks landscape; rotating to portrait shows the
   notice and pauses.
3. Both: the game keeps a smooth frame rate in the middle of a wave (many particles).

Serve the dev build on the local network with `npm run dev -- --host` and open the printed
address on the phone.
