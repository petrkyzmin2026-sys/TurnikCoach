/* TURNIKCOACH_ACTIVE_WORKOUT 1.0.0-persistence-owner */
(function(){
'use strict';
const VERSION='1.0.0-persistence-owner';
const KEY='tc_active_workout_v2',SCHEMA=2,TTL=24*60*60*1000;
if(window.TurnikActiveWorkout&&window.TurnikActiveWorkout.version===VERSION)return;
let adapter=null,installed=false,restoreScheduled=false;
function log(phase,extra){
try{
const w=getWorkout(),item=w&&w.items&&w.items[w.exerciseIndex];
console.log('TC_WORKOUT_STATE',JSON.stringify(Object.assign({
phase,screen:screen(),mode:String(w&&w.mode||''),exerciseIndex:+(w&&w.exerciseIndex)||0,setIndex:+(w&&w.setIndex)||0,name:item&&item.e&&item.e.name||''
},extra||{})));
}catch(e){}
}
function getWorkout(){try{return adapter&&adapter.getWorkout?adapter.getWorkout():null}catch(e){return null}}
function setWorkout(value){try{return !!(adapter&&adapter.setWorkout&&adapter.setWorkout(value))}catch(e){return false}}
function clearWorkout(){try{return !!(adapter&&adapter.clearWorkout&&adapter.clearWorkout())}catch(e){return false}}
function screen(){try{return adapter&&adapter.screen?adapter.screen():'workout'}catch(e){return'workout'}}
function restSnapshot(){try{return adapter&&adapter.restSnapshot?adapter.restSnapshot():{active:false,end:0,note:''}}catch(e){return{active:false,end:0,note:''}}}
function manualRest(){try{return adapter&&adapter.getManualRest?adapter.getManualRest():null}catch(e){return null}}
function setManualRest(value){try{if(adapter&&adapter.setManualRest)adapter.setManualRest(value)}catch(e){}}
function clear(){
try{localStorage.removeItem(KEY);return true}catch(e){return false}
}
function validWorkout(w){
if(!w||typeof w!=='object'||!Array.isArray(w.items)||!w.items.length)return false;
const ex=+w.exerciseIndex,set=+w.setIndex;
if(!Number.isInteger(ex)||ex<0||ex>=w.items.length)return false;
const item=w.items[ex];
if(!item||!Array.isArray(item.plan)||!item.plan.length)return false;
if(!Number.isInteger(set)||set<0||set>=item.plan.length)return false;
return true;
}
function read(){
try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}
}
function save(){
try{
const w=getWorkout();
if(!w){clear();return false}
const payload={schema:SCHEMA,savedAt:Date.now(),screen:screen(),workout:w,rest:restSnapshot(),manualRest:manualRest()};
localStorage.setItem(KEY,JSON.stringify(payload));log('snapshot-saved',{screen:payload.screen});return true;
}catch(e){console.error('TurnikActiveWorkout save',e);return false}
}
function restore(){
const hadActive=!!getWorkout(),payload=read();
if(!payload||payload.schema!==SCHEMA||!validWorkout(payload.workout)){if(payload)clear();return false}
const age=Date.now()-(+payload.savedAt||0);
if(age<0||age>TTL){clear();return false}
try{
if(!hadActive&&!setWorkout(payload.workout))throw new Error('workout restore adapter rejected state');
setManualRest(payload.manualRest||null);
const rest=payload.rest||{},restoredRest=!!(adapter&&adapter.restoreRest&&adapter.restoreRest(rest));
if(!restoredRest){
try{if(adapter&&adapter.stopRest)adapter.stopRest('restore-workout')}catch(e){}
if(adapter&&adapter.navigate)adapter.navigate('workout');
if(adapter&&adapter.renderWorkout)adapter.renderWorkout();
}
const surface=restoredRest?'rest':'workout';
try{
if(adapter&&adapter.armSurface)adapter.armSurface(surface);
else if(adapter&&adapter.refreshSurface)adapter.refreshSurface(surface);
}catch(e){}
if(adapter&&adapter.notice)adapter.notice('Незавершённая тренировка восстановлена.');
log(hadActive?'handover-restored':'restored',{screen:screen(),restActive:surface==='rest'});
return true;
}catch(e){
console.error('TurnikActiveWorkout restore',e);
clearWorkout();
try{if(adapter&&adapter.stopRest)adapter.stopRest('restore-error')}catch(_){}
clear();return false;
}
}
function wrapStart(name){
const fn=window[name];
if(typeof fn!=='function'||fn.__tcActiveWorkoutPersistenceWrapped)return;
const wrapped=function(){const result=fn.apply(this,arguments);setTimeout(save,0);return result};
wrapped.__tcActiveWorkoutPersistenceWrapped=true;window[name]=wrapped;
}
function scheduleRestore(){
if(restoreScheduled)return;restoreScheduled=true;
const run=()=>restore();
if(typeof requestIdleCallback==='function')requestIdleCallback(run,{timeout:1200});
else if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>requestAnimationFrame(run));
else setTimeout(run,0);
}
function install(nextAdapter){
if(nextAdapter&&typeof nextAdapter==='object')adapter=nextAdapter;
if(!adapter)throw new Error('TurnikActiveWorkout adapter required');
if(installed)return true;
const names=Array.isArray(adapter.startNames)?adapter.startNames:['adj','tcStartAuxWorkout','tcStartCourseTest','tcStartCourseWorkout','tcStartExtraWorkout','tcStartSupplementWorkout'];
names.forEach(wrapStart);
const actions=adapter.actions,lifecycle=adapter.lifecycle,rest=adapter.rest;
if(!actions||typeof actions.registerAfter!=='function')throw new Error('TurnikActiveWorkout actions unavailable');
if(!rest||typeof rest.onChange!=='function')throw new Error('TurnikActiveWorkout rest owner unavailable');
if(!lifecycle||typeof lifecycle.registerAfter!=='function')throw new Error('TurnikActiveWorkout lifecycle unavailable');
actions.registerAfter('active-workout-persistence',-100,()=>setTimeout(save,0));
rest.onChange(()=>{if(getWorkout())setTimeout(save,0)});
lifecycle.registerAfter('finishRest','active-workout-persistence',-20000,()=>setTimeout(save,0));
lifecycle.registerAfter('finishWorkout','active-workout-persistence',-20000,()=>setTimeout(save,0));
document.addEventListener('input',()=>{if(getWorkout())setTimeout(save,0)},{passive:true});
document.addEventListener('change',()=>{if(getWorkout())setTimeout(save,0)},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save()});
window.addEventListener('pagehide',save);
window.tcSaveActiveWorkoutSnapshot=save;
window.tcClearActiveWorkoutSnapshot=clear;
installed=true;scheduleRestore();return true;
}
function debug(){const p=read();return{version:VERSION,installed,key:KEY,schema:SCHEMA,hasSnapshot:!!p,validSnapshot:!!(p&&p.schema===SCHEMA&&validWorkout(p.workout)),singleOwner:installed&&window.tcSaveActiveWorkoutSnapshot===save&&window.tcClearActiveWorkoutSnapshot===clear}}
window.TurnikActiveWorkout={version:VERSION,install,save,restore,clear,read,validWorkout,debug};
try{window.dispatchEvent(new CustomEvent('turnikactiveworkout:ready',{detail:{version:VERSION}}))}catch(e){}
})();