# Decisions

Short records of choices that are not obvious from the code. Newest at the bottom.

## D01 — Phaser 4 instead of Phaser 3 (2026-09-27)

The official `template-react-ts` ships Phaser 4.0.0. We kept it rather than pinning Phaser 3.
Consequence: `RenderTexture` needs explicit `render()` calls; FX/masks are filters.

## D02 — React for UI, Phaser for gameplay (2026-09-27)

Menu, HUD, pause and end panels are React components over the canvas; Phaser owns the world.
They talk through the template's `EventBus` with typed event names and payloads (`src/game/events.ts`).
Reason: accessible, styleable UI with CSS and simpler text handling than canvas text.

## D03 — Everything generated in code (2026-09-27)

Textures are drawn with Graphics/Canvas at boot and all audio is synthesized with WebAudio.
Reason: no asset pipeline, tiny download (~420 KB gzipped including Phaser).
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
