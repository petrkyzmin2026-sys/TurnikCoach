/* TURNIKCOACH_INFO 1.0.0-owner */
(function(){
'use strict';
const VERSION='1.0.0-owner';
if(window.TurnikInfo&&window.TurnikInfo.version===VERSION)return;
let adapter=null,installed=false,queued=false;
const providers=[];
function getWorkout(){try{return adapter&&adapter.getWorkout?adapter.getWorkout():null}catch(e){return null}}
function getState(){try{return adapter&&adapter.getState?adapter.getState():null}catch(e){return null}}
function call(name,args,fb){
try{const fn=adapter&&adapter[name];return typeof fn==='function'?fn.apply(null,args||[]):fb}catch(e){return fb}
}
function injectStyles(){
if(document.getElementById('tcProductStyles'))return;
const st=document.createElement('style');st.id='tcProductStyles';
st.textContent=
'.exerciseModel{display:none!important}'+
'#restWhy{display:none!important}'+
'.mediaFallback{display:none!important}'+
'.tcInfoBtn{width:48px;height:48px;min-width:48px;border-radius:50%;border:1px solid rgba(255,255,255,.28);background:rgba(13,20,27,.82);color:#ffd84d;font-size:22px;font-weight:950;display:grid;place-items:center;padding:0;box-shadow:0 5px 18px rgba(0,0,0,.22);touch-action:manipulation}'+
'.tcInfoBtn:active{transform:scale(.96)}'+
'.tcInfoBlock{margin-top:12px;padding:12px 13px;border-radius:14px;background:#111920;border:1px solid #2c3945}'+
'.tcInfoBlock h3{font-size:14px;margin:0 0 7px;color:#fff}'+
'.tcInfoBlock p{font-size:12px;line-height:1.48;color:#c2ccd5;margin:0}'+
'.tcInfoBlock b{color:#fff}'+
'.tcInfoPlan{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}'+
'.tcInfoPlan span{padding:5px 8px;border-radius:9px;background:#202a32;border:1px solid #35434f;color:#f6f7f8;font-size:11px;font-weight:850}'+
'#rest .rest{position:relative}'+
'#rest .tcInfoBtn{position:absolute;right:92px;top:12px}';
document.head.appendChild(st);
}
function disableLegacyMedia(){
try{
if(typeof window.mediaFor==='function'){
window.__tcOriginalMediaFor=window.__tcOriginalMediaFor||window.mediaFor;
window.mediaFor=function(){return''};
}
}catch(e){}
try{
if(typeof window.focusText==='function'){
window.__tcOriginalFocusText=window.__tcOriginalFocusText||window.focusText;
window.focusText=function(){return''};
}
}catch(e){}
}
function sessionFocus(s){return['Объём','Сила / техника','Интенсивность'][(+s||0)%3]}
function exerciseConcept(e){
if(!e)return'Нагрузка подбирается по текущему уровню и месту упражнения в цикле.';
const m=call('modelFor',[e],{})||{};
if(m.engine==='pull')return'Основное тяговое движение. План строится от контрольного максимума и чередует объём, силовой акцент и более интенсивную работу.';
if(m.engine==='weighted')return'Силовая тяговая работа с дополнительным весом. Повторы держатся ниже максимума, чтобы сохранять качество и запас между подходами.';
if(m.engine==='core')return'Работа на кор. Цель — набирать качественный объём без бесконечного увеличения повторов; после освоения диапазона усложняется вариация.';
if(m.engine==='static')return'Статическая работа. Прогресс оценивается по времени качественного удержания, затем — по переходу к более сложной вариации.';
if(m.engine==='staticSkill')return'Статический элемент. Важнее качество положения тела и контроль, чем любой ценой продлевать удержание.';
if(m.engine==='skill')return'Сложный навык. Подходы намеренно короче отказных: приоритет — чистая техника и повторяемость движения.';
return'Базовое силовое движение. Объём и интенсивность меняются по трём тренировкам цикла, чтобы одна и та же нагрузка не повторялась постоянно.';
}
function unitShort(e){return call('unitShort',[e],'повт.')}
function planExplanation(e,s,plan){
const max=e?Math.max(1,+e.max||1):0,focus=sessionFocus(s),p=Array.isArray(plan)?plan:[],total=p.reduce((a,b)=>a+(+b||0),0);
let text='Текущая тренировка: <b>'+focus+'</b>. ';
if(max)text+='Последний контрольный максимум: <b>'+max+' '+unitShort(e)+'</b>. ';
if(p.length)text+='Назначено <b>'+p.length+' подхода</b>, суммарный план — <b>'+total+' '+unitShort(e)+'</b>. ';
return text+'Подходы рассчитываются от текущего результата так, чтобы не превращать каждый сет в контрольный максимум. Цель — выполнить заданную работу технически стабильно и сохранить качество последующих подходов.';
}
function restExplanation(e,s){
const base=call('restSeconds',[e,s],null);
let text='Отдых не является фиксированным таймером для всех упражнений. ';
if(base!=null)text+='Для этого упражнения базовый ориентир сейчас — <b>'+base+' с</b>. ';
text+='После подхода приложение учитывает его относительную тяжесть и фактическое выполнение: при заметном недовыполнении даёт больше времени, при лёгком подходе может сократить восстановление. Переход между упражнениями рассчитывается отдельно.';
const note=call('lastRestNote',[],String(window.__tcLastRestNote||''));
if(note)text+='<br><br><b>Последний расчёт:</b> '+note;
return text;
}
function conceptHtml(e,s,plan){
const hint=e?call('progressionHint',[e],''):'';
return '<div class="sheettitle">О тренировке</div>'+
'<div class="sub" style="margin-top:5px">Здесь показана логика программы. На рабочем экране остаются только действия, нужные во время подхода.</div>'+
'<div class="tcInfoBlock"><h3>Концепция цикла</h3><p>Цикл состоит из <b>трёх тренировок</b> с разным акцентом: объём → сила / техника → интенсивность. После третьей тренировки идёт <b>контрольный максимум</b>. Новый результат становится исходной точкой следующего цикла. Конкретные числа подходов, повторов и отдыха рассчитывает TurnikCoach по текущему максимуму и типу упражнения.</p></div>'+
'<div class="tcInfoBlock"><h3>Текущее упражнение</h3><p><b>'+(e?e.name:'Тренировка')+'</b><br>'+exerciseConcept(e)+'</p>'+(plan&&plan.length?'<div class="tcInfoPlan">'+plan.map(x=>'<span>'+x+'</span>').join('')+'</div>':'')+'</div>'+
'<div class="tcInfoBlock"><h3>Почему такой план</h3><p>'+planExplanation(e,s,plan)+'</p></div>'+
'<div class="tcInfoBlock"><h3>Почему такой отдых</h3><p>'+restExplanation(e,s)+'</p></div>'+
(hint?'<div class="tcInfoBlock"><h3>Следующий шаг</h3><p>'+hint+'</p></div>':'')+
'<button class="btn yellow full" style="margin-top:14px" onclick="closeSheet()">Понятно</button>';
}
function currentContext(){
const state=getState()||{},w=getWorkout();let e=null,s=Number(state.seq||0)%3,plan=[];
if(w&&Array.isArray(w.items)&&w.items.length){
s=w.sessionIndex;
const item=w.items[w.exerciseIndex];if(item){e=item.e;plan=item.plan||[]}
}else{
const cur=call('currentSession',[],null);
if(cur){s=cur.index;if(cur.items&&cur.items[0]){e=cur.items[0].e;plan=cur.items[0].plan||[]}}
}
return{e,s,plan};
}
function registerProvider(name,priority,match,openFn){
if(!name||typeof match!=='function'||typeof openFn!=='function')return false;
const next={name:String(name),priority:Number(priority)||0,match,open:openFn},i=providers.findIndex(x=>x.name===next.name);
if(i>=0)providers.splice(i,1,next);else providers.push(next);
providers.sort((a,b)=>b.priority-a.priority||a.name.localeCompare(b.name));return true;
}
function unregisterProvider(name){const i=providers.findIndex(x=>x.name===String(name));if(i<0)return false;providers.splice(i,1);return true}
function open(){
const c=currentContext();
for(const p of providers){try{if(p.match(c)){const r=p.open(c);if(r!==false)return true}}catch(e){console.error('TurnikInfo provider '+p.name,e)}}
const box=document.getElementById('sheetbox'),sheet=document.getElementById('sheet');
if(!box||!sheet)return false;
box.innerHTML=conceptHtml(c.e,c.s,c.plan);sheet.classList.add('open');return true;
}
function removeTechnicalCopy(){
document.querySelectorAll('.exerciseModel').forEach(el=>el.remove());
document.querySelectorAll('.info').forEach(el=>{
const t=(el.textContent||'').trim();
if(t.includes('Нагрузка теперь рассчитывается не одной формулой')||t.includes('Адаптивная схема:')||t.includes('каждое упражнение рассчитывается своим движком'))el.remove();
});
const hs=document.querySelector('#historyScreen .head .sub');if(hs)hs.textContent='Тренировки, фактический объём и контрольные максимумы.';
const fb=document.getElementById('mediaFallback');if(fb)fb.style.display='none';
const rw=document.getElementById('restWhy');if(rw)rw.style.display='none';
}
function makeInfoButton(){
const b=document.createElement('button');b.type='button';b.className='tcInfoBtn';b.textContent='ⓘ';b.title='О тренировке';b.onclick=open;return b;
}
function addButtons(){
const today=document.querySelector('#today.screen.on .todayCard .row.between');
if(today&&!today.querySelector('.tcInfoBtn'))today.appendChild(makeInfoButton());
const wh=document.querySelector('#workout.screen.on .stageHeader .row.between, #workout.screen.on .wtop .row.between');
if(wh&&!wh.querySelector('.tcInfoBtn')){const end=wh.querySelector('.endBtn'),b=makeInfoButton();if(end)wh.insertBefore(b,end);else wh.appendChild(b)}
const rest=document.querySelector('#rest.screen.on .rest');
if(rest&&!rest.querySelector('.tcInfoBtn'))rest.appendChild(makeInfoButton());
}
function decorate(){queued=false;removeTechnicalCopy();addButtons()}
function queue(){if(queued)return;queued=true;setTimeout(decorate,0)}
function install(nextAdapter){
if(nextAdapter&&typeof nextAdapter==='object')adapter=nextAdapter;
if(!adapter)throw new Error('TurnikInfo adapter required');
if(installed)return true;
if(window.__tcProductObserver)try{window.__tcProductObserver.disconnect()}catch(e){}
window.__tcProductObserver=null;
injectStyles();disableLegacyMedia();
const nav=adapter.navigation,ui=adapter.ui,workoutUi=adapter.workoutUi,rest=adapter.rest;
if(!nav||typeof nav.registerAfter!=='function')throw new Error('TurnikInfo navigation unavailable');
if(!ui||typeof ui.register!=='function')throw new Error('TurnikInfo UI unavailable');
if(!workoutUi||typeof workoutUi.registerAfter!=='function')throw new Error('TurnikInfo workout UI unavailable');
nav.registerAfter('training-info',50,queue);
workoutUi.registerAfter('training-info',40,queue);
for(const area of ['today','plan','progress'])ui.register(area,'*',9000,()=>{queue();return false});
if(rest&&typeof rest.onChange==='function')rest.onChange(queue);
window.tcOpenTrainingInfo=open;
installed=true;queue();return true;
}
function debug(){return{version:VERSION,installed,singleOwner:installed&&window.tcOpenTrainingInfo===open,observerFree:!window.__tcProductObserver,providers:providers.map(x=>x.name)}}
window.TurnikInfo={version:VERSION,install,open,decorate,queue,registerProvider,unregisterProvider,debug};
try{window.dispatchEvent(new CustomEvent('turnikinfo:ready',{detail:{version:VERSION}}))}catch(e){}
})();