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

## 2026-09-27 — T08 mobile end-to-end tests

- Projects now use landscape devices: `android` = Pixel 7 landscape (863×360, Chromium, touch),
  `iphone` = iPhone 14 landscape (750×340, WebKit, touch). Portrait is tested by rotating the viewport.
- 10 tests per device (20 total) in `e2e/mobile/`: menu fits the stage, minimum text sizes (menu, HUD),
  touch instructions and no keyboard hints, fullscreen button only where supported, tap-to-move without
  firing a Flash, the Flash button, audio unlocked by a first tap, end panel on touch, rotate notice in
  portrait, auto-pause when rotating mid-game and pause panel when rotating back.
- All 20 passed on the first run, so I checked they can fail (mutation check, then restored):
  removing the menu text minimum → 1 failure; letting a tap fire a Flash → 1 failure; disabling the
  rotate notice → 2 failures.
- Visual check with WebKit iPhone landscape screenshots (menu, HUD, pause, portrait): all readable and
  inside the screen; the fullscreen button is absent in WebKit, as intended.
- Limitation: this is emulation. Real iOS audio policy, notches/safe areas and real touch latency are
  still unverified on a physical phone (manual check listed in `docs/TESTING.md`).
- Verification: `npm run verify` green — unit 173/173, e2e 34/34 (14 desktop + 20 mobile).

## 2026-09-27 — T15 enforced code style

- `@stylistic/eslint-plugin` with the house style (Allman braces, 4-space indent, single quotes,
  semicolons, no trailing commas, spaced brackets and braces, spacing rules, single empty lines).
- Only 25 violations existed, all in template leftovers (`vite/*.mjs`, `src/main.tsx`,
  `src/game/main.ts`) plus two extra blank lines at end of file; fixed with `eslint --fix`.
- Verification: `npm run verify` green — lint 0 problems, unit 173/173, e2e 34/34.

## 2026-09-27 — T09 self-hosted fonts

- Cinzel Decorative 700 and Quicksand 500/700 from `@fontsource/*`, Latin subset only (enough for
  Italian and English), imported in `src/main.tsx`; Google Fonts links removed from `index.html`.
- `check:dist` now also fails on `fonts.googleapis.com` / `fonts.gstatic.com` in the bundle.
- New e2e test: no request leaves localhost and both fonts report as loaded. Mutation check: putting
  a Google Fonts link back made it fail.
- `index.html`: added description and theme-color meta tags.
- Verification: `npm run verify` green — unit 173/173, check:dist clean, e2e 35/35.

## 2026-09-27 — T10 balance script and baseline

- `npm run balance` (`scripts/balance.mjs`): starts its own Vite server (port 5175), plays seeded
  nights in headless Chromium with a bot driving the debug API, prints a Markdown table.
  `--tuning '{...}'` overrides TUNING for one run (dev hook now exposes `tuning`).
- Determinism, found and fixed on the way (a same-seed run first gave 132 s vs dawn):
  the menu consumed random numbers in real time before the night, music timers consumed them in
  real time, and the absolute clock fed heading oscillations. Now: re-seed when the night starts,
  no WebAudio in the balance page, fixed clock, logic stepped with `scene.update` (no rendering,
  ~10× faster). Same seed → identical result, also across parallel workers and page reuse.
- Reliability: opening a new page per night timed out under load (exit code 1, and an empty output
  that I first mistook for a pipe issue). Workers now reuse one page and restart the scene.
- Results: baseline 1/10 dawns, median 104.6 s (my earlier "2 of 3" estimate was wrong).
  Experiments on the same seeds: smaller waves 0/10 (123.7 s); decay growth 0.003 → 5/10 (150 s);
  0.004 → 4/10 (137.4 s), adopted. Recorded in `docs/BALANCE.md`, target in D09.
- During the final verify, 3 desktop tests timed out while another project in `~/Repos/games`
  (`lol-2d`, a different session) was running headless Chromium at ~650% CPU (load average 30+).
  They passed on rerun. Made the suite sturdier rather than retrying blindly: Playwright timeouts
  raised to 60 s per test and 10 s per assertion (software WebGL on a contended CPU).
- Verification: `npm run verify` green at load average 36 — unit 173/173, e2e 35/35.

## 2026-09-27 — T11 docs and T12 packaging

