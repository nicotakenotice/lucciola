// Plays seeded nights with a bot and prints how long it survives.
// Usage: npm run balance -- [--seeds 1,2,3] [--parallel 1] [--tuning '{"waveGrowth":1}']
// --tuning overrides TUNING values for this run only, to measure a change before making it.
// Nights are deterministic per seed (see scripts/bot.mjs).

import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { parseArgs, tuningProblems, USAGE, UsageError } from './balance-args.mjs';
import { playNight, prepareBotPage } from './bot.mjs';

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

// One page per worker, reused for every night: the scene restarts cleanly and the seed is reset,
// while reloading the page for each night was slow and timed out under load
async function runWorker (browser, queue, results)
{
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.addInitScript(prepareBotPage);
    await page.goto(`http://localhost:${PORT}/`, { timeout: 120_000 });
    await page.waitForFunction(() => window.__LUCCIOLA__?.game.scene.isActive('Menu'), undefined, { timeout: 120_000 });

    const problems = tuningProblems(tuning, await page.evaluate(() => ({ ...window.__LUCCIOLA__.tuning })));
    if (problems.length) throw new UsageError(problems.join('; '));

    while (queue.length)
    {
        const seed = queue.shift();
        const result = { seed, ...(await page.evaluate(playNight, { until: 160, seed, tuning })) };
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
