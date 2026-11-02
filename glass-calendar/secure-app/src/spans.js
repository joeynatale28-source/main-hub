// Calendar event instances are single intervals. Display segments are never persisted.
export const civil=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const atNoon=s=>new Date(s+'T12:00:00');
export const plusCivil=(s,n)=>civil(new Date(atNoon(s).getFullYear(),atNoon(s).getMonth(),atNoon(s).getDate()+n,12));
export const dayDelta=(a,b)=>Math.round((atNoon(b)-atNoon(a))/86400000);
const freqShift=(base,frequency,i)=>{
 const d=new Date(base);
 if(frequency==='daily')d.setDate(d.getDate()+i);
 else if(frequency==='weekly')d.setDate(d.getDate()+i*7);
 else if(frequency==='monthly'){d.setDate(1);d.setMonth(d.getMonth()+i);d.setDate(Math.min(base.getDate(),new Date(d.getFullYear(),d.getMonth()+1,0).getDate()))}
 else if(frequency==='yearly'){d.setDate(1);d.setFullYear(d.getFullYear()+i,base.getMonth());d.setDate(Math.min(base.getDate(),new Date(d.getFullYear(),d.getMonth()+1,0).getDate()))}
 return d;
};
export function bounds(e){
 const start=new Date(e.starts_at),end=new Date(e.ends_at);
 const imported=e.source_subscription_id&&e.all_day;
 // All-day VALUE=DATE feed timestamps encode civil days in UTC and never shift locally.
 const first=imported?String(e.starts_at).slice(0,10):civil(start);
 const endExclusive=imported?String(e.ends_at).slice(0,10):civil(end);
 const inclusive=e.all_day?plusCivil(endExclusive,-1):civil(new Date(Math.max(start.getTime(),end.getTime()-1)));
 return {first,last:inclusive<first?first:inclusive};
}
export function instances(events,from,to){
 const min=atNoon(from).getTime()-86400000,max=atNoon(to).getTime()+86400000;
 const out=[];
 for(const root of events){
  const r=root.repeat_rule||{},freq=String(r.frequency||'never').toLowerCase();
  const repeat=!root.source_subscription_id&&['daily','weekly','monthly','yearly'].includes(freq);
  const base=new Date(root.starts_at),end=new Date(root.ends_at),duration=end-base;
  if(!Number.isFinite(duration)||duration<=0)continue;
  const interval=Math.max(1,Number(r.interval)||1),count=r.ends==='count'?Math.max(1,Number(r.count)||1):1500;
  const until=r.ends==='on'&&r.until?r.until:null,excluded=new Set(r.exdates||[]);
  for(let i=0;i<(repeat?Math.min(1500,count):1);i++){
   const start=repeat?freqShift(base,freq,i*interval):base;
   if(start.getTime()>max)break;
   if(until&&civil(start)>until)break;
   const ending=new Date(start.getTime()+duration);
   if(ending.getTime()<min)continue;
   const dateKey=civil(start);if(excluded.has(dateKey))continue;
   const inst={...root,starts_at:start.toISOString(),ends_at:ending.toISOString(),_origin:root,_occurrence:start.toISOString(),_index:i};
   const b=bounds(inst);
   if(atNoon(b.last).getTime()<min||atNoon(b.first).getTime()>max)continue;
   inst._first=b.first;inst._last=b.last;
   out.push(inst);
  }
 }
 return out.sort((a,b)=>a._first.localeCompare(b._first)||a.starts_at.localeCompare(b.starts_at));
}
export function weekSegments(items,first,days=7){
 const last=plusCivil(first,days-1),segments=[];
 for(const e of items){
  if(e._first>last||e._last<first)continue;
  const start=e._first>first?e._first:first,end=e._last<last?e._last:last;
  segments.push({...e,from:start,to:end,startCol:dayDelta(first,start),span:dayDelta(start,end)+1,leftOpen:e._first<first,rightOpen:e._last>last});
 }
 segments.sort((a,b)=>a.startCol-b.startCol||b.span-a.span);
 const lanes=[];
 for(const s of segments){
  let lane=lanes.findIndex(end=>end<s.startCol);
  if(lane<0){lane=lanes.length;lanes.push(-1)}
  lanes[lane]=s.startCol+s.span-1;s.lane=lane;
 }
 return segments;
}
export const rangeLabel=e=>{
 const b=bounds(e),f=atNoon(b.first),l=atNoon(b.last);
 return b.first===b.last?f.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}):f.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})+' – '+l.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
};
export const agendaRange=e=>{
 const b=bounds(e);if(b.first===b.last)return '';
 const f=atNoon(b.first),l=atNoon(b.last);
 return f.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' – '+l.toLocaleDateString('en-US',{month:'short',day:'numeric'});
};
export const isSpanning=e=>bounds(e).first!==bounds(e).last;
