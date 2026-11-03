import { expect, test } from '@playwright/test';

const collectErrors = (page: import('@playwright/test').Page) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
};

test('the skip link is the first stop and jumps into the desktop', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');

  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

test('searching narrows the recipes', async ({ page }) => {
  await page.goto('/app/');
  await expect(page.getByRole('region', { name: 'Recipe Discovery 98' })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole('searchbox').fill('chicken');

  await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator('.meal-card').first()).toBeVisible();
});

test('the recipe window traps focus and closes on Escape', async ({ page }) => {
  await page.goto('/app/');
  await page.locator('.meal-card-hitarea').first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('welcome desktop prerenders and hydrates cleanly', async ({ page }) => {
  const errors = collectErrors(page);

  const response = await page.goto('/');
  expect(response?.status()).toBe(200);

  await expect(page.getByRole('link', { name: 'Open Recipe Finder' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();

  // Give the idle hydration and the deferred ASCII engine time to run.
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test('the launcher opens the finder and loads recipes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Open Recipe Finder' }).click();

  await expect(page).toHaveURL(/\/app\/$/);
  await expect(page.getByRole('heading', { name: 'Featured Recipes' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator('.meal-card').first()).toBeVisible({ timeout: 20_000 });
});

test('display properties opens and applies the plum theme', async ({ page }) => {
  await page.goto('/app/');
  // The launch dialog is modal for a moment; wait for the window it uncovers.
  const appWindow = page.getByRole('region', { name: 'Recipe Discovery 98' });
  await expect(appWindow).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('menuitem', { name: /settings/i }).click();
  await page.getByRole('menuitem', { name: /display properties/i }).click();

  const dialog = page.getByRole('dialog', { name: 'Display Properties' });
  await expect(dialog).toBeVisible();

  // 98.css renders the native radio as a hidden 0x0 control and draws its own
  // box, so the label is what a user clicks.
  await dialog.getByText('Plum', { exact: true }).click();
  await expect(dialog.getByLabel('Plum')).toBeChecked();
  await dialog.getByRole('button', { name: 'OK' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'plum');
});

test('shut down shows the safe-to-turn-off screen', async ({ page }) => {
  await page.goto('/app/');
  await expect(
    page.getByRole('region', { name: 'Recipe Discovery 98' }),
  ).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('menuitem', { name: /shut down/i }).click();

  await expect(
    page.getByText(/now safe to turn off your computer/),
  ).toBeVisible();
});

test('the 404 page is a real route', async ({ page }) => {
  const response = await page.goto('/does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Cannot find this page' })).toBeVisible();
});
