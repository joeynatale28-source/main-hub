export const palette={violet:'#9775e8',green:'#54b98c',amber:'#d5a853',rose:'#d481aa',blue:'#73a8e9',teal:'#4ab8b6',orange:'#df9660',red:'#d87575'};
export const paletteNames=Object.keys(palette);
export const daykey=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const noon=s=>new Date(s+'T12:00:00');
const addDays=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n,d.getHours(),d.getMinutes(),d.getSeconds());
export function colorFor(c){
 const key=(c?.shade||'').toLowerCase(),id=(c?.client_id||'').toLowerCase();
 if(palette[key])return palette[key];
 if(id==='personal')return palette.blue;if(id==='work')return palette.violet;
 if(id==='life')return palette.green;if(id==='us-holidays')return palette.amber;
 const n=Number((key.match(/\d+/)||[])[0]||1);
 return Object.values(palette)[(n-1)%8];
}
export function eventDate(e){
 if(e._civilDate)return e._civilDate;
 if(e.source_subscription_id&&e.all_day)return String(e.starts_at).slice(0,10);
 return daykey(new Date(e.starts_at));
}
function nextDate(base,f,n){
 if(f==='daily')return addDays(base,n);
 if(f==='weekly')return addDays(base,7*n);
 const d=new Date(base);if(f==='monthly'){d.setDate(1);d.setMonth(base.getMonth()+n);d.setDate(Math.min(base.getDate(),new Date(d.getFullYear(),d.getMonth()+1,0).getDate()))}
 else if(f==='yearly'){d.setDate(1);d.setFullYear(base.getFullYear()+n);d.setMonth(base.getMonth());d.setDate(Math.min(base.getDate(),new Date(d.getFullYear(),d.getMonth()+1,0).getDate()))}return d;
}
export function expandEvents(events,from,to){
 const out=[],lower=from.getTime(),upper=to.getTime();
 for(const original of events){
  const start=new Date(original.starts_at),end=new Date(original.ends_at),span=Math.max(60000,end-start);
  if(!Number.isFinite(start.getTime()))continue;
  const r=original.repeat_rule||{},freq=(r.frequency||r.freq||'never').toLowerCase(),native=!original.source_subscription_id&&['daily','weekly','monthly','yearly'].includes(freq);
  const interval=Math.max(1,Math.min(365,Number(r.interval)||1)),count=r.ends==='count'?Math.max(1,Number(r.count)||1):1500;
  const until=r.ends==='on'&&r.until?noon(r.until).getTime()+43200000:Infinity;
  for(let i=0;i<(native?Math.min(1500,count):1)&&out.length<3000;i++){
   const st=native?nextDate(start,freq,i*interval):start;
   if(Array.isArray(original.exdates)&&original.exdates.includes(daykey(st)))continue;
   if(st.getTime()>upper+86400000||st.getTime()>until)break;
   const en=new Date(st.getTime()+span);
   if(en.getTime()<lower-86400000)continue;
   const civil=!native&&original.source_subscription_id&&original.all_day?String(original.starts_at).slice(0,10):daykey(st);
   const lastDay=daykey(new Date(Math.max(st.getTime(),en.getTime()-1)));const days=Math.max(1,Math.round((noon(lastDay)-noon(civil))/86400000)+1);
   for(let j=0;j<Math.min(366,days)&&out.length<3000;j++){
    const key=daykey(addDays(noon(civil),j));
    if(noon(key).getTime()<lower-86400000||noon(key).getTime()>upper+86400000)continue;
    out.push({...original,starts_at:st.toISOString(),ends_at:en.toISOString(),_origin:original,_occurrence:st.toISOString(),_civilDate:key,_segment:j,_segments:days});
   }
  }
 }
 return out.sort((a,b)=>a._civilDate.localeCompare(b._civilDate)||a.starts_at.localeCompare(b.starts_at));
}
export const prettyShort=d=>new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
export const prettyStamp=d=>new Date(d).toLocaleString('en-US',{month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
export const prettyClock=d=>new Date(d).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
export const repeatLabel=r=>{const f=(r?.frequency||r?.freq||'never').toLowerCase();if(f==='never')return '';if(Number(r.interval)<=1)return 'Repeats '+f;const units={daily:'days',weekly:'weeks',monthly:'months',yearly:'years'};return 'Repeats every '+r.interval+' '+(units[f]||f)};
const nth=(y,m,d,n)=>1+((d-new Date(y,m-1,1).getDay()+7)%7)+7*(n-1);
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k+7)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=(h+l-7*m+114)%31+1;return [y,String(mo).padStart(2,'0'),String(da).padStart(2,'0')].join('-')}
export function greeting(first,at=new Date(),holidays=[]){
 const mo=at.getMonth()+1,da=at.getDate(),y=at.getFullYear(),md=[String(mo).padStart(2,'0'),String(da).padStart(2,'0')].join('-'),today=daykey(at);
 const known={'10-31':['Happy Halloween','🎃'],'12-24':['Merry Christmas Eve','🎄'],'12-25':['Merry Christmas','🎄'],'12-31':["Happy New Year's Eve",'🎆'],'01-01':["Happy New Year's Day",'🎆'],'07-04':['Happy Independence Day','🇺🇸'],'02-14':["Happy Valentine's Day",'❤️'],'03-17':["Happy St. Patrick's Day",'🍀']};
 if(mo===11&&da===nth(y,11,4,4))known[md]=['Happy Thanksgiving','🦃'];
 if(today===easter(y))known[md]=['Happy Easter','🐣'];
 const ev=holidays.find(x=>eventDate(x)===today),holiday=known[md]||(ev?['Happy '+ev.title,'✨']:null);
 if(holiday)return holiday[0]+', '+first+'! '+holiday[1];
 const hr=at.getHours();return (hr>=5&&hr<12?'Good morning':hr>=12&&hr<17?'Good afternoon':'Good evening')+', '+first+'! 👋';
}
export function makeDateGrid(trigger,value,onPick,icon,weekStart=0){
 document.querySelector('#calendarDatePicker')?.remove();
 const holder=document.createElement('div');holder.id='calendarDatePicker';holder.className='date-grid-popup';holder.setAttribute('role','dialog');holder.setAttribute('aria-label','Choose date');
 (trigger.closest('dialog[open]')||document.body).append(holder);
 let month=noon(value||daykey(new Date()));
 const render=()=>{
  const first=new Date(month.getFullYear(),month.getMonth(),1,12),offset=(first.getDay()-weekStart+7)%7,start=addDays(first,-offset),today=daykey(new Date());
  holder.innerHTML='<header class="date-grid-heading"><button type="button" data-prev aria-label="Previous month">'+icon('chevron-left',16)+'</button><strong>'+first.toLocaleString('en-US',{month:'long',year:'numeric'})+'</strong><button type="button" data-next aria-label="Next month">'+icon('chevron-right',16)+'</button></header><div class="date-grid-days">'+Array.from({length:7},(_,i)=>'<span>'+['S','M','T','W','T','F','S'][(i+weekStart)%7]+'</span>').join('')+Array.from({length:42},(_,i)=>{const d=addDays(start,i),v=daykey(d);return '<button type="button" data-date-choice="'+v+'" class="'+(d.getMonth()!==first.getMonth()?'outside ':'')+(v===today?'today ':'')+(v===value?'selected':'')+'">'+d.getDate()+'</button>'}).join('')+'</div>';
  holder.querySelector('[data-prev]').onclick=()=>{month=new Date(first.getFullYear(),first.getMonth()-1,1,12);render()};
  holder.querySelector('[data-next]').onclick=()=>{month=new Date(first.getFullYear(),first.getMonth()+1,1,12);render()};
  holder.querySelectorAll('[data-date-choice]').forEach(b=>b.onclick=()=>{const v=b.dataset.dateChoice;holder.remove();onPick(v)});
 };
 render();
 const rect=trigger.getBoundingClientRect();holder.style.left=Math.max(8,Math.min(innerWidth-300,rect.left))+'px';holder.style.top=(rect.bottom+320>innerHeight?Math.max(8,rect.top-320):rect.bottom+6)+'px';
 holder.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();holder.remove();trigger.focus()}});
 setTimeout(()=>{const dismiss=e=>{if(!holder.isConnected){document.removeEventListener('pointerdown',dismiss,true);return}if(!holder.contains(e.target)&&e.target!==trigger){holder.remove();document.removeEventListener('pointerdown',dismiss,true)}};document.addEventListener('pointerdown',dismiss,true)},0);
}

