// Daylight UI workspace. Everything here is stored in this browser only.
// No login, network, Supabase, database, accounts, sync or MCP client.
const STORAGE_KEY='daylight-local-ui-v1';
const clone=x=>structuredClone(x);
const uid=()=>globalThis.crypto?.randomUUID?.()||'local-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const civil=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const at=(d,h,min=0)=>new Date(d.getFullYear(),d.getMonth(),d.getDate(),h,min).toISOString();
const defaults=()=>{
 const today=new Date(),monday=new Date(today);monday.setDate(today.getDate()-((today.getDay()+6)%7));
 const week=n=>new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+n);
 const atTime=(d,h=0,min=0)=>new Date(d.getFullYear(),d.getMonth(),d.getDate(),h,min).toISOString();
 const cal={personal:uid(),work:uid(),life:uid(),holiday:uid()};
 const calendars=[
  {id:cal.personal,client_id:'personal',name:'Personal',shade:'blue',is_visible:false,sort_order:0},
  {id:cal.work,client_id:'work',name:'Work',shade:'violet',is_visible:false,sort_order:1},
  {id:cal.life,client_id:'life',name:'Life & plans',shade:'green',is_visible:false,sort_order:2},
  {id:cal.holiday,client_id:'us-holidays',name:'US Holidays',shade:'amber',is_visible:true,sort_order:3}
 ];
 const event=(title,calendar_id,day,start,end,location='',extra={})=>{
  const d=typeof day==='number'?week(day):day;
  const [sh,sm]=start.split(':').map(Number),[eh,em]=end.split(':').map(Number);
  return {id:uid(),title,calendar_id,description:'',location_name:location,location_address:location,
   starts_at:atTime(d,sh,sm),ends_at:atTime(d,eh,em),all_day:false,repeat_rule:extra.repeat?{frequency:extra.repeat}:{frequency:'never'},status:extra.declined?'declined':'confirmed',reminder_offset_minutes:15};
 };
 const all=(title,calendar_id,start,end=start)=>({id:uid(),title,calendar_id,description:'',
   location_name:'',location_address:'',starts_at:atTime(start),ends_at:atTime(new Date(end.getFullYear(),end.getMonth(),end.getDate()+1)),
   all_day:true,repeat_rule:{frequency:'never'},status:'confirmed'});
 const date=(m,d)=>new Date(today.getFullYear(),m,d);
 const events=[
  event('School — Day 2',cal.personal,0,'08:35','15:15','Middle School'),
  event('Homework — Algebra I',cal.personal,0,'16:00','17:00'),
  event('Team standup',cal.work,1,'09:00','09:30','Google Meet'),
  event('Swim practice',cal.personal,1,'18:30','19:45','SwimRVA',{repeat:'weekly'}),
  event('School — Day 1',cal.personal,1,'08:35','15:15','Middle School'),
  event('School — Day 2',cal.personal,2,'08:35','15:15','Middle School'),
  event('Design review',cal.work,2,'10:00','11:00','Studio B'),
  event('Team offsite',cal.work,2,'13:00','16:00','Downtown office',{declined:true}),
  event('Swim practice',cal.personal,3,'18:30','19:45','SwimRVA',{repeat:'weekly'}),
  event('Project check-in',cal.work,4,'14:00','15:00'),
  event('Dentist appointment',cal.life,4,'16:30','17:15'),
  event('Family dinner',cal.life,5,'18:00','19:30'),
  event('Grocery run',cal.life,6,'11:00','11:45'),
  event('Book club',cal.life,10,'19:00','20:00'),
  event('Science fair prep',cal.personal,16,'15:30','16:30'),
  all('Weekend plans',cal.life,week(5),week(7))
 ];
 if(today.getFullYear()===2026){
  events.push(all('Florida trip',cal.life,new Date(2026,9,31),new Date(2026,10,2)));
  events.push(all('Election Day',cal.holiday,new Date(2026,10,3)));
  events.push(all('Veterans Day',cal.holiday,new Date(2026,10,11)));
  events.push(all('Thanksgiving',cal.holiday,new Date(2026,10,26)));
  events.push(all('Fall break',cal.life,new Date(2026,10,25),new Date(2026,10,27)));
 }
 return {
  user:{id:'local-preview',first_name:'Joey',last_name:'',email:''},
  calendars,events,tasks:[],subscriptions:[],
  settings:{id:'local-settings',default_view:'month',theme:'dark',start_of_week:'sunday',
   time_zone:'auto',show_week_numbers:false,show_declined_events:true,
   show_weekends:true,compact_mode:false,reduce_motion:false,
   work_hours_start:'09:00',work_hours_end:'17:00',default_reminder_minutes:15,
   event_reminders:false,task_reminders:false,notification_sound:false,mcp_allow_delete:false}
 };
};

function read(){
 try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const d=JSON.parse(raw);if(d&&Array.isArray(d.calendars)&&Array.isArray(d.events)&&d.settings&&d.user)return d}}
 catch(e){console.warn('Daylight local storage is unavailable or invalid',e)}
 const d=defaults();write(d);return d;
}
function write(data){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
 catch(e){throw Error('Browser storage is full or unavailable. Changes could not be saved locally.')}
}
function mutate(fn){
 const value=read(),result=fn(value);
 write(value);
 return result;
}
const entities=new Set(['calendars','events','tasks','subscriptions','settings']);
export function localReset(){localStorage.removeItem(STORAGE_KEY)}
export async function localApi(action,payload={}){
 const entity=payload.entity,operation=String(action||'');
 if(action==='auth_session')return {user:clone(read().user)};
 if(action==='user_update'){
  const user=mutate(d=>{d.user={...d.user,...(payload.data||payload)};return clone(d.user)});
  return {user};
 }
 if(action==='data_list'){
  if(!entities.has(entity))throw Error('Unknown local collection.');
  const d=read();return {items:clone(entity==='settings'?[d.settings]:d[entity])};
 }
 if(!operation.startsWith('data_')||!entities.has(entity))throw Error('Unavailable in local design mode.');
 const method=operation.slice(5);
 if(!['create','update','delete'].includes(method))throw Error('Unsupported local change.');
 if(entity==='settings'){
  if(method!=='update')throw Error('Settings can only be updated.');
  return {item:mutate(d=>{d.settings={...d.settings,...payload.data};return clone(d.settings)})};
 }
 if(entity==='subscriptions')throw Error('Online calendar subscriptions are disabled in local design mode.');
 if(method==='create'){
  const item=mutate(d=>{
   const entry={...payload.data,id:uid()};
   if(entity==='calendars')entry.client_id=entry.client_id||'custom';
   d[entity].push(entry);return clone(entry);
  });return {item};
 }
 if(!payload.id)throw Error('Missing local item identifier.');
 if(method==='update'){
  const item=mutate(d=>{
   const idx=d[entity].findIndex(x=>x.id===payload.id);
   if(idx<0)throw Error('That item no longer exists.');
   d[entity][idx]={...d[entity][idx],...payload.data,id:payload.id};
   return clone(d[entity][idx]);
  });return {item};
 }
 const deleted=mutate(d=>{
  const idx=d[entity].findIndex(x=>x.id===payload.id);
  if(idx<0)throw Error('That item no longer exists.');
  const item=d[entity].splice(idx,1)[0];
  if(entity==='calendars')d.events=d.events.filter(e=>e.calendar_id!==payload.id);
  return clone(item);
 });
 return {item:deleted};
}
