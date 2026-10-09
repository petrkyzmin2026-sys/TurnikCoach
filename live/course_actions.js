/* TURNIKCOACH_COURSE_ACTIONS 1.1.0-hooks */
(function(){
'use strict';
const VERSION='1.1.0-hooks';
if(window.TurnikCourseActions&&window.TurnikCourseActions.version===VERSION)return;
const handlers=new Map(),before=new Map(),after=new Map(),fallbacks=new Map(),dispatchers=new Map(),installed=new Set();
function listFor(map,name){const key=String(name||'');if(!map.has(key))map.set(key,[]);return map.get(key)}
function list(name){return listFor(handlers,name)}
function register(name,owner,priority,fn){if(!name)return false;return put(list(name),owner,priority,fn)}
function removeOwner(map,name,owner){const rows=listFor(map,name),i=rows.findIndex(x=>x.owner===String(owner));if(i<0)return false;rows.splice(i,1);return true}
function unregister(name,owner){return removeOwner(handlers,name,owner)|removeOwner(before,name,owner)|removeOwner(after,name,owner)}
function registerBefore(name,owner,priority,fn){return put(listFor(before,name),owner,priority,fn)}
function registerAfter(name,owner,priority,fn){return put(listFor(after,name),owner,priority,fn)}
function put(rows,owner,priority,fn){if(!owner||typeof fn!=='function')return false;const key=String(owner),next={owner:key,priority:Number(priority)||0,fn};const i=rows.findIndex(x=>x.owner===key);if(i>=0)rows.splice(i,1,next);else rows.push(next);rows.sort((a,b)=>b.priority-a.priority||a.owner.localeCompare(b.owner));return true}
function capture(name,owner='legacy-course',priority=0){
const key=String(name||''),fn=window[key];
if(!key||typeof fn!=='function'||fn===dispatchers.get(key))return false;
return register(key,owner,priority,fn);
}
function runHooks(map,key,ctx){for(const h of listFor(map,key)){try{h.fn(ctx)}catch(e){console.error('TurnikCourseActions '+key+' hook '+h.owner,e)}}}
function dispatch(name,thisArg,args){
const key=String(name),rows=list(key),ctx={name:key,args:args||[],thisArg,result:undefined,handler:''};
runHooks(before,key,ctx);
for(const h of rows){try{ctx.result=h.fn.apply(thisArg,ctx.args);ctx.handler=h.owner;runHooks(after,key,ctx);return ctx.result}catch(e){console.error('TurnikCourseActions '+key+' handler '+h.owner,e)}}
const fallback=fallbacks.get(key);if(typeof fallback==='function'){ctx.result=fallback.apply(thisArg,ctx.args);ctx.handler='fallback'}
runHooks(after,key,ctx);return ctx.result;
}
function install(names){
const rows=[...new Set((Array.isArray(names)?names:[]).map(String).filter(Boolean))];
if(!rows.length)return false;
for(const key of rows){
const current=window[key];
if(typeof current==='function'&&current!==dispatchers.get(key)&&!fallbacks.has(key))fallbacks.set(key,current);
let dispatcher=dispatchers.get(key);
if(!dispatcher){
dispatcher=function(){return dispatch(key,this,[...arguments])};
dispatchers.set(key,dispatcher);
}
window[key]=dispatcher;installed.add(key);
}
return rows.every(key=>window[key]===dispatchers.get(key));
}
function owns(name){const key=String(name);return installed.has(key)&&window[key]===dispatchers.get(key)}
function debug(){
const commands={},beforeHooks={},afterHooks={};
for(const [name,rows] of handlers)commands[name]=rows.map(x=>({owner:x.owner,priority:x.priority}));
for(const [name,rows] of before)beforeHooks[name]=rows.map(x=>x.owner);
for(const [name,rows] of after)afterHooks[name]=rows.map(x=>x.owner);
return{version:VERSION,installed:[...installed].sort(),commands,beforeHooks,afterHooks,singleOwner:[...installed].every(owns)};
}
window.TurnikCourseActions={version:VERSION,register,registerBefore,registerAfter,unregister,capture,install,owns,debug};
try{window.dispatchEvent(new CustomEvent('turnikcourseactions:ready',{detail:{version:VERSION}}))}catch(e){}
})();