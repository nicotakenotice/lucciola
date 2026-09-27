import { expect, openMenu, test } from '../fixtures';

test.describe('menu', () =>
{
    test('shows the English texts and the best score', async ({ page }) =>
    {
        await page.addInitScript(() => localStorage.setItem('lucciola.best', '321'));
        await openMenu(page, 'en');
        await expect(page.locator('.subtitle')).toHaveText('A night in the woods. A tiny light.');
        await expect(page.locator('.howto li')).toHaveCount(5);
        await expect(page.locator('.menu .best')).toHaveText('Best: 321');
    });

    test('language toggle switches texts and is remembered', async ({ page }) =>
    {
        await openMenu(page, 'en');
        const toggle = page.locator('.menu .lang-toggle');
        await expect(toggle).toHaveClass(/\ben\b/);

        await toggle.click();
        await expect(page.locator('.menu .button.primary')).toHaveText('Inizia');
        await expect(page.locator('html')).toHaveAttribute('lang', 'it');

        await page.reload();
        await expect(page.locator('.menu .button.primary')).toHaveText('Inizia');
        await expect(page.locator('.menu .lang-toggle')).toHaveClass(/\bit\b/);
    });

    test('sound button starts audio first, then mutes and is remembered', async ({ page }) =>
    {
        await openMenu(page);
        const sound = page.locator('.menu-corner .icon-button');
        await expect(sound).toHaveAttribute('title', 'Mute (M)');

        await sound.click();
        await expect(sound).toHaveAttribute('title', 'Mute (M)');

        await sound.click();
        await expect(sound).toHaveAttribute('title', 'Unmute (M)');
        expect(await page.evaluate(() => localStorage.getItem('lucciola.muted'))).toBe('1');

        await page.reload();
        await expect(page.locator('.menu-corner .icon-button')).toHaveAttribute('title', 'Unmute (M)');
    });

    test('sound and language controls sit at the top right of the stage', async ({ page }) =>
    {
        await openMenu(page);
        const stage = (await page.locator('.stage').boundingBox())!;
        const sound = (await page.locator('.menu-corner .icon-button').boundingBox())!;
        const toggle = (await page.locator('.menu .lang-toggle').boundingBox())!;

        expect(toggle.x).toBeGreaterThan(sound.x + sound.width - 1);
        expect(Math.abs((toggle.y + toggle.height / 2) - (sound.y + sound.height / 2))).toBeLessThan(2);
        expect(stage.x + stage.width - (toggle.x + toggle.width)).toBeLessThan(stage.width * 0.05);
        expect(sound.y - stage.y).toBeLessThan(stage.height * 0.08);
    });
});
