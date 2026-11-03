import {test,expect} from '@playwright/test';
test('Supabase login keeps the supplied split-panel Daylight design',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#authScreen')).toBeVisible({timeout:15000});
 await expect(page.locator('.auth-form-panel')).toBeVisible();
 await expect(page.locator('.auth-visual-panel')).toBeVisible();
 await expect(page.locator('.auth-headline')).toHaveText('Sign in');
 await expect(page.locator('#authEmail')).toBeVisible();
 await expect(page.locator('#authPassword')).toBeVisible();
 await expect(page.locator('#app')).toBeHidden();
 await expect(page.locator('link[href="style.css"]')).toHaveCount(1);
 await expect(page.locator('.auth-art-card')).toContainText('Swim practice');
});
test('Signup preserves supplied fields, password rules and show/hide interactions',async({page})=>{
 await page.goto('/');
 await page.locator('#authSwitch').click();
 await expect(page.locator('.auth-headline')).toHaveText('Create account');
 await expect(page.locator('#authName')).toBeVisible();
 await expect(page.locator('#authEmail')).toBeVisible();
 await page.locator('#authPassword').fill('Weak');
 await expect(page.locator('.auth-rule.ok')).toHaveCount(1);
 await page.locator('#authPassword').fill('Testpass123');
 await expect(page.locator('.auth-rule.ok')).toHaveCount(3);
 await page.locator('#authEye').click();
 await expect(page.locator('#authPassword')).toHaveAttribute('type','text');
 await expect(page.locator('.auth-terms')).toContainText('Terms of Service');
});
test('Validation prevents empty and malformed account requests',async({page})=>{
 await page.goto('/');
 await page.locator('#authSubmit').click();
 await expect(page.locator('.auth-pill.err')).toHaveCount(1);
 await expect(page.locator('#authMessage')).toContainText('Enter a valid email address');
 await page.locator('#authEmail').fill('example@example.com');
 await page.locator('#authSubmit').click();
 await expect(page.locator('#authMessage')).toContainText("Password can't be empty");
});
test('Password reset uses the supplied login shell, not calendar UI',async({page})=>{
 await page.goto('/');
 await page.locator('#authForgot').click();
 await expect(page.locator('.auth-headline')).toHaveText('Reset password');
 await expect(page.locator('#authEmail')).toBeVisible();
 await expect(page.locator('#app')).toBeHidden();
});
test('MCP OAuth approval route exists and gates access behind login',async({page})=>{
 await page.goto('/oauth/consent/?authorization_id=test-request');
 await expect(page.locator('#authScreen')).toBeVisible({timeout:15000});
 await expect(page.locator('#app')).toBeHidden();
 await expect(page.locator('.auth-headline')).toHaveText('Sign in');
});
test('Small-screen auth uses original responsive one-panel mode',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await expect(page.locator('.auth-form-panel')).toBeVisible();
 await expect(page.locator('.auth-visual-panel')).toBeHidden();
 await expect(page.locator('#authSubmit')).toBeInViewport();
});
