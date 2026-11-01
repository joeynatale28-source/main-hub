import {test,expect} from '@playwright/test';
const FEED=[
'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Daylight Test//EN','X-WR-CALNAME:Original Feed',
'BEGIN:VEVENT','UID:practice-1','SUMMARY:Swim Practice','DESCRIPTION:Lap workout','LOCATION:Community Pool','DTSTART;TZID=America/New_York:20261103T160000','DTEND;TZID=America/New_York:20261103T170000','END:VEVENT',
'BEGIN:VEVENT','UID:all-day-1','SUMMARY:Team Holiday','DTSTART;VALUE=DATE:20261101','DTEND;VALUE=DATE:20261102','END:VEVENT',
'BEGIN:VEVENT','UID:multi-day-1','SUMMARY:Training Camp','DTSTART;VALUE=DATE:20261104','DTEND;VALUE=DATE:20261106','END:VEVENT',
'BEGIN:VEVENT','UID:overnight-1','SUMMARY:Overnight Timed','DTSTART:20261105T230000','DTEND:20261106T020000','END:VEVENT',
'BEGIN:VEVENT','UID:weekly-1','SUMMARY:Weekly Meeting','DTSTART:20261102T100000','DTEND:20261102T110000','RRULE:FREQ=WEEKLY;COUNT=3','END:VEVENT',
'BEGIN:VEVENT','UID:exception-1','SUMMARY:Skip One','DTSTART:20261101T120000','RRULE:FREQ=DAILY;COUNT=3','EXDATE:20261102T120000','END:VEVENT',
'BEGIN:VEVENT','UID:next-month-1','SUMMARY:December Meet','DTSTART:20261208T080000Z','DTEND:20261208T090000Z','END:VEVENT',
'END:VCALENDAR'
].join('\r\n');
test.beforeEach(async({page})=>{
 await page.clock.setFixedTime(new Date('2026-11-01T12:00:00Z'));
 await page.addInitScript(()=>localStorage.setItem('daylight-onboarded','yes'));
 await page.goto('/');
});
test('subscription fetches ICS TEXT, keeps chosen name, expands and refreshes with no duplicates',async({page})=>{
 let requests=0;
 await page.route('https://calendar.test/feed.ics',route=>{requests++;return route.fulfill({status:200,contentType:'text/calendar',headers:{'access-control-allow-origin':'*'},body:FEED})});
 await page.locator('#integrationsNav').click();
 await page.locator('#integrationSubscribe').click();
 await expect(page.locator('#subscribeDialog')).toBeVisible();
 await page.locator('#subscribeName').fill('My Swim Calendar');
 await page.locator('#subscribeURL').fill('https://calendar.test/feed.ics');
 await page.locator('#subscribeSubmit').click();
 await expect(page.locator('#subscriptionList .subscription-row')).toContainText('My Swim Calendar');
 await expect(page.locator('#subscriptionList .subscription-row')).toContainText('Last fetched');
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('daylight-events-v1')||'[]').filter(x=>x.sourceId));
 let entries=await read();
 expect(entries.filter(e=>e.title==='Weekly Meeting')).toHaveLength(3);
 expect(entries.filter(e=>e.title==='Training Camp').map(e=>e.date).sort()).toEqual(['2026-11-04','2026-11-05']);
 expect(entries.filter(e=>e.title==='Overnight Timed').map(e=>e.date).sort()).toEqual(['2026-11-05','2026-11-06']);
 expect(entries.filter(e=>e.title==='Team Holiday')).toHaveLength(1);
 expect(entries.some(e=>e.title==='December Meet'&&e.date==='2026-12-08')).toBeTruthy();
 expect(entries.find(e=>e.title==='Swim Practice').location).toBe('Community Pool');
 expect(entries.filter(e=>e.title==='Skip One').map(e=>e.date).sort()).toEqual(['2026-11-01','2026-11-03']);
 await page.locator('#integrationsSubscriptions .subscription-row [data-refresh]').click();
 await expect.poll(()=>requests).toBe(2);
 expect(await read()).toEqual(entries);
 await page.locator('.nav[data-view="month"]').click();
 await expect(page.locator('.daycell[data-day="2026-11-03"]')).toContainText('Swim Practice');
 await page.locator('.daycell[data-day="2026-11-03"] [data-event]').first().click();
 await expect(page.locator('#detailCalendar')).toHaveText('My Swim Calendar');
 await expect(page.locator('#detailEdit')).toBeHidden();
 await page.locator('#detailDialog').evaluate(e=>e.close());
 await page.evaluate(()=>window.DaylightBridge.changeView('agenda'));
 await page.locator('#agendaMore').click();
 await expect(page.locator('.agenda')).toContainText('December Meet');
 await page.locator('#integrationsNav').click();
 await page.locator('#integrationsSubscriptions .subscription-row [data-remove]').click();
 expect(await read()).toHaveLength(0);
});
test('feed name used if Name blank; HTML is a human-readable error, never JSON',async({page})=>{
 await page.route('https://calendar.test/schedule.ics',route=>route.fulfill({status:200,contentType:'text/calendar',headers:{'access-control-allow-origin':'*'},body:FEED}));
 await page.route('https://calendar.test/not-a-calendar',route=>route.fulfill({status:200,contentType:'text/html',headers:{'access-control-allow-origin':'*'},body:'<!doctype html><html><body>Not an ICS file</body></html>'}));
 await page.locator('#integrationsNav').click();
 await page.locator('#integrationSubscribe').click();
 await page.locator('#subscribeURL').fill('https://calendar.test/schedule.ics');
 await page.locator('#subscribeSubmit').click();
 await expect(page.locator('#subscriptionList .subscription-row').first()).toContainText('Original Feed');
 await page.locator('#integrationSubscribe').click();
 await page.locator('#subscribeName').fill('Bad link');
 await page.locator('#subscribeURL').fill('https://calendar.test/not-a-calendar');
 await page.locator('#subscribeSubmit').click();
 const bad=page.locator('#subscriptionList .subscription-row').filter({hasText:'Bad link'});
 await expect(bad).toContainText("That link didn't return a calendar file.");
 await expect(bad).not.toContainText('JSON');
 await expect(page.locator('#toast')).toContainText("That link didn't return a calendar file.");
});
test('autocomplete commits click or keyboard choice and retains pairing only until edit',async({page})=>{
 await page.route('https://photon.komoot.io/api/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({features:[
   {properties:{name:'Riverfront Pool',street:'Main St',housenumber:'18',city:'Richmond',state:'Virginia',country:'United States'}},
   {properties:{name:'Central Park',city:'New York',state:'New York',country:'United States'}}
 ]})}));
 await page.locator('#addSide').click();
 await page.locator('#eventName').fill('Planning');
 await page.locator('#eventSave').click();await page.locator('#eventSave').click();
 await page.locator('#eventLocation').fill('Riverfront');
 await expect(page.locator('#addressResults .address-option')).toHaveCount(2);
 await page.locator('#addressResults .address-option').first().click();
 await expect(page.locator('#eventLocation')).toHaveValue(/Riverfront Pool, 18 Main St, Richmond/);
 await expect(page.locator('#savedAddressLine')).toContainText('Full address saved:');
 await page.locator('#eventLocation').fill('Central');
 await expect(page.locator('#savedAddressLine')).toBeHidden();
 await expect(page.locator('#addressResults .address-option')).toHaveCount(2);
 await page.locator('#eventLocation').press('ArrowDown');
 await page.locator('#eventLocation').press('ArrowDown');
 await page.locator('#eventLocation').press('Enter');
 await expect(page.locator('#eventLocation')).toHaveValue(/Central Park, New York/);
 await expect(page.locator('#savedAddressLine')).toContainText('Full address saved:');
 await expect(page.locator('#wizardCount')).toHaveText('STEP 3 OF 4');
});
test('new load always uses TODAY and default view rather than stale last view/date',async({page})=>{
 await page.evaluate(()=>{localStorage.setItem('daylight-default-view','week');localStorage.setItem('daylight-last-view','month');localStorage.setItem('daylight-last-date','2026-12-17')});
 await page.reload();
 await expect(page.locator('.week-board:not(.day-board)')).toBeVisible();
 await expect(page.locator('#pageTitle')).toContainText('November');
 await page.evaluate(()=>{localStorage.setItem('daylight-default-view','month');localStorage.setItem('daylight-last-view','week');localStorage.setItem('daylight-last-date','2026-12-17')});
 await page.reload();
 await expect(page.locator('.monthgrid')).toBeVisible();
 await expect(page.locator('#pageTitle')).toContainText('November');
});
test('collapsed rail has zero nav text; labeled icon and calendar-dot tooltips',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.locator('#collapseSidebar').click();
 await expect(page.locator('.app')).toHaveClass(/sidebar-collapsed/);
 for(const [selector,label] of [['.sidebar-middle .nav[data-view="month"]','Calendar'],['#integrationsNav','Integrations'],['#tasksNav','Tasks'],['#settingsNav','Settings'],['#aboutNav','About']]){
   const item=page.locator(selector);
   await expect(item).toHaveCSS('font-size','0px');
   await item.hover();
   await expect(page.locator('#railTooltip')).toHaveText(label,{timeout:2500});
   await expect(page.locator('#railTooltip')).toBeVisible();
 }
 const dot=page.locator('.rail-calendar-dot').first();
 const label=await dot.getAttribute('aria-label');
 await dot.hover();
 await expect(page.locator('#railTooltip')).toHaveText(label,{timeout:2500});
 const dimensions=await page.locator('.sidebar').boundingBox();
 expect(dimensions.width).toBeLessThanOrEqual(72);
});
test('center Settings and Tasks; task primary; date pickers; accent live; flat weekends and month plus',async({page})=>{
 await page.setViewportSize({width:1920,height:1080});
 await page.locator('#settingsNav').click();
 const settings=await page.evaluate(()=>{const el=document.querySelector('#settingsPage .settings-layout'),main=document.querySelector('.main'),r=el.getBoundingClientRect(),m=main.getBoundingClientRect();return {left:r.left-m.left,right:m.right-r.right}});
 expect(Math.abs(settings.left-settings.right)).toBeLessThan(12);
 await page.locator('#accentHex').fill('#8B7CFF');
 await expect(page.locator('.custom-accent-trigger')).toHaveCSS('background-color','rgb(139, 124, 255)');
 await page.locator('#tasksNav').click();
 const tasks=await page.evaluate(()=>{const el=document.querySelector('#tasksPage .tasks-board'),main=document.querySelector('.main'),r=el.getBoundingClientRect(),m=main.getBoundingClientRect();return {left:r.left-m.left,right:m.right-r.right}});
 expect(Math.abs(tasks.left-tasks.right)).toBeLessThan(12);
 await page.locator('#newTask').click();
 await expect(page.locator('#taskForm button[type="submit"]')).toHaveCSS('background-color',await page.locator('#addSide').evaluate(x=>getComputedStyle(x).backgroundColor));
 await page.locator('.task-due-button').click();
 await expect(page.locator('.task-date-panel')).toBeVisible();
 await page.locator('.task-date-panel [data-day]').first().click();
 await page.locator('#taskDialog [data-close]').first().click();
 if(await page.locator('#taskDiscardPrompt').isVisible())await page.locator('#discardTask').click();
 await expect(page.locator('#taskDialog')).toBeHidden();
 await page.locator('.nav[data-view="month"]').click();
 await page.evaluate(()=>window.DaylightBridge.changeView('week'));
 const flat=await page.locator('.week-day-track').first().evaluate(x=>getComputedStyle(x).backgroundImage);
 expect(await page.locator('.weekend-track').first().evaluate(x=>getComputedStyle(x).backgroundImage)).toBe(flat);
 await page.evaluate(()=>window.DaylightBridge.changeView('month'));
 const p=await page.locator('.daycell').first().evaluate(x=>{const a=x.querySelector('.cell-add').getBoundingClientRect(),b=x.getBoundingClientRect();return{top:a.top-b.top,right:b.right-a.right}});
 expect(p.top).toBeLessThanOrEqual(9);expect(p.right).toBeLessThanOrEqual(10);
 await page.locator('#addSide').click();await page.locator('#eventName').fill('Meeting');
 await page.locator('#eventSave').click();
 await page.locator('#startDatePicker').click();
 await expect(page.locator('#pickerPanel')).toBeVisible();
 await expect(page.locator('#pickerPanel')).toHaveCSS('overflow-y','auto');
 await page.locator('#pickerOverlay').evaluate(el=>el.hidden=true);
 await page.locator('#eventSave').click();
 await expect(page.locator('#wizardDiscard')).toBeHidden();
 await page.locator('#wizardBack').click();
 await expect(page.locator('#wizardDiscard')).toBeHidden();
});
