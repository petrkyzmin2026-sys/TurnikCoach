'use strict';
// Deterministic regression checks for the existing Morozov course module.
// Pure functions are extracted from the actual shipped source, not duplicated.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const course=fs.readFileSync('live/course.js','utf8');
const hotfix=fs.readFileSync('live/hotfix.js','utf8');
const mainActivity=fs.readFileSync('app/src/main/java/ru/turnikcoach/app/MainActivity.java','utf8');
new vm.Script(course,{filename:'live/course.js'});
new vm.Script(hotfix,{filename:'live/hotfix.js'});
const bundled=hotfix.match(/const COURSE_MODULE_BUNDLED=("(?:\\.|[^"\\])*");\n  function tcValidCourseModule/);
assert(bundled,'embedded course module must exist');
assert.equal(JSON.parse(bundled[1]),course,'APK update must use the same course module');
function extractFrom(source,name){
  const start=source.indexOf('function '+name+'(');
  assert(start>=0,'function missing: '+name);
  const begin=source.indexOf('{',start);
  let depth=1,end=begin+1;
  while(depth&&end<source.length){
    if(source[end]==='{')depth++;
    if(source[end]==='}')depth--;
    end++;
  }
  assert.equal(depth,0,'function not closed: '+name);
  return source.slice(start,end);
}
function extractAssignment(source,prefix){
  const start=source.indexOf(prefix);
  assert(start>=0,'assignment missing: '+prefix);
  const begin=source.indexOf('{',start);
  let depth=1,end=begin+1;
  while(depth&&end<source.length){
    if(source[end]==='{')depth++;
    if(source[end]==='}')depth--;
    end++;
  }
  assert.equal(depth,0,'assignment function not closed: '+prefix);
  while(end<source.length&&/[;\s]/.test(source[end]))end++;
  return source.slice(start,end);
}
function extract(name){
  const start=course.indexOf('function '+name+'(');
  assert(start>=0,'function missing: '+name);
  const begin=course.indexOf('{',start);
  let depth=1,end=begin+1;
  while(depth&&end<course.length){
    if(course[end]==='{')depth++;
    if(course[end]==='}')depth--;
    end++;
  }
  assert.equal(depth,0,'function not closed: '+name);
  return course.slice(start,end);
}
const names=['tcDayDiff','tcCourseWeekdays','tcDateFromKey','tcScheduledOn',
  'tcProjectedCourseSeq','tcCourseComplexNo','tcCourseComplex','tcUndoLatestTodayCourseRecord'];
const key=(date=new Date('2026-09-25T12:00:00'))=>
  date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
const courseState={enabled:true,level:4,goal:'quantity',weeklySessions:4,
  cycleStartDate:'2026-09-25',courseSeq:5,lastCourseDate:'',history:[]};
const api=new Function('TC_course','dateKey','tcCourseLevel',
  names.map(extract).join('\n')+'\nreturn {tcScheduledOn,tcProjectedCourseSeq,tcCourseComplex,tcUndoLatestTodayCourseRecord};')(
  courseState,key,()=>({complexes:{1:{name:'№1'},2:{name:'№2'},3:{name:'№3'}}})
);
const dates=['2026-09-25','2026-09-26','2026-09-27','2026-09-28',
 '2026-09-29','2026-09-30','2026-10-01','2026-10-02'];
assert.deepEqual(dates.filter(api.tcScheduledOn),
 ['2026-09-25','2026-09-27','2026-09-29','2026-10-01','2026-10-02'],
 '4 sessions must rotate with the Friday anchor, including next cycle');
assert.equal(api.tcScheduledOn('2026-09-24'),false,'no assignment before start');
assert.equal(api.tcProjectedCourseSeq('2026-09-29'),7,'preview must project future sessions');
assert.equal(api.tcCourseComplex(api.tcProjectedCourseSeq('2026-09-29')).no,2);
assert.equal(courseState.courseSeq,5,'preview must not mutate the stored sequence');
courseState.weeklySessions=3;
assert.deepEqual(dates.filter(api.tcScheduledOn),
 ['2026-09-25','2026-09-27','2026-09-30','2026-10-02'],
 '3 sessions must rotate with the Friday anchor');
courseState.cycleStartDate='';
assert.equal(api.tcScheduledOn('2026-09-26'),true,
 'older installations without an anchor retain the legacy weekday schedule');
assert(course.includes('tcPreviewCourseCard(tcSelectedDate)'),
 'choosing another date must show a read-only plan');
assert(course.includes('id="tcCycleStartDate"'),
 'settings must expose a cycle start date');
assert(hotfix.includes("const VERSION='5.16.33-accessibility-scale'"),
 'release hotfix version must be 5.16.33');
assert(course.includes("const COURSE_MODULE_VERSION='1.0.34-diagnostics-cleanup'"),
 'course module version must be 1.0.34');
assert(!course.includes('TC_EXTRA_START'),
 'temporary extra-workout trace logging must not ship');
