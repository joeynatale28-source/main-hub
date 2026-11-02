import {localApi,localReset} from './secure-app/src/local-store.js';
"use strict";
/* Daylight: working implementation of the user's supplied one-page UI.
 * A browser-only application. All CRUD is through localApi; no logins, syncing or MCP. */
const ICONS={
calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
settings:'<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
help:'<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
lifebuoy:'<circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24m5.66 0 4.24-4.24m-4.24 9.9 4.24 4.24m-9.9-4.24-4.24 4.24"/><circle cx="12" cy="12" r="4"/>',
plus:'<path d="M5 12h14M12 5v14"/>',chevL:'<path d="m15 18-6-6 6-6"/>',chevR:'<path d="m9 18 6-6-6-6"/>',chevD:'<path d="m6 9 6 6 6-6"/>',
x:'<path d="M18 6 6 18M6 6l12 12"/>',check:'<path d="m20 6-11 11-5-5"/>',
clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
pin:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
repeat:'<path d="m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14m-14 16-4-4 4-4m14-1v1a4 4 0 0 1-4 4H3"/>',
pencil:'<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
trash:'<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
dotsV:'<circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"/>',
eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
eyeOff:'<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M2 2l20 20"/>',
bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
sunrise:'<path d="M17 18a5 5 0 0 0-10 0M12 9V2M4.22 10.22l1.42 1.42M1 18h2M21 18h2M18.36 11.64l1.42-1.42M23 22H1m7-16 4-4 4 4"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2m-13.66 5.66-1.41 1.41m14.14-14.14-1.41 1.41"/>',
moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
monitor:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
arrowL:'<path d="m12 19-7-7 7-7M19 12H5"/>',
sliders:'<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3"/><circle cx="12" cy="4" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="14" cy="20" r="2"/>',
droplet:'<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
sync:'<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
collapse:'<path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>',
expand:'<path d="m6 17 5-5-5-5m13 5-5-5-5-5"/>',
download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><path d="M12 15V3"/>',
list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>'
};
const icon=(name,size=18)=>'<svg class="ic" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICONS[name]||ICONS.info)+'</svg>';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const el=html=>{let d=document.createElement('div');d.innerHTML=html;return d.firstElementChild};
const $=(q,root=document)=>root.querySelector(q),$$=(q,root=document)=>[...root.querySelectorAll(q)];
const TODAY=()=>new Date();
const PALETTE={
 blue:{dot:"#5b8def",dark:"#232f47",light:"#e2ebfd",darkText:"#b9cff9",lightText:"#2c4a7c"},
 violet:{dot:"#9a7ff0",dark:"#2c2542",light:"#ece7fb",darkText:"#c9bdf6",lightText:"#513f8f"},
 green:{dot:"#43b581",dark:"#1e352e",light:"#dff2e7",darkText:"#a5dcc4",lightText:"#206045"},
 amber:{dot:"#e3a93d",dark:"#372b1c",light:"#faf0d7",darkText:"#eec987",lightText:"#7a5a17"},
 rose:{dot:"#e5646e",dark:"#38222a",light:"#fbe7ea",darkText:"#f2b3ba",lightText:"#8c3038"},
 teal:{dot:"#3fb6b2",dark:"#1d3232",light:"#dff3f2",darkText:"#a3dcd9",lightText:"#1d5f5c"},
 plum:{dot:"#c65d8f",dark:"#38222e",light:"#fae6f1",darkText:"#eda9c9",lightText:"#83355f"},
 gray:{dot:"#8a8f98",dark:"#26282c",light:"#eceef1",darkText:"#c3c8cf",lightText:"#4b5058"}
},SWATCH_ORDER=Object.keys(PALETTE);
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_S=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOWS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],DOWS_S=["SUN","MON","TUE","WED","THU","FRI","SAT"];
const REPEAT_LABELS={daily:"Repeats daily",weekly:"Repeats weekly",monthly:"Repeats monthly",yearly:"Repeats yearly"};
const dt=(y,m,d,h=0,mi=0)=>new Date(y,m,d,h,mi);
const sod=d=>dt(d.getFullYear(),d.getMonth(),d.getDate());
const addDays=(d,n)=>{let x=sod(d);x.setDate(x.getDate()+n);return x};
const addMonths=(d,n)=>dt(d.getFullYear(),d.getMonth()+n,1);
const sundayOf=d=>addDays(d,-d.getDay());
const sameDay=(a,b)=>!!a&&!!b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const pad2=n=>String(n).padStart(2,"0");
const fmtTime=d=>(d.getHours()%12||12)+":"+pad2(d.getMinutes())+(d.getHours()>=12?"pm":"am");
const fmtTimeRange=(a,b)=>fmtTime(a)+" - "+fmtTime(b);
const fmtHourLabel=h=>h===0?"12 AM":h===12?"12 PM":h<12?h+" AM":(h-12)+" PM";
const fmtDateLong=d=>DOWS[d.getDay()]+", "+MONTHS[d.getMonth()]+" "+d.getDate()+", "+d.getFullYear();
const fmtDateShort=d=>MONTHS_S[d.getMonth()]+" "+d.getDate()+", "+d.getFullYear();
const isoWeek=d=>{let x=sod(d);x.setDate(x.getDate()+3-((x.getDay()+6)%7));let f=dt(x.getFullYear(),0,4);f.setDate(f.getDate()+3-((f.getDay()+6)%7));return 1+Math.round((x-f)/86400000/7)};
const dateKey=d=>[d.getFullYear(),pad2(d.getMonth()+1),pad2(d.getDate())].join("-");
const id=()=>globalThis.crypto?.randomUUID?.()||"local-"+Date.now()+"-"+Math.random().toString(36).slice(2);
let state={
 view:"week",prevView:null,cursor:sod(TODAY()),selected:sod(TODAY()),miniCursor:dt(TODAY().getFullYear(),TODAY().getMonth(),1),
 themeMode:"dark",firstName:"Joey",lastName:"",tzLabel:"",weekNumbers:false,showDeclined:true,
 reduceMotion:false,sidebarRail:false,calendars:[],events:[],settings:{}
};
const effectiveTheme=()=>state.themeMode==="system"?(matchMedia("(prefers-color-scheme:light)").matches?"light":"dark"):state.themeMode;
const applyTheme=()=>{document.documentElement.dataset.theme=effectiveTheme();document.body.classList.toggle("reduce-motion",state.reduceMotion)};
const calOf=calId=>state.calendars.find(c=>c.id===calId)||state.calendars[0]||{id:"",name:"Personal",color:"blue",hidden:false};
const colorOf=c=>PALETTE[c?.color]||PALETTE.blue;
const dotOf=c=>colorOf(c).dot;
const tintOf=c=>colorOf(c)[effectiveTheme()==="light"?"light":"dark"];
const tintTextOf=c=>colorOf(c)[effectiveTheme()==="light"?"lightText":"darkText"];
const storageKey="daylight-preview-ui-settings";
function readUIPrefs(){try{return JSON.parse(localStorage.getItem(storageKey)||"{}")}catch{return {}}}
function saveUIPrefs(){try{localStorage.setItem(storageKey,JSON.stringify({sidebarRail:state.sidebarRail,miniCursor:dateKey(state.miniCursor)}))}catch{}}
function eventFromData(x){
 const start=new Date(x.starts_at),rawEnd=new Date(x.ends_at);
 const end=x.all_day?new Date(rawEnd.getTime()-1000):rawEnd;
 return {id:x.id,title:x.title||"Untitled",cal:x.calendar_id,start,end,allDay:!!x.all_day,
 loc:x.location_address||x.location_name||"",description:x.description||"",repeat:((x.repeat_rule||{}).frequency||"never")==="never"?null:x.repeat_rule.frequency,
 declined:["declined","cancelled"].includes(x.status),exdates:x.exdates||[]};
}
function eventToData(e){
 let end=e.end;
 if(e.allDay)end=addDays(sod(e.end),1);
 return {title:e.title,calendar_id:e.cal,starts_at:e.start.toISOString(),ends_at:end.toISOString(),all_day:e.allDay,
 description:e.description||"",location_name:e.loc,location_address:e.loc,
 repeat_rule:{frequency:e.repeat||"never"},status:e.declined?"declined":"confirmed",exdates:e.exdates||[]};
}
async function loadLocal(){
 const [ur,ca,ev,st]=await Promise.all([
  localApi("auth_session"),localApi("data_list",{entity:"calendars"}),
  localApi("data_list",{entity:"events"}),localApi("data_list",{entity:"settings"})]);
 const s=st.items[0]||{},prefs=readUIPrefs();
 state.firstName=ur.user?.first_name||"Joey";state.lastName=ur.user?.last_name||"";
 state.calendars=ca.items.map(c=>({id:c.id,name:c.name,color:PALETTE[c.shade]?c.shade:"blue",hidden:c.is_visible===false}));
 state.events=ev.items.map(eventFromData);
 state.settings=s;state.themeMode=s.theme||"dark";
 state.view=s.default_view||"week";state.weekNumbers=!!s.show_week_numbers;
 state.showDeclined=s.show_declined_events!==false;state.reduceMotion=!!s.reduce_motion;
 state.sidebarRail=!!prefs.sidebarRail;
 state.tzLabel=new Intl.DateTimeFormat("en-US",{timeZoneName:"short"}).formatToParts(new Date()).find(p=>p.type==="timeZoneName")?.value||"Local";
 applyTheme();renderAll(false);
}
async function updateSetting(changes){
 state.settings={...state.settings,...changes};
 try{await localApi("data_update",{entity:"settings",data:changes})}catch(e){toast("Local settings could not be saved");console.error(e)}
}
async function updateName(){try{await localApi("user_update",{first_name:state.firstName,last_name:state.lastName})}catch(e){toast("Name could not be saved")}}
async function saveCalendar(c,method){
 const data={name:c.name,shade:c.color,is_visible:!c.hidden};
 try{
  const saved=await localApi("data_"+method,{entity:"calendars",id:method==="create"?null:c.id,data});
  if(method==="create")c.id=saved.item.id;
  return true;
 }catch(e){toast("Calendar could not be saved locally");console.error(e);return false}
}
async function removeCalendar(c){try{await localApi("data_delete",{entity:"calendars",id:c.id});return true}catch(e){toast("Calendar could not be removed");return false}}
async function saveEvent(e,method){
 try{const r=await localApi("data_"+method,{entity:"events",id:method==="create"?null:e.id,data:eventToData(e)});if(method==="create")e.id=r.item.id;return true}
 catch(error){toast("Event could not be saved locally");console.error(error);return false}
}
async function removeEvent(e){try{await localApi("data_delete",{entity:"events",id:e.id});return true}catch(error){toast("Event could not be deleted");return false}}
function occurrences(ev,rs,re){
 const out=[],duration=ev.end-ev.start;let cur=new Date(ev.start),guard=0;
 while(guard++<600){
  const end=new Date(cur.getTime()+Math.max(60000,duration));
  if(cur>=re)break;
  if(end>rs&&!ev.exdates?.includes(dateKey(cur)))out.push({ev,start:new Date(cur),end});
  if(!ev.repeat)break;
  if(ev.repeat==="weekly")cur=dt(cur.getFullYear(),cur.getMonth(),cur.getDate()+7,cur.getHours(),cur.getMinutes());
  else if(ev.repeat==="daily")cur=dt(cur.getFullYear(),cur.getMonth(),cur.getDate()+1,cur.getHours(),cur.getMinutes());
  else if(ev.repeat==="monthly")cur=dt(cur.getFullYear(),cur.getMonth()+1,cur.getDate(),cur.getHours(),cur.getMinutes());
  else if(ev.repeat==="yearly")cur=dt(cur.getFullYear()+1,cur.getMonth(),cur.getDate(),cur.getHours(),cur.getMinutes());
  else break;
 }
 return out;
}
const visibleEvents=()=>state.events.filter(ev=>!calOf(ev.cal).hidden&&(state.showDeclined||!ev.declined));
function occsInRange(rs,re){return visibleEvents().flatMap(e=>occurrences(e,rs,re))}
function occsForDay(day){const end=addDays(day,1);return occsInRange(day,end).filter(o=>o.start<end&&o.end>day)}
function daysWithEventsInMonth(y,m){
 let set=new Set();
 occsInRange(dt(y,m,1),dt(y,m+1,1)).forEach(o=>{
  let day=sod(o.start);
  while(day<o.end){if(day.getMonth()===m)set.add(day.getDate());day=addDays(day,1);if(!o.ev.allDay)break}
 });return set;
}
function toast(msg,action){
 const root=$("#toastRoot"),node=el('<div class="toast"><span>'+esc(msg)+'</span></div>');
 let timer;const dismiss=()=>{clearTimeout(timer);node.classList.add("out");setTimeout(()=>node.remove(),220)};
 if(action){const b=el('<button class="t-action">'+esc(action.label)+'</button>');b.onclick=()=>{action.fn();dismiss()};node.append(b)}
 const x=el('<button class="t-close" aria-label="Dismiss">'+icon("x",14)+'</button>');x.onclick=dismiss;node.append(x);root.append(node);
 timer=setTimeout(dismiss,4200);
}
let openMenuEl=null,popEl=null,paletteCloseFn=null,closeDatePickerFn=null;
const closeMenu=()=>{openMenuEl?.remove();openMenuEl=null};
const closePopover=()=>{popEl?.remove();popEl=null};
function positionFloat(node,anchor,width=220,align="left"){
 document.body.append(node);const r=anchor.getBoundingClientRect(),mw=node.offsetWidth||width,mh=node.offsetHeight;
 let left=align==="right"?r.right-mw:r.left;left=Math.max(8,Math.min(left,innerWidth-mw-8));
 let top=r.bottom+6;if(top+mh>innerHeight-8)top=Math.max(8,r.top-mh-6);
 Object.assign(node.style,{left:left+"px",top:top+"px"});
}
function openMenu(anchor,items,opts={}){
 closeMenu();closePopover();
 const m=el('<div class="menu" role="menu"></div>');
 items.forEach(item=>{
  if(item.sep){m.append(el('<div class="menu-sep"></div>'));return}
  if(item.label2){m.append(el('<div class="menu-label">'+esc(item.label2)+'</div>'));return}
  const b=el('<button class="menu-item'+(item.danger?" danger":"")+'">'+(item.icon?icon(item.icon,16):'')+'<span>'+esc(item.label)+'</span>'+(item.right?'<span class="mi-right">'+icon(item.right,15)+'</span>':'')+'</button>');
  b.onclick=()=>{closeMenu();item.fn?.()};m.append(b);
 });
 positionFloat(m,anchor,220,opts.align||"left");openMenuEl=m;
 m.onkeydown=e=>{if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();let items=$$("button",m),i=items.indexOf(document.activeElement);items[(i+(e.key==="ArrowDown"?1:-1)+items.length)%items.length]?.focus()}if(e.key==="Escape")closeMenu()};
 return m;
}
function closeTopmostOverlay(){
 if(closeDatePickerFn){closeDatePickerFn();return true}
 if(openMenuEl){closeMenu();return true}
 if(paletteCloseFn){paletteCloseFn();return true}
 const top=$("#overlayRoot").lastElementChild;
 if(top){const close=$("[data-x]",top)||$("[data-cancel]",top)||$(".settings-close",top);if(close)close.click();else top.remove();return true}
 if(popEl){closePopover();return true}
 return false;
}

