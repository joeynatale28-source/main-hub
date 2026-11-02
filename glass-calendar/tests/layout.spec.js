import { test, expect } from '@playwright/test';

async function toDetails(page){await page.locator('#eventSave').click();await expect(page.locator('#wizardCount')).toHaveText('STEP 2 OF 4');await page.locator('#eventSave').click();await page.locator('#eventSave').click();await expect(page.locator('#wizardCount')).toHaveText('STEP 4 OF 4')}
async function createWizardEvent(page){await toDetails(page);await page.locator('#eventSave').click();await expect(page.locator('#wizardSuccess')).toBeVisible();await expect(page.locator('#eventDialog')).toBeHidden({timeout:5000})}

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
    if(!localStorage.getItem('daylight-theme'))localStorage.setItem('daylight-theme', 'dark');
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
  await page.locator('#addSide').click();
  await page.locator('#eventName').fill('Calendar UI smoke test');
  const today = await page.evaluate(() => { const d = new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); });
  await expect(page.locator('#eventDate')).toHaveValue(today);
  await page.locator('#eventSave').click();
  await page.locator('#startTimePicker').click();
  await page.locator('#pickerTimeInput').fill('2:15 PM');
  await page.locator('#pickerTimeInput').press('Enter');
  await page.locator('#eventSave').click();
  await page.locator('#eventSave').click();
  await page.locator('#eventSave').click();
  await page.locator('#todayBtn').click();
  await page.locator('[data-event]').filter({ hasText: 'Calendar UI smoke test' }).first().click();
  await expect(page.locator('#detailDialog')).toBeVisible();
  await expect(page.locator('#detailTitle')).toHaveText('Calendar UI smoke test');
  const rect = await page.locator('#detailDialog').boundingBox();
  expect(rect.width).toBeLessThanOrEqual(390);
  await page.locator('#detailEdit').click();
  await expect(page.locator('#eventDialog')).toBeVisible();
  await page.locator('#eventName').fill('Updated UI test');
  await toDetails(page);
  await page.locator('#eventSave').click();
  await expect(page.locator('#eventDialog')).toBeHidden();
  await page.locator('#quickThemeButton').click();
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
  await page.locator('.task-due-button').click();
  await page.locator('.task-date-panel [data-day]').first().click();
  await page.locator('#taskForm button[type="submit"]').click();
  await expect(page.locator('#tasksList')).toContainText('Polish review');
});

test('mobile month dates reveal their events and add-event shortcut', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#selectedDayAgenda')).toBeHidden();
  const firstDate = await page.locator('#calendarView .daycell').nth(8).getAttribute('data-day');
  await page.locator('#calendarView .daycell').nth(8).locator('[data-add-date]').click();
  await expect(page.locator('#eventDialog')).toBeVisible();
  await expect(page.locator('#eventDate')).toHaveValue(firstDate);
});

test('week schedule positions events by actual time and opens details', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(()=>window.DaylightBridge.changeView('week'));
  await expect(page.locator('.week-days-head .week-day-button')).toHaveCount(7);
  await expect(page.locator('.week-day-track')).toHaveCount(7);
  await expect(page.locator('.week-hour-label')).toHaveCount(48);
  const day = await page.locator('[data-week-track]').nth(2).getAttribute('data-week-track');
  await page.locator('#addSide').click();
  await page.locator('#eventName').fill('Team planning');
  await page.locator('#eventSave').click();
  await page.locator('#startDatePicker').click();
  await page.locator('[data-picker-date="'+day+'"]').click();
  await page.locator('#startTimePicker').click();
  await page.locator('#pickerTimeInput').fill('9:30 AM');
  await page.locator('#pickerTimeInput').press('Enter');
  await page.locator('#eventSave').click();
  await page.locator('#eventSave').click();
  await page.locator('#eventSave').click();
  const event = page.locator('.week-event').filter({ hasText: 'Team planning' });
  await expect(event).toBeVisible();
  const top = await event.evaluate(el => parseFloat(el.style.top));
  expect(top).toBeGreaterThan(555);
  expect(top).toBeLessThan(605);
  await event.click();
  await expect(page.locator('#detailTitle')).toHaveText('Team planning');
  await page.screenshot({ path: 'test-results/week-desktop.png', fullPage: false });
});

