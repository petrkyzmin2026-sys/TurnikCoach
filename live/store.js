/* TURNIKCOACH_WORKOUT_STORE 1.1.0-write-path */
(function(){
'use strict';
const VERSION='1.1.0-write-path';
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
function sourceSnapshot(name){
const c=core();return c&&typeof c.sourceSnapshot==='function'?c.sourceSnapshot(name):null;
}
function transact(sourceName,mutator){
const c=core();if(!c||typeof c.transact!=='function'||typeof mutator!=='function')return false;
return c.transact(sourceName,mutator);
}
function append(sourceName,record,prepend=true){
if(!record||typeof record!=='object')return false;
return transact(sourceName,draft=>{
if(!draft||!Array.isArray(draft.history))return false;
const row=JSON.parse(JSON.stringify(record));
if(prepend!==false)draft.history.unshift(row);else draft.history.push(row);
});
}
function removeWhere(sourceName,predicate){
if(typeof predicate!=='function')return false;
return transact(sourceName,draft=>{
if(!draft||!Array.isArray(draft.history))return false;
const before=draft.history.length;
draft.history=draft.history.filter((x,i)=>!predicate(x,i));
return draft.history.length!==before;
});
}
function batch(steps){
const c=core();if(!c||typeof c.sourceSnapshot!=='function'||typeof c.replaceSource!=='function'||!Array.isArray(steps)||!steps.length)return false;
const prepared=[],before=new Map();
for(const step of steps){
if(!step||!step.source||typeof step.mutate!=='function')return false;
if(!before.has(step.source)){
const snap=c.sourceSnapshot(step.source);if(snap==null)return false;before.set(step.source,snap);
}
const base=prepared.find(x=>x.source===step.source);
const draft=base?base.next:JSON.parse(JSON.stringify(before.get(step.source)));
let result=false;
try{result=step.mutate(draft)}catch(e){console.error('TurnikWorkoutStore batch mutate',step.source,e);return false}
if(result===false)return false;
if(base)base.next=draft;else prepared.push({source:step.source,next:draft});
}
const applied=[];
for(const p of prepared){
if(c.replaceSource(p.source,p.next)){applied.push(p.source);continue}
for(let i=applied.length-1;i>=0;i--)try{c.replaceSource(applied[i],before.get(applied[i]))}catch(e){}
return false;
}
return true;
}
function debug(){
const a=rows();return{version:VERSION,total:a.length,sources:[...new Set(a.map(x=>x.source))],modes:[...new Set(a.map(x=>x.mode))],writePath:true};
}
window.TurnikWorkoutStore={version:VERSION,list,get,summary,course,sourceSnapshot,transact,append,removeWhere,batch,debug};
try{window.dispatchEvent(new CustomEvent('turnikworkoutstore:ready',{detail:{version:VERSION}}))}catch(e){}
})();