/* === Sidebar: same component structure and spacing as the supplied HTML. === */
const sidebarEl=$("#sidebar"),viewWrap=$("#viewWrap"),overlayRoot=$("#overlayRoot");
function renderSidebar(){
 sidebarEl.classList.toggle("rail",state.sidebarRail);sidebarEl.innerHTML="";
 const brand=el('<div class="brand-row"><div class="logo-tile">'+icon("sunrise",21)+'</div><div class="rail-hide"><div class="brand-name">daylight.</div><div class="brand-sub">Personal calendar</div></div><button class="icon-btn" id="collapseBtn" title="'+(state.sidebarRail?"Expand sidebar":"Collapse sidebar")+'" aria-label="Toggle sidebar">'+icon(state.sidebarRail?"expand":"collapse",17)+'</button></div>');
 $("#collapseBtn",brand).onclick=()=>{state.sidebarRail=!state.sidebarRail;saveUIPrefs();renderSidebar()};sidebarEl.append(brand);
 if(!state.sidebarRail)sidebarEl.append(renderMiniCal());
 const label=el('<div class="side-label rail-hide"><span>My calendars</span></div>');
 const plus=el('<button class="mini-nav" title="New calendar" aria-label="New calendar">'+icon("plus",13)+'</button>');plus.onclick=openNewCalendar;label.append(plus);sidebarEl.append(label);
 const list=el('<div id="calList"></div>');state.calendars.forEach(c=>list.append(calRow(c)));sidebarEl.append(list);
 sidebarEl.append(el('<div class="side-spacer"></div>'));
 if(!state.sidebarRail)sidebarEl.append(el('<div class="side-label rail-hide"><span>Support</span></div>'));
 const help=el('<button class="side-row" title="Help center">'+icon("lifebuoy",18)+'<span class="rail-hide">Help center</span></button>');help.onclick=openHelp;
 const settings=el('<button class="side-row" title="Settings">'+icon("settings",18)+'<span class="rail-hide">Settings</span></button>');settings.onclick=()=>openSettings("general");
 const exp=el('<button class="side-row" title="Export the current UI HTML">'+icon("download",18)+'<span class="rail-hide">Export UI code</span></button>');exp.onclick=exportUI;
 sidebarEl.append(help,settings,exp);
 const initials=(state.firstName.slice(0,1)+state.lastName.slice(0,1)).toUpperCase()||"DL";
 const profile=el('<div class="profile-wrap"><button class="profile-row" title="Local profile"><span class="avatar">'+esc(initials)+'</span><span class="rail-hide" style="min-width:0"><span class="profile-name">'+esc([state.firstName,state.lastName].filter(Boolean).join(" "))+'</span><br><span class="profile-email">Saved in this browser</span></span><span class="icon-btn rail-hide" style="pointer-events:none">'+icon("dotsV",17)+'</span></button></div>');
 $(".profile-row",profile).onclick=e=>openMenu(e.currentTarget,[
  {icon:"settings",label:"Settings",fn:()=>openSettings("general")},
  {icon:"download",label:"Export UI code",fn:exportUI},
  {icon:effectiveTheme()==="dark"?"sun":"moon",label:effectiveTheme()==="dark"?"Light theme":"Dark theme",fn:()=>{state.themeMode=effectiveTheme()==="dark"?"light":"dark";updateSetting({theme:state.themeMode});applyTheme();renderAll(false)}},
  {icon:"lifebuoy",label:"Help center",fn:openHelp}
 ],{align:"right"});
 sidebarEl.append(profile);
}
function calRow(cal){
 const row=el('<div class="cal-row"></div>');
 const dot=el('<button class="cal-dot'+(cal.hidden?" off":"")+'" title="'+(cal.hidden?"Show calendar":"Hide calendar")+'" aria-label="'+(cal.hidden?"Show ":"Hide ")+esc(cal.name)+'" style="background:'+dotOf(cal)+'"></button>');
 dot.onclick=async()=>{cal.hidden=!cal.hidden;renderSidebar();renderView(false);await saveCalendar(cal,"update")};
 const name=el('<span class="cal-name'+(cal.hidden?" off":"")+'">'+esc(cal.name)+'</span>');
 const button=el('<button class="icon-btn cal-menu-btn" title="Calendar options" aria-label="Options for '+esc(cal.name)+'">'+icon("dotsV",16)+'</button>');
 button.onclick=()=>openCalMenu(button,cal,row);row.append(dot,name,button);return row;
}
function openCalMenu(anchor,cal,row){
 const actions=[
  {icon:"pencil",label:"Rename",fn:()=>startRename(row,cal)},
  {icon:cal.hidden?"eye":"eyeOff",label:cal.hidden?"Show calendar":"Hide calendar",fn:async()=>{cal.hidden=!cal.hidden;renderSidebar();renderView(false);await saveCalendar(cal,"update")}},
  {sep:true},{label2:"Appearance · Color"}
 ];
 const menu=openMenu(anchor,actions,{align:"right"});
 const current=el('<div class="menu-current"><span class="pop-dot" style="background:'+dotOf(cal)+';margin:0"></span><span>Current: '+esc(cal.color)+'</span></div>');
 const sw=el('<div class="menu-swatches"></div>');
 SWATCH_ORDER.forEach(color=>{
  const b=el('<button class="swatch'+(cal.color===color?" sel":"")+'" style="background:'+PALETTE[color].dot+'" title="'+color+'" aria-label="Set color to '+color+'"></button>');
  b.onclick=async()=>{cal.color=color;closeMenu();renderSidebar();renderView(false);await saveCalendar(cal,"update");toast("Calendar color updated")};
  sw.append(b);
 });
 menu.append(el('<div class="menu-sep"></div>'),current,sw,el('<div class="menu-sep"></div>'));
 const del=el('<button class="menu-item danger">'+icon("trash",16)+'<span>Delete calendar</span></button>');
 del.onclick=()=>{closeMenu();confirmDeleteCalendar(cal)};menu.append(del);
 // Reposition after color picker expands, so it stays within the viewport.
 const b=anchor.getBoundingClientRect(),top=Math.min(innerHeight-menu.offsetHeight-8,b.bottom+6);
 menu.style.top=Math.max(8,top)+"px";
}
function startRename(row,cal){
 const name=$(".cal-name",row),input=el('<input class="cal-rename" aria-label="Rename calendar" value="'+esc(cal.name)+'">');
 name.replaceWith(input);input.focus();input.select();let complete=false;
 const done=async save=>{if(complete)return;complete=true;
  if(save&&input.value.trim()&&input.value.trim()!==cal.name){cal.name=input.value.trim();await saveCalendar(cal,"update");toast("Calendar renamed")}
  renderSidebar();renderView(false);
 };
 input.onblur=()=>done(true);
 input.onkeydown=e=>{if(e.key==="Enter")done(true);if(e.key==="Escape")done(false)};
}
function confirmDeleteCalendar(cal){
 const count=state.events.filter(e=>e.cal===cal.id).length;
 openConfirm({title:'Delete “'+cal.name+'”?',body:'This removes the calendar'+(count?' and its '+count+' event'+(count===1?'':'s'):'')+'. You can undo immediately after deletion.',confirmLabel:"Delete",danger:true,fn:async()=>{
  const snapshot=state.events.filter(e=>e.cal===cal.id).map(e=>({...e}));
  if(!await removeCalendar(cal))return;
  state.events=state.events.filter(e=>e.cal!==cal.id);state.calendars=state.calendars.filter(c=>c.id!==cal.id);
  renderAll(false);toast("Calendar deleted",{label:"Undo",fn:async()=>{
   const copy={...cal};if(!await saveCalendar(copy,"create"))return;
   for(const e of snapshot){e.cal=copy.id;await saveEvent(e,"create")}
   state.calendars.push(copy);state.events.push(...snapshot);renderAll(false);
  }});
 }});
}
function renderMiniCal(){
 const wrap=el('<div class="rail-hide" id="miniWrap"></div>'),mc=state.miniCursor;
 const head=el('<div class="mini-head"><button class="mini-nav" title="Previous month" aria-label="Previous mini month">'+icon("chevL",14)+'</button><span class="mini-title">'+MONTHS[mc.getMonth()]+' '+mc.getFullYear()+'</span><button class="mini-nav" title="Next month" aria-label="Next mini month">'+icon("chevR",14)+'</button></div>');
 const navs=$$(".mini-nav",head);
 navs[0].onclick=()=>{state.miniCursor=addMonths(mc,-1);saveUIPrefs();renderSidebar()};
 navs[1].onclick=()=>{state.miniCursor=addMonths(mc,1);saveUIPrefs();renderSidebar()};
 wrap.append(head,el('<div class="mini-weekdays"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div>'));
 const grid=el('<div id="miniGrid"></div>'),first=dt(mc.getFullYear(),mc.getMonth(),1),start=sundayOf(first),week=sundayOf(state.cursor),eventDays=daysWithEventsInMonth(mc.getFullYear(),mc.getMonth());
 for(let w=0;w<6;w++){
  const firstDay=addDays(start,w*7),row=el('<div class="mini-week'+(sameDay(firstDay,week)?" band":"")+'"></div>');
  for(let d=0;d<7;d++){
   const day=addDays(firstDay,d),inMonth=day.getMonth()===mc.getMonth();
   const button=el('<button class="mini-day'+(!inMonth?" dim":"")+(sameDay(day,TODAY())?" today":"")+(sameDay(day,state.selected)?" sel":"")+'" aria-label="'+esc(fmtDateLong(day))+'"><span class="num">'+day.getDate()+'</span>'+(inMonth&&eventDays.has(day.getDate())?'<span class="dot"></span>':'')+'</button>');
   button.onclick=()=>{state.selected=sod(day);state.cursor=sod(day);state.miniCursor=dt(day.getFullYear(),day.getMonth(),1);renderAll(false)};
   row.append(button);
  }grid.append(row);
 }wrap.append(grid);return wrap;
}
function renderGreeting(){
 const h=TODAY().getHours(),word=h<12?"Good morning":h<17?"Good afternoon":"Good evening";
 $("#greeting").innerHTML='<b>'+word+', '+esc(state.firstName)+'!</b> <span class="wave">👋</span>';
}
function viewRange(){
 const c=state.cursor;
 if(state.view==="month")return {title:MONTHS[c.getMonth()],sub:MONTHS[c.getMonth()]+" "+c.getFullYear()};
 if(state.view==="week"){
  const s=sundayOf(c),e=addDays(s,6);return {title:MONTHS[s.getMonth()]+" "+s.getFullYear(),sub:MONTHS[s.getMonth()]+" "+pad2(s.getDate())+" - "+MONTHS[e.getMonth()]+" "+pad2(e.getDate())};
 }
 if(state.view==="day")return {title:MONTHS[c.getMonth()]+" "+c.getFullYear(),sub:fmtDateLong(c)};
 const end=addDays(sod(c),20);return {title:"Agenda",sub:MONTHS_S[c.getMonth()]+" "+c.getDate()+" - "+MONTHS_S[end.getMonth()]+" "+end.getDate()+", "+end.getFullYear()};
}
function renderHeader(){
 const hdr=$("#headerBand"),range=viewRange();hdr.innerHTML="";
 if(state.view==="day"&&state.prevView){
  const back=el('<button class="back-btn">'+icon("arrowL",15)+'Back</button>');
  back.onclick=()=>{state.view=state.prevView;state.prevView=null;renderAll(true,-1)};hdr.append(back);
 }
 hdr.append(el('<div class="head-title-wrap"><span class="head-cal-icon">'+icon("calendar",22)+'</span><span><span class="head-title">'+esc(range.title)+'</span><br><span class="head-sub">'+esc(range.sub)+'</span></span></div>'));
 const pill=el('<div class="nav-pill"><button title="Previous">'+icon("chevL",16)+'</button><button class="today-seg">Today</button><button title="Next">'+icon("chevR",16)+'</button></div>');
 const pb=$$("button",pill);pb[0].onclick=()=>pageBy(-1);pb[1].onclick=goToday;pb[2].onclick=()=>pageBy(1);hdr.append(pill);
 const right=el('<div class="head-right"></div>');
 const search=el('<button class="icon-btn" title="Search (Ctrl+K)" aria-label="Search">'+icon("search",19)+'</button>');search.onclick=openSearch;
 const settings=el('<button class="icon-btn" title="Settings" aria-label="Settings">'+icon("settings",19)+'</button>');settings.onclick=()=>openSettings("general");
 const help=el('<button class="icon-btn" title="Help" aria-label="Help">'+icon("help",19)+'</button>');help.onclick=openHelp;
 const create=el('<button class="btn-primary" id="addEventHeader">'+icon("plus",16)+'<span class="bp-label">Add Event</span></button>');
 create.onclick=()=>openEventForm(null,state.selected);right.append(search,settings,help,create);hdr.append(right);
}
function goToday(){state.cursor=sod(TODAY());state.selected=sod(TODAY());state.miniCursor=dt(state.cursor.getFullYear(),state.cursor.getMonth(),1);renderAll(false)}
function pageBy(dir){
 const c=state.cursor;
 if(state.view==="month")state.cursor=addMonths(c,dir);
 else if(state.view==="week")state.cursor=addDays(c,7*dir);
 else if(state.view==="day")state.cursor=addDays(c,dir);
 else state.cursor=addDays(c,21*dir);
 state.miniCursor=dt(state.cursor.getFullYear(),state.cursor.getMonth(),1);renderAll(true,dir);
}
function renderAll(animate,dir=1){renderGreeting();renderHeader();renderSidebar();renderView(animate,dir)}
function drillToDay(day){
 if(state.view!=="day")state.prevView=state.view;
 state.view="day";state.cursor=sod(day);state.selected=sod(day);
 state.miniCursor=dt(day.getFullYear(),day.getMonth(),1);renderAll(true,1);
}
function renderView(animate,dir=1){
 closeMenu();closePopover();viewWrap.innerHTML="";
 let node;
 if(state.view==="month")node=renderMonth();
 else if(state.view==="week")node=renderTimeGrid(sundayOf(state.cursor),7);
 else if(state.view==="day")node=renderTimeGrid(sod(state.cursor),1);
 else node=renderAgenda();
 viewWrap.append(node);
 if(animate&&!state.reduceMotion&&!matchMedia("(prefers-reduced-motion:reduce)").matches){
  node.classList.add(dir<0?"anim-prev":"anim-next");
  const mini=$("#miniGrid");if(mini)mini.classList.add(dir<0?"mini-anim-prev":"mini-anim-next");
 }
 if(state.view==="week"||state.view==="day"){
  const scroll=$(".tg-scroll",viewWrap);if(scroll)scroll.scrollTop=Math.max(0,6.5*52-8);
 }
}
const multiDay=o=>sod(o.end)>sod(o.start);
function segmentClass(o,day){
 if(!multiDay(o))return "";
 const begins=sameDay(o.start,day),ends=sameDay(o.end,day);
 if(begins&&ends)return "";
 if(begins||day.getDay()===0)return " seg-start";
 if(ends||day.getDay()===6)return " seg-end";
 return " seg-mid";
}
/* Month reference: 6 equal week rows, a Sunday-first grid and contiguous event segments. */
function renderMonth(){
 const wrap=el('<div class="month-wrap"></div>'),y=state.cursor.getFullYear(),m=state.cursor.getMonth();
 const headers=el('<div class="dow-row'+(state.weekNumbers?" has-wn":"")+'">'+(state.weekNumbers?"<span></span>":"")+DOWS_S.map(x=>'<span class="dow-cell">'+x+'</span>').join("")+'</div>');
 wrap.append(headers);
 const grid=el('<div class="month-grid"></div>'),start=sundayOf(dt(y,m,1)),occs=occsInRange(start,addDays(start,42));
 for(let w=0;w<6;w++){
  const row=el('<div class="month-week'+(state.weekNumbers?" has-wn":"")+'"></div>'),first=addDays(start,w*7);
  if(state.weekNumbers)row.append(el('<div class="wn-cell">'+isoWeek(addDays(first,3))+'</div>'));
  for(let d=0;d<7;d++){
   const day=addDays(first,d),inside=day.getMonth()===m;
   const items=occs.filter(o=>sod(o.start)<=day&&sod(o.end)>=day)
    .sort((a,b)=>(b.ev.allDay||multiDay(b))-(a.ev.allDay||multiDay(a))||a.start-b.start);
   const cell=el('<div class="day-cell'+(!inside?" out":"")+(sameDay(day,TODAY())?" today":"")+(sameDay(day,state.selected)?" sel":"")+([0,6].includes(day.getDay())&&!items.length?" hatch":"")+'"></div>');
   const num=el('<button class="day-num" title="'+fmtDateLong(day)+'">'+day.getDate()+'</button>');num.onclick=()=>drillToDay(day);
   const add=el('<button class="cell-add" title="Add event" aria-label="Add event on '+fmtDateLong(day)+'">'+icon("plus",14)+'</button>');
   add.onclick=e=>{e.stopPropagation();openEventForm(null,day)};
   cell.append(num,add);
   const events=el('<div class="cell-events"></div>'),limit=innerWidth<=700?2:3;
   items.slice(0,limit).forEach(o=>{
    const cal=calOf(o.ev.cal),seg=segmentClass(o,day),show=sameDay(o.start,day)||day.getDay()===0||!seg;
    const chip=el('<button class="chip'+seg+'" style="background:'+tintOf(cal)+';color:'+tintTextOf(cal)+'">'+(show?'<span class="chip-title">'+esc(o.ev.title)+'</span>'+(!o.ev.allDay&&!multiDay(o)?'<span class="chip-time">'+fmtTime(o.start)+'</span>':''):'<span class="chip-title">&nbsp;</span>')+'</button>');
    chip.setAttribute("aria-label",o.ev.title);chip.onclick=e=>{e.stopPropagation();openPopover(o,chip)};events.append(chip);
   });
   if(items.length>limit){
    const more=el('<button class="more-link">+'+(items.length-limit)+' more</button>');more.onclick=()=>drillToDay(day);events.append(more);
   }
   cell.append(events);cell.onclick=e=>{if(e.target.closest("button"))return;state.selected=sod(day);renderSidebar();$$(".day-cell.sel",viewWrap).forEach(x=>x.classList.remove("sel"));cell.classList.add("sel")};
   row.append(cell);
  }grid.append(row);
 }wrap.append(grid);return wrap;
}
const HOUR_PX=52;
function layoutDayEvents(list){
 const items=list.map(o=>{
  const s=o.start.getHours()*60+o.start.getMinutes(),rawEnd=o.end.getHours()*60+o.end.getMinutes();
  return {o,s,e:Math.max(s+15,rawEnd),col:0,cols:1};
 }).sort((a,b)=>a.s-b.s||b.e-a.e);
 let clusters=[],current=[],clusterEnd=-1;
 items.forEach(it=>{if(current.length&&it.s>=clusterEnd){clusters.push(current);current=[];clusterEnd=-1}current.push(it);clusterEnd=Math.max(clusterEnd,it.e)});
 if(current.length)clusters.push(current);
 clusters.forEach(cluster=>{let columns=[];cluster.forEach(it=>{
  let index=columns.findIndex(end=>end<=it.s);if(index<0){index=columns.length;columns.push(it.e)}else columns[index]=it.e;
  it.col=index;
 });cluster.forEach(it=>it.cols=columns.length)});
 return items;
}
function renderTimeGrid(firstDay,numDays){
 const days=Array.from({length:numDays},(_,i)=>addDays(firstDay,i)),occs=occsInRange(firstDay,addDays(firstDay,numDays));
 const template="56px repeat("+numDays+",1fr)",wrap=el('<div class="tg-wrap"></div>');
 const head=el('<div class="tg-head" style="grid-template-columns:'+template+'"></div>');
 head.append(el('<div class="tg-gutter-head">'+esc(state.tzLabel)+'</div>'));
 days.forEach(day=>{
  const h=el('<div class="tg-day-head'+(sameDay(day,TODAY())?" today":"")+'"><span class="dow">'+DOWS_S[day.getDay()]+'</span><button class="dnum">'+day.getDate()+'</button></div>');
  $(".dnum",h).onclick=()=>{if(numDays>1)drillToDay(day)};head.append(h);
 });wrap.append(head);
 const allRow=el('<div class="allday-row" style="grid-template-columns:'+template+'"></div>');
 allRow.append(el('<div class="allday-label">All-day</div>'));
 days.forEach(day=>{
  const cell=el('<div class="allday-cell"></div>');
  occs.filter(o=>o.ev.allDay&&sod(o.start)<=day&&sod(o.end)>=day).forEach(o=>{
   const cal=calOf(o.ev.cal),start=sameDay(o.start,day)||day.getDay()===0||numDays===1;
   const seg=numDays===1?"":segmentClass(o,day);
   const bar=el('<button class="allday-bar'+seg+'" style="background:'+tintOf(cal)+';color:'+tintTextOf(cal)+'" aria-label="'+esc(o.ev.title)+'">'+(start?esc(o.ev.title):'&nbsp;')+'</button>');
   bar.onclick=e=>{e.stopPropagation();openPopover(o,bar)};cell.append(bar);
  });allRow.append(cell);
 });wrap.append(allRow);
 if(numDays===1&&!occs.length){
  wrap.append(el('<div class="empty-state">'+icon("calendar",30)+'<p>No events yet</p><button class="btn-primary" style="margin:8px 0 0" id="createEmpty">Add Event</button></div>'));
  $("#createEmpty",wrap).onclick=()=>openEventForm(null,firstDay);
  return wrap;
 }
 const scroll=el('<div class="tg-scroll"></div>'),body=el('<div class="tg-body" style="grid-template-columns:'+template+';height:'+(24*HOUR_PX)+'px"></div>');
 const gutter=el('<div class="tg-gutter"></div>');
 for(let hour=1;hour<24;hour++)gutter.append(el('<span class="hour-label" style="top:'+(hour*HOUR_PX)+'px">'+fmtHourLabel(hour)+'</span>'));
 body.append(gutter);
 days.forEach(day=>{
  const col=el('<div class="tg-col'+([0,6].includes(day.getDay())?" hatch":"")+'"><div class="hour-lines"></div></div>');
  const events=occs.filter(o=>!o.ev.allDay&&sameDay(o.start,day));
  layoutDayEvents(events).forEach(it=>{
   const o=it.o,cal=calOf(o.ev.cal),top=it.s/60*HOUR_PX,height=Math.max(26,(it.e-it.s)/60*HOUR_PX-3);
   const left=it.col/it.cols*100,width=100/it.cols;
   const card=el('<button class="ev-card" data-event-id="'+esc(o.ev.id)+'" style="top:'+top+'px;height:'+height+'px;left:calc('+left+'% + 3px);width:calc('+width+'% - 6px);background:'+tintOf(cal)+';color:'+tintTextOf(cal)+'"><span class="ev-title">'+esc(o.ev.title)+'</span>'+(height>=44?'<span class="ev-time">'+fmtTimeRange(o.start,o.end)+'</span>':'')+(o.ev.loc&&height>=66?'<span class="ev-loc">'+esc(o.ev.loc)+'</span>':'')+'</button>');
   if(height<58)$(".ev-title",card).style.webkitLineClamp="1";
   card.onclick=e=>{e.stopPropagation();openPopover(o,card)};
   col.append(card);
  });
  col.addEventListener("dblclick",e=>{if(e.target.closest(".ev-card"))return;const min=Math.floor(e.offsetY/HOUR_PX*60/30)*30;openEventForm(null,day,null,Math.max(0,Math.min(1380,min)))});
  body.append(col);
 });
 const now=TODAY();
 if(days.some(d=>sameDay(d,now))){
  const top=(now.getHours()*60+now.getMinutes())/60*HOUR_PX;
  body.append(el('<div class="now-line" style="top:'+top+'px;left:56px"><span class="now-seg"></span><span class="now-dot"></span></div>'));
  body.append(el('<span class="now-pill" style="top:'+top+'px;left:2px;right:auto">'+(now.getHours()%12||12)+':'+pad2(now.getMinutes())+' '+(now.getHours()>=12?"PM":"AM")+'</span>'));
 }
 scroll.append(body);wrap.append(scroll);return wrap;
}
function renderAgenda(){
 const start=sod(state.cursor),end=addDays(start,21),occs=occsInRange(start,end),groups=new Map();
 occs.forEach(o=>{const key=dateKey(o.start);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o)});
 const scroll=el('<div class="agenda-scroll"></div>'),inner=el('<div class="agenda-inner"></div>');
 if(!groups.size)inner.append(el('<div class="empty-state">'+icon("calendar",30)+'<p>No events yet</p></div>'));
 [...groups].sort(([a],[b])=>a.localeCompare(b)).forEach(([key,items])=>{
  const day=sod(items[0].start),head=el('<div class="agenda-day-head"><span class="ad-name">'+DOWS[day.getDay()]+'</span><span class="ad-date">'+fmtDateShort(day)+'</span>'+(sameDay(day,TODAY())?'<span class="ad-today">Today</span>':'')+'</div>');
  inner.append(head);
  items.sort((a,b)=>(a.ev.allDay?0:1)-(b.ev.allDay?0:1)||a.start-b.start).forEach(o=>{
   const cal=calOf(o.ev.cal),meta=o.ev.allDay?(multiDay(o)?fmtDateShort(o.start)+" - "+fmtDateShort(o.end):"All day"):fmtTimeRange(o.start,o.end);
   const card=el('<button class="agenda-card" style="background:'+tintOf(cal)+';color:'+tintTextOf(cal)+'"><span class="ac-bar" style="background:'+dotOf(cal)+'"></span><span><span class="ac-title">'+esc(o.ev.title)+'</span><span class="ac-meta">'+icon("clock",13)+'<span>'+esc(meta)+'</span>'+(o.ev.loc?icon("pin",13)+'<span>'+esc(o.ev.loc)+'</span>':'')+'</span></span></button>');
   card.onclick=e=>{e.stopPropagation();openPopover(o,card)};inner.append(card);
  });
 });
 scroll.append(inner);const wrap=el('<div style="display:flex;flex-direction:column;flex:1;min-height:0"></div>');wrap.append(scroll);return wrap;
}
