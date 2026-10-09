'use strict';
// Deterministic regression checks for the existing Morozov course module.
// Pure functions are extracted from the actual shipped source, not duplicated.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const course=fs.readFileSync('live/course.js','utf8');
const core=fs.readFileSync('live/core.js','utf8');
const domain=fs.readFileSync('live/domain.js','utf8');
const ui=fs.readFileSync('live/ui.js','utf8');
const store=fs.readFileSync('live/store.js','utf8');
const actions=fs.readFileSync('live/actions.js','utf8');
const standardWorkout=fs.readFileSync('live/standard_workout.js','utf8');
const restModule=fs.readFileSync('live/rest.js','utf8');
const lifecycle=fs.readFileSync('live/lifecycle.js','utf8');
const navigation=fs.readFileSync('live/navigation.js','utf8');
const workoutUi=fs.readFileSync('live/workout_ui.js','utf8');
const courseDomain=fs.readFileSync('live/course_domain.js','utf8');
const hotfix=fs.readFileSync('live/hotfix.js','utf8');
assert(Buffer.byteLength(hotfix,'utf8')<=128*1024,
 'modular OTA shell must stay comfortably below the native 256 KiB ceiling');
const manifest=fs.readFileSync('app/src/main/AndroidManifest.xml','utf8');
const mainActivity=fs.readFileSync('app/src/main/java/ru/turnikcoach/app/MainActivity.java','utf8');
new vm.Script(course,{filename:'live/course.js'});
new vm.Script(core,{filename:'live/core.js'});
new vm.Script(domain,{filename:'live/domain.js'});
new vm.Script(ui,{filename:'live/ui.js'});
new vm.Script(store,{filename:'live/store.js'});
new vm.Script(actions,{filename:'live/actions.js'});
new vm.Script(standardWorkout,{filename:'live/standard_workout.js'});
new vm.Script(restModule,{filename:'live/rest.js'});
new vm.Script(lifecycle,{filename:'live/lifecycle.js'});
new vm.Script(navigation,{filename:'live/navigation.js'});
new vm.Script(workoutUi,{filename:'live/workout_ui.js'});
new vm.Script(courseDomain,{filename:'live/course_domain.js'});
new vm.Script(hotfix,{filename:'live/hotfix.js'});
const courseDomainSandbox={console,CustomEvent:function(type,init){this.type=type;this.detail=init&&init.detail},dispatchEvent:()=>true};
courseDomainSandbox.window=courseDomainSandbox;
vm.runInNewContext(courseDomain,courseDomainSandbox,{filename:'live/course_domain.js'});
const schedule=courseDomainSandbox.TurnikCourseDomain;
assert.equal(schedule.version,'1.1.0-viewstate-owner');
const coreBundled=hotfix.match(/const CORE_MODULE_BUNDLED=("(?:\\.|[^"\\])*");\nconst TC_DOMAIN_MODULE_VERSION/);
assert(coreBundled,'small TurnikCore bootstrap must remain embedded in the OTA shell');
assert.equal(JSON.parse(coreBundled[1]),core,'embedded TurnikCore bootstrap must match live/core.js');
assert(!hotfix.includes('COURSE_MODULE_BUNDLED='),'course module must no longer be duplicated inside the OTA shell');
assert(hotfix.includes("TC_COURSE_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/course.js"),
 'course module must load as a separately versioned live module');
assert(hotfix.includes("TC_COURSE_CACHE_KEY='tc_module_course_'+TC_COURSE_MODULE_VERSION"),
 'course module must have a versioned offline cache');
assert(hotfix.includes("TC_COURSE_DOMAIN_MODULE_VERSION='1.1.0-viewstate-owner'")&&
 hotfix.includes("TC_COURSE_DOMAIN_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/course_domain.js"),
 'OTA must version and cache the separate TurnikCourseDomain module');
assert(hotfix.indexOf("if(!tcLoadCourseDomainModule())")<hotfix.lastIndexOf("if(!tcLoadCourseModule())"),
 'TurnikCourseDomain must be evaluated before course.js');
assert(hotfix.includes("TC_DOMAIN_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/domain.js")&&
 hotfix.includes("TC_DOMAIN_CACHE_KEY='tc_module_domain_'+TC_DOMAIN_MODULE_VERSION"),
 'domain state must ship as a separately versioned/offline-cached module');
assert(hotfix.includes("TC_DOMAIN_MODULE_VERSION='1.0.0'")&&
 hotfix.includes("TC_UI_MODULE_VERSION='1.0.0'")&&
 hotfix.includes("TC_STORE_MODULE_VERSION='1.2.0-undo-restore'")&&
 hotfix.includes("TC_ACTIONS_MODULE_VERSION='1.0.0'")&&
 hotfix.includes("TC_STANDARD_WORKOUT_MODULE_VERSION='1.0.0-action-owner'")&&
 hotfix.includes("TC_REST_MODULE_VERSION='1.0.0-state-owner'")&&
 hotfix.includes("TC_LIFECYCLE_MODULE_VERSION='1.0.0'")&&
 hotfix.includes("TC_NAVIGATION_MODULE_VERSION='1.0.0'")&&
 hotfix.includes("TC_WORKOUT_UI_MODULE_VERSION='1.0.0'")&&
 hotfix.includes("TC_COURSE_MODULE_VERSION='1.0.47-viewstate-adapter'"),
 'OTA shell must pin exact compatible Domain, UI, Store, Actions, Lifecycle, Navigation, WorkoutUI and Course module versions');
assert(hotfix.includes("TC_UI_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/ui.js")&&
 hotfix.includes("TC_UI_CACHE_KEY='tc_module_ui_'+TC_UI_MODULE_VERSION"),
 'UI presenter must ship as a separately versioned/offline-cached module');
assert(hotfix.includes("TC_STORE_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/store.js")&&
 hotfix.includes("TC_STORE_CACHE_KEY='tc_module_store_'+TC_STORE_MODULE_VERSION"),
 'WorkoutStore must ship as a separately versioned/offline-cached module');
assert(hotfix.includes("TC_ACTIONS_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/actions.js")&&
 hotfix.includes("TC_ACTIONS_CACHE_KEY='tc_module_actions_'+TC_ACTIONS_MODULE_VERSION"),
 'WorkoutActions must ship as a separately versioned/offline-cached module');
assert(hotfix.includes("TC_STANDARD_WORKOUT_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/standard_workout.js")&&
 hotfix.includes("TC_STANDARD_WORKOUT_CACHE_KEY='tc_module_standard_workout_'+TC_STANDARD_WORKOUT_MODULE_VERSION"),
 'standard workout action owner must ship as a separately versioned/offline-cached module');
assert(hotfix.includes("TC_REST_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/rest.js")&&
 hotfix.includes("TC_REST_CACHE_KEY='tc_module_rest_'+TC_REST_MODULE_VERSION"),
 'rest state owner must ship as a separately versioned/offline-cached module');
assert(hotfix.includes("TC_LIFECYCLE_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/lifecycle.js")&&
 hotfix.includes("TC_LIFECYCLE_CACHE_KEY='tc_module_lifecycle_'+TC_LIFECYCLE_MODULE_VERSION"),
 'WorkoutLifecycle must ship as a separately versioned/offline-cached module');
assert(hotfix.includes("TC_NAVIGATION_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/navigation.js")&&
 hotfix.includes("TC_NAVIGATION_CACHE_KEY='tc_module_navigation_'+TC_NAVIGATION_MODULE_VERSION"),
 'Navigation dispatcher must ship as a separately versioned/offline-cached module');
assert(hotfix.includes("TC_WORKOUT_UI_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/workout_ui.js")&&
 hotfix.includes("TC_WORKOUT_UI_CACHE_KEY='tc_module_workout_ui_'+TC_WORKOUT_UI_MODULE_VERSION"),
 'WorkoutUI dispatcher must ship as a separately versioned/offline-cached module');
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
const key=(date=new Date('2026-09-25T12:00:00'))=>
  date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
const courseState={enabled:true,level:4,goal:'quantity',weeklySessions:4,
  cycleStartDate:'2026-09-25',courseSeq:5,lastCourseDate:'',history:[],scheduleEvents:[]};
const dates=['2026-09-25','2026-09-26','2026-09-27','2026-09-28',
 '2026-09-29','2026-09-30','2026-10-01','2026-10-02'];
assert.deepEqual(dates.filter(k=>schedule.scheduledOn(courseState,k)),
 ['2026-09-25','2026-09-27','2026-09-29','2026-10-01','2026-10-02'],
 '4 sessions must rotate with the Friday anchor, including next cycle');
