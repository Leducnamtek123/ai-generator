import { expect, test } from '@playwright/test';

test.describe('AI Creative Suite Smoke Tests', () => {
    test('should load the landing page and show core sections', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByRole('heading', { name: /Your paint/i })).toBeVisible();
        await expect(page.getByText(/Recently Generated/i)).toBeVisible();
        await expect(page.getByText(/Text to Everything\./i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Join Free/i })).toBeVisible();
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
