import {greeting,expandEvents,eventDate,palette} from '../src/polish.js';
import {instances,weekSegments,bounds} from '../src/spans.js';
import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{page.on('pageerror',err=>console.log('DAYLIGHT PAGE ERROR:',err.message,err.stack));page.on('console',msg=>{if(msg.type()==='error')console.log('DAYLIGHT CONSOLE ERROR:',msg.text())})});
const account={id:'11111111-1111-4111-8111-111111111111',first_name:'Example',last_name:'Person',email:'example@example.com',is_admin:true};
const calendar={id:'22222222-2222-4222-8222-222222222222',name:'Personal',client_id:'personal',shade:'gray-1',sort_order:0,is_visible:true};
function makeSettings(){return{theme:'dark',default_view:'week',start_of_week:'sunday',accent:'graphite',custom_accent_hex:null,show_weekends:true,compact_mode:false,reduce_motion:false,mcp_allow_delete:false,default_reminder_minutes:15}}
async function setup(page,{loggedIn=true,failLogin=false}={}){
 let settings=makeSettings(),calendars=[{...calendar}],events=[],tasks=[],subscriptions=[],tokens=[],user={...account};
 await page.route('https://mock.supabase.co/functions/v1/daylight-release',async route=>{
  const req=route.request().postDataJSON(),action=req.action;
  const success=(obj)=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(obj)});
  if(action==='auth_session')return success({user});
  if(action==='user_update'){user={...user,first_name:req.first_name,last_name:req.last_name};return success({user})}
  if(action==='auth_logout')return success({ok:true});
  if(action==='mcp_list')return success({items:tokens});
  if(action==='mcp_generate'){const item={id:'tok'+(tokens.length+1),name:req.name,created_at:new Date().toISOString()};tokens.push(item);return success({item,token:'test-token-shown-once'})}
  if(action==='mcp_revoke'){tokens=tokens.filter(t=>t.id!==req.id);return success({ok:true})}
  if(action==='data_list'){const map={calendars,events,tasks,subscriptions,settings:[settings]};return success({items:map[req.entity]||[]})}
  if(action==='data_update'&&req.entity==='settings'){settings={...settings,...req.data};return success({item:settings})}
  if(action==='data_create'){
   if(req.entity==='subscriptions'&&subscriptions.some(x=>x.url===req.data.url))return route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'That feed is already added.'})});
   const item={id:'33333333-3333-4333-8333-'+String((events.length+tasks.length+1)).padStart(12,'0'),...req.data};const entity=req.entity;
   if(entity==='events')events.push(item);if(entity==='tasks')tasks.push(item);if(entity==='calendars')calendars.push(item);if(entity==='subscriptions')subscriptions.push(item);return success({item});
  }
  if(action==='data_update'){
   const entity=req.entity;const list={events,tasks,calendars,subscriptions}[entity];const index=list.findIndex(x=>x.id===req.id);if(index>=0)list[index]={...list[index],...req.data};return success({item:list[index]||{}});
  }
  if(action==='data_delete'){
   const list={events,tasks,calendars,subscriptions}[req.entity];const i=list.findIndex(x=>x.id===req.id);const [item]=list.splice(i,1);if(req.entity==='calendars')events=events.filter(e=>e.calendar_id!==req.id);return success({item});
  }
  if(action==='sub_refresh')return success({count:0,item:subscriptions.find(x=>x.id===req.id)});
  return success({ok:true});
 });
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({status:200,contentType:'text/javascript',body:'/* sdk stub */'}));
 await page.addInitScript(({loggedIn,failLogin})=>{
  if(loggedIn)localStorage.setItem('qa-auth-session','1');else localStorage.removeItem('qa-auth-session');
  const listeners=[];
  const auth={
   getSession:async()=>({data:{session:localStorage.getItem('qa-auth-session')?{access_token:'mock.jwt.token',user:{id:'11111111-1111-4111-8111-111111111111',email:'example@example.com'}}:null},error:null}),
   signInWithPassword:async()=>{if(failLogin)return{error:new Error('Invalid login credentials'),data:{session:null}};localStorage.setItem('qa-auth-session','1');return{data:{session:{access_token:'mock.jwt.token'}},error:null}},
   signOut:async()=>{localStorage.removeItem('qa-auth-session');listeners.forEach(fn=>fn('SIGNED_OUT',null));return{error:null}},
   resetPasswordForEmail:async()=>({data:{},error:null}),
   updateUser:async()=>({data:{},error:null}),
   onAuthStateChange:fn=>{listeners.push(fn);return{data:{subscription:{unsubscribe:()=>{}}}}}
  };
  window.supabase={createClient:()=>({auth})};
 },{loggedIn,failLogin});
 await page.goto('/');
 return{get:()=>({settings,calendars,events,tasks,subscriptions,tokens,user})};
}
test('no session shows only login and no signup',async({page})=>{
 await setup(page,{loggedIn:false,failLogin:true});
 await expect(page.locator('#login')).toBeVisible();
 await expect(page.locator('#forgotPassword')).toBeVisible();await expect(page.locator('input[type=email]')).toBeVisible();await expect(page.locator('[href*=signup]')).toHaveCount(0);
 await expect(page.locator('#newEvent')).toHaveCount(0);
 await page.locator('#email').fill('nonexistent@example.com');await page.locator('#password').fill('anything');
 await page.locator('#loginBtn').click();
 await expect(page.locator('#authError')).toHaveText('Email or password is incorrect.');
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
test('Appearance uses monochrome theme controls and no accent system',async({page})=>{
 const model=await setup(page);
 await page.locator('#settings').click();await page.locator('[data-sec="appearance"]').click();
 await expect(page.locator('[data-accent],#customAccent')).toHaveCount(0);
 await expect(page.locator('#settingsPane')).not.toContainText('Accent color');
 const switches=await page.evaluate(()=>Array.from(document.querySelectorAll('#settingsPane .switch,#calList .switch')).slice(0,3).map(x=>{const r=x.getBoundingClientRect();return {w:r.width,h:r.height}}));
 for(const x of switches){expect(x.w).toBe(44);expect(x.h).toBe(24)}
 await page.locator('.theme-card[data-theme="light"]').click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await expect(page.locator('.theme-card[data-theme="light"]')).toHaveClass(/picked/);
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
 await expect(page.locator('#quickForm')).toBeHidden();
 await expect(page.locator('#confirmYes')).toHaveCount(0);
 await page.locator('#settings').click();await page.locator('[data-sec="calendar"]').click();
 await page.locator('[data-select="default_view"]').click();await page.locator('#floatingMenu [data-item]').filter({hasText:'Month'}).click();
 await page.locator('#settingsModal .dialog-close').click();
 await page.locator('#brand').click();
 await expect(page.locator('.spanning-month .datenum.today')).toHaveCount(1);
});

const plus=(iso,n)=>{const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
test('month-grid picker commits Start and End and supports a three-day event',async({page})=>{
 const model=await setup(page);await page.locator('#newEvent').click();
 await page.locator('#quickTitle').fill('Three-day conference');
 const original=await page.locator('#startDate').inputValue(),start=plus(original,3),end=plus(original,5);
 await page.locator('#startDateBtn').click();
 await expect(page.locator('#calendarDatePicker [data-date-choice]')).toHaveCount(42);
 await page.locator('[data-date-choice="'+start+'"]').click();
 await expect(page.locator('#startDate')).toHaveValue(start);
 await expect(page.locator('#endDate')).toHaveValue(start);
 await page.locator('#endDateBtn').click();await page.locator('[data-date-choice="'+end+'"]').click();
 await expect(page.locator('#endDate')).toHaveValue(end);
 await page.locator('#quickSave').click();await expect.poll(()=>model.get().events.length).toBe(1);
 const e=model.get().events[0];expect(e.all_day).toBe(true);
 expect(Math.round((new Date(e.ends_at)-new Date(e.starts_at))/864e5)).toBe(3);
 await page.locator('#settings').click();await page.locator('[data-sec="calendar"]').click();
 await page.locator('[data-select="default_view"]').click();await page.locator('#floatingMenu').getByText('Month').click();
 await page.locator('#settingsModal .dialog-close').click();await page.locator('#brand').click();
 for(const d of [start,plus(start,1),end]){
  await expect(page.locator('.span-bar').filter({hasText:'Three-day conference'})).toHaveCount(1);
 }
});
test('native weekly recurrence appears on multiple weeks and popover describes it',async({page})=>{
 const model=await setup(page);await page.locator('#newEvent').click();
 await page.locator('#quickTitle').fill('Weekly swimming');
 await page.locator('#repeatButton').click();await page.locator('#floatingMenu [data-item]').filter({hasText:'Weekly'}).click();
 await page.locator('#quickSave').click();
 await expect.poll(()=>model.get().events.length).toBe(1);
 for(let i=0;i<3;i++){
  await expect(page.locator('.span-week-layer .span-bar').filter({hasText:'Weekly swimming'})).toBeVisible();
  await page.locator('#next').click();
 }
 await page.locator('.span-week-layer .span-bar').filter({hasText:'Weekly swimming'}).first().click();
 await expect(page.locator('dialog[open]').last()).toContainText('Repeats weekly');
 await expect(page.locator('dialog[open]').last()).toContainText('Personal');
});
test('all-day subscribed 3-day event remains one interval on exact stated civil dates',async({page})=>{
 const model=await setup(page);
 const a=plus([new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,'0'),'01'].join('-'),7);
 model.get().events.push({id:'one',calendar_id:calendar.id,source_subscription_id:'44444444-4444-4444-8444-444444444444',title:'Feed three-day',starts_at:a+'T00:00:00.000Z',ends_at:plus(a,3)+'T00:00:00.000Z',all_day:true,repeat_rule:{}});
 model.get().settings.default_view='month';
 await page.reload();
 const bars=page.locator('.spanning-month .span-bar').filter({hasText:'Feed three-day'});
 await expect(bars).toHaveCount(1);
 expect((await bars.first().getAttribute('style'))).toContain('span 3');
 await expect(page.locator('.spanning-month .span-bar').filter({hasText:'Feed three-day'})).toHaveCount(1);
 await page.locator('[data-drill="'+a+'"]').first().click();
 await expect(page.locator('.span-week-layer .span-bar').filter({hasText:'Feed three-day'})).toHaveCount(1);
 await expect(page.locator('.daytrack .span-bar')).toHaveCount(0);
});
test('token revoke removes row immediately, across reload and from mock auth',async({page})=>{
 const model=await setup(page);await page.locator('#settings').click();await page.locator('[data-sec="ai"]').click();
 await page.locator('#generateToken').click();await page.locator('#promptValue').fill('QA');
 await page.locator('#promptSave').click();
 await expect(page.locator('#tokenSecret')).toHaveValue('test-token-shown-once');
 await page.locator('dialog:has(#tokenSecret) .dialog-close').click();
 await expect(page.locator('#tokenList')).toContainText('QA');
 await page.locator('#tokenList [data-revoke]').click();
 await page.locator('#confirmYes').click();
 await expect.poll(()=>model.get().tokens.length).toBe(0);
 await expect(page.locator('#tokenList')).not.toContainText('QA');
 await page.reload();await page.locator('#settings').click();await page.locator('[data-sec="ai"]').click();
 await expect(page.locator('#tokenList')).not.toContainText('QA');
});
test('calendar colors tint chips while primary remains monochrome',async({page})=>{
 const model=await setup(page);
 await page.locator('#newCalendar').click();
 await expect(page.locator('.calendar-color-swatch')).toHaveCount(8);
 await page.locator('#calendarFormName').fill('Swim Team');await page.locator('[data-color="teal"]').click();
 await page.locator('#calendarFormSave').click();
 await expect.poll(()=>model.get().calendars.length).toBe(2);
 await page.locator('#newEvent').click();await page.locator('#quickTitle').fill('Pool workout');
 await page.locator('#eventCalendarBtn').click();
 await page.locator('#floatingMenu [data-item]').filter({hasText:'Swim Team'}).click();
 await page.locator('#quickSave').click();
 await expect.poll(()=>model.get().events.length).toBe(1);
 await page.locator('#settings').click();await page.locator('[data-sec="calendar"]').click();
 await page.locator('[data-select="default_view"]').click();
 await page.locator('#floatingMenu [data-item]').filter({hasText:'Month'}).click();
 await page.locator('#settingsModal .dialog-close').click();await page.locator('#brand').click();
 const item=page.locator('.span-bar').filter({hasText:'Pool workout'});
 await expect(item).toHaveCount(1);
 const eventStyle=await item.getAttribute('style');expect(eventStyle.toLowerCase()).toContain(palette.teal.toLowerCase());
 const primary=await page.locator('#newEvent').evaluate(x=>getComputedStyle(x).backgroundColor);
 expect(primary).not.toEqual('rgb(74, 184, 182)');
});
test('Tasks filters show counts and friendly dates',async({page})=>{
 const model=await setup(page);
 model.get().tasks.push({id:'t1',title:'Spanish homework',due_date:'2026-11-02',completed:false},{id:'t2',title:'Completed project',due_date:'2026-11-01',completed:true});
 await page.reload();await page.locator('[data-nav="tasks"]').click();
 await expect(page.locator('[data-task-filter="all"]')).toContainText('2');
 await expect(page.locator('[data-task-filter="todo"]')).toContainText('1');
 await page.locator('[data-task-filter="todo"]').click();
 await expect(page.locator('.task-row')).toHaveCount(1);
 await expect(page.locator('.task-row')).toContainText('Spanish homework');
 await expect(page.locator('.task-row')).not.toContainText('2026-11-02');
 await page.locator('[data-task-filter="completed"]').click();
 await expect(page.locator('.task-row')).toContainText('Completed project');
});
test('fixed Settings scrolls at 1366 x 768 and About stays structured',async({page})=>{
 await page.setViewportSize({width:1366,height:768});await setup(page);await page.locator('#settings').click();
 const box=await page.locator('#settingsModal').boundingBox();
 for(const section of ['general','calendar','appearance','data','notifications','ai','about']){
  await page.locator('[data-sec="'+section+'"]').click();
  const after=await page.locator('#settingsModal').boundingBox();
  expect(Math.abs(after.height-box.height)).toBeLessThan(1);expect(Math.abs(after.width-box.width)).toBeLessThan(1);
 }
 await page.locator('[data-sec="appearance"]').click();
 await page.locator('#settingsPane').evaluate(el=>el.scrollTop=el.scrollHeight);
 await expect(page.locator('#settingsPane')).toContainText('Reduce motion');
});
test('holiday greeting uses local time bands and holiday overrides',()=>{
 const d=(h)=>new Date(2026,10,2,h,0,0);
 expect(greeting('Alex',d(5))).toContain('Good morning');
 expect(greeting('Alex',d(12))).toContain('Good afternoon');
 expect(greeting('Alex',d(17))).toContain('Good evening');
 expect(greeting('Alex',new Date(2026,9,31,9))).toContain('Happy Halloween');
 expect(greeting('Alex',new Date(2026,10,26,9))).toContain('Happy Thanksgiving');
 expect(greeting('Alex',new Date(2026,11,24,9))).toContain('Christmas Eve');
});
test('calendar delete requires exact name and exposes Undo',async({page})=>{
 const model=await setup(page);
 await page.locator('#calList [data-menu]').first().click();
 await page.locator('#floatingMenu [data-item]').filter({hasText:'Delete calendar'}).click();
 await expect(page.locator('#calendarDeleteConfirm')).toBeDisabled();
 await page.locator('#calendarDeleteName').fill('Personal');
 await expect(page.locator('#calendarDeleteConfirm')).toBeEnabled();
 await page.locator('#calendarDeleteConfirm').click();
 await expect(page.locator('#toast')).toContainText('Calendar deleted');
 await expect(page.locator('#toast .undo-button')).toBeVisible();
 await page.locator('#toast .undo-button').click();
 await expect.poll(()=>model.get().calendars.length).toBe(1);
 await expect(page.locator('#calList')).toContainText('Personal');
});

test('search shows no-match copy and Escape closes without losing the calendar',async({page})=>{
 await setup(page);await page.locator('#searchButton').click();
 await page.locator('#searchQuery').fill('zzzz-no-events-987');
 await expect(page.locator('#searchResults')).toContainText("No results for 'zzzz-no-events-987'");
 await page.locator('#searchQuery').press('Escape');
 await expect(page.locator('#searchBar')).toBeHidden();
 await expect(page.locator('.weekwrapper')).toBeVisible();
});
test('changing start time shifts end by one hour and saves correct duration',async({page})=>{
 const model=await setup(page);await page.locator('#newEvent').click();await page.locator('#quickTitle').fill('Time shift');
 await page.locator('#addTime').click();
 const oldStart=await page.locator('#startTime').inputValue();
 const parts=oldStart.split(':').map(Number),newHour=(parts[0]+2)%24;
 const newStart=String(newHour).padStart(2,'0')+':00';
 await page.locator('[data-pick="startTime"]').click();
 await page.locator('#floatingMenu [data-item]').filter({hasText:newStart}).first().click();
 expect(await page.locator('#startTime').inputValue()).toBe(newStart);
 const end=(await page.locator('#endTime').inputValue()).split(':').map(Number);
 expect((end[0]-newHour+24)%24).toBe(1);
 await page.locator('#quickSave').click();
 await expect.poll(()=>model.get().events.length).toBe(1);
 const ev=model.get().events[0];expect(Math.round((new Date(ev.ends_at)-new Date(ev.starts_at))/60000)).toBe(60);
});
test('changing calendar color re-tints existing event and rail tooltips render',async({page})=>{
 const model=await setup(page);await page.locator('#newEvent').click();
 await page.locator('#quickTitle').fill('Color change');await page.locator('#quickSave').click();
 await expect.poll(()=>model.get().events.length).toBe(1);
 await page.locator('#calList [data-menu]').first().click();
 await page.locator('#floatingMenu [data-item]').filter({hasText:'Change color'}).click();
 await page.locator('[data-color="rose"]').click();await page.locator('#calendarFormSave').click();
 await expect.poll(()=>model.get().calendars[0].shade).toBe('rose');
 await page.locator('#collapseRail').click();
 await page.locator('[data-nav="tasks"]').hover();
 await expect(page.locator('#railTooltip')).toContainText('Tasks');
 await page.locator('#collapseRail').click();
 await page.locator('#settings').click();await page.locator('[data-sec="calendar"]').click();
 await page.locator('[data-select="default_view"]').click();await page.locator('#floatingMenu [data-item]').filter({hasText:'Month'}).click();
 await page.locator('#settingsModal .dialog-close').click();await page.locator('#brand').click();
 const chip=page.locator('.span-bar').filter({hasText:'Color change'});
 await expect(chip).toHaveCount(1);
 expect((await chip.getAttribute('style')).toLowerCase()).toContain(palette.rose);
});
test('editing first name updates sidebar and greeting on the same page',async({page})=>{
 const model=await setup(page);await page.locator('#settings').click();
 await page.locator('#firstName').fill('Taylor');await page.locator('#firstName').press('Enter');
 await expect.poll(()=>model.get().user.first_name).toBe('Taylor');
 await expect(page.locator('.profile')).toContainText('Taylor');
 await page.locator('#settingsModal .dialog-close').click();
 await expect(page.locator('.greeting')).toContainText('Taylor');
});
test('timed cross-midnight and native multi-day expansion includes each civil day',()=>{
 const ev={id:'cross',starts_at:'2026-11-02T23:30:00',ends_at:'2026-11-03T00:30:00',all_day:false,repeat_rule:{frequency:'never'}};
 const expanded=expandEvents([ev],new Date(2026,10,1),new Date(2026,10,6));
 expect(expanded.map(eventDate)).toEqual(['2026-11-02','2026-11-03']);
});

test('multi-day Nov 7–10 is a continuous interval segmented exactly once per week row',()=>{
 const e={id:'span-1',title:'Meet',starts_at:'2026-11-07T00:00:00Z',ends_at:'2026-11-11T00:00:00Z',all_day:true,repeat_rule:{}};
 const all=instances([e],'2026-11-01','2026-11-20');
 expect(all).toHaveLength(1);
 expect(bounds(all[0])).toEqual({first:'2026-11-07',last:'2026-11-10'});
 const left=weekSegments(all,'2026-11-01'),right=weekSegments(all,'2026-11-08');
 expect(left).toHaveLength(1);expect(left[0].startCol).toBe(6);expect(left[0].span).toBe(1);expect(left[0].rightOpen).toBe(true);
 expect(right).toHaveLength(1);expect(right[0].startCol).toBe(0);expect(right[0].span).toBe(3);expect(right[0].leftOpen).toBe(true);
});
test('recurrence EXDATE removes only the selected weekly date',()=>{
 const e={id:'repeat',title:'Weekly swim',starts_at:'2026-11-02T18:00:00Z',ends_at:'2026-11-02T19:00:00Z',all_day:false,repeat_rule:{frequency:'weekly',count:4,ends:'count',exdates:['2026-11-09']}};
 const all=instances([e],'2026-11-01','2026-12-15');
 expect(all.map(x=>x._first)).toEqual(['2026-11-02','2026-11-16','2026-11-23']);
});
test('in-app Cmd/Ctrl+Comma handler opens Settings when the browser delivers the shortcut',async({page})=>{
 await setup(page);
 await page.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:',',code:'Comma',ctrlKey:true,bubbles:true,cancelable:true})));

 await expect(page.locator('#settingsModal')).toBeVisible();
});
test('duplicate subscription URL is blocked inline and list refreshes without closing Settings',async({page})=>{
 const model=await setup(page);await page.locator('#settings').click();await page.locator('[data-sec="data"]').click();
 await page.locator('#addSub').click();await page.locator('#subURL').fill('https://example.org/events.ics');
 await page.locator('#subSave').click();
 await expect.poll(()=>model.get().subscriptions.length).toBe(1);
 await expect(page.locator('#settingsSubs')).toContainText('example.org');
 await page.locator('#addSub').click();await page.locator('#subURL').fill('https://example.org/events.ics');
 await page.locator('#subSave').click();
 await expect(page.locator('#subError')).toContainText('That feed is already added.');
 await expect(page.locator('#subSave')).toBeEnabled();
 expect(model.get().subscriptions.length).toBe(1);
});
test('an occurrence delete opens scope choice and only deletes that instance',async({page})=>{
 const model=await setup(page);await page.locator('#newEvent').click();
 await page.locator('#quickTitle').fill('Recurring run');
 await page.locator('#repeatButton').click();await page.locator('#floatingMenu [data-item]').filter({hasText:'Weekly'}).click();await page.locator('#quickSave').click();
 await expect.poll(()=>model.get().events.length).toBe(1);
 await page.locator('.span-week-layer .span-bar').filter({hasText:'Recurring run'}).first().click();
 await page.locator('#deleteEvent').click();
 await expect(page.locator('#scopeOnly')).toBeVisible();
 await expect(page.locator('#scopeFuture')).toBeVisible();
 await expect(page.locator('#scopeAll')).toBeVisible();
 await page.locator('#scopeOnly').click();
 await expect.poll(()=>model.get().events[0].repeat_rule.exdates?.length).toBe(1);
 expect(model.get().events).toHaveLength(1);
 await page.reload();
 await expect(page.locator('.span-week-layer .span-bar').filter({hasText:'Recurring run'})).toHaveCount(0);
 await page.locator('#next').click();
 await expect(page.locator('.span-week-layer .span-bar').filter({hasText:'Recurring run'})).toBeVisible();
});
test('Month drag-select spanning three days opens a prefilled all-day event form',async({page})=>{
 const model=await setup(page);model.get().settings.default_view='month';await page.reload();
 const first=page.locator('.spanning-month .monthcell').filter({has:page.locator('.datenum')}).nth(8),last=page.locator('.spanning-month .monthcell').nth(10);
 const day1=await first.getAttribute('data-cell'),day3=await last.getAttribute('data-cell');
 const a=await first.boundingBox(),b=await last.boundingBox();
 await page.mouse.move(a.x+a.width/2,a.y+a.height-22);await page.mouse.down();
 await page.mouse.move(b.x+b.width/2,b.y+b.height-22,{steps:6});await page.mouse.up();
 await expect(page.locator('#quickForm')).toBeVisible();
 await expect(page.locator('#startDate')).toHaveValue(day1);
 await expect(page.locator('#endDate')).toHaveValue(day3);
});
