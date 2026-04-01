import { expect, test } from '@playwright/test';

import {
  MedSchedulePage,
  selectCurrentActiveDay,
  availableSlots,
  patients,
  doctorProfile,
  getTestTimeout,
} from '../fixtures/shared-helpers';

test('37a. booking success confirmation references the doctor name', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  await selectCurrentActiveDay(medSchedulePage);
  await page.waitForTimeout(300);

  await medSchedulePage.clickSlot(availableSlots[0]); // 9:00 AM
  await page.waitForTimeout(300);

  await medSchedulePage.clickConfirmAppointmentButton();
  await page.waitForTimeout(1500);

  // Success message must be present
  await expect(medSchedulePage.bookingSuccessMessage()).toBeVisible();

  // The confirmation view must reference the doctor who owns the schedule
  await expect(page.getByText(doctorProfile.name).first()).toBeVisible();
});

test('37b. booking success confirmation references the selected time slot', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);
  const targetSlot = availableSlots[6]; // 1:00 PM

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  await selectCurrentActiveDay(medSchedulePage);
  await page.waitForTimeout(300);

  await medSchedulePage.clickSlot(targetSlot);
  await page.waitForTimeout(300);

  await medSchedulePage.clickConfirmAppointmentButton();
  await page.waitForTimeout(1500);

  await expect(medSchedulePage.bookingSuccessMessage()).toBeVisible();

  // The confirmation must display the booked slot time so the user can verify their appointment
  await expect(page.getByText(targetSlot).first()).toBeVisible();
});

test('37c. booking success confirmation references the patient name or ID', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  await selectCurrentActiveDay(medSchedulePage);
  await page.waitForTimeout(300);

  await medSchedulePage.clickSlot(availableSlots[4]); // 11:00 AM
  await page.waitForTimeout(300);

  await medSchedulePage.clickConfirmAppointmentButton();
  await page.waitForTimeout(1500);

  await expect(medSchedulePage.bookingSuccessMessage()).toBeVisible();

  // The confirmation must identify the patient — either by name or ID
  const patientNameVisible = await page.getByText(patients['007'].name).first().isVisible().catch(() => false);
  const patientIdVisible = await page.getByText(patients['007'].idText).first().isVisible().catch(() => false);
  const patientLabelVisible = await page.getByText(patients['007'].selectedLabel).first().isVisible().catch(() => false);

  expect(patientNameVisible || patientIdVisible || patientLabelVisible).toBeTruthy();
});

test('37d. booking success confirmation for patient 008 references their name or ID', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);
  const targetSlot = availableSlots[8]; // 2:00 PM

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('008');
  await medSchedulePage.selectPatientById('008');
  await page.waitForTimeout(300);

  await selectCurrentActiveDay(medSchedulePage);
  await page.waitForTimeout(300);

  await medSchedulePage.clickSlot(targetSlot);
  await page.waitForTimeout(300);

  await medSchedulePage.clickConfirmAppointmentButton();
  await page.waitForTimeout(1500);

  await expect(medSchedulePage.bookingSuccessMessage()).toBeVisible();

  // Confirmation must reference this patient somehow
  const patientNameVisible = await page.getByText(patients['008'].name).first().isVisible().catch(() => false);
  const patientIdVisible = await page.getByText(patients['008'].idText).first().isVisible().catch(() => false);
  const patientLabelVisible = await page.getByText(patients['008'].selectedLabel).first().isVisible().catch(() => false);

  expect(patientNameVisible || patientIdVisible || patientLabelVisible).toBeTruthy();
});

test('37e. booking success message contains a confirmation keyword', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);
  const targetSlot = availableSlots[10]; // 3:00 PM

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');
  await page.waitForTimeout(300);

  await selectCurrentActiveDay(medSchedulePage);
  await page.waitForTimeout(300);

  await medSchedulePage.clickSlot(targetSlot);
  await page.waitForTimeout(300);

  await medSchedulePage.clickConfirmAppointmentButton();
  await page.waitForTimeout(1500);

  // The success message must contain a recognisable confirmation keyword
  await expect(page.getByText(/Booking Confirmed|Appointment Confirmed|Successfully Booked/i).first()).toBeVisible();
});
