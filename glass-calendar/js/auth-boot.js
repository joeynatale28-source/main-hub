/* Daylight account bootstrap. Only authentication is visually new.
   The existing calendar Store/UI are loaded unmodified after session verification. */
const URL='https://qrqemjgpzoqhtmsowmqv.supabase.co';
const KEY='sb_publishable_MuX0ICyo0pYrhrj3wu5G0g_v6_gy8Pj';
const BASE=new URL('../',import.meta.url);
let client=null;
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
const mode={name:'login',showPassword:false,values:{name:'',email:'',password:'',confirm:''},message:'',error:'',code:'',resendUntil:0,verifying:false};
let otpTicker=null,recoveryFlow=false,authTransitionSeq=0;
const e=id=>root.querySelector('#'+id);
let recovering=false,launched=false,revision=0,acknowledged='',pending=null,sending=false,blocked=false,saveTimer=null,currentUser=null;
const rules=p=>[p.length>=12,/[A-Z]/.test(p),/[a-z]/.test(p),/[0-9]/.test(p),/[^A-Za-z0-9]/.test(p)];
function art(){
 const bars={3:'#e3a93d',7:'#43b581',11:'#e3a93d',16:'#5b8def',26:'#e3a93d'};
 const titles=['Swim practice','Soccer game','Q1 meeting'];
 const colors=['#5b8def','#8b7cf6','#43b581','#e3a93d','#e5534b'];
 const title=titles[Math.floor(Math.random()*titles.length)];
 const color=colors[Math.floor(Math.random()*colors.length)];
 const minutes=420+Math.floor(Math.random()*27)*30;
 const h=Math.floor(minutes/60),m=minutes%60;
 const time=(h%12||12)+':'+String(m).padStart(2,'0')+' '+(h>=12?'PM':'AM');
 let cells='';for(let d=1;d<=21;d++)cells+='<div class="auth-art-day'+(d===2?' today':'')+'">'+d+(bars[d]?'<span class="bar" style="background:'+bars[d]+'"></span>':'')+'</div>';
 return '<div class="auth-art"><div class="auth-art-float"><p class="auth-art-month">November</p><div class="auth-art-grid">'+cells+'</div><div class="auth-art-card" style="--card-accent:'+color+'"><span class="cdot"></span><span class="ctitle">'+title+'</span><span class="ctime">'+time+'</span></div></div></div>';
}
function pill(id,label,type,placeholder,autocomplete,extras=''){
 return '<div class="auth-field"><label class="auth-pill" data-pill-for="'+id+'"><span class="auth-pill-label">'+label+'</span><input class="auth-pill-input" id="'+id+'" type="'+type+'" placeholder="'+placeholder+'" autocomplete="'+autocomplete+'" value="'+escape(mode.values[id==='authName'?'name':id==='authEmail'?'email':id==='authConfirmPw'?'confirm':'password'])+'" aria-invalid="false" aria-describedby="'+id+'Err">'+extras+'<span class="auth-hazard-wrap"><button type="button" class="auth-hazard" tabindex="-1" aria-hidden="true">'+icon('alert',19)+'</button><span class="auth-tip" role="tooltip"></span></span></label><div class="auth-error-space"><span class="auth-error" id="'+id+'Err" aria-live="polite"></span></div></div>';
}

