/**
 * Comprehensive shared helpers: inlines page object, test data, and test utilities.
 * No external dependencies on pages/, test-data/, or fixtures/ directories.
 * Optimized for cross-browser compatibility (chromium, firefox, webkit).
 */

import { Locator, Page } from '@playwright/test';

// ============================================================================
// TEST DATA (from medScheduleData.ts)
// ============================================================================

export const pageTitle = 'Medicare Assignment';

export const doctorProfile = {
  avatarInitials: 'DS',
  name: 'Dr. Sarah Mitchell',
  designation: 'Cardiologist',
  qualification: 'MD, FACC — Board Certified',
  ratingText: /4\.9\s*\(237 reviews\)/,
};

export const patients = {
  '007': {
    name: 'James Bond',
    idText: '007',
    selectedLabel: 'James Bond (007)',
  },
  '008': {
    name: 'Jane Smith',
    idText: '008',
    selectedLabel: 'Jane Smith (008)',
  },
} as const;

export const availableSlots = [
  '9:00 AM',
  '9:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
  '2:30 PM',
  '3:00 PM',
  '3:30 PM',
  '4:00 PM',
  '4:30 PM',
];

// ============================================================================
// PAGE OBJECT (inlined from pages/medSchedulePage.ts with fixes)
// ============================================================================

export class MedSchedulePage {
  readonly page: Page;
  readonly appHeading: Locator;
  readonly patientSelector: Locator;
  readonly patientSearch: Locator;
  readonly doctorAvatar: Locator;
  readonly doctorName: Locator;
  readonly doctorDesignation: Locator;
  readonly doctorQualification: Locator;
  readonly doctorRatingAndReviews: Locator;
  readonly selectDateHeading: Locator;
  readonly previousMonthButton: Locator;
  readonly nextMonthButton: Locator;
  readonly availableTimesHeading: Locator;
  private isFirefox: boolean;
  private isWebKit: boolean;

  constructor(page: Page) {
    this.page = page;
    const browserName = page.context().browser()?.browserType().name();
    this.isFirefox = browserName === 'firefox';
    this.isWebKit = browserName === 'webkit';
    this.appHeading = page.getByRole('heading', { name: 'MedSchedule' });
    this.patientSelector = page.getByTestId('patient-selector');
    this.patientSearch = page.getByTestId('patient-search');
    this.doctorAvatar = page.getByText(/^DS$/, { exact: true });
    this.doctorName = page.getByRole('heading', { name: 'Dr. Sarah Mitchell' });
    this.doctorDesignation = page.getByText('Cardiologist', { exact: true });
    this.doctorQualification = page.getByText('MD, FACC — Board Certified', { exact: true });
    this.doctorRatingAndReviews = page.getByText(/4\.9\s*\(237 reviews\)/);
    this.selectDateHeading = page.getByRole('heading', { name: 'Select Date' });
    this.previousMonthButton = page.getByRole('button', { name: 'Go to previous month' });
    this.nextMonthButton = page.getByRole('button', { name: 'Go to next month' });
    this.availableTimesHeading = page.getByRole('heading', { name: 'Available Times' });
  }

  /**
   * Get browser-adjusted timeout (2x for Firefox, 3x for WebKit).
   * Public so standalone helper functions can use it via `user.timeout(base)`.
   */
  timeout(baseTimeoutMs: number): number {
    if (this.isFirefox) return Math.ceil(baseTimeoutMs * 2);
    if (this.isWebKit) return Math.ceil(baseTimeoutMs * 3);
    return baseTimeoutMs;
  }

  /** @deprecated Use timeout() instead */
  private getTimeout(baseTimeoutMs: number): number {
    return this.timeout(baseTimeoutMs);
  }

