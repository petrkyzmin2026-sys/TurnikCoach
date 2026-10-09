/* TURNIKCOACH_CHROME 1.0.0-owner */
(function(){
'use strict';
const VERSION='1.0.0-owner';
if(window.TurnikChrome&&window.TurnikChrome.version===VERSION)return;
let adapter=null,installed=false,queued=false;
function invoke(name,args){try{const fn=adapter&&adapter[name];return typeof fn==='function'?fn.apply(null,args||[]):undefined}catch(e){console.error('TurnikChrome '+name,e)}}
function stabilizeWorkoutControls(){
const root=document.querySelector('#workout.screen.on');
if(!root)return false;
const buttons=[...root.querySelectorAll('button')],byText=test=>buttons.find(b=>test((b.textContent||'').trim()));
const done=byText(t=>t==='Сделано'),skip=byText(t=>/^Пропустить/.test(t)),minus=byText(t=>t==='−'||t==='-'),plus=byText(t=>t==='+');
if(done)done.classList.add('tcWorkoutDoneAction');
if(skip)skip.classList.add('tcWorkoutSkipAction');
if(minus)minus.classList.add('tcWorkoutMinus');
if(plus)plus.classList.add('tcWorkoutPlus');
if(done&&skip&&done.parentElement===skip.parentElement)done.parentElement.classList.add('tcWorkoutActions');
const panel=(done&&done.closest('.stageControls,.controls'))||(skip&&skip.closest('.stageControls,.controls'));
if(panel)panel.classList.add('tcStableWorkoutControls');
return true;
}
function makeButton(cls,text,title,click){
const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=text;b.title=title;b.onclick=click;return b;
}
function decorate(){
queued=false;stabilizeWorkoutControls();
const wh=document.querySelector('#workout.screen.on .stageHeader .row.between, #workout.screen.on .wtop .row.between');
if(wh&&!wh.querySelector('.tcWorkoutExitBtn')){
const b=makeButton('tcWorkoutExitBtn','Выйти','Выйти без сохранения',()=>invoke('discard'));wh.insertBefore(b,wh.firstChild);
}
const rest=document.querySelector('#rest.screen.on .rest');
if(rest&&!rest.querySelector('.tcRestBack')){
rest.appendChild(makeButton('tcBackBtn tcRestBack','‹','Назад к упражнению',()=>invoke('navigateBack')));
}
if(rest&&!rest.querySelector('.tcRestExitBtn')){
rest.appendChild(makeButton('tcRestExitBtn','Выйти','Выйти без сохранения',()=>invoke('discard')));
}
const sheet=document.getElementById('sheet');
if(sheet&&sheet.classList.contains('open')){
const box=document.getElementById('sheetbox');
if(box&&!box.querySelector('.tcSheetClose')){
const b=makeButton('tcSheetClose','×','Закрыть',()=>invoke('navigateBack'));box.insertBefore(b,box.firstChild);
}
}
return true;
}
function queue(){if(queued)return;queued=true;setTimeout(decorate,0)}
function install(nextAdapter){
if(nextAdapter&&typeof nextAdapter==='object')adapter=nextAdapter;
if(!adapter)throw new Error('TurnikChrome adapter required');
if(installed)return true;
if(window.__tcBackControlObserver)try{window.__tcBackControlObserver.disconnect()}catch(e){}
window.__tcBackControlObserver=null;
const nav=adapter.navigation,workoutUi=adapter.workoutUi,rest=adapter.rest,ui=adapter.ui;
if(!nav||typeof nav.registerAfter!=='function')throw new Error('TurnikChrome navigation unavailable');
if(!workoutUi||typeof workoutUi.registerAfter!=='function')throw new Error('TurnikChrome workout UI unavailable');
nav.registerAfter('chrome-controls',200,queue);
workoutUi.registerAfter('chrome-controls',80,queue);
if(ui&&typeof ui.register==='function')for(const area of ['today','plan','progress'])ui.register(area,'*',8000,()=>{queue();return false});
if(rest&&typeof rest.onChange==='function')rest.onChange(queue);
window.tcEnsureWorkoutControls=queue;
installed=true;decorate();return true;
}
function debug(){
return{version:VERSION,installed,singleOwner:installed&&window.tcEnsureWorkoutControls===queue,observerFree:!window.__tcBackControlObserver};
}
window.TurnikChrome={version:VERSION,install,decorate,queue,stabilizeWorkoutControls,debug};
try{window.dispatchEvent(new CustomEvent('turnikchrome:ready',{detail:{version:VERSION}}))}catch(e){}
})();