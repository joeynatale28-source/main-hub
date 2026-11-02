// Month/week all-day span layout. Events are grouped by occurrence and assigned stable lanes.
export function spanning(event){return Boolean(event.all_day||event._segments>1||new Date(event.ends_at)-new Date(event.starts_at)>86400000)}
export function occurrenceIdentity(e){return String(e.id)+'|'+String(e._occurrence||e.starts_at)}
export function makeSpans(occurrences,days,weekSize=7){
 const sortedDays=days.map(d=>typeof d==='string'?d:localISO(d));
 const groups=new Map();
 for(const e of occurrences){
  const id=occurrenceIdentity(e);
  if(!groups.has(id))groups.set(id,{event:e,dates:new Map()});
  groups.get(id).dates.set(e._civilDate||localISO(new Date(e.starts_at)),e);
 }
 const output=[];
 for(const {event,dates} of groups.values()){
  const indices=sortedDays.map((d,i)=>dates.has(d)?i:-1).filter(i=>i!==-1);
  if(!indices.length)continue;
  let from=indices[0],to=indices[0];
  const emit=()=>{const first=dates.get(sortedDays[from]),last=dates.get(sortedDays[to]);output.push({event,from,to,week:Math.floor(from/weekSize),start:first?first._segment===0:from===indices[0],end:last?last._segment===last._segments-1:to===indices[indices.length-1]})};
  for(let i=1;i<indices.length;i++){
   const next=indices[i];
   if(next!==to+1||Math.floor(next/weekSize)!==Math.floor(to/weekSize)){emit();from=next}
   to=next;
  }emit();
 }
 output.sort((a,b)=>a.week-b.week||a.from-b.from||(b.to-b.from)-(a.to-a.from));
 const busy=new Map();
 for(const s of output){
  let lanes=busy.get(s.week);if(!lanes){lanes=[];busy.set(s.week,lanes)}
  let lane=lanes.findIndex(end=>end<s.from);if(lane===-1){lane=lanes.length;lanes.push(s.to)}else lanes[lane]=s.to;
  s.lane=lane;
 }
 return output;
}
function localISO(d){return[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
export function spanRange(event){
 const start=event._origin||event;
 const st=new Date(start.starts_at),en=new Date(start.ends_at);
 const first=start.source_subscription_id&&start.all_day?String(start.starts_at).slice(0,10):localISO(st),last=start.source_subscription_id&&start.all_day?new Date(Date.parse(String(start.ends_at).slice(0,10)+'T12:00:00')-86400000).toISOString().slice(0,10):localISO(new Date(en.getTime()-1));
 return {first,last,durationMs:en-st};
}
