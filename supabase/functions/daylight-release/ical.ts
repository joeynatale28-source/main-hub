export type FeedEvent={title:string,description:string,location_name:string,location_address:string,starts_at:string,ends_at:string,all_day:boolean,repeat_rule:Record<string,unknown>,external_uid:string};
const pad=(x:number)=>String(x).padStart(2,'0');
const unescapeText=(x:string)=>x.replace(/\\[nN]/g,'\n').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\');
type Parts={y:number,m:number,d:number,h:number,min:number,sec:number,z:boolean,all:boolean};
function part(raw:string):Parts|null{
 const m=raw.match(/^(\d{4})(\d\d)(\d\d)(?:T(\d\d)(\d\d)(\d\d)?(Z)?)?$/);
 return m?{y:+m[1],m:+m[2],d:+m[3],h:+(m[4]||0),min:+(m[5]||0),sec:+(m[6]||0),z:!!m[7],all:!m[4]}:null;
}
const utc=(p:Parts)=>Date.UTC(p.y,p.m-1,p.d,p.h,p.min,p.sec);
function epoch(p:Parts,tz?:string){
 if(p.z||p.all||!tz)return utc(p);
 try{
  const fmt=new Intl.DateTimeFormat('en-US',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const target=utc(p);let guess=target;
  for(let i=0;i<4;i++){
   const v=Object.fromEntries(fmt.formatToParts(new Date(guess)).filter(x=>x.type!=='literal').map(x=>[x.type,+x.value]));
   const displayed=Date.UTC(v.year,v.month-1,v.day,v.hour,v.minute,v.second),delta=target-displayed;
   guess+=delta;if(!delta)break;
  }
  return guess;
 }catch{return utc(p)}
}
const shift=(p:Parts,n:number):Parts=>{const v=new Date(Date.UTC(p.y,p.m-1,p.d+n,p.h,p.min,p.sec));return{...p,y:v.getUTCFullYear(),m:v.getUTCMonth()+1,d:v.getUTCDate()}};
const weekday=(p:Parts)=>new Date(Date.UTC(p.y,p.m-1,p.d)).getUTCDay();
type Prop={name:string,value:string,params:Record<string,string>};
function prop(line:string):Prop|null{
 const i=line.indexOf(':');if(i<0)return null;
 const chunks=line.slice(0,i).split(';'),params:Record<string,string>={};
 chunks.slice(1).forEach(s=>{const p=s.indexOf('=');if(p>0)params[s.slice(0,p).toUpperCase()]=s.slice(p+1).replace(/^"|"$/g,'')});
 return{name:chunks[0].toUpperCase(),params,value:line.slice(i+1)};
}
function matches(candidate:Parts,initial:Parts,rule:Record<string,string>){
 const days=Math.round((Date.UTC(candidate.y,candidate.m-1,candidate.d)-Date.UTC(initial.y,initial.m-1,initial.d))/864e5);
 const months=(candidate.y-initial.y)*12+candidate.m-initial.m;
 const interval=Math.max(1,Number(rule.INTERVAL)||1);
 const weekdayKey:Record<string,number>={SU:0,MO:1,TU:2,WE:3,TH:4,FR:5,SA:6};
 const by=(rule.BYDAY||'').split(',').filter(Boolean).map(x=>weekdayKey[x.replace(/^[+-]?\d+/,'')]).filter(x=>x!==undefined);
 const daysMatch=!by.length||by.includes(weekday(candidate));
 if(rule.FREQ==='DAILY')return days%interval===0&&daysMatch;
 if(rule.FREQ==='WEEKLY')return Math.floor(days/7)%interval===0&&daysMatch&&(by.length>0||weekday(candidate)===weekday(initial));
 if(rule.FREQ==='MONTHLY')return months>=0&&months%interval===0&&candidate.d===initial.d&&daysMatch;
 if(rule.FREQ==='YEARLY')return (candidate.y-initial.y)%interval===0&&candidate.m===initial.m&&candidate.d===initial.d&&daysMatch;
 return false;
}
export function parseCalendar(text:string):{name:string,events:FeedEvent[]}{
 if(text.length>4e6||!/(^|\r?\n)BEGIN:VCALENDAR\b/i.test(text)||!/(^|\r?\n)END:VCALENDAR\b/i.test(text))throw Error('NOT_CALENDAR');
 const lines=text.replace(/\r\n?/g,'\n').replace(/\n[ \t]/g,'').split('\n');
 let calendarName='',inside=false,block:Prop[]=[],blocks:Prop[][]=[];
 for(const line of lines){
  if(line.trim()==='BEGIN:VEVENT'){inside=true;block=[];continue}
  if(line.trim()==='END:VEVENT'){if(inside)blocks.push(block);inside=false;continue}
  const p=prop(line);if(!p)continue;
  if(inside)block.push(p);else if(p.name==='X-WR-CALNAME')calendarName=unescapeText(p.value).trim();
 }
 const output:FeedEvent[]=[];
 for(const block of blocks){
  const find=(s:string)=>block.find(x=>x.name===s),findAll=(s:string)=>block.filter(x=>x.name===s);
  const beginning=find('DTSTART'),base=beginning&&part(beginning.value);
  if(!base)continue;
  const final=find('DTEND'),ending=final?part(final.value):null;
  const tz=beginning?.params.TZID,allDay=beginning?.params.VALUE==='DATE'||base.all;
  const rawStart=epoch(base,tz),rawEnd=ending?epoch(ending,final?.params.TZID||tz):rawStart+(allDay?864e5:36e5);
  const duration=Math.max(60e3,rawEnd-rawStart);
  const rrule=find('RRULE')?.value||'',rule:Record<string,string>={};
  rrule.split(';').forEach(x=>{const at=x.indexOf('=');if(at>0)rule[x.slice(0,at).toUpperCase()]=x.slice(at+1).toUpperCase()});
  const until=rule.UNTIL?part(rule.UNTIL):null,untilMS=until?epoch(until,until.z?undefined:tz):Infinity;
  const excluded=new Set<number>();findAll('EXDATE').forEach(x=>x.value.split(',').forEach(v=>{const p=part(v);if(p)excluded.add(epoch(p,x.params.TZID||tz))}));
  const title=unescapeText(find('SUMMARY')?.value||'Untitled event'),description=unescapeText(find('DESCRIPTION')?.value||''),location=unescapeText(find('LOCATION')?.value||''),uid=find('UID')?.value||title+'-'+beginning?.value;
  const hasRule=Boolean(rule.FREQ);
  const maxCount=rule.COUNT?Math.max(0,Number(rule.COUNT)):Infinity;
  const endHorizon=Date.UTC(base.y+3,base.m-1,base.d);
  let considered=0;
  for(let i=0;i<(hasRule?1200:1);i++){
   const p=hasRule?shift(base,i):base,ms=epoch(p,tz);
   if(ms>endHorizon||ms>untilMS||considered>=maxCount)break;
   if(hasRule&&!matches(p,base,rule))continue;
   considered++;if(excluded.has(ms))continue;
   if(allDay){
    // Preserve DTSTART VALUE=DATE and DTEND's exclusive end in one record.
    // Rendering expands this one record into a continuous bar without UTC shifting.
    const start=Date.UTC(p.y,p.m-1,p.d),end=start+Math.max(1,Math.round(duration/864e5))*864e5;
    output.push({title,description,location_name:location,location_address:location,starts_at:new Date(start).toISOString(),ends_at:new Date(end).toISOString(),all_day:true,repeat_rule:{},external_uid:uid+'::'+ms});
   }else{
    const start=ms,end=ms+duration;
    let cursor=start,j=0;
    while(cursor<end&&j<366){
     const midnight=Math.ceil((cursor+1)/864e5)*864e5,next=Math.min(midnight,end);
     output.push({title,description,location_name:location,location_address:location,starts_at:new Date(cursor).toISOString(),ends_at:new Date(next).toISOString(),all_day:false,repeat_rule:{},external_uid:uid+'::'+ms+'::'+j});
     cursor=next;j++;
    }
   }
   if(output.length>5000)throw Error('TOO_MANY_EVENTS');
  }
 }
 return{name:calendarName,events:output};
}
