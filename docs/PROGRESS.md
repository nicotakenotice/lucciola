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

