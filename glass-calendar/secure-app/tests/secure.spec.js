import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{page.on('pageerror',err=>console.log('DAYLIGHT PAGE ERROR:',err.message,err.stack));page.on('console',msg=>{if(msg.type()==='error')console.log('DAYLIGHT CONSOLE ERROR:',msg.text())})});
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

test('SVG icons and the mini-calendar grid use consistent dimensions',async({page})=>{
 await setup(page);
 await expect(page.locator('#mini .mini-date')).toHaveCount(42);
 const v=await page.evaluate(()=>{const r=document.querySelector('#miniPrev').getBoundingClientRect(),s=document.querySelector('#miniNext').getBoundingClientRect(),x=document.querySelector('.mini-grid');return{sideBySide:Math.abs(r.y-s.y)<3,columns:getComputedStyle(x).gridTemplateColumns.split(' ').length,icon:document.querySelector('#settingsButton svg')?.getAttribute('viewBox'),height:r.height}});
 expect(v.sideBySide).toBe(true);expect(v.columns).toBe(7);expect(v.icon).toBe('0 0 24 24');expect(v.height).toBe(28);
 await page.locator('#settings').click();
 await page.locator('[data-sec="notifications"]').click();
 await expect(page.locator('[data-sec="notifications"] svg')).toBeVisible();
 await expect(page.locator('#settingsModal')).toBeVisible();
});
test('Settings never changes size, remembers section, searches IANA time zones, and Escape is layered',async({page})=>{
 await setup(page);await page.locator('#settings').click();
 const dialog=page.locator('#settingsModal');
 let box=await dialog.boundingBox();
 expect(box.width).toBeGreaterThan(800);expect(box.height).toBeGreaterThan(580);
 for(const section of ['general','calendar','appearance','data','notifications','ai','about']){
  await page.locator('[data-sec="'+section+'"]').click();
  const next=await dialog.boundingBox();
  expect(Math.abs(next.width-box.width)).toBeLessThan(1);
  expect(Math.abs(next.height-box.height)).toBeLessThan(1);
 }
 await page.locator('[data-sec="general"]').click();
 await page.locator('[data-select="time_zone"]').click();
 await expect(page.locator('#floatingMenu')).toBeVisible();
 expect(await page.locator('#floatingMenu [data-item]').count()).toBeGreaterThan(100);
 await page.locator('#floatingMenu input').fill('Tokyo');
 await page.keyboard.press('Escape');await expect(page.locator('#floatingMenu')).toHaveCount(0);
 await expect(dialog).toBeVisible();
 await page.locator('[data-sec="calendar"]').click();
 await expect(page.locator('[data-time="work_hours_start"]')).not.toContainText(':00:00');
 await page.locator('[data-sec="about"]').click();
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
 await page.locator('#settings').click();
 await expect(page.locator('#settingsPane h2')).toContainText('About');
 await page.reload();await page.locator('#settings').click();
 await expect(page.locator('#settingsPane h2')).toContainText('About');
});
test('appearance controls preview immediately, all switches are 44 x 24',async({page})=>{
 const model=await setup(page);
 await page.locator('#settings').click();await page.locator('[data-sec="appearance"]').click();
 const toggles=await page.evaluate(()=>Array.from(document.querySelectorAll('#settingsPane .switch,#calList .switch')).slice(0,3).map(x=>{const r=x.getBoundingClientRect();return {w:r.width,h:r.height}}));
 for(const x of toggles){expect(x.w).toBe(44);expect(x.h).toBe(24)}
 await page.locator('[data-accent="#3B82F6"]').click();
 await expect(page.locator('[data-accent="#3B82F6"]')).toHaveAttribute('data-picked','true');
 const color=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
 expect(color.toLowerCase()).toBe('#3b82f6');
 await page.locator('.theme-card[data-theme="light"]').click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await expect(page.locator('[data-theme="light"]')).toHaveClass(/picked/);
 await expect.poll(()=>model.get().settings.theme).toBe('light');
});
test('calendar Hide and Unhide persist, inline Rename works, collapse persists',async({page})=>{
 const model=await setup(page);
 const row=page.locator('#calList .cal-row').first();
 await row.locator('[data-menu]').click();
 await page.locator('#floatingMenu [data-item]').filter({hasText:'Hide'}).click();
 await expect(row).toHaveClass(/dim/);
 await expect(row.locator('.switch')).toHaveAttribute('aria-checked','false');
 await expect.poll(()=>model.get().calendars[0].is_visible).toBe(false);
 await page.reload();
 await expect(page.locator('#calList .cal-row').first()).toHaveClass(/dim/);
 await page.locator('#calList .cal-row [data-menu]').first().click();
 await page.locator('#floatingMenu [data-item]').filter({hasText:'Unhide'}).click();
 await expect(page.locator('#calList .cal-row').first()).not.toHaveClass(/dim/);
 await page.locator('#calList .cal-row [data-menu]').first().click();
 await page.locator('#floatingMenu [data-item]').filter({hasText:'Rename'}).click();
 await expect(page.locator('.calendar-rename')).toBeVisible();
 await page.locator('.calendar-rename').fill('Training');
 await page.locator('.calendar-rename').press('Enter');
 await expect(page.locator('#calList')).toContainText('Training');
 await page.locator('#collapseRail').click();
 await expect(page.locator('#root')).toHaveClass(/collapsed/);
 await page.reload();
 await expect(page.locator('#root')).toHaveClass(/collapsed/);
 await page.locator('#collapseRail').click();
 await expect(page.locator('#root')).not.toHaveClass(/collapsed/);
});
test('network failure rolls back Hide; successful changes show no false error',async({page})=>{
 const model=await setup(page);
 await page.route('https://mock.supabase.co/functions/v1/daylight-release',async route=>{
  const req=route.request().postDataJSON();
  if(req.action==='data_update'&&req.entity==='calendars'){
   await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'offline'})});
  }else await route.fallback();
 });
 await page.locator('#calList [data-hide]').first().click();
 await expect(page.locator('#toast')).toContainText("Couldn't save");
 await expect(page.locator('#calList .cal-row').first()).not.toHaveClass(/dim/);
 expect(model.get().calendars[0].is_visible).toBe(true);
});
test('Month today highlight and all-day event edit preserves a one-day date',async({page})=>{
 const model=await setup(page);
 await page.locator('#newEvent').click();
 await page.locator('#quickTitle').fill('One-day event');
 const original=await page.locator('#startDate').inputValue();
 await page.locator('#quickSave').click();
 await expect(page.locator('#quickForm')).toBeHidden();
 await expect.poll(()=>model.get().events.length).toBe(1);
 const item=model.get().events[0];expect(item.all_day).toBe(true);
 await page.locator('[data-detail="'+item.id+'"]').first().click();
 await page.locator('#editEvent').click();
 await expect(page.locator('#startDate')).toHaveValue(original);
 await expect(page.locator('#endDate')).toHaveValue(original);
 await expect(page.locator('#quickSave')).toHaveText('Save');
 await page.locator('#editorClose').click();
 await page.locator('#confirmYes').click();
 await page.locator('#settings').click();await page.locator('[data-sec="calendar"]').click();
 await page.locator('[data-select="default_view"]').click();await page.locator('#floatingMenu [data-item]').filter({hasText:'Month'}).click();
 await page.locator('#settingsModal .dialog-close').click();
 await page.locator('#brand').click();
 await expect(page.locator('.monthcells .datenum.today')).toHaveCount(1);
});
