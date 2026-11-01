(()=>{
'use strict';
const $=id=>document.getElementById(id);
function resetScroll(){
 const main=document.querySelector('.main');
 main?.scrollTo({top:0,left:0,behavior:'instant'});
 window.scrollTo({top:0,left:0,behavior:'instant'});
}
['tasksNav','integrationsNav','settingsHeaderButton','settingsBack','tasksBack','profileAbout','footerAbout','profileCalendar','todayBtn'].forEach(id=>$(id)?.addEventListener('click',()=>requestAnimationFrame(resetScroll)));
document.querySelectorAll('[data-view],[data-switch]').forEach(el=>el.addEventListener('click',()=>requestAnimationFrame(resetScroll)));
window.addEventListener('hashchange',()=>requestAnimationFrame(resetScroll));
const loc=$('eventLocation');
if(!loc)return;
const wrap=loc.closest('.wizard-location')||loc.closest('label');
const list=document.createElement('div');
list.id='locationSuggestions';list.className='location-suggestions';list.hidden=true;list.setAttribute('role','listbox');list.setAttribute('aria-label','Address suggestions');
const status=document.createElement('div');
status.id='locationStatus';status.className='location-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
const attribution=document.createElement('p');
attribution.className='location-attribution';
attribution.innerHTML='Search by <a href="https://photon.komoot.io/" rel="noopener noreferrer" target="_blank">Photon</a> · © <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer" target="_blank">OpenStreetMap contributors</a>';
wrap.append(list,status,attribution);
loc.setAttribute('role','combobox');loc.setAttribute('autocomplete','off');loc.setAttribute('aria-autocomplete','list');loc.setAttribute('aria-controls',list.id);loc.setAttribute('aria-expanded','false');
let controller,timer,active=-1;
function close(){list.hidden=true;list.replaceChildren();active=-1;loc.setAttribute('aria-expanded','false');loc.removeAttribute('aria-activedescendant')}
const placeName=p=>[p.name,(p.housenumber&&p.street)?p.housenumber+' '+p.street:p.street,p.city||p.town||p.village,p.state,p.country].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(', ');
async function search(query){
 controller?.abort();controller=new AbortController();status.textContent='Looking up addresses…';close();
 try{
 const response=await fetch('https://photon.komoot.io/api/?q='+encodeURIComponent(query)+'&limit=5&lang=en',{signal:controller.signal,headers:{Accept:'application/json'}});
 if(!response.ok)throw new Error('Unavailable');
 const data=await response.json();if(loc.value.trim()!==query)return;
 const options=(data.features||[]).map(f=>placeName(f.properties||{})).filter(Boolean).slice(0,5);
 if(!options.length){status.textContent='No matches. You can enter a location manually.';return}
 options.forEach((name,i)=>{const b=document.createElement('button');b.type='button';b.className='location-suggestion';b.setAttribute('role','option');b.id='location-result-'+i;b.textContent=name;b.onclick=()=>{loc.value=name;loc.dispatchEvent(new Event('input',{bubbles:true}));close();status.textContent='Address selected';loc.focus()};list.append(b)});
 list.hidden=false;loc.setAttribute('aria-expanded','true');status.textContent='Choose a suggestion or enter your own address.';
 }catch(error){if(error.name!=='AbortError'){close();status.textContent='Search unavailable. You can still type your location.'}}
}
loc.addEventListener('input',()=>{clearTimeout(timer);controller?.abort();close();const v=loc.value.trim();wrap.classList.toggle('has-value',!!v);if(v.length<3){status.textContent=v?'Type at least 3 characters for suggestions.':'';return}status.textContent='Searching…';timer=setTimeout(()=>search(v),500)});
loc.addEventListener('focus',()=>wrap.classList.toggle('has-value',!!loc.value.trim()));
loc.addEventListener('blur',()=>{wrap.classList.toggle('has-value',!!loc.value.trim());setTimeout(()=>{if(!list.matches(':hover'))close()},180)});
loc.addEventListener('keydown',e=>{if(list.hidden)return;const options=[...list.querySelectorAll('button')];if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();active=(active+(e.key==='ArrowDown'?1:-1)+options.length)%options.length;options.forEach((b,i)=>b.setAttribute('aria-selected',String(i===active)));loc.setAttribute('aria-activedescendant',options[active].id)}else if(e.key==='Enter'&&active>=0){e.preventDefault();e.stopImmediatePropagation();options[active].click()}else if(e.key==='Escape')close()});
$('eventDialog')?.addEventListener('close',()=>{controller?.abort();clearTimeout(timer);close();status.textContent='';wrap.classList.remove('has-value')});
})();
