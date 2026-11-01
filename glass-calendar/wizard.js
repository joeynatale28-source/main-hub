(()=>{'use strict';
const $=id=>document.getElementById(id),form=$('eventForm'),dialog=$('eventDialog');if(!form||!window.DaylightUI)return;
const el=(tag,cls,html)=>{const x=document.createElement(tag);x.className=cls;if(html!==undefined)x.innerHTML=html;return x};
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const steps=['Basics','When','Where','Details'];
const head=form.querySelector('.dialoghead'),footer=form.querySelector('.dialogactions');
const progress=el('div','wizard-progress','<div class="wizard-progress-info"><span id="wizardCount">STEP 1 OF 4</span><div class="wizard-progress-right"><span id="wizardStepName">Basics</span><span class="wizard-icon" id="wizardThemeIcon" hidden></span></div></div><div class="wizard-progress-track"><div class="wizard-progress-fill" id="wizardProgressFill"></div></div>');head.after(progress);
const resume=el('div','wizard-resume','<div><strong>Resume your draft?</strong><p>Unfinished event from this session.</p></div><div class="wizard-resume-actions"><button id="wizardFresh" type="button">Start fresh</button><button id="wizardResumeButton" type="button">Resume</button></div>');resume.id='wizardResume';resume.hidden=true;progress.after(resume);
const discard=el('div','wizard-discard','<div><strong>Discard this event?</strong><p>Unsaved changes will be lost.</p></div><div class="wizard-discard-actions"><button id="wizardKeepEditing" type="button">Keep editing</button><button id="wizardDiscardButton" type="button">Discard</button></div>');discard.id='wizardDiscard';discard.hidden=true;resume.after(discard);
const box=el('div','wizard-steps');discard.after(box);const panes=steps.map((_,i)=>{const x=el('section','wizard-step');x.hidden=i!==0;x.dataset.step=i;box.append(x);return x});
const name=$('eventName').closest('label'),notes=$('eventNotes').closest('label'),loc=$('eventLocation').closest('label');
name.firstChild.textContent='What is the event called?';$('eventName').placeholder='Halloween party';
notes.firstChild.textContent='What is it about?';$('eventNotes').placeholder='Costumes, candy, and a scary movie';
loc.firstChild.textContent='Location';$('eventLocation').placeholder='Add a place or address';
panes[0].append(name,notes);
const hint=el('p','wizard-hint','Give your event a name to continue');hint.id='wizardNameHint';panes[0].append(hint);
panes[1].innerHTML='<h3 class="wizard-question">When is it?</h3><div id="wizardHoliday" class="wizard-holiday" hidden></div>';panes[1].append($('eventAllDay').closest('label'),form.querySelector('.event-dates-layout'),form.querySelector('.event-duration-chips'));
const repeat=$('eventRepeat'),repeatLabel=repeat.closest('label');repeatLabel.classList.add('wizard-hidden-select');panes[1].append(repeatLabel);
const chips=el('div','wizard-repeat','<strong>Repeat</strong><div class="wizard-chip-row" id="wizardRepeatChips"></div>');panes[1].append(chips);
panes[2].innerHTML='<h3 class="wizard-question">Where is it?</h3><div class="wizard-location"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></div>';panes[2].querySelector('.wizard-location').append(loc);
panes[3].innerHTML='<h3 class="wizard-question">Anything else?</h3>';panes[3].append($('eventCalendar').closest('label'),$('eventReminder').closest('label'));
form.querySelectorAll('.formrow').forEach(x=>{if(!x.children.length)x.remove()});
const success=el('div','wizard-success','<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20"/><path d="m14 24 7 7 13-15"/></svg><h3>You’re all set</h3><p>Your event is on your calendar.</p>');success.id='wizardSuccess';success.hidden=true;box.after(success);
const actions=el('div','wizard-footer-start'),back=el('button','wizard-text-button wizard-back','Back'),skip=el('button','wizard-text-button','Skip');back.type=skip.type='button';back.id='wizardBack';skip.id='wizardSkip';
const cancel=footer.querySelector('[data-close]');cancel.classList.add('wizard-text-button');actions.append(cancel,back,skip,$('deleteEvent'));footer.prepend(actions);footer.classList.add('wizard-footer');const save=$('eventSave');
for(const option of repeat.options){const b=el('button','wizard-chip',option.textContent);b.type='button';b.dataset.value=option.value;$('wizardRepeatChips').append(b);b.onclick=()=>{repeat.value=b.dataset.value;repeat.dispatchEvent(new Event('change',{bubbles:true}));syncChips();persistDraft()}}
function syncChips(){$('wizardRepeatChips').querySelectorAll('button').forEach(b=>{const on=b.dataset.value===repeat.value;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on))})}
let step=0,editing=false,base='',completing=false,allowClose=false,discarded=false,holidayDismissed='',oldHolidayDate='';
const DRAFT='daylight-wizard-draft-v1',SKEY='daylight-wizard-session-v1';let session=sessionStorage.getItem(SKEY);if(!session){session=crypto.randomUUID();sessionStorage.setItem(SKEY,session)}
function snapshot(){const end=window.DaylightUI.eventFields?.()||{};return{title:$('eventName').value,notes:$('eventNotes').value,location:$('eventLocation').value,startDate:$('eventDate').value,startTime:$('eventTime').value,endDate:end.endDate,endTime:end.endTime,allDay:$('eventAllDay').checked,repeat:repeat.value,calendar:$('eventCalendar').value,reminder:$('eventReminder').value,step}}
function noStep(value){const obj={...value};delete obj.step;return JSON.stringify(obj)}
function dirty(){return noStep(snapshot())!==base}
function clearDraft(){localStorage.removeItem(DRAFT)}
function persistDraft(){if(editing||completing||allowClose||discarded)return;if(dirty())localStorage.setItem(DRAFT,JSON.stringify({session,ts:Date.now(),data:snapshot()}));else clearDraft()}
function syncSave(){save.disabled=step===0&&!$('eventName').value.trim();save.title=save.disabled?'Give your event a name to continue':'';hint.hidden=!!$('eventName').value.trim()}
function showStep(next,dir='right'){step=Math.max(0,Math.min(3,next));panes.forEach((p,i)=>{p.hidden=i!==step;p.classList.remove('from-left','from-right');if(i===step){void p.offsetWidth;p.classList.add(dir==='left'?'from-left':'from-right')}});$('wizardCount').textContent='STEP '+(step+1)+' OF 4';$('wizardStepName').textContent=steps[step];$('wizardProgressFill').style.width=(step+1)*25+'%';back.hidden=step===0;skip.hidden=step<2||step===3;cancel.hidden=step!==0;$('deleteEvent').hidden=!editing||step!==3;save.textContent=step===3?(editing?'Save changes':'Create event'):'Continue';save.type=step===3?'submit':'button';syncChips();syncSave();window.DaylightOccasion?.render?.()}
function advance(){if(step===0&&!$('eventName').value.trim())return;if(step<3){showStep(step+1);persistDraft()}else form.requestSubmit()}
const originalPrepare=window.DaylightUI.prepareEvent;
window.DaylightUI.prepareEvent=(e,day,time)=>{originalPrepare(e,day,time);editing=!!e;step=0;completing=false;allowClose=false;discarded=false;discard.hidden=true;resume.hidden=true;box.hidden=false;success.hidden=true;progress.hidden=false;footer.hidden=false;oldHolidayDate='';holidayDismissed='';base=noStep(snapshot());showStep(0);
if(!editing){try{const v=JSON.parse(localStorage.getItem(DRAFT)||'null');if(v?.session===session&&v.ts>Date.now()-86400000&&v.data&&noStep(v.data)!==base){resume.hidden=false;resume.dataset.saved=JSON.stringify(v.data)}}catch{}}
requestAnimationFrame(()=>{if(dialog.open&&step===0)$('eventName').focus({preventScroll:true})})};
$('wizardResumeButton').onclick=()=>{const d=JSON.parse(resume.dataset.saved);$('eventName').value=d.title||'';$('eventNotes').value=d.notes||'';originalPrepare({date:d.startDate,time:d.startTime,endDate:d.endDate,endTime:d.endTime,allDay:d.allDay,location:d.location,repeat:d.repeat,reminder:d.reminder,calendar:d.calendar},d.startDate,d.startTime);$('eventCalendar').value=d.calendar||$('eventCalendar').options[0]?.value||'';resume.hidden=true;showStep(d.step||0)};
$('wizardFresh').onclick=()=>{resume.hidden=true;clearDraft()};
save.addEventListener('click',e=>{if(step<3){e.preventDefault();e.stopImmediatePropagation();advance()}},true);
back.onclick=()=>{if(step>0){showStep(step-1,'left');persistDraft()}};
skip.onclick=()=>{if(step===2){$('eventLocation').value='';showStep(3);persistDraft()}else if(step===3){$('eventReminder').value='none';form.requestSubmit()}};
$('eventName').addEventListener('input',()=>{syncSave();window.DaylightOccasion?.render?.();persistDraft()});
form.addEventListener('input',()=>{window.DaylightOccasion?.render?.();persistDraft()});form.addEventListener('change',()=>{syncChips();window.DaylightOccasion?.render?.();persistDraft()});
form.addEventListener('pointerup',()=>setTimeout(()=>{window.DaylightOccasion?.render?.();persistDraft()},0));
form.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.target.id==='eventLocation'&&window.DaylightLocationMenuOpen?.()||e.target.tagName==='TEXTAREA'||e.target.id==='pickerTimeInput')return;if(e.target.tagName==='BUTTON'&&e.target!==save)return;e.preventDefault();e.stopPropagation();if(step<3)advance();else if(!save.disabled)form.requestSubmit()},true);
form.addEventListener('submit',e=>{if(step!==3){e.preventDefault();e.stopImmediatePropagation();advance()}},true);
function requestClose(e){if(completing)return;if(dirty()){e?.preventDefault();e?.stopImmediatePropagation();discard.hidden=false;resume.hidden=true}else{allowClose=true;dialog.close()}}
dialog.addEventListener('cancel',e=>{e.preventDefault();if(!$('pickerOverlay').hidden)return;requestClose(e)});
dialog.addEventListener('click',e=>{if(e.target===dialog)requestClose(e)});
form.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();requestClose(e)},true));
$('wizardKeepEditing').onclick=()=>discard.hidden=true;
$('wizardDiscardButton').onclick=()=>{discarded=true;allowClose=true;clearDraft();resume.hidden=true;delete resume.dataset.saved;discard.hidden=true;step=0;base=noStep(snapshot());dialog.close()};
dialog.addEventListener('close',()=>{if(!completing&&!allowClose&&!editing&&dirty())persistDraft()});
window.DaylightUI.eventSaved=(record,wasEditing,close)=>{clearDraft();if(wasEditing)return false;completing=true;box.hidden=true;success.hidden=false;progress.hidden=true;footer.hidden=true;resume.hidden=true;discard.hidden=true;setTimeout(()=>{allowClose=true;close();progress.hidden=false;footer.hidden=false;box.hidden=false;success.hidden=true;completing=false;window.DaylightBridge?.focusSaved?.(record)},900);return true};
window.DaylightWizard={getStep:()=>step,getDate:()=>$('eventDate').value,title:()=>$('eventName').value,showHoliday:(name,theme)=>{const b=$('wizardHoliday');if(!b)return;const date=$('eventDate').value;if(date!==oldHolidayDate){oldHolidayDate=date;holidayDismissed=''}b.hidden=!name||holidayDismissed===date;if(!b.hidden){b.style.setProperty('--holiday-tint',theme.tint);b.innerHTML=window.DaylightOccasion.icon(theme)+'<strong>Heads up — this is '+safe(name)+'</strong><button type="button" aria-label="Dismiss holiday notice">×</button>';b.querySelector('button').onclick=()=>{holidayDismissed=date;b.hidden=true}}}};
})();