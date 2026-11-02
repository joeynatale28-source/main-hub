import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
const transport=new StdioClientTransport({command:'npx',args:['tsx','src/index.ts'],env:{...process.env} as Record<string,string>});
const client=new Client({name:'daylight-smoke',version:'1.0.0'});
await client.connect(transport);
async function call(name:string,args:Record<string,unknown>={}){
 const result=await client.callTool({name,arguments:args});
 const value=result.content?.find(x=>x.type==='text');
 const content=String(value?.text||'');
 if(result.isError)throw new Error(name+': '+content);
 return JSON.parse(content);
}
try{
 const calendars=await call('list_calendars');
 const writable=calendars.find((c:any)=>c.client_id!=='us-holidays'&&c.name!=='US Holidays');
 if(!writable)throw Error('No writable calendars');
 const start=new Date(Date.now()+172800000);start.setHours(10,0,0,0);
 const end=new Date(start.getTime()+3600000),from=new Date(start.getTime()-3600000),to=new Date(end.getTime()+3600000);
 const event=await call('create_event',{calendar_id:writable.id,title:'Daylight MCP smoke event',starts_at:start.toISOString(),ends_at:end.toISOString()});
 const listed=await call('list_events',{from:from.toISOString(),to:to.toISOString()});
 if(!listed.some((e:any)=>e.id===event.id))throw Error('Created event not found');
 const task=await call('create_task',{title:'Daylight MCP smoke task'});
 const completed=await call('complete_task',{id:task.id});
 if(!completed.completed)throw Error('Task not marked complete');
 const refused=await client.callTool({name:'delete_event',arguments:{id:event.id}});
 if(!refused.isError||!JSON.stringify(refused.content).includes('Deletes are disabled for AI access'))throw Error('Expected delete to be blocked');
 console.log('PASS: list/create/list/task/complete/delete-disabled');
 console.log('Smoke test left one event and one completed task. Clean them up in the app.');
}catch(e){console.error(e);process.exitCode=1}finally{await client.close()}
