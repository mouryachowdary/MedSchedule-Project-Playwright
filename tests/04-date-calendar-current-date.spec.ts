import { expect, test } from '@playwright/test';

import { MedSchedulePage } from '../fixtures/shared-helpers';

test('Select date text and calendar, current date and month validation', async ({ page }) => {
  const medSchedulePage = new MedSchedulePage(page);
  const today = new Date();

  await medSchedulePage.goto();

  await expect(medSchedulePage.selectDateHeading).toBeVisible();
  await expect(medSchedulePage.calendarMonthLabel(today)).toBeVisible();
  await expect(medSchedulePage.previousMonthButton).toBeVisible();
  await expect(medSchedulePage.nextMonthButton).toBeVisible();
  await expect(medSchedulePage.calendarDay(today.getDate())).toBeVisible();
});