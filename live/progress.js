/* TURNIKCOACH_PROGRESS 1.0.0 */
(function(){
'use strict';
const VERSION='1.0.0',SOURCE='unified-progress';
if(window.TurnikProgress&&window.TurnikProgress.version===VERSION)return;
let installed=false;
function courseSnapshot(){
const c=window.TurnikCore;
return c&&typeof c.sourceSnapshot==='function'?c.sourceSnapshot('course'):null;
}
function genericSnapshot(){
const c=window.TurnikCore;
return c&&typeof c.sourceSnapshot==='function'?c.sourceSnapshot('generic'):null;
}
function pullMax(course,generic){
if(course&&Number.isFinite(+course.pullMax)&&+course.pullMax>0)return Math.floor(+course.pullMax);
const ex=generic&&Array.isArray(generic.ex)?generic.ex.find(x=>x&&x.id==='pull'):null;
return ex&&Number.isFinite(+ex.max)&&+ex.max>0?Math.floor(+ex.max):0;
}
function resolve(){
const store=window.TurnikWorkoutStore;
const course=courseSnapshot(),generic=genericSnapshot();
const summary=store&&typeof store.summary==='function'?store.summary({now:Date.now()}):{total:0,week:0,sets:0,reps:0};
const courseView=typeof window.tcGetCourseProgressViewState==='function'?window.tcGetCourseProgressViewState():null;
return{kind:'UNIFIED_PROGRESS',summary,pullMax:pullMax(course,generic),course:courseView};
}
function ensureStyle(){
if(document.getElementById('tcUnifiedProgressStyle'))return;
const s=document.createElement('style');s.id='tcUnifiedProgressStyle';
s.textContent='.tcProgressSummary{display:grid;grid-template-columns:repeat(auto-fit,minmax(94px,1fr));gap:8px;margin:2px 0 12px}.tcProgressMetric{min-width:0;background:#151d24;border:1px solid #34414d;border-radius:14px;padding:12px 8px;text-align:center}.tcProgressMetric b{display:block;color:#ffd84d;font-size:24px;line-height:1.1;overflow-wrap:anywhere}.tcProgressMetric span{display:block;margin-top:5px;color:#c4cdd5;font-size:11px;font-weight:750;line-height:1.3;overflow-wrap:anywhere}';
document.head.appendChild(s);
}
function renderMetric(host,index,label,value){
let cell=host.children[index];
if(!cell){cell=document.createElement('div');cell.className='tcProgressMetric';cell.appendChild(document.createElement('b'));cell.appendChild(document.createElement('span'));host.appendChild(cell)}
cell.firstElementChild.textContent=String(value);
cell.lastElementChild.textContent=label;
cell.setAttribute('role','group');cell.setAttribute('aria-label',label+': '+value);
}
function render(view){
const screen=document.getElementById('historyScreen'),scroll=screen&&screen.querySelector('.scroll');
if(!scroll)return false;
ensureStyle();
let summary=document.getElementById('tcProgressSummary');
if(!summary){summary=document.createElement('div');summary.id='tcProgressSummary';summary.className='tcProgressSummary'}
if(summary.parentNode!==scroll)scroll.insertBefore(summary,scroll.firstElementChild||null);
const s=view&&view.summary||{};
renderMetric(summary,0,'За 7 дней',s.week||0);
renderMetric(summary,1,'Всего тренировок',s.total||0);
renderMetric(summary,2,'MAX подтяг.',view&&view.pullMax||'—');
let wrap=document.getElementById('tcCourseHistoryWrap');
const html=view&&view.course&&typeof window.tcCourseProgressSectionHtml==='function'?window.tcCourseProgressSectionHtml(view.course):'';
if(html){
if(!wrap){wrap=document.createElement('div');wrap.id='tcCourseHistoryWrap'}
wrap.innerHTML=html;
const anchor=document.getElementById('exerciseProgress')||document.getElementById('historyList');
if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(wrap,anchor);else scroll.appendChild(wrap);
}else if(wrap)wrap.remove();
return true;
}
function install(){
if(installed)return true;
if(!window.TurnikDomain||!window.TurnikUI||!window.TurnikWorkoutStore)return false;
window.TurnikDomain.register('progress',SOURCE,1000,resolve);
window.TurnikUI.register('progress',SOURCE,1000,view=>render(view));
window.tcRenderProgressSummary=function(){return window.TurnikUI.renderArea('progress',{reason:'manual-progress-refresh'})};
installed=true;return true;
}
function debug(){
const d=window.TurnikDomain&&window.TurnikDomain.progress?window.TurnikDomain.progress():null;
return{version:VERSION,installed,source:d&&d.source||'',singleOwner:!!d&&d.source===SOURCE};
}
window.TurnikProgress={version:VERSION,install,resolve,render,debug};
try{window.dispatchEvent(new CustomEvent('turnikprogress:ready',{detail:{version:VERSION}}))}catch(e){}
})();