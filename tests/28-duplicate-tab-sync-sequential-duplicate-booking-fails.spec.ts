import { expect, test } from '@playwright/test';

import {
  MedSchedulePage,
  randomUserOrder,
  preparePatientForBooking,
  preparePatientForNextAvailableDate,
  selectRandomFutureMonthAndDay,
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

test('28a. [Active Date] second booking attempt fails when User 007 books first and User 008 tries after.', async ({ browser }) => {
  test.setTimeout(getTestTimeout(180000, test.info().project.name));

  for (const bookingOrder of bookingOrders) {
    const sharedCtx = await browser.newContext();

    try {
      const firstUser = new MedSchedulePage(await sharedCtx.newPage());
      const secondUser = new MedSchedulePage(await sharedCtx.newPage());

      await Promise.all([
        preparePatientForNextAvailableDate(firstUser, bookingOrder.firstUser),
        preparePatientForNextAvailableDate(secondUser, bookingOrder.secondUser),
      ]);

      await chooseSlot(firstUser, bookingOrder.slot);
      await confirmBooking(firstUser);

      const secondAttempt = await duplicateAttemptState(secondUser, bookingOrder.slot);

      expect(secondAttempt.succeeded).toBeFalsy();
      expect(secondAttempt.hasError || secondAttempt.unavailable || !secondAttempt.couldConfirm).toBeTruthy();
    } finally {
      await sharedCtx.close();
    }
  }
});

test('28b. [Future Date] second booking attempt fails when User 007 books first and User 008 tries after.', async ({ browser }) => {
  test.setTimeout(getTestTimeout(180000, test.info().project.name));

  for (const bookingOrder of bookingOrders) {
    const sharedCtx = await browser.newContext();

    try {
      const firstUser = new MedSchedulePage(await sharedCtx.newPage());
      const secondUser = new MedSchedulePage(await sharedCtx.newPage());

      await Promise.all([
        preparePatientForBooking(firstUser, bookingOrder.firstUser),
        preparePatientForBooking(secondUser, bookingOrder.secondUser),
      ]);

      await chooseSlot(firstUser, bookingOrder.slot);
      await confirmBooking(firstUser);

      const secondAttempt = await duplicateAttemptState(secondUser, bookingOrder.slot);

      expect(secondAttempt.succeeded).toBeFalsy();
      expect(secondAttempt.hasError || secondAttempt.unavailable || !secondAttempt.couldConfirm).toBeTruthy();
    } finally {
      await sharedCtx.close();
    }
  }
});