function formContent(){
 const login=mode.name==='login',signup=mode.name==='signup',forgot=mode.name==='forgot',code=mode.name==='code',reset=mode.name==='recovery';
 const heading=login?'Sign in':signup?'Create account':'Reset your password';
 const subtitle=login?'or <button type="button" id="authSwitch">create an account</button>':
 signup?'or <button type="button" id="authSwitch">sign in instead</button>':
 forgot?'Enter the email address for your account.':
 code?'Enter the 6-digit code sent to your email.':'Choose a new password for your account.';
 const pw=mode.values.password,valid=rules(pw);
 const labels=['At least 12 characters','An uppercase letter (A–Z)','A lowercase letter (a–z)','A number (0–9)','A symbol (e.g. ! @ # $ %)'];
 const ruleHtml='<div class="auth-rules-wrap'+(pw?' show':'')+'" id="authRulesWrap"'+(!pw?' aria-hidden="true"':'')+'><div class="auth-rules" id="authRules">'+labels.map((label,i)=>
 '<span class="auth-rule'+(valid[i]?' ok':'')+'"><span class="rule-ic">'+icon('check',11)+'</span>'+label+'</span>').join('')+'</div></div>';
 const pwField=(label,placeholder,id='authPassword')=>pill(id,label,'password',placeholder,'new-password',
 '<button type="button" class="auth-eye" id="'+(id==='authPassword'?'authEye':id+'Eye')+'" aria-label="Show password">'+icon('eye',18)+'</button>');
 const emailField=pill('authEmail','Email','email','you@example.com','email');
 const codeHtml='<div class="auth-code-row" id="authCodeRow">'+Array.from({length:6},(_,i)=>
 '<input class="auth-code-box" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" data-digit="'+i+'" aria-label="Code digit '+(i+1)+' of 6">').join('')+'</div>'+
 '<div class="auth-code-msg" id="authCodeMsg" aria-live="polite">'+icon('alert',14)+'<span id="authCodeMsgText">That code is invalid.</span></div>'+
 '<div class="auth-resend-row"><button class="auth-forgot auth-resend" id="authResend" type="button">Resend code</button></div>';
 const fields=code?codeHtml:
 (signup?pill('authName','Name','text','Your name','name'):'')+(reset?'':emailField)+
 (login?pill('authPassword','Password','password','Your password','current-password','<button type="button" class="auth-eye" id="authEye" aria-label="Show password">'+icon('eye',18)+'</button>'):'')+
 (signup||reset?pwField(reset?'New password':'Password',reset?'Create a new password':'Create a password')+ruleHtml:'')+
 (reset?pwField('Confirm new password','Enter it again','authConfirmPw'):'');
 const btn=login?'Log in':signup?'Create account':forgot?'Send reset code':reset?'Reset password':'';
 return '<div class="auth-mark">'+icon('sunrise',34)+'</div><h1 class="auth-headline">'+heading+'</h1>'+
 '<p class="auth-altline">'+subtitle+'</p><div class="auth-fields">'+fields+'</div>'+
 '<p class="auth-msg" id="authMessage" role="status" aria-live="polite">'+escape(mode.error||mode.message)+'</p>'+
 (btn?'<button type="submit" class="auth-primary" id="authSubmit">'+btn+'</button>':'')+
 (login?'<div class="auth-forgot-row"><a class="auth-forgot" href="#" id="authForgot">Forgot password?</a></div>':'')+
 (forgot||code||reset?'<div class="auth-forgot-row"><button class="auth-forgot" type="button" id="authBackSignIn">Back to sign in</button></div>':'')+
 (signup?'<p class="auth-terms">By continuing, you agree to the <a href="'+BASE.href+'terms.html" target="_blank" rel="noopener">Terms of Service</a> and <a href="'+BASE.href+'privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</p>':'');
}
function redrawRules(){
 const wrap=e('authRulesWrap');if(!wrap)return;
 const pw=mode.values.password;
 wrap.classList.toggle('show',!!pw);wrap.setAttribute('aria-hidden',pw?'false':'true');
 wrap.querySelectorAll('.auth-rule').forEach((n,i)=>n.classList.toggle('ok',rules(pw)[i]));
}
function bindOtp(){
 const boxes=Array.from(root.querySelectorAll('.auth-code-box'));if(!boxes.length)return;
 const read=()=>{mode.code=boxes.map(x=>x.value).join('');if(mode.code.length===6)verifyCode()};
 const clear=()=>{e('authCodeRow')?.classList.remove('err','ok','shake');e('authCodeMsg')?.classList.remove('show')};
 boxes.forEach((box,i)=>{
  box.oninput=()=>{
   clear();let value=box.value.replace(/\D/g,'');
   if(value.length>1){for(let j=0;j<value.length&&i+j<6;j++)boxes[i+j].value=value[j];boxes[Math.min(i+value.length,5)].focus()}
   else{box.value=value;if(value&&i<5)boxes[i+1].focus()}
   read();
  };
  box.onkeydown=ev=>{
   if(ev.key==='Backspace'&&!box.value&&i>0){ev.preventDefault();boxes[i-1].value='';boxes[i-1].focus();clear();read()}
   if(ev.key==='ArrowLeft'&&i>0){ev.preventDefault();boxes[i-1].focus()}
   if(ev.key==='ArrowRight'&&i<5){ev.preventDefault();boxes[i+1].focus()}
  };
  box.onfocus=()=>box.select();
 });
 e('authCodeRow').onpaste=ev=>{
  ev.preventDefault();clear();
  const d=String(ev.clipboardData?.getData('text')||'').replace(/\D/g,'').slice(0,6);
  boxes.forEach((box,i)=>box.value=d[i]||'');boxes[Math.min(d.length,5)].focus();read();
 };
 e('authResend').onclick=()=>sendRecovery(true);
 if(otpTicker)clearInterval(otpTicker);
 const tick=()=>{
  const b=e('authResend');if(!b){clearInterval(otpTicker);otpTicker=null;return}
  const n=Math.max(0,Math.ceil((mode.resendUntil-Date.now())/1000));
  b.disabled=n>0;b.textContent=n?'Resend code in 0:'+String(n).padStart(2,'0'):'Resend code';
  if(!n&&otpTicker){clearInterval(otpTicker);otpTicker=null}
 };
 tick();if(mode.resendUntil>Date.now())otpTicker=setInterval(tick,500);
}


