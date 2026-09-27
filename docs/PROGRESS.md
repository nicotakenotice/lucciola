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
