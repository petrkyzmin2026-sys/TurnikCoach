/* TURNIKCOACH_COURSE_DOMAIN 1.0.0-scheduler-owner */
(function(){
'use strict';
const VERSION='1.0.0-scheduler-owner';
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
function debug(state){
return{version:VERSION,weekly:weeklyMode(state||{}),weekdays:state?weekdays(state):[],pure:true,owner:'course-scheduler'};
}
window.TurnikCourseDomain={
version:VERSION,dateKey,dateFromKey,dayDiff,weeklyMode,weekdays,scheduledOn,scheduleEventFor,
pullLoadDates,lastPullLoadDateBefore,recoveryReadyOn,scheduledMainToday,courseDue,recoveryShiftToday,
previousScheduledDay,nextScheduledAfter,transferCandidateRaw,transferCandidate,nextCourseDay,calendarMonday,
projectedCourseSeq,debug
};
try{window.dispatchEvent(new CustomEvent('turnikcoursedomain:ready',{detail:{version:VERSION}}))}catch(e){}
})();