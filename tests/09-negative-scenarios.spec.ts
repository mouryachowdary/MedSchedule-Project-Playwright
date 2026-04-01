import { expect, test } from '@playwright/test';

import { MedSchedulePage, selectCurrentActiveDay } from '../fixtures/shared-helpers';

test('Invalid patient search shows no results', async ({ page }) => {
  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('999');

  await expect(medSchedulePage.patientSearch).toHaveValue('999');
  await expect(medSchedulePage.noPatientsFoundMessage()).toBeVisible();
  await expect(medSchedulePage.patientSearchResultById('999')).toHaveCount(0);
});

test('Selecting a time without choosing a patient shows a blocking notification', async ({ page }) => {
  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();
  await selectCurrentActiveDay(medSchedulePage);
  await medSchedulePage.clickSlot('9:00 AM');

  await expect(medSchedulePage.noPatientSelectedTitle()).toBeVisible();
  await expect(medSchedulePage.noPatientSelectedDescription()).toBeVisible();
  await expect(medSchedulePage.patientSelector).toHaveText(/Select Patient/);
});

test('Changing the calendar month does not change the selected schedule date until a date is picked', async ({ page }) => {
  const medSchedulePage = new MedSchedulePage(page);
  const today = new Date();
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  await medSchedulePage.goto();
  await medSchedulePage.clickPreviousMonth();

  await expect(medSchedulePage.calendarMonthLabel(previousMonth)).toBeVisible();
  await expect(medSchedulePage.selectedDateLabel(today)).toBeVisible();
});