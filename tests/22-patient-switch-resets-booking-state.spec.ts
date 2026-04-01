import { expect, test } from '@playwright/test';

import { MedSchedulePage, availableSlots, patients, selectCurrentActiveDay, getTestTimeout } from '../fixtures/shared-helpers';

test('22. switching to a different patient resets the selected patient context', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);
  const targetSlot = availableSlots[1]; // 9:30 AM

  // Step 1: Select patient 007, pick a date and a slot
  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  await selectCurrentActiveDay(medSchedulePage);
  await page.waitForTimeout(300);

  await medSchedulePage.clickSlot(targetSlot);
  await page.waitForTimeout(300);

  // Confirm button is visible while patient 007 has a slot selected
  await expect(medSchedulePage.confirmAppointmentButton()).toBeVisible();

  // Verify patient 007 is shown as selected
  await expect(medSchedulePage.selectedPatient(patients['007'].selectedLabel)).toBeVisible();

  // Step 2: Switch to patient 008
  await medSchedulePage.searchPatient('008');
  await medSchedulePage.selectPatientById('008');
  await page.waitForTimeout(300);

  // Patient 008 label should now be displayed in the selector
  await expect(medSchedulePage.selectedPatient(patients['008'].selectedLabel)).toBeVisible();

  // Patient 007 label should no longer appear as selected
  await expect(medSchedulePage.selectedPatient(patients['007'].selectedLabel)).not.toBeVisible();

  // Confirm button must not be visible — no slot has been picked for the new patient yet
  await expect(medSchedulePage.confirmAppointmentButton()).not.toBeVisible();
});