assert.equal(schedule.scheduledOn(courseState,'2026-09-24'),false,'no assignment before start');
assert.equal(schedule.projectedCourseSeq(courseState,'2026-09-29','2026-09-25'),7,'preview must project future sessions');
const complexApi=new Function('TC_course','tcCourseLevel',
  extract('tcCourseComplexNo')+'\n'+extract('tcCourseComplex')+'\nreturn {tcCourseComplex};')(
  courseState,()=>({complexes:{1:{name:'№1'},2:{name:'№2'},3:{name:'№3'}}})
);
assert.equal(complexApi.tcCourseComplex(schedule.projectedCourseSeq(courseState,'2026-09-29','2026-09-25')).no,2);
assert.equal(courseState.courseSeq,5,'preview must not mutate the stored sequence');
courseState.weeklySessions=3;
assert.deepEqual(dates.filter(k=>schedule.scheduledOn(courseState,k)),
 ['2026-09-25','2026-09-27','2026-09-30','2026-10-02'],
 '3 sessions must rotate with the Friday anchor');
courseState.cycleStartDate='';
assert.equal(schedule.scheduledOn(courseState,'2026-09-26'),true,
 'older installations without an anchor retain the legacy weekday schedule');

const flexState={enabled:true,level:4,goal:'quantity',weeklySessions:4,cycleStartDate:'2026-09-25',
  courseSeq:12,lastCourseDate:'2026-09-25',history:[{courseMode:'course',date:'2026-09-25'}],
  tests:[],masteryTests:[],scheduleEvents:[{plannedDate:'2026-09-27',status:'missed',actualDate:''}],
  transferRestDates:[]};
const mondayCtx={today:'2026-09-28',testDue:false,masteryDue:false};
const mondayTransfer=schedule.transferCandidateRaw(flexState,'2026-09-28',mondayCtx);
assert.equal(mondayTransfer.plannedDate,'2026-09-27','Sunday miss must remain the next course stage on Monday');
assert.equal(mondayTransfer.ready,true,'Friday factual load must allow Monday transfer');
assert.equal(mondayTransfer.nextScheduledDate,'2026-09-29','transfer window must close at the next scheduled slot');
flexState.transferRestDates.push('2026-09-28');
assert.equal(schedule.transferCandidate(flexState,'2026-09-28',mondayCtx),null,'choosing rest hides transfer only for that day');
assert.equal(schedule.transferCandidateRaw(flexState,'2026-09-29',{today:'2026-09-29',testDue:false,masteryDue:false}),null,
 'missed session must not become training debt on the next scheduled day');
flexState.transferRestDates=[];
flexState.history.unshift({courseMode:'course',date:'2026-09-28',plannedDate:'2026-09-27'});
flexState.lastCourseDate='2026-09-28';
assert.equal(schedule.recoveryReadyOn(flexState,'2026-09-29'),false,'day after a transferred main workout must be recovery');
const tuesdayCtx={today:'2026-09-29',testDue:false,masteryDue:false};
assert.equal(schedule.courseDue(flexState,tuesdayCtx),false,'scheduled session immediately after transfer must not run');
assert.equal(schedule.recoveryShiftToday(flexState,tuesdayCtx),true,'conflicting scheduled session must become recovery shift');
assert(!course.includes("if(l===1)return [1,3,5,0]"),
 'course.js must not duplicate weekday rules owned by TurnikCourseDomain');
assert(course.includes("return tcCourseDomain().scheduledOn(TC_course,k)")&&
 course.includes("return tcCourseDomain().transferCandidateRaw(TC_course,today,tcCourseScheduleContext(today))"),
 'course.js must delegate schedule decisions to the single course-domain owner');
assert(course.includes('scheduleEvents:[]')&&course.includes('transferRestDates:[]'),
 'course state must keep schedule events separate from completed workout history');
assert(course.includes('Выполнить сегодня')&&course.includes('Оставить день отдыха'),
 'Today must expose explicit transfer and rest choices');
assert(course.includes("rec.plannedDate=W.coursePlannedDate||rec.date")&&course.includes("rec.transferred=rec.plannedDate!==rec.date"),
 'completed transfer must persist both planned and actual dates');
assert(course.includes("courseRuns:[]")&&course.includes("activeRunId:''")&&course.includes('function tcEnsureCourseRun()'),
 'course state must persist versioned Morozov course periods');
assert(course.includes("rec.runId=run&&run.id||''")&&course.includes("runId:run&&run.id||''"),
 'workouts and control results must link to their course run');
const statsState={
 pullMax:21,activeRunId:'r1',
 courseRuns:[{id:'r1',startedDate:'2026-09-01',level:4,goal:'quantity',baselinePullMax:17,targetMax:25}],
 history:[
  {runId:'r1',courseMode:'course',transferred:false,details:[{metric:'reps',actual:[10,9]}]},
  {runId:'r1',courseMode:'course',transferred:true,scheduleOriginStatus:'recovery_shift',details:[{metric:'reps',actual:[8,8]}]},
  {runId:'r1',courseMode:'auxCourse',details:[{metric:'time',actual:[30]},{metric:'reps',actual:[5]}]}
 ],
 scheduleEvents:[
  {runId:'r1',status:'missed'},{runId:'r1',status:'recovery_shift'}
 ],
 tests:[{runId:'r1',ts:1,value:19},{runId:'r1',ts:2,value:21}]
};
const statsResult=schedule.progressStats(statsState,statsState.courseRuns[0]);
assert.equal(statsResult.completed,2,'stats count only completed main course sessions');
assert.equal(statsResult.on,1);assert.equal(statsResult.moved,1);
assert.equal(statsResult.missed,1);assert.equal(statsResult.recovery,2,'recovery count must retain a shifted slot even after it is completed by transfer');
assert.equal(statsResult.rate,67,'recovery shifts must be excluded from course completion denominator');
assert.equal(statsResult.sets,6);assert.equal(statsResult.reps,40,'timed seconds must not be added to repetition volume');
assert.equal(statsResult.base,17);assert.equal(statsResult.cur,21);
assert.equal(statsResult.delta,4);assert.equal(statsResult.pct,24);
assert.deepEqual(statsResult.tests,[19,21]);
const resumedStart=new Function('TC_course','dateKey',extract('tcRunStartDate')+';return tcRunStartDate;')(
 {courseRuns:[{id:'old'}],history:[],cycleStartDate:'2026-09-01',level:4,goal:'quantity'},()=> '2026-10-05');
assert.equal(resumedStart(),'2026-10-05','a resumed/new course period must start today instead of reusing the legacy cycle anchor');
const legacyStart=new Function('TC_course','dateKey',extract('tcRunStartDate')+';return tcRunStartDate;')(
 {courseRuns:[],history:[
  {courseMode:'course',date:'2026-08-10',courseLevel:3,courseGoal:'quantity'},
  {courseMode:'course',date:'2026-09-20',courseLevel:4,courseGoal:'quantity'}
 ],cycleStartDate:'2026-08-01',level:4,goal:'quantity'},()=> '2026-10-05');
assert.equal(legacyStart(),'2026-09-20','legacy migration must start at the first compatible current-level/goal workout, not the whole-course anchor');
assert(course.includes('Выполнение курса:')&&course.includes('Контрольные максимумы:'),
 'Progress must render the compact Morozov course statistics card');
assert(course.includes("view.kind==='PREVIEW'")&&course.includes('tcPreviewCourseCard(view.date)'),
 'choosing another date must resolve PREVIEW state and show a read-only plan');
assert(course.includes('function tcCourseTodayState()')&&course.includes('function tcResolvedTodayState()'),
 'Today business state must be resolved before DOM rendering');
const planOwner=extract('tcCoursePlanState'),todayOwner=extract('tcCourseTodayState'),
 progressOwner=extract('tcCourseProgressState'),statsOwner=extract('tcCourseRunStats');
assert(planOwner.includes('tcCourseDomain().planState(TC_course')&&!planOwner.includes("kind:TC_course.enabled"),
 'course.js Plan adapter must delegate final state construction to TurnikCourseDomain');
assert(todayOwner.includes('tcCourseDomain().todayState(TC_course')&&!todayOwner.includes("return{kind:'COURSE_DONE'"),
 'course.js Today adapter must delegate state priority/selection to TurnikCourseDomain');
assert(statsOwner.includes('tcCourseDomain().progressStats(TC_course')&&progressOwner.includes('tcCourseDomain().progressState(TC_course'),
 'course.js Progress adapter must delegate aggregation and final state to TurnikCourseDomain');
assert(courseDomain.includes("function planState(state,ctx)")&&courseDomain.includes("function todayState(state,ctx)")&&
 courseDomain.includes("function progressStats(state,run)")&&courseDomain.includes("function progressState(state,ctx)"),
 'TurnikCourseDomain must own Plan / Today / Progress state builders');
assert(course.includes("view.kind==='MAIN_WORKOUT'")&&course.includes("view.kind==='RECOVERY_SHIFT'")&&course.includes("view.kind==='TRANSFER'||view.kind==='TRANSFER_RECOVERY'"),
 'Today renderer must render explicit domain states instead of recomputing the scenario');
assert(course.includes("window.TurnikDomain.register('today','morozov',100")&&
 course.includes("window.TurnikDomain.register('plan','morozov',100")&&
 course.includes("window.TurnikDomain.register('progress','morozov',100"),
 'Morozov must register Today / Plan / Progress resolvers in TurnikDomain');
