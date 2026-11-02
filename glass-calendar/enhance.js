/* Daylight interface enhancements. Local-first, no new external services. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const bridge=()=>window.DaylightBridge;
const todayISO=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const dayDate=s=>new Date((s||todayISO())+'T12:00:00');
const asISO=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const formatDate=s=>dayDate(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const formatTime=t=>{const [h,m]=(t||'09:00').split(':').map(Number);return (h%12||12)+':'+String(m||0).padStart(2,'0')+(h<12?' AM':' PM')};
const parseTime=s=>{if(/^\d\d:\d\d$/.test(s))return s;const match=s.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);if(!match)return null;let h=+match[1],m=+(match[2]||0);if(h>23||m>59)return null;if(match[3]){if(h<1||h>12)return null;h=(h%12)+(match[3].toLowerCase()==='pm'?12:0)}return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const savedTheme=()=>localStorage.getItem('daylight-theme')||'dark';
const icons={
 moon:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z"/></svg>',
 sun:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
 system:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8m-4-4v4"/></svg>'};
const switchElement=input=>{if(input.type!=='checkbox')return;input.classList.add('daylight-switch');input.setAttribute('role','switch');input.setAttribute('aria-checked',String(input.checked));input.addEventListener('change',()=>input.setAttribute('aria-checked',String(input.checked)))};
document.querySelectorAll('input[type=checkbox]').forEach(switchElement);
new MutationObserver(()=>document.querySelectorAll('input[type=checkbox]:not(.daylight-switch)').forEach(switchElement)).observe(document.body,{childList:true,subtree:true});
// Native selects remain the accessible data model, but are never visually rendered.
const selectUI=new WeakMap();let activeMenu=null;
function closeSelect(){if(activeMenu){activeMenu.remove();activeMenu=null}document.querySelectorAll('.select-button[aria-expanded=true]').forEach(b=>b.setAttribute('aria-expanded','false'))}
function updateSelect(select){const ref=selectUI.get(select);if(!ref)return;const option=select.selectedOptions[0];ref.textContent=option?.textContent||'Select';ref.disabled=select.disabled}window.DaylightSyncSelect=updateSelect;
function enhanceSelect(select){
 if(selectUI.has(select)||select.hidden||select.closest('.legacy-event-fields')||select.id==='pageThemeSelect'||select.id==='viewSelect')return;
 select.classList.add('native-select-accessible');
 const button=document.createElement('button');button.type='button';button.className='select-button';button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label',select.getAttribute('aria-label')||'Select '+(select.closest('label')?.textContent||'option').trim().slice(0,40));
 select.after(button);selectUI.set(select,button);updateSelect(select);
 button.addEventListener('click',e=>{e.preventDefault();if(button.disabled)return;if(activeMenu&&activeMenu.dataset.owner===select.id){closeSelect();return}closeSelect();const menu=document.createElement('div');menu.className='select-menu';menu.setAttribute('role','listbox');menu.dataset.owner=select.id||'unnamed';const rect=button.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(rect.left,innerWidth-rect.width-8))+'px';menu.style.minWidth=Math.max(190,rect.width)+'px';menu.style.maxHeight='min(310px, 55vh)';
 for(const option of select.options){const item=document.createElement('button');item.type='button';item.className='select-option';item.role='option';item.setAttribute('aria-selected',String(option.selected));item.disabled=option.disabled;item.innerHTML='<span>'+esc(option.textContent)+'</span>'+(option.selected?'<span class="option-check">✓</span>':'');item.addEventListener('click',()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));updateSelect(select);closeSelect()});menu.appendChild(item)}
 (select.closest('dialog[open]')||document.body).appendChild(menu);activeMenu=menu;const desiredTop=rect.bottom+5;menu.style.top=(desiredTop+Math.min(menu.scrollHeight,310)>innerHeight?Math.max(8,rect.top-Math.min(menu.scrollHeight,310)-5):desiredTop)+'px';button.setAttribute('aria-expanded','true')});
 select.addEventListener('change',()=>updateSelect(select));new MutationObserver(()=>updateSelect(select)).observe(select,{childList:true,attributes:true,subtree:true});
}
document.querySelectorAll('select').forEach(enhanceSelect);
document.addEventListener('pointerdown',e=>{if(activeMenu&&!activeMenu.contains(e.target)&&!e.target.closest('.select-button'))closeSelect()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSelect()});

// Event editing: custom date and 15-minute time pickers.
const fields={startDate:todayISO(),startTime:'09:00',endDate:todayISO(),endTime:'10:00'};
let picker=null;
const overlay=$('pickerOverlay'),panel=$('pickerPanel');$('eventDialog').appendChild(overlay);
function closePicker(){overlay.hidden=true;panel.replaceChildren();picker=null}
function showPicker(button,kind,part){
 if(picker&&picker.button===button){closePicker();return}
 closePicker();picker={button,kind,part,display:dayDate(fields[part+'Date'])};
 button.closest('.event-date-group')?.appendChild(overlay);
 overlay.hidden=false;renderPicker();
}
const stepTime=(d,t,delta)=>{const x=new Date(d+'T'+t+':00');x.setMinutes(x.getMinutes()+delta);return{date:asISO(x),time:String(x.getHours()).padStart(2,'0')+':'+String(x.getMinutes()).padStart(2,'0')}};
function adjustEnd(delta=60){const value=stepTime(fields.startDate,fields.startTime,delta);fields.endDate=value.date;fields.endTime=value.time;syncEventFields()}
function syncEventFields(){
 $('eventDate').value=fields.startDate;$('eventTime').value=fields.startTime;
 $('startDatePicker').textContent=formatDate(fields.startDate);$('endDatePicker').textContent=formatDate(fields.endDate);
 $('startTimePicker').textContent=formatTime(fields.startTime);$('endTimePicker').textContent=formatTime(fields.endTime);
 const all=$('eventAllDay').checked;
 document.querySelectorAll('[data-time-picker]').forEach(b=>b.hidden=all);
 document.querySelector('.event-duration-chips').hidden=all;
 $('eventDuration').disabled=all;$('eventTime').disabled=all;
 const duration=Math.round((new Date(fields.endDate+'T'+fields.endTime)-new Date(fields.startDate+'T'+fields.startTime))/60000);
 document.querySelectorAll('[data-duration]').forEach(btn=>btn.classList.toggle('selected',duration===Number(btn.dataset.duration)&&!all));
 if(duration>0){const option=[...$('eventDuration').options].find(o=>+o.value===duration);if(option)$('eventDuration').value=String(duration)}
}
function renderPicker(){
 if(!picker)return;
 const {kind,part}=picker;
 if(kind==='date'){
  const month=picker.display,year=month.getFullYear(),m=month.getMonth(),first=new Date(year,m,1),start=new Date(year,m,1-first.getDay());
  panel.innerHTML='<div class="picker-header"><button type="button" data-picker-shift="-1" aria-label="Previous month">‹</button><strong>'+month.toLocaleDateString('en-US',{month:'long',year:'numeric'})+'</strong><button type="button" data-picker-shift="1" aria-label="Next month">›</button></div><div class="picker-date-grid">'+['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=>'<span class="picker-weekday">'+d+'</span>').join('')+Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);const val=asISO(d);return '<button type="button" class="picker-day'+(d.getMonth()!==m?' outside':'')+(val===todayISO()?' today':'')+(val===fields[part+'Date']?' selected':'')+'" data-picker-date="'+val+'">'+d.getDate()+'</button>'}).join('')+'</div>';
  panel.querySelectorAll('[data-picker-shift]').forEach(b=>b.onclick=()=>{picker.display=new Date(year,m+ +b.dataset.pickerShift,1);renderPicker()});
  panel.querySelectorAll('[data-picker-date]').forEach(b=>b.onclick=()=>{fields[part+'Date']=b.dataset.pickerDate;if(part==='start'&&fields.endDate<fields.startDate)adjustEnd();syncEventFields();closePicker()});
 }else{
  panel.innerHTML='<label class="picker-type-label">Enter time<input id="pickerTimeInput" type="text" inputmode="text" value="'+formatTime(fields[part+'Time'])+'" placeholder="e.g. 9:15 AM"></label><div class="time-option-list">'+Array.from({length:96},(_,i)=>{const h=Math.floor(i/4),m=(i%4)*15,v=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');return '<button type="button" class="time-option'+(v===fields[part+'Time']?' selected':'')+'" data-picker-time="'+v+'">'+formatTime(v)+'</button>'}).join('')+'</div>';
  const input=$('pickerTimeInput');const apply=v=>{fields[part+'Time']=v;if(part==='start')adjustEnd();syncEventFields();closePicker()};
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const v=parseTime(input.value);if(v)apply(v);else input.setCustomValidity('Enter a valid time');input.reportValidity()}});
  panel.querySelectorAll('[data-picker-time]').forEach(b=>b.onclick=()=>apply(b.dataset.pickerTime));
  setTimeout(()=>panel.querySelector('.time-option.selected')?.scrollIntoView({block:'center'}),0);
 }
}
for(const part of ['start','end']){for(const kind of ['date','time'])$(part+(kind==='date'?'Date':'Time')+'Picker').onclick=e=>showPicker(e.currentTarget,kind,part)}
overlay.addEventListener('click',e=>{if(e.target===overlay)closePicker()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden){e.stopPropagation();closePicker()}});
$('eventDialog').addEventListener('close',closePicker);
document.querySelectorAll('[data-duration]').forEach(b=>b.onclick=()=>{adjustEnd(+b.dataset.duration);closePicker()});
$('eventAllDay').addEventListener('change',syncEventFields);
$('eventName').addEventListener('input',()=>{const enabled=$('eventName').value.trim().length>0;$('eventSave').disabled=!enabled;$('eventSave').title=enabled?'Save event':'Add a name first'});
function prepareEvent(e,day,time){
 const startDate=e?.date||day||todayISO(),startTime=e?.time||time||'09:00',mins=Math.max(15,Number(e?.duration)||60);
 const inferred=stepTime(startDate,startTime,mins);let endDate=e?.endDate||inferred.date,endTime=e?.endTime||inferred.time;
 if(Date.parse(endDate+'T'+endTime+':00')<=Date.parse(startDate+'T'+startTime+':00')){endDate=inferred.date;endTime=inferred.time}
 Object.assign(fields,{startDate,startTime,endDate,endTime});
 $('eventLocation').value=e?.location||'';$('eventRepeat').value=e?.repeat||'never';$('eventReminder').value=e?.reminder||'none';
 $('eventSave').disabled=!$('eventName').value.trim();$('eventSave').title=$('eventSave').disabled?'Add a name first':'Save event';
 syncEventFields();document.querySelectorAll('select').forEach(updateSelect);
}
function eventFields(){
 const start=Date.parse(fields.startDate+'T'+fields.startTime+':00'),end=Date.parse(fields.endDate+'T'+fields.endTime+':00'),duration=Math.round((end-start)/60000);
 if(!fields.startDate||!fields.endDate||!Number.isFinite(duration))return{error:'Choose valid start and end dates'};
 if(duration<=0)return{error:'End must be after start'};
 return{duration,endDate:fields.endDate,endTime:fields.endTime};
}
// Search results are global across dates, not limited to the displayed week/month.
const searchWrap=$('searchInput').closest('.search-wrap'),results=$('searchResults');
function closeSearch(){searchWrap.hidden=true;results.hidden=true;$('searchButton').setAttribute('aria-expanded','false')}
function searchChanged(query){
 const term=String(query||'').trim().toLowerCase(),hits=bridge()?.getVisibleEvents().filter(e=>(e.title+' '+(e.notes||'')).toLowerCase().includes(term)).slice(0,40)||[];
 results.hidden=!term;
 if(!term){results.innerHTML='';return}
 results.innerHTML=hits.length?hits.map(e=>'<button type="button" class="search-result" data-search-id="'+esc(e.id)+'"><strong>'+esc(e.title)+'</strong><span>'+esc(formatDate(e.date))+(e.holiday||e.allDay?' · All day':' · '+esc(formatTime(e.time)))+'</span></button>').join(''):'<div class="search-empty">No results for &ldquo;'+esc(query)+'&rdquo;</div>';
 results.querySelectorAll('[data-search-id]').forEach(b=>b.onclick=()=>{const e=hits.find(x=>x.id===b.dataset.searchId);if(e){bridge().jumpTo(e);closeSearch()}});

}
function clearSearch(){bridge()?.setSearch('');$('searchInput').value='';results.hidden=true;closeSearch()}
$('searchClear').onclick=clearSearch;
$('searchButton').addEventListener('click',()=>{if(!searchWrap.hidden)searchChanged($('searchInput').value)});
const originalSearchClick=$('searchButton').onclick;
if(originalSearchClick){$('searchButton').onclick=e=>{originalSearchClick(e);if(!searchWrap.hidden)searchChanged($('searchInput').value)}}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.activeElement===$('searchInput')){e.preventDefault();clearSearch()}});
function afterRender(shown){
 document.querySelectorAll('select').forEach(enhanceSelect);
 const legend=$('miniLegend');if(legend)legend.hidden=!document.querySelector('.mini-event-dot');
 // Sync flyout after calendar visibility rerenders.
 const flyout=$('collapsedCalendarList');if(flyout)flyout.innerHTML=$('calendars').innerHTML;
 flyout?.querySelectorAll('[data-calendar]').forEach(box=>box.addEventListener('change',()=>{const original=$('calendars').querySelector('[data-calendar="'+box.dataset.calendar+'"]');if(original){original.checked=box.checked;original.dispatchEvent(new Event('change',{bubbles:true}))}}));
}
function themeChanged(mode,actual){
 const b=$('quickThemeButton');b.innerHTML=icons[mode==='dark'?'moon':mode==='light'?'sun':'system'];b.title='Theme: '+({dark:'Midnight',light:'Daylight',system:'System'}[mode]||'Midnight');b.setAttribute('aria-label','Theme: '+mode+'. Switch theme');
 document.documentElement.dataset.themeReady='1';
 if(document.body.dataset.loaded==='1'){document.documentElement.classList.add('theme-transition');clearTimeout(themeChanged.timeout);themeChanged.timeout=setTimeout(()=>document.documentElement.classList.remove('theme-transition'),270)}
}
$('quickThemeButton').onclick=()=>{const modes=['dark','light','system'],next=modes[(modes.indexOf(savedTheme())+1)%modes.length];$('pageThemeSelect').value=next;$('pageThemeSelect').dispatchEvent(new Event('change',{bubbles:true}))};
themeChanged(savedTheme(),document.documentElement.dataset.theme);
requestAnimationFrame(()=>document.body.dataset.loaded='1');
function syncAvatar(name){const avatar=document.querySelector('.profile .avatar');if(!avatar)return;if(name?.trim())avatar.textContent=name.trim().charAt(0).toUpperCase();else avatar.innerHTML='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>';avatar.setAttribute('aria-label',name?.trim()?'Account '+name:'Guest account')}
syncAvatar(localStorage.getItem('daylight-name')||'');
function detailExtras(e){
 const dialog=$('detailDialog');if(!dialog)return;
 let extra=$('detailExtras');if(!extra){extra=document.createElement('div');extra.id='detailExtras';extra.className='detail-extra';dialog.querySelector('.event-sheet-footer')?.before(extra)}
 if(!extra)return;
 const rows=[];if(e.location)rows.push(['Location',e.location]);if(e.repeat&&e.repeat!=='never')rows.push(['Repeats',e.repeat.charAt(0).toUpperCase()+e.repeat.slice(1)]);if(e.reminder&&e.reminder!=='none')rows.push(['Reminder',({'at-time':'At event time','15m':'15 minutes before','1h':'1 hour before','1d':'1 day before'})[e.reminder]||e.reminder]);
 extra.innerHTML=rows.map(([title,value])=>'<div class="event-meta-row"><div><span class="event-meta-label">'+esc(title)+'</span><p>'+esc(value)+'</p></div></div>').join('');
 extra.hidden=!rows.length
}
// Reminders are best-effort notifications while this page stays open, never background push.
const fired=new Set(),offsets={'at-time':0,'15m':15,'1h':60,'1d':1440};
function checkEventReminders(){
 if(!('Notification' in window)||Notification.permission!=='granted')return;
 const now=Date.now();
 for(const e of bridge()?.getEvents()||[]){
  if(!e.reminder||e.reminder==='none'||e.holiday||e.sourceId)continue;
  const offset=offsets[e.reminder];if(offset===undefined)continue;
  const base=dayDate(e.date),today=dayDate(todayISO()),repeat=e.repeat||'never';
  for(const shift of [-1,0,1,2]){const day=new Date(today);day.setDate(day.getDate()+shift);
   if(day<base)continue;
   const diff=Math.round((Date.UTC(day.getFullYear(),day.getMonth(),day.getDate())-Date.UTC(base.getFullYear(),base.getMonth(),base.getDate()))/86400000);
   const applies=asISO(day)===e.date||repeat==='daily'||repeat==='weekly'&&diff%7===0||repeat==='monthly'&&day.getDate()===base.getDate()||repeat==='yearly'&&day.getDate()===base.getDate()&&day.getMonth()===base.getMonth();
   if(!applies)continue;
   const stamp=asISO(day)+'T'+(e.time||'09:00')+':00',due=new Date(stamp).getTime()-offset*60000,key=e.id+'-'+stamp+'-'+e.reminder;
   if(now>=due&&now-due<60000&&!fired.has(key)){fired.add(key);try{new Notification('Daylight reminder',{body:e.title+(e.location?' · '+e.location:'')})}catch{}}
  }
 }
}
setInterval(checkEventReminders,20000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkEventReminders()});
function nameSaved(){const saved=$('nameSaved');saved.hidden=false;clearTimeout(nameSaved.timer);nameSaved.timer=setTimeout(()=>saved.hidden=true,2000)}
$('settingsBack').onclick=()=>$('profileCalendar').click();$('tasksBack').onclick=()=>$('profileCalendar').click();
// Dedicated Integrations view reuses its original settings form, without showing other panels.
const settingsPage=$('settingsPage');
function openIntegrations(){window.DaylightBridge?.openIntegrations?.()}
function sectionChanged(next){if(next==='settings')document.querySelectorAll('.select-button').forEach(b=>{const parent=b.previousElementSibling;if(parent?.tagName==='SELECT')updateSelect(parent)})}
function openAbout(){window.DaylightBridge?.openSettings?.();requestAnimationFrame(()=>$('settingsAbout').scrollIntoView({block:'start'}))}
$('profileAbout').addEventListener('click',openAbout);
$('footerAbout').addEventListener('click',openAbout);
const footer=$('appFooter'),sidebarBottom=document.querySelector('.sidebar-bottom');if(footer&&sidebarBottom)sidebarBottom.appendChild(footer);
// Account duplicate settings removed; header gear is canonical, About via account dropdown.
$('profileSettings').hidden=true;
$('caldavConnect').onclick=()=>alert('Authenticated CalDAV is not connected in this release. You can use an iCalendar subscription in the meantime; Daylight does not store CalDAV passwords.');
$('refreshAllSubscriptions').onclick=()=>{const buttons=$('subscriptionList')?.querySelectorAll('[data-refresh]')||[];if(!buttons.length){alert('There are no subscribed calendars to refresh yet.');return}buttons.forEach(b=>b.click())};
const toggle=$('collapsedCalendars'),flyout=$('collapsedCalendarFlyout');toggle.hidden=false;toggle.onclick=()=>flyout.hidden=!flyout.hidden;document.addEventListener('pointerdown',e=>{if(!e.target.closest('#collapsedCalendarFlyout')&&!e.target.closest('#collapsedCalendars'))flyout.hidden=true});
// Ensure provider identities have an icon and title in the same 36px-aligned row.
document.querySelectorAll('.provider-card').forEach(card=>{const top=card.querySelector('.provider-top'),brand=top?.querySelector('.provider-brand'),title=card.querySelector('h3');if(!top||!brand||!title)return;const ident=document.createElement('div');ident.className='provider-ident';brand.before(ident);ident.append(brand,title)});
// Browser notifications and calendar-state toggles keep existing native change handlers.
$('addSide').title='New event';
const collapse=$('collapseSidebar');const collapsed=document.querySelector('.app')?.classList.contains('sidebar-collapsed');collapse.title=collapsed?'Expand sidebar':'Collapse sidebar';collapse.setAttribute('aria-label',collapse.title);
window.DaylightUI={prepareEvent,eventFields,afterRender,searchChanged,closeSearch,sectionChanged,themeChanged,syncAvatar,nameSaved,openAbout,detailExtras};
})();