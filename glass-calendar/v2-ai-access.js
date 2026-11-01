(()=>{
'use strict';
const $=id=>document.getElementById(id),cloud=window.DaylightCloud,db=cloud?.supabase,user=cloud?.getUser();
if(!db||!user)return;
const sec=document.createElement('section');sec.id='settingsAI';sec.className='setting-group ai-access-section';
sec.innerHTML='<div class="setting-header"><h2>AI access</h2><p>Tokens allow an agent to access your calendars and tasks through MCP.</p></div><div class="setting-item"><div><strong>Allow AI deletes</strong><small>Off by default. Requires your confirmation to enable.</small></div><label class="switch-row"><input id="aiAllowDelete" type="checkbox" role="switch"></label></div><div class="ai-tokens"><div class="ai-section-head"><strong>Access tokens</strong><button id="aiGenerate" class="primary">Generate token</button></div><div id="aiTokenList"></div></div><div class="ai-help"><strong>Connect an agent</strong><p>Run <code>node dist/index.js</code> with <code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code>, and <code>DAYLIGHT_MCP_TOKEN</code>. Never expose your service-role key in the browser.</p></div>';
$('settingsAbout').before(sec);
const nav=document.querySelector('.settings-sections'),a=document.createElement('button');a.className='settings-anchor';a.dataset.target='settingsAI';a.textContent='AI access';nav.querySelector('[data-target="settingsAbout"]').before(a);a.onclick=()=>sec.scrollIntoView({block:'start',behavior:'smooth'});
const modal=document.createElement('dialog');modal.className='dialog ai-dialog';document.body.append(modal);let opener;
function open(html){opener=document.activeElement;modal.innerHTML=html;modal.showModal()}
function close(){modal.close();opener?.focus?.()}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
$('aiAllowDelete').checked=!!cloud.settings.mcp_allow_delete;
$('aiAllowDelete').onchange=async e=>{
 const input=e.target;
 if(!input.checked){const {error}=await db.from('user_settings').update({mcp_allow_delete:false}).eq('user_id',user.id);if(error)input.checked=true;else cloud.settings.mcp_allow_delete=false;return}
 input.checked=false;
 open('<div class="ai-danger-mark">!</div><h2>Allow AI agents to delete?</h2><p>An AI agent with your token could permanently delete events or tasks. Deletes are logged but cannot be undone.</p><div class="dialogactions"><button id="aiCancel" class="outline">Cancel</button><button id="aiConfirm" class="ai-danger-button">I understand — enable deletes</button></div>');
 $('aiCancel').onclick=close;
 $('aiConfirm').onclick=async()=>{const b=$('aiConfirm');b.disabled=true;const {error}=await db.from('user_settings').update({mcp_allow_delete:true}).eq('user_id',user.id);if(error){b.disabled=false;return}input.checked=true;cloud.settings.mcp_allow_delete=true;close()};
};
async function list(){
 const box=$('aiTokenList');box.textContent='Loading…';
 const {data,error}=await db.from('mcp_tokens').select('id,name,created_at,last_used_at').eq('user_id',user.id).eq('revoked',false).order('created_at',{ascending:false});
 if(error){box.textContent="Couldn't load tokens";return}
 if(!data?.length){box.textContent='No tokens yet';return}
 box.replaceChildren();for(const token of data){
  const row=document.createElement('div');row.className='ai-token-row';
  const info=document.createElement('div'),name=document.createElement('strong'),details=document.createElement('small');
  name.textContent=token.name;details.textContent='Created '+new Date(token.created_at).toLocaleDateString()+' · Last used '+(token.last_used_at?new Date(token.last_used_at).toLocaleDateString():'Never');
  info.append(name,details);const revoke=document.createElement('button');revoke.type='button';revoke.className='outline';revoke.textContent='Revoke';row.append(info,revoke);box.append(row);
  revoke.onclick=()=>{
   open('<h2>Revoke token?</h2><p>'+escape(token.name)+' will stop working immediately.</p><div class="dialogactions"><button id="aiCancel" class="outline">Cancel</button><button id="aiRevoke" class="primary">Revoke token</button></div>');
   $('aiCancel').onclick=close;
   $('aiRevoke').onclick=async()=>{const b=$('aiRevoke');b.disabled=true;const {error}=await db.from('mcp_tokens').update({revoked:true}).eq('user_id',user.id).eq('id',token.id);if(error){b.disabled=false;return}close();list()};
  };
 }
}
async function sha(s){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function newToken(){return 'dl_mcp_'+btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
$('aiGenerate').onclick=()=>{
 open('<h2>Generate token</h2><label class="field-label">Token name<input id="aiTokenName" maxlength="100" placeholder="My assistant"></label><div class="dialogactions"><button id="aiCancel" class="outline">Cancel</button><button id="aiMake" class="primary">Generate token</button></div>');
 $('aiCancel').onclick=close;
 $('aiMake').onclick=async()=>{
  const name=$('aiTokenName').value.trim();if(!name)return $('aiTokenName').focus();
  $('aiMake').disabled=true;const raw=newToken(),hash=await sha(raw);
  const {error}=await db.from('mcp_tokens').insert({user_id:user.id,name,token_hash:hash});
  if(error){$('aiMake').disabled=false;return}
  modal.replaceChildren();const h=document.createElement('h2');h.textContent='Copy your token now';const note=document.createElement('p');note.textContent="You won't see this again.";const field=document.createElement('input');field.value=raw;field.readOnly=true;field.className='ai-token-secret';const controls=document.createElement('div');controls.className='dialogactions';const copy=document.createElement('button');copy.className='primary';copy.textContent='Copy';copy.onclick=async()=>{await navigator.clipboard.writeText(field.value);copy.textContent='Copied ✓'};const done=document.createElement('button');done.className='outline';done.textContent='Done';done.onclick=()=>{field.value='';close();list()};controls.append(copy,done);modal.append(h,note,field,controls);
 };
};
list();
})();