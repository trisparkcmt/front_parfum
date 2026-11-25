import { test, expect } from '@playwright/test';

test.describe('Authentication Views', () => {
  test('login page contains email, password inputs and action button', async ({ page }) => {
    await page.goto('/login');

    // Verify input fields
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
    const passwordInput = page.getByLabel(/mot de passe|password/i).or(page.getByPlaceholder(/mot de passe|password/i)).first();
    const submitBtn = page.getByRole('button', { name: /connexion|se connecter|login|sign in/i }).first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
  });

  test('register page renders properly with registration controls', async ({ page }) => {
    await page.goto('/register');

    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
    await expect(emailInput).toBeVisible();
  });
});
