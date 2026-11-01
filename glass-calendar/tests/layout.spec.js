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

test('week schedule positions events by actual time and opens details', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('#viewSelect').selectOption('week');
  await expect(page.locator('.week-days-head .week-day-button')).toHaveCount(7);
  await expect(page.locator('.week-day-track')).toHaveCount(7);
  await expect(page.locator('.week-hour-label')).toHaveCount(24);
  const day = await page.locator('[data-week-track]').nth(2).getAttribute('data-week-track');
  await page.locator('#addTop').click();
  await page.locator('#eventName').fill('Team planning');
  await page.locator('#eventDate').fill(day);
  await page.locator('#eventTime').fill('09:30');
  await page.locator('#eventDuration').selectOption('60');
  await page.locator('#eventForm button[type="submit"]').click();
  const event = page.locator('.week-event').filter({ hasText: 'Team planning' });
  await expect(event).toBeVisible();
  const top = await event.evaluate(el => parseFloat(el.style.top));
  expect(top).toBeGreaterThan(600);
  expect(top).toBeLessThan(650);
  await event.click();
  await expect(page.locator('#detailTitle')).toHaveText('Team planning');
  await page.screenshot({ path: 'test-results/week-desktop.png', fullPage: false });
});

test('week layout is scrollable inside calendar on mobile without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#viewSelect').selectOption('week');
  const result = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    week: document.querySelector('.week-board').getBoundingClientRect().width,
    scrollArea: document.querySelector('.week-overflow').clientWidth,
    hours: document.querySelectorAll('.week-hour-label').length
  }));
  expect(result.document).toBeLessThanOrEqual(result.viewport + 2);
  expect(result.week).toBeGreaterThan(result.scrollArea);
  expect(result.hours).toBe(24);
  await expect.poll(async () => (await page.locator('.sidebar').boundingBox()).x + (await page.locator('.sidebar').boundingBox()).width, { timeout: 3000 }).toBeLessThanOrEqual(1);
  await page.screenshot({ path: 'test-results/week-phone.png', fullPage: false });
});

test('US holidays appear as all-day events in week view', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-26T12:00:00Z'));
  await page.reload();
  await page.locator('#viewSelect').selectOption('week');
  await expect(page.locator('.week-all-day')).toContainText('Thanksgiving Day');
  await expect(page.locator('.week-time-board .week-event').filter({ hasText:'Thanksgiving Day' })).toHaveCount(0);
});

test('fresh installs open the new weekly schedule while saved preferences win', async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => localStorage.setItem('daylight-onboarded','yes'));
  const fresh = await context.newPage();
  try {
    await fresh.goto('http://127.0.0.1:4173/');
    await expect(fresh.locator('.week-board')).toBeVisible();
    await expect(fresh.locator('#viewSelect')).toHaveValue('week');
    await fresh.locator('#viewSelect').selectOption('month');
    await expect(fresh.locator('#viewSelect')).toHaveValue('month');
  } finally {
    await context.close();
  }
});

test('clicking an empty week slot pre-fills date and rounded start time', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('#viewSelect').selectOption('week');
  const track = page.locator('[data-week-track]').nth(3);
  const key = await track.getAttribute('data-week-track');
  await track.click({ position: { x: 40, y: 660 } });
  await expect(page.locator('#eventDialog')).toBeVisible();
  await expect(page.locator('#eventDate')).toHaveValue(key);
  await expect(page.locator('#eventTime')).toHaveValue('10:00');
});