assert(course.includes("window.TurnikUI.register('today','morozov',100")&&
 course.includes("window.TurnikUI.register('plan','morozov',100")&&
 course.includes("window.TurnikUI.register('progress','morozov',100"),
 'Morozov must register Today / Plan / Progress presenters in TurnikUI');
assert(!course.includes('window.render=function()')&&!course.includes('window.renderHistory=function()')&&
 !course.includes('tcBeforeCourseRender=window.render')&&!course.includes('tcBeforeCourseRenderHistory=window.renderHistory'),
 'course module must not own global render lifecycle after the UI presenter split');
assert(ui.includes('function renderArea(area,context)')&&ui.includes('function renderActive(context)')&&ui.includes('function install()'),
 'TurnikUI must own one domain-to-screen dispatch path');
assert(hotfix.includes("if(!window.TurnikUI.install())throw new Error('TurnikCoach UI dispatcher install failed')")&&
 hotfix.indexOf("if(!window.TurnikUI.install())")<hotfix.indexOf("if(!tcLoadCourseModule())"),
 'UI dispatcher must install before course presenters execute');
assert(ui.includes('window.render=function()'),
 'TurnikUI must remain the single owner of the top-level render wrapper');
assert(!hotfix.includes('const oldRender=window.render')&&!hotfix.includes('window.render=function()')&&
 !hotfix.includes('const base=window.renderHistory')&&!hotfix.includes('window.renderHistory=function()'),
 'hotfix must not add independent top-level render or renderHistory wrappers');
assert(hotfix.includes("TurnikUI.register('today','*',10000")&&
 hotfix.includes("TurnikUI.register('plan','*',10000")&&
 hotfix.includes("TurnikUI.register('progress','*',10000"),
 'Today / Plan / Progress post-processing must flow through TurnikUI presenter dispatch');
assert(hotfix.includes("setTimeout(()=>{renderSummary();tcQueueDecorate()},0)")&&
 hotfix.includes("setTimeout(tcQueueDecorate,0)"),
 'post-render work must be deferred until the owning presenter has finished');
assert(course.includes('id="tcCycleStartDate"'),
 'settings must expose a cycle start date');
assert(hotfix.includes("const VERSION='5.16.60-rest-state-owner'"),
 'release hotfix version must be 5.16.60');
assert(course.includes("const COURSE_MODULE_VERSION='1.0.47-viewstate-adapter'"),
 'course module version must be 1.0.47');
const directCourseWrites=(course.match(/localStorage\.setItem\(TC_COURSE_KEY/g)||[]).length;
assert.equal(directCourseWrites,1,'course persistence must have exactly one physical localStorage write boundary');
const saveCourseBody=extract('tcSaveCourse');
const restoreStart=course.indexOf('window.tcRestoreCourseStateSnapshot=function(');
const restoreEnd=course.indexOf('window.tcCoursePersistenceDebug=function(',restoreStart);
assert(restoreStart>=0&&restoreEnd>restoreStart,'course persistence diagnostics must follow restore adapter');
const restoreCourseBody=course.slice(restoreStart,restoreEnd);
assert(saveCourseBody.includes("store.transact('course'")&&saveCourseBody.includes('tcPersistCourseSnapshot(snapshot)'),
 'course saves must route through WorkoutStore when available and use adapter only during bootstrap');
assert(!restoreCourseBody.includes('tcSaveCourse()'),'course restore adapter must not recurse through WorkoutStore');
assert(course.includes("owner:store?'TurnikWorkoutStore':'bootstrap-adapter'")&&course.includes("adapter:'tcPersistCourseSnapshot'"),
 'course module must expose its persistence owner for diagnostics');
assert(course.includes("if(TC_course.enabled&&tcEnsureCourseRun())window.__TC_COURSE_BOOTSTRAP_DIRTY=true;")&&
 course.includes("window.tcFlushCourseBootstrapState=function()"),
 'course bootstrap migration must defer persistence until the source is registered');
assert(!course.includes("if(TC_course.enabled&&tcEnsureCourseRun())tcSaveCourse();"),
 'course module must not transact through WorkoutStore before TurnikCore registers the course source');
assert(hotfix.includes("if(!tcRegisterCoreSources())throw new Error('TurnikCoach core source registration failed')")&&
 hotfix.includes("tcFlushCourseBootstrapState"),
 'hotfix must flush deferred course bootstrap state only after core source registration');
assert(hotfix.indexOf("tcRegisterCoreSources())")<hotfix.indexOf("tcFlushCourseBootstrapState"),
 'course bootstrap flush must happen after source registration');
assert(domain.includes("const VERSION='1.0.0'"),
 'domain module version must be 1.0.0');
assert(!course.includes('TC_EXTRA_START'),
 'temporary extra-workout trace logging must not ship');
assert(!course.includes('window.confirm('),'course module must not depend on unsupported WebView JS dialogs');
assert(!hotfix.includes('window.confirm('),'hotfix navigation/discard must not depend on unsupported WebView JS dialogs');
assert(!hotfix.includes('forceHandover'),'5.16.60 must use an explicit user-visible update prompt');
assert(hotfix.includes("showRuntimeNotice('TurnikCoach обновлён до '+LABEL)"),
 'successful activation must give visible feedback');
assert(hotfix.includes("localStorage.setItem('tc_hotfix_active_version',VERSION)"),
 'active hotfix version must be persisted for diagnostics');
assert(hotfix.includes('async function tcEnsureRequiredModules()')&&
 hotfix.includes('const modulesReady=await tcEnsureRequiredModules()')&&
 hotfix.includes("localStorage.setItem(APPROVED_KEY,VERSION)"),
 'update approval must happen only after required modules are available and cached');
const installUpdateBody=extractFrom(hotfix,'installUpdate');
assert(installUpdateBody.includes('if(!tcDomainCacheReady()||!tcUiCacheReady()||!tcStoreCacheReady()||!tcActionsCacheReady()||!tcStandardWorkoutCacheReady()||!tcRestCacheReady()||!tcLifecycleCacheReady()||!tcNavigationCacheReady()||!tcWorkoutUiCacheReady()||!tcCourseDomainCacheReady()||!tcCourseCacheReady())')&&
 !installUpdateBody.slice(0,installUpdateBody.indexOf("const previousVersion=")).includes('tcLoadCourseModule()')&&
 !installUpdateBody.slice(0,installUpdateBody.indexOf("const previousVersion=")).includes('tcLoadCourseDomainModule()')&&
 !installUpdateBody.slice(0,installUpdateBody.indexOf("const previousVersion=")).includes('tcLoadDomainModule()')&&
 !installUpdateBody.slice(0,installUpdateBody.indexOf("const previousVersion=")).includes('tcLoadUiModule()')&&
 !installUpdateBody.slice(0,installUpdateBody.indexOf("const previousVersion=")).includes('tcLoadStoreModule()'),
 'install preflight must verify Domain/UI/Store/Actions/StandardWorkout/Lifecycle/Navigation/WorkoutUI/CourseDomain/Course caches without executing later modules ahead of the legacy patch order');
assert(hotfix.includes('function tcRegisterCoreSources()')&&
 hotfix.includes("core.registerSource('generic'")&&hotfix.includes("core.registerSource('course'"),
 'TurnikCore must expose both legacy generic and Morozov stores through one state facade');
assert(hotfix.includes("localStorage.setItem('tc_v4',JSON.stringify(next))"),
 'generic source adapter must persist the exact restored snapshot instead of delegating to legacy save()');
assert(hotfix.includes("actionsModule:window.TurnikWorkoutActions&&window.TurnikWorkoutActions.version||''")&&
 hotfix.includes("standardWorkoutModule:window.TurnikStandardWorkout&&window.TurnikStandardWorkout.version||''")&&
 hotfix.includes("restModule:window.TurnikRest&&window.TurnikRest.version||''")&&
 hotfix.includes("lifecycleModule:window.TurnikWorkoutLifecycle&&window.TurnikWorkoutLifecycle.version||''")&&
 hotfix.includes("navigationModule:window.TurnikNavigation&&window.TurnikNavigation.version||''")&&
 hotfix.includes("workoutUiModule:window.TurnikWorkoutUI&&window.TurnikWorkoutUI.version||''")&&
 hotfix.includes("courseDomainModule:window.TurnikCourseDomain&&window.TurnikCourseDomain.version||''")&&
 hotfix.includes("courseModule:TC_COURSE_MODULE_VERSION,modular:true}"),
 'runtime diagnostics must expose Core + Domain + UI + Store + Actions + Lifecycle + Navigation + WorkoutUI + CourseDomain + Course modular foundation');
assert(hotfix.includes("window.TurnikWorkoutStore.summary({now:Date.now()})"),
 'Progress summary must consume unified workouts through TurnikWorkoutStore instead of manually joining stores');
assert(store.includes('function transact(sourceName,mutator)')&&store.includes('function batch(steps)')&&store.includes('function append(sourceName,record,prepend=true)'),
 'WorkoutStore must own the shared write primitives');
assert(course.includes("store.transact('course'")&&course.includes("store.batch([")&&course.includes("store.append('course',rec)"),
 'Morozov main/extra/aux/supplement saves must use WorkoutStore write transactions');
assert(!course.includes('TC_course.history.unshift(rec)')&&!course.includes('state.history.unshift(rec)'),
 'course module must not bypass WorkoutStore when saving workout records');
assert(course.includes("return store.transact('course',draft=>"),
 'same-day Morozov undo must use the same transactional write layer');
const storeSandbox={console,CustomEvent:function(type,init){this.type=type;this.detail=init&&init.detail},dispatchEvent:()=>true};
storeSandbox.window=storeSandbox;
const storeSources={
 generic:{history:[
  {type:'workout',date:'2026-10-01',ts:1,session:1,details:[{actual:[10,9]}]},
  {type:'skip',date:'2026-10-03',ts:3,session:1}
 ]},
 course:{history:[
  {type:'workout',date:'2026-10-02',ts:2,courseMode:'course',runId:'r1',transferred:true,details:[{metric:'reps',actual:[8,8]}]}
 ]}
};
let failReplace='';
const cloneStore=x=>JSON.parse(JSON.stringify(x));
const normalizedAll=()=>[
 ...storeSources.generic.history.map(x=>({id:'generic:'+x.ts,source:'generic',ts:x.ts,date:x.date,mode:x.courseMode||x.session||x.type,runId:x.runId||'',transferred:!!x.transferred,details:x.details||[],raw:x})),
 ...storeSources.course.history.map(x=>({id:'course:'+x.ts,source:'course',ts:x.ts,date:x.date,mode:x.courseMode||x.session||x.type,runId:x.runId||'',transferred:!!x.transferred,details:x.details||[],raw:x}))
];
storeSandbox.TurnikCore={
 history:{all:normalizedAll},
 sourceSnapshot:name=>cloneStore(storeSources[name]),
 replaceSource:(name,next)=>{if(name===failReplace)return false;storeSources[name]=cloneStore(next);return true},
 transact:(name,mutator)=>{const next=cloneStore(storeSources[name]);if(mutator(next)===false)return false;storeSources[name]=next;return true}
};
vm.runInNewContext(store,storeSandbox,{filename:'live/store.js'});
assert.equal(storeSandbox.TurnikWorkoutStore.version,'1.2.0-undo-restore');
assert.equal(storeSandbox.TurnikWorkoutStore.list().length,2,'WorkoutStore must exclude non-workout history events');
assert.equal(storeSandbox.TurnikWorkoutStore.list({source:'course'}).length,1);
assert.equal(storeSandbox.TurnikWorkoutStore.list({runId:'r1'}).length,1);
const storeSummary=storeSandbox.TurnikWorkoutStore.summary({now:Date.parse('2026-10-04T12:00:00')});
assert.equal(storeSummary.total,2);assert.equal(storeSummary.sets,4);assert.equal(storeSummary.reps,35);
assert.equal(storeSummary.bySource.generic,1);assert.equal(storeSummary.bySource.course,1);
assert.equal(storeSandbox.TurnikWorkoutStore.course('r1').transferred.length,1);
assert(storeSandbox.TurnikWorkoutStore.append('course',{type:'workout',date:'2026-10-04',ts:4,courseMode:'supplement',details:[]}),
 'WorkoutStore append must write through the registered source');
assert.equal(storeSources.course.history[0].ts,4);
assert(storeSandbox.TurnikWorkoutStore.batch([
 {source:'course',mutate:d=>{d.extraSeq=7;return true}},
 {source:'generic',mutate:d=>{d.history.unshift({type:'workout',date:'2026-10-04',ts:5,courseMode:'extra',details:[]});return true}}
]),'cross-store batch must commit both source mutations');
assert.equal(storeSources.course.extraSeq,7);assert.equal(storeSources.generic.history[0].ts,5);
const beforeRollback=cloneStore(storeSources);
failReplace='generic';
assert.equal(storeSandbox.TurnikWorkoutStore.batch([
 {source:'course',mutate:d=>{d.extraSeq=99;return true}},
 {source:'generic',mutate:d=>{d.history.unshift({type:'workout',date:'2026-10-05',ts:6,details:[]});return true}}
]),false,'failed cross-store batch must report failure');
failReplace='';
assert.deepEqual(storeSources.course,beforeRollback.course,'failed batch must roll back an already-applied source');
const restoreTarget=cloneStore(storeSources);
storeSources.generic.history.push({type:'workout',date:'2026-10-05',ts:50});
storeSources.course.extraSeq=33;
assert(storeSandbox.TurnikWorkoutStore.restoreSnapshots(restoreTarget),
 'snapshot restore must atomically restore both sources');
assert.deepEqual(storeSources,restoreTarget,'restore must restore complete generic/course objects');
const failedRestoreBefore=cloneStore(storeSources);
failReplace='course';
assert.equal(storeSandbox.TurnikWorkoutStore.restoreSnapshots({
 generic:{history:[]},course:{history:[]}
}),false,'failed restore must not silently keep a partial transaction');
failReplace='';
assert.deepEqual(storeSources,failedRestoreBefore,'failed restore must roll back already-restored sources');

assert(hotfix.includes("const LEGACY_ASSET_VERSION='5.14.0-adaptive-rest'"),
 'live hotfix must know the immutable packaged asset version');
assert(hotfix.includes('window.__TC_HOTFIX_ACTIVE_VERSION=VERSION'),
 'live hotfix must keep its active version separate from the legacy asset compatibility sentinel');
assert(hotfix.includes('window.__TC_HOTFIX_VERSION=LEGACY_ASSET_VERSION'),
 'packaged 5.14 hotfix must be prevented from re-patching the page after the live update');
assert(hotfix.includes("b.type='button';b.className='tcWorkoutExitBtn';b.textContent='Выйти'")&&
 hotfix.includes("b.onclick=window.tcDiscardWorkout"),
 'packaged workout header must expose Exit and route it to the single discard confirmation');
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
assert(hotfix.includes('<div class="sheettitle">Завершить без сохранения?</div>')&&
 hotfix.includes('>Завершить без сохранения</button>'),
 'discard confirmation must use the agreed Finish without saving wording');
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
 course.includes("if(!g.moved)setTimeout(()=>run(g.el,null),0)")&&
 !course.includes("pointerGesture===g&&!g.moved&&!g.ran"),
 'Today actions must activate after pointer release, never from a held pointerdown');
