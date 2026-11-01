/* RFC 5545 iCalendar parser for Daylight's local-first, read-only subscriptions.
   Pure parsing: caller fetches the ICS as text, never JSON. */
(()=>{
'use strict';
const DAY=86400000, pad=n=>String(n).padStart(2,'0');
const iso=d=>[d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
const safe=s=>String(s||'').replace(/\\[nN]/g,'\n').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\');
function fields(block){
  const result=[];
  for(const line of block.split(/\r?\n/)){
    const p=line.indexOf(':');if(p<0)continue;
    const head=line.slice(0,p).split(';'),name=head.shift().toUpperCase(),params={};
    for(const part of head){const eq=part.indexOf('=');if(eq>0)params[part.slice(0,eq).toUpperCase()]=part.slice(eq+1).replace(/^"|"$/g,'')}
    result.push({name,params,value:line.slice(p+1)});
  }
  return result;
}
const first=(props,n)=>props.find(p=>p.name===n);
const all=(props,n)=>props.filter(p=>p.name===n);
function parts(raw){
  const m=String(raw||'').match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/i);
  if(!m)return null;
  const o={y:+m[1],mo:+m[2],d:+m[3],h:+(m[4]||0),mi:+(m[5]||0),s:+(m[6]||0),utc:!!m[7],isDate:!m[4]};
  if(o.mo<1||o.mo>12||o.d<1||o.d>31||o.h>23||o.mi>59||o.s>59)return null;
  const valid=new Date(Date.UTC(o.y,o.mo-1,o.d));
  if(valid.getUTCDate()!==o.d||valid.getUTCMonth()!==o.mo-1)return null;
  return o;
}
function dateWith(o,p){
  const tz=p?.params?.TZID;
  if(o.isDate)return new Date(o.y,o.mo-1,o.d,0);
  if(o.utc)return new Date(Date.UTC(o.y,o.mo-1,o.d,o.h,o.mi,o.s));
  if(!tz)return new Date(o.y,o.mo-1,o.d,o.h,o.mi,o.s);
  // Convert TZID wall time to an instant, observing daylight-saving transitions.
  try{
    const fmt=new Intl.DateTimeFormat('en-US',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
    const target=Date.UTC(o.y,o.mo-1,o.d,o.h,o.mi,o.s);
    let guess=target;
    for(let i=0;i<5;i++){
      const fp=Object.fromEntries(fmt.formatToParts(new Date(guess)).filter(x=>x.type!=='literal').map(x=>[x.type,+x.value]));
      const wall=Date.UTC(fp.year,fp.month-1,fp.day,fp.hour,fp.minute,fp.second);
      const delta=target-wall;guess+=delta;if(!delta)break;
    }
    return new Date(guess);
  }catch{return new Date(o.y,o.mo-1,o.d,o.h,o.mi,o.s)}
}
function parseDate(prop){if(!prop)return null;const o=parts(prop.value);return o?{...o,date:dateWith(o,prop),isDate:o.isDate||prop.params.VALUE==='DATE',tz:prop.params.TZID||null}:null}
function addDays(y,m,d,n){const dt=new Date(Date.UTC(y,m-1,d+n));return {y:dt.getUTCFullYear(),mo:dt.getUTCMonth()+1,d:dt.getUTCDate()}}
function advance(o,days){const next=addDays(o.y,o.mo,o.d,days);return {...o,...next}}
function dayNumber(o){return Math.floor(Date.UTC(o.y,o.mo-1,o.d)/DAY)}
function wallValue(o){return Date.UTC(o.y,o.mo-1,o.d,o.h,o.mi,o.s)}
function rrule(value){return Object.fromEntries(String(value||'').split(';').filter(Boolean).map(entry=>{const i=entry.indexOf('=');return i===-1?[entry.toUpperCase(),'']:[entry.slice(0,i).toUpperCase(),entry.slice(i+1).toUpperCase()]}))}
const weekdays=['SU','MO','TU','WE','TH','FR','SA'];
function matchesRule(start,candidate,rule){
  const freq=rule.FREQ,interval=Math.max(1,parseInt(rule.INTERVAL||'1',10)||1);
  const delta=dayNumber(candidate)-dayNumber(start);if(delta<0)return false;
  const byday=rule.BYDAY?.split(',').map(x=>x.replace(/^[+-]?\d+/,'')).filter(x=>weekdays.includes(x));
  const weekday=weekdays[new Date(Date.UTC(candidate.y,candidate.mo-1,candidate.d)).getUTCDay()];
  if(byday?.length&&!byday.includes(weekday))return false;
  if(rule.BYMONTH&& !rule.BYMONTH.split(',').map(Number).includes(candidate.mo))return false;
  const monthDays=rule.BYMONTHDAY?.split(',').map(Number);
  if(monthDays?.length){const last=new Date(Date.UTC(candidate.y,candidate.mo,0)).getUTCDate();if(!monthDays.some(v=>v===candidate.d||(v<0&&last+v+1===candidate.d)))return false}
  if(freq==='DAILY')return delta%interval===0;
  if(freq==='WEEKLY'){
    const week=Math.floor((delta+new Date(Date.UTC(start.y,start.mo-1,start.d)).getUTCDay())/7);
    return week%interval===0&&(byday?.length||weekday===weekdays[new Date(Date.UTC(start.y,start.mo-1,start.d)).getUTCDay()]);
  }
  const months=(candidate.y-start.y)*12+candidate.mo-start.mo;
  if(freq==='MONTHLY')return months%interval===0&&(monthDays?.length||byday?.length||candidate.d===start.d);
  if(freq==='YEARLY')return (candidate.y-start.y)%interval===0&&(rule.BYMONTH||candidate.mo===start.mo)&&(monthDays?.length||byday?.length||candidate.d===start.d);
  return false;
}
function expand(raw,opts={}){
 if(typeof raw!=='string'||!/^BEGIN:VCALENDAR\s*$/mi.test(raw))throw Error('NOT_CALENDAR');
 const unfolded=raw.replace(/\r\n[ \t]/g,'').replace(/\n[ \t]/g,'');
 const name=safe(first(fields(unfolded.split(/BEGIN:VEVENT/i)[0]),'X-WR-CALNAME')?.value||'').trim();
 const blocks=unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/gi)||[];
 const now=opts.today?new Date(opts.today+'T12:00'):new Date();
 const horizonStart=opts.from?new Date(opts.from+'T00:00'):new Date(now.getFullYear(),now.getMonth()-2,1);
 const horizonEnd=opts.to?new Date(opts.to+'T23:59:59'):new Date(now.getFullYear(),now.getMonth()+19,1);
 const out=[], cancellations=new Set(), uidOverrides=new Map();
 // RECURRENCE-ID exceptions replace one generated occurrence.
 for(const block of blocks){const p=fields(block);const uid=first(p,'UID')?.value;const rid=first(p,'RECURRENCE-ID');if(uid&&rid){const key=uid+'|'+rid.value;uidOverrides.set(key,p);if(first(p,'STATUS')?.value?.toUpperCase()==='CANCELLED')cancellations.add(key)}}
 function append(start,end,record,occurrenceKey){
   if(!start||!end||isNaN(+start)||isNaN(+end)||end<=start)return;
   const last=new Date(end.getTime()-1);
   const step=new Date(start.getFullYear(),start.getMonth(),start.getDate());
   let index=0;
   while(step<=last&&index<1200){
     const date=iso(step);
     const segStart=index===0?start:new Date(step);
     const next=new Date(step.getFullYear(),step.getMonth(),step.getDate()+1);
     const segEnd=end<next?end:next;
     if(segEnd>horizonStart&&segStart<horizonEnd){
       const allDay=record.allDay;
       const time=allDay?'00:00':pad(segStart.getHours())+':'+pad(segStart.getMinutes());
       const duration=allDay?1440:Math.max(1,Math.round((segEnd-segStart)/60000));
       out.push({...record,id:(record.uid||record.title)+'@'+occurrenceKey+'#'+index,date,time,duration,allDay,part:index,originalStart:start.toISOString(),originalEnd:end.toISOString()});
     }
     index++;step.setDate(step.getDate()+1);
   }
 }
 for(const block of blocks){
   const p=fields(block),rid=first(p,'RECURRENCE-ID');if(rid)continue;
   if(first(p,'STATUS')?.value?.toUpperCase()==='CANCELLED')continue;
   const begin=first(p,'DTSTART'),parsed=parseDate(begin);if(!parsed)continue;
   const finish=parseDate(first(p,'DTEND'));
   const baseStart=parsed.date;
   const allDay=parsed.isDate;
   const defaultDuration=allDay?DAY:3600000;
   const duration=finish?Math.max(1,finish.date-baseStart):defaultDuration;
   const uid=first(p,'UID')?.value||'event-'+out.length+'-'+parsed.y+parsed.mo+parsed.d;
   const record={uid,title:safe(first(p,'SUMMARY')?.value||'Untitled event'),notes:safe(first(p,'DESCRIPTION')?.value),location:safe(first(p,'LOCATION')?.value),allDay,readOnly:true};
   const rule=rrule(first(p,'RRULE')?.value),hasRepeat=['DAILY','WEEKLY','MONTHLY','YEARLY'].includes(rule.FREQ);
   const count=rule.COUNT?Math.max(1,+rule.COUNT):Infinity;
   const untilRaw=rule.UNTIL?parts(rule.UNTIL):null;
   const until=untilRaw?dateWith(untilRaw,untilRaw.utc?{params:{}}:begin):null;
   const excluded=new Set();
   for(const ex of all(p,'EXDATE'))for(const val of ex.value.split(',')){const entry=parseDate({...ex,value:val});if(entry){excluded.add(val);excluded.add(entry.date.getTime());excluded.add(entry.date.toISOString().slice(0,10))}}
   const maxDays=hasRepeat?Math.min(50000,Math.max(1,dayNumber({y:horizonEnd.getFullYear(),mo:horizonEnd.getMonth()+1,d:horizonEnd.getDate()})-dayNumber(parsed)+3)):1;
   let matched=0;
   for(let n=0;n<maxDays;n++){
     const candidate=advance(parsed,n);
     if(hasRepeat&&!matchesRule(parsed,candidate,rule))continue;
     if(!hasRepeat&&n>0)break;
     const instant=dateWith(candidate,begin);
     if(until&&instant>until)break;
     matched++;
     if(matched>count)break;
     const occurrenceKey=pad(candidate.mo)+pad(candidate.d)+'-'+candidate.y+'T'+pad(candidate.h)+pad(candidate.mi);
     const rawKey=candidate.y+pad(candidate.mo)+pad(candidate.d)+(candidate.isDate?'':'T'+pad(candidate.h)+pad(candidate.mi)+pad(candidate.s)+(candidate.utc?'Z':''));
     const key=uid+'|'+rawKey;
     if(cancellations.has(key))continue;
     const exDate=iso(instant);
     if(excluded.has(rawKey)||excluded.has(instant.getTime())||excluded.has(exDate))continue;
     const override=uidOverrides.get(key);
     const changedStart=override?parseDate(first(override,'DTSTART'))?.date||instant:instant;
     const changedEnd=override?parseDate(first(override,'DTEND'))?.date:null;
     const changed={...record};
     if(override){if(first(override,'SUMMARY'))changed.title=safe(first(override,'SUMMARY').value);if(first(override,'DESCRIPTION'))changed.notes=safe(first(override,'DESCRIPTION').value);if(first(override,'LOCATION'))changed.location=safe(first(override,'LOCATION').value)}
     append(changedStart,changedEnd||new Date(changedStart.getTime()+duration),changed,occurrenceKey);
     if(!hasRepeat)break;
   }
 }
 return {name,events:out};
}
window.DaylightICS={parse:expand,unescape:safe};
})();