  /**
   * Enhanced robust click with Firefox-specific handling and multiple fallbacks.
   * Critical for concurrent cross-browser stability.
   */
  async robustClick(locator: Locator, baseTimeoutMs: number = 10000) {
    const timeout = this.getTimeout(baseTimeoutMs);
    const actionTimeout = Math.min(timeout, this.getTimeout(12000));

    if (this.page.isClosed()) {
      throw new Error('Cannot click locator because page is already closed');
    }

    // Ensure element is visible first — fail fast (no catch) to avoid cascading timeouts
    await locator.waitFor({ state: 'visible', timeout });

    // Firefox/WebKit pre-click stabilization
    if ((this.isFirefox || this.isWebKit) && !this.page.isClosed()) {
      await this.page.waitForTimeout(200).catch(() => {});
    }

    // Scroll element into view
    if (this.isFirefox || this.isWebKit) {
      await locator
        .evaluate((element) => {
          element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
        })
        .catch(() => {});
    } else {
      await locator
        .scrollIntoViewIfNeeded()
        .catch(() => {});
    }

    // Attempt 1: Standard click (preferred across browsers)
    try {
      await locator.click({ timeout: actionTimeout, delay: (this.isFirefox || this.isWebKit) ? 100 : 0 });
      return;
    } catch {
      // Continue to fallbacks
    }

    if (this.page.isClosed()) {
      throw new Error('Page closed while clicking locator');
    }

    // Firefox/WebKit post-failure wait
    if ((this.isFirefox || this.isWebKit) && !this.page.isClosed()) {
      await this.page.waitForTimeout(300).catch(() => {});
    }

    // Attempt 2: Forced click
    try {
      await locator.click({ timeout: actionTimeout, force: true, delay: (this.isFirefox || this.isWebKit) ? 100 : 0 });
      return;
    } catch {
      // Continue to fallbacks
    }

    if (this.page.isClosed()) {
      throw new Error('Page closed while retrying click');
    }

    // Attempt 3: Direct JavaScript click
    try {
      await locator.evaluate((element) => {
        (element as HTMLElement).click();
      });
      return;
    } catch {
      // Continue to fallbacks
    }

    // Attempt 4: Event-based click
    try {
      await locator.dispatchEvent('click');
      return;
    } catch {
      // Continue to fallbacks
    }

    // Attempt 4b: keyboard activation fallback for button-like controls
    try {
      await locator.focus({ timeout: actionTimeout });
      await locator.press('Enter', { timeout: actionTimeout });
      return;
    } catch {
      // Continue to final fallback
    }

    // Attempt 5: Final force click with extended timeout
    if (!this.page.isClosed()) {
      await this.page.waitForTimeout(400).catch(() => {});
    }

    try {
      await locator.click({ timeout: Math.ceil(actionTimeout * 1.5), force: true });
      return;
    } catch {
      throw new Error(
        `Failed to click locator "${locator}" after 5 retry attempts (timeout: ${timeout}ms, Firefox: ${this.isFirefox}, WebKit: ${this.isWebKit})`
      );
    }
  }

  async goto() {
    const timeout = this.getTimeout(20000);
    try {
      await this.page.goto('/', { waitUntil: 'domcontentloaded', timeout });
    } catch {
      if (this.page.isClosed()) {
        throw new Error('Page closed during navigation');
      }

      await this.page.waitForTimeout(500).catch(() => {});
      await this.page.goto('/', { waitUntil: 'domcontentloaded', timeout });
    }

    await this.appHeading.waitFor({ state: 'visible', timeout: this.getTimeout(15000) });
    await this.patientSelector.waitFor({ state: 'visible', timeout: this.getTimeout(20000) });
  }

  async openPatientSelector() {
    if (await this.patientSearch.isVisible().catch(() => false)) {
      return;
    }

    await this.patientSelector.waitFor({ state: 'visible', timeout: this.getTimeout(12000) });

    for (let attempt = 1; attempt <= 8; attempt++) {
      await this.robustClick(this.patientSelector, 12000).catch(() => {});

      const searchVisible = await this.patientSearch
        .waitFor({ state: 'visible', timeout: this.getTimeout(2500) })
        .then(() => true)
        .catch(() => false);

      if (searchVisible) {
        return;
      }

      // Fallback attempts
      await this.patientSelector.press('Enter').catch(() => {});
      await this.patientSelector.dispatchEvent('click').catch(() => {});
      await this.page
        .evaluate(() => {
          const selector = document.querySelector('[data-testid="patient-selector"]') as HTMLElement | null;
          selector?.click();
        })
        .catch(() => {});

      const fallbackVisible = await this.patientSearch
        .waitFor({ state: 'visible', timeout: this.getTimeout(2500) })
        .then(() => true)
        .catch(() => false);

      if (fallbackVisible) {
        return;
      }

      if (!this.page.isClosed()) {
        await this.page.waitForTimeout(150 * attempt).catch(() => {});
      }
    }

    throw new Error('Failed to open patient selector after 8 attempts');
  }

