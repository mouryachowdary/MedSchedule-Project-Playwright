import { expect, test } from '@playwright/test';

import { MedSchedulePage, getTestTimeout } from '../fixtures/shared-helpers';

test('23. navigating forward and backward through calendar months returns to the correct starting month', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);
  const today = new Date();

  await medSchedulePage.goto();

  // Verify the current month is displayed on load
  await expect(medSchedulePage.calendarMonthLabel(today)).toBeVisible();

  // Advance two months forward
  const stepsForward = 2;
  for (let i = 0; i < stepsForward; i++) {
     await medSchedulePage.clickNextMonth();
    await page.waitForTimeout(200);
  }

  const futureDate = new Date(today.getFullYear(), today.getMonth() + stepsForward, 1);
  await expect(medSchedulePage.calendarMonthLabel(futureDate)).toBeVisible();

  // Navigate back the same number of steps
  for (let i = 0; i < stepsForward; i++) {
     await medSchedulePage.clickPreviousMonth();
    await page.waitForTimeout(200);
  }

  // Should be back on the original month
  await expect(medSchedulePage.calendarMonthLabel(today)).toBeVisible();
});

test('23b. navigating three months forward shows the correct month label', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);
  const today = new Date();

  await medSchedulePage.goto();

  const stepsForward = 3;
  for (let i = 0; i < stepsForward; i++) {
     await medSchedulePage.clickNextMonth();
    await page.waitForTimeout(200);
  }

  const targetDate = new Date(today.getFullYear(), today.getMonth() + stepsForward, 1);
  await expect(medSchedulePage.calendarMonthLabel(targetDate)).toBeVisible();
});
