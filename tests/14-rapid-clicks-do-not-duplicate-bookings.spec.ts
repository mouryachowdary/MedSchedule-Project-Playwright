import { expect, test } from '@playwright/test';

import {
  MedSchedulePage,
  randomUserOrder,
  preparePatientForBooking,
  preparePatientForCurrentDate,
  selectRandomFutureMonthAndDay,
  chooseSlot,
  bookingSucceeded,
  availableSlots,
  getTestTimeout,
} from '../fixtures/shared-helpers';


test('14a. [Active Date] multiple rapid clicks on "Book Appointment" by same user (007) do not create duplicate bookings.', async ({ page }) => {
  test.setTimeout(getTestTimeout(90000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);
  const targetSlot = availableSlots[6];

  await preparePatientForCurrentDate(medSchedulePage, '007');
  await chooseSlot(medSchedulePage, targetSlot);

  const confirmButton = medSchedulePage.confirmAppointmentButton();
  await expect(confirmButton).toBeVisible();

  // Fire multiple rapid clicks concurrently — only the first should register.
  // The first click uses a browser-adjusted timeout to guarantee at least one
  // landing click on slower engines (Firefox/WebKit); the rest stay short.
  const firstClickTimeout = medSchedulePage.timeout(10000);
  await Promise.allSettled([
    confirmButton.click({ timeout: firstClickTimeout }).catch(() => {}),
    confirmButton.click({ timeout: 3000 }).catch(() => {}),
    confirmButton.click({ timeout: 3000 }).catch(() => {}),
    confirmButton.click({ timeout: 3000 }).catch(() => {}),
    confirmButton.click({ timeout: 3000 }).catch(() => {}),
  ]);

  // Brief wait for booking response to render
  await medSchedulePage.page.waitForTimeout(300).catch(() => {});

  await expect.poll(() => bookingSucceeded(medSchedulePage), { timeout: 15000 }).toBeTruthy();
  expect(await medSchedulePage.bookingSuccessMessage().count()).toBe(1);
});

test('14b. [Future Date] multiple rapid clicks on "Book Appointment" by same user (007) do not create duplicate bookings.', async ({ page }) => {
  test.setTimeout(getTestTimeout(90000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);
  const targetSlot = availableSlots[6];

  await preparePatientForBooking(medSchedulePage, '007');
  await chooseSlot(medSchedulePage, targetSlot);

  const confirmButton = medSchedulePage.confirmAppointmentButton();
  await expect(confirmButton).toBeVisible();

  // Fire multiple rapid clicks concurrently — only the first should register.
  // The first click uses a browser-adjusted timeout to guarantee at least one
  // landing click on slower engines (Firefox/WebKit); the rest stay short.
  const firstClickTimeout = medSchedulePage.timeout(10000);
  await Promise.allSettled([
    confirmButton.click({ timeout: firstClickTimeout }).catch(() => {}),
    confirmButton.click({ timeout: 3000 }).catch(() => {}),
    confirmButton.click({ timeout: 3000 }).catch(() => {}),
    confirmButton.click({ timeout: 3000 }).catch(() => {}),
    confirmButton.click({ timeout: 3000 }).catch(() => {}),
  ]);

  // Brief wait for booking response to render
  await medSchedulePage.page.waitForTimeout(300).catch(() => {});

  await expect.poll(() => bookingSucceeded(medSchedulePage), { timeout: 15000 }).toBeTruthy();
  expect(await medSchedulePage.bookingSuccessMessage().count()).toBe(1);
});