assert(course.includes(".tcAfterMainCard{position:relative;z-index:40"),
 'after-main CTA card must stay above sibling content in the Today stacking context');
assert(course.includes("tcActionMessage('Не удалось начать тренировку',message)"),
 'extra-workout startup errors must never fail silently');
const emptyExtrasHtml=uiApi.tcTodayCourseDoneHtml([]);
assert(!emptyExtrasHtml.includes("onclick=\"go('exercise')\""),
 'after-main choose-extras CTA must not keep a competing inline action path');
assert(course.includes("window.__TC_TODAY_ACTION_DELEGATION_V2"),
 'Today actions must install the versioned delegated router V2');


/* The shipped gesture router must not start training while the initiating
 * touch is still down. A 200% layout previously placed Done underneath the
 * finger after the 140 ms pointerdown fallback navigated early. */
{
 const handlers={};
 const doc={addEventListener:(name,fn)=>{(handlers[name]??=[]).push(fn)}};
 const button={id:'tcStartExtraAfterCourseBtn',closest:()=>button};
 let now=1000,starts=0,queued=[];
 const win={tcStartExtraWorkout:()=>{starts++}};
 const timer=fn=>{queued.push(fn);return queued.length};
 const router=new Function('document','window','setTimeout','Date',
    extract('tcInstallTodayActionDelegation')+';return tcInstallTodayActionDelegation');
 router(doc,win,timer,{now:()=>now})();
 const emit=(type,x=100,y=200,target=button)=>{
   const e={target,clientX:x,clientY:y,pointerType:'touch',
     touches:[{clientX:x,clientY:y}],preventDefault(){this.prevented=true},
     stopPropagation(){this.stopped=true}};
   for(const h of handlers[type]||[])h(e);
   return e;
 };
 emit('pointerdown');emit('touchstart');
 assert.equal(starts,0,'press must not start training before release');
 for(const fn of queued.splice(0))fn();
 assert.equal(starts,0,'holding Today button must never switch to Workout');
 emit('pointerup');
 assert.equal(starts,0,'pointerup fallback must run after pointer release');
 const end=emit('touchend');
 assert.equal(end.prevented,true,'touchend must suppress subsequent synthetic click');
 assert.equal(starts,1,'touchend starts exactly one workout');
 for(const fn of queued.splice(0))fn();
 emit('click');
 assert.equal(starts,1,'pointer/click fallbacks must not repeat the same gesture');
 now+=1200;
 emit('pointerdown');emit('touchstart');
 emit('pointermove',130,200);emit('touchmove',130,200);emit('pointerup',130,200);
 emit('touchend',130,200);
 for(const fn of queued.splice(0))fn();
 assert.equal(starts,1,'a scroll gesture must not start another workout');
}

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
const startExtraEnd=course.indexOf('window.tcStartSupplementWorkout=function(){',startExtraPos);
assert(startExtraEnd>startExtraPos,'tcStartExtraWorkout end marker missing');
const startExtraBody=course.slice(startExtraPos,startExtraEnd);
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
  transferRest:windowFunctionBody('tcChooseTransferRest'),
  deferMastery:windowFunctionBody('tcDeferMasteryTest'),
  openMastery:windowFunctionBody('tcOpenMasteryTest'),
  saveMastery:windowFunctionBody('tcSaveMasteryTest'),
  advance:windowFunctionBody('tcAdvanceCourseLevel')
};
assert(actionBodies.aux.includes("tcActionMessage('Вспомогательный комплекс сейчас недоступен'"),
 'auxiliary workout must explain schedule/recovery blocking');
