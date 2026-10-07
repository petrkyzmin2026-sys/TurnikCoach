/* TURNIKCOACH_WORKOUT_ACTIONS 1.1.0 */
(function(){
'use strict';
const VERSION='1.1.0';
if(window.TurnikWorkoutActions&&window.TurnikWorkoutActions.version===VERSION)return;
const setHandlers=[],setBefore=[],setAfter=[],finishHandlers=[],finishBefore=[],finishAfter=[];
let setInstalled=false,finishInstalled=false,baseSetDone=null,baseFinishWorkout=null,setDispatching=false,finishDispatching=false;
function put(list,name,priority,fn){
if(!name||typeof fn!=='function')return false;
const key=String(name),next={name:key,priority:Number(priority)||0,fn};
const i=list.findIndex(x=>x.name===key);
if(i>=0)list.splice(i,1,next);else list.push(next);
list.sort((a,b)=>b.priority-a.priority||a.name.localeCompare(b.name));
return true;
}
function remove(list,name){const i=list.findIndex(x=>x.name===String(name));if(i<0)return false;list.splice(i,1);return true}
function run(list,ctx){for(const x of list){try{x.fn(ctx)}catch(e){console.error('TurnikWorkoutActions '+x.name,e)}}}
function runHandler(list,ctx){
for(const h of list){
let r=null;try{r=h.fn(ctx)}catch(e){console.error('TurnikWorkoutActions handler '+h.name,e);continue}
if(r&&r.handled){ctx.handled=true;ctx.result=r.result;ctx.handler=h.name;return true}
}
return false;
}
function dispatchSetDone(skip){
if(setDispatching)return baseSetDone?baseSetDone.apply(this,arguments):undefined;
setDispatching=true;
const ctx={action:'setDone',skip:!!skip,args:[...arguments],handled:false,result:undefined,meta:{},startedAt:Date.now()};
try{
run(setBefore,ctx);runHandler(setHandlers,ctx);
if(!ctx.handled&&baseSetDone)ctx.result=baseSetDone.apply(this,ctx.args);
run(setAfter,ctx);return ctx.result;
}finally{setDispatching=false}
}
function dispatchFinishWorkout(feel){
if(finishDispatching)return baseFinishWorkout?baseFinishWorkout.apply(this,arguments):undefined;
finishDispatching=true;
const ctx={action:'finishWorkout',feel:String(feel||''),args:[...arguments],handled:false,result:undefined,meta:{},startedAt:Date.now()};
try{
run(finishBefore,ctx);runHandler(finishHandlers,ctx);
if(!ctx.handled&&baseFinishWorkout)ctx.result=baseFinishWorkout.apply(this,ctx.args);
run(finishAfter,ctx);return ctx.result;
}finally{finishDispatching=false}
}
function installSetDone(){
if(setInstalled)return true;
if(typeof window.setDone!=='function')return false;
baseSetDone=window.setDone;window.setDone=dispatchSetDone;setInstalled=true;return true;
}
function installFinishWorkout(){
if(finishInstalled)return true;
if(typeof window.finishWorkout!=='function')return false;
baseFinishWorkout=window.finishWorkout;window.finishWorkout=dispatchFinishWorkout;finishInstalled=true;return true;
}
function install(){return installSetDone()&&installFinishWorkout()}
function registerHandler(name,priority,fn){return put(setHandlers,name,priority,fn)}
function registerBefore(name,priority,fn){return put(setBefore,name,priority,fn)}
function registerAfter(name,priority,fn){return put(setAfter,name,priority,fn)}
function registerFinishHandler(name,priority,fn){return put(finishHandlers,name,priority,fn)}
function registerFinishBefore(name,priority,fn){return put(finishBefore,name,priority,fn)}
function registerFinishAfter(name,priority,fn){return put(finishAfter,name,priority,fn)}
function unregister(name){
return !!(remove(setHandlers,name)|remove(setBefore,name)|remove(setAfter,name)|remove(finishHandlers,name)|remove(finishBefore,name)|remove(finishAfter,name));
}
function debug(){return{
version:VERSION,
setDoneOwner:setInstalled&&window.setDone===dispatchSetDone,
finishWorkoutOwner:finishInstalled&&window.finishWorkout===dispatchFinishWorkout,
handlerNames:setHandlers.map(x=>x.name),beforeNames:setBefore.map(x=>x.name),afterNames:setAfter.map(x=>x.name),
finishHandlerNames:finishHandlers.map(x=>x.name),finishBeforeNames:finishBefore.map(x=>x.name),finishAfterNames:finishAfter.map(x=>x.name)
}}
window.TurnikWorkoutActions={
version:VERSION,install,installSetDone,installFinishWorkout,
registerHandler,registerBefore,registerAfter,
registerFinishHandler,registerFinishBefore,registerFinishAfter,
unregister,debug
};
try{window.dispatchEvent(new CustomEvent('turnikworkoutactions:ready',{detail:{version:VERSION}}))}catch(e){}
})();