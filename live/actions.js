/* TURNIKCOACH_WORKOUT_ACTIONS 1.0.0 */
(function(){
'use strict';
const VERSION='1.0.0';
if(window.TurnikWorkoutActions&&window.TurnikWorkoutActions.version===VERSION)return;
const handlers=[],before=[],after=[];
let installed=false,baseSetDone=null,dispatching=false;
function put(list,name,priority,fn){
if(!name||typeof fn!=='function')return false;
const key=String(name),next={name:key,priority:Number(priority)||0,fn};
const i=list.findIndex(x=>x.name===key);
if(i>=0)list.splice(i,1,next);else list.push(next);
list.sort((a,b)=>b.priority-a.priority||a.name.localeCompare(b.name));
return true;
}
function remove(list,name){const i=list.findIndex(x=>x.name===String(name));if(i<0)return false;list.splice(i,1);return true}
function run(list,ctx){
for(const x of list){try{x.fn(ctx)}catch(e){console.error('TurnikWorkoutActions '+x.name,e)}}
}
function dispatch(skip){
if(dispatching)return baseSetDone?baseSetDone.apply(this,arguments):undefined;
dispatching=true;
const ctx={skip:!!skip,args:[...arguments],handled:false,result:undefined,meta:{},startedAt:Date.now()};
try{
run(before,ctx);
for(const h of handlers){
let r=null;try{r=h.fn(ctx)}catch(e){console.error('TurnikWorkoutActions handler '+h.name,e);continue}
if(r&&r.handled){ctx.handled=true;ctx.result=r.result;ctx.handler=h.name;break}
}
if(!ctx.handled&&baseSetDone)ctx.result=baseSetDone.apply(this,ctx.args);
run(after,ctx);
return ctx.result;
}finally{dispatching=false}
}
function install(){
if(installed)return true;
if(typeof window.setDone!=='function')return false;
baseSetDone=window.setDone;
window.setDone=dispatch;
installed=true;
return true;
}
function registerHandler(name,priority,fn){return put(handlers,name,priority,fn)}
function registerBefore(name,priority,fn){return put(before,name,priority,fn)}
function registerAfter(name,priority,fn){return put(after,name,priority,fn)}
function unregister(name){
return remove(handlers,name)|remove(before,name)|remove(after,name);
}
function debug(){return{version:VERSION,installed,handlerNames:handlers.map(x=>x.name),beforeNames:before.map(x=>x.name),afterNames:after.map(x=>x.name),singleOwner:installed&&window.setDone===dispatch}}
window.TurnikWorkoutActions={version:VERSION,install,registerHandler,registerBefore,registerAfter,unregister,debug};
try{window.dispatchEvent(new CustomEvent('turnikworkoutactions:ready',{detail:{version:VERSION}}))}catch(e){}
})();