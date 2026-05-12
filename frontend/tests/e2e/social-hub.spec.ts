import { expect, test, type Page } from '@playwright/test';

async function signIn(page: Page) {
    await page.goto('/sign-in');
    await page.getByLabel('Email address').fill('admin@example.com');
    await page.getByLabel('Password').fill('secret');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Social Hub', () => {
    test('should open the three social hub surfaces after sign-in', async ({ page }) => {
        await signIn(page);

        await page.goto('/social');
        await expect(page.getByRole('heading', { name: 'Choose a workspace surface' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Open Dashboard' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Open Channels' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Open Calendar' })).toBeVisible();

        await page.goto('/social/dashboard');
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
        await expect(page.getByText('Engagement overview')).toBeVisible();
        await expect(page.getByRole('button', { name: '7 Days' })).toBeVisible();

        await page.goto('/social/channels');
        await expect(page.getByRole('heading', { name: 'Channels' })).toBeVisible();
        await expect(page.getByText('Pick a provider and connect it here')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Connect Account' }).first()).toBeVisible();

        await page.goto('/social/calendar');
        await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'New Post' })).toBeVisible();
    });
});
