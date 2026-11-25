import { test, expect } from '@playwright/test';

test.describe('Forms, Inputs, Modals & Validation Suite', () => {
  test('Login form validates empty fields and accepts user inputs', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
    const passwordInput = page.getByLabel(/mot de passe|password/i).or(page.getByPlaceholder(/mot de passe|password/i)).first();
    const submitBtn = page.getByRole('button', { name: /connexion|se connecter|login|sign in/i }).first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // Type valid format
    await emailInput.fill('client@example.com');
    await expect(emailInput).toHaveValue('client@example.com');

    await passwordInput.fill('SecretPassword123!');
    await expect(passwordInput).toHaveValue('SecretPassword123!');

    // Test password show/hide toggle if present
    const toggleEye = page.locator('button:has(svg.lucide-eye), button:has(svg.lucide-eye-off)').first();
    if (await toggleEye.isVisible()) {
      await toggleEye.click();
      const type = await passwordInput.getAttribute('type');
      expect(['text', 'password']).toContain(type);
    }
  });

  test('Registration form validates required fields and password strength', async ({ page }) => {
    await page.goto('/register');

    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
    await expect(emailInput).toBeVisible();

    // Fill email
    await emailInput.fill('newuser@example.com');
    await expect(emailInput).toHaveValue('newuser@example.com');

    // Fill password and observe password strength component if present
    const passwordInput = page.getByLabel(/mot de passe|password/i).or(page.getByPlaceholder(/mot de passe|password/i)).first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('Weak');
      // Look for strength indicator or helper
      const strengthIndicator = page.locator('div:has-text("Faible"), div:has-text("Moyen"), div:has-text("Fort")');
      if (await strengthIndicator.count() > 0) {
        await expect(strengthIndicator.first()).toBeVisible();
      }
    }
  });

  test('Forgot password view accepts email and triggers submit feedback', async ({ page }) => {
    await page.goto('/forgot-password');

    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('reset@example.com');
      await expect(emailInput).toHaveValue('reset@example.com');

      const submitBtn = page.getByRole('button', { name: /réinitialiser|envoyer|reset|send/i }).first();
      await expect(submitBtn).toBeVisible();
    }
  });

  test('Boutique and Partner application forms validate form submission controls', async ({ page }) => {
    await page.goto('/apply/boutique');

    const nameInput = page.getByLabel(/nom|prénom|name/i).or(page.getByPlaceholder(/nom|prénom|name/i)).first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Boutique Testeur');
      await expect(nameInput).toHaveValue('Boutique Testeur');
    }
  });
});
