import { expect, test } from '@playwright/test';

import {
  MedSchedulePage,
  selectCurrentActiveDay,
  availableSlots,
  bookingSucceeded,
  getTestTimeout,
} from '../fixtures/shared-helpers';

test('35a. page reload clears selected slot and hides the confirm appointment button', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);

  // Build up a full selection state: patient + active date + slot
  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  await selectCurrentActiveDay(medSchedulePage);
  await page.waitForTimeout(300);

  await medSchedulePage.clickSlot(availableSlots[1]); // 9:30 AM
  await page.waitForTimeout(300);

  // Confirm button must be visible before the reload
  await expect(medSchedulePage.confirmAppointmentButton()).toBeVisible();

  // Hard reload the page
  await page.reload({ waitUntil: 'domcontentloaded' });
  await medSchedulePage.appHeading.waitFor({ state: 'visible', timeout: 20000 });
  await medSchedulePage.patientSelector.waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(500);

  // After reload, no slot is selected — confirm button must NOT be visible
  await expect(medSchedulePage.confirmAppointmentButton()).not.toBeVisible();
});

test('35b. page reload after a completed booking returns to a clean initial app state', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);

  // Complete a full appointment booking
  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  await selectCurrentActiveDay(medSchedulePage);
  await page.waitForTimeout(300);

  await medSchedulePage.clickSlot(availableSlots[5]); // 11:30 AM
  await page.waitForTimeout(300);

  await medSchedulePage.clickConfirmAppointmentButton();
  await page.waitForTimeout(1000);

  // Success message should be visible before the reload
  await expect(medSchedulePage.bookingSuccessMessage()).toBeVisible();

  // Hard reload
  await page.reload({ waitUntil: 'domcontentloaded' });
  await medSchedulePage.appHeading.waitFor({ state: 'visible', timeout: 20000 });
  await medSchedulePage.patientSelector.waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(500);

  // Success message must be gone — the booking confirmation flow is session-level
  await expect(medSchedulePage.bookingSuccessMessage()).not.toBeVisible();

  // Core app chrome must be intact and healthy after reload
  await expect(medSchedulePage.appHeading).toBeVisible();
  await expect(medSchedulePage.patientSelector).toBeVisible();
  await expect(medSchedulePage.selectDateHeading).toBeVisible();
  await expect(medSchedulePage.availableTimesHeading).toBeVisible();
  await expect(medSchedulePage.confirmAppointmentButton()).not.toBeVisible();
});

test('35c. page reload resets confirm button visibility even after navigating to a future month and selecting a slot', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);
  const today = new Date();

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('008');
  await medSchedulePage.selectPatientById('008');
  await page.waitForTimeout(300);

  // Navigate to next month and pick a date
  await medSchedulePage.clickNextMonth();
  await page.waitForTimeout(300);

  // Find a future (enabled) day to click
  const calendarDays = page.locator('[role="gridcell"]');
  const dayCount = await calendarDays.count();
  let enabledDayIndex = -1;

  for (let i = 0; i < dayCount; i++) {
    const isDisabled = await calendarDays.nth(i).evaluate((el) => {
      const btn = el as HTMLButtonElement;
      return btn.disabled || el.getAttribute('disabled') !== null || el.getAttribute('aria-disabled') === 'true';
    }).catch(() => true);

    if (!isDisabled) {
      enabledDayIndex = i;
      break;
    }
  }

  if (enabledDayIndex >= 0) {
    await calendarDays.nth(enabledDayIndex).click();
    await page.waitForTimeout(300);
  }

  await medSchedulePage.clickSlot(availableSlots[7]); // 1:30 PM
  await page.waitForTimeout(300);

  // Confirm button must be visible before reload
  await expect(medSchedulePage.confirmAppointmentButton()).toBeVisible();

  // Reload the page
  await page.reload({ waitUntil: 'domcontentloaded' });
  await medSchedulePage.appHeading.waitFor({ state: 'visible', timeout: 20000 });
  await medSchedulePage.patientSelector.waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(500);

  // After reload, the future-month slot selection is gone — confirm button not visible
  await expect(medSchedulePage.confirmAppointmentButton()).not.toBeVisible();

  // Calendar should return to the current month on fresh load
  await expect(medSchedulePage.calendarMonthLabel(today)).toBeVisible();
});
