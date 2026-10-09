/* TURNIKCOACH_COURSE_ACTIONS 1.0.0 */
(function(){
'use strict';
const VERSION='1.0.0';
if(window.TurnikCourseActions&&window.TurnikCourseActions.version===VERSION)return;
const handlers=new Map(),fallbacks=new Map(),dispatchers=new Map(),installed=new Set();
function list(name){
const key=String(name||'');if(!handlers.has(key))handlers.set(key,[]);return handlers.get(key);
}
function register(name,owner,priority,fn){
if(!name||!owner||typeof fn!=='function')return false;
const rows=list(name),key=String(owner),next={owner:key,priority:Number(priority)||0,fn};
const i=rows.findIndex(x=>x.owner===key);
if(i>=0)rows.splice(i,1,next);else rows.push(next);
rows.sort((a,b)=>b.priority-a.priority||a.owner.localeCompare(b.owner));
return true;
}
function unregister(name,owner){
const rows=list(name),i=rows.findIndex(x=>x.owner===String(owner));if(i<0)return false;rows.splice(i,1);return true;
}
function capture(name,owner='legacy-course',priority=0){
const key=String(name||''),fn=window[key];
if(!key||typeof fn!=='function'||fn===dispatchers.get(key))return false;
return register(key,owner,priority,fn);
}
function dispatch(name,thisArg,args){
const key=String(name),rows=list(key);
for(const h of rows){
try{return h.fn.apply(thisArg,args||[])}
catch(e){console.error('TurnikCourseActions '+key+' handler '+h.owner,e)}
}
const fallback=fallbacks.get(key);
if(typeof fallback==='function')return fallback.apply(thisArg,args||[]);
return undefined;
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
const commands={};
for(const [name,rows] of handlers)commands[name]=rows.map(x=>({owner:x.owner,priority:x.priority}));
return{version:VERSION,installed:[...installed].sort(),commands,singleOwner:[...installed].every(owns)};
}
window.TurnikCourseActions={version:VERSION,register,unregister,capture,install,owns,debug};
try{window.dispatchEvent(new CustomEvent('turnikcourseactions:ready',{detail:{version:VERSION}}))}catch(e){}
})();