/* Replace only the left form, preserving the supplied right-side artwork and theme control. */
function transitionAuth(next){
 const inner=e('authFormInner');const seq=++authTransitionSeq;
 if(otpTicker){clearInterval(otpTicker);otpTicker=null}
 if(!inner||window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches){display(next);return}
 e('authScreen')?.classList.remove('is-enter');e('authForm')?.classList.remove('is-enter');
 const before=inner.offsetHeight;inner.classList.remove('switch-in');inner.classList.add('switch-out');
 setTimeout(()=>{
  if(seq!==authTransitionSeq)return;
  inner.style.height=before+'px';inner.style.overflow='hidden';
  display(next);
  const after=inner.scrollHeight;
  inner.classList.add('switch-in');
  if(after!==before){void inner.offsetHeight;inner.style.height=after+'px'}
  else{inner.style.height='';inner.style.overflow=''}
  setTimeout(()=>{if(seq!==authTransitionSeq)return;inner.classList.remove('switch-in');inner.style.height='';inner.style.overflow=''},330);
 },170);
}
function display(modeName=mode.name){
 mode.name=modeName;
 if(!e('authScreen')){
  root.innerHTML='<div id="authScreen" class="is-enter"><section class="auth-form-panel"><div class="auth-topbar"><span class="auth-wordmark">daylight.</span><button class="auth-theme-btn" id="authThemeBtn" aria-label="Switch theme"></button></div><form class="auth-form-wrap is-enter" id="authForm" novalidate><div class="auth-form-inner" id="authFormInner"></div></form></section><aside class="auth-visual-panel" aria-hidden="true"><span class="auth-visual-word">daylight.</span>'+art()+'</aside></div>';
  e('authThemeBtn').onclick=()=>{
   document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';
   try{localStorage.setItem('daylight-auth-theme-mode',document.documentElement.dataset.theme)}catch{}
   e('authThemeBtn').innerHTML=icon(document.documentElement.dataset.theme==='dark'?'sun':'moon',17);
  };
  e('authForm').onsubmit=submit;
  setTimeout(()=>{e('authScreen')?.classList.remove('is-enter');e('authForm')?.classList.remove('is-enter')},1100);
 }
 e('authThemeBtn').innerHTML=icon(document.documentElement.dataset.theme==='dark'?'sun':'moon',17);
 const inner=e('authFormInner');
 inner.classList.remove('switch-in','switch-out');
 inner.innerHTML=formContent();
 const inputNames={authName:'name',authEmail:'email',authPassword:'password',authConfirmPw:'confirm'};
 Object.entries(inputNames).forEach(([id,key])=>{
  const input=e(id);if(!input)return;
  input.oninput=()=>{mode.values[key]=input.value;input.closest('.auth-pill').classList.remove('err');input.setAttribute('aria-invalid','false');if(e('authMessage')){mode.error='';e('authMessage').textContent=''};if(key==='password')redrawRules()};
  input.closest('.auth-pill').onclick=ev=>{if(!ev.target.closest('button'))input.focus()};
 });
 e('authSwitch').onclick=()=>{mode.error='';mode.message='';mode.showPassword=false;mode.values.password='';transitionAuth(mode.name==='login'?'signup':'login')};
 if(e('authForgot'))e('authForgot').onclick=ev=>{ev.preventDefault();mode.error='';mode.message='';transitionAuth('forgot')};
 if(e('authBackSignIn'))e('authBackSignIn').onclick=()=>{mode.error='';mode.message='';mode.code='';mode.values.password='';transitionAuth('login')};
 ['authEye','authPasswordEye','authConfirmPwEye'].forEach(id=>{const b=e(id);if(!b)return;b.onclick=()=>{const x=e(id==='authConfirmPwEye'?'authConfirmPw':'authPassword');const show=x.type==='password';x.type=show?'text':'password';b.innerHTML=icon(show?'eyeOff':'eye',18);b.setAttribute('aria-label',(show?'Hide':'Show')+' password');x.focus()}});
 if(e('authCodeRow'))bindOtp();
}
function showError(key,msg){
 mode.error=msg;mode.message='';if(e('authMessage')){e('authMessage').textContent=msg;e('authMessage').setAttribute('role','alert')}
 const id={name:'authName',email:'authEmail',password:'authPassword'}[key];const input=e(id);
 if(input){input.closest('.auth-pill').classList.add('err');input.setAttribute('aria-invalid','true');const tooltip=input.closest('.auth-pill').querySelector('.auth-tip');tooltip.textContent=msg;const hazard=input.closest('.auth-pill').querySelector('.auth-hazard');hazard.removeAttribute('aria-hidden');hazard.tabIndex=0;hazard.onclick=()=>hazard.closest('.auth-hazard-wrap').classList.toggle('tip-open');input.focus()}
}

