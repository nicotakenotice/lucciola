// Plays seeded nights with a bot and prints how long it survives.
// Usage: npm run balance -- [--seeds 1,2,3] [--parallel 1] [--tuning '{"waveGrowth":1}']
// --tuning overrides TUNING values for this run only, to measure a change before making it.
//
// Each night is deterministic: Math.random is re-seeded when the night starts, the game logic is
// stepped manually at a fixed 60 fps from a fixed clock, and audio is disabled (its timers would
// consume random numbers in real time). The same seed gives the same night on any machine.
// Rendering is skipped (scene.update instead of game.step) to keep it fast.

import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { parseArgs, tuningProblems, USAGE, UsageError } from './balance-args.mjs';

let options;
try
{
    // Headless WebGL is CPU-bound: nights in parallel (--parallel) mostly slow each other down
    options = parseArgs(process.argv.slice(2));
}
catch (error)
{
    if (!(error instanceof UsageError)) throw error;
    console.error(`balance: ${error.message}\n${USAGE}`);
    process.exit(2);
}
const { seeds, parallel, tuning } = options;
const PORT = 5175;

// Runs inside the page. Must be self-contained: Playwright serializes its source.
async function playNight ({ maxSeconds, seed, tuning })
{
    const game = window.__LUCCIOLA__.game;
    Object.assign(window.__LUCCIOLA__.tuning, tuning);
    const step = 1000 / 60;
    let time = 10_000;
    const advance = (frames) =>
    {
        for (let i = 0; i < frames; i++)
        {
            time += step;
            game.scene.update(time, step);
        }
    };

    game.loop.sleep();
    game.scene.getScenes(true).forEach((scene) => game.scene.stop(scene.scene.key));
    window.__seedRandom(seed);
    game.scene.start('Game');
    advance(3);

    const api = window.__LUCCIOLA__.debug();
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    let s = api.snapshot();

    while (s.state === 'play' && s.elapsed < maxSeconds)
    {
        const p = s.player;
        const danger = (o) => s.shadows.reduce((min, shadow) => Math.min(min, dist(shadow, o)), Infinity);
        const safe = (list) => list.filter((o) => danger(o) > 90);
        const nearest = (list) => list.reduce((best, o) => (!best || dist(o, p) - Math.min(danger(o), 200) * 0.8 < dist(best, p) - Math.min(danger(best), 200) * 0.8 ? o : best), null);
        const target = (s.dew && danger(s.dew) > 90 ? s.dew : null) ?? nearest(safe(s.lost)) ?? nearest(safe(s.pollen)) ?? { x: 640, y: 400 };

        const threats = s.shadows.filter((shadow) => dist(shadow, p) < (shadow.kind === 'colossus' ? 110 : shadow.kind === 'moth' ? 170 : 140));
        if (threats.length && s.flashCooldown <= 0 && s.energy >= 28) api.flash();

        // Flee: sum of repulsions from nearby Shadows
        let fx = 0;
        let fy = 0;
        for (const shadow of s.shadows)
        {
            const d = dist(shadow, p);
            const reach = shadow.kind === 'colossus' ? 260 : 170;
            if (d < reach && d > 0)
            {
                fx += ((p.x - shadow.x) / d) * (reach - d);
                fy += ((p.y - shadow.y) / d) * (reach - d);
            }
        }
        api.steerTo({ x: Math.max(20, Math.min(1260, target.x + fx * 2.2)), y: Math.max(20, Math.min(700, target.y + fy * 2.2)) });

        advance(1);
        s = api.snapshot();
    }

    return { state: s.state, seconds: Math.round(s.elapsed * 10) / 10, score: s.score, stats: s.stats };
}

// Installs a seedable Math.random (mulberry32) and removes WebAudio from the page
function prepareBalancePage ()
{
    let state = 1;
    window.__seedRandom = (seed) =>
    {
        state = seed >>> 0;
    };
    Math.random = () =>
    {
        state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    delete window.AudioContext;
    delete window.webkitAudioContext;
}

// One page per worker, reused for every night: the scene restarts cleanly and the seed is reset,
// while reloading the page for each night was slow and timed out under load
async function runWorker (browser, queue, results)
{
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.addInitScript(prepareBalancePage);
    await page.goto(`http://localhost:${PORT}/`, { timeout: 120_000 });
    await page.waitForFunction(() => window.__LUCCIOLA__?.game.scene.isActive('Menu'), undefined, { timeout: 120_000 });

    const problems = tuningProblems(tuning, await page.evaluate(() => ({ ...window.__LUCCIOLA__.tuning })));
    if (problems.length) throw new UsageError(problems.join('; '));

    while (queue.length)
    {
        const seed = queue.shift();
        const result = { seed, ...(await page.evaluate(playNight, { maxSeconds: 160, seed, tuning })) };
        results.push(result);
        console.error(`seed ${seed}: ${result.state} at ${result.seconds}s`);
    }

    await context.close();
}

const server = await createServer({ configFile: 'vite/config.dev.mjs', server: { port: PORT, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
const started = Date.now();

try
{
    const results = [];
    const queue = [ ...seeds ];
    await Promise.all(Array.from({ length: Math.min(parallel, seeds.length) }, () => runWorker(browser, queue, results)));
    printReport(results.sort((a, b) => a.seed - b.seed));
}
catch (error)
{
    if (!(error instanceof UsageError)) throw error;
    console.error(`balance: ${error.message}`);
    process.exitCode = 2;
}
finally
{
    await browser.close();
    await server.close();
}

function printReport (results)
{
    const dawns = results.filter((r) => r.state === 'dawn').length;
    const survival = results.map((r) => r.seconds).sort((a, b) => a - b);
    const median = survival[Math.floor(survival.length / 2)];

    console.log('| Seed | Outcome | Survived (s) | Score | Flashes | Largest swarm | Moon dew |');
    console.log('|---|---|---|---|---|---|---|');
    for (const r of results)
    {
        console.log(`| ${r.seed} | ${r.state === 'dawn' ? 'dawn' : 'light out'} | ${r.seconds} | ${r.score} | ${r.stats.flashes} | ${r.stats.maxSwarm} | ${r.stats.dew} |`);
    }
    if (Object.keys(tuning).length) console.log(`\nTuning overrides: ${JSON.stringify(tuning)}`);
    console.log(`\nDawn reached in ${dawns}/${results.length} nights; median survival ${median} s. ` +
        `(${Math.round((Date.now() - started) / 1000)} s wall time)`);
}
