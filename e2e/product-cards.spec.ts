import { test, expect } from '@playwright/test';

test.describe('Product Cards, Buttons, Share Links & Detail Modals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Product cards render with image, name, price, action buttons and badges', async ({ page }) => {
    // Wait for at least one product card to be visible in the shop
    const productCard = page.locator('div.group:has(button[aria-label*="Partager"]), div.group:has(button:has(svg.lucide-share-2))').first();
    await expect(productCard).toBeVisible({ timeout: 15000 });

    // Verify Add to Cart or Notify me button exists
    const actionBtn = productCard.getByRole('button', { name: /ajouter|panier|prévenir|notify/i })
      .or(productCard.locator('button:has(svg.lucide-shopping-bag)'));
    await expect(actionBtn.first()).toBeVisible();

    // Verify Favorite heart button exists
    const favoriteBtn = productCard.locator('button:has(svg.lucide-heart)');
    await expect(favoriteBtn.first()).toBeVisible();

    // Verify Share button exists
    const shareBtn = productCard.locator('button[aria-label*="Partager"], button:has(svg.lucide-share-2)');
    await expect(shareBtn.first()).toBeVisible();
  });

  test('Clicking a product card opens the product detail modal or navigates to detail route', async ({ page }) => {
    const productCard = page.locator('div.group:has(button[aria-label*="Partager"]), div.group:has(button:has(svg.lucide-share-2))').first();
    await expect(productCard).toBeVisible({ timeout: 15000 });

    // Click card image or title link
    const cardLink = productCard.locator('a').first();
    await cardLink.click({ force: true });

    // Ensure either detail modal appeared or URL navigated to product page
    const detailModal = page.locator('div[role="dialog"]')
      .or(page.locator('.fixed.inset-0'))
      .or(page.getByRole('button', { name: /fermer|close/i }));

    const hasNavigated = page.url().includes('/shop/') || page.url().includes('product=');
    const isModalVisible = await detailModal.first().isVisible().catch(() => false);

    expect(hasNavigated || isModalVisible).toBe(true);
  });

  test('Product share button copies/generates valid product URL with deep link', async ({ page, context }) => {
    // Grant clipboard read/write permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const productCard = page.locator('div.group:has(button[aria-label*="Partager"]), div.group:has(button:has(svg.lucide-share-2))').first();
    await expect(productCard).toBeVisible({ timeout: 15000 });

    const shareBtn = productCard.locator('button[aria-label*="Partager"], button:has(svg.lucide-share-2)').first();
    await expect(shareBtn).toBeVisible();

    // Spy on clipboard writeText
    await page.evaluate(() => {
      window.__copiedUrl = '';
      if (navigator.clipboard) {
        const origWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
        navigator.clipboard.writeText = async (text) => {
          window.__copiedUrl = text;
          return origWriteText(text).catch(() => {});
        };
      }
    });

    // Click share button
    await shareBtn.click();

    // Check toast notification is shown or url was copied
    const toast = page.locator('div[role="status"], div[role="alert"]')
      .or(page.getByText(/lien copié|lien partagé|partage|link copied/i));
    await expect(toast.first()).toBeVisible({ timeout: 6000 });

    // Retrieve generated share link
    const copiedText = await page.evaluate(() => (window as any).__copiedUrl || '');
    if (copiedText) {
      expect(copiedText).toMatch(/\/shop\/(product|perfumes|diffuseurs|accessories|huile)/i);

      // Now verify that visiting the generated share link opens the product detail view/modal
      await page.goto(copiedText);
      await page.waitForLoadState('domcontentloaded');

      // Verify the page or modal loaded the product
      const productContainer = page.locator('main, div[role="dialog"]');
      await expect(productContainer.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('Favorite toggle updates favorite state without navigating away', async ({ page }) => {
    const productCard = page.locator('div.group:has(button[aria-label*="Partager"])').first();
    await expect(productCard).toBeVisible({ timeout: 15000 });

    const initialUrl = page.url();
    const favBtn = productCard.locator('button:has(svg.lucide-heart)').first();
    await expect(favBtn).toBeVisible();

    // Click favorite toggle
    await favBtn.click();

    // Verify it stays on the same page (no accidental full page navigation)
    expect(page.url()).toEqual(initialUrl);
  });
});
