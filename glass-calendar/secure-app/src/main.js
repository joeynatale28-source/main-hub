import {icon,upgradeIcons,startIcons} from './icons.js';
import {palette,paletteNames,colorFor,eventDate,expandEvents,prettyShort,prettyStamp,prettyClock,repeatLabel,greeting,makeDateGrid,daykey} from './polish.js';
const root=document.querySelector('#root');
const runtimeConfig=import.meta.env || window.__DAYLIGHT_CONFIG || {};
const url=runtimeConfig.VITE_SUPABASE_URL,key=runtimeConfig.VITE_SUPABASE_ANON_KEY;
const configured=Boolean(url&&key&&/^https:\/\//.test(url)&&!url.includes('YOUR_PROJECT'));
const endpoint=url?.replace(/\/$/,'')+'/functions/v1/daylight-release';
const $=(s,el=document)=>el.querySelector(s),$$=(s,el=document)=>[...el.querySelectorAll(s)];
const h=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const now=()=>new Date(),iso=d=>[d.getFullYear(),('0'+(d.getMonth()+1)).slice(-2),('0'+d.getDate()).slice(-2)].join('-');
const date=s=>new Date(s+'T12:00:00'),add=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const label=d=>d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
const state={token:localStorage.getItem('dl-release-session')||'',user:null,calendars:[],events:[],tasks:[],subscriptions:[],settings:{},page:'calendar',date:now(),view:'week',drilled:false,setting:localStorage.getItem('daylight-settings-section')||'general',collapsed:localStorage.getItem('daylight-rail-collapsed')==='1',edit:null,timed:false,allDay:false,mode:'event',locationAddress:'',addrResults:[],popover:null,taskFilter:'all',returnView:null,theme:'system'};
const toast=(text)=>{let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';document.body.append(el)}el.textContent=text;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3200);upgradeIcons()};
async function api(action,data={},include=true){
 const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json',apikey:key},body:JSON.stringify({...data,action,...(include?{token:state.token}:{})})});
 let body;try{body=await r.json()}catch{throw Error('Service temporarily unavailable')}
 if(!r.ok)throw Error(body.error||'Request failed');return body;
}
async function load(){
 try{const result=await api('auth_session');state.user=result.user;const [calendars,events,tasks,subscriptions,settings]=await Promise.all(['calendars','events','tasks','subscriptions','settings'].map(async entity=>(await api('data_list',{entity})).items));Object.assign(state,{calendars,events,tasks,subscriptions,settings:settings[0]||{},date:now(),drilled:false,view:settings[0]?.default_view||'week'});applyTheme();render()}catch{localStorage.removeItem('dl-release-session');state.token='';login()}
}
function applyTheme(){let t=state.settings.theme||'system';document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t;document.documentElement.dataset.reduceMotion=String(!!state.settings.reduce_motion);document.documentElement.dataset.compact=String(!!state.settings.compact_mode);document.querySelector('#themeButton')?.setAttribute('aria-label','Theme: '+(t==='dark'?'Midnight':t==='light'?'Daylight':'System'));document.querySelector('#themeButton')?.setAttribute('title','Theme: '+(t==='dark'?'Midnight':t==='light'?'Daylight':'System'));const button=$('#themeButton');if(button)button.innerHTML=icon(t==='dark'?'moon':t==='light'?'sun':'monitor')}
function login(){root.innerHTML='<main class="center"><form class="login" id="login"><div class="mark">✳</div><h1>daylight.</h1><p>Welcome back.</p><label>Username<input id="username" required autocomplete="username" placeholder="Username"></label><label>Password<div class="password"><input id="password" type="password" required autocomplete="current-password" placeholder="Password"><button type="button" id="eye">◉</button></div></label><p id="authError" class="error" hidden></p><button type="submit" class="primary block" id="loginBtn">Log in</button><small>Accounts are created by Joey — there’s no sign-up.</small></form></main>';
 $('#eye').onclick=()=>{$('#password').type=$('#password').type==='password'?'text':'password';$('#eye').innerHTML=icon($('#password').type==='password'?'eye':'eye-off')};
 $('#login').onsubmit=async e=>{e.preventDefault();$('#loginBtn').textContent='Logging in…';$('#loginBtn').disabled=true;try{const r=await api('auth_login',{username:$('#username').value,password:$('#password').value},false);state.token=r.token;localStorage.setItem('dl-release-session',r.token);await load()}catch{const err=$('#authError');err.hidden=false;err.textContent="That username and password don't match.";$('#loginBtn').disabled=false;$('#loginBtn').textContent='Log in'}};
}
async function logout(){try{await api('auth_logout')}catch{}state.token='';localStorage.removeItem('dl-release-session');login()}
async function list(entity){return (await api('data_list',{entity})).items}
async function refreshData(){const [calendars,events,tasks,subscriptions,settings]=await Promise.all(['calendars','events','tasks','subscriptions','settings'].map(list));Object.assign(state,{calendars,events,tasks,subscriptions,settings:settings[0]||{}});render()}
function reflect(){
 const hasSettings=document.querySelector('#settingsModal')?.open;
 if(hasSettings){
  renderMini();renderCalList();
  if(state.page==='calendar')renderCalendar();
  else if(state.page==='tasks')renderTasks();
  else renderIntegrations();
  renderSettings();
 }else render();
 upgradeIcons();
}
async function change(entity,id,data,action){
 const result=await api('data_'+action,{entity,...(id?{id}:{}),...(data?{data}:{})});
 if(entity==='settings')state.settings=result.item;
 else if(action==='create')state[entity].push(result.item);
 else if(action==='delete')state[entity]=state[entity].filter(x=>x.id!==id);
 else if(action==='update')state[entity]=state[entity].map(x=>x.id===id?result.item:x);
 try{reflect()}catch(renderError){console.error('Daylight UI refresh after saved change failed',renderError)}
 return result.item;
}
function safeChange(entity,id,data,action){
 const previous=structuredClone(state[entity]||[]);
 if(action==='update'&&data&&Array.isArray(state[entity])){
  state[entity]=state[entity].map(x=>x.id===id?{...x,...data}:x);
  try{reflect()}catch(renderError){console.error('Daylight optimistic UI refresh failed',renderError)}
 }
 const request=api('data_'+action,{entity,...(id?{id}:{}),...(data?{data}:{})});
 return request.then(result=>{
  if(action==='create')state[entity].push(result.item);
  else if(action==='delete')state[entity]=state[entity].filter(x=>x.id!==id);
  else if(action==='update')state[entity]=state[entity].map(x=>x.id===id?result.item:x);
  try{reflect()}catch(renderError){console.error('Daylight UI refresh after saved change failed',renderError)}
  return result.item;
 },error=>{
  // Only an actual rejected network/database request triggers the error toast.
  state[entity]=previous;
  try{reflect()}catch(renderError){console.error('Daylight rollback UI refresh failed',renderError)}
  toast("Couldn't save — check your connection");
  return null;
 });
}
function visible(){return state.events.filter(e=>state.calendars.some(c=>c.id===e.calendar_id&&c.is_visible===true)&&(!state.settings.show_declined_events?e.status!=='declined':true))}
function occurrences(from=add(now(),-400),to=add(now(),450)){return expandEvents(visible(),from,to)}
const eventColor=e=>colorFor(state.calendars.find(c=>c.id===e.calendar_id));
const eventStyle=e=>'--event-color:'+eventColor(e)+';';
const eventAttr=(e,extra='')=>' data-detail="'+h(e.id)+'" data-occ="'+h(e._occurrence||e.starts_at)+'" style="'+eventStyle(e)+extra+'"';
const eventOn=(e,key)=>eventDate(e)===key;
const getOccurrence=(id,when)=>occurrences(add(now(),-900),add(now(),1200)).find(e=>e.id===id&&(e._occurrence||e.starts_at)===when)||state.events.find(e=>e.id===id);
function loading(button,on,text='Working…'){if(!button)return;if(on){button.dataset.oldHtml=button.innerHTML;button.innerHTML='<span class="action-spinner"></span>'+h(text);button.disabled=true}else{button.innerHTML=button.dataset.oldHtml||button.innerHTML;button.disabled=false;upgradeIcons()}}
function nav(page,title,ico){return '<button class="nav '+(state.page===page?'selected':'')+'" title="'+h(title)+'" aria-label="'+h(title)+'" data-nav="'+page+'"><span class="glyph">'+ico+'</span>'+title+'</button>'}
function render(){if(!state.user)return;root.classList.toggle('collapsed',state.collapsed);root.innerHTML='<div class="shell"><aside class="sidebar"><div class="side-header"><button id="brand" class="brand"><span class="logo">✳</span><span><strong>daylight.</strong><small>Personal calendar</small></span></button><button class="icon compact collapse-toggle" id="collapseRail" aria-label="'+(state.collapsed?'Expand':'Collapse')+' sidebar" title="'+(state.collapsed?'Expand':'Collapse')+' sidebar">‹</button></div><div class="side-middle"><button id="newEvent" class="primary block">'+icon('plus')+' New event</button><div id="mini"></div><div class="micro">WORKSPACE</div>'+nav('calendar','Calendar','▦')+nav('integrations','Integrations','◎')+nav('tasks','Tasks','☑')+'<div class="micro">MY CALENDARS <button class="mini-add" id="newCalendar">+</button></div><div id="calList"></div><div class="micro">SUPPORT</div><button class="nav" id="settings" title="Settings"><span class="glyph">⚙</span>Settings</button><button class="nav" id="about" title="About"><span class="glyph">ⓘ</span>About</button></div><div class="profile"><span class="avatar">'+h(state.user.first_name?.slice(0,1))+'</span><span><strong>'+h(state.user.first_name)+' '+h(state.user.last_name)+'</strong><small>@'+h(state.user.username)+'</small></span><button class="icon" id="profileMenu">⋮</button></div></aside><main class="content" id="content"></main></div><div id="modalHost"></div><div id="toast"></div>';
 $('#brand').onclick=()=>{state.page='calendar';state.date=now();state.drilled=false;state.view=state.settings.default_view||'week';render()};$('#newEvent').onclick=()=>openEditor();
 $$('[data-nav]').forEach(x=>x.onclick=()=>{state.page=x.dataset.nav;render()});
 $('#settings').onclick=()=>settings();$('#about').onclick=()=>settings('about');$('#profileMenu').onclick=()=>menu($('#profileMenu'),[['Settings',()=>settings()],['Log out',logout]]);
 $('#collapseRail').onclick=()=>{state.collapsed=!state.collapsed;localStorage.setItem('daylight-rail-collapsed',state.collapsed?'1':'0');render()};
 $('#newCalendar').onclick=()=>calendarForm();
 renderMini();renderCalList();state.page==='calendar'?renderCalendar():state.page==='tasks'?renderTasks():renderIntegrations();upgradeIcons();
}
function renderMini(){
 const d=state.date,first=new Date(d.getFullYear(),d.getMonth(),1),shift=state.settings.start_of_week==='monday'?1:0,start=add(first,-((first.getDay()-shift+7)%7));
 const active=iso(now()),selected=iso(state.date),weekstart=add(state.date,-((state.date.getDay()-shift+7)%7)),weekend=add(weekstart,6),miniEvents=occurrences(add(start,-1),add(start,44));let html='<div class="mini-head"><strong>'+first.toLocaleDateString('en-US',{month:'long',year:'numeric'})+'</strong><span><button id="miniPrev" class="icon">‹</button><button id="miniNext" class="icon">›</button></span></div><div class="mini-grid">';
 for(let i=0;i<7;i++)html+='<span class="dayname">'+['S','M','T','W','T','F','S'][(i+shift)%7]+'</span>';
 for(let i=0;i<42;i++){const day=add(start,i),key=iso(day);html+='<button class="mini-date '+(day.getMonth()!==first.getMonth()?'outside ':'')+(key===active?'today ':'')+(key===selected?'selected ':'')+(day>=weekstart&&day<=weekend?'selected-week ':'')+'" data-date="'+key+'">'+day.getDate()+(miniEvents.some(e=>eventOn(e,key))?'<i style="background:'+eventColor(miniEvents.find(e=>eventOn(e,key)))+'"></i>':'')+'</button>'}
 $('#mini').innerHTML=html+'</div>';upgradeIcons();
 $('#miniPrev').onclick=()=>{state.date=new Date(d.getFullYear(),d.getMonth()-1,1);renderMini()};$('#miniNext').onclick=()=>{state.date=new Date(d.getFullYear(),d.getMonth()+1,1);renderMini()};$$('[data-date]',$('#mini')).forEach(x=>x.onclick=()=>drill(x.dataset.date));
}
function renderCalList(){
 const container=$('#calList');if(!container)return;
 container.innerHTML=state.calendars.map(c=>
  '<div class="cal-row '+(c.is_visible?'':'dim')+'" style="--event-color:'+colorFor(c)+'" data-cal="'+h(c.id)+'" title="'+h(c.name)+'"><button class="switch '+(c.is_visible?'on':'')+'" role="switch" aria-checked="'+!!c.is_visible+'" data-hide="'+h(c.id)+'" aria-label="'+(c.is_visible?'Hide ':'Show ')+h(c.name)+'"><span></span></button><i class="cal-dot"></i><span class="cal-name">'+h(c.name)+'</span><button class="icon compact" data-menu="'+h(c.id)+'" aria-label="Actions for '+h(c.name)+'" title="Actions for '+h(c.name)+'">'+icon('more-vertical',16)+'</button></div>'
 ).join('');
 $$('[data-hide]',container).forEach(x=>x.onclick=()=>{const c=state.calendars.find(c=>c.id===x.dataset.hide);if(c)safeChange('calendars',c.id,{is_visible:!c.is_visible},'update')});
 $$('[data-menu]',container).forEach(x=>x.onclick=()=>{
  const c=state.calendars.find(c=>c.id===x.dataset.menu);if(!c)return;
  const subscribed=state.subscriptions.some(sub=>sub.calendar_id===c.id);
  menu(x,[['Rename',()=>inlineRename(c)],['Change color',()=>calendarForm(c)],[(c.is_visible?'Hide':'Unhide'),()=>safeChange('calendars',c.id,{is_visible:!c.is_visible},'update')],
   [subscribed?'Remove subscription':'Delete calendar',()=>subscribed?confirmAction('Remove subscription?','Remove this read-only calendar and its feed?',async()=>{const sub=state.subscriptions.find(x=>x.calendar_id===c.id);if(sub){await safeChange('subscriptions',sub.id,null,'delete');await refreshData()}}):confirmCalendarDelete(c),true]
  ]);
 });
 upgradeIcons();
}
function calendarForm(existing=null){
 const dlg=modal('<h2>'+(existing?'Calendar color':'New calendar')+'</h2><label>Name<input id="calendarFormName" maxlength="100" value="'+h(existing?.name||'')+'" placeholder="Calendar name"></label><label>Color</label><div class="calendar-swatches">'+paletteNames.map(name=>'<button type="button" class="calendar-color-swatch" data-color="'+name+'" style="--swatch:'+palette[name]+'" aria-label="'+name+'">'+icon('check',16)+'</button>').join('')+'</div><div class="footer-actions"><button class="secondary" data-close>Cancel</button><button class="primary" id="calendarFormSave">Save</button></div>');
 const field=$('#calendarFormName',dlg),buttons=$$('[data-color]',dlg);
 let selected=existing?Object.keys(palette).find(k=>palette[k]===colorFor(existing))||'blue':'blue';
 const update=()=>buttons.forEach(b=>{b.classList.toggle('selected',b.dataset.color===selected);b.setAttribute('aria-pressed',String(b.dataset.color===selected))});
 buttons.forEach(b=>b.onclick=()=>{selected=b.dataset.color;update()});update();field.focus();
 const save=async()=>{const name=field.value.trim();if(!name){field.classList.add('invalid','shake');field.focus();return}
  const btn=$('#calendarFormSave',dlg);loading(btn,true,'Saving…');
  try{await change('calendars',existing?.id||null,existing?{name,shade:selected}:{name,shade:selected,is_visible:true,sort_order:state.calendars.length},existing?'update':'create');dlg.close();toast(existing?'Calendar updated':'Calendar created')}
  catch{loading(btn,false);toast("Couldn't save — check your connection")}
 };
 $('#calendarFormSave',dlg).onclick=save;field.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();save()}};
}
function toastUndo(text,undo){
 toast(text);const el=$('#toast');if(!el)return;
 const button=document.createElement('button');button.type='button';button.className='undo-button';button.textContent='Undo';el.append(button);
 clearTimeout(toast.timer);let used=false;
 button.onclick=()=>{if(used)return;used=true;clearTimeout(toast.timer);button.disabled=true;button.textContent='Restoring…';Promise.resolve(undo()).then(()=>toast('Calendar restored')).catch(()=>toast('Could not restore calendar'))};
 toast.timer=setTimeout(()=>el.classList.remove('show'),5000);
}
function confirmCalendarDelete(cal){
 const dlg=modal('<div class="warning-circle">'+icon('warning')+'</div><h2>Delete calendar?</h2><p>Type <strong>'+h(cal.name)+'</strong> to confirm. Its events will also be deleted.</p><input id="calendarDeleteName" autocomplete="off" placeholder="'+h(cal.name)+'"><div class="footer-actions"><button class="secondary" data-close>Cancel</button><button class="danger" id="calendarDeleteConfirm" disabled>Delete calendar</button></div>');
 const field=$('#calendarDeleteName',dlg),btn=$('#calendarDeleteConfirm',dlg);field.oninput=()=>btn.disabled=field.value!==cal.name;field.focus();
 btn.onclick=async()=>{
  loading(btn,true,'Deleting…');
  const snapshot=state.events.filter(e=>e.calendar_id===cal.id).map(e=>({...e}));
  try{
   await api('data_delete',{entity:'calendars',id:cal.id});
   state.calendars=state.calendars.filter(c=>c.id!==cal.id);
   state.events=state.events.filter(e=>e.calendar_id!==cal.id);
   dlg.close();render();
   toastUndo('Calendar deleted — Undo',async()=>{
    const saved=await api('data_create',{entity:'calendars',data:{name:cal.name,shade:cal.shade,is_visible:cal.is_visible,sort_order:cal.sort_order}});
    const newCal=saved.item;
    for(const e of snapshot){
     const payload={calendar_id:newCal.id,title:e.title,description:e.description,location_name:e.location_name,location_address:e.location_address,starts_at:e.starts_at,ends_at:e.ends_at,all_day:e.all_day,repeat_rule:e.repeat_rule,reminder_offset_minutes:e.reminder_offset_minutes};
     await api('data_create',{entity:'events',data:payload});
    }
    await refreshData();
   });
  }catch{loading(btn,false);toast("Couldn't delete calendar — check your connection")}
 };
}
function inlineRename(c){
 const row=state.calendars.some(x=>x.id===c.id)?[...$$('#calList .cal-row')].find(x=>x.dataset.cal===c.id):null;if(!row)return;
 const label=$('.cal-name',row);label.hidden=true;const old=c.name;
 const input=document.createElement('input');input.className='calendar-rename';input.type='text';input.maxLength=120;input.value=old;input.setAttribute('aria-label','Rename '+old);
 const yes=document.createElement('button');yes.type='button';yes.className='icon compact';yes.setAttribute('aria-label','Save calendar name');yes.innerHTML=icon('check',16);
 const no=document.createElement('button');no.type='button';no.className='icon compact';no.setAttribute('aria-label','Cancel rename');no.innerHTML=icon('x',16);
 const controls=row.querySelector('[data-menu]');label.after(input,yes,no);controls.hidden=true;
 const cancel=()=>{input.remove();yes.remove();no.remove();label.hidden=false;controls.hidden=false};
 const done=async()=>{
  const name=input.value.trim();if(!name){input.classList.add('shake');setTimeout(()=>{input.classList.remove('shake');input.value=old},230);return}
  cancel();if(name!==old){const saved=await safeChange('calendars',c.id,{name},'update');if(saved)toast('Calendar renamed')}
 };
 input.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();cancel()}if(e.key==='Enter'){e.preventDefault();done()}});
 yes.onclick=done;no.onclick=cancel;input.focus();input.select();
}
function drill(key){
 if(state.view!=='day'){state.returnView=state.view;state.drilled=true}
 state.date=date(key);state.view='day';state.page='calendar';render();
}
const isoWeek=d=>{const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));t.setUTCDate(t.getUTCDate()+4-(t.getUTCDay()||7));const year=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil((((t-year)/86400000)+1)/7)};
function header(title){
 const first=state.user?.first_name||'there',holidays=occurrences(add(now(),-2),add(now(),2)).filter(x=>state.calendars.find(c=>c.id===x.calendar_id)?.client_id==='us-holidays');
 const msg=greeting(first,now(),holidays),theme=state.settings.theme||'system',themeName=theme==='dark'?'Midnight':theme==='light'?'Daylight':'System';
 const returnChip=state.drilled&&state.returnView&&state.view==='day'?'<button id="backDrill" class="secondary">'+icon('arrow-left',16)+' Back to '+h(state.returnView[0].toUpperCase()+state.returnView.slice(1))+'</button>':'';
 return '<header class="view-header"><div class="heading-copy"><div class="greeting">'+h(msg)+'</div><h1>'+h(title)+'</h1></div><div class="tools">'+returnChip+'<button class="icon" id="prev" aria-label="Previous period">'+icon('chevron-left')+'</button><button class="icon" id="next" aria-label="Next period">'+icon('chevron-right')+'</button><button class="secondary" id="today">Today</button><button class="icon" id="searchButton" aria-label="Search">'+icon('search')+'</button><button class="icon" id="themeButton" aria-label="Theme: '+themeName+'" title="Theme: '+themeName+'">'+icon(theme==='dark'?'moon':theme==='light'?'sun':'monitor')+'</button><button class="icon" id="settingsButton" aria-label="Settings">'+icon('settings')+'</button></div></header>';
}
function exitDrill(){
 if(state.drilled){state.drilled=false;state.view=state.returnView||state.settings.default_view||'week';state.returnView=null;render();return true}return false;
}
function renderCalendar(){
 const d=state.date,title=state.view==='day'?label(d):d.toLocaleDateString('en-US',{month:'long',year:'numeric'});
 $('#content').innerHTML=header(title)+'<div id="searchBar" hidden><input id="searchQuery" aria-label="Search events" placeholder="Search all dates"><button id="searchClose" class="icon" aria-label="Close search">'+icon('x',16)+'</button><div class="micro">All dates</div><div id="searchResults"></div></div><section id="grid" class="calendar-grid"></section>';
 $('#backDrill')?.addEventListener('click',exitDrill);
 $('#today').onclick=()=>{state.date=now();render()};
 const move=n=>{state.date=state.view==='month'?new Date(d.getFullYear(),d.getMonth()+n,1):add(d,n*(state.view==='week'?7:1));render()};
 $('#prev').onclick=()=>move(-1);$('#next').onclick=()=>move(1);
 $('#settingsButton').onclick=()=>settings();
 $('#themeButton').onclick=()=>{const modes=['dark','light','system'];saveSetting('theme',modes[(modes.indexOf(state.settings.theme)+1)%3]);};
 const closeSearch=()=>{$('#searchBar').hidden=true;$('#searchQuery').value='';$('#searchResults').innerHTML=''};
 $('#searchButton').onclick=()=>{$('#searchBar').hidden=!$('#searchBar').hidden;if(!$('#searchBar').hidden)$('#searchQuery').focus()};
 $('#searchClose').onclick=closeSearch;
 $('#searchQuery').onkeydown=e=>{if(e.key==='Escape'){e.stopPropagation();closeSearch()}};
 $('#searchQuery').oninput=e=>{
  const q=e.target.value.trim(),results=occurrences(add(now(),-700),add(now(),1095)).filter(x=>x.title.toLowerCase().includes(q.toLowerCase())).slice(0,40);
  $('#searchResults').innerHTML=q?(results.length?results.map(x=>'<button '+eventAttr(x)+'>'+h(x.title)+' · '+h(prettyShort(x._civilDate+'T12:00:00'))+'</button>').join(''):'<p class="empty-results">No results for &#39;'+h(q)+'&#39;</p>'):'';
  bindEventButtons();
 };
 if(state.view==='month')renderMonth();else if(state.view==='agenda')renderAgenda();else renderWeek();
 upgradeIcons();
}
function renderMonth(){
 const d=state.date,first=new Date(d.getFullYear(),d.getMonth(),1),shift=state.settings.start_of_week==='monday'?1:0,start=add(first,-((first.getDay()-shift+7)%7)),count=Math.ceil(((first.getDay()-shift+7)%7+new Date(d.getFullYear(),d.getMonth()+1,0).getDate())/7)*7;
 const items=occurrences(add(start,-1),add(start,count+1));
 let html='<div class="weekdays">'+Array.from({length:7},(_,i)=>'<span>'+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][(i+shift)%7]+'</span>').join('')+'</div><div class="monthcells '+(state.settings.show_week_numbers?'numbered':'')+'" style="--weeks:'+count/7+'">';
 for(let i=0;i<count;i++){
  const t=add(start,i),key=iso(t),events=items.filter(e=>eventOn(e,key));
  html+='<div class="monthcell '+(t.getMonth()!==d.getMonth()?'outside':'')+'" data-cell="'+key+'">';
  if(state.settings.show_week_numbers&&i%7===0)html+='<span class="weeknum">W'+isoWeek(t)+'</span>';
  html+='<button class="datenum '+(key===iso(now())?'today':'')+'" data-drill="'+key+'">'+t.getDate()+'</button><button class="cellplus" data-add="'+key+'" aria-label="Add on '+key+'">'+icon('plus',16)+'</button>'+
   events.slice(0,3).map(e=>'<button class="eventchip" '+eventAttr(e)+'>'+h(e.title)+'</button>').join('')+'</div>';
 }
 $('#grid').innerHTML=html+'</div>';bindEventButtons();
}
function renderWeek(){
 const d=state.date,shift=state.settings.start_of_week==='monday'?1:0,start=state.view==='day'?d:add(d,-((d.getDay()-shift+7)%7)),days=Array.from({length:state.view==='day'?1:7},(_,i)=>add(start,i)),events=occurrences(add(start,-1),add(start,days.length+1));
 let html='<div class="weekwrapper"><div class="weekhead" style="--cols:'+days.length+'"><div>'+(state.settings.show_week_numbers?'W'+isoWeek(start):'')+'</div>'+days.map(t=>'<div><small>'+t.toLocaleDateString('en-US',{weekday:'short'})+'</small><button data-drill="'+iso(t)+'">'+t.getDate()+'</button><button data-add="'+iso(t)+'" aria-label="Add event">'+icon('plus',16)+'</button></div>').join('')+'</div>';
 html+='<div class="all-day-strip" style="--cols:'+days.length+'"><span>all day</span>'+days.map(day=>'<div class="all-day-day">'+events.filter(x=>x.all_day&&eventOn(x,iso(day))).map(x=>'<button class="all-day-chip" '+eventAttr(x)+'>'+h(x.title)+'</button>').join('')+'</div>').join('')+'</div>';
 html+='<div class="weekbody" style="--cols:'+days.length+'"><div class="hours">'+Array.from({length:24},(_,i)=>'<span style="top:'+(i*60)+'px">'+(i%12||12)+' '+(i<12?'AM':'PM')+'</span>').join('')+'</div>';
 for(const t of days){
  const key=iso(t);html+='<div class="daytrack" data-slot="'+key+'">';
  for(const e of events.filter(x=>!x.all_day&&eventOn(x,key))){
   const st=new Date(e.starts_at),ed=new Date(e.ends_at),minute=e._segment?0:st.getHours()*60+st.getMinutes(),height=Math.max(25,Math.min(1440-minute,e._segment?60:(ed-st)/60000));
   html+='<button class="weekevent" '+eventAttr(e,'top:'+minute+'px;height:'+height+'px;')+'><strong>'+h(e.title)+'</strong></button>';
  }html+='</div>';
 }
 $('#grid').innerHTML=html+'</div></div>';bindEventButtons();
 $$('[data-slot]').forEach(el=>el.onclick=e=>{if(e.target.closest('button'))return;const m=Math.max(0,Math.min(1425,Math.floor((e.clientY-el.getBoundingClientRect().top)/15)*15));openEditor(null,el.dataset.slot,String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'))});
}
function renderAgenda(){
 const today=iso(now()),items=occurrences(add(now(),-1),add(now(),370)).filter(x=>eventDate(x)>=today),days=[...new Set(items.map(x=>eventDate(x)))];
 $('#grid').innerHTML='<div class="agenda">'+(days.length?days.map(d=>'<div class="agenda-group"><button class="agenda-date" data-drill="'+d+'">'+h(label(date(d)))+'</button>'+items.filter(x=>eventOn(x,d)).map(x=>'<button class="agenda-item" '+eventAttr(x)+'><span class="agenda-title"><i class="event-dot"></i><strong>'+h(x.title)+'</strong></span><small>'+(x.all_day?'All day':h(prettyClock(x.starts_at)))+'</small></button>').join('')+'</div>').join(''):'<div class="whole-empty"><span class="empty-icon"></span><p>No upcoming events</p></div>')+'</div>';bindEventButtons();
}
function bindEventButtons(){
 $$('[data-drill]').forEach(x=>x.onclick=e=>{e.stopPropagation();drill(x.dataset.drill)});
 $$('[data-add]').forEach(x=>x.onclick=e=>{e.stopPropagation();openEditor(null,x.dataset.add)});
 $$('[data-cell]').forEach(x=>x.onclick=e=>{if(!e.target.closest('button'))openEditor(null,x.dataset.cell)});
 $$('[data-detail]').forEach(x=>x.onclick=e=>{e.stopPropagation();const ev=getOccurrence(x.dataset.detail,x.dataset.occ);if(ev)details(ev)});
}
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape')return;
 if(document.querySelector('#calendarDatePicker')){document.querySelector('#calendarDatePicker').remove();e.preventDefault();e.stopImmediatePropagation();return}
 if(document.querySelector('dialog[open]'))return;
 if(document.querySelector('#searchBar:not([hidden])')){$('#searchClose')?.click();e.preventDefault();return}
 if(state.drilled){exitDrill();e.preventDefault()}
});

function modal(html,wide=false){
 const dlg=document.createElement('dialog');dlg.className='dialog '+(wide?'wide':'');
 dlg.innerHTML='<div class="dialog-body">'+html+'</div><button type="button" class="dialog-close icon" data-close aria-label="Close dialog">'+icon('x',16)+'</button>';
 document.body.append(dlg);dlg.showModal();
 $$('[data-close]',dlg).forEach(b=>b.onclick=()=>dlg.close());
 dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
 dlg.addEventListener('close',()=>dlg.remove());
 return dlg;
}
function confirmAction(title,body,act){const dlg=modal('<div class="warning-circle">'+icon('warning')+'</div><h2>'+h(title)+'</h2><p>'+h(body)+'</p><footer class="footer-actions"><button class="secondary" data-close>Cancel</button><button id="confirmYes" class="danger">Confirm</button></footer>');$('#confirmYes',dlg).onclick=async()=>{dlg.close();await act()}}
function promptForm(title,placeholder,cb,value=''){
 const dlg=modal('<h2>'+h(title)+'</h2><input class="text-input" id="promptValue" placeholder="'+h(placeholder)+'" value="'+h(value)+'" maxlength="120"><footer class="footer-actions"><button class="secondary" data-close>Cancel</button><button class="primary" id="promptSave">Save</button></footer>');
 const field=$('#promptValue',dlg);field.focus();field.select();
 const save=async()=>{if(!field.value.trim())return field.classList.add('shake');const val=field.value.trim();dlg.close();await cb(val)};
 $('#promptSave',dlg).onclick=save;field.onkeydown=e=>{if(e.key==='Enter')save()};
}
function menu(button,items,filterable=false){
 $('#floatingMenu')?.remove();
 const el=document.createElement('div');el.id='floatingMenu';el.className='floating-menu';
 const search=filterable?'<div class="menu-search"><span>'+icon('search',16)+'</span><input aria-label="Search time zones" placeholder="Search time zones..." type="search"></div>':'';
 el.innerHTML=search+'<div class="menu-options">'+items.map((x,i)=>'<button type="button" class="'+(x[2]?'danger-text':'')+'" data-item="'+i+'">'+h(x[0])+'</button>').join('')+'</div>';
 (button.closest('dialog[open]')||document.body).append(el);
 const rect=button.getBoundingClientRect(),inSidebar=!!button.closest('#calList'),width=Math.min(Math.max(220,rect.width),innerWidth-12);
 el.style.width=width+'px';
 const availableBelow=innerHeight-rect.bottom-12,needed=Math.min(filterable?390:285,items.length*38+20);
 const top=availableBelow>=Math.min(needed,185)?rect.bottom+5:Math.max(7,rect.top-Math.min(needed,innerHeight-18)-5);
 el.style.top=top+'px';
 const x=inSidebar?rect.right+7:rect.left;
 el.style.left=Math.max(6,Math.min(innerWidth-width-6,x))+'px';
 const close=(restore=false)=>{el.remove();document.removeEventListener('pointerdown',dismiss,true);if(restore)button.focus()};
 $$('[data-item]',el).forEach(b=>b.onclick=()=>{const fn=items[+b.dataset.item][1];close();fn()});
 const dismiss=e=>{if(!el.contains(e.target)&&!button.contains(e.target))close()};
 setTimeout(()=>{if(el.isConnected)document.addEventListener('pointerdown',dismiss,true)},0);
 if(filterable){
  const input=el.querySelector('input');
  input.oninput=()=>{const q=input.value.trim().toLowerCase();$$('[data-item]',el).forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(q))};
  input.focus();
 }
 el.onkeydown=e=>{
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);return}
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
   const buttons=$$('[data-item]:not([hidden])',el);if(!buttons.length)return;
   e.preventDefault();const i=buttons.indexOf(document.activeElement);
   buttons[(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();
  }
 };
 upgradeIcons();
}
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&document.querySelector('#floatingMenu')){
  e.preventDefault();e.stopImmediatePropagation();
  const menuEl=$('#floatingMenu');menuEl?.remove();
 }
},true);