assert(actionBodies.aux.includes("tcActionMessage('Нет доступных упражнений'"),
 'auxiliary workout must explain empty runnable set');
assert(actionBodies.supplement.includes("tcActionMessage('Приоритет основной тренировки'"),
 'supplement must explain pending-main/recovery blocking');
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
assert(actionBodies.confirmTest.includes("store.batch([")&&
 !actionBodies.confirmTest.includes("TC_course.tests.unshift")&&
 !actionBodies.confirmTest.includes("tcSaveCourse()")&&!actionBodies.confirmTest.includes("save()"),
 'control maximum must atomically update course + generic maximum through WorkoutStore');
assert(actionBodies.saveMastery.includes("store.batch(steps)")&&
 !actionBodies.saveMastery.includes("TC_course.masteryTests.unshift")&&
 !actionBodies.saveMastery.includes("tcSaveCourse()")&&!actionBodies.saveMastery.includes("save()"),
 'mastery result must use transactional course/generic writes');
assert(actionBodies.deferTest.includes("tcRequireWorkoutStore().transact('course'")&&
 !actionBodies.deferTest.includes("tcSaveCourse()"),
 'control deferral must write through WorkoutStore');
assert(actionBodies.deferMastery.includes("tcRequireWorkoutStore().transact('course'")&&
 !actionBodies.deferMastery.includes("tcSaveCourse()"),
 'mastery deferral must write through WorkoutStore');
