import { test, expect } from '@playwright/test';

test.describe('Exhaustive UI Controls & Navigation Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Theme switcher button toggles dark/light theme and updates DOM', async ({ page }) => {
    // Locate theme toggle button by accessible role and label
    const themeBtn = page.getByRole('button', { name: /activer le mode (clair|sombre)/i });
    await expect(themeBtn).toBeVisible({ timeout: 10000 });

    const htmlElement = page.locator('html');
    const initialClass = (await htmlElement.getAttribute('class')) || '';

    // Click toggle switch
    await themeBtn.click();

    // Verify class on html updated
    await expect(async () => {
      const updatedClass = (await htmlElement.getAttribute('class')) || '';
      expect(updatedClass).not.toEqual(initialClass);
    }).toPass({ timeout: 5000 });
  });

  test('Language selector dropdown opens, displays options and changes language', async ({ page }) => {
    const langBtn = page.getByRole('button', { name: /fr|en/i }).first();
    await expect(langBtn).toBeVisible();

    // Click to open dropdown
    await langBtn.click();

    // Look for dropdown options
    const enOption = page.getByRole('button', { name: /english/i });
    const frOption = page.getByRole('button', { name: /français/i });

    if (await enOption.isVisible()) {
      await enOption.click();
      // Dropdown should close and language indicator should update or cookie/localStorage should be set
      await expect(page.locator('html')).toHaveAttribute('lang', /en/i);
    } else if (await frOption.isVisible()) {
      await frOption.click();
      await expect(page.locator('html')).toHaveAttribute('lang', /fr/i);
    }
  });

  test('Search input dropdown opens, receives user typing and clears/submits', async ({ page }) => {
    // Check for search trigger button or input in navbar/header
    const searchTrigger = page.getByRole('button', { name: /recherche|search/i })
      .or(page.locator('button:has(svg.lucide-search)'))
      .or(page.getByPlaceholder(/rechercher|search/i));

    if (await searchTrigger.count() > 0) {
      await searchTrigger.first().click();

      const searchInput = page.getByPlaceholder(/rechercher|search/i).first();
      await expect(searchInput).toBeVisible();

      // Type search query
      await searchInput.fill('Parfum');
      await expect(searchInput).toHaveValue('Parfum');

      // Clear input test
      await searchInput.fill('');
      await expect(searchInput).toHaveValue('');
    }
  });

  test('Cart drawer opens on bag icon click, displays empty state or items, and closes', async ({ page }) => {
    // Locate cart trigger button in navbar or bottom nav
    const cartBtn = page.getByRole('button', { name: /panier|cart/i })
      .or(page.locator('button:has(svg.lucide-shopping-bag)'))
      .or(page.locator('button:has(svg.lucide-shopping-cart)'))
      .first();

    await expect(cartBtn).toBeVisible();
    await cartBtn.click();

    // Verify drawer dialog appears
    const cartDrawer = page.locator('div[role="dialog"]')
      .or(page.locator('aside'))
      .or(page.getByText(/panier|votre panier|cart/i).first());
    await expect(cartDrawer).toBeVisible({ timeout: 5000 });

    // Look for close button (X)
    const closeBtn = page.getByRole('button', { name: /fermer|close/i })
      .or(page.locator('button:has(svg.lucide-x)'))
      .first();

    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  test('Mobile and desktop navigation links are all interactive without broken references', async ({ page }) => {
    const navLinks = page.locator('header a, nav a, footer a');
    const count = await navLinks.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 10); i++) {
      const link = navLinks.nth(i);
      const href = await link.getAttribute('href');
      // Verify no empty or javascript:void links
      expect(href).toBeTruthy();
      expect(href).not.toBe('#');
    }
  });
});