assert(!course.includes('window.confirm('),'course module must not depend on unsupported WebView JS dialogs');
assert(!hotfix.includes('window.confirm('),'hotfix navigation/discard must not depend on unsupported WebView JS dialogs');
assert(!hotfix.includes('forceHandover'),'5.16.33 must use an explicit user-visible update prompt');
assert(hotfix.includes("showRuntimeNotice('TurnikCoach обновлён до '+LABEL)"),
 'successful activation must give visible feedback');
assert(hotfix.includes("localStorage.setItem('tc_hotfix_active_version',VERSION)"),
 'active hotfix version must be persisted for diagnostics');
assert(hotfix.includes("const LEGACY_ASSET_VERSION='5.14.0-adaptive-rest'"),
 'live hotfix must know the immutable packaged asset version');
assert(hotfix.includes('window.__TC_HOTFIX_ACTIVE_VERSION=VERSION'),
 'live hotfix must keep its active version separate from the legacy asset compatibility sentinel');
assert(hotfix.includes('window.__TC_HOTFIX_VERSION=LEGACY_ASSET_VERSION'),
 'packaged 5.14 hotfix must be prevented from re-patching the page after the live update');
assert(hotfix.includes("b.type='button';b.className='tcWorkoutExitBtn';b.textContent='Выйти'"),
 'actual packaged workout header must receive a visible exit-without-saving action');
assert(hotfix.includes('window.tcEnsureWorkoutControls=function()'),
 'workout control decorator must be explicitly callable after render');
assert(course.includes("if(typeof window.tcEnsureWorkoutControls==='function')window.tcEnsureWorkoutControls();"),
 'course/extra workout rendering must explicitly request visible workout controls');
assert(!hotfix.includes("querySelector('.controls')"),
 'discard control must not be injected into the hidden legacy .controls container');
assert(!hotfix.includes('window.W'),
 'hotfix must not read the workout state through window.W: base app declares W with global let');
assert(hotfix.includes("function tcHasWorkout(){return typeof W!=='undefined'&&!!W}"),
 'navigation/discard must read the actual lexical workout state');
assert(hotfix.includes('try{W=null}catch(e){}'),
 'discard must clear the actual lexical workout state');
assert(hotfix.includes('tcConfirmDiscardWorkoutBtn'),
 'discard without saving must use an in-app confirmation sheet');
assert(course.includes('tcOpenUndoTodayCourseConfirm'),
 'same-day undo must keep an in-app confirmation sheet');
assert(course.includes('tcActionMessage'),
 'critical course actions must have a visible blocked-action message');

const uiState={
  courseHistory:[{courseMode:'course',date:'2026-09-25',ts:123}],
  appHistory:[],
};
const uiApi=new Function('TC_course','state','dateKey','tcExtraRowsHtml',
  extract('tcTodayCourseRecord')+'\n'+extract('tcTodayExtraRecord')+'\n'+extract('tcTodayCourseDoneHtml')+
  '\nreturn {tcTodayCourseDoneHtml};')(
    {history:uiState.courseHistory},
    {history:uiState.appHistory},
    ()=> '2026-09-25',
    items=>items.map(x=>'<div>'+x.e.name+'</div>').join('')
  );
const extras=[{e:{name:'Подъём коленей в висе'},plan:[10,10,10]}];
const doneHtml=uiApi.tcTodayCourseDoneHtml(extras);
assert(doneHtml.includes('Основной комплекс выполнен'),
 'saved main workout must render as a completed state');
assert(doneHtml.includes('id="tcStartExtraAfterCourseBtn"'),
 'after-main extra workout needs a stable start button');
assert(doneHtml.includes('Начать дополнительную тренировку'),
 'after-main extra workout must remain visibly available');
assert(doneHtml.includes('id="tcUndoTodayCourseBtn"'),
 'same-day undo must remain available as a secondary action');
assert(!doneHtml.includes('onclick="tcStartExtraWorkout()"'),
 'after-main extra CTA must not keep a second inline action path');
assert(course.includes("el.dataset.tcBound='delegated-v2'"),
 'after-main actions must be marked for one delegated WebView-safe router');
assert(course.includes('function tcInstallTodayActionDelegation()')&&
 course.includes("document.addEventListener('click',ev=>{const el=actionFor(ev.target);if(el)run(el,ev)},true)")&&
 course.includes("document.addEventListener('touchend',ev=>"),
 'Today actions must also have stable delegated click/touch activation across rerenders');
assert(course.includes("document.addEventListener('pointerdown',ev=>")&&
 course.includes("document.addEventListener('pointerup',ev=>")&&
 course.includes("pointerGesture===g&&!g.moved&&!g.ran"),
 'Today actions must survive WebView click cancellation while cancelling real scroll gestures');
assert(course.includes(".tcAfterMainCard{position:relative;z-index:40"),
 'after-main CTA card must stay above sibling content in the Today stacking context');
assert(course.includes("tcActionMessage('Не удалось начать тренировку',message)"),
 'extra-workout startup errors must never fail silently');
