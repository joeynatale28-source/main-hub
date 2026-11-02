// Daylight UI workspace. Everything here is stored in this browser only.
// No login, network, Supabase, database, accounts, sync or MCP client.
const STORAGE_KEY='daylight-local-ui-v1';
const clone=x=>structuredClone(x);
const uid=()=>globalThis.crypto?.randomUUID?.()||'local-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const civil=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const at=(d,h,min=0)=>new Date(d.getFullYear(),d.getMonth(),d.getDate(),h,min).toISOString();
const defaults=()=>{
 const now=new Date(),monday=new Date(now);monday.setDate(now.getDate()-((now.getDay()+6)%7));
 const sampleDate=n=>new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+n);
 const personal=uid(),work=uid(),swim=uid();
 const calendars=[
  {id:personal,client_id:'personal',name:'Personal',shade:'blue',is_visible:true,sort_order:0},
  {id:work,client_id:'work',name:'Work',shade:'violet',is_visible:true,sort_order:1},
  {id:swim,client_id:'swim',name:'Swimming',shade:'teal',is_visible:true,sort_order:2}
 ];
 const event=(title,cal,day,start,end,location='')=>({id:uid(),calendar_id:cal,title,description:'',location_name:location,location_address:location,starts_at:at(sampleDate(day),start),ends_at:at(sampleDate(day),end),all_day:false,repeat_rule:{frequency:'never'},reminder_offset_minutes:15,status:'confirmed'});
 const tripStart=sampleDate(3),tripEnd=sampleDate(6);
 return {
  user:{id:'local-preview',first_name:'Joey',last_name:'',email:''},
  calendars,
  events:[
   event('Morning planning',personal,0,9,10),
   event('Practice',swim,1,16,18,'Community pool'),
   event('Project review',work,2,13,14),
   {id:uid(),calendar_id:personal,title:'Weekend plans',description:'Example multi-day event',location_name:'',location_address:'',starts_at:at(tripStart,0),ends_at:at(tripEnd,0),all_day:true,repeat_rule:{frequency:'never'},status:'confirmed'}
  ],
  tasks:[
   {id:uid(),title:'Review this week',notes:'Editable sample task.',due_date:civil(sampleDate(0)),completed:false},
   {id:uid(),title:'Customize calendar colors',notes:'',due_date:civil(sampleDate(2)),completed:false}
  ],
  subscriptions:[],
  settings:{
   id:'local-settings',default_view:'week',theme:'dark',start_of_week:'sunday',
   time_zone:'auto',show_week_numbers:false,show_declined_events:true,
   show_weekends:true,compact_mode:false,reduce_motion:false,
   work_hours_start:'09:00',work_hours_end:'17:00',default_reminder_minutes:15,
   event_reminders:false,task_reminders:false,notification_sound:false,
   mcp_allow_delete:false
  }
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
  const user=mutate(d=>{d.user={...d.user,...payload.data};return clone(d.user)});
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
