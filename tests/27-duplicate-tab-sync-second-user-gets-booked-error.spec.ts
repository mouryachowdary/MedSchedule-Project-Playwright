import { expect, test } from '@playwright/test';

import {
  MedSchedulePage,
  randomUserOrder,
  preparePatientForNextAvailableDate,
  selectRandomFutureMonthAndDay,
  chooseSlot,
  confirmBooking,
  duplicateAttemptState,
  availableSlots,
  getTestTimeout,
} from '../fixtures/shared-helpers';


test('27a. [Active Date] second user receives "slot already booked" error when attempting concurrent booking.', async ({ browser }) => {
  test.setTimeout(getTestTimeout(110000, test.info().project.name));

  const targetSlot = availableSlots[1];
  const [bookingPatient, secondPatient] = randomUserOrder();
  const sharedCtx = await browser.newContext();

  try {
    const bookingUser = new MedSchedulePage(await sharedCtx.newPage());
    const secondUser = new MedSchedulePage(await sharedCtx.newPage());

    await Promise.all([
      preparePatientForNextAvailableDate(bookingUser, bookingPatient),
      preparePatientForNextAvailableDate(secondUser, secondPatient),
    ]);

    await chooseSlot(bookingUser, targetSlot);
    await confirmBooking(bookingUser);

    const secondAttempt = await duplicateAttemptState(secondUser, targetSlot);

    expect(secondAttempt.succeeded).toBeFalsy();
    expect(secondAttempt.hasError || secondAttempt.unavailable || !secondAttempt.couldConfirm).toBeTruthy();
  } finally {
    await sharedCtx.close();
  }
});

test('27b. [Future Date] second user receives "slot already booked" error when attempting concurrent booking.', async ({ browser }) => {
  test.setTimeout(getTestTimeout(110000, test.info().project.name));

  const targetSlot = availableSlots[1];
  const [bookingPatient, secondPatient] = randomUserOrder();
  const sharedCtx = await browser.newContext();

  try {
    const bookingUser = new MedSchedulePage(await sharedCtx.newPage());
    const secondUser = new MedSchedulePage(await sharedCtx.newPage());

    await Promise.all([
      preparePatientForNextAvailableDate(bookingUser, bookingPatient),
      preparePatientForNextAvailableDate(secondUser, secondPatient),
    ]);

    await chooseSlot(bookingUser, targetSlot);
    await confirmBooking(bookingUser);

    const secondAttempt = await duplicateAttemptState(secondUser, targetSlot);

    expect(secondAttempt.succeeded).toBeFalsy();
    expect(secondAttempt.hasError || secondAttempt.unavailable || !secondAttempt.couldConfirm).toBeTruthy();
  } finally {
    await sharedCtx.close();
  }
});
