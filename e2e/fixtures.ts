import { expect, Page, test as base } from '@playwright/test';

// Fails a test when the page logs an error or throws
export const test = base.extend<{ errors: string[] }>({
    errors: async ({ page }, use) =>
    {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));
        page.on('console', (msg) =>
        {
            if (msg.type() === 'error') errors.push(msg.text());
        });
        await use(errors);
        expect(errors, 'page errors').toEqual([]);
    }
});

export { expect };

export async function openMenu (page: Page, lang: 'it' | 'en' = 'en')
{
    await page.addInitScript((l) => localStorage.setItem('lucciola.lang', l), lang);
    await page.goto('/');
    await expect(page.locator('.overlay.menu')).toBeVisible();
}
