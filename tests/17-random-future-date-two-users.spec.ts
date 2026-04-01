import { expect, test } from '@playwright/test';

import {
  MedSchedulePage,
  type BookingPatientId,
  randomUserOrder,
  preparePatientForBooking,
  selectRandomFutureMonthAndDay,
  chooseSlot,
  confirmBooking,
  tryConfirmBooking,
  bookingSucceeded,
  availableSlots,
  getTestTimeout,
} from '../fixtures/shared-helpers';


function randomSlot(): string {
  return availableSlots[Math.floor(Math.random() * availableSlots.length)];
}

async function preparePatientForRandomFutureDate(user: MedSchedulePage, patientId: BookingPatientId) {
  await user.goto();
  await user.searchPatient(patientId);
  await user.selectPatientById(patientId);
  await user.page.waitForTimeout(300);
  await selectRandomFutureMonthAndDay(user);
  await user.page.waitForTimeout(300);
}

test('17. two random users can proceed with booking flow on random future months and dates without affecting active-date validations', async ({ browser }) => {
  test.setTimeout(getTestTimeout(100000, test.info().project.name));

  const [patientA, patientB] = randomUserOrder();
  const slotA = randomSlot();
  const slotB = randomSlot();

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  try {
    const userA = new MedSchedulePage(await contextA.newPage());
    const userB = new MedSchedulePage(await contextB.newPage());

    await Promise.all([
      preparePatientForRandomFutureDate(userA, patientA),
      preparePatientForRandomFutureDate(userB, patientB),
    ]);

    await Promise.all([
      userA.clickSlot(slotA),
      userB.clickSlot(slotB),
    ]);

    await expect(userA.confirmAppointmentButton()).toBeVisible();
    await expect(userB.confirmAppointmentButton()).toBeVisible();
  } finally {
    await Promise.allSettled([contextA.close(), contextB.close()]);
  }
});
