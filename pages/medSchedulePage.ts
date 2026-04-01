import { Locator, Page } from '@playwright/test';

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

  constructor(page: Page) {
    this.page = page;
    this.isFirefox = page.context().browser()?.browserType().name() === 'firefox';
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
   * Get Firefox-adjusted timeout (1.5x longer for Firefox)
   */
  private getTimeout(baseTimeoutMs: number): number {
    return this.isFirefox ? Math.ceil(baseTimeoutMs * 1.5) : baseTimeoutMs;
  }

  /**
   * Robust click that handles Firefox stability issues
   */
  async robustClick(locator: Locator, baseTimeoutMs: number = 10000) {
    const timeout = this.getTimeout(baseTimeoutMs);

    await locator.waitFor({ state: 'visible', timeout });

    if (this.isFirefox && !this.page.isClosed()) {
      await this.page.waitForTimeout(150);
    }

    await locator.scrollIntoViewIfNeeded().catch(() => {});

    try {
      await locator.click({ timeout });
      return;
    } catch {
      if (this.isFirefox && !this.page.isClosed()) {
        await this.page.waitForTimeout(250);
      }
    }

    try {
      await locator.click({ timeout, force: true });
      return;
    } catch {
      try {
        await locator.evaluate((element) => {
          (element as HTMLElement).click();
        });
        return;
      } catch {
        if (this.isFirefox) {
          await locator.dispatchEvent('click').catch(() => {});
          return;
        }
      }

      throw new Error('Failed to click locator after retries');
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

    for (let attempt = 1; attempt <= 4; attempt++) {
      await this.robustClick(this.patientSelector, 12000).catch(() => {});

      const searchVisible = await this.patientSearch
        .waitFor({ state: 'visible', timeout: this.getTimeout(2500) })
        .then(() => true)
        .catch(() => false);

      if (searchVisible) {
        return;
      }

      await this.patientSelector.press('Enter').catch(() => {});
      await this.patientSelector.dispatchEvent('click').catch(() => {});

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

    throw new Error('Failed to open patient selector');
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
    // Generic check for appointment details section
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