---
name: verify
description: Run Lucciola and observe a change at its real surface (browser game on desktop and phone, the production build, the balance and package CLIs).
---

# Verifying Lucciola at runtime

Do not rerun `npm run verify` here: that is CI. Drive the running game like a player.

## Launch (isolated ports; the owner often keeps a dev server on 8080)

```bash
npx vite --config vite/config.dev.mjs --port 5190 --strictPort          # dev, has window.__LUCCIOLA__
npm run build && npx vite preview --config vite/config.prod.mjs --port 5191 --strictPort   # shipped build
```

## Drive

Write a throwaway Playwright script inside the repo (so `@playwright/test` resolves), run it with
`node`, delete it, and save screenshots to the scratchpad.

- Desktop: `chromium`, viewport 1280×800; real input only on the production build (Space to start,
  arrows to move, click = Flash, Esc pause, M sound, the IT/EN toggle). The idle light runs out in ~17 s.
- Phone: `webkit` with `devices['iPhone 14 landscape']` (750×340); use `tap()` / `page.touchscreen.tap`,
  rotate with `page.setViewportSize({ width: 340, height: 750 })`.
- Rare states (Radiance, Colossus, swarm): dev server + `window.__LUCCIOLA__.debug()`
  (`spawn('dew' | 'lost' | 'pollen', at)`, `spawnShadow(kind, at)`, `set({ energy, elapsed })`, `snapshot()`).
  Set `localStorage['lucciola.best'] = '1'` first to silence first-night tutorial hints.
- Always collect `pageerror`, console errors and requests leaving localhost.
- itch.io check: `npm run package`, unzip into `<tmp>/games/x/`, serve with
  `python3 -m http.server`, open `/games/x/index.html` (paths must be relative).
- CLIs: `npm run balance -- --seeds 7` (~2 s per night); `npm run package` → `lucciola-web.zip`.

## Gotchas

- A panel-only element (e.g. menu "Best") is absent when the value is 0; guard waits in scripts.
- Other projects in `~/Repos/games` may load the CPU; check `uptime` if timings look odd.
