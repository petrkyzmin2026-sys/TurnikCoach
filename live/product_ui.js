/* TURNIKCOACH_PRODUCT_UI 1.0.0-owner */
(function(){
'use strict';
const VERSION='1.0.0-owner';
if(window.TurnikProductUI&&window.TurnikProductUI.version===VERSION)return;
let adapter={},installed=false,observer=null,queued=false;
function call(name,args,def){
try{
const fn=adapter&&adapter[name];
if(typeof fn==='function')return fn.apply(null,args||[]);
const globalFn=window[name];
if(typeof globalFn==='function')return globalFn.apply(window,args||[]);
}catch(e){console.error('TurnikProductUI '+name,e)}
return def;
}
function workout(){try{return adapter.getWorkout?adapter.getWorkout():window.W||null}catch(e){return null}}
function appState(){try{return adapter.getState?adapter.getState():window.state||null}catch(e){return null}}
function injectStyles(){
if(document.getElementById('tcProductStyles'))return;
const st=document.createElement('style');st.id='tcProductStyles';
st.textContent='.exerciseModel{display:none!important}#restWhy{display:none!important}.mediaFallback{display:none!important}.tcInfoBtn{width:48px;height:48px;min-width:48px;border-radius:50%;border:1px solid rgba(255,255,255,.28);background:rgba(13,20,27,.82);color:#ffd84d;font-size:22px;font-weight:950;display:grid;place-items:center;padding:0;box-shadow:0 5px 18px rgba(0,0,0,.22);touch-action:manipulation}.tcInfoBtn:active{transform:scale(.96)}.tcInfoBlock{margin-top:12px;padding:12px 13px;border-radius:14px;background:#111920;border:1px solid #2c3945}.tcInfoBlock h3{font-size:14px;margin:0 0 7px;color:#fff}.tcInfoBlock p{font-size:12px;line-height:1.48;color:#c2ccd5;margin:0}.tcInfoBlock b{color:#fff}.tcInfoPlan{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.tcInfoPlan span{padding:5px 8px;border-radius:9px;background:#202a32;border:1px solid #35434f;color:#f6f7f8;font-size:11px;font-weight:850}#rest .rest{position:relative}#rest .tcInfoBtn{position:absolute;right:92px;top:12px}';
document.head.appendChild(st);
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
function planExplanation(e,s,plan){
const max=e?Math.max(1,+e.max||1):0,focus=sessionFocus(s),p=Array.isArray(plan)?plan:[],total=p.reduce((a,b)=>a+(+b||0),0),unit=call('unitShort',[e],'')||'';
let text='Текущая тренировка: <b>'+focus+'</b>. ';
if(max)text+='Последний контрольный максимум: <b>'+max+' '+unit+'</b>. ';
if(p.length)text+='Назначено <b>'+p.length+' подхода</b>, суммарный план — <b>'+total+' '+unit+'</b>. ';
return text+'Подходы рассчитываются от текущего результата так, чтобы не превращать каждый сет в контрольный максимум. Цель — выполнить заданную работу технически стабильно и сохранить качество последующих подходов.';
}
function restExplanation(e,s){
const base=e?call('restSeconds',[e,s],null):null;
let text='Отдых не является фиксированным таймером для всех упражнений. ';
if(base!=null)text+='Для этого упражнения базовый ориентир сейчас — <b>'+base+' с</b>. ';
text+='После подхода приложение учитывает его относительную тяжесть и фактическое выполнение: при заметном недовыполнении даёт больше времени, при лёгком подходе может сократить восстановление. Переход между упражнениями рассчитывается отдельно.';
if(window.__tcLastRestNote)text+='<br><br><b>Последний расчёт:</b> '+window.__tcLastRestNote;
return text;
}
function conceptHtml(e,s,plan){
const hint=e?(call('progressionHint',[e],'')||''):'';
return '<div class="sheettitle">О тренировке</div><div class="sub" style="margin-top:5px">Здесь показана логика программы. На рабочем экране остаются только действия, нужные во время подхода.</div>'+
'<div class="tcInfoBlock"><h3>Концепция цикла</h3><p>Цикл состоит из <b>трёх тренировок</b> с разным акцентом: объём → сила / техника → интенсивность. После третьей тренировки идёт <b>контрольный максимум</b>. Новый результат становится исходной точкой следующего цикла. Конкретные числа подходов, повторов и отдыха рассчитывает TurnikCoach по текущему максимуму и типу упражнения.</p></div>'+
'<div class="tcInfoBlock"><h3>Текущее упражнение</h3><p><b>'+(e?e.name:'Тренировка')+'</b><br>'+exerciseConcept(e)+'</p>'+(plan&&plan.length?'<div class="tcInfoPlan">'+plan.map(x=>'<span>'+x+'</span>').join('')+'</div>':'')+'</div>'+
'<div class="tcInfoBlock"><h3>Почему такой план</h3><p>'+planExplanation(e,s,plan)+'</p></div>'+
'<div class="tcInfoBlock"><h3>Почему такой отдых</h3><p>'+restExplanation(e,s)+'</p></div>'+
(hint?'<div class="tcInfoBlock"><h3>Следующий шаг</h3><p>'+hint+'</p></div>':'')+
'<button class="btn yellow full" style="margin-top:14px" onclick="closeSheet()">Понятно</button>';
}
function openTrainingInfo(){
let e=null,s=((appState()||{}).seq||0)%3,plan=[],w=workout();
if(w&&w.items&&w.items.length){
s=w.sessionIndex;const item=w.items[w.exerciseIndex];if(item){e=item.e;plan=item.plan||[]}
}else{
const cur=call('currentSession',[],null);if(cur){s=cur.index;if(cur.items&&cur.items[0]){e=cur.items[0].e;plan=cur.items[0].plan||[]}}
}
const box=document.getElementById('sheetbox'),sheet=document.getElementById('sheet');if(!box||!sheet)return false;
box.innerHTML=conceptHtml(e,s,plan);sheet.classList.add('open');return true;
}
function removeTechnicalCopy(){
document.querySelectorAll('.exerciseModel').forEach(el=>el.remove());
document.querySelectorAll('.info').forEach(el=>{const t=(el.textContent||'').trim();if(t.includes('Нагрузка теперь рассчитывается не одной формулой')||t.includes('Адаптивная схема:')||t.includes('каждое упражнение рассчитывается своим движком'))el.remove()});
const hs=document.querySelector('#historyScreen .head .sub');if(hs)hs.textContent='Тренировки, фактический объём и контрольные максимумы.';
const fb=document.getElementById('mediaFallback');if(fb)fb.style.display='none';
const rw=document.getElementById('restWhy');if(rw)rw.style.display='none';
}
function addInfoButton(host,before){
if(!host||host.querySelector('.tcInfoBtn'))return false;
const b=document.createElement('button');b.type='button';b.className='tcInfoBtn';b.textContent='ⓘ';b.title='О тренировке';b.onclick=openTrainingInfo;
if(before)host.insertBefore(b,before);else host.appendChild(b);return true;
}
function addInfoButtons(){
const today=document.querySelector('#today.screen.on .todayCard .row.between');addInfoButton(today,null);
const wh=document.querySelector('#workout.screen.on .stageHeader .row.between, #workout.screen.on .wtop .row.between');addInfoButton(wh,wh&&wh.querySelector('.endBtn'));
const rest=document.querySelector('#rest.screen.on .rest');addInfoButton(rest,null);
}
function decorate(){removeTechnicalCopy();addInfoButtons();queued=false}
function queueDecorate(){if(queued)return;queued=true;setTimeout(decorate,0)}
function install(nextAdapter){
if(nextAdapter&&typeof nextAdapter==='object')adapter=nextAdapter;
if(installed&&window.tcOpenTrainingInfo===openTrainingInfo)return true;
if(window.__tcOriginalMediaFor==null&&typeof window.mediaFor==='function')window.__tcOriginalMediaFor=window.mediaFor;
if(window.__tcOriginalFocusText==null&&typeof window.focusText==='function')window.__tcOriginalFocusText=window.focusText;
if(typeof window.mediaFor==='function')window.mediaFor=function(){return''};
if(typeof window.focusText==='function')window.focusText=function(){return''};
injectStyles();window.tcOpenTrainingInfo=openTrainingInfo;
if(window.TurnikNavigation&&typeof window.TurnikNavigation.registerAfter==='function')window.TurnikNavigation.registerAfter('product-ui',50,queueDecorate);
if(window.TurnikUI&&typeof window.TurnikUI.register==='function'){
window.TurnikUI.register('today','*',10000,()=>{queueDecorate();return false});
window.TurnikUI.register('plan','*',10000,()=>{queueDecorate();return false});
}
if(window.TurnikWorkoutUI&&typeof window.TurnikWorkoutUI.registerAfter==='function')window.TurnikWorkoutUI.registerAfter('product-ui',50,queueDecorate);
if(observer)try{observer.disconnect()}catch(e){}
const app=document.getElementById('app');
if(app&&typeof MutationObserver==='function'){observer=new MutationObserver(queueDecorate);observer.observe(app,{childList:true,subtree:true});window.__tcProductObserver=observer}
queueDecorate();installed=true;return true;
}
function debug(){return{version:VERSION,installed,singleOwner:installed&&window.tcOpenTrainingInfo===openTrainingInfo,observer:!!observer}}
window.TurnikProductUI={version:VERSION,install,openTrainingInfo,decorate,queueDecorate,debug};
try{window.dispatchEvent(new CustomEvent('turnikproductui:ready',{detail:{version:VERSION}}))}catch(e){}
})();