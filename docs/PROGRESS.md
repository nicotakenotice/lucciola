# Progress log

Newest entries at the bottom. Each entry: date, task, changes, verification (commands and real
results), known issues. Keep it factual.

## 2026-09-27 — Baseline before the tracking structure

State inherited from earlier work (commits up to `2489bf4`):

- Game complete on desktop: menu, gameplay (3 shadow kinds, swarm, moon dew, waves, dawn), pause,
  end panel with stats, generative music, Italian/English UI.
- Verification available at that point: `tsc --noEmit` and `vite build` passing; manual checks in a
  browser; an ad-hoc bot run in the browser (2 of 3 nights reached dawn, the third died at 148 s).
- Known issues (from a measured review):
  - Portrait phones: the 16:9 stage shrinks to 390×219, text around 4–6 px, unplayable.
  - Landscape phones (844×390): HUD text 7–8 px, too small.
  - No automated tests; ESLint config from the template is incompatible with ESLint 9.
  - `Game.ts` is ~1200 lines; fonts load from Google Fonts; `LICENSE` is the template's.
  - Touch behaviour on real devices never tested (double-tap zoom, long-press callout, iOS audio).

## 2026-09-27 — T01 work-tracking docs

- Added `CLAUDE.md` (resume protocol, work loop, conventions, gotchas), `docs/ROADMAP.md`,
  `docs/PROGRESS.md`, `docs/DECISIONS.md`.
- Verification: documentation only; `npx tsc --noEmit` still passes.

## 2026-09-27 — T02 tooling

- ESLint 9 flat config (`eslint.config.mjs`) replaces the template's `.eslintrc.cjs`; React hook rules
  apply to `src/` only (they misfired on Playwright fixtures).
- Vitest 5 (jsdom) with a first i18n test; Vite bumped 6.3 → 6.4 (Vitest 5 peer requirement).
- Playwright 1.63 with three projects: `desktop` (Chromium 1280×800), `android` (Pixel 7, touch),
  `iphone` (iPhone 14, WebKit, touch). Tests run on port 5174, away from the owner's dev server on 8080.
- Scripts: `typecheck` (app + tools tsconfig), `lint`, `test:unit`, `test:e2e`, `check:dist`,
  `verify:fast`, `verify`. `check:dist` fails if the dev-only hook `__LUCCIOLA__` reaches `dist/`.
- Git hooks in `.githooks/` enabled by `npm install` (`prepare`): `pre-commit` runs `verify:fast`,
  `commit-msg` enforces Conventional Commits and rejects `Co-Authored-By`.
- Repo hygiene: `.gitattributes` (LF), `.editorconfig` fixed (template said CRLF while files were LF),
  three template files converted from CRLF, one trailing whitespace and one missing final newline fixed.
- Verification: `npm run verify` green — typecheck, lint (0 problems), unit 2/2, build, check:dist clean,
  e2e 3/3 (desktop, android, iphone).
- Hook check: `commit-msg` rejected a non-conventional subject and a `Co-Authored-By` trailer, both when
  called directly and through `git commit`.
- Mistake during testing: a first attempt used `git commit --no-verify`, which also skips `commit-msg`,
  and created a non-conforming commit (`f88eeff`); it was removed with `git reset --soft` before any
  push. Lesson: never use `--no-verify` to test hooks.

## 2026-09-27 — T06 desktop end-to-end tests

- Done before T03/T04 on purpose: the tests pin current behaviour before refactoring `Game.ts`.
- Added a typed debug surface (`src/game/debug.ts`, `Game.debug`): `snapshot()`, `set()`,
  `spawnShadow()`, `steerTo()`, `flash()`. Tests use only this contract, not scene internals.
  `window.__LUCCIOLA__` (dev only) exposes `{ game, debug() }`.
- 14 desktop tests in `e2e/desktop/`: menu texts and best score, language toggle persistence,
  sound button (first click starts audio, second mutes, persisted), control layout, Space to start,
  pause freezing time, game over → restart → menu, dawn panel, arrow-key movement, Flash cost and
  effect, Flash below the threshold, and the two focus regressions (toggle + Space, HUD pause + Space).
- Found and fixed while writing them:
  - Bug: the debug accessor returned `null` while the game was paused (`scene.isActive()` is false
    for paused scenes).
  - Flaky tests: they waited for wall time. Measured 57 fps with one browser and 25 fps with three
    in parallel (software WebGL), so game time lagged behind. Tests now wait for game time
    (`advanceGameTime`), end panels get a 15 s timeout, workers capped at 3.
- Verification: desktop suite run 3 times in a row, 14/14 each; `npm run verify` green
  (unit 2/2, check:dist clean, e2e 16/16 including the two mobile smoke tests).
- Known limitation: the debug surface ships in production builds (a few hundred bytes); only the
  window hook is stripped.

