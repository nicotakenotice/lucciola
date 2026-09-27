import { expect, openMenu, snapshot, startGame, test } from '../fixtures';

const portraitOf = (size: { width: number; height: number }) => ({ width: size.height, height: size.width });

test.describe('portrait orientation', () =>
{
    test('shows the rotate notice over the menu', async ({ page }) =>
    {
        await page.setViewportSize(portraitOf(page.viewportSize()!));
        await page.addInitScript(() => localStorage.setItem('lucciola.lang', 'en'));
        await page.goto('/');

        await expect(page.locator('.rotate-notice')).toBeVisible();
        await expect(page.locator('.rotate-notice h2')).toHaveText('Rotate your device');
    });

    test('turning to portrait pauses the game; turning back shows the pause panel', async ({ page }) =>
    {
        const landscape = page.viewportSize()!;
        await openMenu(page);
        await startGame(page);

        await page.setViewportSize(portraitOf(landscape));
        await expect(page.locator('.rotate-notice')).toBeVisible();
        await expect.poll(async () => (await snapshot(page)).paused).toBe(true);

        await page.setViewportSize(landscape);
        await expect(page.locator('.rotate-notice')).toBeHidden();
        await expect(page.locator('.overlay.pause')).toBeVisible();
    });
});
