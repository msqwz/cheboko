import { test, expect } from '@playwright/test';

test.describe('Engineer PWA Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // Mobile view

  test('should display task list', async ({ page }) => {
    await page.goto('/engineer/tasks');
  });
});
