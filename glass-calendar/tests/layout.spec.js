import { test, expect } from '@playwright/test';

const sizes = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'tablet', width: 820, height: 900 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'small-phone', width: 320, height: 740 },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('daylight-onboarded', 'yes');
    localStorage.setItem('daylight-theme', 'dark');
    localStorage.removeItem('daylight-sidebar-collapsed');
    localStorage.setItem('daylight-default-view', 'month');
  });
  await page.goto('/');
  await expect(page.locator('#calendarView .daycell').first()).toBeVisible();
  await expect(page.locator('#splash')).toBeHidden();
});

for (const size of sizes) {
  test('calendar layout never overlaps navigation at ' + size.name, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.waitForTimeout(350);
    const result = await page.evaluate(() => {
      const rect = selector => {
        const e = document.querySelector(selector);
        const r = e.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, width: r.width };
      };
      return {
        viewport: innerWidth,
        docWidth: document.documentElement.scrollWidth,
        sidebar: rect('.sidebar'),
        main: rect('.main'),
        calendar: rect('.calendar-panel'),
      };
    });
    expect(result.docWidth, 'No horizontal page overflow').toBeLessThanOrEqual(size.width + 2);
    expect(result.calendar.left, 'Calendar starts within viewport').toBeGreaterThanOrEqual(-1);
    expect(result.calendar.right, 'Calendar stays within viewport').toBeLessThanOrEqual(size.width + 1);
    if (size.width > 860) {
      expect(result.sidebar.right, 'Sidebar ends before main content').toBeLessThanOrEqual(result.main.left + 2);
      expect(result.main.left, 'Main must not be beneath sidebar').toBeGreaterThanOrEqual(result.sidebar.right - 2);
    } else {
      expect(result.sidebar.right, 'Drawer should be offscreen until opened').toBeLessThanOrEqual(1);
    }
    await page.screenshot({ path: 'test-results/layout-' + size.name + '.png', fullPage: false });
  });
}

test('collapse and restore desktop sidebar without moving calendar underneath', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 860 });
  const sidebar = page.locator('.sidebar');
  await page.locator('#collapseSidebar').click();
  await expect(page.locator('.app')).toHaveClass(/sidebar-collapsed/);
  await expect.poll(async () => (await sidebar.boundingBox())?.width).toBeLessThan(85);
  const [sb, cal] = await Promise.all([sidebar.boundingBox(), page.locator('.calendar-panel').boundingBox()]);
  expect(cal.x).toBeGreaterThanOrEqual(sb.x + sb.width - 1);
  await page.locator('#collapseSidebar').click();
  await expect(page.locator('.app')).not.toHaveClass(/sidebar-collapsed/);
});

test('mobile navigation is an accessible dismissible drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#mobileMenuButton').click();
  await expect(page.locator('.sidebar')).toHaveClass(/mobile-open/);
  await expect(page.locator('#mobileBackdrop')).toBeVisible();
  await expect.poll(async () => (await page.locator('.sidebar').boundingBox()).x, { timeout: 2000 }).toBeGreaterThanOrEqual(-1);
  const rect = await page.locator('.sidebar').boundingBox();
  expect(rect.width).toBeLessThanOrEqual(390);
  await page.locator('#mobileBackdrop').click({ position: { x: 375, y: 350 } });
  await expect(page.locator('.sidebar')).not.toHaveClass(/mobile-open/);
});

test('create event, open compact details, edit it, and change theme', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('#addTop').click();
  await page.locator('#eventName').fill('Calendar UI smoke test');
  const today = await page.evaluate(() => { const d = new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); });
  await page.locator('#eventDate').fill(today);
  await page.locator('#eventTime').fill('14:15');
  await page.locator('#eventForm button[type="submit"]').click();
  await page.locator('#todayBtn').click();
  await page.locator('[data-event]').filter({ hasText: 'Calendar UI smoke test' }).first().click();
  await expect(page.locator('#detailDialog')).toBeVisible();
  await expect(page.locator('#detailTitle')).toHaveText('Calendar UI smoke test');
  const rect = await page.locator('#detailDialog').boundingBox();
  expect(rect.width).toBeLessThanOrEqual(390);
  await page.locator('#detailEdit').click();
  await expect(page.locator('#eventDialog')).toBeVisible();
  await page.locator('#eventName').fill('Updated UI test');
  await page.locator('#eventForm button[type="submit"]').click();
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});

test('tasks and mini-calendar navigation work', async ({ page }) => {
  await page.setViewportSize({ width: 1300, height: 850 });
  await page.locator('#miniNext').click();
  await expect(page.locator('#miniMonth')).not.toBeEmpty();
  await page.locator('#tasksNav').click();
  await expect(page.locator('#tasksPage')).toBeVisible();
  await page.locator('#newTask').click();
  await page.locator('#taskName').fill('Polish review');
  await page.locator('#taskDue').fill('2026-11-01');
  await page.locator('#taskForm button[type="submit"]').click();
  await expect(page.locator('#tasksList')).toContainText('Polish review');
});

test('mobile month dates reveal their events and add-event shortcut', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#selectedDayAgenda')).toBeVisible();
  const firstDate = await page.locator('#calendarView .daycell').nth(8).getAttribute('data-day');
  await page.locator('#calendarView .daycell').nth(8).click({ position: { x: 25, y: 14 } });
  const title = await page.locator('#selectedDayTitle').textContent();
  expect(title).toBeTruthy();
  await page.locator('#selectedDayAdd').click();
  await expect(page.locator('#eventDialog')).toBeVisible();
  await expect(page.locator('#eventDate')).toHaveValue(firstDate);
});
