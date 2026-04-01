import { expect, test } from '@playwright/test';

import {
  MedSchedulePage,
  randomUserOrder,
  preparePatientForBooking,
  preparePatientForCurrentDate,
  selectCurrentActiveDay,
  chooseSlot,
  confirmBooking,
  tryConfirmBooking,
  bookingSucceeded,
  availableSlots,
  patients,
  getTestTimeout,
} from '../fixtures/shared-helpers';


test('19. patient 007 can complete a full appointment booking on the current active date', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);
  const targetSlot = availableSlots[3]; // 10:30 AM

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  await selectCurrentActiveDay(medSchedulePage);
  await page.waitForTimeout(300);

  await medSchedulePage.clickSlot(targetSlot);
  await page.waitForTimeout(300);

  await expect(medSchedulePage.confirmAppointmentButton()).toBeVisible();
  await medSchedulePage.clickConfirmAppointmentButton();
  await page.waitForTimeout(1000);

  await expect(medSchedulePage.bookingSuccessMessage()).toBeVisible();
});

test('19b. patient 007 selected label displays correctly after search and selection', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  await expect(medSchedulePage.selectedPatient(patients['007'].selectedLabel)).toBeVisible();
});
