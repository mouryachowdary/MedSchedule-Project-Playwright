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

test('11a. [Active Date] second user receives "slot already booked" error when attempting concurrent booking.', async ({ browser }) => {
  test.setTimeout(getTestTimeout(90000, test.info().project.name));

  const targetSlot = availableSlots[1];
  const [bookingPatient, secondPatient] = randomUserOrder();
  const sharedCtx = await browser.newContext();

  try {
    const bookingUser = new MedSchedulePage(await sharedCtx.newPage());
    const secondUser = new MedSchedulePage(await sharedCtx.newPage());

    await Promise.all([
      preparePatientForCurrentDate(bookingUser, bookingPatient),
      preparePatientForCurrentDate(secondUser, secondPatient),
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

test('11b. [Future Date] second user receives "slot already booked" error when attempting concurrent booking.', async ({ browser }) => {
  test.setTimeout(getTestTimeout(90000, test.info().project.name));

  const targetSlot = availableSlots[1];
  const [bookingPatient, secondPatient] = randomUserOrder();
  const sharedCtx = await browser.newContext();

  try {
    const bookingUser = new MedSchedulePage(await sharedCtx.newPage());
    const secondUser = new MedSchedulePage(await sharedCtx.newPage());

    await Promise.all([
      preparePatientForBooking(bookingUser, bookingPatient),
      preparePatientForBooking(secondUser, secondPatient),
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
