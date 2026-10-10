/* TURNIKCOACH_NAVIGATION_FLOW 1.0.0-owner */
(function(){
'use strict';
const VERSION='1.0.0-owner';
if(window.TurnikNavigationFlow&&window.TurnikNavigationFlow.version===VERSION)return;
let installed=false,internal=false,sheetWasOpen=false;
let popHandler=null,keyHandler=null,sheetObserver=null;
const scrollByScreen={};
let deps={};
function currentScreen(){
const el=document.querySelector('.screen.on');
return el&&el.id?el.id:'today';
}
function currentScroll(screen){
const root=document.getElementById(screen),sc=root&&root.querySelector('.scroll');
return sc?sc.scrollTop:0;
}
function restoreScroll(screen){
const root=document.getElementById(screen),sc=root&&root.querySelector('.scroll');
if(sc&&Number.isFinite(scrollByScreen[screen]))sc.scrollTop=scrollByScreen[screen];
}
function routeUrl(screen,sheet){return '#tc='+encodeURIComponent(screen)+(sheet?'&sheet=1':'')}
function replaceRoute(screen,sheet){
try{history.replaceState({tcNav:true,tcScreen:screen,tcSheet:!!sheet},'',routeUrl(screen,sheet))}catch(e){}
}
function pushRoute(screen,sheet){
try{history.pushState({tcNav:true,tcScreen:screen,tcSheet:!!sheet},'',routeUrl(screen,sheet))}catch(e){}
}
function hasWorkout(){return !!(deps.surface&&deps.surface.hasWorkout&&deps.surface.hasWorkout())}
function ensureControls(){
try{if(typeof window.tcEnsureWorkoutControls==='function')window.tcEnsureWorkoutControls()}catch(e){}
}
function notice(message,tone){
try{if(typeof deps.notice==='function')deps.notice(message,tone)}catch(e){}
}
function closeSheetNow(){
const sheet=document.getElementById('sheet');
try{
if(typeof window.closeSheet==='function')window.closeSheet();
else if(sheet)sheet.classList.remove('open');
}catch(e){if(sheet)sheet.classList.remove('open')}
}
function clearWorkout(){
try{if(deps.rest&&typeof deps.rest.stop==='function')deps.rest.stop('discard')}catch(e){}
try{if(typeof rt!=='undefined'&&rt){clearInterval(rt);rt=null}}catch(e){}
try{W=null}catch(e){}
try{if(typeof deps.clearActive==='function')deps.clearActive()}catch(e){}
}
function goInternal(target){
internal=true;
try{
if(typeof window.go==='function')window.go(target);
else return false;
return true;
}finally{internal=false}
}
function abandonWorkoutAndGo(target){
const next=target||'today';
clearWorkout();
goInternal(next);
deps.surface.syncScreenVisibility(next);
replaceRoute(next,false);
deps.surface.forceRepaint();
ensureControls();
}
function discardWorkoutNow(){
const sheet=document.getElementById('sheet');
if(!hasWorkout()){notice('Активная тренировка уже отсутствует.','danger');return false}
if(sheet)sheet.classList.remove('open');
abandonWorkoutAndGo('today');
notice('Текущая тренировка закрыта без сохранения.');
return true;
}
function discardWorkout(){
if(!hasWorkout()){notice('Нет активной тренировки для выхода без сохранения.','danger');return false}
const sheet=document.getElementById('sheet'),box=document.getElementById('sheetbox');
if(!box||!sheet){notice('Не удалось открыть подтверждение выхода.','danger');return false}
box.innerHTML='<div class="sheettitle">Завершить без сохранения?</div>'+
'<div class="sub" style="margin-top:7px;line-height:1.45">Подходы этого запуска будут отброшены. Тренировка не попадёт в историю и останется доступной для повторного начала.</div>'+
'<button id="tcConfirmDiscardWorkoutBtn" type="button" class="btn danger full" style="margin-top:16px">Завершить без сохранения</button>'+
'<button id="tcCancelDiscardWorkoutBtn" type="button" class="btn ghost full" style="margin-top:8px">Продолжить тренировку</button>';
sheet.classList.add('open');
const yes=document.getElementById('tcConfirmDiscardWorkoutBtn'),no=document.getElementById('tcCancelDiscardWorkoutBtn');
if(yes)yes.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation()}discardWorkoutNow();return false};
if(no)no.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation()}closeSheetNow();return false};
return true;
}
function navigateBack(){
const sheet=document.getElementById('sheet'),scr=currentScreen();
if(sheet&&sheet.classList.contains('open')){
if(history.state&&history.state.tcSheet){history.back();return true}
closeSheetNow();return true;
}
if(scr==='rest'&&hasWorkout()){history.back();return true}
if(scr==='workout'&&hasWorkout()){discardWorkout();return true}
if(history.length>1){history.back();return true}
if(scr!=='today'){goInternal('today');replaceRoute('today',false);deps.surface.syncScreenVisibility('today');deps.surface.forceRepaint();ensureControls()}
return true;
}
function onPopState(ev){
const sheet=document.getElementById('sheet'),scr=currentScreen();
if(sheet&&sheet.classList.contains('open')){
internal=true;try{closeSheetNow()}finally{internal=false}
sheetWasOpen=false;return;
}
if(scr==='rest'&&hasWorkout()){
internal=true;
try{
if(typeof window.finishRest==='function')window.finishRest();
else if(typeof window.go==='function')window.go('workout');
}finally{internal=false}
pushRoute('workout',false);ensureControls();return;
}
const target=ev&&ev.state&&ev.state.tcScreen?ev.state.tcScreen:'today';
if(scr==='workout'&&hasWorkout()&&target!=='workout'){
pushRoute('workout',false);discardWorkout();return;
}
goInternal(target);
restoreScroll(target);ensureControls();
}
function install(options){
deps=options||{};
const navigation=deps.navigation,surface=deps.surface;
if(!navigation||typeof navigation.registerBefore!=='function'||typeof navigation.registerAfter!=='function')return false;
if(!surface||typeof surface.syncScreenVisibility!=='function'||typeof surface.forceRepaint!=='function')return false;
navigation.registerBefore('navigation-foundation',10000,ctx=>{
const from=currentScreen();ctx.meta.from=from;scrollByScreen[from]=currentScroll(from);
});
navigation.registerAfter('navigation-foundation',10000,ctx=>{
const id=ctx.target,from=ctx.meta.from||currentScreen();
surface.syncScreenVisibility(id);
if(id==='workout'&&typeof surface.installAdaptiveGeometry==='function')surface.installAdaptiveGeometry();
surface.forceRepaint();
if(id==='workout'&&hasWorkout()){
const saveFn=window.tcSaveActiveWorkoutSnapshot;
const saved=typeof saveFn==='function'?saveFn():false;
console.log('TC_WORKOUT_STATE',JSON.stringify({phase:'boundary-save',available:typeof saveFn==='function',saved:!!saved,hasW:hasWorkout()}));
}
if(internal){restoreScroll(id);return}
const trainingFlow=hasWorkout()&&(id==='workout'||id==='rest')&&(from==='workout'||from==='rest');
const finishedTraining=!hasWorkout()&&(from==='workout'||from==='rest')&&['today','exercise','historyScreen'].includes(id);
if(trainingFlow||finishedTraining)replaceRoute(id,false);
else if(id!==from)pushRoute(id,false);
else replaceRoute(id,false);
restoreScroll(id);ensureControls();
});
if(popHandler)window.removeEventListener('popstate',popHandler);
if(keyHandler)document.removeEventListener('keydown',keyHandler);
popHandler=onPopState;
keyHandler=e=>{if(e.key==='Escape'){e.preventDefault();navigateBack()}};
window.addEventListener('popstate',popHandler);
document.addEventListener('keydown',keyHandler);
if(sheetObserver)try{sheetObserver.disconnect()}catch(e){}
const sheet=document.getElementById('sheet');
if(sheet&&typeof MutationObserver==='function'){
sheetWasOpen=sheet.classList.contains('open');
sheetObserver=new MutationObserver(()=>{
const open=sheet.classList.contains('open');
if(open&&!sheetWasOpen){
sheetWasOpen=true;
if(!internal&&!(history.state&&history.state.tcSheet))pushRoute(currentScreen(),true);
}else if(!open&&sheetWasOpen){
sheetWasOpen=false;
if(!internal&&history.state&&history.state.tcSheet)history.back();
}
ensureControls();
});
sheetObserver.observe(sheet,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
}
window.tcDiscardWorkout=discardWorkout;
window.tcNavigateBack=navigateBack;
const start=currentScreen();
surface.syncScreenVisibility(start);
replaceRoute(start,false);
ensureControls();
installed=true;
return true;
}
function debug(){
return{version:VERSION,installed,internal,currentScreen:currentScreen(),route:history.state||null,sheetOpen:!!document.querySelector('#sheet.open'),hasWorkout:hasWorkout(),scrollScreens:Object.keys(scrollByScreen)};
}
window.TurnikNavigationFlow={version:VERSION,install,currentScreen,replaceRoute,pushRoute,discardWorkout,navigateBack,debug};
try{window.dispatchEvent(new CustomEvent('turniknavigationflow:ready',{detail:{version:VERSION}}))}catch(e){}
})();