/* TURNIKCOACH_LIFECYCLE 1.0.0 */
(function(){
'use strict';
const VERSION='1.0.0',ACTIONS=['go','finishRest','finishWorkout'];
if(window.TurnikLifecycle&&window.TurnikLifecycle.version===VERSION)return;
const state={installed:false,bases:{},handlers:{},before:{},after:{},dispatching:{}};
for(const a of ACTIONS){state.handlers[a]=[];state.before[a]=[];state.after[a]=[];state.dispatching[a]=false}
function put(list,name,priority,fn){
if(!name||typeof fn!=='function')return false;
const key=String(name),x={name:key,priority:Number(priority)||0,fn},i=list.findIndex(v=>v.name===key);
if(i>=0)list.splice(i,1,x);else list.push(x);
list.sort((a,b)=>b.priority-a.priority||a.name.localeCompare(b.name));
return true;
}
function remove(list,name){const i=list.findIndex(x=>x.name===String(name));if(i<0)return false;list.splice(i,1);return true}
function runHooks(list,ctx){
for(const h of list){try{h.fn(ctx)}catch(e){console.error('TurnikLifecycle '+ctx.action+' '+h.name,e)}}
}
function dispatch(action,self,argsLike){
const args=[...argsLike],base=state.bases[action];
if(state.dispatching[action])return typeof base==='function'?base.apply(self,args):undefined;
state.dispatching[action]=true;
const ctx={action,args,thisArg:self,handled:false,result:undefined,handler:'',meta:{},startedAt:Date.now()};
try{
runHooks(state.before[action],ctx);
for(const h of state.handlers[action]){
let r=null;try{r=h.fn(ctx)}catch(e){console.error('TurnikLifecycle '+action+' handler '+h.name,e);continue}
if(r&&r.handled){ctx.handled=true;ctx.result=r.result;ctx.handler=h.name;break}
}
if(!ctx.handled&&typeof base==='function')ctx.result=base.apply(self,args);
runHooks(state.after[action],ctx);
return ctx.result;
}finally{state.dispatching[action]=false}
}
const dispatchers={
go:function(){return dispatch('go',this,arguments)},
finishRest:function(){return dispatch('finishRest',this,arguments)},
finishWorkout:function(){return dispatch('finishWorkout',this,arguments)}
};
function install(){
if(state.installed)return true;
for(const a of ACTIONS){
if(typeof window[a]!=='function')return false;
state.bases[a]=window[a];
}
for(const a of ACTIONS)window[a]=dispatchers[a];
state.installed=true;return true;
}
function registerHandler(action,name,priority,fn){return state.handlers[action]?put(state.handlers[action],name,priority,fn):false}
function registerBefore(action,name,priority,fn){return state.before[action]?put(state.before[action],name,priority,fn):false}
function registerAfter(action,name,priority,fn){return state.after[action]?put(state.after[action],name,priority,fn):false}
function unregister(action,name){
if(!state.handlers[action])return false;
return !!(remove(state.handlers[action],name)|remove(state.before[action],name)|remove(state.after[action],name));
}
function debug(){
const owners={};for(const a of ACTIONS)owners[a]=state.installed&&window[a]===dispatchers[a];
const lists={};for(const a of ACTIONS)lists[a]={handlers:state.handlers[a].map(x=>x.name),before:state.before[a].map(x=>x.name),after:state.after[a].map(x=>x.name)};
return{version:VERSION,installed:state.installed,owners,actions:lists};
}
window.TurnikLifecycle={version:VERSION,install,registerHandler,registerBefore,registerAfter,unregister,debug};
try{window.dispatchEvent(new CustomEvent('turniklifecycle:ready',{detail:{version:VERSION}}))}catch(e){}
})();