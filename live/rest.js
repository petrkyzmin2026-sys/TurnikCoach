/* TURNIKCOACH_REST 1.0.0-state-owner */
(function(){
'use strict';
const VERSION='1.0.0-state-owner';
if(window.TurnikRest&&window.TurnikRest.version===VERSION)return;
let active=false,end=0,interval=null,signals=new Set(),adapter=null,installed=false;
const listeners=new Set();
function emit(type){
const snap=snapshot(),payload={type,snapshot:snap};
for(const fn of [...listeners])try{fn(payload)}catch(e){console.error('TurnikRest listener',e)}
}
function onChange(fn){if(typeof fn!=='function')return()=>{};listeners.add(fn);return()=>listeners.delete(fn)}
function ring(){try{return adapter&&adapter.ring?adapter.ring():document.getElementById('restNum')}catch(e){return null}}
function noteText(){return String(window.__tcLastRestNote||'')}
function setNote(note){
const value=String(note||'Отдых рассчитан по нагрузке и факту предыдущего подхода');
window.__tcLastRestNote=value;
try{if(adapter&&adapter.setNote)adapter.setNote(value)}catch(e){console.error('TurnikRest note',e)}
return value;
}
function secondsLeft(){
if(!active||!end)return 0;
return Math.max(0,Math.ceil((end-Date.now())/1000));
}
function clearTimer(){if(interval){clearInterval(interval);interval=null}}
function render(){
if(!active||!end)return 0;
const left=secondsLeft(),el=ring();
if(el)el.textContent=String(left);
if(left>0&&left<=3&&!signals.has(left)){
signals.add(left);
try{if(adapter&&adapter.beep)adapter.beep(left)}catch(e){}
}
if(left<=0){
active=false;end=0;signals.clear();clearTimer();
try{if(adapter&&adapter.finishSignal)adapter.finishSignal()}catch(e){}
emit('elapsed');
try{if(adapter&&adapter.finish)adapter.finish()}catch(e){console.error('TurnikRest finish',e)}
return 0;
}
return left;
}
function arm(){clearTimer();interval=setInterval(render,250);render()}
function start(sec,note){
const seconds=Math.max(0,Math.round(+sec||0));
setNote(note);
try{if(adapter&&adapter.primeAudio)adapter.primeAudio()}catch(e){}
active=true;end=Date.now()+seconds*1000;signals.clear();
const el=ring();if(el)el.textContent=String(seconds);
try{if(adapter&&adapter.navigate)adapter.navigate('rest')}catch(e){console.error('TurnikRest navigate',e)}
try{if(adapter&&adapter.nextStep)adapter.nextStep()}catch(e){}
arm();emit('start');return true;
}
function add(sec=30){
const delta=Math.max(0,Math.round(+sec||0));
if(active&&end){end+=delta*1000;signals.clear();render()}
else{
active=true;end=Date.now()+delta*1000;signals.clear();arm();
}
try{if(adapter&&adapter.markManualAdd)adapter.markManualAdd(delta)}catch(e){}
emit('add');return secondsLeft();
}
function stop(reason){
const was=active||!!end;
active=false;end=0;signals.clear();clearTimer();
if(was)emit(reason||'stop');
return was;
}
function snapshot(){return{active:!!active,end:+end||0,note:noteText()}}
function restore(value,opt){
const v=value&&typeof value==='object'?value:{},options=opt||{};
stop('restore-reset');
active=!!v.active;end=+v.end||0;setNote(v.note||'');
if(!active||!end)return false;
const el=ring();if(el)el.textContent=String(secondsLeft());
if(options.navigate!==false)try{if(adapter&&adapter.navigate)adapter.navigate('rest')}catch(e){}
try{if(adapter&&adapter.nextStep)adapter.nextStep()}catch(e){}
arm();emit('restore');return true;
}
function resume(){if(active)render()}
function legacyStart(sec,note){return start(sec,note)}
function legacyAdd(){return add(30)}
function install(nextAdapter){
if(nextAdapter&&typeof nextAdapter==='object')adapter=nextAdapter;
if(installed&&window.startRest===legacyStart&&window.addRest===legacyAdd)return true;
window.startRest=legacyStart;window.addRest=legacyAdd;
document.addEventListener('visibilitychange',resume);
window.addEventListener('focus',resume);
window.addEventListener('pageshow',resume);
const lifecycle=window.TurnikWorkoutLifecycle;
if(lifecycle&&typeof lifecycle.registerBefore==='function'){
lifecycle.registerBefore('finishRest','rest-state-owner',20000,()=>stop('finishRest'));
}
installed=true;return true;
}
function debug(){return{version:VERSION,installed,active,end,left:secondsLeft(),singleOwner:installed&&window.startRest===legacyStart&&window.addRest===legacyAdd,listeners:listeners.size}}
window.TurnikRest={version:VERSION,install,start,add,stop,render,resume,snapshot,restore,onChange,debug};
try{window.dispatchEvent(new CustomEvent('turnikrest:ready',{detail:{version:VERSION}}))}catch(e){}
})();