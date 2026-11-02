(()=>{'use strict';
const $=id=>document.getElementById(id),root=document.documentElement;
const PRESETS={graphite:'Graphite','#3B82F6':'Blue','#8B7CFF':'Violet','#34C759':'Green','#F5A623':'Amber','#FF6B9D':'Pink','#FF453A':'Red'};
const valid=s=>/^#[0-9a-f]{6}$/i.test(String(s||''));
const luminance=hex=>{const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4));return .2126*r+.7152*g+.0722*b};
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
function apply(value,persist=true){const hex=valid(value)?value.toUpperCase():null,chosen=hex||'graphite';root.dataset.accent=hex?'custom':'graphite';
root.style.setProperty('--accent',hex||'var(--primary)');root.style.setProperty('--on-accent',hex?(luminance(hex)>.179?'#0A0A0A':'#FFFFFF'):'var(--on-primary)');
if(persist)localStorage.setItem('daylight-accent',chosen);
for(const b of document.querySelectorAll('[data-accent-choice]')){const color=b.dataset.accentChoice;b.style.setProperty('--swatch',color==='graphite'?'var(--primary)':color);b.setAttribute('aria-pressed',String(color.toUpperCase()===chosen.toUpperCase()))}
$('accentNative').value=hex||'#3B82F6';$('accentHex').value=hex||'';const custom=$('accentNative')?.closest('.custom-accent-row')?.querySelector('.custom-accent-trigger')||document.querySelector('.custom-accent-trigger');if(custom)custom.style.setProperty('background-color',hex||'var(--primary)','important');$('accentError').hidden=true;
const bg=root.dataset.theme==='light'?'#FFFFFF':'#0A0A0A',warn=$('accentContrast'),low=hex&&ratio(hex,bg)<4.5;warn.hidden=!low;warn.textContent=low?'This may be hard to read in '+(root.dataset.theme==='light'?'Daylight':'Midnight')+'.':''}
for(const button of document.querySelectorAll('[data-accent-choice]'))button.addEventListener('click',()=>apply(button.dataset.accentChoice));
$('accentNative').addEventListener('input',e=>apply(e.target.value));
$('accentHex').addEventListener('input',e=>{const v=e.target.value.trim();if(valid(v))apply(v);else $('accentError').hidden=!v});
const old=window.DaylightUI?.themeChanged;
window.DaylightUI.themeChanged=(mode,actual)=>{old?.(mode,actual);apply(localStorage.getItem('daylight-accent')||'graphite',false)};
apply(localStorage.getItem('daylight-accent')||'graphite',false);
window.DaylightAccent={apply,presets:PRESETS};
})();