test('week layout is scrollable inside calendar on mobile without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(()=>window.DaylightBridge.changeView('week'));
  const result = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    week: document.querySelector('.week-board').getBoundingClientRect().width,
    scrollArea: document.querySelector('.week-overflow').clientWidth,
    hours: document.querySelectorAll('.week-hour-label').length
  }));
  expect(result.document).toBeLessThanOrEqual(result.viewport + 2);
  expect(result.week).toBeGreaterThan(result.scrollArea);
  expect(result.hours).toBe(48);
  await expect.poll(async () => (await page.locator('.sidebar').boundingBox()).x + (await page.locator('.sidebar').boundingBox()).width, { timeout: 3000 }).toBeLessThanOrEqual(1);
  await page.screenshot({ path: 'test-results/week-phone.png', fullPage: false });
});

test('US holidays appear as all-day events in week view', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-26T12:00:00Z'));
  await page.reload();
  await page.locator('#todayBtn').click();
  await page.evaluate(()=>window.DaylightBridge.changeView('week'));
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
    await fresh.evaluate(()=>window.DaylightBridge.changeView('month'));
    await expect(fresh.locator('#viewSelect')).toHaveValue('month');
  } finally {
    await context.close();
  }
});

test('clicking an empty week slot pre-fills date and rounded start time', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(()=>window.DaylightBridge.changeView('week'));
  const track = page.locator('[data-week-track]').nth(3);
  const key = await track.getAttribute('data-week-track');
  await track.click({ position: { x: 40, y: 600 } });
  await expect(page.locator('#eventDialog')).toBeVisible();
  await expect(page.locator('#eventDate')).toHaveValue(key);
  await expect(page.locator('#eventTime')).toHaveValue('10:00');
});

test('integrations navigation displays providers and working subscription action', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('#integrationsNav').click();
  await expect(page.locator('#settingsIntegrations')).toBeVisible();
  await expect(page.locator('.provider-card')).toHaveCount(5);
  await expect(page.locator('.provider-card').filter({hasText:'Google Calendar'})).toBeVisible();
  await page.locator('#integrationSubscribe').click();
  await expect(page.locator('#subscribeDialog')).toBeVisible();
  await page.locator('#subscribeDialog [data-close]').first().click();
  await expect(page.locator('#subscribeDialog')).toBeHidden();
});
test('event editor saves all-day events with a full-day duration', async ({ page }) => {
  await page.locator('#addSide').click();
  await page.locator('#eventName').fill('All-day planning');
  await page.locator('#eventSave').click();
  await page.locator('#eventAllDay').check();
  await expect(page.locator('#eventTime')).toBeDisabled();
  await page.locator('#eventSave').click();
  await page.locator('#eventSave').click();
  await page.locator('#eventSave').click();
  await expect(page.locator('#eventDialog')).toBeHidden();
  await page.evaluate(()=>window.DaylightBridge.changeView('week'));
  await expect(page.locator('.week-all-day')).toContainText('All-day planning');
});

test('precision shell hides the header view switcher and uses a 20px calendar title',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await expect(page.locator('#addSide')).toBeVisible();
  await expect(page.locator('#addTop')).toBeHidden();
  await expect(page.locator('.toolbar-title h1')).toHaveCSS('font-size','20px');
  await expect(page.locator('.view-toggle')).toBeHidden();
  await page.locator('#settingsNav').click();
  await expect(page.locator('#defaultViewSelect')).toHaveValue('month');
  await page.locator('.nav[data-view="month"]').click();
  await expect(page.locator('.monthgrid')).toBeVisible();
});
test('mini calendar dots, current week and today color use the shared palette', async ({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await expect(page.locator('.mini-day.today .mini-day-number')).toHaveCSS('background-color','rgb(250, 250, 250)');
  await expect(page.locator('.mini-day.in-week').first()).toBeVisible();
});
test('welcome has dismissible close and backdrop without forced name entry', async ({browser})=>{
  const context=await browser.newContext();
  const page=await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4173/');
    await expect(page.locator('#welcomeDialog')).toBeVisible();
    await page.locator('#welcomeClose').click();
    await expect(page.locator('#welcomeDialog')).toBeHidden();
    await page.reload();
    await expect(page.locator('#welcomeDialog')).toBeHidden();
  }finally{await context.close()}
});

