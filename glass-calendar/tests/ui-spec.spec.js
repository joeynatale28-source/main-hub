import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('daylight-onboarded','yes');
    localStorage.setItem('daylight-default-view','month');
    localStorage.removeItem('daylight-last-view');
    localStorage.removeItem('daylight-last-date');
    localStorage.removeItem('daylight-wizard-draft-v1');
    localStorage.removeItem('daylight-sidebar-collapsed');
  });
  await page.goto('/');
  await expect(page.locator('#calendarView')).toBeVisible();
});

test('workspace views replace the calendar without covering the sidebar',async({page})=>{
  await page.locator('#integrationsNav').click();
  await expect(page.locator('#integrationsPage')).toBeVisible();
  await expect(page.locator('#calendarContent')).toBeHidden();
  await expect(page.locator('.sidebar')).toBeVisible();
  const side=await page.locator('.sidebar').boundingBox();
  const view=await page.locator('#integrationsPage').boundingBox();
  expect(view.x).toBeGreaterThan(side.x+side.width-3);
  await page.locator('#settingsNav').click();
  await expect(page.locator('#settingsPage')).toBeVisible();
  await expect(page.locator('#integrationsPage')).toBeHidden();
  await expect(page.locator('#settingsSearch')).toBeVisible();
  await page.locator('#openIntegrationView').click();
  await expect(page.locator('#integrationsPage')).toBeVisible();
  await page.locator('.nav[data-view="month"]').click();
  await expect(page.locator('.monthgrid')).toBeVisible();
});

test('date numbers drill in without altering the default view and Escape returns',async({page})=>{
  await expect(page.locator('.view-toggle')).toBeHidden();
  const number=page.locator('.monthgrid [data-drill-date]').nth(9);
  const day=await number.getAttribute('data-drill-date');
  await number.click();
  await expect(page.locator('.day-board')).toBeVisible();
  await expect(page.locator('#drillBack')).toContainText('Month');
  await expect(page.locator('#pageRange')).toContainText(new Date(day+'T12:00').toLocaleDateString('en-US',{month:'long'}));
  await page.keyboard.press('Escape');
  await expect(page.locator('.monthgrid')).toBeVisible();
  await page.locator('.mini-day').nth(8).click();
  await expect(page.locator('.day-board')).toBeVisible();
  await page.locator('#drillBack').click();
  await expect(page.locator('.monthgrid')).toBeVisible();
  await page.locator('#settingsNav').click();
  await expect(page.locator('#defaultViewSelect')).toHaveValue('month');
});

test('settings custom select uses the selected option as its label',async({page})=>{
  await page.locator('#settingsNav').click();
  await expect(page.locator('#settingsCalendar')).toBeVisible();
  const native=page.locator('#defaultViewSelect');
  const closed=page.locator('#defaultViewSelect + .select-button');
  await expect(closed).toHaveText('Month');
  await closed.click();
  await page.locator('.select-menu[data-owner="defaultViewSelect"] .select-option').filter({hasText:'Week'}).click();
  await expect(native).toHaveValue('week');
  await expect(closed).toHaveText('Week');
  await page.locator('.nav[data-view="month"]').click();
  await expect(page.locator('.week-board')).toBeVisible();
  await page.locator('.week-day-number').nth(2).click();
  await expect(page.locator('.day-board')).toBeVisible();
  await expect(page.locator('#drillBack')).toContainText('Week');
  await page.locator('#drillBack').click();
  await expect(page.locator('.week-board:not(.day-board)')).toBeVisible();
});

test('wizard discard clears the saved draft atomically',async({page})=>{
  await page.locator('#addSide').click();
  await page.locator('#eventName').fill('Should disappear');
  await expect.poll(()=>page.evaluate(()=>!!localStorage.getItem('daylight-wizard-draft-v1'))).toBe(true);
  await page.locator('#eventDialog [data-close]').first().click();
  await expect(page.locator('#wizardDiscard')).toBeVisible();
  await page.locator('#wizardDiscardButton').click();
  await expect(page.locator('#eventDialog')).toBeHidden();
  expect(await page.evaluate(()=>localStorage.getItem('daylight-wizard-draft-v1'))).toBeNull();
  await page.locator('#addSide').click();
  await expect(page.locator('#wizardResume')).toBeHidden();
  await expect(page.locator('#eventName')).toHaveValue('');
  await expect(page.locator('#wizardCount')).toContainText('STEP 1 OF 4');
});

