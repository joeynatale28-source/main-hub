/* Daylight release fixes: reliable tooltip event delegation and UI layout. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const sidebar=document.querySelector('.sidebar'), app=document.querySelector('.app');
  if(!sidebar||!app)return;
  const tooltip=$('railTooltip');
  if(tooltip){
    let timer=0,active=null;
    const collapsed=()=>app.classList.contains('sidebar-collapsed')&&!matchMedia('(max-width:720px)').matches;
    const dismiss=()=>{clearTimeout(timer);timer=0;active=null;tooltip.hidden=true};
    // Capture these events before the old generic pointerover handler, which
    // reset its timer when the pointer moved from a button to its SVG child.
    sidebar.addEventListener('pointerover',e=>{
      const button=e.target.closest('button.nav,button.rail-calendar-dot,button#addSide,button#collapseSidebar,button#profileMenuBtn,button#brandToday,button.support-nav');
      if(!button||!sidebar.contains(button)||!collapsed())return;
      e.stopImmediatePropagation();
      if(button===active&&button.contains(e.relatedTarget))return;
      dismiss();active=button;
      const name=button.getAttribute('aria-label')||button.title||button.querySelector('.nav-label')?.textContent.trim()||'';
      if(!name)return;
      timer=setTimeout(()=>{
        if(!collapsed()||active!==button||!button.isConnected)return;
        const box=button.getBoundingClientRect();
        tooltip.textContent=name;
        tooltip.style.left=Math.min(innerWidth-140,box.right+12)+'px';
        tooltip.style.top=Math.max(8,Math.min(innerHeight-38,box.top+Math.max(0,(box.height-30)/2)))+'px';
        tooltip.hidden=false;
      },300);
    },true);
    sidebar.addEventListener('pointerout',e=>{
      if(!collapsed())return;
      e.stopImmediatePropagation();
      if(active&&!active.contains(e.relatedTarget))dismiss();
    },true);
    document.addEventListener('pointerdown',dismiss,true);
    window.addEventListener('resize',dismiss);
    sidebar.addEventListener('scroll',dismiss,true);
  }
  // Hard refresh never restores scroll position, including the rail and main region.
  const reset=()=>{const middle=sidebar.querySelector('.sidebar-middle');if(middle)middle.scrollTop=0;const week=$('weekScroll');if(week)week.scrollTop=0};
  window.addEventListener('pageshow',e=>{if(e.persisted)reset()});
})();