test('theme quick toggle cycles all modes and system reacts to OS scheme',async({page})=>{
  await page.locator('#quickThemeButton').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.locator('#quickThemeButton').click();
  await page.emulateMedia({colorScheme:'dark'});
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.emulateMedia({colorScheme:'light'});
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.locator('#quickThemeButton').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});
test('Settings uses a centered modal with navigation and the calendar remains visible',async({page})=>{
 await page.locator('#settingsHeaderButton').click();
 await expect(page.locator('#settingsModal')).toBeVisible();
 await expect(page.locator('#calendarContent')).toBeVisible();
 await expect(page.locator('.settings-sections')).toHaveCSS('position','static');
 await page.locator('.settings-anchor[data-target="settingsCalendar"]').click();
 await expect(page.locator('#settingsCalendar h2')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('#settingsModal')).toBeHidden();
});
test('provider logos are bounded, grey and not overlapping',async({page})=>{
  await page.locator('#integrationsNav').click();
  await expect(page.locator('#settingsIntegrations')).toBeVisible();
  await expect(page.locator('#settingsGeneral')).toBeHidden();
  for(const selector of ['.apple-brand','.google-brand','.microsoft-brand']){
    const box=await page.locator(selector).boundingBox();expect(box.width).toBeLessThanOrEqual(37);expect(box.height).toBeLessThanOrEqual(37)
  }
  await expect(page.locator('.apple-brand svg')).toHaveCSS('width','22px');
});
test('monochrome colors, calendar shade, native controls and all-day switch',async({page})=>{
  const vars=await page.evaluate(()=>{const css=getComputedStyle(document.documentElement);return ['--bg','--bg-sidebar','--surface','--border','--primary'].map(k=>css.getPropertyValue(k).trim())});
  expect(vars).toEqual(['#0A0A0A','#050505','#131313','#262626','#FAFAFA']);
  await page.locator('#addSide').click();
  await expect(page.locator('#eventSave')).toBeDisabled();
  await page.locator('#eventName').fill('Sample');
  await expect(page.locator('#eventSave')).toBeEnabled();
  await page.locator('#eventSave').click();
  await expect(page.locator('#eventAllDay')).toHaveCSS('appearance','none');
  await page.locator('#eventAllDay').check();
  await expect(page.locator('#startTimePicker')).toBeHidden();
  await page.locator('#eventAllDay').uncheck();
  await expect(page.locator('#startTimePicker')).toBeVisible();
  await expect(page.locator('#eventRepeat')).toHaveCSS('opacity','0');
  await page.locator('#eventDialog [data-close]').first().click();
  await page.locator('#wizardDiscardButton').click();
});
test('search across dates resets completely on Escape and clear button',async({page})=>{
  await page.locator('#addSide').click();
  await page.locator('#eventName').fill('Unique puzzle appointment');
  await createWizardEvent(page);
  await expect(page.locator('#eventDialog')).toBeHidden();
  await page.locator('#searchButton').click();
  await page.locator('#searchInput').fill('puzzle');
  await expect(page.locator('#searchResults')).toContainText('Unique puzzle appointment');
  await page.locator('#searchInput').press('Escape');
  await expect(page.locator('#searchInput')).toHaveValue('');
  await expect(page.locator('#searchResults')).toBeHidden();
  await page.locator('#searchButton').click();
  await page.locator('#searchInput').fill('noneexisting123');
  await expect(page.locator('#searchResults')).toContainText('No results');
  await page.locator('#searchClear').click();
  await expect(page.locator('#searchResults')).toBeHidden();
});