/** Consolidate day-by-day display segments into one event/occurrence range. */
export const uniqueInstances=segments=>{
 const map=new Map();
 for(const e of segments){
  const key=e.id+'|'+(e._occurrence||e.starts_at);
  if(!map.has(key))map.set(key,{...e,_firstCivil:e._civilDate,_lastCivil:e._civilDate});
  else{
   const x=map.get(key);if(e._civilDate<x._firstCivil)x._firstCivil=e._civilDate;
   if(e._civilDate>x._lastCivil)x._lastCivil=e._civilDate;
  }
 }
 return [...map.values()];
};
export const rangeLabel=(e,long=false)=>{
 const start=e.all_day&&e.source_subscription_id?String(e.starts_at).slice(0,10):daykey(new Date(e.starts_at));
 const exclusiveEnd=new Date(new Date(e.ends_at).getTime()-1);
 const end=e.all_day&&e.source_subscription_id?daykey(new Date(new Date(e.ends_at.slice(0,10)+'T12:00:00Z').getTime()-86400000)):daykey(exclusiveEnd);
 if(start===end)return new Date(start+'T12:00:00').toLocaleDateString('en-US',long?{weekday:'long',month:'long',day:'numeric',year:'numeric'}:{month:'short',day:'numeric'});
 const fmt=long?{weekday:'long',month:'long',day:'numeric'}:{month:'short',day:'numeric'};
 return new Date(start+'T12:00:00').toLocaleDateString('en-US',fmt)+' – '+new Date(end+'T12:00:00').toLocaleDateString('en-US',{...fmt,...(long?{year:'numeric'}:{})});
};
