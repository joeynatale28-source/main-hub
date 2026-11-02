import * as module from '../../supabase/functions/daylight-release/ical.ts';
const parseCalendar = (module as any).parseCalendar || (module as any).default?.parseCalendar;
import assert from 'node:assert/strict';
const raw=[
'BEGIN:VCALENDAR','VERSION:2.0','X-WR-CALNAME:Swim Team',
'BEGIN:VEVENT','UID:weekly','SUMMARY:Swim practice','DESCRIPTION:Training','LOCATION:Pool',
'DTSTART;TZID=America/New_York:20261103T180000','DTEND;TZID=America/New_York:20261103T193000',
'RRULE:FREQ=WEEKLY;COUNT=3','EXDATE;TZID=America/New_York:20261110T180000',
'END:VEVENT',
'BEGIN:VEVENT','UID:multi','SUMMARY:Away meet','DTSTART;VALUE=DATE:20261210',
'DTEND;VALUE=DATE:20261213','END:VEVENT',
'BEGIN:VEVENT','UID:next-month','SUMMARY:December planning',
'DTSTART:20261215T110000Z','DTEND:20261215T120000Z','END:VEVENT','END:VCALENDAR'
].join('\r\n');
const result=parseCalendar(raw);
assert.equal(result.name,'Swim Team');
assert.equal(result.events.filter((x:any)=>x.title==='Swim practice'&&x.starts_at.includes('T23:00:00')).length,2);
assert.ok(result.events.find((x:any)=>x.title==='Swim practice')?.starts_at.startsWith('2026-11-03T23:00:00'));
assert.equal(result.events.filter((x:any)=>x.title==='Away meet').length,3);
assert.ok(result.events.filter((x:any)=>x.title==='Away meet').every((x:any)=>x.all_day));
assert.ok(result.events.some((x:any)=>x.starts_at.startsWith('2026-12-15T11:00:00')));
assert.throws(()=>parseCalendar('<html>404 Not Found</html>'));
console.log('PASS: ICS timezone / RRULE COUNT / EXDATE / multi-day / next-month / invalid-HTML');
