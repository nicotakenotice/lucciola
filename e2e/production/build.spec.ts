import { expect, test } from '../fixtures';

test('the production build runs without dev hooks or external requests', async ({ page }) =>
{
    const external: string[] = [];
    page.on('request', (request) =>
    {
        if (!request.url().startsWith('http://localhost')) external.push(request.url());
    });
    await page.addInitScript(() => localStorage.setItem('lucciola.lang', 'en'));

    await page.goto('/');
    await expect(page.locator('.overlay.menu')).toBeVisible();
    await page.locator('.menu .button.primary').click();
    await expect(page.locator('.overlay.hud')).toBeVisible();
    await expect(page.locator('.dawn-label')).toContainText('Dawn in');

    expect(await page.evaluate(() => window.__LUCCIOLA__ === undefined)).toBe(true);
    expect(await page.evaluate(() => document.fonts.check('500 20px "Quicksand"'))).toBe(true);
    expect(external).toEqual([]);
});
