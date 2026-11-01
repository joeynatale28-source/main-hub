(()=>{'use strict';
const THEMES={
halloween:{keywords:['halloween','pumpkin','costume','trick or treat'],icon:'pumpkin',tint:'#ED914E'},
christmas:{keywords:['christmas','santa','xmas'],icon:'tree',tint:'#38A875'},
thanksgiving:{keywords:['thanksgiving','turkey'],icon:'leaf',tint:'#C29253'},
birthday:{keywords:['birthday','bday'],icon:'cake',tint:'#F081AD'},
valentine:{keywords:['valentine','date night'],icon:'heart',tint:'#E46C86'},
easter:{keywords:['easter','egg hunt'],icon:'egg',tint:'#A89BE2'},
independence:{keywords:['independence','4th of july','fourth of july','fireworks'],icon:'flag',tint:'#6888C8'},
patrick:{keywords:['st. patrick','shamrock'],icon:'clover',tint:'#49A775'},
newyear:{keywords:['new year','nye','party','celebration'],icon:'sparkles',tint:'#D4AF5E'},
graduation:{keywords:['graduation','graduate'],icon:'cap',tint:'#9FAEC1'},
wedding:{keywords:['wedding','anniversary'],icon:'rings',tint:'#D59AAA'},
travel:{keywords:['flight','trip','vacation','travel'],icon:'plane',tint:'#75AED9'},
fitness:{keywords:['gym','workout','run','swim'],icon:'activity',tint:'#9BCB64'},
medical:{keywords:['dentist','doctor','appointment'],icon:'cross',tint:'#91A9BD'},
meeting:{keywords:['meeting','call','interview'],icon:'briefcase',tint:'#9A9A9A'}
};
const PATH={
pumpkin:'<path d="M12 5c-2-1-3-1-5 1C3 6 2 9 3 13c1 5 4 8 9 8s8-3 9-8c1-4 0-7-4-7-2-2-3-2-5-1Zm0 0c0-2 1-3 2-3M8 6c-2 4-2 10 0 13m8-13c2 4 2 10 0 13"/>',
tree:'<path d="m12 2-6 8h3l-5 7h16l-5-7h3L12 2Zm0 15v5"/>',
leaf:'<path d="M21 3C9 3 4 7 4 14a6 6 0 0 0 6 6c9 0 11-7 11-17ZM5 21c3-4 7-8 13-11"/>',
cake:'<path d="M4 11h16v10H4zM4 15h16M8 5v6m4-6v6m4-6v6M8 2v1m4-1v1m4-1v1"/>',
heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
egg:'<path d="M12 2C8 2 5 9 5 14a7 7 0 0 0 14 0c0-5-3-12-7-12ZM6 11c4 2 8 2 12 0m-12 5c4-2 8-2 12 0"/>',
flag:'<path d="M5 22V3m0 1c5-2 9 2 14 0v11c-5 2-9-2-14 0"/>',
clover:'<path d="M12 11C4 7 6 2 9 2c2 0 3 2 3 4 0-4 3-5 5-4 4 3 1 7-4 9 5-1 8 3 6 6s-5 2-7-1c-2 3-5 4-7 1s1-7 7-6Zm0 5v6"/>',
sparkles:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>',
cap:'<path d="m2 9 10-5 10 5-10 5-10-5Zm4 3v5c4 3 8 3 12 0v-5m4-3v9"/>',
rings:'<circle cx="9" cy="13" r="6"/><circle cx="15" cy="13" r="6"/><path d="m15 7 2-3 2 3"/>',
plane:'<path d="m22 2-7 20-4-9-9-4 20-7ZM11 13l5-5"/>',
activity:'<path d="M2 12h4l3-7 5 14 3-7h5"/>',
cross:'<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z"/>',
briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M3 13h18"/>'};
const icon=t=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+(PATH[t?.icon]||PATH.sparkles)+'</svg>';
function titleTheme(value){const text=String(value||'').toLowerCase();let selected=null;for(const t of Object.values(THEMES)){for(const key of t.keywords){let pos=text.indexOf(key);while(pos>=0){const before=pos===0||!/[\p{L}\p{N}]/u.test(text[pos-1]);const end=pos+key.length;const after=end>=text.length||!/[\p{L}\p{N}]/u.test(text[end]);if(before&&after&&(!selected||pos<selected.pos))selected={pos,theme:t};pos=text.indexOf(key,pos+1)}}}return selected?.theme||null}
function easter(year){const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k+7*7)%7,m=Math.floor((a+11*h+22*l)/451),z=h+l-7*m+114;return[Math.floor(z/31),z%31+1]}
function holidayAt(value){const x=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value||'');if(!x)return null;const y=+x[1],m=+x[2],d=+x[3],dates={'1-1':['New Year’s Day','newyear'],'2-14':['Valentine’s Day','valentine'],'3-17':['St. Patrick’s Day','patrick'],'7-4':['Independence Day','independence'],'10-31':['Halloween','halloween'],'12-24':['Christmas Eve','christmas'],'12-25':['Christmas Day','christmas'],'12-31':['New Year’s Eve','newyear']};let item=dates[m+'-'+d];if(!item){const ed=easter(y);if(m===ed[0]&&d===ed[1])item=['Easter','easter'];else if(m===11&&new Date(y,10,d).getDay()===4&&Math.floor((d-1)/7)===3)item=['Thanksgiving Day','thanksgiving']}return item?{name:item[0],theme:THEMES[item[1]]}:null}
function render(){if(!window.DaylightWizard)return;const title=window.DaylightWizard.title(),date=window.DaylightWizard.getDate(),holiday=holidayAt(date),theme=titleTheme(title)||holiday?.theme||null,mark=document.getElementById('wizardThemeIcon'),dialog=document.getElementById('eventDialog');if(!mark)return;
if(theme){mark.innerHTML=icon(theme);mark.style.setProperty('--wizard-tint',theme.tint);dialog.style.setProperty('--wizard-tint',theme.tint);mark.hidden=false}else{mark.hidden=true;dialog.style.removeProperty('--wizard-tint')}
window.DaylightWizard.showHoliday(holiday?.name||null,holiday?.theme||null)}
window.DaylightOccasion={THEMES,icon,render,holidayAt,titleTheme};
new MutationObserver(()=>{if(document.getElementById('eventDialog')?.open&&window.DaylightWizard?.getStep()===1)render()}).observe(document.getElementById('startDatePicker'),{childList:true,characterData:true,subtree:true});
})();
