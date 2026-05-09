import { expect, test } from '@playwright/test';

test.describe('AI Creative Suite Smoke Tests', () => {
    test.describe.configure({ mode: 'serial' });

    test('should load the landing page and show core sections', async ({ page }) => {
        await page.goto('/sign-in');
        await page.getByLabel('Email address').fill('admin@example.com');
        await page.getByLabel('Password').fill('secret');
        await page.getByRole('button', { name: 'Continue' }).click();

        await expect(page.getByRole('heading', { name: /What would you like to create today\?/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Recent creations' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Get Inspired' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Image Gen Try now' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Video Gen Try now' })).toBeVisible();
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

    test('should redirect the legacy workflow-editor alias into the creator route', async ({ page }) => {
        await page.goto('/sign-in');
        await page.getByLabel('Email address').fill('admin@example.com');
        await page.getByLabel('Password').fill('secret');
        await page.getByRole('button', { name: 'Continue' }).click();
        await expect(page).toHaveURL(/\/dashboard/);

        await page.goto('/workflow-editor');

        await expect(page).toHaveURL(/\/workflow-editor/);
        await expect(page.getByRole('heading', { name: 'Your workflow is ready' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Workflow-editor' })).toBeVisible();
        await expect(page.locator('body')).not.toContainText('404');
    });

    test('should open the Spaces shortcut and land on the workflow editor', async ({ page }) => {
        await page.goto('/sign-in');
        await page.getByLabel('Email address').fill('admin@example.com');
        await page.getByLabel('Password').fill('secret');
        await page.getByRole('button', { name: 'Continue' }).click();
        await expect(page).toHaveURL(/\/dashboard/);

        await page.goto('/spaces');

        await expect(page).toHaveURL(/\/spaces/);
        await expect(page.getByRole('heading', { name: 'Your workflow is ready' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Spaces' })).toBeVisible();
    });

    test('should load the music generator workspace and empty state', async ({ page }) => {
        await page.goto('/sign-in');
        await page.getByLabel('Email address').fill('admin@example.com');
        await page.getByLabel('Password').fill('secret');
        await page.getByRole('button', { name: 'Continue' }).click();
        await expect(page).toHaveURL(/\/dashboard/);

        await page.goto('/creator/music-generator');

        await expect(page).toHaveURL(/\/creator\/music-generator/);
        await expect(page.getByRole('heading', { name: 'Music Generator' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'My Creations' })).toBeVisible();
        await expect(page.getByText('No music generated yet.')).toBeVisible();
    });

    test('should load the sfx generator workspace and empty state', async ({ page }) => {
        await page.goto('/sign-in');
        await page.getByLabel('Email address').fill('admin@example.com');
        await page.getByLabel('Password').fill('secret');
        await page.getByRole('button', { name: 'Continue' }).click();
        await expect(page).toHaveURL(/\/dashboard/);

        await page.goto('/creator/sfx-generator');

        await expect(page).toHaveURL(/\/creator\/sfx-generator/);
        await expect(page.getByRole('heading', { name: 'SFX Generator' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Your History' })).toBeVisible();
        await expect(page.getByText('No sound effects yet. Start creating!')).toBeVisible();
    });

    test('should load the voice generator workspace', async ({ page }) => {
        await page.goto('/sign-in');
        await page.getByLabel('Email address').fill('admin@example.com');
        await page.getByLabel('Password').fill('secret');
        await page.getByRole('button', { name: 'Continue' }).click();
        await expect(page).toHaveURL(/\/dashboard/);

        await page.goto('/creator/voice-generator');

        await expect(page).toHaveURL(/\/creator\/voice-generator/);
        await expect(page.getByRole('heading', { name: 'Voice Generator' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Voice Presets' })).toBeVisible();
    });

    test('should preserve next when switching between sign-in and sign-up', async ({ page }) => {
        await page.goto('/sign-in?next=/workflow-editor');
        await expect(page.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', /\/sign-up\?next=%2Fworkflow-editor/);

        await page.getByRole('link', { name: 'Sign up' }).click();

        await expect(page).toHaveURL(/\/sign-up\?next=%2Fworkflow-editor/);
        await expect(page.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', /\/sign-in\?next=%2Fworkflow-editor/);
    });

    test('should prefill sign-in email after successful sign-up', async ({ page }) => {
        const uniqueEmail = `test.user.${Date.now()}@example.com`;

        await page.goto('/sign-up?next=/workflow-editor');
        await page.getByLabel('First name').fill('Test');
        await page.getByLabel('Last name').fill('User');
        await page.getByLabel('Email address').fill(uniqueEmail);
        await page.getByLabel('Password').fill('password123');

        await page.getByRole('button', { name: 'Continue' }).click();

        await expect(page).toHaveURL(/\/sign-in\?next=%2Fworkflow-editor&email=/);
        await expect(page.getByLabel('Email address')).toHaveValue(uniqueEmail);
    });
});
