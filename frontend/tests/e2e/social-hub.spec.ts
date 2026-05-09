import { expect, test, type Page } from '@playwright/test';

async function signIn(page: Page) {
    await page.goto('/sign-in');
    await page.getByLabel('Email address').fill('admin@example.com');
    await page.getByLabel('Password').fill('secret');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Social Hub', () => {
    test('should open the overview, publish composer, and inbox after sign-in', async ({ page }) => {
        await signIn(page);

        await page.goto('/social');
        await expect(page.getByRole('heading', { name: 'Facebook-first multichannel workspace' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Open Publish' }).first()).toBeVisible();

        await page.goto('/social/publish');
        await expect(page.getByRole('heading', { name: 'Create Post' })).toBeVisible();
        await expect(page.getByText('Publishing checklist')).toBeVisible();

        await page.goto('/social/inbox');
        await expect(page.getByRole('heading', { name: 'Social Inbox' })).toBeVisible();
        await expect(page.getByText('Unified inbox: filter, reply, mark follow-up, and close the loop.')).toBeVisible();
    });

    test('should open channels and calendar after sign-in', async ({ page }) => {
        await signIn(page);

        await page.goto('/social/channels');
        await expect(page.getByRole('heading', { name: 'Social Channels' })).toBeVisible();
        await expect(page.getByText('Facebook-first onboarding')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Connect Account' }).first()).toBeVisible();

        await page.goto('/social/calendar');
        await expect(page.getByRole('heading', { name: 'Social Calendar' })).toBeVisible();
        await expect(page.getByText('Planner snapshot')).toBeVisible();
        await expect(page.getByRole('button', { name: 'New Post' })).toBeVisible();
    });
});
