/* TURNIKCOACH_STANDARD_WORKOUT 1.0.0-action-owner */
(function(){
'use strict';
const VERSION='1.0.0-action-owner';
if(window.TurnikStandardWorkout&&window.TurnikStandardWorkout.version===VERSION)return;
function workout(){try{return typeof W!=='undefined'?W:null}catch(e){return null}}
function courseOwned(w){return !!w&&['course','supplement','auxCourse','courseTest'].includes(w.mode)}
function signalExerciseEnd(){
try{if(typeof window.beep==='function')window.beep(620,.24,.42)}catch(e){}
}
function signalWorkoutEnd(){
try{
if(typeof window.tcFinishSignal==='function')window.tcFinishSignal();
else if(typeof window.beep==='function'){window.beep(620,.18,.42);setTimeout(()=>window.beep(880,.26,.46),200)}
}catch(e){}
}
function prime(){
try{if(typeof window.tcPrimeAudio==='function')window.tcPrimeAudio();else if(typeof unlockAudio==='function')unlockAudio()}catch(e){}
}
function handle(ctx){
const w=workout();if(!w||courseOwned(w))return null;
const x=w.items&&w.items[w.exerciseIndex];
if(!x||!Array.isArray(x.plan)||!Array.isArray(x.actual))return null;
const target=x.plan[w.setIndex],actual=ctx&&ctx.skip?null:w.actual;
prime();x.actual[w.setIndex]=actual;
if(w.setIndex<x.plan.length-1){
const rest=typeof window.adaptiveRest==='function'?window.adaptiveRest(x.e,w.sessionIndex,target,actual,!!(ctx&&ctx.skip)):{seconds:90,note:''};
w.setIndex++;w.actual=x.plan[w.setIndex];
if(typeof window.startRest==='function')window.startRest(rest.seconds,rest.note);
return{handled:true,result:undefined};
}
signalExerciseEnd();
if(w.exerciseIndex<w.items.length-1){
const next=w.items[w.exerciseIndex+1];
const rest=typeof window.transitionRest==='function'?window.transitionRest(x.e,next.e,w.sessionIndex,target,actual,!!(ctx&&ctx.skip)):{seconds:75,note:''};
w.exerciseIndex++;w.setIndex=0;w.actual=w.items[w.exerciseIndex].plan[0];
if(typeof window.startRest==='function')window.startRest(rest.seconds,rest.note);
return{handled:true,result:undefined};
}
signalWorkoutEnd();
if(typeof askFeedback==='function')askFeedback(false);
return{handled:true,result:undefined};
}
function install(){
const actions=window.TurnikWorkoutActions;
if(!actions||typeof actions.registerHandler!=='function')return false;
actions.registerHandler('standard-workout',10,handle);
return true;
}
if(!install())throw new Error('TurnikCoach standard workout action dispatcher unavailable');
window.TurnikStandardWorkout={version:VERSION,install,handle,debug(){return{version:VERSION,owner:'setDone-handler',priority:10}}};
try{window.dispatchEvent(new CustomEvent('turnikstandardworkout:ready',{detail:{version:VERSION}}))}catch(e){}
})();