import { expect, test } from '@playwright/test';

import {
  MedSchedulePage,
  randomUserOrder,
  preparePatientForBooking,
  preparePatientForCurrentDate,
  preparePatientForNextAvailableDate,
  selectRandomFutureMonthAndDay,
  chooseSlot,
  confirmBooking,
  tryConfirmBooking,
  bookingSucceeded,
  slotUnavailable,
  duplicateAttemptState,
  availableSlots,
  getTestTimeout,
} from '../fixtures/shared-helpers';


test('15a. [Active Date] retry mechanism allows User 008 to successfully book a different available slot after failure.', async ({ browser }) => {
  test.setTimeout(getTestTimeout(100000, test.info().project.name));

  const conflictSlot = availableSlots[7];
  const retrySlot = availableSlots[8];
  const sharedCtx = await browser.newContext();

  try {
    const user007 = new MedSchedulePage(await sharedCtx.newPage());
    const user008 = new MedSchedulePage(await sharedCtx.newPage());

    // 007 books the conflict slot on the current active date
    await preparePatientForCurrentDate(user007, '007');
    await chooseSlot(user007, conflictSlot);
    await confirmBooking(user007);

    // 008 navigates to the same current active date
    await preparePatientForCurrentDate(user008, '008');

    // The conflict slot should now be disabled/unavailable for 008 since 007 already booked it
    const isConflictDisabled = await slotUnavailable(user008, conflictSlot);
    expect(isConflictDisabled).toBeTruthy();

    // 008 detects the slot is taken and books a different available slot instead
    await chooseSlot(user008, retrySlot);
    const retryConfirmed = await tryConfirmBooking(user008);

    expect(retryConfirmed).toBeTruthy();
  } finally {
    await sharedCtx.close();
  }
});

test('15b. [Future Date] retry mechanism allows User 008 to successfully book a different available slot after failure.', async ({ browser }) => {
  test.setTimeout(getTestTimeout(100000, test.info().project.name));

  const conflictSlot = availableSlots[7];
  const retrySlot = availableSlots[8];
  const sharedCtx = await browser.newContext();

  try {
    const user007 = new MedSchedulePage(await sharedCtx.newPage());
    const user008 = new MedSchedulePage(await sharedCtx.newPage());

    await preparePatientForNextAvailableDate(user007, '007');
    await chooseSlot(user007, conflictSlot);
    await confirmBooking(user007);

    await preparePatientForNextAvailableDate(user008, '008');

    // The conflict slot should now be unavailable for user008 (slot label shows BOOKED)
    const isConflictUnavailable = await slotUnavailable(user008, conflictSlot);
    expect(isConflictUnavailable).toBeTruthy();

    await preparePatientForNextAvailableDate(user008, '008');
    await chooseSlot(user008, retrySlot);
    const retryConfirmed = await tryConfirmBooking(user008);

    expect(retryConfirmed).toBeTruthy();
  } finally {
    await sharedCtx.close();
  }
});
