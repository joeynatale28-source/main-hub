// Disabled by design: all Daylight accounts are created manually in the Supabase SQL Editor.
Deno.serve((req: Request) => {
 if(req.method === 'OPTIONS') return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type,apikey,authorization'}});
 return new Response(JSON.stringify({error:'Registration is disabled. Accounts are created by the owner.'}),{status:410,headers:{'content-type':'application/json','cache-control':'no-store','access-control-allow-origin':'*'}});
});
