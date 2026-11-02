import { test, expect } from '@playwright/test';

// Entirely mocked auth and data: screenshots never require or expose user credentials.
const uid='11111111-1111-4111-8111-111111111111';
const personal='22222222-2222-4222-8222-222222222222';
const work='33333333-3333-4333-8333-333333333333';
const user={id:uid,email:'demo@example.com',first_name:'Joey',last_name:'Demo',is_admin:false};
const calendars=[
 {id:personal,user_id:uid,client_id:'personal',name:'Personal',shade:'blue',is_visible:true,sort_order:0},
 {id:work,user_id:uid,client_id:'work',name:'Work',shade:'green',is_visible:true,sort_order:1}
];
const events=[
 {id:'44444444-4444-4444-8444-444444444444',calendar_id:personal,title:'Swimming practice',description:'Afternoon session',location_name:'Community Pool',location_address:'100 Pool Road, Richmond, Virginia',starts_at:'2026-11-02T17:00:00-05:00',ends_at:'2026-11-02T18:30:00-05:00',all_day:false,repeat_rule:{frequency:'never'},status:'confirmed'},
 {id:'55555555-5555-4555-8555-555555555555',calendar_id:work,title:'Project planning',description:'',location_name:'',location_address:'',starts_at:'2026-11-03T14:00:00-05:00',ends_at:'2026-11-03T15:00:00-05:00',all_day:false,repeat_rule:{frequency:'never'},status:'confirmed'},
 {id:'66666666-6666-4666-8666-666666666666',calendar_id:personal,title:'Three-day trip',description:'Travel plans',location_name:'',location_address:'',starts_at:'2026-11-09T00:00:00-05:00',ends_at:'2026-11-12T00:00:00-05:00',all_day:true,repeat_rule:{frequency:'never'},status:'confirmed'}
];
const fakeClient=`
export function createClient(){
 const user={id:'11111111-1111-4111-8111-111111111111',email:'demo@example.com'};
 return {auth:{
  onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
  async getUser(){return {data:{user:window.__testSignedOut?null:user},error:null}},
  async getSession(){return {data:{session:window.__testSignedOut?null:{access_token:'mock-access-token',user}},error:null}},
  async signInWithPassword(){return {data:{user},error:{code:'invalid_credentials',message:'Invalid login credentials'}}},
  async resetPasswordForEmail(){return {data:{},error:null}},
  async exchangeCodeForSession(){return {data:{session:null},error:{message:'mock'}}},
  async setSession(){return {data:{session:null},error:{message:'mock'}}},
  async signOut(){return {error:null}}
 }};
}`;
async function stubDaylight(page,theme='light',signedOut=false){
 await page.clock.setFixedTime(new Date('2026-11-02T11:12:00-05:00'));
 await page.addInitScript(({theme,signedOut})=>{
   window.__testSignedOut=signedOut;
   localStorage.setItem('daylight-theme',theme);
 },{theme,signedOut});
 await page.route('**/npm/@supabase/supabase-js@2.49.10/+esm',r=>r.fulfill({status:200,contentType:'application/javascript',body:fakeClient}));
 await page.route('**/functions/v1/daylight-release',async route=>{
  const data=route.request().postDataJSON()||{};
  const settings={id:'77777777-7777-4777-8777-777777777777',user_id:uid,theme,
   default_view:'month',start_of_week:'sunday',show_weekends:true,show_declined_events:true,
   show_week_numbers:false,compact_mode:false,reduce_motion:false};
  let body={};
  if(data.action==='auth_session')body={user};
  else if(data.action==='data_list')body={items:({calendars,events,tasks:[],subscriptions:[],settings:[settings]})[data.entity]||[]};
  else if(data.action==='data_update')body={item:{...settings,...data.data}};
  else body={item:{id:crypto.randomUUID?.()||'88888888-8888-4888-8888-888888888888',...data.data},ok:true};
  await route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(body)});
 });
}

