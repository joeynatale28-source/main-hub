// Daylight shared icon system — every visual icon is inline SVG, never a font/Unicode glyph.
const paths={
 brand:'<path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7"/>',
 eye:'<path d="M2.1 12s3.6-6.5 9.9-6.5 9.9 6.5 9.9 6.5-3.6 6.5-9.9 6.5S2.1 12 2.1 12Z"/><circle cx="12" cy="12" r="3"/>',
 'eye-off':'<path d="M3 3l18 18M10.6 5.6A11.6 11.6 0 0 1 12 5.5c6.3 0 9.9 6.5 9.9 6.5a15 15 0 0 1-3.1 3.5M6.2 6.5A15.5 15.5 0 0 0 2.1 12S5.7 18.5 12 18.5c1.5 0 2.8-.4 4-1M10 10a3 3 0 0 0 4 4"/>',
 search:'<circle cx="10.8" cy="10.8" r="7.6"/><path d="m16.5 16.5 5 5"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9 6.3 6.3m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 moon:'<path d="M20.7 13.4A8.6 8.6 0 0 1 10.6 3.3 8.8 8.8 0 1 0 20.7 13.4Z"/>',
 settings:'<path d="m9.6 2.8.5 2a7.8 7.8 0 0 1 3.8 0l.5-2 2.3 1.3-.6 2a8.2 8.2 0 0 1 2.7 2.7l2-.6 1.3 2.3-2 .5a7.8 7.8 0 0 1 0 3.8l2 .5-1.3 2.3-2-.6a8.2 8.2 0 0 1-2.7 2.7l.6 2-2.3 1.3-.5-2a7.8 7.8 0 0 1-3.8 0l-.5 2-2.3-1.3.6-2A8.2 8.2 0 0 1 5.2 17l-2 .6-1.3-2.3 2-.5a7.8 7.8 0 0 1 0-3.8l-2-.5 1.3-2.3 2 .6a8.2 8.2 0 0 1 2.7-2.7l-.6-2Z"/><circle cx="12" cy="12" r="3"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
 plug:'<path d="M9 4v5m6-5v5M7 9h10v3a5 5 0 0 1-10 0V9Zm5 8v5"/>',
 tasks:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m7 12 3 3 7-7"/>',
 info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10h.01"/>',
 'chevron-left':'<path d="m15 18-6-6 6-6"/>',
 'chevron-right':'<path d="m9 18 6-6-6-6"/>',
 'chevron-down':'<path d="m6 9 6 6 6-6"/>',
 'more-vertical':'<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
 'more-horizontal':'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
 pencil:'<path d="m15 5 4 4M4 20l4.5-.8L20 7.7a2.2 2.2 0 0 0-3.1-3.1L5.3 16.3 4 20Z"/>',
 trash:'<path d="M3 6h18M8 6V4h8v2M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
 unlink:'<path d="m14 9 2-2a4 4 0 0 1 5.6 5.6l-2 2M10 15l-2 2a4 4 0 0 1-5.6-5.6l2-2M8 12h8M3 3l18 18"/>',
 palette:'<path d="M12 2a10 10 0 1 0 0 20c1.6 0 2.4-1 2.4-2.1 0-1-.6-1.5-.6-2.3 0-1 .9-1.6 2-1.6H19a3 3 0 0 0 3-3A10 10 0 0 0 12 2Z"/><circle cx="7" cy="12" r=".8"/><circle cx="9" cy="7" r=".8"/><circle cx="15" cy="7" r=".8"/><circle cx="18" cy="11" r=".8"/>',
 database:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
 sparkles:'<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 13 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
 clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
 'map-pin':'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/>',
 'align-left':'<path d="M4 5h16M4 10h10M4 15h16M4 20h10"/>',
 x:'<path d="M18 6 6 18M6 6l12 12"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 'check-circle':'<circle cx="12" cy="12" r="10"/><path d="m7 12 3 3 7-7"/>',
 'alert-circle':'<circle cx="12" cy="12" r="10"/><path d="M12 7v6m0 4h.01"/>',
 'external-link':'<path d="M14 4h6v6M20 4l-9 9M20 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 refresh:'<path d="M20 6v5h-5M4 18v-5h5M6 9a7 7 0 0 1 12-2l2 4M4 13l2 4a7 7 0 0 0 12-2"/>',
 warning:'<path d="M12 3 1.8 21h20.4L12 3Z"/><path d="M12 10v5m0 3h.01"/>',
 logout:'<path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4m4-4 4-4-4-4m4 4H9"/>',
 'arrow-left':'<path d="m12 19-7-7 7-7M5 12h14"/>',
 'calendar-plus':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-6 6h4m-2-2v4"/>'
};
export function icon(name,size=18){const shape=paths[name]||paths.info;return '<span class="dl-icon-slot'+(size===16?' is-compact':'')+'" aria-hidden="true"><svg class="dl-icon" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+shape+'</svg></span>'}
const setIcon=(element,name,size=18)=>{
 if(!element||element.dataset.dlIcon===name+size)return;
 element.dataset.dlIcon=name+size;element.innerHTML=icon(name,size);
};
const clean=(text)=>String(text||'').trim();
const replaceText=(node)=>{
 const glyphs={'✳':'brand','▦':'calendar','◎':'plug','☑':'tasks','⚙':'settings','♧':'bell','☷':'align-left','⌖':'map-pin','◐':'sun','◷':'clock','⌕':'search','ⓘ':'info','‹':'chevron-left','›':'chevron-right','⋮':'more-vertical','⋯':'more-horizontal','◈':'palette','▤':'database','⌁':'brand','⌄':'chevron-down','▾':'chevron-down','×':'x','✎':'pencil','✓':'check','↗':'external-link'};
 const key=clean(node.nodeValue);
 if(!Object.hasOwn(glyphs,key))return;
 const p=node.parentElement;
 if(!p||p.closest('svg,textarea,script,style'))return;
 const span=document.createElement('span');span.className='dl-inline-icon';span.innerHTML=icon(glyphs[key],p.closest('.mini-head,.settings-nav,.floating-menu')?16:18);
 node.replaceWith(span);
};
function decorateOne(scope){
 const pick=(s,name,size)=>scope.querySelectorAll(s).forEach(el=>setIcon(el,typeof name==='function'?name(el):name,size||18));
 pick('.mark,.logo,.about-mark','brand',18);
 pick('#eye',()=>document.querySelector('#password')?.type==='text'?'eye-off':'eye');
 pick('#searchButton','search');pick('#themeButton',()=>document.documentElement.dataset.theme==='dark'?'sun':'moon');
 pick('#settingsButton,#settings .glyph','settings');pick('#miniPrev,#prev','chevron-left');pick('#miniNext,#next','chevron-right');
 pick('#searchClose,#editorClose','x',16);
 pick('#profileMenu','more-horizontal');pick('#collapseRail',()=>document.querySelector('#root')?.classList.contains('collapsed')?'chevron-right':'chevron-left',16);if(document.querySelector('#root')?.classList.contains('collapsed'))pick('#newEvent','plus',18);pick('[data-menu]','more-vertical',16);
 pick('[data-nav="calendar"] .glyph','calendar');pick('[data-nav="integrations"] .glyph','plug');pick('[data-nav="tasks"] .glyph','tasks');
 pick('#about .glyph','info');pick('#newCalendar','plus',16);
 pick('.settings-nav [data-sec="general"] .glyph','settings');pick('.settings-nav [data-sec="calendar"] .glyph','calendar');
 pick('.settings-nav [data-sec="appearance"] .glyph','palette');pick('.settings-nav [data-sec="data"] .glyph','database');
 pick('.settings-nav [data-sec="notifications"] .glyph','bell');pick('.settings-nav [data-sec="ai"] .glyph','sparkles');
 pick('.settings-nav [data-sec="about"] .glyph','info');
 pick('#locationRow .row-icon','map-pin');pick('#calendarRow .row-icon','calendar');
 pick('.quick-row .row-icon',el=>el.closest('#locationRow')?'map-pin':el.closest('#calendarRow')?'calendar':el.closest('.quick-row')?.querySelector('#quickDescription')?'align-left':el.closest('.quick-row')?.querySelector('#reminderButton')?'bell':'clock');
 pick('.cellplus,.mini-add,[data-add]','plus',16);
 pick('.whole-empty .empty-icon',el=>el.closest('.task-list')?'tasks':'calendar',18);
 scope.querySelectorAll('.floating-menu button').forEach(el=>{
  if(el.dataset.iconDecorated)return;el.dataset.iconDecorated='1';
  const label=clean(el.textContent),low=label.toLowerCase();
  let name=low.startsWith('rename')?'pencil':low.startsWith('hide')?'eye-off':low.startsWith('unhide')?'eye':low.startsWith('delete')?'trash':low.startsWith('remove')?'unlink':low.startsWith('log out')?'logout':null;
  if(name)el.insertAdjacentHTML('afterbegin',icon(name,16));
 });
 scope.querySelectorAll('#toast.show').forEach(el=>{
  if(el.querySelector('.toast-icon'))return;
  const bad=/couldn.t|error|fail|invalid|required|not found|disabled|check your connection/i.test(el.textContent);
  el.insertAdjacentHTML('afterbegin','<span class="toast-icon">'+icon(bad?'alert-circle':'check-circle',16)+'</span>');
 });
 scope.querySelectorAll('.pill-select,.repeat-line').forEach(el=>{
  if(el.querySelector('.dl-caret')||[...el.children].some(x=>x.classList.contains('dl-icon-slot')))return;
  const caret=document.createElement('span');caret.className='dl-caret';caret.innerHTML=icon('chevron-down',16);
  const old=el.querySelector('span:not(.dl-icon-slot)');if(old&&/⌄|▾/.test(old.textContent))old.remove();
  if(/⌄|▾/.test(el.lastChild?.textContent||''))el.lastChild.textContent=el.lastChild.textContent.replace(/[⌄▾]/g,'');
  el.append(caret);
 });
 scope.querySelectorAll('#searchBar').forEach(bar=>{
  if(bar.querySelector('.search-input-icon'))return;
  const input=bar.querySelector('#searchQuery');if(!input)return;
  input.insertAdjacentHTML('beforebegin','<span class="search-input-icon">'+icon('search',16)+'</span>');
 });
 scope.querySelectorAll('.integration-card').forEach(card=>{
  if(card.querySelector('.integration-icon'))return;
  const h3=card.querySelector('h3');if(h3)h3.insertAdjacentHTML('afterbegin','<span class="integration-icon">'+icon('calendar')+'</span>');const link=card.querySelector('.secondary');if(link){const last=link.lastChild;if(last?.nodeType===3)last.textContent=last.textContent.replace(/↗/g,'');if(!link.querySelector('.external-icon'))link.insertAdjacentHTML('beforeend','<span class="external-icon">'+icon('external-link',16)+'</span>')}
 });
 scope.querySelectorAll('.theme-card.picked').forEach(card=>{
  if(!card.querySelector('.theme-check'))card.insertAdjacentHTML('beforeend','<span class="theme-check">'+icon('check',16)+'</span>');
 });
 scope.querySelectorAll('.theme-card:not(.picked) .theme-check').forEach(el=>el.remove());
 scope.querySelectorAll('button').forEach(el=>{
  if(el.dataset.dlIcon||el.matches('.mini-date,.datenum,.weekhead [data-drill],.swatch,.switch,.check,.eventchip,.weekevent,.theme-card,.theme-card *,.monthcell'))return;
  const text=clean(el.textContent);
  const isolated={'‹':'chevron-left','›':'chevron-right','⋮':'more-vertical','⋯':'more-horizontal','×':'x','✓':'check','+':'plus','◉':'eye','⚙':'settings','⌕':'search','◐':document.documentElement.dataset.theme==='dark'?'sun':'moon'};
  if(Object.hasOwn(isolated,text))setIcon(el,isolated[text],el.classList.contains('tiny')?16:18);
 });
 const w=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT),nodes=[];while(w.nextNode())nodes.push(w.currentNode);
 nodes.forEach(replaceText);
}
let busy=false;
export function upgradeIcons(){if(busy)return;busy=true;try{decorateOne(document)}finally{busy=false}}
export function startIcons(){
 upgradeIcons();
 let scheduled=false;
 const observer=new MutationObserver(()=>{
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;upgradeIcons()});
 });
 observer.observe(document.body,{childList:true,subtree:true,characterData:true});
}
