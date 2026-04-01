import { expect, test } from '@playwright/test';

import { MedSchedulePage, pageTitle } from '../fixtures/shared-helpers';

test('Navigation and page title validation', async ({ page }) => {
  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();

  await expect(page).toHaveTitle(pageTitle);
  await expect(page).toHaveURL('/');
  await expect(medSchedulePage.appHeading).toBeVisible();
});