assert(actionBodies.transferRest.includes("store.transact('course'")&&
 !actionBodies.transferRest.includes("tcSaveCourse()")&&
 !actionBodies.transferRest.includes("TC_course.transferRestDates.push"),
 'rest-day choice must write through WorkoutStore instead of mutating live course state');
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
assert(formBodies.saveSettings.indexOf("const parsed=")<formBodies.saveSettings.indexOf("TC_course.enabled=nextEnabled"),
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
assert(hotfix.includes('function tcInstallNavigationUpgrades()')&&
 hotfix.includes('window.__TC_NAV_UPGRADE_VERSION=VERSION')&&
 /tcInstallNavigationFoundation\(\);\s*tcInstallNavigationUpgrades\(\);\s*tcInstallCompletionFlow\(\);\s*tcInstallHapticFeedback\(\);\s*tcInstallWorkoutCorrection\(\);\s*tcInstallProgressSummary\(\);\s*tcInstallWorkoutPersistence\(\);/.test(hotfix),
 'hotfix upgrades must run after the one-time navigation core and before persistence restore');
assert(hotfix.includes('window.tcRefreshActiveTrainingSurface=function(id)')&&
 hotfix.includes('window.tcArmRestoreSurfaceGuard=function(surface)')&&
 hotfix.includes('until:Date.now()+5000')&&
 hotfix.includes("window.__tcRestoreGuardPageshowHandler=enforceRestoreGuard")&&
 hotfix.includes("document.visibilityState==='visible'"),
 'cold restore must keep the active training surface asserted through the startup handover window');
assert(hotfix.includes("if(window.__TC_NAV_FOUNDATION)return;")&&
 hotfix.includes("if(window.__tcRestoreGuardFocusHandler)window.removeEventListener('focus'"),
 'navigation core must remain one-time while hotfix-specific listeners are replaceable');
assert(hotfix.includes("TurnikNative.showSurface")&&
 mainActivity.includes("@JavascriptInterface public void showSurface(String requested)")&&
 mainActivity.includes("web.setLayerType(View.LAYER_TYPE_SOFTWARE, null)")&&
 mainActivity.includes("web.postInvalidateOnAnimation()")&&
 !mainActivity.includes("web.evaluateJavascript(js, value ->"),
 'cold restore must repaint the requested training surface natively without re-entering WebView JS');
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
assert(hotfix.includes("tcSyncScreenVisibility(target||'today');")&&
 hotfix.includes("replaceRoute(target||'today',false);"),
 'discard must unhide Today and synchronize the visible WebView surface');
assert(hotfix.includes("priorInstalledHotfix.startsWith('5.16.')")&&
 hotfix.includes("'5.16.35-touch-release';")&&
 hotfix.includes("window.__TC_UPDATE_PENDING_VERSION='';"),
 'new hotfix must suppress the actual cached 5.16.35 prompt before discard or Progress unlocks it');
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
assert(hotfix.includes("store.restoreSnapshots({generic:tx.state,course:tx.course})")&&
 hotfix.includes("tcCompletionHistorySignature()")&&
 course.includes("window.tcGetCourseStateSnapshot=function()")&&
 course.includes("window.tcRestoreCourseStateSnapshot=function(snapshot)"),
 'completion undo must restore both generic state and the encapsulated course snapshot');
assert(hotfix.includes('tcShowCompletionSummary(summary)'),
 'successful save must open a completion summary');
assert(hotfix.includes("if(tcActiveWorkoutForUpdate()){")&&hotfix.includes('tcScheduleDeferredUpdate(activate)'),
 'update prompt must defer while a workout or durable workout snapshot is active');

// Single-owner workout action regression.
assert(manifest.includes('android.permission.VIBRATE'),'preview requires Android vibration permission');
assert.equal((course.match(/window\.setDone\s*=/g)||[]).length,0,
 'course module must never replace global setDone');
assert.equal((hotfix.match(/window\.setDone\s*=/g)||[]).length,0,
 'OTA shell must no longer replace global setDone directly');
assert.equal((standardWorkout.match(/window\.setDone\s*=/g)||[]).length,0,
 'standard workout module must register with the action dispatcher instead of replacing setDone');
assert(standardWorkout.includes("registerHandler('standard-workout',10,handle)"),
 'generic/extra set completion must be owned by the standard-workout action handler');
assert(hotfix.includes("registerBefore('haptic-feedback'")&&hotfix.includes("registerAfter('haptic-feedback'"),
 'haptic feedback must subscribe to the workout dispatcher');
assert(hotfix.includes("registerBefore('workout-correction'")&&hotfix.includes("registerAfter('workout-correction'"),
 'correction trail must subscribe to the workout dispatcher');
assert(hotfix.includes("registerAfter('workout-persistence'"),
 'active workout persistence must subscribe to the workout dispatcher');
assert(course.includes("registerHandler('morozov-course',100,tcCourseSetDoneAction)"),
 'Morozov set completion must register a mode handler instead of wrapping setDone');
assert(hotfix.includes('window.TurnikWorkoutActions.install()'),
 'workout dispatcher must become the final setDone owner after all hooks are registered');
const actionSandbox={console,CustomEvent:function(){},dispatchEvent:()=>true};
actionSandbox.window=actionSandbox;
actionSandbox.setDone=function(skip){actionSandbox.baseCalls=(actionSandbox.baseCalls||0)+1;actionSandbox.lastSkip=!!skip;return 'base'};
vm.runInNewContext(actions,actionSandbox,{filename:'live/actions.js'});
const order=[];
actionSandbox.TurnikWorkoutActions.registerBefore('before',10,ctx=>order.push('before:'+ctx.skip));
actionSandbox.TurnikWorkoutActions.registerHandler('special',100,ctx=>ctx.skip?{handled:true,result:'handled'}:null);
actionSandbox.TurnikWorkoutActions.registerAfter('after',10,ctx=>order.push('after:'+(ctx.handler||'base')));
assert(actionSandbox.TurnikWorkoutActions.install());
assert.equal(actionSandbox.setDone(false),'base');
assert.equal(actionSandbox.baseCalls,1);
assert.equal(actionSandbox.setDone(true),'handled');
assert.equal(actionSandbox.baseCalls,1,'handled mode action must not call the generic base');
assert.deepEqual(order,['before:false','after:base','before:true','after:special']);
assert.equal(actionSandbox.TurnikWorkoutActions.debug().singleOwner,true);
const standardSandbox={console,CustomEvent:function(){},dispatchEvent:()=>true,setTimeout:fn=>{if(typeof fn==='function')fn()}};
standardSandbox.window=standardSandbox;
standardSandbox.W={sessionIndex:1,exerciseIndex:0,setIndex:0,actual:8,items:[
 {e:{id:'pull',name:'Подтягивания',max:10},plan:[8,7],actual:[]},
 {e:{id:'push',name:'Отжимания',max:20},plan:[12],actual:[]}
]};
standardSandbox.setDone=function(){standardSandbox.baseCalls=(standardSandbox.baseCalls||0)+1;return'legacy'};
standardSandbox.adaptiveRest=()=>({seconds:105,note:'adaptive'});
standardSandbox.transitionRest=()=>({seconds:120,note:'transition'});
standardSandbox.startRest=(sec,note)=>{standardSandbox.rest=[sec,note]};
standardSandbox.askFeedback=()=>{standardSandbox.feedback=(standardSandbox.feedback||0)+1};
standardSandbox.beep=()=>{};
standardSandbox.tcPrimeAudio=()=>{};
standardSandbox.tcFinishSignal=()=>{standardSandbox.finishSignal=(standardSandbox.finishSignal||0)+1};
vm.runInNewContext(actions,standardSandbox,{filename:'live/actions.js'});
vm.runInNewContext(standardWorkout,standardSandbox,{filename:'live/standard_workout.js'});
assert(standardSandbox.TurnikWorkoutActions.install());
standardSandbox.setDone(false);
assert.deepEqual(standardSandbox.W.items[0].actual,[8]);
assert.equal(standardSandbox.W.setIndex,1);
assert.deepEqual(standardSandbox.rest,[105,'adaptive']);
standardSandbox.W.actual=7;standardSandbox.setDone(false);
assert.equal(standardSandbox.W.exerciseIndex,1);
assert.equal(standardSandbox.W.setIndex,0);
assert.deepEqual(standardSandbox.rest,[120,'transition']);
standardSandbox.W.actual=12;standardSandbox.setDone(false);
assert.equal(standardSandbox.feedback,1);
assert.equal(standardSandbox.finishSignal,1);
assert.equal(standardSandbox.baseCalls||0,0,'standard handler must own ordinary workouts without falling back to legacy setDone');
assert(standardSandbox.TurnikWorkoutActions.debug().handlerNames.includes('standard-workout'));

// Single-owner rest state regression.
assert.equal((hotfix.match(/window\.startRest\s*=/g)||[]).length,0,
 'OTA shell must not own startRest after TurnikRest split');
assert.equal((hotfix.match(/window\.addRest\s*=/g)||[]).length,0,
 'OTA shell must not own addRest after TurnikRest split');
assert.equal((course.match(/window\.startRest\s*=/g)||[]).length,0,
 'course module must consume the rest API without replacing startRest');
assert.equal((course.match(/window\.addRest\s*=/g)||[]).length,0,
 'course module must consume the rest API without replacing addRest');
assert(restModule.includes('window.startRest=legacyStart;window.addRest=legacyAdd;'),
 'TurnikRest must be the sole compatibility owner of startRest/addRest');
assert(!hotfix.includes('tcRestActive')&&!hotfix.includes('tcRestEnd')&&!hotfix.includes('tcSignalSeconds')&&!hotfix.includes('tcRenderRest'),
 'OTA shell must not keep a second rest timer state');
assert(hotfix.includes("rest:restState")&&hotfix.includes("window.TurnikRest.snapshot()")&&hotfix.includes("restOwner.restore(rest,{navigate:true})"),
 'active-workout persistence must snapshot and restore rest through TurnikRest');
assert(hotfix.includes("restOwner.onChange("),
 'active-workout persistence must subscribe to TurnikRest instead of wrapping rest actions');

let restNow=100000,restIntervalFn=null;
const restNodes={restNum:{textContent:''}};
const restSandbox={
 console,
 Date:{now:()=>restNow},
 setInterval:fn=>{restIntervalFn=fn;return 1},
 clearInterval:()=>{restIntervalFn=null},
 document:{
   addEventListener:()=>{},
   getElementById:id=>restNodes[id]||null
 },
 addEventListener:()=>{},
 CustomEvent:function(){},
 dispatchEvent:()=>true
};
restSandbox.window=restSandbox;
restSandbox.TurnikWorkoutLifecycle={registerBefore:(event,name,priority,fn)=>{restSandbox.cleanup={event,name,priority,fn};return true}};
vm.runInNewContext(restModule,restSandbox,{filename:'live/rest.js'});
const restEvents=[];
assert(restSandbox.TurnikRest.install({
 ring:()=>restNodes.restNum,
 navigate:id=>{restSandbox.surface=id},
 finish:()=>{restSandbox.finished=(restSandbox.finished||0)+1},
 beep:()=>{restSandbox.beeps=(restSandbox.beeps||0)+1},
 finishSignal:()=>{restSandbox.finishSignals=(restSandbox.finishSignals||0)+1},
 primeAudio:()=>{},
 nextStep:()=>{restSandbox.nextStep=(restSandbox.nextStep||0)+1},
 setNote:value=>{restSandbox.note=value}
}));
restSandbox.TurnikRest.onChange(e=>restEvents.push(e.type));
assert.equal(restSandbox.TurnikRest.debug().singleOwner,true);
restSandbox.startRest(90,'adaptive');
assert.equal(restSandbox.surface,'rest');
assert.equal(restSandbox.TurnikRest.snapshot().active,true);
assert.equal(restSandbox.TurnikRest.snapshot().end,190000);
assert.equal(restNodes.restNum.textContent,'90');
restSandbox.addRest();
assert.equal(restSandbox.TurnikRest.snapshot().end,220000);
restNow=219000;restSandbox.TurnikRest.render();
assert.equal(restNodes.restNum.textContent,'1');
restNow=220000;restSandbox.TurnikRest.render();
assert.equal(restSandbox.finished,1);
assert.equal(restSandbox.TurnikRest.snapshot().active,false);
assert(restEvents.includes('start')&&restEvents.includes('add')&&restEvents.includes('elapsed'));
assert.equal(restSandbox.cleanup.name,'rest-state-owner');

// Single-owner workout lifecycle regression.
assert.equal((course.match(/window\.finishWorkout\s*=(?!=)/g)||[]).length,0,'course must never replace global finishWorkout');
assert.equal((course.match(/window\.finishRest\s*=(?!=)/g)||[]).length,0,'course must never replace global finishRest');
assert.equal((hotfix.match(/window\.finishWorkout\s*=(?!=)/g)||[]).length,0,'hotfix must not wrap global finishWorkout');
assert.equal((hotfix.match(/window\.finishRest\s*=(?!=)/g)||[]).length,0,'hotfix must not wrap global finishRest');
assert(course.includes("registerHandler('finishWorkout','morozov-course',100,tcCourseFinishWorkoutAction)")&&
 course.includes("registerHandler('finishRest','morozov-manual-rest',100,tcCourseFinishRestAction)"),
 'Morozov finish behavior must register lifecycle handlers');
assert(restModule.includes("registerBefore('finishRest','rest-state-owner'")&&
 hotfix.includes("registerBefore('finishWorkout','completion-flow'")&&
 hotfix.includes("registerAfter('finishWorkout','completion-flow'")&&
 hotfix.includes("registerAfter('finishWorkout','workout-persistence'"),
 'timer cleanup, completion UI and persistence must be lifecycle hooks');
assert(hotfix.includes('window.TurnikWorkoutLifecycle.install()'),
 'lifecycle dispatcher must become the sole finishWorkout/finishRest owner');
const lifeSandbox={console,CustomEvent:function(){},dispatchEvent:()=>true};
lifeSandbox.window=lifeSandbox;
lifeSandbox.finishWorkout=function(feel){lifeSandbox.baseWorkout=(lifeSandbox.baseWorkout||0)+1;return 'base:'+feel};
lifeSandbox.finishRest=function(){lifeSandbox.baseRest=(lifeSandbox.baseRest||0)+1;return 'rest'};
vm.runInNewContext(lifecycle,lifeSandbox,{filename:'live/lifecycle.js'});
const lifeOrder=[];
lifeSandbox.TurnikWorkoutLifecycle.registerBefore('finishWorkout','before',10,ctx=>lifeOrder.push('before:'+ctx.args[0]));
lifeSandbox.TurnikWorkoutLifecycle.registerHandler('finishWorkout','course',100,ctx=>ctx.args[0]==='course'?{handled:true,result:'course'}:null);
lifeSandbox.TurnikWorkoutLifecycle.registerAfter('finishWorkout','after',10,ctx=>lifeOrder.push('after:'+(ctx.handler||'base')));
assert(lifeSandbox.TurnikWorkoutLifecycle.install());
assert.equal(lifeSandbox.finishWorkout('generic'),'base:generic');
assert.equal(lifeSandbox.finishWorkout('course'),'course');
assert.equal(lifeSandbox.baseWorkout,1,'handled finishWorkout must not call generic base');
assert.equal(lifeSandbox.finishRest(),'rest');
const lifeDebug=lifeSandbox.TurnikWorkoutLifecycle.debug();
assert.equal(lifeDebug.events.finishWorkout.singleOwner,true);
assert.equal(lifeDebug.events.finishRest.singleOwner,true);
assert.deepEqual(lifeOrder,['before:generic','after:base','before:course','after:course']);

// Single-owner navigation regression.
assert.equal((hotfix.match(/window\.go\s*=(?!=)/g)||[]).length,0,'OTA shell must not wrap global go');
assert(hotfix.includes("registerBefore('navigation-foundation',10000")&&
 hotfix.includes("registerAfter('navigation-foundation',10000")&&
 hotfix.includes("registerAfter('correction-controls',100")&&
 hotfix.includes("registerAfter('product-decorate',50"),
 'navigation history, correction controls and product decoration must be TurnikNavigation hooks');
assert(hotfix.includes('window.TurnikNavigation.install()'),'navigation dispatcher must become the sole go owner');
const navSandbox={console,CustomEvent:function(){},dispatchEvent:()=>true};
navSandbox.window=navSandbox;navSandbox.go=function(id){navSandbox.baseCalls=(navSandbox.baseCalls||0)+1;navSandbox.last=id;return 'base:'+id};
vm.runInNewContext(navigation,navSandbox,{filename:'live/navigation.js'});
const navOrder=[];
navSandbox.TurnikNavigation.registerBefore('before',10,ctx=>navOrder.push('before:'+ctx.target));
navSandbox.TurnikNavigation.registerAfter('after',10,ctx=>navOrder.push('after:'+ctx.target));
assert(navSandbox.TurnikNavigation.install());
assert.equal(navSandbox.go('today'),'base:today');
assert.equal(navSandbox.baseCalls,1);
assert.deepEqual(navOrder,['before:today','after:today']);
assert.equal(navSandbox.TurnikNavigation.debug().singleOwner,true);

// Single-owner workout render regression.
assert.equal((hotfix.match(/window\.renderWork\s*=(?!=)/g)||[]).length,0,'OTA shell must not wrap global renderWork');
assert.equal((course.match(/window\.renderWork\s*=(?!=)/g)||[]).length,0,'course module must not wrap global renderWork');
assert(workoutUi.includes('window.renderWork=dispatcher'),'TurnikWorkoutUI must be the single renderWork owner');
assert(course.includes("TurnikWorkoutUI.registerAfter('morozov-course',100,tcCourseRenderWork)"),
 'Morozov workout rendering must be a TurnikWorkoutUI post-render hook');
assert(hotfix.includes("TurnikWorkoutUI.registerAfter('correction-controls',60"),
 'correction controls must be a TurnikWorkoutUI post-render hook');
assert(hotfix.includes('window.TurnikWorkoutUI.install()'),
 'WorkoutUI dispatcher must install before course rendering executes');
const wuSandbox={console,CustomEvent:function(){},dispatchEvent:()=>true,W:{mode:'test'}};
wuSandbox.window=wuSandbox;wuSandbox.renderWork=function(){wuSandbox.baseCalls=(wuSandbox.baseCalls||0)+1;return 'base'};
vm.runInNewContext(workoutUi,wuSandbox,{filename:'live/workout_ui.js'});
const wuOrder=[];
wuSandbox.TurnikWorkoutUI.registerBefore('before',10,()=>wuOrder.push('before'));
wuSandbox.TurnikWorkoutUI.registerAfter('after',10,()=>wuOrder.push('after'));
assert(wuSandbox.TurnikWorkoutUI.install());
assert.equal(wuSandbox.renderWork(),'base');
assert.equal(wuSandbox.baseCalls,1);
assert.deepEqual(wuOrder,['before','after']);
assert.equal(wuSandbox.TurnikWorkoutUI.debug().singleOwner,true);

assert(hotfix.includes('navigator.vibrate([70,45,70])'),
 'danger feedback needs a distinct reject pattern');

assert(hotfix.includes('#app > .nav{z-index:90!important;pointer-events:auto!important}')&&
 hotfix.includes('#today .scroll{min-height:0!important;overscroll-behavior:contain;padding-bottom:144px!important}'),
 'bottom navigation must have an unobstructed hit layer and safe Today scroll clearance at large text');
// Actual correction implementation: undo skip, previous approach and previous exercise.
assert(hotfix.includes('tcTrainingTopActions')&&
 hotfix.includes('justify-content:space-between')&&
 hotfix.includes("back.textContent='← Назад'")&&
 hotfix.includes("exit.textContent='Выйти'")&&
 hotfix.includes("exit.onclick=window.tcDiscardWorkout")&&
 hotfix.includes("back.disabled=!hasTrail;back.onclick=window.tcReturnToPreviousSet")&&
 hotfix.includes("prev.style.display='grid'")&&
 hotfix.includes("finish.textContent='Выйти'")&&
 hotfix.includes("finish.onclick=window.tcDiscardWorkout")&&
 hotfix.includes("workout.querySelectorAll('.tcCorrectionSetBtn').forEach(b=>b.remove())")&&
 !hotfix.includes('window.tcFinishActiveWorkout=function()')&&
 !hotfix.includes('window.tcOpenWorkoutFinishMenu=function()'),
 'Workout and rest must show Back top-left and Exit top-right with one discard confirmation, no Finish menu or bottom Back');
assert(hotfix.includes('#rest .rest .tcInfoBtn{left:50%!important;right:auto!important')&&
 hotfix.includes('max-width:calc((100% - 112px)/2)'),
 'Rest Info must be centered and side controls must not overlap it even at 200% font scale');
assert(hotfix.includes("prev.onclick=window.tcReturnToPreviousSet")&&
 hotfix.includes("back.onclick=window.tcReturnToPreviousSet"),
 'Correction must be available in rest and workout, not a rest-only shortcut');
assert(hotfix.includes('window.tcSaveActiveWorkoutSnapshot()')&&
 hotfix.includes('window.tcRefreshActiveTrainingSurface'),
 'Corrected workout must be re-persisted and displayed');
const correctionHarness=new Function(
  extractFrom(hotfix,'tcCaptureCorrectionBefore')+'\n'+
  extractFrom(hotfix,'tcCommitCorrection')+'\n'+
  extractFrom(hotfix,'tcUndoCorrection')+'\n'+
  `
  const w={exerciseIndex:0,setIndex:0,actual:10,early:false,
    items:[{plan:[10,9],actual:[]},{plan:[6],actual:[]}]};
  const first=tcCaptureCorrectionBefore(w);
  w.items[0].actual[0]=10;w.setIndex=1;w.actual=9;
  if(!tcCommitCorrection(w,first))throw Error('first set not recorded');
  const skipped=tcCaptureCorrectionBefore(w);
  w.items[0].actual[1]=null;w.exerciseIndex=1;w.setIndex=0;w.actual=6;
  if(!tcCommitCorrection(w,skipped))throw Error('skip not recorded');
  const serialized=JSON.parse(JSON.stringify(w));
  const rollbackSkip=tcUndoCorrection(serialized);
  if(!rollbackSkip||serialized.exerciseIndex!==0||serialized.setIndex!==1||
     serialized.items[0].actual[1]!==undefined||serialized.actual!==9)
    throw Error('failed to restore a skipped approach and its input');
  const reloaded=JSON.parse(JSON.stringify(serialized));
  if(reloaded.items[0].actual[1]!==undefined)
    throw Error('undo must survive snapshot serialization without a null skip');
  const rollbackFirst=tcUndoCorrection(serialized);
  if(!rollbackFirst||serialized.exerciseIndex!==0||serialized.setIndex!==0||
     serialized.items[0].actual[0]!==undefined||serialized.actual!==10)
    throw Error('failed to navigate to earlier exercise approach');
  if(tcUndoCorrection(serialized)!==null)throw Error('underflow should be safe');
  serialized.items[0].actual[0]=10;
  serialized.actual=11;
  const overwrite=tcCaptureCorrectionBefore(serialized);
  serialized.items[0].actual[0]=11;
  if(!tcCommitCorrection(serialized,overwrite))throw Error('correction to prior value not recorded');
  tcUndoCorrection(serialized);
  if(serialized.items[0].actual[0]!==10)throw Error('prior recorded value not restored');
  return {savedTrail:w.__tcCorrectionTrail.length,restored:true};
  `
)();
assert.deepEqual(correctionHarness,{savedTrail:2,restored:true},
 'undo stack must restore saved, skipped and corrected values after JSON persistence');

// Shipped progress metrics count actual workouts, not skipped sessions or tests.
assert(hotfix.includes('function tcInstallProgressSummary()')&&
 hotfix.includes("window.tcRenderProgressSummary=renderSummary")&&
 hotfix.includes("'За 7 дней'")&&hotfix.includes("'Всего тренировок'")&&
 hotfix.includes("'MAX подтяг.'"),
 'Progress must render summary cards from existing data without replacing charts');
const progressMetrics=new Function(
 extractFrom(hotfix,'tcProgressMetrics')+'\nreturn tcProgressMetrics;'
)();
const progressNow=Date.parse('2026-10-02T12:00:00');
const sameTs=Date.parse('2026-10-01T12:00:00');
const sample=progressMetrics(
 [
   {type:'workout',date:'2026-10-01',ts:sameTs,total:50,courseMode:'extra'},
   {type:'workout',date:'2026-09-01',ts:Date.parse('2026-09-01T12:00:00'),total:41},
   {type:'skip',date:'2026-10-02',ts:progressNow}
 ],
 [
   {type:'workout',date:'2026-10-02',ts:progressNow-3600000,total:51,courseMode:'course'},
   {type:'workout',date:'2026-10-01',ts:sameTs,total:50,courseMode:'extra'},
   {type:'test',date:'2026-10-01',ts:sameTs,total:50}
 ],
 21,progressNow
);
assert.deepEqual(sample,{week:2,total:3,pullMax:21},
 'Progress summary must dedupe shared records and exclude skips/tests');

// Behavioral completion-flow regression: execute the shipped wrapper and shipped Undo transaction.
const completionHarnessFn=new Function('intervene','lifecycleSource',
  extractFrom(hotfix,'tcWorkoutSummary')+'\n'+
  extractFrom(hotfix,'tcReadCompletionUndo')+'\n'+
  extractFrom(hotfix,'tcClearCompletionUndo')+'\n'+
  extractFrom(hotfix,'tcCompletionHistoryFingerprint')+'\n'+
  extractFrom(hotfix,'tcCompletionHistorySignature')+'\n'+
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
    finishRest:function(){return 'rest'},
    TurnikWorkoutStore:{
      sourceSnapshot:name=>JSON.parse(JSON.stringify(name==='generic'?state:courseState)),
      restoreSnapshots:snapshots=>{state=JSON.parse(JSON.stringify(snapshots.generic));courseState=JSON.parse(JSON.stringify(snapshots.course));return true}
    },
    tcClearActiveWorkoutSnapshot:()=>{activeSnapshotClears++}
  };
  const CustomEvent=function(){},dispatchEvent=()=>true;
  eval(lifecycleSource);
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
  if(!window.TurnikWorkoutLifecycle.install())throw Error('lifecycle install failed');
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
  if(intervene)state.history.push({id:'intervening-record'});
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
);

