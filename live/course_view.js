/* TURNIKCOACH_COURSE_VIEW 1.0.0-today-owner */
(function(){
'use strict';
const VERSION='1.0.0-today-owner';
if(window.TurnikCourseView&&window.TurnikCourseView.version===VERSION)return;
function requireFn(ctx,name){
const fn=ctx&&ctx[name];
if(typeof fn!=='function')throw new Error('TurnikCourseView missing adapter: '+name);
return fn;
}
function renderToday(view,ctx){
if(!view||!view.kind)throw new Error('TurnikCourseView requires resolved today state');
const q=requireFn(ctx,'q'),fmtDate=requireFn(ctx,'fmtDate'),dateFromKey=requireFn(ctx,'dateFromKey');
const week=()=>'<div class="tcWeekSection"><div class="tcWeekSectionTitle">ПЛАН НЕДЕЛИ</div>'+requireFn(ctx,'weeklyCalendarHtml')()+'</div>';
const title=q('todayTitle'),sub=q('todaySub'),list=q('todayList');
if(!title||!sub||!list)throw new Error('TurnikCourseView Today DOM is unavailable');
title.textContent=fmtDate(ctx.now?ctx.now():new Date());
const set=(subtitle,html,after)=>{
sub.textContent=subtitle;list.innerHTML=html;
if(typeof after==='function')after();
return true;
};
switch(view.kind){
case 'PREVIEW':
title.textContent=fmtDate(dateFromKey(view.date));
return set('Просмотр плана',requireFn(ctx,'previewCourseCard')(view.date)+week());
case 'COURSE_DONE':
return set('Основная тренировка выполнена',requireFn(ctx,'todayCourseDoneHtml')(view.extras)+week(),()=>{
requireFn(ctx,'bindTodayDoneActions')();requireFn(ctx,'queueDecorate')();
});
case 'COURSE_TEST':
return set('Сегодня · контроль прогресса',requireFn(ctx,'courseTestCard')()+week());
case 'MASTERY_TEST':
return set('Сегодня · контроль уровня',requireFn(ctx,'pendingLevelHtml')()+requireFn(ctx,'masteryCardHtml')()+week());
case 'RECOVERY_SHIFT':
return set('Сегодня · восстановление',requireFn(ctx,'recoveryShiftCardHtml')()+week(),requireFn(ctx,'queueDecorate'));
case 'TRANSFER':
case 'TRANSFER_RECOVERY':
return set(view.kind==='TRANSFER'?'Сегодня · перенос основной тренировки':'Сегодня · восстановление',
requireFn(ctx,'transferCardHtml')(view.transfer)+week(),requireFn(ctx,'queueDecorate'));
case 'ADVANCED_SETUP':
return set('Сегодня · подготовка тренировки',
'<div class="todayCard"><div class="dateBig">Выберите два вспомогательных упражнения</div><div class="meta">Это нужно один раз для комплекса 7-го уровня.</div><button class="btn yellow full" style="margin-top:12px" onclick="tcOpenAdvancedChoiceSheet()">Выбрать упражнения</button></div>'+week());
case 'EQUIPMENT_SETUP':
return set('Сегодня · требуется настройка оборудования',requireFn(ctx,'noEquipmentCard')(view.defs)+week());
case 'CALIBRATION':
return set('Сегодня · требуется контрольный максимум',requireFn(ctx,'calibrationCard')('main')+week());
case 'WORKING_WEIGHT':
return set('Сегодня · требуется рабочий вес',requireFn(ctx,'workingWeightCard')('main')+week());
case 'MAIN_WORKOUT':{
const html=requireFn(ctx,'pendingLevelHtml')()+requireFn(ctx,'equipmentMasteryNote')()+
'<div class="todayCard tcTodayPrimaryCard"><div class="row between"><div class="grow"><div class="dateBig">'+view.complexName+'</div><div class="tcTodayPrimaryMeta">'+view.items.length+
' упражн. · '+view.totalSets+' подходов · '+view.levelTitle+'</div></div><span class="tag">КУРС</span></div>'+
'<button class="btn yellow full" style="margin-top:14px;min-height:58px" onclick="tcStartCourseWorkout()">'+(view.adapted?'Начать адаптированную тренировку':'Начать тренировку')+
'</button><details class="tcTodayPlanDetails"><summary>Посмотреть план</summary><div class="tcTodayPlanBody">'+requireFn(ctx,'courseRowsHtml')(view.items)+requireFn(ctx,'adaptationNote')(view.defs)+
'<button class="btn ghost full" style="margin-top:8px" onclick="tcOpenCourseInfo()">ⓘ Почему такой план</button></div></details></div>'+requireFn(ctx,'masteryCardHtml')()+week();
return set('Сегодня · основная тренировка',html,requireFn(ctx,'queueDecorate'));
}
default:{
const fmtKeyDate=requireFn(ctx,'fmtKeyDate');
let html='<div class="todayCard"><div class="row between"><div class="grow"><div class="dateBig">'+(view.auxDue?'Основной комплекс не назначен':'Сегодня восстановление')+
'</div><div class="sessionNo">Следующая основная тренировка — '+fmtKeyDate(view.nextDate,false)+'</div></div><span class="tag stage4">ВОССТАНОВЛЕНИЕ</span></div>';
if(Array.isArray(view.extras)&&view.extras.length){
html+='<div class="tcTodayPrimaryMeta">Можно выполнить выбранные дополнительные упражнения без дополнительной тяговой нагрузки.</div>'+
'<button class="btn yellow full" style="margin-top:14px;min-height:58px" onclick="tcStartExtraWorkout()">Начать дополнительную тренировку</button>'+
'<details class="tcTodayPlanDetails"><summary>Посмотреть дополнительный план</summary><div class="tcTodayPlanBody">'+requireFn(ctx,'extraRowsHtml')(view.extras)+'</div></details>';
}else{
html+='<div class="empty" style="margin-top:12px">Дополнительные упражнения не выбраны. Можно оставить полный отдых.</div>'+
'<button class="btn ghost full" style="margin-top:10px" onclick="go(\'exercise\')">Настроить дополнительный план</button>';
}
html+='</div>';
html=requireFn(ctx,'auxCardHtml')()+html+requireFn(ctx,'supplementHtml')()+requireFn(ctx,'courseControlStatusHtml')()+week();
return set(view.auxDue?'Сегодня · вспомогательная тренировка':'Сегодня · восстановление',html,requireFn(ctx,'queueDecorate'));
}
}
}
function debug(){return{version:VERSION,owner:'today-render',kinds:['PREVIEW','COURSE_DONE','COURSE_TEST','MASTERY_TEST','RECOVERY_SHIFT','TRANSFER','TRANSFER_RECOVERY','ADVANCED_SETUP','EQUIPMENT_SETUP','CALIBRATION','WORKING_WEIGHT','MAIN_WORKOUT','DEFAULT']}}
window.TurnikCourseView={version:VERSION,renderToday,debug};
})();