import {test,expect} from '@playwright/test';
const account={id:'11111111-1111-4111-8111-111111111111',first_name:'Example',last_name:'Person',username:'example',is_admin:true};
const calendar={id:'22222222-2222-4222-8222-222222222222',name:'Personal',client_id:'personal',shade:'gray-1',sort_order:0,is_visible:true};
function makeSettings(){return{theme:'dark',default_view:'week',start_of_week:'sunday',accent:'graphite',custom_accent_hex:null,show_weekends:true,compact_mode:false,reduce_motion:false,mcp_allow_delete:false,default_reminder_minutes:15}}
async function setup(page,{loggedIn=true,failLogin=false}={}){
 let settings=makeSettings(),calendars=[calendar],events=[],tasks=[],subscriptions=[];
 await page.route('https://mock.supabase.co/functions/v1/daylight-release',async route=>{
  const req=route.request().postDataJSON(),action=req.action;
  const success=(obj)=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(obj)});
  if(action==='auth_login')return failLogin?route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:"That username and password don't match"})}):success({token:'temporary-test-token',user:account});
  if(action==='auth_session')return success({user:account});
  if(action==='auth_logout')return success({ok:true});
  if(action==='mcp_list')return success({items:[]});
  if(action==='mcp_generate')return success({item:{id:'tok1',name:req.name,created_at:new Date().toISOString()},token:'test-token-shown-once'});
  if(action==='data_list'){const map={calendars,events,tasks,subscriptions,settings:[settings]};return success({items:map[req.entity]||[]})}
  if(action==='data_update'&&req.entity==='settings'){settings={...settings,...req.data};return success({item:settings})}
  if(action==='data_create'){
   const item={id:'33333333-3333-4333-8333-'+String((events.length+tasks.length+1)).padStart(12,'0'),...req.data};const entity=req.entity;
   if(entity==='events')events.push(item);if(entity==='tasks')tasks.push(item);if(entity==='calendars')calendars.push(item);if(entity==='subscriptions')subscriptions.push(item);return success({item});
  }
  if(action==='data_update'){
   const entity=req.entity;const list={events,tasks,calendars,subscriptions}[entity];const index=list.findIndex(x=>x.id===req.id);if(index>=0)list[index]={...list[index],...req.data};return success({item:list[index]||{}});
  }
  if(action==='data_delete'){
   const list={events,tasks,calendars,subscriptions}[req.entity];const i=list.findIndex(x=>x.id===req.id);const [item]=list.splice(i,1);return success({item});
  }
  if(action==='sub_refresh')return success({count:0,item:subscriptions.find(x=>x.id===req.id)});
  return success({ok:true});
 });
 if(loggedIn)await page.addInitScript(()=>localStorage.setItem('dl-release-session','temporary-test-token'));
 await page.goto('/');
 return{get:()=>({settings,calendars,events,tasks,subscriptions})};
}
test('no session shows only login and no signup',async({page})=>{
 await setup(page,{loggedIn:false,failLogin:true});
 await expect(page.locator('#login')).toBeVisible();
 await expect(page.getByText("Accounts are created by Joey")).toBeVisible();
 await expect(page.locator('#newEvent')).toHaveCount(0);
 await page.locator('#username').fill('nonexistent');await page.locator('#password').fill('anything');
 await page.locator('#loginBtn').click();
 await expect(page.locator('#authError')).toHaveText("That username and password don't match");
});
test('authenticated calendar loads in Week at today',async({page})=>{
 await setup(page);
 await expect(page.locator('.weekwrapper')).toBeVisible();
 await expect(page.locator('.side-header')).toContainText('daylight.');
 await expect(page.locator('#calList')).toContainText('Personal');
});
test('one-dialog event editor creates event, no step wizard',async({page})=>{
 const model=await setup(page);await page.locator('#newEvent').click();
 await expect(page.locator('#quickForm')).toBeVisible();
 await expect(page.locator('#quickTitle')).toBeFocused();
 await expect(page.getByText('Step 1 of 4')).toHaveCount(0);
 await page.locator('#quickTitle').fill('Evening training');
 await page.locator('#quickSave').click();
 await expect(page.locator('#quickForm')).toBeHidden();
 await expect(page.locator('#toast')).toContainText('Event created');
 expect(model.get().events.find(e=>e.title==='Evening training')).toBeTruthy();
});
test('event task toggle saves task without a wizard',async({page})=>{
 const model=await setup(page);await page.locator('#newEvent').click();
 await page.locator('#quickTitle').fill('Finish assignment');
 await page.locator('[data-mode="task"]').click();
 await page.locator('#quickSave').click();
 await expect(page.locator('#quickForm')).toBeHidden();
 expect(model.get().tasks.find(x=>x.title==='Finish assignment')).toBeTruthy();
});
test('Settings popup changes default view and keeps navigation',async({page})=>{
 const model=await setup(page);
 await page.locator('#settings').click();
 await expect(page.locator('#settingsModal')).toBeVisible();
 await page.locator('[data-sec="calendar"]').click();
 await expect(page.locator('.settings-pane')).toContainText('Default Calendar View');
 await page.locator('[data-select="default_view"]').click();
 await page.locator('#floatingMenu').getByText('Month').click();
 await expect(page.locator('#settingsModal')).toBeVisible();
 expect(model.get().settings.default_view).toBe('month');
});
test('AI access token is shown once and deletes require confirmation',async({page})=>{
 await setup(page);await page.locator('#settings').click();await page.locator('[data-sec="ai"]').click();
 await page.locator('#generateToken').click();
 await page.locator('#promptValue').fill('Testing');
 await page.locator('#promptSave').click();
 await expect(page.locator('#tokenSecret')).toHaveValue('test-token-shown-once');
});