const completionHarness=completionHarnessFn(false,lifecycle);
const conflictHarness=completionHarnessFn(true,lifecycle);
assert.equal(completionHarness.afterFinish.finishResult,'saved');
assert.equal(completionHarness.afterFinish.W,null,'finish lifecycle must leave no active workout after base save');
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
assert.equal(conflictHarness.undoResult,false,'Undo must refuse to overwrite an intervening workout');
assert.equal(conflictHarness.state.history.length,3,'conflict must preserve the new workout');
assert.equal(conflictHarness.course.courseSeq,5,'conflict must not roll back the course');
assert(conflictHarness.txAfterUndo,'conflict must retain the undo transaction for explicit recovery');
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
  lastTestDate:'',history:[{courseMode:'course',date:'2026-09-25',ts:123,courseComplex:3}],scheduleEvents:[]};
const undoApi=new Function('TC_course','tcRequireWorkoutStore',
  extract('tcScheduleEventFor')+'\n'+extract('tcUpsertScheduleEvent')+'\n'+extract('tcRemoveScheduleEvent')+'\n'+
  extract('tcUndoLatestTodayCourseRecord')+'\nreturn {tcUndoLatestTodayCourseRecord};')(
  undoState,()=>({transact:(source,mutator)=>source==='course'&&mutator(undoState)!==false})
);
assert.equal(undoApi.tcUndoLatestTodayCourseRecord('2026-09-25'),true);
assert.equal(undoState.courseSeq,0);
assert.equal(undoState.history.length,0);
assert.equal(undoState.lastCourseDate,'');
assert.equal(undoState.lastCourseTs,0);
assert.equal(undoState.testAnchorDate,'');
assert.equal(undoApi.tcUndoLatestTodayCourseRecord('2026-09-25'),false,
 'undo must not remove anything twice');
