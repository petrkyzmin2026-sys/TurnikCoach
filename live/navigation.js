/* TURNIKCOACH_NAVIGATION 1.0.0 */
(function(){
'use strict';
const VERSION='1.0.0';
if(window.TurnikNavigation&&window.TurnikNavigation.version===VERSION)return;
const before=[],after=[];
let installed=false,baseGo=null,dispatcher=null,dispatching=false;
function put(list,name,priority,fn){
if(!name||typeof fn!=='function')return false;
const key=String(name),next={name:key,priority:Number(priority)||0,fn};
const i=list.findIndex(x=>x.name===key);
if(i>=0)list.splice(i,1,next);else list.push(next);
list.sort((a,b)=>b.priority-a.priority||a.name.localeCompare(b.name));
return true;
}
function remove(name){
let changed=false;
for(const list of [before,after]){
const i=list.findIndex(x=>x.name===String(name));
if(i>=0){list.splice(i,1);changed=true}
}
return changed;
}
function run(list,ctx,label){
for(const x of list)try{x.fn(ctx)}catch(e){console.error('TurnikNavigation '+label+' '+x.name,e)}
}
function dispatch(){
if(dispatching)return baseGo?baseGo.apply(this,arguments):undefined;
dispatching=true;
const ctx={args:[...arguments],target:arguments[0],result:undefined,meta:{},startedAt:Date.now()};
try{
run(before,ctx,'before');
ctx.result=baseGo?baseGo.apply(this,ctx.args):undefined;
run(after,ctx,'after');
return ctx.result;
}finally{dispatching=false}
}
function install(){
if(installed&&window.go===dispatcher)return true;
if(typeof window.go!=='function')return false;
baseGo=window.go;dispatcher=function(){return dispatch.apply(this,arguments)};
window.go=dispatcher;installed=true;return true;
}
function registerBefore(name,priority,fn){return put(before,name,priority,fn)}
function registerAfter(name,priority,fn){return put(after,name,priority,fn)}
function debug(){return{version:VERSION,installed,singleOwner:installed&&window.go===dispatcher,beforeNames:before.map(x=>x.name),afterNames:after.map(x=>x.name)}}
window.TurnikNavigation={version:VERSION,install,registerBefore,registerAfter,unregister:remove,debug};
try{window.dispatchEvent(new CustomEvent('turniknavigation:ready',{detail:{version:VERSION}}))}catch(e){}
})();