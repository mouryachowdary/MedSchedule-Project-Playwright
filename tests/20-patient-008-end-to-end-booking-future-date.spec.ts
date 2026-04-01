import { expect, test } from '@playwright/test';

import {
  MedSchedulePage,
  selectRandomFutureMonthAndDay,
  availableSlots,
  patients,
  getTestTimeout,
} from '../fixtures/shared-helpers';


test('20. patient 008 can complete a full appointment booking on a future date', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);
  const targetSlot = availableSlots[5]; // 11:30 AM

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('008');
  await medSchedulePage.selectPatientById('008');
  await page.waitForTimeout(300);

  await selectRandomFutureMonthAndDay(medSchedulePage);
  await page.waitForTimeout(300);

  await medSchedulePage.clickSlot(targetSlot);
  await page.waitForTimeout(300);

  await expect(medSchedulePage.confirmAppointmentButton()).toBeVisible();
  await medSchedulePage.clickConfirmAppointmentButton();
  await page.waitForTimeout(1000);

  await expect(medSchedulePage.bookingSuccessMessage()).toBeVisible();
});

test('20b. patient 008 selected label displays correctly after search and selection', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('008');
  await medSchedulePage.selectPatientById('008');
  await page.waitForTimeout(300);

  await expect(medSchedulePage.selectedPatient(patients['008'].selectedLabel)).toBeVisible();
});
