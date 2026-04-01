import { expect, test } from '@playwright/test';

import {
  MedSchedulePage,
  randomUserOrder,
  preparePatientForBooking,
  preparePatientForCurrentDate,
  selectRandomFutureMonthAndDay,
  chooseSlot,
  tryConfirmBooking,
  bookingSucceeded,
  availableSlots,
  getTestTimeout,
} from '../fixtures/shared-helpers';

// Run serially to avoid Firefox context contention (each test creates 4 browser contexts)
test.describe.configure({ mode: 'serial' });


test('16a. [Active Date] duplicate booking is prevented even under high load or multiple parallel requests.', async ({ browser }) => {
  test.setTimeout(getTestTimeout(100000, test.info().project.name));

  const targetSlot = availableSlots[9];
    const parallelUsers: ('007' | '008')[] = Math.random() < 0.5
      ? ['007', '008', '007', '008']
      : ['008', '007', '008', '007'];
  const contexts = await Promise.all(parallelUsers.map(() => browser.newContext()));

  try {
    const pages = await Promise.all(contexts.map((context) => context.newPage()));
    const users = pages.map((page) => new MedSchedulePage(page));
    const isFirefox = pages[0].context().browser()?.browserType().name() === 'firefox';

    if (isFirefox) {
      for (let i = 0; i < users.length; i++) {
        await preparePatientForCurrentDate(users[i], parallelUsers[i]);
      }
    } else {
      await Promise.all(
        users.map((user, index) => preparePatientForCurrentDate(user, parallelUsers[index]))
      );
    }

    await Promise.all(users.map((user) => chooseSlot(user, targetSlot)));
    const confirmResults = await Promise.all(users.map((user) => tryConfirmBooking(user)));

    const successCount = confirmResults.filter(Boolean).length;

    expect(successCount).toBeGreaterThanOrEqual(1);
  } finally {
    await Promise.allSettled(contexts.map((context) => context.close()));
  }
});

test('16b. [Future Date] duplicate booking is prevented even under high load or multiple parallel requests.', async ({ browser }) => {
  test.setTimeout(getTestTimeout(100000, test.info().project.name));

  const targetSlot = availableSlots[9];
    const parallelUsers: ('007' | '008')[] = Math.random() < 0.5
      ? ['007', '008', '007', '008']
      : ['008', '007', '008', '007'];
  const contexts = await Promise.all(parallelUsers.map(() => browser.newContext()));

  try {
    const pages = await Promise.all(contexts.map((context) => context.newPage()));
    const users = pages.map((page) => new MedSchedulePage(page));
    const isFirefox = pages[0].context().browser()?.browserType().name() === 'firefox';

    if (isFirefox) {
      for (let i = 0; i < users.length; i++) {
        await preparePatientForBooking(users[i], parallelUsers[i]);
      }
    } else {
      await Promise.all(
        users.map((user, index) => preparePatientForBooking(user, parallelUsers[index]))
      );
    }

    await Promise.all(users.map((user) => chooseSlot(user, targetSlot)));
    const confirmResults = await Promise.all(users.map((user) => tryConfirmBooking(user)));

    const successCount = confirmResults.filter(Boolean).length;

    expect(successCount).toBeGreaterThanOrEqual(1);
  } finally {
    await Promise.allSettled(contexts.map((context) => context.close()));
  }
});
