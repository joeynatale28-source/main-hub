/* Logic-only replacement for the existing AI access Settings pane.
   Reuses Daylight's existing visual classes and components. */
(function(){
 const cloud=()=>window.DaylightCloud;
 const user=()=>cloud()?.getUser();
 const date=s=>new Date(s).toLocaleDateString();
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 function notify(e){window.toast?.(e instanceof Error?e.message:String(e))}
 const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('');
 const hex=()=>Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');
 window.paneAI=function(pane){
   paneHead(pane,'AI access','Approve AI integrations through OAuth, or create an access token.');
   const box=el('<div class="set-group"><div class="set-group-title">Tokens & approved apps</div><div id="tkList"></div>'+
     '<button class="btn-ghost" id="tkNew">'+icon("plus",15)+'Create token</button>'+
     '<p class="inline-note">OAuth clients must request your permission on a separate approval page. You can revoke them here at any time.</p>'+
     '<p class="inline-note">MCP server: https://qrqemjgpzoqhtmsowmqv.supabase.co/functions/v1/daylight-mcp</p>'+
     '<div class="set-row switch-row"><span><span class="sw-label">Allow AI deletes</span><div class="sw-sub">Off by default; approval must separately include delete permission.</div></span>'+
     switchHTML("aiAllowDelete",false)+'</div><div id="tkNewToken" style="margin-top:12px"></div></div>');
   pane.appendChild(box);
   const list=box.querySelector('#tkList'),c=cloud()?.client;
   if(!c||!user()){list.textContent='Please sign in to manage AI access.';return}
   const me=user().id;
   const toggler=box.querySelector('#aiAllowDelete');
   (async()=>{
    const {data,error}=await c.from('user_settings').select('mcp_allow_delete').eq('user_id',me).maybeSingle();
    if(!error)toggler.checked=!!data?.mcp_allow_delete;
   })().catch(notify);
   toggler.addEventListener('change',async()=>{
    toggler.disabled=true;
    const {error}=await c.from('user_settings').upsert({user_id:me,mcp_allow_delete:toggler.checked},{onConflict:'user_id'});
    if(error){toggler.checked=!toggler.checked;notify(error)}else toast(toggler.checked?'AI delete permission enabled':'AI delete permission disabled');
    toggler.disabled=false;
   });
   async function refresh(){
    list.textContent='Loading approved apps and tokens…';
    const [t,g]=await Promise.all([
      c.from('mcp_tokens').select('id,name,created_at').eq('user_id',me).eq('revoked',false).order('created_at',{ascending:false}),
      c.from('oauth_mcp_grants').select('client_id,client_name,can_read,can_write,can_delete,approved_at').eq('user_id',me).eq('revoked',false).order('approved_at',{ascending:false})
    ]);
    if(t.error||g.error){list.textContent=(t.error||g.error).message;return}
    list.innerHTML='';
    const entries=[
     ...(g.data||[]).map(x=>({kind:'oauth',name:x.client_name,subtitle:'OAuth approval · '+(x.can_write?'read & write':'read only')+(x.can_delete?' & delete':'')+' · '+date(x.approved_at),id:x.client_id})),
     ...(t.data||[]).map(x=>({kind:'token',name:x.name,subtitle:'Personal token · '+date(x.created_at),id:x.id}))
    ];
    if(!entries.length)list.append(el('<div class="empty-state" style="padding:22px">'+icon('key',24)+'<p>No authorized connections yet</p></div>'));
    for(const x of entries){
     const row=el('<div class="token-row">'+icon('key',16)+'<span class="tk-val">'+escape(x.name)+'<br><span class="tk-sub">'+escape(x.subtitle)+'</span></span><button class="btn-ghost" style="height:31px;color:var(--danger);border-color:var(--line)">Revoke</button></div>');
     row.querySelector('button').onclick=()=>{
      openConfirm({title:'Revoke '+x.name+'?',body:'This immediately blocks Daylight MCP requests from this connection.',danger:true,confirmLabel:'Revoke',fn:async()=>{
       try{
        if(x.kind==='token'){
         const {error}=await c.from('mcp_tokens').update({revoked:true}).eq('user_id',me).eq('id',x.id);if(error)throw error;
        }else{
         const {error}=await c.from('oauth_mcp_grants').update({revoked:true,updated_at:new Date().toISOString()}).eq('user_id',me).eq('client_id',x.id);
         if(error)throw error;
         // The database revocation immediately blocks MCP even if OAuth is offline.
         const response=await c.auth.oauth.revokeGrant(x.id);
         if(response.error)toast('Daylight blocked access; OAuth refresh-token revocation: '+response.error.message);
        }
        await refresh();toast('Access revoked');
       }catch(error){notify(error)}
      }});
     };
     list.append(row);
    }
   }
   box.querySelector('#tkNew').onclick=async()=>{
    const button=box.querySelector('#tkNew');button.disabled=true;
    try{
     const raw='dl_mcp_'+hex(),hash=await digest(raw),name='Daylight token · '+new Date().toLocaleDateString();
     const {error}=await c.from('mcp_tokens').insert({user_id:me,name,token_hash:hash,revoked:false});
     if(error)throw error;
     const container=box.querySelector('#tkNewToken');
     container.innerHTML='<p class="inline-note">Copy this token now. It will never be displayed again.</p><input class="text-input" id="singleToken" readonly><button class="btn-ghost" id="copySingleToken">Copy token</button>';
     container.querySelector('#singleToken').value=raw;
     container.querySelector('#copySingleToken').onclick=async()=>{try{await navigator.clipboard.writeText(raw);toast('Token copied')}catch{container.querySelector('#singleToken').select();toast('Copy the selected token')}};
     await refresh();
    }catch(error){notify(error)}finally{button.disabled=false}
   };
   refresh().catch(notify);
 };
})();
