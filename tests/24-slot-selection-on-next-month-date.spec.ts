import { expect, test } from '@playwright/test';

import { MedSchedulePage, availableSlots, getTestTimeout } from '../fixtures/shared-helpers';

async function selectFirstEnabledDayInNextMonth(user: MedSchedulePage) {
  await user.clickNextMonth();
  await user.page.waitForTimeout(300);

  const calendarDays = user.page.locator('[role="gridcell"]');
  const dayCount = await calendarDays.count();
  const enabledDayIndexes: number[] = [];

  for (let i = 0; i < dayCount; i++) {
    const day = calendarDays.nth(i);
    const isDisabled = await day
      .evaluate((element) => {
        const button = element as HTMLButtonElement;
        return button.disabled || element.getAttribute('disabled') !== null || element.getAttribute('aria-disabled') === 'true';
      })
      .catch(() => true);

    if (!isDisabled) {
      enabledDayIndexes.push(i);
    }
  }

  if (enabledDayIndexes.length === 0) {
    throw new Error('No enabled calendar day found in next month');
  }

  // Pick the first available day in the next month for determinism
  await user.robustClick(calendarDays.nth(enabledDayIndexes[0]), 12000);
}

test('24a. confirm appointment button appears after selecting a slot on a next-month date', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);
  const targetSlot = availableSlots[2]; // 10:00 AM

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  await selectFirstEnabledDayInNextMonth(medSchedulePage);
  await page.waitForTimeout(300);

  // Available times section must be visible after picking a next-month date
  await expect(medSchedulePage.availableTimesHeading).toBeVisible();

  // Select a slot and verify the confirm button becomes visible
  await medSchedulePage.clickSlot(targetSlot);
  await page.waitForTimeout(300);

  await expect(medSchedulePage.confirmAppointmentButton()).toBeVisible();
});

test('24b. all time slot buttons remain visible after navigating to a next-month date', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('008');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  await selectFirstEnabledDayInNextMonth(medSchedulePage);
  await page.waitForTimeout(300);

  for (const slot of availableSlots) {
    await expect(medSchedulePage.slotButton(slot)).toBeVisible();
  }
});
