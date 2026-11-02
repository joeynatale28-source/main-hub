/* RFC 5545-style iCalendar reader for static GitHub Pages. No JSON feed endpoint. */
(function(root){
'use strict';
const pad=n=>String(n).padStart(2,'0');
const ymd=p=>p.y+'-'+pad(p.m)+'-'+pad(p.d);
const unescapeText=v=>String(v||'').replace(/\\[nN]/g,'\n').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\');
const dateParts=v=>{const m=String(v).match(/^(\d{4})(\d\d)(\d\d)(?:T(\d\d)(\d\d)(\d\d)?(Z)?)?$/);if(!m)return null;return{y:+m[1],m:+m[2],d:+m[3],h:+(m[4]||0),min:+(m[5]||0),sec:+(m[6]||0),z:!!m[7],allDay:!m[4]}};
const utc=p=>Date.UTC(p.y,p.m-1,p.d,p.h,p.min,p.sec);
const localStamp=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const localTime=d=>pad(d.getHours())+':'+pad(d.getMinutes());
function zonedEpoch(p,tz){
 if(!tz)return p.z?utc(p):new Date(p.y,p.m-1,p.d,p.h,p.min,p.sec).getTime();
 try{
  const format=new Intl.DateTimeFormat('en-US',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const desired=utc(p);
  let epoch=desired;
  for(let i=0;i<4;i++){
   const parts=Object.fromEntries(format.formatToParts(new Date(epoch)).filter(x=>x.type!=='literal').map(x=>[x.type,+x.value]));
   const shown=Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute,parts.second);
   const delta=desired-shown;
   epoch+=delta;
   if(!delta)break;
  }
  return epoch;
 }catch{return new Date(p.y,p.m-1,p.d,p.h,p.min,p.sec).getTime()}
}
function property(line){
 const i=line.indexOf(':');if(i<0)return null;
 const bits=line.slice(0,i).split(';'),params={};
 bits.slice(1).forEach(item=>{const pos=item.indexOf('=');if(pos>0)params[item.slice(0,pos).toUpperCase()]=item.slice(pos+1).replace(/^"|"$/g,'')});
 return{name:bits[0].toUpperCase(),params,value:line.slice(i+1)};
}
function advance(p,days){const d=new Date(Date.UTC(p.y,p.m-1,p.d+days,p.h,p.min,p.sec));return{...p,y:d.getUTCFullYear(),m:d.getUTCMonth()+1,d:d.getUTCDate()}}
const weekday=p=>new Date(Date.UTC(p.y,p.m-1,p.d)).getUTCDay();
function recurMatch(p,base,rule){
 const days=Math.round((Date.UTC(p.y,p.m-1,p.d)-Date.UTC(base.y,base.m-1,base.d))/864e5);
 const interval=Math.max(1,Number(rule.INTERVAL)||1);
 const months=(p.y-base.y)*12+p.m-base.m;
 const keys={SU:0,MO:1,TU:2,WE:3,TH:4,FR:5,SA:6};
 const byday=(rule.BYDAY||'').split(',').filter(Boolean).map(x=>keys[x.replace(/^[+-]?\d+/,'')]).filter(x=>x!==undefined);
 const inDays=!byday.length||byday.includes(weekday(p));
 if(rule.FREQ==='DAILY')return days%interval===0&&inDays;
 if(rule.FREQ==='WEEKLY')return Math.floor(days/7)%interval===0&&inDays&&(byday.length>0||weekday(p)===weekday(base));
 if(rule.FREQ==='MONTHLY')return months>=0&&months%interval===0&&p.d===base.d&&inDays;
 if(rule.FREQ==='YEARLY')return(p.y-base.y)%interval===0&&p.m===base.m&&p.d===base.d&&inDays;
 return false;
}
function parse(raw,options){
 options=options||{};
 if(typeof raw!=='string'||!/(^|\r?\n)BEGIN:VCALENDAR\b/i.test(raw)||!/(^|\r?\n)END:VCALENDAR\b/i.test(raw))throw new Error('NOT_CALENDAR');
 const lines=raw.replace(/\r\n?/g,'\n').replace(/\n[ \t]/g,'').split('\n');
 let name='',blocks=[],inside=false,block=[];
 for(const line of lines){const item=property(line);
  if(line.trim()==='BEGIN:VEVENT'){inside=true;block=[];continue}
  if(line.trim()==='END:VEVENT'){if(inside)blocks.push(block);inside=false;continue}
  if(inside){if(item)block.push(item)}
  else if(item?.name==='X-WR-CALNAME')name=unescapeText(item.value).trim();
 }
 const now=options.now?new Date(options.now):new Date(),upper=new Date(now.getFullYear()+2,now.getMonth(),now.getDate()),endLimit=upper.getTime(),result=[];
 for(const props of blocks){
  const one=n=>props.find(x=>x.name===n),all=n=>props.filter(x=>x.name===n);
  const startProp=one('DTSTART'),base=startProp&&dateParts(startProp.value);
  if(!base)continue;
  const endProp=one('DTEND'),ending=endProp&&dateParts(endProp.value);
  const tz=startProp.params.TZID||(startProp.value.endsWith('Z')?'UTC':null);
  const isAllDay=startProp.params.VALUE==='DATE'||base.allDay;
  const originalStart=zonedEpoch(base,isAllDay?null:tz);
  const originalEnd=ending?zonedEpoch(ending,isAllDay?null:(endProp.params.TZID||tz)):(isAllDay?zonedEpoch(advance(base,1)):originalStart+3600000);
  const defaultDuration=Math.max(60000,originalEnd-originalStart);
  const ruleProp=one('RRULE'),rule={};
  if(ruleProp)ruleProp.value.split(';').forEach(pair=>{const i=pair.indexOf('=');if(i>0)rule[pair.slice(0,i).toUpperCase()]=pair.slice(i+1).toUpperCase()});
  const hasRule=!!rule.FREQ,until=rule.UNTIL?dateParts(rule.UNTIL):null;
  const untilEpoch=until?zonedEpoch(until,until.z?'UTC':tz):Infinity;
  const maxCount=rule.COUNT?Math.max(0,+rule.COUNT):Infinity;
  const excluded=new Set();
  all('EXDATE').forEach(x=>x.value.split(',').forEach(v=>{const p=dateParts(v);if(p)excluded.add(String(zonedEpoch(p,p.allDay?null:(x.params.TZID||tz))))}));
  const title=unescapeText(one('SUMMARY')?.value)||'Untitled event',description=unescapeText(one('DESCRIPTION')?.value),location=unescapeText(one('LOCATION')?.value);
  const uid=one('UID')?.value||title+'-'+startProp.value;
  let emitted=0,considered=0;
  const cycles=hasRule?Math.max(1,Math.min(90000,Math.ceil((endLimit-originalStart)/864e5)+5)):1;
  for(let n=0;n<cycles;n++){
   const cand=hasRule?advance(base,n):base;
   const candidateEpoch=zonedEpoch(cand,isAllDay?null:tz);
   if(candidateEpoch>endLimit||candidateEpoch>untilEpoch)break;
   if(hasRule&&!recurMatch(cand,base,rule))continue;
   if(considered>=maxCount)break;
   considered++;
   if(excluded.has(String(candidateEpoch)))continue;
   // Both all-day and timed multi-day entries appear on every occupied date.
   const endEpoch=candidateEpoch+defaultDuration;
   const instance=String(uid)+'--'+candidateEpoch;
   if(isAllDay){
    const count=Math.min(366,Math.max(1,Math.round(defaultDuration/864e5)));
    for(let i=0;i<count;i++){
     const day=advance(cand,i),dayStr=ymd(day);
     result.push({id:instance+'--'+dayStr,uid,date:dayStr,time:'00:00',duration:1440,allDay:true,title,notes:description,location,readOnly:true});
     emitted++;
    }
   }else{
    let cursor=candidateEpoch,index=0;
    while(cursor<endEpoch&&index<366){
     const at=new Date(cursor),next=new Date(at.getFullYear(),at.getMonth(),at.getDate()+1).getTime();
     const length=Math.max(1,Math.ceil((Math.min(next,endEpoch)-cursor)/60000));
     result.push({id:instance+'--'+index,uid,date:localStamp(at),time:localTime(at),duration:length,allDay:false,title,notes:description,location,readOnly:true});
     emitted++;cursor=Math.min(next,endEpoch);index++;
    }
   }
   if(!hasRule)break;
  }
 }
 return{name,events:result};
}
root.DaylightICS={parse,unescapeText};
})(window);
