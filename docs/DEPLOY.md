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

## GitHub Pages (live)

The game is published at https://nicotakenotice.github.io/lucciola/ by
`.github/workflows/pages.yml` on every push to `main`: `npm ci`, `npm run verify:fast` (a failing
check blocks the deployment), `npm run build`, `npm run check:dist`, then `actions/upload-pages-artifact`
and `actions/deploy-pages`. Pages uses the "GitHub Actions" source (set once through the API:
`gh api -X POST repos/nicotakenotice/lucciola/pages -f build_type=workflow`). The relative `base` in
`vite/config.prod.mjs` makes the build work under the `/lucciola/` sub-path.

`.github/workflows/ci.yml` runs the full `npm run verify` (including end-to-end tests on Chromium and
WebKit) on pushes and pull requests; Playwright traces are uploaded when it fails.

## Before any public release

- Run `npm run verify` and the manual device checks.
- The game is MIT-licensed (`LICENSE`); keep that file in any redistributed source.
