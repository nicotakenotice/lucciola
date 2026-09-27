import { expect, openMenu, test } from '../fixtures';

test('menu renders without errors', async ({ page, errors }) =>
{
    await openMenu(page);
    await expect(page.locator('.title')).toHaveText('Lucciola');
    await expect(page.locator('.menu .button.primary')).toHaveText('Start');
    expect(errors).toEqual([]);
});