  async searchPatient(term: string) {
    await this.openPatientSelector();
    await this.patientSearch.waitFor({ state: 'visible', timeout: this.getTimeout(10000) });
    await this.patientSearch.fill(term, { timeout: this.getTimeout(10000) });
  }

  patientSearchHint() {
    return this.page.getByText('Type a name or ID to search', { exact: true });
  }

  noPatientsFoundMessage() {
    return this.page.getByText('No patients found', { exact: true });
  }

  patientSearchResultById(id: string) {
    return this.page.getByRole('button', { name: new RegExp(`ID:\\s*${id}`) });
  }

  async selectPatientById(id: string) {
    const locator = this.patientSearchResultById(id);

    const selectedViaDom = await this.page
      .evaluate((patientId) => {
        const element = document.querySelector(`[data-testid="patient-${patientId}"]`) as HTMLElement | null;
        if (!element) {
          return false;
        }
        element.click();
        return true;
      }, id)
      .catch(() => false);

    if (selectedViaDom) {
      const selectorHasId = await this.patientSelector
        .textContent()
        .then((value) => (value ?? '').includes(id))
        .catch(() => false);

      if (selectorHasId) {
        return;
      }
    }

    for (let attempt = 1; attempt <= 6; attempt++) {
      if (!(await locator.isVisible().catch(() => false))) {
        await this.searchPatient(id);
      }

      await this.robustClick(locator, 20000).catch(() => {});

      const pickerClosed = await this.patientSearch
        .waitFor({ state: 'hidden', timeout: this.getTimeout(4000) })
        .then(() => true)
        .catch(() => false);

      const selectedPatientVisible = await this.patientSelector
        .textContent()
        .then((value) => (value ?? '').includes(id))
        .catch(() => false);

      if (pickerClosed || selectedPatientVisible) {
        return;
      }

      await locator
        .evaluate((element) => {
          (element as HTMLElement).click();
        })
        .catch(() => {});

      const searchHidden = !(await this.patientSearch.isVisible().catch(() => true));
      const selectedAfterFallback = await this.patientSelector
        .textContent()
        .then((value) => (value ?? '').includes(id))
        .catch(() => false);

      if (searchHidden || selectedAfterFallback) {
        return;
      }

      if (!this.page.isClosed()) {
        await this.page.waitForTimeout(150 * attempt);
      }
    }

    throw new Error(`Failed to select patient ${id}`);
  }

  selectedPatient(patientLabel: string) {
    return this.page.getByRole('button', { name: patientLabel, exact: true });
  }

  calendarMonthLabel(date: Date) {
    const monthYear = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(date);

    return this.page.getByText(monthYear, { exact: true });
  }

  calendarDay(day: number) {
    return this.page.locator('[role="gridcell"]').filter({ hasText: new RegExp(`^${day}$`) }).first();
  }

  async clickCalendarDay(day: number) {
    const locator = this.calendarDay(day);
    await this.robustClick(locator, 15000);
  }

  async clickNextMonth() {
    await this.robustClick(this.nextMonthButton, 8000);
  }

  async clickPreviousMonth() {
    await this.robustClick(this.previousMonthButton, 8000);
  }

  async clickSlot(slot: string) {
    const locator = this.slotButton(slot);
    await this.robustClick(locator, 15000);
  }

  selectedDateLabel(date: Date) {
    const fullDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);

