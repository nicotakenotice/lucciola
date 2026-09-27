import { expect, openMenu, test } from '../fixtures';

test('fonts are self-hosted and loaded', async ({ page }) =>
{
    const external: string[] = [];
    page.on('request', (request) =>
    {
        if (!request.url().startsWith('http://localhost')) external.push(request.url());
    });

    await openMenu(page);
    await page.evaluate(() => document.fonts.ready);

    expect(external).toEqual([]);
    expect(await page.evaluate(() => document.fonts.check('700 20px "Cinzel Decorative"'))).toBe(true);
    expect(await page.evaluate(() => document.fonts.check('500 20px "Quicksand"'))).toBe(true);
});
