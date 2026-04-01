import { expect, test } from '@playwright/test';

import {
  MedSchedulePage,
  randomUserOrder,
  preparePatientForBooking,
  preparePatientForCurrentDate,
  preparePatientForNextAvailableDate,
  chooseSlot,
  confirmBooking,
  tryConfirmBooking,
  slotUnavailable,
  availableSlots,
  getTestTimeout,
} from '../fixtures/shared-helpers';


const availabilityChecks = [
  { bookingUser: '007' as const, checkingUser: '008' as const, slot: availableSlots[4] },
  { bookingUser: '008' as const, checkingUser: '007' as const, slot: availableSlots[5] },
];

test('13a. [Active Date] slot becomes unavailable immediately after successful booking by User 007/008', async ({ browser }) => {
  test.setTimeout(getTestTimeout(120000, test.info().project.name));

  for (const availabilityCheck of availabilityChecks) {
    const sharedContext = await browser.newContext();

    try {
      const bookingUser = new MedSchedulePage(await sharedContext.newPage());
      const checkingUser = new MedSchedulePage(await sharedContext.newPage());

      await preparePatientForCurrentDate(bookingUser, availabilityCheck.bookingUser);
      await chooseSlot(bookingUser, availabilityCheck.slot);
      await confirmBooking(bookingUser);

      await preparePatientForCurrentDate(checkingUser, availabilityCheck.checkingUser);

      expect(await slotUnavailable(checkingUser, availabilityCheck.slot)).toBeTruthy();
    } finally {
      await sharedContext.close();
    }
  }
});

test('13b. [Future Date] slot becomes unavailable immediately after successful booking by User 007/008', async ({ browser }) => {
  test.setTimeout(getTestTimeout(120000, test.info().project.name));

  for (const availabilityCheck of availabilityChecks) {
    const sharedContext = await browser.newContext();

    try {
      const bookingUser = new MedSchedulePage(await sharedContext.newPage());
      const checkingUser = new MedSchedulePage(await sharedContext.newPage());

      await preparePatientForNextAvailableDate(bookingUser, availabilityCheck.bookingUser);
      await chooseSlot(bookingUser, availabilityCheck.slot);
      await confirmBooking(bookingUser);

      await preparePatientForNextAvailableDate(checkingUser, availabilityCheck.checkingUser);

      expect(await slotUnavailable(checkingUser, availabilityCheck.slot)).toBeTruthy();
    } finally {
      await sharedContext.close();
    }
  }
});
