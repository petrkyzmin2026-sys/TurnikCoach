/* TURNIKCOACH_COMPLETION 1.0.0-owner */
(function(){
'use strict';
const VERSION='1.0.0-owner',KEY='tc_completion_undo_v1',TTL=15*60*1000;
if(window.TurnikCompletion&&window.TurnikCompletion.version===VERSION)return;
let adapter=null,installed=false;
function clone(v){try{return JSON.parse(JSON.stringify(v))}catch(e){return null}}
function workout(){try{return adapter&&adapter.getWorkout?adapter.getWorkout():null}catch(e){return null}}
function notice(message,tone){try{if(adapter&&adapter.notice)adapter.notice(message,tone)}catch(e){}}
function clearActive(){try{if(adapter&&adapter.activeWorkout&&typeof adapter.activeWorkout.clear==='function')return adapter.activeWorkout.clear();if(adapter&&adapter.clearActive)return adapter.clearActive()}catch(e){}return false}
function ensureStyle(){
if(document.getElementById('tcCompletionFlowStyle'))return;
const st=document.createElement('style');st.id='tcCompletionFlowStyle';
st.textContent='.tcCompletionStats{display:grid;grid-template-columns:repeat(auto-fit,minmax(92px,1fr));gap:8px;margin:16px 0}.tcCompletionStats div{background:#10171d;border:1px solid #34414d;border-radius:12px;padding:10px 6px;text-align:center;min-width:0}.tcCompletionStats b{display:block;font-size:22px;color:#ffd84d;overflow-wrap:anywhere}.tcCompletionStats span{display:block;margin-top:3px;font-size:10px;color:#9ba6b2;overflow-wrap:anywhere}.tcCompletionRows{max-height:min(38vh,260px);overflow:auto}.tcCompletionRow{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px 12px;padding:8px 2px;border-bottom:1px solid #27313b;font-size:12px}.tcCompletionRow span,.tcCompletionRow b{min-width:0;flex:1 1 140px;overflow-wrap:anywhere}.tcCompletionRow span{color:#c8d0d8}.tcCompletionRow b{text-align:right;color:#fff}';
document.head.appendChild(st);
}
function summary(snapshot,feel){
const items=Array.isArray(snapshot&&snapshot.items)?snapshot.items:[];
let sets=0,total=0;
const rows=items.map(x=>{
const actual=Array.isArray(x.actual)?x.actual:[];
sets+=actual.filter(v=>v!==undefined).length;
total+=actual.reduce((s,v)=>s+(Number.isFinite(+v)?+v:0),0);
return{name:x&&x.e&&x.e.name||'Упражнение',values:actual.map(v=>v===null?'—':(v===undefined?'·':String(v))).join(' · ')};
});
return{mode:String(snapshot&&snapshot.mode||'standard'),exercises:items.length,sets,total,feel:String(feel||''),rows};
}
function show(data){
const sheet=document.getElementById('sheet'),box=document.getElementById('sheetbox');
if(!sheet||!box||!data)return false;
const title=data.mode==='extra'?'Дополнительная тренировка завершена':data.mode==='supplement'?'Дополнительная работа завершена':data.mode==='auxCourse'?'Вспомогательная тренировка завершена':'Тренировка завершена';
const stats='<div class="tcCompletionStats"><div><b>'+data.exercises+'</b><span>упражнения</span></div><div><b>'+data.sets+'</b><span>подходов</span></div><div><b>'+data.total+'</b><span>сумма</span></div></div>';
const rows=data.rows.map(r=>'<div class="tcCompletionRow"><span>'+r.name+'</span><b>'+r.values+'</b></div>').join('');
box.innerHTML='<div class="sheettitle">'+title+'</div><div class="sub" style="margin-top:6px">Результат сохранён'+(data.feel?' · '+data.feel:'')+'.</div>'+stats+'<div class="tcCompletionRows">'+rows+'</div><button id="tcCompletionDoneBtn" type="button" class="btn yellow full" style="margin-top:16px;min-height:58px">Готово</button><button id="tcCompletionUndoBtn" type="button" class="btn ghost full" style="margin-top:8px">Отменить сохранение</button>';
sheet.classList.add('open');
const done=document.getElementById('tcCompletionDoneBtn'),undoBtn=document.getElementById('tcCompletionUndoBtn');
if(done)done.onclick=()=>{if(adapter&&adapter.closeSheet)adapter.closeSheet();else sheet.classList.remove('open')};
if(undoBtn)undoBtn.onclick=undo;
return true;
}
function read(){try{const tx=JSON.parse(localStorage.getItem(KEY)||'null');return tx&&tx.savedAt&&Date.now()-Number(tx.savedAt)<=TTL?tx:null}catch(e){return null}}
function clear(){try{localStorage.removeItem(KEY);return true}catch(e){return false}}
function fingerprint(snapshot){
const a=snapshot&&Array.isArray(snapshot.history)?snapshot.history:[],json=JSON.stringify(a);let h=2166136261;
for(let i=0;i<json.length;i++){h^=json.charCodeAt(i);h=Math.imul(h,16777619)}
return a.length+':'+(h>>>0).toString(16);
}
function signature(){
const store=adapter&&adapter.store;
if(!store||typeof store.sourceSnapshot!=='function')return null;
const generic=store.sourceSnapshot('generic'),course=store.sourceSnapshot('course');
if(!generic||!course)return null;
return{generic:fingerprint(generic),course:fingerprint(course)};
}
function claim(){
try{
Object.defineProperty(window,'tcUndoLastCompletion',{
configurable:true,enumerable:true,
get:()=>undo,
set:value=>{if(value!==undo)console.warn('TurnikCompletion ignored legacy tcUndoLastCompletion overwrite')}
});
return window.tcUndoLastCompletion===undo;
}catch(e){try{window.tcUndoLastCompletion=undo;return window.tcUndoLastCompletion===undo}catch(_){return false}}
}
function undo(){
const tx=read();
if(!tx){notice('Срок быстрой отмены истёк.','danger');return false}
try{
const store=adapter&&adapter.store;
if(!store||typeof store.restoreSnapshots!=='function'||!tx.state||!tx.course){notice('Хранилище тренировки недоступно. История не изменена.','danger');return false}
if(tx.after){const now=signature();if(!now||now.generic!==tx.after.generic||now.course!==tx.after.course){notice('После сохранения история изменилась. Отмена недоступна, новые записи сохранены.','danger');return false}}
if(!store.restoreSnapshots({generic:tx.state,course:tx.course})){notice('Не удалось восстановить историю. Запись отмены сохранена.','danger');return false}
clearActive();clear();
const sheet=document.getElementById('sheet');if(sheet)sheet.classList.remove('open');
if(adapter&&adapter.render)adapter.render();
if(adapter&&adapter.navigate)adapter.navigate('today');
notice('Сохранение тренировки отменено.');return true;
}catch(e){console.error('TurnikCompletion undo',e);notice('Не удалось отменить сохранение.','danger');return false}
}
function install(nextAdapter){
if(nextAdapter&&typeof nextAdapter==='object')adapter=nextAdapter;
if(!adapter)throw new Error('TurnikCompletion adapter required');
if(installed){claim();return true}
const lifecycle=adapter.lifecycle,store=adapter.store;
if(!lifecycle||typeof lifecycle.registerBefore!=='function'||typeof lifecycle.registerAfter!=='function')throw new Error('TurnikCompletion lifecycle unavailable');
if(!store||typeof store.sourceSnapshot!=='function'||typeof store.restoreSnapshots!=='function')throw new Error('TurnikCompletion store unavailable');
ensureStyle();
lifecycle.registerBefore('finishWorkout','completion-owner',10000,ctx=>{
const before=clone(workout());if(!before)return;
ctx.meta.completionOwner={tx:{savedAt:Date.now(),state:store.sourceSnapshot('generic'),course:store.sourceSnapshot('course')},summary:summary(before,ctx.args&&ctx.args[0])};
});
lifecycle.registerAfter('finishWorkout','completion-owner',-10000,ctx=>{
const data=ctx.meta&&ctx.meta.completionOwner;if(!data||workout())return;
data.tx.after=signature();
if(data.tx.state&&data.tx.course&&data.tx.after)try{localStorage.setItem(KEY,JSON.stringify(data.tx))}catch(e){}
clearActive();setTimeout(()=>show(data.summary),0);
});
if(!claim())throw new Error('TurnikCompletion compatibility API claim failed');
installed=true;return true;
}
function debug(){return{version:VERSION,installed,key:KEY,ttl:TTL,hasUndo:!!read(),singleOwner:installed&&window.tcUndoLastCompletion===undo}}
window.TurnikCompletion={version:VERSION,install,summary,show,read,clear,undo,signature,debug};
try{window.dispatchEvent(new CustomEvent('turnikcompletion:ready',{detail:{version:VERSION}}))}catch(e){}
})();