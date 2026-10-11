/* TURNIKCOACH_NAVIGATION 1.1.0-owner */
(function(){
'use strict';
const VERSION='1.1.0-owner';
if(window.TurnikNavigation&&window.TurnikNavigation.version===VERSION)return;
const before=[],after=[],scrollByScreen={};
let installed=false,ownerInstalled=false,baseGo=null,dispatcher=null,dispatching=false,internal=false,sheetWasOpen=false;
let sheetObserver=null,backObserver=null,keyHandler=null,popHandler=null;
let surface=null,rest=null,showNotice=null,clearSnapshot=null,hotfixVersion='';
function put(list,name,priority,fn){
if(!name||typeof fn!=='function')return false;
const key=String(name),next={name:key,priority:Number(priority)||0,fn};
const i=list.findIndex(x=>x.name===key);
if(i>=0)list.splice(i,1,next);else list.push(next);
list.sort((a,b)=>b.priority-a.priority||a.name.localeCompare(b.name));
return true;
}
function remove(name){
let changed=false;
for(const list of [before,after]){
const i=list.findIndex(x=>x.name===String(name));
if(i>=0){list.splice(i,1);changed=true}
}
return changed;
}
function run(list,ctx,label){
for(const x of list)try{x.fn(ctx)}catch(e){console.error('TurnikNavigation '+label+' '+x.name,e)}
}
function dispatch(){
if(dispatching)return baseGo?baseGo.apply(this,arguments):undefined;
dispatching=true;
const ctx={args:[...arguments],target:arguments[0],result:undefined,meta:{},startedAt:Date.now()};
try{
run(before,ctx,'before');
ctx.result=baseGo?baseGo.apply(this,ctx.args):undefined;
run(after,ctx,'after');
return ctx.result;
}finally{dispatching=false}
}
function install(){
if(installed&&window.go===dispatcher)return true;
if(typeof window.go!=='function')return false;
if(!baseGo||window.go!==dispatcher)baseGo=window.go;
dispatcher=function(){return dispatch.apply(this,arguments)};
window.go=dispatcher;installed=true;return true;
}
function registerBefore(name,priority,fn){return put(before,name,priority,fn)}
function registerAfter(name,priority,fn){return put(after,name,priority,fn)}
function currentScreen(){
const el=document.querySelector('.screen.on');return el&&el.id?el.id:'today';
}
function currentScroll(screen){
const root=document.getElementById(screen),sc=root&&root.querySelector('.scroll');return sc?sc.scrollTop:0;
}
function restoreScroll(screen){
const root=document.getElementById(screen),sc=root&&root.querySelector('.scroll');
if(sc&&Number.isFinite(scrollByScreen[screen]))sc.scrollTop=scrollByScreen[screen];
}
function routeUrl(screen,sheet){return '#tc='+encodeURIComponent(screen)+(sheet?'&sheet=1':'')}
function replaceRoute(screen,sheet){try{history.replaceState({tcNav:true,tcScreen:screen,tcSheet:!!sheet},'',routeUrl(screen,sheet))}catch(e){}}
function pushRoute(screen,sheet){try{history.pushState({tcNav:true,tcScreen:screen,tcSheet:!!sheet},'',routeUrl(screen,sheet))}catch(e){}}
function hasWorkout(){return surface&&typeof surface.hasWorkout==='function'?surface.hasWorkout():(typeof W!=='undefined'&&!!W)}
function closeSheetNow(){
const sheet=document.getElementById('sheet');
try{if(typeof window.closeSheet==='function')window.closeSheet();else if(sheet)sheet.classList.remove('open')}
catch(e){if(sheet)sheet.classList.remove('open')}
}
function clearWorkout(){
try{if(rest&&typeof rest.stop==='function')rest.stop('discard')}catch(e){}
try{if(typeof rt!=='undefined'&&rt){clearInterval(rt);rt=null}}catch(e){}
try{W=null}catch(e){}
try{if(typeof clearSnapshot==='function')clearSnapshot();else if(typeof window.tcClearActiveWorkoutSnapshot==='function')window.tcClearActiveWorkoutSnapshot()}catch(e){}
}
function decorateStyles(){
let style=document.getElementById('tcNavFoundationStyle');
if(!style){style=document.createElement('style');style.id='tcNavFoundationStyle';document.head.appendChild(style)}
style.textContent=
'.tcWorkoutExitBtn{height:48px;min-width:68px;border-radius:12px;border:1px solid #70424a;background:rgba(42,24,27,.94);color:#ffb8bd;font-size:12px;font-weight:900;padding:0 10px;display:grid;place-items:center;z-index:30;touch-action:manipulation}'+
'.tcWorkoutExitBtn:active,.tcBackBtn:active,.tcRestExitBtn:active{transform:scale(.96)}'+
'.tcBackBtn{width:48px;height:48px;min-width:48px;border-radius:50%;border:1px solid rgba(255,255,255,.22);background:rgba(13,20,27,.88);color:#fff;font-size:25px;font-weight:900;display:grid;place-items:center;padding:0;z-index:30;touch-action:manipulation}'+
'.tcRestBack{position:absolute;left:12px;top:12px}.tcRestExitBtn{position:absolute;right:12px;top:12px;height:48px;min-width:68px;border-radius:12px;border:1px solid #70424a;background:#2a181b;color:#ffb8bd;font-size:12px;font-weight:900;padding:0 10px;z-index:30;touch-action:manipulation}'+
'.tcSheetClose{position:sticky;float:right;top:0;margin:-4px -3px 6px 10px;width:48px;height:48px;min-width:48px;border-radius:50%;border:1px solid #3a4653;background:#202a32;color:#fff;font-size:24px;font-weight:900;z-index:5;touch-action:manipulation}'+
'#workout .stageHeader .row.between,#workout .wtop .row.between{gap:8px}#workout .wtop .row.between{position:relative;padding-left:78px;min-height:48px}#workout .wtop .tcWorkoutExitBtn{position:absolute;left:0;top:0}'+
'#workout .stageHeader .endBtn{min-height:48px!important;min-width:76px!important;padding:0 12px!important;touch-action:manipulation}#workout .stageControls .btn,#rest .btn,#sheet .sheetbox .btn{min-height:48px!important;touch-action:manipulation}'+
'#workout .stageControls .btn.green,#rest .btn.green{min-height:58px!important;font-size:16px!important}#workout .controls,#workout .tcStableWorkoutControls{height:auto!important;min-height:246px!important;max-height:45vh!important;overflow-y:auto!important;padding:12px!important;box-sizing:border-box!important}'+
'#workout .controls{display:flex!important;flex-direction:column!important;gap:6px!important}#workout .wmedia{bottom:var(--tc-workout-controls-bottom,260px)!important}#workout .controls .chips{height:auto!important;min-height:30px!important;flex:0 0 auto!important;flex-wrap:wrap!important}'+
'#workout .controls .counter{grid-template-columns:minmax(56px,64px) minmax(0,1fr) minmax(56px,64px)!important;height:auto!important;min-height:72px!important;gap:10px!important;flex:0 0 auto!important}#workout .controls .pm{height:60px!important;min-height:60px!important;min-width:60px!important;font-size:30px!important;touch-action:manipulation}'+
'#workout .controls .fact b{font-size:42px!important}#workout .controls .actions,#workout .tcWorkoutActions{display:grid!important;grid-template-columns:1fr!important;gap:6px!important}#workout .controls .actions{margin-top:auto!important}'+
'#workout .controls .actions .btn.green,#workout .tcWorkoutDoneAction{min-height:60px!important;font-size:17px!important;font-weight:900!important;order:1;width:100%!important}#workout .controls .actions .btn.ghost,#workout .tcWorkoutSkipAction{min-height:48px!important;order:2;width:100%!important}'+
'#workout .tcWorkoutMinus,#workout .tcWorkoutPlus{min-width:60px!important;min-height:60px!important;touch-action:manipulation}.nav button{min-height:48px!important;touch-action:manipulation;white-space:normal!important;line-height:1.15!important;padding:4px 2px!important;overflow-wrap:anywhere}'+
'#sheet .sheetbox{max-height:92vh!important;overflow-y:auto!important;overscroll-behavior:contain}.sheettitle,.dateBig{overflow-wrap:anywhere;word-break:normal}.tcCompletionStats{grid-template-columns:repeat(auto-fit,minmax(92px,1fr))!important}.tcCompletionRow{flex-wrap:wrap!important;align-items:flex-start!important}.tcCompletionRow span,.tcCompletionRow b{min-width:0!important;flex:1 1 140px!important;overflow-wrap:anywhere!important}';
const old=document.getElementById('tcNavUpgradeStyle');if(old)old.remove();
}
function stabilizeWorkoutControls(){
const root=document.querySelector('#workout.screen.on');if(!root)return;
const buttons=[...root.querySelectorAll('button')],byText=test=>buttons.find(b=>test((b.textContent||'').trim()));
const done=byText(t=>t==='Сделано'),skip=byText(t=>/^Пропустить/.test(t)),minus=byText(t=>t==='−'||t==='-'),plus=byText(t=>t==='+');
if(done)done.classList.add('tcWorkoutDoneAction');if(skip)skip.classList.add('tcWorkoutSkipAction');if(minus)minus.classList.add('tcWorkoutMinus');if(plus)plus.classList.add('tcWorkoutPlus');
if(done&&skip&&done.parentElement===skip.parentElement)done.parentElement.classList.add('tcWorkoutActions');
const panel=(done&&done.closest('.stageControls,.controls'))||(skip&&skip.closest('.stageControls,.controls'));if(panel)panel.classList.add('tcStableWorkoutControls');
}
function decorateBackControls(){
stabilizeWorkoutControls();
const wh=document.querySelector('#workout.screen.on .stageHeader .row.between, #workout.screen.on .wtop .row.between');
if(wh&&!wh.querySelector('.tcWorkoutExitBtn')){
const b=document.createElement('button');b.type='button';b.className='tcWorkoutExitBtn';b.textContent='Выйти';b.title='Выйти без сохранения';b.onclick=window.tcDiscardWorkout;wh.insertBefore(b,wh.firstChild);
}
const restEl=document.querySelector('#rest.screen.on .rest');
if(restEl&&!restEl.querySelector('.tcRestBack')){
const b=document.createElement('button');b.type='button';b.className='tcBackBtn tcRestBack';b.textContent='‹';b.title='Назад к упражнению';b.onclick=window.tcNavigateBack;restEl.appendChild(b);
}
if(restEl&&!restEl.querySelector('.tcRestExitBtn')){
const b=document.createElement('button');b.type='button';b.className='tcRestExitBtn';b.textContent='Выйти';b.title='Выйти без сохранения';b.onclick=window.tcDiscardWorkout;restEl.appendChild(b);
}
const sheet=document.getElementById('sheet');
if(sheet&&sheet.classList.contains('open')){
const box=document.getElementById('sheetbox');
if(box&&!box.querySelector('.tcSheetClose')){const b=document.createElement('button');b.type='button';b.className='tcSheetClose';b.textContent='×';b.title='Закрыть';b.onclick=window.tcNavigateBack;box.insertBefore(b,box.firstChild)}
}
}
function abandonWorkoutAndGo(target){
clearWorkout();internal=true;
try{if(baseGo)baseGo(target||'today');else if(typeof window.go==='function')window.go(target||'today')}finally{internal=false}
if(surface){surface.syncScreenVisibility(target||'today');surface.forceRepaint()}
replaceRoute(target||'today',false);setTimeout(decorateBackControls,0);
}
function discardWorkoutNow(){
if(!hasWorkout()){if(showNotice)showNotice('Активная тренировка уже отсутствует.','danger');return false}
const sheet=document.getElementById('sheet');if(sheet)sheet.classList.remove('open');
abandonWorkoutAndGo('today');if(showNotice)showNotice('Текущая тренировка закрыта без сохранения.');return true;
}
function discardWorkout(){
if(!hasWorkout()){if(showNotice)showNotice('Нет активной тренировки для выхода без сохранения.','danger');return false}
const box=document.getElementById('sheetbox'),sheet=document.getElementById('sheet');
if(!box||!sheet){if(showNotice)showNotice('Не удалось открыть подтверждение выхода.','danger');return false}
box.innerHTML='<div class="sheettitle">Завершить без сохранения?</div><div class="sub" style="margin-top:7px;line-height:1.45">Подходы этого запуска будут отброшены. Тренировка не попадёт в историю и останется доступной для повторного начала.</div><button id="tcConfirmDiscardWorkoutBtn" type="button" class="btn danger full" style="margin-top:16px">Завершить без сохранения</button><button id="tcCancelDiscardWorkoutBtn" type="button" class="btn ghost full" style="margin-top:8px">Продолжить тренировку</button>';
sheet.classList.add('open');
const yes=document.getElementById('tcConfirmDiscardWorkoutBtn'),no=document.getElementById('tcCancelDiscardWorkoutBtn');
if(yes)yes.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation()}discardWorkoutNow();return false};
if(no)no.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation()}closeSheetNow();return false};
return true;
}
function navigateBack(){
const sheet=document.getElementById('sheet'),scr=currentScreen();
if(sheet&&sheet.classList.contains('open')){if(history.state&&history.state.tcSheet){history.back();return true}closeSheetNow();return true}
if(scr==='rest'&&hasWorkout()){history.back();return true}
if(scr==='workout'&&hasWorkout()){discardWorkout();return true}
if(history.length>1){history.back();return true}
if(scr!=='today'){internal=true;try{if(baseGo)baseGo('today')}finally{internal=false}replaceRoute('today',false)}
return true;
}
function onPopState(ev){
const sheet=document.getElementById('sheet'),scr=currentScreen();
if(sheet&&sheet.classList.contains('open')){internal=true;try{closeSheetNow()}finally{internal=false}sheetWasOpen=false;return}
if(scr==='rest'&&hasWorkout()){
internal=true;try{if(typeof window.finishRest==='function')window.finishRest();else if(baseGo)baseGo('workout')}finally{internal=false}
pushRoute('workout',false);setTimeout(decorateBackControls,0);return;
}
const target=ev.state&&ev.state.tcScreen?ev.state.tcScreen:'today';
if(scr==='workout'&&hasWorkout()&&target!=='workout'){pushRoute('workout',false);discardWorkout();return}
internal=true;try{if(baseGo)baseGo(target)}finally{internal=false}
restoreScroll(target);setTimeout(decorateBackControls,0);
}
function installOwner(opts){
opts=opts||{};surface=opts.surface||window.TurnikSurface;rest=opts.rest||window.TurnikRest;showNotice=opts.showNotice||window.tcShowRuntimeNotice;clearSnapshot=opts.clearSnapshot||window.tcClearActiveWorkoutSnapshot;hotfixVersion=String(opts.hotfixVersion||hotfixVersion||VERSION);
if(!surface||typeof surface.syncScreenVisibility!=='function'||typeof surface.forceRepaint!=='function')return false;
if(!install())return false;
decorateStyles();
if(typeof surface.install==='function'&&!surface.install({hotfixVersion}))return false;
registerBefore('navigation-owner',10000,ctx=>{const from=currentScreen();ctx.meta.from=from;scrollByScreen[from]=currentScroll(from)});
registerAfter('navigation-owner',10000,ctx=>{
const id=ctx.target,from=ctx.meta.from||currentScreen();surface.syncScreenVisibility(id);if(id==='workout'&&surface.installAdaptiveGeometry)surface.installAdaptiveGeometry();surface.forceRepaint();
if(id==='workout'&&hasWorkout()){const saveFn=window.tcSaveActiveWorkoutSnapshot,saved=typeof saveFn==='function'?saveFn():false;console.log('TC_WORKOUT_STATE',JSON.stringify({phase:'boundary-save',available:typeof saveFn==='function',saved:!!saved,hasW:hasWorkout()}))}
if(internal){restoreScroll(id);return}
const trainingFlow=hasWorkout()&&(id==='workout'||id==='rest')&&(from==='workout'||from==='rest');
const finishedTraining=!hasWorkout()&&(from==='workout'||from==='rest')&&['today','exercise','historyScreen'].includes(id);
if(trainingFlow||finishedTraining)replaceRoute(id,false);else if(id!==from)pushRoute(id,false);else replaceRoute(id,false);
restoreScroll(id);setTimeout(decorateBackControls,0);
});
window.tcDiscardWorkout=discardWorkout;window.tcNavigateBack=navigateBack;window.tcEnsureWorkoutControls=()=>setTimeout(decorateBackControls,0);
if(sheetObserver)try{sheetObserver.disconnect()}catch(e){}
const sheet=document.getElementById('sheet');
if(sheet&&typeof MutationObserver==='function'){
sheetObserver=new MutationObserver(()=>{const open=sheet.classList.contains('open');if(open&&!sheetWasOpen){sheetWasOpen=true;if(!internal&&!(history.state&&history.state.tcSheet))pushRoute(currentScreen(),true)}else if(!open&&sheetWasOpen){sheetWasOpen=false;if(!internal&&history.state&&history.state.tcSheet)history.back()}decorateBackControls()});
sheetObserver.observe(sheet,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});window.__tcSheetNavObserver=sheetObserver;
}
if(keyHandler)document.removeEventListener('keydown',keyHandler);keyHandler=e=>{if(e.key==='Escape'){e.preventDefault();navigateBack()}};document.addEventListener('keydown',keyHandler);
if(popHandler)window.removeEventListener('popstate',popHandler);popHandler=onPopState;window.addEventListener('popstate',popHandler);
const start=currentScreen();surface.syncScreenVisibility(start);replaceRoute(start,false);decorateBackControls();
if(backObserver)try{backObserver.disconnect()}catch(e){}
const app=document.getElementById('app');
if(app&&typeof MutationObserver==='function'){backObserver=new MutationObserver(decorateBackControls);backObserver.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});window.__tcBackControlObserver=backObserver}
window.__TC_NAV_FOUNDATION=true;window.__TC_NAV_UPGRADE_VERSION=hotfixVersion;ownerInstalled=true;
console.log('TC_NAV_UPGRADE',JSON.stringify({phase:'install-owner',version:hotfixVersion,navigation:VERSION}));
return true;
}
function debug(){
return{version:VERSION,installed,ownerInstalled,singleOwner:installed&&window.go===dispatcher,beforeNames:before.map(x=>x.name),afterNames:after.map(x=>x.name),hasBaseGo:typeof baseGo==='function',sheetObserver:!!sheetObserver,backObserver:!!backObserver,hotfixVersion};
}
window.TurnikNavigation={version:VERSION,install,installOwner,registerBefore,registerAfter,unregister:remove,discardWorkout,navigateBack,decorateBackControls,currentScreen,debug};
try{window.dispatchEvent(new CustomEvent('turniknavigation:ready',{detail:{version:VERSION}}))}catch(e){}
})();