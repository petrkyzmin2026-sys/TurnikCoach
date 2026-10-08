/* TURNIKCOACH_WORKOUT_LIFECYCLE 1.0.0 */
(function(){
'use strict';
const VERSION='1.0.0';
if(window.TurnikWorkoutLifecycle&&window.TurnikWorkoutLifecycle.version===VERSION)return;
const EVENTS=['finishWorkout','finishRest'];
const buckets=new Map(EVENTS.map(e=>[e,{handlers:[],before:[],after:[],base:null,installed:false,dispatching:false,dispatcher:null}]));
function bucket(event){return buckets.get(String(event))||null}
function put(event,listName,name,priority,fn){
const b=bucket(event);if(!b||!name||typeof fn!=='function')return false;
const list=b[listName],key=String(name),next={name:key,priority:Number(priority)||0,fn};
const i=list.findIndex(x=>x.name===key);
if(i>=0)list.splice(i,1,next);else list.push(next);
list.sort((a,c)=>c.priority-a.priority||a.name.localeCompare(c.name));
return true;
}
function remove(event,name){
const b=bucket(event);if(!b)return false;let changed=false;
for(const key of ['handlers','before','after']){
const i=b[key].findIndex(x=>x.name===String(name));
if(i>=0){b[key].splice(i,1);changed=true}
}
return changed;
}
function runObservers(list,ctx,label){
for(const x of list)try{x.fn(ctx)}catch(e){console.error('TurnikWorkoutLifecycle '+label+' '+x.name,e)}
}
function dispatch(event,self,args){
const b=bucket(event);if(!b)return;
if(b.dispatching)return b.base?b.base.apply(self,args):undefined;
b.dispatching=true;
const ctx={event,args:[...args],handled:false,result:undefined,handler:'',meta:{},startedAt:Date.now()};
try{
runObservers(b.before,ctx,event+':before');
for(const h of b.handlers){
let r;
try{r=h.fn(ctx)}catch(e){console.error('TurnikWorkoutLifecycle '+event+' handler '+h.name,e);throw e}
if(r&&r.handled){ctx.handled=true;ctx.result=r.result;ctx.handler=h.name;break}
}
if(!ctx.handled&&b.base)ctx.result=b.base.apply(self,ctx.args);
runObservers(b.after,ctx,event+':after');
return ctx.result;
}finally{b.dispatching=false}
}
function installEvent(event){
const b=bucket(event);if(!b)return false;
if(b.installed&&window[event]===b.dispatcher)return true;
if(typeof window[event]!=='function')return false;
b.base=window[event];
b.dispatcher=function(){return dispatch(event,this,arguments)};
window[event]=b.dispatcher;b.installed=true;return true;
}
function install(){return EVENTS.every(installEvent)}
function registerHandler(event,name,priority,fn){return put(event,'handlers',name,priority,fn)}
function registerBefore(event,name,priority,fn){return put(event,'before',name,priority,fn)}
function registerAfter(event,name,priority,fn){return put(event,'after',name,priority,fn)}
function owns(event){const b=bucket(event);return !!b&&b.installed&&window[event]===b.dispatcher}
function debug(){
const events={};
for(const event of EVENTS){const b=bucket(event);events[event]={installed:b.installed,singleOwner:owns(event),handlers:b.handlers.map(x=>x.name),before:b.before.map(x=>x.name),after:b.after.map(x=>x.name)}}
return{version:VERSION,events};
}
window.TurnikWorkoutLifecycle={version:VERSION,install,registerHandler,registerBefore,registerAfter,unregister:remove,owns,debug};
try{window.dispatchEvent(new CustomEvent('turnikworkoutlifecycle:ready',{detail:{version:VERSION}}))}catch(e){}
})();