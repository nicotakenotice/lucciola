import { SHADOWS, TUNING } from '../../src/game/constants';
import { END_PANEL_TIMEOUT, expect, openMenu, setGame, snapshot, startGame, test } from '../fixtures';
import type { Page } from '@playwright/test';

async function spawnAtPlayer (page: Page, kind: 'pollen' | 'lost' | 'dew', offset = { x: 0, y: 0 })
{
    await page.evaluate(({ kind, offset }) =>
    {
        const api = window.__LUCCIOLA__!.debug()!;
        const { player } = api.snapshot();
        api.spawn(kind, { x: player.x + offset.x, y: player.y + offset.y });
    }, { kind, offset });
}

async function shadowAtPlayer (page: Page, kind: 'shade' | 'moth' | 'colossus')
{
    await page.evaluate((kind) =>
    {
        const api = window.__LUCCIOLA__!.debug()!;
        api.spawnShadow(kind, api.snapshot().player);
    }, kind);
}

test.describe('gameplay', () =>
{
    test.beforeEach(async ({ page }) =>
    {
        await openMenu(page);
        await startGame(page);
    });

    test('rescuing a lost firefly adds it to the swarm and scores', async ({ page }) =>
    {
        await spawnAtPlayer(page, 'lost');

        await expect.poll(async () => (await snapshot(page)).followers).toBe(1);
        const state = await snapshot(page);
        expect(state.stats.rescued).toBe(1);
        expect(state.score).toBeGreaterThanOrEqual(TUNING.rescuePoints);
    });

    test('a follower absorbs a Shade hit instead of the light', async ({ page }) =>
    {
        await spawnAtPlayer(page, 'lost');
        await expect.poll(async () => (await snapshot(page)).followers).toBe(1);
        await setGame(page, { energy: 80 });

        await shadowAtPlayer(page, 'shade');

        await expect.poll(async () => (await snapshot(page)).followers).toBe(0);
        expect((await snapshot(page)).energy).toBeGreaterThan(80 - SHADOWS.shade.hitEnergy / 2);
    });

    test('the Colossus costs light without a swarm and survives the contact', async ({ page }) =>
    {
        await setGame(page, { energy: 90 });

        await shadowAtPlayer(page, 'colossus');

        await expect.poll(async () => (await snapshot(page)).energy).toBeLessThan(90 - SHADOWS.colossus.hitEnergy + 5);
        expect((await snapshot(page)).shadows.some((s) => s.kind === 'colossus')).toBe(true);
    });

    test('Moon dew grants Radiance', async ({ page }) =>
    {
        await spawnAtPlayer(page, 'dew');

        await expect(page.locator('.hud-left .radiance')).toBeVisible();
        expect((await snapshot(page)).stats.dew).toBe(1);
    });

    test('quick pollen pickups build a combo', async ({ page }) =>
    {
        for (const x of [ 0, 6, 12 ]) await spawnAtPlayer(page, 'pollen', { x, y: 0 });

        await expect(page.locator('.combo')).toBeVisible();
    });

    test('the first scored night ends with a new best', async ({ page }) =>
    {
        await spawnAtPlayer(page, 'lost');
        await expect.poll(async () => (await snapshot(page)).score).toBeGreaterThan(0);

        await setGame(page, { energy: 0 });

        await expect(page.locator('.overlay.end .best.record')).toHaveText('New best!', { timeout: END_PANEL_TIMEOUT });
    });

    test('points from a late Flash kill do not change the final score', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const api = window.__LUCCIOLA__!.debug()!;
            const { player } = api.snapshot();
            api.spawnShadow('shade', { x: player.x + 280, y: player.y });
            api.set({ energy: 80 });
            api.flash();
            api.set({ energy: 0 });
        });

        await expect(page.locator('.overlay.end')).toBeVisible({ timeout: END_PANEL_TIMEOUT });
        const shown = Number(await page.locator('.final-score').textContent());
        expect((await snapshot(page)).score).toBe(shown);
    });

    test('losing window focus pauses the night', async ({ page }) =>
    {
        await page.evaluate(() => window.dispatchEvent(new Event('blur')));

        await expect(page.locator('.overlay.pause')).toBeVisible();
        expect((await snapshot(page)).paused).toBe(true);
    });
});

test.describe('hints', () =>
{
    test.beforeEach(async ({ page }) =>
    {
        // A saved best score turns the first-night tutorial hints off: only the hint under test shows
        await page.addInitScript(() => localStorage.setItem('lucciola.best', '1'));
        await openMenu(page);
        await startGame(page);
    });

    test('a hint that has faded does not come back after a pause', async ({ page }) =>
    {
        await page.evaluate(() => window.__LUCCIOLA__!.debug()!.spawnShadow('moth'));
        await expect(page.locator('.toast')).toBeVisible();
        await expect(page.locator('.toast')).toHaveCount(0, { timeout: 15_000 });

        await page.keyboard.press('Escape');
        await expect(page.locator('.overlay.pause')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.locator('.overlay.pause')).toBeHidden();

        await expect(page.locator('.toast')).toHaveCount(0);
    });
});
