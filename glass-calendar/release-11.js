/* Daylight v1.1 release interactions: modal settings, sidebar calendar controls and release state. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const bridge=window.DaylightBridge,feed=window.DaylightSubscriptionAPI;
if(!bridge||!feed)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// A single settings popup; existing sections/controls are reused, not duplicated.
const dlg=document.createElement('dialog');dlg.id='settingsModal';dlg.className='release-settings-modal';dlg.setAttribute('aria-label','Settings');
const wrapper=document.createElement('div');wrapper.className='release-settings-wrap';
const close=document.createElement('button');close.type='button';close.className='settings-close';close.textContent='×';close.setAttribute('aria-label','Close settings');
wrapper.append(close);dlg.append(wrapper);document.body.append(dlg);
const panel=$('settingsPage');
panel.hidden=false;wrapper.append(panel);
panel.querySelector('.settings-intro')?.remove();
panel.querySelector('.view-page-top')?.remove();
$('settingsSearch')?.remove();
const nav=panel.querySelector('.settings-sections'),stack=panel.querySelector('.settings-stack');
const svg=paths=>'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths+'</svg>';
const sectionDefs=[
 ['settingsGeneral','General',svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>')],
 ['settingsCalendar','Calendar',svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>')],
 ['settingsAppearance','Appearance',svg('<path d="M12 2a10 10 0 1 0 0 20c1.6 0 2.5-.9 2.5-2 0-1-.7-1.8-.7-2.4 0-1 .8-1.7 2-1.7H19a3 3 0 0 0 3-3.2A10 10 0 0 0 12 2Z"/><circle cx="7" cy="12" r="1"/><circle cx="9" cy="7" r="1"/><circle cx="15" cy="7" r="1"/><circle cx="18" cy="11" r="1"/>')],
 ['settingsData','Calendar data',svg('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>')],
 ['settingsNotifications','Notifications',svg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>')],
 ['settingsAbout','About',svg('<circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10v.5"/>')]
];
nav.innerHTML=sectionDefs.map(([id,name,icon])=>'<button type="button" class="settings-anchor" data-target="'+id+'"><span class="settings-nav-icon" aria-hidden="true">'+icon+'</span>'+name+'</button>').join('');
let activeSection='settingsGeneral',opener=null,discardConfirmed=false;
function section(id){
 activeSection=id;nav.querySelectorAll('.settings-anchor').forEach(b=>b.classList.toggle('active',b.dataset.target===id));
 stack.querySelectorAll('.setting-group').forEach(el=>{el.hidden=el.id!==id;el.classList.remove('release-pane-enter');if(el.id===id){void el.offsetWidth;el.classList.add('release-pane-enter')}});
 stack.scrollTop=0;window.DaylightSyncSelect&&document.querySelectorAll('select').forEach(x=>window.DaylightSyncSelect(x));
}
nav.addEventListener('click',e=>{const b=e.target.closest('[data-target]');if(b)section(b.dataset.target)});
section(activeSection);
const getDirty=()=>Array.from(dlg.querySelectorAll('#subscribeURL,#subscribeName')).some(e=>e.value.trim()&&$('subscribeDialog')?.open);
function closeSettings(force=false){
 if(!dlg.open)return;
 if(!force&&getDirty()&&!confirm('Discard the unfinished subscription?'))return;
 dlg.close();opener?.focus?.({preventScroll:true});opener=null;
}
function openSettings(event,which){panel.hidden=false;const menu=$('profileMenu');if(menu)menu.hidden=true;$('profileMenuBtn')?.setAttribute('aria-expanded','false');
 if(dlg.open){if(which)section(which);return}
 opener=event?.target?.closest?.('button')||document.activeElement;
 $('settingsName').value=localStorage.getItem('daylight-name')||'';
 $('weekStartSelect').value=localStorage.getItem('daylight-week-start')||'0';
 $('defaultViewSelect').value=localStorage.getItem('daylight-default-view')||'week';
 section(which||'settingsGeneral');dlg.showModal();
}
bridge.openSettings=()=>openSettings({target:document.activeElement});close.onclick=()=>closeSettings();dlg.addEventListener('click',e=>{if(e.target===dlg)closeSettings()});
dlg.addEventListener('cancel',e=>{e.preventDefault();closeSettings()});
window.DaylightRelease={openSettings,closeSettings,confirmRemoveSubscription:(id)=>{requestDelete('subscription-'+id)}};
function captureSettings(e){
 const target=e.target.closest?.('#settingsNav,#settingsHeaderButton,#profileSettings,#profileAbout,#aboutNav,#footerAbout,#settingsBack');
 if(!target)return;
 e.preventDefault();e.stopImmediatePropagation();
 openSettings(e,/About/i.test(target.textContent||'')||['profileAbout','aboutNav','footerAbout'].includes(target.id)?'settingsAbout':undefined);
}
document.addEventListener('click',captureSettings,true);
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key===','){e.preventDefault();openSettings(e)}},true);
const jump=$('openIntegrationView');if(jump)jump.addEventListener('click',()=>closeSettings(true),true);
window.addEventListener('hashchange',()=>{if(location.hash==='#settings')history.replaceState(null,'','#calendar')});
// Sidebar calendars — per-row menu and durable visibility.
const calendarContainer=$('calendars');let openMenu=null,menuOwner=null;
const menu=document.createElement('div');menu.id='calendarActionsMenu';menu.className='calendar-actions-menu';menu.setAttribute('role','menu');menu.hidden=true;document.body.append(menu);
const isSubscription=id=>id==='us-holidays'||id.startsWith('subscription-');
function menuClose(restore=true){menu.hidden=true;if(restore)menuOwner?.focus?.();menuOwner=null;openMenu=null}
const icons={rename:'✎',hide:'◉',show:'◉',delete:'▤'};
function showMenu(id,button){
 menuClose(false);openMenu=id;menuOwner=button;
 const hidden=!getEnabled(id),sub=isSubscription(id);
 menu.innerHTML='<button role="menuitem" type="button" data-command="rename"><span aria-hidden="true">✎</span> Rename</button>'+
 '<button role="menuitem" type="button" data-command="visibility"><span aria-hidden="true">'+(hidden?'◉':'◌')+'</span> '+(hidden?'Unhide':'Hide')+'</button>'+
 '<button role="menuitem" type="button" data-command="delete" class="'+(sub?'':'danger')+'"><span aria-hidden="true">▤</span> '+(sub?'Remove subscription':'Delete')+'</button>';
 const rect=button.getBoundingClientRect();menu.style.left=Math.min(innerWidth-215,rect.right+5)+'px';menu.style.top=Math.min(innerHeight-155,rect.bottom+4)+'px';
 menu.hidden=false;menu.querySelector('button')?.focus();
}
function getEnabled(id){return !JSON.parse(localStorage.getItem('daylight-hidden-calendars')||'[]').includes(id)}
function redraw(){calendarContainer.querySelectorAll('.calendar-filter').forEach(row=>{
 const input=row.querySelector('[data-calendar]');if(!input)return;
 const id=input.dataset.calendar,calendar=bridge.getCalendars().find(c=>c.id===id);
 const label=row.querySelector('.cal-name');if(!calendar)return;
 row.classList.toggle('calendar-hidden',!getEnabled(id));
 row.querySelector('.cal-count')?.remove();
 if(row.querySelector('.calendar-actions-button'))return;
 const control=document.createElement('button');control.type='button';control.className='calendar-actions-button';control.setAttribute('aria-label','Actions for '+calendar.name);control.textContent='⋮';
 row.append(control);control.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showMenu(id,control)});
 row.title=calendar.name;
 });}
const watch=new MutationObserver(()=>{redraw()});watch.observe(calendarContainer,{childList:true,subtree:false});redraw();
function setVisible(id,on){bridge.toggleCalendar(id,on);menuClose(false);requestAnimationFrame(()=>[...calendarContainer.querySelectorAll('.calendar-filter')].find(x=>x.querySelector('[data-calendar]')?.dataset.calendar===id)?.querySelector('.calendar-actions-button')?.focus())}
function inlineRename(id){
 const row=[...calendarContainer.querySelectorAll('.calendar-filter')].find(x=>x.querySelector('[data-calendar]')?.dataset.calendar===id);if(!row)return;
 const label=row.querySelector('.cal-name'),control=row.querySelector('.calendar-actions-button'),old=label.textContent;
 menuClose(false);
 control.hidden=true;label.hidden=true;
 const field=document.createElement('input');field.className='calendar-rename-input';field.value=old;field.maxLength=75;field.setAttribute('aria-label','Rename calendar');
 const tick=document.createElement('button');tick.className='calendar-rename-save';tick.type='button';tick.textContent='✓';tick.setAttribute('aria-label','Save calendar name');
 label.after(field,tick);field.focus();field.select();
 const done=save=>{if(save){const name=field.value.trim();if(!name){field.classList.add('rename-error');field.focus();setTimeout(()=>field.classList.remove('rename-error'),500);return}bridge.renameCalendar(id,name);toast('Calendar renamed ✓')}else {field.remove();tick.remove();label.hidden=false;control.hidden=false;control.focus()}};
 tick.onclick=e=>{e.preventDefault();e.stopPropagation();done(true)};
 field.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();done(true)}if(e.key==='Escape'){e.preventDefault();e.stopPropagation();done(false)}});
}
const confirmDialog=document.createElement('dialog');confirmDialog.id='calendarDeleteDialog';confirmDialog.className='release-confirm';
confirmDialog.innerHTML='<div class="confirm-warning">!</div><h2 id="calendarDeleteTitle">Delete calendar?</h2><p id="calendarDeleteCopy"></p><input id="calendarDeleteMatch" aria-label="Type calendar name to confirm" autocomplete="off"><div class="confirm-actions"><button id="calendarDeleteCancel" type="button" class="outline">Cancel</button><button id="calendarDeleteProceed" type="button" class="danger-button" disabled>Delete calendar</button></div>';
document.body.append(confirmDialog);
$('calendarDeleteCancel').onclick=()=>confirmDialog.close();
confirmDialog.onclick=e=>{if(e.target===confirmDialog)confirmDialog.close()};
let pendingDelete=null;
function requestDelete(id){
 const c=bridge.getCalendars().find(x=>x.id===id);if(!c)return;
 pendingDelete=id;const sub=isSubscription(id),input=$('calendarDeleteMatch'),proceed=$('calendarDeleteProceed');
 $('calendarDeleteTitle').textContent=(sub?'Remove ':'Delete ')+c.name+'?';
 $('calendarDeleteCopy').textContent=sub?'This subscription and its imported events will be removed.':'The calendar and all of its events will be permanently deleted. Type the calendar name to confirm.';
 input.hidden=sub;input.value='';proceed.textContent=sub?'Remove subscription':'Delete calendar';proceed.disabled=!sub;
 input.oninput=()=>proceed.disabled=input.value.trim().toLowerCase()!==c.name.trim().toLowerCase();
 proceed.onclick=()=>{confirmDialog.close();const row=[...calendarContainer.querySelectorAll('.calendar-filter')].find(x=>x.querySelector('[data-calendar]')?.dataset.calendar===id);row?.classList.add('calendar-removing');
 setTimeout(()=>{if(sub){removeSub(id==='us-holidays'?'us-holidays':id.replace('subscription-',''))}else{const snapshot=bridge.deleteCalendar(id);if(snapshot)undoToast('Calendar deleted — ',()=>bridge.restoreCalendar(snapshot))}},200)};
 menuClose(false);confirmDialog.showModal();if(!sub)input.focus();else proceed.focus();
}
function removeSub(id){if(id==='us-holidays'){localStorage.setItem('daylight-holidays','off');$('holidaysToggle').checked=false;$('holidaysToggle').dispatchEvent(new Event('change',{bubbles:true}));toast('US Holidays hidden');return}feed.remove(id)}
menu.onclick=e=>{const command=e.target.closest('[data-command]')?.dataset.command;if(!command||!openMenu)return;const id=openMenu;if(command==='rename')inlineRename(id);if(command==='visibility')setVisible(id,!getEnabled(id));if(command==='delete')requestDelete(id)};
menu.onkeydown=e=>{if(e.key==='Escape'){e.stopPropagation();menuClose();return}if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();const buttons=[...menu.querySelectorAll('button')];const i=buttons.indexOf(document.activeElement);buttons[(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus()}};
document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!menu.contains(e.target)&&!e.target.closest('.calendar-actions-button'))menuClose(false)},true);
function toast(text){const node=$('toast');node.textContent=text;node.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove('visible'),3300)}
function undoToast(message,undo){const node=$('toast');node.textContent=message;const b=document.createElement('button');b.textContent='Undo';b.type='button';node.append(b);node.classList.add('visible');clearTimeout(toast.timer);const expiry=setTimeout(()=>node.classList.remove('visible'),5000);b.onclick=()=>{clearTimeout(expiry);undo();toast('Calendar restored')};toast.timer=expiry}
// Subscription state and external integrations.
const subList=$('subscriptionList');new MutationObserver(()=>{const status=$('integrationsSubscriptions');if(status){status.innerHTML=subList.innerHTML||'<p class="muted">No subscriptions yet.</p>'}}).observe(subList,{childList:true,subtree:true});
const about=panel.querySelector('#settingsAbout');about.querySelectorAll('.about-version,.version-label').forEach(x=>x.textContent='Version 1.1');about.innerHTML=about.innerHTML.replace(/\bv1\.0\b/g,'v1.1').replace(/Local-first preview/g,'Local-first calendar');
document.querySelectorAll('#appFooter').forEach(x=>x.innerHTML=x.innerHTML.replace('Local-first preview','Local-first · v1.1'));
const onlineNotice=document.createElement('div');onlineNotice.id='offlineNotice';onlineNotice.setAttribute('role','status');onlineNotice.textContent="You're offline — changes will save locally";document.body.append(onlineNotice);
const online=()=>onlineNotice.hidden=navigator.onLine;addEventListener('online',online);addEventListener('offline',online);online();
// Resolve unused placeholder states and keep focus on topmost overlay.
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape')return;
 if(!menu.hidden){e.preventDefault();e.stopImmediatePropagation();menuClose();return}
 const modals=[...document.querySelectorAll('dialog[open]')];
 if(modals.length){e.stopImmediatePropagation();if(dlg.open&&!modals.some(x=>x!==dlg)){e.preventDefault();closeSettings()}}
},true);
})();
