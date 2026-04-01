import { expect, test } from '@playwright/test';

import { MedSchedulePage, patients } from '../fixtures/shared-helpers';

test('Search patient input box and search patient using name and ID 007 and 008 and select validation', async ({ page }) => {
  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();

  await medSchedulePage.searchPatient('007');
  await expect(medSchedulePage.patientSearchResultById('007')).toContainText(patients['007'].name);
  await expect(medSchedulePage.patientSearchResultById('007')).toContainText(patients['007'].idText);
  await medSchedulePage.selectPatientById('007');
  await expect(medSchedulePage.selectedPatient(patients['007'].selectedLabel)).toBeVisible();

  await medSchedulePage.searchPatient('008');
  await expect(medSchedulePage.patientSearchResultById('008')).toContainText(patients['008'].name);
  await expect(medSchedulePage.patientSearchResultById('008')).toContainText(patients['008'].idText);
  await medSchedulePage.selectPatientById('008');
  await expect(medSchedulePage.selectedPatient(patients['008'].selectedLabel)).toBeVisible();
});