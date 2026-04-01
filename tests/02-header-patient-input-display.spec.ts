import { expect, test } from '@playwright/test';

import { MedSchedulePage } from '../fixtures/shared-helpers';

test('Header and select patient input display validation', async ({ page }) => {
  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();

  await expect(medSchedulePage.appHeading).toBeVisible();
  await expect(medSchedulePage.patientSelector).toBeVisible();
  await expect(medSchedulePage.patientSelector).toHaveText(/Select Patient/);

  await medSchedulePage.openPatientSelector();

  await expect(medSchedulePage.patientSearch).toBeVisible();
  await expect(medSchedulePage.patientSearch).toHaveAttribute('placeholder', 'Search patients...');
  await expect(medSchedulePage.patientSearchHint()).toBeVisible();
});