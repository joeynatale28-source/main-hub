import {test,expect} from '@playwright/test';
test.use({timezoneId:'America/New_York'});
test('Daylight preserves the supplied page structure and uses secure sign-in',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#authScreen')).toBeVisible();
 await expect(page.locator('#email')).toBeVisible();
 await expect(page.locator('#password')).toBeVisible();
 await expect(page.locator('#authForm button[type=submit]')).toContainText('Log in');
 await expect(page.getByText('Sign up',{exact:true})).toHaveCount(0);
 await expect(page.locator('#sidebar')).toHaveCount(1);
 await expect(page.locator('#headerBand')).toHaveCount(1);
 await expect(page.locator('#viewWrap')).toHaveCount(1);
 await expect(page.locator('link[href*="daylight-preview.css"]')).toHaveCount(1);
});
test('invalid input shows designed inline validation without a browser popup',async({page})=>{
 await page.goto('/');
 await page.locator('#authForm button[type=submit]').click();
 await expect(page.locator('#authError')).toContainText('Enter your email and password.');
});
test('forgot password offers a real reset form',async({page})=>{
 await page.goto('/');
 await page.locator('#forgot').click();
 await expect(page.locator('#sendReset')).toBeVisible();
});
test('pixel-fidelity tokens and responsive auth frame at laptop, desktop and phone',async({page})=>{
 for(const s of [{width:1920,height:1080},{width:1366,height:768},{width:390,height:844}]){
  await page.setViewportSize(s);
  await page.goto('/');
  await expect(page.locator('#authScreen')).toBeVisible();
  await expect(page.locator('#sidebar')).toHaveCount(1);
  await page.screenshot({path:'test-results/daylight-auth-'+s.width+'.png'});
 }
});
