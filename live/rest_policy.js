/* TURNIKCOACH_REST_POLICY 1.0.0-owner */
(function(){
'use strict';
const VERSION='1.0.0-owner';
if(window.TurnikRestPolicy&&window.TurnikRestPolicy.version===VERSION)return;
let adapter=null,installed=false;
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function baseSeconds(e,sessionIndex){
if(!adapter||typeof adapter.baseSeconds!=='function')throw new Error('TurnikRestPolicy baseSeconds adapter unavailable');
return Math.max(0,+adapter.baseSeconds(e,sessionIndex)||0);
}
function adaptive(e,sessionIndex,target,actual,skipped){
const base=baseSeconds(e,sessionIndex);
const max=Math.max(1,+e.max||1),plan=Math.max(1,+target||1);
let delta=0;const notes=[],intensity=plan/max;
if(intensity>=.80){delta+=30;notes.push('тяжёлый подход +30 с')}
else if(intensity>=.70){delta+=15;notes.push('высокая интенсивность +15 с')}
else if(intensity<=.50){delta-=15;notes.push('лёгкая интенсивность −15 с')}
if(skipped||actual===null||actual===undefined){
delta+=45;notes.push('подход пропущен +45 с');
}else{
const ratio=(+actual||0)/plan;
if(ratio<.75){delta+=45;notes.push('выполнено <75% плана +45 с')}
else if(ratio<.90){delta+=30;notes.push('выполнено <90% плана +30 с')}
else if(ratio>1.20){delta-=15;notes.push('план заметно перевыполнен −15 с')}
}
const seconds=clamp(Math.round((base+delta)/15)*15,45,240);
return{seconds,note:(e&&e.name?e.name:'Упражнение')+': база '+base+' с'+(notes.length?' · '+notes.join(' · '):' · выполнено по плану')+' → '+seconds+' с'};
}
function transition(prevE,nextE,sessionIndex,target,actual,skipped){
const prev=adaptive(prevE,sessionIndex,target,actual,skipped);
const nextBase=baseSeconds(nextE,sessionIndex);
const seconds=clamp(Math.max(prev.seconds,nextBase,90)+15,60,240);
return{seconds,note:'Переход к «'+(nextE&&nextE.name?nextE.name:'следующему упражнению')+'»: '+seconds+' с · учтены предыдущий подход и нагрузка следующего упражнения'};
}
function install(nextAdapter){
if(nextAdapter&&typeof nextAdapter==='object')adapter=nextAdapter;
if(!adapter||typeof adapter.baseSeconds!=='function')return false;
window.adaptiveRest=adaptive;window.transitionRest=transition;installed=true;return true;
}
function debug(){return{version:VERSION,installed,adapterReady:!!(adapter&&typeof adapter.baseSeconds==='function'),singleOwner:installed&&window.adaptiveRest===adaptive&&window.transitionRest===transition}}
window.TurnikRestPolicy={version:VERSION,install,adaptive,transition,debug};
try{window.dispatchEvent(new CustomEvent('turnikrestpolicy:ready',{detail:{version:VERSION}}))}catch(e){}
})();