import { advanceGameTime, END_PANEL_TIMEOUT, expect, gameToPage, openMenu, setGame, snapshot, startGame, test } from '../fixtures';

test.describe('touch controls', () =>
{
    test('tapping moves the firefly without firing a Flash', async ({ page }) =>
    {
        await openMenu(page);
        await startGame(page);
        const { player } = await snapshot(page);
        const target = await gameToPage(page, { x: player.x + 300, y: player.y });

        await page.touchscreen.tap(target.x, target.y);
        await advanceGameTime(page, 1);

        const after = await snapshot(page);
        expect(after.player.x).toBeGreaterThan(player.x + 100);
        expect(after.stats.flashes).toBe(0);
    });

    test('the Flash button fires a Flash', async ({ page }) =>
    {
        await openMenu(page);
        await startGame(page);
        await setGame(page, { energy: 90 });

        await page.locator('.touch-flash').tap();

        await expect.poll(async () => (await snapshot(page)).stats.flashes).toBe(1);
    });

    test('a first tap anywhere starts the audio', async ({ page }) =>
    {
        await openMenu(page);
        const stage = (await page.locator('.stage').boundingBox())!;
        await page.touchscreen.tap(stage.x + 20, stage.y + stage.height - 20);

        // With audio already running, the sound button mutes instead of starting audio
        await page.locator('.menu-corner [data-audio-toggle]').tap();
        await expect(page.locator('.menu-corner [data-audio-toggle]')).toHaveAttribute('title', 'Unmute (M)');
    });

    test('end panel shows no keyboard hints on touch', async ({ page }) =>
    {
        await openMenu(page);
        await startGame(page);
        await setGame(page, { energy: 0 });

        await expect(page.locator('.overlay.end')).toBeVisible({ timeout: END_PANEL_TIMEOUT });
        await expect(page.locator('.overlay.end kbd')).toHaveCount(0);
        await page.locator('.overlay.end .button.primary').tap();
        await expect.poll(async () => (await snapshot(page)).state).toBe('play');
    });
});
