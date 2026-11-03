/* Daylight account bootstrap. Only authentication is visually new.
   The existing calendar Store/UI are loaded unmodified after session verification. */
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.118.0';
const URL='https://qrqemjgpzoqhtmsowmqv.supabase.co';
const KEY='sb_publishable_MuX0ICyo0pYrhrj3wu5G0g_v6_gy8Pj';
const BASE=new URL('../',import.meta.url);
const client=createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
const root=document.getElementById('authRoot');
const app=document.getElementById('app');
const isConsent=location.pathname.includes('/oauth/consent');
const consentId=new URLSearchParams(location.search).get('authorization_id');
const icon=(name,size=18)=>'<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+({
 sunrise:'<path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 9V2"/><path d="M4.22 10.22l1.42 1.42"/><path d="M1 18h2"/><path d="M21 18h2"/><path d="M18.36 11.64l1.42-1.42"/><path d="M23 22H1"/><path d="m8 6 4-4 4 4"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
 moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
 eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
 eyeOff:'<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.39-1.61"/><path d="m2 2 20 20"/>',
 alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
 check:'<path d="M20 6 9 17l-5-5"/>'
})[name]+'</svg>';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mode={name:'login',showPassword:false,values:{name:'',email:'',password:''},message:'',error:''};
const e=id=>root.querySelector('#'+id);
let recovering=false,launched=false,revision=0,acknowledged='',pending=null,sending=false,blocked=false,saveTimer=null,currentUser=null;
const rules=p=>[p.length>=8,/[A-Z]/.test(p),/[0-9]/.test(p)];
function art(){
 const bars={3:'#e3a93d',7:'#43b581',11:'#e3a93d',16:'#5b8def',26:'#e3a93d'};
 let cells='';for(let d=1;d<=21;d++)cells+='<div class="auth-art-day'+(d===2?' today':'')+'">'+d+(bars[d]?'<span class="bar" style="background:'+bars[d]+'"></span>':'')+'</div>';
 return '<div class="auth-art"><div class="auth-art-float"><p class="auth-art-month">November</p><div class="auth-art-grid">'+cells+'</div><div class="auth-art-card"><span class="cdot"></span><span>Swim practice</span><span class="ctime">6:30 PM</span></div></div></div>';
}
function pill(id,label,type,placeholder,autocomplete,extras=''){
 return '<div class="auth-field"><label class="auth-pill" data-pill-for="'+id+'"><span class="auth-pill-label">'+label+'</span><input class="auth-pill-input" id="'+id+'" type="'+type+'" placeholder="'+placeholder+'" autocomplete="'+autocomplete+'" value="'+escape(mode.values[id==='authName'?'name':id==='authEmail'?'email':'password'])+'" aria-invalid="false" aria-describedby="'+id+'Err">'+extras+'<span class="auth-hazard-wrap"><button type="button" class="auth-hazard" tabindex="-1" aria-hidden="true">'+icon('alert',19)+'</button><span class="auth-tip" role="tooltip"></span></span></label><div class="auth-error-space"><span class="auth-error" id="'+id+'Err" aria-live="polite"></span></div></div>';
}
function formContent(){
 const login=mode.name==='login',signup=mode.name==='signup',forgot=mode.name==='forgot',reset=mode.name==='recovery';
 const headline=login?'Sign in':signup?'Create account':forgot?'Reset password':'New password';
 const subtitle=login?'create an account':signup?'sign in instead':'back to sign in';
 const r=rules(mode.values.password);
 const rulestxt=['8+ characters','One uppercase letter','One number'];
 const pwrules='<div class="auth-rules" id="authRules">'+r.map((yes,i)=>'<span class="auth-rule'+(yes?' ok':'')+'"><span class="rule-ic">'+icon('check',10)+'</span>'+rulestxt[i]+'</span>').join('')+'</div>';
 return '<div class="auth-mark">'+icon('sunrise',34)+'</div><h1 class="auth-headline">'+headline+'</h1>'+
 '<p class="auth-altline">or <button type="button" id="authSwitch">'+subtitle+'</button></p>'+
 '<div class="auth-fields">'+(signup?pill('authName','Name','text','Your name','name'):'')+
 (!reset?pill('authEmail','Email','email','you@example.com','email'):'')+
 (!forgot?pill('authPassword','Password',mode.showPassword?'text':'password',signup?'Create a password':reset?'New password':'Your password',login?'current-password':'new-password',
 '<button type="button" class="auth-eye" id="authEye" aria-label="'+(mode.showPassword?'Hide':'Show')+' password">'+icon(mode.showPassword?'eyeOff':'eye',18)+'</button>'):'')+
 ((signup||reset)?pwrules:'')+'</div>'+
 '<p class="auth-msg" id="authMessage" '+(mode.error?'role="alert"':'')+'>'+escape(mode.error||mode.message)+'</p>'+
 '<button type="submit" class="auth-primary" id="authSubmit">'+(login?'Log in':signup?'Create account':forgot?'Send reset link':'Update password')+'</button>'+
 (login?'<div class="auth-forgot-row"><a class="auth-forgot" href="#" id="authForgot">Forgot password?</a></div>':'')+
 (signup?'<p class="auth-terms">By continuing, you agree to the <a href="'+BASE.href+'terms.html" target="_blank" rel="noopener">Terms of Service</a> and <a href="'+BASE.href+'privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</p>':'');
}
function display(modeName=mode.name){
 mode.name=modeName;
 if(!e('authScreen')){
  root.innerHTML='<div id="authScreen" class="is-enter"><section class="auth-form-panel"><div class="auth-topbar"><span class="auth-wordmark">daylight.</span><button class="auth-theme-btn" id="authThemeBtn" aria-label="Switch theme"></button></div><form class="auth-form-wrap is-enter" id="authForm" novalidate><div class="auth-form-inner" id="authFormInner"></div></form></section><aside class="auth-visual-panel" aria-hidden="true"><span class="auth-visual-word">daylight.</span>'+art()+'</aside></div>';
  e('authThemeBtn').onclick=()=>{
   document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';
   e('authThemeBtn').innerHTML=icon(document.documentElement.dataset.theme==='dark'?'sun':'moon',17);
  };
  e('authForm').onsubmit=submit;
  setTimeout(()=>{e('authScreen')?.classList.remove('is-enter');e('authForm')?.classList.remove('is-enter')},1100);
 }
 e('authThemeBtn').innerHTML=icon(document.documentElement.dataset.theme==='dark'?'sun':'moon',17);
 const inner=e('authFormInner');
 inner.classList.remove('switch-in','switch-out');
 inner.innerHTML=formContent();
 const inputNames={authName:'name',authEmail:'email',authPassword:'password'};
 Object.entries(inputNames).forEach(([id,key])=>{
  const input=e(id);if(!input)return;
  input.oninput=()=>{mode.values[key]=input.value;input.closest('.auth-pill').classList.remove('err');input.setAttribute('aria-invalid','false');if(e('authMessage')){mode.error='';e('authMessage').textContent=''};if(e('authRules')){const r=rules(mode.values.password);e('authRules').querySelectorAll('.auth-rule').forEach((node,i)=>node.classList.toggle('ok',r[i]))}};
  input.closest('.auth-pill').onclick=ev=>{if(!ev.target.closest('button'))input.focus()};
 });
 e('authSwitch').onclick=()=>{mode.error='';mode.message='';mode.showPassword=false;mode.values.password='';display(mode.name==='login'?'signup':'login')};
 if(e('authForgot'))e('authForgot').onclick=ev=>{ev.preventDefault();mode.error='';mode.message='';display('forgot')};
 if(e('authEye'))e('authEye').onclick=()=>{mode.showPassword=!mode.showPassword;const x=e('authPassword');x.type=mode.showPassword?'text':'password';e('authEye').innerHTML=icon(mode.showPassword?'eyeOff':'eye',18);x.focus()};
}
function showError(key,msg){
 mode.error=msg;mode.message='';if(e('authMessage')){e('authMessage').textContent=msg;e('authMessage').setAttribute('role','alert')}
 const id={name:'authName',email:'authEmail',password:'authPassword'}[key];const input=e(id);
 if(input){input.closest('.auth-pill').classList.add('err');input.setAttribute('aria-invalid','true');const tooltip=input.closest('.auth-pill').querySelector('.auth-tip');tooltip.textContent=msg;const hazard=input.closest('.auth-pill').querySelector('.auth-hazard');hazard.removeAttribute('aria-hidden');hazard.tabIndex=0;hazard.onclick=()=>hazard.closest('.auth-hazard-wrap').classList.toggle('tip-open');input.focus()}
}
async function submit(ev){
 ev.preventDefault();
 const fields={...mode.values};const kind=mode.name;
 if(kind==='signup'&&!fields.name.trim())return showError('name',"Name can't be empty");
 if(kind!=='recovery'&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.trim()))return showError('email','Enter a valid email address');
 if(kind!=='forgot'&&!fields.password)return showError('password',"Password can't be empty");
 if(['signup','recovery'].includes(kind)&&!rules(fields.password).every(Boolean))return showError('password','Use 8+ characters, an uppercase letter, and a number');
 const button=e('authSubmit');button.disabled=true;
 try{
  let response;
  if(kind==='login'){
   response=await client.auth.signInWithPassword({email:fields.email.trim(),password:fields.password});
   if(response.error)throw response.error;
   currentUser=response.data.user;
   if(isConsent)await showConsent();else await launch();
   return;
  }
  if(kind==='signup'){
   response=await client.auth.signUp({email:fields.email.trim(),password:fields.password,options:{data:{name:fields.name.trim(),first_name:fields.name.trim().split(/\s+/)[0]},emailRedirectTo:BASE.href}});
   if(response.error)throw response.error;
   if(response.data.session){currentUser=response.data.user;if(isConsent)await showConsent();else await launch();return}
   mode.values.password='';mode.name='login';mode.error='';mode.message='Check your email to confirm your new account, then sign in.';display();return;
  }
  if(kind==='forgot'){
   response=await client.auth.resetPasswordForEmail(fields.email.trim(),{redirectTo:BASE.href});
   if(response.error)throw response.error;
   mode.name='login';mode.error='';mode.message='If this account exists, a password reset link has been sent.';display();return;
  }
  if(kind==='recovery'){
   response=await client.auth.updateUser({password:fields.password});
   if(response.error)throw response.error;
   recovering=false;await client.auth.signOut();mode.values.password='';mode.error='';mode.message='Password updated. Sign in with the new password.';display('login');
  }
 }catch(err){showError(kind==='signup'&&/password/i.test(err.message)?'password':'email',err?.message||'The request failed. Please try again.')}
 finally{if(button.isConnected)button.disabled=false}
}
const defaultData=user=>{
 const name=user.user_metadata?.first_name||user.user_metadata?.name?.split(/\s+/)[0]||user.email?.split('@')[0]||'there';
 const calendars=[
  {id:'personal',name:'Personal',color:'blue',hidden:true,subscribed:false,feedUrl:null,source:null,lastSync:null},
  {id:'work',name:'Work',color:'violet',hidden:true,subscribed:false,feedUrl:null,source:null,lastSync:null},
  {id:'life',name:'Life & plans',color:'green',hidden:true,subscribed:false,feedUrl:null,source:null,lastSync:null},
  {id:'holidays',name:'US Holidays',color:'amber',hidden:false,subscribed:true,feedUrl:window.US_HOLIDAYS_FEED_URL||null,source:'bundled',lastSync:Date.now()}
 ];
 const parsed=window.ICAL?.parse(window.US_HOLIDAYS_ICS||'')?.events||[];
 const events=parsed.map((rec,i)=>({id:'holiday-'+i,cal:'holidays',title:rec.title,loc:rec.loc||'',desc:rec.desc||'',allDay:!!rec.allDay,startMs:rec.startMs,endMs:rec.endMs,rrule:rec.rrule||null,repeat:null,exdates:rec.exdates||[],uid:rec.uid,feedKey:rec.feedKey,declined:!!rec.declined}));
 return {version:1,calendars,events,tasks:[],settings:{themeMode:'dark',firstName:name,tzLabel:new Intl.DateTimeFormat('en-US',{timeZoneName:'short'}).formatToParts(new Date()).find(p=>p.type==='timeZoneName')?.value||'EST',weekNumbers:false,showDeclined:true,reduceMotion:false,defaultView:'month',sidebarRail:false,notify15:true,notifyDaily:false},ui:{cursorMs:null,selectedMs:null,miniCursorMs:null,miniSelectedMs:null},notified:{},lastDailySummary:null};
};
function loadScript(path){return new Promise((resolve,reject)=>{const tag=document.createElement('script');tag.src=new URL(path,BASE).href;tag.onload=resolve;tag.onerror=()=>reject(new Error('Could not load '+path));document.body.append(tag)})}
async function flush(){
 if(sending||blocked||!pending||!currentUser)return;
 sending=true;const blob=pending;pending=null;
 try{
  const result=await client.rpc('daylight_save_snapshot',{expected_revision:revision,document:JSON.parse(blob)});
  if(result.error)throw result.error;
  revision=Number(result.data);acknowledged=blob;
 }catch(err){
  pending=blob;blocked=true;
  console.error('Daylight cloud save failed',err);
  document.getElementById('toastRoot')?.append(Object.assign(document.createElement('div'),{className:'toast',textContent:'Your latest changes were not saved: '+(err?.message||'connection error')+'. Keep this tab open and reload after checking your connection.'}));
 }finally{sending=false;if(pending&&!blocked)setTimeout(flush,100)}
}
function queueSave(){
 if(!currentUser||blocked||!window.DaylightStore?.data)return;
 const serialized=JSON.stringify(window.DaylightStore.data);
 if(serialized===acknowledged)return;
 pending=serialized;clearTimeout(saveTimer);saveTimer=setTimeout(flush,500);
}
async function launch(){
 if(launched)return;launched=true;
 try{
  const {data,error}=await client.from('workspace_snapshots').select('payload,revision').eq('user_id',currentUser.id).maybeSingle();
  if(error)throw error;
  revision=Number(data?.revision||0);
  await loadScript('js/holidays.js');await loadScript('js/ics.js');await loadScript('js/rrule.js');await loadScript('js/store.js');
  const store=window.DaylightStore;
  let initial=data?.payload||defaultData(currentUser);
  acknowledged=data?.payload?JSON.stringify(initial):'';
  store.load=()=>{if(!store.data)store.data=structuredClone(initial);return store.data};
  store.save=queueSave;
  await loadScript('js/app.js');
  await loadScript('js/ai-access-logic.js');
  if(!data)queueSave();
  if(app)app.hidden=false;
  root.innerHTML='';
  // Read-only polling: cross-device updates are applied only when there are no unsaved edits.
  setInterval(async()=>{
   if(pending||sending||blocked||!currentUser)return;
   const {data:latest,error:err}=await client.from('workspace_snapshots').select('payload,revision').eq('user_id',currentUser.id).maybeSingle();
   if(err||!latest||latest.revision<=revision)return;
   revision=latest.revision;acknowledged=JSON.stringify(latest.payload);store.data=latest.payload;
   if(typeof window.syncFromStore==='function'&&typeof window.renderAll==='function'){window.syncFromStore();window.renderAll(false)}
  },20000);
 }catch(error){launched=false;console.error('Daylight loading failed',error);mode.error='Could not load your private calendar: '+error.message;display('login')}
}
async function showConsent(){
 if(!consentId||!client.auth.oauth){mode.error='OAuth is not enabled or the authorization request is invalid.';display();return}
 try{
  const {data,error}=await client.auth.oauth.getAuthorizationDetails(consentId);
  if(error)throw error;
  if(data.redirect_url&&!data.authorization_id){location.assign(data.redirect_url);return}
  const c=data.client||{},clientId=String(c.client_id||c.id||data.client_id||''),label=String(c.client_name||c.name||data.client_name||'Unrecognized application');
  if(!clientId)throw Error('OAuth client identity is missing.');
  if(!e('authScreen'))display('login');
  const inner=e('authFormInner');
  inner.innerHTML='<div class="auth-mark">'+icon('sunrise',34)+'</div><h1 class="auth-headline">Authorize access</h1>'+
    '<p class="auth-altline">'+escape(label)+' wants to connect to daylight.</p>'+
    '<div class="auth-consent-box"><strong>Requested by:</strong> '+escape(label)+'<br><strong>Scopes:</strong> '+escape(data.scope||'profile')+
    '<p>Choose what this AI tool can do with your calendar:</p><label><input type="checkbox" id="allowRead" checked disabled> Read your events and calendars</label><br>'+
    '<label><input type="checkbox" id="allowWrite"> Create and edit events</label><br>'+
    '<label><input type="checkbox" id="allowDelete"> Delete events</label><p style="color:var(--auth-muted)">Permissions can be revoked in Settings → AI access.</p></div>'+
    '<p class="auth-msg" role="alert" id="consentError"></p><div class="auth-consent-actions"><button type="button" class="auth-secondary" id="denyAccess">Deny</button><button type="button" class="auth-primary" id="approveAccess">Approve</button></div>';
  e('allowWrite').onchange=()=>{if(!e('allowWrite').checked)e('allowDelete').checked=false};
  e('allowDelete').onchange=()=>{if(e('allowDelete').checked)e('allowWrite').checked=true};
  const decide=async approved=>{
   const btn=e(approved?'approveAccess':'denyAccess');btn.disabled=true;
   try{
    if(approved){
     const {error:grantError}=await client.from('oauth_mcp_grants').upsert({user_id:currentUser.id,client_id:clientId,client_name:label,can_read:true,can_write:e('allowWrite').checked,can_delete:e('allowDelete').checked,revoked:false,approved_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'user_id,client_id'});
     if(grantError)throw grantError;
    }
    const result=await (approved?client.auth.oauth.approveAuthorization(consentId):client.auth.oauth.denyAuthorization(consentId));
    if(result.error)throw result.error;
    if(!result.data?.redirect_url)throw Error('Authorization did not return a callback URL');
    location.assign(result.data.redirect_url);
   }catch(err){e('consentError').textContent=err.message||'Authorization failed';btn.disabled=false}
  };
  e('denyAccess').onclick=()=>decide(false);e('approveAccess').onclick=()=>decide(true);
 }catch(err){mode.error='Unable to verify authorization request: '+err.message;display()}
}
async function signOut(){
 clearTimeout(saveTimer);if(pending)await flush();
 if(blocked)throw Error('Your changes are not saved yet; resolve sync before signing out.');
 const {error}=await client.auth.signOut();if(error)throw error;location.replace(BASE.href)
}
window.DaylightCloud={client,signOut,flush,BASE:BASE.href,getUser:()=>currentUser,savePending:()=>!!pending||sending||blocked};
client.auth.onAuthStateChange((event,session)=>{
 if(event==='PASSWORD_RECOVERY'){recovering=true;currentUser=session?.user;mode.error='';mode.values.password='';display('recovery')}
 if(event==='SIGNED_OUT'){currentUser=null;if(launched)location.replace(BASE.href)}
});
(async()=>{
 const {data:{session},error}=await client.auth.getSession();
 if(error)console.warn('Session restore',error.message);
 if(recovering||location.hash.includes('type=recovery')||new URLSearchParams(location.search).get('type')==='recovery'){
   recovering=true;currentUser=session?.user||null;display('recovery');return;
 }
 if(session?.user){const result=await client.auth.getUser();if(!result.error&&result.data.user){currentUser=result.data.user;if(isConsent)await showConsent();else await launch();return}}
 if(isConsent&&!consentId){mode.error='Missing OAuth authorization request';display('login');return}
 display('login');
})().catch(err=>{console.error('Daylight bootstrap',err);mode.error=err.message;display('login')});
