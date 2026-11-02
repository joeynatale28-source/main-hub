// Daylight's authenticated Supabase adapter. The supplied preview UI remains unchanged.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.49.10';
const url='https://qrqemjgpzoqhtmsowmqv.supabase.co';
const key='sb_publishable_MuX0ICyo0pYrhrj3wu5G0g_v6_gy8Pj';
export const supabase=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let currentUser=null;
const ensure=()=>{if(!currentUser)throw Error('Please sign in.');return currentUser.id};
const isDataEntity=e=>['calendars','events','tasks','settings'].includes(e);
const shadeHex={blue:'#5B8DEF',violet:'#9A7FF0',green:'#43B581',amber:'#E3A93D',rose:'#E5646E',teal:'#3FB6B2',plum:'#C65D8F',gray:'#8A8F98'};
function check(result){if(result.error)throw result.error;return result.data}
function normalizeSettings(s){return {...s,show_week_numbers:s.week_numbers,show_declined_events:s.show_declined}}
export async function localApi(action,payload={}){
 const uid=ensure(),entity=payload.entity,table=entity==='settings'?'user_settings':entity;
 if(action==='auth_session')return {user:{id:uid,first_name:currentUser.user_metadata?.first_name||currentUser.email?.split('@')[0]||'',last_name:currentUser.user_metadata?.last_name||'',email:currentUser.email}};
 if(action==='user_update'){
  const first_name=String(payload.first_name||'').trim(),last_name=String(payload.last_name||'').trim();
  const result=await supabase.auth.updateUser({data:{first_name,last_name}});check(result);currentUser=result.data.user;
  await check(supabase.from('user_settings').update({first_name}).eq('user_id',uid));return {user:currentUser};
 }
 if(!isDataEntity(entity))throw Error('Unsupported data request');
 if(action==='data_list'){
  const result=await supabase.from(table).select('*').eq('user_id',uid).order(entity==='calendars'?'sort_order':'created_at',{ascending:true});
  const data=check(result);
  return {items:entity==='settings'?data.map(normalizeSettings):data};
 }
 if(action==='data_create'){
  if(entity==='settings')throw Error('Settings already exist');
  const data={...payload.data,user_id:uid};
  if(entity==='calendars'){data.color=shadeHex[data.shade]||shadeHex.blue;data.visible=data.is_visible!==false;data.source_type='local'}
  if(entity==='events'){
   data.location=data.location_address||data.location_name||'';
   data.recurrence=data.repeat_rule?.frequency||'never';
   delete data.exdates;
  }
  const result=await supabase.from(table).insert(data).select().single();
  return {item:check(result)};
 }
 if(action==='data_update'){
  if(entity==='settings'){
   const inp=payload.data||{},data={};
   for(const [a,b] of Object.entries({theme:'theme',default_view:'default_view',show_week_numbers:'week_numbers',show_declined_events:'show_declined',reduce_motion:'reduce_motion',first_name:'first_name'}))if(a in inp)data[b]=inp[a];
   const result=await supabase.from(table).update(data).eq('user_id',uid).select().single();return {item:check(result)};
  }
  const data={...payload.data};if(entity==='calendars'){if(data.shade)data.color=shadeHex[data.shade];if('is_visible'in data)data.visible=data.is_visible}
  if(entity==='events'){data.location=data.location_address||data.location_name||'';data.recurrence=data.repeat_rule?.frequency||'never';delete data.exdates}
  const result=await supabase.from(table).update(data).eq('id',payload.id).eq('user_id',uid).select().single();
  return {item:check(result)};
 }
 if(action==='data_delete'){
  const result=await supabase.from(table).delete().eq('id',payload.id).eq('user_id',uid).select().single();
  return {item:check(result)};
 }
 throw Error('Unsupported action');
}
export function localReset(){throw Error('Authenticated data cannot be reset without confirmation')}
export async function bootAuth(ready){
 const app=document.getElementById('app'),overlay=document.createElement('div');
 overlay.id='authScreen';overlay.style.cssText='position:fixed;inset:0;z-index:9999;background:var(--bg);display:grid;place-items:center;padding:24px;color:var(--text);font-family:Inter,sans-serif';
 const card='<section style="max-width:420px;width:100%;border:1px solid var(--line);background:var(--surface);border-radius:16px;padding:32px"><div style="width:46px;height:46px;background:#2e7dff;border-radius:12px;display:grid;place-items:center;color:#fff;font-weight:800;font-size:22px">☀</div><h1 style="font-size:25px;margin:18px 0 4px">daylight.</h1><p style="font-size:13px;color:var(--muted);margin:0 0 24px">Sign in to your personal calendar.</p><form id="authForm" novalidate><label for="email" style="display:block;margin-bottom:6px">Email</label><input id="email" type="email" autocomplete="username" class="text-input" placeholder="you@example.com" required style="margin-bottom:14px"><label for="password" style="display:block;margin-bottom:6px">Password</label><input id="password" type="password" autocomplete="current-password" class="text-input" required><p id="authError" role="alert" style="min-height:20px;color:var(--danger);font-size:12px;margin:8px 0"></p><button type="submit" class="btn-primary" style="margin:0;width:100%">Log in</button></form><button id="forgot" style="color:var(--muted);margin-top:16px;font-size:13px">Forgot password?</button><div id="resetArea" style="display:none;color:var(--muted);font-size:12px;padding-top:12px">Enter your email above, then click Send reset link.<button id="sendReset" class="btn-ghost" style="width:100%;margin-top:8px">Send reset link</button></div></section>';
 overlay.innerHTML=card;document.body.append(overlay);
 function fail(e){document.getElementById('authError').textContent=e?.message||String(e)}
 async function start(){
  overlay.style.display='none';
  try{await check(supabase.rpc('daylight_ensure_workspace'));await ready()}
  catch(e){overlay.style.display='grid';fail(e)}
 }
 const {data:{session}}=await supabase.auth.getSession();
 if(session){currentUser=session.user;await start()}
 document.getElementById('authForm').onsubmit=async e=>{
  e.preventDefault();const email=document.getElementById('email').value.trim(),password=document.getElementById('password').value;
  if(!email||!password){fail('Enter your email and password.');return}
  document.getElementById('authError').textContent='';
  const result=await supabase.auth.signInWithPassword({email,password});
  if(result.error){fail(result.error);return}
  currentUser=result.data.user;await start();
 };
 document.getElementById('forgot').onclick=()=>{document.getElementById('resetArea').style.display='block'};
 document.getElementById('sendReset').onclick=async()=>{
  const email=document.getElementById('email').value.trim();
  if(!email){fail('Enter your email address first.');return}
  const r=await supabase.auth.resetPasswordForEmail(email,{redirectTo:new URL('./',location.href).href});
  fail(r.error||'If this account exists, a reset email has been sent.');
 };
 supabase.auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_OUT'){currentUser=null;overlay.style.display='grid'}
  if(event==='PASSWORD_RECOVERY'){currentUser=session?.user||null;fail('Use the reset link to change your password through your account.')}
 });
}
export async function signOut(){await supabase.auth.signOut();currentUser=null}
