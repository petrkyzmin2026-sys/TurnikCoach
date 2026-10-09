/* TURNIKCOACH_COURSE_DOMAIN 1.2.0-presenter-data */
(function(){
'use strict';
const VERSION='1.2.0-presenter-data';
if(window.TurnikCourseDomain&&window.TurnikCourseDomain.version===VERSION)return;
function dateKey(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function dateFromKey(k){return new Date(k+'T12:00:00')}
function dayDiff(a,b){if(!a||!b)return 999;const x=dateFromKey(a),y=dateFromKey(b);return Math.round((y-x)/86400000)}
function weeklyMode(state){return !!(state&&state.enabled&&state.level>=1&&state.level<=7)}
function weekdays(state){
const l=state.level,g=state.goal;
if(l===1)return[1,3,5,0];
if(l===2)return state.weeklySessions===2?[1,4]:state.weeklySessions===4?[1,3,6,0]:[1,3,6];
if(l===3)return[1,3,6];
if(l===4){if(g==='quantity')return state.weeklySessions===4?[1,3,5,0]:[1,3,6];return g==='onearm'?[1,3,5,0]:[1,3,6]}
if(l===5)return g==='onearm'?[1,3,5,0]:[1,3,6];
if(l===6)return[1,3,6];
return[1,4,6];
}
function scheduledOn(state,k){
if(state.cycleStartDate){
const d=dayDiff(state.cycleStartDate,k);
return d>=0&&weekdays(state).map(x=>(x+6)%7).includes(d%7);
}
return weekdays(state).includes(dateFromKey(k).getDay());
}
function scheduleEventFor(state,plannedDate){return(state.scheduleEvents||[]).find(e=>e.plannedDate===plannedDate)||null}
function pullLoadDates(state){
const a=[];
(state.history||[]).forEach(h=>{if(h&&h.date&&['course','auxCourse','supplement'].includes(h.courseMode))a.push(h.date)});
(state.tests||[]).forEach(t=>{if(t&&t.date)a.push(t.date)});
(state.masteryTests||[]).forEach(t=>{if(t&&t.date)a.push(t.date)});
if(state.lastCourseDate)a.push(state.lastCourseDate);
return[...new Set(a)].sort();
}
function lastPullLoadDateBefore(state,key){
let last='';for(const d of pullLoadDates(state))if(d<key&&d>last)last=d;return last;
}
function recoveryReadyOn(state,key){
const last=lastPullLoadDateBefore(state,key);return!last||dayDiff(last,key)>=2;
}
function scheduledMainToday(state,ctx){
const c=ctx||{},today=c.today||dateKey();
if(!weeklyMode(state))return false;
if(state.lastCourseDate===today||c.testDue||c.masteryDue)return false;
if(!state.lastCourseDate&&!state.cycleStartDate)return true;
return scheduledOn(state,today);
}
function courseDue(state,ctx){
const c=ctx||{},today=c.today||dateKey();
return scheduledMainToday(state,c)&&recoveryReadyOn(state,today);
}
function recoveryShiftToday(state,ctx){
const c=ctx||{},today=c.today||dateKey();
return scheduledMainToday(state,c)&&!recoveryReadyOn(state,today);
}
function previousScheduledDay(state,key){
const d=dateFromKey(key);
for(let i=1;i<=28;i++){const x=new Date(d);x.setDate(d.getDate()-i);const k=dateKey(x);if(scheduledOn(state,k))return k}
return'';
}
function nextScheduledAfter(state,key){
const d=dateFromKey(key);
for(let i=1;i<=28;i++){const x=new Date(d);x.setDate(d.getDate()+i);const k=dateKey(x);if(scheduledOn(state,k))return k}
return'';
}
function transferCandidateRaw(state,today,ctx){
const c=ctx||{},key=today||c.today||dateKey();
if(!weeklyMode(state)||scheduledOn(state,key)||c.testDue||c.masteryDue)return null;
const planned=previousScheduledDay(state,key);if(!planned)return null;
const next=nextScheduledAfter(state,planned);if(!next||key>=next)return null;
const e=scheduleEventFor(state,planned);if(!e||!['missed','recovery_shift'].includes(e.status))return null;
return{plannedDate:planned,status:e.status,nextScheduledDate:next,ready:recoveryReadyOn(state,key)};
}
function transferCandidate(state,today,ctx){
const key=today||(ctx&&ctx.today)||dateKey(),c=transferCandidateRaw(state,key,ctx);
return c&&!(state.transferRestDates||[]).includes(key)?c:null;
}
function nextCourseDay(state,ctx){
const c=ctx||{},today=c.today||dateKey(),now=dateFromKey(today);
for(let i=0;i<28;i++){
const d=new Date(now);d.setDate(now.getDate()+i);const k=dateKey(d);
if(scheduledOn(state,k)&&k!==state.lastCourseDate&&(i>0||courseDue(state,c)))return k;
}
return'';
}
function calendarMonday(today,weekOffset){
const d=dateFromKey(today||dateKey());
d.setDate(d.getDate()-(d.getDay()+6)%7+(Number(weekOffset)||0)*7);return d;
}
function projectedCourseSeq(state,key,today){
let seq=state.courseSeq,d=dateFromKey(today||dateKey()),end=dateFromKey(key);
if(key<=(today||dateKey()))return seq;
for(;d<end;d.setDate(d.getDate()+1)){
const k=dateKey(d);
if(scheduledOn(state,k)&&k!==state.lastCourseDate&&!(state.history||[]).some(h=>h.courseMode==='course'&&h.date===k))seq++;
}
return seq;
}

function planState(state,ctx){
const c=ctx||{},enabled=!!state.enabled;
return{
kind:enabled?'COURSE_ACTIVE':'COURSE_DISABLED',
enabled,level:state.level,levelTitle:c.levelTitle||'',goal:state.goal,goalName:c.goalName||'',
nextComplex:c.nextComplex==null?null:c.nextComplex,nextComplexName:c.nextComplexName||'—',
pullMax:state.pullMax,weeklySessions:state.weeklySessions,frequency:c.frequency||'',
cycleStartDate:state.cycleStartDate||'',extras:Array.isArray(c.extras)?c.extras:[]
};
}
function todayState(state,ctx){
const c=ctx||{},today=c.today||dateKey();
if(c.selectedDate&&c.selectedDate!==today)return{kind:'PREVIEW',date:c.selectedDate};
if(c.done)return{kind:'COURSE_DONE',record:c.done,extras:Array.isArray(c.extras)?c.extras:[]};
const scheduleCtx={today,testDue:!!c.testDue,masteryDue:!!c.masteryDue};
if(weeklyMode(state)&&c.testDue)return{kind:'COURSE_TEST'};
if(c.masteryDue)return{kind:'MASTERY_TEST'};
if(recoveryShiftToday(state,scheduleCtx))return{kind:'RECOVERY_SHIFT'};
const transfer=transferCandidate(state,today,scheduleCtx);
if(transfer)return{kind:transfer.ready?'TRANSFER':'TRANSFER_RECOVERY',transfer};
const due=courseDue(state,scheduleCtx);
if(due&&state.level===7&&!c.advancedSelected)return{kind:'ADVANCED_SETUP'};
if(due&&c.runnableDefsCount===0)return{kind:'EQUIPMENT_SETUP',defs:Array.isArray(c.defs)?c.defs:[]};
if(due&&Array.isArray(c.calibration)&&c.calibration.length)return{kind:'CALIBRATION',calibration:c.calibration};
if(due&&c.needsWorkingWeight)return{kind:'WORKING_WEIGHT'};
if(due){
const m=c.main||{};
return{kind:'MAIN_WORKOUT',levelTitle:m.levelTitle||'',complexName:m.complexName||'Основной комплекс',
items:Array.isArray(m.items)?m.items:[],totalSets:Number(m.totalSets)||0,adapted:!!m.adapted,defs:Array.isArray(c.defs)?c.defs:[]};
}
const nextDate=weeklyMode(state)?nextCourseDay(state,scheduleCtx):(c.fallbackNextDate||'');
return{kind:'RECOVERY',auxDue:!!c.auxDue,extras:Array.isArray(c.extras)?c.extras:[],nextDate};
}
function progressStats(state,run){
if(!state||!run)return null;
const h=(state.history||[]).filter(x=>x.runId===run.id),m=h.filter(x=>x.courseMode==='course'),e=(state.scheduleEvents||[]).filter(x=>x.runId===run.id);
const on=m.filter(x=>!x.transferred).length,moved=m.length-on,missed=e.filter(x=>x.status==='missed').length,
recovery=e.filter(x=>x.status==='recovery_shift').length+m.filter(x=>x.transferred&&x.scheduleOriginStatus==='recovery_shift').length,
den=on+moved+missed;
let sets=0,reps=0;
h.forEach(x=>(x.details||[]).forEach(d=>(d.actual||[]).forEach(v=>{
if(v!==null&&Number.isFinite(+v)){sets++;if(['reps','reps_side','weighted'].includes(d.metric))reps+=+v}
})));
const base=+run.baselinePullMax||state.pullMax,cur=state.pullMax,delta=cur-base,pct=base?Math.round(delta/base*100):0;
const tests=(state.tests||[]).filter(x=>x.runId===run.id).sort((a,b)=>(a.ts||0)-(b.ts||0)).map(x=>x.value);
return{r:run,on,moved,missed,recovery,completed:m.length,rate:den?Math.round((on+moved)/den*100):null,sets,reps,base,cur,delta,pct,tests};
}
function progressState(state,ctx){
const c=ctx||{},run=c.run||null;
return{
kind:'COURSE_PROGRESS',stats:progressStats(state,run),level:state.level,mastery:c.mastery||'',
enabled:!!state.enabled,pullMax:state.pullMax,targetMax:state.targetMax,
history:Array.isArray(state.history)?state.history.slice(0,8):[],
tests:Array.isArray(state.tests)?state.tests.slice():[],
masteryTests:Array.isArray(state.masteryTests)?state.masteryTests.slice():[]
};
}
function debug(state){
return{version:VERSION,weekly:weeklyMode(state||{}),weekdays:state?weekdays(state):[],pure:true,owner:'course-viewstate',presenterData:true};
}
window.TurnikCourseDomain={
version:VERSION,dateKey,dateFromKey,dayDiff,weeklyMode,weekdays,scheduledOn,scheduleEventFor,
pullLoadDates,lastPullLoadDateBefore,recoveryReadyOn,scheduledMainToday,courseDue,recoveryShiftToday,
previousScheduledDay,nextScheduledAfter,transferCandidateRaw,transferCandidate,nextCourseDay,calendarMonday,
projectedCourseSeq,planState,todayState,progressStats,progressState,debug
};
try{window.dispatchEvent(new CustomEvent('turnikcoursedomain:ready',{detail:{version:VERSION}}))}catch(e){}
})();