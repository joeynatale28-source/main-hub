/* Supabase-backed in-memory adapter for the existing Daylight UI.
 * All calendar/task/settings records are hydrated from Postgres before UI code runs.
 * Browser localStorage is NOT used for signed-in Daylight application data.
 */
const KEYS={
 events:'daylight-events-v1',calendars:'daylight-calendars-v1',tasks:'daylight-tasks-v1',
 subscriptions:'daylight-subscriptions-v1',theme:'daylight-theme',accent:'daylight-accent',
 name:'daylight-name',view:'daylight-default-view',week:'daylight-week-start'
};
const isoLocal=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const hhmm=d=>String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
const parseJSON=(s,f)=>{try{return JSON.parse(s??'')}catch{return f}};
const shades=['#FAFAFA','#B3B3B3','#8A8A8A','#636363'];
const fromEvent=r=>{
 const start=new Date(r.starts_at),end=new Date(r.ends_at),extra=r.extra||{};
 return {
   ...extra,id:r.client_id||r.id,calendar:extra.calendar||'personal',
   title:r.title,notes:r.description||'',location:r.location_name||'',locationAddress:r.location_address||'',
   date:r.all_day?(extra.date||r.starts_at.slice(0,10)):isoLocal(start),
   time:r.all_day?'00:00':hhmm(start),duration:Math.max(1,Math.round((end-start)/60000)),
   endDate:extra.endDate||undefined,endTime:extra.endTime||undefined,
   allDay:r.all_day,repeat:r.repeat_rule?.kind||'never',
   reminder:r.reminder_offset_minutes===null?'none':({0:'at-time',15:'15m',60:'1h',1440:'1d'}[r.reminder_offset_minutes]||'none')
 };
};
const toEvent=(e,user,map)=>{
 const start=new Date((e.date||isoLocal(new Date()))+'T'+(e.allDay?'00:00':e.time||'09:00')+':00');
 const duration=Math.max(1,Number(e.duration)||60);
 const end=new Date(start.getTime()+duration*60000);
 const offset={none:null,'at-time':0,'15m':15,'1h':60,'1d':1440};
 return {user_id:user,client_id:String(e.id),calendar_id:map.get(e.calendar)||null,title:String(e.title||'Untitled').slice(0,300),
 description:String(e.notes||''),location_name:String(e.location||''),location_address:String(e.locationAddress||''),
 starts_at:start.toISOString(),ends_at:end.toISOString(),all_day:!!e.allDay,
 repeat_rule:{kind:e.repeat||'never'},reminder_offset_minutes:offset[e.reminder]??null,
 extra:{...e,locationAddress:e.locationAddress||''}};
};
function toast(text,retry){
 let root=document.getElementById('cloudToast');
 if(!root){root=document.createElement('div');root.id='cloudToast';root.className='cloud-toast';document.body.append(root)}
 root.replaceChildren();const msg=document.createElement('span');msg.textContent=text;root.append(msg);
 if(retry){const btn=document.createElement('button');btn.type='button';btn.textContent='Retry';btn.onclick=retry;root.append(btn)}
 root.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>root.hidden=true,6500);
}
const checked=(data,table)=>{if(data.error)throw new Error(table+': '+data.error.message);return data.data||[]};
export async function initializeData(supabase,user){
 const owner=user.id;
 const tables=['profiles','calendars','events','tasks','subscriptions','user_settings'];
 const results=await Promise.all(tables.map(t=>supabase.from(t).select('*').eq(t==='profiles'?'id':t==='user_settings'?'user_id':'user_id',owner)));
 const [profiles,calendars,events,tasks,subs,settings]=results.map((r,i)=>checked(r,tables[i]));
 const profile=profiles[0]||null,config=settings[0]||{};
 if(!profile)throw new Error('Account profile was not created. Please contact support.');
 const defaults=['Personal','Work','Life & plans','US Holidays'];
 const boot=[...calendars];
 if(!boot.length){
   for(let i=0;i<defaults.length;i++)boot.push({
    user_id:owner,client_id:['personal','work','life','us-holidays'][i],name:defaults[i],
    color:shades[i],shade:'gray-'+(i+1),sort_order:i,is_visible:true
   });
   const ins=await supabase.from('calendars').upsert(boot,{onConflict:'user_id,client_id'}).select('*');
   boot.splice(0,boot.length,...checked(ins,'calendars bootstrap'));
 }
 const map=new Map(boot.map(c=>[c.client_id||c.id,c.id]));
 const reverse=new Map(boot.map(c=>[c.id,c.client_id||c.id]));
 const values=new Map();
 const seed=(k,v)=>values.set(k,String(v));
 seed(KEYS.calendars,JSON.stringify(boot.map((c,i)=>({id:c.client_id||c.id,name:c.name,color:c.color||shades[i%4],visible:c.is_visible}))));
 seed(KEYS.events,JSON.stringify(events.map(e=>{const item=fromEvent(e);item.calendar=reverse.get(e.calendar_id)||item.calendar;return item})));
 seed(KEYS.tasks,JSON.stringify(tasks.map(t=>({id:t.client_id||t.id,name:t.title,notes:t.notes||t.description||'',due:t.due_date||'',done:t.completed}))));
 seed(KEYS.subscriptions,JSON.stringify(subs.map(s=>({id:s.client_id||s.id,calendar:s.calendar_id?reverse.get(s.calendar_id):null,name:s.name,url:s.url,lastFetchedAt:s.last_fetched_at}))));
 seed(KEYS.theme,config.theme||'system');seed(KEYS.accent,config.custom_accent_hex||config.accent||'graphite');
 seed(KEYS.view,config.default_view||'week');seed(KEYS.week,config.start_of_week==='monday'?'1':'0');
 seed(KEYS.name,profile.display_name||profile.username);
 seed('daylight-onboarded','yes');seed('daylight-last-date',config.extra?.lastDate||isoLocal(new Date()));
 seed('daylight-last-view',config.default_view||'week');
 seed('daylight-holidays',String(config.extra?.holidays!==false));
 seed('daylight-task-reminders',String(!!config.extra?.taskReminders));
 seed('daylight-sidebar-collapsed',String(!!config.extra?.sidebarCollapsed));
 let committed=new Map(values),dirtyKeys=new Set(),working=false,timer;
 const store={
  get length(){return values.size},
  key(n){return [...values.keys()][n]||null},
  getItem(k){return values.has(k)?values.get(k):null},
  setItem(k,v){k=String(k);v=String(v);if(values.get(k)===v)return;values.set(k,v);dirtyKeys.add(k);schedule()},
  removeItem(k){if(values.delete(k)){dirtyKeys.add(k);schedule()}},
  clear(){throw new Error('Clearing all account data is not supported. Delete items individually.')}
 };
 function schedule(){clearTimeout(timer);timer=setTimeout(flush,900)}
 async function upsertAndRemove(table,rows,oldIds){
  const desired=new Set(rows.map(r=>r.client_id));
  if(rows.length){const out=await supabase.from(table).upsert(rows,{onConflict:'user_id,client_id'}).select('id,client_id');checked(out,table+' write');if(table==='calendars')out.data.forEach(c=>map.set(c.client_id,c.id))}
  const obsolete=oldIds.filter(id=>!desired.has(id));
  if(obsolete.length){const out=await supabase.from(table).delete().eq('user_id',owner).in('client_id',obsolete);checked(out,table+' delete')}
  return rows.map(r=>r.client_id);
 }
 let savedIds={
  calendars:boot.map(c=>c.client_id||c.id),events:events.map(e=>e.client_id||e.id),
  tasks:tasks.map(t=>t.client_id||t.id),subscriptions:subs.map(s=>s.client_id||s.id)
 };
 async function flush(){
  if(working||!dirtyKeys.size)return;
  working=true;const keys=new Set(dirtyKeys);dirtyKeys.clear();
  const status=document.getElementById('cloudSyncStatus');if(status){status.dataset.state='saving';status.textContent='Saving…'}
  try{
   if(keys.has(KEYS.calendars)){
    const list=parseJSON(store.getItem(KEYS.calendars),[]).filter(c=>c.id!=='us-holidays'||true);
    const rows=list.map((c,i)=>({user_id:owner,client_id:String(c.id),name:String(c.name||'Calendar').slice(0,120),color:/^#[\da-f]{6}$/i.test(c.color)?c.color:shades[i%4],shade:'gray-'+(i+1),sort_order:i,is_visible:c.visible!==false}));
    savedIds.calendars=await upsertAndRemove('calendars',rows,savedIds.calendars);
   }
   if(keys.has(KEYS.events)){
    const list=parseJSON(store.getItem(KEYS.events),[]).filter(e=>!e.holiday&&!e.sourceId&&e.date);
    const rows=list.map(e=>toEvent(e,owner,map));
    savedIds.events=await upsertAndRemove('events',rows,savedIds.events);
   }
   if(keys.has(KEYS.tasks)){
    const list=parseJSON(store.getItem(KEYS.tasks),[]);
    savedIds.tasks=await upsertAndRemove('tasks',list.map(t=>({user_id:owner,client_id:String(t.id),title:String(t.name||'Task').slice(0,300),notes:String(t.notes||''),due_date:t.due||null,completed:!!t.done})),savedIds.tasks);
   }
   if(keys.has(KEYS.subscriptions)){
    const list=parseJSON(store.getItem(KEYS.subscriptions),[]).filter(s=>s.url);
    savedIds.subscriptions=await upsertAndRemove('subscriptions',list.map(s=>({user_id:owner,client_id:String(s.id),calendar_id:map.get(s.calendar)||null,name:String(s.name||''),url:String(s.url),last_fetched_at:s.lastFetchedAt||null})),savedIds.subscriptions);
   }
   const preferenceKeys=[KEYS.theme,KEYS.accent,KEYS.view,KEYS.week,'daylight-last-date','daylight-holidays','daylight-task-reminders','daylight-sidebar-collapsed'];
   if(preferenceKeys.some(k=>keys.has(k))){
    const accent=store.getItem(KEYS.accent)||'graphite';
    const row={user_id:owner,theme:store.getItem(KEYS.theme)||'system',accent:/^#[0-9a-f]{6}$/i.test(accent)?'custom':accent,custom_accent_hex:/^#[0-9a-f]{6}$/i.test(accent)?accent:null,default_view:store.getItem(KEYS.view)||'week',start_of_week:store.getItem(KEYS.week)==='1'?'monday':'sunday',reduce_motion:config.reduce_motion||false,mcp_allow_delete:config.mcp_allow_delete||false,extra:{...(config.extra||{}),lastDate:store.getItem('daylight-last-date'),holidays:store.getItem('daylight-holidays')!=='false',taskReminders:store.getItem('daylight-task-reminders')==='true',sidebarCollapsed:store.getItem('daylight-sidebar-collapsed')==='true'}};
    checked(await supabase.from('user_settings').upsert(row,{onConflict:'user_id'}),'preferences');
    Object.assign(config,row);
   }
   if(keys.has(KEYS.name)){
     checked(await supabase.from('profiles').update({display_name:store.getItem(KEYS.name)||profile.username}).eq('id',owner),'profile');
   }
   committed=new Map(values);if(status){status.dataset.state='saved';status.textContent='Saved to cloud'}
  }catch(err){
   for(const k of keys)dirtyKeys.add(k);
   if(status){status.dataset.state='error';status.textContent='Not saved'}
   toast("Couldn't save — check your connection",()=>flush());
   console.warn('Daylight sync error:',err.message);
  }finally{working=false;if(dirtyKeys.size&&navigator.onLine)schedule()}
 }
 async function refreshOnFocus(){
  if(dirtyKeys.size||working)return;
  try{
   const [c,e,t]=await Promise.all(['calendars','events','tasks'].map(table=>supabase.from(table).select('updated_at').eq('user_id',owner).order('updated_at',{ascending:false}).limit(1)));
   if([c,e,t].some(x=>x.error))return;
   // Incoming edits from other devices are loaded by a safe reload; app data is never overwritten mid-edit.
   const remote=[...c.data,...e.data,...t.data].map(x=>x.updated_at).filter(Boolean).sort().at(-1)||'';
   const localVersion=sessionStorage.getItem('daylight-remote-version')||remote;
   if(remote>localVersion){sessionStorage.setItem('daylight-remote-version',remote);location.reload()}
   else sessionStorage.setItem('daylight-remote-version',remote);
  }catch{}
 }
 window.addEventListener('focus',refreshOnFocus);
 return {store,sync:flush,profile,settings:config,supabase,owner,toast};
}
