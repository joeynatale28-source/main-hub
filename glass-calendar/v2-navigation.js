/* Daylight v2: panel swapping, date drill-in, and persistent sidebar navigation. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),bridge=()=>window.DaylightBridge;
const main=document.querySelector('.main'),topbar=document.querySelector('.topbar'),sidebar=document.querySelector('.sidebar');
if(!main||!topbar||!bridge())return;
const middle=sidebar.querySelector('.sidebar-middle'),brand=sidebar.querySelector('.brand-button');
const settings=$('settingsPage'),tasks=$('tasksPage'),calendar=$('calendarContent');
for(const panel of [settings,tasks])if(panel.parentElement!==main)main.append(panel);
const integrations=document.createElement('section');integrations.id='integrationsPage';integrations.className='v2-panel integration-page';integrations.hidden=true;
const integrationSection=$('settingsIntegrations');if(integrationSection)integrations.append(integrationSection);main.append(integrations);
document.querySelector('.settings-anchor[data-target="settingsIntegrations"]')?.remove();
const data=$('settingsData');if(data){
 const row=document.createElement('div');row.className='setting-item';row.innerHTML='<div><strong>Integrations</strong><small>Manage your connected calendars and subscription feeds.</small></div><button id="settingsToIntegrations" type="button" class="outline">Manage integrations <span aria-hidden="true">→</span></button>';data.append(row);$('settingsToIntegrations').onclick=()=>navigate('integrations');
}
const header=document.createElement('div');header.id='v2ViewHeader';header.className='v2-view-header';header.hidden=true;header.innerHTML='<div><span class="eyebrow">YOUR WORKSPACE</span><h1 id="v2ViewTitle">Tasks</h1></div><div id="v2ViewActions"></div>';
topbar.append(header);
const back=document.createElement('button');back.id='v2DrillBack';back.type='button';back.className='outline v2-drill-back';back.hidden=true;back.textContent='← Back to Week';$('calendarHeadline').prepend(back);
let drilled=false,fromView='week',motionTimer=null,tooltipTimer=null;
const reduce=!!window.DaylightCloud?.settings?.reduce_motion;document.documentElement.dataset.reduceMotion=reduce?'true':'false';
const anim=(el,className)=>{if(!el||document.documentElement.dataset.reduceMotion==='true')return;el.classList.remove(className);void el.offsetWidth;el.classList.add(className);el.addEventListener('animationend',()=>el.classList.remove(className),{once:true})};
function updateHeader(view){
 header.hidden=view==='calendar';
 if(view==='calendar'){const name=window.DaylightStore.getItem('daylight-default-view')||'week';back.hidden=!(drilled&&bridge().getView()==='day'&&name!=='day');back.textContent='← Back to '+name[0].toUpperCase()+name.slice(1);return}
 const title=({settings:'Settings',tasks:'Tasks',integrations:'Integrations'})[view]||'Calendar';$('v2ViewTitle').textContent=title;
 const actions=$('v2ViewActions');actions.replaceChildren();
 if(view==='tasks'){actions.append($('newTask'))}
}
function activateNav(view){
 for(const [id,name] of [['profileCalendar','calendar'],['tasksNav','tasks'],['integrationsNav','integrations'],['v2SettingsNav','settings']]){
 const el=$(id);if(!el)continue;el.classList.toggle('active',view===name);el.setAttribute('aria-current',view===name?'page':'false')
 }
}
function navigate(view){
 if(!['calendar','tasks','settings','integrations'].includes(view))return;
 const prev=['calendar','tasks','settings','integrations'].find(x=>{const e=x==='calendar'?calendar:$(x==='integrations'?'integrationsPage':x+'Page');return e&&!e.hidden});
 const outgoing=prev==='calendar'?calendar:$(prev==='integrations'?'integrationsPage':prev+'Page');
 bridge().navigate(view);
 integrations.hidden=view!=='integrations';settings.hidden=view!=='settings';tasks.hidden=view!=='tasks';calendar.hidden=view!=='calendar';
 if(view==='settings')settings.classList.remove('integrations-only');
 updateHeader(view);activateNav(view);
 const incoming=view==='calendar'?calendar:$(view==='integrations'?'integrationsPage':view+'Page');
 if(outgoing&&outgoing!==incoming)anim(outgoing,'v2-fade-out');
 anim(incoming,'v2-view-enter');
 const scroll=incoming.querySelector?.('.settings-stack')||incoming;
 scroll?.scrollTo?.({top:0,behavior:'instant'});
 if(view==='integrations')integrations.scrollTop=0;
}
const support=document.createElement('div');support.className='sidebar-support';
support.innerHTML='<span class="navlabel">SUPPORT</span><button id="v2SettingsNav" class="nav" type="button" title="Settings"><span class="v2-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3.5"/><path d="M10 2h4l.8 2.7 2.2 1 2.5-1.3 2.4 2.5-1.4 2.5.9 2.3L24 12v3l-2.7.9-1 2.3 1.3 2.4-2.4 2.4-2.5-1.4-2.3.9L14 24h-4l-.8-2.7-2.3-.9-2.5 1.4L2 19.4l1.4-2.5-.9-2.3L0 14v-3l2.7-.8.9-2.3L2.1 5.5 4.5 3l2.5 1.4 2.3-.8L10 2Z"/></svg></span><span class="nav-text">Settings</span></button><button id="v2AboutNav" class="nav" type="button" title="About"><span class="v2-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10v1"/></svg></span><span class="nav-text">About</span></button>';
middle.append(support);
$('v2SettingsNav').onclick=()=>navigate('settings');
$('v2AboutNav').onclick=()=>{navigate('settings');requestAnimationFrame(()=>$('settingsAbout').scrollIntoView({block:'start',behavior:'smooth'}))};
const title=brand?.querySelector('.brand-name');if(title){const subtitle=document.createElement('span');subtitle.className='brand-subtitle';subtitle.textContent='Personal calendar';title.after(subtitle)}
const navMap={tasksNav:'tasks',integrationsNav:'integrations',profileCalendar:'calendar',settingsHeaderButton:'settings',profileSettings:'settings',settingsToIntegrations:'integrations'};
document.addEventListener('click',e=>{const node=e.target.closest?.('[id]');if(!node)return;let found=node;while(found&&!navMap[found.id])found=found.parentElement;if(found&&navMap[found.id]){e.preventDefault();e.stopImmediatePropagation();navigate(navMap[found.id])}},true);
function drill(day){
 if(!/^\d{4}-\d\d-\d\d$/.test(day||''))return;
 const current=bridge().getView();if(current!=='day')fromView=window.DaylightStore.getItem('daylight-default-view')||current;
 drilled=true;bridge().drillToDate(day);updateHeader('calendar');activateNav('calendar');anim($('calendarView'),'v2-view-enter');
}
back.onclick=()=>{drilled=false;bridge().backToDefault();updateHeader('calendar');anim($('calendarView'),'v2-view-enter')};
document.addEventListener('click',e=>{
 const target=e.target.closest?.('[data-drill-day],.week-day-number,.mini-day-number');
 if(!target)return;
 const day=target.dataset.drillDay||target.closest('[data-week-head]')?.dataset.weekHead||target.closest('[data-mini-day]')?.dataset.miniDay;
 if(!day)return;e.preventDefault();e.stopImmediatePropagation();drill(day);
},true);
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&drilled&&bridge().getView()==='day'&&!document.querySelector('dialog[open]')&&!document.querySelector('.select-menu')){e.preventDefault();back.click()}
});
$('prevBtn')?.addEventListener('click',()=>{const view=$('calendarView');view.dataset.pageDirection='prev';anim(view,'v2-page-prev')},true);
$('nextBtn')?.addEventListener('click',()=>{const view=$('calendarView');view.dataset.pageDirection='next';anim(view,'v2-page-next')},true);
const settingsNav=document.querySelector('.settings-sections');
if(settingsNav){
 const filter=document.createElement('input');filter.type='search';filter.id='settingsSearch';filter.placeholder='Search settings';filter.setAttribute('aria-label','Search settings');settingsNav.prepend(filter);
 filter.addEventListener('input',()=>{const value=filter.value.trim().toLowerCase();settingsNav.querySelectorAll('.settings-anchor').forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(value))});
}
const reducedRow=document.createElement('div');reducedRow.className='setting-item';reducedRow.innerHTML='<div><strong>Reduce motion</strong><small>Turn off slides and movement animations.</small></div><label class="switch-row"><input id="reduceMotion" type="checkbox" role="switch" aria-label="Reduce motion"></label>';
$('settingsAppearance')?.append(reducedRow);
$('reduceMotion').checked=reduce;
$('reduceMotion').onchange=async e=>{
 const desired=e.target.checked;document.documentElement.dataset.reduceMotion=desired?'true':'false';
 const {error}=await window.DaylightCloud.supabase.from('user_settings').update({reduce_motion:desired}).eq('user_id',window.DaylightCloud.getUser().id);
 if(error){e.target.checked=!desired;document.documentElement.dataset.reduceMotion=e.target.checked?'true':'false';alert("Couldn't save — check your connection")}else window.DaylightCloud.settings.reduce_motion=desired;
};
const tip=document.createElement('div');tip.className='rail-tooltip';tip.hidden=true;document.body.append(tip);
for(const item of [...middle.querySelectorAll('.nav'),...middle.querySelectorAll('.rail-calendar-dot'),brand,$('collapseSidebar')].filter(Boolean)){
 item.addEventListener('mouseenter',()=>{clearTimeout(tooltipTimer);tooltipTimer=setTimeout(()=>{if(!document.querySelector('.app')?.classList.contains('sidebar-collapsed'))return;const r=item.getBoundingClientRect();tip.textContent=item.title||item.getAttribute('aria-label')||item.textContent.trim();tip.style.left=r.right+9+'px';tip.style.top=r.top+(r.height-30)/2+'px';tip.hidden=false;anim(tip,'v2-pop')},300)});
 item.addEventListener('mouseleave',()=>{clearTimeout(tooltipTimer);tip.hidden=true})
}
const account=window.DaylightCloud?.profile;
const card=document.querySelector('.profile');if(card&&account){card.querySelector('strong').textContent=account.display_name||account.username;card.querySelector('small').textContent='Personal workspace';const menu=$('profileMenu');if(menu){const logout=document.createElement('button');logout.id='v2Logout';logout.type='button';logout.textContent='Log out';menu.append(logout);logout.onclick=()=>window.DaylightCloud.signOut()}}
if(location.hash==='#integrations')navigate('integrations');else if(location.hash==='#settings')navigate('settings');else if(location.hash==='#tasks')navigate('tasks');else updateHeader('calendar');
})();
