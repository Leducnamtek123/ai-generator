import { expect, test } from '@playwright/test';

test.describe('VisualFlow Studio E2E', () => {
  test.setTimeout(60_000);

  test('should create a project, a video, and a scene', async ({ page }) => {
    const projectName = `VisualFlow E2E ${Date.now()}`;
    const videoTitle = `Episode ${Date.now()}`;

    await page.goto('/sign-in');
    await page.getByLabel('Email address').fill('admin@example.com');
    await page.getByLabel('Password').fill('secret');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/visual-flow');
    await expect(page.getByRole('heading', { name: 'AI Video Pipeline' })).toBeVisible();

    await page.getByRole('button', { name: 'New Project' }).click();
    await page.getByPlaceholder('e.g. Dragon Chronicles Episode 1').fill(projectName);
    await page.getByPlaceholder('Describe your full story here. The AI will use this to maintain consistency across all scenes...').fill(
      'An E2E story for VisualFlow Studio.',
    );
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Create Project', exact: true }).click();

    await expect(page).toHaveURL(/\/visual-flow\/projects\//);
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible();

    await page.getByLabel('New Video').click();
    await page.getByPlaceholder('Episode title...').fill(videoTitle);
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByRole('button', { name: videoTitle, exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Add Scene' }).click();
    const sceneDialog = page.getByRole('dialog');
    await sceneDialog.getByPlaceholder('Describe the frame: "Luna stands on the candy planet surface, sunrise, wide shot"').fill(
      'A bright hero shot with soft lighting and a clean background.',
    );
    await sceneDialog.getByRole('button', { name: 'Add Scene' }).click();

    await expect(page.getByText('SCENE 1')).toBeVisible();
    await expect(page.getByText('ROOT')).toBeVisible();
  });
});
