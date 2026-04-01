import { expect, test } from '@playwright/test';

import { MedSchedulePage, selectCurrentActiveDay, availableSlots, getTestTimeout } from '../fixtures/shared-helpers';

test('36a. available time slots remain visible when navigating to a future month without selecting a new date', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);
  const today = new Date();

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  // Confirm today is auto-selected and available times are shown
  await expect(medSchedulePage.availableTimesHeading).toBeVisible();
  await expect(medSchedulePage.selectedDateLabel(today)).toBeVisible();

  // Navigate forward by one month without clicking any date
  await medSchedulePage.clickNextMonth();
  await page.waitForTimeout(300);

  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  await expect(medSchedulePage.calendarMonthLabel(nextMonth)).toBeVisible();

  // Available times heading must still be visible — the selected date has not changed
  await expect(medSchedulePage.availableTimesHeading).toBeVisible();

  // The selected date label for today must still be present (no new date was picked)
  await expect(medSchedulePage.selectedDateLabel(today)).toBeVisible();

  // Individual slot buttons from the original selection should still be rendered
  await expect(medSchedulePage.slotButton(availableSlots[0])).toBeVisible();
});

test('36b. available slots remain intact after navigating two months forward and returning', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);
  const today = new Date();

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  // Establish baseline: today is selected, slots are visible
  await expect(medSchedulePage.availableTimesHeading).toBeVisible();

  // Navigate forward 2 months
  await medSchedulePage.clickNextMonth();
  await page.waitForTimeout(200);
  await medSchedulePage.clickNextMonth();
  await page.waitForTimeout(200);

  const twoMonthsAhead = new Date(today.getFullYear(), today.getMonth() + 2, 1);
  await expect(medSchedulePage.calendarMonthLabel(twoMonthsAhead)).toBeVisible();

  // Slots must still be visible from the original selected date
  await expect(medSchedulePage.availableTimesHeading).toBeVisible();
  await expect(medSchedulePage.slotButton(availableSlots[0])).toBeVisible();

  // Navigate back to current month
  await medSchedulePage.clickPreviousMonth();
  await page.waitForTimeout(200);
  await medSchedulePage.clickPreviousMonth();
  await page.waitForTimeout(200);

  await expect(medSchedulePage.calendarMonthLabel(today)).toBeVisible();

  // Slots must still be present after returning
  await expect(medSchedulePage.availableTimesHeading).toBeVisible();
  await expect(medSchedulePage.slotButton(availableSlots[0])).toBeVisible();
  await expect(medSchedulePage.selectedDateLabel(today)).toBeVisible();
});

test('36c. selected slot highlight persists while browsing calendar months', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  await selectCurrentActiveDay(medSchedulePage);
  await page.waitForTimeout(300);

  // Select a specific slot
  const targetSlot = availableSlots[4]; // 11:00 AM
  await medSchedulePage.clickSlot(targetSlot);
  await page.waitForTimeout(300);

  // Confirm button visible: slot is selected
  await expect(medSchedulePage.confirmAppointmentButton()).toBeVisible();

  // Scroll through the calendar without selecting a new date
  await medSchedulePage.clickNextMonth();
  await page.waitForTimeout(300);
  await medSchedulePage.clickPreviousMonth();
  await page.waitForTimeout(300);

  // After returning, the confirm button must still be visible (slot is still chosen)
  await expect(medSchedulePage.confirmAppointmentButton()).toBeVisible();

  // The selected slot button must still be rendered
  await expect(medSchedulePage.slotButton(targetSlot)).toBeVisible();
});
