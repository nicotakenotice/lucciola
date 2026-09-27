import { expect, openMenu, test } from '../fixtures';

test.use({ viewport: { width: 844, height: 390 } });

test('menu renders on a landscape phone', async ({ page }) =>
{
    await openMenu(page);
    await expect(page.locator('.menu .button.primary')).toBeVisible();
});
