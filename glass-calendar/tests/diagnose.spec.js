import { test } from '@playwright/test';
test('diagnose presentation boot',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text())});
 await page.addInitScript(()=>localStorage.setItem('daylight-onboarded','yes'));await page.goto('/');
 await page.waitForTimeout(300);
 console.log('DIAGNOSTIC:',JSON.stringify(await page.evaluate(()=>({
   bridge:!!window.DaylightBridge,
   specScript:!!document.querySelector('script[src*="ui-spec.js"]'),
   specCSS:[...document.styleSheets].some(x=>x.href?.includes('ui-spec.css')),
   settingsNav:!!document.querySelector('#settingsNav'),
   integrationsPage:!!document.querySelector('#integrationsPage'),
   drillBack:!!document.querySelector('#drillBack'),
   location:!!document.querySelector('#eventLocation'),
   wizard:!!document.querySelector('.wizard-location'),
   jsLoaded:document.readyState,
   scripts:[...document.scripts].map(s=>s.src).filter(x=>x.endsWith('.js'))
 })),null,2)); console.log('PAGEERRORS:',JSON.stringify(errors,null,2));
});
