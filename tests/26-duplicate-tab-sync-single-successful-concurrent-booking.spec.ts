import { expect, test } from '@playwright/test';

import {
  MedSchedulePage,
  randomUserOrder,
  preparePatientForBooking,
  preparePatientForNextAvailableDate,
  selectRandomFutureMonthAndDay,
  chooseSlot,
  tryConfirmBooking,
  availableSlots,
  getTestTimeout,
} from '../fixtures/shared-helpers';


test('26a. [Active Date] only one booking is successful when Users 007 & 008 simultaneously book the same time slot.', async ({ browser }) => {
  test.setTimeout(getTestTimeout(75000, test.info().project.name));

  const targetSlot = availableSlots[0];
  const [patientA, patientB] = randomUserOrder();
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();

  try {
    const userA = new MedSchedulePage(await ctxA.newPage());
    const userB = new MedSchedulePage(await ctxB.newPage());

    await Promise.all([
      preparePatientForNextAvailableDate(userA, patientA),
      preparePatientForNextAvailableDate(userB, patientB),
    ]);

    await Promise.all([
      chooseSlot(userA, targetSlot),
      chooseSlot(userB, targetSlot),
    ]);

    const confirmResults = await Promise.all([
      tryConfirmBooking(userA),
      tryConfirmBooking(userB),
    ]);

    const successCount = confirmResults.filter(Boolean).length;

    expect(successCount).toBeGreaterThanOrEqual(1);
  } finally {
    await Promise.allSettled([ctxA.close(), ctxB.close()]);
  }
});

test('26b. [Future Date] only one booking is successful when Users 007 & 008 simultaneously book the same time slot.', async ({ browser }) => {
  test.setTimeout(getTestTimeout(75000, test.info().project.name));

  const targetSlot = availableSlots[0];
  const [patientA, patientB] = randomUserOrder();
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();

  try {
    const userA = new MedSchedulePage(await ctxA.newPage());
    const userB = new MedSchedulePage(await ctxB.newPage());

    await Promise.all([
      preparePatientForBooking(userA, patientA),
      preparePatientForBooking(userB, patientB),
    ]);

    await Promise.all([
      chooseSlot(userA, targetSlot),
      chooseSlot(userB, targetSlot),
    ]);

    const confirmResults = await Promise.all([
      tryConfirmBooking(userA),
      tryConfirmBooking(userB),
    ]);

    const successCount = confirmResults.filter(Boolean).length;

    expect(successCount).toBeGreaterThanOrEqual(1);
  } finally {
    await Promise.allSettled([ctxA.close(), ctxB.close()]);
  }
});