- README rewritten in English (game, controls, commands, links); `docs/TESTING.md` (layers, how to
  write e2e tests, manual real-device checklist) and `docs/DEPLOY.md` (itch.io, static hosts,
  GitHub Pages) added; CLAUDE.md and ARCHITECTURE.md updated.
- Gap closed: tests only exercised the dev server. New Playwright project `production` serves
  `dist/` with `vite preview` and checks the shipped build starts a night, has no dev hook, loads the
  fonts and makes no external request.
- `npm run package` builds, runs `check:dist` and zips `dist/` to `lucciola-web.zip` (523 KB,
  index.html at the root; built paths are relative, so it works inside itch.io's iframe). The zip is
  git-ignored.
- Numbers re-measured instead of reused: a browser downloads ~465 KB (gzip, woff2) — the older
  "~420 KB" predates the self-hosted fonts; corrected in DEPLOY and DECISIONS.

## 2026-09-27 — T11/T12 verification (missing from the previous entry)

- The T11/T12 entry did not record its verification: `npm run verify` was green with unit 173/173,
  check:dist clean and e2e 36/36 (not 35: the production-build test was added in that step).
- The T11/T12 commit was typed `docs:` although it also added tooling (`npm run package`, the
  production e2e project); history not rewritten, noted here. Later commits are split by type.

## 2026-09-27 — T16 part 1: repository hygiene (from the independent review)

- Removed template leftovers: `log.js` (analytics ping to gryzor.co on every dev/build), the
  `phasermsg` build banner, the dangling `tsconfig.node.json` (it pointed to a missing
  `vite.config.ts`) and its reference, the Vite docs comment.
- Scripts: `dev`/`build` are now the plain commands (the `-nolog` variants are gone).
  `verify` = `verify:fast` → `test:e2e` → `check:dist`; the production e2e server builds `dist/` itself,
  so `npm run test:e2e` works on a fresh clone.
- `package.json`: English description, `private: true`, `engines` matching the strictest tool
  (jsdom: `^22.22.2 || ^24.15.0 || >=26`; Node 20 does not work), updated keywords, dropped the
  non-standard `licenseUrl`. `.nvmrc` pins 24. `index.html` defaults to `lang="en"`.
- Playwright: `forbidOnly` on CI, `PW_WORKERS` override. Docs updated (Node version, `zip` needed
  by `npm run package`, renamed scripts).
- Verification: a first `npm run verify` had 4 desktop e2e failures (27–40 s each) while the
  `lol-2d` project ran 4 headless browsers at ~200% CPU each (load average ~30). Each of the 4 passed
  when rerun alone, the full desktop suite passed (15/15), and `npm run verify` then passed at load
  average 31: unit 173/173, e2e 36/36, check:dist clean. No retries were added; `PW_WORKERS=1` is
  documented for busy machines.

## 2026-09-27 — T16 part 2: structure and naming (from the independent review)

- Shared, Phaser-free modules moved to `src/`: `audio.ts`, `score.ts` (React uses them too).
  New `game/types.ts` (Point, RunState) and `game/textures.ts` (texture keys and sizes: Boot,
  Darkness and Effects no longer repeat 256/128/60). The Menu background now uses `Darkness`,
  `DEPTH` and `TEXTURES` instead of its own render texture and raw depths.
- Typed EventBus: `EventMap` gives every event its payload type; `EventBus.subscribe()` replaces the
  string-keyed handler arrays. A probe file with three wrong emits failed to compile as expected.
  ARCHITECTURE/DECISIONS corrected: React and Phaser also share a few Phaser-free modules.
- Naming: `splendor` → `radiance` everywhere in code, CSS and i18n keys (Italian text still says
  "Splendore"); the Shadow context flag `lost` → `nightLost`. Two shell attempts at the rename
  silently did nothing (zsh does not word-split variables; BSD `grep -Z` means decompress); caught by
  re-grepping, then done with Python.
- Every gameplay number now lives in `TUNING`/`SHADOWS` (spawn timings and distances, pickup and
  contact radii, points, Moth dash, Colossus bounce and Flash damage, wave spacing, per-kind shields,
  two named low-light thresholds; the HUD receives `lowLight` instead of hard-coding 25).
  Proof of no behaviour change: the 10 seeded balance nights matched the previous run row by row.
- Verification: unit 173/173, e2e 36/36 after each commit; `LANGS` export and a redundant `parent`
  config field removed.

## 2026-09-27 — T16 part 3: bugs from the review, each with a test

- Hints: a queue with incrementing ids; a hint is dropped when its animation ends, so pausing no longer
  replays an old one and two hints in one frame no longer overwrite each other.
- Score: Flash kills landing after the end of the night no longer add points (end panel = final score).
- Scene cleanup: `onSceneExit()` removes both the shutdown and the destroy listener; a `once('destroy')`
  had piled up on every restart.
- Mute: decided by whether the audio context exists, not whether it is running, so the button works
  even if the browser keeps audio suspended; this also removes the timing race in the audio tests.
- A Flash is rejected while paused; touch detection is read when used; `useMediaQuery` memoises its
  subscription (it re-subscribed ~12 times per second); music stops and releases its nodes on hot reload.
- Tests: debug API gains `spawn('pollen' | 'lost' | 'dew', at)`. New `e2e/desktop/gameplay.spec.ts`
  (9 tests: rescue, swarm shield, Colossus contact, Radiance, combo, new best, late Flash score, blur
  pause, faded hint after pause). The "Flash with too little light" test now waits a game step before
  asserting (it could not fail before). Pause button has an `aria-label`; tests use `getByRole`.
  New director test on the double-spawn cap: my first version assumed an integer cap and was wrong
  (the cap is fractional); fixed.
- Mutation checks: removing the score guard failed the late-Flash test; not dropping finished hints
  failed the faded-hint test.
- Verification: `npm run verify` green — unit 174/174, e2e 45/45 (24 desktop, 20 mobile, 1 production),
  check:dist clean.

## 2026-09-27 — T14 final verification (and T16 closed)

- Balance re-run after all T16 changes: the 10 seeded nights match the documented reference row by
  row (4/10 dawns, median 137.4 s), so `docs/BALANCE.md` still holds.
- One more test defect found by the final verify: the new "faded hint" test failed because
  first-night tutorial hints (a legitimate "lost firefly" hint) queued behind the Moth hint. The game
  was right; the test did not isolate its case. Hint tests now run in their own `describe` with a saved
  best score (tutorial off). The older "new kind of Shadow shows a hint" test had the same hidden
  dependency on timing and got the same isolation. The gameplay group then passed 3/3 runs.- Verification: `npm run verify` green — unit 174/174, e2e 45/45 (24 desktop, 20 mobile,
  1 production), check:dist clean (load average ~16 at the time).

## 2026-09-27 — Runtime verification (`/verify`) and T17

- Drove the production build on desktop (Chromium) and on an iPhone 14 landscape profile (WebKit)
  with real input, the packaged zip from a sub-path (as itch.io serves it) and both CLIs.
  Verdict PASS: no page errors, no external requests, rotation/pause/Flash/tap-to-move all behaved.
  Recipe saved in `.claude/skills/verify/SKILL.md`.
- Findings fixed in T17:
  - `npm run balance` trusted its input: a misspelled `--tuning` key was printed as applied and ignored
    (misleading balance conclusions), malformed JSON printed a stack trace, `--seeds ''` played seed 0.
    New `scripts/balance-args.mjs` (12 unit tests) validates options; TUNING keys and types are checked
    against the live game before playing. Every bad input now exits 2 with a one-line message
    (checked at the terminal for 5 bad inputs, plus a normal run).
  - End panel: HUD key hints and the touch Flash button are hidden once the night is over, the light
    bar disappears at zero, and "Best: 0" is no longer shown. New e2e test.
  - The opening banner moved from 30% to 20% of the height so it no longer covers floating texts
    (checked with a screenshot of a Moon dew pickup at the start).
- Verification: `npm run verify` green — unit 186/186 (8 files), e2e 46/46, check:dist clean.

## 2026-09-28 — T13 license and README review

- License: MIT, as decided by the owner. `LICENSE` now names Nicola Zorzo (2026) and keeps the
  Phaser Studio line for the template-derived parts; README, DEPLOY, ROADMAP and DECISIONS (D10) updated.
- README re-checked against the code: game facts (Moth 25 s, Colossus 70 s, waves 45/95/128 s,
  7 s Radiance), Node versions and commands were correct; added the language toggle and fullscreen
  controls, the production-build tests in `verify`, and the link to the runtime verification recipe.
- Documentation-only change: no runtime surface; `verify:fast` runs in the pre-commit hook.

