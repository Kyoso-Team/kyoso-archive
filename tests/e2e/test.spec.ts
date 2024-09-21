import { expect, test } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/', { waitUntil: 'commit' });
  await expect(page).toHaveTitle('Kyoso');
});