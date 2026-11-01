import {createClient} from '@supabase/supabase-js';
import {initializeData} from './v2-data.js';

const url=import.meta.env.VITE_SUPABASE_URL;
const publishable=import.meta.env.VITE_SUPABASE_ANON_KEY;
const $=id=>document.getElementById(id);
const root=document.documentElement;
const intro=$('authIntroduction');
const forms=[...document.querySelectorAll('[data-auth-mode]')];
const validUsername=/^[a-z][a-z0-9_]{2,19}$/;
let supabase=null,available=false,availabilityTimer=null,account=null,loading=false;
function show(mode){
 for(const form of forms)form.hidden=form.dataset.authMode!==mode;
 $('authHeading').textContent={login:'Welcome back',signup:'Create your account',recover:'Forgot password?',notice:'Password recovery',unconfigured:'Setup required',loading:'One moment…'}[mode]||'daylight.';
 $('authError').hidden=true;intro.hidden=mode==='unconfigured'||mode==='loading';
 if(mode==='login')$('loginUsername').focus({preventScroll:true});
 if(mode==='signup')$('signupUsername').focus({preventScroll:true});
}
function error(text){const e=$('authError');e.hidden=false;e.textContent=text}
function busy(form,on){form.querySelector('[type=submit]').disabled=on;form.classList.toggle('loading',on)}
const rules=p=>({length:p.length>=8,upper:/[A-Z]/.test(p),lower:/[a-z]/.test(p),number:/[0-9]/.test(p),symbol:/[^A-Za-z0-9]/.test(p)});
function checkSignup(){
 const username=$('signupUsername').value.trim().toLowerCase(),pw=$('signupPassword').value,matching=pw===$('signupConfirm').value&&pw.length>0;
 const checks=rules(pw);document.querySelectorAll('#passwordRequirements [data-rule]').forEach(li=>li.classList.toggle('met',checks[li.dataset.rule]));
 $('passwordMatch').textContent=matching?'✓ Passwords match':'Passwords must match';
 $('authSignup').querySelector('[type=submit]').disabled=!(validUsername.test(username)&&available&&Object.values(checks).every(Boolean)&&matching);
}
async function checkAvailability(){
 const username=$('signupUsername').value.trim().toLowerCase();
 const label=$('usernameAvailability');available=false;checkSignup();
 if(!validUsername.test(username)){label.textContent='3–20 lowercase letters, numbers, or underscores';label.className='';return}
 label.textContent='Checking availability…';
 try{const {data,error:e}=await supabase.rpc('username_available',{proposed:username});if(e)throw e;
 if($('signupUsername').value.trim().toLowerCase()!==username)return;
 available=!!data;label.textContent=available?'✓ Available':'That username is taken';label.className=available?'available':'unavailable';
 }catch{label.textContent='Could not check username. Please retry.';available=false}
 checkSignup();
}
$('signupUsername').addEventListener('input',()=>{clearTimeout(availabilityTimer);$('usernameAvailability').textContent='Checking…';available=false;checkSignup();availabilityTimer=setTimeout(checkAvailability,320)});
['signupPassword','signupConfirm'].forEach(id=>$(id).addEventListener('input',checkSignup));
for(const b of document.querySelectorAll('[data-password-toggle]'))b.addEventListener('click',()=>{
 const input=$(b.dataset.passwordToggle),show=input.type==='password';input.type=show?'text':'password';b.textContent=show?'Hide':'Show';b.setAttribute('aria-label',show?'Hide password':'Show password');
});
for(const b of document.querySelectorAll('[data-auth-link]'))b.addEventListener('click',()=>show(b.dataset.authLink));
$('authRecover').addEventListener('submit',e=>{e.preventDefault();show('notice')});
async function startApp(session){
 if(loading)return;
 loading=true;show('loading');
 try{
  const result=await initializeData(supabase,session.user);
  window.DaylightStore=result.store;
  window.DaylightCloud={supabase,sync:result.sync,signOut:async()=>{await supabase.auth.signOut();location.reload()},getUser:()=>session.user,profile:result.profile,settings:result.settings};
  // The original UI modules are loaded only after the authenticated data is ready.
  const modules=[
   ()=>import('./app.js'),()=>import('./integrations.js'),()=>import('./enhance.js'),
   ()=>import('./wizard.js'),()=>import('./occasion.js'),()=>import('./accent.js'),
   ()=>import('./release-polish.js'),()=>import('./v1-shell.js'),()=>import('./v1-details.js'),
   ()=>import('./v2-navigation.js'),()=>import('./v2-ai-access.js')
  ];
  for(const load of modules)await load();
  const accountLabel=$('cloudAccountName');if(accountLabel)accountLabel.textContent=result.profile.username;
  const status=$('cloudSyncStatus');if(status){status.textContent='Synced';status.dataset.state='saved'}
  $('cloudSignOut')?.addEventListener('click',()=>window.DaylightCloud.signOut());
  $('cloudSyncNow')?.addEventListener('click',()=>result.sync());
  root.dataset.daylightAuthenticated='true';$('authGateway').hidden=true;
  window.dispatchEvent(new Event('daylight:ready'));
 }catch(err){loading=false;show('login');error('Could not load your calendar. Please try again. '+(import.meta.env.DEV?err.message:''));console.error('Daylight bootstrap failed:',err)}
}
$('authLogin').addEventListener('submit',async e=>{
 e.preventDefault();const form=e.currentTarget;busy(form,true);$('authError').hidden=true;
 const username=$('loginUsername').value.trim().toLowerCase(),password=$('loginPassword').value;
 try{
  if(!validUsername.test(username))throw new Error('Invalid credentials');
  const {data,error:e}=await supabase.auth.signInWithPassword({email:username+'@daylight.app',password});
  if(e||!data.session)throw e||new Error('Invalid credentials');
  await startApp(data.session);
 }catch{error("That username and password don't match")}finally{busy(form,false)}
});
$('authSignup').addEventListener('submit',async e=>{
 e.preventDefault();checkSignup();const form=e.currentTarget,button=form.querySelector('[type=submit]');if(button.disabled)return;busy(form,true);$('authError').hidden=true;
 const username=$('signupUsername').value.trim().toLowerCase(),password=$('signupPassword').value;
 try{
  const res=await fetch(url+'/functions/v1/daylight-signup',{method:'POST',headers:{'Content-Type':'application/json','apikey':publishable},body:JSON.stringify({username,password})});
  const json=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(json.error||'Could not create account');
  const {data,error:e}=await supabase.auth.signInWithPassword({email:username+'@daylight.app',password});
  if(e||!data.session)throw e||new Error('Sign in failed');
  await startApp(data.session);
 }catch(err){error(err.message)}finally{busy(form,false);checkSignup()}
});
async function start(){
 root.dataset.daylightAuthenticated='false';
 $('authGateway').hidden=false;
 if(!url||!publishable){show('unconfigured');return}
 supabase=createClient(url,publishable,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 const {data,error:e}=await supabase.auth.getSession();
 if(e||!data.session){show('login');return}
 await startApp(data.session);
}
start();
