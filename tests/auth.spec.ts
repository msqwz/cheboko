import { test, expect } from '@playwright/test';

test.describe('Authentication and Role-based Redirects', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*login/);
  });

  test('admin zone should be reachable', async ({ page }) => {
    await page.goto('/admin');
    // If redirect to login happens, it's fine for now as we don't have auth data
    // We just want to make sure it's not a 404
    const response = await page.request.get('/admin');
    expect(response.status()).not.toBe(404);
  });

  test('engineer zone should be reachable', async ({ page }) => {
    const response = await page.request.get('/engineer/tasks');
    expect(response.status()).not.toBe(404);
  });

  test('client zone should be reachable', async ({ page }) => {
    const response = await page.request.get('/tickets');
    expect(response.status()).not.toBe(404);
  });
});