let settingsWrites=Promise.resolve();
async function saveSetting(field,value){
 const updates=typeof field==='object'?field:{[field]:value};
 const previous={...state.settings};
 state.settings={...state.settings,...updates};
 if(updates.default_view&&!state.drilled)state.view=updates.default_view;
 applyTheme();renderSettings();upgradeIcons();
 // Serialize writes, so swatch and theme clicks cannot complete out of order.
 const task=settingsWrites.then(async()=>{
  try{
   const result=await api('data_update',{entity:'settings',data:updates});
   if(!result?.item)throw Error('Server did not confirm save');
   // Keep newer optimistic values rather than replacing with an older response.
   return result.item;
  }catch(e){
   for(const k of Object.keys(updates)){
    if(state.settings[k]===updates[k])state.settings[k]=previous[k];
   }
   applyTheme();renderSettings();upgradeIcons();
   toast("Couldn't save — check your connection");
   return null;
  }
 });
 settingsWrites=task.then(()=>{});
 return task;
}
const switches={
 calendar:[['show_week_numbers','Show week numbers','Show ISO week numbers in the calendar']],
 appearance:[['show_weekends','Show weekends','Include Saturday and Sunday'],['compact_mode','Compact mode','Use tighter spacing'],['reduce_motion','Reduce motion','Minimize movement and animations']],
 notifications:[['task_reminders','Task reminders','Notifications for due tasks'],['event_reminders','Event reminders','Notifications for upcoming events'],['notification_sound','Notification sound','Play a sound when a reminder appears']]
};
const selectOptions={
 default_view:[['day','Day'],['week','Week'],['month','Month'],['agenda','Agenda']],
 start_of_week:[['sunday','Sunday'],['monday','Monday']],
 default_reminder_minutes:[['-1','None'],['5','5 minutes'],['15','15 minutes'],['30','30 minutes'],['60','1 hour'],['1440','1 day']],
 time_zone:[['auto','Device time zone ('+Intl.DateTimeFormat().resolvedOptions().timeZone+')'],...(Intl.supportedValuesOf?.('timeZone')||[]).map(tz=>[tz,tz.replaceAll('_',' ')])]
};
const readableTime=v=>{const [hour,minute]=String(v||'09:00').split(':').map(Number);return (hour%12||12)+':'+String(minute||0).padStart(2,'0')+' '+(hour>=12?'PM':'AM')};
const row=(title,description,control)=>'<div class="setting-row"><div><strong>'+h(title)+'</strong><small>'+h(description||'')+'</small></div><div class="row-control">'+control+'</div></div>';
function switchHtml(key,value){return '<button role="switch" aria-checked="'+!!value+'" class="switch '+(value?'on':'')+'" data-setting-switch="'+key+'"><span></span></button>'}
function customSelect(name,current,items){const text=items.find(x=>String(x[0])===String(current))?.[1]||items[0]?.[1]||'Choose';return '<button class="pill-select" data-select="'+name+'"><span class="select-value">'+h(text)+'</span>'+icon('chevron-down',16)+'</button>'}
function themeCards(){return '<div class="theme-cards">'+['dark','light','system'].map(theme=>'<button class="theme-card '+(state.settings.theme===theme?'picked':'')+'" data-theme="'+theme+'"><span class="theme-mini '+theme+'"><i></i><b></b><em></em><strong></strong><u></u></span><span>'+h(theme==='dark'?'Midnight':theme==='light'?'Daylight':'System')+'</span>'+(state.settings.theme===theme?'<span class="theme-check">'+icon('check',16)+'</span>':'')+'</button>').join('')+'</div>'}
function settingsContent(which){
 const s=state.settings,u=state.user,all=switches[which],switchRows=all?all.map(([id,title,help])=>row(title,help,switchHtml(id,s[id]))).join(''):'';
 if(which==='general')return '<h2>General</h2><p>Account and personal preferences.</p>'+row('Account','@'+u.username,'<button class="secondary" id="logoutBtn">Log out</button>')+row('First name','Used on your account','<input class="small-input" id="firstName" value="'+h(u.first_name)+'">')+row('Last name','Used on your account','<input class="small-input" id="lastName" value="'+h(u.last_name)+'">')+row('Time zone','Defaults to your device',customSelect('time_zone',s.time_zone||'auto',selectOptions.time_zone))+row('Start of week','First calendar weekday',customSelect('start_of_week',s.start_of_week,selectOptions.start_of_week));
 if(which==='calendar')return '<h2>Calendar</h2><p>Plan how your calendar is displayed.</p>'+row('Default Calendar View','View when Daylight opens',customSelect('default_view',s.default_view,selectOptions.default_view))+switchRows+row('Work hours','Beginning and end of the workday','<span class="worktime"><button class="pill-select" data-time="work_hours_start">'+h(readableTime(s.work_hours_start||'09:00'))+'</button> – <button class="pill-select" data-time="work_hours_end">'+h(readableTime(s.work_hours_end||'17:00'))+'</button></span>');
 if(which==='appearance')return '<h2>Appearance</h2><p>Make Daylight feel like yours.</p>'+themeCards()+switchRows;
 if(which==='data')return '<h2>Data & sync</h2><p>Manage calendar subscriptions and information.</p>'+row('Connected calendars','Manage the calendars in your workspace','<button class="secondary" id="goIntegrations">Manage connected calendars ›</button>')+row('US Holidays','Show federal holidays',switchHtml('holidays',state.calendars.find(x=>x.client_id==='us-holidays')?.is_visible!==false))+'<h3>Subscriptions</h3><div id="settingsSubs">'+(state.subscriptions.length?state.subscriptions.map(x=>'<div class="sub-item"><strong>'+h(x.name)+'</strong><small>'+h(x.url)+'</small><small>Last fetched: '+h(x.last_fetched_at?prettyStamp(x.last_fetched_at):'Never')+'</small><button class="secondary" data-refresh="'+x.id+'">Refresh</button><button class="danger outline" data-remove="'+x.id+'">Remove</button></div>').join(''):'<p class="quiet">No subscriptions yet.</p>')+'</div>'+row('Add subscription','Read-only .ics calendar link','<button class="secondary" id="addSub">Add subscription</button>')+row('Last sync',state.subscriptions.map(x=>x.last_fetched_at).filter(Boolean).sort().at(-1)?prettyStamp(state.subscriptions.map(x=>x.last_fetched_at).filter(Boolean).sort().at(-1)):'Never','<button class="secondary" id="refreshAll">Refresh all</button>');
 if(which==='notifications')return '<h2>Notifications</h2><p>Control browser notifications.</p>'+row('Permission',(typeof Notification!=='undefined'&&Notification.permission==='granted')?'Notifications are enabled':'Permission is required','<button class="secondary" id="enableNotify">'+(typeof Notification!=='undefined'&&Notification.permission==='granted'?'Enabled':'Enable notifications')+'</button>')+(typeof Notification!=='undefined'&&Notification.permission==='denied'?'<p class="notification-error">Notifications are blocked. Allow them in your browser site settings.</p>':'')+switchRows+row('Default reminder','Used for new events',customSelect('default_reminder_minutes',s.default_reminder_minutes,selectOptions.default_reminder_minutes));
 if(which==='ai')return '<h2>AI access</h2><p>AI agents with a token can read and edit your calendars and tasks through MCP.</p>'+row('AI deletes','Allow irreversible event and task deletion',switchHtml('mcp_allow_delete',s.mcp_allow_delete))+'<h3>MCP tokens</h3><p class="quiet">Tokens are shown once. Protect them like passwords.</p><button class="primary" id="generateToken">Generate token</button><div id="tokenList"><p>Loading tokens…</p></div>';
 return '<h2>About daylight.</h2><div class="about-summary"><div class="about-mark">'+icon('brand')+'</div><strong>daylight.</strong><small>Version 2.1 · Personal calendar</small></div><h3>Legal</h3>'+row('Privacy Policy','How Daylight handles your data','<button class="secondary" data-legal="privacy">Read ›</button>')+row('Terms of Service','Using Daylight','<button class="secondary" data-legal="terms">Read ›</button>')+row('Changelog','What changed in each release','<button class="secondary" data-legal="changelog">Read ›</button>');
}
function settings(which){
 state.setting=which||state.setting||localStorage.getItem('daylight-settings-section')||'general';localStorage.setItem('daylight-settings-section',state.setting);
 const existing=$('#settingsModal');existing?.remove();
 const sections=[['general','General','⚙'],['calendar','Calendar','▦'],['appearance','Appearance','◈'],['data','Data & sync','▤'],['notifications','Notifications','♧'],['ai','AI access','✳'],['about','About','ⓘ']];
 const dlg=modal('<div class="settings-grid"><nav class="settings-nav"><h2>Settings</h2>'+sections.map(x=>'<button data-sec="'+x[0]+'" class="'+(x[0]===state.setting?'selected':'')+'"><span class="glyph">'+x[2]+'</span>'+x[1]+'</button>').join('')+'</nav><div class="settings-pane" id="settingsPane"></div></div>',true);dlg.id='settingsModal';dlg.addEventListener('close',()=>{if(state.page==='calendar'&&state.user){renderCalendar();renderMini()}});
 $$('[data-sec]',dlg).forEach(b=>b.onclick=()=>{state.setting=b.dataset.sec;localStorage.setItem('daylight-settings-section',state.setting);$$('[data-sec]',dlg).forEach(x=>x.classList.toggle('selected',x===b));renderSettings()});
 renderSettings();
}
function renderSettings(){
 const dlg=$('#settingsModal');if(!dlg)return;const pane=$('#settingsPane',dlg);pane.innerHTML=settingsContent(state.setting);
 pane.scrollTop=0;
 $$('[data-setting-switch]',pane).forEach(b=>b.onclick=()=>{const key=b.dataset.settingSwitch;if(key==='preview'){const on=b.getAttribute('aria-checked')!=='true';b.classList.toggle('on',on);b.setAttribute('aria-checked',String(on));return}if(key==='holidays'){const c=state.calendars.find(x=>x.client_id==='us-holidays');if(c)safeChange('calendars',c.id,{is_visible:!c.is_visible},'update');return}if(key==='mcp_allow_delete'&&!state.settings[key])return confirmAction('Allow AI agents to delete?','An AI holding a token could permanently delete events and tasks. Deletes are logged and cannot be undone.',()=>saveSetting(key,true));saveSetting(key,!state.settings[key])});
 $$('[data-select]',pane).forEach(b=>b.onclick=()=>{const name=b.dataset.select;menu(b,selectOptions[name].map(x=>[x[1],()=>saveSetting(name,name==='default_reminder_minutes'?Number(x[0]):x[0])]),name==='time_zone')});
 $$('[data-time]',pane).forEach(b=>b.onclick=()=>{const name=b.dataset.time;menu(b,Array.from({length:96},(_,i)=>{const time=String(Math.floor(i/4)).padStart(2,'0')+':'+String((i%4)*15).padStart(2,'0');return[readableTime(time),()=>saveSetting(name,time)]}))});
 $$('[data-theme]',pane).forEach(b=>b.onclick=()=>saveSetting('theme',b.dataset.theme));
 $('#logoutBtn',pane)?.addEventListener('click',logout);
 for(const id of ['firstName','lastName']){const input=$('#'+id,pane);if(input){input.onblur=()=>{const first=$('#firstName',pane).value,last=$('#lastName',pane).value;if(!first.trim()||!last.trim())return;api('user_update',{first_name:first,last_name:last}).then(x=>{state.user=x.user;const profile=$('.profile');if(profile){$('strong',profile).textContent=state.user.first_name+' '+state.user.last_name;$('.avatar',profile).textContent=state.user.first_name[0]||'?'}const greeter=$('.greeting');if(greeter)greeter.textContent=greeting(state.user.first_name);toast('Saved')}).catch(()=>toast("Couldn't save — check your connection"))};input.onkeydown=e=>{if(e.key==='Enter')input.blur()}}}
 $('#goIntegrations',pane)?.addEventListener('click',()=>{$('#settingsModal').close();state.page='integrations';render()});
 $('#enableNotify',pane)?.addEventListener('click',async()=>{if(typeof Notification!=='undefined'){try{state.notification=await Notification.requestPermission()}catch{state.notification='denied'}renderSettings()}else toast('Notifications are unavailable in this browser')});
 $('#generateToken',pane)?.addEventListener('click',()=>promptForm('Generate MCP token','Token name',async name=>{try{toast('Creating token…');const x=await api('mcp_generate',{name});toast('Token created');const pop=modal('<h2>Copy your token</h2><p>You won’t see this again.</p><textarea readonly id="tokenSecret">'+h(x.token)+'</textarea><button id="copyToken" class="primary">Copy token</button>');$('#copyToken',pop).onclick=()=>navigator.clipboard.writeText(x.token);renderSettings()}catch{toast('Token could not be created')}}));
 upgradeIcons();
 if(state.setting==='ai')api('mcp_list').then(x=>{const box=$('#tokenList',dlg);if(box)box.innerHTML=(x.items.length?x.items.map(t=>'<div class="token-row">'+h(t.name)+' <small>'+h(prettyShort(t.created_at))+'</small><button data-revoke="'+t.id+'" class="danger">Revoke</button></div>').join(''):'<div class="whole-empty"><span class="empty-icon"></span><p>No tokens yet</p></div>');$$('[data-revoke]',box).forEach(b=>b.onclick=()=>confirmAction('Revoke token?','This agent will lose access immediately.',async()=>{loading(b,true,'Revoking…');try{await api('mcp_revoke',{id:b.dataset.revoke});b.closest('.token-row')?.remove();toast('Token revoked');renderSettings()}catch{loading(b,false);toast('Token revoke failed')}}))}).catch(()=>{});
 $$('[data-legal]',pane).forEach(b=>b.onclick=()=>legal(b.dataset.legal));
 $('#addSub',pane)?.addEventListener('click',()=>subscriptionDialog());
 $('#refreshAll',pane)?.addEventListener('click',async()=>{let fails=0;for(const x of state.subscriptions){try{await api('sub_refresh',{id:x.id})}catch{fails++}}await refreshData();toast(fails?fails+' feeds could not be refreshed':'Subscriptions refreshed');renderSettings()});
 $$('[data-refresh]',pane).forEach(b=>b.onclick=async()=>{try{await api('sub_refresh',{id:b.dataset.refresh});await refreshData();toast('Subscription refreshed');renderSettings()}catch(e){toast(e.message)}});
 $$('[data-remove]',pane).forEach(b=>b.onclick=()=>confirmAction('Remove subscription?','The subscribed calendar will be removed.',()=>safeChange('subscriptions',b.dataset.remove,null,'delete')));
}
function legal(id){const text={
 privacy:'Daylight stores your account information, events, tasks, calendars, settings and subscriptions in its Supabase database. Your password is verified server-side and only a salted password hash is stored. MCP tokens are stored only as hashes. Account data is accessible through authenticated server APIs. Never share your login or AI tokens. Browser storage holds a session token so you remain signed in. Public calendar subscriptions may expose their contents to the URL provider.',
 terms:'Daylight is a personal calendar application. You are responsible for entries you create and links you subscribe to. Do not share access tokens. Calendar data may be incomplete or unavailable while offline or if a provider blocks access. Export important information for backup. This service is provided as-is, without a promise of continuous availability.',
 changelog:''
 };const title=id==='privacy'?'Privacy Policy':id==='terms'?'Terms of Service':'Changelog',body=id==='changelog'?'<div class="changelog"><h3>Version 2.1</h3><ul><li>Month-grid date picking and native repeat rendering</li><li>Calendar colors and contextual greetings</li><li>Tasks filters, event details, and updated Settings</li></ul><h3>Version 2.0</h3><ul><li>Improved calendar visibility, inline renaming, and fixed Settings sizing</li></ul><h3>Version 1.1</h3><ul><li>Login-only accounts, Supabase storage, and AI access controls</li></ul></div>':'<p>'+h(text[id])+'</p>';modal('<h2>'+h(title)+'</h2>'+body+'<div class="footer-actions"><button class="primary" data-close>Done</button></div>')}
