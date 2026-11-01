/* Daylight UI specification — presentation and browser interactions only. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const main=document.querySelector('.main'),sidebar=document.querySelector('.sidebar');
  if(!main||!window.DaylightBridge)return;

  // Treat every workspace section as a sibling view in the fixed main shell.
  const integrations=$('settingsIntegrations');
  const integrationsPage=document.createElement('section');
  integrationsPage.id='integrationsPage';
  integrationsPage.className='integrations-page workspace-view';
  integrationsPage.setAttribute('aria-label','Integrations');
  integrationsPage.innerHTML='<div class="workspace-title"><div><h1>Integrations</h1><p>Bring your calendars together with secure, read-only subscriptions.</p></div></div>';
  integrationsPage.append(integrations);
  $('settingsPage').after(integrationsPage);
  integrationsPage.hidden=location.hash!=='#integrations';
  $('settingsPage').classList.add('workspace-view');
  $('tasksPage').classList.add('workspace-view');
  $('calendarContent').classList.add('workspace-view');
  const title=$('pageTitle'),headerTitle=title?.closest('.toolbar-title');
  const back=document.createElement('button');
  back.id='drillBack';back.type='button';back.className='drill-back';back.hidden=true;
  back.textContent='← Back to Week';
  headerTitle?.prepend(back);
  back.onclick=()=>window.DaylightBridge.backFromDrill();

  // Restore the compact SquareUI navigation instead of the old page links.
  const brand=$('brandToday'),brandName=brand?.querySelector('.brand-name');
  if(brandName){
    const subtitle=document.createElement('small');subtitle.textContent='Personal calendar';subtitle.className='brand-subtitle';brandName.after(subtitle);
    brand.onclick=()=>{window.DaylightBridge.changeView(localStorage.getItem('daylight-default-view')||'week');$('todayBtn').click()};
  }
  const collapse=$('collapseSidebar');
  if(collapse)collapse.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m9 6 6 6-6 6"/></svg>';
  const navigation=$('tasksNav');
  const makeNav=(id,label,path)=>{
    const button=document.createElement('button');button.type='button';button.id=id;button.className='nav support-nav';
    button.innerHTML='<span class="nav-glyph"><svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg></span><span class="nav-label">'+label+'</span>';
    button.title=label;button.setAttribute('aria-label',label);
    return button;
  };
  const settingsNav=makeNav('settingsNav','Settings','<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l-1.8 1.8a1.8 1.8 0 0 0-2-.4l-1 .5-.2 2.1h-3.6l-.2-2.1-1-.5a1.8 1.8 0 0 0-2 .4L6.2 17a1.8 1.8 0 0 0 .4-2l-.5-1L4 13.8v-3.6l2.1-.2.5-1a1.8 1.8 0 0 0-.4-2L8 5.2a1.8 1.8 0 0 0 2 .4l1-.5.2-2.1h3.6l.2 2.1 1 .5a1.8 1.8 0 0 0 2-.4L19.8 7a1.8 1.8 0 0 0-.4 2l.5 1 2.1.2v3.6l-2.1.2z"/>');
  const aboutNav=makeNav('aboutNav','About','<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8v.5"/>');
  const middle=sidebar.querySelector('.sidebar-middle'),label=document.createElement('div');
  label.className='navlabel support-label';label.textContent='SUPPORT';
  middle.append(label,settingsNav,aboutNav);
  settingsNav.onclick=()=>window.DaylightBridge.openSettings();
  aboutNav.onclick=()=>{window.DaylightBridge.openSettings();requestAnimationFrame(()=>$('settingsAbout').scrollIntoView({block:'start'}))};
  const calendarNav=sidebar.querySelector('.nav[data-view="month"]');
  if(calendarNav){calendarNav.onclick=()=>window.DaylightBridge.changeView(localStorage.getItem('daylight-default-view')||'week');calendarNav.setAttribute('aria-label','Calendar')}
  navigation?.setAttribute('aria-label','Tasks');

  // Settings: fixed-order sections, one navigation/search column, no integrations subpage.
  const settingsNavList=document.querySelector('.settings-sections');
  const search=document.createElement('input');
  search.id='settingsSearch';search.type='search';search.placeholder='Search settings';search.setAttribute('aria-label','Search settings');
  settingsNavList?.prepend(search);
  search.oninput=()=>{
    const q=search.value.trim().toLowerCase();
    document.querySelectorAll('.settings-anchor').forEach(button=>{
      const section=$(button.dataset.target);
      button.hidden=!!q&&!((button.textContent||'')+' '+(section?.textContent||'')).toLowerCase().includes(q);
    });
  };
  $('settingsCalendar').querySelector('h2').textContent='Calendar';
  const startOfWeek=$('weekStartSelect')?.closest('.setting-item');
  $('settingsCalendar').append(startOfWeek);
  const defaultTitle=$('defaultViewSelect').closest('.setting-item').querySelector('strong');
  defaultTitle.textContent='Default Calendar View';
  const viewSelect=$('defaultViewSelect');
  [...viewSelect.options].sort((a,b)=>['day','week','month','agenda'].indexOf(a.value)-['day','week','month','agenda'].indexOf(b.value)).forEach(o=>viewSelect.append(o));
  const integrationLink=document.createElement('div');
  integrationLink.className='setting-item integration-jump';
  integrationLink.innerHTML='<div><strong>Integrations</strong><small>Manage connected calendars and available providers.</small></div><button type="button" class="outline" id="openIntegrationView">Manage connected calendars →</button>';
  $('settingsData').append(integrationLink);
  $('openIntegrationView').onclick=()=>window.DaylightBridge.openIntegrations();
  document.querySelector('.settings-anchor[data-target="settingsIntegrations"]')?.remove();
  $('settingsData').querySelector('.setting-item:has(#caldavConnect)')?.remove();
  [...$('settingsData').querySelectorAll('.setting-item')].find(x=>x.textContent.includes('Local storage'))?.remove();

  const motionRow=document.createElement('div');
  motionRow.className='setting-item';
  motionRow.innerHTML='<div><strong>Reduce motion</strong><small>Minimize transitions, sliding and pulsing effects.</small></div><label class="switch-label"><input id="reduceMotion" type="checkbox" role="switch" aria-label="Reduce motion"> Enabled</label>';
  $('settingsAppearance').append(motionRow);
  const motion=$('reduceMotion');
  const setMotion=()=>{document.documentElement.dataset.reduceMotion=motion.checked?'true':'false';motion.setAttribute('aria-checked',String(motion.checked));localStorage.setItem('daylight-reduce-motion',motion.checked?'on':'off')};
  motion.checked=localStorage.getItem('daylight-reduce-motion')==='on';setMotion();motion.onchange=setMotion;
  motion.classList.add('daylight-switch');
  document.querySelector('.settings-anchor[data-target="settingsCalendar"]').textContent='Calendar';
  const taskSave=$('taskForm')?.querySelector('button[type=submit]');
  if(taskSave){taskSave.classList.remove('outline');taskSave.classList.add('primary');taskSave.textContent='Save task'}
  const notificationButton=$('enableNotifications');
  const updatePermission=()=>{if(!notificationButton)return;notificationButton.textContent=!('Notification' in window)?'Unavailable':Notification.permission==='granted'?'Enabled ✓':Notification.permission==='denied'?'Blocked':'Enable';notificationButton.disabled=!('Notification' in window)||Notification.permission==='granted'};
  updatePermission();notificationButton?.addEventListener('click',()=>setTimeout(updatePermission,250));

  // Native selects remain the source of truth, including when options are replaced.
  const syncSelects=()=>document.querySelectorAll('select').forEach(s=>window.DaylightSyncSelect?.(s));
  document.querySelectorAll('.settings-anchor').forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(syncSelects)));
  syncSelects();

  // A single icon-rail tooltip, kept outside clipped sidebar containers.
  const tip=document.createElement('div');tip.id='railTooltip';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.append(tip);
  let tipTimer=0;
  const hideTip=()=>{clearTimeout(tipTimer);tip.hidden=true};
  sidebar.addEventListener('pointerover',e=>{
    const button=e.target.closest('button, .nav');
    hideTip();if(!button||!document.querySelector('.app').classList.contains('sidebar-collapsed'))return;
    tipTimer=setTimeout(()=>{
      if(!document.querySelector('.app').classList.contains('sidebar-collapsed'))return;
      const rect=button.getBoundingClientRect();tip.textContent=button.getAttribute('aria-label')||button.title||'';
      if(!tip.textContent)return;tip.hidden=false;tip.style.left=(rect.right+12)+'px';tip.style.top=(rect.top+Math.max(0,(rect.height-30)/2))+'px';
    },300);
  });
  sidebar.addEventListener('pointerout',hideTip);sidebar.addEventListener('scroll',hideTip,true);
  document.addEventListener('pointerdown',hideTip);

  // One active view at a time; view changes animate without covering the sidebar.
  let lastSection=null;
  const views={calendar:$('calendarContent'),tasks:$('tasksPage'),settings:$('settingsPage'),integrations:integrationsPage};
  const findSection=()=>location.hash==='#tasks'?'tasks':location.hash==='#settings'?'settings':location.hash==='#integrations'?'integrations':'calendar';
  const updateActive=()=>{
    const current=findSection();
    calendarNav?.classList.toggle('active',current==='calendar');
    navigation?.classList.toggle('active',current==='tasks');
    $('integrationsNav')?.classList.toggle('active',current==='integrations');
    settingsNav.classList.toggle('active',current==='settings');
    aboutNav.classList.remove('active');
    const to=views[current];
    if(current!==lastSection){
      if(to){to.classList.remove('view-enter');void to.offsetWidth;to.classList.add('view-enter')}
      lastSection=current;
    }
    if(current==='settings')syncSelects();
  };
  window.DaylightBeforeViewChange=(oldSection,newSection)=>{if(oldSection===newSection)return;const from=views[oldSection];if(!from||from.hidden)return;const copy=from.cloneNode(true),rect=from.getBoundingClientRect(),mainRect=main.getBoundingClientRect();copy.id='';copy.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));copy.className='view-ghost';copy.setAttribute('aria-hidden','true');copy.inert=true;copy.style.top=(rect.top-mainRect.top)+'px';copy.style.left=(rect.left-mainRect.left)+'px';copy.style.width=rect.width+'px';copy.style.height=rect.height+'px';main.append(copy);setTimeout(()=>copy.remove(),150)};
  window.DaylightViewChange=updateActive;
  updateActive();
  new MutationObserver(updateActive).observe(main,{subtree:true,attributes:true,attributeFilter:['hidden']});

  // Location autocomplete (Photon/OpenStreetMap). Only the selected full address
  // is included with an event; no new accounts, API keys or persistence services.
  const location=$('eventLocation'),where=location?.closest('.wizard-location');
  if(location&&where){
    const resultList=document.createElement('div');
    resultList.id='addressResults';resultList.className='address-results';resultList.role='listbox';
    resultList.setAttribute('aria-label','Address suggestions');resultList.hidden=true;
    where.append(resultList);
    location.setAttribute('autocomplete','off');location.setAttribute('aria-controls','addressResults');
    let selected=null,results=[],active=-1,previous='',timer=0,request=null;
    const cache=new Map();
    const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;', '"':'&quot;',"'":'&#39;'}[c]));
    const nameOf=p=>p.name||p.street||p.city||'Location';
    const fullOf=p=>[p.name||p.street,p.housenumber,p.postcode,p.city,p.state,p.country].filter(Boolean).join(', ');
    const secondaryOf=p=>[p.city,p.state,p.country].filter(Boolean).join(', ');
    const hide=()=>{resultList.hidden=true;active=-1;location.setAttribute('aria-expanded','false')};
    const highlight=()=>resultList.querySelectorAll('[data-address-index]').forEach((el,i)=>{el.classList.toggle('active',i===active);el.setAttribute('aria-selected',String(i===active))});
    const choose=i=>{const item=results[i];if(!item)return;selected={label:item.label,address:item.address};location.value=item.label;hide();location.dispatchEvent(new Event('change',{bubbles:true}));location.focus()};
    const draw=()=>{
      location.setAttribute('aria-expanded','true');resultList.hidden=false;
      resultList.innerHTML=results.length?results.map((r,i)=>'<button type="button" role="option" class="address-option" data-address-index="'+i+'"><span class="address-pin" aria-hidden="true">⌖</span><span><strong>'+esc(r.label)+'</strong><small>'+esc(r.secondary)+'</small></span></button>').join(''):'<div class="address-empty">No matches — you can still use what you typed.</div>';
      resultList.querySelectorAll('[data-address-index]').forEach(b=>b.addEventListener('click',()=>choose(+b.dataset.addressIndex)));highlight();
    };
    const fetchPlaces=async query=>{
      request?.abort();const signal=(request=new AbortController()).signal;
      const cached=cache.get(query.toLowerCase());
      if(cached){results=cached;active=-1;draw();return}
      resultList.hidden=false;location.setAttribute('aria-expanded','true');
      resultList.innerHTML='<div class="address-skeleton"></div><div class="address-skeleton"></div><div class="address-skeleton"></div>';
      try{
        const res=await fetch('https://photon.komoot.io/api/?q='+encodeURIComponent(query)+'&limit=5&lang=en',{signal});
        if(!res.ok)throw Error('Search unavailable');
        const data=await res.json();if(location.value.trim()!==query)return;
        results=(data.features||[]).slice(0,5).map(f=>{const p=f.properties||{};return{label:nameOf(p),address:fullOf(p),secondary:secondaryOf(p)}});
        cache.set(query.toLowerCase(),results);active=-1;draw();
      }catch(e){if(e.name==='AbortError')return;resultList.innerHTML='<div class="address-empty">Search unavailable — you can still use what you typed.</div>';resultList.hidden=false}
    };
    location.addEventListener('input',()=>{
      clearTimeout(timer);request?.abort();
      if(selected&&location.value!==selected.label)selected=null;
      const q=location.value.trim();previous=q;active=-1;
      if(q.length<3){hide();return}
      timer=setTimeout(()=>fetchPlaces(q),300);
    });
    location.addEventListener('focus',()=>{const q=location.value.trim();if(q.length>=3&&cache.has(q.toLowerCase())){results=cache.get(q.toLowerCase());active=-1;draw()}});
    location.addEventListener('keydown',e=>{
      if(resultList.hidden)return;
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();active=active<0?(e.key==='ArrowDown'?0:Math.max(0,results.length-1)):(active+(e.key==='ArrowDown'?1:-1)+Math.max(1,results.length))%Math.max(1,results.length);highlight()}
      else if(e.key==='Enter'){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(results.length)choose(active<0?0:active);else hide()}
      else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();hide()}
      else if(e.key==='Tab')hide();
    });
    document.addEventListener('pointerdown',e=>{if(!where.contains(e.target))hide()});
    window.DaylightLocationMenuOpen=()=>!resultList.hidden;
    const oldPrepare=window.DaylightUI.prepareEvent;
    window.DaylightUI.prepareEvent=(e,day,time)=>{selected=e?.locationAddress?{label:e.location,address:e.locationAddress}:null;hide();return oldPrepare(e,day,time)};
    const oldFields=window.DaylightUI.eventFields;
    window.DaylightUI.eventFields=()=>({...oldFields(),locationAddress:selected?.address||''});
  }

  // Restore focus after native modal dialogs; native showModal traps focus.
  let lastModalTrigger=null;document.addEventListener('pointerdown',e=>{const control=e.target.closest('button,[role=button],input');if(control)lastModalTrigger=control},true);
  for(const dialog of document.querySelectorAll('dialog')){
    let opener=null;
    new MutationObserver(()=>{
      if(dialog.open){opener=lastModalTrigger||document.activeElement;dialog.classList.remove('dialog-enter');void dialog.offsetWidth;dialog.classList.add('dialog-enter')}
      else if(opener?.isConnected&&typeof opener.focus==='function'){opener.focus({preventScroll:true});opener=null}
    }).observe(dialog,{attributes:true,attributeFilter:['open']});
  }
})();