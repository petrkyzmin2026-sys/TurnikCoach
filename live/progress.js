/* TURNIKCOACH_PROGRESS 1.0.0-owner */
(function(){
'use strict';
const VERSION='1.0.0-owner';
if(window.TurnikProgress&&window.TurnikProgress.version===VERSION)return;
let adapter=null,installed=false;
function metrics(genericHistory,courseHistory,pullMax,nowTs){
const all=[...(Array.isArray(genericHistory)?genericHistory:[]),...(Array.isArray(courseHistory)?courseHistory:[])],seen=new Set(),workouts=[];
all.forEach(rec=>{
if(!rec||rec.type!=='workout')return;
const key=rec.id!=null?'id:'+rec.id:[rec.ts||'',rec.date||'',rec.courseMode||'',rec.session||'',rec.total||''].join('|');
if(seen.has(key))return;seen.add(key);
let ts=Number(rec.ts)||0;
if(!ts&&/^\d{4}-\d{2}-\d{2}$/.test(rec.date||''))ts=Date.parse(rec.date+'T12:00:00')||0;
workouts.push(ts);
});
const now=Number(nowTs)||Date.now(),start=now-7*24*60*60*1000;
return{week:workouts.filter(ts=>ts>=start&&ts<=now).length,total:workouts.length,pullMax:Number.isFinite(+pullMax)&&+pullMax>0?Math.floor(+pullMax):0};
}
function ensureStyle(){
if(document.getElementById('tcProgressSummaryStyle'))return;
const style=document.createElement('style');style.id='tcProgressSummaryStyle';
style.textContent='.tcProgressSummary{display:grid;grid-template-columns:repeat(auto-fit,minmax(94px,1fr));gap:8px;margin:2px 0 12px}.tcProgressMetric{min-width:0;background:#151d24;border:1px solid #34414d;border-radius:14px;padding:12px 8px;text-align:center}.tcProgressMetric b{display:block;color:#ffd84d;font-size:24px;line-height:1.1;overflow-wrap:anywhere}.tcProgressMetric span{display:block;margin-top:5px;color:#c4cdd5;font-size:11px;font-weight:750;line-height:1.3;overflow-wrap:anywhere}';
document.head.appendChild(style);
}
function state(){
const course=adapter&&adapter.getCourse?adapter.getCourse():null,generic=adapter&&adapter.getGeneric?adapter.getGeneric():null;
const pulled=course&&course.pullMax>0?course.pullMax:(generic&&Array.isArray(generic.ex)&&generic.ex.find(e=>e.id==='pull')||{}).max;
const storeSummary=adapter&&adapter.store&&typeof adapter.store.summary==='function'?adapter.store.summary({now:Date.now()}):null;
const value=storeSummary?{week:storeSummary.week,total:storeSummary.total,pullMax:Number.isFinite(+pulled)&&+pulled>0?Math.floor(+pulled):0}:metrics(generic&&generic.history,course&&course.history,pulled,Date.now());
return{course,generic,pulled,metrics:value};
}
function render(){
const screen=document.getElementById('historyScreen'),scroll=screen&&screen.querySelector('.scroll');
if(!scroll)return false;
const value=state().metrics;
let host=document.getElementById('tcProgressSummary');
if(!host){host=document.createElement('div');host.id='tcProgressSummary';host.className='tcProgressSummary';scroll.insertBefore(host,scroll.firstElementChild||null)}
const entries=[['За 7 дней',value.week],['Всего тренировок',value.total],['MAX подтяг.',value.pullMax||'—']];
entries.forEach((entry,i)=>{
let cell=host.children[i];
if(!cell){cell=document.createElement('div');cell.className='tcProgressMetric';const number=document.createElement('b'),label=document.createElement('span');cell.appendChild(number);cell.appendChild(label);host.appendChild(cell)}
cell.firstElementChild.textContent=String(entry[1]);cell.lastElementChild.textContent=entry[0];cell.setAttribute('role','group');cell.setAttribute('aria-label',entry[0]+': '+entry[1]);
});
return true;
}
function claim(){
try{
Object.defineProperty(window,'tcRenderProgressSummary',{configurable:true,enumerable:true,get:()=>render,set:value=>{if(value!==render)console.warn('TurnikProgress ignored legacy tcRenderProgressSummary overwrite')}});
return window.tcRenderProgressSummary===render;
}catch(e){try{window.tcRenderProgressSummary=render;return window.tcRenderProgressSummary===render}catch(_){return false}}
}
function install(nextAdapter){
if(nextAdapter&&typeof nextAdapter==='object')adapter=nextAdapter;
if(!adapter)throw new Error('TurnikProgress adapter required');
if(installed){claim();return true}
const ui=adapter.ui;
if(!ui||typeof ui.register!=='function')throw new Error('TurnikProgress UI dispatcher unavailable');
ensureStyle();
ui.register('progress','*',10000,()=>{setTimeout(()=>{render();if(adapter&&adapter.decorate)adapter.decorate()},0);return false});
if(!claim())throw new Error('TurnikProgress compatibility API claim failed');
installed=true;render();return true;
}
function debug(){return{version:VERSION,installed,singleOwner:installed&&window.tcRenderProgressSummary===render,metrics:state().metrics}}
window.TurnikProgress={version:VERSION,install,metrics,state,render,debug};
try{window.dispatchEvent(new CustomEvent('turnikprogress:ready',{detail:{version:VERSION}}))}catch(e){}
})();