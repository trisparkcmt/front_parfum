 import { test, expect } from '@playwright/test';

test.describe('Shop Catalog', () => {
  test('navigates to shop and verifies catalog page loads', async ({ page }) => {
    await page.goto('/shop');
    await expect(page).toHaveURL(/shop/);
    await expect(page.locator('body')).toBeVisible();
  });
});
