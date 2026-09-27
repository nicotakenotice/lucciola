import { TUNING } from '../../src/game/constants';
import { advanceGameTime, expect, openMenu, setGame, snapshot, startGame, test, waitForGame } from '../fixtures';

test.describe('controls', () =>
{
    test('arrow keys move the firefly', async ({ page }) =>
    {
        await openMenu(page);
        await startGame(page);
        const before = (await snapshot(page)).player.x;

        await page.keyboard.down('ArrowRight');
        await advanceGameTime(page, 0.5);
        await page.keyboard.up('ArrowRight');

        expect((await snapshot(page)).player.x).toBeGreaterThan(before + 50);
    });

    test('Space fires a Flash that costs light and dissolves nearby Shadows', async ({ page }) =>
    {
        await openMenu(page);
        await startGame(page);
        const { player } = await snapshot(page);
        await page.evaluate((p) => window.__LUCCIOLA__!.debug()!.spawnShadow('shade', { x: p.x + 120, y: p.y }), player);
        await setGame(page, { energy: 90 });

        await page.keyboard.press('Space');

        await expect.poll(async () => (await snapshot(page)).stats.dissolved).toBe(1);
        const after = await snapshot(page);
        expect(after.stats.flashes).toBe(1);
        expect(after.energy).toBeLessThan(90 - TUNING.flashCost + 1);
    });

    test('a Flash with too little light does nothing', async ({ page }) =>
    {
        await openMenu(page);
        await startGame(page);
        await setGame(page, { energy: TUNING.flashMin - 5 });

        await page.keyboard.press('Space');
        // Keys are handled on the next game step: give the Flash a chance to (wrongly) happen
        await advanceGameTime(page, 0.3);

        expect((await snapshot(page)).stats.flashes).toBe(0);
    });

    test('clicking the language toggle then pressing Space starts the game without switching language', async ({ page }) =>
    {
        await openMenu(page, 'en');
        await page.locator('.menu .lang-toggle').click();
        await expect(page.locator('.menu .button.primary')).toHaveText('Inizia');

        await page.keyboard.press('Space');
        await waitForGame(page);
        await expect(page.locator('html')).toHaveAttribute('lang', 'it');
    });

    test('after using the HUD pause button, Space fires a Flash instead of pausing again', async ({ page }) =>
    {
        await openMenu(page);
        await startGame(page);
        await page.getByRole('button', { name: 'Pause (Esc)' }).click();
        await expect(page.locator('.overlay.pause')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.locator('.overlay.pause')).toBeHidden();
        await advanceGameTime(page, 0.3);

        await page.keyboard.press('Space');

        await expect.poll(async () => (await snapshot(page)).stats.flashes).toBe(1);
        expect((await snapshot(page)).paused).toBe(false);
    });

    test('a new kind of Shadow shows a hint in the current language', async ({ page }) =>
    {
        await openMenu(page, 'en');
        await startGame(page);
        await page.evaluate(() => window.__LUCCIOLA__!.debug()!.spawnShadow('moth'));

        await expect(page.locator('.toast')).toHaveText('Shadow moths: fast and unpredictable');
    });
});
