// Regenerates the images derived from the game: icon PNGs (favicon, iOS, installed app) from
// public/logo.svg and the README
// screenshots (home screen, and a night played by the bot for 30 seconds).
// Usage: npm run images -- [--seed 3] [--out docs/images]

import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'vite';
import { playNight, prepareBotPage } from './bot.mjs';

const option = (name, fallback) =>
{
    const index = process.argv.indexOf(`--${name}`);

    return index === -1 ? fallback : process.argv[index + 1];
};
const seed = Number(option('seed', '3'));
const out = option('out', 'docs/images');
const PORT = 5177;
const VIEWPORT = { width: 1280, height: 720 };
const GAMEPLAY_SECONDS = 30;

async function renderIcons (browser)
{
    const svg = readFileSync('public/logo.svg', 'utf8');
    const toSrc = (text) => `data:image/svg+xml;base64,${Buffer.from(text).toString('base64')}`;
    const icons = [
        { path: 'public/favicon.png', size: 32, background: 'transparent' },
        // iOS masks the corners itself and expects an opaque square
        { path: 'public/apple-touch-icon.png', size: 180, background: '#020308' },
        { path: 'public/icon-192.png', size: 192, background: 'transparent' },
        { path: 'public/icon-512.png', size: 512, background: 'transparent' },
        // Android crops maskable icons to its own shape: fill the whole square, without the rounded tile
        { path: 'public/icon-maskable-512.png', size: 512, background: '#020308', fullBleed: true }
    ];

    for (const { path, size, background, fullBleed } of icons)
    {
        const src = toSrc(fullBleed ? svg.replace(' clip-path="url(#tile)"', '') : svg);
        const page = await browser.newPage({ viewport: { width: size, height: size } });
        await page.setContent(`<body style="margin:0;background:${background}"><img src="${src}" width="${size}" height="${size}"></body>`);
        await page.locator('img').evaluate((img) => img.decode());
        await page.screenshot({ path, omitBackground: background === 'transparent' });
        await page.close();
        console.log(`images: ${path}`);
    }
}

async function captureHome (browser)
{
    const context = await browser.newContext({ viewport: VIEWPORT, locale: 'en-US' });
    const page = await context.newPage();
    await page.goto(`http://localhost:${PORT}/`);
    await page.locator('.overlay.menu').waitFor();
    // The pointer is a small light: park it where it reveals a corner of the forest
    await page.mouse.move(250, 560);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: join(out, 'home.png') });
    await context.close();
    console.log(`images: ${join(out, 'home.png')}`);
}

async function captureGameplay (browser)
{
    const context = await browser.newContext({ viewport: VIEWPORT, locale: 'en-US' });
    const page = await context.newPage();
    await page.addInitScript(prepareBotPage);
    // A saved best score turns off first-night tutorial hints
    await page.addInitScript(() => localStorage.setItem('lucciola.best', '1'));
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForFunction(() => window.__LUCCIOLA__?.game.scene.isActive('Menu'));

    const result = await page.evaluate(playNight, { until: GAMEPLAY_SECONDS, seed, realtimeTail: 1.5 });
    // The game is frozen now; let the interface finish its timed animations (opening banner, hints)
    await page.locator('.intro').evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    await page.locator('.toast').waitFor({ state: 'detached', timeout: 10_000 }).catch(() => {});
    await page.screenshot({ path: join(out, 'gameplay.png') });
    await context.close();
    console.log(`images: ${join(out, 'gameplay.png')} (seed ${seed}, ${result.seconds} s, swarm ${result.stats.maxSwarm}, score ${result.score})`);
}

mkdirSync(out, { recursive: true });
const server = await createServer({ configFile: 'vite/config.dev.mjs', server: { port: PORT, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();

try
{
    await renderIcons(browser);
    await captureHome(browser);
    await captureGameplay(browser);
}
finally
{
    await browser.close();
    await server.close();
}