function subscriptionDialog(){const dlg=modal('<h2>Add subscription</h2><p>Use a public .ics URL. Feed refresh requires server-side fetching.</p><label>Name<input id="subName" placeholder="Optional"></label><label>Feed URL<input id="subURL" placeholder="https://example.com/events.ics"></label><footer class="footer-actions"><button class="secondary" data-close>Cancel</button><button class="primary" id="subSave">Add subscription</button></footer>');$('#subSave',dlg).onclick=async()=>{const input=$('#subURL',dlg).value;try{loading($('#subSave',dlg),true,'Adding…');const u=new URL(input.replace(/^webcal:/,'https:'));if(u.protocol!=='https:')throw Error();const r=await api('data_create',{entity:'subscriptions',data:{name:$('#subName',dlg).value,url:u.href}});dlg.close();await refreshData();if(r.refresh_error)toast(r.refresh_error==='NOT_CALENDAR'?"That link didn't return a calendar file. Check the URL points to a direct .ics feed.":"Couldn't reach that feed. The server may be blocking access.");else toast('Subscription added')}catch{loading($('#subSave',dlg),false);toast('Enter a valid HTTPS feed URL')}}}
function renderTasks(){
 const counts={all:state.tasks.length,todo:state.tasks.filter(t=>!t.completed).length,completed:state.tasks.filter(t=>t.completed).length};
 const choices=[['all','All'],['todo','To do'],['completed','Completed']];
 const filtered=state.tasks.filter(t=>state.taskFilter==='all'||(state.taskFilter==='completed'?t.completed:!t.completed));
 $('#content').innerHTML='<div class="list-page tasks-view"><header class="view-header"><div><h1>Tasks</h1><p>Stay on top of what matters.</p></div><button class="primary" id="newTask">'+icon('plus')+' New task</button></header><div class="task-filters">'+choices.map(([key,label])=>'<button data-task-filter="'+key+'" class="'+(key===state.taskFilter?'selected':'')+'">'+label+' <span>'+counts[key]+'</span></button>').join('')+'</div><div class="task-list">'+(filtered.length?filtered.map(t=>'<div class="task-row"><button data-done="'+t.id+'" role="checkbox" aria-checked="'+t.completed+'" class="check '+(t.completed?'checked':'')+'">'+(t.completed?icon('check',16):'')+'</button><button data-task="'+t.id+'" class="task-title '+(t.completed?'done':'')+'"><strong>'+h(t.title)+'</strong><small>'+h(t.due_date?prettyShort(t.due_date+'T12:00:00'):'No due date')+'</small></button></div>').join(''):'<div class="whole-empty"><span class="empty-icon">'+icon('tasks',40)+'</span><p>'+(state.taskFilter==='all'?'No tasks yet':state.taskFilter==='todo'?'No tasks to do':'No completed tasks yet')+'</p></div>')+'</div></div>';
 $('#newTask').onclick=()=>openEditor(null,null,null,'task');
 $$('[data-task-filter]').forEach(b=>b.onclick=()=>{state.taskFilter=b.dataset.taskFilter;renderTasks();upgradeIcons()});
 $$('[data-done]').forEach(b=>b.onclick=()=>{const t=state.tasks.find(t=>t.id===b.dataset.done);safeChange('tasks',t.id,{completed:!t.completed},'update')});
 $$('[data-task]').forEach(b=>b.onclick=()=>{const t=state.tasks.find(t=>t.id===b.dataset.task);openEditor(t,null,null,'task')});
}
function renderIntegrations(){
 $('#content').innerHTML='<div class="list-page"><header class="view-header"><div><h1>Integrations</h1><p>Connect your schedules in one place.</p></div><button class="primary" id="connect">Add subscription</button></header><div class="integration-grid">'+[['Google Calendar','Use a published iCalendar URL. Private account sync is not connected.'],['Outlook','Export or publish an iCalendar feed from Outlook.'],['Apple Calendar','Share a read-only calendar URL from iCloud.'],['CalDAV','Authenticated two-way CalDAV is not available.']].map(x=>'<div class="integration-card"><h3>'+h(x[0])+'</h3><p>'+h(x[1])+'</p><button class="secondary" data-help="'+h(x[0])+'">Learn more ↗</button></div>').join('')+'</div></div>';
 $('#connect').onclick=subscriptionDialog;$('[data-help]').forEach(x=>x.onclick=()=>modal('<h2>'+h(x.dataset.help)+'</h2><p>'+(x.dataset.help==='CalDAV'?'Two-way CalDAV sync is not available yet.':'Direct '+h(x.dataset.help)+' account sync is not available yet. You can use Add subscription with a published .ics feed URL if your provider supports one.')+'</p><button class="primary" data-close>Done</button>'));
}
function details(e){
 const readOnly=state.subscriptions.some(sub=>sub.calendar_id===e.calendar_id);
 const cal=state.calendars.find(c=>c.id===e.calendar_id),day=e._civilDate?date(e._civilDate):new Date(e.starts_at),when=e.all_day?label(day):label(day)+' · '+prettyClock(e.starts_at)+'–'+prettyClock(e.ends_at);const dlg=modal('<div class="micro">EVENT</div><h2>'+h(e.title)+'</h2><p>'+h(when)+'</p><p class="popover-calendar"><i style="background:'+eventColor(e)+'"></i>'+h(cal?.name||'Calendar')+'</p>'+(repeatLabel(e.repeat_rule)?'<p>'+h(repeatLabel(e.repeat_rule))+'</p>':'')+'<p>'+h(e.description||'No description')+'</p><p>'+h(e.location_name||'')+'</p><div class="footer-actions"><button class="secondary" data-close>'+icon('x',16)+' Close</button>'+(readOnly?'':'<button class="secondary" id="deleteEvent">'+icon('trash',16)+' Delete</button><button class="primary" id="editEvent">'+icon('pencil',16)+' Edit</button>')+'</div>');
 $('#editEvent',dlg)?.addEventListener('click',()=>{dlg.close();openEditor(e._origin||e)});
 $('#deleteEvent',dlg)?.addEventListener('click',()=>confirmAction('Delete event?','This event will be permanently deleted.',async()=>{await safeChange('events',e.id,null,'delete');dlg.close()}));
 upgradeIcons();
}

