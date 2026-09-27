import { expect, fontSize, openMenu, startGame, test } from '../fixtures';

test.describe('landscape phone layout', () =>
{
    test('menu content fits inside the stage', async ({ page }) =>
    {
        await openMenu(page);
        const stage = (await page.locator('.stage').boundingBox())!;

        for (const selector of [ '.title', '.subtitle', '.howto', '.menu .button.primary', '.menu-corner' ])
        {
            const box = (await page.locator(selector).boundingBox())!;
            expect(box.y, `${selector} top`).toBeGreaterThanOrEqual(stage.y - 1);
            expect(box.y + box.height, `${selector} bottom`).toBeLessThanOrEqual(stage.y + stage.height + 1);
            expect(box.x, `${selector} left`).toBeGreaterThanOrEqual(stage.x - 1);
            expect(box.x + box.width, `${selector} right`).toBeLessThanOrEqual(stage.x + stage.width + 1);
        }
    });

    test('menu and HUD texts stay readable', async ({ page }) =>
    {
        await openMenu(page);
        expect(await fontSize(page, '.howto li')).toBeGreaterThanOrEqual(12);
        expect(await fontSize(page, '.menu .button.primary')).toBeGreaterThanOrEqual(13);

        await startGame(page);
        expect(await fontSize(page, '.hud .label')).toBeGreaterThanOrEqual(10);
        expect(await fontSize(page, '.dawn-label')).toBeGreaterThanOrEqual(12);
        expect(await fontSize(page, '.hud-score')).toBeGreaterThanOrEqual(20);
    });

    test('touch devices get touch instructions and no keyboard hints', async ({ page }) =>
    {
        await openMenu(page);
        await expect(page.locator('.howto li').first()).toHaveText('Tap the screen to move');
        await expect(page.locator('.menu .hint')).toHaveCount(0);

        await startGame(page);
        await expect(page.locator('.touch-flash')).toBeVisible();
        await expect(page.locator('.hud-hint')).toHaveCount(0);

        await page.locator('.hud-buttons .icon-button').last().tap();
        await expect(page.locator('.overlay.pause')).toBeVisible();
        await expect(page.locator('.overlay.pause kbd')).toHaveCount(0);
    });

    test('the fullscreen button is shown only where the browser supports it', async ({ page }) =>
    {
        await openMenu(page);
        const supported = await page.evaluate(() => document.fullscreenEnabled === true);
        await expect(page.locator('.menu-corner [aria-label="Full screen"]')).toHaveCount(supported ? 1 : 0);
    });
});
