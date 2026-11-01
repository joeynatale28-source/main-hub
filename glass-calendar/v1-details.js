/* Daylight 1.0 — unified page details and truthful disclosures. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const settingsName=$('settingsName'),save=$('saveName');
if(settingsName&&save){
 const container=settingsName.parentElement;
 settingsName.hidden=true;settingsName.setAttribute('aria-hidden','true');settingsName.tabIndex=-1;
 const field=document.createElement('div');field.className='settings-name-fields';
 field.innerHTML='<label>First name<input id="settingsFirst" autocomplete="given-name" maxlength="35" placeholder="First name"></label><label>Last name<input id="settingsLast" autocomplete="family-name" maxlength="35" placeholder="Last name"></label>';
 container.insertBefore(field,save);
 function sync(){const n=window.DaylightStore.getItem('daylight-name')||'';const words=n.trim().split(/\s+/);$('settingsFirst').value=words.shift()||'';$('settingsLast').value=words.join(' ')}
 sync();$('settingsHeaderButton')?.addEventListener('click',()=>requestAnimationFrame(sync));$('profileSettings')?.addEventListener('click',()=>requestAnimationFrame(sync));
 save.addEventListener('click',()=>{settingsName.value=[$('settingsFirst').value.trim(),$('settingsLast').value.trim()].filter(Boolean).join(' ')},true);
}
const about=document.querySelector('#settingsAbout .about-body');
if(about){const notes=about.querySelectorAll('p');for(const p of notes){if(p.textContent.includes('License details for third-party code will be listed'))p.textContent='Interface uses Inter, browser Web APIs, and OpenStreetMap data through Photon for optional address suggestions. See the Privacy Policy for the services involved.'}}
const subscriptions=$('subscriptionList'),refresh=$('refreshAllSubscriptions');
if(refresh){refresh.addEventListener('click',()=>{requestAnimationFrame(()=>{const count=subscriptions?.querySelectorAll('[data-refresh]').length||0;refresh.textContent=count?'Refresh requested ✓':'No subscriptions';setTimeout(()=>refresh.textContent='Refresh',2000)})})}
const setup={
 google:{title:'Google Calendar setup',steps:['Open Google Calendar on a desktop browser.','Go to Settings → Settings for my calendars.','Select the calendar, then open Integrate calendar.','Copy Secret address in iCal format. Treat it like a password.','Return to Daylight and select Add subscription.']},
 outlook:{title:'Outlook calendar setup',steps:['Open Outlook calendar in a browser.','Go to Settings → Calendar → Shared calendars.','Under Publish a calendar, choose a calendar and permissions.','Copy the ICS link if your account permits publishing.','Paste the URL in Daylight’s subscription dialog.']},
 apple:{title:'Apple Calendar setup',steps:['Open the Calendar app or iCloud Calendar.','Choose a calendar and enable Public Calendar sharing.','Copy the webcal link. Public sharing may expose event details.','Paste the link into Daylight’s subscription dialog.']},
 caldav:{title:'CalDAV connection status',steps:['Authenticated two-way CalDAV synchronization is not connected.','Daylight does not request or store CalDAV credentials.','Import an .ics file for now, or try a public calendar subscription.']}
};
const info=document.createElement('dialog');info.id='providerHelp';info.className='dialog provider-help';info.innerHTML='<div class="dialoghead"><h2 id="providerHelpTitle">Setup instructions</h2><button type="button" id="providerHelpClose" class="close" aria-label="Close">×</button></div><ol id="providerHelpSteps"></ol><p class="provider-help-note">Calendar feeds are read-only; authenticated Google, Microsoft, and CalDAV account sync is not connected.</p><div class="dialogactions"><button type="button" class="outline" id="providerHelpDone">Done</button><button type="button" class="primary" id="providerHelpSubscribe">Add subscription</button></div>';document.body.append(info);
function close(){info.close()}$('providerHelpClose').onclick=close;$('providerHelpDone').onclick=close;
$('providerHelpSubscribe').onclick=()=>{close();$('openSubscribe')?.click()};
document.querySelectorAll('[data-provider]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const key=b.dataset.provider,details=setup[key]||setup.caldav;$('providerHelpTitle').textContent=details.title;$('providerHelpSteps').replaceChildren();for(const step of details.steps){const li=document.createElement('li');li.textContent=step;$('providerHelpSteps').append(li)}$('providerHelpSubscribe').hidden=key==='caldav';info.showModal()},true));
const detail=$('detailDialog'),footer=detail?.querySelector('.event-sheet-footer');
if(detail&&footer){
 const deleteAction=document.createElement('button');deleteAction.id='detailDelete';deleteAction.type='button';deleteAction.className='outline';deleteAction.textContent='Delete';footer.append(deleteAction);
 const readOnly=document.createElement('p');readOnly.id='readOnlyExplanation';readOnly.className='read-only-explanation';readOnly.textContent='From a subscribed calendar — switch it off in the sidebar to hide it.';footer.before(readOnly);
 const update=()=>{const editable=!$('detailEdit').hidden;deleteAction.hidden=!editable;readOnly.hidden=editable;};
 new MutationObserver(update).observe($('detailEdit'),{attributes:true,attributeFilter:['hidden']});update();
 deleteAction.onclick=()=>{$('detailEdit').click();setTimeout(()=>{if($('eventDialog').open)$('deleteEvent').click()},0)}
}
const countLabel=$('miniLegend');if(countLabel)countLabel.textContent='● Dates with events';
const addMenu=$('addCalendarMenu'),options=$('calendarAddOptions');
if(addMenu&&options){const open=addMenu.onclick;addMenu.onclick=e=>{open?.(e);if(!options.hidden){const bb=addMenu.getBoundingClientRect();options.style.left='0';options.style.right='auto';options.style.width='228px';const sidebar=addMenu.closest('.sidebar').getBoundingClientRect();if(bb.right+228>sidebar.right)options.style.left='auto',options.style.right='0'}}}
})();
