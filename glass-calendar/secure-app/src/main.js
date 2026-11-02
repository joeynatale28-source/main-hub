import {localApi,localReset} from './local-store.js';
import {icon,upgradeIcons,startIcons} from './icons.js';
import {palette,paletteNames,colorFor,eventDate,expandEvents,prettyShort,prettyStamp,prettyClock,repeatLabel,greeting,makeDateGrid,daykey,uniqueInstances,rangeLabel} from './polish.js';
const root=document.querySelector('#root');
// UI-only workspace. No remote accounts, databases, API keys, or online session.

const $=(s,el=document)=>el.querySelector(s),$$=(s,el=document)=>[...el.querySelectorAll(s)];
const h=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const now=()=>new Date(),iso=d=>[d.getFullYear(),('0'+(d.getMonth()+1)).slice(-2),('0'+d.getDate()).slice(-2)].join('-');
const date=s=>new Date(s+'T12:00:00'),add=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const label=d=>d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
const emptyState=(heading,help,glyph='calendar')=>'<div class="ui-empty" role="status"><span class="ui-empty-icon">'+icon(glyph,22)+'</span><strong>'+h(heading)+'</strong><p>'+h(help)+'</p></div>';
const shimmer=()=>'<span class="ui-skeleton wide"></span><span class="ui-skeleton mid"></span><span class="ui-skeleton short"></span>';
let uiGridDirection=0,uiMiniDirection=0,uiPreviousView='',uiHasWaved=false,uiLastPage='';
const state={token:'',user:null,calendars:[],events:[],tasks:[],subscriptions:[],settings:{},page:'calendar',date:now(),view:'week',drilled:false,setting:localStorage.getItem('daylight-settings-section')||'general',collapsed:localStorage.getItem('daylight-rail-collapsed')==='1',edit:null,timed:false,allDay:false,mode:'event',locationAddress:'',addrResults:[],popover:null,taskFilter:'all',returnView:null,theme:'system'};
const toast=(message)=>{let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';document.body.append(el)}const label=String(message||'').replace(/\.$/,'');const bad=/couldn.t|error|fail|invalid|required|blocked|denied|not found|check your connection/i.test(label);el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.innerHTML='<span class="toast-icon">'+icon(bad?'alert-circle':'check-circle',16)+'</span><span class="toast-message">'+h(label)+'</span><button type="button" class="toast-dismiss" aria-label="Dismiss notification">'+icon('x',16)+'</button>';el.querySelector('.toast-dismiss').onclick=()=>{clearTimeout(toast.timer);el.classList.remove('show')};el.classList.remove('show');void el.offsetWidth;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),bad?6500:3200)};
async function api(action,data={}){return localApi(action,data)}
async function load(){
 try{
  const {user}=await api('auth_session');
  const [calendars,events,tasks,subscriptions,settings]=await Promise.all(['calendars','events','tasks','subscriptions','settings'].map(async entity=>(await api('data_list',{entity})).items));
  Object.assign(state,{user,calendars,events,tasks,subscriptions,settings:settings[0]||{},drilled:false,view:settings[0]?.default_view||'week'});
  applyTheme();render();
 }catch(error){
  console.error('Daylight local workspace could not start',error);
  root.innerHTML='<main class="center"><div class="login"><div class="mark">'+icon('brand',28)+'</div><h1>daylight.</h1><p>Local browser storage is unavailable. Enable site storage and reload.</p></div></main>';
 }
}
function applyTheme(){let t=state.settings.theme||'system';document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t;document.documentElement.dataset.reduceMotion=String(!!state.settings.reduce_motion);document.documentElement.dataset.compact=String(!!state.settings.compact_mode);document.querySelector('#themeButton')?.setAttribute('aria-label','Theme: '+(t==='dark'?'Midnight':t==='light'?'Daylight':'System'));document.querySelector('#themeButton')?.setAttribute('title','Theme: '+(t==='dark'?'Midnight':t==='light'?'Daylight':'System'));const button=$('#themeButton');if(button)button.innerHTML=icon(t==='dark'?'moon':t==='light'?'sun':'monitor',20)}
function resetLocalWorkspace(){
 confirmAction('Reset local preview?','This removes events, tasks, calendars and preferences stored in this browser. It does not affect anything online.',async()=>{localReset();state.date=now();state.page='calendar';await load();toast('Local workspace reset')});
}
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
function visible(){return state.events.filter(e=>state.calendars.some(c=>c.id===e.calendar_id&&c.is_visible===true)&&(!state.settings.show_declined_events?!['declined','cancelled'].includes(e.status):true))}
function occurrences(from=add(now(),-400),to=add(now(),450)){return expandEvents(visible(),from,to)}
const eventColor=e=>colorFor(state.calendars.find(c=>c.id===e.calendar_id));
const eventStyle=e=>'--event-color:'+(['declined','cancelled'].includes(e.status)?'#92929a':eventColor(e))+';';
const clockShort=value=>new Date(value).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true}).replace(/\\s?(AM|PM)$/,(match,p)=>p.toLowerCase());
const rangeShort=e=>clockShort(e.starts_at)+' - '+clockShort(e.ends_at);
const eventAttr=(e,extra='')=>' data-detail="'+h(e.id)+'" data-occ="'+h(e._occurrence||e.starts_at)+'" style="'+eventStyle(e)+extra+'"';
const eventOn=(e,key)=>eventDate(e)===key;
const getOccurrence=(id,when)=>occurrences(add(now(),-900),add(now(),1200)).find(e=>e.id===id&&(e._occurrence||e.starts_at)===when)||state.events.find(e=>e.id===id);
function loading(button,on,text='Working…'){if(!button)return;if(on){button.dataset.oldHtml=button.innerHTML;button.innerHTML='<span class="action-spinner"></span>'+h(text);button.disabled=true}else{button.innerHTML=button.dataset.oldHtml||button.innerHTML;button.disabled=false;upgradeIcons()}}
function nav(page,title,ico){return '<button class="nav '+(state.page===page?'selected':'')+'" title="'+h(title)+'" data-tooltip="'+h(title)+'" aria-label="'+h(title)+'" data-nav="'+page+'"><span class="glyph">'+icon(page==='calendar'?'calendar':page==='tasks'?'tasks':'plug')+'</span>'+title+'</button>'}
function bindRailTooltips(){
 document.querySelector('#railTooltip')?.remove();
 const hide=()=>document.querySelector('#railTooltip')?.remove();
 $$('.sidebar [data-tooltip]').forEach(el=>{
  el.addEventListener('mouseenter',()=>show(el));el.addEventListener('focus',()=>show(el));
  el.addEventListener('mouseleave',hide);el.addEventListener('blur',hide);
 });
 function show(el){
  hide();if(!state.collapsed)return;
  const r=el.getBoundingClientRect(),node=document.createElement('span');
  node.id='railTooltip';node.textContent=el.dataset.tooltip;document.body.append(node);
  node.style.left=Math.min(innerWidth-node.offsetWidth-8,r.right+9)+'px';
  node.style.top=Math.max(8,Math.min(innerHeight-node.offsetHeight-8,r.top+r.height/2-node.offsetHeight/2))+'px';
 }
}
function render(){if(!state.user)return;root.classList.toggle('collapsed',state.collapsed);root.innerHTML='<div class="shell"><aside class="sidebar"><div class="side-header"><button id="brand" class="brand" title="Calendar home" data-tooltip="Calendar home"><span class="logo">'+icon('brand',22)+'</span><span><strong>daylight.</strong><small>Personal calendar</small></span></button><button class="icon compact collapse-toggle" id="collapseRail" aria-label="'+(state.collapsed?'Expand':'Collapse')+' sidebar" title="'+(state.collapsed?'Expand':'Collapse')+' sidebar" data-tooltip="'+(state.collapsed?'Expand':'Collapse')+' sidebar">'+icon(state.collapsed?'panel-left-open':'panel-left-close',16)+'</button></div><div class="side-middle"><div id="mini"></div><div class="micro">WORKSPACE</div>'+nav('calendar','Calendar')+nav('integrations','Integrations')+nav('tasks','Tasks')+'<div class="micro">MY CALENDARS <button class="mini-add" id="newCalendar" aria-label="Add calendar">'+icon('plus',16)+'</button></div><div id="calList"></div></div><div class="side-support"><div class="micro">SUPPORT</div><button class="nav" id="settings" title="Settings" data-tooltip="Settings"><span class="glyph">'+icon('settings')+'</span>Settings</button><button class="nav" id="about" title="About" data-tooltip="About"><span class="glyph">'+icon('life-buoy')+'</span>Help & About</button></div><div class="profile"><span class="avatar">'+h(state.user.first_name?.slice(0,1))+'</span><span><strong>'+h(state.user.first_name)+' '+h(state.user.last_name)+'</strong><small>'+h('Saved on this device')+'</small></span><button class="icon" id="profileMenu" aria-label="Profile menu">'+icon('more-horizontal')+'</button></div></aside><main class="content" id="content"></main></div><div id="modalHost"></div><div id="toast"></div>';
 $('#brand').onclick=()=>{state.page='calendar';state.date=now();state.drilled=false;state.view=state.settings.default_view||'week';render()};
 $$('[data-nav]').forEach(x=>x.onclick=()=>{state.page=x.dataset.nav;render()});
 $('#settings').onclick=()=>settings();$('#about').onclick=()=>settings('about');$('#profileMenu').onclick=()=>menu($('#profileMenu'),[['Settings',()=>settings()],['Reset local workspace',resetLocalWorkspace,true]]);
 $('#collapseRail').onclick=()=>{state.collapsed=!state.collapsed;localStorage.setItem('daylight-rail-collapsed',state.collapsed?'1':'0');render()};
 $('#newCalendar').onclick=()=>calendarForm();
 renderMini();renderCalList();state.page==='calendar'?renderCalendar():state.page==='tasks'?renderTasks():renderIntegrations();if(uiLastPage!==state.page){$('#content')?.firstElementChild?.classList.add('ui-view-enter');uiLastPage=state.page}upgradeIcons();bindRailTooltips();
}
function renderMini(){
 const d=state.date,first=new Date(d.getFullYear(),d.getMonth(),1),shift=state.settings.start_of_week==='monday'?1:0,start=add(first,-((first.getDay()-shift+7)%7));
 const active=iso(now()),selected=iso(state.date),weekstart=add(state.date,-((state.date.getDay()-shift+7)%7)),weekend=add(weekstart,6),miniEvents=occurrences(add(start,-1),add(start,44));
 let html='<div class="mini-head"><strong>'+first.toLocaleDateString('en-US',{month:'long',year:'numeric'})+'</strong><span><button id="miniPrev" class="icon" aria-label="Previous mini-calendar month">'+icon('chevron-left',16)+'</button><button id="miniNext" class="icon" aria-label="Next mini-calendar month">'+icon('chevron-right',16)+'</button></span></div><div class="mini-grid">';
 for(let i=0;i<7;i++)html+='<span class="dayname" title="'+['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][(i+shift)%7]+'">'+['S','M','T','W','T','F','S'][(i+shift)%7]+'</span>';
 for(let i=0;i<42;i++){
  const day=add(start,i),key=iso(day),matches=miniEvents.filter(e=>eventOn(e,key));
  const calendarIds=[...new Set(matches.map(e=>e.calendar_id))],dots=calendarIds.slice(0,3).map(id=>'<i style="background:'+colorFor(state.calendars.find(c=>c.id===id))+'"></i>').join('')+(calendarIds.length>3?'<i class="overflow-dot"></i>':'');
  html+='<button class="mini-date '+(day.getMonth()!==first.getMonth()?'outside ':'')+(key===active?'today ':'')+(key===selected?'selected ':'')+(key>=iso(weekstart)&&key<=iso(weekend)?'selected-week ':'')+'" data-date="'+key+'" aria-label="'+h(label(day))+'">'+day.getDate()+(dots?'<span class="mini-dots">'+dots+'</span>':'')+'</button>';
 }
 $('#mini').innerHTML=html+'</div>';
 if(uiMiniDirection){$('#mini').classList.add(uiMiniDirection>0?'ui-mini-next':'ui-mini-prev');uiMiniDirection=0}
 upgradeIcons();
 $('#miniPrev').onclick=()=>{uiMiniDirection=-1;state.date=new Date(d.getFullYear(),d.getMonth()-1,1);renderMini()};
 $('#miniNext').onclick=()=>{uiMiniDirection=1;state.date=new Date(d.getFullYear(),d.getMonth()+1,1);renderMini()};
 $$('[data-date]',$('#mini')).forEach(x=>x.onclick=()=>drill(x.dataset.date));
}
function renderCalList(){
 const container=$('#calList');if(!container)return;
 container.innerHTML=state.calendars.length?state.calendars.map(c=>
  '<div class="cal-row '+(c.is_visible?'':'dim')+'" style="--event-color:'+colorFor(c)+'" data-cal="'+h(c.id)+'" title="'+h(c.name)+'" data-tooltip="'+h(c.name)+'"><button class="switch '+(c.is_visible?'on':'')+'" role="switch" aria-checked="'+!!c.is_visible+'" data-hide="'+h(c.id)+'" aria-label="'+(c.is_visible?'Hide ':'Show ')+h(c.name)+'"><span></span></button><i class="cal-dot"></i><span class="cal-name">'+h(c.name)+'</span><button class="icon compact" data-menu="'+h(c.id)+'" aria-label="Actions for '+h(c.name)+'" title="Actions for '+h(c.name)+'">'+icon('more-vertical',16)+'</button></div>'
 ).join(''):'<div class="ui-empty"><span class="ui-empty-icon">'+icon('calendar',20)+'</span><strong>No calendars yet</strong><p>Create a calendar to organize your events.</p><button class="cal-empty-add" type="button" id="emptyAddCalendar">'+icon('plus',16)+' Add calendar</button></div>';
 $('#emptyAddCalendar',container)?.addEventListener('click',()=>calendarForm());
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
    const saved=await api('data_create',{entity:'calendars',data:{name:cal.name,shade:Object.keys(palette).find(k=>palette[k]===colorFor(cal))||cal.shade,is_visible:cal.is_visible,sort_order:cal.sort_order}});
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
 const msg=greeting(first,now(),holidays),greetingMarkup=uiHasWaved?h(msg):h(msg).replace('👋','<span class="greeting-wave">👋</span>'),theme=state.settings.theme||'system',themeName=theme==='dark'?'Midnight':theme==='light'?'Daylight':'System';
 uiHasWaved=true;const returnChip=state.drilled&&state.returnView&&state.view==='day'?'<button id="backDrill" class="secondary">'+icon('arrow-left',16)+' Back to '+h(state.returnView[0].toUpperCase()+state.returnView.slice(1))+'</button>':'';
 const viewNames={month:'Month',week:'Week',day:'Day',agenda:'Agenda'};const shift=state.settings.start_of_week==='monday'?1:0;const weekStart=add(state.date,-((state.date.getDay()-shift+7)%7));const weekEnd=add(weekStart,6);const fmt=x=>x.toLocaleDateString('en-US',{month:'short',day:'numeric'});const range=state.view==='week'?fmt(weekStart)+' – '+fmt(weekEnd)+', '+weekEnd.getFullYear():state.view==='day'?state.date.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}):state.view==='agenda'?'Upcoming 12 months':state.date.toLocaleDateString('en-US',{month:'long',year:'numeric'});
  return '<header class="view-header"><div class="heading-copy"><div class="greeting">'+greetingMarkup+'</div><h1>'+h(viewNames[state.view]||title)+'</h1><p class="view-range">'+h(range)+'</p></div><div class="tools">'+returnChip+'<button class="icon" id="prev" aria-label="Previous period">'+icon('chevron-left')+'</button><button class="icon" id="next" aria-label="Next period">'+icon('chevron-right')+'</button><button class="secondary" id="today">Today</button><button class="icon" id="searchButton" aria-label="Search">'+icon('search')+'</button><button class="icon" id="themeButton" aria-label="Theme: '+themeName+'" title="Theme: '+themeName+'">'+icon(theme==='dark'?'moon':theme==='light'?'sun':'monitor')+'</button><button class="icon" id="settingsButton" aria-label="Settings">'+icon('settings')+'</button><button id="addEventHeader" class="primary local-header-add">'+icon('plus',18)+' Add Event</button></div></header>';
}
function exitDrill(){
 if(state.drilled){state.drilled=false;state.view=state.returnView||state.settings.default_view||'week';state.returnView=null;render();return true}return false;
}
function renderCalendar(){
 const d=state.date,title=state.view==='day'?label(d):d.toLocaleDateString('en-US',{month:'long',year:'numeric'});
 $('#content').innerHTML=header(title)+'<div id="searchBar" hidden><input id="searchQuery" aria-label="Search events" placeholder="Search all dates"><button id="searchClose" class="icon" aria-label="Close search">'+icon('x',16)+'</button><div class="micro">All dates</div><div id="searchResults"></div></div><section id="grid" class="calendar-grid"></section>';
 $('#backDrill')?.addEventListener('click',exitDrill);if(state.view==='agenda'){for(const id of ['prev','next','today'])$('#'+id).hidden=true}
 $('#today').onclick=()=>{state.date=now();render()};
 const move=n=>{uiGridDirection=n>0?1:-1;uiMiniDirection=n>0?1:-1;state.date=state.view==='month'?new Date(d.getFullYear(),d.getMonth()+n,1):add(d,n*(state.view==='week'?7:1));render()};
 $('#prev').onclick=()=>move(-1);$('#next').onclick=()=>move(1);
 $('#settingsButton').onclick=()=>settings();$('#addEventHeader').onclick=()=>openEditor();
 $('#themeButton').onclick=()=>{const modes=['dark','light','system'];saveSetting('theme',modes[(modes.indexOf(state.settings.theme)+1)%3]);};
 const searchBar=$('#searchBar');searchBar.setAttribute('role','dialog');searchBar.insertAdjacentHTML('beforeend','<small class="search-hint">Search by event name · ↑↓ to navigate · Enter to open · Esc to close</small>');searchBar.setAttribute('aria-label','Search all dates');
 $('#searchQuery').setAttribute('role','combobox');$('#searchQuery').setAttribute('aria-controls','searchResults');$('#searchQuery').setAttribute('aria-autocomplete','list');
 let activeResult=0;
 const closeSearch=()=>{searchBar.hidden=true;document.querySelector('#searchScrim')?.remove();$('#searchQuery').value='';$('#searchResults').innerHTML='';activeResult=0};
 const options=()=>$$('#searchResults [data-detail]');
 const markActive=()=>{const opts=options();opts.forEach((el,i)=>{el.classList.toggle('active',i===activeResult);el.setAttribute('aria-selected',String(i===activeResult))});$('#searchQuery').setAttribute('aria-activedescendant',opts[activeResult]?.id||'')};
 $('#searchButton').onclick=()=>{if(!searchBar.hidden){closeSearch();return}searchBar.hidden=false;const scrim=document.createElement('div');scrim.id='searchScrim';scrim.className='search-scrim';scrim.onclick=closeSearch;document.body.append(scrim);$('#searchQuery').focus()};
 $('#searchClose').onclick=closeSearch;
 $('#searchQuery').onkeydown=e=>{
  if(e.key==='Escape'){e.stopPropagation();closeSearch();$('#searchButton').focus();return}
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){const opts=options();if(!opts.length)return;e.preventDefault();activeResult=(activeResult+(e.key==='ArrowDown'?1:-1)+opts.length)%opts.length;markActive();opts[activeResult].scrollIntoView({block:'nearest'});return}
  if(e.key==='Enter'){const opts=options();if(!opts.length)return;e.preventDefault();const selected=opts[activeResult];closeSearch();selected.click()}
 };
 $('#searchQuery').oninput=e=>{
  const q=e.target.value.trim(),found=q?uniqueInstances(occurrences(add(now(),-700),add(now(),1095))).filter(x=>x.title.toLowerCase().includes(q.toLowerCase())).slice(0,40):[];
  const byMonth=new Map();for(const x of found){const key=new Date(x.starts_at).toLocaleDateString('en-US',{month:'long',year:'numeric'});if(!byMonth.has(key))byMonth.set(key,[]);byMonth.get(key).push(x)}
  const content=[...byMonth].map(([month,events])=>'<div class="search-group-title">'+h(month)+'</div>'+events.map(x=>'<button role="option" id="searchResult-'+h(x.id)+'-'+h(x._occurrence||x.starts_at).replace(/[^a-z0-9-]/gi,'')+'" '+eventAttr(x)+'><span class="search-result-icon">'+icon('calendar',16)+'</span><span class="search-result-copy"><strong>'+h(x.title)+'</strong><small>'+h(prettyShort(x._civilDate+'T12:00:00'))+'</small></span>'+icon('chevron-right',16)+'</button>').join('')).join('');
  $('#searchResults').setAttribute('role','listbox');$('#searchResults').innerHTML=q?(found.length?content:emptyState('No results yet',"No results for '"+q+"'.",'search')):'';
  activeResult=0;markActive();bindEventButtons();
  options().forEach((item,i)=>item.onmouseenter=()=>{activeResult=i;markActive()});
 };
 if(state.view==='month')renderMonth();else if(state.view==='agenda')renderAgenda();else renderWeek();
 if(uiGridDirection){$('#grid')?.classList.add(uiGridDirection>0?'ui-page-next':'ui-page-prev');uiGridDirection=0}else if(uiPreviousView!==state.view){$('#grid')?.classList.add('ui-view-enter')}uiPreviousView=state.view;
 $$('#grid .month-span-bar,#grid .all-day-span,#grid .eventchip').slice(0,8).forEach((el,i)=>el.style.setProperty('--chip-index',i));
 upgradeIcons();
}
function isLong(e){return e._segments>1||new Date(e.ends_at).getTime()-new Date(e.starts_at).getTime()>86400000||daykey(new Date(e.starts_at))!==daykey(new Date(new Date(e.ends_at).getTime()-1))}
function spansFor(segments,days){
 const first=iso(days[0]),last=iso(days.at(-1)),instances=uniqueInstances(segments);
 return instances.map(e=>{
  const source=segments.filter(x=>x.id===e.id&&x._occurrence===e._occurrence).map(x=>x._civilDate).sort();
  if(!source.length)return null;
  const from=source.find(x=>x>=first)||source[0],to=source.filter(x=>x<=last).at(-1)||source.at(-1);
  const lo=Math.max(0,days.findIndex(x=>iso(x)===from)),hi=Math.max(lo,days.findIndex(x=>iso(x)===to));
  return {...e,_left:lo,_right:hi,_continuationLeft:e._segment>0,_continuationRight:(e._segment||0)+source.length<e._segments};
 }).filter(Boolean);
}
function renderMonth(){
 const d=state.date,first=new Date(d.getFullYear(),d.getMonth(),1),shift=state.settings.start_of_week==='monday'?1:0,start=add(first,-((first.getDay()-shift+7)%7)),count=Math.ceil(((first.getDay()-shift+7)%7+new Date(d.getFullYear(),d.getMonth()+1,0).getDate())/7)*7;
 const items=occurrences(add(start,-1),add(start,count+1));
 let html='<div class="weekdays">'+Array.from({length:7},(_,i)=>'<span>'+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][(i+shift)%7]+'</span>').join('')+'</div><div class="monthcells '+(state.settings.show_week_numbers?'numbered':'')+'" style="--weeks:'+count/7+'">';
 for(let i=0;i<count;i++){
  const t=add(start,i),key=iso(t);html+='<div class="monthcell '+(t.getMonth()!==d.getMonth()?'outside ':'')+([0,6].includes(t.getDay())?'weekend':'')+'" data-cell="'+key+'" style="grid-column:'+(i%7+1)+';grid-row:'+(Math.floor(i/7)+1)+'">';
  if(state.settings.show_week_numbers&&i%7===0)html+='<span class="weeknum">W'+isoWeek(t)+'</span>';
  html+='<button class="datenum '+(key===iso(now())?'today ':'')+(key===iso(state.date)?'selected':'')+'" data-drill="'+key+'">'+t.getDate()+'</button><button class="cellplus" data-add="'+key+'" aria-label="Add on '+key+'">'+icon('plus',16)+'</button></div>';
 }
 for(let week=0;week<count/7;week++){
  const days=Array.from({length:7},(_,i)=>add(start,week*7+i));
  const spans=spansFor(items.filter(e=>days.some(d=>eventOn(e,iso(d)))),days);
  const lanes=[];
  for(const e of spans){
   let lane=0;while(lanes[lane]?.some(([a,b])=>a<=e._right&&e._left<=b))lane++;
   if(lane>=3)continue;
   (lanes[lane]??=[]).push([e._left,e._right]);
   html+='<button class="month-span-bar '+(e._continuationLeft?'continue-left ':'')+(e._continuationRight?'continue-right ':'')+'" '+eventAttr(e,'--week-row:'+(week+1)+';--span-col:'+(e._left+1)+';--span-length:'+(e._right-e._left+1)+';--span-lane:'+lane+';')+' data-drag-event="'+h(e.id)+'" title="'+h(e.title)+'">'+(e._continuationLeft?'':h(e.title))+'</button>';
  }
  for(let i=0;i<7;i++){
   const day=iso(days[i]),extra=items.filter(e=>eventOn(e,day)).length-3;
   if(extra>0)html+='<button class="month-more" data-drill="'+day+'" style="--week-row:'+(week+1)+';--span-col:'+(i+1)+'">+'+extra+' more</button>';
  }
 }
 $('#grid').innerHTML=html+'</div>';bindEventButtons();enableCalendarDrag();
}
function renderWeek(){
 const d=state.date,shift=state.settings.start_of_week==='monday'?1:0,start=state.view==='day'?d:add(d,-((d.getDay()-shift+7)%7)),days=Array.from({length:state.view==='day'?1:7},(_,i)=>add(start,i)),events=occurrences(add(start,-1),add(start,days.length+1));
 let html='<div class="weekwrapper"><div class="weekhead" style="--cols:'+days.length+'"><div>'+(Intl.DateTimeFormat('en-US',{timeZoneName:'short'}).formatToParts(now()).find(p=>p.type==='timeZoneName')?.value||'Local')+'</div>'+days.map(t=>'<div class="'+(iso(t)===iso(now())?'is-today':'')+'"><small>'+t.toLocaleDateString('en-US',{weekday:'short'})+'</small><button class="'+(iso(t)===iso(now())?'today':'')+'" data-drill="'+iso(t)+'">'+t.getDate()+'</button><button data-add="'+iso(t)+'" aria-label="Add event">'+icon('plus',16)+'</button></div>').join('')+'</div>';
 const all=spansFor(events.filter(e=>(e.all_day||isLong(e))&&days.some(d=>eventOn(e,iso(d)))),days);
 html+='<div class="all-day-strip" style="--cols:'+days.length+'"><span>all day</span><div class="day-spans">';
 for(const e of all)html+='<button class="all-day-span '+(e._continuationLeft?'continue-left ':'')+(e._continuationRight?'continue-right ':'')+'" '+eventAttr(e,'--span-col:'+(e._left+1)+';--span-length:'+(e._right-e._left+1)+';')+' data-drag-event="'+h(e.id)+'" >'+h(e.title)+'</button>';
 html+='</div></div><div class="weekbody" style="--cols:'+days.length+'"><div class="hours">'+Array.from({length:24},(_,i)=>'<span style="top:'+(i*48)+'px">'+(i%12||12)+' '+(i<12?'AM':'PM')+'</span>').join('')+'</div>';
 for(const t of days){
  const key=iso(t);html+='<div class="daytrack '+([0,6].includes(t.getDay())?'weekend':'')+'" data-slot="'+key+'">';
  for(const e of events.filter(x=>!x.all_day&&!isLong(x)&&eventOn(x,key))){
   const st=new Date(e.starts_at),ed=new Date(e.ends_at),minute=e._segment?0:st.getHours()*60+st.getMinutes(),height=Math.max(25,Math.min(1440-minute,(ed-st)/60000));
   html+='<button class="weekevent" '+eventAttr(e,'top:'+(minute*.8)+'px;height:'+(height*.8)+'px;')+' data-drag-event="'+h(e.id)+'"><strong>'+h(e.title)+'</strong><small class="local-event-time">'+h(rangeShort(e))+'</small>'+(height>=90&&(e.location_name||e.location_address)?'<small class="local-event-location">'+h(e.location_name||e.location_address)+'</small>':'')+'<span class="resize-edge top" data-resize="start"></span><span class="resize-edge bottom" data-resize="end"></span></button>';
  }html+='</div>';
 }
 $('#grid').innerHTML=html+'</div></div>';
 const current=now(),minutesNow=current.getHours()*60+current.getMinutes();
 const todayTrack=$('[data-slot="'+iso(current)+'"]',$('#grid'));
 if(todayTrack){const line=document.createElement('div');line.className='now-line';line.setAttribute('aria-label','Current time');line.style.top=(minutesNow*.8)+'px';$('.weekbody',$('#grid')).append(line);const dot=document.createElement('div');dot.className='now-gutter-dot';dot.style.top=(minutesNow*.8)+'px';$('.hours',$('#grid')).append(dot)}
 if(state.view==='day'&&!events.some(e=>eventOn(e,iso(d)))){const empty=document.createElement('div');empty.className='day-view-empty';empty.innerHTML=emptyState('No events yet','Create an event to plan this day.','calendar');$('.weekbody',$('#grid')).append(empty)}
 bindEventButtons();enableCalendarDrag();
 $$('[data-slot]').forEach(el=>el.onclick=e=>{if(e.target.closest('button'))return;const m=Math.max(0,Math.min(1425,Math.floor(((e.clientY-el.getBoundingClientRect().top)/.8)/15)*15));openEditor(null,el.dataset.slot,String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'))});
}
function renderAgenda(){
 const today=iso(now()),items=uniqueInstances(occurrences(add(now(),-1),add(now(),370))).filter(x=>eventDate(x)>=today||x._lastCivil>=today);
 const days=[...new Set(items.map(x=>x._firstCivil))];
 $('#grid').innerHTML='<div class="agenda">'+(days.length?days.map(d=>'<div class="agenda-group"><button class="agenda-date" data-drill="'+d+'">'+h(label(date(d)))+'</button>'+items.filter(x=>x._firstCivil===d).map(x=>'<button class="agenda-item" '+eventAttr(x)+'><span class="agenda-title"><i class="event-dot"></i><span class="local-agenda-copy"><strong>'+h(x.title)+'</strong>'+(x.location_name||x.location_address?'<small>'+h(x.location_name||x.location_address)+'</small>':'')+'</span></span><small>'+(isLong(x)?h(rangeLabel(x)):x.all_day?'All day':h(rangeShort(x)))+'</small></button>').join('')+'</div>').join('') :emptyState('No upcoming events yet','Create an event to see it in your agenda.','calendar'))+'</div>';bindEventButtons();
}
function bindEventButtons(){
 $$('[data-drill]').forEach(x=>x.onclick=e=>{e.stopPropagation();drill(x.dataset.drill)});
 $$('[data-add]').forEach(x=>x.onclick=e=>{e.stopPropagation();openEditor(null,x.dataset.add)});
 $$('[data-cell]').forEach(x=>x.onclick=e=>{if(!e.target.closest('button'))openEditor(null,x.dataset.cell)});
 $$('[data-detail]').forEach(x=>{x.onclick=e=>{e.stopPropagation();const ev=getOccurrence(x.dataset.detail,x.dataset.occ);if(ev)details(ev)};x.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();const ev=getOccurrence(x.dataset.detail,x.dataset.occ);if(!ev)return;const readOnly=state.subscriptions.some(sub=>sub.calendar_id===ev.calendar_id);menu(x,[['View details',()=>details(ev)],...(!readOnly?[['Edit event',()=>openEditor(ev._origin||ev,null,null,'event',ev)],['Delete event',()=>changeOccurrence(ev,'delete'),true]]:[])]);}});
}
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape')return;
 if(document.querySelector('#calendarDatePicker')){document.querySelector('#calendarDatePicker').remove();e.preventDefault();e.stopImmediatePropagation();return}
 if(document.querySelector('dialog[open]'))return;
 if(document.querySelector('#searchBar:not([hidden])')){$('#searchClose')?.click();e.preventDefault();return}
 if(state.drilled){exitDrill();e.preventDefault()}
});

