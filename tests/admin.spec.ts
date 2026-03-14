import { test, expect } from '@playwright/test';

test.describe('Admin Panel Tests', () => {
  test('should display dashboard', async ({ page }) => {
    await page.goto('/admin');
    // Should see sidebar elements or redirect to login
  });

  test('should navigate to ticket list', async ({ page }) => {
    await page.goto('/admin/tickets');
    // Basic connectivity check
  });
});