## 2026-09-27 — T03 pure game rules

- New `src/game/rules.ts` (no Phaser): light radius, Radiance fade, energy decay, shadow cap, spawn
  interval, double spawns, Moth share, kind selection, shadow stats, light reach, burn rate, Colossus
  dimming, pollen points, dawn bonus, wave size/composition, steering speed. Randomness is injected.
- `TUNING` reorganised by topic; the magic numbers that were inline in `Game.ts` are now named
  parameters with units. Removed the unused `TUNING.hitEnergy` (damage lives in `SHADOWS`).
- Behaviour preserved: each formula was compared with the original expression. One discrepancy was
  caught during review (shade growth would have reached its maximum at 300 s instead of 150 s) and
  fixed before committing by expressing growth per second.
- Verification: unit 20/20 (18 new rule tests), `npm run verify` green, e2e 16/16.

## 2026-09-27 — T04 split `Game.ts`

- New modules: `layout.ts` (depths, HUD band, spawn spots), `entities/` (Firefly, Swarm, PollenField,
  LostFireflies, MoonDew, ShadowHorde), `systems/` (Darkness, Effects), `director.ts` (NightDirector).
- Entities update themselves and return what happened; `Game.ts` applies cross-entity consequences.
  Behaviour constants of Shadows (Moth dash, Colossus bounce, Flash damage…) are named in ShadowHorde.
- `NightDirector` replaces the spawn timers: pure, randomness injected, 6 unit tests.
  One of my new tests was wrong (it assumed the cap stays at its base value) and was corrected.
- Size: `Game.ts` 1,223 → 673 lines. The roadmap target of ~500 was not reached; the remaining code
  is coordination (input, frame order, pickups, contacts, HUD, end of night). Splitting further would
  move cross-entity rules away from the one place meant to hold them, so I stopped here.
- Minor ordering change: lost fireflies are now devoured after all Shadows have moved in a frame,
  instead of during each Shadow's update. Not observable in play.
- Verification: typecheck and lint clean; unit 26/26; `npm run verify` green with e2e 16/16 (these
  tests were written before the split). Visual check with a throwaway Playwright script against the
  dev server: Colossus, Moth and Shade on screen, a Flash dissolving Moth (+30) and Shade (+25) while
  the Colossus resisted; no page errors.
- Added `docs/ARCHITECTURE.md` describing the new structure.

## 2026-09-27 — T05 unit tests for i18n, rich text and storage

- Structure fix found while writing the tests: `localStorage` access (with its try/catch) was repeated
  in three places and the best-score functions lived in `constants.ts`. Now `src/storage.ts` owns
  every access and the keys; `src/game/score.ts` owns the best score (also rejects negative or
  garbage values, which were previously read as-is).
- Tests: storage (normal and throwing storage), best score, dictionaries (same keys, same tags and
  parameters per key, balanced tags, no empty text), i18n (browser-language detection, saved choice
  wins, switching persists and notifies, interpolation), `<Rich>` rendering (tags, colour classes,
  escaping).
- Verification: unit 165/165 across 7 files (most are per-key dictionary checks); `npm run verify`
  green, e2e 16/16.

## 2026-09-27 — T07 mobile improvements

- Portrait: `RotateNotice` covers the screen and `useAutoPause` pauses a running game.
- Text minimums with `max(px, cqw)`: HUD 12 px (labels ≥ 10 px), menu body 12 px, hints 11 px,
  panels 13 px. Desktop sizes are unchanged (the cqw value is larger there).
- Touch: `touch-action: manipulation` (no double-tap zoom), no tap highlight, no long-press callout or
  text selection on the stage.
- Fullscreen button (menu and HUD) only where the Fullscreen API exists; tries to lock landscape.
- Audio unlock also listens to `touchend` and `click` (iOS ignores `pointerdown`).
- Keyboard hints hidden in the pause and end panels on touch devices.
- Quality: `App.tsx` logic moved to hooks (`useMediaQuery`, `useFullscreen`, `useAudioUnlock`,
  `useAutoPause`); `PhaserGame.tsx` rewritten without the template's unused ref and without
  `removeListener(event)` that dropped every listener of the event.
- Bug found by the tests under heavy machine load (load average 18–23): the keyboard listener was
  re-registered after paint on every screen change, so a panel could be visible while its keys were
  not handled yet; Space-to-start/restart tests timed out. The listener is now registered once and
  reads the screen from a ref synced in a layout effect. Desktop suite then passed 3/3 runs under the
  same load.
- Test fix: `.menu-corner .icon-button` became ambiguous with the fullscreen button; tests now target
  `[data-audio-toggle]`.
- Verification: unit 173/173, `npm run verify` green, e2e 16/16. Mobile behaviour itself is verified in T08.