let addressTimer=0,selectedLocation=null;
function openCustomRepeat(current,done){
 const dlg=modal('<h2>Custom repeat</h2><label>Frequency<select id="repeatFrequency"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label><label>Every <input id="repeatInterval" type="number" min="1" max="365" value="1"></label><label>Ends<select id="repeatEnds"><option value="never">Never</option><option value="on">On date</option><option value="count">After occurrences</option></select></label><label id="repeatUntilRow" hidden>End date<input id="repeatUntil" type="date"></label><label id="repeatCountRow" hidden>Occurrences<input id="repeatCount" type="number" min="1" max="1000" value="10"></label><div class="footer-actions"><button class="secondary" data-close>Cancel</button><button class="primary" id="saveRepeat">Apply</button></div>');
 const q=id=>$('#'+id,dlg);
 q('repeatFrequency').value=current.frequency==='never'?'weekly':current.frequency||'weekly';
 q('repeatInterval').value=current.interval||1;q('repeatEnds').value=current.ends||'never';q('repeatUntil').value=current.until||iso(add(now(),30));q('repeatCount').value=current.count||10;
 const show=()=>{q('repeatUntilRow').hidden=q('repeatEnds').value!=='on';q('repeatCountRow').hidden=q('repeatEnds').value!=='count'};
 q('repeatEnds').onchange=show;show();
 q('saveRepeat').onclick=()=>{const frequency=q('repeatFrequency').value,interval=Math.max(1,Math.min(365,Number(q('repeatInterval').value)||1)),ends=q('repeatEnds').value,count=Math.max(1,Math.min(1000,Number(q('repeatCount').value)||10)),until=q('repeatUntil').value;done({frequency,interval,ends,...(ends==='on'?{until}:{}),...(ends==='count'?{count}:{})});dlg.close()};
}

