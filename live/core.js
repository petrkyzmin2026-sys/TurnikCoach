/* TURNIKCOACH_CORE 1.0.0 */
(function(){
'use strict';
const VERSION='1.0.0';
if(window.TurnikCore&&window.TurnikCore.version===VERSION)return;
const listeners=new Map(),sources=new Map();
function clone(v){try{return JSON.parse(JSON.stringify(v))}catch(e){return null}}
function readText(key,fallback=''){try{const v=localStorage.getItem(key);return v==null?fallback:v}catch(e){return fallback}}
function writeText(key,value){try{localStorage.setItem(key,String(value));return true}catch(e){return false}}
function readJSON(key,fallback=null){try{const raw=localStorage.getItem(key);if(raw==null)return clone(fallback);const v=JSON.parse(raw);return v==null?clone(fallback):v}catch(e){return clone(fallback)}}
function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(e){return false}}
function remove(key){try{localStorage.removeItem(key);return true}catch(e){return false}}
function on(type,fn){
if(typeof fn!=='function')return()=>{};
if(!listeners.has(type))listeners.set(type,new Set());
listeners.get(type).add(fn);
return()=>{const set=listeners.get(type);if(set)set.delete(fn)};
}
function emit(type,payload){
const set=listeners.get(type);if(!set)return;
[...set].forEach(fn=>{try{fn(payload)}catch(e){console.error('TurnikCore event',type,e)}});
}
function registerSource(name,adapter){
if(!name||!adapter||typeof adapter.snapshot!=='function')return false;
sources.set(String(name),adapter);emit('source:registered',{name:String(name)});return true;
}
function source(name){return sources.get(String(name))||null}
function sourceSnapshot(name){
const a=source(name);if(!a)return null;
try{return clone(a.snapshot())}catch(e){console.error('TurnikCore source snapshot',name,e);return null}
}
function normalizeWorkout(record,sourceName){
if(!record||typeof record!=='object')return null;
const ts=Number(record.ts||record.timestamp||0)||0;
const date=String(record.date||'');
const mode=String(record.courseMode||record.mode||record.session||record.type||'workout');
const details=Array.isArray(record.details)?record.details:
 Array.isArray(record.exercises)?record.exercises:[];
return{
id:String(sourceName)+':'+String(ts||date||'0')+':'+mode,
source:String(sourceName),
ts,date,mode,
session:record.session||'',
feedback:record.feedback||record.feel||'',
courseLevel:record.courseLevel==null?null:record.courseLevel,
courseComplex:record.courseComplex==null?null:record.courseComplex,
courseGoal:record.courseGoal||'',
plannedDate:record.plannedDate||date,
transferred:!!record.transferred,
runId:record.runId||'',
details:clone(details)||[],
raw:clone(record)
};
}
function historyFrom(name){
const a=source(name);if(!a)return[];
let rows=[];
try{rows=typeof a.history==='function'?a.history():[]}catch(e){console.error('TurnikCore source history',name,e)}
return(Array.isArray(rows)?rows:[]).map(r=>normalizeWorkout(r,name)).filter(Boolean);
}
function allHistory(){
const rows=[];for(const name of sources.keys())rows.push(...historyFrom(name));
const seen=new Set(),out=[];
rows.sort((a,b)=>(b.ts||0)-(a.ts||0));
for(const r of rows){
const sig=r.source+'|'+r.ts+'|'+r.date+'|'+r.mode+'|'+(r.courseComplex??'');
if(seen.has(sig))continue;seen.add(sig);out.push(r);
}
return out;
}
function snapshot(){
const out={version:VERSION,sources:{}};
for(const name of sources.keys())out.sources[name]=sourceSnapshot(name);
return out;
}
function replaceSource(name,next){
const a=source(name);if(!a||typeof a.restore!=='function')return false;
try{const ok=a.restore(clone(next));if(ok!==false)emit('state:changed',{source:name});return ok!==false}catch(e){console.error('TurnikCore source restore',name,e);return false}
}
function transact(name,mutator){
const a=source(name);if(!a||typeof mutator!=='function')return false;
const before=sourceSnapshot(name);if(before==null)return false;
const next=clone(before);let result;
try{result=mutator(next)}catch(e){console.error('TurnikCore transaction',name,e);return false}
if(result===false)return false;
return replaceSource(name,next);
}
window.TurnikCore={
version:VERSION,
storage:{readText,writeText,readJSON,writeJSON,remove},
events:{on,emit},
registerSource,source,sourceSnapshot,snapshot,replaceSource,transact,
history:{all:allHistory,from:historyFrom,normalize:normalizeWorkout},
debug(){return{version:VERSION,sources:[...sources.keys()],historyCount:allHistory().length}}
};
try{window.dispatchEvent(new CustomEvent('turnikcore:ready',{detail:{version:VERSION}}))}catch(e){}
})();