import { test } from '@playwright/test';

// Regenerates the screenshots used by the README.
test.use({ viewport: { width: 1280, height: 800 } });

test('capture docs screenshots', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'docs/desktop.png' });

  await page.goto('/app/');
  await page.locator('.meal-card').first().waitFor({ timeout: 25_000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'docs/app.png' });

  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('menuitem', { name: /settings/i }).click();
  await page.getByRole('menuitem', { name: /display properties/i }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'docs/settings.png' });
});
