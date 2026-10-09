/* TURNIKCOACH_CORRECTION 1.0.0-owner */
(function(){
'use strict';
const VERSION='1.0.0-owner';
if(window.TurnikCorrection&&window.TurnikCorrection.version===VERSION)return;
let adapter=null,installed=false,decorateQueued=false;
function getWorkout(){try{return adapter&&adapter.getWorkout?adapter.getWorkout():null}catch(e){return null}}
function notice(message,tone){try{if(adapter&&adapter.notice)adapter.notice(message,tone)}catch(e){}}
function capture(workout){
if(!workout||workout.mode==='courseTest'||!Array.isArray(workout.items))return null;
const ex=Number(workout.exerciseIndex),set=Number(workout.setIndex),item=workout.items[ex];
if(!item||!Array.isArray(item.plan)||set<0||set>=item.plan.length||!Array.isArray(item.actual))return null;
const had=Object.prototype.hasOwnProperty.call(item.actual,set);
return{exerciseIndex:ex,setIndex:set,input:workout.actual,had,previous:had?item.actual[set]:null,early:!!workout.early};
}
function commit(workout,frame){
if(!workout||!frame||!Array.isArray(workout.items))return false;
const item=workout.items[frame.exerciseIndex];
if(!item||!Array.isArray(item.actual)||!Object.prototype.hasOwnProperty.call(item.actual,frame.setIndex))return false;
if(frame.had&&item.actual[frame.setIndex]===frame.previous)return false;
if(!Array.isArray(workout.__tcCorrectionTrail))workout.__tcCorrectionTrail=[];
workout.__tcCorrectionTrail.push(frame);
if(workout.__tcCorrectionTrail.length>150)workout.__tcCorrectionTrail.shift();
return true;
}
function undo(workout){
const trail=workout&&workout.__tcCorrectionTrail;
if(!Array.isArray(trail)||!trail.length)return null;
const frame=trail[trail.length-1],item=workout.items&&workout.items[frame.exerciseIndex];
if(!item||!Array.isArray(item.actual)||!Array.isArray(item.plan)||frame.setIndex<0||frame.setIndex>=item.plan.length)return null;
trail.pop();
if(frame.had)item.actual[frame.setIndex]=frame.previous;
else item.actual.splice(frame.setIndex,1);
workout.exerciseIndex=frame.exerciseIndex;workout.setIndex=frame.setIndex;
workout.actual=frame.input;workout.early=frame.early;
return frame;
}
function hasTrail(){const w=getWorkout();return !!(w&&Array.isArray(w.__tcCorrectionTrail)&&w.__tcCorrectionTrail.length)}
function ensureStyle(){
if(document.getElementById('tcCorrectionControlsStyle'))return;
const style=document.createElement('style');style.id='tcCorrectionControlsStyle';
style.textContent=
'#app > .nav{z-index:90!important;pointer-events:auto!important}'+
'#today .scroll{min-height:0!important;overscroll-behavior:contain;padding-bottom:144px!important}'+
'#workout .stageHeader .endBtn,#workout .wtop .endBtn{display:none!important}'+
'#workout .stageHeader .row.between,#workout .wtop .row.between{display:flex!important;flex-wrap:wrap!important;gap:8px!important}'+
'#workout .wtop .row.between{padding-left:0!important;min-height:0!important}'+
'#workout .wtop .tcWorkoutExitBtn{position:static!important;left:auto!important;top:auto!important}'+
'#workout .tcTrainingTopActions{display:flex;align-items:center;justify-content:space-between;width:100%;gap:12px;flex:0 0 100%;order:-1}'+
'#workout .tcWorkoutBackBtn,#workout .tcWorkoutExitBtn{min-width:88px!important;max-width:44%;min-height:48px;height:48px!important;padding:0 14px!important;border-radius:12px;font:800 14px/1.2 system-ui,sans-serif;white-space:nowrap;touch-action:manipulation}'+
'#workout .tcWorkoutBackBtn{background:#202b36;border:1px solid #566579;color:#fff}'+
'#workout .tcWorkoutExitBtn{background:#2a181b;border:1px solid #70424a;color:#ffb8bd}'+
'#workout .tcWorkoutBackBtn:disabled,#rest .tcRestBack:disabled{opacity:.45}'+
'#workout .tcCorrectionSetBtn{display:none!important}'+
'#workout .tcWorkoutExitBtn,#rest .tcRestExitBtn{min-width:100px!important;padding:0 9px!important}'+
'#rest .tcRestBack{min-width:94px!important;width:auto!important;padding:0 7px!important;border-radius:12px!important;font-size:13px!important}'+
'#rest .tcRestBack,#rest .tcRestExitBtn{min-width:0!important;max-width:calc((100% - 112px)/2)!important;min-height:48px!important;height:auto!important;white-space:normal!important;overflow-wrap:anywhere!important}'+
'#rest .rest .tcInfoBtn{left:50%!important;right:auto!important;top:12px!important;transform:translateX(-50%)!important}';
document.head.appendChild(style);
}
function decorate(){
decorateQueued=false;
const trail=hasTrail();
const workout=document.querySelector('#workout.screen.on');
if(workout){
const header=workout.querySelector('.stageHeader .row.between,.wtop .row.between');
if(header){
let bar=header.querySelector('.tcTrainingTopActions');
if(!bar){
bar=document.createElement('div');bar.className='tcTrainingTopActions';
const existing=header.querySelector('.tcWorkoutExitBtn');if(existing)bar.appendChild(existing);
header.insertBefore(bar,header.firstChild);
}
let back=bar.querySelector('.tcWorkoutBackBtn');
if(!back){back=document.createElement('button');back.type='button';back.className='tcWorkoutBackBtn';back.textContent='← Назад';back.title='Вернуться к предыдущему подходу';bar.insertBefore(back,bar.firstChild)}
back.disabled=!trail;back.onclick=returnToPrevious;
const exit=bar.querySelector('.tcWorkoutExitBtn');
if(exit){if(exit.textContent!=='Выйти')exit.textContent='Выйти';exit.title='Выйти без сохранения';if(adapter&&adapter.discard)exit.onclick=adapter.discard}
}
const legacy=workout.querySelector('.stageHeader .endBtn,.wtop .endBtn');if(legacy)legacy.style.display='none';
workout.querySelectorAll('.tcCorrectionSetBtn').forEach(b=>b.remove());
}
const rest=document.querySelector('#rest.screen.on .rest');
if(rest){
const prev=rest.querySelector('.tcRestBack'),exit=rest.querySelector('.tcRestExitBtn');
if(prev){if(prev.textContent!=='← Назад')prev.textContent='← Назад';prev.title='Вернуться к предыдущему подходу';prev.setAttribute('aria-label','Назад');prev.onclick=returnToPrevious;prev.disabled=!trail;prev.style.display='grid'}
if(exit){if(exit.textContent!=='Выйти')exit.textContent='Выйти';exit.title='Выйти без сохранения';if(adapter&&adapter.discard)exit.onclick=adapter.discard}
}
const sheet=document.getElementById('sheet'),box=document.getElementById('sheetbox');
if(trail&&sheet&&box&&sheet.classList.contains('open')&&[...box.querySelectorAll('button')].some(b=>/^(Легко|Нормально|Тяжело)$/i.test((b.textContent||'').trim()))&&!box.querySelector('#tcFixSetFromFeedbackBtn')){
const b=document.createElement('button');b.id='tcFixSetFromFeedbackBtn';b.type='button';b.className='btn ghost full';
b.textContent='Исправить последний подход';b.style.marginTop='10px';b.onclick=returnToPrevious;box.appendChild(b);
}
}
function queueDecorate(){if(decorateQueued)return;decorateQueued=true;setTimeout(decorate,0)}
function closeSheet(){const el=document.getElementById('sheet');if(el)el.classList.remove('open')}
function returnToPrevious(){
const current=getWorkout();
if(!current||!hasTrail()){notice('Ранее записанных подходов пока нет.','danger');return false}
const frame=undo(current);if(!frame){notice('Не удалось восстановить предыдущий подход.','danger');return false}
closeSheet();
try{if(adapter&&adapter.clearRestoreGuard)adapter.clearRestoreGuard()}catch(e){}
try{
if(adapter&&adapter.rest&&typeof adapter.rest.stop==='function')adapter.rest.stop('correction');
if(adapter&&adapter.getManualRest&&adapter.getManualRest()){
 if(adapter.finishRest)adapter.finishRest();
}else if(adapter&&adapter.setManualRest)adapter.setManualRest(null);
}catch(e){}
try{
if(adapter&&adapter.navigate)adapter.navigate('workout');
if(adapter&&adapter.renderWorkout)adapter.renderWorkout();
if(adapter&&adapter.saveSnapshot)adapter.saveSnapshot();
if(adapter&&adapter.refreshSurface)adapter.refreshSurface('workout');
}catch(e){console.error('TurnikCorrection return',e)}
queueDecorate();notice('Предыдущий подход открыт для исправления.');return true;
}
function install(nextAdapter){
if(nextAdapter&&typeof nextAdapter==='object')adapter=nextAdapter;
if(!adapter)throw new Error('TurnikCorrection adapter required');
if(installed)return true;
if(window.__tcCorrectionUiObserver)try{window.__tcCorrectionUiObserver.disconnect()}catch(e){}
window.__tcCorrectionUiObserver=null;
const actions=adapter.actions,nav=adapter.navigation,workoutUi=adapter.workoutUi;
if(!actions||typeof actions.registerBefore!=='function'||typeof actions.registerAfter!=='function')throw new Error('TurnikCorrection actions unavailable');
if(!nav||typeof nav.registerAfter!=='function')throw new Error('TurnikCorrection navigation unavailable');
if(!workoutUi||typeof workoutUi.registerAfter!=='function')throw new Error('TurnikCorrection workout UI unavailable');
actions.registerBefore('workout-correction',60,ctx=>{const current=getWorkout();ctx.meta.correction={current,frame:capture(current)}});
actions.registerAfter('workout-correction',60,ctx=>{const c=ctx.meta.correction||{};if(c.frame&&commit(c.current,c.frame)){if(adapter.saveSnapshot)adapter.saveSnapshot();queueDecorate()}});
nav.registerAfter('correction-controls',100,queueDecorate);
workoutUi.registerAfter('correction-controls',60,queueDecorate);
ensureStyle();
window.tcReturnToPreviousSet=returnToPrevious;
window.tcEnsureCorrectionControls=queueDecorate;
window.__TC_WORKOUT_CORRECTION_V2=true;
installed=true;decorate();return true;
}
function debug(){
return{version:VERSION,installed,trail:hasTrail(),singleOwner:installed&&window.tcReturnToPreviousSet===returnToPrevious&&window.tcEnsureCorrectionControls===queueDecorate,observerFree:!window.__tcCorrectionUiObserver};
}
window.TurnikCorrection={version:VERSION,install,capture,commit,undo,returnToPrevious,decorate,debug};
try{window.dispatchEvent(new CustomEvent('turnikcorrection:ready',{detail:{version:VERSION}}))}catch(e){}
})();