async function setCalendarView(page,view){
 await page.locator('#settingsButton').click();
 await page.locator('[data-sec="calendar"]').click();
 await page.locator('[data-select="default_view"]').click();
 await page.locator('#floatingMenu [data-item]').filter({hasText:new RegExp('^'+view+'
for(const theme of ['light','dark']){
 for(const size of [{width:1920,height:1080},{width:1366,height:768}]){
  test(`Daylight UI ${theme} ${size.width}×${size.height}: all screens and overlays`,async({page})=>{
   await page.setViewportSize(size);
   await stubDaylight(page,theme);
   await page.goto('/');
   await expect(page.locator('.view-header h1')).toHaveText('November 2026');
   await expect(page.locator('.monthcell')).toHaveCount(35);
   const heights=await page.locator('.monthcell').evaluateAll(cells=>cells.map(c=>Math.round(c.getBoundingClientRect().height)));
   expect(new Set(heights).size).toBe(1);
   const shot=async name=>page.screenshot({path:`test-results/daylight-${theme}-${size.width}-${name}.png`});
   await shot('month');
   await setCalendarView(page,'Week');
   await expect(page.locator('.now-line')).toBeVisible();
   await expect(page.locator('.now-time-pill')).toBeVisible();
   await shot('week');
   await setCalendarView(page,'Day');
   await expect(page.locator('.view-range')).toContainText('Monday');
   await shot('day');
   await setCalendarView(page,'Agenda');
   await expect(page.locator('.agenda-item')).toHaveCount(3);
   await shot('agenda');
   await setCalendarView(page,'Month');
   await page.locator('#settingsButton').click();
   const bounds=await page.locator('#settingsModal').boundingBox();
   await expect(page.locator('#settingsModal')).toBeVisible();
   for(const section of ['general','calendar','appearance','data','notifications','ai','about']){
    await page.locator(`[data-sec="${section}"]`).click();
    const next=await page.locator('#settingsModal').boundingBox();
    expect(Math.abs(bounds.width-next.width)).toBeLessThan(1);
    expect(Math.abs(bounds.height-next.height)).toBeLessThan(1);
    if(section==='about')await shot('settings-about');
   }
   await page.locator('#settingsModal .dialog-close').click();
   await page.locator('#addEventHeader').click();
   await expect(page.locator('#quickForm')).toBeVisible();
   await page.locator('#startDateBtn').click();
   await expect(page.locator('.dl-month-button')).toBeVisible();
   await shot('event-picker');
   await page.keyboard.press('Escape');
   await page.locator('#quickSave').click();
   await expect(page.locator('#titleError')).toBeVisible();
   await shot('event-validation');
   await page.locator('#editorClose').click();
   await workspacePage(page,'Tasks');
   await shot('tasks');
   await workspacePage(page,'Integrations');
   await shot('integrations');
   await workspacePage(page,'Calendar');
   await page.locator('.side-header').hover();
   await page.locator('#collapseRail').click();
   await expect.poll(async()=>Math.round((await page.locator('.sidebar').boundingBox()).width)).toBe(64);
   await shot('rail');
  });
 }
}
test('Login shows custom field errors and high contrast primary action',async({page})=>{
 await page.setViewportSize({width:1366,height:768});
 await stubDaylight(page,'dark',true);
 await page.goto('/');
 await expect(page.locator('.login')).toBeVisible();
 const color=await page.locator('#loginBtn').evaluate(e=>({bg:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color}));
 expect(color.bg).not.toBe(color.color);
 await page.locator('#loginBtn').click();
 await expect(page.locator('#emailHelp')).toContainText('Enter a valid email');
 await expect(page.locator('#passwordHelp')).toContainText('Enter your password');
 await page.screenshot({path:'test-results/daylight-dark-1366-login.png'});
});
,'i')}).click();
 await page.locator('#settingsModal .dialog-close').click();
 await expect(page.locator('.view-header h1')).toHaveText(/November 2026|Agenda/);
}
async function workspacePage(page,destination){
 await page.locator('#workspaceMenu').click();
 await page.locator('#floatingMenu [data-item]').filter({hasText:new RegExp('^'+destination+'
for(const theme of ['light','dark']){
 for(const size of [{width:1920,height:1080},{width:1366,height:768}]){
  test(`Daylight UI ${theme} ${size.width}×${size.height}: all screens and overlays`,async({page})=>{
   await page.setViewportSize(size);
   await stubDaylight(page,theme);
   await page.goto('/');
   await expect(page.locator('.view-header h1')).toHaveText('Month');
   await expect(page.locator('.monthcell')).toHaveCount(35);
   const heights=await page.locator('.monthcell').evaluateAll(cells=>cells.map(c=>Math.round(c.getBoundingClientRect().height)));
   expect(new Set(heights).size).toBe(1);
   const shot=async name=>page.screenshot({path:`test-results/daylight-${theme}-${size.width}-${name}.png`});
   await shot('month');
   await page.locator('[data-view-switch=week]').click();
   await expect(page.locator('.now-line')).toBeVisible();
   await expect(page.locator('.now-gutter-dot')).toBeVisible();
   await shot('week');
   await page.locator('[data-view-switch=day]').click();
   await expect(page.locator('.view-range')).toContainText('Monday');
   await shot('day');
   await page.locator('[data-view-switch=agenda]').click();
   await expect(page.locator('.agenda-item')).toHaveCount(3);
   await shot('agenda');
   await page.locator('[data-view-switch=month]').click();
   await page.locator('#settingsButton').click();
   const bounds=await page.locator('#settingsModal').boundingBox();
   await expect(page.locator('#settingsModal')).toBeVisible();
   for(const section of ['general','calendar','appearance','data','notifications','ai','about']){
    await page.locator(`[data-sec="${section}"]`).click();
    const next=await page.locator('#settingsModal').boundingBox();
    expect(Math.abs(bounds.width-next.width)).toBeLessThan(1);
    expect(Math.abs(bounds.height-next.height)).toBeLessThan(1);
    if(section==='about')await shot('settings-about');
   }
   await page.locator('#settingsModal .dialog-close').click();
   await page.locator('#newEvent').click();
   await expect(page.locator('#quickForm')).toBeVisible();
   await page.locator('#startDateBtn').click();
   await expect(page.locator('.dl-month-button')).toBeVisible();
   await shot('event-picker');
   await page.keyboard.press('Escape');
   await page.locator('#quickSave').click();
   await expect(page.locator('#titleError')).toBeVisible();
   await shot('event-validation');
   await page.locator('#editorClose').click();
   await page.locator('[data-nav=tasks]').click();
   await shot('tasks');
   await page.locator('[data-nav=integrations]').click();
   await shot('integrations');
   await page.locator('[data-nav=calendar]').click();
   await page.locator('#collapseRail').click();
   await expect.poll(async()=>Math.round((await page.locator('.sidebar').boundingBox()).width)).toBe(64);
   await shot('rail');
  });
 }
}
test('Login shows custom field errors and high contrast primary action',async({page})=>{
 await page.setViewportSize({width:1366,height:768});
 await stubDaylight(page,'dark',true);
 await page.goto('/');
 await expect(page.locator('.login')).toBeVisible();
 const color=await page.locator('#loginBtn').evaluate(e=>({bg:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color}));
 expect(color.bg).not.toBe(color.color);
 await page.locator('#loginBtn').click();
 await expect(page.locator('#emailHelp')).toContainText('Enter a valid email');
 await expect(page.locator('#passwordHelp')).toContainText('Enter your password');
 await page.screenshot({path:'test-results/daylight-dark-1366-login.png'});
});
,'i')}).click();
}

