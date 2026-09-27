import { expect, Page, test as base } from '@playwright/test';
import type { GameSnapshot } from '../src/game/debug';

// Fails a test when the page logs an error or throws
export const test = base.extend<{ errors: string[] }>({
    errors: [ async ({ page }, use) =>
    {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));
        page.on('console', (msg) =>
        {
            if (msg.type() === 'error') errors.push(msg.text());
        });
        await use(errors);
        expect(errors, 'page errors').toEqual([]);
    }, { auto: true } ]
});

export { expect };

export async function openMenu (page: Page, lang: 'it' | 'en' = 'en')
{
    await page.addInitScript((l) =>
    {
        if (!localStorage.getItem('lucciola.lang')) localStorage.setItem('lucciola.lang', l);
    }, lang);
    await page.goto('/');
    await expect(page.locator('.overlay.menu')).toBeVisible();
}

export async function waitForGame (page: Page)
{
    await expect.poll(() => page.evaluate(() => window.__LUCCIOLA__?.debug() != null)).toBe(true);
    await expect(page.locator('.overlay.hud')).toBeVisible();
}

export async function startGame (page: Page)
{
    await page.locator('.menu .button.primary').click();
    await waitForGame(page);
}

export function snapshot (page: Page): Promise<GameSnapshot>
{
    return page.evaluate(() => window.__LUCCIOLA__!.debug()!.snapshot());
}

// Waits for game time, not wall time: under load the game runs at fewer frames per second
export async function advanceGameTime (page: Page, seconds: number)
{
    const start = (await snapshot(page)).elapsed;
    await expect
        .poll(async () => (await snapshot(page)).elapsed, { timeout: 10_000 + seconds * 5_000 })
        .toBeGreaterThanOrEqual(start + seconds);
}

// End-of-night panels appear after in-game delays, so allow for slow frames
export const END_PANEL_TIMEOUT = 15_000;

export function setGame (page: Page, values: { energy?: number; elapsed?: number })
{
    return page.evaluate((v) => window.__LUCCIOLA__!.debug()!.set(v), values);
}

// Converts game coordinates (1280×720) to page coordinates on the scaled canvas
export async function gameToPage (page: Page, point: { x: number; y: number })
{
    const box = (await page.locator('#game-container canvas').boundingBox())!;
    const scale = box.width / 1280;

    return { x: box.x + point.x * scale, y: box.y + point.y * scale };
}

export async function fontSize (page: Page, selector: string): Promise<number>
{
    return page.locator(selector).first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
}
