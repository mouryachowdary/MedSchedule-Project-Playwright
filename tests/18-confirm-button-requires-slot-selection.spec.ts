import { expect, test } from '@playwright/test';

import {
  MedSchedulePage,
  randomUserOrder,
  preparePatientForCurrentDate,
  selectCurrentActiveDay,
  selectRandomFutureMonthAndDay,
  availableSlots,
  getTestTimeout,
} from '../fixtures/shared-helpers';


test('18. confirm appointment button is not visible until a time slot is selected', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  // A date is already active on load — confirm button must NOT be visible before any slot is chosen
  await expect(medSchedulePage.confirmAppointmentButton()).not.toBeVisible();

  // Select an active calendar day and verify the confirm button is still absent
  await selectCurrentActiveDay(medSchedulePage);
  await page.waitForTimeout(300);

  await expect(medSchedulePage.confirmAppointmentButton()).not.toBeVisible();

  // Now select a slot — the confirm button must become visible
  await medSchedulePage.clickSlot(availableSlots[0]);
  await page.waitForTimeout(300);

  await expect(medSchedulePage.confirmAppointmentButton()).toBeVisible();
});