const emailValid=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v||'').trim());
async function sendRecovery(resend=false){
 if(!client)return showError('email','Account service is not ready. Refresh and try again.');
 if(!emailValid(mode.values.email))return showError('email','Enter a valid email address');
 if(resend&&mode.resendUntil>Date.now())return;
 const b=e(resend?'authResend':'authSubmit');if(b)b.disabled=true;
 try{
  const {error}=await client.auth.resetPasswordForEmail(mode.values.email.trim(),{redirectTo:BASE.href});
  if(error)throw error;
  mode.resendUntil=Date.now()+60000;mode.code='';mode.error='';
  mode.message=resend?'Another recovery email was requested.':'Check your email for the recovery code.';
  if(resend)display('code');else transitionAuth('code');
 }catch(err){if(resend){if(e('authCodeMsgText'))e('authCodeMsgText').textContent=err.message;e('authCodeMsg')?.classList.add('show')}else showError('email',err.message||'Could not send a recovery email')}
 finally{if(b?.isConnected)b.disabled=false}
}
async function verifyCode(){
 if(mode.verifying||mode.code.length!==6||mode.name!=='code'||!client)return;
 mode.verifying=true;
 const boxes=Array.from(root.querySelectorAll('.auth-code-box'));boxes.forEach(x=>x.disabled=true);
 try{
  const {data,error}=await client.auth.verifyOtp({email:mode.values.email.trim(),token:mode.code,type:'recovery'});
  if(error)throw error;if(!data.session||!data.user)throw Error('Recovery verification did not return a valid session.');
  currentUser=data.user;recovering=true;recoveryFlow=true;
  mode.values.password='';mode.values.confirm='';mode.error='';mode.message='';transitionAuth('recovery');
 }catch(err){
  const row=e('authCodeRow');if(row){row.classList.remove('shake');void row.offsetWidth;row.classList.add('err','shake')}
  if(e('authCodeMsgText'))e('authCodeMsgText').textContent=err.message||'Check your code and try again';
  e('authCodeMsg')?.classList.add('show');
  mode.code='';boxes.forEach(x=>{x.value='';x.disabled=false});boxes[0]?.focus();
 }finally{mode.verifying=false}
}
async function submit(ev){
 ev.preventDefault();const fields={...mode.values},kind=mode.name;
 if(kind==='code')return;
 if(kind==='signup'&&!fields.name.trim())return showError('name',"Name can't be empty");
 if(kind!=='recovery'&&!emailValid(fields.email))return showError('email','Enter a valid email address');
 if(kind==='forgot'){await sendRecovery();return}
 if(!fields.password)return showError('password',"Password can't be empty");
 if(['signup','recovery'].includes(kind)&&!rules(fields.password).every(Boolean))return showError('password','Use 12+ characters, uppercase and lowercase letters, a number, and a symbol');
 if(kind==='recovery'&&fields.confirm!==fields.password)return showError('confirm',"Passwords don't match");
 if(!client)return showError('email','Secure account service is loading; try again shortly');
 const button=e('authSubmit');if(button)button.disabled=true;
 try{
  let response;
  if(kind==='login'){
   response=await client.auth.signInWithPassword({email:fields.email.trim(),password:fields.password});
   if(response.error)throw response.error;
   if(!response.data.session)throw Error('Sign-in did not return an active session');
   currentUser=response.data.user;mode.values.password='';
   if(isConsent)await showConsent();else await launch();
   return;
  }
  if(kind==='signup'){
   response=await client.auth.signUp({email:fields.email.trim(),password:fields.password,options:{data:{name:fields.name.trim(),first_name:fields.name.trim().split(/\s+/)[0]},emailRedirectTo:BASE.href}});
   if(response.error)throw response.error;
   mode.values.password='';
   if(response.data.session){currentUser=response.data.user;if(isConsent)await showConsent();else await launch();return}
   mode.name='login';mode.error='';mode.message='Check your email to confirm your new account, then sign in.';transitionAuth('login');return;
  }
  if(kind==='recovery'){
   const {data:{session},error:sessionError}=await client.auth.getSession();
   if(sessionError||!session)throw Error('Your recovery session has expired. Request a new code.');
   response=await client.auth.updateUser({password:fields.password});
   if(response.error)throw response.error;
   recovering=false;recoveryFlow=false;await client.auth.signOut();
   mode.values.password='';mode.values.confirm='';mode.name='login';
   mode.error='';mode.message='Password updated. Sign in with your new password.';transitionAuth('login');return;
  }
 }catch(err){showError(kind==='recovery'?'password':kind==='signup'&&/password/i.test(err.message)?'password':'email',err?.message||'The request failed. Please try again.')}
 finally{if(button?.isConnected)button.disabled=false}
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
  if(!data){
   // Initialize the account atomically BEFORE showing the calendar. A newly
   // approved MCP client can then never create a competing empty workspace.
   const created=await client.rpc('daylight_save_snapshot',{expected_revision:0,document:initial});
   if(created.error){
    const latest=await client.from('workspace_snapshots').select('payload,revision').eq('user_id',currentUser.id).maybeSingle();
    if(latest.error||!latest.data)throw created.error;
    initial=latest.data.payload;
    revision=Number(latest.data.revision);
   }else revision=Number(created.data);
  }
  acknowledged=JSON.stringify(initial);
  store.load=()=>{if(!store.data)store.data=structuredClone(initial);return store.data};
  store.save=queueSave;
  await loadScript('js/app.js');
  await loadScript('js/ai-access-logic.js');
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
   const btn=e(approved?'approveAccess':'denyAccess');
   if(!btn||btn.disabled)return;
   btn.disabled=true;
   const grants=client.from('oauth_mcp_grants');
   let oldGrant=null,grantChanged=false;
   try{
    if(approved){
     // Keep the existing permission level to roll back if Supabase denies the authorization.
     const previous=await grants.select('*').eq('user_id',currentUser.id).eq('client_id',clientId).maybeSingle();
     if(previous.error)throw previous.error;
     oldGrant=previous.data;
     const {error:grantError}=await grants.upsert({
      user_id:currentUser.id,client_id:clientId,client_name:label,
      can_read:true,can_write:e('allowWrite').checked,can_delete:e('allowDelete').checked,
      revoked:false,approved_at:new Date().toISOString(),updated_at:new Date().toISOString()
     },{onConflict:'user_id,client_id'});
     if(grantError)throw grantError;
     grantChanged=true;
    }
    const result=await (approved?client.auth.oauth.approveAuthorization(consentId):client.auth.oauth.denyAuthorization(consentId));
    if(result.error)throw result.error;
    if(!result.data?.redirect_url)throw Error('The OAuth server did not return a callback URL');
    // Redirect only to the callback Supabase validated for this authorization request.
    location.assign(result.data.redirect_url);
   }catch(err){
    if(grantChanged){
     try{
      const rollback=oldGrant
       ?await grants.upsert(oldGrant,{onConflict:'user_id,client_id'})
       :await grants.delete().eq('user_id',currentUser.id).eq('client_id',clientId);
      if(rollback.error)throw rollback.error;
     }catch(rollbackError){
      console.error('OAuth approval rollback failed',rollbackError);
      // Fail closed if a rejected approval cannot be rolled back.
      await grants.update({revoked:true,can_read:false,can_write:false,can_delete:false}).eq('user_id',currentUser.id).eq('client_id',clientId);
     }
    }
    if(e('consentError'))e('consentError').textContent=err?.message||'Authorization failed';
    if(btn.isConnected)btn.disabled=false;
   }
  };
  e('denyAccess').onclick=()=>decide(false);e('approveAccess').onclick=()=>decide(true);
 }catch(err){mode.error='Unable to verify authorization request: '+err.message;display()}
}
async function signOut(){
 clearTimeout(saveTimer);if(pending)await flush();
 if(blocked)throw Error('Your changes are not saved yet; resolve sync before signing out.');
 const {error}=await client.auth.signOut();if(error)throw error;location.replace(BASE.href)
}
window.DaylightCloud={client:null,signOut,flush,BASE:BASE.href,getUser:()=>currentUser,savePending:()=>!!pending||sending||blocked};
async function connectSupabase(){
 try{
  // Render the exact supplied HTML account screen before waiting for the SDK.
  // The SDK is imported dynamically so slow/blocked CDNs cannot leave a blank page.
  let createClient;
  try{({createClient}=await import('https://esm.sh/@supabase/supabase-js@2.118.0'))}
  catch(primaryError){
   console.warn('Primary Supabase SDK CDN unavailable',primaryError);
   ({createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm'));
  }
  client=createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
  window.DaylightCloud.client=client;
  client.auth.onAuthStateChange((event,session)=>{
   if(event==='PASSWORD_RECOVERY'){recovering=true;currentUser=session?.user;mode.error='';mode.values.password='';if(!recoveryFlow)display('recovery')}
   if(event==='SIGNED_OUT'){currentUser=null;if(launched)location.replace(BASE.href)}
  });
  const {data:{session},error}=await client.auth.getSession();
  if(error)console.warn('Session restore',error.message);
  if(recovering||location.hash.includes('type=recovery')||new URLSearchParams(location.search).get('type')==='recovery'){
   if(session?.user){recovering=true;currentUser=session.user;display('recovery');return}
   mode.error='Your recovery link has expired. Request a new code.';
  }
  if(session?.user){
   const result=await client.auth.getUser();
   if(!result.error&&result.data.user){
    currentUser=result.data.user;if(isConsent)await showConsent();else await launch();return;
   }
  }
  if(isConsent&&!consentId){mode.error='Missing OAuth authorization request';display('login');return}
 }catch(err){
  console.error('Supabase bootstrap failed',err);
  mode.error='Could not connect to the account service. Check your connection and refresh to try again.';
  if(e('authMessage')){e('authMessage').textContent=mode.error;e('authMessage').setAttribute('role','alert')}
 }
}
try{
 const preferred=localStorage.getItem('daylight-auth-theme-mode');
 document.documentElement.dataset.theme=['light','dark'].includes(preferred)?preferred:
 (window.matchMedia?.('(prefers-color-scheme: light)').matches?'light':'dark');
}catch{
 document.documentElement.dataset.theme=window.matchMedia?.('(prefers-color-scheme: light)').matches?'light':'dark';
}
display('login');
connectSupabase();