test('visual QA captures Settings modal, Integrations and event editor in both themes',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.locator('#settingsHeaderButton').click();
 await expect(page.locator('#settingsModal')).toBeVisible();
 await page.screenshot({path:'test-results/settings-dark.png',fullPage:false});
 await page.locator('.settings-anchor[data-target="settingsAppearance"]').click();
 await page.locator('[data-theme-choice="light"]').click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.screenshot({path:'test-results/settings-light.png',fullPage:false});
 await page.locator('#settingsModal .settings-close').click();
 await page.locator('#integrationsNav').click();
 await expect(page.locator('#settingsIntegrations')).toBeVisible();
 await page.screenshot({path:'test-results/integrations-light.png',fullPage:false});
 await page.locator('.nav[data-view="month"]').click();
 await page.locator('#quickThemeButton').click();await page.locator('#quickThemeButton').click();
 await page.locator('#addSide').click();
 await expect(page.locator('#eventDialog')).toBeVisible();
 await page.screenshot({path:'test-results/event-modal-dark.png',fullPage:false});
});
test('event modal custom selects work inside dialog and save metadata',async({page})=>{
  await page.locator('#addSide').click();
  await page.locator('#eventName').fill('Weekly swim');
  await page.locator('#eventSave').click();
  await page.locator('#wizardRepeatChips [data-value="weekly"]').click();
  await expect(page.locator('#eventRepeat')).toHaveValue('weekly');
  await page.locator('#eventSave').click();
  await page.locator('#eventLocation').fill('Community pool');
  await page.locator('#eventSave').click();
  await page.locator('#eventReminder + .select-button').click();
  await page.locator('.select-menu .select-option').filter({hasText:'15 min before'}).click();
  await expect(page.locator('#eventReminder')).toHaveValue('15m');
  await page.locator('#eventSave').click();
  await expect(page.locator('#eventDialog')).toBeHidden({timeout:5000});
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('daylight-events-v1')||'[]').find(e=>e.title==='Weekly swim'));
  expect(saved).toMatchObject({repeat:'weekly',reminder:'15m',location:'Community pool'});
});

test('wizard has four steps, skip buttons, and creation success',async({page})=>{
 await page.locator('#addSide').click();
 await expect(page.locator('#wizardCount')).toHaveText('STEP 1 OF 4');
 await expect(page.locator('#eventSave')).toBeDisabled();
 await page.locator('#eventName').fill('My birthday');
 await page.locator('#eventSave').click();
 await expect(page.locator('#wizardCount')).toHaveText('STEP 2 OF 4');
 await page.locator('#eventSave').click();
 await expect(page.locator('#wizardCount')).toHaveText('STEP 3 OF 4');
 await page.locator('#wizardSkip').click();
 await expect(page.locator('#wizardCount')).toHaveText('STEP 4 OF 4');
 await expect(page.locator('#wizardSkip')).toBeHidden();
 await page.locator('#eventSave').click();
 await expect(page.locator('#wizardSuccess')).toBeVisible();
 await expect(page.locator('#eventDialog')).toBeHidden({timeout:5000});
});
test('theme treatments respond live and holiday banner uses dates',async({page})=>{
 await page.locator('#addSide').click();
 await page.locator('#eventName').fill('Halloween party');
 await expect(page.locator('#wizardThemeIcon')).toBeVisible();
 await expect(page.locator('#wizardThemeIcon svg')).toBeVisible();
 await page.locator('#eventName').fill('General plans');
 await expect(page.locator('#wizardThemeIcon')).toBeHidden();
 await page.locator('#eventSave').click();
 await page.locator('#startDatePicker').click();
 await expect(page.locator('.picker-header')).toBeVisible();
 for(let i=0;i<18&&!(await page.locator('.picker-header strong').textContent()).includes('October 2026');i++){
   await page.locator('[data-picker-shift="-1"]').click();
 }
 await page.locator('[data-picker-date="2026-10-31"]').click();
 await expect(page.locator('#eventDate')).toHaveValue('2026-10-31');
 await expect(page.locator('#wizardHoliday')).toContainText('Halloween');
 await page.locator('#wizardHoliday button').click();
 await expect(page.locator('#wizardHoliday')).toBeHidden();
});
test('accent swatches, custom hex validation, and persistence',async({page})=>{
 await page.locator('#settingsHeaderButton').click();
 await page.locator('.settings-anchor[data-target="settingsAppearance"]').click();
 await expect(page.locator('html')).toHaveAttribute('data-accent','graphite');
 await page.locator('[data-accent-choice="#3B82F6"]').click();
 await expect(page.locator('html')).toHaveAttribute('data-accent','custom');
 await expect(page.locator('html')).toHaveCSS('--accent','#3B82F6');
 await page.locator('#accentHex').fill('oops');
 await expect(page.locator('#accentError')).toBeVisible();
 await page.locator('#accentHex').fill('#8B7CFF');
 await expect(page.locator('html')).toHaveCSS('--accent','#8B7CFF');
 await page.reload();
 await expect(page.locator('html')).toHaveCSS('--accent','#8B7CFF');
 await page.locator('#settingsHeaderButton').click();await page.locator('.settings-anchor[data-target="settingsAppearance"]').click();
 await page.locator('[data-accent-choice="graphite"]').click();
 await expect(page.locator('html')).toHaveAttribute('data-accent','graphite');
});
test('dirty wizard asks to discard and draft offers resume on reload',async({page})=>{
 await page.locator('#addSide').click();
 await page.locator('#eventName').fill('Unfinished future plan');
 await page.reload();
 await page.locator('#addSide').click();
 await expect(page.locator('#wizardResume')).toBeVisible();
 await page.locator('#wizardResumeButton').click();
 await expect(page.locator('#eventName')).toHaveValue('Unfinished future plan');
 await page.locator('#eventDialog [data-close]').first().click();
 await expect(page.locator('#wizardDiscard')).toBeVisible();
 await page.locator('#wizardKeepEditing').click();
 await expect(page.locator('#eventDialog')).toBeVisible();
 await page.locator('#eventDialog [data-close]').first().click();
 await page.locator('#wizardDiscardButton').click();
 await expect(page.locator('#eventDialog')).toBeHidden();
});