test('Photon suggestions are keyboard-drivable without advancing the wizard',async({page})=>{
  await page.route('https://photon.komoot.io/api/**',route=>route.fulfill({
    status:200,contentType:'application/json',body:JSON.stringify({features:[
      {properties:{name:'Civic Center',city:'Richmond',state:'Virginia',country:'United States'}},
      {properties:{name:'Central Park',city:'New York',state:'New York',country:'United States'}}
    ]})
  }));
  await page.locator('#addSide').click();
  await page.locator('#eventName').fill('Location test');
  await page.locator('#eventSave').click();
  await page.locator('#eventSave').click();
  await expect(page.locator('#wizardCount')).toContainText('STEP 3 OF 4');
  await expect(page.locator('.wizard-location .field-label')).toContainText('Location');
  await page.locator('#eventLocation').fill('Central');
  await expect(page.locator('#addressResults [data-address-index]')).toHaveCount(2);
  await page.locator('#eventLocation').press('ArrowDown');
  await page.locator('#eventLocation').press('ArrowDown');
  await page.locator('#eventLocation').press('Enter');
  await expect(page.locator('#eventLocation')).toHaveValue(/^Central Park/);
  await expect(page.locator('#wizardCount')).toContainText('STEP 3 OF 4');
  await expect(page.locator('#addressResults')).toBeHidden();
  await page.locator('#eventSave').click();
  await expect(page.locator('#wizardSkip')).toBeHidden();
  await page.locator('#eventSave').click();
  await expect(page.locator('#wizardSuccess')).toBeVisible();
  const event=await page.evaluate(()=>JSON.parse(localStorage.getItem('daylight-events-v1')||'[]').find(e=>e.title==='Location test'));
  expect(event.location).toBe('Central Park');
  expect(event.locationAddress).toContain('New York');
});

test('reduce motion, theme and accent settings work without an account',async({page})=>{
  await page.locator('#settingsNav').click();
  const appearance=page.locator('#settingsAppearance');
  await appearance.scrollIntoViewIfNeeded();
  await page.locator('#reduceMotion').check();
  await expect(page.locator('html')).toHaveAttribute('data-reduce-motion','true');
  await page.locator('[data-theme-choice="light"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.locator('[data-accent-choice="#3B82F6"]').click();
  await expect(page.locator('html')).toHaveCSS('--accent','#3B82F6');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await expect(page.locator('html')).toHaveAttribute('data-reduce-motion','true');
  await expect(page.locator('html')).toHaveCSS('--accent','#3B82F6');
});

test('fourth wizard step has Back and Create but no Skip, and task Save is primary',async({page})=>{
  await page.locator('#addSide').click();
  await page.locator('#eventName').fill('Plan swim');
  await page.locator('#eventSave').click();
  await page.locator('#eventSave').click();
  await expect(page.locator('#wizardSkip')).toBeVisible();
  await page.locator('#wizardSkip').click();
  await expect(page.locator('#wizardCount')).toContainText('STEP 4 OF 4');
  await expect(page.locator('#wizardSkip')).toBeHidden();
  await expect(page.locator('#wizardBack')).toBeVisible();
  await expect(page.locator('#eventSave')).toHaveText('Create event');
  await page.locator('#eventDialog [data-close]').first().evaluate(el=>el.closest('dialog').close());
  await page.locator('#tasksNav').click();
  await page.locator('#newTask').click();
  await expect(page.locator('#taskForm button[type="submit"]')).toHaveClass(/primary/);
});

test('both themes render in-shell settings and integrations at desktop width',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  for(const mode of ['dark','light']){
    await page.locator('#settingsNav').click();
    await page.locator('[data-theme-choice="'+mode+'"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme',mode);
    await expect(page.locator('.sidebar')).toBeVisible();
    await page.screenshot({path:'test-results/spec-settings-'+mode+'.png',fullPage:false});
    await page.locator('#integrationsNav').click();
    await expect(page.locator('#integrationsPage')).toBeVisible();
    await page.screenshot({path:'test-results/spec-integrations-'+mode+'.png',fullPage:false});
    await page.locator('.nav[data-view="month"]').click();
  }
});
