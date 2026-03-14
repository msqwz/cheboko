import { test, expect } from '@playwright/test';

test.describe('Client Zone Tests', () => {
  test('should display ticket list', async ({ page }) => {
    await page.goto('/tickets');
  });

  test('should navigate to new ticket page', async ({ page }) => {
    await page.goto('/tickets/new');
  });
});
