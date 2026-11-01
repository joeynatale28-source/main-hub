/** daylight. MCP server. Service role bypasses RLS: EVERY data query MUST filter by user_id. */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { z } from 'zod';

const url=process.env.SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
const token=process.env.DAYLIGHT_MCP_TOKEN;
if(!url||!key||!token)throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DAYLIGHT_MCP_TOKEN are required');
const sb=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
const hash=createHash('sha256').update(token).digest('hex');
const server=new McpServer({name:'daylight',version:'2.0.0'});
const text=(v:unknown)=>({content:[{type:'text' as const,text:JSON.stringify(v)}]});
const fail=(err:unknown)=>({content:[{type:'text' as const,text:err instanceof Error?err.message:String(err)}],isError:true});
const datetime=z.string().datetime({offset:true});
const uid=z.string().uuid();
const title=z.string().trim().min(1).max(300);
const nullableDate=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();
const eventFields={calendar_id:uid,title,description:z.string().optional(),location_name:z.string().optional(),location_address:z.string().optional(),starts_at:datetime,ends_at:datetime,all_day:z.boolean().optional(),repeat_rule:z.record(z.string(),z.unknown()).nullable().optional(),reminder_offset_minutes:z.number().int().nullable().optional()};
const eventUpdate={calendar_id:uid.optional(),title:title.optional(),description:z.string().optional(),location_name:z.string().optional(),location_address:z.string().optional(),starts_at:datetime.optional(),ends_at:datetime.optional(),all_day:z.boolean().optional(),repeat_rule:z.record(z.string(),z.unknown()).nullable().optional(),reminder_offset_minutes:z.number().int().nullable().optional()};
const taskFields={title,notes:z.string().optional(),due_date:nullableDate.optional()};
const taskUpdate={title:title.optional(),notes:z.string().optional(),due_date:nullableDate.optional(),completed:z.boolean().optional()};
const fields=(object:Record<string,unknown>,allowed:string[])=>Object.fromEntries(Object.entries(object).filter(([k])=>allowed.includes(k)));
async function owner(){
 // This lookup is intentionally performed on EVERY call, so revocation is immediate.
 const {data,error}=await sb.from('dl_mcp_tokens').select('id,user_id,name,revoked,last_used_at').eq('token_hash',hash).eq('revoked',false).maybeSingle();
 if(error||!data)throw new Error('Invalid or revoked Daylight MCP token');
 if(!data.last_used_at||Date.now()-new Date(data.last_used_at).getTime()>120000){await sb.from('dl_mcp_tokens').update({last_used_at:new Date().toISOString()}).eq('id',data.id).eq('user_id',data.user_id)}
 return data;
}
async function calendarFor(userId:string,calId:string){
 const {data}=await sb.from('dl_calendars').select('id,client_id').eq('user_id',userId).eq('id',calId).maybeSingle();
 if(!data||data.client_id==='us-holidays')throw new Error('Calendar not found or is read-only');
}
function tool(name:string,description:string,inputSchema:Record<string,z.ZodTypeAny>,fn:(data:any,userId:string,tokenName:string)=>Promise<unknown>){
 server.registerTool(name,{description,inputSchema},async args=>{
  try{const t=await owner();const result=await fn(args,t.user_id,t.name);return text(result)}catch(err){return fail(err)}
 });
}
const noFields={};
const eventOutput='id,user_id,calendar_id,title,description,location_name,location_address,starts_at,ends_at,all_day,repeat_rule,reminder_offset_minutes';
tool('list_calendars','List the calendar owner’s calendars',noFields,async(_,userId)=>{
 const {data,error}=await sb.from('dl_calendars').select('id,name,shade,sort_order,is_visible,client_id').eq('user_id',userId).order('sort_order');if(error)throw error;return data;
});
tool('list_events','List events within an ISO date range',{from:datetime,to:datetime,calendar_id:uid.optional()},async(args,userId)=>{
 if(new Date(args.to)<=new Date(args.from))throw Error('to must be after from');
 let q=sb.from('dl_events').select(eventOutput).eq('user_id',userId).lt('starts_at',args.to).gte('ends_at',args.from).order('starts_at').limit(500);
 if(args.calendar_id)q=q.eq('calendar_id',args.calendar_id);
 const {data,error}=await q;if(error)throw error;return data;
});
tool('get_event','Get a single event by id',{id:uid},async({id},userId)=>{
 const {data,error}=await sb.from('dl_events').select(eventOutput).eq('user_id',userId).eq('id',id).maybeSingle();if(error)throw error;if(!data)throw Error('Event not found');return data;
});
tool('create_event','Create an event owned by the token user',eventFields,async(args,userId)=>{
 await calendarFor(userId,args.calendar_id);
 if(new Date(args.ends_at)<=new Date(args.starts_at))throw Error('End must be after start');
 const {data,error}=await sb.from('dl_events').insert({...args,user_id:userId}).select(eventOutput).single();if(error)throw error;return data;
});
tool('update_event','Update a single owned event',{id:uid,...eventUpdate},async({id,...changes},userId)=>{
 if(changes.calendar_id)await calendarFor(userId,changes.calendar_id);
 const {data:old}=await sb.from('dl_events').select('starts_at,ends_at').eq('user_id',userId).eq('id',id).maybeSingle();if(!old)throw Error('Event not found');
 if(new Date(changes.ends_at||old.ends_at)<=new Date(changes.starts_at||old.starts_at))throw Error('End must be after start');
 const {data,error}=await sb.from('dl_events').update({...changes,updated_at:new Date().toISOString()}).eq('user_id',userId).eq('id',id).select(eventOutput).maybeSingle();if(error)throw error;if(!data)throw Error('Event not found');return data;
});
async function deleteOne(kind:'events'|'tasks',id:string,userId:string){
 const {data:settings,error:settingsErr}=await sb.from('dl_user_settings').select('mcp_allow_delete').eq('user_id',userId).maybeSingle();if(settingsErr)throw settingsErr;
 if(!settings?.mcp_allow_delete)throw Error('Deletes are disabled for AI access. The owner can enable them in Daylight → Settings → AI access.');
 // Atomic RPC performs an owner-scoped delete AND inserts the audit record in the same transaction.
 const {error}=await sb.rpc('dl_mcp_delete_owned_item',{p_user_id:userId,p_kind:kind,p_target_id:id});if(error)throw error;return {deleted:true,id};
}
tool('delete_event','Delete one event if owner approved AI deletions',{id:uid},async({id},userId)=>deleteOne('events',id,userId));
tool('list_tasks','List tasks for the token user',{include_completed:z.boolean().optional()},async(args,userId)=>{
 let q=sb.from('dl_tasks').select('id,title,notes,due_date,completed,created_at,updated_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(1000);
 if(!args.include_completed)q=q.eq('completed',false);const {data,error}=await q;if(error)throw error;return data;
});
tool('create_task','Create a task',taskFields,async(args,userId)=>{
 const {data,error}=await sb.from('dl_tasks').insert({...args,user_id:userId}).select('id,title,notes,due_date,completed').single();if(error)throw error;return data;
});
tool('update_task','Update one owned task',{id:uid,...taskUpdate},async({id,...changes},userId)=>{
 const {data,error}=await sb.from('dl_tasks').update({...changes,updated_at:new Date().toISOString()}).eq('user_id',userId).eq('id',id).select('id,title,notes,due_date,completed').maybeSingle();if(error)throw error;if(!data)throw Error('Task not found');return data;
});
tool('complete_task','Complete a task',{id:uid},async({id},userId)=>{
 const {data,error}=await sb.from('dl_tasks').update({completed:true,updated_at:new Date().toISOString()}).eq('user_id',userId).eq('id',id).select('id,completed').maybeSingle();if(error)throw error;if(!data)throw Error('Task not found');return data;
});
tool('delete_task','Delete one task if owner approved AI deletions',{id:uid},async({id},userId)=>deleteOne('tasks',id,userId));
tool('get_ai_access','Show token identity and AI deletion permission',noFields,async(_,userId,tokenName)=>{
 const {data,error}=await sb.from('dl_user_settings').select('mcp_allow_delete').eq('user_id',userId).maybeSingle();if(error)throw error;return {token_name:tokenName,allow_deletes:!!data?.mcp_allow_delete};
});
await server.connect(new StdioServerTransport());
