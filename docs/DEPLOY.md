# Deploy

`npm run build` produces `dist/`: a static site (about 1.7 MB; a browser downloads ~465 KB with
gzip) with relative paths, so it works from any folder or inside an iframe. There is no server side.

## itch.io (recommended for a game)

1. `npm run package` → `lucciola-web.zip` (index.html at the root of the archive). Needs the `zip`
   command, present on macOS and most Linux distributions.
2. On itch.io: *Create new project* → Kind of project: **HTML** → upload the zip →
   tick **This file will be played in the browser**.
3. Embed options: viewport **1280 × 720**, enable **Fullscreen button**, enable **Mobile friendly**
   with orientation **Landscape**.
4. Save as draft, open the page, play a night on desktop and on a phone (see `docs/TESTING.md`,
   manual checks), then publish.

## Static hosts (own URL)

Cloudflare Pages, Netlify and Vercel all work the same way once the repository is on GitHub:

| Setting | Value |
|---|---|
| Build command | `npm ci && npm run build` |
| Output directory | `dist` |
| Node.js version | 24 (see `engines` in `package.json`) |

## GitHub Pages

Add `.github/workflows/pages.yml` that runs `npm ci`, `npm run build`, uploads `dist` with
`actions/upload-pages-artifact` and deploys with `actions/deploy-pages`; enable Pages with source
"GitHub Actions" in the repository settings. The relative `base` in `vite/config.prod.mjs` already
supports the `/<repo>/` sub-path.

## Before any public release

- Run `npm run verify` and the manual device checks.
- The game is MIT-licensed (`LICENSE`); keep that file in any redistributed source.
