/* TURNIKCOACH_HOTFIX 5.16.7-program-browser */
(function(){
  'use strict';
  const VERSION='5.16.7-program-browser';
  const LABEL='5.16.7';
  const APPROVED_KEY='tc_hotfix_approved_version';
  if(window.__TC_HOTFIX_VERSION===VERSION)return;

  function removeUpdatePrompt(){
    const p=document.getElementById('tcUpdatePrompt');
    if(p&&p.parentNode)p.parentNode.removeChild(p);
  }

  function showUpdatePrompt(activate){
    if(document.getElementById('tcUpdatePrompt'))return;
    const overlay=document.createElement('div');
    overlay.id='tcUpdatePrompt';
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:22px;box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
    const card=document.createElement('div');
    card.style.cssText='width:min(420px,100%);background:#10161d;color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:22px;box-shadow:0 18px 60px rgba(0,0,0,.5)';
    const title=document.createElement('div');
    title.style.cssText='font-size:22px;font-weight:800;margin-bottom:10px';
    title.textContent='Доступно обновление TurnikCoach '+LABEL;
    const text=document.createElement('div');
    text.style.cssText='font-size:15px;line-height:1.45;color:#cfd8e3;margin-bottom:18px';
    text.innerHTML='Добавлен просмотр всей программы курса Морозова: 7 уровней, все комплексы, упражнения, подходы, повторения, отдых и критерии перехода. Текущий уровень выделен. Просмотр не меняет настройки и не запускает тренировку.<br><br>Установить обновление сейчас?';
    const row=document.createElement('div');
    row.style.cssText='display:flex;gap:10px';
    const later=document.createElement('button');
    later.type='button';
    later.textContent='Позже';
    later.style.cssText='flex:1;border:0;border-radius:12px;padding:14px 12px;background:#27313c;color:#fff;font-size:16px;font-weight:700';
    const yes=document.createElement('button');
    yes.type='button';
    yes.textContent='Обновить';
    yes.style.cssText='flex:1;border:0;border-radius:12px;padding:14px 12px;background:#ffc400;color:#111;font-size:16px;font-weight:800';
    later.onclick=()=>{window.__TC_UPDATE_DISMISSED_VERSION=VERSION;removeUpdatePrompt()};
    yes.onclick=()=>{try{localStorage.setItem(APPROVED_KEY,VERSION)}catch(e){};removeUpdatePrompt();activate()};
    row.appendChild(later);row.appendChild(yes);
    card.appendChild(title);card.appendChild(text);card.appendChild(row);overlay.appendChild(card);
    document.body.appendChild(overlay);
  }


  const COURSE_MODULE_BUNDLED="/* TURNIKCOACH_COURSE 1.0.6-program-browser */\n(function(){\n  'use strict';\n  const COURSE_MODULE_VERSION='1.0.6-program-browser';\n  if(window.__TC_COURSE_MODULE_VERSION===COURSE_MODULE_VERSION)return;\n  window.__TC_COURSE_MODULE_VERSION=COURSE_MODULE_VERSION;\n  function tcClamp(v,a,b){return Math.max(a,Math.min(b,v))}\n  function tcPrimeAudio(){try{if(typeof unlockAudio==='function')unlockAudio()}catch(e){}}\n  function tcFinishSignal(){try{if(typeof beep==='function'){beep(620,.18,.42);setTimeout(()=>beep(880,.26,.46),200)}}catch(e){}}\n  function tcQueueDecorate(){setTimeout(()=>{},0)}\n    // ---------- Morozov pull-up course (source-driven module) ----------\n    const TC_COURSE_KEY='tc_morozov_course_v1';\n    const TC_PULL_CONFLICT_IDS=new Set(['pull','chin','bandPull','weightedPull','oneArmPull']);\n    const TC_PULL_HEAVY_IDS=new Set(['pull','chin','bandPull','weightedPull','oneArmPull','muscleUp','frontLever','backLever']);\n\n    const TC_COURSE={\n      1:{\n        title:'Начинающие',\n        entry:'0–1 обычное подтягивание или 0–8 подтягиваний с резиной',\n        frequency:'4 тренировки в неделю; чередовать комплексы №1 и №2',\n        sequence:[1,2,1,2],\n        mastery:'8 подтягиваний с резиной минимального натяжения',\n        complexes:{\n          1:{name:'Комплекс №1',purpose:'Общая силовая подготовка тяговых мышц и освоение правильного движения.',items:[\n            {id:'c_band',name:'Подтягивания с резиной',metric:'reps',sets:3,scheme:{type:'fixed',value:8},rest:{type:'fixed',sec:60},tip:'Используй такую помощь резины, чтобы сохранять правильную технику.'},\n            {id:'c_australian',name:'Австралийские подтягивания',metric:'reps',sets:3,scheme:{type:'fixed',value:12},rest:{type:'fixed',sec:60}},\n            {id:'c_band_row',name:'Тяга резины',metric:'reps',sets:2,scheme:{type:'fixed',value:15},rest:{type:'fixed',sec:60}},\n            {id:'c_bent_hold',name:'Вис на согнутых руках',metric:'time',sets:3,scheme:{type:'max'},rest:{type:'fixed',sec:60}}\n          ]},\n          2:{name:'Комплекс №2',purpose:'Техника, удержание и контролируемая эксцентрическая работа.',items:[\n            {id:'c_active_hang',name:'Активный вис',metric:'time',sets:3,scheme:{type:'max'},rest:{type:'fixed',sec:60}},\n            {id:'c_chair_pull',name:'Подтягивания с ногами на стуле',metric:'reps',sets:3,scheme:{type:'fixed',value:12},rest:{type:'fixed',sec:60}},\n            {id:'c_aus_biceps',name:'Тяга на бицепс в австралийском мосту',metric:'reps',sets:2,scheme:{type:'fixed',value:8},rest:{type:'fixed',sec:60}},\n            {id:'c_slow_negative',name:'Медленный негатив',metric:'reps',sets:5,scheme:{type:'timed',value:2,label:'2 · 20 сек'},rest:{type:'fixed',sec:60},tip:'Два медленных негативных повторения; курс указывает 20 секунд.'}\n          ]}\n        }\n      },\n      2:{\n        title:'Второй уровень',\n        entry:'До 4 обычных подтягиваний или более 6 подтягиваний с резиной',\n        frequency:'2–4 тренировки в неделю по индивидуальным ощущениям',\n        sequence:[1],\n        mastery:'8 подтягиваний средним хватом',\n        complexes:{\n          1:{name:'Комплекс №1',purpose:'Более направленная работа на чёткие подтягивания; объём ниже, интенсивность выше.',items:[\n            {id:'c_classic_max',name:'Классические подтягивания',metric:'reps',sets:3,scheme:{type:'max',ref:'pull'},rest:{type:'range',min:60,max:180},tip:'В этом уровне автор ставит задачу выполнять чёткие 2–4 подтягивания без технических ошибок.'},\n            {id:'c_shrug',name:'Шраги на турнике',metric:'reps',sets:3,scheme:{type:'fixed',value:12},rest:{type:'range',min:60,max:180},tip:'Шраги развивают мышцы, опускающие плечо, ротаторы плеча и при большей амплитуде трапеции.'},\n            {id:'c_half_pull',name:'Полуамплитудные подтягивания',metric:'reps',sets:3,scheme:{type:'fixed',value:8},rest:{type:'range',min:60,max:180}},\n            {id:'c_pause_negative',name:'Негатив с паузами',metric:'reps',sets:3,scheme:{type:'timed',value:3,label:'3 · паузы 5 сек'},rest:{type:'range',min:60,max:180}},\n            {id:'c_chin_max',name:'Подтягивания нижним хватом',metric:'reps',sets:3,scheme:{type:'max'},rest:{type:'range',min:60,max:180},tip:'Нижний хват немного сильнее переносит нагрузку на бицепс; распределение нагрузки зависит от техники.'}\n          ]}\n        }\n      },\n      3:{\n        title:'Третий уровень',\n        entry:'4–15 подтягиваний или более 6 широким хватом с резиной',\n        frequency:'Комплекс №1 — 3 раза в неделю; комплекс №2 — 1 раз в неделю или раз в 10 дней',\n        sequence:[1,1,1,2],\n        mastery:'15–20 классических подтягиваний и 6 подтягиваний широким хватом',\n        supplement:'10 подходов по 80% от максимума в дни без основной тренировки; пропускать в дни основной тренировки; раз в месяц отдых от этой дополнительной работы не менее 5 дней.',\n        complexes:{\n          1:{name:'Комплекс №1',purpose:'Рост количества подтягиваний через сочетание высокой и умеренной относительной нагрузки.',items:[\n            {id:'c_pull80',name:'Классические подтягивания',metric:'reps',sets:3,scheme:{type:'percent',pct:.8,ref:'pull'},rest:{type:'fixed',sec:180}},\n            {id:'c_wide_band_max',name:'Широкие подтягивания с резиной',metric:'reps',sets:1,scheme:{type:'max'},rest:{type:'range',min:60,max:180}},\n            {id:'c_pull50',name:'Классические подтягивания',metric:'reps',sets:6,scheme:{type:'percent',pct:.5,ref:'pull'},rest:{type:'manual',label:'минимальный'}},\n            {id:'c_negative_pause_max',name:'Негатив с паузами',metric:'time',sets:3,scheme:{type:'max',label:'MAX · максимальная пауза'},rest:{type:'manual',label:'минимальный'}}\n          ]},\n          2:{name:'Комплекс №2',purpose:'Дополнительная взрывная и асимметричная работа.',items:[\n            {id:'c_chicken_wings',name:'Куриные крылья',metric:'reps',sets:2,scheme:{type:'fixed',value:10},rest:{type:'fixed',sec:180}},\n            {id:'c_plyo80',name:'Плиометрические подтягивания',metric:'reps',sets:3,scheme:{type:'percent',pct:.8},rest:{type:'fixed',sec:180},tip:'Высокие и плиометрические подтягивания используются для развития взрывной силы.'},\n            {id:'c_asym80',name:'Асимметричные подтягивания',metric:'reps_side',sets:3,scheme:{type:'percent',pct:.8,label:'80% MAX'},rest:{type:'fixed',sec:180},tip:'Асимметричные подтягивания увеличивают нагрузку на тянущую сторону; вспомогательная сторона стабилизирует движение.'}\n          ]}\n        }\n      },\n      4:{\n        title:'Четвёртый уровень',\n        entry:'15–25 подтягиваний; дальнейшая специализация по цели',\n        frequency:'По цели: комплекс №1 — 2–4 раза/нед.; №2 — 3–4; №3 — 3–5',\n        mastery:'5 асимметричных подтягиваний на каждую руку и 1 подтягивание выше груди',\n        supplement:'10 подходов по 80% от максимума в дни без основной тренировки; пропускать в дни основной тренировки; раз в месяц отдых от этой дополнительной работы не менее 5 дней.',\n        complexes:{\n          1:{name:'Комплекс №1 · выход силой',goal:'muscleup',purpose:'Подготовка к выходу силой.',items:[\n            {id:'c_plyo35',name:'Плиометрические подтягивания',metric:'reps',sets:5,scheme:{type:'range_reps',min:3,max:5,label:'3–5'},rest:{type:'range',min:120,max:240}},\n            {id:'c_wide80',name:'Подтягивания широким хватом',metric:'reps',sets:3,scheme:{type:'percent',pct:.8,label:'80% MAX'},rest:{type:'range',min:120,max:240}},\n            {id:'c_iguana',name:'Хват игуаны · тяга к плечу на полусогнутых',metric:'reps',sets:3,scheme:{type:'fixed',value:8},rest:{type:'range',min:120,max:240}}\n          ]},\n          2:{name:'Комплекс №2 · одна рука',goal:'onearm',purpose:'Подготовка к подтягиванию на одной руке.',items:[\n            {id:'c_asym_max',name:'Асимметричные подтягивания',metric:'reps_side',sets:2,scheme:{type:'max'},rest:{type:'range',min:120,max:240},tip:'Асимметричная работа повышает нагрузку на тянущую сторону.'},\n            {id:'c_onearm_active_hang',name:'Активный вис на одной руке',metric:'time_side',sets:3,scheme:{type:'max'},rest:{type:'range',min:120,max:240}},\n            {id:'c_regrip_bent',name:'Перехваты в висе на полусогнутых',metric:'reps',sets:3,scheme:{type:'max'},rest:{type:'range',min:120,max:240}}\n          ]},\n          3:{name:'Комплекс №3 · количество',goal:'quantity',purpose:'Развитие выносливости и увеличение общего количества подтягиваний.',items:[\n            {id:'c_pull80_l4',name:'Классические подтягивания',metric:'reps',sets:3,scheme:{type:'percent',pct:.8,ref:'pull'},rest:{type:'range',min:120,max:240}},\n            {id:'c_wide_max_l4',name:'Подтягивания широким хватом',metric:'reps',sets:2,scheme:{type:'max'},rest:{type:'range',min:120,max:240}},\n            {id:'c_weighted3',name:'Подтягивания с дополнительным весом',metric:'weighted',sets:4,scheme:{type:'fixed',value:3,label:'3 · максимальный рабочий вес'},rest:{type:'range',min:120,max:240}}\n          ]}\n        }\n      },\n      5:{\n        title:'Пятый уровень',entry:'Продвинутая специализация после четвёртого уровня',frequency:'Комплекс выбирается по цели; в курсе указано 2–4 тренировки в неделю',sequence:[1],mastery:'Дополнительный вес в подтягивании — 60–70% собственного веса тела',\n        complexes:{\n          1:{name:'Комплекс №1 · выход силой',goal:'muscleup',purpose:'Скоростно-силовая работа для выхода силой.',items:[\n            {id:'c_high_max',name:'Высокие подтягивания',metric:'reps',sets:3,scheme:{type:'max'},rest:{type:'range',min:180,max:300},tip:'Высокие подтягивания развивают взрывную силу.'},\n            {id:'c_three_stage50',name:'Трёхстадийные подтягивания',metric:'reps',sets:6,scheme:{type:'percent',pct:.5,label:'50% MAX'},rest:{type:'range',min:180,max:300},tip:'Разделение движения на фазы развивает нейромышечный контроль каждой части амплитуды.'},\n            {id:'c_power_crow',name:'Силовая каркуша',metric:'reps',sets:3,scheme:{type:'max'},rest:{type:'range',min:180,max:300}}\n          ]},\n          2:{name:'Комплекс №2 · одна рука / силовая база',goal:'onearm',purpose:'Односторонняя силовая работа и тяжёлые подтягивания.',items:[\n            {id:'c_full_asym2',name:'Асимметричные подтягивания полные',metric:'reps_side',sets:2,scheme:{type:'fixed',value:2},rest:{type:'range',min:180,max:300}},\n            {id:'c_onearm_bent_hold',name:'Вис на одной полусогнутой руке',metric:'time_side',sets:3,scheme:{type:'max'},rest:{type:'range',min:180,max:300}},\n            {id:'c_typewriter',name:'Печатная машинка',metric:'reps',sets:2,scheme:{type:'max'},rest:{type:'range',min:180,max:300}},\n            {id:'c_weighted3_l5',name:'Подтягивания с дополнительным весом',metric:'weighted',sets:5,scheme:{type:'fixed',value:3,label:'3 · максимальный рабочий вес'},rest:{type:'range',min:180,max:300}}\n          ]}\n        }\n      },\n      6:{\n        title:'Шестой уровень',entry:'Следующая ступень специальной силовой работы',frequency:'Комплекс №1 — 2–4 раза/нед.; комплекс №2 — вспомогательная силовая работа, примерно раз в 10 дней',sequence:[1,1,1,2],mastery:'В PDF отдельный тест перехода после шестого уровня не указан.',\n        complexes:{\n          1:{name:'Комплекс №1',purpose:'Продвинутая односторонняя тяговая работа.',items:[\n            {id:'c_onearm_negative',name:'Негативы на одной руке с подтягиванием в нейтральном хвате',metric:'reps_side',sets:3,scheme:{type:'timed',value:6,label:'6 · 10 сек'},rest:{type:'range',min:180,max:300}},\n            {id:'c_jump_onearm',name:'Подтягивания с прыжка на низком турнике',metric:'reps_side',sets:3,scheme:{type:'fixed',value:4},rest:{type:'range',min:180,max:300}},\n            {id:'c_band_onearm',name:'Подтягивания с резиной средней тяги',metric:'reps_side',sets:2,scheme:{type:'max'},rest:{type:'range',min:180,max:300}}\n          ]},\n          2:{name:'Комплекс №2',purpose:'Вспомогательная силовая работа.',items:[\n            {id:'c_towel_hang',name:'Вис на полотенце одной рукой',metric:'time_side',sets:3,scheme:{type:'max'},rest:{type:'range',min:180,max:300}},\n            {id:'c_weighted23',name:'Подтягивания с дополнительным весом',metric:'weighted',sets:4,scheme:{type:'range_reps',min:2,max:3,label:'2–3 · максимальный вес'},rest:{type:'range',min:180,max:300}}\n          ]}\n        }\n      },\n      7:{\n        title:'Седьмой уровень',entry:'Прогрессия подтягивания на одной руке / дальнейшая работа на выход силой',frequency:'Комплекс №1 — 3 раза/нед. для одной руки; комплекс №2 — 3 раза/нед. для выхода силой в одно движение',sequence:[1],mastery:'В PDF отдельный финальный тест не указан.',\n        complexes:{\n          1:{name:'Комплекс №1 · одна рука',goal:'onearm',purpose:'Прогрессия подтягивания на одной руке.',items:[\n            {id:'c_onearm_progression',name:'Прогрессия подтягивания на одной руке',metric:'reps_side',sets:4,scheme:{type:'max'},rest:{type:'manual',label:'по усмотрению'}},\n            {id:'c_l6_choice1',name:'Упражнение на выбор из 6 уровня',metric:'reps',sets:1,scheme:{type:'choice',label:'любой комплекс'},rest:{type:'manual',label:'по усмотрению'}},\n            {id:'c_l6_choice2',name:'Упражнение на выбор из 6 уровня',metric:'reps',sets:1,scheme:{type:'choice',label:'любой комплекс'},rest:{type:'manual',label:'по усмотрению'}}\n          ]},\n          2:{name:'Комплекс №2 · выход силой',goal:'muscleup',purpose:'Дальнейшая работа на выход силой в одно движение.',items:[\n            {id:'c_onearm_progression_mu',name:'Прогрессия подтягивания на одной руке',metric:'reps_side',sets:4,scheme:{type:'max'},rest:{type:'manual',label:'по усмотрению'}},\n            {id:'c_l5_choice1',name:'Упражнение на выбор из 5 уровня · комплекс №1',metric:'reps',sets:1,scheme:{type:'choice',label:'на выбор'},rest:{type:'manual',label:'по усмотрению'}},\n            {id:'c_l5_choice2',name:'Упражнение на выбор из 5 уровня · комплекс №1',metric:'reps',sets:1,scheme:{type:'choice',label:'на выбор'},rest:{type:'manual',label:'по усмотрению'}}\n          ]}\n        }\n      }\n    };\n\n    function tcCourseDefault(){\n      const pull=state.ex.find(e=>e.id==='pull');\n      const weighted=state.ex.find(e=>e.id==='weightedPull');\n      const m=Math.max(1,+((pull&&pull.max)||1));\n      return{enabled:false,level:m<=1?1:m<=3?2:m<=14?3:4,goal:'quantity',pullMax:m,weightedLoad:+((weighted&&weighted.load)||0),courseSeq:0,extraSeq:0,lastCourseDate:'',lastCourseTs:0,authorSupplement:false,history:[],tests:[]};\n    }\n    function tcLoadCourse(){\n      let c=tcCourseDefault();\n      try{const raw=JSON.parse(localStorage.getItem(TC_COURSE_KEY)||'null');if(raw&&typeof raw==='object')c={...c,...raw}}catch(e){}\n      c.level=tcClamp(Math.floor(+c.level||1),1,7);c.pullMax=Math.max(1,Math.floor(+c.pullMax||1));c.weightedLoad=Math.max(0,+c.weightedLoad||0);c.courseSeq=Math.max(0,Math.floor(+c.courseSeq||0));c.extraSeq=Math.max(0,Math.floor(+c.extraSeq||0));c.history=Array.isArray(c.history)?c.history:[];c.tests=Array.isArray(c.tests)?c.tests:[];\n      return c;\n    }\n    let TC_course=tcLoadCourse();\n    function tcSaveCourse(){try{localStorage.setItem(TC_COURSE_KEY,JSON.stringify(TC_course));return true}catch(e){console.error('course save',e);return false}}\n    function tcCourseLevel(){return TC_COURSE[TC_course.level]||TC_COURSE[1]}\n    function tcCourseGoalName(g){return g==='muscleup'?'Выход силой':g==='onearm'?'Подтягивание на одной руке':'Количество подтягиваний'}\n    function tcGoalOptions(level){if(level<=3)return[['quantity','Количество подтягиваний']];if(level===4)return[['quantity','Количество подтягиваний'],['muscleup','Выход силой'],['onearm','Подтягивание на одной руке']];return[['muscleup','Выход силой'],['onearm','Подтягивание на одной руке']]}\n    function tcNormalizeGoal(){const a=tcGoalOptions(TC_course.level).map(x=>x[0]);if(!a.includes(TC_course.goal))TC_course.goal=a[0]}\n    function tcCourseComplexNo(){\n      const l=tcCourseLevel(),ids=Object.keys(l.complexes).map(Number);\n      if(TC_course.level===4){if(TC_course.goal==='muscleup')return 1;if(TC_course.goal==='onearm')return 2;const seq=[3,3,3,1,3,3,3,2];return seq[TC_course.courseSeq%seq.length]}\n      if(TC_course.level===5){return TC_course.goal==='onearm'?2:1}\n      if(TC_course.level===7){return TC_course.goal==='muscleup'?2:1}\n      const seq=l.sequence&&l.sequence.length?l.sequence:ids;\n      return seq[TC_course.courseSeq%seq.length]||ids[0]||1;\n    }\n    function tcCourseComplex(){const no=tcCourseComplexNo();return{no,def:tcCourseLevel().complexes[no]}}\n    function tcDayDiff(a,b){if(!a||!b)return 999;const x=new Date(a+'T12:00:00'),y=new Date(b+'T12:00:00');return Math.round((y-x)/86400000)}\n    function tcCourseDue(){if(!TC_course.lastCourseDate)return true;return tcDayDiff(TC_course.lastCourseDate,dateKey())>=2}\n    function tcExtraExercises(){return selected().filter(e=>!TC_PULL_HEAVY_IDS.has(e.id)&&e.g!=='Турник'&&e.g!=='Элементы')}\n    function tcConflictExercises(){return selected().filter(e=>TC_PULL_HEAVY_IDS.has(e.id)||e.g==='Турник'||e.g==='Элементы')}\n    function tcUnitForMetric(m){return m==='time'||m==='time_side'?'сек.':m==='reps_side'?'повт./стор.':m==='weighted'?'повт.':'повт.'}\n    function tcItemLoad(def){return def.metric==='weighted'?TC_course.weightedLoad:0}\n    function tcLastActualFor(id){for(const h of TC_course.history){const d=(h.details||[]).find(x=>x.id===id);if(d&&Array.isArray(d.actual)){for(let i=d.actual.length-1;i>=0;i--)if(Number.isFinite(+d.actual[i])&&+d.actual[i]>0)return +d.actual[i]}}return null}\n    function tcSchemeLabel(def){\n      const s=def.scheme||{};\n      if(s.label)return s.label;\n      if(s.type==='fixed')return String(s.value);\n      if(s.type==='max')return 'MAX';\n      if(s.type==='percent')return Math.round((s.pct||0)*100)+'% MAX';\n      if(s.type==='range_reps')return s.min+'–'+s.max;\n      if(s.type==='timed')return String(s.value);\n      if(s.type==='choice')return 'НА ВЫБОР';\n      return '—';\n    }\n    function tcSchemeTarget(def){\n      const s=def.scheme||{};\n      if(s.type==='fixed'||s.type==='timed')return Math.max(0,+s.value||0);\n      if(s.type==='percent'&&s.ref==='pull')return Math.max(1,Math.floor(TC_course.pullMax*(+s.pct||0)));\n      if(s.type==='range_reps')return Math.max(1,+s.min||1);\n      if(s.type==='max'&&s.ref==='pull')return TC_course.pullMax;\n      return tcLastActualFor(def.id)||1;\n    }\n    function tcDisplayScheme(def){\n      const s=def.scheme||{};\n      if(s.type==='percent'&&s.ref==='pull')return tcSchemeTarget(def)+' · '+Math.round(s.pct*100)+'% от '+TC_course.pullMax;\n      return tcSchemeLabel(def);\n    }\n    function tcBuildCourseItems(){\n      const c=tcCourseComplex();if(!c.def)return[];\n      return c.def.items.map(def=>{\n        const target=tcSchemeTarget(def),labels=Array.from({length:def.sets},()=>tcDisplayScheme(def));\n        const e={id:def.id,name:def.name,metric:def.metric||'reps',max:TC_course.pullMax,load:tcItemLoad(def),courseDef:def};\n        return{e,def,plan:Array.from({length:def.sets},()=>target),planLabels:labels,actual:[]};\n      });\n    }\n    function tcBuildExtraItems(){const idx=TC_course.extraSeq%3;return tcExtraExercises().map(e=>({e,plan:pres(e,idx),actual:[]}))}\n    function tcCourseRestText(r){if(!r)return'—';if(r.type==='fixed')return Math.round(r.sec/60)+' мин';if(r.type==='range')return Math.round(r.min/60)+'–'+Math.round(r.max/60)+' мин';return r.label||'по усмотрению'}\n    function tcAdaptiveCourseRest(def,target,actual,skipped){\n      const r=def.rest||{type:'manual',label:'по усмотрению'};\n      if(r.type==='fixed')return{manual:false,seconds:r.sec,note:'По курсу: '+tcCourseRestText(r)};\n      if(r.type==='manual')return{manual:true,label:r.label||'по усмотрению',note:'По курсу: '+(r.label||'по усмотрению')};\n      let sec=Math.round((r.min+r.max)/2/15)*15;\n      const st=def.scheme||{};\n      if(st.type==='max')sec=r.max;\n      else if(skipped)sec=r.max;\n      else if(target>0&&Number.isFinite(+actual)){\n        const ratio=(+actual||0)/target;if(ratio<.9)sec=r.max;else if(ratio>1.2)sec=r.min;\n      }\n      sec=tcClamp(sec,r.min,r.max);\n      return{manual:false,seconds:sec,note:'Диапазон курса '+tcCourseRestText(r)+' · TurnikCoach выбрал '+Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')};\n    }\n\n    function tcCourseCardHtml(){\n      const l=tcCourseLevel(),c=tcCourseComplex(),enabled=TC_course.enabled;\n      return '<div class=\"card\" id=\"tcCourseCard\" style=\"margin-bottom:12px;border-color:'+(enabled?'#ffd84d':'#2c3945')+'\">'+\n        '<div class=\"row between\"><div class=\"grow\"><div class=\"k\">ПРОГРАММА</div><div class=\"strong\" style=\"font-size:18px;margin-top:3px\">Курс Морозова</div><div class=\"meta\">«Подтягивания с нуля до киборга»</div></div><span class=\"tag '+(enabled?'':'stage4')+'\">'+(enabled?'ВКЛЮЧЁН':'ВЫКЛЮЧЕН')+'</span></div>'+\n        (enabled?'<div class=\"tcInfoBlock\"><h3>'+l.title+'</h3><p><b>Цель:</b> '+tcCourseGoalName(TC_course.goal)+'<br><b>Следующий:</b> '+(c.def?c.def.name:'—')+'<br><b>Текущий максимум:</b> '+TC_course.pullMax+'<br><b>Частота по курсу:</b> '+l.frequency+'</p></div>':'<div class=\"sub\" style=\"margin-top:10px\">Отдельная система тренировок: уровни, комплексы, проценты, MAX, отдых и контрольные критерии берутся из курса. Остальные упражнения TurnikCoach можно использовать отдельно.</div>')+\n        '<button class=\"btn yellow full\" style=\"margin-top:12px\" onclick=\"tcOpenCourseProgram()\">Программа курса</button>'+ '<button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"tcOpenCourseSettings()\">'+(enabled?'Настройки курса':'Подключить курс')+'</button></div>';\n    }\n    window.tcOpenCourseSettings=function(){\n      tcNormalizeGoal();const l=tcCourseLevel(),goals=tcGoalOptions(TC_course.level);\n      const box=q('sheetbox');\n      box.innerHTML='<div class=\"sheettitle\">Курс Морозова</div><div class=\"sub\" style=\"margin-top:6px\">Курс работает отдельным блоком. Обычный каталог остаётся для пресса, ног, отжиманий и другой дополнительной работы.</div>'+\n      '<div class=\"tcInfoBlock\"><h3>Состояние</h3><p><label style=\"display:flex;gap:9px;align-items:center\"><input id=\"tcCourseEnabled\" type=\"checkbox\" '+(TC_course.enabled?'checked':'')+'> Включить курс Морозова</label></p></div>'+\n      '<div class=\"tcInfoBlock\"><h3>Уровень</h3><p><select id=\"tcCourseLevel\" style=\"width:100%;margin-top:4px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px\">'+Object.keys(TC_COURSE).map(n=>'<option value=\"'+n+'\" '+(+n===TC_course.level?'selected':'')+'>'+n+' · '+TC_COURSE[n].title+'</option>').join('')+'</select></p></div>'+\n      '<div class=\"tcInfoBlock\"><h3>Текущий максимум</h3><p><input id=\"tcCourseMax\" type=\"number\" min=\"1\" value=\"'+TC_course.pullMax+'\" style=\"width:100%;box-sizing:border-box;margin-top:4px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px\"></p></div>'+\n      '<div class=\"tcInfoBlock\"><h3>Цель</h3><p><select id=\"tcCourseGoal\" style=\"width:100%;margin-top:4px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px\">'+goals.map(g=>'<option value=\"'+g[0]+'\" '+(g[0]===TC_course.goal?'selected':'')+'>'+g[1]+'</option>').join('')+'</select></p></div>'+\n      '<div class=\"tcInfoBlock\"><h3>Дополнительный вес</h3><p>Используется в комплексах, где курс назначает тяжёлые подтягивания с весом.<input id=\"tcCourseLoad\" type=\"number\" min=\"0\" step=\"0.5\" value=\"'+TC_course.weightedLoad+'\" style=\"width:100%;box-sizing:border-box;margin-top:7px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px\"></p></div>'+\n      (l.supplement?'<div class=\"tcInfoBlock\"><h3>Дополнительные подтягивания по курсу</h3><p><label style=\"display:flex;gap:9px;align-items:flex-start\"><input id=\"tcCourseSupplement\" type=\"checkbox\" '+(TC_course.authorSupplement?'checked':'')+'><span>'+l.supplement+'</span></label></p></div>':'')+\n      '<div class=\"tcInfoBlock\"><h3>Критерий освоения уровня</h3><p>'+l.mastery+'</p></div>'+\n      '<button class=\"btn yellow full\" style=\"margin-top:14px\" onclick=\"tcSaveCourseSettings()\">Сохранить</button><button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"closeSheet()\">Отмена</button>';\n      q('sheet').classList.add('open');\n      const levelEl=document.getElementById('tcCourseLevel');if(levelEl)levelEl.onchange=()=>{TC_course.level=tcClamp(+levelEl.value||1,1,7);tcNormalizeGoal();tcSaveCourse();closeSheet();tcOpenCourseSettings()};\n    };\n    window.tcSaveCourseSettings=function(){\n      const enabled=document.getElementById('tcCourseEnabled'),level=document.getElementById('tcCourseLevel'),mx=document.getElementById('tcCourseMax'),goal=document.getElementById('tcCourseGoal'),load=document.getElementById('tcCourseLoad'),sup=document.getElementById('tcCourseSupplement');\n      TC_course.enabled=!!(enabled&&enabled.checked);TC_course.level=tcClamp(+(level&&level.value)||TC_course.level,1,7);TC_course.pullMax=Math.max(1,Math.floor(+(mx&&mx.value)||TC_course.pullMax));TC_course.goal=(goal&&goal.value)||TC_course.goal;TC_course.weightedLoad=Math.max(0,+(load&&load.value)||0);if(sup)TC_course.authorSupplement=!!sup.checked;tcNormalizeGoal();\n      if(TC_course.enabled){state.ex.forEach(e=>{if(TC_PULL_CONFLICT_IDS.has(e.id)){e.sel=false;e.main=false}})}\n      const pull=state.ex.find(e=>e.id==='pull');if(pull)pull.max=TC_course.pullMax;const wp=state.ex.find(e=>e.id==='weightedPull');if(wp)wp.load=TC_course.weightedLoad;\n      tcSaveCourse();save();closeSheet();render();\n    };\n\n    function tcInjectCourseUiStyles(){\n      if(document.getElementById('tcCourseUiStyles'))return;\n      const st=document.createElement('style');st.id='tcCourseUiStyles';\n      st.textContent=\"#sheet.open{overflow:hidden!important}#sheet .sheetbox{max-height:min(88dvh,calc(100vh - 22px))!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding-bottom:max(28px,calc(18px + env(safe-area-inset-bottom)))!important}#sheet .sheetbox::-webkit-scrollbar{width:4px}#sheet .sheetbox::-webkit-scrollbar-thumb{background:#475563;border-radius:999px}.tcExtrasDetails{margin:10px 0 16px;border:1px solid #2e3945;border-radius:16px;background:#111820;overflow:hidden}.tcExtrasSummary{list-style:none;display:flex;align-items:center;gap:9px;padding:14px;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent}.tcExtrasSummary::-webkit-details-marker{display:none}.tcExtrasTri{display:inline-block;font-size:15px;color:#ffd84d;transition:transform .16s ease;transform:rotate(0deg)}.tcExtrasDetails[open] .tcExtrasTri{transform:rotate(90deg)}.tcExtrasSummaryText{flex:1;min-width:0}.tcExtrasSummaryTitle{font-weight:900;font-size:15px;color:#fff}.tcExtrasSummaryMeta{font-size:11px;color:#939eac;margin-top:2px}.tcExtrasBody{padding:0 10px 10px}.tcExtrasBody>.card,.tcExtrasBody>.catalogGroup{margin-top:8px}#workout #wplan.tcCoursePlan{min-width:118px;text-align:right;line-height:1.1}#workout #wplan.tcCoursePlan .tcPlanMain{display:block;color:#ffd84d;font-size:23px;font-weight:950;white-space:nowrap;letter-spacing:.02em}#workout #wplan.tcCoursePlan .tcPlanSub{display:block;color:#9aa6b2;font-size:11px;font-weight:700;margin-top:5px;white-space:nowrap}#workout #wplan.tcCoursePlan .tcPlanSide{display:block;color:#c9d1d9;font-size:10px;font-weight:700;margin-top:3px;white-space:nowrap}\";\n      document.head.appendChild(st);\n    }\n\n    function tcCollapseExtraCatalog(host){\n      if(!TC_course.enabled||!host)return;\n      if(document.getElementById('tcExtrasDetails'))return;\n      const selectedExtra=tcExtraExercises().length;\n      const details=document.createElement('details');details.id='tcExtrasDetails';details.className='tcExtrasDetails';details.open=!!window.__tcExtrasOpen;\n      const summary=document.createElement('summary');summary.className='tcExtrasSummary';\n      summary.innerHTML='<span class=\"tcExtrasTri\">▶</span><div class=\"tcExtrasSummaryText\"><div class=\"tcExtrasSummaryTitle\">Дополнительные упражнения TurnikCoach</div><div class=\"tcExtrasSummaryMeta\">'+(selectedExtra?('Выбрано: '+selectedExtra):'Свернуто · нажми, чтобы выбрать пресс, ноги, отжимания и другое')+'</div></div>';\n      const body=document.createElement('div');body.className='tcExtrasBody';\n      [...host.children].forEach(node=>{if(node.id!=='tcCourseCard')body.appendChild(node)});\n      details.appendChild(summary);details.appendChild(body);details.addEventListener('toggle',()=>{window.__tcExtrasOpen=details.open});host.appendChild(details);\n    }\n\n    function tcDecorateCourseCatalog(){\n      const host=q('exerciseList');if(!host)return;\n      const old=document.getElementById('tcCourseCard');if(old)old.remove();\n      const oldDetails=document.getElementById('tcExtrasDetails');\n      if(oldDetails&&oldDetails.parentNode===host){const body=oldDetails.querySelector('.tcExtrasBody');if(body){[...body.children].forEach(n=>host.appendChild(n))}oldDetails.remove()}\n      host.insertAdjacentHTML('afterbegin',tcCourseCardHtml());\n      const head=document.querySelector('#exercise .head .sub');if(head)head.textContent=TC_course.enabled?'Подтягивания ведёт отдельный курс Морозова. Дополнительные упражнения ниже свернуты и не вмешиваются в структуру курса.':'Можно использовать обычный конструктор либо подключить отдельный курс Морозова для подтягиваний.';\n      if(TC_course.enabled){\n        host.querySelectorAll('.catalogGroup').forEach(g=>{const name=g.querySelector('.catalogHead .strong');if(name&&(name.textContent||'').trim()==='Турник')g.style.display='none'});\n        const summary=host.querySelector('.catalogSummary .meta');if(summary)summary.textContent='Дополнительные упражнения TurnikCoach. Тяговая часть курса рассчитывается отдельно.';\n        tcCollapseExtraCatalog(host);\n      }\n    }\n\n    function tcCourseRowsHtml(items){\n      return items.map(x=>{\n        const seq=Array.from({length:x.plan.length},()=>tcPlanToken(x.def,x)).join('  ');\n        const load=x.e.load?'<span class=\"meta\" style=\"white-space:nowrap\">+'+x.e.load+' кг</span>':'';\n        return '<div class=\"planrow\"><div class=\"grow\"><div class=\"strong\" style=\"font-size:15px\">'+x.e.name+'</div>'+load+'</div><div class=\"r sets\" style=\"white-space:nowrap\">'+seq+'</div></div>';\n      }).join('');\n    }\n\n    function tcExtraRowsHtml(items){return items.map(x=>'<div class=\"planrow\"><div><div class=\"strong\" style=\"font-size:15px\">'+x.e.name+'</div><div class=\"meta\">Дополнительное упражнение · '+metricTitle(x.e)+'</div></div><div class=\"r sets\">'+x.plan.join(' · ')+'</div></div>').join('')}\n    function tcSupplementHtml(){\n      if(!TC_course.authorSupplement||!tcCourseLevel().supplement)return'';\n      const reps=Math.max(1,Math.floor(TC_course.pullMax*.8));\n      const seq=Array(10).fill(String(reps)).join('  ');\n      return '<div class=\"todayCard\" style=\"margin-top:12px;border-color:#6a5520\"><div class=\"row between\"><div><div class=\"dateBig\">Дополнительные подтягивания по курсу</div></div><span class=\"tag stage4\">КУРС</span></div><div class=\"planrow\"><div class=\"grow\"><div class=\"strong\" style=\"font-size:15px\">Классические подтягивания</div></div><div class=\"r sets\" style=\"white-space:normal\">'+seq+'</div></div><button class=\"btn ghost full\" style=\"margin-top:10px\" onclick=\"tcStartSupplementWorkout()\">Начать</button></div>';\n    }\n\n\n    function tcRenderToday(){\n      const now=new Date(),due=tcCourseDue(),l=tcCourseLevel(),c=tcCourseComplex(),items=tcBuildCourseItems(),extras=tcBuildExtraItems();\n      q('todayTitle').textContent=fmtDate(now);\n      if(due){\n        q('todaySub').textContent='Курс Морозова · '+l.title+' · '+tcCourseGoalName(TC_course.goal);\n        q('todayList').innerHTML='<div class=\"todayCard\"><div class=\"row between\"><div><div class=\"dateBig\">'+(c.def?c.def.name:'Основной комплекс')+'</div><div class=\"sessionNo\">'+l.frequency+'</div></div><span class=\"tag\">КУРС</span></div>'+tcCourseRowsHtml(items)+'<div class=\"info\" style=\"margin-top:10px\"><b>Критерий уровня:</b> '+l.mastery+'<br><br>Содержание комплекса и интервалы отдыха взяты из курса. Раскладка дней восстановления и дополнительных упражнений — логика TurnikCoach.</div><button class=\"btn yellow full\" style=\"margin-top:12px\" onclick=\"tcStartCourseWorkout()\">Начать основной комплекс</button><button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"tcOpenCourseProgram()\">Программа курса</button><button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"tcOpenCourseInfo()\">ⓘ Советы автора</button></div>';\n      }else{\n        const next=new Date(TC_course.lastCourseDate+'T12:00:00');next.setDate(next.getDate()+2);\n        q('todaySub').textContent='День без основного комплекса · восстановление тяговой нагрузки';\n        let html='<div class=\"todayCard\"><div class=\"row between\"><div><div class=\"dateBig\">Сегодня без курса</div><div class=\"sessionNo\">Следующий основной комплекс — не раньше '+fmtKeyDate(dateKey(next),false)+'</div></div><span class=\"tag stage4\">ВОССТАНОВЛЕНИЕ</span></div>';\n        if(extras.length){html+='<div class=\"info\" style=\"margin-top:10px\">Подтягивания сегодня не повторяем. Можно выполнить выбранные дополнительные упражнения, которые не относятся к тяговому блоку курса.</div>'+tcExtraRowsHtml(extras)+'<button class=\"btn yellow full\" style=\"margin-top:12px\" onclick=\"tcStartExtraWorkout()\">Начать дополнительную тренировку</button>'}\n        else html+='<div class=\"empty\" style=\"margin-top:12px\">Дополнительные упражнения не выбраны. Сегодня можно оставить полный отдых.</div><button class=\"btn ghost full\" style=\"margin-top:10px\" onclick=\"go(\\'exercise\\')\">Выбрать пресс, ноги или отжимания</button>';\n        const conflicts=tcConflictExercises();if(conflicts.length)html+='<div class=\"info\" style=\"margin-top:10px\"><b>Не поставлены автоматически в восстановительный день:</b> '+conflicts.map(e=>e.name).join(', ')+'. Они продолжают нагружать тяговую систему или относятся к сложным элементам.</div>';\n        html+='<button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"tcOpenCourseProgram()\">Программа курса</button><button class=\"btn ghost full\" style=\"margin-top:8px\" onclick=\"tcOpenCourseInfo()\">ⓘ Советы автора</button></div>'+tcSupplementHtml();q('todayList').innerHTML=html;\n      }\n      tcQueueDecorate();\n    }\n\n\n    function tcAuthorLevelText(level){\n      if(level===1)return 'Автор относит сюда тех, кто делает 0–1 обычное подтягивание или работает с резиной. Основная задача уровня — увеличить силу тянущих мышц комплексно. Для сохранения правильной техники предлагается использовать помощь ног и резину.';\n      if(level===2)return 'Автор переводит работу ближе к самим подтягиваниям: объём уменьшается, интенсивность увеличивается. Главный акцент — не допускать технических ошибок и научиться выполнять чёткие 2–4 подтягивания.';\n      if(level===3)return 'Задача уровня — максимально увеличить количество подтягиваний. Автор предлагает комбинировать работу на силовую выносливость с упражнениями на вспомогательные звенья и отдельно подчёркивает важность работы ног и кора в подтягиваниях.';\n      if(level===4)return 'При результате примерно 15–25 подтягиваний автор предлагает выбрать направление: продолжать развивать выносливость и постепенно идти к 25–30 повторениям либо смещать работу к одноповторному максимуму для выхода силой и подтягивания на одной руке.';\n      if(level===5)return 'На этом уровне курс продолжает специализацию на выходе силой или подтягивании на одной руке и повышает требования к скоростно-силовой и тяжёлой тяговой работе.';\n      if(level===6)return 'Шестой уровень продолжает специальную силовую подготовку: одноручные негативы, облегчённые одноручные варианты, работа хвата и тяжёлые подтягивания с дополнительным весом.';\n      if(level===7)return 'Седьмой уровень автор строит вокруг прогрессии подтягивания на одной руке. Прогрессию предлагается подбирать по своему уровню и сочетать с упражнениями предыдущих уровней.';\n      return '';\n    }\n    function tcAuthorGoalText(level,goal){\n      if(level===4&&goal==='quantity')return 'Для увеличения количества автор выделяет комплекс №3: 3 подхода по 80% от максимума, 2 подхода широким хватом до максимума и 4×3 с дополнительным весом. Отдых между упражнениями комплекса — 2–4 минуты. Даже при цели увеличить количество автор допускает добавлять комплекс №1 и/или №2 примерно раз в неделю–10 дней.';\n      if(level===4&&goal==='muscleup')return 'Для выхода силой автор назначает комплекс №1: плиометрические подтягивания, широкий хват по 80% от максимума и тягу к плечу хватом «игуаны».';\n      if(level===4&&goal==='onearm')return 'Для подтягивания на одной руке автор назначает комплекс №2: асимметричные подтягивания, активный вис на одной руке и перехваты в висе на полусогнутых руках.';\n      return '';\n    }\n    function tcAuthorExerciseNote(def){\n      if(!def)return '';\n      const id=def.id||'';\n      if(id.includes('wide'))return 'По тексту курса широкий верхний хват сильнее смещает акцент на мышцы спины и подключает стабилизаторы плеча. Автор отмечает, что для большего акцента на спину часто используют частичную амплитуду без полного разгибания рук.';\n      if(id.includes('pull80')||id==='c_classic_max'||id.includes('pull50'))return 'Классические подтягивания верхним хватом автор описывает как вариант, где нагрузка относительно равномерно распределяется между мышцами рук и спины.';\n      if(id.includes('plyo')||id.includes('high'))return 'Высокие подтягивания в курсе используются для развития взрывной силы; целевые мышцы остаются теми же, что и в классических подтягиваниях.';\n      if(id.includes('three_stage'))return 'Трёхстадийные подтягивания автор использует для нейромышечного контроля: движение разделяется на фазы, чтобы лучше контролировать работу в каждой части амплитуды.';\n      if(id.includes('asym'))return 'Асимметричные подтягивания увеличивают нагрузку на тянущую сторону, а вспомогательная сторона стабилизирует положение и снимает часть нагрузки.';\n      if(id.includes('shrug'))return 'Шраги в курсе направлены на мышцы, опускающие плечо, ротаторы плеча и при большей амплитуде — трапеции.';\n      if(id.includes('chin'))return 'Нижний хват немного сильнее переносит нагрузку на бицепс, но автор подчёркивает, что распределение нагрузки сильно зависит от техники.';\n      if(def.tip)return def.tip;\n      return 'В тексте PDF для этого упражнения в текущем разделе отдельное техническое пояснение не приведено; курс задаёт его место, объём и режим работы в составе комплекса.';\n    }\n\n    function tcCurrentCalculationHtml(){\n      if(!window.W||!['course','supplement'].includes(W.mode)||!W.items||!W.items.length)return '';\n      const x=W.items[W.exerciseIndex],def=x&&(x.def||x.e.courseDef);\n      if(!def)return '';\n      const sch=def.scheme||{};\n      let body='<b>'+x.e.name+'</b><br>';\n      if(sch.type==='percent'&&sch.ref==='pull'){\n        const raw=TC_course.pullMax*(+sch.pct||0),target=tcSchemeTarget(def);\n        body+=def.sets+' подхода × '+target+' повторений.<br>Расчёт: '+TC_course.pullMax+' × '+Math.round((+sch.pct||0)*100)+'% = '+String(Math.round(raw*10)/10).replace('.',',')+' → '+target+'.';\n      }else if(sch.type==='fixed'){\n        body+=def.sets+' подхода × '+sch.value+'.';\n      }else if(sch.type==='max'){\n        body+=def.sets+' подхода × MAX.';\n      }else if(sch.type==='range_reps'){\n        body+=def.sets+' подхода × '+sch.min+'–'+sch.max+'.';\n      }else if(sch.type==='timed'){\n        body+=def.sets+' подхода × '+(sch.label||sch.value)+'.';\n      }else{\n        body+='План: '+tcSchemeLabel(def)+'.';\n      }\n      if(def.metric==='weighted'&&x.e.load)body+='<br>Дополнительный вес: +'+x.e.load+' кг.';\n      if(def.metric==='reps_side'||def.metric==='time_side')body+='<br>Выполняется на каждую сторону.';\n      return '<div class=\"tcInfoBlock\"><h3>Расчёт текущего задания</h3><p>'+body+'</p></div>';\n    }\n\n    function tcAuthorComplexHtml(c){\n      if(!c||!c.def)return '';\n      return c.def.items.map(def=>'<div class=\"tcInfoBlock\"><h3>'+def.name+'</h3><p><b>По курсу:</b> '+def.sets+' подх. · '+tcSchemeLabel(def)+' · отдых '+tcCourseRestText(def.rest)+'<br><br>'+tcAuthorExerciseNote(def)+'</p></div>').join('');\n    }\n\n\n    // Read-only seven-level catalogue. Browsing does not change a workout or saved preferences.\n    function tcProgramEscape(v){\n      return String(v==null?'':v).replace(/[&<>\"']/g,ch=>({\n        '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'\n      }[ch]));\n    }\n    function tcProgramPrescription(def){\n      const scheme=def.scheme||{};\n      let target=tcSchemeLabel(def);\n      if(scheme.type==='percent')target=Math.round((+scheme.pct||0)*100)+'% от максимума';\n      if(scheme.type==='max')target='MAX';\n      if(scheme.type==='choice')return 'Упражнение на выбор из указанного уровня';\n      const sides=(def.metric==='reps_side'||def.metric==='time_side')?' на каждую руку':'';\n      const units=(def.metric==='time'||def.metric==='time_side')?' сек':'';\n      const weight=(def.metric==='weighted')?' с дополнительным весом':'';\n      return def.sets+' подх.'+sides+' · '+target+units+weight;\n    }\n    function tcProgramExerciseHtml(def){\n      const tip=tcAuthorExerciseNote(def);\n      const noTip=tip.indexOf('отдельное техническое пояснение не приведено')>=0;\n      const note=(!noTip&&tip)?'<details class=\"tcProgramNote\"><summary>Пояснение к упражнению</summary><p>'+tcProgramEscape(tip)+'</p></details>':'';\n      return '<div class=\"tcProgramExercise\"><div class=\"tcProgramExerciseName\">'+tcProgramEscape(def.name)+'</div>'+\n        '<div class=\"tcProgramPrescription\">'+tcProgramEscape(tcProgramPrescription(def))+'</div>'+\n        '<div class=\"tcProgramRest\">Отдых: '+tcProgramEscape(tcCourseRestText(def.rest))+'</div>'+note+'</div>';\n    }\n    function tcProgramComplexHtml(levelNo,no,complex){\n      const active=levelNo===TC_course.level&&no===tcCourseComplexNo();\n      return '<details class=\"tcProgramComplex\"'+(active?' open':'')+'><summary><span class=\"tcProgramChevron\">▶</span><span class=\"tcProgramGrow\">'+tcProgramEscape(complex.name)+'</span>'+(active?'<span class=\"tcProgramCurrent\">Следующий</span>':'')+'</summary>'+\n        '<div class=\"tcProgramComplexBody\">'+\n        (complex.purpose?'<p class=\"tcProgramPurpose\">'+tcProgramEscape(complex.purpose)+'</p>':'')+\n        complex.items.map(tcProgramExerciseHtml).join('')+'</div></details>';\n    }\n    function tcProgramLevelHtml(levelNo){\n      const level=TC_COURSE[levelNo],active=levelNo===TC_course.level;\n      const nums=Object.keys(level.complexes).map(Number).sort((a,b)=>a-b);\n      return '<details class=\"tcProgramLevel\"'+(active?' open':'')+'>'+\n        '<summary><span class=\"tcProgramChevron\">▶</span><span class=\"tcProgramGrow\">Уровень '+levelNo+' · '+tcProgramEscape(level.title)+'</span>'+(active?'<span class=\"tcProgramCurrent\">Ваш уровень</span>':'')+'</summary>'+\n        '<div class=\"tcProgramLevelBody\">'+\n        (level.entry?'<div class=\"tcProgramLine\"><b>Ориентир:</b> '+tcProgramEscape(level.entry)+'</div>':'')+\n        '<div class=\"tcProgramLine\"><b>Частота:</b> '+tcProgramEscape(level.frequency)+'</div>'+\n        nums.map(no=>tcProgramComplexHtml(levelNo,no,level.complexes[no])).join('')+\n        '<div class=\"tcProgramLine\"><b>Контроль уровня:</b> '+tcProgramEscape(level.mastery)+'</div>'+\n        (level.supplement?'<details class=\"tcProgramNote\"><summary>Дополнительная работа по курсу</summary><p>'+tcProgramEscape(level.supplement)+'</p></details>':'')+\n        '</div></details>';\n    }\n    function tcInjectProgramStyles(){\n      if(document.getElementById('tcCourseProgramStyles'))return;\n      const el=document.createElement('style');el.id='tcCourseProgramStyles';\n      el.textContent='.tcProgramLevel{border:1px solid #35414d;border-radius:14px;margin:10px 0;background:#111920;overflow:visible}.tcProgramLevel[open]{border-color:#6e6040}.tcProgramLevel>summary,.tcProgramComplex>summary{list-style:none;display:flex;align-items:center;gap:9px;padding:13px 11px;min-height:48px;cursor:pointer}.tcProgramLevel>summary::-webkit-details-marker,.tcProgramComplex>summary::-webkit-details-marker,.tcProgramNote>summary::-webkit-details-marker{display:none}.tcProgramChevron{color:#ffd84d;font-size:12px;flex:none;transition:transform .15s ease}.tcProgramLevel[open]>summary>.tcProgramChevron,.tcProgramComplex[open]>summary>.tcProgramChevron{transform:rotate(90deg)}.tcProgramGrow{flex:1;min-width:0;font-weight:850;font-size:14px}.tcProgramCurrent{flex:none;font-size:10px;color:#17130a;background:#ffd84d;border-radius:7px;padding:4px 6px;font-weight:800}.tcProgramLevelBody{padding:0 11px 12px}.tcProgramLine{font-size:12px;color:#c6d0d9;line-height:1.45;margin:8px 0}.tcProgramComplex{background:#1b242c;border:1px solid #34414c;border-radius:11px;margin:9px 0;overflow:visible}.tcProgramComplexBody{padding:0 11px 10px}.tcProgramPurpose{font-size:12px;line-height:1.45;color:#bec7d2;margin:0 0 10px}.tcProgramExercise{border-top:1px solid #35404b;padding:10px 0}.tcProgramExerciseName{font-weight:850;color:#fff;font-size:13px;line-height:1.4}.tcProgramPrescription{font-size:12px;color:#ffd84d;font-weight:800;line-height:1.45;margin-top:3px}.tcProgramRest{font-size:11px;color:#b1bbc6;margin-top:4px}.tcProgramNote{margin-top:9px;padding:8px 9px;border-radius:9px;background:#121b23;border:1px solid #33404b}.tcProgramNote>summary{font-size:12px;color:#d4deea;cursor:pointer}.tcProgramNote p{font-size:12px;line-height:1.5;color:#c2ccd6;margin:7px 0 0}';\n      document.head.appendChild(el);\n    }\n    window.tcOpenCourseProgram=function(){\n      const sheet=q('sheet'),box=q('sheetbox');\n      if(!sheet||!box)return;\n      tcInjectProgramStyles();\n      box.innerHTML='<div class=\"sheettitle\">Программа курса</div>'+\n        '<div class=\"sub\" style=\"margin-top:5px\">Артём Морозов · «Подтягивания с нуля до киборга». Откройте уровень, затем комплекс. Просмотр не меняет настройки курса и не запускает тренировку.</div>'+\n        Array.from({length:7},(_,i)=>tcProgramLevelHtml(i+1)).join('')+\n        '<button class=\"btn yellow full\" style=\"margin-top:13px\" onclick=\"closeSheet()\">Закрыть программу</button>';\n      box.scrollTop=0;\n      sheet.classList.add('open');\n    };\n\n    window.tcOpenCourseInfo=function(){\n      const l=tcCourseLevel(),c=tcCourseComplex(),box=q('sheetbox');\n      const goalText=tcAuthorGoalText(TC_course.level,TC_course.goal);\n      box.innerHTML='<div class=\"sheettitle\">Советы автора · '+l.title+'</div>'+\n      '<div class=\"sub\" style=\"margin-top:6px\">Здесь показывается содержание и логика самого курса Морозова. Технические правила TurnikCoach сюда не подмешиваются.</div>'+\n      tcCurrentCalculationHtml()+\n      '<div class=\"tcInfoBlock\"><h3>Что автор говорит об этом уровне</h3><p>'+tcAuthorLevelText(TC_course.level)+'</p></div>'+\n      (goalText?'<div class=\"tcInfoBlock\"><h3>Для выбранной цели</h3><p>'+goalText+'</p></div>':'')+\n      '<div class=\"tcInfoBlock\"><h3>Текущий комплекс</h3><p><b>'+(c.def?c.def.name:'—')+'</b><br>'+(c.def&&c.def.purpose?c.def.purpose:'')+'</p></div>'+\n      tcAuthorComplexHtml(c)+\n      '<div class=\"tcInfoBlock\"><h3>Критерий освоения уровня</h3><p>'+l.mastery+'</p></div>'+\n      (l.supplement?'<div class=\"tcInfoBlock\"><h3>Дополнительные подтягивания по курсу</h3><p>'+l.supplement+'</p></div>':'')+\n      '<button class=\"btn yellow full\" style=\"margin-top:14px\" onclick=\"closeSheet()\">Понятно</button>';\n      q('sheet').classList.add('open');\n    };\n\n    window.tcStartCourseWorkout=function(){\n      const items=tcBuildCourseItems();if(!items.length)return;unlockAudio();\n      const c=tcCourseComplex();W={mode:'course',sessionIndex:0,exerciseIndex:0,setIndex:0,items,actual:tcSchemeTarget(items[0].def),early:false,courseLevel:TC_course.level,courseComplex:c.no,courseGoal:TC_course.goal};go('workout');\n    };\n    window.tcStartExtraWorkout=function(){\n      const items=tcBuildExtraItems();if(!items.length)return;unlockAudio();const idx=TC_course.extraSeq%3;W={mode:'extra',sessionIndex:idx,exerciseIndex:0,setIndex:0,items,actual:items[0].plan[0],early:false};go('workout');\n    };\n    window.tcStartSupplementWorkout=function(){\n      const reps=Math.max(1,Math.floor(TC_course.pullMax*.8)),def={id:'c_daily80',name:'Классические подтягивания · авторское дополнение',metric:'reps',sets:10,scheme:{type:'fixed',value:reps,label:String(reps)},rest:{type:'manual',label:'отдых в PDF не задан'}};\n      const e={id:def.id,name:def.name,metric:'reps',max:TC_course.pullMax,load:0,courseDef:def};const item={e,def,plan:Array(10).fill(reps),planLabels:Array(10).fill(String(reps)),actual:[]};W={mode:'supplement',sessionIndex:0,exerciseIndex:0,setIndex:0,items:[item],actual:reps,early:false};go('workout');\n    };\n\n    function tcPrepareManualRest(label,note){\n      window.__tcManualCourseRest=true;go('rest');const title=document.querySelector('#rest h1'),sub=document.querySelector('#rest .sub'),num=q('restNum'),buttons=document.querySelectorAll('#rest button');if(title)title.textContent=label==='минимальный'?'Минимальный отдых':'Отдых по самочувствию';if(sub)sub.textContent=note||('По курсу: '+label);if(num)num.textContent='—';if(buttons[0])buttons[0].textContent='Продолжить';if(buttons[1])buttons[1].style.display='none';\n    }\n    function tcRestoreRestUI(){const title=document.querySelector('#rest h1'),sub=document.querySelector('#rest .sub'),buttons=document.querySelectorAll('#rest button');if(title)title.textContent='Восстановись';if(sub)sub.textContent='За 3 секунды до окончания прозвучат три сигнала';if(buttons[0])buttons[0].textContent='Готов раньше';if(buttons[1])buttons[1].style.display='block';window.__tcManualCourseRest=false}\n\n\n    function tcPlanToken(def,x){\n      const sch=def.scheme||{};\n      if(sch.type==='percent'&&sch.ref==='pull')return String(tcSchemeTarget(def));\n      if(sch.type==='fixed')return String(sch.value);\n      if(sch.type==='max')return 'MAX';\n      if(sch.type==='range_reps')return sch.min+'–'+sch.max;\n      if(sch.type==='timed')return sch.label||String(sch.value);\n      if(sch.type==='choice')return 'НА ВЫБОР';\n      const vals=(x&&x.plan)||[];\n      return vals.length?String(vals[0]):tcSchemeLabel(def);\n    }\n    function tcSequenceCoursePlan(def,x){\n      const sets=(x&&x.plan?x.plan.length:def.sets)||1;\n      const token=tcPlanToken(def,x);\n      const seq=Array.from({length:sets},()=>token).join('  ');\n      let side='';\n      if(def.metric==='reps_side'||def.metric==='time_side')side='на каждую сторону';\n      if(def.metric==='weighted'&&x&&x.e&&x.e.load)side='+'+x.e.load+' кг';\n      return '<span class=\"tcPlanMain\">'+seq+'</span>'+(side?'<span class=\"tcPlanSide\">'+side+'</span>':'');\n    }\n\n    const tcBeforeCourseRenderWork=window.renderWork;\n    window.renderWork=function(){\n      const r=tcBeforeCourseRenderWork();\n      if(!W||W.mode!=='course'&&W.mode!=='supplement'){const wp=q('wplan');if(wp)wp.classList.remove('tcCoursePlan');return r;}\n      const x=W.items[W.exerciseIndex],def=x.def||x.e.courseDef;if(!def)return r;\n      q('wname').textContent=x.e.name;q('wmeta').textContent='Курс Морозова · упражнение '+(W.exerciseIndex+1)+' из '+W.items.length+' · подход '+(W.setIndex+1)+' из '+x.plan.length+(x.e.load?' · +'+x.e.load+' кг':'');q('wplan').classList.add('tcCoursePlan');q('wplan').innerHTML=tcSequenceCoursePlan(def,x);q('factUnit').textContent=tcUnitForMetric(def.metric)+(x.e.load?' · +'+x.e.load+' кг':'');const fb=q('mediaFallback'),img=q('visualImg');if(img){img.removeAttribute('src');img.style.display='none'}if(fb)fb.style.display='none';return r;\n    };\n\n    const tcBeforeCourseSetDone=window.setDone;\n    window.setDone=function(skip){\n      if(!W||!['course','supplement'].includes(W.mode))return tcBeforeCourseSetDone(skip);\n      tcPrimeAudio();const x=W.items[W.exerciseIndex],def=x.def||x.e.courseDef,target=x.plan[W.setIndex],actual=skip?null:W.actual;x.actual[W.setIndex]=actual;\n      const advance=()=>{if(W.setIndex<x.plan.length-1){W.setIndex++;W.actual=x.plan[W.setIndex]||tcLastActualFor(def.id)||1;renderWork();return true}if(W.exerciseIndex<W.items.length-1){W.exerciseIndex++;W.setIndex=0;const nx=W.items[W.exerciseIndex];W.actual=nx.plan[0]||tcLastActualFor(nx.def.id)||1;renderWork();return true}return false};\n      const more=W.setIndex<x.plan.length-1||W.exerciseIndex<W.items.length-1;\n      if(!more){tcFinishSignal();askFeedback(false);return}\n      const rr=tcAdaptiveCourseRest(def,target,actual,!!skip);advance();\n      if(rr.manual)tcPrepareManualRest(rr.label,rr.note);else window.startRest(rr.seconds,rr.note);\n    };\n\n    const tcBeforeCourseFinishRest=window.finishRest;\n    window.finishRest=function(){if(window.__tcManualCourseRest){tcRestoreRestUI();go('workout');return}return tcBeforeCourseFinishRest()};\n\n    const tcBeforeCourseFinishWorkout=window.finishWorkout;\n    window.finishWorkout=function(feel){\n      if(!W||!['course','extra','supplement'].includes(W.mode))return tcBeforeCourseFinishWorkout(feel);\n      let total=0,details=[];W.items.forEach(x=>{const actual=x.plan.map((_,i)=>x.actual[i]===undefined?null:x.actual[i]);const sum=actual.reduce((s,v)=>s+(Number.isFinite(+v)?+v:0),0);total+=sum;details.push({id:x.e.id,name:x.e.name,metric:x.e.metric,load:x.e.load||0,plan:x.plan.slice(),planLabels:(x.planLabels||x.plan.map(String)).slice(),actual,sum})});\n      const rec={type:'workout',date:dateKey(),ts:Date.now(),feedback:feel,total,details,early:!!W.early,courseMode:W.mode,session:W.mode==='extra'?'доп.':'курс'};\n      if(W.mode==='course'){rec.courseLevel=W.courseLevel;rec.courseComplex=W.courseComplex;rec.courseGoal=W.courseGoal;TC_course.history.unshift(rec);TC_course.courseSeq++;TC_course.lastCourseDate=rec.date;TC_course.lastCourseTs=rec.ts;tcSaveCourse()}\n      else if(W.mode==='extra'){TC_course.extraSeq++;tcSaveCourse();state.history.unshift(rec);save()}\n      else {rec.courseLevel=TC_course.level;rec.courseComplex='дополнение';TC_course.history.unshift(rec);tcSaveCourse()}\n      q('sheet').classList.remove('open');W=null;go('today');\n    };\n\n    const tcBeforeCourseInfo=window.tcOpenTrainingInfo;\n    window.tcOpenTrainingInfo=function(){if(TC_course.enabled&&(W&&['course','supplement'].includes(W.mode)||q('today').classList.contains('on')))return tcOpenCourseInfo();return tcBeforeCourseInfo()};\n\n    function tcCourseHistoryHtml(){if(!TC_course.enabled&&!TC_course.history.length)return'';const rows=TC_course.history.slice(0,8).map(h=>'<div class=\"historyitem\"><div class=\"row between\"><div><div class=\"strong\" style=\"font-size:14px\">'+(h.courseMode==='supplement'?'Дополнительные подтягивания по курсу':'Курс Морозова · уровень '+h.courseLevel+' · комплекс '+h.courseComplex)+'</div><div class=\"meta\">'+fmtRecordDate(h)+' · '+(h.feedback||'—')+'</div></div><span class=\"badge\">КУРС</span></div>'+(h.details||[]).map(d=>'<div class=\"meta\" style=\"margin-top:6px\">'+d.name+': '+d.actual.map(v=>v===null?'—':v).join(' · ')+'</div>').join('')+'</div>').join('');return '<div class=\"exerciseProgressCard\"><div class=\"progressHead\"><div><div class=\"progressName\">Курс Морозова</div><div class=\"meta\">Отдельная история основной тяговой программы</div></div><span class=\"badge\">ур. '+TC_course.level+'</span></div><div class=\"tcInfoBlock\"><h3>Критерий текущего уровня</h3><p>'+tcCourseLevel().mastery+'</p></div>'+rows+'</div>'}\n    const tcBeforeCourseRenderHistory=window.renderHistory;\n    window.renderHistory=function(){const r=tcBeforeCourseRenderHistory();const host=q('exerciseProgress');if(host){const old=document.getElementById('tcCourseHistoryWrap');if(old)old.remove();const wrap=document.createElement('div');wrap.id='tcCourseHistoryWrap';wrap.innerHTML=tcCourseHistoryHtml();host.parentNode.insertBefore(wrap,host)}return r};\n\n    const tcBeforeCourseRender=window.render;\n    window.render=function(){const r=tcBeforeCourseRender();tcDecorateCourseCatalog();if(TC_course.enabled&&q('today').classList.contains('on'))tcRenderToday();return r};\n\n    // Initial redraw after installing the module.\n    tcInjectCourseUiStyles();\n    render();\n\n})();\n";
  function tcValidCourseModule(js){return typeof js==='string'&&js.length>1000&&js.length<256000&&js.includes('TURNIKCOACH_COURSE')}
  function tcEvalCourseModule(js){if(!tcValidCourseModule(js))return false;try{(0,eval)(js);return true}catch(e){console.error('TurnikCoach course module',e);return false}}
  function tcLoadCourseModule(){tcEvalCourseModule(COURSE_MODULE_BUNDLED)}


  function tcInstallNavigationFoundation(){
    if(window.__TC_NAV_FOUNDATION)return;
    window.__TC_NAV_FOUNDATION=true;

    const style=document.createElement('style');
    style.id='tcNavFoundationStyle';
    style.textContent=
      '.tcBackBtn{width:38px;height:38px;min-width:38px;border-radius:50%;border:1px solid rgba(255,255,255,.22);background:rgba(13,20,27,.88);color:#fff;font-size:23px;font-weight:900;display:grid;place-items:center;padding:0;z-index:30}'+
      '.tcBackBtn:active{transform:scale(.96)}'+
      '.tcRestBack{position:absolute;left:14px;top:14px}'+
      '.tcSheetClose{position:sticky;float:right;top:0;margin:-4px -3px 6px 10px;width:36px;height:36px;border-radius:50%;border:1px solid #3a4653;background:#202a32;color:#fff;font-size:22px;font-weight:900;z-index:5}'+
      '#workout .stageHeader .row.between{gap:8px}';
    document.head.appendChild(style);

    let internal=false;
    let sheetWasOpen=false;
    const scrollByScreen={};

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

    const baseGo=window.go;
    window.go=function(id){
      const from=currentScreen();
      scrollByScreen[from]=currentScroll(from);
      const r=baseGo(id);
      if(internal){restoreScroll(id);return r}

      const trainingFlow=window.W&&(id==='workout'||id==='rest')&&(from==='workout'||from==='rest');
      const finishedTraining=!window.W&&(from==='workout'||from==='rest')&&['today','exercise','historyScreen'].includes(id);

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
      if(window.rt){try{clearInterval(window.rt)}catch(e){}}
      try{window.W=null}catch(e){}
      internal=true;
      try{baseGo(target||'today')}finally{internal=false}
      replaceRoute(target||'today',false);
      setTimeout(tcDecorateBackControls,0);
    }

    window.tcNavigateBack=function(){
      const scr=currentScreen();
      if(sheet&&sheet.classList.contains('open')){
        if(history.state&&history.state.tcSheet){history.back();return}
        closeSheetNow();return;
      }
      if(scr==='rest'&&window.W){
        history.back();return;
      }
      if(scr==='workout'&&window.W){
        const ok=window.confirm('Выйти из текущей тренировки? Незавершённые подходы не будут сохранены.');
        if(!ok)return;
        if(history.length>1){try{window.W=null}catch(e){};history.back();return}
        abandonWorkoutAndGo('today');return;
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

      if(scr==='rest'&&window.W){
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
      if(scr==='workout'&&window.W&&target!=='workout'){
        const ok=window.confirm('Выйти из текущей тренировки? Незавершённые подходы не будут сохранены.');
        if(!ok){pushRoute('workout',false);return}
        try{window.W=null}catch(e){}
      }

      internal=true;
      try{baseGo(target)}finally{internal=false}
      restoreScroll(target);
      setTimeout(tcDecorateBackControls,0);
    });

    function tcDecorateBackControls(){
      const wh=document.querySelector('#workout.screen.on .stageHeader .row.between');
      if(wh&&!wh.querySelector('.tcBackBtn')){
        const b=document.createElement('button');
        b.type='button';b.className='tcBackBtn';b.textContent='‹';b.title='Назад';
        b.onclick=window.tcNavigateBack;
        wh.insertBefore(b,wh.firstChild);
      }

      const rest=document.querySelector('#rest.screen.on .rest');
      if(rest&&!rest.querySelector('.tcRestBack')){
        const b=document.createElement('button');
        b.type='button';b.className='tcBackBtn tcRestBack';b.textContent='‹';b.title='Назад к упражнению';
        b.onclick=window.tcNavigateBack;
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
    if(window.__TC_HOTFIX_VERSION===VERSION)return;
    window.__TC_HOTFIX_VERSION=VERSION;
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

  // ---------- Reliable audio ----------
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

  // ---------- Adaptive rest ----------
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

  // ---------- Background-safe rest countdown ----------
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

    // ---------- Product UI: keep training mechanics inside, show explanations on demand ----------
    function tcInjectProductStyles(){
      if(document.getElementById('tcProductStyles'))return;
      const st=document.createElement('style');
      st.id='tcProductStyles';
      st.textContent=`
        .exerciseModel{display:none!important}
        #restWhy{display:none!important}
        .mediaFallback{display:none!important}
        .tcInfoBtn{width:36px;height:36px;min-width:36px;border-radius:50%;border:1px solid rgba(255,255,255,.28);background:rgba(13,20,27,.82);color:#ffd84d;font-size:20px;font-weight:950;display:grid;place-items:center;padding:0;box-shadow:0 5px 18px rgba(0,0,0,.22)}
        .tcInfoBtn:active{transform:scale(.96)}
        .tcInfoBlock{margin-top:12px;padding:12px 13px;border-radius:14px;background:#111920;border:1px solid #2c3945}
        .tcInfoBlock h3{font-size:14px;margin:0 0 7px;color:#fff}
        .tcInfoBlock p{font-size:12px;line-height:1.48;color:#c2ccd5;margin:0}
        .tcInfoBlock b{color:#fff}
        .tcInfoPlan{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
        .tcInfoPlan span{padding:5px 8px;border-radius:9px;background:#202a32;border:1px solid #35434f;color:#f6f7f8;font-size:11px;font-weight:850}
        #rest .rest{position:relative}
        #rest .tcInfoBtn{position:absolute;right:14px;top:12px}
      `;
      document.head.appendChild(st);
    }

    // Until a verified frame for an exact exercise is prepared, do not substitute a different exercise.
    try{
      window.__tcOriginalMediaFor=window.__tcOriginalMediaFor||mediaFor;
      mediaFor=function(){return''};
    }catch(e){}

    // Technical focus strings are still used by the algorithm conceptually, but not rendered as status labels.
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
      const wh=document.querySelector('#workout.screen.on .stageHeader .row.between');
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
    tcInstallNavigationFoundation();
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