    return this.page.getByText(fullDate, { exact: true });
  }

  availableSlotsCountLabel(count: number) {
    return this.page.getByText(`${count} available`, { exact: true });
  }

  slotButton(time: string) {
    return this.page.getByRole('button', { name: time, exact: true });
  }

  noPatientSelectedTitle() {
    return this.page.getByText('No Patient Selected', { exact: true }).first();
  }

  noPatientSelectedDescription() {
    return this.page.getByText('Please search and select a patient first.', { exact: true }).first();
  }

  confirmAppointmentButton() {
    return this.page.getByRole('button', { name: 'Confirm Appointment', exact: true });
  }

  async clickConfirmAppointmentButton() {
    await this.robustClick(this.confirmAppointmentButton(), 20000);
  }

  appointmentDetails(patientName?: string, doctorName?: string, slotTime?: string) {
    if (patientName && doctorName && slotTime) {
      return this.page.getByText(new RegExp(`${doctorName}.*${slotTime}`, 'i'));
    }
    return this.page.getByText(/Dr\.|Appointment|Available|confirm/i).first();
  }

  slotAlreadyBookedError() {
    return this.page.getByText(/slot.*already.*booked|already.*booked|not.*available/i);
  }

  bookingSuccessMessage() {
    return this.page.getByText(/Booking Confirmed|Appointment Confirmed!/i).first();
  }

  slotUnavailableForConcurrency(time: string) {
    const slot = this.slotButton(time);
    return slot.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.opacity === '0.5' || el.getAttribute('disabled') !== null || el.classList.contains('disabled');
    });
  }
}

// ============================================================================
// TEST HELPER FUNCTIONS (from fixtures/test-helpers.ts with enhancements)
// ============================================================================

export type BookingPatientId = '007' | '008';

export function randomUserOrder(): [BookingPatientId, BookingPatientId] {
  return Math.random() < 0.5 ? ['007', '008'] : ['008', '007'];
}

/**
 * Select a random future month (1-3 months ahead) and a random available day.
 * WORKER-SAFE: Increased timeouts and uses robustClick for calendar interactions.
 */
export async function selectRandomFutureMonthAndDay(user: MedSchedulePage): Promise<void> {
  const monthAdvance = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < monthAdvance; i++) {
    await user.robustClick(user.nextMonthButton, 20000);
    // Brief wait for React calendar re-render (app is localStorage-only, no network)
    await user.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  }

  const calendarDays = user.page.locator('[role="gridcell"]');
  const dayCount = await calendarDays.count();
  const enabledDayIndexes: number[] = [];

  for (let i = 0; i < dayCount; i++) {
    const day = calendarDays.nth(i);
    const isDisabled = await day
      .evaluate((element) => {
        const button = element as HTMLButtonElement;
        return button.disabled || element.getAttribute('disabled') !== null || element.getAttribute('aria-disabled') === 'true';
      })
      .catch(() => true);

    const isVisible = await day.isVisible().catch(() => false);
    if (!isDisabled && isVisible) {
      enabledDayIndexes.push(i);
    }
  }

  if (enabledDayIndexes.length === 0) {
    throw new Error('No enabled calendar day found');
  }

  const randomIndex = enabledDayIndexes[Math.floor(Math.random() * enabledDayIndexes.length)];
  await user.robustClick(calendarDays.nth(randomIndex), 15000);
}

/**
 * Select current active day (today) from the calendar.
 * WORKER-SAFE: Uses robustClick and event-based waits.
 */
export async function selectCurrentActiveDay(user: MedSchedulePage): Promise<void> {
  // Prefer the explicit "today" cell when available to reduce calendar flakiness.
  const todayCell = user.page.locator('[role="gridcell"][aria-current="date"]').first();
  const todayVisible = await todayCell.isVisible().catch(() => false);
  if (todayVisible) {
    const todayDisabled = await todayCell
      .evaluate((element) => {
        const button = element as HTMLButtonElement;
        return button.disabled || element.getAttribute('disabled') !== null || element.getAttribute('aria-disabled') === 'true';
      })
      .catch(() => true);

    if (!todayDisabled) {
      await user.robustClick(todayCell, 18000);
      return;
    }
  }

  const calendarDays = user.page.locator('[role="gridcell"]');
  const dayCount = await calendarDays.count();
  const enabledDayIndexes: number[] = [];

  for (let i = 0; i < dayCount; i++) {
    const day = calendarDays.nth(i);
    const isDisabled = await day
      .evaluate((element) => {
        const button = element as HTMLButtonElement;
        return button.disabled || element.getAttribute('disabled') !== null || element.getAttribute('aria-disabled') === 'true';
      })
      .catch(() => true);

    const isVisible = await day.isVisible().catch(() => false);
    if (!isDisabled && isVisible) {
      enabledDayIndexes.push(i);
    }
  }

  if (enabledDayIndexes.length === 0) {
    throw new Error('No enabled calendar day found');
  }

  // Get the first enabled day (current/active date)
  const firstEnabledIndex = enabledDayIndexes[0];
  await user.robustClick(calendarDays.nth(firstEnabledIndex), 18000);
}

