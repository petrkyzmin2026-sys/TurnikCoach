/* TURNIKCOACH_SURFACE 1.0.0-owner */
(function(){
'use strict';
const VERSION='1.0.0-owner';
if(window.TurnikSurface&&window.TurnikSurface.version===VERSION)return;
let installed=false,hotfixVersion='',geometryObserver=null,adaptiveObserver=null;
let focusHandler=null,pageshowHandler=null,visibilityHandler=null;
function hasWorkout(){return typeof W!=='undefined'&&!!W}
function syncScreenVisibility(id){
document.querySelectorAll('.screen').forEach(screen=>{
const active=screen.id===id;
screen.classList.toggle('on',active);
screen.hidden=!active;
screen.setAttribute('aria-hidden',active?'false':'true');
screen.style.display=active?'flex':'none';
});
const target=document.getElementById(id);
if(target)void target.offsetHeight;
return !!target;
}
function forceRepaint(){
const app=document.getElementById('app');
if(!app)return false;
const previous=app.style.display;
app.style.display='none';
void app.offsetHeight;
app.style.display=previous||'block';
void app.offsetHeight;
if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>{
app.style.transform='translateZ(0)';
void app.offsetHeight;
app.style.transform='';
try{
if(window.TurnikNative&&typeof window.TurnikNative.invalidate==='function')window.TurnikNative.invalidate();
}catch(e){}
});
return true;
}
function installAdaptiveGeometry(){
const workout=document.getElementById('workout');
const controls=workout&&workout.querySelector('.controls,.tcStableWorkoutControls');
if(!workout||!controls)return false;
const apply=()=>{
const h=Math.ceil(controls.getBoundingClientRect().height||0);
if(h>0)workout.style.setProperty('--tc-workout-controls-bottom',(h+22)+'px');
};
if(geometryObserver)try{geometryObserver.disconnect()}catch(e){}
if(typeof ResizeObserver==='function'){
geometryObserver=new ResizeObserver(apply);
geometryObserver.observe(controls);
}
apply();
setTimeout(apply,0);
return true;
}
function refreshActiveTrainingSurface(id){
if(!hasWorkout())return false;
const target=id==='rest'?'rest':'workout';
syncScreenVisibility(target);
try{
if(target==='workout'&&typeof renderWork==='function')renderWork();
if(target==='rest'&&window.TurnikRest&&typeof window.TurnikRest.render==='function')window.TurnikRest.render();
if(target==='workout')installAdaptiveGeometry();
}catch(e){}
forceRepaint();
try{
if(window.TurnikNative&&typeof window.TurnikNative.showSurface==='function')window.TurnikNative.showSurface(target);
else if(window.TurnikNative&&typeof window.TurnikNative.refreshSurface==='function')window.TurnikNative.refreshSurface();
}catch(e){}
return true;
}
function readScreen(id){
const el=document.getElementById(id);
if(!el)return null;
const r=el.getBoundingClientRect();
return{on:el.classList.contains('on'),hidden:!!el.hidden,display:getComputedStyle(el).display,width:Math.round(r.width),height:Math.round(r.height),top:Math.round(r.top),left:Math.round(r.left)};
}
function logRestoreSurface(delay){
try{
const screens=[...document.querySelectorAll('.screen')].map(el=>({id:el.id,on:el.classList.contains('on'),hidden:!!el.hidden,display:getComputedStyle(el).display}));
const buttons=[...document.querySelectorAll('button')],hasButton=text=>buttons.some(btn=>(btn.textContent||'').trim().includes(text));
console.log('TC_RESTORE_SURFACE',JSON.stringify({
phase:'snapshot',delay,version:hotfixVersion||VERSION,
activeScreens:screens.filter(s=>s.on).map(s=>s.id),screens,
today:readScreen('today'),workout:readScreen('workout'),rest:readScreen('rest'),
hasDone:hasButton('Сделано'),hasExit:hasButton('Выйти'),
historyState:history.state||null,hasW:hasWorkout(),mode:hasWorkout()&&W&&W.mode?W.mode:null
}));
}catch(e){console.log('TC_RESTORE_SURFACE',JSON.stringify({phase:'snapshot-error',delay,version:hotfixVersion||VERSION,error:String(e&&e.message||e)}))}
}
function enforceRestoreGuard(){
const guard=window.__tcRestoreSurfaceGuard;
if(!guard)return false;
if(Date.now()>guard.until||!hasWorkout()){window.__tcRestoreSurfaceGuard=null;return false}
return refreshActiveTrainingSurface(guard.surface);
}
function armRestoreSurfaceGuard(surface){
window.__tcRestoreSurfaceGuard={surface:surface==='rest'?'rest':'workout',until:Date.now()+5000};
console.log('TC_NAV_UPGRADE',JSON.stringify({phase:'arm-restore-guard',version:hotfixVersion||VERSION,surface:window.__tcRestoreSurfaceGuard.surface}));
const enforce=()=>{try{enforceRestoreGuard()}catch(e){}};
const enforceAndLog=delay=>{enforce();logRestoreSurface(delay)};
enforceAndLog(0);
if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>{enforce();requestAnimationFrame(enforce)});
[250,750,1500,3000].forEach(delay=>setTimeout(()=>enforceAndLog(delay),delay));
return true;
}
function install(opts){
hotfixVersion=opts&&opts.hotfixVersion?String(opts.hotfixVersion):hotfixVersion;
if(focusHandler)window.removeEventListener('focus',focusHandler);
if(pageshowHandler)window.removeEventListener('pageshow',pageshowHandler);
if(visibilityHandler)document.removeEventListener('visibilitychange',visibilityHandler);
focusHandler=enforceRestoreGuard;
pageshowHandler=enforceRestoreGuard;
visibilityHandler=()=>{if(document.visibilityState==='visible')enforceRestoreGuard()};
window.addEventListener('focus',focusHandler);
window.addEventListener('pageshow',pageshowHandler);
document.addEventListener('visibilitychange',visibilityHandler);
if(adaptiveObserver)try{adaptiveObserver.disconnect()}catch(e){}
const app=document.getElementById('app');
if(app&&typeof MutationObserver==='function'){
adaptiveObserver=new MutationObserver(()=>{
const workout=document.getElementById('workout');
if(workout&&workout.classList.contains('on'))installAdaptiveGeometry();
});
adaptiveObserver.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
}
const workout=document.getElementById('workout');
if(workout&&workout.classList.contains('on'))installAdaptiveGeometry();
window.tcRefreshActiveTrainingSurface=refreshActiveTrainingSurface;
window.tcArmRestoreSurfaceGuard=armRestoreSurfaceGuard;
window.tcInstallAdaptiveWorkoutGeometry=installAdaptiveGeometry;
installed=true;
return true;
}
function debug(){
return{version:VERSION,installed,hotfixVersion,hasWorkout:hasWorkout(),guard:window.__tcRestoreSurfaceGuard||null,geometryObserver:!!geometryObserver,adaptiveObserver:!!adaptiveObserver};
}
window.TurnikSurface={version:VERSION,install,hasWorkout,syncScreenVisibility,forceRepaint,installAdaptiveGeometry,refreshActiveTrainingSurface,armRestoreSurfaceGuard,enforceRestoreGuard,debug};
try{window.dispatchEvent(new CustomEvent('turniksurface:ready',{detail:{version:VERSION}}))}catch(e){}
})();