/* TURNIKCOACH_PROGRESS 1.0.0-owner */
(function(){
'use strict';
const VERSION='1.0.0-owner';
if(window.TurnikProgress&&window.TurnikProgress.version===VERSION)return;
let installed=false,api=null;
function safe(fn,fallback){try{const v=fn();return v==null?fallback:v}catch(e){return fallback}}
function pullMax(){
const course=api&&typeof api.getCourseState==='function'?safe(api.getCourseState,null):null;
if(course&&Number.isFinite(+course.pullMax)&&+course.pullMax>0)return Math.floor(+course.pullMax);
const generic=api&&typeof api.getGenericState==='function'?safe(api.getGenericState,null):null;
const pull=generic&&Array.isArray(generic.ex)?generic.ex.find(e=>e&&e.id==='pull'):null;
return pull&&Number.isFinite(+pull.max)&&+pull.max>0?Math.floor(+pull.max):0;
}
function summary(now){
const store=api&&api.store;
const base=store&&typeof store.summary==='function'?safe(()=>store.summary({now:Number(now)||Date.now()}),null):null;
return{
week:base&&Number.isFinite(+base.week)?+base.week:0,
total:base&&Number.isFinite(+base.total)?+base.total:0,
sets:base&&Number.isFinite(+base.sets)?+base.sets:0,
reps:base&&Number.isFinite(+base.reps)?+base.reps:0,
pullMax:pullMax(),
bySource:base&&base.bySource||{},
byMode:base&&base.byMode||{}
};
}
function ensureStyle(){
if(document.getElementById('tcProgressSummaryStyle'))return;
const style=document.createElement('style');
style.id='tcProgressSummaryStyle';
style.textContent='.tcProgressSummary{display:grid;grid-template-columns:repeat(auto-fit,minmax(94px,1fr));gap:8px;margin:2px 0 12px}.tcProgressMetric{min-width:0;background:#151d24;border:1px solid #34414d;border-radius:14px;padding:12px 8px;text-align:center}.tcProgressMetric b{display:block;color:#ffd84d;font-size:24px;line-height:1.1;overflow-wrap:anywhere}.tcProgressMetric span{display:block;margin-top:5px;color:#c4cdd5;font-size:11px;font-weight:750;line-height:1.3;overflow-wrap:anywhere}';
document.head.appendChild(style);
}
function render(){
const screen=document.getElementById('historyScreen'),scroll=screen&&screen.querySelector('.scroll');
if(!scroll)return false;
ensureStyle();
const m=summary(Date.now());
let host=document.getElementById('tcProgressSummary');
if(!host){
host=document.createElement('div');host.id='tcProgressSummary';host.className='tcProgressSummary';
scroll.insertBefore(host,scroll.firstElementChild||null);
}
const entries=[['За 7 дней',m.week],['Всего тренировок',m.total],['MAX подтяг.',m.pullMax||'—']];
entries.forEach((entry,i)=>{
let cell=host.children[i];
if(!cell){
cell=document.createElement('div');cell.className='tcProgressMetric';
cell.appendChild(document.createElement('b'));cell.appendChild(document.createElement('span'));host.appendChild(cell);
}
cell.firstElementChild.textContent=String(entry[1]);
cell.lastElementChild.textContent=entry[0];
cell.setAttribute('role','group');cell.setAttribute('aria-label',entry[0]+': '+entry[1]);
});
while(host.children.length>entries.length)host.lastElementChild.remove();
return true;
}
function install(options){
if(installed)return true;
api=options||{};
if(!api.ui||typeof api.ui.register!=='function'||!api.store||typeof api.store.summary!=='function')return false;
installed=true;
api.ui.register('progress','*',10000,()=>{
setTimeout(()=>{render();if(api.productUI&&typeof api.productUI.queueDecorate==='function')api.productUI.queueDecorate()},0);
return false;
});
render();
return true;
}
function debug(){return{version:VERSION,installed,summary:summary(Date.now())}}
window.TurnikProgress={version:VERSION,install,render,summary,debug};
try{window.dispatchEvent(new CustomEvent('turnikprogress:ready',{detail:{version:VERSION}}))}catch(e){}
})();