/**
 * Select the second available enabled day from the calendar (tomorrow or the next available day).
 * Used by duplicate-tab-sync tests to avoid slot conflicts with today-based tests.
 */
export async function selectNextAvailableDay(user: MedSchedulePage): Promise<void> {
  const calendarDays = user.page.locator('[role="gridcell"]');
  const dayCount = await calendarDays.count();
  const enabledDayIndexes: number[] = [];

  for (let i = 0; i < dayCount; i++) {
    const day = calendarDays.nth(i);
    const isDisabled = await day
      .evaluate((element) => {
        const button = element as HTMLButtonElement;
        return button.disabled || element.getAttribute('disabled') !== null || element.getAttribute('aria-disabled') === 'true';
      })
      .catch(() => true);

    const isVisible = await day.isVisible().catch(() => false);
    if (!isDisabled && isVisible) {
      enabledDayIndexes.push(i);
    }
  }

  if (enabledDayIndexes.length < 2) {
    // Fallback: navigate to next month and pick first enabled day
    await user.robustClick(user.nextMonthButton, 20000);
    await user.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    const nextMonthDays = user.page.locator('[role="gridcell"]');
    const nextCount = await nextMonthDays.count();
    for (let i = 0; i < nextCount; i++) {
      const day = nextMonthDays.nth(i);
      const disabled = await day
        .evaluate((el) => {
          const btn = el as HTMLButtonElement;
          return btn.disabled || el.getAttribute('disabled') !== null || el.getAttribute('aria-disabled') === 'true';
        })
        .catch(() => true);
      const isVisible = await day.isVisible().catch(() => false);
      if (!disabled && isVisible) {
        await user.robustClick(day, 15000);
        return;
      }
    }
    throw new Error('No enabled calendar day found in next month either');
  }

  // Pick the second enabled day (skip today)
  const secondEnabledIndex = enabledDayIndexes[1];
  await user.robustClick(calendarDays.nth(secondEnabledIndex), 15000);
}

/**
 * Prepare patient for booking on the next available day (not today).
 * Used by duplicate-tab-sync tests to avoid slot conflicts with today-based tests.
 */
export async function preparePatientForNextAvailableDate(user: MedSchedulePage, patientId: BookingPatientId): Promise<void> {
  await user.goto();
  await user.searchPatient(patientId);
  await user.selectPatientById(patientId);
  await user.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await selectNextAvailableDay(user);
  await user.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
}

/**
 * Prepare patient for booking on a deterministic future date.
 * This keeps concurrent users on the same date and prevents random-date drift.
 */
export async function preparePatientForBooking(user: MedSchedulePage, patientId: BookingPatientId): Promise<void> {
  await user.goto();
  await user.searchPatient(patientId);
  await user.selectPatientById(patientId);
  // Brief wait for React to update after patient selection
  await user.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  // Ensure calendar navigation buttons are ready before attempting month navigation
  await user.nextMonthButton.waitFor({ state: 'visible', timeout: user.timeout(30000) }).catch(() => {});
  await user.robustClick(user.nextMonthButton, 20000);
  await user.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await selectCurrentActiveDay(user);
  // Brief wait for calendar state to settle
  await user.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
}

/**
 * Prepare patient for booking on current date (today).
 * WORKER-SAFE: Includes proper wait states and extended timeouts.
 */
export async function preparePatientForCurrentDate(user: MedSchedulePage, patientId: BookingPatientId): Promise<void> {
  await user.goto();
  await user.searchPatient(patientId);
  await user.selectPatientById(patientId);
  // Brief wait for React to update after patient selection
  await user.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await selectCurrentActiveDay(user);
  // Brief wait for calendar state to settle
  await user.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
}

/**
 * Choose a specific time slot.
 * WORKER-SAFE: Uses robustClick with increased timeout.
 */
export async function chooseSlot(user: MedSchedulePage, slot: string): Promise<void> {
  await user.robustClick(user.slotButton(slot), 15000);
  // Brief wait for slot UI to update
  await user.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
}

