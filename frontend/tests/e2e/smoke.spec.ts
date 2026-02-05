import { expect, test } from '@playwright/test';

test.describe('AI Creative Suite Smoke Tests', () => {
    test('should load the dashboard and show core sections', async ({ page }) => {
        await page.goto('/');

        // Check for dashboard sections
        await expect(page.getByText(/Quick Actions/i)).toBeVisible();
        await expect(page.getByText(/Recent Projects/i)).toBeVisible();
        await expect(page.getByText(/AI Image Studio/i)).toBeVisible();
        await expect(page.getByText(/Workflow Canvas/i)).toBeVisible();
    });

    test('should have functioning navigation in sidebar', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText(/Main Menu/i)).toBeVisible();
        await expect(page.getByText(/Workflow/i)).toBeVisible();
        await expect(page.getByText(/Studio/i)).toBeVisible();
    });
});
