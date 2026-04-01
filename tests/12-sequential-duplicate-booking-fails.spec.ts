import { expect, test } from '@playwright/test';

import {
  MedSchedulePage,
  randomUserOrder,
  preparePatientForBooking,
  preparePatientForCurrentDate,
  chooseSlot,
  confirmBooking,
  duplicateAttemptState,
  availableSlots,
  getTestTimeout,
} from '../fixtures/shared-helpers';


const bookingOrders = [
  { firstUser: '007' as const, secondUser: '008' as const, slot: availableSlots[2] },
  { firstUser: '008' as const, secondUser: '007' as const, slot: availableSlots[3] },
];

test('12a. [Active Date] second booking attempt fails when User 007 books first and User 008 tries after.', async ({ browser }) => {
  test.setTimeout(getTestTimeout(110000, test.info().project.name));

  for (const bookingOrder of bookingOrders) {
    const firstContext = await browser.newContext();
    const secondContext = await browser.newContext();

    try {
      const firstUser = new MedSchedulePage(await firstContext.newPage());
      const secondUser = new MedSchedulePage(await secondContext.newPage());

      await preparePatientForCurrentDate(firstUser, bookingOrder.firstUser);
      await chooseSlot(firstUser, bookingOrder.slot);
      await confirmBooking(firstUser);

      await preparePatientForCurrentDate(secondUser, bookingOrder.secondUser);
      const secondAttempt = await duplicateAttemptState(secondUser, bookingOrder.slot);

      expect(secondAttempt.succeeded).toBeFalsy();
      expect(secondAttempt.hasError || secondAttempt.unavailable || !secondAttempt.couldConfirm).toBeTruthy();
    } finally {
      await Promise.allSettled([firstContext.close(), secondContext.close()]);
    }
  }
});

test('12b. [Future Date] second booking attempt fails when User 007 books first and User 008 tries after.', async ({ browser }) => {
  test.setTimeout(getTestTimeout(110000, test.info().project.name));

  for (const bookingOrder of bookingOrders) {
    const firstContext = await browser.newContext();
    const secondContext = await browser.newContext();

    try {
      const firstUser = new MedSchedulePage(await firstContext.newPage());
      const secondUser = new MedSchedulePage(await secondContext.newPage());

      await preparePatientForBooking(firstUser, bookingOrder.firstUser);
      await chooseSlot(firstUser, bookingOrder.slot);
      await confirmBooking(firstUser);

      await preparePatientForBooking(secondUser, bookingOrder.secondUser);
      const secondAttempt = await duplicateAttemptState(secondUser, bookingOrder.slot);

      expect(secondAttempt.succeeded).toBeFalsy();
      expect(secondAttempt.hasError || secondAttempt.unavailable || !secondAttempt.couldConfirm).toBeTruthy();
    } finally {
      await Promise.allSettled([firstContext.close(), secondContext.close()]);
    }
  }
});
