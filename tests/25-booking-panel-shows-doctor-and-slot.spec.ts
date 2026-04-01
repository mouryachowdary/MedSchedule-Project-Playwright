import { expect, test } from '@playwright/test';

import { MedSchedulePage, availableSlots, doctorProfile, selectCurrentActiveDay, getTestTimeout } from '../fixtures/shared-helpers';

test('25a. booking confirmation panel shows doctor name after a slot is selected', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);
  const targetSlot = availableSlots[4]; // 11:00 AM

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  await selectCurrentActiveDay(medSchedulePage);
  await page.waitForTimeout(300);

  await medSchedulePage.clickSlot(targetSlot);
  await page.waitForTimeout(300);

  // The confirmation panel should reference the doctor
  await expect(medSchedulePage.confirmAppointmentButton()).toBeVisible();
  await expect(page.getByText(doctorProfile.name).first()).toBeVisible();
});

test('25b. booking confirmation panel shows selected slot time after selection', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);
  const targetSlot = availableSlots[6]; // 1:00 PM

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  await selectCurrentActiveDay(medSchedulePage);
  await page.waitForTimeout(300);

  await medSchedulePage.clickSlot(targetSlot);
  await page.waitForTimeout(300);

  // The page should show the chosen slot somewhere in the booking panel
  await expect(medSchedulePage.confirmAppointmentButton()).toBeVisible();
  await expect(page.getByText(targetSlot).first()).toBeVisible();
});
