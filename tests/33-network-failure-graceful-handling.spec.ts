import { expect, test } from '@playwright/test';

import {
  MedSchedulePage,
  selectCurrentActiveDay,
  availableSlots,
  bookingSucceeded,
  getTestTimeout,
} from '../fixtures/shared-helpers';

test('33a. core app UI remains visible and stable after going offline post-load', async ({ page, context }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);

  // Load the page normally
  await medSchedulePage.goto();
  await expect(medSchedulePage.appHeading).toBeVisible();
  await expect(medSchedulePage.patientSelector).toBeVisible();
  await expect(medSchedulePage.selectDateHeading).toBeVisible();

  // Simulate going offline after the app has fully loaded
  await context.setOffline(true);
  await page.waitForTimeout(500);

  // All core UI elements should still render — the SPA is already in memory
  await expect(medSchedulePage.appHeading).toBeVisible();
  await expect(medSchedulePage.patientSelector).toBeVisible();
  await expect(medSchedulePage.selectDateHeading).toBeVisible();
  await expect(medSchedulePage.availableTimesHeading).toBeVisible();

  // Calendar navigation controls must still be present
  await expect(medSchedulePage.nextMonthButton).toBeVisible();
  await expect(medSchedulePage.previousMonthButton).toBeVisible();

  // Restore connectivity
  await context.setOffline(false);
});

test('33b. booking flow completes successfully when fetch/XHR API calls are interrupted', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);

  // Load the page and complete patient + date setup before adding route intercepts
  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  await selectCurrentActiveDay(medSchedulePage);
  await page.waitForTimeout(300);

  // Intercept any outbound API/data fetch requests and abort them to simulate backend failure
  // The app uses client-side localStorage for state, so booking should survive this
  await page.route('**/api/**', (route) => route.abort('failed'));
  await page.route('**/*.json', (route) => {
    // Only abort non-essential data fetches; allow page assets to pass through
    const url = route.request().url();
    if (url.includes('/data/') || url.includes('/appointments')) {
      route.abort('failed');
    } else {
      route.continue();
    }
  });

  // Select a slot and confirm the appointment
  await medSchedulePage.clickSlot(availableSlots[0]);
  await page.waitForTimeout(300);

  await expect(medSchedulePage.confirmAppointmentButton()).toBeVisible();
  await medSchedulePage.clickConfirmAppointmentButton();
  await page.waitForTimeout(1500);

  // Booking confirmation should appear — app relies on localStorage, not external API
  const succeeded = await bookingSucceeded(medSchedulePage);
  expect(succeeded).toBeTruthy();
});

test('33c. calendar navigation works correctly while in offline mode', async ({ page, context }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);
  const today = new Date();

  await medSchedulePage.goto();

  // Go offline before interacting with the calendar
  await context.setOffline(true);
  await page.waitForTimeout(300);

  // Calendar month navigation is client-side and must work without network
  await medSchedulePage.clickNextMonth();
  await page.waitForTimeout(300);

  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  await expect(medSchedulePage.calendarMonthLabel(nextMonth)).toBeVisible();

  await medSchedulePage.clickPreviousMonth();
  await page.waitForTimeout(300);

  await expect(medSchedulePage.calendarMonthLabel(today)).toBeVisible();

  // Restore connectivity
  await context.setOffline(false);
});
