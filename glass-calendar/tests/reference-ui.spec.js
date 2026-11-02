import {test,expect} from '@playwright/test';
test.use({timezoneId:'America/New_York'});
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.removeItem('daylight-reference-ui-v1'));await page.reload()});
test('new supplied page loads with no login and six month weeks',async({page})=>{
 await expect(page.locator('#sidebar .brand-name')).toHaveText('daylight.');
 await expect(page.locator('#headerBand #addBtn')).toBeVisible();
 await expect(page.locator('.month-week')).toHaveCount(6);
 await expect(page.locator('.day-cell')).toHaveCount(42);
 await expect(page.locator('#login')).toHaveCount(0);
});
test('local event creation, search and reload persist',async({page})=>{
 await page.locator('#addBtn').click();await page.locator('#efTitle').fill('UI workflow event');await page.locator('#dlgConfirm').click();
 await expect(page.locator('#toastRoot')).toContainText('Event created');await page.reload();
 await page.locator('#searchBtn').click();await page.locator('#palInput').fill('UI workflow event');
 await expect(page.locator('#palResults')).toContainText('UI workflow event');
});
test('settings change view and light theme',async({page})=>{
 await page.locator('#settingsBtn').click();await page.locator('.sr-item').filter({hasText:'Appearance'}).click();
 await page.locator('[data-mode="light"]').click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.locator('.sr-item').filter({hasText:'Calendar'}).click();
 await page.locator('#viewSetting').selectOption('week');
 await page.locator('#settingsClose').click();await expect(page.locator('.tg-wrap')).toBeVisible();
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});
test('add calendar and persist visibility',async({page})=>{
 await page.locator('#newCal').click();await page.locator('#ncName').fill('Visual testing');await page.locator('#dlgConfirm').click();
 await expect(page.locator('#calList')).toContainText('Visual testing');await page.locator('.cal-dot').first().click();
 await page.reload();await expect(page.locator('#calList')).toContainText('Visual testing');
 await expect(page.locator('#calList .cal-dot').first()).toHaveClass(/off/);
});
test('capture supplied design in dark and light at two sizes',async({page})=>{
 for(const mode of ['dark','light'])for(const size of [{width:1366,height:768},{width:1920,height:1080}]){
  await page.setViewportSize(size);await page.locator('#settingsBtn').click();
  await page.locator('.sr-item').filter({hasText:'Appearance'}).click();await page.locator('[data-mode="'+mode+'"]').click();await page.locator('#settingsClose').click();
  await page.screenshot({path:'test-results/supplied-'+mode+'-'+size.width+'-month.png'});
  await page.locator('#settingsBtn').click();await page.locator('.sr-item').filter({hasText:'Calendar'}).click();await page.locator('#viewSetting').selectOption('week');await page.locator('#settingsClose').click();
  await page.screenshot({path:'test-results/supplied-'+mode+'-'+size.width+'-week.png'});
 }
});
