/* TURNIKCOACH_COURSE_UI 1.0.0 */
(function(){
'use strict';
const VERSION='1.0.0';
if(window.TurnikCourseUI&&window.TurnikCourseUI.version===VERSION)return;
let a=null,registered=false;
function configure(adapter){
if(!adapter||typeof adapter!=='object')return false;
const required=['enabled','q','fmtDate','dateFromKey','fmtKeyDate','fmtRecordDate','weeklyCalendarHtml',
'previewCourseCard','todayCourseDoneHtml','bindTodayDoneActions','queueDecorate','courseTestCard',
'pendingLevelHtml','masteryCardHtml','recoveryShiftCardHtml','transferCardHtml','noEquipmentCard',
'calibrationCard','workingWeightCard','equipmentMasteryNote','courseRowsHtml','adaptationNote','extraRowsHtml',
'auxCardHtml','supplementHtml','courseControlStatusHtml','expandExerciseTouchTargets','disableUnavailableCatalog',
'collapseExtraCatalog'];
if(required.some(k=>typeof adapter[k]!=='function'))return false;
a=adapter;return true;
}
function weekHtml(){return '<div class="tcWeekSection"><div class="tcWeekSectionTitle">ПЛАН НЕДЕЛИ</div>'+a.weeklyCalendarHtml()+'</div>'}
function planCardHtml(p){
const enabled=!!p.enabled;
return '<div class="card" id="tcCourseCard" style="margin-bottom:12px;border-color:'+(enabled?'#ffd84d':'#2c3945')+'">'+
'<div class="row between"><div class="grow"><div class="k">ПРОГРАММА</div><div class="strong" style="font-size:18px;margin-top:3px">Курс Морозова</div><div class="meta">«Подтягивания с нуля до киборга»</div></div><span class="tag '+(enabled?'':'stage4')+'">'+(enabled?'ВКЛЮЧЁН':'ВЫКЛЮЧЕН')+'</span></div>'+
(enabled?'<div class="tcInfoBlock"><h3>Оборудование: только турник</h3><p>В тренировочный план не включаются упражнения, требующие резины, отягощения, полотенца, стула или низкой перекладины.</p></div><div class="tcInfoBlock"><h3>'+p.levelTitle+'</h3><p><b>Цель:</b> '+p.goalName+'<br><b>Следующий:</b> '+p.nextComplexName+'<br><b>Текущий максимум:</b> '+p.pullMax+'<br><b>Частота по курсу:</b> '+p.frequency+'</p></div>':'<div class="sub" style="margin-top:10px">Отдельная система тренировок: уровни, комплексы, проценты, MAX, отдых и контрольные критерии берутся из курса. Остальные упражнения TurnikCoach можно использовать отдельно.</div>')+
'<button class="btn yellow full" style="margin-top:12px" onclick="tcOpenCourseProgram()">Программа курса</button>'+
'<button class="btn ghost full" style="margin-top:8px" onclick="tcOpenCourseSettings()">'+(enabled?'Настройки курса':'Подключить курс')+'</button></div>';
}
function renderPlan(view){
const host=a.q('exerciseList');if(!host)return false;
a.expandExerciseTouchTargets(host);
a.disableUnavailableCatalog(host);
const old=document.getElementById('tcCourseCard');if(old)old.remove();
const oldDetails=document.getElementById('tcExtrasDetails');
if(oldDetails&&oldDetails.parentNode===host){
const body=oldDetails.querySelector('.tcExtrasBody');
if(body)[...body.children].forEach(n=>host.appendChild(n));
oldDetails.remove();
}
host.insertAdjacentHTML('afterbegin',planCardHtml(view));
const head=document.querySelector('#exercise .head .sub');
if(head)head.textContent=view.enabled?'Подтягивания ведёт отдельный курс Морозова. Дополнительные упражнения ниже свернуты и не вмешиваются в структуру курса.':'Можно использовать обычный конструктор либо подключить отдельный курс Морозова для подтягиваний.';
if(view.enabled){
host.querySelectorAll('.catalogGroup').forEach(g=>{
const name=g.querySelector('.catalogHead .strong');
if(name&&(name.textContent||'').trim()==='Турник')g.style.display='none';
});
const summary=host.querySelector('.catalogSummary .meta');
if(summary)summary.textContent='Дополнительные упражнения TurnikCoach. Тяговая часть курса рассчитывается отдельно.';
a.collapseExtraCatalog(host);
}
return true;
}
function renderToday(view){
if(!view)return false;
const now=new Date(),week=weekHtml();
a.q('todayTitle').textContent=a.fmtDate(now);
if(view.kind==='PREVIEW'){
a.q('todayTitle').textContent=a.fmtDate(a.dateFromKey(view.date));
a.q('todaySub').textContent='Просмотр плана';
a.q('todayList').innerHTML=a.previewCourseCard(view.date)+week;
return true;
}
if(view.kind==='COURSE_DONE'){
a.q('todaySub').textContent='Основная тренировка выполнена';
a.q('todayList').innerHTML=a.todayCourseDoneHtml(view.extras)+week;
a.bindTodayDoneActions();a.queueDecorate();return true;
}
if(view.kind==='COURSE_TEST'){a.q('todaySub').textContent='Сегодня · контроль прогресса';a.q('todayList').innerHTML=a.courseTestCard()+week;return true}
if(view.kind==='MASTERY_TEST'){a.q('todaySub').textContent='Сегодня · контроль уровня';a.q('todayList').innerHTML=a.pendingLevelHtml()+a.masteryCardHtml()+week;return true}
if(view.kind==='RECOVERY_SHIFT'){a.q('todaySub').textContent='Сегодня · восстановление';a.q('todayList').innerHTML=a.recoveryShiftCardHtml()+week;a.queueDecorate();return true}
if(view.kind==='TRANSFER'||view.kind==='TRANSFER_RECOVERY'){
a.q('todaySub').textContent=view.kind==='TRANSFER'?'Сегодня · перенос основной тренировки':'Сегодня · восстановление';
a.q('todayList').innerHTML=a.transferCardHtml(view.transfer)+week;a.queueDecorate();return true;
}
if(view.kind==='ADVANCED_SETUP'){
a.q('todaySub').textContent='Сегодня · подготовка тренировки';
a.q('todayList').innerHTML='<div class="todayCard"><div class="dateBig">Выберите два вспомогательных упражнения</div><div class="meta">Это нужно один раз для комплекса 7-го уровня.</div><button class="btn yellow full" style="margin-top:12px" onclick="tcOpenAdvancedChoiceSheet()">Выбрать упражнения</button></div>'+week;
return true;
}
if(view.kind==='EQUIPMENT_SETUP'){a.q('todaySub').textContent='Сегодня · требуется настройка оборудования';a.q('todayList').innerHTML=a.noEquipmentCard(view.defs)+week;return true}
if(view.kind==='CALIBRATION'){a.q('todaySub').textContent='Сегодня · требуется контрольный максимум';a.q('todayList').innerHTML=a.calibrationCard('main')+week;return true}
if(view.kind==='WORKING_WEIGHT'){a.q('todaySub').textContent='Сегодня · требуется рабочий вес';a.q('todayList').innerHTML=a.workingWeightCard('main')+week;return true}
if(view.kind==='MAIN_WORKOUT'){
a.q('todaySub').textContent='Сегодня · основная тренировка';
a.q('todayList').innerHTML=a.pendingLevelHtml()+a.equipmentMasteryNote()+
'<div class="todayCard tcTodayPrimaryCard"><div class="row between"><div class="grow"><div class="dateBig">'+view.complexName+'</div><div class="tcTodayPrimaryMeta">'+view.items.length+
' упражн. · '+view.totalSets+' подходов · '+view.levelTitle+'</div></div><span class="tag">КУРС</span></div>'+
'<button class="btn yellow full" style="margin-top:14px;min-height:58px" onclick="tcStartCourseWorkout()">'+(view.adapted?'Начать адаптированную тренировку':'Начать тренировку')+
'</button><details class="tcTodayPlanDetails"><summary>Посмотреть план</summary><div class="tcTodayPlanBody">'+a.courseRowsHtml(view.items)+a.adaptationNote(view.defs)+
'<button class="btn ghost full" style="margin-top:8px" onclick="tcOpenCourseInfo()">ⓘ Почему такой план</button></div></details></div>'+a.masteryCardHtml()+week;
a.queueDecorate();return true;
}
a.q('todaySub').textContent=view.auxDue?'Сегодня · вспомогательная тренировка':'Сегодня · восстановление';
let html='<div class="todayCard"><div class="row between"><div class="grow"><div class="dateBig">'+(view.auxDue?'Основной комплекс не назначен':'Сегодня восстановление')+
'</div><div class="sessionNo">Следующая основная тренировка — '+a.fmtKeyDate(view.nextDate,false)+'</div></div><span class="tag stage4">ВОССТАНОВЛЕНИЕ</span></div>';
if(view.extras&&view.extras.length){
html+='<div class="tcTodayPrimaryMeta">Можно выполнить выбранные дополнительные упражнения без дополнительной тяговой нагрузки.</div>'+
'<button class="btn yellow full" style="margin-top:14px;min-height:58px" onclick="tcStartExtraWorkout()">Начать дополнительную тренировку</button>'+
'<details class="tcTodayPlanDetails"><summary>Посмотреть дополнительный план</summary><div class="tcTodayPlanBody">'+a.extraRowsHtml(view.extras)+'</div></details>';
}else{
html+='<div class="empty" style="margin-top:12px">Дополнительные упражнения не выбраны. Можно оставить полный отдых.</div>'+
'<button class="btn ghost full" style="margin-top:10px" onclick="go(\'exercise\')">Настроить дополнительный план</button>';
}
html+='</div>';
a.q('todayList').innerHTML=a.auxCardHtml()+html+a.supplementHtml()+a.courseControlStatusHtml()+week;
a.queueDecorate();return true;
}
function testsHtml(view){
const maxTests=(view.tests||[]).map(t=>({date:t.date,ts:t.ts,label:'Контрольный максимум',summary:t.value+' повт. · предыдущий '+t.previous+' · изменение '+(t.value-t.previous>0?'+':'')+(t.value-t.previous)}));
const norms=(view.masteryTests||[]).map(t=>({date:t.date,ts:t.ts,label:'Норматив уровня '+t.level,summary:(t.passed?'Выполнен':'Не выполнен')+(t.values&&t.values.regular!=null?' · обычные '+t.values.regular:'')}));
const all=maxTests.concat(norms).sort((x,y)=>(y.ts||0)-(x.ts||0)).slice(0,12);
if(!all.length)return'';
const rows=all.map(t=>'<div class="historyitem"><div class="row between"><b>'+a.fmtKeyDate(t.date,false)+'</b><span class="badge">'+t.label+'</span></div><div class="meta">'+t.summary+'</div></div>').join('');
return '<div class="tcInfoBlock"><h3>Контрольные испытания</h3><p>Текущий максимум: '+view.pullMax+' · цель: '+view.targetMax+'</p></div>'+rows;
}
function statsHtml(view){
const x=view.stats;if(!x)return'';
const sign=x.delta>0?'+':'',rate=x.rate==null?'—':x.rate+'%',trend=x.tests.length?x.tests.slice(-5).join(' → '):'контролей пока нет';
return '<div class="tcInfoBlock"><h3>Текущий период · с '+a.fmtKeyDate(x.r.startedDate,false)+'</h3><p><b>'+x.base+' → '+x.cur+'</b> подтягиваний · '+sign+x.delta+' ('+sign+x.pct+'%)<br>Выполнение курса: <b>'+rate+'</b> · выполнено '+x.completed+'<br>Вовремя '+x.on+' · перенесено '+x.moved+' · пропущено '+x.missed+' · восстановление '+x.recovery+'<br>Объём курса: '+x.sets+' подходов · '+x.reps+' повторений<br>Контрольные максимумы: '+trend+'</p></div>';
}
function historyHtml(view){
if(!view.enabled&&!(view.history||[]).length)return'';
const rows=(view.history||[]).slice(0,8).map(h=>'<div class="historyitem"><div class="row between"><div><div class="strong" style="font-size:14px">'+(h.courseMode==='supplement'?'Дополнительные подтягивания по курсу':h.courseMode==='auxCourse'?'Вспомогательный комплекс №2 · уровень '+h.courseLevel:'Курс Морозова · уровень '+h.courseLevel+' · комплекс '+h.courseComplex)+(h.adapted?' · адаптация: только турник':'')+'</div><div class="meta">'+a.fmtRecordDate(h)+' · '+(h.feedback||'—')+'</div></div><span class="badge">КУРС</span></div>'+(h.details||[]).map(d=>'<div class="meta" style="margin-top:6px">'+d.name+': '+(d.actual||[]).map(v=>v===null?'—':v).join(' · ')+'</div>').join('')+'</div>').join('');
return '<div class="exerciseProgressCard"><div class="progressHead"><div><div class="progressName">Курс Морозова</div><div class="meta">Статистика и история текущего периода</div></div><span class="badge">ур. '+view.level+'</span></div>'+statsHtml(view)+'<div class="tcInfoBlock"><h3>Критерий текущего уровня</h3><p>'+view.mastery+'</p></div>'+testsHtml(view)+rows+'</div>';
}
function renderProgress(view){
const host=a.q('exerciseProgress');if(!host)return false;
const old=document.getElementById('tcCourseHistoryWrap');if(old)old.remove();
const wrap=document.createElement('div');wrap.id='tcCourseHistoryWrap';wrap.innerHTML=historyHtml(view);
host.parentNode.insertBefore(wrap,host);return true;
}
function register(){
if(!a||!window.TurnikUI)return false;
window.TurnikUI.register('today','morozov',100,view=>a.enabled()?renderToday(view):false);
window.TurnikUI.register('plan','morozov',100,view=>renderPlan(view));
window.TurnikUI.register('progress','morozov',100,view=>renderProgress(view));
registered=true;return true;
}
function debug(){return{version:VERSION,configured:!!a,registered,owner:'course-presenter',areas:['today','plan','progress']}}
window.TurnikCourseUI={version:VERSION,configure,register,renderToday,renderPlan,renderProgress,debug};
if(window.TurnikCoursePresenterAdapter){
configure(window.TurnikCoursePresenterAdapter);
register();
}
try{window.dispatchEvent(new CustomEvent('turnikcourseui:ready',{detail:{version:VERSION}}))}catch(e){}
})();