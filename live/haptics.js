/* TURNIKCOACH_HAPTICS 1.0.0-owner */
(function(){
'use strict';
const VERSION='1.0.0-owner';
if(window.TurnikHaptics&&window.TurnikHaptics.version===VERSION)return;
let adapter=null,installed=false;
function workout(){try{return adapter&&typeof adapter.getWorkout==='function'?adapter.getWorkout():(typeof W!=='undefined'?W:null)}catch(e){return null}}
function pulse(value){try{if(adapter&&typeof adapter.vibrate==='function')return adapter.vibrate(value);if(navigator.vibrate)return navigator.vibrate(value)}catch(e){}return false}
function confirm(){return pulse(45)}
function install(nextAdapter){
if(nextAdapter&&typeof nextAdapter==='object')adapter=nextAdapter;
const actions=adapter&&adapter.actions||window.TurnikWorkoutActions;
if(!actions||typeof actions.registerBefore!=='function'||typeof actions.registerAfter!=='function')return false;
actions.registerBefore('haptic-feedback',50,ctx=>{
let record=null,index=-1,previous;
try{
const w=workout();
if(w&&Array.isArray(w.items)){
record=w.items[w.exerciseIndex];index=w.setIndex;previous=record&&record.actual&&record.actual[index];
}
}catch(e){record=null}
ctx.meta.haptic={record,index,previous};
});
actions.registerAfter('haptic-feedback',50,ctx=>{
try{
const h=ctx.meta.haptic||{},record=h.record,current=record&&Array.isArray(record.actual)?record.actual[h.index]:undefined;
if(!ctx.skip&&record&&h.previous===undefined&&current!==undefined&&current!==null)confirm();
}catch(e){}
});
installed=true;return true;
}
function debug(){
const actions=adapter&&adapter.actions||window.TurnikWorkoutActions;
const d=actions&&typeof actions.debug==='function'?actions.debug():null;
return{version:VERSION,installed,owner:'workout-action-hooks',before:!!(d&&d.beforeNames&&d.beforeNames.includes('haptic-feedback')),after:!!(d&&d.afterNames&&d.afterNames.includes('haptic-feedback'))};
}
window.TurnikHaptics={version:VERSION,install,confirm,debug};
try{window.dispatchEvent(new CustomEvent('turnikhaptics:ready',{detail:{version:VERSION}}))}catch(e){}
})();