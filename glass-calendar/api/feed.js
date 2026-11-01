// Read-only calendar feed proxy. Restricted hosts prevent a public arbitrary-URL proxy.
const ALLOWED=[/^(?:calendar\.google\.com|www\.google\.com|calendar\.googleusercontent\.com)$/i,/^(?:outlook\.live\.com|outlook\.office365\.com|outlook\.office\.com)$/i,/^(?:[a-z0-9-]+\.)*calendars\.icloud\.com$/i,/^(?:[a-z0-9-]+\.)*icloud\.com$/i,/^ics\.teamup\.com$/i];
export default async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'})}
 try{
  let input=req.query.url;if(typeof input!=='string'||input.length>2048)throw Error('Invalid calendar URL');
  input=input.replace(/^webcals?:\/\//i,'https://');
  const u=new URL(input);
  if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash)throw Error('Use an HTTPS calendar URL without embedded credentials');
  if(!ALLOWED.some(re=>re.test(u.hostname)))return res.status(422).json({error:'This provider is not yet supported by the secure subscription proxy. You can still download and import its .ics file.'});
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000);
  let response;
  try{response=await fetch(u.href,{headers:{Accept:'text/calendar, text/plain;q=0.5'},redirect:'error',signal:controller.signal})}finally{clearTimeout(timer)}
  if(!response.ok)throw Error('Calendar provider returned '+response.status);
  const type=response.headers.get('content-type')||'';
  if(type&&!(type.includes('text/calendar')||type.includes('text/plain')||type.includes('application/octet-stream')))throw Error('URL did not return a calendar file');
  const length=Number(response.headers.get('content-length')||0);
  if(length>2_000_000)throw Error('Calendar exceeds 2 MB');
  const reader=response.body.getReader();let size=0;const chunks=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2_000_000){await reader.cancel();throw Error('Calendar exceeds 2 MB')}chunks.push(value)}
  const body=new TextDecoder().decode(Buffer.concat(chunks.map(x=>Buffer.from(x))));
  if(!body.includes('BEGIN:VCALENDAR')||!body.includes('END:VCALENDAR'))throw Error('URL does not contain a valid iCalendar file');
  res.setHeader('Cache-Control','private, max-age=0, no-store');res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(200).json({ics:body});
 }catch(err){return res.status(400).json({error:String(err?.message||'Unable to load calendar')})}
}