/**
 * Confirm booking (both button visibility and click).
 * WORKER-SAFE: Includes explicit waits for button visibility.
 */
export async function confirmBooking(user: MedSchedulePage): Promise<void> {
  await user.confirmAppointmentButton().waitFor({ state: 'visible', timeout: user.timeout(15000) });
  await user.robustClick(user.confirmAppointmentButton(), 15000);
  // Brief wait for booking response to render
  await user.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
}

/**
 * Attempt to confirm booking without throwing on failure.
 * WORKER-SAFE: Handles failures gracefully with proper error suppression in tests.
 */
export async function tryConfirmBooking(user: MedSchedulePage): Promise<boolean> {
  const confirmVisible = await user
    .confirmAppointmentButton()
    .waitFor({ state: 'visible', timeout: user.timeout(15000) })
    .then(() => true)
    .catch(() => false);

  if (!confirmVisible) {
    return false;
  }

  try {
    await user.robustClick(user.confirmAppointmentButton(), 15000);
  } catch {
    return false;
  }

  // Brief wait for booking response to render
  await user.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  return true;
}

/**
 * Check if booking succeeded by checking for success message.
 * WORKER-SAFE: Includes error handling.
 */
export async function bookingSucceeded(user: MedSchedulePage): Promise<boolean> {
  return user.bookingSuccessMessage().isVisible().catch(() => false);
}

/**
 * Check if slot is unavailable (disabled or not visible).
 * WORKER-SAFE: Comprehensive availability check.
 */
export async function slotUnavailable(user: MedSchedulePage, slot: string): Promise<boolean> {
  const slotButton = user.slotButton(slot);
  const isVisible = await slotButton.isVisible().catch(() => false);

  if (!isVisible) {
    return true;
  }

  return slotButton
    .evaluate((element) => {
      const button = element as HTMLButtonElement;
      return button.disabled || element.getAttribute('disabled') !== null || element.getAttribute('aria-disabled') === 'true';
    })
    .catch(() => true);
}

/**
 * Get comprehensive state after a duplicate booking attempt.
 * Used for testing duplicate booking prevention.
 */
export async function duplicateAttemptState(
  user: MedSchedulePage,
  slot: string
): Promise<{
  couldConfirm: boolean;
  hasError: boolean;
  succeeded: boolean;
  unavailable: boolean;
}> {
  // Allow brief settle time for any shared-context localStorage storage events to render
  // (prevents race where slot is still "available" visually just after firstUser books it)
  await user.page.waitForLoadState('networkidle', { timeout: user.timeout(5000) }).catch(() => {});
  // Extra time for React to process storage events and update the DOM state
  await user.page.waitForTimeout(user.timeout(3000));

  // If the slot is already unavailable (e.g. shared-context localStorage sync has disabled it),
  // skip the click entirely — attempting robustClick on a disabled/gone button wastes ~46s.
  const alreadyUnavailable = await slotUnavailable(user, slot);
  if (alreadyUnavailable) {
    return { couldConfirm: false, hasError: false, succeeded: false, unavailable: true };
  }

  // Safety net: if the slot disappears during click (extreme race condition), handle gracefully
  try {
    await chooseSlot(user, slot);
  } catch {
    const unavailable = await slotUnavailable(user, slot);
    return { couldConfirm: false, hasError: false, succeeded: false, unavailable };
  }

  const couldConfirm = await tryConfirmBooking(user);
  const hasError = await user.slotAlreadyBookedError().isVisible().catch(() => false);
  const succeeded = await bookingSucceeded(user);
  const unavailable = await slotUnavailable(user, slot);

  return { couldConfirm, hasError, succeeded, unavailable };
}

/**
 * Returns a browser-aware test timeout.
 * WebKit and Firefox run significantly slower under high parallel load.
 * Use inside test bodies: test.setTimeout(getTestTimeout(45000, test.info()))
 */
export function getTestTimeout(baseMs: number, projectName: string): number {
  switch (projectName) {
    case 'webkit':
      return Math.ceil(baseMs * 4);
    case 'firefox':
      return Math.ceil(baseMs * 2.5);
    default:
      return baseMs;
  }
}
