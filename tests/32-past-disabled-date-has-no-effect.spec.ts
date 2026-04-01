import { expect, test } from '@playwright/test';

import { MedSchedulePage, selectCurrentActiveDay, availableSlots, getTestTimeout } from '../fixtures/shared-helpers';

async function isDisabledDay(cell: ReturnType<MedSchedulePage['page']['locator']>): Promise<boolean> {
  return cell
    .evaluate((el) => {
      const button = el as HTMLButtonElement;
      return button.disabled || el.getAttribute('disabled') !== null || el.getAttribute('aria-disabled') === 'true';
    })
    .catch(() => false);
}

async function tryClickDisabledDay(cell: ReturnType<MedSchedulePage['page']['locator']>): Promise<void> {
  await cell
    .evaluate((el) => {
      (el as HTMLElement).click();
    })
    .catch(() => {});
}

test('32a. clicking a past/disabled calendar date does not reveal the confirm appointment button', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');

  // Establish baseline: select today so slots are visible.
  await selectCurrentActiveDay(medSchedulePage);
  await expect(medSchedulePage.availableTimesHeading).toBeVisible();

  // Previous month contains only past days, which should be disabled.
  await medSchedulePage.clickPreviousMonth();

  const calendarDays = page.locator('[role="gridcell"]');
  const dayCount = await calendarDays.count();

  let disabledIndex = -1;
  for (let i = 0; i < dayCount; i++) {
    if (await isDisabledDay(calendarDays.nth(i))) {
      disabledIndex = i;
      break;
    }
  }

  expect(disabledIndex).toBeGreaterThanOrEqual(0);

  // Clicking a disabled day must not create a confirmable appointment state.
  await tryClickDisabledDay(calendarDays.nth(disabledIndex));
  await expect(medSchedulePage.confirmAppointmentButton()).not.toBeVisible();
});

test('32b. past/disabled calendar date cells expose correct ARIA disabled attributes', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();

  // Navigate to the previous month — all days should be in the past.
  await medSchedulePage.clickPreviousMonth();

  const calendarDays = page.locator('[role="gridcell"]');
  const dayCount = await calendarDays.count();

  let disabledCount = 0;
  for (let i = 0; i < dayCount; i++) {
    if (await isDisabledDay(calendarDays.nth(i))) {
      disabledCount++;
    }
  }

  // Calendar grids often include adjacent-month overflow cells.
  // In previous-month view, the current month's spillover dates can remain enabled.
  expect(disabledCount).toBeGreaterThan(0);
  expect(disabledCount).toBeGreaterThanOrEqual(dayCount - 7);
});

test('32c. clicking a disabled date in the current month does not change the selected slot panel', async ({ page }) => {
  test.setTimeout(getTestTimeout(60000, test.info().project.name));

  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();
  await medSchedulePage.searchPatient('007');
  await medSchedulePage.selectPatientById('007');

  // Select today to load slots, then select one slot to reveal confirm action.
  await selectCurrentActiveDay(medSchedulePage);
  await medSchedulePage.clickSlot(availableSlots[0]);
  await expect(medSchedulePage.confirmAppointmentButton()).toBeVisible();

  const today = new Date();
  if (today.getDate() > 1) {
    const pastDay = today.getDate() - 1;
    const pastDayCell = page
      .locator('[role="gridcell"]')
      .filter({ hasText: new RegExp(`^${pastDay}$`) })
      .first();

    const isPastDayDisabled = await isDisabledDay(pastDayCell);
    expect(isPastDayDisabled).toBeTruthy();

    await tryClickDisabledDay(pastDayCell);
    await expect(medSchedulePage.confirmAppointmentButton()).toBeVisible();
  } else {
    await medSchedulePage.clickPreviousMonth();

    const anyPastDay = page.locator('[role="gridcell"]').first();
    await tryClickDisabledDay(anyPastDay);

    await expect(medSchedulePage.confirmAppointmentButton()).toBeVisible();
  }
});
