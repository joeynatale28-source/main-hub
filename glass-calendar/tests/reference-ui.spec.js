import {test,expect} from '@playwright/test';
test.use({timezoneId:'America/New_York'});
async function start(page,theme='dark'){
 await page.clock.setFixedTime(new Date('2026-11-02T11:12:00-05:00'));
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 // Clear once, before the test scenario. Do not erase user data on later reloads.
 await page.evaluate(()=>{localStorage.removeItem('daylight-local-ui-v1');localStorage.removeItem('daylight-preview-ui-settings')});
 await page.reload();
 await expect(page.locator('#sidebar .brand-name')).toHaveText('daylight.');
 await expect(page.locator('.month-week')).toHaveCount(6);
 if(theme==='light'){
  await page.locator('.head-right [title="Settings"]').click();
  await page.locator('[data-section="appearance"]').click();
  await page.locator('[data-theme="light"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.locator('.settings-close').click();
 }else await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 expect(errors).toEqual([]);
}
async function view(page,name){
 await page.locator('.head-right [title="Settings"]').click();
 await page.locator('[data-section="calendar"]').click();
 await page.locator('#csView').selectOption(name.toLowerCase());
 await page.locator('.settings-close').click();
}
for(const theme of ['dark','light']){
 for(const size of [{width:1920,height:1080},{width:1366,height:768}]){
  test(`exact HTML layout ${theme} ${size.width}`,async({page})=>{
   await page.setViewportSize(size);
   await start(page,theme);
   const screenshot=async label=>page.screenshot({path:`test-results/reference-${theme}-${size.width}-${label}.png`});
   const frame=await page.locator('#app').boundingBox();
   expect(frame.width).toBeCloseTo(size.width,0);
   await expect(page.locator('#sidebar')).toBeInViewport();
   await screenshot('month');
   await view(page,'week');
   await expect(page.locator('.tg-day-head')).toHaveCount(7);
   await screenshot('week');
   await view(page,'day');
   await expect(page.locator('.tg-day-head')).toHaveCount(1);
   await screenshot('day');
   await view(page,'agenda');
   await expect(page.locator('.agenda-scroll')).toBeVisible();
   await screenshot('agenda');
   await page.locator('.head-right [title="Settings"]').click();
   const initial=await page.locator('.settings-dialog').boundingBox();
   for(const name of ['general','appearance','calendar','notifications','data','about']){
    await page.locator('[data-section="'+name+'"]').click();
    const next=await page.locator('.settings-dialog').boundingBox();
    expect(Math.abs(next.width-initial.width)).toBeLessThan(1);
    expect(Math.abs(next.height-initial.height)).toBeLessThan(1);
   }
   await screenshot('settings');
   await page.locator('.settings-close').click();
   await page.locator('#addEventHeader').click();
   await expect(page.locator('#efTitle')).toBeVisible();
   await screenshot('editor');
  });
 }
}
test('new HTML: event create edit search persist delete and undo',async({page})=>{
 await start(page);
 await page.locator('#addEventHeader').click();
 await page.locator('#efTitle').fill('Browser event test');
 await page.locator('#efLoc').fill('Studio 101');
 await page.locator('[data-save]').click();
 await expect(page.locator('#toastRoot')).toContainText('Event created');
 await page.reload();
 await expect(page.locator('#sidebar .brand-name')).toHaveText('daylight.');
 await page.keyboard.press('Control+k');
 await page.locator('#palInput').fill('Browser event test');
 await expect(page.locator('.pal-item')).toHaveCount(1);
 await page.locator('.pal-item').first().click();
 await expect(page.locator('.ev-card')).toContainText('Browser event test');
 await page.locator('.ev-card').filter({hasText:'Browser event test'}).click();
 await expect(page.locator('.popover')).toContainText('Studio 101');
 await page.locator('[data-edit]').click();
 await page.locator('#efTitle').fill('Edited local event');
 await page.locator('[data-save]').click();
 await page.reload();
 await page.keyboard.press('Control+k');
 await page.locator('#palInput').fill('Edited local event');
 await expect(page.locator('.pal-item').first()).toContainText('Edited local event');
});
test('new HTML: local calendar rename hide, colors and theme persist',async({page})=>{
 await start(page);
 await page.locator('.cal-row').first().hover();
 await page.locator('.cal-row .cal-menu-btn').first().click();
 await page.locator('.menu-item').filter({hasText:'Rename'}).click();
 await page.locator('.cal-rename').fill('Personal events');
 await page.locator('.cal-rename').press('Enter');
 await expect(page.locator('.cal-name').first()).toHaveText('Personal events');
 await page.locator('.cal-row .cal-dot').first().click();
 await page.reload();
 await expect(page.locator('.cal-name').first()).toHaveText('Personal events');
 await page.locator('.head-right [title="Settings"]').click();
 await page.locator('[data-section="appearance"]').click();
 await page.locator('[data-theme="light"]').click();
 await page.locator('.settings-close').click();
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});
test('new HTML: calendar view set exclusively in Settings, mini date drills and shortcuts',async({page})=>{
 await start(page);
 await expect(page.locator('#headerBand .view-segment')).toHaveCount(0);
 await view(page,'week');
 await page.locator('.tg-day-head .dnum').first().click();
 await expect(page.locator('.tg-day-head')).toHaveCount(1);
 await page.keyboard.press('Control+,');
 await expect(page.locator('.settings-dialog')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('.settings-dialog')).toHaveCount(0);
});
