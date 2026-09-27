# Roadmap

Status values: `todo`, `in progress`, `done`, `blocked` (needs a decision from the owner).
Order of work: T06 was done before T03/T04 so the refactoring is covered by end-to-end tests.
Each task lists acceptance criteria that must be verified before it is marked `done`.

| ID | Task | Status |
|---|---|---|
| T01 | Work-tracking docs and resume protocol | done |
| T02 | Tooling: ESLint flat config, Vitest, Playwright, `verify` scripts, git hooks | done |
| T03 | Extract pure game rules into `rules.ts` with unit tests | done |
| T04 | Split `Game.ts` into systems without changing behaviour | done |
| T05 | Unit tests for i18n, rich text and storage helpers | done |
| T06 | End-to-end tests on desktop | done |
| T07 | Mobile improvements | done |
| T08 | End-to-end tests on mobile (touch emulation) | todo |
| T09 | Self-host fonts, drop Google Fonts | todo |
| T10 | Seeded headless balance script and baseline report | todo |
| T11 | English README and technical docs | todo |
| T12 | Packaging for itch.io and deploy guide | todo |
| T13 | Choose a license for the game | blocked |
| T15 | Enforce code style with lint (brace style, spacing, quotes) | todo |
| T14 | Final full verification and report | todo |

## T01 — Work-tracking docs and resume protocol

- `CLAUDE.md` explains how to resume, the work loop, conventions and commands.
- `docs/ROADMAP.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md` exist and are up to date.

## T02 — Tooling

- `eslint.config.js` (flat config) replaces the broken `.eslintrc.cjs`; `npm run lint` passes.
- Vitest runs with `npm run test:unit`; Playwright runs with `npm run test:e2e`.
- `npm run verify:fast` and `npm run verify` exist and fail on any failing step.
- Git hooks (`.githooks/`, enabled by `npm install`): `pre-commit` runs `verify:fast`,
  `commit-msg` enforces Conventional Commits and rejects `Co-Authored-By` trailers.
- A dev-only test hook exposes the game instance; production bundles do not contain it.

## T03 — Pure game rules

- Formulas (light radius, energy decay, shadow cap, spawn interval, kind selection, scoring, wave size)
  live in `src/game/rules.ts` without Phaser imports and are covered by unit tests.
- `Game.ts` uses them; behaviour is unchanged (e2e green).

## T04 — Split `Game.ts`

- `Game.ts` coordinates; shadows, collectibles, darkness and effects live in separate modules.
- Spawn scheduling is a pure, unit-tested module.
- e2e results unchanged; rendering checked visually.
- (Original target "≤ ~500 lines" not met: `Game.ts` is ~670 lines in the project's brace-per-line
  style, down from ~1,220. What remains is coordination only; see PROGRESS for the reasoning.)

## T05 — Unit tests for i18n, rich text and storage

- Every Italian key has an English translation; tags and `{params}` match between languages.
- `t()` interpolation, language detection and persistence are tested.
- `<Rich>` renders tags correctly; best score and mute storage handle unavailable storage.

## T06 — End-to-end tests on desktop

- Menu renders, language toggle switches texts and persists, mute toggle persists.
- Start → HUD visible → pause (Esc) freezes time → resume → game over → end panel → restart → menu.
- Regression: clicking a small control then pressing Space starts the game without re-triggering it.
- Stylesheet applied (layout assertions, not just presence).

## T07 — Mobile improvements

- Portrait: a "rotate your device" notice covers the game and the game auto-pauses.
- Minimum readable text size (≥ 10px HUD labels, ≥ 12px body text) on a 844×390 landscape phone.
- `touch-action: manipulation`, no long-press callout or text selection on controls.
- Fullscreen button where the Fullscreen API is available (tries to lock landscape).
- Audio unlocks on the first `touchend`/`click` too (iOS).
- Keyboard hints hidden on touch devices (end and pause panels).
- Quality: `App.tsx` split into hooks; `PhaserGame.tsx` no longer removes every listener of an event
  and drops the unused ref plumbing from the template.

## T08 — End-to-end tests on mobile

- Android (Chromium, touch) and iPhone (WebKit, touch) profiles, landscape and portrait.
- Portrait shows the rotate notice; landscape menu content fits the stage without overflow.
- Text sizes meet the T07 minimums; tapping moves the firefly; the Flash button fires a Flash.

## T09 — Self-hosted fonts

- Fonts come from `@fontsource/*` packages bundled by Vite; no request to Google Fonts.

## T10 — Balance script

- `npm run balance` runs N seeded nights with a bot and prints survival time, outcome, score.
- Results recorded in `docs/BALANCE.md` with the date and the exact parameters.

## T11 — Docs

- README in English (player overview, commands, links to docs).
- `docs/ARCHITECTURE.md`, `docs/TESTING.md` describe the current code, not intentions.

## T12 — Packaging and deploy

- `npm run package` builds without analytics and creates `lucciola-web.zip` ready for itch.io.
- `docs/DEPLOY.md` covers itch.io, Cloudflare Pages / Netlify / Vercel and GitHub Pages.

## T13 — License (blocked)

The current `LICENSE` is the MIT license of the Phaser template (© Phaser Studio). Choosing how to
license the game (open source or not, under whose name) is the owner's decision.

## T15 — Enforced code style

- Style rules (Allman braces as used by the Phaser template, 4-space indent, single quotes, semicolons,
  spacing) are enforced by ESLint and auto-fixed once across the codebase; `npm run lint` stays clean.
- Found during T07: the same files mixed brace styles, and nothing enforced consistency.

## T14 — Final verification

- `npm run verify` green, balance run recorded, docs consistent with the code.
