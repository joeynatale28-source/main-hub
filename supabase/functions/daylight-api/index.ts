import { createClient } from 'npm:@supabase/supabase-js@2';
import bcrypt from 'npm:bcryptjs@2.4.3';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
const FIVE_HOURS = 5 * 60 * 60 * 1000;
const SESSION_DAYS = 30;
const userFields = 'id,first_name,last_name,username,is_admin,has_completed_onboarding,pin_hash,password_hash,claim_code_hash,failed_login_attempts,locked_until';
const entityMap: Record<string,string> = { calendars:'dl_calendars',events:'dl_events',tasks:'dl_tasks',subscriptions:'dl_subscriptions',settings:'dl_user_settings' };
const allowed: Record<string,string[]> = {
 calendars:['name','shade','sort_order','is_visible'],
 events:['calendar_id','title','description','location_name','location_address','starts_at','ends_at','all_day','repeat_rule','reminder_offset_minutes'],
 tasks:['title','notes','due_date','completed'],
 subscriptions:['calendar_id','name','url','last_fetched_at'],
 settings:['theme','accent','custom_accent_hex','default_view','start_of_week','reduce_motion','mcp_allow_delete','extra']
};
const safe = (s:unknown) => String(s??'').trim();
const uname = (s:unknown) => safe(s).toLowerCase();
const usernameValid = (s:string) => /^[a-z][a-z0-9_]{2,19}$/.test(s);
const passwordValid = (s:string) => s.length>=8 && /[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s) && /[^A-Za-z0-9]/.test(s);
const hex = (bytes:Uint8Array) => Array.from(bytes).map(v=>v.toString(16).padStart(2,'0')).join('');
const fresh = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const digest = async (raw:string) => hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw))));
const response = (body:unknown,status=200) => new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store','access-control-allow-origin':'*','access-control-allow-headers':'content-type,apikey,authorization,x-client-info','vary':'Origin'}});
const error = (message:string,status=400) => response({error:message},status);
const publicUser = (u:Record<string,unknown>) => ({id:u.id,username:u.username,first_name:u.first_name,last_name:u.last_name,is_admin:u.is_admin,has_completed_onboarding:u.has_completed_onboarding,has_pin:!!u.pin_hash});
const selectUser = async (username:string) => (await sb.from('users').select(userFields).eq('username',username).maybeSingle()).data;
const lookup = async (token:string) => {
 if (!/^[a-f0-9]{64}$/.test(token)) return null;
 const hash=await digest(token);
 const {data:s}=await sb.from('sessions').select('*').eq('token_hash',hash).gt('expires_at',new Date().toISOString()).maybeSingle();
 if(!s)return null;
 const {data:u}=await sb.from('users').select(userFields).eq('id',s.user_id).maybeSingle();
 return u?{s,u}:null;
};
const makeSession = async (u:Record<string,unknown>) => {
 const token=fresh(), accessToken=fresh(), now=new Date();
 const {error:e}=await sb.from('sessions').insert({user_id:u.id,token_hash:await digest(token),access_hash:await digest(accessToken),last_full_auth_at:now.toISOString(),last_unlocked_at:now.toISOString(),expires_at:new Date(now.getTime()+SESSION_DAYS*86400000).toISOString()});
 if(e)throw new Error('Could not establish session');
 return {token,accessToken,user:publicUser(u)};
};
const bootstrap=async (id:string) => {
 const {error:e}=await sb.from('dl_user_settings').upsert({user_id:id},{onConflict:'user_id',ignoreDuplicates:true}); if(e)throw e;
 const defaults=[['Personal','gray-1','personal'],['Work','gray-2','work'],['Life & plans','gray-3','life'],['US Holidays','gray-4','us-holidays']];
 for(let i=0;i<defaults.length;i++){
  const [name,shade,client_id]=defaults[i];
  const {error:ce}=await sb.from('dl_calendars').upsert({user_id:id,name,shade,sort_order:i,is_visible:true,client_id},{onConflict:'user_id,client_id',ignoreDuplicates:true});
  if(ce)throw ce;
 }
};
const authenticated = async(body:Record<string,unknown>, requireUnlocked=true) => {
 const pair=await lookup(safe(body.token)); if(!pair)return null;
 if(requireUnlocked){
  if(Date.now()-new Date(pair.s.last_full_auth_at).getTime()>=FIVE_HOURS)return null;
  if(!body.accessToken || pair.s.access_hash!==await digest(safe(body.accessToken)))return null;
  if(!pair.u.has_completed_onboarding || !pair.u.pin_hash)return null;
 }
 return pair;
};
const fieldsOnly = (entity:string, incoming:unknown) => {
 if(!incoming || typeof incoming!=='object' || Array.isArray(incoming))throw new Error('Invalid data');
 const result:Record<string,unknown>={};
 for(const name of allowed[entity]||[])if(Object.hasOwn(incoming,name))result[name]=(incoming as Record<string,unknown>)[name];
 if('title' in result && !safe(result.title))throw new Error('A title is required');
 if('name' in result && entity==='calendars' && !safe(result.name))throw new Error('Name is required');
 if(entity==='events' && (result.starts_at || result.ends_at)){
  for(const k of ['starts_at','ends_at'])if(k in result && (typeof result[k]!=='string'||!/^\d{4}-\d\d-\d\dT/.test(result[k] as string)||isNaN(Date.parse(result[k] as string))))throw new Error('Invalid event time');
  if(result.starts_at&&result.ends_at&&Date.parse(result.ends_at as string)<=Date.parse(result.starts_at as string))throw new Error('End must be after start');
 }
 if(entity==='settings' && 'extra' in result && (typeof result.extra!=='object'||Array.isArray(result.extra)))throw new Error('Invalid settings');
 return result;
};
const enforceCalendar=async(uid:string,calendar_id:string) => {
 const {data}=await sb.from('dl_calendars').select('id,client_id').eq('user_id',uid).eq('id',calendar_id).maybeSingle();
 if(!data || data.client_id==='us-holidays')throw new Error('Unknown or read-only calendar');
};
async function handler(body:Record<string,unknown>):Promise<Response>{
 const action=safe(body.action);
 if(action==='account_state'){
  const u=await selectUser(uname(body.username));
  return u&&!u.password_hash?response({unclaimed:true,first_name:u.first_name}):response({unclaimed:false});
 }
 if(action==='auth_claim'){
  const username=uname(body.username),password=String(body.newPassword||''),claimCode=safe(body.claimCode);
  if(!usernameValid(username)||!passwordValid(password))return error('Invalid account details');
  const u=await selectUser(username);
  if(!u||u.password_hash)return error('Unable to claim account',403);
  if(u.claim_code_hash){if(!claimCode||await digest(claimCode)!==u.claim_code_hash)return error('Invalid invitation code',403)}
  else if(u.is_admin){const configured=Deno.env.get('DAYLIGHT_OWNER_CLAIM_CODE');if(!configured)return error('Owner setup code is not configured',503);if(!claimCode||await digest(claimCode)!==await digest(configured))return error('Invalid invitation code',403)}
  else return error('No invitation code configured',403);
  const salt=fresh();const password_hash=await bcrypt.hash(password+salt,12);
  const {data:claimed,error:e}=await sb.from('users').update({password_hash,password_salt:salt,claim_code_hash:null}).eq('id',u.id).is('password_hash',null).select(userFields).maybeSingle();
  if(e||!claimed)return error('Account is already claimed',409);
  await bootstrap(u.id);return response(await makeSession(claimed));
 }
 if(action==='auth_login'){
  const u=await selectUser(uname(body.username));
  if(u&&!u.password_hash)return response({unclaimed:true,first_name:u.first_name});
  const fail=()=>error("That username and password don't match",401);
  if(!u)return fail();
  if(u.locked_until && new Date(u.locked_until)>new Date())return error('Too many attempts. Try again later.',429);
  const valid=await bcrypt.compare(String(body.password||'')+String(u.password_salt||''),String(u.password_hash||''));
  if(!valid){const count=Number(u.failed_login_attempts||0)+1;await sb.from('users').update({failed_login_attempts:count>=8?0:count,locked_until:count>=8?new Date(Date.now()+15*60000).toISOString():null}).eq('id',u.id);return fail()}
  await sb.from('users').update({failed_login_attempts:0,locked_until:null}).eq('id',u.id);
  await bootstrap(u.id);return response(await makeSession(u));
 }
 if(action==='auth_status'){
  const pair=await lookup(safe(body.token));if(!pair)return response({mode:'login'});
  const {u,s}=pair;
  if(Date.now()-new Date(s.last_full_auth_at).getTime()>=FIVE_HOURS||s.pin_locked)return response({mode:'login'});
  return response({mode:!u.has_completed_onboarding?'tour':!u.pin_hash?'setup_pin':'pin',user:publicUser(u)});
 }
 if(action==='auth_logout'){
  const h=await digest(safe(body.token));await sb.from('sessions').delete().eq('token_hash',h);return response({ok:true});
 }
 if(action==='auth_pin_unlock'){
  const pair=await lookup(safe(body.token));if(!pair)return error('Session expired',401);
  const {u,s}=pair;
  if(Date.now()-new Date(s.last_full_auth_at).getTime()>=FIVE_HOURS||s.pin_locked)return error('Use your password to sign in',401);
  if(!/^\d{6}$/.test(safe(body.pin)))return error('PIN must contain six digits');
  const match=!!u.pin_hash&&await bcrypt.compare(safe(body.pin)+String(u.pin_salt||''),u.pin_hash);
  if(!match){const attempts=s.failed_pin_attempts+1;const locked=attempts>=5;await sb.from('sessions').update({failed_pin_attempts:attempts,pin_locked:locked,access_hash:null}).eq('id',s.id);return error(locked?'PIN locked. Use your password to sign in.':`Incorrect PIN — ${5-attempts} tries left`,401)}
  const accessToken=fresh();await sb.from('sessions').update({failed_pin_attempts:0,access_hash:await digest(accessToken),last_unlocked_at:new Date().toISOString()}).eq('id',s.id);
  return response({ok:true,accessToken,user:publicUser(u)});
 }
 if(action==='finish_onboarding'||action==='set_pin'){
  const pair=await lookup(safe(body.token));if(!pair || pair.s.access_hash!==await digest(safe(body.accessToken)))return error('Sign in required',401);
  if(action==='finish_onboarding'){await sb.from('users').update({has_completed_onboarding:true}).eq('id',pair.u.id);return response({ok:true})}
  const pin=safe(body.pin);if(!/^\d{6}$/.test(pin))return error('PIN must contain six digits');
  if(pair.u.pin_hash)return error('PIN already set',409);
  const salt=fresh();const hash=await bcrypt.hash(pin+salt,12);
  const {error:e}=await sb.from('users').update({pin_hash:hash,pin_salt:salt}).eq('id',pair.u.id);if(e)throw e;
  return response({ok:true});
 }
 if(action==='change_pin'){
  const pair=await authenticated(body);if(!pair)return error('Unlock required',401);
  const valid=await bcrypt.compare(String(body.password||'')+pair.u.password_salt,pair.u.password_hash);
  if(!valid)return error('Incorrect password',401);
  const pin=safe(body.pin);if(!/^\d{6}$/.test(pin))return error('PIN must contain six digits');
  const salt=fresh(),hash=await bcrypt.hash(pin+salt,12);
  const {error:e}=await sb.from('users').update({pin_hash:hash,pin_salt:salt}).eq('id',pair.u.id);if(e)throw e;
  return response({ok:true});
 }
 const pair=await authenticated(body);if(!pair)return error('Sign in and unlock required',401);
 const uid=String(pair.u.id);
 if(action==='me')return response({user:publicUser(pair.u)});
 if(action==='update_display_name'){
  const first=safe(body.first_name).slice(0,60),last=safe(body.last_name).slice(0,60);
  if(!first||!last)return error('Both names are required');
  const {error:e}=await sb.from('users').update({first_name:first,last_name:last}).eq('id',uid);if(e)throw e;
  return response({ok:true});
 }
 if(['data_list','data_create','data_update','data_delete'].includes(action)){
  const entity=safe(body.entity);const table=entityMap[entity];if(!table)return error('Unknown resource');
  if(action==='data_list'){
   let query=sb.from(table).select('*').eq('user_id',uid);
   if(entity==='events'){if(body.from)query=query.gte('starts_at',String(body.from));if(body.to)query=query.lt('starts_at',String(body.to));query=query.order('starts_at').limit(3000)}
   if(entity==='tasks')query=query.order('created_at',{ascending:false}).limit(2000);
   const {data,error:e}=await query; if(e)throw e;return response({items:data||[]});
  }
  if(action==='data_create'){
   if(entity==='settings')return error('Settings use update');
   const fields=fieldsOnly(entity,body.data);if(entity==='events'){
    if(!fields.title||!fields.starts_at||!fields.ends_at||!fields.calendar_id)return error('Missing event fields');
    if(Date.parse(fields.ends_at as string)<=Date.parse(fields.starts_at as string))return error('End must be after start');
    await enforceCalendar(uid,String(fields.calendar_id));
   }
   if(entity==='subscriptions'&&fields.calendar_id)await enforceCalendar(uid,String(fields.calendar_id));
   if(entity==='calendars'&&!fields.name||entity==='tasks'&&!fields.title)return error('Name is required');
   const {data,error:e}=await sb.from(table).insert({...fields,user_id:uid}).select('*').single();if(e)throw e;return response({item:data});
  }
  const fields=action==='data_update'?fieldsOnly(entity,body.data):{};
  if(entity==='settings'&&action==='data_update'){
   const {data,error:e}=await sb.from(table).update({...fields,updated_at:new Date().toISOString()}).eq('user_id',uid).select('*').single();if(e)throw e;return response({item:data});
  }
  if(entity==='settings')return error('Settings cannot be deleted');
  const id=safe(body.id);if(!/^[a-f0-9-]{36}$/i.test(id))return error('Invalid id');
  if(entity==='calendars'){
   const {data:c}=await sb.from(table).select('client_id').eq('id',id).eq('user_id',uid).maybeSingle();
   if(!c||c.client_id==='us-holidays')return error('Protected or unknown calendar');
  }
  if(action==='data_update'){
   if(entity==='events'&&fields.calendar_id)await enforceCalendar(uid,String(fields.calendar_id));
   if(entity==='events'&&(fields.starts_at||fields.ends_at)){
    const {data:old}=await sb.from(table).select('starts_at,ends_at').eq('user_id',uid).eq('id',id).maybeSingle();
    if(!old||Date.parse(String(fields.ends_at||old.ends_at))<=Date.parse(String(fields.starts_at||old.starts_at)))return error('Invalid date range');
   }
   if(entity==='subscriptions'&&fields.calendar_id)await enforceCalendar(uid,String(fields.calendar_id));
   const {data,error:e}=await sb.from(table).update({...fields,...(['events','tasks'].includes(entity)?{updated_at:new Date().toISOString()}:{})}).eq('user_id',uid).eq('id',id).select('*').maybeSingle();if(e)throw e;if(!data)return error('Not found',404);return response({item:data});
  }
  const {data,error:e}=await sb.from(table).delete().eq('user_id',uid).eq('id',id).select('id').maybeSingle();if(e)throw e;if(!data)return error('Not found',404);return response({ok:true});
 }
 if(action==='admin_list_users'||action==='admin_add_user'||action==='admin_reset_access'||action==='admin_remove_user'){
  if(!pair.u.is_admin)return error('Administrator only',403);
  if(action==='admin_list_users'){
   const {data,error:e}=await sb.from('users').select('id,first_name,last_name,username,is_admin,has_completed_onboarding,password_hash,created_at').order('created_at');if(e)throw e;
   return response({items:data?.map(({password_hash,...u})=>({...u,claimed:!!password_hash}))||[]});
  }
  if(action==='admin_add_user'){
   const username=uname(body.username),first_name=safe(body.first_name),last_name=safe(body.last_name);
   if(!usernameValid(username)||!first_name||!last_name)return error('Check name and username');
   const inviteCode=fresh();const {data,error:e}=await sb.from('users').insert({username,first_name,last_name,is_admin:false,claim_code_hash:await digest(inviteCode)}).select('id,first_name,last_name,username').single();if(e)return error('Username may already be taken',409);
   return response({item:data,inviteCode});
  }
  const id=safe(body.id);if(!id||id===uid)return error('Cannot reset or remove your own administrator account');
  const {data:target}=await sb.from('users').select('id,is_admin').eq('id',id).maybeSingle();if(!target||target.is_admin)return error('Unknown or protected account',403);
  if(action==='admin_reset_access'){
   const inviteCode=fresh();await sb.from('sessions').delete().eq('user_id',id);
   const {error:e}=await sb.from('users').update({password_hash:null,password_salt:null,pin_hash:null,pin_salt:null,has_completed_onboarding:false,claim_code_hash:await digest(inviteCode),failed_login_attempts:0,locked_until:null}).eq('id',id);if(e)throw e;
   return response({ok:true,inviteCode});
  }
  const {error:e}=await sb.from('users').delete().eq('id',id);if(e)throw e;return response({ok:true});
 }
 if(action==='mcp_list'){
  const {data,error:e}=await sb.from('dl_mcp_tokens').select('id,name,created_at,last_used_at,revoked').eq('user_id',uid).order('created_at',{ascending:false});if(e)throw e;
  return response({items:data||[]});
 }
 if(action==='mcp_generate'){
  const name=safe(body.name);if(!name)return error('Token name is required');
  const token=fresh();const {data,error:e}=await sb.from('dl_mcp_tokens').insert({user_id:uid,name,token_hash:await digest(token)}).select('id,name,created_at').single();if(e)throw e;
  return response({item:data,token});
 }
 if(action==='mcp_revoke'){
  const {data,error:e}=await sb.from('dl_mcp_tokens').update({revoked:true}).eq('user_id',uid).eq('id',safe(body.id)).select('id').maybeSingle();if(e)throw e;if(!data)return error('Token not found',404);
  return response({ok:true});
 }
 return error('Unknown action',404);
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'content-type,apikey,authorization,x-client-info'}});
 if(req.method!=='POST')return error('Method not allowed',405);
 try{
  const body=await req.json();if(!body||typeof body!=='object'||Array.isArray(body))return error('Invalid JSON');
  return await handler(body);
 }catch(e){console.error('Daylight API error:',e instanceof Error?e.message:'Unknown error');return error('Request failed — please try again',500)}
});
