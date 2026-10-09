/* TURNIKCOACH_REST_SESSION 1.0.0-owner */
(function(){
'use strict';
const VERSION='1.0.0-owner';
if(window.TurnikRestSession&&window.TurnikRestSession.version===VERSION)return;
let active=false,end=0,timer=null,signals=new Set();
function setLegacyRemaining(v){try{R=v}catch(e){}}
function clearTimer(){
if(timer){clearInterval(timer);timer=null}
try{if(typeof rt!=='undefined'&&rt){clearInterval(rt);rt=null}}catch(e){}
}
function setTimer(){
clearTimer();timer=setInterval(render,250);try{if(typeof rt!=='undefined')rt=timer}catch(e){}
}
function reasonEl(){
let el=document.getElementById('restWhy');if(el)return el;
const ring=document.getElementById('restNum');
if(!ring||!ring.parentNode)return null;
el=document.createElement('div');el.id='restWhy';el.className='sub';
el.style.cssText='max-width:360px;text-align:center;margin:10px 0 0;line-height:1.35';
el.textContent='Отдых рассчитывается по нагрузке и факту предыдущего подхода';
ring.parentNode.insertBefore(el,ring);return el;
}
function nextStepText(){
try{
if(typeof W==='undefined'||!W||!Array.isArray(W.items)||!W.items.length)return'';
const x=W.items[W.exerciseIndex],e=x&&x.e;if(!x||!e)return'';
const raw=x.planLabels&&x.planLabels[W.setIndex]!=null?x.planLabels[W.setIndex]:
x.plan&&x.plan[W.setIndex]!=null?x.plan[W.setIndex]:W.actual;
const unit=e.metric==='time'||e.id==='plank'?'сек':e.metric==='weighted'?'кг':'повт.';
return'Следующий подход · '+e.name+(raw!=null?' · '+raw+' '+unit:'');
}catch(e){return''}
}
function updateNextStep(){const sub=document.querySelector('#rest .rest .sub'),text=nextStepText();if(sub&&text)sub.textContent=text}
function finishSignal(){try{if(typeof window.tcFinishSignal==='function')window.tcFinishSignal()}catch(e){}}
function countdownSignal(){try{if(typeof window.beep==='function')window.beep(1120,.16,.42)}catch(e){}}
function render(){
if(!active||!end)return false;
const left=Math.max(0,Math.ceil((end-Date.now())/1000));setLegacyRemaining(left);
const el=document.getElementById('restNum');if(el)el.textContent=left;
if(left>0&&left<=3&&!signals.has(left)){signals.add(left);countdownSignal()}
if(left<=0){
active=false;end=0;clearTimer();finishSignal();
if(typeof window.finishRest==='function')window.finishRest();
}
return true;
}
function cleanup(){
active=false;end=0;signals.clear();clearTimer();return true;
}
function start(sec,note){
sec=Math.max(0,Math.round(+sec||0));
const el=reasonEl();
window.__tcLastRestNote=note||'Отдых рассчитан по нагрузке и факту предыдущего подхода';
if(el){el.textContent=window.__tcLastRestNote;el.style.display='none'}
try{if(typeof window.tcPrimeAudio==='function')window.tcPrimeAudio()}catch(e){}
active=true;end=Date.now()+sec*1000;signals.clear();setLegacyRemaining(sec);
const ring=document.getElementById('restNum');if(ring)ring.textContent=sec;
if(typeof go==='function')go('rest');updateNextStep();setTimer();render();return true;
}
function add(){
if(active&&end){end+=30000;signals.clear();render()}
else{
let next=30;try{next=(+R||0)+30;R=next}catch(e){}
const ring=document.getElementById('restNum');if(ring)ring.textContent=next;
}
const el=reasonEl();if(el&&!/добавлено вручную/.test(el.textContent))el.textContent+=' · добавлено вручную +30 с';
return true;
}
function snapshot(){return{active:!!active,end:+end||0,note:String(window.__tcLastRestNote||'')}}
function restore(rest){
cleanup();const r=rest&&typeof rest==='object'?rest:{};
active=!!r.active;end=+r.end||0;window.__tcLastRestNote=String(r.note||'');
if(!active||!end)return false;
setLegacyRemaining(Math.max(0,Math.ceil((end-Date.now())/1000)));
const ring=document.getElementById('restNum');if(ring)ring.textContent=typeof R!=='undefined'?R:'';
if(typeof go==='function')go('rest');updateNextStep();setTimer();render();return true;
}
function resume(){if(active)render()}
function install(){
const lifecycle=window.TurnikWorkoutLifecycle;
if(!lifecycle||typeof lifecycle.registerBefore!=='function')return false;
lifecycle.registerBefore('finishRest','rest-session-cleanup',10000,cleanup);
window.startRest=start;window.addRest=add;
document.addEventListener('visibilitychange',resume);
window.addEventListener('focus',resume);window.addEventListener('pageshow',resume);
reasonEl();return true;
}
if(!install())throw new Error('TurnikCoach RestSession lifecycle unavailable');
window.TurnikRestSession={
version:VERSION,start,add,render,cleanup,snapshot,restore,resume,ensureReasonEl:reasonEl,
debug(){return{version:VERSION,owner:'rest-session',active:!!active,end:+end||0,timer:!!timer}}
};
try{window.dispatchEvent(new CustomEvent('turnikrestsession:ready',{detail:{version:VERSION}}))}catch(e){}
})();