import { expect, test } from '@playwright/test';

import { MedSchedulePage } from '../fixtures/shared-helpers';

test('Available times, selected day, month, date and year display validation', async ({ page }) => {
  const medSchedulePage = new MedSchedulePage(page);
  const today = new Date();

  await medSchedulePage.goto();

  await expect(medSchedulePage.availableTimesHeading).toBeVisible();
  await expect(medSchedulePage.selectedDateLabel(today)).toBeVisible();
});