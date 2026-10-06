/* TURNIKCOACH_WORKOUT_STORE 1.0.0 */
(function(){
'use strict';
const VERSION='1.0.0';
if(window.TurnikWorkoutStore&&window.TurnikWorkoutStore.version===VERSION)return;
function core(){return window.TurnikCore||null}
function rows(){
const c=core();if(!c||!c.history||typeof c.history.all!=='function')return[];
return c.history.all().filter(x=>x&&x.raw&&x.raw.type==='workout');
}
function dateTs(x){
if(Number.isFinite(+x.ts)&&+x.ts>0)return +x.ts;
if(/^\d{4}-\d{2}-\d{2}$/.test(x.date||''))return Date.parse(x.date+'T12:00:00')||0;
return 0;
}
function match(row,opt){
if(!opt)return true;
if(opt.source&&row.source!==opt.source)return false;
if(opt.runId&&row.runId!==opt.runId)return false;
if(opt.mode){
const a=Array.isArray(opt.mode)?opt.mode:[opt.mode];
if(!a.includes(row.mode))return false;
}
if(opt.from&&String(row.date||'')<String(opt.from))return false;
if(opt.to&&String(row.date||'')>String(opt.to))return false;
return true;
}
function list(opt){
const o=opt||{},limit=Math.max(0,Number(o.limit)||0);
const a=rows().filter(x=>match(x,o)).sort((x,y)=>dateTs(y)-dateTs(x));
return limit?a.slice(0,limit):a;
}
function get(id){return rows().find(x=>x.id===id)||null}
function completedSets(row){
let n=0;(row.details||[]).forEach(d=>(d.actual||[]).forEach(v=>{if(v!==undefined&&v!==null)n++}));
return n;
}
function repVolume(row){
let n=0;(row.details||[]).forEach(d=>{
const metric=d.metric||'';
(d.actual||[]).forEach(v=>{if(v!==undefined&&v!==null&&Number.isFinite(+v)&&['reps','reps_side','weighted',''].includes(metric))n+=+v});
});
return n;
}
function summary(opt){
const o=opt||{},now=Number(o.now)||Date.now(),weekStart=now-7*86400000,a=list(o.filter);
let sets=0,reps=0,week=0;
const bySource={},byMode={};
for(const x of a){
const ts=dateTs(x);if(ts>=weekStart&&ts<=now)week++;
sets+=completedSets(x);reps+=repVolume(x);
bySource[x.source]=(bySource[x.source]||0)+1;
byMode[x.mode]=(byMode[x.mode]||0)+1;
}
return{total:a.length,week,sets,reps,bySource,byMode,last:a[0]||null};
}
function course(runId){
const a=list(runId?{runId}:null),main=a.filter(x=>x.mode==='course');
return{all:a,main,transferred:main.filter(x=>x.transferred),onTime:main.filter(x=>!x.transferred)};
}
function debug(){
const a=rows();return{version:VERSION,total:a.length,sources:[...new Set(a.map(x=>x.source))],modes:[...new Set(a.map(x=>x.mode))]};
}
window.TurnikWorkoutStore={version:VERSION,list,get,summary,course,debug};
try{window.dispatchEvent(new CustomEvent('turnikworkoutstore:ready',{detail:{version:VERSION}}))}catch(e){}
})();