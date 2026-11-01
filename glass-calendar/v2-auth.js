/* Daylight v2 — Supabase Auth and per-account snapshot sync.
 * Publishable key only; no service role credentials are used in the browser.
 * Sync is intentionally opt-in when existing browser data is detected.
 */
(()=>{
'use strict';
const URL='https://qrqemjgpzoqhtmsowmqv.supabase.co';
const PUBLISHABLE='sb_publishable_MuX0ICyo0pYrhrj3wu5G0g_v6_gy8Pj';
const TOKEN='daylight-supabase-session-v2',BACKUP='daylight-v1-local-backup-v2';
const KEYS=['daylight-events-v1','daylight-calendars-v1','daylight-tasks-v1','daylight-theme','daylight-accent','daylight-name','daylight-default-view','daylight-last-view','daylight-last-date','daylight-week-start','daylight-subscriptions-v1','daylight-holidays','daylight-onboarded','daylight-task-reminders','daylight-sidebar-collapsed'];
const AUTH_EVENTS=['daylight:ready','daylight:synced'];
const $=id=>document.getElementById(id);
const root=document.documentElement;
const safeParse=s=>{try{return JSON.parse(s)}catch{return null}};
const token=()=>safeParse(localStorage.getItem(TOKEN));
const storeSession=s=>s?localStorage.setItem(TOKEN,JSON.stringify(s)):localStorage.removeItem(TOKEN);
let active=null,dirty=false,syncTimer=null,lastPayload='',syncBusy=false;
const toSnapshot=()=>{const payload={};for(const k of KEYS){const v=localStorage.getItem(k);if(v!==null)payload[k]=v}return payload};
const hasMeaningfulLocal=()=>KEYS.some(k=>{const v=localStorage.getItem(k);if(v===null)return false;if(k==='daylight-events-v1'||k==='daylight-tasks-v1'||k==='daylight-subscriptions-v1')return Array.isArray(safeParse(v))&&safeParse(v).length>0;if(k==='daylight-calendars-v1')return Array.isArray(safeParse(v))&&safeParse(v).some(c=>!['personal','work','life','us-holidays'].includes(c.id));return false});
function setStatus(state,label){let badge=$('cloudSyncStatus');if(!badge)return;badge.dataset.state=state;badge.textContent=label}
function message(text){const e=$('authError');e.hidden=!text;e.textContent=text||''}
function authView(view){for(const f of document.querySelectorAll('.auth-form'))f.hidden=f.dataset.authMode!==view;$('authHeading').textContent=({login:'Welcome back',signup:'Create your account',recover:'Reset your password'})[view]||'Sign in';message('')}
function showGate(mode='login'){root.dataset.daylightAuthenticated='false';$('authGateway').hidden=false;authView(mode)}
function ready(){active=true;root.dataset.daylightAuthenticated='true';$('authGateway').hidden=true;window.dispatchEvent(new Event('daylight:ready'));updateAccountUI()}
function updateAccountUI(){const name=localStorage.getItem('daylight-name')||'';const user=token()?.user;if($('cloudAccountName'))$('cloudAccountName').textContent=user?.email||name||'Signed in';if($('cloudSyncStatus'))setStatus('saved','Saved to cloud')}
function expirySoon(s){return !s?.expires_at||s.expires_at<Math.floor(Date.now()/1000)+90}
async function request(path,options={}){
 const headers={'apikey':PUBLISHABLE,'Content-Type':'application/json',...(options.headers||{})};
 const r=await fetch(URL+path,{...options,headers});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(data.msg||data.error_description||data.message||data.error||'Request failed ('+r.status+')');
 return data;
}
async function refreshSession(){
 const session=token();if(!session?.refresh_token)return null;
 try{const result=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})});storeSession(result);return result}catch{storeSession(null);return null}
}
async function getSession(){
 const s=token();if(!s?.access_token)return null;return expirySoon(s)?await refreshSession():s
}
async function cloud(path,opts={}){
 let session=await getSession();
 if(!session)throw new Error('Session expired; please sign in again.');
 return request(path,{...opts,headers:{...opts.headers,Authorization:'Bearer '+session.access_token}});
}
function preserveLocalOnce(){if(!localStorage.getItem(BACKUP)&&hasMeaningfulLocal())localStorage.setItem(BACKUP,JSON.stringify({savedAt:new Date().toISOString(),payload:toSnapshot()}))}
function hydrate(payload){
 preserveLocalOnce();
 for(const k of KEYS){if(Object.prototype.hasOwnProperty.call(payload,k))localStorage.setItem(k,String(payload[k]));else localStorage.removeItem(k)}
}
async function readCloud(){
 const session=token();const id=session?.user?.id;if(!id)throw new Error('Not signed in');
 const rows=await cloud('/rest/v1/workspace_snapshots?select=payload,updated_at&user_id=eq.'+encodeURIComponent(id));
 return rows?.[0]||null;
}
async function upload(payload){
 const id=token()?.user?.id;if(!id)throw new Error('No account');
 await cloud('/rest/v1/workspace_snapshots?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:id,payload})});
 lastPayload=JSON.stringify(payload);dirty=false;setStatus('saved','Saved to cloud');window.dispatchEvent(new Event('daylight:synced'));
}
function enterApp(payload){if(payload)hydrate(payload);sessionStorage.setItem('daylight-hydrated-user',token()?.user?.id||'');ready();location.reload()}
async function bootstrap(){
 const s=await getSession();
 if(!s?.user){showGate();return}
 if(!localStorage.getItem('daylight-name')&&s.user.user_metadata){const data=s.user.user_metadata;localStorage.setItem('daylight-name',[data.first_name,data.last_name].filter(Boolean).join(' '))}
 $('authGateway').hidden=false;root.dataset.daylightAuthenticated='false';
 try{
 const row=await readCloud();const snapshot=row?.payload||null;
 if(sessionStorage.getItem('daylight-hydrated-user')===s.user.id&&snapshot){
   // On reload keep the already-hydrated in-memory data, and reconcile on next sync.
   lastPayload=JSON.stringify(toSnapshot());ready();return;
 }
 if(!snapshot){
   if(hasMeaningfulLocal()){
     $('authChoice').hidden=false;authView('choice');$('authHeading').textContent='Bring your calendar along';return;
   }
   await upload(toSnapshot());enterApp();return;
 }
 if(hasMeaningfulLocal()&&!localStorage.getItem(BACKUP)&&sessionStorage.getItem('daylight-hydrated-user')!==s.user.id){
   $('authChoice').hidden=false;authView('choice');$('authHeading').textContent='Choose your calendar data';$('authImport').dataset.existing='true';return;
 }
 enterApp(snapshot);
 }catch(e){authView('error');message('Could not load cloud data: '+e.message+'. Your local data has not been overwritten.')}
}
async function sync(){
 if(!active||syncBusy)return;
 const payload=toSnapshot(),json=JSON.stringify(payload);if(json===lastPayload)return;
 syncBusy=true;setStatus('saving','Saving…');
 try{await upload(payload)}catch(e){dirty=true;setStatus('error','Not synced — retry');console.warn('Daylight sync failed:',e.message)}finally{syncBusy=false}
}
function scheduleSync(){if(!active)return;clearTimeout(syncTimer);syncTimer=setTimeout(sync,1300)}
function clearLocal(){for(const k of KEYS)localStorage.removeItem(k)}
async function signOut(){
 try{const s=await getSession();if(s)await request('/auth/v1/logout',{method:'POST',headers:{Authorization:'Bearer '+s.access_token}})}catch{}
 preserveLocalOnce();clearLocal();storeSession(null);sessionStorage.removeItem('daylight-hydrated-user');location.reload()
}
function bindAuth(){
 for(const tab of document.querySelectorAll('[data-auth-link]'))tab.onclick=()=>authView(tab.dataset.authLink);
 $('authLogin').addEventListener('submit',async e=>{e.preventDefault();message('');const button=e.target.querySelector('[type=submit]');button.disabled=true;try{const form=new FormData(e.target);const result=await request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:String(form.get('email')).trim(),password:String(form.get('password'))})});storeSession(result);await bootstrap()}catch(err){message(err.message)}finally{button.disabled=false}});
 $('authSignup').addEventListener('submit',async e=>{e.preventDefault();message('');const button=e.target.querySelector('[type=submit]');button.disabled=true;const form=new FormData(e.target),username=String(form.get('username')||'').trim().toLowerCase(),email=String(form.get('email')||'').trim();
 if(!/^[a-z][a-z0-9_]{2,29}$/.test(username)){button.disabled=false;message('Use 3–30 lowercase letters, numbers, and underscores, starting with a letter.');return}
 try{const result=await request('/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password:String(form.get('password')),data:{username,first_name:String(form.get('first_name')||'').trim(),last_name:String(form.get('last_name')||'').trim()}})});if(result.access_token){storeSession(result);await bootstrap()}else{authView('login');message('Check your email for a confirmation link, then sign in.')}}catch(err){message(err.message)}finally{button.disabled=false}});
 $('authRecover').addEventListener('submit',async e=>{e.preventDefault();message('');const button=e.target.querySelector('[type=submit]');button.disabled=true;try{const email=String(new FormData(e.target).get('email')||'').trim();await request('/auth/v1/recover',{method:'POST',body:JSON.stringify({email})});authView('login');message('If the address has an account, a recovery email has been sent.')}catch(err){message(err.message)}finally{button.disabled=false}});
 $('authImport').onclick=async()=>{const existing=$('authImport').dataset.existing==='true';$('authImport').disabled=true;try{preserveLocalOnce();if(existing)await upload(toSnapshot());else await upload(toSnapshot());enterApp()}catch(e){message(e.message)}finally{$('authImport').disabled=false}};
 $('authUseCloud').onclick=async()=>{try{const row=await readCloud();if(row)enterApp(row.payload);else{preserveLocalOnce();clearLocal();await upload({});enterApp()}}catch(e){message(e.message)}};
 $('cloudSignOut')?.addEventListener('click',signOut);
 $('cloudSyncNow')?.addEventListener('click',sync);
}
bindAuth();
window.DaylightCloud={sync,signOut,getSession,projectRef:'qrqemjgpzoqhtmsowmqv'};
window.addEventListener('storage',e=>{if(KEYS.includes(e.key))scheduleSync()});
document.addEventListener('click',()=>{if(active)scheduleSync()},true);
document.addEventListener('change',()=>{if(active)scheduleSync()},true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleSync()});
setInterval(()=>{if(active)scheduleSync()},20000);
bootstrap();
})();