import { expect, test } from '@playwright/test';

import { MedSchedulePage, doctorProfile } from '../fixtures/shared-helpers';

test('Doctor name, profile picture, rating, reviews, designation, qualification validation', async ({ page }) => {
  const medSchedulePage = new MedSchedulePage(page);

  await medSchedulePage.goto();

  await expect(medSchedulePage.doctorAvatar).toBeVisible();
  await expect(medSchedulePage.doctorAvatar).toHaveText(doctorProfile.avatarInitials);
  await expect(medSchedulePage.doctorName).toBeVisible();
  await expect(medSchedulePage.doctorDesignation).toBeVisible();
  await expect(medSchedulePage.doctorQualification).toBeVisible();
  await expect(medSchedulePage.doctorRatingAndReviews).toBeVisible();
});