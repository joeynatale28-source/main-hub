import {test,expect} from '@playwright/test';
const fixture=[
'BEGIN:VCALENDAR','VERSION:2.0','X-WR-CALNAME:Team Calendar',
'BEGIN:VEVENT','UID:timed','DTSTART:20261104T170000','DTEND:20261104T183000','SUMMARY:Practice','LOCATION:Pool','END:VEVENT',
'BEGIN:VEVENT','UID:all','DTSTART;VALUE=DATE:20261105','DTEND;VALUE=DATE:20261106','SUMMARY:All day','END:VEVENT',
'BEGIN:VEVENT','UID:multi','DTSTART;VALUE=DATE:20261107','DTEND;VALUE=DATE:20261110','SUMMARY:Trip','END:VEVENT',
'BEGIN:VEVENT','UID:weekly','DTSTART:20261103T180000','DTEND:20261103T190000','RRULE:FREQ=WEEKLY;COUNT=3','SUMMARY:Weekly training','END:VEVENT',
'BEGIN:VEVENT','UID:future','DTSTART:20261209T110000','DTEND:20261209T120000','SUMMARY:December meeting','END:VEVENT','END:VCALENDAR'].join('\r\n');
test.beforeEach(async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('daylight-onboarded','yes');localStorage.setItem('daylight-default-view','week');localStorage.removeItem('daylight-hidden-calendars')});
 await page.goto('/');
 await expect(page.locator('#calendarView')).toBeVisible();
});
test('ICS engine parses all-day, multi-day, recurring and next-month events',async({page})=>{
 const parsed=await page.evaluate(s=>window.DaylightICS.parse(s,{now:'2026-11-01T00:00:00'}),fixture);
 expect(parsed.name).toBe('Team Calendar');
 expect(parsed.events.filter(e=>e.title==='Weekly training')).toHaveLength(3);
 expect(parsed.events.filter(e=>e.title==='Trip')).toHaveLength(3);
 expect(parsed.events.find(e=>e.title==='All day').allDay).toBe(true);
 expect(parsed.events.some(e=>e.date==='2026-12-09')).toBe(true);
});
test('subscription requests text and refresh replaces rather than duplicates',async({page})=>{
 let count=0;
 await page.route('https://calendar.example.com/schedule.ics',route=>{count++;return route.fulfill({status:200,contentType:'text/calendar',body:fixture})});
 await page.locator('#settingsNav').click();
 await expect(page.locator('#settingsModal')).toBeVisible();
 await page.locator('.settings-anchor[data-target="settingsData"]').click();
 await page.locator('#openSubscribe').click();
 await page.locator('#subscribeName').fill('Personal swim');
 await page.locator('#subscribeURL').fill('https://calendar.example.com/schedule.ics');
 await page.locator('#subscribeSubmit').click();
 await expect(page.locator('#subscriptionList')).toContainText('Personal swim');
 await expect(page.locator('#subscriptionList')).toContainText('Last fetched');
 const events=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('daylight-events-v1')||'[]').filter(x=>x.sourceId));
 const before=await events();expect(before.length).toBeGreaterThanOrEqual(9);
 await page.locator('#subscriptionList [data-refresh]').first().click();
 await expect.poll(async()=>(await events()).length).toBe(before.length);
 expect(count).toBe(2);
 await page.locator('#settingsModal .settings-close').click();
 await expect(page.locator('#settingsModal')).toBeHidden();
 await expect(page.locator('#calendars')).toContainText('Personal swim');
});
test('HTML response shows human-readable error, never a JSON exception',async({page})=>{
 await page.route('https://calendar.example.com/bad.ics',route=>route.fulfill({status:200,contentType:'text/html',body:'<html>not calendar</html>'}));
 await page.locator('#settingsNav').click();await page.locator('.settings-anchor[data-target="settingsData"]').click();
 await page.locator('#openSubscribe').click();
 await page.locator('#subscribeURL').fill('https://calendar.example.com/bad.ics');
 await page.locator('#subscribeSubmit').click();
 await expect(page.locator('#subscriptionList')).toContainText("That link didn't return a calendar file");
 await expect(page.locator('#subscriptionList')).not.toContainText('JSON');
});
test('Settings opens over calendar, theme changes inside modal, closes cleanly',async({page})=>{
 await page.locator('#settingsHeaderButton').click();
 await expect(page.locator('#settingsModal')).toBeVisible();
 await expect(page.locator('#calendarContent')).toBeVisible();
 await page.locator('.settings-anchor[data-target="settingsAppearance"]').click();
 await page.locator('[data-theme-choice="light"]').click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await expect(page.locator('#settingsModal')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('#settingsModal')).toBeHidden();
 await page.keyboard.press('ControlOrMeta+,');
 await expect(page.locator('#settingsModal')).toBeVisible();
 await page.locator('#settingsModal .settings-close').click();
 await expect(page.locator('#settingsModal')).toBeHidden();
});
test('per-calendar actions support rename, hide, delete confirmation and Undo',async({page})=>{
 await page.locator('#newCalendar').click();await page.locator('#calendarName').fill('To rename');await page.locator('#calendarForm button[type=submit]').click();
 let row=page.locator('.calendar-filter').filter({hasText:'To rename'});
 await row.locator('.calendar-actions-button').click();
 await page.locator('#calendarActionsMenu [data-command="rename"]').click();
 await row.locator('.calendar-rename-input').fill('Renamed calendar');
 await row.locator('.calendar-rename-input').press('Enter');
 row=page.locator('.calendar-filter').filter({hasText:'Renamed calendar'});
 await row.locator('.calendar-actions-button').click();
 await page.locator('#calendarActionsMenu [data-command="visibility"]').click();
 await expect(row).toHaveClass(/calendar-hidden/);
 await row.locator('.calendar-actions-button').click();
 await page.locator('#calendarActionsMenu [data-command="visibility"]').click();
 await expect(row).not.toHaveClass(/calendar-hidden/);
 await row.locator('.calendar-actions-button').click();
 await page.locator('#calendarActionsMenu [data-command="delete"]').click();
 await expect(page.locator('#calendarDeleteProceed')).toBeDisabled();
 await page.locator('#calendarDeleteMatch').fill('renamed calendar');
 await expect(page.locator('#calendarDeleteProceed')).toBeEnabled();
 await page.locator('#calendarDeleteProceed').click();
 await expect(page.locator('#toast button')).toContainText('Undo');
 await page.locator('#toast button').click();
 await expect(page.locator('#calendars')).toContainText('Renamed calendar');
});
test('fresh reload always opens today and settings-selected week',async({page})=>{
 const today=await page.evaluate(()=>{const d=new Date();return d.toISOString().slice(0,10)});
 await page.evaluate(()=>{localStorage.setItem('daylight-last-view','month');localStorage.setItem('daylight-last-date','2026-12-25')});
 await page.reload();
 await expect(page.locator('.week-board')).toBeVisible();
 const showToday=await page.evaluate(()=>{const dates=[...document.querySelectorAll('[data-week-head]')].map(x=>x.dataset.weekHead);const d=new Date();const str=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');return dates.includes(str)});
 expect(showToday).toBe(true);
});
test('collapsed rail hides labels; calendars are dot-only',async({page})=>{
 await page.locator('#collapseSidebar').click();
 await expect(page.locator('.app')).toHaveClass(/sidebar-collapsed/);
 const hidden=await page.locator('.sidebar .nav-label').first().evaluate(el=>getComputedStyle(el).display==='none');
 expect(hidden).toBe(true);
 await expect(page.locator('.sidebar .calendar-filter').first()).toBeVisible();
});
