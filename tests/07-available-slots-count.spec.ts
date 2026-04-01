import { expect, test } from '@playwright/test';

import { MedSchedulePage, availableSlots, selectCurrentActiveDay } from '../fixtures/shared-helpers';

test('Number of available slots count validation', async ({ page }) => {
  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();
  await selectCurrentActiveDay(medSchedulePage);

  await expect(medSchedulePage.availableSlotsCountLabel(availableSlots.length)).toBeVisible();

  for (const slot of availableSlots) {
    await expect(medSchedulePage.slotButton(slot)).toBeVisible();
  }
});