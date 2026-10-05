/* TURNIKCOACH_HOTFIX 5.16.43-morozov-stats */
(function(){
'use strict';
const VERSION='5.16.43-morozov-stats';
const LABEL='5.16.43';
const APPROVED_KEY='tc_hotfix_approved_version';
const LEGACY_ASSET_VERSION='5.14.0-adaptive-rest';
const stalePrompt=document.getElementById('tcUpdatePrompt');
if(stalePrompt&&!stalePrompt.textContent.includes('TurnikCoach '+LABEL))stalePrompt.remove();
if(window.__TC_HOTFIX_ACTIVE_VERSION===VERSION)return;
function removeUpdatePrompt(){
const p=document.getElementById('tcUpdatePrompt');
if(p&&p.parentNode)p.parentNode.removeChild(p);
}
function showRuntimeNotice(message,tone){
const old=document.getElementById('tcRuntimeNotice');
if(old&&old.parentNode)old.parentNode.removeChild(old);
const note=document.createElement('div');
note.id='tcRuntimeNotice';
const danger=tone==='danger';
note.style.cssText='position:fixed;pointer-events:none;left:14px;right:14px;bottom:88px;z-index:2147483646;padding:12px 14px;border-radius:14px;background:'+
(danger?'#2a181b':'#18221b')+';border:1px solid '+(danger?'#70424a':'#42604a')+
';color:'+(danger?'#ffd8db':'#e8ffed')+';font:700 13px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35)';
note.textContent=message;
document.body.appendChild(note);
if(danger)try{if(navigator.vibrate)navigator.vibrate([70,45,70])}catch(e){}
setTimeout(()=>{if(note&&note.parentNode)note.parentNode.removeChild(note)},4200);
}
window.tcShowRuntimeNotice=showRuntimeNotice;
let tcDeferredUpdateTimer=null;
function tcActiveWorkoutForUpdate(){
try{
if(typeof W!=='undefined'&&W)return true;
const raw=JSON.parse(localStorage.getItem('tc_active_workout_v2')||'null');
if(raw&&raw.savedAt&&Date.now()-Number(raw.savedAt)<24*60*60*1000)return true;
}catch(e){}
return false;
}
function tcScheduleDeferredUpdate(activate){
window.__TC_UPDATE_PENDING_VERSION=VERSION;
window.__tcDeferredUpdateActivate=activate;
if(tcDeferredUpdateTimer)return;
const retry=()=>{
tcDeferredUpdateTimer=null;
if(window.__TC_UPDATE_DISMISSED_VERSION===VERSION)return;
if(tcActiveWorkoutForUpdate()){
tcDeferredUpdateTimer=setTimeout(retry,1500);
return;
}
window.__TC_UPDATE_PENDING_VERSION='';
showUpdatePrompt(activate);
};
tcDeferredUpdateTimer=setTimeout(retry,1500);
}
function showUpdatePrompt(activate){
if(document.getElementById('tcUpdatePrompt'))return;
if(tcActiveWorkoutForUpdate()){
tcScheduleDeferredUpdate(activate);
return;
}
const overlay=document.createElement('div');
overlay.id='tcUpdatePrompt';
overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:22px;box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;overflow:hidden';
const card=document.createElement('div');
card.style.cssText='width:min(420px,100%);height:min(680px,calc(100vh - 44px));height:min(680px,calc(100dvh - 44px));background:#10161d;color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:22px;box-shadow:0 18px 60px rgba(0,0,0,.5);display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden';
const title=document.createElement('div');
title.style.cssText='font-size:22px;font-weight:800;margin-bottom:10px;flex:0 0 auto;overflow-wrap:anywhere';
title.textContent='Доступно обновление TurnikCoach '+LABEL;
const text=document.createElement('div');
text.style.cssText='font-size:15px;line-height:1.45;color:#cfd8e3;margin-bottom:18px;min-height:0;flex:1 1 0;overflow-y:auto;overscroll-behavior:contain;padding-right:4px';
text.innerHTML="Добавлена статистика курса Морозова. Приложение теперь хранит периоды прохождения курса и связывает с ними основные тренировки, переносы, пропуски, восстановление, контрольные максимумы и нормативы. В разделе «Прогресс» показываются стартовый и текущий максимум, прирост, процент выполнения курса, тренировки вовремя/переносом/пропуском, восстановление и общий объём. Восстановление не считается пропуском, перенос считается выполненной тренировкой.<br><br>Установить обновление сейчас?";
const row=document.createElement('div');
row.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;flex:0 0 auto';
const later=document.createElement('button');
later.type='button';
later.textContent='Позже';
later.style.cssText='min-height:48px;border:0;border-radius:12px;padding:14px 12px;background:#27313c;color:#fff;font-size:16px;font-weight:700;white-space:normal;overflow-wrap:anywhere';
const yes=document.createElement('button');
yes.type='button';
yes.textContent='Обновить';
yes.style.cssText='min-height:48px;border:0;border-radius:12px;padding:14px 12px;background:#ffc400;color:#111;font-size:16px;font-weight:800;white-space:normal;overflow-wrap:anywhere';
later.onclick=()=>{window.__TC_UPDATE_DISMISSED_VERSION=VERSION;removeUpdatePrompt()};
yes.onclick=()=>{
if(typeof W!=='undefined'&&W){
text.textContent='Сначала завершите или отмените текущую тренировку. Обновление перезапустит экран, чтобы не потерять незаписанные подходы.';
return;
}
const currentVersion=String(window.__TC_HOTFIX_ACTIVE_VERSION||window.__TC_HOTFIX_VERSION||'');
const installed=!!currentVersion&&currentVersion!==VERSION;
try{localStorage.setItem(APPROVED_KEY,VERSION)}catch(e){}
removeUpdatePrompt();
if(installed&&window.location&&typeof window.location.reload==='function'){
window.location.reload();return;
}
activate();
};
row.appendChild(later);row.appendChild(yes);
card.appendChild(title);card.appendChild(text);card.appendChild(row);overlay.appendChild(card);
document.body.appendChild(overlay);
}
const COURSE_MODULE_BUNDLED="/* TURNIKCOACH_COURSE 1.0.37-course-stats */\n(function(){\n'use strict';\nconst COURSE_MODULE_VERSION='1.0.37-course-stats';\nif(window.__TC_COURSE_MODULE_VERSION===COURSE_MODULE_VERSION)return;\nwindow.__TC_COURSE_MODULE_VERSION=COURSE_MODULE_VERSION;\nfunction tcClamp(v,a,b){return Math.max(a,Math.min(b,v))}\nfunction tcPrimeAudio(){try{if(typeof unlockAudio==='function')unlockAudio()}catch(e){}}\nfunction tcFinishSignal(){try{if(typeof beep==='function'){beep(620,.18,.42);setTimeout(()=>beep(880,.26,.46),200)}}catch(e){}}\nfunction tcQueueDecorate(){setTimeout(()=>{},0)}\nconst TC_COURSE_KEY='tc_morozov_course_v1';\nconst TC_PULL_CONFLICT_IDS=new Set(['pull','chin','bandPull','weightedPull','oneArmPull']);\nconst TC_PULL_HEAVY_IDS=new Set(['pull','chin','bandPull','weightedPull','oneArmPull','muscleUp','frontLever','backLever']);\nconst TC_COURSE={\n1:{\ntitle:'Начинающие',\nentry:'0–1 обычное подтягивание или 0–8 подтягиваний с резиной',\nfrequency:'4 тренировки в неделю; чередовать комплексы №1 и №2',\nsequence:[1,2,1,2],\nmastery:'8 подтягиваний с резиной минимального натяжения',\ncomplexes:{\n1:{name:'Комплекс №1',purpose:'Общая силовая подготовка тяговых мышц и освоение правильного движения.',items:[\n{id:'c_band',name:'Подтягивания с резиной',metric:'reps',sets:3,scheme:{type:'fixed',value:8},rest:{type:'fixed',sec:60},tip:'Используй такую помощь резины, чтобы сохранять правильную технику.'},\n{id:'c_australian',name:'Австралийские подтягивания',metric:'reps',sets:3,scheme:{type:'fixed',value:12},rest:{type:'fixed',sec:60}},\n{id:'c_band_row',name:'Тяга резины',metric:'reps',sets:2,scheme:{type:'fixed',value:15},rest:{type:'fixed',sec:60}},\n{id:'c_bent_hold',name:'Вис на согнутых руках',metric:'time',sets:3,scheme:{type:'max'},rest:{type:'fixed',sec:60}}\n]},\n2:{name:'Комплекс №2',purpose:'Техника, удержание и контролируемая эксцентрическая работа.',items:[\n{id:'c_active_hang',name:'Активный вис',metric:'time',sets:3,scheme:{type:'max'},rest:{type:'fixed',sec:60}},\n{id:'c_chair_pull',name:'Подтягивания с ногами на стуле',metric:'reps',sets:3,scheme:{type:'fixed',value:12},rest:{type:'fixed',sec:60}},\n{id:'c_aus_biceps',name:'Тяга на бицепс в австралийском мосту',metric:'reps',sets:2,scheme:{type:'fixed',value:8},rest:{type:'fixed',sec:60}},\n{id:'c_slow_negative',name:'Медленный негатив',metric:'reps',sets:5,scheme:{type:'timed',value:2,label:'2 · 20 сек'},rest:{type:'fixed',sec:60},tip:'Два медленных негативных повторения; курс указывает 20 секунд.'}\n]}\n}\n},\n2:{\ntitle:'Второй уровень',\nentry:'До 4 обычных подтягиваний или более 6 подтягиваний с резиной',\nfrequency:'2–4 тренировки в неделю по индивидуальным ощущениям',\nsequence:[1],\nmastery:'8 подтягиваний средним хватом',\ncomplexes:{\n1:{name:'Комплекс №1',purpose:'Более направленная работа на чёткие подтягивания; объём ниже, интенсивность выше.',items:[\n{id:'c_classic_max',name:'Классические подтягивания',metric:'reps',sets:3,scheme:{type:'max',ref:'pull'},rest:{type:'range',min:60,max:180},tip:'В этом уровне автор ставит задачу выполнять чёткие 2–4 подтягивания без технических ошибок.'},\n{id:'c_shrug',name:'Шраги на турнике',metric:'reps',sets:3,scheme:{type:'fixed',value:12},rest:{type:'range',min:60,max:180},tip:'Шраги развивают мышцы, опускающие плечо, ротаторы плеча и при большей амплитуде трапеции.'},\n{id:'c_half_pull',name:'Полуамплитудные подтягивания',metric:'reps',sets:3,scheme:{type:'fixed',value:8},rest:{type:'range',min:60,max:180}},\n{id:'c_pause_negative',name:'Негатив с паузами',metric:'reps',sets:3,scheme:{type:'timed',value:3,label:'3 · паузы 5 сек'},rest:{type:'range',min:60,max:180}},\n{id:'c_chin_max',name:'Подтягивания нижним хватом',metric:'reps',sets:3,scheme:{type:'max'},rest:{type:'range',min:60,max:180},tip:'Нижний хват немного сильнее переносит нагрузку на бицепс; распределение нагрузки зависит от техники.'}\n]}\n}\n},\n3:{\ntitle:'Третий уровень',\nentry:'4–15 подтягиваний или более 6 широким хватом с резиной',\nfrequency:'Комплекс №1 — 3 раза в неделю; комплекс №2 — 1 раз в неделю или раз в 10 дней',\nsequence:[1,1,1,2],\nmastery:'15–20 классических подтягиваний и 6 подтягиваний широким хватом',\nsupplement:'10 подходов по 80% от максимума в дни без основной тренировки; пропускать в дни основной тренировки; раз в месяц отдых от этой дополнительной работы не менее 5 дней.',\ncomplexes:{\n1:{name:'Комплекс №1',purpose:'Рост количества подтягиваний через сочетание высокой и умеренной относительной нагрузки.',items:[\n{id:'c_pull80',name:'Классические подтягивания',metric:'reps',sets:3,scheme:{type:'percent',pct:.8,ref:'pull'},rest:{type:'fixed',sec:180}},\n{id:'c_wide_band_max',name:'Широкие подтягивания с резиной',metric:'reps',sets:1,scheme:{type:'max'},rest:{type:'range',min:60,max:180}},\n{id:'c_pull50',name:'Классические подтягивания',metric:'reps',sets:6,scheme:{type:'percent',pct:.5,ref:'pull'},rest:{type:'manual',label:'минимальный'}},\n{id:'c_negative_pause_max',name:'Негатив с паузами',metric:'time',sets:3,scheme:{type:'max',label:'MAX · максимальная пауза'},rest:{type:'manual',label:'минимальный'}}\n]},\n2:{name:'Комплекс №2',purpose:'Дополнительная взрывная и асимметричная работа.',items:[\n{id:'c_chicken_wings',name:'Куриные крылья',metric:'reps',sets:2,scheme:{type:'fixed',value:10},rest:{type:'fixed',sec:180}},\n{id:'c_plyo80',name:'Плиометрические подтягивания',metric:'reps',sets:3,scheme:{type:'percent',pct:.8},rest:{type:'fixed',sec:180},tip:'Высокие и плиометрические подтягивания используются для развития взрывной силы.'},\n{id:'c_asym80',name:'Асимметричные подтягивания',metric:'reps_side',sets:3,scheme:{type:'percent',pct:.8,label:'80% MAX'},rest:{type:'fixed',sec:180},tip:'Асимметричные подтягивания увеличивают нагрузку на тянущую сторону; вспомогательная сторона стабилизирует движение.'}\n]}\n}\n},\n4:{\ntitle:'Четвёртый уровень',\nentry:'15–25 подтягиваний; дальнейшая специализация по цели',\nfrequency:'По цели: комплекс №1 — 2–4 раза/нед.; №2 — 3–4; №3 — 3–5',\nmastery:'5 асимметричных подтягиваний на каждую руку и 1 подтягивание выше груди',\nsupplement:'10 подходов по 80% от максимума в дни без основной тренировки; пропускать в дни основной тренировки; раз в месяц отдых от этой дополнительной работы не менее 5 дней.',\ncomplexes:{\n1:{name:'Комплекс №1 · выход силой',goal:'muscleup',purpose:'Подготовка к выходу силой.',items:[\n{id:'c_plyo35',name:'Плиометрические подтягивания',metric:'reps',sets:5,scheme:{type:'range_reps',min:3,max:5,label:'3–5'},rest:{type:'range',min:120,max:240}},\n{id:'c_wide80',name:'Подтягивания широким хватом',metric:'reps',sets:3,scheme:{type:'percent',pct:.8,label:'80% MAX'},rest:{type:'range',min:120,max:240}},\n{id:'c_iguana',name:'Хват игуаны · тяга к плечу на полусогнутых',metric:'reps',sets:3,scheme:{type:'fixed',value:8},rest:{type:'range',min:120,max:240}}\n]},\n2:{name:'Комплекс №2 · одна рука',goal:'onearm',purpose:'Подготовка к подтягиванию на одной руке.',items:[\n{id:'c_asym_max',name:'Асимметричные подтягивания',metric:'reps_side',sets:2,scheme:{type:'max'},rest:{type:'range',min:120,max:240},tip:'Асимметричная работа повышает нагрузку на тянущую сторону.'},\n{id:'c_onearm_active_hang',name:'Активный вис на одной руке',metric:'time_side',sets:3,scheme:{type:'max'},rest:{type:'range',min:120,max:240}},\n{id:'c_regrip_bent',name:'Перехваты в висе на полусогнутых',metric:'reps',sets:3,scheme:{type:'max'},rest:{type:'range',min:120,max:240}}\n]},\n3:{name:'Комплекс №3 · количество',goal:'quantity',purpose:'Развитие выносливости и увеличение общего количества подтягиваний.',items:[\n{id:'c_pull80_l4',name:'Классические подтягивания',metric:'reps',sets:3,scheme:{type:'percent',pct:.8,ref:'pull'},rest:{type:'range',min:120,max:240}},\n{id:'c_wide_max_l4',name:'Подтягивания широким хватом',metric:'reps',sets:2,scheme:{type:'max'},rest:{type:'range',min:120,max:240}},\n{id:'c_weighted3',name:'Подтягивания с дополнительным весом',metric:'weighted',sets:4,scheme:{type:'fixed',value:3,label:'3 · максимальный рабочий вес'},rest:{type:'range',min:120,max:240}}\n]}\n}\n},\n5:{\ntitle:'Пятый уровень',entry:'Продвинутая специализация после четвёртого уровня',frequency:'Комплекс выбирается по цели; в курсе указано 2–4 тренировки в неделю',sequence:[1],mastery:'Дополнительный вес в подтягивании — 60–70% собственного веса тела',\ncomplexes:{\n1:{name:'Комплекс №1 · выход силой',goal:'muscleup',purpose:'Скоростно-силовая работа для выхода силой.',items:[\n{id:'c_high_max',name:'Высокие подтягивания',metric:'reps',sets:3,scheme:{type:'max'},rest:{type:'range',min:180,max:300},tip:'Высокие подтягивания развивают взрывную силу.'},\n{id:'c_three_stage50',name:'Трёхстадийные подтягивания',metric:'reps',sets:6,scheme:{type:'percent',pct:.5,label:'50% MAX'},rest:{type:'range',min:180,max:300},tip:'Разделение движения на фазы развивает нейромышечный контроль каждой части амплитуды.'},\n{id:'c_power_crow',name:'Силовая каркуша',metric:'reps',sets:3,scheme:{type:'max'},rest:{type:'range',min:180,max:300}}\n]},\n2:{name:'Комплекс №2 · одна рука / силовая база',goal:'onearm',purpose:'Односторонняя силовая работа и тяжёлые подтягивания.',items:[\n{id:'c_full_asym2',name:'Асимметричные подтягивания полные',metric:'reps_side',sets:2,scheme:{type:'fixed',value:2},rest:{type:'range',min:180,max:300}},\n{id:'c_onearm_bent_hold',name:'Вис на одной полусогнутой руке',metric:'time_side',sets:3,scheme:{type:'max'},rest:{type:'range',min:180,max:300}},\n{id:'c_typewriter',name:'Печатная машинка',metric:'reps',sets:2,scheme:{type:'max'},rest:{type:'range',min:180,max:300}},\n{id:'c_weighted3_l5',name:'Подтягивания с дополнительным весом',metric:'weighted',sets:5,scheme:{type:'fixed',value:3,label:'3 · максимальный рабочий вес'},rest:{type:'range',min:180,max:300}}\n]}\n}\n},\n6:{\ntitle:'Шестой уровень',entry:'Следующая ступень специальной силовой работы',frequency:'Комплекс №1 — 2–4 раза/нед.; комплекс №2 — вспомогательная силовая работа, примерно раз в 10 дней',sequence:[1,1,1,2],mastery:'В PDF отдельный тест перехода после шестого уровня не указан.',\ncomplexes:{\n1:{name:'Комплекс №1',purpose:'Продвинутая односторонняя тяговая работа.',items:[\n{id:'c_onearm_negative',name:'Негативы на одной руке с подтягиванием в нейтральном хвате',metric:'reps_side',sets:3,scheme:{type:'timed',value:6,label:'6 · 10 сек'},rest:{type:'range',min:180,max:300}},\n{id:'c_jump_onearm',name:'Подтягивания с прыжка на низком турнике',metric:'reps_side',sets:3,scheme:{type:'fixed',value:4},rest:{type:'range',min:180,max:300}},\n{id:'c_band_onearm',name:'Подтягивания с резиной средней тяги',metric:'reps_side',sets:2,scheme:{type:'max'},rest:{type:'range',min:180,max:300}}\n]},\n2:{name:'Комплекс №2',purpose:'Вспомогательная силовая работа.',items:[\n{id:'c_towel_hang',name:'Вис на полотенце одной рукой',metric:'time_side',sets:3,scheme:{type:'max'},rest:{type:'range',min:180,max:300}},\n{id:'c_weighted23',name:'Подтягивания с дополнительным весом',metric:'weighted',sets:4,scheme:{type:'range_reps',min:2,max:3,label:'2–3 · максимальный вес'},rest:{type:'range',min:180,max:300}}\n]}\n}\n},\n7:{\ntitle:'Седьмой уровень',entry:'Прогрессия подтягивания на одной руке / дальнейшая работа на выход силой',frequency:'Комплекс №1 — 3 раза/нед. для одной руки; комплекс №2 — 3 раза/нед. для выхода силой в одно движение',sequence:[1],mastery:'В PDF отдельный финальный тест не указан.',\ncomplexes:{\n1:{name:'Комплекс №1 · одна рука',goal:'onearm',purpose:'Прогрессия подтягивания на одной руке.',items:[\n{id:'c_onearm_progression',name:'Прогрессия подтягивания на одной руке',metric:'reps_side',sets:4,scheme:{type:'max'},rest:{type:'manual',label:'по усмотрению'}},\n{id:'c_l6_choice1',name:'Упражнение на выбор из 6 уровня',metric:'reps',sets:1,scheme:{type:'choice',label:'любой комплекс'},rest:{type:'manual',label:'по усмотрению'}},\n{id:'c_l6_choice2',name:'Упражнение на выбор из 6 уровня',metric:'reps',sets:1,scheme:{type:'choice',label:'любой комплекс'},rest:{type:'manual',label:'по усмотрению'}}\n]},\n2:{name:'Комплекс №2 · выход силой',goal:'muscleup',purpose:'Дальнейшая работа на выход силой в одно движение.',items:[\n{id:'c_onearm_progression_mu',name:'Прогрессия подтягивания на одной руке',metric:'reps_side',sets:4,scheme:{type:'max'},rest:{type:'manual',label:'по усмотрению'}},\n{id:'c_l5_choice1',name:'Упражнение на выбор из 5 уровня · комплекс №1',metric:'reps',sets:1,scheme:{type:'choice',label:'на выбор'},rest:{type:'manual',label:'по усмотрению'}},\n{id:'c_l5_choice2',name:'Упражнение на выбор из 5 уровня · комплекс №1',metric:'reps',sets:1,scheme:{type:'choice',label:'на выбор'},rest:{type:'manual',label:'по усмотрению'}}\n]}\n}\n}\n};\nfunction tcCourseDefault(){\nconst pull=state.ex.find(e=>e.id==='pull');\nconst weighted=state.ex.find(e=>e.id==='weightedPull');\nconst m=Math.max(1,+((pull&&pull.max)||1));\nreturn{enabled:false,level:m<=1?1:m<=3?2:m<=14?3:4,goal:'quantity',pullMax:m,weightedLoad:+((weighted&&weighted.load)||0),courseSeq:0,extraSeq:0,lastCourseDate:'',lastCourseTs:0,authorSupplement:false,history:[],tests:[],testPeriodWeeks:3,targetMax:30,testAnchorDate:'',lastTestDate:'',testDeferredUntil:'',weeklySessions:3,cycleStartDate:'',masteryTests:[],pendingTransition:null,advancedChoices:{onearm:[],muscleup:[]},auxEnabled:{3:false,6:false},auxInterval3:10,exerciseMax:{},scheduleEvents:[],transferRestDates:[],scheduleRuleChangedOn:'',courseRuns:[],activeRunId:'',equipment:'bar'};\n}\nfunction tcLoadCourse(){\nlet c=tcCourseDefault();\ntry{const raw=JSON.parse(localStorage.getItem(TC_COURSE_KEY)||'null');if(raw&&typeof raw==='object')c={...c,...raw}}catch(e){}\nc.level=tcClamp(Math.floor(+c.level||1),1,7);c.pullMax=Math.max(1,Math.floor(+c.pullMax||1));c.weightedLoad=Math.max(0,+c.weightedLoad||0);c.courseSeq=Math.max(0,Math.floor(+c.courseSeq||0));c.extraSeq=Math.max(0,Math.floor(+c.extraSeq||0));c.history=Array.isArray(c.history)?c.history:[];c.tests=Array.isArray(c.tests)?c.tests:[];c.masteryTests=Array.isArray(c.masteryTests)?c.masteryTests:[];c.pendingTransition=c.pendingTransition&&typeof c.pendingTransition==='object'?c.pendingTransition:null;c.advancedChoices=c.advancedChoices&&typeof c.advancedChoices==='object'?c.advancedChoices:{onearm:[],muscleup:[]};c.advancedChoices.onearm=Array.isArray(c.advancedChoices.onearm)?c.advancedChoices.onearm:[];c.advancedChoices.muscleup=Array.isArray(c.advancedChoices.muscleup)?c.advancedChoices.muscleup:[];c.auxEnabled=c.auxEnabled&&typeof c.auxEnabled==='object'?c.auxEnabled:{3:false,6:false};c.auxEnabled[3]=c.auxEnabled[3]===true;c.auxEnabled[6]=c.auxEnabled[6]===true;c.auxInterval3=[7,10].includes(+c.auxInterval3)?+c.auxInterval3:10;c.exerciseMax=c.exerciseMax&&typeof c.exerciseMax==='object'&&!Array.isArray(c.exerciseMax)?c.exerciseMax:{};c.equipment='bar';c.testPeriodWeeks=[2,3,4].includes(+c.testPeriodWeeks)?+c.testPeriodWeeks:3;c.weeklySessions=[2,3,4].includes(+c.weeklySessions)?+c.weeklySessions:3;c.cycleStartDate=/^\\d{4}-\\d{2}-\\d{2}$/.test(c.cycleStartDate||'')?c.cycleStartDate:'';c.targetMax=Math.max(1,Math.floor(+c.targetMax||30));c.testAnchorDate=/^\\d{4}-\\d{2}-\\d{2}$/.test(c.testAnchorDate||'')?c.testAnchorDate:'';c.lastTestDate=/^\\d{4}-\\d{2}-\\d{2}$/.test(c.lastTestDate||'')?c.lastTestDate:'';c.testDeferredUntil=/^\\d{4}-\\d{2}-\\d{2}$/.test(c.testDeferredUntil||'')?c.testDeferredUntil:'';c.scheduleEvents=Array.isArray(c.scheduleEvents)?c.scheduleEvents.filter(e=>e&&/^\\d{4}-\\d{2}-\\d{2}$/.test(e.plannedDate||'')&&['completed','missed','rescheduled','recovery_shift'].includes(e.status)).slice(-240):[];c.transferRestDates=Array.isArray(c.transferRestDates)?c.transferRestDates.filter(k=>/^\\d{4}-\\d{2}-\\d{2}$/.test(k||'')).slice(-60):[];c.scheduleRuleChangedOn=/^\\d{4}-\\d{2}-\\d{2}$/.test(c.scheduleRuleChangedOn||'')?c.scheduleRuleChangedOn:'';c.courseRuns=Array.isArray(c.courseRuns)?c.courseRuns.filter(r=>r&&r.id&&/^\\d{4}-\\d{2}-\\d{2}$/.test(r.startedDate||'')):[];c.activeRunId=typeof c.activeRunId==='string'?c.activeRunId:'';\nreturn c;\n}\nlet TC_course=tcLoadCourse();\nfunction tcCourseRunById(id){return (TC_course.courseRuns||[]).find(r=>r.id===id)||null}\nfunction tcCurrentCourseRun(){return tcCourseRunById(TC_course.activeRunId)}\nfunction tcRunStartDate(){\nif((TC_course.courseRuns||[]).length)return dateKey();\nconst dates=(TC_course.history||[]).filter(h=>h&&h.courseMode==='course'&&h.courseLevel===TC_course.level&&(!h.courseGoal||h.courseGoal===TC_course.goal)).map(h=>h.plannedDate||h.date).filter(Boolean).sort();\nreturn dates[0]||TC_course.cycleStartDate||dateKey();\n}\nfunction tcRunBaseline(){\nconst start=tcRunStartDate(),a=(TC_course.tests||[]).filter(t=>t&&t.date>=start&&t.level===TC_course.level).sort((x,y)=>(x.ts||0)-(y.ts||0));\nreturn a.length&&Number.isFinite(+a[0].previous)?+a[0].previous:TC_course.pullMax;\n}\nfunction tcEnsureCourseRun(){\nif(!TC_course.enabled)return null;\nlet r=tcCurrentCourseRun();\nif(r&&!r.endedDate&&r.level===TC_course.level&&r.goal===TC_course.goal)return r;\nconst start=tcRunStartDate(),id='r'+Date.now().toString(36);\nr={id,startedDate:start,level:TC_course.level,goal:TC_course.goal,weeklySessions:TC_course.weeklySessions,baselinePullMax:tcRunBaseline(),targetMax:TC_course.targetMax,endedDate:'',endPullMax:null,endReason:''};\nTC_course.courseRuns.push(r);TC_course.activeRunId=id;\n(TC_course.history||[]).forEach(h=>{if(!h.runId&&h.date>=start&&h.courseLevel===r.level&&(!h.courseGoal||h.courseGoal===r.goal))h.runId=id});\n(TC_course.tests||[]).forEach(t=>{if(!t.runId&&t.date>=start&&t.level===r.level)t.runId=id});\n(TC_course.masteryTests||[]).forEach(t=>{if(!t.runId&&t.date>=start&&t.level===r.level)t.runId=id});\n(TC_course.scheduleEvents||[]).forEach(e=>{if(!e.runId&&e.plannedDate>=start)e.runId=id});\nreturn r;\n}\nfunction tcCloseCourseRun(reason){\nconst r=tcCurrentCourseRun();if(!r||r.endedDate)return;\nr.endedDate=dateKey();r.endPullMax=TC_course.pullMax;r.endReason=reason||'changed';TC_course.activeRunId='';\n}\nfunction tcSaveCourse(){try{localStorage.setItem(TC_COURSE_KEY,JSON.stringify(TC_course));return true}catch(e){console.error('course save',e);return false}}\nwindow.tcGetCourseStateSnapshot=function(){\ntry{return JSON.parse(JSON.stringify(TC_course))}catch(e){return null}\n};\nwindow.tcRestoreCourseStateSnapshot=function(snapshot){\nif(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))return false;\ntry{\nlocalStorage.setItem(TC_COURSE_KEY,JSON.stringify(snapshot));\nTC_course=tcLoadCourse();\ntcSaveCourse();\nreturn true;\n}catch(e){\nconsole.error('course state restore',e);\nreturn false;\n}\n};\nfunction tcNextTestDate(){\nconst start=TC_course.lastTestDate||TC_course.testAnchorDate;\nif(!start)return '';\nconst d=new Date(start+'T12:00:00');d.setDate(d.getDate()+TC_course.testPeriodWeeks*7);\nreturn dateKey(d);\n}\nfunction tcTestDue(){\nif(TC_course.level!==4||TC_course.goal!=='quantity')return false;\nconst due=tcNextTestDate(),now=dateKey();\nreturn !!due&&now>=due&&(!TC_course.testDeferredUntil||now>=TC_course.testDeferredUntil);\n}\nfunction tcLatestTest(){return TC_course.tests.length?TC_course.tests[0]:null}\nfunction tcMasteryDue(){\nif(!TC_course.enabled||!TC_course.lastCourseDate||!tcMasteryDefinition())return false;\nconst next=tcNextTestDate(),now=dateKey();\nreturn !!next&&now>=next&&(!TC_course.testDeferredUntil||now>=TC_course.testDeferredUntil)&&tcRecoveredForTest();\n}\nfunction tcCourseLevel(){return TC_COURSE[TC_course.level]||TC_COURSE[1]}\nfunction tcCourseGoalName(g){return g==='muscleup'?'Выход силой':g==='onearm'?'Подтягивание на одной руке':'Количество подтягиваний'}\nfunction tcGoalOptions(level){if(level<=3)return[['quantity','Количество подтягиваний']];if(level===4)return[['quantity','Количество подтягиваний'],['muscleup','Выход силой'],['onearm','Подтягивание на одной руке']];return[['muscleup','Выход силой'],['onearm','Подтягивание на одной руке']]}\nfunction tcNormalizeGoal(){const a=tcGoalOptions(TC_course.level).map(x=>x[0]);if(!a.includes(TC_course.goal))TC_course.goal=a[0]}\nconst TC_UNAVAILABLE_BAR_ONLY={\nc_band:'Требуется резиновая петля',\nc_australian:'Требуется низкая перекладина либо иной опорный снаряд',\nc_band_row:'Требуется резиновая петля',\nc_chair_pull:'Требуется стул или иная дополнительная опора',\nc_aus_biceps:'Требуется низкая перекладина',\nc_wide_band_max:'Требуется резиновая петля',\nc_weighted3:'Требуется дополнительное отягощение',\nc_weighted3_l5:'Требуется дополнительное отягощение',\nc_weighted23:'Требуется дополнительное отягощение',\nc_band_onearm:'Требуется резиновая петля',\nc_towel_hang:'Требуется полотенце',\nc_onearm_negative:'Для варианта курса требуется нейтральный хват; наличие такой перекладины не подтверждено',\nc_slow_negative:'Для начала из верхнего положения на данном уровне нужна дополнительная опора; она не подтверждена',\nc_pause_negative:'Возможность безопасно выйти в верхнее положение без опоры не подтверждена',\nc_negative_pause_max:'Возможность безопасно выйти в верхнее положение без опоры не подтверждена',\nc_jump_onearm:'Для упражнения автор указывает низкий турник; высота имеющейся перекладины не подтверждена'\n};\nfunction tcEquipmentReason(def){\nif(!def)return 'Упражнение не определено';\nconst id=String(def.id||'').replace(/_lv7_\\d+$/,'');\nif(Object.prototype.hasOwnProperty.call(TC_UNAVAILABLE_BAR_ONLY,id))return TC_UNAVAILABLE_BAR_ONLY[id];\nif(def.metric==='weighted'||/резин|полотен|стул|австралийск|нейтральном хвате/i.test(def.name||'')){\nreturn 'Требуется дополнительный снаряд или приспособление';\n}\nif(def.scheme&&def.scheme.type==='choice')return 'До назначения необходимо выбрать доступное упражнение';\nreturn '';\n}\nfunction tcRunnableDefs(defs){return (defs||[]).filter(def=>!tcEquipmentReason(def))}\nfunction tcUnavailableDefs(defs){return (defs||[]).filter(def=>!!tcEquipmentReason(def))}\nfunction tcOriginalCourseDefs(){return tcResolvedCourseDefs(tcCourseComplex())}\nfunction tcAdaptationNote(defs){\nconst unavailable=tcUnavailableDefs(defs);\nif(!unavailable.length)return '';\nreturn '<div class=\"info\" style=\"margin-top:9px\"><b>Адаптация: только турник.</b> '+\n'Исходный комплекс Морозова содержит недоступные упражнения: '+\nunavailable.map(def=>tcProgramEscape(def.name)).join(', ')+\n'. Они исключены из назначения, но сохранены в полной программе. '+\n'Полученная тренировка не является полным комплексом автора.</div>';\n}\nfunction tcNoEquipmentCard(defs){\nreturn '<div class=\"todayCard\"><div class=\"dateBig\">Комплекс не может быть выполнен полностью</div>'+\n'<div class=\"meta\">Имеется только турник. В исходной программе есть упражнения, требующие другого оборудования.</div>'+\ntcAdaptationNote(defs)+\n'<button class=\"btn ghost full\" style=\"margin-top:10px\" onclick=\"tcOpenCourseProgram()\">Посмотреть исходный курс</button></div>';\n}\nfunction tcCourseComplexNo(seqIndex=TC_course.courseSeq){\nconst l=tcCourseLevel(),ids=Object.keys(l.complexes).map(Number);\nif(TC_course.level===3||TC_course.level===6)return 1;\nif(TC_course.level===4){if(TC_course.goal==='muscleup')return 1;if(TC_course.goal==='onearm')return 2;const seq=[3,3,3,1,3,3,3,2];return seq[seqIndex%seq.length]}\nif(TC_course.level===5){return TC_course.goal==='onearm'?2:1}\nif(TC_course.level===7){return TC_course.goal==='muscleup'?2:1}\nconst seq=l.sequence&&l.sequence.length?l.sequence:ids;\nreturn seq[seqIndex%seq.length]||ids[0]||1;\n}\nfunction tcCourseComplex(seqIndex=TC_course.courseSeq){const no=tcCourseComplexNo(seqIndex);return{no,def:tcCourseLevel().complexes[no]}}\nfunction tcDayDiff(a,b){if(!a||!b)return 999;const x=new Date(a+'T12:00:00'),y=new Date(b+'T12:00:00');return Math.round((y-x)/86400000)}\nlet tcSelectedDate='',tcWeekOffset=0;\nfunction tcWeeklyMode(){return TC_course.enabled&&TC_course.level>=1&&TC_course.level<=7}\nfunction tcCourseWeekdays(){\nconst l=TC_course.level,g=TC_course.goal;\nif(l===1)return [1,3,5,0];\nif(l===2)return TC_course.weeklySessions===2?[1,4]:TC_course.weeklySessions===4?[1,3,6,0]:[1,3,6];\nif(l===3)return [1,3,6];\nif(l===4){if(g==='quantity')return TC_course.weeklySessions===4?[1,3,5,0]:[1,3,6];return g==='onearm'?[1,3,5,0]:[1,3,6]}\nif(l===5)return g==='onearm'?[1,3,5,0]:[1,3,6];\nif(l===6)return [1,3,6];\nreturn [1,4,6];\n}\nfunction tcDateFromKey(k){return new Date(k+'T12:00:00')}\nfunction tcScheduledOn(k){\nif(TC_course.cycleStartDate){\nconst d=tcDayDiff(TC_course.cycleStartDate,k);\nreturn d>=0&&tcCourseWeekdays().map(x=>(x+6)%7).includes(d%7);\n}\nreturn tcCourseWeekdays().includes(tcDateFromKey(k).getDay());\n}\nfunction tcScheduleEventFor(plannedDate){return (TC_course.scheduleEvents||[]).find(e=>e.plannedDate===plannedDate)||null}\nfunction tcUpsertScheduleEvent(plannedDate,status,actualDate){\nif(!plannedDate)return null;\nconst run=tcEnsureCourseRun();let e=tcScheduleEventFor(plannedDate);\nif(!e){e={plannedDate,status,actualDate:actualDate||'',updatedAt:Date.now(),runId:run&&run.id||''};TC_course.scheduleEvents.push(e)}\nelse{e.status=status;e.actualDate=actualDate||'';e.updatedAt=Date.now();if(!e.runId&&run)e.runId=run.id}\nreturn e;\n}\nfunction tcRemoveScheduleEvent(plannedDate){\nconst i=(TC_course.scheduleEvents||[]).findIndex(e=>e.plannedDate===plannedDate);\nif(i>=0)TC_course.scheduleEvents.splice(i,1);\n}\nfunction tcPullLoadDates(){\nconst a=[];\n(TC_course.history||[]).forEach(h=>{if(h&&h.date&&['course','auxCourse','supplement'].includes(h.courseMode))a.push(h.date)});\n(TC_course.tests||[]).forEach(t=>{if(t&&t.date)a.push(t.date)});\n(TC_course.masteryTests||[]).forEach(t=>{if(t&&t.date)a.push(t.date)});\nif(TC_course.lastCourseDate)a.push(TC_course.lastCourseDate);\nreturn [...new Set(a)].sort();\n}\nfunction tcLastPullLoadDateBefore(key){\nlet last='';for(const d of tcPullLoadDates())if(d<key&&d>last)last=d;return last;\n}\nfunction tcRecoveryReadyOn(key){\nconst last=tcLastPullLoadDateBefore(key);return !last||tcDayDiff(last,key)>=2;\n}\nfunction tcScheduledMainToday(){\nif(!tcWeeklyMode())return false;\nconst today=dateKey();\nif(TC_course.lastCourseDate===today||tcTestDue()||tcMasteryDue())return false;\nif(!TC_course.lastCourseDate&&!TC_course.cycleStartDate)return true;\nreturn tcScheduledOn(today);\n}\nfunction tcCourseDue(){return tcScheduledMainToday()&&tcRecoveryReadyOn(dateKey())}\nfunction tcRecoveryShiftToday(){return tcScheduledMainToday()&&!tcRecoveryReadyOn(dateKey())}\nfunction tcPreviousScheduledDay(key){\nconst d=tcDateFromKey(key);\nfor(let i=1;i<=28;i++){const x=new Date(d);x.setDate(d.getDate()-i);const k=dateKey(x);if(tcScheduledOn(k))return k}\nreturn '';\n}\nfunction tcNextScheduledAfter(key){\nconst d=tcDateFromKey(key);\nfor(let i=1;i<=28;i++){const x=new Date(d);x.setDate(d.getDate()+i);const k=dateKey(x);if(tcScheduledOn(k))return k}\nreturn '';\n}\nfunction tcSyncScheduleEvents(){\nif(!tcWeeklyMode())return false;\nconst today=dateKey(),end=tcDateFromKey(today),start=new Date(end);start.setDate(start.getDate()-28);\nif(TC_course.cycleStartDate){const c=tcDateFromKey(TC_course.cycleStartDate);if(c>start)start.setTime(c.getTime())}if(TC_course.scheduleRuleChangedOn){const r=tcDateFromKey(TC_course.scheduleRuleChangedOn);if(r>start)start.setTime(r.getTime())}\nlet changed=false;\nfor(let d=new Date(start);d<end;d.setDate(d.getDate()+1)){\nconst k=dateKey(d);if(!tcScheduledOn(k))continue;\nconst rec=(TC_course.history||[]).find(h=>h&&h.courseMode==='course'&&((h.plannedDate||h.date)===k));\nif(rec){const status=rec.date===k?'completed':'rescheduled',old=tcScheduleEventFor(k);if(!old||old.status!==status||old.actualDate!==rec.date){tcUpsertScheduleEvent(k,status,rec.date);changed=true}continue}\nif((TC_course.tests||[]).some(t=>t.date===k)||(TC_course.masteryTests||[]).some(t=>t.date===k))continue;\nconst status=tcRecoveryReadyOn(k)?'missed':'recovery_shift',old=tcScheduleEventFor(k);\nif(!old||old.status!==status||old.actualDate){tcUpsertScheduleEvent(k,status,'');changed=true}\n}\nreturn changed;\n}\nfunction tcTransferCandidateRaw(today=dateKey()){\nif(!tcWeeklyMode()||tcScheduledOn(today)||tcTestDue()||tcMasteryDue())return null;\nconst planned=tcPreviousScheduledDay(today);if(!planned)return null;\nconst next=tcNextScheduledAfter(planned);if(!next||today>=next)return null;\nconst e=tcScheduleEventFor(planned);if(!e||!['missed','recovery_shift'].includes(e.status))return null;\nreturn{plannedDate:planned,status:e.status,nextScheduledDate:next,ready:tcRecoveryReadyOn(today)};\n}\nfunction tcTransferCandidate(today=dateKey()){\nconst c=tcTransferCandidateRaw(today);return c&&!(TC_course.transferRestDates||[]).includes(today)?c:null;\n}\nfunction tcNextCourseDay(){\nconst now=tcDateFromKey(dateKey());\nfor(let i=0;i<28;i++){\nconst d=new Date(now);d.setDate(now.getDate()+i);const k=dateKey(d);\nif(tcScheduledOn(k)&&k!==TC_course.lastCourseDate&&(i>0||tcCourseDue()))return k;\n}\nreturn '';\n}\nfunction tcCalendarMonday(){\nconst d=tcDateFromKey(dateKey());\nd.setDate(d.getDate()-(d.getDay()+6)%7+tcWeekOffset*7);return d;\n}\nfunction tcProjectedCourseSeq(key){\nlet seq=TC_course.courseSeq,d=tcDateFromKey(dateKey()),end=tcDateFromKey(key);\nif(key<=dateKey())return seq;\nfor(;d<end;d.setDate(d.getDate()+1)){\nconst k=dateKey(d);\nif(tcScheduledOn(k)&&k!==TC_course.lastCourseDate&&!TC_course.history.some(h=>h.courseMode==='course'&&h.date===k))seq++;\n}\nreturn seq;\n}\nfunction tcPreviewCourseCard(key){\nconst now=dateKey(),records=TC_course.history.filter(h=>h.date===key);\nconst finished=records.filter(h=>['course','auxCourse','supplement'].includes(h.courseMode));\nconst tests=TC_course.tests.filter(t=>t.date===key);\nconst mastery=TC_course.masteryTests.filter(t=>t.date===key);\nlet html='<div class=\"todayCard tcCoursePreview\"><div class=\"row between\"><div><div class=\"dateBig\">'+fmtDate(tcDateFromKey(key))+'</div><div class=\"meta\">Просмотр без изменения расписания и истории</div></div><span class=\"tag stage4\">ПРОСМОТР</span></div>';\nfinished.forEach(h=>{\nhtml+='<div class=\"tcInfoBlock\"><h3>'+(h.courseMode==='course'?'Выполнен комплекс №'+h.courseComplex:h.courseMode==='auxCourse'?'Выполнен вспомогательный комплекс':'Выполнена дополнительная работа')+'</h3>'+\n(h.details||[]).map(d=>'<p>'+tcProgramEscape(d.name)+': '+(d.actual||[]).map(v=>v==null?'—':String(v)).join(' · ')+'</p>').join('')+'</div>';\n});\ntests.forEach(t=>{html+='<div class=\"tcInfoBlock\"><h3>Контрольный максимум</h3><p>'+t.value+' повторений</p></div>'});\nmastery.forEach(t=>{html+='<div class=\"tcInfoBlock\"><h3>Контроль освоения уровня</h3><p>'+(t.passed?'Норматив выполнен':'Норматив не выполнен')+'</p></div>'});\nif(key<now){\nif(!finished.length&&!tests.length&&!mastery.length){\nconst ev=tcScheduleEventFor(key);\nconst msg=ev&&ev.status==='rescheduled'?'Плановая тренировка перенесена и выполнена '+fmtKeyDate(ev.actualDate,false)+'.':\nev&&ev.status==='recovery_shift'?'Плановая тренировка сдвинута из-за восстановления после фактической тяговой нагрузки.':\nev&&ev.status==='missed'?'Плановая тренировка пропущена; последовательность курса не сдвинута.':\nTC_course.cycleStartDate&&key<TC_course.cycleStartDate?'Дата предшествует выбранному началу цикла.':\ntcScheduledOn(key)?'Занятие предусмотрено календарём; записи о выполнении нет.':'На эту дату основное занятие не назначено.';\nhtml+='<div class=\"info\">'+msg+'</div>';\n}\nreturn html+'</div>';\n}\nif(TC_course.cycleStartDate&&key<TC_course.cycleStartDate)return html+'<div class=\"info\">Основные занятия начнутся '+fmtKeyDate(TC_course.cycleStartDate,false)+'.</div></div>';\nif(tcScheduledOn(key)){\nconst seq=tcProjectedCourseSeq(key),complex=tcCourseComplex(seq),defs=tcResolvedCourseDefs(complex),items=tcBuildCourseItems(seq);\nhtml+='<div class=\"row between\" style=\"margin-top:12px\"><div class=\"dateBig\">'+(complex.def?complex.def.name:'Основной комплекс')+'</div><span class=\"tag\">КУРС</span></div>';\nhtml+=items.length?tcCourseRowsHtml(items):'<div class=\"info\">Для выполнения комплекса требуется оборудование или калибровка. См. действующий план в день занятия.</div>';\nhtml+=tcAdaptationNote(defs);\nhtml+='<div class=\"meta\" style=\"margin-top:10px\">Предварительный план. После предыдущих занятий, пропусков и контрольных замеров комплекс или нагрузка могут измениться. Начать тренировку из режима просмотра нельзя.</div>';\n}else{\nconst extras=tcBuildExtraItems();\nhtml+='<div class=\"dateBig\" style=\"margin-top:12px\">День без основного комплекса</div>';\nhtml+=extras.length?tcExtraRowsHtml(extras)+'<div class=\"meta\" style=\"margin-top:9px\">Дополнительные упражнения необязательны; их выполнение не записано.</div>':'<div class=\"info\">Дополнительные упражнения не выбраны. День отдыха.</div>';\n}\nreturn html+'</div>';\n}\nwindow.tcSelectCourseDay=function(key){\nif(!/^\\d{4}-\\d{2}-\\d{2}$/.test(key))return;\nconst d=tcDateFromKey(key);\nif(!Number.isFinite(d.getTime())||dateKey(d)!==key)return;\ntcSelectedDate=key;render();\n};\nwindow.tcShiftCourseWeek=function(direction){\nif(direction!==-1&&direction!==1)return;\ntcWeekOffset=Math.max(-52,Math.min(52,tcWeekOffset+direction));\ntcSelectedDate=dateKey(tcCalendarMonday());render();\n};\nwindow.tcShowCourseToday=function(){tcWeekOffset=0;tcSelectedDate='';render()};\nfunction tcWeeklyCalendarHtml(){\nif(!tcWeeklyMode())return '';\nconst names=['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'],today=dateKey(),selected=tcSelectedDate||today;\nconst mon=tcCalendarMonday(),sun=new Date(mon);sun.setDate(mon.getDate()+6);\nconst days=Array.from({length:7},(_,i)=>{\nconst d=new Date(mon);d.setDate(mon.getDate()+i);\nconst key=dateKey(d),planned=tcScheduledOn(key)||(key===today&&tcCourseDue()),ev=tcScheduleEventFor(key);\nconst done=TC_course.history.some(h=>h.courseMode==='course'&&h.date===key);\nconst test=TC_course.tests.some(t=>t.date===key)||TC_course.masteryTests.some(t=>t.date===key);\nconst dueTest=key===today&&(tcTestDue()||tcMasteryDue()),dueAux=key===today&&tcAuxDue();\nconst transferred=!!ev&&ev.status==='rescheduled',shifted=(!!ev&&ev.status==='recovery_shift')||(key===today&&tcRecoveryShiftToday());\nconst missed=(!!ev&&ev.status==='missed')||(key<today&&planned&&!done&&!test&&!transferred&&!shifted);\nconst type=test?'ТЕСТ':done?'ГОТОВО':transferred?'ПЕРЕН.':dueTest?'ТЕСТ':shifted?'ВОССТ.':dueAux?'К№2':missed?'ПРОП.':planned?'КУРС':TC_course.cycleStartDate&&key<TC_course.cycleStartDate?'ДО СТ.':tcExtraExercises().length?'ДОП.':'ОТД.';\nconst status=(key===today?' tcWeekToday':'')+(key===selected?' tcWeekSelected':'');\nreturn '<button type=\"button\" class=\"tcWeekDay'+status+'\" aria-pressed=\"'+(key===selected?'true':'false')+'\" onclick=\"tcSelectCourseDay(\\''+key+'\\')\"><b>'+names[i]+'</b><span>'+d.getDate()+'</span><small>'+type+'</small></button>';\n});\nreturn '<div class=\"tcWeekNav\"><button type=\"button\" onclick=\"tcShiftCourseWeek(-1)\" aria-label=\"Предыдущая неделя\">‹</button><span>'+fmtKeyDate(dateKey(mon),false)+' — '+fmtKeyDate(dateKey(sun),false)+'</span><button type=\"button\" onclick=\"tcShiftCourseWeek(1)\" aria-label=\"Следующая неделя\">›</button><button type=\"button\" class=\"tcWeekReset\" onclick=\"tcShowCourseToday()\">Сегодня</button></div>'+\n'<div class=\"tcWeekCalendar\" aria-label=\"Расписание недели\">'+days.join('')+'</div>';\n}\nfunction tcBaseExerciseAvailable(ex){\nif(!ex)return false;\nif(['weightedPull','bandPull','benchDip','dipBars','australianPull','towelHang'].includes(ex.id))return false;\nconst name=String(ex.name||'').toLowerCase();\nif(/резин|гантел|гир|штанг|весом|отягощ|стул|скамь|полотен|брус|кольц|блок|тренаж|низк.*(перекладин|турник)|австралийск|эспандер|шведск.*стенк/i.test(name))return false;\nreturn true;\n}\nfunction tcExtraExercises(){return selected().filter(e=>!TC_PULL_HEAVY_IDS.has(e.id)&&e.g!=='Турник'&&e.g!=='Элементы'&&tcBaseExerciseAvailable(e))}\nfunction tcConflictExercises(){return selected().filter(e=>TC_PULL_HEAVY_IDS.has(e.id)||e.g==='Турник'||e.g==='Элементы')}\nfunction tcUnitForMetric(m){return m==='time'||m==='time_side'?'сек.':m==='reps_side'?'повт./стор.':m==='weighted'?'повт.':'повт.'}\nfunction tcItemLoad(def){return def.metric==='weighted'?TC_course.weightedLoad:0}\nfunction tcLastActualFor(id){for(const h of TC_course.history){const d=(h.details||[]).find(x=>x.id===id);if(d&&Array.isArray(d.actual)){for(let i=d.actual.length-1;i>=0;i--)if(Number.isFinite(+d.actual[i])&&+d.actual[i]>0)return +d.actual[i]}}return null}\nfunction tcSchemeLabel(def){\nconst s=def.scheme||{};\nif(s.label)return s.label;\nif(s.type==='fixed')return String(s.value);\nif(s.type==='max')return 'MAX';\nif(s.type==='percent')return Math.round((s.pct||0)*100)+'% MAX';\nif(s.type==='range_reps')return s.min+'–'+s.max;\nif(s.type==='timed')return String(s.value);\nif(s.type==='choice')return 'НА ВЫБОР';\nreturn '—';\n}\nfunction tcVariantKey(def){return def&&def.scheme&&def.scheme.type==='percent'&&!def.scheme.ref?def.id:null}\nfunction tcVariantMax(def){\nconst key=tcVariantKey(def);if(!key)return null;\nif(key==='c_asym80'){\nconst left=+TC_course.exerciseMax.c_asym80_left,right=+TC_course.exerciseMax.c_asym80_right;\nreturn Number.isInteger(left)&&left>0&&Number.isInteger(right)&&right>0?Math.min(left,right):null;\n}\nconst n=+TC_course.exerciseMax[key];\nreturn Number.isInteger(n)&&n>0?n:null;\n}\nfunction tcUncalibrated(defs){\nreturn defs.filter(def=>tcVariantKey(def)&&tcVariantMax(def)==null);\n}\nfunction tcSchemeTarget(def){\nconst s=def.scheme||{};\nif(s.type==='fixed'||s.type==='timed')return Math.max(0,+s.value||0);\nif(s.type==='percent'){\nconst base=s.ref==='pull'?TC_course.pullMax:tcVariantMax(def);\nreturn base!=null&&base>0?Math.max(1,Math.floor(base*(+s.pct||0))):null;\n}\nif(s.type==='range_reps')return Math.max(1,+s.min||1);\nif(s.type==='max'&&s.ref==='pull')return TC_course.pullMax;\nreturn tcLastActualFor(def.id)||1;\n}\nfunction tcDisplayScheme(def){\nconst s=def.scheme||{};\nif(s.type==='percent')return tcSchemeTarget(def)==null?'MAX НЕ УКАЗАН':tcSchemeTarget(def)+' · '+Math.round(s.pct*100)+'% от '+(s.ref==='pull'?TC_course.pullMax:tcVariantMax(def));\nreturn tcSchemeLabel(def);\n}\nfunction tcAdvancedChoicePool(){\nif(TC_course.level!==7)return[];\nif(TC_course.goal==='muscleup')return tcRunnableDefs(TC_COURSE[5].complexes[1].items);\nreturn tcRunnableDefs(Object.values(TC_COURSE[6].complexes).flatMap(c=>c.items));\n}\nfunction tcAdvancedSelected(){\nconst chosen=TC_course.advancedChoices[TC_course.goal]||[];\nconst pool=tcAdvancedChoicePool();\nreturn chosen.length===2&&chosen[0]!==chosen[1]&&\nchosen.every(id=>pool.some(def=>def.id===id));\n}\nfunction tcResolvedCourseDefs(c){\nif(TC_course.level!==7||!tcAdvancedSelected())return c.def.items;\nconst picked=TC_course.advancedChoices[TC_course.goal],pool=tcAdvancedChoicePool();\nlet index=0;\nreturn c.def.items.map(def=>{\nif(def.scheme&&def.scheme.type==='choice'){\nconst src=pool.find(x=>x.id===picked[index]);\nindex++;\nreturn src?{...src,id:src.id+'_lv7_'+index}:def;\n}\nreturn def;\n});\n}\nwindow.tcOpenAdvancedChoiceSheet=function(){\nif(TC_course.level!==7){tcActionMessage('Выбор упражнений недоступен','Два вспомогательных упражнения выбираются только для 7-го уровня курса.');return;}\nconst pool=tcAdvancedChoicePool(),chosen=TC_course.advancedChoices[TC_course.goal]||[];\nif(!pool.length){tcActionMessage('Нет упражнений для выбора','Для текущей цели не удалось сформировать список допустимых упражнений.');return;}\nq('sheetbox').innerHTML='<div class=\"sheettitle\">Упражнения для 7-го уровня</div>'+\n'<div class=\"sub\" style=\"margin-top:6px\">По курсу выберите два разных упражнения из '+\n(TC_course.goal==='muscleup'?'комплекса №1 пятого уровня':'любого комплекса шестого уровня')+\n'. Их объём и отдых будут взяты из соответствующих комплексов; PDF седьмого уровня не устанавливает для них отдельных чисел.</div>'+\npool.map(def=>'<label style=\"display:flex;gap:10px;align-items:flex-start;padding:11px 3px;border-bottom:1px solid #34414d\">'+\n'<input type=\"checkbox\" class=\"tcAdvancedSelect\" value=\"'+def.id+'\" '+\n(chosen.includes(def.id)?'checked':'')+'>'+\n'<span><b>'+def.name+'</b><br><small>'+tcProgramPrescription(def)+' · отдых '+tcCourseRestText(def.rest)+'</small></span></label>').join('')+\n'<div id=\"tcAdvancedError\" class=\"meta\" style=\"margin-top:9px\">Выберите ровно два упражнения.</div>'+\n'<button class=\"btn yellow full\" style=\"margin-top:12px\" onclick=\"tcSaveAdvancedChoices()\">Сохранить выбор</button>'+\n'<button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"closeSheet()\">Отмена</button>';\nq('sheet').classList.add('open');\n};\nwindow.tcSaveAdvancedChoices=function(){\nif(TC_course.level!==7){tcActionMessage('Выбор не сохранён','Текущий уровень курса уже изменился. Откройте настройки заново.');return;}\nconst ids=Array.from(document.querySelectorAll('.tcAdvancedSelect:checked')).map(el=>el.value);\nconst pool=tcAdvancedChoicePool();\nif(ids.length!==2||ids[0]===ids[1]||ids.some(id=>!pool.some(x=>x.id===id))){\nconst error=document.getElementById('tcAdvancedError');\nif(error)error.textContent='Для продолжения требуется выбрать ровно два разных упражнения.';\nreturn;\n}\nTC_course.advancedChoices[TC_course.goal]=ids;\ntcSaveCourse();closeSheet();render();\nif(typeof window.tcShowRuntimeNotice==='function')window.tcShowRuntimeNotice('Выбор упражнений сохранён.');\n};\nfunction tcCalibrationDefs(mode,all=false){\nconst raw=tcRunnableDefs(mode==='aux'&&[3,6].includes(TC_course.level)?TC_COURSE[TC_course.level].complexes[2].items:tcResolvedCourseDefs(tcCourseComplex()));\nreturn all?raw.filter(def=>tcVariantKey(def)):tcUncalibrated(raw);\n}\nfunction tcCalibrationCard(mode){\nif(!tcCalibrationDefs(mode).length)return '';\nreturn '<div class=\"todayCard\" style=\"border-color:#d5a84e;margin-top:10px\">'+\n'<div class=\"dateBig\">Укажите контрольные максимумы</div>'+\n'<div class=\"meta\">Для расчёта повторений в отдельных вариантах подтягиваний. Максимум обычных подтягиваний не подменяет результат другого упражнения.</div>'+\n'<button class=\"btn yellow full\" style=\"margin-top:10px\" data-mode=\"'+mode+'\" onclick=\"tcOpenCourseCalibration(this.dataset.mode)\">Ввести результаты</button></div>';\n}\nwindow.tcOpenCourseCalibration=function(mode){\nif(W){tcActionMessage('Настройка недоступна','Сначала завершите текущую тренировку или выйдите из неё без сохранения.');return;}\nmode=String(mode||'');\nif(!['main','main:all','aux','aux:all'].includes(mode)){tcActionMessage('Не удалось открыть форму','Неизвестный тип контрольных максимумов. Откройте настройку заново.');return;}\nconst all=mode==='main:all'||mode==='aux:all';\nconst kind=mode.startsWith('aux')?'aux':'main';\nconst defs=tcCalibrationDefs(kind,all);\nif(!defs.length){tcActionMessage('Контрольные максимумы не требуются','Для текущего комплекса нет упражнений, которым нужно отдельно задавать максимум.');return;}\nconst fields=defs.map(def=>{\nconst sides=def.id==='c_asym80';\nconst names=sides?[\n{key:def.id+'_left',title:'Максимум на левую руку'},\n{key:def.id+'_right',title:'Максимум на правую руку'}\n]:[{key:def.id,title:'Максимум повторений'}];\nreturn '<div class=\"tcInfoBlock\"><h3>'+tcProgramEscape(def.name)+'</h3>'+\nnames.map(field=>'<label style=\"display:block;font-size:13px;margin:8px 0\">'+field.title+\n'<input type=\"number\" id=\"tcCal_'+field.key+'\" value=\"'+(TC_course.exerciseMax[field.key]||'')+'\" min=\"1\" step=\"1\" inputmode=\"numeric\" style=\"display:block;width:100%;box-sizing:border-box;padding:10px;background:#0c1218;color:#fff;border:1px solid #44515b;border-radius:9px;margin-top:5px\"></label>').join('')+\n(sides?'<div class=\"meta\">Для общего числа повторений на каждую сторону используется меньший из двух результатов. Это правило расчёта TurnikCoach, а не отдельное указание автора.</div>':'')+'</div>';\n}).join('');\nq('sheetbox').innerHTML='<div class=\"sheettitle\">Контрольные максимумы</div>'+\n'<div class=\"sub\">Введите реальные результаты каждого варианта подтягиваний. Без них назначать процент от MAX нельзя.</div>'+\nfields+'<div id=\"tcCalError\" class=\"meta\" style=\"margin-top:8px\"></div>'+\n'<button class=\"btn yellow full\" data-mode=\"'+mode+'\" onclick=\"tcSaveCourseCalibration(this.dataset.mode)\">Сохранить</button>'+\n'<button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"closeSheet()\">Отмена</button>';\nq('sheet').classList.add('open');\n};\nwindow.tcSaveCourseCalibration=function(mode){\nmode=String(mode||'');\nif(!['main','main:all','aux','aux:all'].includes(mode)){tcActionMessage('Результаты не сохранены','Форма устарела или была открыта некорректно. Откройте её заново.');return;}\nconst all=mode==='main:all'||mode==='aux:all';\nconst kind=mode.startsWith('aux')?'aux':'main';\nconst defs=tcCalibrationDefs(kind,all),pending={};\nif(!defs.length){tcActionMessage('Результаты не сохранены','Для текущего комплекса больше нет упражнений, требующих отдельного максимума.');return;}\nfor(const def of defs){\nconst keys=def.id==='c_asym80'?[def.id+'_left',def.id+'_right']:[def.id];\nfor(const key of keys){\nconst el=document.getElementById('tcCal_'+key);\nif(!el){tcActionMessage('Результаты не сохранены','Поле контрольного максимума исчезло из формы. Откройте настройку заново.');return;}\nconst raw=el.value.trim(),n=Number(raw);\nif(!raw||!Number.isSafeInteger(n)||n<1){\nel.style.borderColor='#ff7777';\nconst warn=document.getElementById('tcCalError');\nif(warn)warn.textContent='Для каждого упражнения укажите целый положительный максимум.';\nif(typeof el.focus==='function')el.focus();\nreturn;\n}\npending[key]=n;\n}\n}\nObject.assign(TC_course.exerciseMax,pending);\ntcSaveCourse();closeSheet();render();\nif(typeof window.tcShowRuntimeNotice==='function')window.tcShowRuntimeNotice('Контрольные максимумы сохранены.');\n};\nfunction tcBuildItemsFor(defs){\nreturn tcRunnableDefs(defs).map(def=>{\nconst target=tcSchemeTarget(def),labels=Array.from({length:def.sets},()=>tcDisplayScheme(def));\nconst e={id:def.id,name:def.name,metric:def.metric||'reps',max:TC_course.pullMax,load:tcItemLoad(def),courseDef:def,media:'',muscles:[]};\nreturn{e,def,plan:Array.from({length:def.sets},()=>target),planLabels:labels,actual:[]};\n});\n}\nfunction tcNeedsWorkingWeight(mode){\nconst defs=tcRunnableDefs(mode==='aux'&&[3,6].includes(TC_course.level)?\nTC_COURSE[TC_course.level].complexes[2].items:tcResolvedCourseDefs(tcCourseComplex()));\nreturn defs.some(def=>def.metric==='weighted')&&!(TC_course.weightedLoad>0);\n}\nfunction tcWorkingWeightCard(mode){\nreturn '<div class=\"todayCard\" style=\"border-color:#d5a84e;margin-top:10px\">'+\n'<div class=\"dateBig\">Назначьте рабочий вес</div>'+\n'<div class=\"meta\">В комплексе предусмотрены подтягивания с дополнительным весом. Конкретный вес необходимо указать самостоятельно; приложение не определяет его без фактического результата.</div>'+\n'<button class=\"btn yellow full\" style=\"margin-top:10px\" data-mode=\"'+mode+\n'\" onclick=\"tcOpenWorkingWeight(this.dataset.mode)\">Указать дополнительный вес</button></div>';\n}\nwindow.tcOpenWorkingWeight=function(mode){\nif(W){tcActionMessage('Настройка недоступна','Сначала завершите текущую тренировку или выйдите из неё без сохранения.');return;}\nmode=String(mode||'');\nif(!['main','aux'].includes(mode)){tcActionMessage('Не удалось открыть форму','Неизвестный тип тренировки для дополнительного веса.');return;}\nconst box=q('sheetbox'),sheet=q('sheet');\nif(!box||!sheet){tcActionMessage('Не удалось открыть форму','Интерфейс настройки веса недоступен. Вернитесь на экран «Сегодня» и повторите.');return;}\nbox.innerHTML='<div class=\"sheettitle\">Дополнительный вес</div>'+\n'<div class=\"sub\">Введите фактически выбранный вес отягощения в килограммах. В PDF для этого комплекса требуется максимальный рабочий вес, но конкретная масса не указана.</div>'+\n'<input type=\"number\" id=\"tcWorkingWeightInput\" min=\"0.5\" step=\"0.5\" inputmode=\"decimal\" value=\"'+(TC_course.weightedLoad||'')+'\" style=\"width:100%;box-sizing:border-box;margin:14px 0;background:#0c1218;color:#fff;padding:11px;border:1px solid #344250;border-radius:9px\">'+\n'<div id=\"tcWorkingWeightError\" class=\"meta\"></div>'+\n'<button class=\"btn yellow full\" data-mode=\"'+(mode==='aux'?'aux':'main')+'\" onclick=\"tcSaveWorkingWeight(this.dataset.mode)\">Сохранить</button>'+\n'<button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"closeSheet()\">Отмена</button>';\nsheet.classList.add('open');\n};\nwindow.tcSaveWorkingWeight=function(mode){\nconst el=document.getElementById('tcWorkingWeightInput');\nif(!el){tcActionMessage('Вес не сохранён','Поле дополнительного веса отсутствует. Откройте форму заново.');return;}\nconst raw=el.value.trim(),value=Number(raw);\nif(!raw||!Number.isFinite(value)||value<=0||value>1000){\nconst msg=document.getElementById('tcWorkingWeightError');\nif(msg)msg.textContent='Укажите положительное значение дополнительного веса в килограммах.';\nif(typeof el.focus==='function')el.focus();\nreturn;\n}\nTC_course.weightedLoad=value;\nconst wp=state.ex.find(e=>e.id==='weightedPull');if(wp)wp.load=value;\ntcSaveCourse();save();closeSheet();render();\nif(typeof window.tcShowRuntimeNotice==='function')window.tcShowRuntimeNotice('Дополнительный вес сохранён: '+value+' кг.');\n};\nfunction tcBuildCourseItems(seqIndex=TC_course.courseSeq){const c=tcCourseComplex(seqIndex);return c.def?tcBuildItemsFor(tcResolvedCourseDefs(c)):[]}\nfunction tcBuildAuxItems(){return [3,6].includes(TC_course.level)?tcBuildItemsFor(TC_COURSE[TC_course.level].complexes[2].items):[]}\nfunction tcBuildExtraItems(){const idx=TC_course.extraSeq%3;return tcExtraExercises().map(e=>({e,plan:pres(e,idx),actual:[]}))}\nfunction tcCourseRestText(r){if(!r)return'—';if(r.type==='fixed')return Math.round(r.sec/60)+' мин';if(r.type==='range')return Math.round(r.min/60)+'–'+Math.round(r.max/60)+' мин';return r.label||'по усмотрению'}\nfunction tcAdaptiveCourseRest(def,target,actual,skipped){\nconst r=def.rest||{type:'manual',label:'по усмотрению'};\nif(r.type==='fixed')return{manual:false,seconds:r.sec,note:'По курсу: '+tcCourseRestText(r)};\nif(r.type==='manual')return{manual:true,label:r.label||'по усмотрению',note:'По курсу: '+(r.label||'по усмотрению')};\nlet sec=Math.round((r.min+r.max)/2/15)*15;\nconst st=def.scheme||{};\nif(st.type==='max')sec=r.max;\nelse if(skipped)sec=r.max;\nelse if(target>0&&Number.isFinite(+actual)){\nconst ratio=(+actual||0)/target;if(ratio<.9)sec=r.max;else if(ratio>1.2)sec=r.min;\n}\nsec=tcClamp(sec,r.min,r.max);\nreturn{manual:false,seconds:sec,note:'Диапазон курса '+tcCourseRestText(r)+' · TurnikCoach выбрал '+Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')};\n}\nfunction tcCourseCardHtml(){\nconst l=tcCourseLevel(),c=tcCourseComplex(),enabled=TC_course.enabled;\nreturn '<div class=\"card\" id=\"tcCourseCard\" style=\"margin-bottom:12px;border-color:'+(enabled?'#ffd84d':'#2c3945')+'\">'+\n'<div class=\"row between\"><div class=\"grow\"><div class=\"k\">ПРОГРАММА</div><div class=\"strong\" style=\"font-size:18px;margin-top:3px\">Курс Морозова</div><div class=\"meta\">«Подтягивания с нуля до киборга»</div></div><span class=\"tag '+(enabled?'':'stage4')+'\">'+(enabled?'ВКЛЮЧЁН':'ВЫКЛЮЧЕН')+'</span></div>'+\n(enabled?'<div class=\"tcInfoBlock\"><h3>Оборудование: только турник</h3><p>В тренировочный план не включаются упражнения, требующие резины, отягощения, полотенца, стула или низкой перекладины.</p></div><div class=\"tcInfoBlock\"><h3>'+l.title+'</h3><p><b>Цель:</b> '+tcCourseGoalName(TC_course.goal)+'<br><b>Следующий:</b> '+(c.def?c.def.name:'—')+'<br><b>Текущий максимум:</b> '+TC_course.pullMax+'<br><b>Частота по курсу:</b> '+l.frequency+'</p></div>':'<div class=\"sub\" style=\"margin-top:10px\">Отдельная система тренировок: уровни, комплексы, проценты, MAX, отдых и контрольные критерии берутся из курса. Остальные упражнения TurnikCoach можно использовать отдельно.</div>')+\n'<button class=\"btn yellow full\" style=\"margin-top:12px\" onclick=\"tcOpenCourseProgram()\">Программа курса</button>'+ '<button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"tcOpenCourseSettings()\">'+(enabled?'Настройки курса':'Подключить курс')+'</button></div>';\n}\nfunction tcActionMessage(title,text){\nconst box=q('sheetbox'),sheet=q('sheet');\nif(!box||!sheet){\nif(typeof window.tcShowRuntimeNotice==='function')window.tcShowRuntimeNotice(title+': '+text,'danger');\nreturn false;\n}\nbox.innerHTML='<div class=\"sheettitle\">'+title+'</div>'+\n'<div class=\"sub\" style=\"margin-top:7px;line-height:1.45\">'+text+'</div>'+\n'<button id=\"tcActionMessageClose\" type=\"button\" class=\"btn yellow full\" style=\"margin-top:16px\">Понятно</button>';\nsheet.classList.add('open');\nconst close=document.getElementById('tcActionMessageClose');\nif(close)close.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation()}closeSheet();return false};\nreturn true;\n}\nwindow.tcActionMessage=tcActionMessage;\nfunction tcGroupCourseSettings(box){\nif(!box||box.querySelector('.tcSettingsGroups'))return;\nconst error=box.querySelector('#tcSettingsError');\nconst save=[...box.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('tcSaveCourseSettings'));\nconst cancel=[...box.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('closeSheet'));\nif(!error||!save||!cancel)return;\nconst title=box.querySelector('.sheettitle');\nconst intro=title&&title.nextElementSibling&&title.nextElementSibling.classList.contains('sub')?title.nextElementSibling:null;\nconst candidates=[...box.children].filter(n=>n!==title&&n!==intro&&n!==error&&n!==save&&n!==cancel);\nconst groups={main:[],schedule:[],extra:[],control:[],system:[]};\nconst has=(node,id)=>!!(node.id===id||(node.querySelector&&node.querySelector('#'+id)));\ncandidates.forEach(node=>{\nconst text=(node.textContent||'').trim();\nif(['tcCourseEnabled','tcCourseLevel','tcCourseMax','tcCourseGoal'].some(id=>has(node,id)))groups.main.push(node);\nelse if(['tcWeeklySessions','tcCycleStartDate'].some(id=>has(node,id)))groups.schedule.push(node);\nelse if(['tcAuxEnabled','tcAuxInterval3','tcCourseSupplement'].some(id=>has(node,id))||\n/Изменить максимумы|Выбрать два упражнения 7-го уровня/.test(text))groups.extra.push(node);\nelse if(['tcTargetMax','tcTestWeeks'].some(id=>has(node,id)))groups.control.push(node);\nelse groups.system.push(node);\n});\nconst wrap=document.createElement('div');wrap.className='tcSettingsGroups';\nconst append=(key,label,open)=>{\nif(!groups[key].length)return;\nconst details=document.createElement('details');details.className='tcSettingsGroup';details.dataset.group=key;details.open=!!open;\nconst summary=document.createElement('summary');summary.textContent=label;\nconst body=document.createElement('div');body.className='tcSettingsGroupBody';\ngroups[key].forEach(n=>body.appendChild(n));\ndetails.appendChild(summary);details.appendChild(body);wrap.appendChild(details);\n};\nappend('main','Основное',true);\nappend('schedule','Расписание',false);\nappend('extra','Дополнительная работа',false);\nappend('control','Контроль прогресса',false);\nappend('system','Система и оборудование',false);\nbox.insertBefore(wrap,error);\n}\nwindow.tcOpenCourseSettings=function(){\nif(W){tcActionMessage('Настройки недоступны','Сначала завершите текущую тренировку или выйдите из неё без сохранения.');return;}\ntcNormalizeGoal();const l=tcCourseLevel(),goals=tcGoalOptions(TC_course.level);\nconst box=q('sheetbox'),sheet=q('sheet');\nif(!box||!sheet){tcActionMessage('Не удалось открыть настройки','Экран настроек недоступен. Вернитесь в раздел «Тренировка» и повторите.');return;}\nbox.innerHTML='<div class=\"sheettitle\">Курс Морозова</div><div class=\"sub\" style=\"margin-top:6px\">Оборудование: только турник. В исходной программе доступны все упражнения автора, но задания с дополнительными снарядами не назначаются. Упражнения без оборудования из обычного каталога доступны отдельно.</div>'+\n'<div class=\"tcInfoBlock\"><h3>Состояние</h3><p><label class=\"tcCheckRow\" style=\"display:flex;gap:9px;align-items:center\"><input id=\"tcCourseEnabled\" type=\"checkbox\" '+(TC_course.enabled?'checked':'')+'> Включить курс Морозова</label></p></div>'+\n'<div class=\"tcInfoBlock\"><h3>Уровень</h3><p><select id=\"tcCourseLevel\" style=\"width:100%;margin-top:4px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px\">'+Object.keys(TC_COURSE).map(n=>'<option value=\"'+n+'\" '+(+n===TC_course.level?'selected':'')+'>'+n+' · '+TC_COURSE[n].title+'</option>').join('')+'</select></p></div>'+\n'<div class=\"tcInfoBlock\"><h3>Текущий максимум</h3><p><input id=\"tcCourseMax\" type=\"number\" min=\"1\" value=\"'+TC_course.pullMax+'\" style=\"width:100%;box-sizing:border-box;margin-top:4px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px\"></p></div>'+\n'<div class=\"tcInfoBlock\"><h3>Цель</h3><p><select id=\"tcCourseGoal\" style=\"width:100%;margin-top:4px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px\">'+goals.map(g=>'<option value=\"'+g[0]+'\" '+(g[0]===TC_course.goal?'selected':'')+'>'+g[1]+'</option>').join('')+'</select></p></div>'+\n((TC_course.level===4&&TC_course.goal==='quantity')||TC_course.level===2?'<div class=\"tcInfoBlock\"><h3>Основной комплекс · недельный план</h3><p>Число тренировок: <select id=\"tcWeeklySessions\" style=\"background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:8px;padding:7px\">'+(TC_course.level===2?'<option value=\"2\" '+(TC_course.weeklySessions===2?'selected':'')+'>2 раза в неделю</option>':'')+'<option value=\"3\" '+(TC_course.weeklySessions===3?'selected':'')+'>3 раза в неделю</option><option value=\"4\" '+(TC_course.weeklySessions===4?'selected':'')+'>4 раза в неделю</option></select><br><br>Дни занятий рассчитываются от даты начала цикла. Частота и интервалы сохраняются; при четырёх занятиях два тренировочных дня на границе недель могут идти подряд.</p></div>':'')+\n'<div class=\"tcInfoBlock\"><h3>Начало тренировочного цикла</h3><p><input id=\"tcCycleStartDate\" type=\"date\" value=\"'+(TC_course.cycleStartDate||dateKey())+'\" style=\"box-sizing:border-box;width:100%;margin-top:5px;background:#0c1218;color:#fff;color-scheme:dark;border:1px solid #3a4653;border-radius:8px;padding:10px\"></p><p class=\"meta\">Первое занятие назначается на выбранную дату независимо от дня недели. Предыдущие результаты и история не изменяются.</p><div id=\"tcCycleDateError\" class=\"meta\" style=\"color:#ffd84d\"></div></div>'+\n([3,6].includes(TC_course.level)?'<div class=\"tcInfoBlock\"><h3>Вспомогательный комплекс №2</h3><p><label class=\"tcCheckRow\" style=\"display:flex;gap:9px;align-items:flex-start\"><input id=\"tcAuxEnabled\" type=\"checkbox\" '+(TC_course.auxEnabled[TC_course.level]?'checked':'')+'><span>Предлагать отдельную дополнительную тренировку по комплексу №2</span></label></p>'+\n(TC_course.level===3?'<p>Периодичность: <select id=\"tcAuxInterval3\" style=\"background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:8px;padding:7px\"><option value=\"7\" '+(TC_course.auxInterval3===7?'selected':'')+'>Раз в 7 дней</option><option value=\"10\" '+(TC_course.auxInterval3===10?'selected':'')+'>Раз в 10 дней</option></select></p>':'<p>Не чаще одного раза в 10 дней.</p>')+\n'<p class=\"meta\">Это дополнительная тяговая работа из PDF; она не заменяет основной комплекс и не назначается на день основной тренировки или испытания. Включается по вашему выбору.</p></div>':'')+\n(tcCalibrationDefs('main',true).length?'<button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"tcOpenCourseCalibration(\\'main:all\\')\">Изменить максимумы отдельных вариантов</button>':'')+\n([3,6].includes(TC_course.level)&&tcCalibrationDefs('aux',true).length?'<button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"tcOpenCourseCalibration(\\'aux:all\\')\">Изменить максимумы вспомогательного комплекса</button>':'')+\n'<div class=\"tcInfoBlock\"><h3>Оборудование</h3><p>Только турник. Упражнения с резиной, отягощением, полотенцем, стулом и низкой перекладиной сохраняются в справочнике курса, но не включаются в назначаемую тренировку.</p></div>'+ \n(l.supplement?'<div class=\"tcInfoBlock\"><h3>Дополнительные подтягивания по курсу</h3><p><label class=\"tcCheckRow\" style=\"display:flex;gap:9px;align-items:flex-start\"><input id=\"tcCourseSupplement\" type=\"checkbox\" '+(TC_course.authorSupplement?'checked':'')+'><span>'+l.supplement+'</span></label></p></div>':'')+\n(TC_course.level===4&&TC_course.goal==='quantity'?'<div class=\"tcInfoBlock\"><h3>Контроль максимума · TurnikCoach</h3><p>Цель: <input id=\"tcTargetMax\" type=\"number\" min=\"1\" step=\"1\" value=\"'+TC_course.targetMax+'\" style=\"width:65px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:8px;padding:7px\"> повторений.<br><br>Проверять каждые <select id=\"tcTestWeeks\" style=\"background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:8px;padding:7px\">'+[2,3,4].map(n=>'<option value=\"'+n+'\" '+(TC_course.testPeriodWeeks===n?'selected':'')+'>'+n+' недели</option>').join('')+'</select><br><br>Контроль назначается после восстановления; результат сохраняется отдельно от основной тренировки.</p></div>':'')+\n(TC_course.level===7?'<button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"tcOpenAdvancedChoiceSheet()\">Выбрать два упражнения 7-го уровня</button>':'')+\n'<div class=\"tcInfoBlock\"><h3>Версия</h3><p>Hotfix: <b>'+(window.__TC_HOTFIX_LABEL||window.__TC_HOTFIX_VERSION||'не определён')+'</b><br>Модуль курса: <b>'+COURSE_MODULE_VERSION+'</b>'+(window.__TC_HOTFIX_INSTALLED_AT?'<br>Активирован: '+new Date(window.__TC_HOTFIX_INSTALLED_AT).toLocaleString('ru-RU'):'')+'</p></div>'+\n'<div id=\"tcSettingsError\" class=\"meta\" style=\"color:#ff9b9b;margin-top:10px\"></div>'+\n'<button class=\"btn yellow full\" style=\"margin-top:14px\" onclick=\"tcSaveCourseSettings()\">Сохранить</button><button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"closeSheet()\">Отмена</button>';\ntcGroupCourseSettings(box);\nsheet.classList.add('open');\nconst levelEl=document.getElementById('tcCourseLevel');\nif(levelEl)levelEl.onchange=()=>{\nconst select=document.getElementById('tcCourseGoal');\nif(!select){tcActionMessage('Настройки изменились','Поле цели недоступно. Закройте настройки и откройте их заново.');return;}\nconst choices=tcGoalOptions(+levelEl.value||TC_course.level),previous=select.value;\nselect.innerHTML=choices.map(x=>'<option value=\"'+x[0]+'\">'+x[1]+'</option>').join('');\nselect.value=choices.some(x=>x[0]===previous)?previous:choices[0][0];\n};\n};\nwindow.tcSaveCourseSettings=function(){\nconst oldLevel=TC_course.level,oldGoal=TC_course.goal,oldWeekly=TC_course.weeklySessions,oldStart=TC_course.cycleStartDate,oldEnabled=TC_course.enabled;\nconst fail=(message,el)=>{\nif(el){\nconst group=el.closest&&el.closest('details.tcSettingsGroup');if(group)group.open=true;\nel.style.borderColor='#ff7777';if(typeof el.focus==='function')el.focus();\n}\nconst error=document.getElementById('tcSettingsError');\nif(error){error.textContent=message;return false;}\ntcActionMessage('Настройки не сохранены',message);\nreturn false;\n};\nconst enabled=document.getElementById('tcCourseEnabled');\nconst level=document.getElementById('tcCourseLevel');\nconst mx=document.getElementById('tcCourseMax');\nconst goal=document.getElementById('tcCourseGoal');\nconst startEl=document.getElementById('tcCycleStartDate');\nif(!enabled||!level||!mx||!goal||!startEl){\nfail('Форма настроек изменилась или загрузилась не полностью. Закройте её и откройте заново.');\nreturn;\n}\nconst nextLevel=Number(level.value);\nif(!Number.isInteger(nextLevel)||nextLevel<1||nextLevel>7){\nfail('Выберите допустимый уровень курса от 1 до 7.',level);\nreturn;\n}\nconst maxRaw=String(mx.value||'').trim(),nextMax=Number(maxRaw);\nif(!maxRaw||!Number.isSafeInteger(nextMax)||nextMax<1){\nfail('Текущий максимум должен быть целым положительным числом.',mx);\nreturn;\n}\nconst nextGoal=String(goal.value||'');\nconst allowedGoals=tcGoalOptions(nextLevel).map(x=>x[0]);\nif(!allowedGoals.includes(nextGoal)){\nfail('Выбранная цель не подходит для указанного уровня. Выберите цель заново.',goal);\nreturn;\n}\nconst startRaw=String(startEl.value||'');\nconst parsed=/^\\d{4}-\\d{2}-\\d{2}$/.test(startRaw)?tcDateFromKey(startRaw):null;\nif(!parsed||!Number.isFinite(parsed.getTime())||dateKey(parsed)!==startRaw){\nconst dateError=document.getElementById('tcCycleDateError');\nif(dateError)dateError.textContent='Укажите действительную дату начала цикла.';\nfail('Укажите действительную дату начала цикла.',startEl);\nreturn;\n}\nconst weeklyEl=document.getElementById('tcWeeklySessions');\nlet nextWeekly=TC_course.weeklySessions;\nif(weeklyEl){\nif(nextLevel===2){\nnextWeekly=Number(weeklyEl.value);\nif(![2,3,4].includes(nextWeekly)){fail('Выберите 2, 3 или 4 основные тренировки в неделю.',weeklyEl);return;}\n}else if(nextLevel===4&&nextGoal==='quantity'){\nnextWeekly=Number(weeklyEl.value);\nif(![3,4].includes(nextWeekly)){fail('Для этой цели выберите 3 или 4 основные тренировки в неделю.',weeklyEl);return;}\n}else{\nnextWeekly=3;\n}\n}\nconst targetEl=document.getElementById('tcTargetMax');\nlet nextTarget=TC_course.targetMax;\nif(targetEl){\nconst raw=String(targetEl.value||'').trim(),n=Number(raw);\nif(!raw||!Number.isSafeInteger(n)||n<1){\nfail('Цель контрольного максимума должна быть целым положительным числом.',targetEl);\nreturn;\n}\nnextTarget=n;\n}\nconst weeksEl=document.getElementById('tcTestWeeks');\nlet nextWeeks=TC_course.testPeriodWeeks;\nif(weeksEl){\nnextWeeks=Number(weeksEl.value);\nif(![2,3,4].includes(nextWeeks)){\nfail('Интервал контрольного максимума должен составлять 2, 3 или 4 недели.',weeksEl);\nreturn;\n}\n}\nconst auxEl=document.getElementById('tcAuxEnabled');\nconst auxIntervalEl=document.getElementById('tcAuxInterval3');\nlet nextAuxInterval=TC_course.auxInterval3;\nif(auxIntervalEl){\nnextAuxInterval=Number(auxIntervalEl.value);\nif(![7,10].includes(nextAuxInterval)){\nfail('Периодичность вспомогательного комплекса должна составлять 7 или 10 дней.',auxIntervalEl);\nreturn;\n}\n}\nconst nextEnabled=!!enabled.checked;\nif(oldEnabled&&(!nextEnabled||oldLevel!==nextLevel||oldGoal!==nextGoal))tcCloseCourseRun(!nextEnabled?'disabled':'changed');\nTC_course.enabled=nextEnabled;\nTC_course.level=nextLevel;\nTC_course.pullMax=nextMax;\nTC_course.goal=nextGoal;\nTC_course.cycleStartDate=startRaw;\nTC_course.weeklySessions=nextWeekly;\nTC_course.targetMax=nextTarget;\nTC_course.testPeriodWeeks=nextWeeks;\nTC_course.auxInterval3=nextAuxInterval;\nconst scheduleChanged=oldStart!==startRaw||oldWeekly!==nextWeekly||oldLevel!==nextLevel||oldGoal!==nextGoal;\nif(scheduleChanged){\nTC_course.scheduleRuleChangedOn=dateKey();\nTC_course.scheduleEvents=(TC_course.scheduleEvents||[]).filter(e=>['completed','rescheduled'].includes(e.status));\nTC_course.transferRestDates=[];\n}\nif(auxEl&&[3,6].includes(oldLevel))TC_course.auxEnabled[oldLevel]=!!auxEl.checked;\nconst sup=document.getElementById('tcCourseSupplement');\nif(sup)TC_course.authorSupplement=!!sup.checked;\ntcNormalizeGoal();\nif(TC_course.level===4&&TC_course.goal==='quantity'&&TC_course.weeklySessions<3)TC_course.weeklySessions=3;\nif(TC_course.level!==oldLevel||TC_course.goal!==oldGoal){\nTC_course.courseSeq=0;TC_course.pendingTransition=null;\nif(!weeklyEl)TC_course.weeklySessions=3;\nTC_course.testAnchorDate='';TC_course.lastTestDate='';TC_course.testDeferredUntil='';\n}\nif(TC_course.enabled){const run=tcEnsureCourseRun();if(run){run.targetMax=TC_course.targetMax}state.ex.forEach(e=>{if(TC_PULL_CONFLICT_IDS.has(e.id)){e.sel=false;e.main=false}})}\nconst pull=state.ex.find(e=>e.id==='pull');if(pull)pull.max=TC_course.pullMax;\nconst wp=state.ex.find(e=>e.id==='weightedPull');if(wp)wp.load=TC_course.weightedLoad;\ntcSelectedDate='';tcWeekOffset=0;\ntcSaveCourse();save();closeSheet();render();\nif(typeof window.tcShowRuntimeNotice==='function')window.tcShowRuntimeNotice('Настройки курса сохранены.');\n};\nfunction tcInjectCourseUiStyles(){\nif(document.getElementById('tcCourseUiStyles'))return;\nconst st=document.createElement('style');st.id='tcCourseUiStyles';\nst.textContent=\"#sheet.open{overflow:hidden!important}#sheet .sheetbox{max-height:calc(100vh - 22px)!important;max-height:min(88dvh,calc(100vh - 22px))!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding-bottom:max(28px,calc(18px + env(safe-area-inset-bottom)))!important}#sheet .sheetbox::-webkit-scrollbar{width:4px}#sheet .sheetbox::-webkit-scrollbar-thumb{background:#475563;border-radius:999px}.tcExtrasDetails{margin:10px 0 16px;border:1px solid #2e3945;border-radius:16px;background:#111820;overflow:hidden}.tcExtrasSummary{list-style:none;display:flex;align-items:center;gap:9px;padding:14px;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent}.tcExtrasSummary::-webkit-details-marker{display:none}.tcExtrasTri{display:inline-block;font-size:15px;color:#ffd84d;transition:transform .16s ease;transform:rotate(0deg)}.tcExtrasDetails[open] .tcExtrasTri{transform:rotate(90deg)}.tcExtrasSummaryText{flex:1;min-width:0}.tcExtrasSummaryTitle{font-weight:900;font-size:15px;color:#fff}.tcExtrasSummaryMeta{font-size:11px;color:#939eac;margin-top:2px}.tcExtrasBody{padding:0 10px 10px}.tcExtrasBody>.card,.tcExtrasBody>.catalogGroup{margin-top:8px}#workout #wplan.tcCoursePlan{min-width:0;max-width:58vw;text-align:right;line-height:1.2;flex-shrink:1}#workout #wplan.tcCoursePlan .tcPlanMain{display:block;color:#ffd84d;font-size:clamp(17px,5vw,23px);font-weight:950;white-space:pre-wrap;overflow-wrap:normal;letter-spacing:.02em}#workout #wplan.tcCoursePlan .tcPlanSub{display:block;color:#9aa6b2;font-size:11px;font-weight:700;margin-top:5px;white-space:nowrap}#workout #wplan.tcCoursePlan .tcPlanSide{display:block;color:#c9d1d9;font-size:10px;font-weight:700;margin-top:3px;white-space:nowrap}\";\nst.textContent+='.tcWeekCalendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin:10px 0 12px}.tcWeekDay{min-width:0;min-height:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:1px solid #33414b;background:#151f28;border-radius:9px;padding:6px 1px;color:#c6d1db;font-size:10px;touch-action:manipulation}.tcWeekDay b{font-size:10px}.tcWeekDay span{font-size:13px;font-weight:850}.tcWeekDay small{font-size:8px;font-weight:800;color:#a5b4c1}.tcWeekToday{border-color:#ffd84d;background:#2a281b;color:#ffd84d}.tcWeekToday small{color:#ffd84d}';\nst.textContent+='.tcWeekNav{display:flex;align-items:center;gap:6px;margin-top:12px;color:#b9c4cf;font-size:11px}.tcWeekNav span{flex:1;min-width:0;text-align:center}.tcWeekNav button{border:1px solid #354351;border-radius:10px;background:#202b34;color:#fff;min-width:48px;min-height:48px;font-size:20px;cursor:pointer;touch-action:manipulation}.tcWeekNav button.tcWeekReset{min-width:72px;font-size:11px;padding:0 10px}.tcWeekDay{font-family:inherit;appearance:none;cursor:pointer}.tcWeekDay.tcWeekSelected{border:2px solid #ffd84d;box-shadow:inset 0 0 0 1px rgba(255,216,77,.35);background:#352f1e;color:#ffe18a}.tcWeekDay.tcWeekSelected small{color:#ffe18a}.tcCoursePreview .dateBig{overflow-wrap:break-word}.tcCheckRow{min-height:48px;box-sizing:border-box;touch-action:manipulation}.tcCheckRow input[type=checkbox],.tcAdvancedSelect{width:24px!important;height:24px!important;min-width:24px!important;flex:0 0 24px}.tcAdvancedSelect{touch-action:manipulation}.tcExerciseCheckTarget{width:48px;height:48px;min-width:48px;flex:0 0 48px;display:grid;place-items:center;cursor:pointer;touch-action:manipulation}.tcExerciseCheckTarget input[type=checkbox]{width:24px!important;height:24px!important;margin:0!important}.tcExerciseNumberTarget{min-height:48px!important;touch-action:manipulation}.tcExerciseMainTarget{width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important;padding:0!important;touch-action:manipulation}#sheet .sheetbox input:not([type=checkbox]),#sheet .sheetbox select{min-height:48px!important;box-sizing:border-box;touch-action:manipulation}#sheet .sheetbox input[type=checkbox]{width:24px!important;height:24px!important;min-width:24px!important;flex:0 0 24px}#sheet .sheetbox .tcCheckRow{min-height:48px!important;padding-top:6px;padding-bottom:6px;cursor:pointer}';\nst.textContent+='.tcTodayPlanDetails{margin-top:10px;border:1px solid #34414d;border-radius:12px;background:#111820;overflow:hidden}.tcTodayPlanDetails>summary{list-style:none;min-height:48px;display:flex;align-items:center;justify-content:center;padding:0 12px;cursor:pointer;font-size:13px;font-weight:850;color:#d8e0e8;touch-action:manipulation}.tcTodayPlanDetails>summary::-webkit-details-marker{display:none}.tcTodayPlanBody{padding:0 12px 10px}.tcTodayPrimaryMeta{margin-top:6px;color:#aeb8c2;font-size:12px;line-height:1.4}.tcWeekSection{margin-top:14px}.tcWeekSectionTitle{font-size:11px;font-weight:900;letter-spacing:.08em;color:#8f9aa6;margin:0 2px 6px}.tcSettingsGroups{margin-top:12px}.tcSettingsGroup{border:1px solid #34414d;border-radius:14px;background:#10171d;margin:9px 0;overflow:hidden}.tcSettingsGroup>summary{list-style:none;min-height:54px;display:flex;align-items:center;padding:0 14px;font-size:14px;font-weight:900;color:#f3f6f8;cursor:pointer;touch-action:manipulation}.tcSettingsGroup>summary::-webkit-details-marker{display:none}.tcSettingsGroup>summary:after{content:\"›\";margin-left:auto;color:#ffd84d;font-size:22px;transform:rotate(90deg);transition:transform .15s ease}.tcSettingsGroup[open]>summary:after{transform:rotate(-90deg)}.tcSettingsGroupBody{padding:0 12px 12px}.tcSettingsGroupBody>.tcInfoBlock:first-child{margin-top:0}.tcDoneStrip{margin:8px 0 12px;padding:13px 14px 14px;border:1px solid #3d5b46;border-radius:16px;background:#171d23;box-shadow:none}.tcDoneStripHead{display:flex;align-items:flex-start;gap:10px}.tcDoneStripHead>div{flex:1;min-width:0}.tcDoneStripTitle{font-size:17px;line-height:1.2;font-weight:900;color:#f6f7f9}.tcDoneStripText{margin-top:5px;font-size:12px;line-height:1.38;color:#aeb8c2}.tcDoneBadge{flex:0 0 auto;font-size:9px;font-weight:900;letter-spacing:.04em;color:#d9ffe2;border:1px solid #3d5b46;background:#17251b;border-radius:999px;padding:5px 7px}.tcUndoTodayCourseBtn,.tcAfterMainCard .btn{position:relative;z-index:42;pointer-events:auto!important;touch-action:manipulation;min-height:48px!important}.tcUndoTodayCourseBtn{margin-top:11px!important;border-radius:12px!important;font-size:13px!important}.tcAfterMainCard{position:relative;z-index:40;margin-top:10px;isolation:isolate}';\ndocument.head.appendChild(st);\n}\nfunction tcCollapseExtraCatalog(host){\nif(!TC_course.enabled||!host)return;\nif(document.getElementById('tcExtrasDetails'))return;\nconst selectedExtra=tcExtraExercises().length;\nconst details=document.createElement('details');details.id='tcExtrasDetails';details.className='tcExtrasDetails';details.open=!!window.__tcExtrasOpen;\nconst summary=document.createElement('summary');summary.className='tcExtrasSummary';\nsummary.innerHTML='<span class=\"tcExtrasTri\">▶</span><div class=\"tcExtrasSummaryText\"><div class=\"tcExtrasSummaryTitle\">Дополнительные упражнения TurnikCoach</div><div class=\"tcExtrasSummaryMeta\">'+(selectedExtra?('Выбрано: '+selectedExtra):'Свернуто · нажми, чтобы выбрать пресс, ноги, отжимания и другое')+'</div></div>';\nconst body=document.createElement('div');body.className='tcExtrasBody';\n[...host.children].forEach(node=>{if(node.id!=='tcCourseCard')body.appendChild(node)});\ndetails.appendChild(summary);details.appendChild(body);details.addEventListener('toggle',()=>{window.__tcExtrasOpen=details.open});host.appendChild(details);\n}\nfunction tcSanitizeSelectedEquipment(){\nlet dirty=false;\nfor(const e of state.ex){\nif(!tcBaseExerciseAvailable(e)&&(e.sel||e.main)){\ne.sel=false;e.main=false;dirty=true;\n}\n}\nif(dirty)save();\nreturn dirty;\n}\nfunction tcDisableUnavailableCatalog(host){\nhost.querySelectorAll('.exercise').forEach(row=>{\nconst name=row.querySelector('.strong');\nif(!name)return;\nconst ex=state.ex.find(e=>e.name===name.textContent.trim());\nif(!ex||tcBaseExerciseAvailable(ex))return;\nrow.querySelectorAll('input,button').forEach(control=>{control.disabled=true});\nif(!row.querySelector('.tcEquipmentUnavailable')){\nconst badge=document.createElement('div');\nbadge.className='meta tcEquipmentUnavailable';\nbadge.textContent='Недоступно: требуется другое оборудование';\n(name.parentNode||row).appendChild(badge);\n}\n});\n}\nfunction tcExpandExerciseTouchTargets(host){\nif(!host)return;\nhost.querySelectorAll('.exercise').forEach(row=>{\nconst children=[...row.children];\nconst check=children.find(el=>el&&el.matches&&el.matches('input[type=\"checkbox\"]'));\nif(check&&(!check.parentElement||!check.parentElement.classList.contains('tcExerciseCheckTarget'))){\nconst label=document.createElement('label');\nlabel.className='tcExerciseCheckTarget';\nlabel.setAttribute('aria-label','Выбрать упражнение');\ncheck.parentNode.insertBefore(label,check);\nlabel.appendChild(check);\n}\nconst number=children.find(el=>el&&el.matches&&el.matches('input[type=\"number\"]'));\nif(number)number.classList.add('tcExerciseNumberTarget');\nconst main=children.find(el=>el&&el.tagName==='BUTTON');\nif(main)main.classList.add('tcExerciseMainTarget');\n});\n}\nfunction tcDecorateCourseCatalog(){\nconst host=q('exerciseList');if(!host)return;\ntcExpandExerciseTouchTargets(host);\ntcDisableUnavailableCatalog(host);\nconst old=document.getElementById('tcCourseCard');if(old)old.remove();\nconst oldDetails=document.getElementById('tcExtrasDetails');\nif(oldDetails&&oldDetails.parentNode===host){const body=oldDetails.querySelector('.tcExtrasBody');if(body){[...body.children].forEach(n=>host.appendChild(n))}oldDetails.remove()}\nhost.insertAdjacentHTML('afterbegin',tcCourseCardHtml());\nconst head=document.querySelector('#exercise .head .sub');if(head)head.textContent=TC_course.enabled?'Подтягивания ведёт отдельный курс Морозова. Дополнительные упражнения ниже свернуты и не вмешиваются в структуру курса.':'Можно использовать обычный конструктор либо подключить отдельный курс Морозова для подтягиваний.';\nif(TC_course.enabled){\nhost.querySelectorAll('.catalogGroup').forEach(g=>{const name=g.querySelector('.catalogHead .strong');if(name&&(name.textContent||'').trim()==='Турник')g.style.display='none'});\nconst summary=host.querySelector('.catalogSummary .meta');if(summary)summary.textContent='Дополнительные упражнения TurnikCoach. Тяговая часть курса рассчитывается отдельно.';\ntcCollapseExtraCatalog(host);\n}\n}\nfunction tcAuxInterval(){return TC_course.level===3?TC_course.auxInterval3:10}\nfunction tcLastAuxDate(){\nconst match=TC_course.history.find(h=>h.courseMode==='auxCourse'&&h.courseLevel===TC_course.level);\nreturn match?match.date:'';\n}\nfunction tcLastPullLoadDate(){const a=tcPullLoadDates();return a.length?a[a.length-1]:''}\nfunction tcSupplementBreak(){\nconst all=TC_course.history.filter(h=>h.courseMode==='supplement'&&h.date&&h.courseLevel===TC_course.level).map(h=>h.date).sort();\nif(!all.length)return false;\nconst elapsed=tcDayDiff(all[0],dateKey());\nconst phase=elapsed%35;\nreturn elapsed>=30&&phase>=30&&phase<=34;\n}\nfunction tcAuxDue(){\nconst level=TC_course.level,today=dateKey();\nif(![3,6].includes(level)||!tcRunnableDefs(TC_COURSE[level].complexes[2].items).length)return false;\nif(!TC_course.enabled||![3,6].includes(level)||!TC_course.auxEnabled[level])return false;\nif(!TC_course.lastCourseDate||tcScheduledOn(today)||tcCourseDue()||tcTransferCandidateRaw(today)||tcTestDue()||tcMasteryDue())return false;\nif(tcDayDiff(tcLastPullLoadDate(),today)<2)return false;\nconst lastAux=tcLastAuxDate();\nif(lastAux&&tcDayDiff(lastAux,today)<tcAuxInterval())return false;\nif(TC_course.history.some(h=>h.date===today&&['supplement','auxCourse'].includes(h.courseMode)))return false;\nreturn true;\n}\nfunction tcAuxCardHtml(){\nif(!tcAuxDue())return '';\nconst title='Комплекс №2 · вспомогательная работа';\nif(tcCalibrationDefs('aux').length){\nreturn '<div class=\"todayCard\" style=\"margin-top:12px;border-color:#6a5520\"><div class=\"dateBig\">'+title+\n'</div><button class=\"btn yellow full\" style=\"margin-top:10px\" onclick=\"tcOpenCourseCalibration(\\'aux\\')\">Указать максимумы</button></div>';\n}\nif(tcNeedsWorkingWeight('aux'))return tcWorkingWeightCard('aux');\nconst items=tcBuildAuxItems();\nif(!items.length)return tcNoEquipmentCard(TC_COURSE[TC_course.level].complexes[2].items);\nreturn '<div class=\"todayCard\" style=\"margin-top:12px;border-color:#6a5520\"><div class=\"dateBig\">'+title+\n'</div><div class=\"meta\">Это отдельная тяговая нагрузка по курсу, а не обычные упражнения в день восстановления.</div>'+\ntcCourseRowsHtml(items)+tcAdaptationNote(TC_COURSE[TC_course.level].complexes[2].items)+\n'<button class=\"btn ghost full\" style=\"margin-top:10px\" onclick=\"tcStartAuxWorkout()\">Начать адаптированную тренировку</button></div>';\n}\nwindow.tcStartAuxWorkout=function(){\nif(W){tcActionMessage('Тренировка уже запущена','Сначала завершите текущую тренировку или выйдите из неё без сохранения.');return;}\nif(!tcAuxDue()){tcActionMessage('Вспомогательный комплекс сейчас недоступен','Он назначается только в подходящий день с учётом основной тренировки, контрольных испытаний и восстановления.');return;}\nif(tcCalibrationDefs('aux').length){tcOpenCourseCalibration('aux');return;}\nif(tcNeedsWorkingWeight('aux')){tcOpenWorkingWeight('aux');return;}\nconst items=tcBuildAuxItems();\nif(!items.length){tcActionMessage('Нет доступных упражнений','Вспомогательный комплекс не удалось собрать для текущего оборудования и настроек курса.');return;}\ntcPrimeAudio();\nW={mode:'auxCourse',sessionIndex:0,exerciseIndex:0,setIndex:0,items,\nactual:tcSchemeTarget(items[0].def),early:false,courseLevel:TC_course.level,\ncourseComplex:2,courseGoal:TC_course.goal,adapted:tcUnavailableDefs(TC_COURSE[TC_course.level].complexes[2].items).length>0};\ngo('workout');\n};\nfunction tcCourseRowsHtml(items){\nreturn items.map(x=>{\nconst seq=Array.from({length:x.plan.length},()=>tcPlanToken(x.def,x)).join('  ');\nconst load=x.e.load?'<span class=\"meta\" style=\"white-space:nowrap\">+'+x.e.load+' кг</span>':'';\nreturn '<div class=\"planrow\"><div class=\"grow\"><div class=\"strong\" style=\"font-size:15px\">'+x.e.name+'</div>'+load+'</div><div class=\"r sets\" style=\"white-space:nowrap\">'+seq+'</div></div>';\n}).join('');\n}\nfunction tcExtraRowsHtml(items){return items.map(x=>'<div class=\"planrow\"><div><div class=\"strong\" style=\"font-size:15px\">'+x.e.name+'</div><div class=\"meta\">Дополнительное упражнение · '+metricTitle(x.e)+'</div></div><div class=\"r sets\">'+x.plan.join(' · ')+'</div></div>').join('')}\nfunction tcSupplementHtml(){\nif(!TC_course.authorSupplement||!tcCourseLevel().supplement)return'';\nif(tcSupplementBreak())return '<div class=\"meta\" style=\"margin-top:10px\">Дополнительные подтягивания: пятидневная разгрузка.</div>';\nif(tcAuxDue()||tcCourseDue()||tcTransferCandidateRaw(dateKey())||tcRecoveryShiftToday()||tcTestDue()||tcMasteryDue())return'';\nif(TC_course.history.some(h=>h.courseMode==='supplement'&&h.date===dateKey()))return'';\nconst reps=Math.max(1,Math.floor(TC_course.pullMax*.8));\nconst seq=Array(10).fill(String(reps)).join('  ');\nreturn '<div class=\"todayCard\" style=\"margin-top:12px;border-color:#6a5520\"><div class=\"row between\"><div><div class=\"dateBig\">Дополнительные подтягивания по курсу</div></div><span class=\"tag stage4\">КУРС</span></div><div class=\"planrow\"><div class=\"grow\"><div class=\"strong\" style=\"font-size:15px\">Классические подтягивания</div></div><div class=\"r sets\" style=\"white-space:normal\">'+seq+'</div></div><button class=\"btn ghost full\" style=\"margin-top:10px\" onclick=\"tcStartSupplementWorkout()\">Начать</button></div>';\n}\nfunction tcTodayCourseRecord(){\nconst rec=TC_course.history.find(h=>h.courseMode==='course');\nreturn rec&&rec.date===dateKey()?rec:null;\n}\nfunction tcTodayExtraRecord(){\nreturn state.history.find(h=>h&&h.type==='workout'&&h.session==='доп.'&&h.date===dateKey())||null;\n}\nfunction tcTodayCourseDoneHtml(extras){\nconst rec=tcTodayCourseRecord();if(!rec)return '';\nconst moved=!!rec.transferred;\nlet html='<div class=\"tcDoneStrip\" id=\"tcTodayCourseDoneStrip\" role=\"status\">'+\n'<div class=\"tcDoneStripHead\"><div><div class=\"tcDoneStripTitle\">'+(moved?'Перенесённая тренировка выполнена':'Основной комплекс выполнен')+'</div>'+\n'<div class=\"tcDoneStripText\">'+(moved?'Плановая дата: '+fmtKeyDate(rec.plannedDate,false)+'. ':'')+\n'Результат сохранён. Последовательность курса сдвинута один раз по факту выполнения.</div></div>'+\n'<span class=\"tcDoneBadge\">ГОТОВО</span></div>'+\n'<button id=\"tcUndoTodayCourseBtn\" type=\"button\" class=\"btn ghost full tcUndoTodayCourseBtn\">Ошибочно завершил — отменить запись</button></div>';\nif(tcTodayExtraRecord())return html+'<div class=\"todayCard tcAfterMainCard\"><div class=\"row between\"><div><div class=\"dateBig\">Дополнительная тренировка выполнена</div><div class=\"meta\">Запись сохранена отдельно от курса Морозова.</div></div><span class=\"tag stage4\">ГОТОВО</span></div></div>';\nif(extras&&extras.length)return html+'<div class=\"todayCard tcAfterMainCard\"><div class=\"row between\"><div><div class=\"dateBig\">Дополнительная тренировка</div><div class=\"meta\">Пресс, ноги, отжимания и другие выбранные нетяговые упражнения.</div></div><span class=\"tag\">ДОП.</span></div>'+tcExtraRowsHtml(extras)+'<button id=\"tcStartExtraAfterCourseBtn\" type=\"button\" class=\"btn yellow full\" style=\"margin-top:12px\">Начать дополнительную тренировку</button></div>';\nreturn html+'<div class=\"todayCard tcAfterMainCard\"><div class=\"dateBig\">Дополнительная тренировка</div><div class=\"meta\">Дополнительные упражнения не выбраны.</div><button id=\"tcChooseExtrasAfterCourseBtn\" type=\"button\" class=\"btn ghost full\" style=\"margin-top:10px\">Выбрать упражнения</button></div>';\n}\nfunction tcBindTodayDoneActions(){\nconst ids=['tcUndoTodayCourseBtn','tcStartExtraAfterCourseBtn','tcChooseExtrasAfterCourseBtn'];\nids.forEach(id=>{const el=document.getElementById(id);if(el)el.dataset.tcBound='delegated-v2'});\n}\nfunction tcInstallTodayActionDelegation(){\nif(window.__TC_TODAY_ACTION_DELEGATION_V2)return;\nwindow.__TC_TODAY_ACTION_DELEGATION_V2=true;\nlet gesture=null,lastActionAt=0;\nconst actionFor=(target)=>{\nconst el=target&&target.closest?target.closest('#tcStartExtraAfterCourseBtn,#tcChooseExtrasAfterCourseBtn,#tcUndoTodayCourseBtn'):null;\nreturn el||null;\n};\nconst run=(el,ev)=>{\nif(!el)return false;\nconst now=Date.now();\nif(now-lastActionAt<650){if(ev){ev.preventDefault();ev.stopPropagation()}return true}\nlastActionAt=now;\nif(ev){ev.preventDefault();ev.stopPropagation()}\nif(el.id==='tcStartExtraAfterCourseBtn')window.tcStartExtraWorkout();\nelse if(el.id==='tcChooseExtrasAfterCourseBtn')go('exercise');\nelse if(el.id==='tcUndoTodayCourseBtn')window.tcOpenUndoTodayCourseConfirm();\nreturn true;\n};\ndocument.addEventListener('click',ev=>{const el=actionFor(ev.target);if(el)run(el,ev)},true);\nlet pointerGesture=null;\nconst cancelPointerGesture=()=>{pointerGesture=null};\ndocument.addEventListener('pointerdown',ev=>{\nconst el=actionFor(ev.target);\nif(!el)return;\npointerGesture={el,x:ev.clientX,y:ev.clientY,moved:false};\n},true);\ndocument.addEventListener('pointermove',ev=>{\nconst g=pointerGesture;if(!g)return;\nif(Math.abs(ev.clientX-g.x)>14||Math.abs(ev.clientY-g.y)>14){g.moved=true;cancelPointerGesture()}\n},true);\ndocument.addEventListener('pointerup',ev=>{\nconst g=pointerGesture;if(!g)return;\npointerGesture=null;\nif(!g.moved)setTimeout(()=>run(g.el,null),0);\n},true);\ndocument.addEventListener('pointercancel',cancelPointerGesture,true);\ndocument.addEventListener('touchstart',ev=>{\nconst el=actionFor(ev.target),t=ev.touches&&ev.touches[0];\nif(el&&t)gesture={el,x:t.clientX,y:t.clientY,moved:false,at:Date.now()};\n},{capture:true,passive:true});\ndocument.addEventListener('touchmove',ev=>{\nif(!gesture)return;\nconst t=ev.touches&&ev.touches[0];if(!t)return;\nif(Math.abs(t.clientX-gesture.x)>14||Math.abs(t.clientY-gesture.y)>14)gesture.moved=true;\n},{capture:true,passive:true});\ndocument.addEventListener('touchend',ev=>{\nif(!gesture)return;\nconst g=gesture;gesture=null;\nif(!g.moved&&Date.now()-g.at<900)run(g.el,ev);\n},{capture:true,passive:false});\ndocument.addEventListener('touchcancel',()=>{gesture=null},{capture:true,passive:true});\n}\ntcInstallTodayActionDelegation();\nfunction tcUndoLatestTodayCourseRecord(today){\nconst rec=TC_course.history.find(h=>h.courseMode==='course');\nif(!rec||rec.date!==today)return false;\nconst idx=TC_course.history.indexOf(rec);if(idx>=0)TC_course.history.splice(idx,1);\nTC_course.courseSeq=Math.max(0,(+TC_course.courseSeq||0)-1);\nconst previous=TC_course.history.find(h=>h.courseMode==='course');\nTC_course.lastCourseDate=previous&&previous.date||'';TC_course.lastCourseTs=previous&&previous.ts||0;\nconst planned=rec.plannedDate||rec.date;\nif(planned<today)tcUpsertScheduleEvent(planned,rec.scheduleOriginStatus||'missed','');else tcRemoveScheduleEvent(planned);\nif(TC_course.testAnchorDate===rec.date&&!TC_course.lastTestDate&&!previous)TC_course.testAnchorDate='';\nreturn true;\n}\nwindow.tcOpenUndoTodayCourseConfirm=function(){\nif(!tcTodayCourseRecord())return;\nconst box=q('sheetbox'),sheet=q('sheet');\nif(!box||!sheet)return;\nbox.innerHTML='<div class=\"sheettitle\">Отменить сегодняшнюю тренировку?</div>'+\n'<div class=\"sub\" style=\"margin-top:7px;line-height:1.45\">Будет удалена только ошибочно сохранённая сегодня основная тренировка курса. Предыдущая история останется без изменений, а сегодняшнее занятие снова станет доступно для запуска.</div>'+\n'<button id=\"tcConfirmUndoTodayCourseBtn\" type=\"button\" class=\"btn danger full\" style=\"margin-top:16px\">Отменить запись</button>'+\n'<button id=\"tcCancelUndoTodayCourseBtn\" type=\"button\" class=\"btn ghost full\" style=\"margin-top:8px\">Назад</button>';\nsheet.classList.add('open');\nconst yes=document.getElementById('tcConfirmUndoTodayCourseBtn');\nconst no=document.getElementById('tcCancelUndoTodayCourseBtn');\nif(yes)yes.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation()}window.tcUndoTodayCourseWorkout();return false};\nif(no)no.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation()}closeSheet();return false};\n};\nwindow.tcUndoTodayCourseWorkout=function(){\nconst rec=tcTodayCourseRecord();\nif(!rec)return;\nif(!tcUndoLatestTodayCourseRecord(dateKey()))return;\ntcSelectedDate='';tcWeekOffset=0;\nconst sheet=q('sheet');if(sheet)sheet.classList.remove('open');\ntcSaveCourse();render();\n};\nfunction tcTransferCardHtml(candidate){\nconst c=tcCourseComplex(),items=tcBuildCourseItems(),total=items.reduce((n,x)=>n+(x.plan||[]).length,0);\nif(!candidate.ready){\nconst last=tcLastPullLoadDateBefore(dateKey());\nreturn '<div class=\"todayCard tcTodayPrimaryCard\"><div class=\"row between\"><div class=\"grow\"><div class=\"dateBig\">Сегодня восстановление</div><div class=\"tcTodayPrimaryMeta\">Пропущенная тренировка '+fmtKeyDate(candidate.plannedDate,false)+' остаётся следующей по последовательности, но сегодня ещё рано повторять тяговую нагрузку'+(last?' после '+fmtKeyDate(last,false):'')+'.</div></div><span class=\"tag stage4\">ВОССТ.</span></div></div>';\n}\nreturn '<div class=\"todayCard tcTodayPrimaryCard\"><div class=\"row between\"><div class=\"grow\"><div class=\"dateBig\">Пропущена тренировка курса</div><div class=\"tcTodayPrimaryMeta\">Плановая дата: '+fmtKeyDate(candidate.plannedDate,false)+' · '+(c.def?c.def.name:'Основной комплекс')+' · '+items.length+' упражн. · '+total+' подходов</div></div><span class=\"tag\">ПЕРЕНОС</span></div>'+\n'<div class=\"meta\" style=\"margin-top:9px\">Это тот же следующий этап курса. Выполнение сегодня не сдвинет недельный календарь и не создаст тренировочный долг.</div>'+\n'<button class=\"btn yellow full\" style=\"margin-top:14px;min-height:58px\" onclick=\"tcStartTransferredCourseWorkout(\\''+candidate.plannedDate+'\\')\">Выполнить сегодня</button>'+\n'<button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"tcChooseTransferRest(\\''+candidate.plannedDate+'\\')\">Оставить день отдыха</button>'+\n'<details class=\"tcTodayPlanDetails\"><summary>Посмотреть план</summary><div class=\"tcTodayPlanBody\">'+tcCourseRowsHtml(items)+tcAdaptationNote(tcOriginalCourseDefs())+'</div></details></div>';\n}\nwindow.tcChooseTransferRest=function(plannedDate){\nconst c=tcTransferCandidateRaw(dateKey());if(!c||c.plannedDate!==plannedDate)return;\nconst today=dateKey();if(!TC_course.transferRestDates.includes(today))TC_course.transferRestDates.push(today);\nTC_course.transferRestDates=TC_course.transferRestDates.slice(-60);tcSaveCourse();render();\nif(typeof window.tcShowRuntimeNotice==='function')window.tcShowRuntimeNotice('Сегодня оставлен день отдыха. Следующий этап курса не пропущен.');\n};\nfunction tcRecoveryShiftCardHtml(){\nconst last=tcLastPullLoadDateBefore(dateKey()),next=tcNextScheduledAfter(dateKey());\nreturn '<div class=\"todayCard tcTodayPrimaryCard\"><div class=\"row between\"><div class=\"grow\"><div class=\"dateBig\">Плановая тренировка сдвинута</div><div class=\"tcTodayPrimaryMeta\">Сегодня был день основного курса, но после фактической тяговой нагрузки'+(last?' '+fmtKeyDate(last,false):'')+' требуется восстановление.</div></div><span class=\"tag stage4\">ВОССТ.</span></div>'+\n'<div class=\"meta\" style=\"margin-top:9px\">Комплекс не сгорает и courseSeq не меняется. Следующее окно будет предложено автоматически'+(next?' до плановой даты '+fmtKeyDate(next,false):'')+'.</div></div>';\n}\nfunction tcRenderToday(){\nif(tcSyncScheduleEvents())tcSaveCourse();\nconst now=new Date(),due=tcCourseDue(),l=tcCourseLevel(),c=tcCourseComplex(),items=tcBuildCourseItems(),extras=tcBuildExtraItems(),transfer=tcTransferCandidate();\nconst week=()=>'<div class=\"tcWeekSection\"><div class=\"tcWeekSectionTitle\">ПЛАН НЕДЕЛИ</div>'+tcWeeklyCalendarHtml()+'</div>';\nq('todayTitle').textContent=fmtDate(now);\nif(tcSelectedDate&&tcSelectedDate!==dateKey()){\nq('todayTitle').textContent=fmtDate(tcDateFromKey(tcSelectedDate));\nq('todaySub').textContent='Просмотр плана';\nq('todayList').innerHTML=tcPreviewCourseCard(tcSelectedDate)+week();\nreturn;\n}\nif(tcTodayCourseRecord()){\nq('todaySub').textContent='Основная тренировка выполнена';\nq('todayList').innerHTML=tcTodayCourseDoneHtml(extras)+week();\ntcBindTodayDoneActions();\ntcQueueDecorate();\nreturn;\n}\nif(tcWeeklyMode()&&tcTestDue()){\nq('todaySub').textContent='Сегодня · контроль прогресса';\nq('todayList').innerHTML=tcCourseTestCard()+week();\nreturn;\n}\nif(tcMasteryDue()){\nq('todaySub').textContent='Сегодня · контроль уровня';\nq('todayList').innerHTML=tcPendingLevelHtml()+tcMasteryCardHtml()+week();\nreturn;\n}\nif(tcRecoveryShiftToday()){\nq('todaySub').textContent='Сегодня · восстановление';\nq('todayList').innerHTML=tcRecoveryShiftCardHtml()+week();\ntcQueueDecorate();return;\n}\nif(transfer){\nq('todaySub').textContent=transfer.ready?'Сегодня · перенос основной тренировки':'Сегодня · восстановление';\nq('todayList').innerHTML=tcTransferCardHtml(transfer)+week();\ntcQueueDecorate();return;\n}\nif(due&&TC_course.level===7&&!tcAdvancedSelected()){\nq('todaySub').textContent='Сегодня · подготовка тренировки';\nq('todayList').innerHTML=\n'<div class=\"todayCard\"><div class=\"dateBig\">Выберите два вспомогательных упражнения</div>'+\n'<div class=\"meta\">Это нужно один раз для комплекса 7-го уровня.</div>'+\n'<button class=\"btn yellow full\" style=\"margin-top:12px\" onclick=\"tcOpenAdvancedChoiceSheet()\">Выбрать упражнения</button></div>'+week();\nreturn;\n}\nif(due&&!tcRunnableDefs(tcOriginalCourseDefs()).length){\nq('todaySub').textContent='Сегодня · требуется настройка оборудования';\nq('todayList').innerHTML=tcNoEquipmentCard(tcOriginalCourseDefs())+week();\nreturn;\n}\nif(due&&tcCalibrationDefs('main').length){\nq('todaySub').textContent='Сегодня · требуется контрольный максимум';\nq('todayList').innerHTML=tcCalibrationCard('main')+week();\nreturn;\n}\nif(due&&tcNeedsWorkingWeight('main')){\nq('todaySub').textContent='Сегодня · требуется рабочий вес';\nq('todayList').innerHTML=tcWorkingWeightCard('main')+week();\nreturn;\n}\nif(due){\nconst totalSets=items.reduce((sum,x)=>sum+(Array.isArray(x.plan)?x.plan.length:0),0);\nq('todaySub').textContent='Сегодня · основная тренировка';\nq('todayList').innerHTML=\ntcPendingLevelHtml()+tcEquipmentMasteryNote()+\n'<div class=\"todayCard tcTodayPrimaryCard\"><div class=\"row between\"><div class=\"grow\"><div class=\"dateBig\">'+\n(c.def?c.def.name:'Основной комплекс')+'</div><div class=\"tcTodayPrimaryMeta\">'+items.length+\n' упражн. · '+totalSets+' подходов · '+l.title+'</div></div><span class=\"tag\">КУРС</span></div>'+\n'<button class=\"btn yellow full\" style=\"margin-top:14px;min-height:58px\" onclick=\"tcStartCourseWorkout()\">'+\n(tcUnavailableDefs(tcOriginalCourseDefs()).length?'Начать адаптированную тренировку':'Начать тренировку')+\n'</button><details class=\"tcTodayPlanDetails\"><summary>Посмотреть план</summary><div class=\"tcTodayPlanBody\">'+\ntcCourseRowsHtml(items)+tcAdaptationNote(tcOriginalCourseDefs())+\n'<button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"tcOpenCourseInfo()\">ⓘ Почему такой план</button></div></details></div>'+\ntcMasteryCardHtml()+week();\n}else{\nconst nextKey=tcWeeklyMode()?tcNextCourseDay():'';\nconst next=new Date(TC_course.lastCourseDate+'T12:00:00');next.setDate(next.getDate()+2);\nq('todaySub').textContent=tcAuxDue()?'Сегодня · вспомогательная тренировка':'Сегодня · восстановление';\nlet html='<div class=\"todayCard\"><div class=\"row between\"><div class=\"grow\"><div class=\"dateBig\">'+\n(tcAuxDue()?'Основной комплекс не назначен':'Сегодня восстановление')+'</div><div class=\"sessionNo\">Следующая основная тренировка — '+\nfmtKeyDate(nextKey||dateKey(next),false)+'</div></div><span class=\"tag stage4\">ВОССТАНОВЛЕНИЕ</span></div>';\nif(extras.length){\nhtml+='<div class=\"tcTodayPrimaryMeta\">Можно выполнить выбранные дополнительные упражнения без дополнительной тяговой нагрузки.</div>'+\n'<button class=\"btn yellow full\" style=\"margin-top:14px;min-height:58px\" onclick=\"tcStartExtraWorkout()\">Начать дополнительную тренировку</button>'+\n'<details class=\"tcTodayPlanDetails\"><summary>Посмотреть дополнительный план</summary><div class=\"tcTodayPlanBody\">'+tcExtraRowsHtml(extras)+'</div></details>';\n}else{\nhtml+='<div class=\"empty\" style=\"margin-top:12px\">Дополнительные упражнения не выбраны. Можно оставить полный отдых.</div>'+\n'<button class=\"btn ghost full\" style=\"margin-top:10px\" onclick=\"go(\\'exercise\\')\">Настроить дополнительный план</button>';\n}\nhtml+='</div>';\nq('todayList').innerHTML=tcAuxCardHtml()+html+tcSupplementHtml()+tcCourseControlStatusHtml()+week();\n}\ntcQueueDecorate();\n}\nfunction tcAuthorLevelText(level){\nif(level===1)return 'Автор относит сюда тех, кто делает 0–1 обычное подтягивание или работает с резиной. Основная задача уровня — увеличить силу тянущих мышц комплексно. Для сохранения правильной техники предлагается использовать помощь ног и резину.';\nif(level===2)return 'Автор переводит работу ближе к самим подтягиваниям: объём уменьшается, интенсивность увеличивается. Главный акцент — не допускать технических ошибок и научиться выполнять чёткие 2–4 подтягивания.';\nif(level===3)return 'Задача уровня — максимально увеличить количество подтягиваний. Автор предлагает комбинировать работу на силовую выносливость с упражнениями на вспомогательные звенья и отдельно подчёркивает важность работы ног и кора в подтягиваниях.';\nif(level===4)return 'При результате примерно 15–25 подтягиваний автор предлагает выбрать направление: продолжать развивать выносливость и постепенно идти к 25–30 повторениям либо смещать работу к одноповторному максимуму для выхода силой и подтягивания на одной руке.';\nif(level===5)return 'На этом уровне курс продолжает специализацию на выходе силой или подтягивании на одной руке и повышает требования к скоростно-силовой и тяжёлой тяговой работе.';\nif(level===6)return 'Шестой уровень продолжает специальную силовую подготовку: одноручные негативы, облегчённые одноручные варианты, работа хвата и тяжёлые подтягивания с дополнительным весом.';\nif(level===7)return 'Седьмой уровень автор строит вокруг прогрессии подтягивания на одной руке. Прогрессию предлагается подбирать по своему уровню и сочетать с упражнениями предыдущих уровней.';\nreturn '';\n}\nfunction tcAuthorGoalText(level,goal){\nif(level===4&&goal==='quantity')return 'Для увеличения количества автор выделяет комплекс №3: 3 подхода по 80% от максимума, 2 подхода широким хватом до максимума и 4×3 с дополнительным весом. Отдых между упражнениями комплекса — 2–4 минуты. Даже при цели увеличить количество автор допускает добавлять комплекс №1 и/или №2 примерно раз в неделю–10 дней.';\nif(level===4&&goal==='muscleup')return 'Для выхода силой автор назначает комплекс №1: плиометрические подтягивания, широкий хват по 80% от максимума и тягу к плечу хватом «игуаны».';\nif(level===4&&goal==='onearm')return 'Для подтягивания на одной руке автор назначает комплекс №2: асимметричные подтягивания, активный вис на одной руке и перехваты в висе на полусогнутых руках.';\nreturn '';\n}\nconst TC_SOURCE_TECHNIQUE={\nclassic:{page:7,title:'Классический верхний хват',note:'Автор описывает работу мышц рук и спины с участием широчайших, трапециевидных, ромбовидных, круглой мышцы и сгибателей руки.'},\nwide:{page:9,title:'Широкий верхний хват',note:'Автор относит более выраженный акцент к мышцам спины и стабилизаторам плеча. В качестве варианта для проработки спины упоминает частичную амплитуду.'},\nchin:{page:11,title:'Нижний хват',note:'Нижний хват несколько увеличивает участие бицепса, однако распределение нагрузки, по пояснению автора, зависит от техники движения.'},\nshrug:{page:15,title:'Шраги',note:'Автор связывает движение с работой мышц, опускающих плечо, ротаторов плеча и, при большей амплитуде, трапеций.'},\nasym:{page:16,title:'Асимметричные подтягивания',note:'Тянущая сторона получает повышенную нагрузку, вспомогательная поддерживает положение тела и частично разгружает рабочую сторону.'},\nhigh:{page:19,title:'Высокие подтягивания',note:'По автору, высокие подтягивания развивают взрывную силу; целевые мышцы аналогичны классическим подтягиваниям.'},\nstages:{page:20,title:'Трёхстадийные подтягивания',note:'Разделение движения на стадии используется для развития контроля в разных частях амплитуды.'},\nband:{page:23,title:'Резина и помощь ног на начальном уровне',note:'Автор предлагает помощь ног и резину, чтобы обучаться подтягиванию с сохранением правильной техники. Подробные нюансы вынесены в видео.'},\nprogression:{page:63,title:'Прогрессия подтягивания на одной руке',note:'Автор предлагает подобрать прогрессию по своему уровню и сочетать её с двумя упражнениями шестого уровня на выбор.'}\n};\nfunction tcSourceTechniqueKey(def){\nconst id=(def&&def.id||'').replace(/_lv7_\\d+$/,'');\nif(['c_pull80','c_pull50','c_pull80_l4','c_classic_max','c_test_pull','c_daily80'].includes(id))return 'classic';\nif(['c_wide80','c_wide_max_l4','c_wide_band_max'].includes(id))return 'wide';\nif(['c_chin_max'].includes(id))return 'chin';\nif(['c_shrug'].includes(id))return 'shrug';\nif(['c_asym80','c_asym_max','c_full_asym2'].includes(id))return 'asym';\nif(['c_high_max'].includes(id))return 'high';\nif(['c_three_stage50'].includes(id))return 'stages';\nif(['c_band','c_chair_pull'].includes(id))return 'band';\nif(['c_onearm_progression','c_onearm_progression_mu'].includes(id))return 'progression';\nreturn null;\n}\nfunction tcSourceExerciseInfo(def){\nconst key=tcSourceTechniqueKey(def);\nreturn key?TC_SOURCE_TECHNIQUE[key]:null;\n}\nfunction tcAuthorExerciseNote(def){\nconst info=tcSourceExerciseInfo(def);\nif(info)return info.note+' (PDF, стр. '+info.page+'.)';\nreturn 'В предоставленном PDF приведено задание для этого упражнения, но пошаговая техника в тексте не описана. Для подробной техники необходимы соответствующие видеоматериалы автора.';\n}\nfunction tcCurrentCalculationHtml(){\nif(!W||!['course','supplement','auxCourse'].includes(W.mode)||!W.items||!W.items.length)return '';\nconst x=W.items[W.exerciseIndex],def=x&&(x.def||x.e.courseDef);\nif(!def)return '';\nconst sch=def.scheme||{};\nlet body='<b>'+x.e.name+'</b><br>';\nif(sch.type==='percent'){\nconst base=sch.ref==='pull'?TC_course.pullMax:tcVariantMax(def),raw=base*(+sch.pct||0),target=tcSchemeTarget(def);\nbody+=def.sets+' подхода × '+target+' повторений.<br>Расчёт: '+base+' × '+Math.round((+sch.pct||0)*100)+'% = '+String(Math.round(raw*10)/10).replace('.',',')+' → '+target+'.';\nif(def.id==='c_asym80')body+='<br>Общий план на обе стороны определяется по меньшему из двух зарегистрированных максимумов (правило TurnikCoach).';\n}else if(sch.type==='fixed'){\nbody+=def.sets+' подхода × '+sch.value+'.';\n}else if(sch.type==='max'){\nbody+=def.sets+' подхода × MAX.';\n}else if(sch.type==='range_reps'){\nbody+=def.sets+' подхода × '+sch.min+'–'+sch.max+'.';\n}else if(sch.type==='timed'){\nbody+=def.sets+' подхода × '+(sch.label||sch.value)+'.';\n}else{\nbody+='План: '+tcSchemeLabel(def)+'.';\n}\nif(def.metric==='weighted'&&x.e.load)body+='<br>Дополнительный вес: +'+x.e.load+' кг.';\nif(def.metric==='reps_side'||def.metric==='time_side')body+='<br>Выполняется на каждую сторону.';\nreturn '<div class=\"tcInfoBlock\"><h3>Расчёт текущего задания</h3><p>'+body+'</p></div>';\n}\nfunction tcProgramEscape(v){\nreturn String(v==null?'':v).replace(/[&<>\"']/g,ch=>({\n'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'\n}[ch]));\n}\nfunction tcProgramPrescription(def){\nconst scheme=def.scheme||{};\nlet target=tcSchemeLabel(def);\nif(scheme.type==='percent')target=Math.round((+scheme.pct||0)*100)+'% от максимума';\nif(scheme.type==='max')target='MAX';\nif(scheme.type==='choice')return 'Упражнение на выбор из указанного уровня';\nconst sides=(def.metric==='reps_side'||def.metric==='time_side')?' на каждую руку':'';\nconst units=(def.metric==='time'||def.metric==='time_side')?' сек':'';\nconst weight=(def.metric==='weighted')?' с дополнительным весом':'';\nreturn def.sets+' подх.'+sides+' · '+target+units+weight;\n}\nconst TC_TECHNIQUE_REFERENCE=[\n{page:7,title:'Классические подтягивания верхним хватом',note:'Автор описывает совместную работу мышц спины, рук, предплечий и грудных мышц.'},\n{page:8,title:'Общие мышцы при разных хватах',note:'В тексте указано участие мышц предплечий, кора и груди во всех вариантах подтягиваний. В описаниях ниже автор выделяет преимущественно целевые мышцы.'},\n{page:9,title:'Широкий верхний хват',note:'В курсе акцент отнесён к мышцам спины и стабилизаторам плеча. Для дополнительной работы спины автор упоминает частичную амплитуду без полного разгибания рук.'},\n{page:10,title:'Узкий верхний хват',note:'Автор отмечает усиленное участие мышц рук при сохранении нагрузки на спину; отдельно указаны мышцы предплечий.'},\n{page:11,title:'Нижний хват',note:'Автор предупреждает, что акцент на бицепсе не определяется только направлением хвата: распределение нагрузки зависит от техники.'},\n{page:12,title:'Узкий нижний хват',note:'В тексте объясняется возможность использовать момент силы рук и завершать движение мышцами спины. В сравнении с узким верхним хватом акцент смещён с предплечий на бицепс.'},\n{page:13,title:'Стандартный нижний хват: акцент на спину',note:'Описан вариант тяги грудью к перекладине с участием трапециевидных, ромбовидных, круглых мышц и задних дельт.'},\n{page:13,title:'Стандартный нижний хват: акцент на бицепс',note:'Для варианта с акцентом на бицепс автор описывает неполную амплитуду и движение локтей вперёд и вверх.'},\n{page:15,title:'Шраги на турнике',note:'По курсу прорабатываются мышцы, опускающие плечо, ротаторы плеча, а при большей амплитуде — трапеции.'},\n{page:16,title:'Асимметричные подтягивания',note:'Тянущая сторона получает большую нагрузку; вспомогательная сторона стабилизирует положение и частично разгружает рабочую.'},\n{page:17,title:'Подтягивания за голову',note:'Автор описывает вариант широкого хвата с дополнительной нагрузкой на круглые мышцы и ротаторы плеча. Индивидуальная пригодность движения в PDF не устанавливается.'},\n{page:18,title:'Подтягивания к темечку',note:'В курсе вариант с локтями, отведёнными в сторону, описан как более нагружающий бицепс, брахиалис и плечелучевую мышцу.'},\n{page:19,title:'Высокие подтягивания',note:'Автор связывает этот вариант с развитием взрывной силы; целевые мышцы аналогичны обычным подтягиваниям.'},\n{page:20,title:'Трёхстадийные подтягивания',note:'Разделение движения на фазы используется для развития контроля в каждой части амплитуды.'},\n{page:23,title:'Помощь резиной и ногами',note:'Для начального этапа предложено использовать резину и помощь ног ради сохранения техники. Подробности вынесены автором в видео, отсутствующие в текстовом PDF.'},\n{page:63,title:'Подтягивания на одной руке: прогрессия',note:'Рекомендуется подобрать прогрессию по своему текущему уровню и сочетать с двумя упражнениями шестого уровня на выбор.'}\n];\nfunction tcProgramTechniqueReferenceHtml(){\nreturn '<details class=\"tcProgramLevel\"><summary><span class=\"tcProgramChevron\">▶</span>'+\n'<span class=\"tcProgramGrow\">Справочник техники · PDF, стр. 7–23, 63</span></summary>'+\n'<div class=\"tcProgramLevelBody\"><div class=\"tcProgramLine\">Краткое изложение письменных пояснений автора. Видеоуроки, отмеченные в PDF, в справочник не включены, поскольку их содержание не представлено в документе.</div>'+\nTC_TECHNIQUE_REFERENCE.map(item=>'<details class=\"tcProgramNote\"><summary>'+tcProgramEscape(item.title)+'</summary>'+\n'<p>'+tcProgramEscape(item.note)+'</p><div class=\"meta\">PDF, стр. '+item.page+'</div></details>').join('')+\n'</div></details>';\n}\nfunction tcProgramExerciseHtml(def){\nconst tip=tcAuthorExerciseNote(def);\nconst noTip=!tcSourceExerciseInfo(def);\nconst note=noTip?'<details class=\"tcProgramNote\"><summary>Техника упражнения</summary><p>В текстовой части PDF пошаговая техника этого упражнения не описана. Для подробностей необходимы соответствующие видеоматериалы автора.</p></details>':'<details class=\"tcProgramNote\"><summary>Пояснение автора</summary><p>'+tcProgramEscape(tip)+'</p></details>';\nreturn '<div class=\"tcProgramExercise\"><div class=\"tcProgramExerciseName\">'+tcProgramEscape(def.name)+'</div>'+ \n(tcEquipmentReason(def)?'<div class=\"tcProgramRest\"><b>Не назначается: '+tcProgramEscape(tcEquipmentReason(def))+'</b></div>':'')+\n'<div class=\"tcProgramPrescription\">'+tcProgramEscape(tcProgramPrescription(def))+'</div>'+\n'<div class=\"tcProgramRest\">Отдых: '+tcProgramEscape(tcCourseRestText(def.rest))+'</div>'+note+'</div>';\n}\nconst TC_PDF_COMPLEX_PAGE={\n1:{1:24,2:25},2:{1:29},3:{1:33,2:35},\n4:{1:40,2:41,3:42},5:{1:50,2:51},6:{1:56,2:57},7:{1:62,2:64}\n};\nfunction tcProgramComplexHtml(levelNo,no,complex){\nconst active=levelNo===TC_course.level&&no===tcCourseComplexNo();\nconst sourcePage=TC_PDF_COMPLEX_PAGE[levelNo][no];\nreturn '<details class=\"tcProgramComplex\"'+(active?' open':'')+'><summary><span class=\"tcProgramChevron\">▶</span><span class=\"tcProgramGrow\">'+tcProgramEscape(complex.name)+'</span>'+(active?'<span class=\"tcProgramCurrent\">Следующий</span>':'')+'</summary>'+\n'<div class=\"tcProgramComplexBody\">'+\n'<p class=\"tcProgramPurpose\">Источник: PDF, стр. '+sourcePage+'. Число подходов и интервалы отдыха приведены по исходному курсу. Пометки о доступности оборудования относятся только к плану TurnikCoach.</p>'+\n(complex.purpose?'<p class=\"tcProgramPurpose\">'+tcProgramEscape(complex.purpose)+'</p>':'')+\ncomplex.items.map(tcProgramExerciseHtml).join('')+'</div></details>';\n}\nfunction tcProgramLevelHtml(levelNo){\nconst level=TC_COURSE[levelNo],active=levelNo===TC_course.level;\nconst nums=Object.keys(level.complexes).map(Number).sort((a,b)=>a-b);\nreturn '<details class=\"tcProgramLevel\"'+(active?' open':'')+'>'+\n'<summary><span class=\"tcProgramChevron\">▶</span><span class=\"tcProgramGrow\">Уровень '+levelNo+' · '+tcProgramEscape(level.title)+'</span>'+(active?'<span class=\"tcProgramCurrent\">Ваш уровень</span>':'')+'</summary>'+\n'<div class=\"tcProgramLevelBody\">'+\n(level.entry?'<div class=\"tcProgramLine\"><b>Ориентир:</b> '+tcProgramEscape(level.entry)+'</div>':'')+\n'<div class=\"tcProgramLine\"><b>Частота:</b> '+tcProgramEscape(level.frequency)+'</div>'+\nnums.map(no=>tcProgramComplexHtml(levelNo,no,level.complexes[no])).join('')+\n'<div class=\"tcProgramLine\"><b>Контроль уровня:</b> '+tcProgramEscape(level.mastery)+'</div>'+\n(level.supplement?'<details class=\"tcProgramNote\"><summary>Дополнительная работа по курсу</summary><p>'+tcProgramEscape(level.supplement)+'</p></details>':'')+\n'</div></details>';\n}\nfunction tcInjectProgramStyles(){\nif(document.getElementById('tcCourseProgramStyles'))return;\nconst el=document.createElement('style');el.id='tcCourseProgramStyles';\nel.textContent='.tcProgramLevel{border:1px solid #35414d;border-radius:14px;margin:10px 0;background:#111920;overflow:visible}.tcProgramLevel[open]{border-color:#6e6040}.tcProgramLevel>summary,.tcProgramComplex>summary{list-style:none;display:flex;align-items:center;gap:9px;padding:13px 11px;min-height:48px;cursor:pointer}.tcProgramLevel>summary::-webkit-details-marker,.tcProgramComplex>summary::-webkit-details-marker,.tcProgramNote>summary::-webkit-details-marker{display:none}.tcProgramChevron{color:#ffd84d;font-size:12px;flex:none;transition:transform .15s ease}.tcProgramLevel[open]>summary>.tcProgramChevron,.tcProgramComplex[open]>summary>.tcProgramChevron{transform:rotate(90deg)}.tcProgramGrow{flex:1;min-width:0;font-weight:850;font-size:14px}.tcProgramCurrent{flex:none;font-size:10px;color:#17130a;background:#ffd84d;border-radius:7px;padding:4px 6px;font-weight:800}.tcProgramLevelBody{padding:0 11px 12px}.tcProgramLine{font-size:12px;color:#c6d0d9;line-height:1.45;margin:8px 0}.tcProgramComplex{background:#1b242c;border:1px solid #34414c;border-radius:11px;margin:9px 0;overflow:visible}.tcProgramComplexBody{padding:0 11px 10px}.tcProgramPurpose{font-size:12px;line-height:1.45;color:#bec7d2;margin:0 0 10px}.tcProgramExercise{border-top:1px solid #35404b;padding:10px 0}.tcProgramExerciseName{font-weight:850;color:#fff;font-size:13px;line-height:1.4}.tcProgramPrescription{font-size:12px;color:#ffd84d;font-weight:800;line-height:1.45;margin-top:3px}.tcProgramRest{font-size:11px;color:#b1bbc6;margin-top:4px}.tcProgramNote{margin-top:9px;padding:8px 9px;border-radius:9px;background:#121b23;border:1px solid #33404b}.tcProgramNote>summary{font-size:12px;color:#d4deea;cursor:pointer}.tcProgramNote p{font-size:12px;line-height:1.5;color:#c2ccd6;margin:7px 0 0}';\ndocument.head.appendChild(el);\n}\nwindow.tcOpenCourseProgram=function(){\nconst sheet=q('sheet'),box=q('sheetbox');\nif(!sheet||!box)return;\ntcInjectProgramStyles();\nbox.innerHTML='<div class=\"sheettitle\">Программа курса</div>'+\n'<div class=\"sub\" style=\"margin-top:5px\">Артём Морозов · «Подтягивания с нуля до киборга». Откройте уровень, затем комплекс. Просмотр не меняет настройки курса и не запускает тренировку.</div>'+\nArray.from({length:7},(_,i)=>tcProgramLevelHtml(i+1)).join('')+\ntcProgramTechniqueReferenceHtml()+\n'<button class=\"btn yellow full\" style=\"margin-top:13px\" onclick=\"closeSheet()\">Закрыть программу</button>';\nbox.scrollTop=0;\nsheet.classList.add('open');\n};\nfunction tcAuthorFrequencyAdvice(){\nconst l=tcCourseLevel(),level=TC_course.level,goal=TC_course.goal;\nconst page={1:26,2:30,3:36,4:goal==='quantity'?46:goal==='muscleup'?44:45,5:goal==='onearm'?53:52,6:58,7:goal==='muscleup'?66:65}[level];\nlet schedule=l.frequency;\nif(level===4){\nif(goal==='quantity')schedule='Для комплекса №3 автор указывает 3–5 тренировок в неделю. Пример на стр. 46: понедельник, среда, пятница и воскресенье — комплекс №3; между ними дни отдыха.';\nelse if(goal==='muscleup')schedule='Для комплекса №1 автор указывает 2–4 тренировки в неделю; пример на стр. 44: понедельник, среда и суббота.';\nelse schedule='Для комплекса №2 автор указывает 3–4 тренировки в неделю; пример на стр. 45: понедельник, среда, пятница и воскресенье.';\n}\nif(level===3)schedule='Комплекс №1 — три раза в неделю. Комплекс №2 — один раз в неделю или раз в 10 дней (стр. 36).';\nreturn '<div class=\"tcInfoBlock\"><h3>Частота занятий · PDF, стр. '+page+'</h3><p>'+tcProgramEscape(schedule)+'</p></div>';\n}\nfunction tcAuthorRestAdvice(){\nconst c=W&&W.mode==='auxCourse'?{no:2,def:TC_COURSE[TC_course.level].complexes[2]}:tcCourseComplex();\nif(!c.def)return '';\nconst lines=c.def.items.map(x=>x.name+': '+tcCourseRestText(x.rest));\nreturn '<div class=\"tcInfoBlock\"><h3>Отдых в текущем комплексе</h3><p>'+lines.map(tcProgramEscape).join('<br>')+'</p></div>';\n}\nfunction tcAdviceCurrentDef(){\nif(W&&W.items&&W.items.length){\nconst current=W.items[W.exerciseIndex];\nif(current)return current.def||current.e&&current.e.courseDef||null;\n}\nconst next=tcCourseComplex();\nreturn next.def&&next.def.items&&next.def.items[0]||null;\n}\nfunction tcAuthorTechniqueGuideHtml(){\nconst rows=[\n['Классический верхний хват','Нагрузка распределяется между мышцами рук и спины; автор перечисляет широчайшие, трапециевидные, ромбовидные, большую круглую, сгибатели руки, предплечья и грудные.','7–8'],\n['Широкий верхний хват','Акцент сильнее смещается на спину и стабилизаторы плеча; автор также упоминает частичную амплитуду как вариант дополнительного акцента на спину.','9'],\n['Узкий верхний хват','Акцент больше смещается на руки и предплечья, при сохранении работы спины.','10'],\n['Нижний хват','Несколько увеличивается участие бицепса, но распределение нагрузки зависит от техники.','11–13'],\n['Шраги','Работа мышц, опускающих плечо, ротаторов плеча и, при большей амплитуде, трапеций.','15'],\n['Асимметричные подтягивания','Тянущая сторона получает повышенную нагрузку; вспомогательная стабилизирует положение и снимает часть нагрузки.','16'],\n['Высокие подтягивания','Используются для развития взрывной силы.','19'],\n['Трёхстадийные подтягивания','Разделение движения на фазы используется для развития нейромышечного контроля по амплитуде.','20']\n];\nreturn rows.map(r=>'<div style=\"margin:8px 0\"><b>'+r[0]+'</b><br>'+r[1]+' <span class=\"meta\">PDF, стр. '+r[2]+'</span></div>').join('');\n}\nfunction tcAdvicePanel(title,body,opened){\nreturn '<details class=\"tcProgramNote\"'+(opened?' open':'')+'><summary style=\"font-size:14px;font-weight:800\">'+title+'</summary>'+\n'<div style=\"font-size:13px;line-height:1.55;color:#c6d0dd;padding-top:8px\">'+body+'</div></details>';\n}\nwindow.tcOpenCourseInfo=function(){\nconst l=tcCourseLevel();\nconst c=W&&W.mode==='auxCourse'?\n{no:2,def:TC_COURSE[TC_course.level].complexes[2]}:tcCourseComplex();\nconst def=tcAdviceCurrentDef(),source=tcSourceExerciseInfo(def);\ntcInjectProgramStyles();\nconst exercise=def?\n'<b>'+tcProgramEscape(def.name)+'</b><br>'+tcProgramEscape(tcAuthorExerciseNote(def))+\n(source?'':''):'';\nconst frequency=tcAuthorFrequencyAdvice();\nconst rest=tcAuthorRestAdvice();\nconst recovery='<b>В тексте курса:</b> '+tcProgramEscape(l.frequency)+\n(l.supplement?'<br><br>Автор предлагает пропускать ежедневные 10 подходов в дни основной тренировки и не менее пяти дней ежемесячно отдыхать от этой дополнительной работы (PDF, стр. '+(TC_course.level===3?34:43)+').':'')+\n'<br><br><b>Планировщик TurnikCoach:</b> в дни без основного тягового комплекса предлагает выбранную дополнительную работу. Это правило приложения, а не формулировка из PDF.';\nconst nutrition='В предоставленном PDF нет рекомендаций по калорийности, норме белка, меню, режиму питания или числовой норме сна. Эти данные не добавляются от имени автора. Если будут предоставлены его отдельные материалы по питанию или восстановлению, их можно встроить в этот же раздел.';\nconst safety='В юридическом разделе PDF (стр. 70) автор указывает на необходимость консультации со специалистом до начала тренировок.';\nconst box=q('sheetbox');\nbox.innerHTML='<div class=\"sheettitle\">ⓘ Советы автора</div>'+\n'<div class=\"sub\" style=\"margin-top:6px\">'+tcProgramEscape(l.title)+' · '+tcProgramEscape(c.def?c.def.name:'')+'</div>'+\n(def?tcAdvicePanel('Текущее упражнение · техника и назначение',exercise,true):'')+\n(W?tcAdvicePanel('Расчёт текущего плана',tcCurrentCalculationHtml(),false):'')+\ntcAdvicePanel('Уровень и цель','<b>Идея этапа:</b> '+tcProgramEscape(tcAuthorLevelText(TC_course.level))+\n(tcAuthorGoalText(TC_course.level,TC_course.goal)?'<br><br>'+tcProgramEscape(tcAuthorGoalText(TC_course.level,TC_course.goal)):'')+\n'<br><br><b>Критерий освоения:</b> '+tcProgramEscape(l.mastery),false)+\ntcAdvicePanel('Частота и отдых по курсу',frequency+rest,false)+\ntcAdvicePanel('Восстановление и дополнительные занятия',recovery,false)+\ntcAdvicePanel('Справочник техники из PDF',tcAuthorTechniqueGuideHtml(),false)+\ntcAdvicePanel('Питание и сон',nutrition,false)+\ntcAdvicePanel('Перед началом тренировок',safety,false)+\n'<button class=\"btn yellow full\" style=\"margin-top:14px\" onclick=\"closeSheet()\">Закрыть</button>';\nbox.scrollTop=0;\nq('sheet').classList.add('open');\n};\nwindow.tcStartCourseTest=function(){\nif(W){tcActionMessage('Тренировка уже запущена','Сначала завершите текущую тренировку или выйдите из неё без сохранения.');return;}\nif(!tcRecoveredForTest()){tcActionMessage('Контроль пока недоступен','После предыдущей тяговой нагрузки требуется не менее двух дней восстановления.');return;}\nconst src=state.ex.find(e=>e.id==='pull')||{};\nconst e={...src,id:'c_test_pull',name:'Контрольный максимум · классические подтягивания',\nmax:TC_course.pullMax,media:src.media||'',muscles:Array.isArray(src.muscles)?src.muscles:[]};\nconst def={id:e.id,name:e.name,metric:'reps',sets:1,scheme:{type:'max'},\nrest:{type:'manual',label:'После испытания'}};\nconst item={e,def,plan:[TC_course.pullMax],planLabels:['MAX'],actual:[]};\ntcPrimeAudio();\nW={mode:'courseTest',sessionIndex:0,exerciseIndex:0,setIndex:0,items:[item],\nactual:0,early:false,courseLevel:TC_course.level,courseGoal:TC_course.goal};\ngo('workout');\n};\nwindow.tcConfirmCourseTest=function(){\nif(!W||W.mode!=='courseTest'){tcActionMessage('Контроль уже закрыт','Активного контрольного испытания нет.');return;}\nconst value=+(W.items[0].actual[0]);\nif(!Number.isInteger(value)||value<1){tcActionMessage('Результат не сохранён','Укажите целое положительное количество выполненных повторений.');return;}\nconst previous=TC_course.pullMax,achieved=value>=TC_course.targetMax;\nconst run=tcEnsureCourseRun(),rec={date:dateKey(),ts:Date.now(),value,previous,goal:TC_course.targetMax,level:TC_course.level,runId:run&&run.id||''};\nTC_course.tests.unshift(rec);\nTC_course.lastTestDate=rec.date;\nTC_course.testAnchorDate=rec.date;\nTC_course.testDeferredUntil='';\nTC_course.lastCourseDate=rec.date;TC_course.lastCourseTs=rec.ts;\nTC_course.pullMax=value;\nconst pull=state.ex.find(e=>e.id==='pull');if(pull)pull.max=value;\ntcSaveCourse();save();\nq('sheet').classList.remove('open');\nW=null;go('today');\nconst box=q('sheetbox');\nbox.innerHTML='<div class=\"sheettitle\">Контроль завершён</div>'+\n'<div class=\"tcInfoBlock\"><h3>Результат: '+value+'</h3><p>Предыдущий контроль: '+previous+\n'. Изменение: '+(value-previous>0?'+':'')+(value-previous)+\n'. Следующая нагрузка рассчитывается от '+value+' повторений.</p></div>'+\n(achieved?'<div class=\"tcInfoBlock\"><h3>Цель достигнута</h3><p>Достигнут установленный ориентир '+TC_course.targetMax+\n'. Продолжить увеличение количества либо открыть настройки курса и выбрать дальнейшую цель. Уровень сам не изменяется.</p></div>':'')+\n'<button class=\"btn yellow full\" onclick=\"closeSheet()\">Продолжить</button>'+\n(achieved?'<button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"closeSheet();tcOpenCourseSettings()\">Настроить следующую цель</button>':'');\nq('sheet').classList.add('open');\n};\nwindow.tcDeferCourseTest=function(){\nif(!tcTestDue()){tcActionMessage('Перенос не требуется','Контроль максимума сейчас не назначен на сегодня.');return;}\nconst until=new Date(dateKey()+'T12:00:00');until.setDate(until.getDate()+7);\nTC_course.testDeferredUntil=dateKey(until);\ntcSaveCourse();render();\nif(typeof window.tcShowRuntimeNotice==='function')window.tcShowRuntimeNotice('Контроль перенесён на '+fmtKeyDate(TC_course.testDeferredUntil,false));\n};\nfunction tcRecoveredForTest(){\nconst lastLoad=(TC_course.history||[]).find(h=>\n['course','supplement','auxCourse'].includes(h.courseMode));\nconst lastDate=lastLoad&&lastLoad.date>TC_course.lastCourseDate?lastLoad.date:TC_course.lastCourseDate;\nreturn !!lastDate&&tcDayDiff(lastDate,dateKey())>=2;\n}\nfunction tcCourseControlStatusHtml(){\nif(!TC_course.lastCourseDate)return '';\nconst next=tcNextTestDate();\nif(!next)return '';\nconst deferred=TC_course.testDeferredUntil&&TC_course.testDeferredUntil>next?TC_course.testDeferredUntil:next;\nif(TC_course.level===4&&TC_course.goal==='quantity'){\nconst last=tcLatestTest();\nreturn '<div class=\"meta\" style=\"margin-top:9px\">Следующий контроль максимума: '+\nfmtKeyDate(deferred,false)+' · цель '+TC_course.targetMax+\n(last?' · последний '+last.value:'')+'</div>';\n}\nif(tcMasteryDefinition()){\nconst latest=TC_course.masteryTests.find(t=>t.level===TC_course.level);\nreturn '<div class=\"meta\" style=\"margin-top:9px\">Следующая проверка норматива уровня: '+\nfmtKeyDate(deferred,false)+(latest?' · предыдущая: '+(latest.passed?'выполнен':'не выполнен'):'')+'</div>';\n}\nreturn '';\n}\nfunction tcCourseTestCard(){\nconst next=tcNextTestDate(),due=tcTestDue(),ready=tcRecoveredForTest();\nif(TC_course.level!==4||TC_course.goal!=='quantity')return '';\nif(!next)return '<div class=\"meta\" style=\"margin-top:8px\">Первый контроль будет назначен после начала тренировочного цикла.</div>';\nconst last=tcLatestTest();\nif(!due)return '<div class=\"meta\" style=\"margin-top:8px\">'+\n(TC_course.testDeferredUntil&&dateKey()>=next&&dateKey()<TC_course.testDeferredUntil?'Контроль перенесён на '+fmtKeyDate(TC_course.testDeferredUntil,false):'Контроль максимума: '+fmtKeyDate(next,false))+\n' · цель '+TC_course.targetMax+(last?' · последний результат '+last.value:'')+'</div>';\nreturn '<div class=\"todayCard\" style=\"margin-top:12px;border-color:#ffd84d\">'+\n'<div class=\"dateBig\">Контрольный максимум</div>'+\n'<div class=\"meta\">Отдельное испытание после восстановления · цель '+TC_course.targetMax+\n' · последний подтверждённый максимум '+TC_course.pullMax+'</div>'+\n(ready?'<button class=\"btn yellow full\" style=\"margin-top:12px\" onclick=\"tcStartCourseTest()\">Начать контроль</button>':\n'<div class=\"meta\" style=\"margin-top:8px\">После предыдущей тренировки сегодня ещё требуется восстановление. Контроль будет доступен в следующий день без ограничения.</div>')+\n'<button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"tcDeferCourseTest()\">Перенести на 7 дней</button>'+\n'</div>';\n}\nfunction tcMasteryDefinition(){\nconst level=TC_course.level;\nif(level===1||level===5)return null; // Source tests require unavailable band / external load.\nif(level===1)return {page:26,name:'Подтягивания с минимальной резиной',fields:[\n{id:'band',label:'Подтягивания с резиной, повторений',min:0},\n{id:'lowBand',label:'Использована резина минимального натяжения',check:true}\n]};\nif(level===2)return {page:30,name:'Подтягивания средним хватом',fields:[\n{id:'regular',label:'Подтягивания средним хватом, повторений',min:0}\n]};\nif(level===3)return {page:36,name:'Количество и широкий хват',fields:[\n{id:'regular',label:'Классические подтягивания, повторений',min:0},\n{id:'wide',label:'Подтягивания широким хватом, повторений',min:0}\n]};\nif(level===4&&TC_course.goal!=='quantity')return {page:43,name:'Асимметричные и высокие подтягивания',fields:[\n{id:'left',label:'Асимметричные на левую руку, повторений',min:0},\n{id:'right',label:'Асимметричные на правую руку, повторений',min:0},\n{id:'high',label:'Подтягивания выше груди, повторений',min:0}\n]};\nif(level===5)return {page:52,name:'Подтягивания с дополнительным весом',fields:[\n{id:'body',label:'Собственная масса тела, кг',min:0.1,step:'0.1'},\n{id:'added',label:'Дополнительный вес при подтягивании, кг',min:0,step:'0.5'}\n]};\nreturn null;\n}\nfunction tcMasteryOutcome(level,values){\nif(level===1)return values.band>=8&&values.lowBand===true;\nif(level===2)return values.regular>=8;\nif(level===3)return values.regular>=15&&values.wide>=6;\nif(level===4)return TC_course.goal!=='quantity'&&values.left>=5&&values.right>=5&&values.high>=1;\nif(level===5)return values.body>0&&values.added>=0.6*values.body;\nreturn false;\n}\nfunction tcPendingLevelHtml(){\nconst p=TC_course.pendingTransition;\nif(!p||p.from!==TC_course.level||p.to!==p.from+1)return '';\nreturn '<div class=\"todayCard\" style=\"margin-top:12px;border-color:#5eae78\">'+\n'<div class=\"dateBig\">Норматив уровня '+p.from+' выполнен</div>'+\n'<div class=\"meta\">Результат контрольного испытания сохранён. Текущий уровень не изменён.</div>'+\n'<button class=\"btn yellow full\" style=\"margin-top:10px\" onclick=\"tcAdvanceCourseLevel()\">Перейти на уровень '+p.to+'</button>'+\n'</div>';\n}\nfunction tcEquipmentMasteryNote(){\nif(TC_course.level===1)return '<div class=\"info\" style=\"margin-top:8px\">Контрольный норматив автора требует резиновую петлю минимального натяжения. При наличии только турника это испытание не назначается; норматив сохранён в полной программе.</div>';\nif(TC_course.level===5)return '<div class=\"info\" style=\"margin-top:8px\">Контрольный норматив автора требует подтягивания с дополнительным весом. Без отягощения испытание не назначается; норматив сохранён в полной программе.</div>';\nreturn '';\n}\nfunction tcMasteryCardHtml(){\nconst def=tcMasteryDefinition();\nif(!def||!TC_course.lastCourseDate)return '';\nconst recovered=tcRecoveredForTest(),readyDate=tcNextTestDate();\nconst due=readyDate&&dateKey()>=readyDate&&\n(!TC_course.testDeferredUntil||dateKey()>=TC_course.testDeferredUntil);\nif(!due)return '<div class=\"meta\" style=\"margin-top:8px\">Контроль нормативов уровня: '+\n(readyDate?fmtKeyDate(readyDate,false):'после начала цикла')+\n' · ⓘ нормативы и техника находятся в советах автора.</div>';\nreturn '<div class=\"todayCard\" style=\"margin-top:12px;border-color:#ffd84d\">'+\n'<div class=\"dateBig\">Контроль освоения уровня</div>'+\n'<div class=\"meta\">'+def.name+' · норматив автора, PDF, стр. '+def.page+'</div>'+\n(recovered?'<button class=\"btn yellow full\" style=\"margin-top:10px\" onclick=\"tcOpenMasteryTest()\">Проверить нормативы</button>':\n'<div class=\"meta\" style=\"margin-top:8px\">Контроль выполняется после восстановления от предыдущей тяговой нагрузки.</div>')+\n'<button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"tcDeferMasteryTest()\">Перенести на 7 дней</button></div>';\n}\nwindow.tcDeferMasteryTest=function(){\nif(!tcMasteryDefinition()){tcActionMessage('Перенос недоступен','Для текущего уровня и оборудования отдельный норматив освоения не назначается.');return;}\nif(!TC_course.lastCourseDate){tcActionMessage('Перенос недоступен','Сначала начните тренировочный цикл курса.');return;}\nconst d=new Date(dateKey()+'T12:00:00');d.setDate(d.getDate()+7);\nTC_course.testDeferredUntil=dateKey(d);tcSaveCourse();render();\nif(typeof window.tcShowRuntimeNotice==='function')window.tcShowRuntimeNotice('Проверка норматива перенесена на '+fmtKeyDate(TC_course.testDeferredUntil,false));\n};\nwindow.tcOpenMasteryTest=function(){\nconst def=tcMasteryDefinition();\nif(!def){tcActionMessage('Контроль недоступен','Для текущего уровня и оборудования отдельный норматив освоения не назначается.');return;}\nif(!tcRecoveredForTest()){tcActionMessage('Контроль пока недоступен','После предыдущей тяговой нагрузки требуется не менее двух дней восстановления.');return;}\nconst inputs=def.fields.map(f=>\nf.check?'<label class=\"tcCheckRow\" style=\"display:flex;gap:9px;align-items:center;margin:12px 0\"><input type=\"checkbox\" id=\"tcMastery_'+f.id+'\"><span>'+f.label+'</span></label>':\n'<label style=\"display:block;font-size:13px;color:#dae2eb;margin:12px 0\">'+f.label+\n'<input id=\"tcMastery_'+f.id+'\" type=\"number\" inputmode=\"decimal\" min=\"'+f.min+'\"'+\n(f.step?' step=\"'+f.step+'\"':' step=\"1\"')+\n' style=\"display:block;margin-top:5px;width:100%;box-sizing:border-box;padding:11px;border-radius:9px;background:#0c1218;color:#fff;border:1px solid #344250\"></label>'\n).join('');\nq('sheetbox').innerHTML='<div class=\"sheettitle\">Контроль · '+def.name+'</div>'+\n'<div class=\"sub\" style=\"margin-top:5px\">PDF, стр. '+def.page+\n'. Введите фактически полученные результаты. Проверка не является частью основного комплекса и не меняет уровень автоматически.</div>'+\ninputs+'<div id=\"tcMasteryError\" class=\"meta\" style=\"color:#ff9b9b;margin:6px 0\"></div>'+\n'<button class=\"btn yellow full\" onclick=\"tcSaveMasteryTest()\">Сохранить результат</button>'+\n'<button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"closeSheet()\">Отмена</button>';\nq('sheet').classList.add('open');\n};\nwindow.tcSaveMasteryTest=function(){\nconst def=tcMasteryDefinition();\nif(!def){tcActionMessage('Результат не сохранён','Для текущего уровня нет активного норматива освоения.');return;}\nif(!tcRecoveredForTest()){tcActionMessage('Результат не сохранён','Контроль должен выполняться после необходимого периода восстановления.');return;}\nconst values={};\nfor(const field of def.fields){\nconst el=document.getElementById('tcMastery_'+field.id);\nif(!el){tcActionMessage('Результат не сохранён','Форма контрольного испытания изменилась. Откройте её заново.');return;}\nif(field.check){values[field.id]=!!el.checked;continue}\nconst raw=String(el.value||'').trim();\nconst n=Number(raw);\nif(raw===''||!Number.isFinite(n)||n<field.min||(!field.step&&!Number.isInteger(n))){\nel.style.borderColor='#ff7777';el.focus();\nconst error=document.getElementById('tcMasteryError');\nif(error)error.textContent='Проверьте выделенное поле: требуется допустимое числовое значение.';\nreturn;\n}\nvalues[field.id]=n;\n}\nconst passed=tcMasteryOutcome(TC_course.level,values);\nconst run=tcEnsureCourseRun(),rec={date:dateKey(),ts:Date.now(),level:TC_course.level,values,passed,sourcePage:def.page,goal:TC_course.goal,runId:run&&run.id||''};\nTC_course.masteryTests.unshift(rec);\nTC_course.lastTestDate=rec.date;\nTC_course.testAnchorDate=rec.date;\nTC_course.testDeferredUntil='';\nTC_course.lastCourseDate=rec.date;\nTC_course.lastCourseTs=rec.ts;\nTC_course.pendingTransition=passed&&TC_course.level<6?\n{from:TC_course.level,to:TC_course.level+1,testTs:rec.ts}:null;\nif(values.regular&&values.regular>TC_course.pullMax){\nTC_course.pullMax=values.regular;\nconst pull=state.ex.find(e=>e.id==='pull');if(pull)pull.max=values.regular;\nsave();\n}\ntcSaveCourse();\nq('sheet').classList.remove('open');\ngo('today');\nq('sheetbox').innerHTML='<div class=\"sheettitle\">Контроль уровня '+rec.level+'</div>'+\n'<div class=\"tcInfoBlock\"><h3>'+(passed?'Норматив выполнен':'Норматив пока не выполнен')+\n'</h3><p>Результаты сохранены отдельно от основной тренировки. '+\n(passed?'Вы можете перейти к следующему уровню либо продолжить работу на текущем.':\n'Следующий контроль будет предложен по установленному интервалу.')+'</p></div>'+\n(passed?'<button class=\"btn yellow full\" onclick=\"tcAdvanceCourseLevel()\">Перейти на уровень '+(rec.level+1)+'</button>':'')+\n'<button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"closeSheet()\">Остаться на текущем уровне</button>';\nq('sheet').classList.add('open');\n};\nwindow.tcAdvanceCourseLevel=function(){\nconst p=TC_course.pendingTransition;\nif(!p||p.from!==TC_course.level||p.to!==p.from+1||p.to>6){tcActionMessage('Переход недоступен','Нет подтверждённого перехода с текущего уровня на следующий.');return;}\nconst current=TC_course.masteryTests.find(t=>t.ts===p.testTs&&t.level===p.from);\nif(!current||!current.passed){tcActionMessage('Переход недоступен','Сначала необходимо выполнить и сохранить норматив текущего уровня.');return;}\ntcCloseCourseRun('level');TC_course.level=p.to;TC_course.courseSeq=0;TC_course.weeklySessions=3;\nTC_course.pendingTransition=null;\nTC_course.lastTestDate='';TC_course.testAnchorDate='';\nTC_course.testDeferredUntil='';\ntcNormalizeGoal();tcEnsureCourseRun();\ntcSaveCourse();\nq('sheet').classList.remove('open');\nW=null;go('today');\n};\nfunction tcBeginCourseWorkout(plannedDate,transferred,originStatus){\nif(W){tcActionMessage('Тренировка уже запущена','Сначала завершите текущую тренировку или выйдите из неё без сохранения.');return false}\nif(transferred){\nconst c=tcTransferCandidateRaw(dateKey());\nif(!c||c.plannedDate!==plannedDate||(TC_course.transferRestDates||[]).includes(dateKey())){tcActionMessage('Перенос больше не доступен','Наступило другое тренировочное окно или на сегодня выбран отдых.');return false}\nif(!c.ready){tcActionMessage('Сегодня восстановление','После предыдущей тяговой нагрузки требуется день без основной тренировки.');return false}\n}else if(!tcCourseDue()){tcActionMessage('Сегодня основной комплекс не назначен','Откройте календарь курса, чтобы посмотреть ближайший тренировочный день.');return false}\nif(!tcRunnableDefs(tcOriginalCourseDefs()).length){tcActionMessage('Нет доступных упражнений','Текущий комплекс требует оборудования, которого нет в выбранной конфигурации.');return false}\nif(tcCalibrationDefs('main').length){tcOpenCourseCalibration('main');return false}\nif(tcNeedsWorkingWeight('main')){tcOpenWorkingWeight('main');return false}\nif(TC_course.level===7&&!tcAdvancedSelected()){tcOpenAdvancedChoiceSheet();return false}\nconst items=tcBuildCourseItems();if(!items.length){tcActionMessage('Не удалось собрать тренировку','Проверьте выбранные упражнения и настройки курса.');return false}\ntcPrimeAudio();const c=tcCourseComplex();\nW={mode:'course',sessionIndex:0,exerciseIndex:0,setIndex:0,items,actual:tcSchemeTarget(items[0].def),early:false,courseLevel:TC_course.level,courseComplex:c.no,courseGoal:TC_course.goal,adapted:tcUnavailableDefs(tcOriginalCourseDefs()).length>0,coursePlannedDate:plannedDate||dateKey(),courseTransferred:!!transferred,courseScheduleOrigin:originStatus||''};\ngo('workout');return true;\n}\nwindow.tcStartCourseWorkout=function(){return tcBeginCourseWorkout(dateKey(),false,'')};\nwindow.tcStartTransferredCourseWorkout=function(plannedDate){\nconst c=tcTransferCandidateRaw(dateKey());\nreturn tcBeginCourseWorkout(plannedDate,true,c&&c.plannedDate===plannedDate?c.status:'missed');\n};\nwindow.tcStartExtraWorkout=function(){\ntry{\nif(W){tcActionMessage('Тренировка уже запущена','Сначала завершите текущую тренировку или выйдите из неё без сохранения.');return false;}\nif(tcTodayExtraRecord()){tcActionMessage('Дополнительная тренировка уже выполнена','Сегодняшняя дополнительная тренировка уже сохранена в истории.');return false;}\nconst items=tcBuildExtraItems();\nif(!items.length){tcActionMessage('Нет дополнительных упражнений','Выберите пресс, ноги, отжимания или другие дополнительные упражнения на экране «План».');return false;}\ntcPrimeAudio();\nconst idx=TC_course.extraSeq%3;\nW={mode:'extra',sessionIndex:idx,exerciseIndex:0,setIndex:0,items,actual:items[0].plan[0],early:false};\ngo('workout');\nreturn true;\n}catch(e){\ntry{W=null}catch(_){}\nconst message=e&&e.message?e.message:String(e||'Неизвестная ошибка');\nconsole.error('TurnikCoach extra workout start',e);\ntcActionMessage('Не удалось начать тренировку',message);\nreturn false;\n}\n};\nwindow.tcStartSupplementWorkout=function(){\nif(W){tcActionMessage('Тренировка уже запущена','Сначала завершите текущую тренировку или выйдите из неё без сохранения.');return;}\nif(!TC_course.authorSupplement||!tcCourseLevel().supplement){tcActionMessage('Дополнение курса выключено','Включите дополнительные подтягивания в настройках курса, если они предусмотрены текущим уровнем.');return;}\nif(tcCourseDue()||tcTransferCandidateRaw(dateKey())||tcRecoveryShiftToday()){tcActionMessage('Приоритет основной тренировки','Дополнительные подтягивания не назначаются, пока основная тренировка ожидает выполнения или требуется восстановление.');return;}\nif(tcAuxDue()){tcActionMessage('Сегодня вспомогательный комплекс','Дополнительные подтягивания не назначаются одновременно со вспомогательной тяговой тренировкой.');return;}\nif(tcTestDue()||tcMasteryDue()){tcActionMessage('Сегодня контрольное испытание','Дополнительную тяговую нагрузку перед контрольным испытанием приложение не назначает.');return;}\nif(tcSupplementBreak()){tcActionMessage('Разгрузка от дополнительной работы','Сейчас действует пятидневный перерыв от дополнительных подтягиваний.');return;}\nif(TC_course.history.some(h=>h.courseMode==='supplement'&&h.date===dateKey())){tcActionMessage('Дополнение уже выполнено','Сегодняшние дополнительные подтягивания уже сохранены в истории.');return;}\nconst reps=Math.max(1,Math.floor(TC_course.pullMax*.8)),def={id:'c_daily80',name:'Классические подтягивания · авторское дополнение',metric:'reps',sets:10,scheme:{type:'fixed',value:reps,label:String(reps)},rest:{type:'manual',label:'отдых в PDF не задан'}};\nconst e={id:def.id,name:def.name,metric:'reps',max:TC_course.pullMax,load:0,courseDef:def,media:'',muscles:[]};const item={e,def,plan:Array(10).fill(reps),planLabels:Array(10).fill(String(reps)),actual:[]};W={mode:'supplement',sessionIndex:0,exerciseIndex:0,setIndex:0,items:[item],actual:reps,early:false};go('workout');\n};\nfunction tcPrepareManualRest(label,note){\nwindow.__tcManualCourseRest=true;go('rest');const title=document.querySelector('#rest h1'),sub=document.querySelector('#rest .sub'),num=q('restNum'),buttons=document.querySelectorAll('#rest button');if(title)title.textContent=label==='минимальный'?'Минимальный отдых':'Отдых по самочувствию';if(sub)sub.textContent=note||('По курсу: '+label);if(num)num.textContent='—';if(buttons[0])buttons[0].textContent='Продолжить';if(buttons[1])buttons[1].style.display='none';\n}\nfunction tcRestoreRestUI(){const title=document.querySelector('#rest h1'),sub=document.querySelector('#rest .sub'),buttons=document.querySelectorAll('#rest button');if(title)title.textContent='Восстановись';if(sub)sub.textContent='За 3 секунды до окончания прозвучат три сигнала';if(buttons[0])buttons[0].textContent='Готов раньше';if(buttons[1])buttons[1].style.display='block';window.__tcManualCourseRest=false}\nfunction tcPlanToken(def,x){\nconst sch=def.scheme||{};\nif(sch.type==='percent')return tcSchemeTarget(def)==null?'—':String(tcSchemeTarget(def));\nif(sch.type==='fixed')return String(sch.value);\nif(sch.type==='max')return 'MAX';\nif(sch.type==='range_reps')return sch.min+'–'+sch.max;\nif(sch.type==='timed')return sch.label||String(sch.value);\nif(sch.type==='choice')return 'НА ВЫБОР';\nconst vals=(x&&x.plan)||[];\nreturn vals.length?String(vals[0]):tcSchemeLabel(def);\n}\nfunction tcSequenceCoursePlan(def,x){\nconst sets=(x&&x.plan?x.plan.length:def.sets)||1;\nconst token=tcPlanToken(def,x);\nconst seq=Array.from({length:sets},()=>token).join('  ');\nlet side='';\nif(def.metric==='reps_side'||def.metric==='time_side')side='на каждую сторону';\nif(def.metric==='weighted'&&x&&x.e&&x.e.load)side='+'+x.e.load+' кг';\nreturn '<span class=\"tcPlanMain\">'+seq+'</span>'+(side?'<span class=\"tcPlanSide\">'+side+'</span>':'');\n}\nconst tcBeforeCourseRenderWork=window.renderWork;\nwindow.renderWork=function(){\nconst r=tcBeforeCourseRenderWork();\nif(typeof window.tcEnsureWorkoutControls==='function')window.tcEnsureWorkoutControls();\nconst planEl=q('wplan');\nif(!W||!['course','supplement','auxCourse','courseTest'].includes(W.mode)){\nif(planEl)planEl.classList.remove('tcCoursePlan');\nreturn r;\n}\nconst x=W.items[W.exerciseIndex],def=x.def||x.e.courseDef;\nif(!def)return r;\nconst token=tcPlanToken(def,x);\nq('wname').textContent=x.e.name;\nq('wmeta').textContent='Курс Морозова · упражнение '+(W.exerciseIndex+1)+\n' из '+W.items.length+' · подход '+(W.setIndex+1)+' из '+x.plan.length+\n(x.e.load?' · +'+x.e.load+' кг':'');\nplanEl.classList.add('tcCoursePlan');\nplanEl.innerHTML=W.mode==='courseTest'?\n'<span class=\"tcPlanMain\">MAX</span>':tcSequenceCoursePlan(def,x);\nconst current=q('target');\nif(current)current.textContent=token;\nconst unit=q('unitWord'); // Existing template uses unitWord, not factUnit.\nif(unit)unit.textContent=(def.metric==='time'||def.metric==='time_side'?'СЕКУНД':'ПОВТОРЕНИЙ')+\n(def.metric==='reps_side'||def.metric==='time_side'?' НА СТОРОНУ':'');\nconst chips=q('chips');\nif(chips)chips.innerHTML=x.plan.map((_,i)=>{\nconst actual=x.actual[i],done=actual!==undefined;\nconst value=done?(actual===null?'—':String(actual)):token;\nreturn '<div class=\"chip '+(done?(actual===null?'skip':'ok'):'')+'\">'+value+'</div>';\n}).join('');\nconst image=q('visualImg'),fallback=q('mediaFallback');\nif(image){image.removeAttribute('src');image.style.display='none'}\nif(fallback)fallback.style.display='none';\nconst legend=q('legend');if(legend)legend.textContent='';\nreturn r;\n};\nconst tcBeforeCourseSetDone=window.setDone;\nwindow.setDone=function(skip){\nif(!W)return;\nif(q('sheet').classList.contains('open'))return;\nif(W&&W.mode==='courseTest'){\nif(skip){q('sheetbox').innerHTML='<div class=\"sheettitle\">Контроль не выполнен</div><button class=\"btn ghost full\" onclick=\"closeSheet()\">Вернуться к попытке</button>';q('sheet').classList.add('open');return}\nconst n=Number(W.actual);\nif(!Number.isInteger(n)||n<1){q('sheetbox').innerHTML='<div class=\"sheettitle\">Введите результат</div><div class=\"sub\">Укажите фактически выполненное количество повторений, затем завершите контроль.</div><button class=\"btn yellow full\" onclick=\"closeSheet()\">Вернуться</button>';q('sheet').classList.add('open');return}\nW.items[0].actual[0]=n;\nq('sheetbox').innerHTML='<div class=\"sheettitle\">Подтвердить максимум</div><div class=\"dateBig\" style=\"margin:12px 0\">'+n+' повторений</div><button class=\"btn yellow full\" onclick=\"tcConfirmCourseTest()\">Сохранить результат</button><button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"closeSheet()\">Изменить значение</button>';\nq('sheet').classList.add('open');return;\n}\nif(!W||!['course','supplement','auxCourse'].includes(W.mode))return tcBeforeCourseSetDone(skip);\ntcPrimeAudio();const x=W.items[W.exerciseIndex],def=x.def||x.e.courseDef,target=x.plan[W.setIndex],actual=skip?null:W.actual;x.actual[W.setIndex]=actual;\nconst advance=()=>{if(W.setIndex<x.plan.length-1){W.setIndex++;W.actual=x.plan[W.setIndex]||tcLastActualFor(def.id)||1;renderWork();return true}if(W.exerciseIndex<W.items.length-1){W.exerciseIndex++;W.setIndex=0;const nx=W.items[W.exerciseIndex];W.actual=nx.plan[0]||tcLastActualFor(nx.def.id)||1;renderWork();return true}return false};\nconst more=W.setIndex<x.plan.length-1||W.exerciseIndex<W.items.length-1;\nif(!more){tcFinishSignal();askFeedback(false);return}\nconst rr=tcAdaptiveCourseRest(def,target,actual,!!skip);advance();\nif(rr.manual)tcPrepareManualRest(rr.label,rr.note);else window.startRest(rr.seconds,rr.note);\n};\nconst tcBeforeCourseFinishRest=window.finishRest;\nwindow.finishRest=function(){if(window.__tcManualCourseRest){tcRestoreRestUI();go('workout');return}return tcBeforeCourseFinishRest()};\nconst tcBeforeCourseFinishWorkout=window.finishWorkout;\nwindow.finishWorkout=function(feel){\nif(!W)return;\nif(!['course','extra','supplement','auxCourse'].includes(W.mode))return tcBeforeCourseFinishWorkout(feel);\nlet total=0,details=[];W.items.forEach(x=>{const actual=x.plan.map((_,i)=>x.actual[i]===undefined?null:x.actual[i]);const sum=actual.reduce((s,v)=>s+(Number.isFinite(+v)?+v:0),0);total+=sum;details.push({id:x.e.id,name:x.e.name,metric:x.e.metric,load:x.e.load||0,plan:x.plan.slice(),planLabels:(x.planLabels||x.plan.map(String)).slice(),actual,sum})});\nconst rec={type:'workout',date:dateKey(),ts:Date.now(),feedback:feel,total,details,early:!!W.early,courseMode:W.mode,adapted:!!W.adapted,equipment:'bar',session:W.mode==='extra'?'доп.':'курс'};\nif(W.mode==='course'){const run=tcEnsureCourseRun();rec.runId=run&&run.id||'';rec.courseLevel=W.courseLevel;rec.courseComplex=W.courseComplex;rec.courseGoal=W.courseGoal;rec.plannedDate=W.coursePlannedDate||rec.date;rec.transferred=rec.plannedDate!==rec.date;rec.scheduleOriginStatus=W.courseScheduleOrigin||'';TC_course.history.unshift(rec);TC_course.courseSeq++;TC_course.lastCourseDate=rec.date;TC_course.lastCourseTs=rec.ts;tcUpsertScheduleEvent(rec.plannedDate,rec.transferred?'rescheduled':'completed',rec.date);TC_course.transferRestDates=(TC_course.transferRestDates||[]).filter(k=>k!==rec.date);if(!TC_course.testAnchorDate)TC_course.testAnchorDate=rec.date;tcSaveCourse()}\nelse if(W.mode==='auxCourse'){const run=tcEnsureCourseRun();rec.runId=run&&run.id||'';rec.courseLevel=W.courseLevel;rec.courseComplex=2;rec.courseGoal=W.courseGoal;TC_course.history.unshift(rec);tcSaveCourse()}\nelse if(W.mode==='extra'){TC_course.extraSeq++;tcSaveCourse();state.history.unshift(rec);save()}\nelse {const run=tcEnsureCourseRun();rec.runId=run&&run.id||'';rec.courseLevel=TC_course.level;rec.courseComplex='дополнение';TC_course.history.unshift(rec);tcSaveCourse()}\nq('sheet').classList.remove('open');W=null;go('today');\n};\nconst tcBeforeCourseInfo=window.tcOpenTrainingInfo;\nwindow.tcOpenTrainingInfo=function(){if(TC_course.enabled&&(W&&['course','supplement','auxCourse','courseTest'].includes(W.mode)||q('today').classList.contains('on')))return tcOpenCourseInfo();return tcBeforeCourseInfo()};\nfunction tcCourseTestsHtml(){\nconst maxTests=TC_course.tests.map(t=>({\ndate:t.date,ts:t.ts,\nlabel:'Контрольный максимум',\nsummary:t.value+' повт. · предыдущий '+t.previous+\n' · изменение '+(t.value-t.previous>0?'+':'')+(t.value-t.previous)\n}));\nconst norms=TC_course.masteryTests.map(t=>({\ndate:t.date,ts:t.ts,\nlabel:'Норматив уровня '+t.level,\nsummary:(t.passed?'Выполнен':'Не выполнен')+\n(t.values&&t.values.regular!=null?' · обычные '+t.values.regular:'')\n}));\nconst all=maxTests.concat(norms).sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,12);\nif(!all.length)return '';\nconst rows=all.map(t=>'<div class=\"historyitem\"><div class=\"row between\"><b>'+\nfmtKeyDate(t.date,false)+'</b><span class=\"badge\">'+t.label+'</span></div>'+\n'<div class=\"meta\">'+t.summary+'</div></div>').join('');\nreturn '<div class=\"tcInfoBlock\"><h3>Контрольные испытания</h3><p>Текущий максимум: '+\nTC_course.pullMax+' · цель: '+TC_course.targetMax+'</p></div>'+rows;\n}\nfunction tcCourseRunStats(){\nconst r=tcCurrentCourseRun()||tcEnsureCourseRun();if(!r)return null;\nconst h=(TC_course.history||[]).filter(x=>x.runId===r.id),m=h.filter(x=>x.courseMode==='course'),e=(TC_course.scheduleEvents||[]).filter(x=>x.runId===r.id);\nconst on=m.filter(x=>!x.transferred).length,moved=m.length-on,missed=e.filter(x=>x.status==='missed').length,recovery=e.filter(x=>x.status==='recovery_shift').length+m.filter(x=>x.transferred&&x.scheduleOriginStatus==='recovery_shift').length,den=on+moved+missed;\nlet sets=0,reps=0;h.forEach(x=>(x.details||[]).forEach(d=>(d.actual||[]).forEach(v=>{if(v!==null&&Number.isFinite(+v)){sets++;if(['reps','reps_side','weighted'].includes(d.metric))reps+=+v}})));\nconst base=+r.baselinePullMax||TC_course.pullMax,cur=TC_course.pullMax,delta=cur-base,pct=base?Math.round(delta/base*100):0;\nconst tests=(TC_course.tests||[]).filter(x=>x.runId===r.id).sort((a,b)=>(a.ts||0)-(b.ts||0)).map(x=>x.value);\nreturn{r,on,moved,missed,recovery,completed:m.length,rate:den?Math.round((on+moved)/den*100):null,sets,reps,base,cur,delta,pct,tests};\n}\nfunction tcCourseStatsHtml(){\nconst x=tcCourseRunStats();if(!x)return'';\nconst sign=x.delta>0?'+':'',rate=x.rate==null?'—':x.rate+'%',trend=x.tests.length?x.tests.slice(-5).join(' → '):'контролей пока нет';\nreturn '<div class=\"tcInfoBlock\"><h3>Текущий период · с '+fmtKeyDate(x.r.startedDate,false)+'</h3><p><b>'+x.base+' → '+x.cur+'</b> подтягиваний · '+sign+x.delta+' ('+sign+x.pct+'%)<br>Выполнение курса: <b>'+rate+'</b> · выполнено '+x.completed+'<br>Вовремя '+x.on+' · перенесено '+x.moved+' · пропущено '+x.missed+' · восстановление '+x.recovery+'<br>Объём курса: '+x.sets+' подходов · '+x.reps+' повторений<br>Контрольные максимумы: '+trend+'</p></div>';\n}\nfunction tcCourseHistoryHtml(){if(!TC_course.enabled&&!TC_course.history.length)return'';const rows=TC_course.history.slice(0,8).map(h=>'<div class=\"historyitem\"><div class=\"row between\"><div><div class=\"strong\" style=\"font-size:14px\">'+(h.courseMode==='supplement'?'Дополнительные подтягивания по курсу':h.courseMode==='auxCourse'?'Вспомогательный комплекс №2 · уровень '+h.courseLevel:'Курс Морозова · уровень '+h.courseLevel+' · комплекс '+h.courseComplex)+(h.adapted?' · адаптация: только турник':'')+'</div><div class=\"meta\">'+fmtRecordDate(h)+' · '+(h.feedback||'—')+'</div></div><span class=\"badge\">КУРС</span></div>'+(h.details||[]).map(d=>'<div class=\"meta\" style=\"margin-top:6px\">'+d.name+': '+d.actual.map(v=>v===null?'—':v).join(' · ')+'</div>').join('')+'</div>').join('');return '<div class=\"exerciseProgressCard\"><div class=\"progressHead\"><div><div class=\"progressName\">Курс Морозова</div><div class=\"meta\">Статистика и история текущего периода</div></div><span class=\"badge\">ур. '+TC_course.level+'</span></div>'+tcCourseStatsHtml()+'<div class=\"tcInfoBlock\"><h3>Критерий текущего уровня</h3><p>'+tcCourseLevel().mastery+'</p></div>'+tcCourseTestsHtml()+rows+'</div>'}\nconst tcBeforeCourseRenderHistory=window.renderHistory;\nwindow.renderHistory=function(){const r=tcBeforeCourseRenderHistory();const host=q('exerciseProgress');if(host){const old=document.getElementById('tcCourseHistoryWrap');if(old)old.remove();const wrap=document.createElement('div');wrap.id='tcCourseHistoryWrap';wrap.innerHTML=tcCourseHistoryHtml();host.parentNode.insertBefore(wrap,host)}return r};\nconst tcBeforeCourseRender=window.render;\nwindow.render=function(){const r=tcBeforeCourseRender();tcDecorateCourseCatalog();if(TC_course.enabled&&q('today').classList.contains('on'))tcRenderToday();return r};\ntcSanitizeSelectedEquipment();\nif(TC_course.enabled&&tcEnsureCourseRun())tcSaveCourse();\ntcInjectCourseUiStyles();\nrender();\n})();";
function tcValidCourseModule(js){return typeof js==='string'&&js.length>1000&&js.length<256000&&js.includes('TURNIKCOACH_COURSE')}
function tcEvalCourseModule(js){if(!tcValidCourseModule(js))return false;try{(0,eval)(js);return true}catch(e){console.error('TurnikCoach course module',e);return false}}
function tcLoadCourseModule(){tcEvalCourseModule(COURSE_MODULE_BUNDLED)}
function tcInstallUx2InformationArchitecture(){
if(window.__TC_UX2_IA)return;
window.__TC_UX2_IA=true;
const setNav=(id,icon,label)=>{
const el=document.getElementById(id);
if(el){el.innerHTML='<span>'+icon+'</span>'+label;el.setAttribute('aria-label',label)}
};
setNav('n1','◫','План');
setNav('n2','●','Сегодня');
setNav('n3','⌁','Прогресс');
const exercise=document.getElementById('exercise');
if(exercise){
const k=exercise.querySelector('.head .k'),h1=exercise.querySelector('.head h1'),sub=exercise.querySelector('.head .sub');
if(k)k.textContent='ПЛАН';
if(h1)h1.textContent='План';
if(sub)sub.textContent='Программа, упражнения и параметры, по которым TurnikCoach строит тренировки.';
}
const history=document.getElementById('historyScreen');
if(history){
const k=history.querySelector('.head .k'),h1=history.querySelector('.head h1'),sub=history.querySelector('.head .sub');
if(k)k.textContent='ПРОГРЕСС';
if(h1)h1.textContent='Прогресс';
if(sub)sub.textContent='История тренировок, объём, максимумы и контрольные результаты.';
}
const today=document.getElementById('today');
if(today){
const k=today.querySelector('.head .k');
if(k)k.textContent='СЕГОДНЯ';
}
const viewport=document.querySelector('meta[name="viewport"]');
if(viewport)viewport.setAttribute('content','width=device-width,initial-scale=1');
}
function tcProgressMetrics(genericHistory,courseHistory,pullMax,nowTs){
const all=[...(Array.isArray(genericHistory)?genericHistory:[]),
...(Array.isArray(courseHistory)?courseHistory:[])];
const seen=new Set(),workouts=[];
all.forEach(rec=>{
if(!rec||rec.type!=='workout')return;  // Never count skips or test events.
const key=rec.id!=null?'id:'+rec.id:
[rec.ts||'',rec.date||'',rec.courseMode||'',rec.session||'',rec.total||''].join('|');
if(seen.has(key))return;
seen.add(key);
let ts=Number(rec.ts)||0;
if(!ts&&/^\d{4}-\d{2}-\d{2}$/.test(rec.date||''))ts=Date.parse(rec.date+'T12:00:00')||0;
workouts.push(ts);
});
const now=Number(nowTs)||Date.now(),start=now-7*24*60*60*1000;
return {
week:workouts.filter(ts=>ts>=start&&ts<=now).length,
total:workouts.length,
pullMax:Number.isFinite(+pullMax)&&+pullMax>0?Math.floor(+pullMax):0
};
}
function tcInstallProgressSummary(){
if(window.__TC_PROGRESS_SUMMARY_V2)return;
window.__TC_PROGRESS_SUMMARY_V2=true;
const style=document.createElement('style');
style.id='tcProgressSummaryStyle';
style.textContent='.tcProgressSummary{display:grid;grid-template-columns:repeat(auto-fit,minmax(94px,1fr));gap:8px;margin:2px 0 12px}.tcProgressMetric{min-width:0;background:#151d24;border:1px solid #34414d;border-radius:14px;padding:12px 8px;text-align:center}.tcProgressMetric b{display:block;color:#ffd84d;font-size:24px;line-height:1.1;overflow-wrap:anywhere}.tcProgressMetric span{display:block;margin-top:5px;color:#c4cdd5;font-size:11px;font-weight:750;line-height:1.3;overflow-wrap:anywhere}';
document.head.appendChild(style);
const renderSummary=()=>{
const screen=document.getElementById('historyScreen'),scroll=screen&&screen.querySelector('.scroll');
if(!scroll)return;
const course=typeof window.tcGetCourseStateSnapshot==='function'?window.tcGetCourseStateSnapshot():null;
const generic=typeof state!=='undefined'&&state?state:null;
const pulled=course&&course.pullMax>0?course.pullMax:
(generic&&Array.isArray(generic.ex)&&generic.ex.find(e=>e.id==='pull')||{}).max;
const metrics=tcProgressMetrics(generic&&generic.history,
course&&course.history,pulled,Date.now());
let host=document.getElementById('tcProgressSummary');
if(!host){
host=document.createElement('div');host.id='tcProgressSummary';
host.className='tcProgressSummary';scroll.insertBefore(host,scroll.firstElementChild||null);
}
const entries=[['За 7 дней',metrics.week],
['Всего тренировок',metrics.total],
['MAX подтяг.',metrics.pullMax||'—']];
entries.forEach((entry,i)=>{
let cell=host.children[i];
if(!cell){
cell=document.createElement('div');cell.className='tcProgressMetric';
const number=document.createElement('b'),label=document.createElement('span');
cell.appendChild(number);cell.appendChild(label);host.appendChild(cell);
}
cell.firstElementChild.textContent=String(entry[1]);
cell.lastElementChild.textContent=entry[0];
cell.setAttribute('role','group');
cell.setAttribute('aria-label',entry[0]+': '+entry[1]);
});
};
const base=window.renderHistory;
if(typeof base==='function')window.renderHistory=function(){
const result=base.apply(this,arguments);renderSummary();return result;
};
window.tcRenderProgressSummary=renderSummary;
renderSummary();
}
const TC_COMPLETION_UNDO_KEY='tc_completion_undo_v1';
let tcCompletionFlowInstalled=false;
function tcJsonClone(value){
try{return JSON.parse(JSON.stringify(value))}catch(e){return null}
}
function tcWorkoutSummary(snapshot,feel){
const items=Array.isArray(snapshot&&snapshot.items)?snapshot.items:[];
let sets=0,total=0;
const rows=items.map(x=>{
const actual=Array.isArray(x.actual)?x.actual:[];
sets+=actual.filter(v=>v!==undefined).length;
total+=actual.reduce((s,v)=>s+(Number.isFinite(+v)?+v:0),0);
const values=actual.map(v=>v===null?'—':(v===undefined?'·':String(v))).join(' · ');
return {name:x&&x.e&&x.e.name||'Упражнение',values};
});
return{
mode:String(snapshot&&snapshot.mode||'standard'),
exercises:items.length,
sets,
total,
feel:String(feel||''),
rows
};
}
function tcShowCompletionSummary(summary){
const sheet=document.getElementById('sheet'),box=document.getElementById('sheetbox');
if(!sheet||!box)return;
const title=summary.mode==='extra'?'Дополнительная тренировка завершена':
summary.mode==='supplement'?'Дополнительная работа завершена':
summary.mode==='auxCourse'?'Вспомогательная тренировка завершена':
'Тренировка завершена';
const stats='<div class="tcCompletionStats"><div><b>'+summary.exercises+'</b><span>упражнения</span></div>'+
'<div><b>'+summary.sets+'</b><span>подходов</span></div>'+
'<div><b>'+summary.total+'</b><span>сумма</span></div></div>';
const rows=summary.rows.map(r=>'<div class="tcCompletionRow"><span>'+r.name+'</span><b>'+r.values+'</b></div>').join('');
box.innerHTML='<div class="sheettitle">'+title+'</div>'+
'<div class="sub" style="margin-top:6px">Результат сохранён'+(summary.feel?' · '+summary.feel:'')+'.</div>'+
stats+'<div class="tcCompletionRows">'+rows+'</div>'+
'<button id="tcCompletionDoneBtn" type="button" class="btn yellow full" style="margin-top:16px;min-height:58px">Готово</button>'+
'<button id="tcCompletionUndoBtn" type="button" class="btn ghost full" style="margin-top:8px">Отменить сохранение</button>';
sheet.classList.add('open');
const done=document.getElementById('tcCompletionDoneBtn');
const undo=document.getElementById('tcCompletionUndoBtn');
if(done)done.onclick=function(){if(typeof closeSheet==='function')closeSheet();else sheet.classList.remove('open')};
if(undo)undo.onclick=window.tcUndoLastCompletion;
}
function tcReadCompletionUndo(){
try{
const tx=JSON.parse(localStorage.getItem(TC_COMPLETION_UNDO_KEY)||'null');
if(!tx||!tx.savedAt||Date.now()-Number(tx.savedAt)>15*60*1000)return null;
return tx;
}catch(e){return null}
}
function tcClearCompletionUndo(){
try{localStorage.removeItem(TC_COMPLETION_UNDO_KEY)}catch(e){}
}
window.tcUndoLastCompletion=function(){
const tx=tcReadCompletionUndo();
if(!tx){showRuntimeNotice('Срок быстрой отмены истёк.','danger');return false}
try{
if(tx.state)state=tx.state;
if(typeof save==='function')save();
if(tx.course&&typeof window.tcRestoreCourseStateSnapshot==='function')window.tcRestoreCourseStateSnapshot(tx.course);
if(typeof window.tcClearActiveWorkoutSnapshot==='function')window.tcClearActiveWorkoutSnapshot();
tcClearCompletionUndo();
const sheet=document.getElementById('sheet');if(sheet)sheet.classList.remove('open');
if(typeof render==='function')render();
if(typeof go==='function')go('today');
showRuntimeNotice('Сохранение тренировки отменено.');
return true;
}catch(e){
console.error('TurnikCoach completion undo',e);
showRuntimeNotice('Не удалось отменить сохранение.','danger');
return false;
}
};
function tcInstallCompletionFlow(){
if(tcCompletionFlowInstalled)return;
tcCompletionFlowInstalled=true;
const baseFinish=window.finishWorkout;
if(typeof baseFinish!=='function')return;
window.finishWorkout=function(feel){
if(typeof W==='undefined'||!W)return baseFinish.apply(this,arguments);
const workoutBefore=tcJsonClone(W);
const tx={
savedAt:Date.now(),
state:typeof state!=='undefined'?tcJsonClone(state):null,
course:typeof window.tcGetCourseStateSnapshot==='function'?window.tcGetCourseStateSnapshot():null
};
const summary=tcWorkoutSummary(workoutBefore,feel);
const result=baseFinish.apply(this,arguments);
if(typeof W==='undefined'||!W){
try{localStorage.setItem(TC_COMPLETION_UNDO_KEY,JSON.stringify(tx))}catch(e){}
if(typeof window.tcClearActiveWorkoutSnapshot==='function')window.tcClearActiveWorkoutSnapshot();
setTimeout(()=>tcShowCompletionSummary(summary),0);
}
return result;
};
}
function tcInstallNavigationUpgrades(){
console.log('TC_NAV_UPGRADE',JSON.stringify({phase:'install',version:VERSION}));
if(window.__tcBackControlObserver){
try{window.__tcBackControlObserver.disconnect()}catch(e){}
window.__tcBackControlObserver=null;
console.log('TC_NAV_UPGRADE',JSON.stringify({phase:'disconnect-back-observer',version:VERSION}));
}
const oldStyle=document.getElementById('tcNavUpgradeStyle');
if(oldStyle)oldStyle.remove();
const style=document.createElement('style');
style.id='tcNavUpgradeStyle';
style.textContent=
'#workout .controls{height:auto!important;min-height:246px!important;max-height:45vh!important;overflow-y:auto!important;box-sizing:border-box!important}'+
'#workout .wmedia{bottom:var(--tc-workout-controls-bottom,260px)!important}'+
'#workout .controls .chips{height:auto!important;min-height:30px!important;flex:0 0 auto!important;flex-wrap:wrap!important}'+
'#workout .controls .counter{grid-template-columns:minmax(56px,64px) minmax(0,1fr) minmax(56px,64px)!important;height:auto!important;min-height:72px!important;flex:0 0 auto!important}'+
'#workout .tcStableWorkoutControls{height:auto!important;min-height:246px!important;max-height:45vh!important;overflow-y:auto!important;box-sizing:border-box!important}'+
'.nav button{white-space:normal!important;line-height:1.15!important;padding:4px 2px!important;overflow-wrap:anywhere}'+
'#sheet .sheetbox{max-height:92vh!important;overflow-y:auto!important;overscroll-behavior:contain}'+
'.sheettitle,.dateBig{overflow-wrap:anywhere;word-break:normal}'+
'.tcCompletionStats{grid-template-columns:repeat(auto-fit,minmax(92px,1fr))!important}'+
'.tcCompletionRow{flex-wrap:wrap!important;align-items:flex-start!important}'+
'.tcCompletionRow span,.tcCompletionRow b{min-width:0!important;flex:1 1 140px!important;overflow-wrap:anywhere!important}';
document.head.appendChild(style);
function hasWorkout(){return typeof W!=='undefined'&&!!W}
function syncScreenVisibility(id){
document.querySelectorAll('.screen').forEach(screen=>{
const active=screen.id===id;
screen.classList.toggle('on',active);
screen.hidden=!active;
screen.setAttribute('aria-hidden',active?'false':'true');
screen.style.display=active?'flex':'none';
});
const target=document.getElementById(id);
if(target)void target.offsetHeight;
}
function forceRepaint(){
const app=document.getElementById('app');
if(!app)return;
const previous=app.style.display;
app.style.display='none';
void app.offsetHeight;
app.style.display=previous||'block';
void app.offsetHeight;
if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>{
app.style.transform='translateZ(0)';
void app.offsetHeight;
app.style.transform='';
try{
if(window.TurnikNative&&typeof window.TurnikNative.invalidate==='function')window.TurnikNative.invalidate();
}catch(e){}
});
}
function installAdaptiveGeometry(){
const workout=document.getElementById('workout');
const controls=workout&&workout.querySelector('.controls,.tcStableWorkoutControls');
if(!workout||!controls)return;
const apply=()=>{
const h=Math.ceil(controls.getBoundingClientRect().height||0);
if(h>0)workout.style.setProperty('--tc-workout-controls-bottom',(h+22)+'px');
};
if(window.__tcWorkoutGeometryUpgradeObserver){
try{window.__tcWorkoutGeometryUpgradeObserver.disconnect()}catch(e){}
}
if(typeof ResizeObserver==='function'){
const ro=new ResizeObserver(apply);
ro.observe(controls);
window.__tcWorkoutGeometryUpgradeObserver=ro;
}
apply();
setTimeout(apply,0);
}
window.tcInstallAdaptiveWorkoutGeometry=installAdaptiveGeometry;
window.tcRefreshActiveTrainingSurface=function(id){
if(!hasWorkout())return false;
const target=id==='rest'?'rest':'workout';
syncScreenVisibility(target);
try{
if(target==='workout'&&typeof renderWork==='function')renderWork();
if(target==='rest'&&typeof tcRenderRest==='function')tcRenderRest();
if(target==='workout')installAdaptiveGeometry();
}catch(e){}
forceRepaint();
try{
if(window.TurnikNative&&typeof window.TurnikNative.showSurface==='function')window.TurnikNative.showSurface(target);
else if(window.TurnikNative&&typeof window.TurnikNative.refreshSurface==='function')window.TurnikNative.refreshSurface();
}catch(e){}
return true;
};
function enforceRestoreGuard(){
const guard=window.__tcRestoreSurfaceGuard;
if(!guard)return false;
if(Date.now()>guard.until||!hasWorkout()){
window.__tcRestoreSurfaceGuard=null;
return false;
}
return window.tcRefreshActiveTrainingSurface(guard.surface);
}
function logRestoreSurface(delay){
try{
const readScreen=id=>{
const el=document.getElementById(id);
if(!el)return null;
const r=el.getBoundingClientRect();
return {
on:el.classList.contains('on'),
hidden:!!el.hidden,
display:getComputedStyle(el).display,
width:Math.round(r.width),
height:Math.round(r.height),
top:Math.round(r.top),
left:Math.round(r.left)
};
};
const screens=[...document.querySelectorAll('.screen')].map(el=>({
id:el.id,
on:el.classList.contains('on'),
hidden:!!el.hidden,
display:getComputedStyle(el).display
}));
const buttons=[...document.querySelectorAll('button')];
const hasButton=text=>buttons.some(btn=>(btn.textContent||'').trim().includes(text));
console.log('TC_RESTORE_SURFACE',JSON.stringify({
phase:'snapshot',
delay,
version:VERSION,
activeScreens:screens.filter(s=>s.on).map(s=>s.id),
screens,
today:readScreen('today'),
workout:readScreen('workout'),
rest:readScreen('rest'),
hasDone:hasButton('Сделано'),
hasExit:hasButton('Выйти'),
historyState:history.state||null,
hasW:hasWorkout(),
mode:hasWorkout()&&W&&W.mode?W.mode:null
}));
}catch(e){
console.log('TC_RESTORE_SURFACE',JSON.stringify({phase:'snapshot-error',delay,version:VERSION,error:String(e&&e.message||e)}));
}
}
window.tcArmRestoreSurfaceGuard=function(surface){
window.__tcRestoreSurfaceGuard={surface:surface==='rest'?'rest':'workout',until:Date.now()+5000};
console.log('TC_NAV_UPGRADE',JSON.stringify({phase:'arm-restore-guard',version:VERSION,surface:window.__tcRestoreSurfaceGuard.surface}));
const enforce=()=>{try{enforceRestoreGuard()}catch(e){}};
const enforceAndLog=delay=>{enforce();logRestoreSurface(delay)};
enforceAndLog(0);
if(typeof requestAnimationFrame==='function'){
requestAnimationFrame(()=>{enforce();requestAnimationFrame(enforce)});
}
[250,750,1500,3000].forEach(delay=>setTimeout(()=>enforceAndLog(delay),delay));
return true;
};
if(window.__tcRestoreGuardFocusHandler)window.removeEventListener('focus',window.__tcRestoreGuardFocusHandler);
if(window.__tcRestoreGuardPageshowHandler)window.removeEventListener('pageshow',window.__tcRestoreGuardPageshowHandler);
if(window.__tcRestoreGuardVisibilityHandler)document.removeEventListener('visibilitychange',window.__tcRestoreGuardVisibilityHandler);
window.__tcRestoreGuardFocusHandler=enforceRestoreGuard;
window.__tcRestoreGuardPageshowHandler=enforceRestoreGuard;
window.__tcRestoreGuardVisibilityHandler=()=>{if(document.visibilityState==='visible')enforceRestoreGuard()};
window.addEventListener('focus',window.__tcRestoreGuardFocusHandler);
window.addEventListener('pageshow',window.__tcRestoreGuardPageshowHandler);
document.addEventListener('visibilitychange',window.__tcRestoreGuardVisibilityHandler);
if(window.__tcAdaptiveSurfaceObserver){
try{window.__tcAdaptiveSurfaceObserver.disconnect()}catch(e){}
}
const app=document.getElementById('app');
if(app){
const mo=new MutationObserver(()=>{
const workout=document.getElementById('workout');
if(workout&&workout.classList.contains('on'))installAdaptiveGeometry();
});
mo.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
window.__tcAdaptiveSurfaceObserver=mo;
}
const workout=document.getElementById('workout');
if(workout&&workout.classList.contains('on'))installAdaptiveGeometry();
window.__TC_NAV_UPGRADE_VERSION=VERSION;
}
function tcInstallNavigationFoundation(){
if(window.__TC_NAV_FOUNDATION)return;
window.__TC_NAV_FOUNDATION=true;
const style=document.createElement('style');
style.id='tcNavFoundationStyle';
style.textContent=
'.tcWorkoutExitBtn{height:48px;min-width:68px;border-radius:12px;border:1px solid #70424a;background:rgba(42,24,27,.94);color:#ffb8bd;font-size:12px;font-weight:900;padding:0 10px;display:grid;place-items:center;z-index:30;touch-action:manipulation}'+
'.tcWorkoutExitBtn:active,.tcBackBtn:active,.tcRestExitBtn:active{transform:scale(.96)}'+
'.tcBackBtn{width:48px;height:48px;min-width:48px;border-radius:50%;border:1px solid rgba(255,255,255,.22);background:rgba(13,20,27,.88);color:#fff;font-size:25px;font-weight:900;display:grid;place-items:center;padding:0;z-index:30;touch-action:manipulation}'+
'.tcRestBack{position:absolute;left:12px;top:12px}'+
'.tcRestExitBtn{position:absolute;right:12px;top:12px;height:48px;min-width:68px;border-radius:12px;border:1px solid #70424a;background:#2a181b;color:#ffb8bd;font-size:12px;font-weight:900;padding:0 10px;z-index:30;touch-action:manipulation}'+
'.tcSheetClose{position:sticky;float:right;top:0;margin:-4px -3px 6px 10px;width:48px;height:48px;min-width:48px;border-radius:50%;border:1px solid #3a4653;background:#202a32;color:#fff;font-size:24px;font-weight:900;z-index:5;touch-action:manipulation}'+
'#workout .stageHeader .row.between,#workout .wtop .row.between{gap:8px}'+
'#workout .wtop .row.between{position:relative;padding-left:78px;min-height:48px}'+
'#workout .wtop .tcWorkoutExitBtn{position:absolute;left:0;top:0}'+
'#workout .stageHeader .endBtn{min-height:48px!important;min-width:76px!important;padding:0 12px!important;touch-action:manipulation}'+
'#workout .stageControls .btn,#rest .btn,#sheet .sheetbox .btn{min-height:48px!important;touch-action:manipulation}'+
'#workout .stageControls .btn.green,#rest .btn.green{min-height:58px!important;font-size:16px!important}'+
'#workout .controls{height:auto!important;min-height:246px!important;max-height:45vh!important;overflow-y:auto!important;padding:12px!important;display:flex!important;flex-direction:column!important;gap:6px!important;box-sizing:border-box!important}'+
'#workout .wmedia{bottom:var(--tc-workout-controls-bottom,260px)!important}'+
'#workout .controls .chips{height:auto!important;min-height:30px!important;flex:0 0 auto!important;flex-wrap:wrap!important}'+
'#workout .controls .counter{grid-template-columns:minmax(56px,64px) minmax(0,1fr) minmax(56px,64px)!important;height:auto!important;min-height:72px!important;gap:10px!important;flex:0 0 auto!important}'+
'#workout .controls .pm{height:60px!important;min-height:60px!important;min-width:60px!important;font-size:30px!important;touch-action:manipulation}'+
'#workout .controls .fact b{font-size:42px!important}'+
'#workout .controls .actions{display:grid!important;grid-template-columns:1fr!important;gap:6px!important;margin-top:auto!important}'+
'#workout .controls .actions .btn.green{min-height:60px!important;font-size:17px!important;font-weight:900!important;order:1}'+
'#workout .controls .actions .btn.ghost{min-height:48px!important;order:2}'+
'#workout .tcStableWorkoutControls{height:auto!important;min-height:246px!important;max-height:45vh!important;overflow-y:auto!important;padding:12px!important;box-sizing:border-box!important}'+
'#workout .tcWorkoutActions{display:grid!important;grid-template-columns:1fr!important;gap:6px!important}'+
'#workout .tcWorkoutDoneAction{min-height:60px!important;font-size:17px!important;font-weight:900!important;width:100%!important}'+
'#workout .tcWorkoutSkipAction{min-height:48px!important;width:100%!important}'+
'#workout .tcWorkoutMinus,#workout .tcWorkoutPlus{min-width:60px!important;min-height:60px!important;touch-action:manipulation}'+
'.nav button{min-height:48px!important;touch-action:manipulation;white-space:normal!important;line-height:1.15!important;padding:4px 2px!important;overflow-wrap:anywhere}'+
'#sheet .sheetbox{max-height:92vh!important;overflow-y:auto!important;overscroll-behavior:contain}'+
'.sheettitle,.dateBig{overflow-wrap:anywhere;word-break:normal}';
document.head.appendChild(style);
const completionStyle=document.createElement('style');
completionStyle.id='tcCompletionFlowStyle';
completionStyle.textContent='.tcCompletionStats{display:grid;grid-template-columns:repeat(auto-fit,minmax(92px,1fr));gap:8px;margin:16px 0}.tcCompletionStats div{background:#10171d;border:1px solid #34414d;border-radius:12px;padding:10px 6px;text-align:center;min-width:0}.tcCompletionStats b{display:block;font-size:22px;color:#ffd84d;overflow-wrap:anywhere}.tcCompletionStats span{display:block;margin-top:3px;font-size:10px;color:#9ba6b2;overflow-wrap:anywhere}.tcCompletionRows{max-height:min(38vh,260px);overflow:auto}.tcCompletionRow{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px 12px;padding:8px 2px;border-bottom:1px solid #27313b;font-size:12px}.tcCompletionRow span,.tcCompletionRow b{min-width:0;flex:1 1 140px;overflow-wrap:anywhere}.tcCompletionRow span{color:#c8d0d8}.tcCompletionRow b{text-align:right;color:#fff}';
document.head.appendChild(completionStyle);
let internal=false;
let sheetWasOpen=false;
const scrollByScreen={};
let tcWorkoutGeometryObserver=null;
function tcInstallAdaptiveWorkoutGeometry(){
const workout=document.getElementById('workout');
const controls=workout&&workout.querySelector('.controls,.tcStableWorkoutControls');
if(!workout||!controls)return;
const apply=()=>{
const h=Math.ceil(controls.getBoundingClientRect().height||0);
if(h>0)workout.style.setProperty('--tc-workout-controls-bottom',(h+22)+'px');
};
if(tcWorkoutGeometryObserver)try{tcWorkoutGeometryObserver.disconnect()}catch(e){}
if(typeof ResizeObserver==='function'){
tcWorkoutGeometryObserver=new ResizeObserver(apply);
tcWorkoutGeometryObserver.observe(controls);
}
apply();
setTimeout(apply,0);
}
function currentScreen(){
const el=document.querySelector('.screen.on');
return el&&el.id?el.id:'today';
}
function currentScroll(screen){
const root=document.getElementById(screen);
const sc=root&&root.querySelector('.scroll');
return sc?sc.scrollTop:0;
}
function restoreScroll(screen){
const root=document.getElementById(screen);
const sc=root&&root.querySelector('.scroll');
if(sc&&Number.isFinite(scrollByScreen[screen]))sc.scrollTop=scrollByScreen[screen];
}
function routeUrl(screen,sheet){
return '#tc='+encodeURIComponent(screen)+(sheet?'&sheet=1':'');
}
function replaceRoute(screen,sheet){
try{history.replaceState({tcNav:true,tcScreen:screen,tcSheet:!!sheet},'',routeUrl(screen,sheet))}catch(e){}
}
function pushRoute(screen,sheet){
try{history.pushState({tcNav:true,tcScreen:screen,tcSheet:!!sheet},'',routeUrl(screen,sheet))}catch(e){}
}
function tcHasWorkout(){return typeof W!=='undefined'&&!!W}
function tcSyncScreenVisibility(id){
const screens=[...document.querySelectorAll('.screen')];
screens.forEach(screen=>{
const active=screen.id===id;
screen.classList.toggle('on',active);
screen.hidden=!active;
screen.setAttribute('aria-hidden',active?'false':'true');
screen.style.display=active?'flex':'none';
});
const target=document.getElementById(id);
if(target){void target.offsetHeight}
}
function tcForceWebViewRepaint(){
const app=document.getElementById('app');
if(!app)return;
const previous=app.style.display;
app.style.display='none';
void app.offsetHeight;
app.style.display=previous||'block';
void app.offsetHeight;
requestAnimationFrame(()=>{
app.style.transform='translateZ(0)';
void app.offsetHeight;
app.style.transform='';
try{
if(window.TurnikNative&&typeof window.TurnikNative.invalidate==='function')window.TurnikNative.invalidate();
}catch(e){}
});
}
window.tcRefreshActiveTrainingSurface=function(id){
if(typeof W==='undefined'||!W)return false;
const target=id==='rest'?'rest':'workout';
tcSyncScreenVisibility(target);
try{
if(target==='workout'&&typeof renderWork==='function')renderWork();
if(target==='rest'&&typeof tcRenderRest==='function')tcRenderRest();
if(target==='workout'&&typeof tcInstallAdaptiveWorkoutGeometry==='function')tcInstallAdaptiveWorkoutGeometry();
}catch(e){}
tcForceWebViewRepaint();
try{
if(window.TurnikNative&&typeof window.TurnikNative.showSurface==='function')window.TurnikNative.showSurface(target);
else if(window.TurnikNative&&typeof window.TurnikNative.refreshSurface==='function')window.TurnikNative.refreshSurface();
}catch(e){}
return true;
};
function tcEnforceRestoreSurfaceGuard(){
const guard=window.__tcRestoreSurfaceGuard;
if(!guard)return false;
if(Date.now()>guard.until||!tcHasWorkout()){
window.__tcRestoreSurfaceGuard=null;
return false;
}
return window.tcRefreshActiveTrainingSurface(guard.surface);
}
window.tcArmRestoreSurfaceGuard=function(surface){
window.__tcRestoreSurfaceGuard={
surface:surface==='rest'?'rest':'workout',
until:Date.now()+5000
};
const enforce=()=>{try{tcEnforceRestoreSurfaceGuard()}catch(e){}};
enforce();
if(typeof requestAnimationFrame==='function'){
requestAnimationFrame(()=>{enforce();requestAnimationFrame(enforce)});
}
[250,750,1500,3000].forEach(delay=>setTimeout(enforce,delay));
return true;
};
window.addEventListener('focus',tcEnforceRestoreSurfaceGuard);
window.addEventListener('pageshow',tcEnforceRestoreSurfaceGuard);
document.addEventListener('visibilitychange',()=>{
if(document.visibilityState==='visible')tcEnforceRestoreSurfaceGuard();
});
function tcClearWorkout(){try{if(typeof rt!=='undefined'&&rt){clearInterval(rt);rt=null}}catch(e){}try{W=null}catch(e){}try{if(typeof window.tcClearActiveWorkoutSnapshot==='function')window.tcClearActiveWorkoutSnapshot()}catch(e){}}
const baseGo=window.go;
window.go=function(id){
const from=currentScreen();
scrollByScreen[from]=currentScroll(from);
const r=baseGo(id);
tcSyncScreenVisibility(id);
if(id==='workout')tcInstallAdaptiveWorkoutGeometry();
tcForceWebViewRepaint();
if(id==='workout'&&tcHasWorkout()){
const saveFn=window.tcSaveActiveWorkoutSnapshot;
const saved=typeof saveFn==='function'?saveFn():false;
console.log('TC_WORKOUT_STATE',JSON.stringify({phase:'boundary-save',available:typeof saveFn==='function',saved:!!saved,hasW:tcHasWorkout()}));
}
if(internal){restoreScroll(id);return r}
const trainingFlow=tcHasWorkout()&&(id==='workout'||id==='rest')&&(from==='workout'||from==='rest');
const finishedTraining=!tcHasWorkout()&&(from==='workout'||from==='rest')&&['today','exercise','historyScreen'].includes(id);
if(trainingFlow||finishedTraining){
replaceRoute(id,false);
}else if(id!==from){
pushRoute(id,false);
}else{
replaceRoute(id,false);
}
restoreScroll(id);
setTimeout(tcDecorateBackControls,0);
return r;
};
const sheet=document.getElementById('sheet');
function closeSheetNow(){
try{
if(typeof window.closeSheet==='function')window.closeSheet();
else if(sheet)sheet.classList.remove('open');
}catch(e){if(sheet)sheet.classList.remove('open')}
}
function abandonWorkoutAndGo(target){
tcClearWorkout();
internal=true;
try{baseGo(target||'today')}finally{internal=false}
tcSyncScreenVisibility(target||'today');
replaceRoute(target||'today',false);
tcForceWebViewRepaint();
setTimeout(tcDecorateBackControls,0);
}
function tcDiscardWorkoutNow(){
if(!tcHasWorkout()){showRuntimeNotice('Активная тренировка уже отсутствует.','danger');return;}
if(sheet)sheet.classList.remove('open');
abandonWorkoutAndGo('today');
showRuntimeNotice('Текущая тренировка закрыта без сохранения.');
}
window.tcDiscardWorkout=function(){
if(!tcHasWorkout()){showRuntimeNotice('Нет активной тренировки для выхода без сохранения.','danger');return;}
const box=document.getElementById('sheetbox');
if(!box||!sheet){showRuntimeNotice('Не удалось открыть подтверждение выхода.','danger');return;}
box.innerHTML='<div class="sheettitle">Завершить без сохранения?</div>'+
'<div class="sub" style="margin-top:7px;line-height:1.45">Подходы этого запуска будут отброшены. Тренировка не попадёт в историю и останется доступной для повторного начала.</div>'+
'<button id="tcConfirmDiscardWorkoutBtn" type="button" class="btn danger full" style="margin-top:16px">Завершить без сохранения</button>'+
'<button id="tcCancelDiscardWorkoutBtn" type="button" class="btn ghost full" style="margin-top:8px">Продолжить тренировку</button>';
sheet.classList.add('open');
const yes=document.getElementById('tcConfirmDiscardWorkoutBtn');
const no=document.getElementById('tcCancelDiscardWorkoutBtn');
if(yes)yes.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation()}tcDiscardWorkoutNow();return false};
if(no)no.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation()}closeSheetNow();return false};
};
window.tcNavigateBack=function(){
const scr=currentScreen();
if(sheet&&sheet.classList.contains('open')){
if(history.state&&history.state.tcSheet){history.back();return}
closeSheetNow();return;
}
if(scr==='rest'&&tcHasWorkout()){
history.back();return;
}
if(scr==='workout'&&tcHasWorkout()){
window.tcDiscardWorkout();return;
}
if(history.length>1){history.back();return}
if(scr!=='today'){
internal=true;try{baseGo('today')}finally{internal=false}
replaceRoute('today',false);
}
};
window.addEventListener('popstate',function(ev){
const scr=currentScreen();
if(sheet&&sheet.classList.contains('open')){
internal=true;
try{closeSheetNow()}finally{internal=false}
sheetWasOpen=false;
return;
}
if(scr==='rest'&&tcHasWorkout()){
internal=true;
try{
if(typeof window.finishRest==='function')window.finishRest();
else baseGo('workout');
}finally{internal=false}
pushRoute('workout',false);
setTimeout(tcDecorateBackControls,0);
return;
}
const target=ev.state&&ev.state.tcScreen?ev.state.tcScreen:'today';
if(scr==='workout'&&tcHasWorkout()&&target!=='workout'){
pushRoute('workout',false);
window.tcDiscardWorkout();
return;
}
internal=true;
try{baseGo(target)}finally{internal=false}
restoreScroll(target);
setTimeout(tcDecorateBackControls,0);
});
function tcStabilizeWorkoutControls(){
const root=document.querySelector('#workout.screen.on');
if(!root)return;
const buttons=[...root.querySelectorAll('button')];
const byText=(test)=>buttons.find(b=>test((b.textContent||'').trim()));
const done=byText(t=>t==='Сделано');
const skip=byText(t=>/^Пропустить/.test(t));
const minus=byText(t=>t==='−'||t==='-');
const plus=byText(t=>t==='+');
if(done)done.classList.add('tcWorkoutDoneAction');
if(skip)skip.classList.add('tcWorkoutSkipAction');
if(minus)minus.classList.add('tcWorkoutMinus');
if(plus)plus.classList.add('tcWorkoutPlus');
if(done&&skip&&done.parentElement===skip.parentElement)done.parentElement.classList.add('tcWorkoutActions');
const panel=(done&&done.closest('.stageControls,.controls'))||(skip&&skip.closest('.stageControls,.controls'));
if(panel)panel.classList.add('tcStableWorkoutControls');
}
function tcDecorateBackControls(){
tcStabilizeWorkoutControls();
const wh=document.querySelector('#workout.screen.on .stageHeader .row.between, #workout.screen.on .wtop .row.between');
if(wh&&!wh.querySelector('.tcWorkoutExitBtn')){
const b=document.createElement('button');
b.type='button';b.className='tcWorkoutExitBtn';b.textContent='Выйти';b.title='Выйти без сохранения';
b.onclick=window.tcDiscardWorkout;
wh.insertBefore(b,wh.firstChild);
}
const rest=document.querySelector('#rest.screen.on .rest');
if(rest&&!rest.querySelector('.tcRestBack')){
const b=document.createElement('button');
b.type='button';b.className='tcBackBtn tcRestBack';b.textContent='‹';b.title='Назад к упражнению';
b.onclick=window.tcNavigateBack;
rest.appendChild(b);
}
if(rest&&!rest.querySelector('.tcRestExitBtn')){
const b=document.createElement('button');
b.type='button';b.className='tcRestExitBtn';b.textContent='Выйти';b.title='Выйти без сохранения';
b.onclick=window.tcDiscardWorkout;
rest.appendChild(b);
}
if(sheet&&sheet.classList.contains('open')){
const box=document.getElementById('sheetbox');
if(box&&!box.querySelector('.tcSheetClose')){
const b=document.createElement('button');
b.type='button';b.className='tcSheetClose';b.textContent='×';b.title='Закрыть';
b.onclick=window.tcNavigateBack;
box.insertBefore(b,box.firstChild);
}
}
}
window.tcEnsureWorkoutControls=function(){setTimeout(tcDecorateBackControls,0)};
if(sheet){
const mo=new MutationObserver(function(){
const open=sheet.classList.contains('open');
if(open&&!sheetWasOpen){
sheetWasOpen=true;
if(!internal&&!(history.state&&history.state.tcSheet))pushRoute(currentScreen(),true);
}else if(!open&&sheetWasOpen){
sheetWasOpen=false;
if(!internal&&history.state&&history.state.tcSheet)history.back();
}
tcDecorateBackControls();
});
mo.observe(sheet,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
window.__tcSheetNavObserver=mo;
}
document.addEventListener('keydown',function(e){
if(e.key==='Escape'){e.preventDefault();window.tcNavigateBack()}
});
const start=currentScreen();
tcSyncScreenVisibility(start);
replaceRoute(start,false);
tcDecorateBackControls();
const app=document.getElementById('app');
if(app){
const mo=new MutationObserver(tcDecorateBackControls);
mo.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
window.__tcBackControlObserver=mo;
}
}
function installUpdate(){
if(window.__TC_HOTFIX_ACTIVE_VERSION===VERSION)return;
const previousVersion=String(window.__TC_HOTFIX_ACTIVE_VERSION||window.__TC_HOTFIX_VERSION||'');
window.__TC_HOTFIX_ACTIVE_VERSION=VERSION;
const stalePendingVersion=String(window.__TC_UPDATE_PENDING_VERSION||'');
let priorInstalledHotfix='';
try{priorInstalledHotfix=String(localStorage.getItem('tc_hotfix_active_version')||'')}catch(e){}
window.__TC_UPDATE_DISMISSED_VERSION=
stalePendingVersion.startsWith('5.16.')&&stalePendingVersion!==VERSION?stalePendingVersion:
priorInstalledHotfix.startsWith('5.16.')&&priorInstalledHotfix!==VERSION?priorInstalledHotfix:
previousVersion.startsWith('5.16.')&&previousVersion!==VERSION?previousVersion:
'5.16.35-touch-release';
window.__TC_UPDATE_PENDING_VERSION='';
window.__tcDeferredUpdateActivate=null;
removeUpdatePrompt();
window.__TC_HOTFIX_VERSION=LEGACY_ASSET_VERSION;
window.__TC_HOTFIX_LABEL=LABEL;
const activatedAt=Date.now();
window.__TC_HOTFIX_INSTALLED_AT=activatedAt;
try{
localStorage.setItem('tc_hotfix_active_version',VERSION);
localStorage.setItem('tc_hotfix_active_label',LABEL);
localStorage.setItem('tc_hotfix_activated_at',String(activatedAt));
}catch(e){}
function tcClamp(v,min,max){return Math.max(min,Math.min(max,v))}
function restReasonEl(){
let el=document.getElementById('restWhy');
if(el)return el;
const ring=document.getElementById('restNum');
if(!ring||!ring.parentNode)return null;
el=document.createElement('div');
el.id='restWhy';
el.className='sub';
el.style.cssText='max-width:360px;text-align:center;margin:10px 0 0;line-height:1.35';
el.textContent='Отдых рассчитывается по нагрузке и факту предыдущего подхода';
ring.parentNode.insertBefore(el,ring);
return el;
}
let tcAudioCtx=window.__tcAudioCtx||null;
function tcAudio(){
try{
const Ctx=window.AudioContext||window.webkitAudioContext;
if(!Ctx)return null;
if(!tcAudioCtx){tcAudioCtx=new Ctx();window.__tcAudioCtx=tcAudioCtx}
return tcAudioCtx;
}catch(e){return null}
}
function tcPrimeAudio(){
const c=tcAudio();
if(!c)return;
try{
const p=c.resume&&c.resume();
if(p&&p.catch)p.catch(()=>{});
}catch(e){}
}
function tcTone(freq,duration,volume,delay){
const c=tcAudio();
if(!c)return;
const play=()=>{
try{
const t=c.currentTime+(delay||0);
const o=c.createOscillator();
const g=c.createGain();
o.type='square';
o.frequency.setValueAtTime(freq,t);
g.gain.setValueAtTime(Math.max(.001,volume||.32),t);
g.gain.exponentialRampToValueAtTime(.001,t+duration);
o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+duration+.02);
}catch(e){}
};
try{
if(c.state==='suspended'&&c.resume){
const p=c.resume();
if(p&&p.then)p.then(play).catch(()=>{});else play();
}else play();
}catch(e){}
}
function tcBeep(freq=1050,duration=.14,volume=.38){
tcTone(freq,duration,volume,0);
try{if(navigator.vibrate)navigator.vibrate(Math.max(40,Math.round(duration*450)))}catch(e){}
}
function tcFinishSignal(){
tcTone(620,.18,.42,0);
tcTone(880,.26,.46,.20);
try{if(navigator.vibrate)navigator.vibrate([120,70,180])}catch(e){}
}
window.beep=tcBeep;
['pointerdown','touchstart','click'].forEach(ev=>document.addEventListener(ev,tcPrimeAudio,{passive:true}));
window.adaptiveRest=function(e,sessionIndex,target,actual,skipped){
const base=restSeconds(e,sessionIndex);
const max=Math.max(1,+e.max||1);
const plan=Math.max(1,+target||1);
let delta=0;
const notes=[];
const intensity=plan/max;
if(intensity>=0.80){delta+=30;notes.push('тяжёлый подход +30 с')}
else if(intensity>=0.70){delta+=15;notes.push('высокая интенсивность +15 с')}
else if(intensity<=0.50){delta-=15;notes.push('лёгкая интенсивность −15 с')}
if(skipped||actual===null||actual===undefined){
delta+=45;notes.push('подход пропущен +45 с');
}else{
const ratio=(+actual||0)/plan;
if(ratio<0.75){delta+=45;notes.push('выполнено <75% плана +45 с')}
else if(ratio<0.90){delta+=30;notes.push('выполнено <90% плана +30 с')}
else if(ratio>1.20){delta-=15;notes.push('план заметно перевыполнен −15 с')}
}
const seconds=tcClamp(Math.round((base+delta)/15)*15,45,240);
return{
seconds,
note:`${e.name}: база ${base} с${notes.length?' · '+notes.join(' · '):' · выполнено по плану'} → ${seconds} с`
};
};
window.transitionRest=function(prevE,nextE,sessionIndex,target,actual,skipped){
const prev=window.adaptiveRest(prevE,sessionIndex,target,actual,skipped);
const nextBase=restSeconds(nextE,sessionIndex);
const seconds=tcClamp(Math.max(prev.seconds,nextBase,90)+15,60,240);
return{
seconds,
note:`Переход к «${nextE.name}»: ${seconds} с · учтены предыдущий подход и нагрузка следующего упражнения`
};
};
let tcRestEnd=0;
let tcRestActive=false;
let tcSignalSeconds=new Set();
function tcRenderRest(){
if(!tcRestActive||!tcRestEnd)return;
const left=Math.max(0,Math.ceil((tcRestEnd-Date.now())/1000));
R=left;
const el=document.getElementById('restNum');
if(el)el.textContent=left;
if(left>0&&left<=3&&!tcSignalSeconds.has(left)){
tcSignalSeconds.add(left);
tcBeep(1120,.16,.42);
}
if(left<=0){
tcRestActive=false;
tcRestEnd=0;
if(rt){clearInterval(rt);rt=null}
tcFinishSignal();
window.finishRest();
}
}
const originalFinishRest=window.finishRest;
window.finishRest=function(){
tcRestActive=false;
tcRestEnd=0;
tcSignalSeconds.clear();
if(rt){clearInterval(rt);rt=null}
return originalFinishRest();
};
function tcNextWorkoutStepText(){
try{
if(typeof W==='undefined'||!W||!Array.isArray(W.items)||!W.items.length)return '';
const x=W.items[W.exerciseIndex],e=x&&x.e;
if(!x||!e)return '';
const raw=(x.planLabels&&x.planLabels[W.setIndex]!=null)?x.planLabels[W.setIndex]:
(x.plan&&x.plan[W.setIndex]!=null?x.plan[W.setIndex]:W.actual);
const unit=e.metric==='time'||e.id==='plank'?'сек':e.metric==='weighted'?'кг':'повт.';
return 'Следующий подход · '+e.name+(raw!=null?' · '+raw+' '+unit:'');
}catch(e){return ''}
}
function tcUpdateRestNextStep(){
const sub=document.querySelector('#rest .rest .sub');
const text=tcNextWorkoutStepText();
if(sub&&text)sub.textContent=text;
}
window.startRest=function(sec,note){
sec=Math.max(0,Math.round(+sec||0));
const el=restReasonEl();
window.__tcLastRestNote=note||'Отдых рассчитан по нагрузке и факту предыдущего подхода';if(el){el.textContent=window.__tcLastRestNote;el.style.display='none';}
tcPrimeAudio();
tcRestActive=true;
tcRestEnd=Date.now()+sec*1000;
tcSignalSeconds.clear();
R=sec;
const ring=document.getElementById('restNum');
if(ring)ring.textContent=R;
go('rest');
tcUpdateRestNextStep();
if(rt)clearInterval(rt);
rt=setInterval(tcRenderRest,250);
tcRenderRest();
};
window.addRest=function(){
if(tcRestActive&&tcRestEnd){
tcRestEnd+=30000;
tcSignalSeconds.clear();
tcRenderRest();
}else{
R=(+R||0)+30;
const ring=document.getElementById('restNum');
if(ring)ring.textContent=R;
}
const el=restReasonEl();
if(el&&!/добавлено вручную/.test(el.textContent))el.textContent+=' · добавлено вручную +30 с';
};
function tcResumeClock(){
if(tcRestActive)tcRenderRest();
}
document.addEventListener('visibilitychange',tcResumeClock);
window.addEventListener('focus',tcResumeClock);
window.addEventListener('pageshow',tcResumeClock);
const TC_ACTIVE_WORKOUT_KEY='tc_active_workout_v2';
let tcWorkoutPersistenceInstalled=false;
function tcWorkoutScreen(){
const el=document.querySelector('.screen.on');
return el&&el.id?el.id:'workout';
}
function tcClearActiveWorkoutSnapshot(){
try{localStorage.removeItem(TC_ACTIVE_WORKOUT_KEY)}catch(e){}
}
function tcSaveActiveWorkoutSnapshot(){
try{
if(typeof W==='undefined'||!W){
tcClearActiveWorkoutSnapshot();
return false;
}
const payload={
schema:2,
savedAt:Date.now(),
screen:tcWorkoutScreen(),
workout:W,
rest:{
active:!!tcRestActive,
end:+tcRestEnd||0,
note:String(window.__tcLastRestNote||'')
},
manualRest:window.__tcManualCourseRest||null
};
localStorage.setItem(TC_ACTIVE_WORKOUT_KEY,JSON.stringify(payload));
try{
const item=W.items&&W.items[W.exerciseIndex];
console.log('TC_WORKOUT_STATE',JSON.stringify({phase:'snapshot-saved',screen:payload.screen,mode:String(W.mode||''),exerciseIndex:+W.exerciseIndex||0,setIndex:+W.setIndex||0,name:item&&item.e&&item.e.name||''}));
}catch(_){}
return true;
}catch(e){
console.error('TurnikCoach active workout save',e);
return false;
}
}
function tcValidRestoredWorkout(w){
if(!w||typeof w!=='object'||!Array.isArray(w.items)||!w.items.length)return false;
if(!Number.isInteger(+w.exerciseIndex)||+w.exerciseIndex<0||+w.exerciseIndex>=w.items.length)return false;
const item=w.items[+w.exerciseIndex];
if(!item||!Array.isArray(item.plan)||!item.plan.length)return false;
if(!Number.isInteger(+w.setIndex)||+w.setIndex<0||+w.setIndex>=item.plan.length)return false;
return true;
}
function tcRestoreActiveWorkoutSnapshot(){
const hadActiveWorkout=typeof W!=='undefined'&&!!W;
let payload=null;
try{payload=JSON.parse(localStorage.getItem(TC_ACTIVE_WORKOUT_KEY)||'null')}catch(e){}
if(!payload||payload.schema!==2||!tcValidRestoredWorkout(payload.workout)){
if(payload)tcClearActiveWorkoutSnapshot();
return false;
}
const age=Date.now()-(+payload.savedAt||0);
if(age<0||age>24*60*60*1000){
tcClearActiveWorkoutSnapshot();
return false;
}
try{
if(!hadActiveWorkout)W=payload.workout;
window.__tcManualCourseRest=payload.manualRest||null;
const rest=payload.rest||{};
tcRestActive=!!rest.active;
tcRestEnd=+rest.end||0;
window.__tcLastRestNote=String(rest.note||'');
if(tcRestActive&&tcRestEnd){
R=Math.max(0,Math.ceil((tcRestEnd-Date.now())/1000));
const ring=document.getElementById('restNum');
if(ring)ring.textContent=R;
go('rest');
tcUpdateRestNextStep();
if(rt)clearInterval(rt);
rt=setInterval(tcRenderRest,250);
tcRenderRest();
}else{
tcRestActive=false;
tcRestEnd=0;
go('workout');
if(typeof renderWork==='function')renderWork();
}
const restoredSurface=tcRestActive&&tcRestEnd?'rest':'workout';
try{
if(typeof window.tcArmRestoreSurfaceGuard==='function')window.tcArmRestoreSurfaceGuard(restoredSurface);
else if(typeof window.tcRefreshActiveTrainingSurface==='function')window.tcRefreshActiveTrainingSurface(restoredSurface);
}catch(e){}
showRuntimeNotice('Незавершённая тренировка восстановлена.');
try{
const item=W.items&&W.items[W.exerciseIndex];
console.log('TC_WORKOUT_STATE',JSON.stringify({phase:hadActiveWorkout?'handover-restored':'restored',screen:tcWorkoutScreen(),mode:String(W.mode||''),exerciseIndex:+W.exerciseIndex||0,setIndex:+W.setIndex||0,name:item&&item.e&&item.e.name||'',restActive:!!tcRestActive}));
}catch(_){}
return true;
}catch(e){
console.error('TurnikCoach active workout restore',e);
try{W=null}catch(_){}
tcRestActive=false;tcRestEnd=0;
tcClearActiveWorkoutSnapshot();
return false;
}
}
function tcHapticConfirm(){
try{if(navigator.vibrate)navigator.vibrate(45)}catch(e){}
}
function tcInstallHapticFeedback(){
if(window.__TC_HAPTIC_FEEDBACK_V2)return;
window.__TC_HAPTIC_FEEDBACK_V2=true;
const baseSetDone=window.setDone;
if(typeof baseSetDone!=='function')return;
window.setDone=function(skip){
let record=null,index=-1,previous;
try{
if(typeof W!=='undefined'&&W&&Array.isArray(W.items)){
record=W.items[W.exerciseIndex];
index=W.setIndex;
previous=record&&record.actual&&record.actual[index];
}
}catch(e){record=null}
const result=baseSetDone.apply(this,arguments);
try{
const current=record&&Array.isArray(record.actual)?record.actual[index]:undefined;
if(!skip&&record&&previous===undefined&&current!==undefined&&current!==null){
tcHapticConfirm();
}
}catch(e){}
return result;
};
}
function tcCaptureCorrectionBefore(workout){
if(!workout||workout.mode==='courseTest'||!Array.isArray(workout.items))return null;
const ex=Number(workout.exerciseIndex),set=Number(workout.setIndex);
const item=workout.items[ex];
if(!item||!Array.isArray(item.plan)||set<0||set>=item.plan.length||!Array.isArray(item.actual))return null;
const had=Object.prototype.hasOwnProperty.call(item.actual,set);
return {exerciseIndex:ex,setIndex:set,input:workout.actual,had,previous:had?item.actual[set]:null,early:!!workout.early};
}
function tcCommitCorrection(workout,frame){
if(!workout||!frame||!Array.isArray(workout.items))return false;
const item=workout.items[frame.exerciseIndex];
if(!item||!Array.isArray(item.actual))return false;
if(!Object.prototype.hasOwnProperty.call(item.actual,frame.setIndex))return false;
if(frame.had&&item.actual[frame.setIndex]===frame.previous)return false;
if(!Array.isArray(workout.__tcCorrectionTrail))workout.__tcCorrectionTrail=[];
workout.__tcCorrectionTrail.push(frame);
if(workout.__tcCorrectionTrail.length>150)workout.__tcCorrectionTrail.shift();
return true;
}
function tcUndoCorrection(workout){
const trail=workout&&workout.__tcCorrectionTrail;
if(!Array.isArray(trail)||!trail.length)return null;
const frame=trail[trail.length-1],item=workout.items&&workout.items[frame.exerciseIndex];
if(!item||!Array.isArray(item.actual)||!Array.isArray(item.plan)||
frame.setIndex<0||frame.setIndex>=item.plan.length)return null;
trail.pop();
if(frame.had)item.actual[frame.setIndex]=frame.previous;
else item.actual.splice(frame.setIndex,1); // no JSON-null hole on process-death restore
workout.exerciseIndex=frame.exerciseIndex;
workout.setIndex=frame.setIndex;
workout.actual=frame.input;
workout.early=frame.early;
return frame;
}
function tcInstallWorkoutCorrection(){
if(window.__TC_WORKOUT_CORRECTION_V2)return;
window.__TC_WORKOUT_CORRECTION_V2=true;
const inherited=!!window.__TC_WORKOUT_CORRECTION_V1;
if(window.__tcCorrectionUiObserver)window.__tcCorrectionUiObserver.disconnect();
const originalSetDone=window.setDone;
if(!inherited&&typeof originalSetDone==='function'){
window.setDone=function(skip){
const current=typeof W!=='undefined'?W:null;
const frame=tcCaptureCorrectionBefore(current);
const result=originalSetDone.apply(this,arguments);
if(frame&&tcCommitCorrection(current,frame)){
if(typeof window.tcSaveActiveWorkoutSnapshot==='function')window.tcSaveActiveWorkoutSnapshot();
setTimeout(decorateCorrectionControls,0);
}
return result;
};
}
const style=document.createElement('style');
style.id='tcCorrectionControlsStyle';
style.textContent=
'#app > .nav{z-index:90!important;pointer-events:auto!important}'+
'#today .scroll{min-height:0!important;overscroll-behavior:contain;padding-bottom:144px!important}'+
'#workout .stageHeader .endBtn,#workout .wtop .endBtn{display:none!important}'+
'#workout .stageHeader .row.between,#workout .wtop .row.between{display:flex!important;flex-wrap:wrap!important;gap:8px!important}'+
'#workout .wtop .row.between{padding-left:0!important;min-height:0!important}'+
'#workout .wtop .tcWorkoutExitBtn{position:static!important;left:auto!important;top:auto!important}'+
'#workout .tcTrainingTopActions{display:flex;align-items:center;justify-content:space-between;width:100%;gap:12px;flex:0 0 100%;order:-1}'+
'#workout .tcWorkoutBackBtn,#workout .tcWorkoutExitBtn{min-width:88px!important;max-width:44%;min-height:48px;height:48px!important;padding:0 14px!important;border-radius:12px;font:800 14px/1.2 system-ui,sans-serif;white-space:nowrap;touch-action:manipulation}'+
'#workout .tcWorkoutBackBtn{background:#202b36;border:1px solid #566579;color:#fff}'+
'#workout .tcWorkoutExitBtn{background:#2a181b;border:1px solid #70424a;color:#ffb8bd}'+
'#workout .tcWorkoutBackBtn:disabled,#rest .tcRestBack:disabled{opacity:.45}'+
'#workout .tcCorrectionSetBtn{display:none!important}'+
'#workout .tcWorkoutExitBtn,#rest .tcRestExitBtn{min-width:100px!important;padding:0 9px!important}'+
'#workout .tcCorrectionSetBtn{width:100%;min-height:48px;border:1px solid #566579;border-radius:12px;background:#202b36;color:#fff;font:750 15px/1.2 system-ui,sans-serif;touch-action:manipulation}'+
'#workout .tcCorrectionSetBtn:active{transform:scale(.99)}'+
'#rest .tcRestBack{min-width:94px!important;width:auto!important;padding:0 7px!important;border-radius:12px!important;font-size:13px!important}'+
'#rest .tcRestBack,#rest .tcRestExitBtn{min-width:0!important;max-width:calc((100% - 112px)/2)!important;min-height:48px!important;height:auto!important;white-space:normal!important;overflow-wrap:anywhere!important}'+
'#rest .rest .tcInfoBtn{left:50%!important;right:auto!important;top:12px!important;transform:translateX(-50%)!important}';
document.head.appendChild(style);
function closeCurrentSheet(){
const el=document.getElementById('sheet');
if(el)el.classList.remove('open');
}
window.tcReturnToPreviousSet=function(){
const current=typeof W!=='undefined'?W:null;
if(!current||!Array.isArray(current.__tcCorrectionTrail)||!current.__tcCorrectionTrail.length){
showRuntimeNotice('Ранее записанных подходов пока нет.','danger');return false;
}
const frame=tcUndoCorrection(current);
if(!frame){showRuntimeNotice('Не удалось восстановить предыдущий подход.','danger');return false}
closeCurrentSheet();
window.__tcRestoreSurfaceGuard=null;
try{
tcRestActive=false;tcRestEnd=0;tcSignalSeconds.clear();
if(rt){clearInterval(rt);rt=null}
if(typeof window.finishRest==='function'&&window.__tcManualCourseRest)window.finishRest();
else window.__tcManualCourseRest=false;
}catch(e){}
try{
if(typeof go==='function')go('workout');
if(typeof renderWork==='function')renderWork();
if(typeof window.tcSaveActiveWorkoutSnapshot==='function')window.tcSaveActiveWorkoutSnapshot();
if(typeof window.tcRefreshActiveTrainingSurface==='function')window.tcRefreshActiveTrainingSurface('workout');
}catch(e){console.error('TurnikCoach set correction',e)}
setTimeout(decorateCorrectionControls,0);
showRuntimeNotice('Предыдущий подход открыт для исправления.');
return true;
};
function decorateCorrectionControls(){
const hasTrail=typeof W!=='undefined'&&W&&Array.isArray(W.__tcCorrectionTrail)&&W.__tcCorrectionTrail.length>0;
const workout=document.querySelector('#workout.screen.on');
if(workout){
const header=workout.querySelector('.stageHeader .row.between,.wtop .row.between');
if(header){
let bar=header.querySelector('.tcTrainingTopActions');
if(!bar){
bar=document.createElement('div');bar.className='tcTrainingTopActions';
const existing=header.querySelector('.tcWorkoutExitBtn');
if(existing)bar.appendChild(existing);
header.insertBefore(bar,header.firstChild);
}
let back=bar.querySelector('.tcWorkoutBackBtn');
if(!back){back=document.createElement('button');back.type='button';back.className='tcWorkoutBackBtn';back.textContent='← Назад';back.title='Вернуться к предыдущему подходу';bar.insertBefore(back,bar.firstChild)}
back.disabled=!hasTrail;back.onclick=window.tcReturnToPreviousSet;
const exit=bar.querySelector('.tcWorkoutExitBtn');
if(exit){if(exit.textContent!=='Выйти')exit.textContent='Выйти';exit.title='Выйти без сохранения';exit.onclick=window.tcDiscardWorkout;}
}
const legacy=workout.querySelector('.stageHeader .endBtn,.wtop .endBtn');
if(legacy)legacy.style.display='none';
workout.querySelectorAll('.tcCorrectionSetBtn').forEach(b=>b.remove());
}
const rest=document.querySelector('#rest.screen.on .rest');
if(rest){
const prev=rest.querySelector('.tcRestBack'),finish=rest.querySelector('.tcRestExitBtn');
if(prev){
if(prev.textContent!=='← Назад')prev.textContent='← Назад';prev.title='Вернуться к предыдущему подходу';
prev.setAttribute('aria-label','Назад');
prev.onclick=window.tcReturnToPreviousSet;prev.disabled=!hasTrail;prev.style.display='grid';
}
if(finish){if(finish.textContent!=='Выйти')finish.textContent='Выйти';finish.title='Выйти без сохранения';finish.onclick=window.tcDiscardWorkout;}
}
const sheet=document.getElementById('sheet'),box=document.getElementById('sheetbox');
if(hasTrail&&sheet&&box&&sheet.classList.contains('open')&&
[...box.querySelectorAll('button')].some(b=>/^(Легко|Нормально|Тяжело)$/i.test((b.textContent||'').trim()))&&
!box.querySelector('#tcFixSetFromFeedbackBtn')){
const b=document.createElement('button');
b.id='tcFixSetFromFeedbackBtn';b.type='button';b.className='btn ghost full';
b.textContent='Исправить последний подход';b.style.marginTop='10px';
b.onclick=window.tcReturnToPreviousSet;box.appendChild(b);
}
}
window.tcEnsureCorrectionControls=()=>setTimeout(decorateCorrectionControls,0);
const oldGo=window.go;
if(typeof oldGo==='function')window.go=function(id){
const result=oldGo.apply(this,arguments);
setTimeout(decorateCorrectionControls,0);
return result;
};
const oldRenderWork=window.renderWork;
if(typeof oldRenderWork==='function')window.renderWork=function(){
const result=oldRenderWork.apply(this,arguments);
setTimeout(decorateCorrectionControls,0);
return result;
};
const app=document.getElementById('app');
if(app){
const observer=new MutationObserver(()=>setTimeout(decorateCorrectionControls,0));
observer.observe(app,{childList:true,subtree:true});
window.__tcCorrectionUiObserver=observer;
}
decorateCorrectionControls();
}
function tcInstallWorkoutPersistence(){
if(tcWorkoutPersistenceInstalled)return;
tcWorkoutPersistenceInstalled=true;
const names=['adj','setDone','startRest','addRest','finishRest','finishWorkout',
'tcStartAuxWorkout','tcStartCourseTest','tcStartCourseWorkout','tcStartExtraWorkout','tcStartSupplementWorkout'];
names.forEach(name=>{
const fn=window[name];
if(typeof fn!=='function'||fn.__tcPersistenceWrapped)return;
const wrapped=function(){
const result=fn.apply(this,arguments);
setTimeout(tcSaveActiveWorkoutSnapshot,0);
return result;
};
wrapped.__tcPersistenceWrapped=true;
window[name]=wrapped;
});
document.addEventListener('input',()=>{if(typeof W!=='undefined'&&W)setTimeout(tcSaveActiveWorkoutSnapshot,0)},{passive:true});
document.addEventListener('change',()=>{if(typeof W!=='undefined'&&W)setTimeout(tcSaveActiveWorkoutSnapshot,0)},{passive:true});
document.addEventListener('visibilitychange',()=>{
if(document.visibilityState==='hidden')tcSaveActiveWorkoutSnapshot();
});
window.addEventListener('pagehide',tcSaveActiveWorkoutSnapshot);
window.tcSaveActiveWorkoutSnapshot=tcSaveActiveWorkoutSnapshot;
window.tcClearActiveWorkoutSnapshot=tcClearActiveWorkoutSnapshot;
let restoreStarted=false;
const startRestore=()=>{
if(restoreStarted)return;
restoreStarted=true;
tcRestoreActiveWorkoutSnapshot();
};
if(typeof requestIdleCallback==='function'){
requestIdleCallback(startRestore,{timeout:1200});
}else if(typeof requestAnimationFrame==='function'){
requestAnimationFrame(()=>requestAnimationFrame(startRestore));
}else{
setTimeout(startRestore,0);
}
}
window.setDone=function(skip){
if(!W)return;
tcPrimeAudio();
const x=W.items[W.exerciseIndex];
const target=x.plan[W.setIndex];
const actual=skip?null:W.actual;
x.actual[W.setIndex]=actual;
if(W.setIndex<x.plan.length-1){
const rest=window.adaptiveRest(x.e,W.sessionIndex,target,actual,!!skip);
W.setIndex++;
W.actual=x.plan[W.setIndex];
window.startRest(rest.seconds,rest.note);
return;
}
tcBeep(620,.24,.42);
if(W.exerciseIndex<W.items.length-1){
const next=W.items[W.exerciseIndex+1];
const rest=window.transitionRest(x.e,next.e,W.sessionIndex,target,actual,!!skip);
W.exerciseIndex++;
W.setIndex=0;
W.actual=W.items[W.exerciseIndex].plan[0];
window.startRest(rest.seconds,rest.note);
return;
}
tcFinishSignal();
askFeedback(false);
};
function tcInjectProductStyles(){
if(document.getElementById('tcProductStyles'))return;
const st=document.createElement('style');
st.id='tcProductStyles';
st.textContent=`
        .exerciseModel{display:none!important}
        #restWhy{display:none!important}
        .mediaFallback{display:none!important}
        .tcInfoBtn{width:48px;height:48px;min-width:48px;border-radius:50%;border:1px solid rgba(255,255,255,.28);background:rgba(13,20,27,.82);color:#ffd84d;font-size:22px;font-weight:950;display:grid;place-items:center;padding:0;box-shadow:0 5px 18px rgba(0,0,0,.22);touch-action:manipulation}
        .tcInfoBtn:active{transform:scale(.96)}
        .tcInfoBlock{margin-top:12px;padding:12px 13px;border-radius:14px;background:#111920;border:1px solid #2c3945}
        .tcInfoBlock h3{font-size:14px;margin:0 0 7px;color:#fff}
        .tcInfoBlock p{font-size:12px;line-height:1.48;color:#c2ccd5;margin:0}
        .tcInfoBlock b{color:#fff}
        .tcInfoPlan{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
        .tcInfoPlan span{padding:5px 8px;border-radius:9px;background:#202a32;border:1px solid #35434f;color:#f6f7f8;font-size:11px;font-weight:850}
        #rest .rest{position:relative}
        #rest .tcInfoBtn{position:absolute;right:92px;top:12px}
      `;
document.head.appendChild(st);
}
try{
window.__tcOriginalMediaFor=window.__tcOriginalMediaFor||mediaFor;
mediaFor=function(){return''};
}catch(e){}
try{
window.__tcOriginalFocusText=window.__tcOriginalFocusText||focusText;
focusText=function(){return''};
}catch(e){}
function tcSessionFocus(s){
return ['Объём','Сила / техника','Интенсивность'][(+s||0)%3];
}
function tcExerciseConcept(e){
if(!e)return'Нагрузка подбирается по текущему уровню и месту упражнения в цикле.';
const m=modelFor(e);
if(m.engine==='pull')return'Основное тяговое движение. План строится от контрольного максимума и чередует объём, силовой акцент и более интенсивную работу.';
if(m.engine==='weighted')return'Силовая тяговая работа с дополнительным весом. Повторы держатся ниже максимума, чтобы сохранять качество и запас между подходами.';
if(m.engine==='core')return'Работа на кор. Цель — набирать качественный объём без бесконечного увеличения повторов; после освоения диапазона усложняется вариация.';
if(m.engine==='static')return'Статическая работа. Прогресс оценивается по времени качественного удержания, затем — по переходу к более сложной вариации.';
if(m.engine==='staticSkill')return'Статический элемент. Важнее качество положения тела и контроль, чем любой ценой продлевать удержание.';
if(m.engine==='skill')return'Сложный навык. Подходы намеренно короче отказных: приоритет — чистая техника и повторяемость движения.';
return'Базовое силовое движение. Объём и интенсивность меняются по трём тренировкам цикла, чтобы одна и та же нагрузка не повторялась постоянно.';
}
function tcPlanExplanation(e,s,plan){
const max=e?Math.max(1,+e.max||1):0;
const focus=tcSessionFocus(s);
const p=Array.isArray(plan)?plan:[];
const total=p.reduce((a,b)=>a+(+b||0),0);
let text='Текущая тренировка: <b>'+focus+'</b>. ';
if(max)text+='Последний контрольный максимум: <b>'+max+' '+unitShort(e)+'</b>. ';
if(p.length)text+='Назначено <b>'+p.length+' подхода</b>, суммарный план — <b>'+total+' '+unitShort(e)+'</b>. ';
text+='Подходы рассчитываются от текущего результата так, чтобы не превращать каждый сет в контрольный максимум. Цель — выполнить заданную работу технически стабильно и сохранить качество последующих подходов.';
return text;
}
function tcRestExplanation(e,s){
const base=e?restSeconds(e,s):null;
let text='Отдых не является фиксированным таймером для всех упражнений. ';
if(base!=null)text+='Для этого упражнения базовый ориентир сейчас — <b>'+base+' с</b>. ';
text+='После подхода приложение учитывает его относительную тяжесть и фактическое выполнение: при заметном недовыполнении даёт больше времени, при лёгком подходе может сократить восстановление. Переход между упражнениями рассчитывается отдельно.';
if(window.__tcLastRestNote)text+='<br><br><b>Последний расчёт:</b> '+window.__tcLastRestNote;
return text;
}
function tcConceptHtml(e,s,plan){
const hint=e?progressionHint(e):'';
return `
        <div class="sheettitle">О тренировке</div>
        <div class="sub" style="margin-top:5px">Здесь показана логика программы. На рабочем экране остаются только действия, нужные во время подхода.</div>
        <div class="tcInfoBlock"><h3>Концепция цикла</h3><p>Цикл состоит из <b>трёх тренировок</b> с разным акцентом: объём → сила / техника → интенсивность. После третьей тренировки идёт <b>контрольный максимум</b>. Новый результат становится исходной точкой следующего цикла. Конкретные числа подходов, повторов и отдыха рассчитывает TurnikCoach по текущему максимуму и типу упражнения.</p></div>
        <div class="tcInfoBlock"><h3>Текущее упражнение</h3><p><b>${e?e.name:'Тренировка'}</b><br>${tcExerciseConcept(e)}</p>${plan&&plan.length?'<div class="tcInfoPlan">'+plan.map(x=>'<span>'+x+'</span>').join('')+'</div>':''}</div>
        <div class="tcInfoBlock"><h3>Почему такой план</h3><p>${tcPlanExplanation(e,s,plan)}</p></div>
        <div class="tcInfoBlock"><h3>Почему такой отдых</h3><p>${tcRestExplanation(e,s)}</p></div>
        ${hint?'<div class="tcInfoBlock"><h3>Следующий шаг</h3><p>'+hint+'</p></div>':''}
        <button class="btn yellow full" style="margin-top:14px" onclick="closeSheet()">Понятно</button>
      `;
}
window.tcOpenTrainingInfo=function(){
let e=null,s=state.seq%3,plan=[];
if(W&&W.items&&W.items.length){
s=W.sessionIndex;
const item=W.items[W.exerciseIndex];
if(item){e=item.e;plan=item.plan||[]}
}else{
try{
const cur=currentSession();
s=cur.index;
if(cur.items&&cur.items[0]){e=cur.items[0].e;plan=cur.items[0].plan||[]}
}catch(err){}
}
const box=document.getElementById('sheetbox'),sheet=document.getElementById('sheet');
if(!box||!sheet)return;
box.innerHTML=tcConceptHtml(e,s,plan);
sheet.classList.add('open');
};
function tcRemoveTechnicalCopy(){
document.querySelectorAll('.exerciseModel').forEach(el=>el.remove());
document.querySelectorAll('.info').forEach(el=>{
const t=(el.textContent||'').trim();
if(t.includes('Нагрузка теперь рассчитывается не одной формулой')||
t.includes('Адаптивная схема:')||
t.includes('каждое упражнение рассчитывается своим движком')){
el.remove();
}
});
const hs=document.querySelector('#historyScreen .head .sub');
if(hs)hs.textContent='Тренировки, фактический объём и контрольные максимумы.';
const fb=document.getElementById('mediaFallback');
if(fb)fb.style.display='none';
const rw=document.getElementById('restWhy');
if(rw)rw.style.display='none';
}
function tcAddInfoButtons(){
const today=document.querySelector('#today.screen.on .todayCard .row.between');
if(today&&!today.querySelector('.tcInfoBtn')){
const b=document.createElement('button');b.type='button';b.className='tcInfoBtn';b.textContent='ⓘ';b.title='О тренировке';b.onclick=window.tcOpenTrainingInfo;today.appendChild(b);
}
const wh=document.querySelector('#workout.screen.on .stageHeader .row.between, #workout.screen.on .wtop .row.between');
if(wh&&!wh.querySelector('.tcInfoBtn')){
const end=wh.querySelector('.endBtn');
const b=document.createElement('button');b.type='button';b.className='tcInfoBtn';b.textContent='ⓘ';b.title='О тренировке';b.onclick=window.tcOpenTrainingInfo;
if(end)wh.insertBefore(b,end);else wh.appendChild(b);
}
const rest=document.querySelector('#rest.screen.on .rest');
if(rest&&!rest.querySelector('.tcInfoBtn')){
const b=document.createElement('button');b.type='button';b.className='tcInfoBtn';b.textContent='ⓘ';b.title='О тренировке';b.onclick=window.tcOpenTrainingInfo;rest.appendChild(b);
}
}
let tcDecorateQueued=false;
function tcDecorate(){
tcRemoveTechnicalCopy();
tcAddInfoButtons();
tcDecorateQueued=false;
}
function tcQueueDecorate(){
if(tcDecorateQueued)return;
tcDecorateQueued=true;
setTimeout(tcDecorate,0);
}
tcInjectProductStyles();
try{
const oldGo=window.go;
window.go=function(id){const r=oldGo(id);tcQueueDecorate();return r};
}catch(e){}
try{
const oldRender=window.render;
window.render=function(){const r=oldRender();tcQueueDecorate();return r};
}catch(e){}
const tcApp=document.getElementById('app');
if(tcApp){
const mo=new MutationObserver(tcQueueDecorate);
mo.observe(tcApp,{childList:true,subtree:true});
window.__tcProductObserver=mo;
}
try{render()}catch(e){tcQueueDecorate()}
tcQueueDecorate();
restReasonEl();
tcLoadCourseModule();
tcInstallUx2InformationArchitecture();
tcInstallNavigationFoundation();
tcInstallNavigationUpgrades();
tcInstallCompletionFlow();
tcInstallHapticFeedback();
tcInstallWorkoutCorrection();
tcInstallProgressSummary();
tcInstallWorkoutPersistence();
if(previousVersion!==VERSION)showRuntimeNotice('TurnikCoach обновлён до '+LABEL);
console.log('TurnikCoach hotfix active:',VERSION);
}
let approved=false;
try{approved=localStorage.getItem(APPROVED_KEY)===VERSION}catch(e){}
if(approved){
installUpdate();
}else{
const ask=()=>{if(window.__TC_UPDATE_DISMISSED_VERSION!==VERSION)showUpdatePrompt(installUpdate)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ask,{once:true});
else ask();
}
})();