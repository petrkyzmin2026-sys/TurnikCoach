'use strict';
// Deterministic regression checks for the existing Morozov course module.
// Pure functions are extracted from the actual shipped source, not duplicated.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const course=fs.readFileSync('live/course.js','utf8');
const hotfix=fs.readFileSync('live/hotfix.js','utf8');
new vm.Script(course,{filename:'live/course.js'});
new vm.Script(hotfix,{filename:'live/hotfix.js'});
const bundled=hotfix.match(/const COURSE_MODULE_BUNDLED=("(?:\\.|[^"\\])*");\n  function tcValidCourseModule/);
assert(bundled,'embedded course module must exist');
assert.equal(JSON.parse(bundled[1]),course,'APK update must use the same course module');
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
assert(hotfix.includes("const VERSION='5.16.26-touch-targets'"),
 'release hotfix version must be 5.16.26');
assert(course.includes("const COURSE_MODULE_VERSION='1.0.24-touch-targets'"),
 'course module version must be 1.0.24');
assert(!course.includes('window.confirm('),'course module must not depend on unsupported WebView JS dialogs');
assert(!hotfix.includes('window.confirm('),'hotfix navigation/discard must not depend on unsupported WebView JS dialogs');
assert(!hotfix.includes('forceHandover'),'5.16.26 must use an explicit user-visible update prompt');
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
assert(!doneHtml.includes('onclick='),
 'critical after-main actions must not depend on inline handlers');

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
console.log('PASS: syntax, bundle, critical actions, form feedback and complete 48px touch-target rules');
