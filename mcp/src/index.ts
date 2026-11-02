import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { z } from 'zod/v4';
const url=process.env.SUPABASE_URL,secret=process.env.SUPABASE_SERVICE_ROLE_KEY,raw=process.env.DAYLIGHT_MCP_TOKEN;
if(!url||!secret||!raw){console.error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DAYLIGHT_MCP_TOKEN');process.exit(1)}
const sb=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const hash=createHash('sha256').update(raw).digest('hex');
const disabled='Deletes are disabled for AI access. The owner can enable them in Daylight → Settings → AI access.';
const uuid=z.uuid(),nonempty=z.string().trim().min(1),iso=z.iso.datetime({offset:true});
const eventFields=z.object({calendar_id:uuid,title:nonempty,description:z.string().optional(),location_name:z.string().optional(),location_address:z.string().optional(),starts_at:iso,ends_at:iso,all_day:z.boolean().optional(),repeat_rule:z.record(z.string(),z.unknown()).optional(),reminder_offset_minutes:z.number().int().nullable().optional()});
const eventPatch=eventFields.partial().extend({id:uuid});
const taskFields=z.object({title:nonempty,notes:z.string().optional(),due_date:z.iso.date().nullable().optional()});
const taskPatch=taskFields.partial().extend({id:uuid});
async function context(){
 const {data,error}=await sb.from('dl_mcp_tokens').select('id,user_id,revoked').eq('token_hash',hash).maybeSingle();
 if(error||!data||data.revoked)throw new Error('Invalid or revoked Daylight MCP token');
 await sb.from('dl_mcp_tokens').update({last_used_at:new Date().toISOString()}).eq('id',data.id).eq('user_id',data.user_id);
 return data.user_id as string;
}
async function guarded(uid:string){
 const {data,error}=await sb.from('dl_user_settings').select('mcp_allow_delete').eq('user_id',uid).single();
 if(error)throw error;
 if(!data.mcp_allow_delete)throw new Error(disabled);
}
async function calendar(uid:string,id:string){
 const {data}=await sb.from('dl_calendars').select('id,client_id').eq('user_id',uid).eq('id',id).maybeSingle();
 if(!data||data.client_id==='us-holidays')throw new Error('Unknown or read-only calendar');
}
async function query<T>(q:PromiseLike<{data:T;error:{message:string}|null}>):Promise<T>{const {data,error}=await q;if(error)throw new Error(error.message);return data}
const response=(r:unknown)=>({content:[{type:'text' as const,text:JSON.stringify(r)}]});
function register(server:McpServer,name:string,description:string,schema:z.ZodRawShape,run:(uid:string,a:any)=>Promise<unknown>){
 server.registerTool(name,{description,inputSchema:z.object(schema)},async a=>{
  try{const uid=await context();const data=await run(uid,a);return response(data)}
  catch(e){return{isError:true,content:[{type:'text',text:e instanceof Error?e.message:'Operation failed'}]}}
 });
}
async function deleteOne(uid:string,entity:'events'|'tasks',id:string){
 await guarded(uid);
 const table=entity==='events'?'dl_events':'dl_tasks';
 const existing=await query(sb.from(table).select('id').eq('user_id',uid).eq('id',id).maybeSingle());
 if(!existing)throw new Error('Not found');
 // Service-role bypasses RLS, so both the delete AND audit must be user-scoped.
 const removed=await query(sb.from(table).delete().eq('user_id',uid).eq('id',id).select('id').single());
 await query(sb.from('dl_mcp_audit_log').insert({user_id:uid,tool:'delete_'+(entity==='events'?'event':'task'),action:'delete',target_id:id}).select('id').single());
 return{deleted:removed.id};
}
const createServer=()=>{
 const server=new McpServer({name:'daylight',version:'1.1.0'});
 register(server,'list_calendars','List calendars',{ },async uid=>await query(sb.from('dl_calendars').select('id,name,shade,is_visible').eq('user_id',uid).order('sort_order')));
 register(server,'list_events','List events within a date range',{from:iso,to:iso,calendar_id:uuid.optional()},async(uid,a)=>{
  if(Date.parse(a.to)<Date.parse(a.from))throw new Error('Invalid date range');
  let q=sb.from('dl_events').select('*').eq('user_id',uid).gte('starts_at',a.from).lt('starts_at',a.to).order('starts_at').limit(1000);
  if(a.calendar_id)q=q.eq('calendar_id',a.calendar_id);return await query(q);
 });
 register(server,'get_event','Read an event',{id:uuid},async(uid,a)=>{const data=await query(sb.from('dl_events').select('*').eq('user_id',uid).eq('id',a.id).maybeSingle());if(!data)throw new Error('Not found');return data});
 register(server,'create_event','Create a calendar event',eventFields.shape,async(uid,a)=>{
  await calendar(uid,a.calendar_id);
  if(Date.parse(a.ends_at)<=Date.parse(a.starts_at))throw new Error('End must be after start');
  return await query(sb.from('dl_events').insert({...a,user_id:uid}).select('*').single());
 });
 register(server,'update_event','Modify an existing event',eventPatch.shape,async(uid,a)=>{
  const {id,...changes}=a;
  const existing=await query(sb.from('dl_events').select('*').eq('user_id',uid).eq('id',id).maybeSingle());
  if(!existing)throw new Error('Not found');if(existing.source_subscription_id)throw new Error('Subscribed events are read-only');
  if(changes.calendar_id)await calendar(uid,changes.calendar_id);
  if(Date.parse(changes.ends_at||existing.ends_at)<=Date.parse(changes.starts_at||existing.starts_at))throw new Error('End must be after start');
  return await query(sb.from('dl_events').update(changes).eq('user_id',uid).eq('id',id).select('*').single());
 });
 register(server,'delete_event','Delete one event',{id:uuid},async(uid,a)=>deleteOne(uid,'events',a.id));
 register(server,'list_tasks','List tasks',{include_completed:z.boolean().optional()},async(uid,a)=>{
  let q=sb.from('dl_tasks').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(1000);
  if(!a.include_completed)q=q.eq('completed',false);return await query(q);
 });
 register(server,'create_task','Create a task',taskFields.shape,async(uid,a)=>await query(sb.from('dl_tasks').insert({...a,user_id:uid}).select('*').single()));
 register(server,'update_task','Modify a task',taskPatch.shape,async(uid,a)=>{const {id,...patch}=a;return await query(sb.from('dl_tasks').update(patch).eq('user_id',uid).eq('id',id).select('*').single())});
 register(server,'complete_task','Mark a task complete',{id:uuid},async(uid,a)=>await query(sb.from('dl_tasks').update({completed:true}).eq('user_id',uid).eq('id',a.id).select('*').single()));
 register(server,'delete_task','Delete one task',{id:uuid},async(uid,a)=>deleteOne(uid,'tasks',a.id));
 register(server,'get_ai_access','Read AI access policy',{ },async uid=>await query(sb.from('dl_user_settings').select('mcp_allow_delete').eq('user_id',uid).single()));
 return server;
};
void serveStdio(createServer);
