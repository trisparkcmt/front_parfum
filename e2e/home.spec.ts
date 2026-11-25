import { test, expect } from '@playwright/test';

test.describe('Homepage Flow', () => {
  test('renders homepage without unhandled runtime exceptions', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');

    // Wait for the main document body to be loaded
    await expect(page.locator('body')).toBeVisible();

    // Check for presence of header / navigation
    const nav = page.locator('header, nav').first();
    await expect(nav).toBeVisible();

    // Filter non-fatal browser issues (e.g. ResizeObserver loop)
    const fatalErrors = errors.filter((err) => !err.includes('ResizeObserver'));
    expect(fatalErrors).toEqual([]);
  });

  test('contains accessible navigation links', async ({ page }) => {
    await page.goto('/');

    // Verify there are accessible navigation links
    const links = page.getByRole('link');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);
  });
});
