# Decisions

Short records of choices that are not obvious from the code. Newest at the bottom.

## D01 — Phaser 4 instead of Phaser 3 (2026-09-27)

The official `template-react-ts` ships Phaser 4.0.0. We kept it rather than pinning Phaser 3.
Consequence: `RenderTexture` needs explicit `render()` calls; FX/masks are filters.

## D02 — React for UI, Phaser for gameplay (2026-09-27)

Menu, HUD, pause and end panels are React components over the canvas; Phaser owns the world.
They talk through a typed `EventBus` (event names and payload types in `src/game/events.ts`); both
also use a few Phaser-free shared modules (`audio`, `score`, `storage`, `i18n`).
Reason: accessible, styleable UI with CSS and simpler text handling than canvas text.

## D03 — Everything generated in code (2026-09-27)

Textures are drawn with Graphics/Canvas at boot and all audio is synthesized with WebAudio.
Reason: no asset pipeline, small download (~420 KB gzipped including Phaser; ~465 KB since the
fonts are self-hosted, see T09).
Phaser's own sound manager is disabled (`audio.noAudio`).

## D04 — Tiny in-house i18n (2026-09-27)

Two languages, a few dozen strings: a typed dictionary (`it` is the source of keys, `en` must match),
`t()` with `{param}` interpolation and simple inline tags rendered by `<Rich>`. No i18n library.

## D05 — Stylesheet imported from JS (2026-09-27)

`src/style.css` is imported by `src/main.tsx` so Vite hot-reloads it and hashes it in builds.
A `<link>` to `public/style.css` was not hot-reloaded and left open pages with stale CSS.

## D06 — English for code and docs (2026-09-27)

The owner asked for English code, comments and commits. Technical docs follow the same rule;
player-facing texts are bilingual through `src/i18n/`.

## D07 — Balance validated with a bot (2026-09-27)

Tuning (`TUNING`, `SHADOWS` in `src/game/constants.ts`) was adjusted from bot runs: shadow cap 12,
Colossus without speed growth, slower energy decay growth. Bots are not humans: real playtests
should confirm it.

## D08 — Verification tooling (2026-09-27)

- Unit tests with Vitest for pure logic; end-to-end tests with Playwright against the dev server.
- Mobile is tested with Playwright device emulation (touch events, WebKit for iPhone). It catches
  layout and input issues but is not a real device: real-phone checks remain a manual step.
- A dev-only `window.__LUCCIOLA__` handle lets tests read and drive game state; `check:dist` proves it
  is compiled out of production builds.
- Git hooks keep `verify:fast` and the commit message rules from being forgotten; the slower
  `verify` (build + e2e) runs at the end of each task.

## D09 — Difficulty target, measured (2026-09-27)

Target: the balance bot reaches dawn in 3–5 of 10 seeded nights with a median survival ≥ 125 s.
The deterministic balance script showed the previous tuning at 1/10 (median 104.6 s); raising the
energy decay more slowly over the night (`energyDecayGrowth` 0.005 → 0.004) gives 4/10 (137.4 s).
Supersedes the bot estimate in D07, which came from three non-deterministic runs. Details in
`docs/BALANCE.md`. If real players find it too easy or too hard, move the target and re-measure.

## D10 — MIT license (2026-09-28)

The owner chose MIT. `LICENSE` holds the owner's copyright and keeps the Phaser Studio notice, since
parts of the project (e.g. `PhaserGame.tsx`, the event bus origin, the Vite configs) come from the
MIT-licensed `phaserjs/template-react-ts`. `package.json` already declares `"license": "MIT"`.

