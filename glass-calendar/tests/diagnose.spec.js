import {test,expect} from '@playwright/test';
test('diagnose drill and Photon',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push('PAGE:'+e.stack));page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE:'+m.text())});
 await page.addInitScript(()=>{localStorage.setItem('daylight-onboarded','yes');localStorage.setItem('daylight-default-view','month')});
 await page.goto('/');await expect(page.locator('.monthgrid')).toBeVisible();
 const print=async label=>console.log(label+': '+JSON.stringify(await page.evaluate(()=>({
  view:window.DaylightBridge?.getView?.(),main:document.querySelector('#calendarView')?.innerHTML?.slice(0,240),
  datebuttons:document.querySelectorAll('[data-drill-date]').length,back:document.querySelector('#drillBack')?.hidden,
  panel:document.querySelector('.day-board')?.outerHTML?.slice(0,140),active:document.querySelector('#settingsNav')?.className,
  address:document.querySelector('#addressResults')?.outerHTML?.slice(0,1000),location:document.querySelector('#eventLocation')?.value
 }))));
 await print('BEFORE');await page.locator('.monthgrid [data-drill-date]').nth(9).click();await page.waitForTimeout(300);await print('AFTER CLICK');
 let intercepts=0;await page.route('**/api/**',route=>{intercepts++;console.log('INTERCEPT '+route.request().url());return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({features:[{properties:{name:'Civic Center',city:'Richmond',state:'Virginia',country:'United States'}},{properties:{name:'Central Park',city:'New York',state:'New York',country:'United States'}}]})})});
 await page.locator('#addSide').click();await page.locator('#eventName').fill('Location test');await page.locator('#eventSave').click();await page.locator('#eventSave').click();await page.locator('#eventLocation').fill('Central');await page.waitForTimeout(1500);await print('AFTER ADDRESS');console.log('INTERCEPTS '+intercepts);console.log('ERRORS '+JSON.stringify(errors));
});