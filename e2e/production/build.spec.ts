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

test('the game is installable and starts offline once loaded', async ({ page, context }) =>
{
    await page.addInitScript(() => localStorage.setItem('lucciola.lang', 'en'));
    await page.goto('/');
    await expect(page.locator('.overlay.menu')).toBeVisible();

    const manifest = await (await page.request.get(await page.locator('link[rel="manifest"]').getAttribute('href') ?? '')).json();
    expect(manifest).toMatchObject({ name: 'Lucciola', display: 'fullscreen', orientation: 'landscape', start_url: './' });

    // The first visit installs the service worker, which precaches the whole game
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('.overlay.menu')).toBeVisible();
    await page.locator('.menu .button.primary').click();
    await expect(page.locator('.dawn-label')).toContainText('Dawn in');
    expect(await page.evaluate(() => document.fonts.check('500 20px "Quicksand"'))).toBe(true);
});

test('no service worker is registered when the game is embedded in a frame (itch.io)', async ({ page }) =>
{
    await page.goto('/');
    await page.evaluate(() => navigator.serviceWorker.getRegistrations().then((all) => Promise.all(all.map((r) => r.unregister()))));
    await page.setContent('<iframe src="/" style="width:1280px;height:720px"></iframe>');

    const frame = page.frameLocator('iframe');
    await expect(frame.locator('.overlay.menu')).toBeVisible();
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then((all) => all.length))).toBe(0);
});