function modal(html,wide=false){
 const dlg=document.createElement('dialog');dlg.className='dialog '+(wide?'wide':'');dlg.setAttribute('aria-modal','true');
 dlg.innerHTML='<div class="dialog-body">'+html+'</div><button type="button" class="dialog-close icon" data-close aria-label="Close dialog">'+icon('x',16)+'</button>';
 document.body.append(dlg);dlg.showModal();
 $$('[data-close]',dlg).forEach(b=>b.onclick=()=>dlg.close());
 dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
 dlg.addEventListener('close',()=>dlg.remove());
 return dlg;
}
function confirmAction(title,body,act){const dlg=modal('<div class="warning-circle">'+icon('warning')+'</div><h2>'+h(title)+'</h2><p>'+h(body)+'</p><footer class="footer-actions"><button class="secondary" data-close>Cancel</button><button id="confirmYes" class="danger">'+(title.toLowerCase().startsWith('discard')?'Discard':'Confirm')+'</button></footer>');dlg.classList.add('alert-dialog');$('#confirmYes',dlg).onclick=async()=>{dlg.close();await act()}}
function promptForm(title,placeholder,cb,value=''){
 const dlg=modal('<h2>'+h(title)+'</h2><input class="text-input" id="promptValue" placeholder="'+h(placeholder)+'" value="'+h(value)+'" maxlength="120"><footer class="footer-actions"><button class="secondary" data-close>Cancel</button><button class="primary" id="promptSave">Save</button></footer>');
 const field=$('#promptValue',dlg);field.focus();field.select();
 const save=async()=>{if(!field.value.trim())return field.classList.add('shake');const val=field.value.trim();dlg.close();await cb(val)};
 $('#promptSave',dlg).onclick=save;field.onkeydown=e=>{if(e.key==='Enter')save()};
}
function menu(button,items,filterable=false){
 $('#floatingMenu')?.remove();
 const el=document.createElement('div');el.id='floatingMenu';el.className='floating-menu';el.setAttribute('role','menu');el.setAttribute('aria-label','Options');
 const search=filterable?'<div class="menu-search"><span>'+icon('search',16)+'</span><input aria-label="Search time zones" placeholder="Search time zones..." type="search"></div>':'';
 const selectedText=(button.querySelector('.select-value')?.textContent||button.textContent||'').trim().replace(/\s+/g,' ');
 el.innerHTML=search+'<div class="menu-options">'+items.map((x,i)=>{const current=selectedText===String(x[0]).trim();return '<button type="button" role="menuitem" '+(current?'aria-current="true" ':'')+'class="'+(x[2]?'danger-text':'')+'" data-item="'+i+'">'+h(x[0])+(current?'<span class="menu-current-check">'+icon('check',16)+'</span>':'')+'</button>'}).join('')+'</div>';
 (button.closest('dialog[open]')||document.body).append(el);
 const rect=button.getBoundingClientRect(),inSidebar=!!button.closest('#calList'),dialogRect=button.closest('dialog[open]')?.getBoundingClientRect(),minX=dialogRect?dialogRect.left+8:6,maxX=dialogRect?dialogRect.right-8:innerWidth-6,width=Math.min(Math.max(220,rect.width),maxX-minX,innerWidth-12);
 el.style.width=width+'px';
 const availableBelow=(dialogRect?Math.min(innerHeight-12,dialogRect.bottom-8):innerHeight-12)-rect.bottom,needed=Math.min(filterable?390:285,items.length*38+20);
 const top=availableBelow>=Math.min(needed,185)?rect.bottom+5:Math.max(dialogRect?dialogRect.top+8:7,rect.top-Math.min(needed,innerHeight-18)-5);
 el.style.top=top+'px';
 const x=inSidebar?rect.right+7:rect.left;
 el.style.left=Math.max(minX,Math.min(maxX-width,x))+'px';
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
  if(e.key==='Home'||e.key==='End'){const buttons=$$('[data-item]:not([hidden])',el);if(buttons.length){e.preventDefault();buttons[e.key==='Home'?0:buttons.length-1].focus()}return}
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
   const buttons=$$('[data-item]:not([hidden])',el);if(!buttons.length)return;
   e.preventDefault();const i=buttons.indexOf(document.activeElement);
   buttons[(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();
  }
 };
 upgradeIcons();if(!filterable)(el.querySelector('[data-item][aria-current=true]')||el.querySelector('[data-item]'))?.focus();
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
   if(!result?.item)throw Error('Local data was not saved');
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
 calendar:[['show_week_numbers','Show week numbers','Show ISO week numbers in the calendar'],['show_declined_events','Show declined events','Display declined or cancelled events greyed out']],
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
function switchHtml(key,value){const dis=['task_reminders','event_reminders','notification_sound'].includes(key)&&!(typeof Notification!=='undefined'&&Notification.permission==='granted');return '<button role="switch" aria-checked="'+!!value+'" class="switch '+(value?'on':'')+'" data-setting-switch="'+key+'" '+(dis?'disabled title="Enable browser notifications first"':'')+'><span></span></button>'}
function customSelect(name,current,items){const text=items.find(x=>String(x[0])===String(current))?.[1]||items[0]?.[1]||'Choose';return '<button class="pill-select" data-select="'+name+'" title="'+h(text)+'"><span class="select-value">'+h(text)+'</span>'+icon('chevron-down',16)+'</button>'}
function themeCards(){return '<div class="theme-cards">'+['dark','light','system'].map(theme=>'<button class="theme-card '+(state.settings.theme===theme?'picked':'')+'" data-theme="'+theme+'"><span class="theme-mini '+theme+'"><i></i><b></b><em></em><strong></strong><u></u></span><span>'+h(theme==='dark'?'Midnight':theme==='light'?'Daylight':'System')+'</span>'+(state.settings.theme===theme?'<span class="theme-check">'+icon('check',16)+'</span>':'')+'</button>').join('')+'</div>'}
function settingsContent(which){
 const s=state.settings,u=state.user,all=switches[which],switchRows=all?all.map(([id,title,help])=>row(title,help,switchHtml(id,s[id]))).join(''):'';
 if(which==='general')return '<h2>General</h2><p>Personal preferences, saved only in this browser.</p>'+row('Storage','This device only','<span class="local-status">'+icon('hard-drive',16)+' Local preview</span>')+row('First name','Used in your greeting','<input class="small-input" id="firstName" value="'+h(u.first_name)+'">')+row('Last name','Shown in your profile','<input class="small-input" id="lastName" value="'+h(u.last_name)+'">')+row('Time zone','Defaults to your device',customSelect('time_zone',s.time_zone||'auto',selectOptions.time_zone))+row('Start of week','First calendar weekday',customSelect('start_of_week',s.start_of_week,selectOptions.start_of_week));
 if(which==='calendar')return '<h2>Calendar</h2><p>Plan how your calendar is displayed.</p>'+row('Default Calendar View','View when Daylight opens',customSelect('default_view',s.default_view,selectOptions.default_view))+switchRows+row('Work hours','Beginning and end of the workday','<span class="worktime"><button class="pill-select" data-time="work_hours_start">'+h(readableTime(s.work_hours_start||'09:00'))+'</button> – <button class="pill-select" data-time="work_hours_end">'+h(readableTime(s.work_hours_end||'17:00'))+'</button></span>');
 if(which==='appearance')return '<h2>Appearance</h2><p>Make Daylight feel like yours.</p>'+themeCards()+switchRows;
 if(which==='data')return '<h2>Local data</h2><p>All calendars, events, tasks and settings are stored in this browser only. No accounts or online database.</p>'+row('Storage','Local to this device','<span class="local-status">'+icon('hard-drive',16)+' Saved locally</span>')+row('Calendars',state.calendars.length+' local calendars','<button class="secondary" id="goIntegrations">View workspace</button>')+row('Reset preview','Remove this browser\'s edited and sample data','<button class="secondary" id="resetLocalData">Reset local data</button>')+'<p class="quiet">Clearing site storage will erase this preview. Nothing syncs between browsers.</p>';

if(which==='notifications')return '<h2>Notifications</h2><p>Control browser notifications.</p>'+row('Permission',(typeof Notification!=='undefined'&&Notification.permission==='granted')?'Notifications are enabled':'Permission is required','<button class="secondary" id="enableNotify">'+(typeof Notification!=='undefined'&&Notification.permission==='granted'?'Enabled':'Enable notifications')+'</button>')+(typeof Notification!=='undefined'&&Notification.permission==='denied'?'<p class="notification-error">Notifications are blocked. Allow them in your browser site settings.</p>':'')+switchRows+row('Default reminder','Used for new events',customSelect('default_reminder_minutes',s.default_reminder_minutes,selectOptions.default_reminder_minutes));
 // Server-backed AI access is intentionally absent from this local-only preview.
return '<div class="about-layout"><h2>About daylight.</h2><div class="about-head"><span class="about-mark">'+icon('brand',26)+'</span><div><strong>daylight.</strong><small>Local UI preview · Personal calendar</small><p>Carefully designed time, beautifully organized.</p></div></div><section class="about-history" aria-label="Changelog"><h3>Version 2.2 — Refined experience</h3><ul><li>Connected multi-day calendar bars and clearer event details</li><li>Updated desktop controls, menus and accessible dialogs</li><li>Polished Midnight and Daylight themes</li></ul><h3>Version 2.1 — Calendar tools</h3><ul><li>Month grid date picker and recurring event controls</li><li>Per-calendar colors, personal greetings and Tasks filters</li></ul><h3>Version 2.0 — Daylight foundation</h3><ul><li>Calendar visibility, inline renaming and fixed Settings</li><li>Browser-only editable calendar and task preview</li></ul></section><div class="about-legal">'+row('Privacy Policy','How Daylight handles your data','<button class="secondary" data-legal="privacy">Read '+icon('chevron-right',16)+'</button>')+row('Terms of Service','Using Daylight','<button class="secondary" data-legal="terms">Read '+icon('chevron-right',16)+'</button>')+'</div></div>';
}
function settings(which){
 state.setting=which||localStorage.getItem('daylight-settings-section')||'general';if(state.setting==='ai')state.setting='general';localStorage.setItem('daylight-settings-section',state.setting);
 const existing=$('#settingsModal');existing?.remove();
 const sections=[['general','General','settings'],['calendar','Calendar','calendar'],['appearance','Appearance','palette'],['data','Local data','hard-drive'],['notifications','Notifications','bell'],['about','About','info']];
 const dlg=modal('<div class="settings-grid"><nav class="settings-nav"><h2>Settings</h2>'+sections.map(x=>'<button data-sec="'+x[0]+'" class="'+(x[0]===state.setting?'selected':'')+'" ><span class="glyph">'+icon(x[2],18)+'</span>'+x[1]+'</button>').join('')+'</nav><div class="settings-pane" id="settingsPane"></div></div>',true);dlg.id='settingsModal';dlg.addEventListener('close',()=>{if(state.page==='calendar'&&state.user){renderCalendar();renderMini()}});
 $$('[data-sec]',dlg).forEach(b=>b.onclick=()=>{state.setting=b.dataset.sec;localStorage.setItem('daylight-settings-section',state.setting);$$('[data-sec]',dlg).forEach(x=>x.classList.toggle('selected',x===b));renderSettings()});
 renderSettings();
}
function renderSettings(){
 const dlg=$('#settingsModal');if(!dlg)return;const pane=$('#settingsPane',dlg);pane.innerHTML=settingsContent(state.setting);
 pane.scrollTop=0;
 $$('[data-setting-switch]',pane).forEach(b=>b.onclick=()=>{const key=b.dataset.settingSwitch;if(key==='preview'){const on=b.getAttribute('aria-checked')!=='true';b.classList.toggle('on',on);b.setAttribute('aria-checked',String(on));return}if(key==='holidays'){const c=state.calendars.find(x=>x.client_id==='us-holidays');if(c)safeChange('calendars',c.id,{is_visible:!c.is_visible},'update');return}saveSetting(key,!state.settings[key])});
 $$('[data-select]',pane).forEach(b=>b.onclick=()=>{const name=b.dataset.select;menu(b,selectOptions[name].map(x=>[x[1],()=>saveSetting(name,name==='default_reminder_minutes'?Number(x[0]):x[0])]),name==='time_zone')});
 $$('[data-time]',pane).forEach(b=>b.onclick=()=>{const name=b.dataset.time;menu(b,Array.from({length:96},(_,i)=>{const time=String(Math.floor(i/4)).padStart(2,'0')+':'+String((i%4)*15).padStart(2,'0');return[readableTime(time),()=>saveSetting(name,time)]}))});
 $$('[data-theme]',pane).forEach(b=>b.onclick=()=>saveSetting('theme',b.dataset.theme));
 
 for(const id of ['firstName','lastName']){const input=$('#'+id,pane);if(input){input.onblur=()=>{const first=$('#firstName',pane).value,last=$('#lastName',pane).value;if(!first.trim())return;api('user_update',{first_name:first,last_name:last}).then(x=>{state.user=x.user;const profile=$('.profile');if(profile){$('strong',profile).textContent=state.user.first_name+' '+state.user.last_name;$('.avatar',profile).textContent=state.user.first_name[0]||'?'}const greeter=$('.greeting');if(greeter)greeter.textContent=greeting(state.user.first_name);toast('Saved')}).catch(()=>toast("Couldn't save — check your connection"))};input.onkeydown=e=>{if(e.key==='Enter')input.blur()}}}
 $('#goIntegrations',pane)?.addEventListener('click',()=>{$('#settingsModal').close();state.page='integrations';render()});
 $('#enableNotify',pane)?.addEventListener('click',async()=>{if(typeof Notification!=='undefined'){try{state.notification=await Notification.requestPermission()}catch{state.notification='denied'}renderSettings()}else toast('Notifications are unavailable in this browser')});
 $('#resetLocalData',pane)?.addEventListener('click',resetLocalWorkspace);
 upgradeIcons();

$$('[data-legal]',pane).forEach(b=>b.onclick=()=>legal(b.dataset.legal));
 $('#goIntegrations',pane)?.addEventListener('click',()=>{$('#settingsModal')?.close();state.page='integrations';render()});

}
function legal(id){
 const text={
  privacy:'Daylight saves its example calendars, events, tasks and preferences in this browser’s local storage. There is no account, server database, sync or external data collection in the design preview. Clearing browser storage removes local data.',
  terms:'Daylight is a local UI preview. Changes remain on this device and are not backed up or synchronized. Online integrations are disabled.'
 };
 const title=id==='privacy'?'Privacy Policy':'Terms of Use';
 modal('<h2>'+title+'</h2><p>'+h(text[id]||'Local preview only.')+'</p><div class="footer-actions"><button class="primary" data-close>Done</button></div>');
}

function renderTasks(){
 const counts={all:state.tasks.length,todo:state.tasks.filter(t=>!t.completed).length,completed:state.tasks.filter(t=>t.completed).length};
 const choices=[['all','All'],['todo','To do'],['completed','Completed']];
 const filtered=state.tasks.filter(t=>state.taskFilter==='all'||(state.taskFilter==='completed'?t.completed:!t.completed));
 $('#content').innerHTML='<div class="list-page tasks-view"><header class="view-header"><div><h1>Tasks</h1><p>Stay on top of what matters.</p></div><button class="primary" id="newTask">'+icon('plus')+' New task</button></header><div class="task-filters">'+choices.map(([key,label])=>'<button data-task-filter="'+key+'" class="'+(key===state.taskFilter?'selected':'')+'">'+label+' <span>'+counts[key]+'</span></button>').join('')+'</div><div class="task-list">'+(filtered.length?filtered.map(t=>'<div class="task-row"><button data-done="'+t.id+'" role="checkbox" aria-checked="'+t.completed+'" class="check '+(t.completed?'checked':'')+'">'+(t.completed?icon('check',16):'')+'</button><button data-task="'+t.id+'" class="task-title '+(t.completed?'done':'')+'"><strong>'+h(t.title)+'</strong><small>'+h(t.due_date?prettyShort(t.due_date+'T12:00:00'):'No due date')+'</small></button></div>').join('') :emptyState(state.taskFilter==='all'?'No tasks yet':state.taskFilter==='todo'?'No tasks to do yet':'No completed tasks yet',state.taskFilter==='all'?'Add a task to start organizing your to-dos.':state.taskFilter==='todo'?'Everything is currently checked off.':'Completed tasks will appear here.','tasks'))+'</div></div>';
 $('#newTask').onclick=()=>openEditor(null,null,null,'task');
 $$('[data-task-filter]').forEach(b=>b.onclick=()=>{state.taskFilter=b.dataset.taskFilter;renderTasks();upgradeIcons()});
 $$('[data-done]').forEach(b=>b.onclick=()=>{const t=state.tasks.find(t=>t.id===b.dataset.done);safeChange('tasks',t.id,{completed:!t.completed},'update')});
 $$('[data-task]').forEach(b=>b.onclick=()=>{const t=state.tasks.find(t=>t.id===b.dataset.task);openEditor(t,null,null,'task')});
}
function renderIntegrations(){
 $('#content').innerHTML='<div class="list-page"><header class="view-header"><div><h1>Integrations</h1><p>Design preview · Online connections are disabled.</p></div><button class="secondary" id="connect">'+icon('info',16)+' About integrations</button></header>'+(state.subscriptions.length?'':emptyState('No integrations yet','Online connections are not active in this local preview.','plug'))+'<div class="integration-grid">'+[['Google Calendar','Use a published iCalendar URL. Private account sync is not connected.'],['Outlook','Export or publish an iCalendar feed from Outlook.'],['Apple Calendar','Share a read-only calendar URL from iCloud.'],['CalDAV','Authenticated two-way CalDAV is not available.']].map(x=>'<div class="integration-card"><h3>'+h(x[0])+'</h3><p>'+h(x[1])+'</p><button class="secondary" data-help="'+h(x[0])+'">Learn more '+icon('external-link',16)+'</button></div>').join('')+'</div></div>';
 $('#connect').onclick=()=>modal('<h2>Integrations preview</h2><p>Online subscriptions and service connections are not enabled in this browser-only UI. Calendars and tasks remain editable locally.</p><button class="primary" data-close>Done</button>');$$('[data-help]').forEach(x=>x.onclick=()=>modal('<h2>'+h(x.dataset.help)+'</h2><p>'+(x.dataset.help==='CalDAV'?'Two-way CalDAV sync is not available yet.':'Direct '+h(x.dataset.help)+' account sync is not available yet. Online syncing is disabled while developing this local interface.')+'</p><button class="primary" data-close>Done</button>'));
}
const nativeRecurring=e=>!e.source_subscription_id&&['daily','weekly','monthly','yearly'].includes(e.repeat_rule?.frequency||e.repeat_rule?.freq);
function chooseOccurrence(e,action){
 return new Promise(resolve=>{
  if(!nativeRecurring(e)){resolve('all');return}
  const dlg=modal('<h2>'+h(action)+' recurring event</h2><p>Choose which events this change affects.</p><div class="scope-options"><button type="button" data-scope="only">Only this event</button><button type="button" data-scope="following">This and following events</button><button type="button" data-scope="all">All events</button></div><div class="footer-actions"><button class="secondary" data-close>Cancel</button></div>');
  let finished=false;const finish=value=>{if(finished)return;finished=true;dlg.close();resolve(value)};
  $$('[data-scope]',dlg).forEach(b=>b.onclick=()=>finish(b.dataset.scope));
  dlg.addEventListener('close',()=>{if(!finished){finished=true;resolve(null)}});
 });
}
const occurrenceDate=e=>daykey(new Date(e._occurrence||e.starts_at));
async function changeOccurrence(e,action,data={}){
 const origin=e._origin||e,scope=await chooseOccurrence(e,action);if(!scope)return false;
 const when=occurrenceDate(e),r={...(origin.repeat_rule||{})};
 if(scope==='all'){
  if(action==='delete')await change('events',origin.id,null,'delete');
  else {
   const occurrenceStart=new Date(e.starts_at).getTime(),baseStart=new Date(origin.starts_at).getTime();
   const adjusted={...data};
   if(adjusted.starts_at){const delta=Date.parse(adjusted.starts_at)-occurrenceStart;adjusted.starts_at=new Date(baseStart+delta).toISOString();if(adjusted.ends_at)adjusted.ends_at=new Date(Date.parse(origin.ends_at)+delta).toISOString()}
   await change('events',origin.id,adjusted,'update');
  }
 }else if(scope==='only'){
  await change('events',origin.id,{exdates:[...new Set([...(origin.exdates||[]),when])]},'update');
  if(action==='update')await change('events',null,{...Object.fromEntries(['calendar_id','title','description','location_name','location_address','all_day','reminder_offset_minutes','status'].map(k=>[k,origin[k]])),starts_at:e.starts_at,ends_at:e.ends_at,recurrence_parent_id:origin.id,...data,repeat_rule:{frequency:'never'}},'create');
 }else{
  const yesterday=daykey(new Date(new Date(e._occurrence||e.starts_at).getTime()-86400000));
  await change('events',origin.id,{repeat_rule:{...r,ends:'on',until:yesterday}},'update');
  if(action==='update'){
   const originalCopy=Object.fromEntries(['calendar_id','title','description','location_name','location_address','all_day','reminder_offset_minutes','status'].map(k=>[k,origin[k]]));
   await change('events',null,{...originalCopy,starts_at:e.starts_at,ends_at:e.ends_at,repeat_rule:{...r,ends:r.ends==='count'?'never':r.ends,until:r.ends==='on'?r.until:undefined},recurrence_parent_id:origin.id,...data},'create');
  }
 }
 toast(action==='delete'?'Event deleted':'Event updated');return true;
}
function enableCalendarDrag(){
 const grid=$('#grid');if(!grid)return;let drag=null;
 const cleanup=()=>{if(drag&&grid.hasPointerCapture(drag.id))grid.releasePointerCapture(drag.id);drag?.ghost?.remove();drag=null;document.body.classList.remove('daylight-dragging')};
 grid.onpointerdown=e=>{
  if(e.button!==0)return;
  const item=e.target.closest('[data-drag-event]'),cell=e.target.closest('[data-cell]');
  if(!item&&!cell)return;
  if(item&&state.subscriptions.some(s=>s.calendar_id===getOccurrence(item.dataset.detail,item.dataset.occ)?.calendar_id))return;
  const original=item?getOccurrence(item.dataset.detail,item.dataset.occ):null;
  const startCell=cell?.dataset.cell;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,item,original,startCell,edge:e.target.dataset.resize||null,started:false};
 };
 grid.onpointermove=e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(!drag.started&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5)return;
  if(!drag.started){drag.started=true;grid.setPointerCapture(e.pointerId);document.body.classList.add('daylight-dragging');const g=document.createElement('div');g.className='event-drag-ghost';g.textContent=drag.original?.title||'New event';g.style.background=drag.original?eventColor(drag.original):'#777';document.body.append(g);drag.ghost=g}
  drag.ghost.style.left=(e.clientX+12)+'px';drag.ghost.style.top=(e.clientY+8)+'px';if(drag.original&&drag.item?.classList.contains('weekevent')){const next=new Date(Date.parse(drag.original.starts_at)+Math.round(((e.clientY-drag.y)/.8)/15)*15*60000);drag.ghost.textContent=drag.original.title+' · '+next.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}
  e.preventDefault();
 };
 grid.onpointerup=async e=>{
  if(!drag||e.pointerId!==drag.id)return;const d=drag;if(!d.started){cleanup();return}
  const target=document.elementFromPoint(e.clientX,e.clientY),toCell=target?.closest('[data-cell]')?.dataset.cell,toTrack=target?.closest('[data-slot]'),endCell=toCell||toTrack?.dataset.slot;
  cleanup();
  if(!d.original&&d.startCell&&endCell){
   const dates=[d.startCell,endCell].sort();openEditor(null,dates[0]);const frm=$('#quickForm');if(frm){$('#endDate',frm).value=dates[1];$('[data-pick="end"]',frm).textContent=label(date(dates[1]))}return;
  }
  if(!d.original)return;
  const ev=d.original,start=new Date(ev.starts_at),end=new Date(ev.ends_at),duration=end-start;
  let nextStart=new Date(start),nextEnd=new Date(end);
  if(d.item?.classList.contains('weekevent')){
   const minutes=Math.round(((e.clientY-d.y)/.8)/15)*15;
   const days=endCell?Math.round((date(endCell)-date(daykey(start)))/86400000):0;
   if(d.edge==='start')nextStart=new Date(Math.min(end.getTime()-900000,start.getTime()+minutes*60000));
   else if(d.edge==='end')nextEnd=new Date(Math.max(start.getTime()+900000,end.getTime()+minutes*60000));
   else {nextStart=new Date(start.getTime()+minutes*60000+days*86400000);nextEnd=new Date(nextStart.getTime()+duration)}
  }else if(endCell){const delta=date(endCell)-date(daykey(start));nextStart=new Date(start.getTime()+delta);nextEnd=new Date(end.getTime()+delta)}
  else return;
  await changeOccurrence(ev,'update',{starts_at:nextStart.toISOString(),ends_at:nextEnd.toISOString()});
 };
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag?.started){cleanup();e.stopImmediatePropagation();e.preventDefault()}},{signal:undefined});
}
function details(e){
 const readOnly=state.subscriptions.some(sub=>sub.calendar_id===e.calendar_id);
 const cal=state.calendars.find(c=>c.id===e.calendar_id),day=e._civilDate?date(e._civilDate):new Date(e.starts_at),when=isLong(e)?rangeLabel(e,true):e.all_day?label(day):label(day)+' · '+prettyClock(e.starts_at)+'–'+prettyClock(e.ends_at);const dlg=modal('<div class="micro">EVENT</div><h2>'+h(e.title)+'</h2><p>'+h(when)+'</p><p class="popover-calendar"><i style="background:'+eventColor(e)+'"></i>'+h(cal?.name||'Calendar')+'</p>'+(repeatLabel(e.repeat_rule)?'<p>'+h(repeatLabel(e.repeat_rule))+'</p>':'')+'<p>'+h(e.description||'No description')+'</p><p>'+h(e.location_address||e.location_name||'')+'</p><div class="footer-actions"><button class="secondary" data-close>'+icon('x',16)+' Close</button>'+(readOnly?'':'<button class="secondary" id="deleteEvent">'+icon('trash',16)+' Delete</button><button class="primary" id="editEvent">'+icon('pencil',16)+' Edit</button>')+'</div>');
 $('#editEvent',dlg)?.addEventListener('click',()=>{dlg.close();openEditor(e._origin||e,null,null,'event',e)});
 $('#deleteEvent',dlg)?.addEventListener('click',()=>(async()=>{if(nativeRecurring(e)){dlg.close();await changeOccurrence(e,'delete')}else confirmAction('Delete event?','This event will be permanently deleted.',async()=>{await safeChange('events',e.id,null,'delete');dlg.close()})})());
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

function openEditor(existing=null,chosenDate=null,chosenTime=null,kind='event',instance=null){
 state.edit=existing;state.mode=kind;state.timed=!!chosenTime||(!!existing&&!existing.all_day);state.allDay=kind==='event'&&!state.timed;
 selectedLocation=existing?.location_address?{display:existing.location_name,address:existing.location_address}:null;
 const first=existing?(kind==='task'?(existing.due_date?date(existing.due_date):now()):new Date(instance?.starts_at||existing.starts_at)):chosenDate?date(chosenDate):now();
 if(!existing&&!chosenTime){first.setHours(first.getHours()+1,0,0,0)}
 if(chosenTime){const [hr,min]=chosenTime.split(':').map(Number);first.setHours(hr,min,0,0)}
 const finish=existing&&kind==='event'?new Date(instance?.ends_at||existing.ends_at):new Date(first.getTime()+3600000);
 const dateText=existing?.all_day?String(existing.starts_at).slice(0,10):iso(first),endText=existing?.all_day?iso(add(date(String(existing.ends_at).slice(0,10)),-1)):iso(finish),startTime=('0'+first.getHours()).slice(-2)+':'+('0'+first.getMinutes()).slice(-2),endTime=('0'+finish.getHours()).slice(-2)+':'+('0'+finish.getMinutes()).slice(-2);
 const options=state.calendars.filter(c=>c.client_id!=='us-holidays'&&!state.subscriptions.some(s=>s.calendar_id===c.id));
 const chosen=options.find(c=>c.id===existing?.calendar_id)||options[0];
 const dlg=modal('<form id="quickForm"><header class="quick-top"><span class="grip" aria-hidden="true"></span><button type="button" class="icon" id="editorClose">'+icon('x',16)+'</button></header><input id="quickTitle" class="quick-title" placeholder="Add title" maxlength="300" value="'+h(existing?.title||'')+'"><small class="title-error" id="titleError" hidden>Add a title</small><div class="toggle-segments"><button type="button" data-mode="event" class="'+(kind==='event'?'selected':'')+'">Event</button><button type="button" data-mode="task" class="'+(kind==='task'?'selected':'')+'">Task</button></div><div class="quick-content"><div class="quick-row"><span class="row-icon">'+icon('clock',20)+'</span><div class="quick-fields"><div class="date-time-row"><button type="button" data-pick="start" class="field-button" id="startDateBtn">'+h(label(first))+'</button><span>–</span><button type="button" data-pick="end" class="field-button" id="endDateBtn">'+h(existing?.all_day?label(date(endText)):label(finish))+'</button><button type="button" id="addTime" class="secondary '+(state.timed?'active':'')+'">Add time</button></div><div id="timedFields" '+(state.timed?'':'hidden')+' class="timed-row"><button type="button" class="field-button" data-pick="startTime">'+h(readableTime(startTime))+'</button><button type="button" class="field-button" data-pick="endTime">'+h(readableTime(endTime))+'</button></div><button type="button" class="repeat-line" id="repeatButton">Does not repeat '+icon('chevron-down',16)+'</button></div></div><div class="quick-row" id="locationRow"><span class="row-icon">'+icon('map-pin',20)+'</span><div class="quick-fields location-area"><input id="quickLocation" placeholder="Add location" autocomplete="off" value="'+h(existing?.location_name||'')+'"><small class="saved-address" id="addressSaved" '+(selectedLocation?'':'hidden')+'>Full address saved: '+h(selectedLocation?.address||'')+'</small><div id="addressOptions" class="address-options" hidden></div></div></div><div class="quick-row"><span class="row-icon">'+icon('align-left',20)+'</span><textarea id="quickDescription" placeholder="Add description" rows="1">'+h(existing?.description||existing?.notes||'')+'</textarea></div><div class="quick-row" id="calendarRow"><span class="row-icon">'+icon('calendar',20)+'</span><div class="quick-fields"><button type="button" id="eventCalendarBtn" class="field-button"><i class="form-calendar-dot" style="background:'+colorFor(chosen)+'"></i> '+h(chosen?.name||'No calendar')+' '+icon('chevron-down',16)+'</button><small id="calSummary">'+h(chosen?.name||'')+' · Reminder: 15 minutes before</small></div></div><div id="extraFields" hidden><div class="quick-row"><span class="row-icon">'+icon('clock',20)+'</span><div class="quick-fields">All day <button type="button" class="switch '+(state.allDay?'on':'')+'" id="allDaySwitch" role="switch" aria-checked="'+!!state.allDay+'"><span></span></button></div></div><div class="quick-row"><span class="row-icon">'+icon('bell',20)+'</span><button type="button" class="field-button" id="reminderButton">15 minutes before '+icon('chevron-down',16)+'</button></div></div></div><footer class="quick-footer"><button class="secondary" type="button" id="moreOptions">More options</button><div class="quick-footer-right">'+(existing?'<button type="button" class="danger-text" id="quickDelete">Delete</button>':'')+'<button type="submit" class="primary" id="quickSave">'+'Save'+'</button></div></footer><input type="hidden" id="startDate" value="'+dateText+'"><input type="hidden" id="endDate" value="'+endText+'"><input type="hidden" id="startTime" value="'+startTime+'"><input type="hidden" id="endTime" value="'+endTime+'"><input type="hidden" id="calendarValue" value="'+h(chosen?.id||'')+'"><input type="hidden" id="repeatValue" value="never"><input type="hidden" id="reminderValue" value="15"></form>');
 dlg.classList.add('quick-dialog');dlg.querySelector('.dialog-close')?.remove();$$('[data-mode]',dlg).forEach(b=>b.insertAdjacentHTML('afterbegin',icon(b.dataset.mode==='event'?'calendar':'tasks',16)));
 const form=$('#quickForm',dlg),title=$('#quickTitle',form);$('.quick-footer',form).insertAdjacentHTML('beforebegin','<p class="form-inline-error" id="quickInlineError" role="alert" hidden></p>');title.addEventListener('input',()=>{title.classList.remove('invalid');$('#titleError',form).hidden=!!title.value.trim();$('#quickInlineError',form).hidden=true});title.focus();requestAnimationFrame(()=>{if(dlg.open)title.focus()});
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
  $('#'+type+'Time',form).value=value;$('[data-pick="'+type+'Time"]',form).textContent=readableTime(value);
  if(type==='start'){
   const duration=(minutes(oldEnd)-minutes(prev)+1440)%1440||60,next=(minutes(value)+duration)%1440;
   const text=String(Math.floor(next/60)).padStart(2,'0')+':'+String(next%60).padStart(2,'0');
   $('#endTime',form).value=text;$('[data-pick="endTime"]',form).textContent=readableTime(text);
  }
 };
 $$('[data-pick]',form).forEach(b=>b.onclick=()=>{
  const type=b.dataset.pick;
  if(!type.endsWith('Time'))return makeDateGrid(b,$('#'+type+'Date',form).value,v=>setDate(type,v),icon,state.settings.start_of_week==='monday'?1:0);
  menu(b,Array.from({length:96},(_,i)=>{const t=String(Math.floor(i/4)).padStart(2,'0')+':'+String((i%4)*15).padStart(2,'0');return[readableTime(t),()=>setTime(type.replace('Time',''),t)]}));
 });
 $('#addTime',form).onclick=()=>{
  state.timed=!state.timed;state.allDay=!state.timed;
  $('#timedFields',form).hidden=!state.timed;$('#addTime',form).classList.toggle('active',state.timed);
  $('#allDaySwitch',form).classList.toggle('on',state.allDay);$('#allDaySwitch',form).setAttribute('aria-checked',String(state.allDay));
 };
 $('#eventCalendarBtn',form).onclick=e=>menu(e.currentTarget,options.length?options.map(c=>[c.name,()=>{
  $('#calendarValue',form).value=c.id;$('#eventCalendarBtn',form).innerHTML='<i class="form-calendar-dot" style="background:'+colorFor(c)+'"></i> '+h(c.name)+' '+icon('chevron-down',16);
  $('#calSummary',form).textContent=c.name+' · Reminder: 15 minutes before';
 }]):[['No calendars yet — Create one',()=>calendarForm()]]);
 $('#repeatButton',form).onclick=e=>menu(e.currentTarget,[['Does not repeat','never'],['Daily','daily'],['Weekly','weekly'],['Monthly','monthly'],['Yearly','yearly'],['Custom…','custom']].map(([label,freq])=>[label,()=>{
  if(freq==='custom')return openCustomRepeat(repeatRule,rule=>{repeatRule=rule;updateRepeat()});
  repeatRule={frequency:freq,interval:1,ends:'never'};updateRepeat();
 }]));
 $('#moreOptions',form).onclick=()=>{$('#extraFields',form).hidden=!$('#extraFields',form).hidden};
 $('#allDaySwitch',form).onclick=()=>{state.allDay=!state.allDay;$('#allDaySwitch',form).classList.toggle('on',state.allDay);$('#allDaySwitch',form).setAttribute('aria-checked',String(state.allDay));$('#timedFields',form).hidden=state.allDay||!state.timed};
 $('#reminderButton',form).onclick=e=>menu(e.currentTarget,[['None',null],['At start',0],['5 minutes',5],['15 minutes',15],['30 minutes',30],['1 hour',60],['1 day',1440]].map(([text,value])=>[text,()=>{$('#reminderValue',form).value=value??'';$('#reminderButton',form).innerHTML=h(text)+' '+icon('chevron-down',16);$('#calSummary',form).textContent=(options.find(c=>c.id===$('#calendarValue',form).value)?.name||'Calendar')+' · Reminder: '+(text==='None'?'None':text==='At start'?'At start':text+' before')}]));
 const field=$('#quickLocation',form),optionsEl=$('#addressOptions',form),saved=$('#addressSaved',form);form.addEventListener('focusin',e=>{if(e.target!==field&&!optionsEl.contains(e.target))optionsEl.hidden=true});dlg.addEventListener('pointerdown',e=>{if(!e.target.closest('#locationRow'))optionsEl.hidden=true});
 let controller=null,cache=new Map(),active=-1;
 const choose=i=>{const item=state.addrResults[i];if(!item)return;selectedLocation=item;field.value=item.display;saved.hidden=false;saved.textContent='Full address saved: '+(item.address.toLowerCase()===item.display.toLowerCase()?item.display:item.address);optionsEl.hidden=true;field.focus()};
 const draw=()=>{active=-1;optionsEl.hidden=false;optionsEl.innerHTML=state.addrResults.length?state.addrResults.map((r,i)=>'<button type="button" data-address="'+i+'"><span>'+icon('map-pin',16)+'</span><strong>'+h(r.display)+'</strong><small>'+h(r.address)+'</small></button>').join(''):'<div class="quiet">No matches — you can still use what you typed.</div>';$$('[data-address]',optionsEl).forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();choose(+b.dataset.address)}));requestAnimationFrame(()=>{const footer=$('.quick-footer',dlg),bottom=footer?.getBoundingClientRect().top??innerHeight;if(optionsEl.isConnected&&!optionsEl.hidden){optionsEl.classList.toggle('flip-up',optionsEl.getBoundingClientRect().bottom>bottom-8)}})};
 field.oninput=()=>{selectedLocation=null;saved.hidden=true;clearTimeout(addressTimer);controller?.abort();const q=field.value.trim();if(q.length<3){optionsEl.hidden=true;return}if(cache.has(q)){state.addrResults=cache.get(q);draw();return}addressTimer=setTimeout(async()=>{controller=new AbortController();try{optionsEl.hidden=false;optionsEl.innerHTML='<div class="quiet">Searching…</div>';const response=await fetch('https://photon.komoot.io/api/?lang=en&limit=5&q='+encodeURIComponent(q),{signal:controller.signal});const json=await response.json();state.addrResults=[...new Map((json.features||[]).slice(0,12).map(f=>{const p=f.properties||{},display=p.name||p.street||p.city||'Location',parts=[p.name||p.street,p.housenumber,p.city,p.state,p.country].filter(Boolean);const address=parts.filter((v,i)=>i===0||v!==parts[i-1]).join(', ');return[address.toLowerCase(),{display,address}]})).values()].slice(0,5);cache.set(q,state.addrResults);draw()}catch{optionsEl.hidden=true}},300)};
 field.onfocus=()=>{if(cache.has(field.value.trim())){state.addrResults=cache.get(field.value.trim());draw()}};
 field.onkeydown=e=>{if(optionsEl.hidden)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();active=(active+(e.key==='ArrowDown'?1:-1)+state.addrResults.length)%state.addrResults.length;$$('[data-address]',optionsEl).forEach((x,i)=>x.classList.toggle('highlight',i===active))}else if(e.key==='Enter'){e.preventDefault();e.stopPropagation();choose(active<0?0:active)}else if(e.key==='Escape'){optionsEl.hidden=true;e.stopPropagation()}else if(e.key==='Tab')optionsEl.hidden=true};
 upgradeIcons();
 $('#quickDelete',form)?.addEventListener('click',()=>{if(instance&&nativeRecurring(instance))return changeOccurrence(instance,'delete').then(ok=>{if(ok)dlg.close()});confirmAction('Delete '+state.mode+'?','This cannot be undone.',async()=>{await safeChange(state.mode==='task'?'tasks':'events',existing.id,null,'delete');dlg.close()})});
 form.onsubmit=async e=>{
  e.preventDefault();if(!title.value.trim()){title.classList.add('shake','invalid');$('#titleError',form).hidden=false;title.focus();setTimeout(()=>title.classList.remove('shake'),300);return}
  const startD=$('#startDate',form).value,endD=$('#endDate',form).value;
  const startAt=new Date(startD+'T'+(state.timed&&!state.allDay?$('#startTime',form).value:'00:00')+':00');
  const endAt=new Date(endD+'T'+(state.timed&&!state.allDay?$('#endTime',form).value:'00:00')+':00');
  if(!state.timed||state.allDay)endAt.setDate(endAt.getDate()+1);
  if(endAt<=startAt){const el=$('#quickInlineError',form);el.textContent='End must be after start.';el.hidden=false;return}
  const entity=state.mode==='task'?'tasks':'events',data=state.mode==='task'?{title:title.value.trim(),notes:$('#quickDescription',form).value,due_date:startD}:{calendar_id:$('#calendarValue',form).value,title:title.value.trim(),description:$('#quickDescription',form).value,location_name:field.value,location_address:selectedLocation?.address||'',starts_at:startAt.toISOString(),ends_at:endAt.toISOString(),all_day:state.allDay||!state.timed,repeat_rule:repeatRule,reminder_offset_minutes:$('#reminderValue',form).value?Number($('#reminderValue',form).value):null};
  try{loading($('#quickSave',form),true,'Saving…');if(existing&&instance&&nativeRecurring(instance)){const changed=await changeOccurrence(instance,'update',data);if(!changed){loading($('#quickSave',form),false);return}}else await change(entity,existing?.id||null,data,existing?'update':'create');dlg.close();toast(state.mode==='task'?(existing?'Task updated':'Task saved'):(existing?'Event updated':'Event created'))}catch{loading($('#quickSave',form),false);const error=$('#quickInlineError',form);error.textContent="Couldn't save — check your connection.";error.hidden=false}
 };
};
const remindersSeen=new Set();
function checkReminders(){
 if(!state.user||typeof Notification==='undefined'||Notification.permission!=='granted')return;
 const time=Date.now(),windowMs=60000;
 if(state.settings.event_reminders){
  for(const e of uniqueInstances(occurrences(add(now(),-2),add(now(),3)))){
   const offset=Number.isFinite(e.reminder_offset_minutes)?e.reminder_offset_minutes:state.settings.default_reminder_minutes;
   if(offset===-1||offset==null)continue;
   const due=Date.parse(e.starts_at)-offset*60000,key='event:'+e.id+':'+e.starts_at+':'+offset;
   if(due<=time&&due>time-windowMs&&!remindersSeen.has(key)){remindersSeen.add(key);new Notification(e.title,{body:'Daylight event reminder',tag:key})}
  }
 }
 if(state.settings.task_reminders){
  for(const t of state.tasks.filter(x=>!x.completed&&x.due_date)){
   const due=new Date(t.due_date+'T09:00:00').getTime(),key='task:'+t.id+':'+t.due_date;
   if(due<=time&&due>time-windowMs&&!remindersSeen.has(key)){remindersSeen.add(key);new Notification(t.title,{body:'Daylight task due today',tag:key})}
  }
 }
}
setInterval(checkReminders,30000);
window.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&(e.code==='Comma'||e.key===','||e.key==='<')){e.preventDefault();e.stopPropagation();if(state.user)settings()}},{capture:true});
startIcons();
load();
