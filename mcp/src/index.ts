/* Daylight MCP — stdio.
 * Service-role clients bypass RLS: EVERY query must be scoped to the token owner's user_id.
 * Never derive an owner from caller-supplied args.
 */
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const url=process.env.SUPABASE_URL;
const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
const token=process.env.DAYLIGHT_MCP_TOKEN;
if(!url||!secret||!token)throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DAYLIGHT_MCP_TOKEN are required');
if(!token.startsWith('dl_mcp_'))throw new Error('Invalid Daylight token format');
const db=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
const hash=createHash('sha256').update(token).digest('hex');
type Identity={id:string;name:string;tokenId:string};
let lastUse=0;
async function owner():Promise<Identity>{
 const {data,error}=await db.from('mcp_tokens').select('id,user_id,name,revoked').eq('token_hash',hash).eq('revoked',false).maybeSingle();
 if(error||!data)throw new Error('Unknown or revoked MCP token');
 if(Date.now()-lastUse>300000){
  lastUse=Date.now();
  await db.from('mcp_tokens').update({last_used_at:new Date().toISOString()}).eq('id',data.id).eq('user_id',data.user_id);
 }
 return{id:data.user_id,name:data.name,tokenId:data.id};
}
const ensure=(result:{data:any;error:any},label:string)=>{if(result.error)throw new Error(label+': '+result.error.message);return result.data};
const ok=(data:any)=>({content:[{type:'text' as const,text:JSON.stringify(data)}]});
const fail=(error:unknown)=>({isError:true,content:[{type:'text' as const,text:error instanceof Error?error.message:String(error)}]});
const clean=(v:string)=>v.trim();
const timestamp=(v:string)=>{const t=Date.parse(v);if(!Number.isFinite(t)||!v.includes('T'))throw new Error('Expected an ISO-8601 timestamp');return new Date(t).toISOString()};
async function ownedCalendar(uid:string,id:string){
 const {data,error}=await db.from('calendars').select('id').eq('id',id).eq('user_id',uid).maybeSingle();
 if(error||!data)throw new Error('Calendar not found');
}
async function deletesAllowed(uid:string){
 const {data,error}=await db.from('user_settings').select('mcp_allow_delete').eq('user_id',uid).maybeSingle();
 if(error||!data?.mcp_allow_delete)throw new Error('Deletes are disabled for AI access. The owner can enable them in Daylight → Settings → AI access.');
}
async function auditedDelete(table:'events'|'tasks',tool:string,id:string){
 const auth=await owner();
 await deletesAllowed(auth.id);
 const {data,error}=await db.from(table).delete().eq('id',id).eq('user_id',auth.id).select('id').maybeSingle();
 if(error||!data)throw new Error('Item not found');
 const audit=await db.from('mcp_audit_log').insert({user_id:auth.id,tool,action:'delete',target_id:id});
 if(audit.error)throw new Error('Item deleted but audit log failed; review database security');
 return ok({deleted:true,id});
}
const server=new McpServer({name:'daylight',version:'2.0.0'});
function tool(name:string,description:string,inputSchema:any,handler:(args:any,auth:Identity)=>Promise<any>){
 server.registerTool(name,{description,inputSchema},async(args:any)=>{
  try{const auth=await owner();return ok(await handler(args,auth))}catch(e){return fail(e)}
 });
}
const uuid=z.string().uuid();
const iso=z.string().min(16);
const eventFields={
 calendar_id:uuid,title:z.string().min(1).max(300),description:z.string().optional(),
 location_name:z.string().optional(),location_address:z.string().optional(),
 starts_at:iso,ends_at:iso,all_day:z.boolean().optional(),
 repeat_rule:z.record(z.any()).optional(),reminder_offset_minutes:z.number().int().nonnegative().nullable().optional()
};
tool('list_calendars','List calendars owned by the token user',{},async(_,auth)=>{
 const data=ensure(await db.from('calendars').select('id,name,shade,sort_order,is_visible').eq('user_id',auth.id).order('sort_order'),'calendars');
 return data;
});
tool('list_events','List events within an ISO date-time range',{from:iso,to:iso,calendar_id:uuid.optional()},async(args,auth)=>{
 const from=timestamp(args.from),to=timestamp(args.to);if(from>to)throw new Error('from must be before to');
 let q=db.from('events').select('id,calendar_id,title,starts_at,ends_at,all_day,location_name').eq('user_id',auth.id).gte('starts_at',from).lte('starts_at',to).order('starts_at').limit(200);
 if(args.calendar_id){await ownedCalendar(auth.id,args.calendar_id);q=q.eq('calendar_id',args.calendar_id)}
 return ensure(await q,'events');
});
tool('get_event','Read one event by UUID',{id:uuid},async(args,auth)=>{
 const data=ensure(await db.from('events').select('id,calendar_id,title,description,location_name,location_address,starts_at,ends_at,all_day,repeat_rule,reminder_offset_minutes').eq('id',args.id).eq('user_id',auth.id).maybeSingle(),'event');
 if(!data)throw new Error('Event not found');return data;
});
tool('create_event','Create an event in a calendar owned by the token user',eventFields,async(args,auth)=>{
 await ownedCalendar(auth.id,args.calendar_id);
 const start=timestamp(args.starts_at),end=timestamp(args.ends_at);if(end<=start)throw new Error('End must be after start');
 const payload={...args,user_id:auth.id,title:clean(args.title),starts_at:start,ends_at:end};
 const data=ensure(await db.from('events').insert(payload).select('id,calendar_id,title,starts_at,ends_at').single(),'create event');return data;
});
tool('update_event','Update one owned event',{id:uuid,calendar_id:uuid.optional(),title:z.string().min(1).max(300).optional(),description:z.string().optional(),location_name:z.string().optional(),location_address:z.string().optional(),starts_at:iso.optional(),ends_at:iso.optional(),all_day:z.boolean().optional(),repeat_rule:z.record(z.any()).optional(),reminder_offset_minutes:z.number().int().nonnegative().nullable().optional()},async(args,auth)=>{
 const {id,...patch}=args;if(args.calendar_id)await ownedCalendar(auth.id,args.calendar_id);
 const existing=ensure(await db.from('events').select('starts_at,ends_at').eq('id',id).eq('user_id',auth.id).maybeSingle(),'event');
 if(!existing)throw new Error('Event not found');
 if(patch.starts_at)patch.starts_at=timestamp(patch.starts_at);if(patch.ends_at)patch.ends_at=timestamp(patch.ends_at);
 if((patch.ends_at||existing.ends_at)<=(patch.starts_at||existing.starts_at))throw new Error('End must be after start');
 if(patch.title)patch.title=clean(patch.title);
 const result=ensure(await db.from('events').update(patch).eq('id',id).eq('user_id',auth.id).select('id,title,starts_at,ends_at').maybeSingle(),'update event');
 if(!result)throw new Error('Event not found');return result;
});
tool('delete_event','Delete one event if the owner enabled AI deletes',{id:uuid},async(args)=>{const result=await auditedDelete('events','delete_event',args.id);return JSON.parse(result.content[0].text)});
tool('list_tasks','List owner tasks',{include_completed:z.boolean().optional()},async(args,auth)=>{
 let q=db.from('tasks').select('id,title,notes,due_date,completed').eq('user_id',auth.id).order('due_date',{ascending:true,nullsFirst:false}).limit(200);
 if(!args.include_completed)q=q.eq('completed',false);
 return ensure(await q,'tasks');
});
tool('create_task','Create a task',{title:z.string().min(1).max(300),notes:z.string().optional(),due_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()},async(args,auth)=>{
 return ensure(await db.from('tasks').insert({...args,user_id:auth.id,title:clean(args.title)}).select('id,title,due_date,completed').single(),'create task');
});
tool('update_task','Update one owned task',{id:uuid,title:z.string().min(1).max(300).optional(),notes:z.string().optional(),due_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),completed:z.boolean().optional()},async(args,auth)=>{
 const{id,...patch}=args;const data=ensure(await db.from('tasks').update(patch).eq('id',id).eq('user_id',auth.id).select('id,title,due_date,completed').maybeSingle(),'update task');if(!data)throw new Error('Task not found');return data;
});
tool('complete_task','Mark one owned task completed',{id:uuid},async(args,auth)=>{
 const data=ensure(await db.from('tasks').update({completed:true}).eq('id',args.id).eq('user_id',auth.id).select('id,title,completed').maybeSingle(),'complete task');if(!data)throw new Error('Task not found');return data;
});
tool('delete_task','Delete one task if the owner enabled AI deletes',{id:uuid},async(args)=>{const result=await auditedDelete('tasks','delete_task',args.id);return JSON.parse(result.content[0].text)});
tool('get_ai_access','Read AI-delete permission and this token name',{},async(_,auth)=>{
 const settings=ensure(await db.from('user_settings').select('mcp_allow_delete').eq('user_id',auth.id).maybeSingle(),'AI access');
 return{token_name:auth.name,allow_deletes:!!settings?.mcp_allow_delete};
});
// A revoked or unrecognized token stops the server before stdio begins.
await owner();
await server.connect(new StdioServerTransport());
