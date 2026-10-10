/* TURNIKCOACH_COURSE_ACTIONS 1.1.0-hooks */
(function(){
'use strict';
const VERSION='1.1.0-hooks';
if(window.TurnikCourseActions&&window.TurnikCourseActions.version===VERSION)return;
const handlers=new Map(),fallbacks=new Map(),dispatchers=new Map(),owned=new Set(),before=new Map(),after=new Map();
function keyOf(name){return String(name||'').trim()}
function hookRows(map,name){const key=keyOf(name);if(!map.has(key))map.set(key,[]);return map.get(key)}
function register(name,owner,fn){
const key=keyOf(name);if(!key||!owner||typeof fn!=='function')return false;
handlers.set(key,{owner:String(owner),fn});return true;
}
function putHook(map,name,owner,priority,fn){
const key=keyOf(name);if(!key||!owner||typeof fn!=='function')return false;
const rows=hookRows(map,key),id=String(owner),row={owner:id,priority:Number(priority)||0,fn};
const i=rows.findIndex(x=>x.owner===id);if(i>=0)rows.splice(i,1,row);else rows.push(row);
rows.sort((a,b)=>b.priority-a.priority||a.owner.localeCompare(b.owner));return true;
}
function registerBefore(name,owner,priority,fn){return putHook(before,name,owner,priority,fn)}
function registerAfter(name,owner,priority,fn){return putHook(after,name,owner,priority,fn)}
function unregister(name,owner){
const key=keyOf(name),id=String(owner),row=handlers.get(key);let changed=false;
if(row&&row.owner===id){handlers.delete(key);changed=true}
for(const map of [before,after]){const rows=hookRows(map,key),i=rows.findIndex(x=>x.owner===id);if(i>=0){rows.splice(i,1);changed=true}}
return changed;
}
function capture(name,owner='course'){
const key=keyOf(name),fn=window[key];
if(!key||typeof fn!=='function'||fn===dispatchers.get(key))return false;
fallbacks.set(key,fn);return register(key,owner,fn);
}
function runHooks(map,key,ctx){
for(const row of hookRows(map,key)){try{row.fn(ctx)}catch(e){console.error('TurnikCourseActions '+key+' hook '+row.owner,e)}}
}
function dispatch(name,thisArg,args){
const key=keyOf(name),row=handlers.get(key),fallback=fallbacks.get(key),ctx={name:key,args:args||[],thisArg,result:undefined,handler:row&&row.owner||''};
runHooks(before,key,ctx);
const fn=row&&typeof row.fn==='function'?row.fn:fallback;
if(typeof fn!=='function')throw new Error('No course action handler: '+key);
ctx.result=fn.apply(thisArg,ctx.args);runHooks(after,key,ctx);return ctx.result;
}
function install(name){
const key=keyOf(name);if(!key)return false;
let dispatcher=dispatchers.get(key);
if(!dispatcher){dispatcher=function(){return dispatch(key,this,[...arguments])};dispatchers.set(key,dispatcher)}
window[key]=dispatcher;owned.add(key);return true;
}
function captureAndInstall(names,owner='course'){
const rows=[...new Set((Array.isArray(names)?names:[]).map(keyOf).filter(Boolean))];
for(const key of rows){if(!capture(key,owner)&&typeof window[key]!=='function')return false;install(key)}
return rows.every(owns);
}
function owns(name){const key=keyOf(name);return owned.has(key)&&window[key]===dispatchers.get(key)}
function call(name,...args){return dispatch(name,window,args)}
function debug(){
const commands={},beforeHooks={},afterHooks={};
for(const [name,row] of handlers)commands[name]=row.owner;
for(const [name,rows] of before)if(rows.length)beforeHooks[name]=rows.map(x=>x.owner);
for(const [name,rows] of after)if(rows.length)afterHooks[name]=rows.map(x=>x.owner);
return{version:VERSION,commands,owned:[...owned].sort(),beforeHooks,afterHooks,singleOwner:[...owned].every(owns)};
}
window.TurnikCourseActions={version:VERSION,register,registerBefore,registerAfter,unregister,capture,install,captureAndInstall,owns,call,debug};
try{window.dispatchEvent(new CustomEvent('turnikcourseactions:ready',{detail:{version:VERSION}}))}catch(e){}
})();