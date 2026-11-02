import './style.css';
const root=document.querySelector('#root');
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_ANON_KEY;
const configured=Boolean(url&&key&&/^https:\/\//.test(url)&&!url.includes('YOUR_PROJECT'));
const endpoint=url?.replace(/\/$/,'')+'/functions/v1/daylight-release';
const $=(s,el=document)=>el.querySelector(s),$$=(s,el=document)=>[...el.querySelectorAll(s)];
const h=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const now=()=>new Date(),iso=d=>[d.getFullYear(),('0'+(d.getMonth()+1)).slice(-2),('0'+d.getDate()).slice(-2)].join('-');
const date=s=>new Date(s+'T12:00:00'),add=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const label=d=>d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
const state={token:localStorage.getItem('dl-release-session')||'',user:null,calendars:[],events:[],tasks:[],subscriptions:[],settings:{},page:'calendar',date:now(),view:'week',drilled:false,setting:'general',edit:null,timed:false,allDay:false,mode:'event',locationAddress:'',addrResults:[],popover:null,theme:'system'};
const toast=(text)=>{let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';document.body.append(el)}el.textContent=text;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3200)};
async function api(action,data={},include=true){
 const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json',apikey:key},body:JSON.stringify({...data,action,...(include?{token:state.token}:{})})});
 let body;try{body=await r.json()}catch{throw Error('Service temporarily unavailable')}
 if(!r.ok)throw Error(body.error||'Request failed');return body;
}
async function load(){
 try{const result=await api('auth_session');state.user=result.user;const [calendars,events,tasks,subscriptions,settings]=await Promise.all(['calendars','events','tasks','subscriptions','settings'].map(async entity=>(await api('data_list',{entity})).items));Object.assign(state,{calendars,events,tasks,subscriptions,settings:settings[0]||{},date:now(),drilled:false,view:settings[0]?.default_view||'week'});applyTheme();render()}catch{localStorage.removeItem('dl-release-session');state.token='';login()}
}
function applyTheme(){let t=state.settings.theme||'system';document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t;const hex=state.settings.custom_accent_hex;document.documentElement.style.setProperty('--accent',/^#[0-9a-f]{6}$/i.test(hex||'')?hex:'#777777')}
function login(){root.innerHTML='<main class="center"><form class="login" id="login"><div class="mark">✳</div><h1>daylight.</h1><p>Welcome back.</p><label>Username<input id="username" required autocomplete="username" placeholder="Username"></label><label>Password<div class="password"><input id="password" type="password" required autocomplete="current-password" placeholder="Password"><button type="button" id="eye">◉</button></div></label><p id="authError" class="error" hidden></p><button type="submit" class="primary block" id="loginBtn">Log in</button><small>Accounts are created by Joey — there’s no sign-up.</small></form></main>';
 $('#eye').onclick=()=>$('#password').type=$('#password').type==='password'?'text':'password';
 $('#login').onsubmit=async e=>{e.preventDefault();$('#loginBtn').textContent='Logging in…';$('#loginBtn').disabled=true;try{const r=await api('auth_login',{username:$('#username').value,password:$('#password').value},false);state.token=r.token;localStorage.setItem('dl-release-session',r.token);await load()}catch{const err=$('#authError');err.hidden=false;err.textContent="That username and password don't match";$('#loginBtn').disabled=false;$('#loginBtn').textContent='Log in'}};
}
async function logout(){try{await api('auth_logout')}catch{}state.token='';localStorage.removeItem('dl-release-session');login()}
async function list(entity){return (await api('data_list',{entity})).items}
async function change(entity,id,data,action){
 const result=await api('data_'+action,{entity,...(id?{id}:{}),...(data?{data}:{})});
 if(entity==='settings')state.settings=result.item;
 else if(action==='create')state[entity].push(result.item);
 else if(action==='delete')state[entity]=state[entity].filter(x=>x.id!==id);
 else if(action==='update')state[entity]=state[entity].map(x=>x.id===id?result.item:x);
 render();return result.item;
}
function safeChange(...args){return change(...args).catch(()=>toast("Couldn't save — check your connection"))}
function visible(){return state.events.filter(e=>state.calendars.some(c=>c.id===e.calendar_id&&c.is_visible))}
function nav(page,title,ico){return '<button class="nav '+(state.page===page?'selected':'')+'" data-nav="'+page+'"><span class="glyph">'+ico+'</span>'+title+'</button>'}
function render(){if(!state.user)return;root.innerHTML='<div class="shell"><aside class="sidebar"><div class="side-header"><button id="brand" class="brand"><span class="logo">✳</span><span><strong>daylight.</strong><small>Personal calendar</small></span></button></div><div class="side-middle"><button id="newEvent" class="primary block">+ New event</button><div id="mini"></div><div class="micro">WORKSPACE</div>'+nav('calendar','Calendar','▦')+nav('integrations','Integrations','◎')+nav('tasks','Tasks','☑')+'<div class="micro">MY CALENDARS <button class="mini-add" id="newCalendar">+</button></div><div id="calList"></div><div class="micro">SUPPORT</div><button class="nav" id="settings"><span class="glyph">⚙</span>Settings</button><button class="nav" id="about"><span class="glyph">ⓘ</span>About</button></div><div class="profile"><span class="avatar">'+h(state.user.first_name?.slice(0,1))+'</span><span><strong>'+h(state.user.first_name)+' '+h(state.user.last_name)+'</strong><small>@'+h(state.user.username)+'</small></span><button class="icon" id="profileMenu">⋮</button></div></aside><main class="content" id="content"></main></div><div id="modalHost"></div><div id="toast"></div>';
 $('#brand').onclick=()=>{state.page='calendar';state.date=now();state.drilled=false;state.view=state.settings.default_view||'week';render()};$('#newEvent').onclick=()=>openEditor();
 $$('[data-nav]').forEach(x=>x.onclick=()=>{state.page=x.dataset.nav;render()});
 $('#settings').onclick=()=>settings();$('#about').onclick=()=>settings('about');$('#profileMenu').onclick=()=>menu($('#profileMenu'),[['Settings',()=>settings()],['Log out',logout]]);
 $('#newCalendar').onclick=()=>promptForm('New calendar','Name',async name=>{await safeChange('calendars',null,{name,shade:'gray-2',sort_order:state.calendars.length,is_visible:true},'create')});
 renderMini();renderCalList();state.page==='calendar'?renderCalendar():state.page==='tasks'?renderTasks():renderIntegrations();
}
function renderMini(){
 const d=state.date,first=new Date(d.getFullYear(),d.getMonth(),1),shift=state.settings.start_of_week==='monday'?1:0,start=add(first,-((first.getDay()-shift+7)%7));
 const active=iso(now());let html='<div class="mini-head"><strong>'+first.toLocaleDateString('en-US',{month:'long',year:'numeric'})+'</strong><span><button id="miniPrev" class="icon">‹</button><button id="miniNext" class="icon">›</button></span></div><div class="mini-grid">';
 for(let i=0;i<7;i++)html+='<span class="dayname">'+['S','M','T','W','T','F','S'][(i+shift)%7]+'</span>';
 for(let i=0;i<42;i++){const day=add(start,i),key=iso(day);html+='<button class="mini-date '+(day.getMonth()!==first.getMonth()?'outside ':'')+(key===active?'today ':'')+'" data-date="'+key+'">'+day.getDate()+(visible().some(e=>e.starts_at.startsWith(key))?'<i></i>':'')+'</button>'}
 $('#mini').innerHTML=html+'</div>';
 $('#miniPrev').onclick=()=>{state.date=new Date(d.getFullYear(),d.getMonth()-1,1);renderMini()};$('#miniNext').onclick=()=>{state.date=new Date(d.getFullYear(),d.getMonth()+1,1);renderMini()};$$('[data-date]',$('#mini')).forEach(x=>x.onclick=()=>drill(x.dataset.date));
}
function renderCalList(){
 $('#calList').innerHTML=state.calendars.map(c=>'<div class="cal-row '+(c.is_visible?'':'dim')+'" data-cal="'+c.id+'"><button class="switch '+(c.is_visible?'on':'')+'" role="switch" aria-checked="'+c.is_visible+'" data-hide="'+c.id+'"><span></span></button><i class="cal-dot"></i><span class="cal-name">'+h(c.name)+'</span><button class="icon" data-menu="'+c.id+'">⋮</button></div>').join('');
 $$('[data-hide]').forEach(x=>x.onclick=()=>{const c=state.calendars.find(c=>c.id===x.dataset.hide);safeChange('calendars',c.id,{is_visible:!c.is_visible},'update')});
 $$('[data-menu]').forEach(x=>x.onclick=()=>{const c=state.calendars.find(c=>c.id===x.dataset.menu);menu(x,[['Rename',()=>promptForm('Rename calendar','Name',v=>safeChange('calendars',c.id,{name:v},'update'),c.name)],[(c.is_visible?'Hide':'Unhide'),()=>safeChange('calendars',c.id,{is_visible:!c.is_visible},'update')],['Delete',()=>confirmAction('Delete '+c.name+'?','All events in this calendar will be deleted.',()=>safeChange('calendars',c.id,null,'delete'))]])});
}
function drill(key){state.date=date(key);state.drilled=true;state.view='day';state.page='calendar';render()}
function header(title,subtitle){return '<header class="view-header"><div><h1>'+h(title)+'</h1><p>'+h(subtitle)+'</p></div><div class="tools">'+(state.drilled?'<button id="backDrill" class="secondary">← Back to '+h(state.settings.default_view||'week')+'</button>':'')+'<button class="icon" id="prev">‹</button><button class="icon" id="next">›</button><button class="secondary" id="today">Today</button><button class="icon" id="searchButton">⌕</button><button class="icon" id="themeButton">◐</button><button class="icon" id="settingsButton">⚙</button></div></header>'}
function renderCalendar(){
 const d=state.date;$('#content').innerHTML=header(d.toLocaleDateString('en-US',{month:'long',year:'numeric'}),state.view==='week'?'Your weekly schedule':state.view==='month'?'Monthly overview':state.view==='day'?label(d):'Upcoming events')+'<div id="searchBar" hidden><input id="searchQuery" placeholder="Search all dates"><button id="searchClose" class="icon">×</button><div class="micro">ALL DATES</div><div id="searchResults"></div></div><section id="grid" class="calendar-grid"></section>';
 $('#backDrill')?.addEventListener('click',()=>{state.drilled=false;state.view=state.settings.default_view||'week';render()});
 $('#today').onclick=()=>{state.date=now();render()};
 const move=n=>{state.date=state.view==='month'?new Date(d.getFullYear(),d.getMonth()+n,1):add(d,n*(state.view==='week'?7:1));render()};$('#prev').onclick=()=>move(-1);$('#next').onclick=()=>move(1);
 $('#settingsButton').onclick=()=>settings();$('#themeButton').onclick=()=>{const modes=['dark','light','system'];saveSetting('theme',modes[(modes.indexOf(state.settings.theme)+1)%3])};
 $('#searchButton').onclick=()=>{$('#searchBar').hidden=!$('#searchBar').hidden;$('#searchQuery').focus()};$('#searchClose').onclick=()=>{$('#searchBar').hidden=true;$('#searchQuery').value=''};
 $('#searchQuery').oninput=e=>{$('#searchResults').innerHTML=visible().filter(x=>x.title.toLowerCase().includes(e.target.value.toLowerCase())).slice(0,30).map(x=>'<button data-detail="'+x.id+'">'+h(x.title)+' · '+h(x.starts_at.slice(0,10))+'</button>').join('');bindEventButtons()};
 if(state.view==='month')renderMonth();else if(state.view==='agenda')renderAgenda();else renderWeek();
}
function renderMonth(){
 const d=state.date,first=new Date(d.getFullYear(),d.getMonth(),1),shift=state.settings.start_of_week==='monday'?1:0,start=add(first,-((first.getDay()-shift+7)%7)),count=Math.ceil(((first.getDay()-shift+7)%7+new Date(d.getFullYear(),d.getMonth()+1,0).getDate())/7)*7;
 let html='<div class="weekdays">'+Array.from({length:7},(_,i)=>'<span>'+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][(i+shift)%7]+'</span>').join('')+'</div><div class="monthcells" style="--weeks:'+count/7+'">';
 for(let i=0;i<count;i++){const t=add(start,i),key=iso(t),events=visible().filter(e=>iso(new Date(e.starts_at))===key);html+='<div class="monthcell '+(t.getMonth()!==d.getMonth()?'outside':'')+'" data-cell="'+key+'"><button class="datenum" data-drill="'+key+'">'+t.getDate()+'</button><button class="cellplus" data-add="'+key+'">+</button>'+events.slice(0,3).map(e=>'<button class="eventchip" data-detail="'+e.id+'">'+h(e.title)+'</button>').join('')+'</div>'}
 $('#grid').innerHTML=html+'</div>';bindEventButtons();
}
function renderWeek(){
 const d=state.date,shift=state.settings.start_of_week==='monday'?1:0,start=state.view==='day'?d:add(d,-((d.getDay()-shift+7)%7)),days=Array.from({length:state.view==='day'?1:7},(_,i)=>add(start,i));
 let html='<div class="weekwrapper"><div class="weekhead" style="--cols:'+days.length+'"><div></div>'+days.map(t=>'<div><small>'+t.toLocaleDateString('en-US',{weekday:'short'})+'</small><button data-drill="'+iso(t)+'">'+t.getDate()+'</button><button data-add="'+iso(t)+'">+</button></div>').join('')+'</div><div class="weekbody" style="--cols:'+days.length+'"><div class="hours">'+Array.from({length:24},(_,i)=>'<span style="top:'+(i*60)+'px">'+(i%12||12)+' '+(i<12?'AM':'PM')+'</span>').join('')+'</div>';
 for(const t of days){const key=iso(t);html+='<div class="daytrack" data-slot="'+key+'">';for(const e of visible().filter(x=>iso(new Date(x.starts_at))===key)){const st=new Date(e.starts_at),ed=new Date(e.ends_at),minute=st.getHours()*60+st.getMinutes(),height=Math.max(25,(ed-st)/60000);html+='<button class="weekevent" data-detail="'+e.id+'" style="top:'+minute+'px;height:'+height+'px"><strong>'+h(e.title)+'</strong></button>'}html+='</div>'}
 $('#grid').innerHTML=html+'</div></div>';bindEventButtons();
 $$('[data-slot]').forEach(el=>el.onclick=e=>{if(e.target.closest('button'))return;const m=Math.max(0,Math.min(1425,Math.floor((e.clientY-el.getBoundingClientRect().top)/15)*15));openEditor(null,el.dataset.slot,('0'+Math.floor(m/60)).slice(-2)+':'+('0'+m%60).slice(-2))});
}
function renderAgenda(){
 const today=iso(now()),items=visible().filter(x=>iso(new Date(x.starts_at))>=today),days=[...new Set(items.map(x=>iso(new Date(x.starts_at))))];
 $('#grid').innerHTML='<div class="agenda">'+(days.length?days.map(d=>'<div class="agenda-group"><button class="agenda-date" data-drill="'+d+'">'+h(label(date(d)))+'</button>'+items.filter(x=>iso(new Date(x.starts_at))===d).map(x=>'<button class="agenda-item" data-detail="'+x.id+'"><strong>'+h(x.title)+'</strong><small>'+(x.all_day?'All day':new Date(x.starts_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}))+'</small></button>').join('')+'</div>').join(''):'<div class="whole-empty">No upcoming events</div>')+'</div>';bindEventButtons();
}
function bindEventButtons(){$$('[data-drill]').forEach(x=>x.onclick=e=>{e.stopPropagation();drill(x.dataset.drill)});$$('[data-add]').forEach(x=>x.onclick=e=>{e.stopPropagation();openEditor(null,x.dataset.add)});$$('[data-cell]').forEach(x=>x.onclick=e=>{if(!e.target.closest('button'))openEditor(null,x.dataset.cell)});$$('[data-detail]').forEach(x=>x.onclick=e=>{e.stopPropagation();const ev=state.events.find(e=>e.id===x.dataset.detail);if(ev)details(ev)})}
