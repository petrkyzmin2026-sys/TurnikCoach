/* TURNIKCOACH_COURSE_ACTIONS 1.0.0-owner */
(function(){
'use strict';
const VERSION='1.0.0-owner';
if(window.TurnikCourseActions&&window.TurnikCourseActions.version===VERSION)return;
const handlers=new Map(),fallbacks=new Map(),dispatchers=new Map(),owned=new Set();
function keyOf(name){return String(name||'').trim()}
function register(name,owner,fn){
const key=keyOf(name);if(!key||!owner||typeof fn!=='function')return false;
handlers.set(key,{owner:String(owner),fn});return true;
}
function unregister(name,owner){
const key=keyOf(name),row=handlers.get(key);
if(!row||row.owner!==String(owner))return false;
handlers.delete(key);return true;
}
function capture(name,owner='course'){
const key=keyOf(name),fn=window[key];
if(!key||typeof fn!=='function'||fn===dispatchers.get(key))return false;
fallbacks.set(key,fn);return register(key,owner,fn);
}
function dispatch(name,thisArg,args){
const key=keyOf(name),row=handlers.get(key),fallback=fallbacks.get(key);
const fn=row&&typeof row.fn==='function'?row.fn:fallback;
if(typeof fn!=='function')throw new Error('No course action handler: '+key);
return fn.apply(thisArg,args||[]);
}
function install(name){
const key=keyOf(name);if(!key)return false;
let dispatcher=dispatchers.get(key);
if(!dispatcher){
dispatcher=function(){return dispatch(key,this,[...arguments])};
dispatchers.set(key,dispatcher);
}
window[key]=dispatcher;owned.add(key);return true;
}
function captureAndInstall(names,owner='course'){
const rows=[...new Set((Array.isArray(names)?names:[]).map(keyOf).filter(Boolean))];
for(const key of rows){
if(!capture(key,owner)&&typeof window[key]!=='function')return false;
install(key);
}
return rows.every(owns);
}
function owns(name){
const key=keyOf(name);
return owned.has(key)&&window[key]===dispatchers.get(key);
}
function call(name,...args){return dispatch(name,window,args)}
function debug(){
const commands={};
for(const [name,row] of handlers)commands[name]=row.owner;
return{version:VERSION,commands,owned:[...owned].sort(),singleOwner:[...owned].every(owns)};
}
window.TurnikCourseActions={version:VERSION,register,unregister,capture,install,captureAndInstall,owns,call,debug};
try{window.dispatchEvent(new CustomEvent('turnikcourseactions:ready',{detail:{version:VERSION}}))}catch(e){}
})();