import {test,expect} from '@playwright/test';
test.use({timezoneId:'America/New_York'});
async function openLocal(page){
 await page.clock.setFixedTime(new Date('2026-11-02T11:12:00-05:00'));
 await page.goto('/');
 await expect(page.locator('.shell')).toBeVisible();
 await expect(page.locator('#login')).toHaveCount(0);
}
test('opens directly without any account and keeps events across reload',async({page})=>{
 await openLocal(page);
 await expect(page.locator('#addEventHeader')).toBeVisible();
 await page.locator('#addEventHeader').click();
 await page.locator('#quickTitle').fill('Saved locally');
 await page.locator('#quickSave').click();
 await expect(page.locator('#toast')).toContainText('Event created');
 await page.reload();
 await expect(page.locator('.shell')).toBeVisible();
 await page.locator('#searchButton').click();
 await page.locator('#searchQuery').fill('Saved locally');
 await expect(page.locator('#searchResults')).toContainText('Saved locally');
});
test('new calendar, color editing and visibility remain local',async({page})=>{
 await openLocal(page);
 await page.locator('#newCalendar').click();
 await page.locator('#calendarFormName').fill('Visual testing');
 await page.locator('#calendarFormSave').click();
 await expect(page.locator('#calList')).toContainText('Visual testing');
 await page.locator('#calList [data-menu]').last().click();
 await page.locator('#floatingMenu [data-item]').filter({hasText:'Hide'}).click();
 await expect(page.locator('#calList .cal-row').last()).toHaveClass(/dim/);
 await page.reload();
 await expect(page.locator('#calList .cal-row').last()).toHaveClass(/dim/);
});
test('Settings has a local storage panel and theme changes are immediate',async({page})=>{
 await openLocal(page);
 await page.locator('#settingsButton').click();
 await page.locator('[data-sec="data"]').click();
 await expect(page.locator('#settingsPane')).toContainText('Local data');
 await expect(page.locator('#settingsPane')).toContainText('stored in this browser');
 await page.locator('[data-sec="appearance"]').click();
 await page.locator('[data-theme="light"]').click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.locator('#settingsModal .dialog-close').click();
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});
test('task filters work without a database or login',async({page})=>{
 await openLocal(page);
 await page.locator('[data-nav="tasks"]').click();
 await expect(page.locator('[data-task-filter="all"]')).toBeVisible();
 await page.locator('[data-done]').first().click();
 await page.locator('[data-task-filter="completed"]').click();
 await expect(page.locator('[data-task]')).not.toHaveCount(0);
});