const domainSandbox={console,CustomEvent:function(type,init){this.type=type;this.detail=init&&init.detail},dispatchEvent:()=>true};
domainSandbox.window=domainSandbox;
vm.runInNewContext(domain,domainSandbox,{filename:'live/domain.js'});
assert.equal(domainSandbox.TurnikDomain.version,'1.0.0');
domainSandbox.TurnikDomain.register('today','generic',10,()=>({kind:'GENERIC_REST'}));
domainSandbox.TurnikDomain.register('today','morozov',100,()=>null);
assert.equal(domainSandbox.TurnikDomain.today().kind,'GENERIC_REST','null high-priority resolver must fall through');
domainSandbox.TurnikDomain.register('today','morozov',100,()=>({kind:'MAIN_WORKOUT'}));
assert.equal(domainSandbox.TurnikDomain.today().kind,'MAIN_WORKOUT','higher-priority course state must win');
assert.equal(domainSandbox.TurnikDomain.today().source,'morozov');
assert.equal(Array.from(domainSandbox.TurnikDomain.debug().areas.today,x=>x.name).join(','),'morozov,generic');

const viewStateBase={enabled:true,level:4,goal:'quantity',weeklySessions:3,cycleStartDate:'2026-10-06',
 lastCourseDate:'2026-10-04',history:[],tests:[],masteryTests:[],scheduleEvents:[],transferRestDates:[]};
const baseCtx={today:'2026-10-06',selectedDate:'',done:null,extras:[],testDue:false,masteryDue:false,
 advancedSelected:true,runnableDefsCount:1,defs:[{}],calibration:[],needsWorkingWeight:false,
 main:{levelTitle:'Fourth',complexName:'Complex 3',items:[{plan:[1,2]}],totalSets:2,adapted:false},
 auxDue:false,fallbackNextDate:'2026-10-08'};
assert.equal(schedule.todayState(viewStateBase,{...baseCtx,done:{date:'2026-10-06'}}).kind,'COURSE_DONE');
assert.equal(schedule.todayState(viewStateBase,{...baseCtx,testDue:true}).kind,'COURSE_TEST');
const dueState={...viewStateBase,lastCourseDate:'',cycleStartDate:'2026-10-06'};
const mainState=schedule.todayState(dueState,baseCtx);
assert.equal(mainState.kind,'MAIN_WORKOUT');assert.equal(mainState.totalSets,2);
const recoveryState={...viewStateBase,cycleStartDate:'2026-10-07'};
assert.equal(schedule.todayState(recoveryState,baseCtx).kind,'RECOVERY');
const planState=schedule.planState(viewStateBase,{levelTitle:'Fourth',goalName:'Количество',nextComplex:3,nextComplexName:'Complex 3',frequency:'3×',extras:[{id:'push',name:'Отжимания'}]});
assert.equal(planState.kind,'COURSE_ACTIVE');assert.equal(planState.nextComplex,3);assert.equal(planState.extras.length,1);
const progressState=schedule.progressState(statsState,{run:statsState.courseRuns[0],mastery:'15–20'});
assert.equal(progressState.kind,'COURSE_PROGRESS');assert.equal(progressState.stats.completed,2);

const memory=new Map();
const sandbox={
 console,
 localStorage:{getItem:k=>memory.has(k)?memory.get(k):null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)},
 CustomEvent:function(type,init){this.type=type;this.detail=init&&init.detail},
 dispatchEvent:()=>true
};
sandbox.window=sandbox;
vm.runInNewContext(core,sandbox,{filename:'live/core.js'});
assert.equal(sandbox.TurnikCore.version,'1.0.0');
let generic={history:[{type:'workout',date:'2026-10-01',ts:1,total:10}]};
let courseData={history:[{type:'workout',date:'2026-10-02',ts:2,courseMode:'course',total:12}]};
sandbox.TurnikCore.registerSource('generic',{snapshot:()=>generic,history:()=>generic.history,restore:x=>{generic=x;return true}});
sandbox.TurnikCore.registerSource('course',{snapshot:()=>courseData,history:()=>courseData.history,restore:x=>{courseData=x;return true}});
assert.equal(sandbox.TurnikCore.history.all().length,2,'unified history must expose both stores without copying them');
assert(sandbox.TurnikCore.transact('generic',x=>{x.seq=9}),
 'TurnikCore transactions must restore through the registered source adapter');
assert.equal(generic.seq,9);
assert.equal(sandbox.TurnikCore.snapshot().sources.course.history.length,1);

const uiSandbox={console,document:{querySelector:()=>null},CustomEvent:function(){},dispatchEvent:()=>true};uiSandbox.window=uiSandbox;
uiSandbox.TurnikDomain={resolve:(area)=>({area,source:'morozov',kind:'TEST'})};
uiSandbox.render=function(){uiSandbox.baseCalls=(uiSandbox.baseCalls||0)+1};
vm.runInNewContext(ui,uiSandbox,{filename:'live/ui.js'});
const presented=[];
uiSandbox.TurnikUI.register('today','morozov',100,state=>{presented.push(state.kind);return true});
assert(uiSandbox.TurnikUI.install(),'TurnikUI must install around the existing base render');
assert.equal(uiSandbox.TurnikUI.renderArea('today').presenter,'morozov');
assert.deepEqual(Array.from(presented),['TEST']);
assert.equal(uiSandbox.TurnikUI.debug().version,'1.0.0');

console.log('PASS: single rest/workout action owners, UI/domain/store architecture, syntax and Android regressions');
