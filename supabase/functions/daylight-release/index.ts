import { createClient } from 'npm:@supabase/supabase-js@2.49.10';
import bcrypt from 'npm:bcryptjs@2.4.3';
const url=Deno.env.get('SUPABASE_URL')!,secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const allowHeaders='content-type,authorization,apikey,x-client-info';
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','access-control-allow-origin':'*','access-control-allow-headers':allowHeaders,'cache-control':'no-store'}});
const fail=(error:string,status=400)=>json({error},status);
const sha=async(input:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const fresh=()=>Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,'0')).join('');
const plain=(x:unknown)=>String(x??'').trim();
const allowed:Record<string,{table:string,fields:string[]}>={
 calendars:{table:'dl_calendars',fields:['name','shade','sort_order','is_visible']},
 events:{table:'dl_events',fields:['calendar_id','title','description','location_name','location_address','starts_at','ends_at','all_day','repeat_rule','reminder_offset_minutes']},
 tasks:{table:'dl_tasks',fields:['title','notes','due_date','completed']},
 subscriptions:{table:'dl_subscriptions',fields:['calendar_id','name','url','last_fetched_at']},
 settings:{table:'dl_user_settings',fields:['theme','accent','custom_accent_hex','default_view','start_of_week','reduce_motion','show_weekends','compact_mode','show_week_numbers','show_declined_events','work_hours_start','work_hours_end','task_reminders','event_reminders','notification_sound','default_reminder_minutes','mcp_allow_delete','time_zone','extra']}
};
async function session(token:string){
 if(!/^[a-f0-9]{64}$/.test(token))return null;
 const hash=await sha(token);
 const {data:s,error:e}=await db.from('sessions').select('id,user_id,expires_at').eq('token_hash',hash).gt('expires_at',new Date().toISOString()).maybeSingle();
 if(e||!s)return null;
 const {data:u}=await db.from('users').select('id,first_name,last_name,username,is_admin').eq('id',s.user_id).maybeSingle();
 return u?{user:u,session:s}:null;
}
async function bootstrap(uid:string){
 const {error:se}=await db.from('dl_user_settings').upsert({user_id:uid},{onConflict:'user_id',ignoreDuplicates:true});
 if(se)throw se;
 for(const [i,c] of ['Personal','Work','Life & plans','US Holidays'].entries()){
  const {error:ce}=await db.from('dl_calendars').upsert({user_id:uid,name:c,shade:'gray-'+(i+1),sort_order:i,is_visible:true,client_id:['personal','work','life','us-holidays'][i]},{onConflict:'user_id,client_id',ignoreDuplicates:true});
  if(ce)throw ce;
 }
}
async function calendarOwner(uid:string,id:string){
 const {data}=await db.from('dl_calendars').select('id,client_id').eq('id',id).eq('user_id',uid).maybeSingle();
 if(!data||data.client_id==='us-holidays')throw Error('Calendar not found or read-only');
}
const pick=(entity:string,data:Record<string,unknown>)=>{
 const fields=allowed[entity].fields;const output:Record<string,unknown>={};
 for(const f of fields)if(Object.hasOwn(data,f))output[f]=data[f];
 if('title' in output&&!plain(output.title))throw Error('Title is required');
 if('name' in output&&!plain(output.name))throw Error('Name is required');
 if(entity==='events'){
  for(const x of ['starts_at','ends_at'])if(x in output&&(typeof output[x]!=='string'||!(/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(output[x] as string))||!Number.isFinite(Date.parse(output[x] as string))))throw Error('Invalid ISO timestamp');
  if(output.starts_at&&output.ends_at&&Date.parse(output.ends_at as string)<=Date.parse(output.starts_at as string))throw Error('End must be after start');
 }
 if(entity==='subscriptions'&&'url' in output){const u=new URL(String(output.url));if(u.protocol!=='https:')throw Error('HTTPS required')}
 return output;
};
async function handle(req:Request){
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':allowHeaders,'access-control-allow-methods':'POST,OPTIONS'}});
 if(req.method!=='POST')return fail('Method not allowed',405);
 let body:Record<string,unknown>;try{body=await req.json();if(!body||Array.isArray(body)||typeof body!=='object')throw Error()}catch{return fail('Invalid request')}
 const action=plain(body.action);
 if(action==='auth_login'){
  const generic="That username and password don't match";
  const userName=plain(body.username).toLowerCase(),password=String(body.password??'');
  if(!userName||!password)return fail(generic,401);
  const {data:u}=await db.from('users').select('id,first_name,last_name,username,is_admin,password_hash,password_salt').eq('username',userName).maybeSingle();
  const candidate=u?.password_hash||'$2a$12$qPjyg7ojIrlQWMz9hA68A.e2N1owCGVgpryoiL5cElYc/09nOgECy';
  const verified=await bcrypt.compare(password+(u?.password_salt||''),candidate).catch(()=>false);
  if(!u||!verified)return fail(generic,401);
  const token=fresh(),{error}=await db.from('sessions').insert({user_id:u.id,token_hash:await sha(token),expires_at:new Date(Date.now()+30*86400000).toISOString()});
  if(error)throw error;
  await bootstrap(u.id);
  return json({token,user:{id:u.id,first_name:u.first_name,last_name:u.last_name,username:u.username,is_admin:u.is_admin}});
 }
 const token=plain(body.token)||plain(req.headers.get('x-daylight-session'));
 const pair=await session(token);
 if(!pair)return fail('Session expired. Log in again.',401);
 const uid=pair.user.id;
 if(action==='auth_logout'){const hash=await sha(token);await db.from('sessions').delete().eq('user_id',uid).eq('token_hash',hash);return json({ok:true})}
 if(action==='auth_session')return json({user:pair.user});
 if(action==='user_update'){
  const first=plain(body.first_name).slice(0,60),last=plain(body.last_name).slice(0,60);
  if(!first||!last)return fail('First and last names are required');
  const {error}=await db.from('users').update({first_name:first,last_name:last}).eq('id',uid);
  if(error)throw error;return json({ok:true,user:{...pair.user,first_name:first,last_name:last}});
 }
 if(action==='mcp_list'){
  const {data,error}=await db.from('dl_mcp_tokens').select('id,name,created_at,last_used_at,revoked').eq('user_id',uid).order('created_at',{ascending:false});
  if(error)throw error;return json({items:data});
 }
 if(action==='mcp_generate'){
  const name=plain(body.name).slice(0,100);if(!name)return fail('Token name is required');
  const raw=fresh(),{data,error}=await db.from('dl_mcp_tokens').insert({user_id:uid,name,token_hash:await sha(raw)}).select('id,name,created_at').single();
  if(error)throw error;return json({item:data,token:raw});
 }
 if(action==='mcp_revoke'){
  if(!/^[0-9a-f-]{36}$/i.test(plain(body.id)))return fail('Invalid token');
  const {data,error}=await db.from('dl_mcp_tokens').update({revoked:true}).eq('user_id',uid).eq('id',body.id).select('id').maybeSingle();
  if(error)throw error;return data?json({ok:true}):fail('Token not found',404);
 }
 if(/^data_(list|create|update|delete)$/.test(action)){
  const entity=plain(body.entity),spec=allowed[entity];if(!spec)return fail('Unknown resource');
  if(action==='data_list'){
   let query=db.from(spec.table).select('*').eq('user_id',uid);
   if(entity==='events'){if(body.from)query=query.gte('starts_at',plain(body.from));if(body.to)query=query.lt('starts_at',plain(body.to));query=query.order('starts_at').limit(3000)}
   if(entity==='tasks')query=query.order('created_at',{ascending:false}).limit(2000);
   const {data,error}=await query;if(error)throw error;return json({items:data||[]});
  }
  if(entity==='settings'){
   if(action!=='data_update')return fail('Settings can only be updated');
   const changes=pick(entity,body.data as Record<string,unknown>||{});
   const {data,error}=await db.from(spec.table).update({...changes,updated_at:new Date().toISOString()}).eq('user_id',uid).select('*').single();
   if(error)throw error;return json({item:data});
  }
  const raw=body.data&&typeof body.data==='object'&&!Array.isArray(body.data)?body.data as Record<string,unknown>:{};
  const changes=pick(entity,raw);
  if(['events','subscriptions'].includes(entity)&&changes.calendar_id)await calendarOwner(uid,String(changes.calendar_id));
  if(action==='data_create'){
   if(entity==='events'&&(!changes.title||!changes.calendar_id||!changes.starts_at||!changes.ends_at))return fail('Missing event fields');
   if(entity==='tasks'&&!changes.title||entity==='calendars'&&!changes.name)return fail('A title or name is required');
   const {data,error}=await db.from(spec.table).insert({...changes,user_id:uid}).select('*').single();
   if(error)throw error;return json({item:data});
  }
  const id=plain(body.id);if(!/^[0-9a-f-]{36}$/i.test(id))return fail('Invalid ID');
  // Never permit ownership changes. Every query includes user_id because service_role bypasses RLS.
  if(entity==='calendars'&&action==='data_delete'){
   const {data:found}=await db.from(spec.table).select('client_id').eq('id',id).eq('user_id',uid).maybeSingle();
   if(found?.client_id==='us-holidays')return fail('Read-only calendar',403);
  }
  if(entity==='events'&&action==='data_update'){
   const {data:existing}=await db.from('dl_events').select('starts_at,ends_at,calendar_id,source_subscription_id').eq('id',id).eq('user_id',uid).maybeSingle();
   if(!existing)return fail('Event not found',404);
   if(existing.source_subscription_id)return fail('Subscribed events are read-only',403);
   if(changes.starts_at||changes.ends_at){const a=String(changes.starts_at||existing.starts_at),b=String(changes.ends_at||existing.ends_at);if(Date.parse(b)<=Date.parse(a))return fail('End must be after start')}
  }
  let query=action==='data_update'?db.from(spec.table).update({...changes,updated_at:new Date().toISOString()}):db.from(spec.table).delete();
  const {data,error}=await query.eq('id',id).eq('user_id',uid).select('*').maybeSingle();
  if(error)throw error;return data?json({item:data}):fail('Not found',404);
 }
 return fail('Unknown action',404);
}
Deno.serve(async req=>{try{return await handle(req)}catch(error){console.error('Daylight request failed:',error);return fail('Request could not be completed',500)}});