function openEditor(existing=null,chosenDate=null,chosenTime=null,kind='event'){
 state.edit=existing;state.mode=kind;state.timed=!!chosenTime||(!!existing&&!existing.all_day);state.allDay=kind==='event'&&!state.timed;
 selectedLocation=existing?.location_address?{display:existing.location_name,address:existing.location_address}:null;
 const first=existing?(kind==='task'?(existing.due_date?date(existing.due_date):now()):new Date(existing.starts_at)):chosenDate?date(chosenDate):now();
 if(!existing&&!chosenTime){first.setHours(first.getHours()+1,0,0,0)}
 if(chosenTime){const [hr,min]=chosenTime.split(':').map(Number);first.setHours(hr,min,0,0)}
 const finish=existing&&kind==='event'?new Date(existing.ends_at):new Date(first.getTime()+3600000);
 const dateText=existing?.all_day?String(existing.starts_at).slice(0,10):iso(first),endText=existing?.all_day?iso(add(date(String(existing.ends_at).slice(0,10)),-1)):iso(finish),startTime=('0'+first.getHours()).slice(-2)+':'+('0'+first.getMinutes()).slice(-2),endTime=('0'+finish.getHours()).slice(-2)+':'+('0'+finish.getMinutes()).slice(-2);
 const options=state.calendars.filter(c=>c.client_id!=='us-holidays'&&!state.subscriptions.some(s=>s.calendar_id===c.id));
 const chosen=options.find(c=>c.id===existing?.calendar_id)||options[0];
 const dlg=modal('<form id="quickForm"><header class="quick-top"><span class="grip" aria-hidden="true"></span><button type="button" class="icon" id="editorClose">×</button></header><input id="quickTitle" class="quick-title" placeholder="Add title" maxlength="300" value="'+h(existing?.title||'')+'"><small class="title-error" id="titleError" hidden>Add a title</small><div class="toggle-segments"><button type="button" data-mode="event" class="'+(kind==='event'?'selected':'')+'">Event</button><button type="button" data-mode="task" class="'+(kind==='task'?'selected':'')+'">Task</button></div><div class="quick-content"><div class="quick-row"><span class="row-icon">◷</span><div class="quick-fields"><div class="date-time-row"><button type="button" data-pick="start" class="field-button" id="startDateBtn">'+h(label(first))+'</button><span>–</span><button type="button" data-pick="end" class="field-button" id="endDateBtn">'+h(existing?.all_day?label(date(endText)):label(finish))+'</button><button type="button" id="addTime" class="secondary '+(state.timed?'active':'')+'">Add time</button></div><div id="timedFields" '+(state.timed?'':'hidden')+' class="timed-row"><button type="button" class="field-button" data-pick="startTime">'+h(startTime)+'</button><button type="button" class="field-button" data-pick="endTime">'+h(endTime)+'</button></div><button type="button" class="repeat-line" id="repeatButton">Does not repeat ▾</button></div></div><div class="quick-row" id="locationRow"><span class="row-icon">⌖</span><div class="quick-fields location-area"><input id="quickLocation" placeholder="Add location" autocomplete="off" value="'+h(existing?.location_name||'')+'"><small class="saved-address" id="addressSaved" '+(selectedLocation?'':'hidden')+'>Full address saved: '+h(selectedLocation?.address||'')+'</small><div id="addressOptions" class="address-options" hidden></div></div></div><div class="quick-row"><span class="row-icon">☷</span><textarea id="quickDescription" placeholder="Add description" rows="1">'+h(existing?.description||existing?.notes||'')+'</textarea></div><div class="quick-row" id="calendarRow"><span class="row-icon">▦</span><div class="quick-fields"><button type="button" id="eventCalendarBtn" class="field-button"><i class="form-calendar-dot" style="background:'+colorFor(chosen)+'"></i> '+h(chosen?.name||'No calendar')+' ▾</button><small id="calSummary">'+h(chosen?.name||'')+' · Reminder: 15 minutes before</small></div></div><div id="extraFields" hidden><div class="quick-row"><span class="row-icon">◷</span><div class="quick-fields">All day <button type="button" class="switch '+(state.allDay?'on':'')+'" id="allDaySwitch" role="switch" aria-checked="'+!!state.allDay+'"><span></span></button></div></div><div class="quick-row"><span class="row-icon">♧</span><button type="button" class="field-button" id="reminderButton">15 minutes before ▾</button></div></div></div><footer class="quick-footer"><button class="secondary" type="button" id="moreOptions">More options</button><div class="quick-footer-right">'+(existing?'<button type="button" class="danger-text" id="quickDelete">Delete</button>':'')+'<button type="submit" class="primary" id="quickSave">'+'Save'+'</button></div></footer><input type="hidden" id="startDate" value="'+dateText+'"><input type="hidden" id="endDate" value="'+endText+'"><input type="hidden" id="startTime" value="'+startTime+'"><input type="hidden" id="endTime" value="'+endTime+'"><input type="hidden" id="calendarValue" value="'+h(chosen?.id||'')+'"><input type="hidden" id="repeatValue" value="never"><input type="hidden" id="reminderValue" value="15"></form>');
 dlg.classList.add('quick-dialog');dlg.querySelector('.dialog-close')?.remove();$$('[data-mode]',dlg).forEach(b=>b.insertAdjacentHTML('afterbegin',icon(b.dataset.mode==='event'?'calendar':'tasks',16)));
 const form=$('#quickForm',dlg),title=$('#quickTitle',form);title.addEventListener('input',()=>{title.classList.remove('invalid');$('#titleError',form).hidden=!!title.value.trim()});title.focus();requestAnimationFrame(()=>{if(dlg.open)title.focus()});
 const useMode=mode=>{state.mode=mode;$$('[data-mode]',form).forEach(x=>x.classList.toggle('selected',x.dataset.mode===mode));$('#locationRow',form).hidden=mode==='task';$('#calendarRow',form).hidden=mode==='task';$('#repeatButton',form).hidden=mode==='task';$('#addTime',form).hidden=mode==='task';$('#timedFields',form).hidden=mode==='task'||!state.timed;$('#moreOptions',form).hidden=mode==='task';$('#quickSave',form).textContent='Save'};
 $$('[data-mode]',form).forEach(x=>x.onclick=()=>useMode(x.dataset.mode));useMode(kind);
 let repeatRule=existing?.repeat_rule&&typeof existing.repeat_rule==='object'?{...existing.repeat_rule}:{frequency:'never'};
 const snapshot=()=>JSON.stringify({mode:state.mode,title:title.value,description:$('#quickDescription',form).value,location:$('#quickLocation',form)?.value||'',start:$('#startDate',form).value,end:$('#endDate',form).value,startTime:$('#startTime',form).value,endTime:$('#endTime',form).value,allDay:state.allDay,cal:$('#calendarValue',form).value,repeat:repeatRule});
 const initialSnapshot=snapshot();
 const close=()=>{if(snapshot()!==initialSnapshot)confirmAction('Discard this '+state.mode+'?','Your unsaved changes will be lost.',()=>dlg.close());else dlg.close()};
 $('#editorClose',form).onclick=close;
 dlg.oncancel=e=>{e.preventDefault();close()};
 const updateRepeat=()=>{$('#repeatValue',form).value=repeatRule.frequency||'never';$('#repeatButton',form).innerHTML=(repeatRule.frequency==='never'?'Does not repeat':(repeatRule.frequency||'never')[0].toUpperCase()+(repeatRule.frequency||'never').slice(1))+' '+icon('chevron-down',16)};
 updateRepeat();
 const setDate=(type,value)=>{
  $('#'+type+'Date',form).value=value;$('[data-pick="'+type+'"]',form).textContent=label(date(value));
  const other=type==='start'?'end':'start';
  if(type==='start'&&value>$('#endDate',form).value||type==='end'&&value<$('#startDate',form).value){
   $('#'+other+'Date',form).value=value;$('[data-pick="'+other+'"]',form).textContent=label(date(value));
  }
 };
 const minutes=t=>{const [hr,min]=t.split(':').map(Number);return hr*60+min};
 const setTime=(type,value)=>{
  const prev=$('#'+type+'Time',form).value,oldEnd=$('#endTime',form).value;
  $('#'+type+'Time',form).value=value;$('[data-pick="'+type+'Time"]',form).textContent=value;
  if(type==='start'){
   const duration=(minutes(oldEnd)-minutes(prev)+1440)%1440||60,next=(minutes(value)+duration)%1440;
   const text=String(Math.floor(next/60)).padStart(2,'0')+':'+String(next%60).padStart(2,'0');
   $('#endTime',form).value=text;$('[data-pick="endTime"]',form).textContent=text;
  }
 };
 $$('[data-pick]',form).forEach(b=>b.onclick=()=>{
  const type=b.dataset.pick;
  if(!type.endsWith('Time'))return makeDateGrid(b,$('#'+type+'Date',form).value,v=>setDate(type,v),icon,state.settings.start_of_week==='monday'?1:0);
  menu(b,Array.from({length:96},(_,i)=>{const t=String(Math.floor(i/4)).padStart(2,'0')+':'+String((i%4)*15).padStart(2,'0');return[t,()=>setTime(type.replace('Time',''),t)]}));
 });
 $('#addTime',form).onclick=()=>{
  state.timed=!state.timed;state.allDay=!state.timed;
  $('#timedFields',form).hidden=!state.timed;$('#addTime',form).classList.toggle('active',state.timed);
  $('#allDaySwitch',form).classList.toggle('on',state.allDay);$('#allDaySwitch',form).setAttribute('aria-checked',String(state.allDay));
 };
 $('#eventCalendarBtn',form).onclick=e=>menu(e.currentTarget,options.map(c=>[c.name,()=>{
  $('#calendarValue',form).value=c.id;$('#eventCalendarBtn',form).innerHTML='<i class="form-calendar-dot" style="background:'+colorFor(c)+'"></i> '+h(c.name)+' '+icon('chevron-down',16);
  $('#calSummary',form).textContent=c.name+' · Reminder: 15 minutes before';
 }]));
 $('#repeatButton',form).onclick=e=>menu(e.currentTarget,[['Does not repeat','never'],['Daily','daily'],['Weekly','weekly'],['Monthly','monthly'],['Yearly','yearly'],['Custom…','custom']].map(([label,freq])=>[label,()=>{
  if(freq==='custom')return openCustomRepeat(repeatRule,rule=>{repeatRule=rule;updateRepeat()});
  repeatRule={frequency:freq,interval:1,ends:'never'};updateRepeat();
 }]));
 $('#moreOptions',form).onclick=()=>{$('#extraFields',form).hidden=!$('#extraFields',form).hidden};
 $('#allDaySwitch',form).onclick=()=>{state.allDay=!state.allDay;$('#allDaySwitch',form).classList.toggle('on',state.allDay);$('#allDaySwitch',form).setAttribute('aria-checked',String(state.allDay));$('#timedFields',form).hidden=state.allDay||!state.timed};
 $('#reminderButton',form).onclick=e=>menu(e.currentTarget,[['None',null],['At start',0],['5 minutes',5],['15 minutes',15],['30 minutes',30],['1 hour',60],['1 day',1440]].map(([text,value])=>[text,()=>{$('#reminderValue',form).value=value??'';$('#reminderButton',form).textContent=text+' ▾';$('#calSummary',form).textContent=(options.find(c=>c.id===$('#calendarValue',form).value)?.name||'Calendar')+' · Reminder: '+(text==='None'?'None':text==='At start'?'At start':text+' before')}]));
 const field=$('#quickLocation',form),optionsEl=$('#addressOptions',form),saved=$('#addressSaved',form);
 let controller=null,cache=new Map(),active=-1;
 const choose=i=>{const item=state.addrResults[i];if(!item)return;selectedLocation=item;field.value=item.display;saved.hidden=false;saved.textContent='Full address saved: '+(item.address.toLowerCase()===item.display.toLowerCase()?item.display:item.address);optionsEl.hidden=true;field.focus()};
 const draw=()=>{active=-1;optionsEl.hidden=false;optionsEl.innerHTML=state.addrResults.length?state.addrResults.map((r,i)=>'<button type="button" data-address="'+i+'"><span>⌖</span><strong>'+h(r.display)+'</strong><small>'+h(r.address)+'</small></button>').join(''):'<div class="quiet">No matches — you can still use what you typed.</div>';$$('[data-address]',optionsEl).forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();choose(+b.dataset.address)}))};
 field.oninput=()=>{selectedLocation=null;saved.hidden=true;clearTimeout(addressTimer);controller?.abort();const q=field.value.trim();if(q.length<3){optionsEl.hidden=true;return}if(cache.has(q)){state.addrResults=cache.get(q);draw();return}addressTimer=setTimeout(async()=>{controller=new AbortController();try{optionsEl.hidden=false;optionsEl.innerHTML='<div class="quiet">Searching…</div>';const response=await fetch('https://photon.komoot.io/api/?lang=en&limit=5&q='+encodeURIComponent(q),{signal:controller.signal});const json=await response.json();state.addrResults=[...new Map((json.features||[]).slice(0,12).map(f=>{const p=f.properties||{},display=p.name||p.street||p.city||'Location',parts=[p.name||p.street,p.housenumber,p.city,p.state,p.country].filter(Boolean);const address=parts.filter((v,i)=>i===0||v!==parts[i-1]).join(', ');return[address.toLowerCase(),{display,address}]})).values()].slice(0,5);cache.set(q,state.addrResults);draw()}catch{optionsEl.hidden=true}},300)};
 field.onfocus=()=>{if(cache.has(field.value.trim())){state.addrResults=cache.get(field.value.trim());draw()}};
 field.onkeydown=e=>{if(optionsEl.hidden)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();active=(active+(e.key==='ArrowDown'?1:-1)+state.addrResults.length)%state.addrResults.length;$$('[data-address]',optionsEl).forEach((x,i)=>x.classList.toggle('highlight',i===active))}else if(e.key==='Enter'){e.preventDefault();e.stopPropagation();choose(active<0?0:active)}else if(e.key==='Escape'){optionsEl.hidden=true;e.stopPropagation()}else if(e.key==='Tab')optionsEl.hidden=true};
 upgradeIcons();
 $('#quickDelete',form)?.addEventListener('click',()=>confirmAction('Delete '+state.mode+'?','This cannot be undone.',async()=>{await safeChange(state.mode==='task'?'tasks':'events',existing.id,null,'delete');dlg.close()}));
 form.onsubmit=async e=>{
  e.preventDefault();if(!title.value.trim()){title.classList.add('shake','invalid');$('#titleError',form).hidden=false;title.focus();setTimeout(()=>title.classList.remove('shake'),300);return}
  const startD=$('#startDate',form).value,endD=$('#endDate',form).value;
  const startAt=new Date(startD+'T'+(state.timed&&!state.allDay?$('#startTime',form).value:'00:00')+':00');
  const endAt=new Date(endD+'T'+(state.timed&&!state.allDay?$('#endTime',form).value:'00:00')+':00');
  if(!state.timed||state.allDay)endAt.setDate(endAt.getDate()+1);
  if(endAt<=startAt){toast('End must be after start');return}
  const entity=state.mode==='task'?'tasks':'events',data=state.mode==='task'?{title:title.value.trim(),notes:$('#quickDescription',form).value,due_date:startD}:{calendar_id:$('#calendarValue',form).value,title:title.value.trim(),description:$('#quickDescription',form).value,location_name:field.value,location_address:selectedLocation?.address||'',starts_at:startAt.toISOString(),ends_at:endAt.toISOString(),all_day:state.allDay||!state.timed,repeat_rule:repeatRule,reminder_offset_minutes:$('#reminderValue',form).value?Number($('#reminderValue',form).value):null};
  try{loading($('#quickSave',form),true,'Saving…');await change(entity,existing?.id||null,data,existing?'update':'create');dlg.close();toast(state.mode==='task'?(existing?'Task updated':'Task saved'):(existing?'Event updated':'Event created'))}catch{loading($('#quickSave',form),false);toast("Couldn't save — check your connection")}
 };
};
startIcons();
if(!configured){root.innerHTML='<main class="center"><div class="login"><div class="mark">✳</div><h1>Backend not configured</h1><p>Build Daylight with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Accounts require the secure API; guest access is not available.</p></div></main>'}
else if(state.token)load();else login();
