import {test,expect} from '@playwright/test';
test.use({timezoneId:'America/New_York'});
async function launch(page,theme='dark'){
 await page.clock.setFixedTime(new Date('2026-11-02T11:12:00-05:00'));
 await page.addInitScript(preferred=>{localStorage.removeItem('daylight-local-ui-v1');localStorage.setItem('daylight-theme',preferred)},theme);
 await page.goto('/');
 await expect(page.locator('.shell')).toBeVisible();
 await expect(page.locator('#login')).toHaveCount(0);
 await expect(page.locator('#addEventHeader')).toBeVisible();
 if(theme==='light'){
  await page.locator('#settingsButton').click();
  await page.locator('[data-sec="appearance"]').click();
  await page.locator('[data-theme="light"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.locator('#settingsModal .dialog-close').click();
 }else await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.waitForTimeout(400);
}
async function changeView(page,view){
 await page.locator('#settingsButton').click();
 await page.locator('[data-sec="calendar"]').click();
 await page.locator('[data-select="default_view"]').click();
 await page.locator('#floatingMenu [data-item]').filter({hasText:new RegExp('^'+view+'$','i')}).click();
 await page.locator('#settingsModal .dialog-close').click();
}
for(const theme of ['dark','light']){
 for(const size of [{width:1920,height:1080},{width:1366,height:768}]){
  test(`local Daylight ${theme} ${size.width}×${size.height} visual sweep`,async({page})=>{
   await page.setViewportSize(size);
   await launch(page,theme);
   const shot=async name=>page.screenshot({path:`test-results/daylight-local-${theme}-${size.width}-${name}.png`});
   if(size.height===768){
    await expect(page.locator('#calList .cal-row').first()).toBeInViewport();
    await expect(page.locator('.side-support')).toBeInViewport();
   }
   const frame=await page.locator('.shell').boundingBox();
   expect(frame.width).toBeCloseTo(size.width,0);
   await expect(page.locator('.weekwrapper')).toBeVisible();
   await shot('week');
   await changeView(page,'Month');
   await expect(page.locator('.monthcell')).toHaveCount(35);
   const boxes=await page.locator('.monthcell').evaluateAll(els=>els.map(x=>{const b=x.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),h:Math.round(b.height)}}));
   expect(new Set(boxes.slice(0,7).map(x=>x.y)).size).toBe(1);
   expect(new Set(boxes.map(x=>x.h)).size).toBe(1);
   await shot('month');
   await changeView(page,'Day');await shot('day');
   await changeView(page,'Agenda');await shot('agenda');
   await page.locator('#settingsButton').click();
   const bounds=await page.locator('#settingsModal').boundingBox();
   for(const section of ['general','calendar','appearance','data','notifications','about']){
    await page.locator(`[data-sec="${section}"]`).click();
    const b=await page.locator('#settingsModal').boundingBox();
    expect(Math.abs(b.width-bounds.width)).toBeLessThan(1);
    expect(Math.abs(b.height-bounds.height)).toBeLessThan(1);
   }
   await shot('settings');
   await page.locator('#settingsModal .dialog-close').click();
   await page.locator('#addEventHeader').click();
   await expect(page.locator('#quickForm')).toBeVisible();
   await shot('editor');
   await page.locator('#editorClose').click();
   await page.locator('[data-nav="tasks"]').click();await shot('tasks');
   await page.locator('[data-nav="integrations"]').click();await shot('integrations');
  });
 }
}
test('local create, rename, reload and task toggle need no API',async({page})=>{
 await launch(page);
 await page.locator('#addEventHeader').click();
 await page.locator('#quickTitle').fill('Local test event');
 await page.locator('#quickSave').click();
 await expect(page.locator('#toast')).toContainText('Event created');
 await page.reload();
 await expect(page.locator('#login')).toHaveCount(0);
 await page.locator('#searchButton').click();
 await page.locator('#searchQuery').fill('Local test event');
 await expect(page.locator('#searchResults')).toContainText('Local test event');
 await page.locator('#searchClose').click();
 await page.locator('#newCalendar').click();
 await page.locator('#calendarFormName').fill('UI colors');
 await page.locator('#calendarFormSave').click();
 await expect(page.locator('#calList')).toContainText('UI colors');
 await page.locator('[data-nav="tasks"]').click();
 await expect(page.locator('[data-done]').first()).toBeVisible();
 await page.locator('[data-done]').first().click();
 await page.reload();
 await page.locator('[data-nav="tasks"]').click();
 await expect(page.locator('.task-filters')).toBeVisible();
});
