import { Browser, expect, test } from '@playwright/test';

import {
  MedSchedulePage,
  randomUserOrder,
  preparePatientForBooking,
  selectCurrentActiveDay,
  selectRandomFutureMonthAndDay,
  chooseSlot,
  confirmBooking,
  tryConfirmBooking,
  bookingSucceeded,
  availableSlots,
  getTestTimeout,
} from '../fixtures/shared-helpers';


async function prepareAndBook(
  browser: Browser,
  patientId: '007' | '008',
  slot: string,
  dateType: 'current' | 'future',
) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const user = new MedSchedulePage(page);

  await user.goto();
  await user.searchPatient(patientId);
  await user.selectPatientById(patientId);
  await page.waitForTimeout(300);

  if (dateType === 'future') {
    await selectRandomFutureMonthAndDay(user);
  } else {
    await selectCurrentActiveDay(user);
  }

  await page.waitForTimeout(300);
  await user.clickSlot(slot);
  await page.waitForTimeout(300);

  await user.confirmAppointmentButton().waitFor({ state: 'visible', timeout: 12000 });
  await user.clickConfirmAppointmentButton();
  await page.waitForTimeout(1000);

  const succeeded = await user.bookingSuccessMessage().isVisible().catch(() => false);
  await context.close();
  return succeeded;
}

test('21a. [Active Date] patient 007 and patient 008 both succeed when booking completely different time slots', async ({ browser }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  // Use slots far apart to remove any chance of ambiguity
  const slot007 = availableSlots[10]; // 3:00 PM
  const slot008 = availableSlots[11]; // 3:30 PM

  const [result007, result008] = await Promise.all([
    prepareAndBook(browser, '007', slot007, 'current'),
    prepareAndBook(browser, '008', slot008, 'current'),
  ]);

  expect(result007).toBeTruthy();
  expect(result008).toBeTruthy();
});

test('21b. [Future Date] patient 007 and patient 008 both succeed when booking completely different time slots', async ({ browser }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const slot007 = availableSlots[12]; // 4:00 PM
  const slot008 = availableSlots[13]; // 4:30 PM

  const [result007, result008] = await Promise.all([
    prepareAndBook(browser, '007', slot007, 'future'),
    prepareAndBook(browser, '008', slot008, 'future'),
  ]);

  expect(result007).toBeTruthy();
  expect(result008).toBeTruthy();
});