const emptyExtrasHtml=uiApi.tcTodayCourseDoneHtml([]);
assert(!emptyExtrasHtml.includes("onclick=\"go('exercise')\""),
 'after-main choose-extras CTA must not keep a competing inline action path');
assert(course.includes("window.__TC_TODAY_ACTION_DELEGATION_V2"),
 'Today actions must install the versioned delegated router V2');

const doneExtraApi=new Function('TC_course','state','dateKey','tcExtraRowsHtml',
  extract('tcTodayCourseRecord')+'\n'+extract('tcTodayExtraRecord')+'\n'+extract('tcTodayCourseDoneHtml')+
  '\nreturn {tcTodayCourseDoneHtml};')(
    {history:uiState.courseHistory},
    {history:[{type:'workout',session:'доп.',date:'2026-09-25'}]},
    ()=> '2026-09-25',
    ()=> ''
  );
assert(doneExtraApi.tcTodayCourseDoneHtml(extras).includes('Дополнительная тренировка выполнена'),
 'completed extra workout must not be offered a second time on the same day');

const startExtraPos=course.indexOf('window.tcStartExtraWorkout=function(){');
assert(startExtraPos>=0,'tcStartExtraWorkout missing');
const startExtraBody=course.slice(startExtraPos,course.indexOf('\n    };',startExtraPos)+7);
assert(startExtraBody.includes("tcActionMessage('Тренировка уже запущена'"),
 'active workout must not cause a silent extra-start return');
assert(startExtraBody.includes("tcActionMessage('Нет дополнительных упражнений'"),
 'empty extra selection must explain why the action cannot start');
assert.equal((course.match(/\\bunlockAudio\\s*\\(\\s*\\)\\s*;/g)||[]).length,0,
 'course start actions must not call an undefined global unlockAudio()');
assert(course.includes('tcPrimeAudio();'),
 'course start actions must use the safe audio priming wrapper');

function windowFunctionBody(name){
  const start=course.indexOf('window.'+name+'=function(');
  assert(start>=0,'window function missing: '+name);
  const begin=course.indexOf('{',start);
  let depth=1,end=begin+1;
  while(depth&&end<course.length){
    if(course[end]==='{')depth++;
    if(course[end]==='}')depth--;
    end++;
  }
  assert.equal(depth,0,'window function not closed: '+name);
  return course.slice(begin+1,end-1);
}
const actionBodies={
  aux:windowFunctionBody('tcStartAuxWorkout'),
  supplement:windowFunctionBody('tcStartSupplementWorkout'),
  startTest:windowFunctionBody('tcStartCourseTest'),
  confirmTest:windowFunctionBody('tcConfirmCourseTest'),
  deferTest:windowFunctionBody('tcDeferCourseTest'),
  deferMastery:windowFunctionBody('tcDeferMasteryTest'),
  openMastery:windowFunctionBody('tcOpenMasteryTest'),
  saveMastery:windowFunctionBody('tcSaveMasteryTest'),
  advance:windowFunctionBody('tcAdvanceCourseLevel')
};
assert(actionBodies.aux.includes("tcActionMessage('Вспомогательный комплекс сейчас недоступен'"),
 'auxiliary workout must explain schedule/recovery blocking');
assert(actionBodies.aux.includes("tcActionMessage('Нет доступных упражнений'"),
 'auxiliary workout must explain empty runnable set');
assert(actionBodies.supplement.includes("tcActionMessage('Сегодня основной комплекс'"),
 'supplement must explain main-day blocking');
assert(actionBodies.supplement.includes("tcActionMessage('Сегодня контрольное испытание'"),
 'supplement must explain control-day blocking');
assert(actionBodies.supplement.includes("tcActionMessage('Дополнение уже выполнено'"),
 'supplement must explain duplicate same-day attempt');
assert(actionBodies.startTest.includes("tcActionMessage('Контроль пока недоступен'"),
 'course test start must explain recovery blocking');
assert(actionBodies.confirmTest.includes("tcActionMessage('Результат не сохранён'"),
 'course test confirmation must explain invalid result');
assert(actionBodies.deferTest.includes("tcActionMessage('Перенос не требуется'"),
 'course test defer must explain stale action');
assert(actionBodies.deferMastery.includes("tcActionMessage('Перенос недоступен'"),
 'mastery defer must explain stale action');
assert(actionBodies.openMastery.includes("tcActionMessage('Контроль недоступен'"),
 'mastery open must explain unsupported level');
assert(actionBodies.saveMastery.includes("tcActionMessage('Результат не сохранён'"),
 'mastery save must explain invalid/stale form state');
assert(actionBodies.advance.includes("tcActionMessage('Переход недоступен'"),
 'level advance must explain stale/invalid transition');
for(const [name,body] of Object.entries(actionBodies)){
  assert(!/if\s*\([^\n;]+\)\s*return\s*;/.test(body),
    name+' still contains a silent one-line guard');
}