test('release polish legal pages are reachable and describe local-only storage',async({page})=>{
 const base=new URL(page.url());
 await page.goto(new URL('privacy.html',base).href);
 await expect(page.getByRole('heading',{name:'Privacy Policy'})).toBeVisible();
 await expect(page.locator('body')).toContainText('local storage');
 await expect(page.locator('body')).toContainText('Photon');
 await page.goto(new URL('terms.html',base).href);
 await expect(page.getByRole('heading',{name:'Terms of Service'})).toBeVisible();
 await expect(page.locator('body')).toContainText('backups');
 await page.getByRole('link',{name:'Back to calendar'}).click();
 await expect(page.locator('#calendarView')).toBeVisible();
});
test('page transitions scroll to the top without scrolling the root document',async({page})=>{
 await page.setViewportSize({width:1440,height:740});
 await page.locator('#settingsHeaderButton').click();
 await page.locator('.settings-anchor[data-target="settingsAbout"]').click();
 await expect(page.locator('#settingsAbout')).toBeVisible();
 await page.locator('#settingsModal .settings-close').click();
 await page.locator('#tasksNav').click();
 await expect(page.locator('#tasksPage')).toBeVisible();
 const positions=await page.evaluate(()=>({window:scrollY,main:document.querySelector('.main').scrollTop}));
 expect(positions.window).toBe(0);expect(positions.main).toBe(0);
});
test('location search suggestions support manual typing without a network dependency',async({page})=>{
 await page.locator('#addSide').click();
 await page.locator('#eventName').fill('Dinner');
 await page.locator('#eventSave').click();
 await page.locator('#eventSave').click();
 await page.route('https://photon.komoot.io/api/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({features:[{properties:{name:'Central Park',city:'New York',state:'New York',country:'United States'}}]})}));
 await page.locator('#eventLocation').fill('Central Park');
 await expect(page.locator('#addressResults')).toBeVisible({timeout:5000});
 await expect(page.locator('#addressResults')).toContainText('Central Park');
 await page.locator('#addressResults button').first().click();
 await expect(page.locator('#eventLocation')).toHaveValue(/Central Park/);
 await expect(page.locator('.wizard-location>svg')).toBeVisible();
 await page.locator('#eventLocation').fill('Private location');
 await expect(page.locator('.wizard-location>svg')).toBeVisible();
});

test('v1 shell is viewport-locked with pinned account row on desktop',async({page})=>{
 await page.setViewportSize({width:1440,height:800});
 const result=await page.evaluate(()=>{const r=e=>e.getBoundingClientRect();return{html:getComputedStyle(document.documentElement).overflow,body:getComputedStyle(document.body).overflow,app:r(document.querySelector('.app')).height,sidebar:r(document.querySelector('.sidebar')).height,footer:r(document.querySelector('.sidebar-bottom')).bottom,brand:r(document.querySelector('.brand')).top,inner:innerHeight,sidebarMiddle:getComputedStyle(document.querySelector('.sidebar-middle')).overflowY}});
 expect(result.body).toBe('hidden');expect(result.app).toBe(800);expect(result.sidebar).toBe(800);expect(result.footer).toBeLessThanOrEqual(result.inner+1);expect(result.sidebarMiddle).toBe('auto');
 await page.locator('.sidebar-middle').evaluate(e=>e.scrollTop=1000);
 await expect(page.locator('.sidebar-bottom .profile')).toBeVisible();
});
test('Settings popup is centered over a visible calendar without navigating away',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.locator('#settingsHeaderButton').click();
 await expect(page.locator('#settingsModal')).toBeVisible();
 const layout=await page.evaluate(()=>{const r=e=>e.getBoundingClientRect(),d=r(document.querySelector('#settingsModal')),w=innerWidth;return{x:d.x,width:d.width,center:d.x+d.width/2,windowCenter:w/2}});
 expect(Math.abs(layout.center-layout.windowCenter)).toBeLessThan(20);
 expect(layout.width).toBeLessThanOrEqual(900);
 await expect(page.locator('#calendarContent')).toBeVisible();
 await page.locator('#settingsModal .settings-close').click();
 await expect(page.locator('#settingsModal')).toBeHidden();
});
test('mini month arrows leave the main header and selected date unchanged',async({page})=>{
 const start=await page.locator('#pageTitle').textContent();
 await page.locator('#miniNext').click();
 expect(await page.locator('#pageTitle').textContent()).toBe(start);
 await expect(page.locator('#miniMonth')).not.toHaveText(start.trim());
});
test('all-date search leaves the rendered month grid intact',async({page})=>{
 const before=await page.locator('.daycell').count();await page.locator('#searchButton').click();await page.locator('#searchInput').fill('totally-absent-event');
 await expect(page.locator('.daycell')).toHaveCount(before);
 await expect(page.locator('#searchResults')).toContainText('No results');
 await page.locator('#searchInput').press('Escape');
 await expect(page.locator('#searchResults')).toBeHidden();
});
test('collapsed rail has only icon navigation and no calendar name overflow',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.locator('#collapseSidebar').click();
 await expect(page.locator('.app')).toHaveClass(/sidebar-collapsed/);
 await expect(page.locator('.brand-name')).toBeHidden();
 await expect(page.locator('.sidebar-middle .mini-calendar')).toBeHidden();
 await expect(page.locator('.rail-calendar-dots button').first()).toBeVisible();
 const box=await page.locator('.sidebar').boundingBox();expect(box.width).toBeLessThanOrEqual(70);
});
test('wizard step four hides Skip and keeps Back',async({page})=>{
 await page.locator('#addSide').click();await page.locator('#eventName').fill('Test meeting');
 await page.locator('#eventSave').click();await page.locator('#eventSave').click();await page.locator('#eventSave').click();
 await expect(page.locator('#wizardCount')).toHaveText('STEP 4 OF 4');await expect(page.locator('#wizardSkip')).toBeHidden();
 await expect(page.locator('#wizardBack')).toBeVisible();
});
test('Tasks takeover has a custom due date and filter counts',async({page})=>{
 await page.locator('#tasksNav').click();await expect(page.locator('#tasksPage')).toBeVisible();
 await expect(page.locator('[data-task-filter="all"]')).toContainText('·');
 await page.locator('#newTask').click();
 await expect(page.locator('#taskDue')).toBeHidden();
 await page.locator('.task-due-button').click();
 await expect(page.locator('.task-date-panel')).toBeVisible();
});
