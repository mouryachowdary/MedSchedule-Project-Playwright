import { expect, test } from '@playwright/test';

import { MedSchedulePage, availableSlots, selectCurrentActiveDay } from '../fixtures/shared-helpers';

test('Available slots validation 9:00 AM to 4:30 PM', async ({ page }) => {
  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();
  await selectCurrentActiveDay(medSchedulePage);

  await expect(medSchedulePage.slotButton(availableSlots[0])).toBeVisible();
  await expect(medSchedulePage.slotButton(availableSlots[availableSlots.length - 1])).toBeVisible();

  for (const slot of availableSlots) {
    await expect(medSchedulePage.slotButton(slot)).toBeVisible();
  }
});