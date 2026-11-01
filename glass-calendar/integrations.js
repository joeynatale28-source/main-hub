/* Daylight integrations: disclosure-first provider setup; no fake OAuth. */
(() => {
const $=id=>document.getElementById(id);
function openIntegrations(){window.DaylightBridge?.openIntegrations?.()}
$('integrationSubscribe')?.addEventListener('click',()=>{$('openSubscribe')?.click()});
const details={
google:'Google Calendar: open Google Calendar on a desktop browser → Settings → Settings for my calendars → Integrate calendar → copy the secret iCal address. Paste it into Add subscription. Keep the private link secret: anyone with it may be able to view that calendar. This is a read-only feed, not account sync.',
outlook:'Outlook: look in Settings → Calendar → Shared calendars → Publish a calendar, if available for your account. Copy the ICS link and add it through Add subscription. Some managed accounts disable publishing. This is read-only, not Microsoft account sync.',
apple:'Apple Calendar/iCloud: share a calendar publicly, copy its subscription link, then paste it into Add subscription. Public sharing may expose calendar details to anyone with the link; avoid sharing sensitive events. Private iCloud CalDAV is not connected.',
caldav:'CalDAV is planned, not live. Daylight does not ask for or store a CalDAV password. For now, use an .ics file or a compatible public subscription.'
};
document.querySelectorAll('[data-provider]').forEach(button=>button.addEventListener('click',()=>{
 const key=button.dataset.provider;
 if(key==='caldav'){window.alert(details[key]);return}
 if(window.confirm(details[key]+'\n\nOpen the subscription dialog now?'))$('openSubscribe')?.click();
}));
function mirror(){
 const source=$('subscriptionList'),target=$('integrationsSubscriptions');
 if(!target||!source)return;
 target.innerHTML=source.innerHTML || '<p class="muted">No external feeds added yet.</p>';
 target.querySelectorAll('[data-refresh]').forEach(b=>b.addEventListener('click',()=>source.querySelector('[data-refresh="'+CSS.escape(b.dataset.refresh)+'"]')?.click()));
 target.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>source.querySelector('[data-remove="'+CSS.escape(b.dataset.remove)+'"]')?.click()));
}
const source=$('subscriptionList');if(source){new MutationObserver(mirror).observe(source,{childList:true,subtree:true});mirror()}
})();