# Architecture

Phaser draws and simulates the world; React draws the interface on top of the canvas.
At runtime they talk only through typed events (`EventBus`, payloads in `EventMap`). Both sides also
import a few Phaser-free modules at the root of `src/`: `audio`, `score`, `storage`, `i18n`.

```
src/
├── main.tsx, App.tsx          React entry and UI state machine (menu / game / paused / end)
├── PhaserGame.tsx             Mounts the Phaser game and reports the active scene (from the template)
├── style.css                  All UI styles (imported by main.tsx so Vite hot-reloads it)
├── components/                React UI: MenuScreen, Hud, Toast, PausePanel, EndPanel, LangToggle,
│                              FullscreenButton, RotateNotice, Rich (inline tags), Icons, keepFocus
├── i18n/                      Dictionaries (it = source of keys, en), t(), useLang()
├── hooks/                     useMediaQuery (portrait, touch), useFullscreen, useAudioUnlock, useAutoPause
├── audio.ts                   Synthesized sound effects and generative music (WebAudio)
├── score.ts                   Best score persistence
├── storage.ts                 Safe localStorage access and the keys used by the game
└── game/
    ├── main.ts                Phaser config; dev-only window.__LUCCIOLA__ test hook
    ├── EventBus.ts, events.ts Typed event bus: event names, payload types (EventMap), subscribe()
    ├── constants.ts           Screen size, TUNING (balance), SHADOWS (per-kind specs)
    ├── types.ts               Point, RunState
    ├── textures.ts            Keys and sizes of the textures generated at boot
    ├── rules.ts               Pure formulas (light, decay, spawns, burn, scoring…) — unit tested
    ├── director.ts            NightDirector: what spawns and when — pure, unit tested
    ├── debug.ts               GameSnapshot / GameDebugApi contract used by tests and bots
    ├── layout.ts              Draw depths, HUD band, random spawn spots
    ├── world.ts               Procedural forest-floor texture
    ├── scenes/
    │   ├── Boot.ts            Generates every texture in code
    │   ├── Menu.ts            Animated menu background on the Darkness layer (texts are React)
    │   └── Game.ts            Coordinator of one night (see below)
    ├── entities/              Firefly, Swarm, PollenField, LostFireflies, MoonDew, ShadowHorde
    └── systems/               Darkness (night layer with light holes), Effects (particles, texts, flashes)
```

Outside `src/`: `e2e/` (Playwright), `scripts/` (balance bot, bundle check, packaging),
`.githooks/` (pre-commit, commit-msg), `docs/`.

## One frame of the Game scene

1. `NightDirector.update()` returns spawn requests; the scene places them (`randomSpot`) and plays
   the related sounds and hints.
2. Energy decays (unless Radiance is active); heartbeat and ambient sounds tick.
3. Entities update themselves and **report** what happened: pollen collected, fireflies rescued,
   dew collected, Shadows in contact. `ShadowHorde` burns Shadows in the light and calls
   `onDissolved` for scoring.
4. The scene applies the consequences that involve several parts: energy, score, stats, swarm
   shields, Flash, hints.
5. `Darkness.render()` fills the night and erases a hole for every light source.
6. Every 80 ms the HUD state is sent to React and the music tension is updated.

Entities never call each other; the scene is the only place where cross-entity rules live.

## React ↔ Phaser events (`src/game/events.ts`)

Emitting an event with a wrong or missing payload is a compile error.

| Event | Direction | Payload |
|---|---|---|
| `current-scene-ready` | Phaser → React | the active scene |
| `hud` | Phaser → React | `HudState` |
| `hint` | Phaser → React | `Hint` (text already translated) |
| `game-end` | Phaser → React | `GameEndResult` |
| `paused` | Phaser → React | `boolean` |
| `ui-start`, `ui-restart`, `ui-menu`, `ui-pause`, `ui-resume`, `ui-flash` | React → Phaser | — |

## Persistence (`localStorage`)

| Key | Meaning |
|---|---|
| `lucciola.best` | Best score |
| `lucciola.muted` | `1` when sound is muted |
| `lucciola.lang` | `it` or `en` |
