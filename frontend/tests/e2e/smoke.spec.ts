import { expect, test } from '@playwright/test';

test.describe('AI Creative Suite Smoke Tests', () => {
    test('should load the landing page and show core sections', async ({ page }) => {
        await page.goto('/');

        await expect(page.locator('#hero')).toBeVisible();
        await expect(page.locator('#workflow')).toBeVisible();
        await expect(page.locator('#features')).toBeVisible();
        await expect(page.locator('#inspire')).toBeVisible();
    });

    test('should have functioning navigation in the authenticated sidebar', async ({ page }) => {
        await page.goto('/sign-in');
        await page.getByLabel('Email address').fill('admin@example.com');
        await page.getByLabel('Password').fill('secret');
        await page.getByRole('button', { name: 'Continue' }).click();

        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.getByRole('link', { name: /VisualFlow Studio/i })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Stock', exact: true })).toBeVisible();
    });
});
