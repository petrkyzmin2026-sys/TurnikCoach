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
assert(hotfix.includes("const VERSION='5.16.23-group1-ux'"),
 'release hotfix version must be 5.16.23');
assert(hotfix.includes("b.type='button';b.className='tcWorkoutExitBtn';b.textContent='Выйти'"),
 'workout UI must expose a visible header exit control');
assert(hotfix.includes("b.title='Выйти без сохранения'"),
 'workout exit control must state its destructive meaning');
assert(course.includes('tcUndoTodayCourseWorkout'),
 'today screen must expose undo for an accidentally saved course workout');
assert(!course.includes('window.confirm('),'course module must not depend on unsupported WebView JS dialogs');
assert(!hotfix.includes('window.confirm('),'hotfix navigation/discard must not depend on unsupported WebView JS dialogs');
assert(course.includes('tcOpenUndoTodayCourseConfirm'),'same-day undo must use an in-app confirmation sheet');
assert(hotfix.includes('tcConfirmDiscardWorkoutBtn'),'discard without saving must use an in-app confirmation sheet');
assert(!hotfix.includes('forceHandover'),'update must no longer silently hand over between versions');
assert(hotfix.includes('showInstalledNotice'),'successful update must provide visible feedback');

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
const extras=[{e:{name:'Отжимания'},plan:[10,10,10]}];
const doneHtml=uiApi.tcTodayCourseDoneHtml(extras);
assert(doneHtml.includes('Основной комплекс выполнен'),'saved main workout must render as a completed state');
assert(doneHtml.includes('id="tcStartExtraAfterCourseBtn"'),'after-main extras need a stable start button');
assert(doneHtml.includes('Начать дополнительную тренировку'),'after-main extra workout must be visibly available');
assert(doneHtml.includes('id="tcUndoTodayCourseBtn"'),'same-day undo remains available as a secondary action');
assert(!doneHtml.includes('onclick='),'critical after-main actions must not depend on inline onclick');

let undoCalls=0,extraCalls=0,chooseCalls=0,prevented=0,stopped=0;
function fakeButton(){
  return {dataset:{},handlers:{},addEventListener(type,fn){this.handlers[type]=fn}};
}
const undoButton=fakeButton(),extraButton=fakeButton(),chooseButton=fakeButton();
const fakeDocument={getElementById:id=>({
  tcUndoTodayCourseBtn:undoButton,
  tcStartExtraAfterCourseBtn:extraButton,
  tcChooseExtrasAfterCourseBtn:chooseButton
}[id]||null)};
const fakeWindow={
  tcOpenUndoTodayCourseConfirm:()=>{undoCalls++},
  tcStartExtraWorkout:()=>{extraCalls++}
};
const bindApi=new Function('document','window','go',
  extract('tcBindTodayDoneActions')+'\nreturn {tcBindTodayDoneActions};')(
    fakeDocument,fakeWindow,()=>{chooseCalls++}
  );
bindApi.tcBindTodayDoneActions();
const ev={preventDefault:()=>prevented++,stopPropagation:()=>stopped++};
assert.equal(typeof undoButton.handlers.click,'function','undo action must receive a programmatic listener');
assert.equal(typeof extraButton.handlers.click,'function','extra action must receive a programmatic listener');
undoButton.handlers.click(ev);
extraButton.handlers.click(ev);
chooseButton.handlers.click(ev);
assert.equal(undoCalls,1);
assert.equal(extraCalls,1,'after-main extra start button must invoke the workout exactly once');
assert.equal(chooseCalls,1);
assert.equal(prevented,3);
assert.equal(stopped,3);

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
console.log('PASS: syntax, bundle, calendar, visible update flow, WebView-safe undo and after-main extra workout');