test.use({timezoneId:'America/New_York'});
for(const theme of ['light','dark']){
 for(const size of [{width:1920,height:1080},{width:1366,height:768}]){
  test(`Daylight UI ${theme} ${size.width}×${size.height}: all screens and overlays`,async({page})=>{
   await page.setViewportSize(size);
   await stubDaylight(page,theme);
   await page.goto('/');
   await expect(page.locator('.view-header h1')).toHaveText('Month');
   await expect(page.locator('.monthcell')).toHaveCount(35);
   const heights=await page.locator('.monthcell').evaluateAll(cells=>cells.map(c=>Math.round(c.getBoundingClientRect().height)));
   expect(new Set(heights).size).toBe(1);
   const shot=async name=>page.screenshot({path:`test-results/daylight-${theme}-${size.width}-${name}.png`});
   await shot('month');
   await page.locator('[data-view-switch=week]').click();
   await expect(page.locator('.now-line')).toBeVisible();
   await expect(page.locator('.now-gutter-dot')).toBeVisible();
   await shot('week');
   await page.locator('[data-view-switch=day]').click();
   await expect(page.locator('.view-range')).toContainText('Monday');
   await shot('day');
   await page.locator('[data-view-switch=agenda]').click();
   await expect(page.locator('.agenda-item')).toHaveCount(3);
   await shot('agenda');
   await page.locator('[data-view-switch=month]').click();
   await page.locator('#settingsButton').click();
   const bounds=await page.locator('#settingsModal').boundingBox();
   await expect(page.locator('#settingsModal')).toBeVisible();
   for(const section of ['general','calendar','appearance','data','notifications','ai','about']){
    await page.locator(`[data-sec="${section}"]`).click();
    const next=await page.locator('#settingsModal').boundingBox();
    expect(Math.abs(bounds.width-next.width)).toBeLessThan(1);
    expect(Math.abs(bounds.height-next.height)).toBeLessThan(1);
    if(section==='about')await shot('settings-about');
   }
   await page.locator('#settingsModal .dialog-close').click();
   await page.locator('#newEvent').click();
   await expect(page.locator('#quickForm')).toBeVisible();
   await page.locator('#startDateBtn').click();
   await expect(page.locator('.dl-month-button')).toBeVisible();
   await shot('event-picker');
   await page.keyboard.press('Escape');
   await page.locator('#quickSave').click();
   await expect(page.locator('#titleError')).toBeVisible();
   await shot('event-validation');
   await page.locator('#editorClose').click();
   await page.locator('[data-nav=tasks]').click();
   await shot('tasks');
   await page.locator('[data-nav=integrations]').click();
   await shot('integrations');
   await page.locator('[data-nav=calendar]').click();
   await page.locator('#collapseRail').click();
   await expect.poll(async()=>Math.round((await page.locator('.sidebar').boundingBox()).width)).toBe(64);
   await shot('rail');
  });
 }
}
test('Login shows custom field errors and high contrast primary action',async({page})=>{
 await page.setViewportSize({width:1366,height:768});
 await stubDaylight(page,'dark',true);
 await page.goto('/');
 await expect(page.locator('.login')).toBeVisible();
 const color=await page.locator('#loginBtn').evaluate(e=>({bg:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color}));
 expect(color.bg).not.toBe(color.color);
 await page.locator('#loginBtn').click();
 await expect(page.locator('#emailHelp')).toContainText('Enter a valid email');
 await expect(page.locator('#passwordHelp')).toContainText('Enter your password');
 await page.screenshot({path:'test-results/daylight-dark-1366-login.png'});
});
