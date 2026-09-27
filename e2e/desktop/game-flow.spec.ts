import { TUNING } from '../../src/game/constants';
import { advanceGameTime, END_PANEL_TIMEOUT, expect, openMenu, setGame, snapshot, startGame, test, waitForGame } from '../fixtures';

test.describe('game flow', () =>
{
    test('Space starts a night with full light', async ({ page }) =>
    {
        await openMenu(page);
        await page.keyboard.press('Space');
        await waitForGame(page);

        const state = await snapshot(page);
        expect(state.state).toBe('play');
        expect(state.energy).toBeGreaterThan(95);
        await expect(page.locator('.dawn-label')).toContainText('Dawn in');
    });

    test('Escape pauses and freezes time, Escape resumes', async ({ page }) =>
    {
        await openMenu(page);
        await startGame(page);

        await page.keyboard.press('Escape');
        await expect(page.locator('.overlay.pause')).toBeVisible();
        const frozen = (await snapshot(page)).elapsed;
        await page.waitForTimeout(600);
        const later = await snapshot(page);
        expect(later.paused).toBe(true);
        expect(later.elapsed).toBe(frozen);

        await page.keyboard.press('Escape');
        await expect(page.locator('.overlay.pause')).toBeHidden();
        await advanceGameTime(page, 0.2);
    });

    test('running out of light ends the night; Space restarts, Escape goes to the menu', async ({ page }) =>
    {
        await openMenu(page);
        await startGame(page);

        await setGame(page, { energy: 0 });
        await expect(page.locator('.overlay.end h2')).toHaveText('Your light has gone out', { timeout: END_PANEL_TIMEOUT });
        await expect(page.locator('.stats > div')).toHaveCount(6);

        await page.keyboard.press('Space');
        await waitForGame(page);
        await expect.poll(async () => (await snapshot(page)).state).toBe('play');
        expect((await snapshot(page)).elapsed).toBeLessThan(5);

        await setGame(page, { energy: 0 });
        await expect(page.locator('.overlay.end')).toBeVisible({ timeout: END_PANEL_TIMEOUT });
        await page.keyboard.press('Escape');
        await expect(page.locator('.overlay.menu')).toBeVisible();
    });

    test('surviving the whole night shows the dawn panel with a bonus', async ({ page }) =>
    {
        await openMenu(page);
        await startGame(page);

        await setGame(page, { elapsed: TUNING.nightLength - 0.2, energy: 80 });
        await expect(page.locator('.overlay.end h2')).toHaveText('Dawn!', { timeout: END_PANEL_TIMEOUT });
        await expect(page.locator('.overlay.end p').first()).toContainText('bonus');
    });
});

test.describe('end of the night panel', () =>
{
    test('shows no key hints, no Flash control and no "Best: 0" on a scoreless first night', async ({ page }) =>
    {
        await openMenu(page);
        await startGame(page);
        await expect(page.locator('.hud-hint')).toBeVisible();

        await setGame(page, { energy: 0 });

        await expect(page.locator('.overlay.end')).toBeVisible({ timeout: END_PANEL_TIMEOUT });
        await expect(page.locator('.hud-hint')).toHaveCount(0);
        await expect(page.locator('.bar-fill')).toHaveCount(0);
        await expect(page.locator('.overlay.end .best')).toHaveCount(0);
    });
});