const feedbackCalls=[];
new Function('W','tcActionMessage',actionBodies.aux)(
  {},(...args)=>feedbackCalls.push(['aux',...args])
);
new Function('W','tcActionMessage','TC_course','tcCourseLevel','tcCourseDue','tcAuxDue','tcTestDue','tcMasteryDue','tcSupplementBreak',
  actionBodies.supplement)(
    {},(...args)=>feedbackCalls.push(['supplement',...args]),
    {authorSupplement:true,history:[]},()=>({supplement:'yes'}),()=>false,()=>false,()=>false,()=>false,()=>false
  );
new Function('W','tcActionMessage','tcRecoveredForTest',actionBodies.startTest)(
  {},(...args)=>feedbackCalls.push(['test',...args]),()=>true
);
new Function('tcTestDue','tcActionMessage',actionBodies.deferTest)(
  ()=>false,(...args)=>feedbackCalls.push(['deferTest',...args])
);
new Function('TC_course','tcActionMessage',actionBodies.advance)(
  {level:4,pendingTransition:null,masteryTests:[]},(...args)=>feedbackCalls.push(['advance',...args])
);
assert(feedbackCalls.some(x=>x[0]==='aux'&&x[1]==='Тренировка уже запущена'));
assert(feedbackCalls.some(x=>x[0]==='supplement'&&x[1]==='Тренировка уже запущена'));
assert(feedbackCalls.some(x=>x[0]==='test'&&x[1]==='Тренировка уже запущена'));
assert(feedbackCalls.some(x=>x[0]==='deferTest'&&x[1]==='Перенос не требуется'));
assert(feedbackCalls.some(x=>x[0]==='advance'&&x[1]==='Переход недоступен'));

const formBodies={
  openAdvanced:windowFunctionBody('tcOpenAdvancedChoiceSheet'),
  saveAdvanced:windowFunctionBody('tcSaveAdvancedChoices'),
  openCalibration:windowFunctionBody('tcOpenCourseCalibration'),
  saveCalibration:windowFunctionBody('tcSaveCourseCalibration'),
  openWeight:windowFunctionBody('tcOpenWorkingWeight'),
  saveWeight:windowFunctionBody('tcSaveWorkingWeight'),
  openSettings:windowFunctionBody('tcOpenCourseSettings'),
  saveSettings:windowFunctionBody('tcSaveCourseSettings')
};
assert(formBodies.openAdvanced.includes("tcActionMessage('Выбор упражнений недоступен'"),
 'advanced-choice stale action must explain wrong level');
assert(formBodies.saveAdvanced.includes("tcActionMessage('Выбор не сохранён'"),
 'advanced-choice save must explain stale level');
assert(formBodies.saveAdvanced.includes("tcShowRuntimeNotice('Выбор упражнений сохранён.')"),
 'advanced-choice save must confirm success');
assert(formBodies.openCalibration.includes("tcActionMessage('Настройка недоступна'"),
 'calibration must explain active-workout blocking');
assert(formBodies.openCalibration.includes("tcActionMessage('Контрольные максимумы не требуются'"),
 'calibration must explain empty form state');
assert(formBodies.saveCalibration.includes("tcActionMessage('Результаты не сохранены'"),
 'calibration save must explain stale/missing fields');
assert(formBodies.saveCalibration.includes("tcShowRuntimeNotice('Контрольные максимумы сохранены.')"),
 'calibration save must confirm success');
assert(formBodies.openWeight.includes("tcActionMessage('Настройка недоступна'"),
 'working-weight form must explain active-workout blocking');
assert(formBodies.saveWeight.includes("tcActionMessage('Вес не сохранён'"),
 'working-weight save must explain missing input');
assert(formBodies.saveWeight.includes("tcShowRuntimeNotice('Дополнительный вес сохранён: '+value+' кг.')"),
 'working-weight save must confirm success');
assert(formBodies.openSettings.includes("tcActionMessage('Настройки недоступны'"),
 'course settings must not silently open during an active workout');
assert(formBodies.saveSettings.includes("tcActionMessage('Настройки не сохранены'"),
 'course settings must explain invalid/incomplete input');
assert(formBodies.saveSettings.includes("tcShowRuntimeNotice('Настройки курса сохранены.')"),
 'course settings save must confirm success');
assert(!formBodies.saveSettings.includes("Math.max(1,Math.floor(+(mx&&mx.value)||TC_course.pullMax))"),
 'invalid current maximum must not be silently coerced');
assert(formBodies.saveSettings.indexOf("const parsed=")<formBodies.saveSettings.indexOf("TC_course.enabled=!!enabled.checked"),
 'settings must validate the cycle date before mutating course state');
assert(formBodies.saveSettings.indexOf("const allowedGoals=")<formBodies.saveSettings.indexOf("TC_course.goal=nextGoal"),
 'settings must validate the goal before mutating course state');

assert(course.includes('id="tcSettingsError"'),
 'settings form needs an inline error region so validation does not replace the form');
assert(formBodies.saveSettings.includes("const fail=(message,el)=>"),
 'settings validation must report errors inline before falling back to a modal');

