const { chromium } = require('playwright');

async function inspectBooking() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://medicare-flow-bot.lovable.app/', { waitUntil: 'networkidle' });

  // Select patient 007
  await page.getByTestId('patient-selector').click();
  await page.getByTestId('patient-search').fill('007');
  await page.waitForTimeout(800);

  const patientBtn = page.getByRole('button').filter({ hasText: 'Bond' }).first();
  await patientBtn.click();
  await page.waitForTimeout(800);

  // Click a time slot
  await page.getByRole('button', { name: '9:00 AM', exact: true }).click();
  await page.waitForTimeout(1500);

  const body = await page.locator('body').innerText();
  const dialogs = await page.locator('[role="dialog"]').count();
  const confirmButtons = await page.getByRole('button').evaluateAll((nodes) =>
    nodes.map((n) => n.textContent.trim()).filter((t) => t.toLowerCase().includes('confirm') || t.toLowerCase().includes('book') || t.toLowerCase().includes('submit'))
  );

  console.log(JSON.stringify({
    bodyText: body.replace(/\s+/g, ' ').trim().slice(0, 2000),
    dialogCount: dialogs,
    confirmButtons,
  }, null, 2));

  await browser.close();
}

inspectBooking().catch((err) => {
  console.error(err.stack || err);
  process.exit(1);
});
