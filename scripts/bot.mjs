// A bot that plays Lucciola through the dev-only debug API. Used by the balance script and by the
// README screenshots.
//
// Each night is deterministic: Math.random is re-seeded when the night starts, the game logic is
// stepped manually at a fixed 60 fps from a fixed clock, and audio is disabled (its timers would
// consume random numbers in real time). The same seed gives the same night on any machine.
// Rendering is skipped (scene.update instead of game.step) to keep it fast.
//
// For screenshots, `realtimeTail` plays the last seconds at real speed with rendering: Phaser 4
// tweens (floating texts, Flash rings, screen flashes) run on the wall clock, so in a compressed
// night they would be caught half-way.
//
// Both functions run inside the page and must be self-contained: Playwright serializes their source.

// Plays a night from the start until it ends or `until` seconds have passed
export async function playNight ({ until, seed, tuning = {}, realtimeTail = 0 })
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

    while (s.state === 'play' && s.elapsed < until)
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

        if (s.elapsed < until - realtimeTail)
        {
            advance(1);
        }
        else
        {
            time += step;
            game.step(time, step);
            await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        s = api.snapshot();
    }

    return { state: s.state, seconds: Math.round(s.elapsed * 10) / 10, score: s.score, stats: s.stats };
}

// Installs a seedable Math.random (mulberry32) and removes WebAudio from the page
export function prepareBotPage ()
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