const invalidSettingsState={
  level:4,goal:'quantity',weeklySessions:3,targetMax:25,testPeriodWeeks:3,
  auxInterval3:10,auxEnabled:{3:false,6:false},pullMax:20,enabled:true
};
const settingsError={textContent:''};
const invalidMax={value:'abc',style:{},focus(){}};
const settingsControls={
  tcCourseEnabled:{checked:true},
  tcCourseLevel:{value:'4',style:{},focus(){}},
  tcCourseMax:invalidMax,
  tcCourseGoal:{value:'quantity',style:{},focus(){}},
  tcCycleStartDate:{value:'2026-09-26',style:{},focus(){}},
  tcSettingsError:settingsError
};
new Function('TC_course','document','tcGoalOptions','tcDateFromKey','dateKey','tcActionMessage',
  formBodies.saveSettings)(
    invalidSettingsState,
    {getElementById:id=>settingsControls[id]||null},
    ()=>[['quantity','Количество']],
    key=>new Date(key+'T12:00:00'),
    d=>typeof d==='string'?d:(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')),
    ()=>{throw new Error('inline validation should not replace the settings form')}
  );
assert.equal(invalidSettingsState.pullMax,20,'invalid maximum must not mutate stored settings');
assert.equal(settingsError.textContent,'Текущий максимум должен быть целым положительным числом.');
assert.equal(invalidMax.style.borderColor,'#ff7777');

assert(course.includes('.tcWeekDay{min-width:0;min-height:64px'),
 'weekly day buttons must provide a comfortably large vertical touch target');
assert(course.includes('.tcWeekNav button{border:1px solid #354351;border-radius:10px;background:#202b34;color:#fff;min-width:48px;min-height:48px'),
 'week navigation arrows must be at least 48 by 48 CSS px');
assert(course.includes('.tcWeekNav button.tcWeekReset{min-width:72px'),
 'Today reset needs a wider 48dp-class touch target');
assert(course.includes('.tcCheckRow{min-height:48px'),
 'course settings checkbox rows must provide at least a 48px row target');
assert(course.includes('.tcAdvancedSelect{width:24px!important;height:24px!important'),
 'advanced exercise checkboxes must be enlarged from the 21px base control');
assert(hotfix.includes('.tcInfoBtn{width:48px;height:48px;min-width:48px'),
 'training information control must be at least 48 by 48');
assert(hotfix.includes('#workout .stageHeader .endBtn{min-height:48px!important;min-width:76px!important'),
 'packaged workout Finish control must have a 48px minimum height');
assert(hotfix.includes('#workout .stageControls .btn,#rest .btn,#sheet .sheetbox .btn{min-height:48px!important'),
 'critical workout, rest and sheet buttons need 48px minimum height');

assert(hotfix.includes('#rest .tcInfoBtn{position:absolute;right:92px;top:12px}'),
 'rest info button must not overlap the rest Exit control');
assert(course.includes("function tcExpandExerciseTouchTargets(host)"),
 'exercise catalog needs a decorator for legacy controls rendered by packaged app');
assert(course.includes(".tcExerciseCheckTarget{width:48px;height:48px;min-width:48px"),
 'exercise checkbox needs a real 48 by 48 label hit area');
assert(course.includes(".tcExerciseNumberTarget{min-height:48px!important"),
 'exercise MAX number field must be at least 48px high');
assert(course.includes(".tcExerciseMainTarget{width:48px!important;height:48px!important"),
 'exercise primary-star button must be at least 48 by 48');
assert(course.includes("#sheet .sheetbox input:not([type=checkbox]),#sheet .sheetbox select{min-height:48px!important"),
 'all sheet text/number/date inputs and selects must have a 48px minimum height');
assert(course.includes("#sheet .sheetbox input[type=checkbox]{width:24px!important;height:24px!important"),
 'sheet checkboxes must use enlarged 24px controls');
assert(course.includes('f.check?\'<label class="tcCheckRow"'),
 'mastery checkbox rows must use the 48px checkbox-row target');

assert(hotfix.includes("const TC_ACTIVE_WORKOUT_KEY='tc_active_workout_v2'"),
 'UX2 must persist an active workout independently of completed history');
assert(hotfix.includes("const saveFn=window.tcSaveActiveWorkoutSnapshot")&&
 hotfix.includes("const saved=typeof saveFn==='function'?saveFn():false"),
 'entering workout with active W must synchronously persist through the exported persistence API');
assert(hotfix.includes('function tcSaveActiveWorkoutSnapshot()'),
 'UX2 must provide durable active-workout snapshots');
assert(hotfix.includes('function tcRestoreActiveWorkoutSnapshot()'),
 'UX2 must restore an interrupted workout after process recreation');
assert(hotfix.includes("const hadActiveWorkout=typeof W!=='undefined'&&!!W")&&
 hotfix.includes("phase:hadActiveWorkout?'handover-restored':'restored'"),
 'new hotfix must reassert durable workout state when an older hotfix already restored W');
assert(hotfix.includes('window.tcRefreshActiveTrainingSurface=function(id)')&&
 hotfix.includes('window.tcArmRestoreSurfaceGuard=function(surface)')&&
 hotfix.includes('until:Date.now()+5000')&&
 hotfix.includes("window.addEventListener('pageshow',tcEnforceRestoreSurfaceGuard)")&&
 hotfix.includes("document.visibilityState==='visible'"),
 'cold restore must keep the active training surface asserted through the startup handover window');
assert(hotfix.includes("TurnikNative.showSurface")&&
 mainActivity.includes("@JavascriptInterface public void showSurface(String requested)")&&
 mainActivity.includes("postVisualStateCallback")&&
 mainActivity.includes("setVisibility(View.INVISIBLE)"),
 'cold restore must commit the requested training surface through the Android WebView compositor');
assert(hotfix.includes("TurnikNative.refreshSurface")&&
 mainActivity.includes("@JavascriptInterface public void refreshSurface()"),
 'legacy native surface refresh fallback must remain available');
assert(hotfix.includes("window.tcClearActiveWorkoutSnapshot=tcClearActiveWorkoutSnapshot"),
 'discard flow must be able to remove a durable workout snapshot');
assert(hotfix.includes("setNav('n1','◫','План')")&&hotfix.includes("setNav('n3','⌁','Прогресс')"),
 'top-level navigation must expose Today / Plan / Progress');
assert(hotfix.includes("viewport.setAttribute('content','width=device-width,initial-scale=1')"),
 'UX2 must remove the legacy zoom lock');
assert(course.includes("const week=()=>'<div class=\"tcWeekSection\""),
 'Today must treat the weekly calendar as a secondary section');
assert(course.includes('<details class="tcTodayPlanDetails"><summary>Посмотреть план</summary>'),
 'Today must progressively disclose the detailed set plan');
assert(course.includes("style=\"margin-top:14px;min-height:58px\" onclick=\"tcStartCourseWorkout()"),
 'primary Start workout action must be larger than the 48dp minimum');
assert(course.includes('function tcGroupCourseSettings(box)'),
 'course settings must be reorganized with progressive disclosure');
assert(course.includes("append('main','Основное',true)"),
 'the primary settings group must be open by default');
assert(course.includes("append('schedule','Расписание',false)")&&course.includes("append('control','Контроль прогресса',false)"),
 'secondary settings groups must stay collapsed until requested');
assert(course.includes("el.closest&&el.closest('details.tcSettingsGroup')"),
 'validation must reveal a collapsed settings section before focusing an invalid field');
assert(hotfix.includes('function tcNextWorkoutStepText()'),
 'rest screen must derive the upcoming exercise and planned value from active workout state');
assert(hotfix.includes("return 'Следующий подход · '+e.name"),
 'rest screen must expose the next task instead of a generic message');
assert(hotfix.includes("#workout .stageControls .btn.green,#rest .btn.green{min-height:58px!important"),
 'primary repeated workout actions must be larger than the generic 48px minimum');
assert(hotfix.includes("#workout .controls{height:auto!important;min-height:246px!important;max-height:45vh!important"),
 'large-text mode must allow workout controls to grow instead of clipping content');
assert(hotfix.includes("#workout .wmedia{bottom:var(--tc-workout-controls-bottom,260px)!important}"),
 'workout media must reserve the measured control height');
assert(hotfix.includes("function tcInstallAdaptiveWorkoutGeometry()")&&
 hotfix.includes("new ResizeObserver(apply)")&&
 hotfix.includes("workout.style.setProperty('--tc-workout-controls-bottom'"),
 'workout geometry must follow the actual rendered control height');
assert(hotfix.includes("#sheet .sheetbox{max-height:92vh!important;overflow-y:auto!important"),
 'sheets must remain scrollable when text scaling reduces available vertical space');
assert(hotfix.includes("grid-template-columns:repeat(auto-fit,minmax(92px,1fr))"),
 'completion summary stats must reflow instead of forcing three fixed columns');
assert(hotfix.includes(".tcCompletionRow span,.tcCompletionRow b{min-width:0;flex:1 1 140px;overflow-wrap:anywhere}"),
 'completion rows must wrap long scaled text instead of clipping');
assert(hotfix.includes("#workout .controls{height:auto!important;min-height:246px!important"),
 'active workout must preserve the 246px baseline while allowing large-text growth');
assert(hotfix.includes('function tcSyncScreenVisibility(id)')&&
 hotfix.includes('tcSyncScreenVisibility(id);'),
 'WebView navigation must explicitly synchronize screen visibility after go()');
assert(hotfix.includes('function tcForceWebViewRepaint()')&&
 hotfix.includes('tcForceWebViewRepaint();'),
 'WebView navigation must force a compositor repaint after the screen switch');
assert(hotfix.includes("#workout .stageHeader .row.between,#workout .wtop .row.between{gap:8px}"),
 'workout controls must support both stageHeader and legacy wtop DOMs');
assert(hotfix.includes("#workout.screen.on .stageHeader .row.between, #workout.screen.on .wtop .row.between"),
 'exit/info decorators must target both workout header variants');
assert(hotfix.includes('function tcStabilizeWorkoutControls()'),
 'packaged and current workout DOM must be normalized at runtime');
assert(hotfix.includes("done.parentElement.classList.add('tcWorkoutActions')"),
 'Done and Skip must share a stable vertical motor container');
assert(hotfix.includes("#workout .tcWorkoutActions{display:grid!important;grid-template-columns:1fr!important"),
 'runtime workout action container must stack Done and Skip vertically');
assert(hotfix.includes("#workout .tcWorkoutDoneAction{min-height:60px!important"),
 'Done must remain the dominant repeated action');
assert(hotfix.includes("const TC_COMPLETION_UNDO_KEY='tc_completion_undo_v1'"),
 'completion flow must keep a bounded undo transaction');
assert(hotfix.includes('function tcInstallCompletionFlow()'),
 'completion summary must wrap the final save path');
assert(hotfix.includes("if(tx.state)state=tx.state")&&
 hotfix.includes("window.tcRestoreCourseStateSnapshot(tx.course)")&&
 course.includes("window.tcGetCourseStateSnapshot=function()")&&
 course.includes("window.tcRestoreCourseStateSnapshot=function(snapshot)"),
 'completion undo must restore both generic state and the encapsulated course snapshot');
assert(hotfix.includes('tcShowCompletionSummary(summary)'),
 'successful save must open a completion summary');
assert(hotfix.includes("if(tcActiveWorkoutForUpdate()){")&&hotfix.includes('tcScheduleDeferredUpdate(activate)'),
 'update prompt must defer while a workout or durable workout snapshot is active');

// Behavioral completion-flow regression: execute the shipped wrapper and shipped Undo transaction.
const completionHarness=new Function(
  extractFrom(hotfix,'tcWorkoutSummary')+'\n'+
  extractFrom(hotfix,'tcReadCompletionUndo')+'\n'+
  extractFrom(hotfix,'tcClearCompletionUndo')+'\n'+
  extractFrom(hotfix,'tcInstallCompletionFlow')+'\n'+
  `
  const TC_COMPLETION_UNDO_KEY='tc_completion_undo_v1';
  let tcCompletionFlowInstalled=false;
  let W={
    mode:'extra',exerciseIndex:0,setIndex:1,actual:8,
    items:[
      {e:{name:'Подъём коленей в висе'},plan:[10,10],actual:[10,8]},
      {e:{name:'Отжимания от пола'},plan:[20],actual:[20]}
    ]
  };
  let state={history:[{id:'before'}],counter:7};
  let courseState={courseSeq:4,lastCourseDate:'2026-09-29'};
  let summarySeen=null,lastGo='',saveCount=0,activeSnapshotClears=0;
  const notices=[];
  const store=new Map();
  const localStorage={
    setItem:(k,v)=>store.set(k,String(v)),
    getItem:k=>store.has(k)?store.get(k):null,
    removeItem:k=>store.delete(k)
  };
  const sheet={open:true,classList:{remove:n=>{if(n==='open')sheet.open=false}}};
  const document={getElementById:id=>id==='sheet'?sheet:null};
  const window={
    finishWorkout:function(){
      state.history.push({id:'saved-extra'});
      state.counter=99;
      courseState.courseSeq=5;
      W=null;
      return 'saved';
    },
    tcGetCourseStateSnapshot:()=>JSON.parse(JSON.stringify(courseState)),
    tcRestoreCourseStateSnapshot:s=>{courseState=JSON.parse(JSON.stringify(s))},
    tcClearActiveWorkoutSnapshot:()=>{activeSnapshotClears++}
  };
  `+
  extractAssignment(hotfix,'window.tcUndoLastCompletion=function')+'\n'+
  `
  function tcJsonClone(v){return JSON.parse(JSON.stringify(v))}
  function tcShowCompletionSummary(v){summarySeen=JSON.parse(JSON.stringify(v))}
  function save(){saveCount++}
  function render(){}
  function go(id){lastGo=id}
  function showRuntimeNotice(message,type){notices.push([message,type||''])}
  const setTimeout=fn=>{fn();return 1};

  tcInstallCompletionFlow();
  const finishResult=window.finishWorkout('Нормально');
  const afterFinish={
    finishResult,
    state:JSON.parse(JSON.stringify(state)),
    course:JSON.parse(JSON.stringify(courseState)),
    W,
    tx:JSON.parse(localStorage.getItem(TC_COMPLETION_UNDO_KEY)||'null'),
    summary:summarySeen,
    activeSnapshotClears
  };
  const undoResult=window.tcUndoLastCompletion();
  return {
    afterFinish,
    undoResult,
    state:JSON.parse(JSON.stringify(state)),
    course:JSON.parse(JSON.stringify(courseState)),
    lastGo,saveCount,activeSnapshotClears,
    txAfterUndo:localStorage.getItem(TC_COMPLETION_UNDO_KEY),
    notices
  };
  `
)();

assert.equal(completionHarness.afterFinish.finishResult,'saved');
assert.equal(completionHarness.afterFinish.W,null,'finish wrapper must leave no active workout after base save');
assert.equal(completionHarness.afterFinish.state.counter,99,'base save mutation must occur before Undo');
assert.equal(completionHarness.afterFinish.course.courseSeq,5,'base course mutation must occur before Undo');
assert.equal(completionHarness.afterFinish.tx.state.counter,7,'Undo transaction must capture pre-save generic state');
assert.equal(completionHarness.afterFinish.tx.course.courseSeq,4,'Undo transaction must capture pre-save course state');
assert.equal(completionHarness.afterFinish.summary.mode,'extra');
assert.equal(completionHarness.afterFinish.summary.exercises,2);
assert.equal(completionHarness.afterFinish.summary.sets,3);
assert.equal(completionHarness.afterFinish.summary.total,38);
assert.equal(completionHarness.afterFinish.summary.feel,'Нормально');
assert.equal(completionHarness.undoResult,true,'completion Undo must succeed inside its validity window');
assert.equal(completionHarness.state.counter,7,'Undo must restore generic state exactly');
assert.equal(completionHarness.state.history.length,1,'Undo must remove the newly saved workout by restoring pre-save state');
assert.equal(completionHarness.course.courseSeq,4,'Undo must restore course sequence exactly');
assert.equal(completionHarness.lastGo,'today','Undo must return to Today');
assert.equal(completionHarness.txAfterUndo,null,'successful Undo must clear the one-shot transaction');
assert(completionHarness.activeSnapshotClears>=2,'finish and Undo must clear durable active-workout snapshots');
assert(completionHarness.notices.some(x=>x[0]==='Сохранение тренировки отменено.'),
 'Undo must give visible success feedback');

// Behavioral completion-summary rendering regression.
const summaryRender=new Function(
  extractFrom(hotfix,'tcShowCompletionSummary')+'\n'+
  `
  const sheet={open:false,classList:{add:n=>{if(n==='open')sheet.open=true},remove:n=>{if(n==='open')sheet.open=false}}};
  const box={innerHTML:''};
  const done={onclick:null},undo={onclick:null};
  const window={tcUndoLastCompletion:function(){return true}};
  const document={getElementById:id=>({sheet,sheetbox:box,tcCompletionDoneBtn:done,tcCompletionUndoBtn:undo}[id]||null)};
  function closeSheet(){sheet.open=false}
  const summary={mode:'extra',exercises:2,sets:3,total:38,feel:'Нормально',rows:[
    {name:'Подъём коленей в висе',values:'10 · 8'},
    {name:'Отжимания от пола',values:'20'}
  ]};
  tcShowCompletionSummary(summary);
  return {html:box.innerHTML,open:sheet.open,doneBound:typeof done.onclick==='function',undoBound:undo.onclick===window.tcUndoLastCompletion};
  `
)();
assert(summaryRender.open,'completion summary sheet must open');
assert(summaryRender.html.includes('Дополнительная тренировка завершена'));
assert(summaryRender.html.includes('Отменить сохранение'));
assert(summaryRender.html.includes('Подъём коленей в висе'));
assert(summaryRender.doneBound&&summaryRender.undoBound,'completion summary actions must be bound');

const staleFormFeedback=[];
new Function('TC_course','tcActionMessage','tcAdvancedChoicePool',formBodies.openAdvanced)(
  {level:6,advancedChoices:{},goal:'quantity'},
  (...args)=>staleFormFeedback.push(args),
  ()=>[]
);
assert.equal(staleFormFeedback[0][0],'Выбор упражнений недоступен');

const weightFeedback=[];
new Function('document','tcActionMessage',formBodies.saveWeight)(
  {getElementById:()=>null},
  (...args)=>weightFeedback.push(args)
);
assert.equal(weightFeedback[0][0],'Вес не сохранён');

const undoState={enabled:true,level:4,goal:'quantity',weeklySessions:3,cycleStartDate:'2026-09-25',
  courseSeq:1,lastCourseDate:'2026-09-25',lastCourseTs:123,testAnchorDate:'2026-09-25',
  lastTestDate:'',history:[{courseMode:'course',date:'2026-09-25',ts:123,courseComplex:3}]};
const undoApi=new Function('TC_course',
  extract('tcUndoLatestTodayCourseRecord')+'\nreturn {tcUndoLatestTodayCourseRecord};')(undoState);
assert.equal(undoApi.tcUndoLatestTodayCourseRecord('2026-09-25'),true);
assert.equal(undoState.courseSeq,0);
assert.equal(undoState.history.length,0);
assert.equal(undoState.lastCourseDate,'');
assert.equal(undoState.lastCourseTs,0);
assert.equal(undoState.testAnchorDate,'');
assert.equal(undoApi.tcUndoLatestTodayCourseRecord('2026-09-25'),false,
 'undo must not remove anything twice');
console.log('PASS: syntax, bundle, UX2 persistence/IA/completion, critical actions, forms and touch targets');
