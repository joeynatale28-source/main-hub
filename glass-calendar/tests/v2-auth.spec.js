import { test, expect } from '@playwright/test';
const url='https://qrqemjgpzoqhtmsowmqv.supabase.co';
const id='11111111-1111-4111-8111-111111111111';
async function signedIn(page){
 await page.addInitScript(()=>{
  localStorage.setItem('sb-qrqemjgpzoqhtmsowmqv-auth-token',JSON.stringify({
   access_token:'fake-jwt-for-mocked-tests',token_type:'bearer',refresh_token:'test-refresh-token',
   expires_in:3600,expires_at:4102444800,
   user:{id:'11111111-1111-4111-8111-111111111111',email:'tester@daylight.app',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{username:'tester'}}
  }));
 });
 const tables={
 profiles:[{id,username:'tester',display_name:'Test User',first_name:'Test',last_name:'User'}],
 calendars:['personal','work','life','us-holidays'].map((client_id,i)=>({id:['11111111-2222-4111-8111-111111111111','11111111-2222-4111-8111-222222222222','11111111-2222-4111-8111-333333333333','11111111-2222-4111-8111-444444444444'][i],user_id:id,client_id,name:['Personal','Work','Life & plans','US Holidays'][i],color:'#888888',is_visible:true,sort_order:i})),
 events:[],tasks:[],subscriptions:[],
 user_settings:[{user_id:id,theme:'dark',accent:'graphite',default_view:'week',start_of_week:'sunday',reduce_motion:false,mcp_allow_delete:false,extra:{}}],
 mcp_tokens:[]
 };
 await page.route(url+'/**',route=>{
  const req=route.request(),path=new URL(req.url()).pathname,table=path.split('/rest/v1/')[1]?.split('/')[0];
  if(path.includes('/auth/v1/'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id})});
  if(table&&table in tables){
   if(req.method()==='GET')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(tables[table])});
   return route.fulfill({status:201,contentType:'application/json',body:'[]'});
  }
  return route.fulfill({status:200,contentType:'application/json',body:'[]'});
 });
}
test('signed out cannot see calendar shell and has only username fields',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#authGateway')).toBeVisible();
 await expect(page.locator('#authLogin')).toBeVisible();
 await expect(page.locator('#calendarView')).toBeHidden();
 await expect(page.locator('input[type=email]')).toHaveCount(0);
 await page.locator('[data-password-toggle="loginPassword"]').click();
 await expect(page.locator('#loginPassword')).toHaveAttribute('type','text');
 await page.locator('[data-auth-link="recover"]').first().click();
 await expect(page.locator('#authRecover')).toBeVisible();
 await page.locator('#recoverUsername').fill('someone');
 await page.locator('#authRecover [type=submit]').click();
 await expect(page.locator('#authNotice')).toContainText("Password resets aren't available yet");
});
test('signup requires a strong password and valid available username',async({page})=>{
 await page.route(url+'/rest/v1/rpc/username_available',route=>route.fulfill({status:200,contentType:'application/json',body:'true'}));
 await page.goto('/');
 await page.locator('[data-auth-link="signup"]').first().click();
 await page.locator('#signupUsername').fill('new_person');
 await expect(page.locator('#usernameAvailability')).toContainText('Available',{timeout:5000});
 await page.locator('#signupPassword').fill('weakpass');
 await page.locator('#signupConfirm').fill('weakpass');
 await expect(page.locator('#authSignup [type=submit]')).toBeDisabled();
 await page.locator('#signupPassword').fill('StrongPass1!');
 await page.locator('#signupConfirm').fill('StrongPass1!');
 await expect(page.locator('#authSignup [type=submit]')).toBeEnabled();
});
test('authenticated app loads all main views without page takeover',async({page})=>{
 await signedIn(page);await page.goto('/');
 await expect(page.locator('#authGateway')).toBeHidden({timeout:10000});
 await expect(page.locator('.sidebar')).toBeVisible();
 await expect(page.locator('#calendarView')).toBeVisible();
 await page.locator('#integrationsNav').click();
 await expect(page.locator('#integrationsPage')).toBeVisible();
 await expect(page.locator('.sidebar')).toBeVisible();
 await expect(page.locator('#settingsPage')).toBeHidden();
 await page.locator('#v2SettingsNav').click();
 await expect(page.locator('#settingsPage')).toBeVisible();
 const parent=await page.locator('#settingsPage').evaluate(el=>el.parentElement?.className);
 expect(parent).toContain('main');
 await page.locator('#tasksNav').click();
 await expect(page.locator('#tasksPage')).toBeVisible();
 await expect(page.locator('#v2ViewTitle')).toHaveText('Tasks');
});
test('MCP delete switch is off and requires a danger confirmation',async({page})=>{
 await signedIn(page);await page.goto('/');
 await expect(page.locator('#authGateway')).toBeHidden({timeout:10000});
 await page.locator('#v2SettingsNav').click();
 await expect(page.locator('#aiAllowDelete')).not.toBeChecked();
 await page.locator('#aiAllowDelete').click();
 await expect(page.locator('#aiAccessDialog')).toBeVisible();
 await expect(page.locator('#aiAllowDelete')).not.toBeChecked();
 await page.locator('#aiCancel').click();
 await expect(page.locator('#aiAllowDelete')).not.toBeChecked();
});
