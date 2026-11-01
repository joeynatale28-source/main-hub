/* Daylight 1.0 shell controller — preserves existing local-first data. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),app=document.querySelector('.app'),sidebar=document.querySelector('.sidebar'),main=document.querySelector('.main');
history.scrollRestoration='manual';
window.scrollTo(0,0);
const brand=sidebar.querySelector('.brand'),logo=brand.querySelector('.logo'),name=brand.querySelector(':scope > span');
const brandButton=document.createElement('button');brandButton.id='brandToday';brandButton.className='brand-button';brandButton.type='button';brandButton.title='Today';brandButton.setAttribute('aria-label','Go to today');const nameLabel=document.createElement('span');nameLabel.className='brand-name';if(name){nameLabel.innerHTML=name.innerHTML;name.remove()}logo.before(brandButton);brandButton.append(logo,nameLabel);brandButton.onclick=()=>$('todayBtn').click();
const middle=document.createElement('div');middle.className='sidebar-middle';middle.setAttribute('aria-label','Sidebar navigation and calendars');
const bottom=sidebar.querySelector('.sidebar-bottom');const next=sidebar.querySelector('.mini-calendar');sidebar.insertBefore(middle,bottom);for(let n=next;n&&n!==middle&&n!==bottom;){const after=n.nextSibling;middle.append(n);n=after}
$('appFooter')?.remove();
sidebar.querySelector('.calendars-label')?.remove();middle.querySelectorAll('.nav.legacy-view').forEach(n=>n.remove());
for(const el of middle.querySelectorAll('.nav')){el.title=(el.textContent||'').trim();el.setAttribute('aria-label',el.title)}
const avatar=sidebar.querySelector('.profile .avatar'),profileButton=$('profileMenuBtn'),menu=$('profileMenu');
const header=document.createElement('div');header.className='account-menu-head';header.innerHTML='<span aria-hidden="true">◯</span><div><strong id="accountDisplayName">Guest account</strong><small>Personal workspace · Local-first</small></div>';menu.prepend(header);
menu.querySelectorAll('.account-legal-link').forEach(a=>a.remove());$('profileSettings').hidden=false;
function syncName(){const name=window.DaylightStore.getItem('daylight-name')||'';$('accountDisplayName').textContent=name||'Guest account';header.firstElementChild.textContent=name?name[0].toUpperCase():'◯'}
syncName();new MutationObserver(syncName).observe(sidebar.querySelector('.profile strong'),{childList:true,characterData:true,subtree:true});
avatar.tabIndex=0;avatar.setAttribute('role','button');avatar.setAttribute('aria-label','Account menu');avatar.title='Account menu';
avatar.onclick=()=>profileButton.click();avatar.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();profileButton.click()}};
const rails=document.createElement('div');rails.className='rail-calendar-dots';rails.setAttribute('aria-label','Calendar visibility');middle.append(rails);
function updateRails(){rails.replaceChildren();const rows=[...document.querySelectorAll('#calendars .calendar-filter')];for(const row of rows){const input=row.querySelector('[data-calendar]');if(!input)continue;const label=row.querySelector('.cal-name')?.textContent?.trim()||'Calendar';const b=document.createElement('button');b.type='button';b.className='rail-calendar-dot';b.title=label;b.setAttribute('aria-label',label);b.setAttribute('aria-pressed',String(input.checked));const dot=document.createElement('span');b.append(dot);b.onclick=()=>{input.checked=!input.checked;input.dispatchEvent(new Event('change',{bubbles:true}));updateRails()};rails.append(b);const count=row.querySelector('.cal-count');if(count){const raw=count.dataset.total||count.textContent.replace(/ · hidden$/, '');count.dataset.total=raw;count.textContent=input.checked?raw:raw+' · hidden';count.style.opacity=input.checked?'1':'.55'}}}
new MutationObserver(()=>{if(!updateRails.lock){updateRails.lock=true;queueMicrotask(()=>{updateRails.lock=false;updateRails()})}}).observe($('calendars'),{childList:true});updateRails();
requestAnimationFrame(()=>{if(!rails.children.length){const items=window.DaylightBridge?.getCalendars?.()||[];for(const cal of items){const button=document.createElement('button');button.className='rail-calendar-dot';button.type='button';button.title=cal.name;button.setAttribute('aria-label',cal.name);button.setAttribute('aria-pressed','true');const dot=document.createElement('span');button.append(dot);button.onclick=()=>{const input=document.querySelector('#calendars [data-calendar="'+cal.id+'"]');if(input){input.click();button.setAttribute('aria-pressed',String(input.checked))}};rails.append(button)}}});
function collapseState(force){const collapsed=force===undefined?app.classList.contains('sidebar-collapsed'):force;app.classList.toggle('sidebar-collapsed',collapsed);$('collapseSidebar').title=collapsed?'Expand sidebar':'Collapse sidebar';$('collapseSidebar').setAttribute('aria-label',$('collapseSidebar').title);window.DaylightStore.setItem('daylight-sidebar-collapsed',collapsed?'yes':'no')}
const previousCollapse=$('collapseSidebar').onclick;$('collapseSidebar').onclick=e=>{if(matchMedia('(max-width:720px)').matches){$('mobileBackdrop').click();return}previousCollapse?.(e);app.classList.add('sidebar-manual-expand');sessionStorage.setItem('daylight-sidebar-manual','yes');collapseState()};
function applyResponsive(){if(matchMedia('(min-width:721px) and (max-width:1100px)').matches&&!sessionStorage.getItem('daylight-sidebar-manual'))collapseState(true);else if(matchMedia('(min-width:1101px)').matches)collapseState(window.DaylightStore.getItem('daylight-sidebar-collapsed')==='yes')}
applyResponsive();addEventListener('resize',applyResponsive);
function restoreMain(){window.scrollTo(0,0);main.scrollTop=0;middle.scrollTop=0;const settings=$('settingsPage');if(settings.hidden)return}
function settingsTop(){const stack=document.querySelector('.settings-stack');if(stack)stack.scrollTop=0}
function ensureTakeover(){const settings=$('settingsPage'),tasks=$('tasksPage');if(settings.parentElement!==document.body)document.body.append(settings);if(tasks.parentElement!==document.body)document.body.append(tasks)}
ensureTakeover();
for(const id of ['settingsHeaderButton','profileSettings','profileAbout','integrationsNav','tasksNav','settingsBack','tasksBack'])$(id)?.addEventListener('click',()=>{requestAnimationFrame(()=>{window.scrollTo(0,0);settingsTop();const list=$('tasksList');if(list)list.scrollTop=0})});
const originalSettingsClick=$('settingsHeaderButton').onclick;
const stack=document.querySelector('.settings-stack'),anchors=[...document.querySelectorAll('.settings-anchor')];
const scrollspy=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);if(!visible.length)return;const id=visible[0].target.id;anchors.forEach(b=>{const active=b.dataset.target===id;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'location':'false')})},{root:stack,rootMargin:'-8px 0px -65% 0px',threshold:0});
document.querySelectorAll('.settings-stack>.setting-group').forEach(s=>scrollspy.observe(s));
const oldIntegrations=$('integrationsNav').onclick;
$('integrationsNav').addEventListener('click',()=>{requestAnimationFrame(()=>{$('settingsPage').classList.remove('integrations-only');$('settingsIntegrations').scrollIntoView({block:'start',behavior:'instant'});$('settingsPage').querySelector('h1').textContent='Settings';anchors.forEach(b=>b.classList.toggle('active',b.dataset.target==='settingsIntegrations'))})});
const back=()=>{if(!$('settingsPage').hidden)$('settingsBack').click();else if(!$('tasksPage').hidden)$('tasksBack').click()};
addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!menu.hidden){menu.hidden=true;profileButton.setAttribute('aria-expanded','false');return}if(!$('calendarAddOptions').hidden){$('calendarAddOptions').hidden=true;$('addCalendarMenu').setAttribute('aria-expanded','false');return}if(!$('settingsPage').hidden||!$('tasksPage').hidden)back()});
menu.addEventListener('click',e=>e.stopPropagation());
profileButton.addEventListener('click',()=>{if(!menu.hidden)syncName()});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.sidebar-bottom')){menu.hidden=true;profileButton.setAttribute('aria-expanded','false')}if(!e.target.closest('.calendar-list-head'))$('calendarAddOptions').hidden=true});
for(const d of document.querySelectorAll('dialog'))d.addEventListener('show',()=>{$('calendarAddOptions').hidden=true});
const openModal=()=>{$('calendarAddOptions').hidden=true;$('addCalendarMenu').setAttribute('aria-expanded','false')};
['createCalendarOption','subscribeCalendarOption'].forEach(id=>$(id)?.addEventListener('click',openModal));
function fitMonth(){const grid=document.querySelector('.monthgrid');if(grid)grid.style.setProperty('--month-rows',Math.max(5,Math.round(grid.children.length/7)))}
function scrollWeek(){const grid=$('weekScroll');if(!grid)return;const now=new Date(),hour=now.getHours();if(hour<5){grid.scrollTop=0;return}const desired=(hour*60+now.getMinutes())-grid.clientHeight/3;grid.scrollTop=Math.max(0,desired)}
// On narrow screens the month cell and its add button overlap. Handle the add intent before the cell selection handler.
document.addEventListener('click',e=>{const button=e.target.closest?.('[data-add-date]');if(!button||!matchMedia('(max-width:720px)').matches)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();requestAnimationFrame(()=>window.DaylightBridge?.openEventOnDate?.(button.dataset.addDate))},true);
const calendarView=$('calendarView');new MutationObserver(()=>{fitMonth();if($('weekScroll')&&!calendarView.dataset.lastWeek){requestAnimationFrame(scrollWeek)}calendarView.dataset.lastWeek=$('weekScroll')?'yes':''}).observe(calendarView,{childList:true});
fitMonth();requestAnimationFrame(scrollWeek);
document.querySelectorAll('[data-switch]').forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(scrollWeek)));
const switcher=$('viewSelect');switcher?.addEventListener('change',()=>requestAnimationFrame(scrollWeek));
const saveStep=$('wizardSkip');if(saveStep){const set=()=>saveStep.hidden=window.DaylightWizard?.getStep()===3;new MutationObserver(set).observe($('wizardCount'),{childList:true});set()}
const discard=$('wizardDiscardButton');if(discard)discard.textContent='Discard draft';
const where=document.querySelector('.wizard-location .field-label');if(where&&where.firstChild)where.firstChild.textContent='Location ';
const search=$('searchResults');if(search){const observer=new MutationObserver(()=>{search.querySelectorAll('#searchClearEmpty,.search-empty button').forEach(b=>b.remove());if(!search.hidden&&!search.querySelector('.search-caption')){const cap=document.createElement('div');cap.className='search-caption';cap.textContent='All dates';search.prepend(cap)}});observer.observe(search,{childList:true});}
const picker=$('accentNative');if(picker){const trigger=document.createElement('button');trigger.type='button';trigger.className='custom-accent-trigger';trigger.title='Pick a custom color';trigger.setAttribute('aria-label','Choose custom accent color');picker.before(trigger);trigger.onclick=()=>picker.showPicker?.()||picker.click();picker.addEventListener('input',()=>trigger.style.background=picker.value);trigger.style.background=picker.value}
const tabText={all:'All tasks',open:'To do',completed:'Completed'};
function taskCounts(){let tasks=[];try{tasks=JSON.parse(window.DaylightStore.getItem('daylight-tasks-v1')||'[]')}catch{}const all=tasks.length,open=tasks.filter(x=>!x.done).length;document.querySelectorAll('[data-task-filter]').forEach(b=>{const k=b.dataset.taskFilter;b.textContent=tabText[k]+' · '+(k==='all'?all:k==='open'?open:all-open)});const empty=$('tasksList').querySelector('.empty-tasks');if(empty){const active=document.querySelector('[data-task-filter].selected')?.dataset.taskFilter;empty.textContent=active==='open'?'Nothing to do. Nice.':active==='completed'?'Nothing completed yet.':'No tasks yet. Make some room for what matters.';if(active==='all'){const b=document.createElement('button');b.className='primary';b.type='button';b.textContent='+ Add task';b.onclick=()=>$('newTask').click();empty.append(b)}}}
new MutationObserver(taskCounts).observe($('tasksList'),{childList:true});document.querySelectorAll('[data-task-filter]').forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(taskCounts)));$('tasksNav').addEventListener('click',()=>requestAnimationFrame(taskCounts));taskCounts();
const due=$('taskDue');if(due){const btn=document.createElement('button');btn.type='button';btn.className='task-due-button';due.before(btn);let month=new Date();const panel=document.createElement('div');panel.className='task-date-panel';panel.hidden=true;$('taskDialog').append(panel);const fmt=()=>btn.textContent=due.value?new Date(due.value+'T12:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'Choose due date';fmt();due.addEventListener('change',fmt);
function draw(){const y=month.getFullYear(),m=month.getMonth(),first=new Date(y,m,1),offset=first.getDay(),days=new Date(y,m+1,0).getDate();panel.innerHTML='<div class="task-date-header"><button type="button" data-shift="-1">‹</button><strong>'+first.toLocaleDateString('en-US',{month:'long',year:'numeric'})+'</strong><button type="button" data-shift="1">›</button></div><div class="task-date-grid">'+Array.from({length:offset},()=>'<span></span>').join('')+Array.from({length:days},(_,i)=>{const v=y+'-'+String(m+1).padStart(2,'0')+'-'+String(i+1).padStart(2,'0');return'<button type="button" data-day="'+v+'" class="'+(v===due.value?'active':'')+'">'+(i+1)+'</button>'}).join('')+'</div><button type="button" id="taskDateClear" class="outline">No due date</button>';panel.querySelectorAll('[data-shift]').forEach(b=>b.onclick=()=>{month=new Date(y,m+Number(b.dataset.shift),1);draw()});panel.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{due.value=b.dataset.day;due.dispatchEvent(new Event('change',{bubbles:true}));panel.hidden=true});$('taskDateClear').onclick=()=>{due.value='';due.dispatchEvent(new Event('change',{bubbles:true}));panel.hidden=true}}
btn.onclick=()=>{if(!panel.hidden){panel.hidden=true;return}month=due.value?new Date(due.value+'T12:00'):new Date();draw();const box=btn.getBoundingClientRect();panel.style.left=Math.max(8,Math.min(window.innerWidth-308,box.left))+'px';panel.style.top=Math.max(8,Math.min(window.innerHeight-330,box.bottom+8))+'px';panel.hidden=false};document.addEventListener('pointerdown',e=>{if(!panel.contains(e.target)&&e.target!==btn)panel.hidden=true});document.addEventListener('keydown',e=>{if(e.key==='Escape')panel.hidden=true});
}
// Keep calendar popup closed when any dialog opens.
for(const dlg of document.querySelectorAll('dialog'))new MutationObserver(()=>{if(dlg.open){const menu=$('calendarAddOptions');if(menu)menu.hidden=true}}).observe(dlg,{attributes:true,attributeFilter:['open']});
// Task cancellation confirms loss of typed data, like the Event wizard.
const taskDialog=$('taskDialog'),taskForm=$('taskForm');if(taskDialog&&taskForm){
 let initial='';
 const fields=()=>JSON.stringify([$('taskName').value,$('taskDue').value,$('taskNotes').value]);
 taskDialog.addEventListener('close',()=>{$('taskDiscardPrompt')?.remove()});
 new MutationObserver(()=>{if(taskDialog.open){initial=fields()}}).observe(taskDialog,{attributes:true,attributeFilter:['open']});
 const ask=(e)=>{if(fields()===initial)return; e?.preventDefault();e?.stopImmediatePropagation();if($('taskDiscardPrompt'))return;
 const box=document.createElement('div');box.id='taskDiscardPrompt';box.innerHTML='<strong>Discard this task?</strong><p>Your changes will not be saved.</p><button type="button" id="keepTask">Keep editing</button><button type="button" id="discardTask">Discard draft</button>';
 taskForm.querySelector('.dialogactions').before(box);$('keepTask').onclick=()=>box.remove();$('discardTask').onclick=()=>{box.remove();initial=fields();taskDialog.close()}};
 taskDialog.addEventListener('cancel',ask);
 taskDialog.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',e=>{if(fields()!==initial)ask(e)},true));
}
const notif=$('enableNotifications');if(notif){notif.addEventListener('click',()=>setTimeout(()=>{if(!('Notification' in window))notif.textContent='Unavailable';else notif.textContent=Notification.permission==='granted'?'Enabled ✓':Notification.permission==='denied'?'Blocked — browser settings':'Enable'},100))}
if(location.hash==='#settings')$('settingsHeaderButton').click();else if(location.hash==='#tasks')$('tasksNav').click();
})();
