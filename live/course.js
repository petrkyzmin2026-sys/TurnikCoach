/* TURNIKCOACH_COURSE 1.0.20-after-main-extras */
(function(){
  'use strict';
  const COURSE_MODULE_VERSION='1.0.20-after-main-extras';
  if(window.__TC_COURSE_MODULE_VERSION===COURSE_MODULE_VERSION)return;
  window.__TC_COURSE_MODULE_VERSION=COURSE_MODULE_VERSION;
  function tcClamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function tcPrimeAudio(){try{if(typeof unlockAudio==='function')unlockAudio()}catch(e){}}
  function tcFinishSignal(){try{if(typeof beep==='function'){beep(620,.18,.42);setTimeout(()=>beep(880,.26,.46),200)}}catch(e){}}
  function tcQueueDecorate(){setTimeout(()=>{},0)}
    // ---------- Morozov pull-up course (source-driven module) ----------
    const TC_COURSE_KEY='tc_morozov_course_v1';
    const TC_PULL_CONFLICT_IDS=new Set(['pull','chin','bandPull','weightedPull','oneArmPull']);
    const TC_PULL_HEAVY_IDS=new Set(['pull','chin','bandPull','weightedPull','oneArmPull','muscleUp','frontLever','backLever']);

    const TC_COURSE={
      1:{
        title:'Начинающие',
        entry:'0–1 обычное подтягивание или 0–8 подтягиваний с резиной',
        frequency:'4 тренировки в неделю; чередовать комплексы №1 и №2',
        sequence:[1,2,1,2],
        mastery:'8 подтягиваний с резиной минимального натяжения',
        complexes:{
          1:{name:'Комплекс №1',purpose:'Общая силовая подготовка тяговых мышц и освоение правильного движения.',items:[
            {id:'c_band',name:'Подтягивания с резиной',metric:'reps',sets:3,scheme:{type:'fixed',value:8},rest:{type:'fixed',sec:60},tip:'Используй такую помощь резины, чтобы сохранять правильную технику.'},
            {id:'c_australian',name:'Австралийские подтягивания',metric:'reps',sets:3,scheme:{type:'fixed',value:12},rest:{type:'fixed',sec:60}},
            {id:'c_band_row',name:'Тяга резины',metric:'reps',sets:2,scheme:{type:'fixed',value:15},rest:{type:'fixed',sec:60}},
            {id:'c_bent_hold',name:'Вис на согнутых руках',metric:'time',sets:3,scheme:{type:'max'},rest:{type:'fixed',sec:60}}
          ]},
          2:{name:'Комплекс №2',purpose:'Техника, удержание и контролируемая эксцентрическая работа.',items:[
            {id:'c_active_hang',name:'Активный вис',metric:'time',sets:3,scheme:{type:'max'},rest:{type:'fixed',sec:60}},
            {id:'c_chair_pull',name:'Подтягивания с ногами на стуле',metric:'reps',sets:3,scheme:{type:'fixed',value:12},rest:{type:'fixed',sec:60}},
            {id:'c_aus_biceps',name:'Тяга на бицепс в австралийском мосту',metric:'reps',sets:2,scheme:{type:'fixed',value:8},rest:{type:'fixed',sec:60}},
            {id:'c_slow_negative',name:'Медленный негатив',metric:'reps',sets:5,scheme:{type:'timed',value:2,label:'2 · 20 сек'},rest:{type:'fixed',sec:60},tip:'Два медленных негативных повторения; курс указывает 20 секунд.'}
          ]}
        }
      },
      2:{
        title:'Второй уровень',
        entry:'До 4 обычных подтягиваний или более 6 подтягиваний с резиной',
        frequency:'2–4 тренировки в неделю по индивидуальным ощущениям',
        sequence:[1],
        mastery:'8 подтягиваний средним хватом',
        complexes:{
          1:{name:'Комплекс №1',purpose:'Более направленная работа на чёткие подтягивания; объём ниже, интенсивность выше.',items:[
            {id:'c_classic_max',name:'Классические подтягивания',metric:'reps',sets:3,scheme:{type:'max',ref:'pull'},rest:{type:'range',min:60,max:180},tip:'В этом уровне автор ставит задачу выполнять чёткие 2–4 подтягивания без технических ошибок.'},
            {id:'c_shrug',name:'Шраги на турнике',metric:'reps',sets:3,scheme:{type:'fixed',value:12},rest:{type:'range',min:60,max:180},tip:'Шраги развивают мышцы, опускающие плечо, ротаторы плеча и при большей амплитуде трапеции.'},
            {id:'c_half_pull',name:'Полуамплитудные подтягивания',metric:'reps',sets:3,scheme:{type:'fixed',value:8},rest:{type:'range',min:60,max:180}},
            {id:'c_pause_negative',name:'Негатив с паузами',metric:'reps',sets:3,scheme:{type:'timed',value:3,label:'3 · паузы 5 сек'},rest:{type:'range',min:60,max:180}},
            {id:'c_chin_max',name:'Подтягивания нижним хватом',metric:'reps',sets:3,scheme:{type:'max'},rest:{type:'range',min:60,max:180},tip:'Нижний хват немного сильнее переносит нагрузку на бицепс; распределение нагрузки зависит от техники.'}
          ]}
        }
      },
      3:{
        title:'Третий уровень',
        entry:'4–15 подтягиваний или более 6 широким хватом с резиной',
        frequency:'Комплекс №1 — 3 раза в неделю; комплекс №2 — 1 раз в неделю или раз в 10 дней',
        sequence:[1,1,1,2],
        mastery:'15–20 классических подтягиваний и 6 подтягиваний широким хватом',
        supplement:'10 подходов по 80% от максимума в дни без основной тренировки; пропускать в дни основной тренировки; раз в месяц отдых от этой дополнительной работы не менее 5 дней.',
        complexes:{
          1:{name:'Комплекс №1',purpose:'Рост количества подтягиваний через сочетание высокой и умеренной относительной нагрузки.',items:[
            {id:'c_pull80',name:'Классические подтягивания',metric:'reps',sets:3,scheme:{type:'percent',pct:.8,ref:'pull'},rest:{type:'fixed',sec:180}},
            {id:'c_wide_band_max',name:'Широкие подтягивания с резиной',metric:'reps',sets:1,scheme:{type:'max'},rest:{type:'range',min:60,max:180}},
            {id:'c_pull50',name:'Классические подтягивания',metric:'reps',sets:6,scheme:{type:'percent',pct:.5,ref:'pull'},rest:{type:'manual',label:'минимальный'}},
            {id:'c_negative_pause_max',name:'Негатив с паузами',metric:'time',sets:3,scheme:{type:'max',label:'MAX · максимальная пауза'},rest:{type:'manual',label:'минимальный'}}
          ]},
          2:{name:'Комплекс №2',purpose:'Дополнительная взрывная и асимметричная работа.',items:[
            {id:'c_chicken_wings',name:'Куриные крылья',metric:'reps',sets:2,scheme:{type:'fixed',value:10},rest:{type:'fixed',sec:180}},
            {id:'c_plyo80',name:'Плиометрические подтягивания',metric:'reps',sets:3,scheme:{type:'percent',pct:.8},rest:{type:'fixed',sec:180},tip:'Высокие и плиометрические подтягивания используются для развития взрывной силы.'},
            {id:'c_asym80',name:'Асимметричные подтягивания',metric:'reps_side',sets:3,scheme:{type:'percent',pct:.8,label:'80% MAX'},rest:{type:'fixed',sec:180},tip:'Асимметричные подтягивания увеличивают нагрузку на тянущую сторону; вспомогательная сторона стабилизирует движение.'}
          ]}
        }
      },
      4:{
        title:'Четвёртый уровень',
        entry:'15–25 подтягиваний; дальнейшая специализация по цели',
        frequency:'По цели: комплекс №1 — 2–4 раза/нед.; №2 — 3–4; №3 — 3–5',
        mastery:'5 асимметричных подтягиваний на каждую руку и 1 подтягивание выше груди',
        supplement:'10 подходов по 80% от максимума в дни без основной тренировки; пропускать в дни основной тренировки; раз в месяц отдых от этой дополнительной работы не менее 5 дней.',
        complexes:{
          1:{name:'Комплекс №1 · выход силой',goal:'muscleup',purpose:'Подготовка к выходу силой.',items:[
            {id:'c_plyo35',name:'Плиометрические подтягивания',metric:'reps',sets:5,scheme:{type:'range_reps',min:3,max:5,label:'3–5'},rest:{type:'range',min:120,max:240}},
            {id:'c_wide80',name:'Подтягивания широким хватом',metric:'reps',sets:3,scheme:{type:'percent',pct:.8,label:'80% MAX'},rest:{type:'range',min:120,max:240}},
            {id:'c_iguana',name:'Хват игуаны · тяга к плечу на полусогнутых',metric:'reps',sets:3,scheme:{type:'fixed',value:8},rest:{type:'range',min:120,max:240}}
          ]},
          2:{name:'Комплекс №2 · одна рука',goal:'onearm',purpose:'Подготовка к подтягиванию на одной руке.',items:[
            {id:'c_asym_max',name:'Асимметричные подтягивания',metric:'reps_side',sets:2,scheme:{type:'max'},rest:{type:'range',min:120,max:240},tip:'Асимметричная работа повышает нагрузку на тянущую сторону.'},
            {id:'c_onearm_active_hang',name:'Активный вис на одной руке',metric:'time_side',sets:3,scheme:{type:'max'},rest:{type:'range',min:120,max:240}},
            {id:'c_regrip_bent',name:'Перехваты в висе на полусогнутых',metric:'reps',sets:3,scheme:{type:'max'},rest:{type:'range',min:120,max:240}}
          ]},
          3:{name:'Комплекс №3 · количество',goal:'quantity',purpose:'Развитие выносливости и увеличение общего количества подтягиваний.',items:[
            {id:'c_pull80_l4',name:'Классические подтягивания',metric:'reps',sets:3,scheme:{type:'percent',pct:.8,ref:'pull'},rest:{type:'range',min:120,max:240}},
            {id:'c_wide_max_l4',name:'Подтягивания широким хватом',metric:'reps',sets:2,scheme:{type:'max'},rest:{type:'range',min:120,max:240}},
            {id:'c_weighted3',name:'Подтягивания с дополнительным весом',metric:'weighted',sets:4,scheme:{type:'fixed',value:3,label:'3 · максимальный рабочий вес'},rest:{type:'range',min:120,max:240}}
          ]}
        }
      },
      5:{
        title:'Пятый уровень',entry:'Продвинутая специализация после четвёртого уровня',frequency:'Комплекс выбирается по цели; в курсе указано 2–4 тренировки в неделю',sequence:[1],mastery:'Дополнительный вес в подтягивании — 60–70% собственного веса тела',
        complexes:{
          1:{name:'Комплекс №1 · выход силой',goal:'muscleup',purpose:'Скоростно-силовая работа для выхода силой.',items:[
            {id:'c_high_max',name:'Высокие подтягивания',metric:'reps',sets:3,scheme:{type:'max'},rest:{type:'range',min:180,max:300},tip:'Высокие подтягивания развивают взрывную силу.'},
            {id:'c_three_stage50',name:'Трёхстадийные подтягивания',metric:'reps',sets:6,scheme:{type:'percent',pct:.5,label:'50% MAX'},rest:{type:'range',min:180,max:300},tip:'Разделение движения на фазы развивает нейромышечный контроль каждой части амплитуды.'},
            {id:'c_power_crow',name:'Силовая каркуша',metric:'reps',sets:3,scheme:{type:'max'},rest:{type:'range',min:180,max:300}}
          ]},
          2:{name:'Комплекс №2 · одна рука / силовая база',goal:'onearm',purpose:'Односторонняя силовая работа и тяжёлые подтягивания.',items:[
            {id:'c_full_asym2',name:'Асимметричные подтягивания полные',metric:'reps_side',sets:2,scheme:{type:'fixed',value:2},rest:{type:'range',min:180,max:300}},
            {id:'c_onearm_bent_hold',name:'Вис на одной полусогнутой руке',metric:'time_side',sets:3,scheme:{type:'max'},rest:{type:'range',min:180,max:300}},
            {id:'c_typewriter',name:'Печатная машинка',metric:'reps',sets:2,scheme:{type:'max'},rest:{type:'range',min:180,max:300}},
            {id:'c_weighted3_l5',name:'Подтягивания с дополнительным весом',metric:'weighted',sets:5,scheme:{type:'fixed',value:3,label:'3 · максимальный рабочий вес'},rest:{type:'range',min:180,max:300}}
          ]}
        }
      },
      6:{
        title:'Шестой уровень',entry:'Следующая ступень специальной силовой работы',frequency:'Комплекс №1 — 2–4 раза/нед.; комплекс №2 — вспомогательная силовая работа, примерно раз в 10 дней',sequence:[1,1,1,2],mastery:'В PDF отдельный тест перехода после шестого уровня не указан.',
        complexes:{
          1:{name:'Комплекс №1',purpose:'Продвинутая односторонняя тяговая работа.',items:[
            {id:'c_onearm_negative',name:'Негативы на одной руке с подтягиванием в нейтральном хвате',metric:'reps_side',sets:3,scheme:{type:'timed',value:6,label:'6 · 10 сек'},rest:{type:'range',min:180,max:300}},
            {id:'c_jump_onearm',name:'Подтягивания с прыжка на низком турнике',metric:'reps_side',sets:3,scheme:{type:'fixed',value:4},rest:{type:'range',min:180,max:300}},
            {id:'c_band_onearm',name:'Подтягивания с резиной средней тяги',metric:'reps_side',sets:2,scheme:{type:'max'},rest:{type:'range',min:180,max:300}}
          ]},
          2:{name:'Комплекс №2',purpose:'Вспомогательная силовая работа.',items:[
            {id:'c_towel_hang',name:'Вис на полотенце одной рукой',metric:'time_side',sets:3,scheme:{type:'max'},rest:{type:'range',min:180,max:300}},
            {id:'c_weighted23',name:'Подтягивания с дополнительным весом',metric:'weighted',sets:4,scheme:{type:'range_reps',min:2,max:3,label:'2–3 · максимальный вес'},rest:{type:'range',min:180,max:300}}
          ]}
        }
      },
      7:{
        title:'Седьмой уровень',entry:'Прогрессия подтягивания на одной руке / дальнейшая работа на выход силой',frequency:'Комплекс №1 — 3 раза/нед. для одной руки; комплекс №2 — 3 раза/нед. для выхода силой в одно движение',sequence:[1],mastery:'В PDF отдельный финальный тест не указан.',
        complexes:{
          1:{name:'Комплекс №1 · одна рука',goal:'onearm',purpose:'Прогрессия подтягивания на одной руке.',items:[
            {id:'c_onearm_progression',name:'Прогрессия подтягивания на одной руке',metric:'reps_side',sets:4,scheme:{type:'max'},rest:{type:'manual',label:'по усмотрению'}},
            {id:'c_l6_choice1',name:'Упражнение на выбор из 6 уровня',metric:'reps',sets:1,scheme:{type:'choice',label:'любой комплекс'},rest:{type:'manual',label:'по усмотрению'}},
            {id:'c_l6_choice2',name:'Упражнение на выбор из 6 уровня',metric:'reps',sets:1,scheme:{type:'choice',label:'любой комплекс'},rest:{type:'manual',label:'по усмотрению'}}
          ]},
          2:{name:'Комплекс №2 · выход силой',goal:'muscleup',purpose:'Дальнейшая работа на выход силой в одно движение.',items:[
            {id:'c_onearm_progression_mu',name:'Прогрессия подтягивания на одной руке',metric:'reps_side',sets:4,scheme:{type:'max'},rest:{type:'manual',label:'по усмотрению'}},
            {id:'c_l5_choice1',name:'Упражнение на выбор из 5 уровня · комплекс №1',metric:'reps',sets:1,scheme:{type:'choice',label:'на выбор'},rest:{type:'manual',label:'по усмотрению'}},
            {id:'c_l5_choice2',name:'Упражнение на выбор из 5 уровня · комплекс №1',metric:'reps',sets:1,scheme:{type:'choice',label:'на выбор'},rest:{type:'manual',label:'по усмотрению'}}
          ]}
        }
      }
    };

    function tcCourseDefault(){
      const pull=state.ex.find(e=>e.id==='pull');
      const weighted=state.ex.find(e=>e.id==='weightedPull');
      const m=Math.max(1,+((pull&&pull.max)||1));
      return{enabled:false,level:m<=1?1:m<=3?2:m<=14?3:4,goal:'quantity',pullMax:m,weightedLoad:+((weighted&&weighted.load)||0),courseSeq:0,extraSeq:0,lastCourseDate:'',lastCourseTs:0,authorSupplement:false,history:[],tests:[],testPeriodWeeks:3,targetMax:30,testAnchorDate:'',lastTestDate:'',testDeferredUntil:'',weeklySessions:3,cycleStartDate:'',masteryTests:[],pendingTransition:null,advancedChoices:{onearm:[],muscleup:[]},auxEnabled:{3:false,6:false},auxInterval3:10,exerciseMax:{},equipment:'bar'};
    }
    function tcLoadCourse(){
      let c=tcCourseDefault();
      try{const raw=JSON.parse(localStorage.getItem(TC_COURSE_KEY)||'null');if(raw&&typeof raw==='object')c={...c,...raw}}catch(e){}
      c.level=tcClamp(Math.floor(+c.level||1),1,7);c.pullMax=Math.max(1,Math.floor(+c.pullMax||1));c.weightedLoad=Math.max(0,+c.weightedLoad||0);c.courseSeq=Math.max(0,Math.floor(+c.courseSeq||0));c.extraSeq=Math.max(0,Math.floor(+c.extraSeq||0));c.history=Array.isArray(c.history)?c.history:[];c.tests=Array.isArray(c.tests)?c.tests:[];c.masteryTests=Array.isArray(c.masteryTests)?c.masteryTests:[];c.pendingTransition=c.pendingTransition&&typeof c.pendingTransition==='object'?c.pendingTransition:null;c.advancedChoices=c.advancedChoices&&typeof c.advancedChoices==='object'?c.advancedChoices:{onearm:[],muscleup:[]};c.advancedChoices.onearm=Array.isArray(c.advancedChoices.onearm)?c.advancedChoices.onearm:[];c.advancedChoices.muscleup=Array.isArray(c.advancedChoices.muscleup)?c.advancedChoices.muscleup:[];c.auxEnabled=c.auxEnabled&&typeof c.auxEnabled==='object'?c.auxEnabled:{3:false,6:false};c.auxEnabled[3]=c.auxEnabled[3]===true;c.auxEnabled[6]=c.auxEnabled[6]===true;c.auxInterval3=[7,10].includes(+c.auxInterval3)?+c.auxInterval3:10;c.exerciseMax=c.exerciseMax&&typeof c.exerciseMax==='object'&&!Array.isArray(c.exerciseMax)?c.exerciseMax:{};c.equipment='bar';c.testPeriodWeeks=[2,3,4].includes(+c.testPeriodWeeks)?+c.testPeriodWeeks:3;c.weeklySessions=[2,3,4].includes(+c.weeklySessions)?+c.weeklySessions:3;c.cycleStartDate=/^\d{4}-\d{2}-\d{2}$/.test(c.cycleStartDate||'')?c.cycleStartDate:'';c.targetMax=Math.max(1,Math.floor(+c.targetMax||30));c.testAnchorDate=/^\d{4}-\d{2}-\d{2}$/.test(c.testAnchorDate||'')?c.testAnchorDate:'';c.lastTestDate=/^\d{4}-\d{2}-\d{2}$/.test(c.lastTestDate||'')?c.lastTestDate:'';c.testDeferredUntil=/^\d{4}-\d{2}-\d{2}$/.test(c.testDeferredUntil||'')?c.testDeferredUntil:'';
      return c;
    }
    let TC_course=tcLoadCourse();
    function tcSaveCourse(){try{localStorage.setItem(TC_COURSE_KEY,JSON.stringify(TC_course));return true}catch(e){console.error('course save',e);return false}}

    function tcNextTestDate(){
      const start=TC_course.lastTestDate||TC_course.testAnchorDate;
      if(!start)return '';
      const d=new Date(start+'T12:00:00');d.setDate(d.getDate()+TC_course.testPeriodWeeks*7);
      return dateKey(d);
    }
    function tcTestDue(){
      if(TC_course.level!==4||TC_course.goal!=='quantity')return false;
      const due=tcNextTestDate(),now=dateKey();
      return !!due&&now>=due&&(!TC_course.testDeferredUntil||now>=TC_course.testDeferredUntil);
    }
    function tcLatestTest(){return TC_course.tests.length?TC_course.tests[0]:null}
    function tcMasteryDue(){
      if(!TC_course.enabled||!TC_course.lastCourseDate||!tcMasteryDefinition())return false;
      const next=tcNextTestDate(),now=dateKey();
      return !!next&&now>=next&&(!TC_course.testDeferredUntil||now>=TC_course.testDeferredUntil)&&tcRecoveredForTest();
    }

    function tcCourseLevel(){return TC_COURSE[TC_course.level]||TC_COURSE[1]}
    function tcCourseGoalName(g){return g==='muscleup'?'Выход силой':g==='onearm'?'Подтягивание на одной руке':'Количество подтягиваний'}
    function tcGoalOptions(level){if(level<=3)return[['quantity','Количество подтягиваний']];if(level===4)return[['quantity','Количество подтягиваний'],['muscleup','Выход силой'],['onearm','Подтягивание на одной руке']];return[['muscleup','Выход силой'],['onearm','Подтягивание на одной руке']]}
    function tcNormalizeGoal(){const a=tcGoalOptions(TC_course.level).map(x=>x[0]);if(!a.includes(TC_course.goal))TC_course.goal=a[0]}

    // Equipment profile: the user owns only a standard horizontal bar.
    // The PDF programme is retained verbatim in TC_COURSE; filtering applies ONLY to executable assignments.
    const TC_UNAVAILABLE_BAR_ONLY={
      c_band:'Требуется резиновая петля',
      c_australian:'Требуется низкая перекладина либо иной опорный снаряд',
      c_band_row:'Требуется резиновая петля',
      c_chair_pull:'Требуется стул или иная дополнительная опора',
      c_aus_biceps:'Требуется низкая перекладина',
      c_wide_band_max:'Требуется резиновая петля',
      c_weighted3:'Требуется дополнительное отягощение',
      c_weighted3_l5:'Требуется дополнительное отягощение',
      c_weighted23:'Требуется дополнительное отягощение',
      c_band_onearm:'Требуется резиновая петля',
      c_towel_hang:'Требуется полотенце',
      c_onearm_negative:'Для варианта курса требуется нейтральный хват; наличие такой перекладины не подтверждено',
      c_slow_negative:'Для начала из верхнего положения на данном уровне нужна дополнительная опора; она не подтверждена',
      c_pause_negative:'Возможность безопасно выйти в верхнее положение без опоры не подтверждена',
      c_negative_pause_max:'Возможность безопасно выйти в верхнее положение без опоры не подтверждена',
      c_jump_onearm:'Для упражнения автор указывает низкий турник; высота имеющейся перекладины не подтверждена'
    };
    function tcEquipmentReason(def){
      if(!def)return 'Упражнение не определено';
      const id=String(def.id||'').replace(/_lv7_\d+$/,'');
      if(Object.prototype.hasOwnProperty.call(TC_UNAVAILABLE_BAR_ONLY,id))return TC_UNAVAILABLE_BAR_ONLY[id];
      if(def.metric==='weighted'||/резин|полотен|стул|австралийск|нейтральном хвате/i.test(def.name||'')){
        return 'Требуется дополнительный снаряд или приспособление';
      }
      if(def.scheme&&def.scheme.type==='choice')return 'До назначения необходимо выбрать доступное упражнение';
      return '';
    }
    function tcRunnableDefs(defs){return (defs||[]).filter(def=>!tcEquipmentReason(def))}
    function tcUnavailableDefs(defs){return (defs||[]).filter(def=>!!tcEquipmentReason(def))}
    function tcOriginalCourseDefs(){return tcResolvedCourseDefs(tcCourseComplex())}
    function tcAdaptationNote(defs){
      const unavailable=tcUnavailableDefs(defs);
      if(!unavailable.length)return '';
      return '<div class="info" style="margin-top:9px"><b>Адаптация: только турник.</b> '+
        'Исходный комплекс Морозова содержит недоступные упражнения: '+
        unavailable.map(def=>tcProgramEscape(def.name)).join(', ')+
        '. Они исключены из назначения, но сохранены в полной программе. '+
        'Полученная тренировка не является полным комплексом автора.</div>';
    }
    function tcNoEquipmentCard(defs){
      return '<div class="todayCard"><div class="dateBig">Комплекс не может быть выполнен полностью</div>'+
        '<div class="meta">Имеется только турник. В исходной программе есть упражнения, требующие другого оборудования.</div>'+
        tcAdaptationNote(defs)+
        '<button class="btn ghost full" style="margin-top:10px" onclick="tcOpenCourseProgram()">Посмотреть исходный курс</button></div>';
    }
    function tcCourseComplexNo(seqIndex=TC_course.courseSeq){
      const l=tcCourseLevel(),ids=Object.keys(l.complexes).map(Number);
      if(TC_course.level===3||TC_course.level===6)return 1;
      if(TC_course.level===4){if(TC_course.goal==='muscleup')return 1;if(TC_course.goal==='onearm')return 2;const seq=[3,3,3,1,3,3,3,2];return seq[seqIndex%seq.length]}
      if(TC_course.level===5){return TC_course.goal==='onearm'?2:1}
      if(TC_course.level===7){return TC_course.goal==='muscleup'?2:1}
      const seq=l.sequence&&l.sequence.length?l.sequence:ids;
      return seq[seqIndex%seq.length]||ids[0]||1;
    }
    function tcCourseComplex(seqIndex=TC_course.courseSeq){const no=tcCourseComplexNo(seqIndex);return{no,def:tcCourseLevel().complexes[no]}}
    function tcDayDiff(a,b){if(!a||!b)return 999;const x=new Date(a+'T12:00:00'),y=new Date(b+'T12:00:00');return Math.round((y-x)/86400000)}

    // A saved date anchors the first main session; legacy users retain
    // their former weekday pattern until they explicitly save a date.
    let tcSelectedDate='',tcWeekOffset=0;
    function tcWeeklyMode(){return TC_course.enabled&&TC_course.level>=1&&TC_course.level<=7}
    function tcCourseWeekdays(){
      const l=TC_course.level,g=TC_course.goal;
      if(l===1)return [1,3,5,0];
      if(l===2)return TC_course.weeklySessions===2?[1,4]:TC_course.weeklySessions===4?[1,3,6,0]:[1,3,6];
      if(l===3)return [1,3,6];
      if(l===4){if(g==='quantity')return TC_course.weeklySessions===4?[1,3,5,0]:[1,3,6];return g==='onearm'?[1,3,5,0]:[1,3,6]}
      if(l===5)return g==='onearm'?[1,3,5,0]:[1,3,6];
      if(l===6)return [1,3,6];
      return [1,4,6];
    }
    function tcDateFromKey(k){return new Date(k+'T12:00:00')}
    function tcScheduledOn(k){
      if(TC_course.cycleStartDate){
        const d=tcDayDiff(TC_course.cycleStartDate,k);
        return d>=0&&tcCourseWeekdays().map(x=>(x+6)%7).includes(d%7);
      }
      return tcCourseWeekdays().includes(tcDateFromKey(k).getDay());
    }
    function tcCourseDue(){
      if(!tcWeeklyMode())return false;
      const today=dateKey();
      if(TC_course.lastCourseDate===today||tcTestDue()||tcMasteryDue())return false;
      if(!TC_course.lastCourseDate&&!TC_course.cycleStartDate)return true;
      return tcScheduledOn(today);
    }
    function tcNextCourseDay(){
      const now=tcDateFromKey(dateKey());
      for(let i=0;i<28;i++){
        const d=new Date(now);d.setDate(now.getDate()+i);const k=dateKey(d);
        if(tcScheduledOn(k)&&k!==TC_course.lastCourseDate&&(i>0||tcCourseDue()))return k;
      }
      return '';
    }
    function tcCalendarMonday(){
      const d=tcDateFromKey(dateKey());
      d.setDate(d.getDate()-(d.getDay()+6)%7+tcWeekOffset*7);return d;
    }
    function tcProjectedCourseSeq(key){
      let seq=TC_course.courseSeq,d=tcDateFromKey(dateKey()),end=tcDateFromKey(key);
      if(key<=dateKey())return seq;
      for(;d<end;d.setDate(d.getDate()+1)){
        const k=dateKey(d);
        if(tcScheduledOn(k)&&k!==TC_course.lastCourseDate&&!TC_course.history.some(h=>h.courseMode==='course'&&h.date===k))seq++;
      }
      return seq;
    }

    function tcPreviewCourseCard(key){
      const now=dateKey(),records=TC_course.history.filter(h=>h.date===key);
      const finished=records.filter(h=>['course','auxCourse','supplement'].includes(h.courseMode));
      const tests=TC_course.tests.filter(t=>t.date===key);
      const mastery=TC_course.masteryTests.filter(t=>t.date===key);
      let html='<div class="todayCard tcCoursePreview"><div class="row between"><div><div class="dateBig">'+fmtDate(tcDateFromKey(key))+'</div><div class="meta">Просмотр без изменения расписания и истории</div></div><span class="tag stage4">ПРОСМОТР</span></div>';
      finished.forEach(h=>{
        html+='<div class="tcInfoBlock"><h3>'+(h.courseMode==='course'?'Выполнен комплекс №'+h.courseComplex:h.courseMode==='auxCourse'?'Выполнен вспомогательный комплекс':'Выполнена дополнительная работа')+'</h3>'+
          (h.details||[]).map(d=>'<p>'+tcProgramEscape(d.name)+': '+(d.actual||[]).map(v=>v==null?'—':String(v)).join(' · ')+'</p>').join('')+'</div>';
      });
      tests.forEach(t=>{html+='<div class="tcInfoBlock"><h3>Контрольный максимум</h3><p>'+t.value+' повторений</p></div>'});
      mastery.forEach(t=>{html+='<div class="tcInfoBlock"><h3>Контроль освоения уровня</h3><p>'+(t.passed?'Норматив выполнен':'Норматив не выполнен')+'</p></div>'});
      if(key<now){
        if(!finished.length&&!tests.length&&!mastery.length)html+='<div class="info">'+(TC_course.cycleStartDate&&key<TC_course.cycleStartDate?'Дата предшествует выбранному началу цикла.':tcScheduledOn(key)?'Занятие предусмотрено календарём; записи о выполнении нет.':'На эту дату основное занятие не назначено.')+'</div>';
        return html+'</div>';
      }
      if(TC_course.cycleStartDate&&key<TC_course.cycleStartDate)return html+'<div class="info">Основные занятия начнутся '+fmtKeyDate(TC_course.cycleStartDate,false)+'.</div></div>';
      if(tcScheduledOn(key)){
        const seq=tcProjectedCourseSeq(key),complex=tcCourseComplex(seq),defs=tcResolvedCourseDefs(complex),items=tcBuildCourseItems(seq);
        html+='<div class="row between" style="margin-top:12px"><div class="dateBig">'+(complex.def?complex.def.name:'Основной комплекс')+'</div><span class="tag">КУРС</span></div>';
        html+=items.length?tcCourseRowsHtml(items):'<div class="info">Для выполнения комплекса требуется оборудование или калибровка. См. действующий план в день занятия.</div>';
        html+=tcAdaptationNote(defs);
        html+='<div class="meta" style="margin-top:10px">Предварительный план. После предыдущих занятий, пропусков и контрольных замеров комплекс или нагрузка могут измениться. Начать тренировку из режима просмотра нельзя.</div>';
      }else{
        const extras=tcBuildExtraItems();
        html+='<div class="dateBig" style="margin-top:12px">День без основного комплекса</div>';
        html+=extras.length?tcExtraRowsHtml(extras)+'<div class="meta" style="margin-top:9px">Дополнительные упражнения необязательны; их выполнение не записано.</div>':'<div class="info">Дополнительные упражнения не выбраны. День отдыха.</div>';
      }
      return html+'</div>';
    }
    window.tcSelectCourseDay=function(key){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(key))return;
      const d=tcDateFromKey(key);
      if(!Number.isFinite(d.getTime())||dateKey(d)!==key)return;
      tcSelectedDate=key;render();
    };
    window.tcShiftCourseWeek=function(direction){
      if(direction!==-1&&direction!==1)return;
      tcWeekOffset=Math.max(-52,Math.min(52,tcWeekOffset+direction));
      tcSelectedDate=dateKey(tcCalendarMonday());render();
    };
    window.tcShowCourseToday=function(){tcWeekOffset=0;tcSelectedDate='';render()};
    function tcWeeklyCalendarHtml(){
      if(!tcWeeklyMode())return '';
      const names=['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'],today=dateKey(),selected=tcSelectedDate||today;
      const mon=tcCalendarMonday(),sun=new Date(mon);sun.setDate(mon.getDate()+6);
      const days=Array.from({length:7},(_,i)=>{
        const d=new Date(mon);d.setDate(mon.getDate()+i);
        const key=dateKey(d),planned=tcScheduledOn(key)||(key===today&&tcCourseDue());
        const done=TC_course.history.some(h=>h.courseMode==='course'&&h.date===key);
        const test=TC_course.tests.some(t=>t.date===key)||TC_course.masteryTests.some(t=>t.date===key);
        const dueTest=key===today&&(tcTestDue()||tcMasteryDue()),dueAux=key===today&&tcAuxDue();
        const missed=key<today&&planned&&!done&&!test;
        const type=test?'ТЕСТ':done?'ГОТОВО':dueTest?'ТЕСТ':dueAux?'К№2':missed?'ПРОП.':planned?'КУРС':TC_course.cycleStartDate&&key<TC_course.cycleStartDate?'ДО СТ.':tcExtraExercises().length?'ДОП.':'ОТД.';
        const status=(key===today?' tcWeekToday':'')+(key===selected?' tcWeekSelected':'');
        return '<button type="button" class="tcWeekDay'+status+'" aria-pressed="'+(key===selected?'true':'false')+'" onclick="tcSelectCourseDay(\''+key+'\')"><b>'+names[i]+'</b><span>'+d.getDate()+'</span><small>'+type+'</small></button>';
      });
      return '<div class="tcWeekNav"><button type="button" onclick="tcShiftCourseWeek(-1)" aria-label="Предыдущая неделя">‹</button><span>'+fmtKeyDate(dateKey(mon),false)+' — '+fmtKeyDate(dateKey(sun),false)+'</span><button type="button" onclick="tcShiftCourseWeek(1)" aria-label="Следующая неделя">›</button><button type="button" class="tcWeekReset" onclick="tcShowCourseToday()">Сегодня</button></div>'+
        '<div class="tcWeekCalendar" aria-label="Расписание недели">'+days.join('')+'</div>';
    }

    function tcBaseExerciseAvailable(ex){
      if(!ex)return false;
      if(['weightedPull','bandPull','benchDip','dipBars','australianPull','towelHang'].includes(ex.id))return false;
      const name=String(ex.name||'').toLowerCase();
      if(/резин|гантел|гир|штанг|весом|отягощ|стул|скамь|полотен|брус|кольц|блок|тренаж|низк.*(перекладин|турник)|австралийск|эспандер|шведск.*стенк/i.test(name))return false;
      return true;
    }
    function tcExtraExercises(){return selected().filter(e=>!TC_PULL_HEAVY_IDS.has(e.id)&&e.g!=='Турник'&&e.g!=='Элементы'&&tcBaseExerciseAvailable(e))}
    function tcConflictExercises(){return selected().filter(e=>TC_PULL_HEAVY_IDS.has(e.id)||e.g==='Турник'||e.g==='Элементы')}
    function tcUnitForMetric(m){return m==='time'||m==='time_side'?'сек.':m==='reps_side'?'повт./стор.':m==='weighted'?'повт.':'повт.'}
    function tcItemLoad(def){return def.metric==='weighted'?TC_course.weightedLoad:0}
    function tcLastActualFor(id){for(const h of TC_course.history){const d=(h.details||[]).find(x=>x.id===id);if(d&&Array.isArray(d.actual)){for(let i=d.actual.length-1;i>=0;i--)if(Number.isFinite(+d.actual[i])&&+d.actual[i]>0)return +d.actual[i]}}return null}
    function tcSchemeLabel(def){
      const s=def.scheme||{};
      if(s.label)return s.label;
      if(s.type==='fixed')return String(s.value);
      if(s.type==='max')return 'MAX';
      if(s.type==='percent')return Math.round((s.pct||0)*100)+'% MAX';
      if(s.type==='range_reps')return s.min+'–'+s.max;
      if(s.type==='timed')return String(s.value);
      if(s.type==='choice')return 'НА ВЫБОР';
      return '—';
    }

    function tcVariantKey(def){return def&&def.scheme&&def.scheme.type==='percent'&&!def.scheme.ref?def.id:null}
    function tcVariantMax(def){
      const key=tcVariantKey(def);if(!key)return null;
      if(key==='c_asym80'){
        const left=+TC_course.exerciseMax.c_asym80_left,right=+TC_course.exerciseMax.c_asym80_right;
        return Number.isInteger(left)&&left>0&&Number.isInteger(right)&&right>0?Math.min(left,right):null;
      }
      const n=+TC_course.exerciseMax[key];
      return Number.isInteger(n)&&n>0?n:null;
    }
    function tcUncalibrated(defs){
      return defs.filter(def=>tcVariantKey(def)&&tcVariantMax(def)==null);
    }
    function tcSchemeTarget(def){
      const s=def.scheme||{};
      if(s.type==='fixed'||s.type==='timed')return Math.max(0,+s.value||0);
      if(s.type==='percent'){
        const base=s.ref==='pull'?TC_course.pullMax:tcVariantMax(def);
        return base!=null&&base>0?Math.max(1,Math.floor(base*(+s.pct||0))):null;
      }
      if(s.type==='range_reps')return Math.max(1,+s.min||1);
      if(s.type==='max'&&s.ref==='pull')return TC_course.pullMax;
      return tcLastActualFor(def.id)||1;
    }
    function tcDisplayScheme(def){
      const s=def.scheme||{};
      if(s.type==='percent')return tcSchemeTarget(def)==null?'MAX НЕ УКАЗАН':tcSchemeTarget(def)+' · '+Math.round(s.pct*100)+'% от '+(s.ref==='pull'?TC_course.pullMax:tcVariantMax(def));
      return tcSchemeLabel(def);
    }

    function tcAdvancedChoicePool(){
      if(TC_course.level!==7)return[];
      if(TC_course.goal==='muscleup')return tcRunnableDefs(TC_COURSE[5].complexes[1].items);
      return tcRunnableDefs(Object.values(TC_COURSE[6].complexes).flatMap(c=>c.items));
    }
    function tcAdvancedSelected(){
      const chosen=TC_course.advancedChoices[TC_course.goal]||[];
      const pool=tcAdvancedChoicePool();
      return chosen.length===2&&chosen[0]!==chosen[1]&&
        chosen.every(id=>pool.some(def=>def.id===id));
    }
    function tcResolvedCourseDefs(c){
      if(TC_course.level!==7||!tcAdvancedSelected())return c.def.items;
      const picked=TC_course.advancedChoices[TC_course.goal],pool=tcAdvancedChoicePool();
      let index=0;
      return c.def.items.map(def=>{
        if(def.scheme&&def.scheme.type==='choice'){
          const src=pool.find(x=>x.id===picked[index]);
          index++;
          return src?{...src,id:src.id+'_lv7_'+index}:def;
        }
        return def;
      });
    }
    window.tcOpenAdvancedChoiceSheet=function(){
      if(TC_course.level!==7)return;
      const pool=tcAdvancedChoicePool(),chosen=TC_course.advancedChoices[TC_course.goal]||[];
      q('sheetbox').innerHTML='<div class="sheettitle">Упражнения для 7-го уровня</div>'+
        '<div class="sub" style="margin-top:6px">По курсу выберите два разных упражнения из '+
        (TC_course.goal==='muscleup'?'комплекса №1 пятого уровня':'любого комплекса шестого уровня')+
        '. Их объём и отдых будут взяты из соответствующих комплексов; PDF седьмого уровня не устанавливает для них отдельных чисел.</div>'+
        pool.map(def=>'<label style="display:flex;gap:10px;align-items:flex-start;padding:11px 3px;border-bottom:1px solid #34414d">'+
          '<input type="checkbox" class="tcAdvancedSelect" value="'+def.id+'" '+
          (chosen.includes(def.id)?'checked':'')+'>'+
          '<span><b>'+def.name+'</b><br><small>'+tcProgramPrescription(def)+' · отдых '+tcCourseRestText(def.rest)+'</small></span></label>').join('')+
        '<div id="tcAdvancedError" class="meta" style="margin-top:9px">Выберите ровно два упражнения.</div>'+
        '<button class="btn yellow full" style="margin-top:12px" onclick="tcSaveAdvancedChoices()">Сохранить выбор</button>'+
        '<button class="btn ghost full" style="margin-top:8px" onclick="closeSheet()">Отмена</button>';
      q('sheet').classList.add('open');
    };
    window.tcSaveAdvancedChoices=function(){
      if(TC_course.level!==7)return;
      const ids=Array.from(document.querySelectorAll('.tcAdvancedSelect:checked')).map(el=>el.value);
      const pool=tcAdvancedChoicePool();
      if(ids.length!==2||ids[0]===ids[1]||ids.some(id=>!pool.some(x=>x.id===id))){
        const error=document.getElementById('tcAdvancedError');
        if(error)error.textContent='Для продолжения требуется выбрать ровно два разных упражнения.';
        return;
      }
      TC_course.advancedChoices[TC_course.goal]=ids;
      tcSaveCourse();closeSheet();render();
    };

    function tcCalibrationDefs(mode,all=false){
      const raw=tcRunnableDefs(mode==='aux'&&[3,6].includes(TC_course.level)?TC_COURSE[TC_course.level].complexes[2].items:tcResolvedCourseDefs(tcCourseComplex()));
      return all?raw.filter(def=>tcVariantKey(def)):tcUncalibrated(raw);
    }
    function tcCalibrationCard(mode){
      if(!tcCalibrationDefs(mode).length)return '';
      return '<div class="todayCard" style="border-color:#d5a84e;margin-top:10px">'+
        '<div class="dateBig">Укажите контрольные максимумы</div>'+
        '<div class="meta">Для расчёта повторений в отдельных вариантах подтягиваний. Максимум обычных подтягиваний не подменяет результат другого упражнения.</div>'+
        '<button class="btn yellow full" style="margin-top:10px" data-mode="'+mode+'" onclick="tcOpenCourseCalibration(this.dataset.mode)">Ввести результаты</button></div>';
    }
    window.tcOpenCourseCalibration=function(mode){
      if(W)return;
      const all=mode==='main:all'||mode==='aux:all';
      const kind=mode.startsWith('aux')?'aux':'main';
      const defs=tcCalibrationDefs(kind,all);
      if(!defs.length)return;
      const fields=defs.map(def=>{
        const sides=def.id==='c_asym80';
        const names=sides?[
          {key:def.id+'_left',title:'Максимум на левую руку'},
          {key:def.id+'_right',title:'Максимум на правую руку'}
        ]:[{key:def.id,title:'Максимум повторений'}];
        return '<div class="tcInfoBlock"><h3>'+tcProgramEscape(def.name)+'</h3>'+
          names.map(field=>'<label style="display:block;font-size:13px;margin:8px 0">'+field.title+
          '<input type="number" id="tcCal_'+field.key+'" value="'+(TC_course.exerciseMax[field.key]||'')+'" min="1" step="1" inputmode="numeric" style="display:block;width:100%;box-sizing:border-box;padding:10px;background:#0c1218;color:#fff;border:1px solid #44515b;border-radius:9px;margin-top:5px"></label>').join('')+
          (sides?'<div class="meta">Для общего числа повторений на каждую сторону используется меньший из двух результатов. Это правило расчёта TurnikCoach, а не отдельное указание автора.</div>':'')+'</div>';
      }).join('');
      q('sheetbox').innerHTML='<div class="sheettitle">Контрольные максимумы</div>'+
        '<div class="sub">Введите реальные результаты каждого варианта подтягиваний. Без них назначать процент от MAX нельзя.</div>'+
        fields+'<div id="tcCalError" class="meta" style="margin-top:8px"></div>'+
        '<button class="btn yellow full" data-mode="'+mode+'" onclick="tcSaveCourseCalibration(this.dataset.mode)">Сохранить</button>'+
        '<button class="btn ghost full" style="margin-top:8px" onclick="closeSheet()">Отмена</button>';
      q('sheet').classList.add('open');
    };
    window.tcSaveCourseCalibration=function(mode){
      const all=mode==='main:all'||mode==='aux:all';
      const kind=mode.startsWith('aux')?'aux':'main';
      const defs=tcCalibrationDefs(kind,all),pending={};
      for(const def of defs){
        const keys=def.id==='c_asym80'?[def.id+'_left',def.id+'_right']:[def.id];
        for(const key of keys){
          const el=document.getElementById('tcCal_'+key);
          if(!el)return;
          const raw=el.value.trim(),n=Number(raw);
          if(!raw||!Number.isSafeInteger(n)||n<1){
            el.style.borderColor='#ff7777';
            const warn=document.getElementById('tcCalError');
            if(warn)warn.textContent='Для каждого упражнения укажите целый положительный максимум.';
            return;
          }
          pending[key]=n;
        }
      }
      Object.assign(TC_course.exerciseMax,pending);
      tcSaveCourse();closeSheet();render();
    };

    function tcBuildItemsFor(defs){
      return tcRunnableDefs(defs).map(def=>{
        const target=tcSchemeTarget(def),labels=Array.from({length:def.sets},()=>tcDisplayScheme(def));
        const e={id:def.id,name:def.name,metric:def.metric||'reps',max:TC_course.pullMax,load:tcItemLoad(def),courseDef:def,media:'',muscles:[]};
        return{e,def,plan:Array.from({length:def.sets},()=>target),planLabels:labels,actual:[]};
      });
    }
    function tcNeedsWorkingWeight(mode){
      const defs=tcRunnableDefs(mode==='aux'&&[3,6].includes(TC_course.level)?
        TC_COURSE[TC_course.level].complexes[2].items:tcResolvedCourseDefs(tcCourseComplex()));
      return defs.some(def=>def.metric==='weighted')&&!(TC_course.weightedLoad>0);
    }
    function tcWorkingWeightCard(mode){
      return '<div class="todayCard" style="border-color:#d5a84e;margin-top:10px">'+
        '<div class="dateBig">Назначьте рабочий вес</div>'+
        '<div class="meta">В комплексе предусмотрены подтягивания с дополнительным весом. Конкретный вес необходимо указать самостоятельно; приложение не определяет его без фактического результата.</div>'+
        '<button class="btn yellow full" style="margin-top:10px" data-mode="'+mode+
        '" onclick="tcOpenWorkingWeight(this.dataset.mode)">Указать дополнительный вес</button></div>';
    }
    window.tcOpenWorkingWeight=function(mode){
      if(W)return;
      q('sheetbox').innerHTML='<div class="sheettitle">Дополнительный вес</div>'+
        '<div class="sub">Введите фактически выбранный вес отягощения в килограммах. В PDF для этого комплекса требуется максимальный рабочий вес, но конкретная масса не указана.</div>'+
        '<input type="number" id="tcWorkingWeightInput" min="0.5" step="0.5" inputmode="decimal" value="'+(TC_course.weightedLoad||'')+'" style="width:100%;box-sizing:border-box;margin:14px 0;background:#0c1218;color:#fff;padding:11px;border:1px solid #344250;border-radius:9px">'+
        '<div id="tcWorkingWeightError" class="meta"></div>'+
        '<button class="btn yellow full" data-mode="'+(mode==='aux'?'aux':'main')+'" onclick="tcSaveWorkingWeight(this.dataset.mode)">Сохранить</button>'+
        '<button class="btn ghost full" style="margin-top:8px" onclick="closeSheet()">Отмена</button>';
      q('sheet').classList.add('open');
    };
    window.tcSaveWorkingWeight=function(mode){
      const el=document.getElementById('tcWorkingWeightInput');
      const raw=el&&el.value.trim()||'',value=Number(raw);
      if(!raw||!Number.isFinite(value)||value<=0||value>1000){
        const msg=document.getElementById('tcWorkingWeightError');
        if(msg)msg.textContent='Укажите положительное значение дополнительного веса в килограммах.';
        return;
      }
      TC_course.weightedLoad=value;
      const wp=state.ex.find(e=>e.id==='weightedPull');if(wp)wp.load=value;
      tcSaveCourse();save();closeSheet();render();
    };

    function tcBuildCourseItems(seqIndex=TC_course.courseSeq){const c=tcCourseComplex(seqIndex);return c.def?tcBuildItemsFor(tcResolvedCourseDefs(c)):[]}
    function tcBuildAuxItems(){return [3,6].includes(TC_course.level)?tcBuildItemsFor(TC_COURSE[TC_course.level].complexes[2].items):[]}
    function tcBuildExtraItems(){const idx=TC_course.extraSeq%3;return tcExtraExercises().map(e=>({e,plan:pres(e,idx),actual:[]}))}
    function tcCourseRestText(r){if(!r)return'—';if(r.type==='fixed')return Math.round(r.sec/60)+' мин';if(r.type==='range')return Math.round(r.min/60)+'–'+Math.round(r.max/60)+' мин';return r.label||'по усмотрению'}
    function tcAdaptiveCourseRest(def,target,actual,skipped){
      const r=def.rest||{type:'manual',label:'по усмотрению'};
      if(r.type==='fixed')return{manual:false,seconds:r.sec,note:'По курсу: '+tcCourseRestText(r)};
      if(r.type==='manual')return{manual:true,label:r.label||'по усмотрению',note:'По курсу: '+(r.label||'по усмотрению')};
      let sec=Math.round((r.min+r.max)/2/15)*15;
      const st=def.scheme||{};
      if(st.type==='max')sec=r.max;
      else if(skipped)sec=r.max;
      else if(target>0&&Number.isFinite(+actual)){
        const ratio=(+actual||0)/target;if(ratio<.9)sec=r.max;else if(ratio>1.2)sec=r.min;
      }
      sec=tcClamp(sec,r.min,r.max);
      return{manual:false,seconds:sec,note:'Диапазон курса '+tcCourseRestText(r)+' · TurnikCoach выбрал '+Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')};
    }

    function tcCourseCardHtml(){
      const l=tcCourseLevel(),c=tcCourseComplex(),enabled=TC_course.enabled;
      return '<div class="card" id="tcCourseCard" style="margin-bottom:12px;border-color:'+(enabled?'#ffd84d':'#2c3945')+'">'+
        '<div class="row between"><div class="grow"><div class="k">ПРОГРАММА</div><div class="strong" style="font-size:18px;margin-top:3px">Курс Морозова</div><div class="meta">«Подтягивания с нуля до киборга»</div></div><span class="tag '+(enabled?'':'stage4')+'">'+(enabled?'ВКЛЮЧЁН':'ВЫКЛЮЧЕН')+'</span></div>'+
        (enabled?'<div class="tcInfoBlock"><h3>Оборудование: только турник</h3><p>В тренировочный план не включаются упражнения, требующие резины, отягощения, полотенца, стула или низкой перекладины.</p></div><div class="tcInfoBlock"><h3>'+l.title+'</h3><p><b>Цель:</b> '+tcCourseGoalName(TC_course.goal)+'<br><b>Следующий:</b> '+(c.def?c.def.name:'—')+'<br><b>Текущий максимум:</b> '+TC_course.pullMax+'<br><b>Частота по курсу:</b> '+l.frequency+'</p></div>':'<div class="sub" style="margin-top:10px">Отдельная система тренировок: уровни, комплексы, проценты, MAX, отдых и контрольные критерии берутся из курса. Остальные упражнения TurnikCoach можно использовать отдельно.</div>')+
        '<button class="btn yellow full" style="margin-top:12px" onclick="tcOpenCourseProgram()">Программа курса</button>'+ '<button class="btn ghost full" style="margin-top:8px" onclick="tcOpenCourseSettings()">'+(enabled?'Настройки курса':'Подключить курс')+'</button></div>';
    }
    window.tcOpenCourseSettings=function(){
      tcNormalizeGoal();const l=tcCourseLevel(),goals=tcGoalOptions(TC_course.level);
      const box=q('sheetbox');
      box.innerHTML='<div class="sheettitle">Курс Морозова</div><div class="sub" style="margin-top:6px">Оборудование: только турник. В исходной программе доступны все упражнения автора, но задания с дополнительными снарядами не назначаются. Упражнения без оборудования из обычного каталога доступны отдельно.</div>'+
      '<div class="tcInfoBlock"><h3>Состояние</h3><p><label style="display:flex;gap:9px;align-items:center"><input id="tcCourseEnabled" type="checkbox" '+(TC_course.enabled?'checked':'')+'> Включить курс Морозова</label></p></div>'+
      '<div class="tcInfoBlock"><h3>Уровень</h3><p><select id="tcCourseLevel" style="width:100%;margin-top:4px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px">'+Object.keys(TC_COURSE).map(n=>'<option value="'+n+'" '+(+n===TC_course.level?'selected':'')+'>'+n+' · '+TC_COURSE[n].title+'</option>').join('')+'</select></p></div>'+
      '<div class="tcInfoBlock"><h3>Текущий максимум</h3><p><input id="tcCourseMax" type="number" min="1" value="'+TC_course.pullMax+'" style="width:100%;box-sizing:border-box;margin-top:4px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px"></p></div>'+
      '<div class="tcInfoBlock"><h3>Цель</h3><p><select id="tcCourseGoal" style="width:100%;margin-top:4px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px">'+goals.map(g=>'<option value="'+g[0]+'" '+(g[0]===TC_course.goal?'selected':'')+'>'+g[1]+'</option>').join('')+'</select></p></div>'+
      ((TC_course.level===4&&TC_course.goal==='quantity')||TC_course.level===2?'<div class="tcInfoBlock"><h3>Основной комплекс · недельный план</h3><p>Число тренировок: <select id="tcWeeklySessions" style="background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:8px;padding:7px">'+(TC_course.level===2?'<option value="2" '+(TC_course.weeklySessions===2?'selected':'')+'>2 раза в неделю</option>':'')+'<option value="3" '+(TC_course.weeklySessions===3?'selected':'')+'>3 раза в неделю</option><option value="4" '+(TC_course.weeklySessions===4?'selected':'')+'>4 раза в неделю</option></select><br><br>Дни занятий рассчитываются от даты начала цикла. Частота и интервалы сохраняются; при четырёх занятиях два тренировочных дня на границе недель могут идти подряд.</p></div>':'')+
      '<div class="tcInfoBlock"><h3>Начало тренировочного цикла</h3><p><input id="tcCycleStartDate" type="date" value="'+(TC_course.cycleStartDate||dateKey())+'" style="box-sizing:border-box;width:100%;margin-top:5px;background:#0c1218;color:#fff;color-scheme:dark;border:1px solid #3a4653;border-radius:8px;padding:10px"></p><p class="meta">Первое занятие назначается на выбранную дату независимо от дня недели. Предыдущие результаты и история не изменяются.</p><div id="tcCycleDateError" class="meta" style="color:#ffd84d"></div></div>'+
      ([3,6].includes(TC_course.level)?'<div class="tcInfoBlock"><h3>Вспомогательный комплекс №2</h3><p><label style="display:flex;gap:9px;align-items:flex-start"><input id="tcAuxEnabled" type="checkbox" '+(TC_course.auxEnabled[TC_course.level]?'checked':'')+'><span>Предлагать отдельную дополнительную тренировку по комплексу №2</span></label></p>'+
        (TC_course.level===3?'<p>Периодичность: <select id="tcAuxInterval3" style="background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:8px;padding:7px"><option value="7" '+(TC_course.auxInterval3===7?'selected':'')+'>Раз в 7 дней</option><option value="10" '+(TC_course.auxInterval3===10?'selected':'')+'>Раз в 10 дней</option></select></p>':'<p>Не чаще одного раза в 10 дней.</p>')+
        '<p class="meta">Это дополнительная тяговая работа из PDF; она не заменяет основной комплекс и не назначается на день основной тренировки или испытания. Включается по вашему выбору.</p></div>':'')+
      (tcCalibrationDefs('main',true).length?'<button class="btn ghost full" style="margin-top:8px" onclick="tcOpenCourseCalibration(\'main:all\')">Изменить максимумы отдельных вариантов</button>':'')+
      ([3,6].includes(TC_course.level)&&tcCalibrationDefs('aux',true).length?'<button class="btn ghost full" style="margin-top:8px" onclick="tcOpenCourseCalibration(\'aux:all\')">Изменить максимумы вспомогательного комплекса</button>':'')+
            '<div class="tcInfoBlock"><h3>Оборудование</h3><p>Только турник. Упражнения с резиной, отягощением, полотенцем, стулом и низкой перекладиной сохраняются в справочнике курса, но не включаются в назначаемую тренировку.</p></div>'+ 
            (l.supplement?'<div class="tcInfoBlock"><h3>Дополнительные подтягивания по курсу</h3><p><label style="display:flex;gap:9px;align-items:flex-start"><input id="tcCourseSupplement" type="checkbox" '+(TC_course.authorSupplement?'checked':'')+'><span>'+l.supplement+'</span></label></p></div>':'')+
      (TC_course.level===4&&TC_course.goal==='quantity'?'<div class="tcInfoBlock"><h3>Контроль максимума · TurnikCoach</h3><p>Цель: <input id="tcTargetMax" type="number" min="1" step="1" value="'+TC_course.targetMax+'" style="width:65px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:8px;padding:7px"> повторений.<br><br>Проверять каждые <select id="tcTestWeeks" style="background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:8px;padding:7px">'+[2,3,4].map(n=>'<option value="'+n+'" '+(TC_course.testPeriodWeeks===n?'selected':'')+'>'+n+' недели</option>').join('')+'</select><br><br>Контроль назначается после восстановления; результат сохраняется отдельно от основной тренировки.</p></div>':'')+
      (TC_course.level===7?'<button class="btn ghost full" style="margin-top:8px" onclick="tcOpenAdvancedChoiceSheet()">Выбрать два упражнения 7-го уровня</button>':'')+
      '<button class="btn yellow full" style="margin-top:14px" onclick="tcSaveCourseSettings()">Сохранить</button><button class="btn ghost full" style="margin-top:8px" onclick="closeSheet()">Отмена</button>';
      q('sheet').classList.add('open');
      const levelEl=document.getElementById('tcCourseLevel');
      if(levelEl)levelEl.onchange=()=>{
        const select=document.getElementById('tcCourseGoal');if(!select)return;
        const choices=tcGoalOptions(+levelEl.value||TC_course.level),previous=select.value;
        select.innerHTML=choices.map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('');
        select.value=choices.some(x=>x[0]===previous)?previous:choices[0][0];
      };
    };
    window.tcSaveCourseSettings=function(){
      const oldLevel=TC_course.level,oldGoal=TC_course.goal;
      const enabled=document.getElementById('tcCourseEnabled'),level=document.getElementById('tcCourseLevel'),mx=document.getElementById('tcCourseMax'),goal=document.getElementById('tcCourseGoal'),load=document.getElementById('tcCourseLoad'),sup=document.getElementById('tcCourseSupplement');
      const auxEl=document.getElementById('tcAuxEnabled'),auxIntervalEl=document.getElementById('tcAuxInterval3');if(auxEl&&[3,6].includes(oldLevel))TC_course.auxEnabled[oldLevel]=!!auxEl.checked;if(auxIntervalEl)TC_course.auxInterval3=[7,10].includes(+auxIntervalEl.value)?+auxIntervalEl.value:10;
      const startEl=document.getElementById('tcCycleStartDate');
      if(startEl){
        const raw=startEl.value,parsed=/^\d{4}-\d{2}-\d{2}$/.test(raw)?tcDateFromKey(raw):null;
        if(!parsed||!Number.isFinite(parsed.getTime())||dateKey(parsed)!==raw){
          const error=document.getElementById('tcCycleDateError');
          if(error)error.textContent='Укажите действительную дату начала цикла.';
          return;
        }
        TC_course.cycleStartDate=raw;
      }
      const weeklyEl=document.getElementById('tcWeeklySessions');if(weeklyEl)TC_course.weeklySessions=[2,3,4].includes(+weeklyEl.value)?+weeklyEl.value:3;
      const targetEl=document.getElementById('tcTargetMax'),weeksEl=document.getElementById('tcTestWeeks');if(targetEl)TC_course.targetMax=Math.max(1,Math.floor(+targetEl.value||TC_course.targetMax));if(weeksEl)TC_course.testPeriodWeeks=[2,3,4].includes(+weeksEl.value)?+weeksEl.value:3;
      TC_course.enabled=!!(enabled&&enabled.checked);TC_course.level=tcClamp(+(level&&level.value)||TC_course.level,1,7);TC_course.pullMax=Math.max(1,Math.floor(+(mx&&mx.value)||TC_course.pullMax));TC_course.goal=(goal&&goal.value)||TC_course.goal;TC_course.weightedLoad=Math.max(0,+(load&&load.value)||0);if(sup)TC_course.authorSupplement=!!sup.checked;tcNormalizeGoal();
      if(TC_course.level===4&&TC_course.goal==='quantity'&&TC_course.weeklySessions<3)TC_course.weeklySessions=3;
      if(TC_course.level!==oldLevel||TC_course.goal!==oldGoal){
        TC_course.courseSeq=0;TC_course.pendingTransition=null;
        if(!weeklyEl)TC_course.weeklySessions=3;
        TC_course.testAnchorDate='';TC_course.lastTestDate='';TC_course.testDeferredUntil='';
      }
      if(TC_course.enabled){state.ex.forEach(e=>{if(TC_PULL_CONFLICT_IDS.has(e.id)){e.sel=false;e.main=false}})}
      const pull=state.ex.find(e=>e.id==='pull');if(pull)pull.max=TC_course.pullMax;const wp=state.ex.find(e=>e.id==='weightedPull');if(wp)wp.load=TC_course.weightedLoad;
      tcSelectedDate='';tcWeekOffset=0;
      tcSaveCourse();save();closeSheet();render();
    };

    function tcInjectCourseUiStyles(){
      if(document.getElementById('tcCourseUiStyles'))return;
      const st=document.createElement('style');st.id='tcCourseUiStyles';
      st.textContent="#sheet.open{overflow:hidden!important}#sheet .sheetbox{max-height:calc(100vh - 22px)!important;max-height:min(88dvh,calc(100vh - 22px))!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding-bottom:max(28px,calc(18px + env(safe-area-inset-bottom)))!important}#sheet .sheetbox::-webkit-scrollbar{width:4px}#sheet .sheetbox::-webkit-scrollbar-thumb{background:#475563;border-radius:999px}.tcExtrasDetails{margin:10px 0 16px;border:1px solid #2e3945;border-radius:16px;background:#111820;overflow:hidden}.tcExtrasSummary{list-style:none;display:flex;align-items:center;gap:9px;padding:14px;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent}.tcExtrasSummary::-webkit-details-marker{display:none}.tcExtrasTri{display:inline-block;font-size:15px;color:#ffd84d;transition:transform .16s ease;transform:rotate(0deg)}.tcExtrasDetails[open] .tcExtrasTri{transform:rotate(90deg)}.tcExtrasSummaryText{flex:1;min-width:0}.tcExtrasSummaryTitle{font-weight:900;font-size:15px;color:#fff}.tcExtrasSummaryMeta{font-size:11px;color:#939eac;margin-top:2px}.tcExtrasBody{padding:0 10px 10px}.tcExtrasBody>.card,.tcExtrasBody>.catalogGroup{margin-top:8px}#workout #wplan.tcCoursePlan{min-width:0;max-width:58vw;text-align:right;line-height:1.2;flex-shrink:1}#workout #wplan.tcCoursePlan .tcPlanMain{display:block;color:#ffd84d;font-size:clamp(17px,5vw,23px);font-weight:950;white-space:pre-wrap;overflow-wrap:normal;letter-spacing:.02em}#workout #wplan.tcCoursePlan .tcPlanSub{display:block;color:#9aa6b2;font-size:11px;font-weight:700;margin-top:5px;white-space:nowrap}#workout #wplan.tcCoursePlan .tcPlanSide{display:block;color:#c9d1d9;font-size:10px;font-weight:700;margin-top:3px;white-space:nowrap}";
      st.textContent+='.tcWeekCalendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin:10px 0 12px}.tcWeekDay{min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;border:1px solid #33414b;background:#151f28;border-radius:9px;padding:6px 1px;color:#c6d1db;font-size:10px}.tcWeekDay b{font-size:10px}.tcWeekDay span{font-size:13px;font-weight:850}.tcWeekDay small{font-size:8px;font-weight:800;color:#a5b4c1}.tcWeekToday{border-color:#ffd84d;background:#2a281b;color:#ffd84d}.tcWeekToday small{color:#ffd84d}';
      st.textContent+='.tcWeekNav{display:flex;align-items:center;gap:6px;margin-top:12px;color:#b9c4cf;font-size:11px}.tcWeekNav span{flex:1;min-width:0;text-align:center}.tcWeekNav button{border:1px solid #354351;border-radius:8px;background:#202b34;color:#fff;min-width:30px;min-height:32px;font-size:18px;cursor:pointer}.tcWeekNav button.tcWeekReset{font-size:11px;padding:0 7px}.tcWeekDay{font-family:inherit;appearance:none;cursor:pointer;touch-action:manipulation}.tcWeekDay.tcWeekSelected{border:2px solid #ffd84d;box-shadow:inset 0 0 0 1px rgba(255,216,77,.35);background:#352f1e;color:#ffe18a}.tcWeekDay.tcWeekSelected small{color:#ffe18a}.tcCoursePreview .dateBig{overflow-wrap:break-word}';
      st.textContent+='.tcDoneStrip{margin:8px 0 12px;padding:13px 14px 14px;border:1px solid #3d5b46;border-radius:16px;background:#171d23;box-shadow:none}.tcDoneStripHead{display:flex;align-items:flex-start;gap:10px}.tcDoneStripHead>div{flex:1;min-width:0}.tcDoneStripTitle{font-size:17px;line-height:1.2;font-weight:900;color:#f6f7f9}.tcDoneStripText{margin-top:5px;font-size:12px;line-height:1.38;color:#aeb8c2}.tcDoneBadge{flex:0 0 auto;font-size:9px;font-weight:900;letter-spacing:.04em;color:#d9ffe2;border:1px solid #3d5b46;background:#17251b;border-radius:999px;padding:5px 7px}.tcUndoTodayCourseBtn{position:relative;z-index:4;pointer-events:auto!important;touch-action:manipulation;margin-top:11px!important;min-height:46px!important;border-radius:12px!important;font-size:13px!important}.tcAfterMainCard .btn{min-height:48px;touch-action:manipulation}.tcAfterMainCard{margin-top:10px}';
      document.head.appendChild(st);
    }

    function tcCollapseExtraCatalog(host){
      if(!TC_course.enabled||!host)return;
      if(document.getElementById('tcExtrasDetails'))return;
      const selectedExtra=tcExtraExercises().length;
      const details=document.createElement('details');details.id='tcExtrasDetails';details.className='tcExtrasDetails';details.open=!!window.__tcExtrasOpen;
      const summary=document.createElement('summary');summary.className='tcExtrasSummary';
      summary.innerHTML='<span class="tcExtrasTri">▶</span><div class="tcExtrasSummaryText"><div class="tcExtrasSummaryTitle">Дополнительные упражнения TurnikCoach</div><div class="tcExtrasSummaryMeta">'+(selectedExtra?('Выбрано: '+selectedExtra):'Свернуто · нажми, чтобы выбрать пресс, ноги, отжимания и другое')+'</div></div>';
      const body=document.createElement('div');body.className='tcExtrasBody';
      [...host.children].forEach(node=>{if(node.id!=='tcCourseCard')body.appendChild(node)});
      details.appendChild(summary);details.appendChild(body);details.addEventListener('toggle',()=>{window.__tcExtrasOpen=details.open});host.appendChild(details);
    }


    function tcSanitizeSelectedEquipment(){
      let dirty=false;
      for(const e of state.ex){
        if(!tcBaseExerciseAvailable(e)&&(e.sel||e.main)){
          e.sel=false;e.main=false;dirty=true;
        }
      }
      if(dirty)save();
      return dirty;
    }
    function tcDisableUnavailableCatalog(host){
      host.querySelectorAll('.exercise').forEach(row=>{
        const name=row.querySelector('.strong');
        if(!name)return;
        const ex=state.ex.find(e=>e.name===name.textContent.trim());
        if(!ex||tcBaseExerciseAvailable(ex))return;
        row.querySelectorAll('input,button').forEach(control=>{control.disabled=true});
        if(!row.querySelector('.tcEquipmentUnavailable')){
          const badge=document.createElement('div');
          badge.className='meta tcEquipmentUnavailable';
          badge.textContent='Недоступно: требуется другое оборудование';
          (name.parentNode||row).appendChild(badge);
        }
      });
    }
    function tcDecorateCourseCatalog(){
      const host=q('exerciseList');if(!host)return;
      tcDisableUnavailableCatalog(host);
      const old=document.getElementById('tcCourseCard');if(old)old.remove();
      const oldDetails=document.getElementById('tcExtrasDetails');
      if(oldDetails&&oldDetails.parentNode===host){const body=oldDetails.querySelector('.tcExtrasBody');if(body){[...body.children].forEach(n=>host.appendChild(n))}oldDetails.remove()}
      host.insertAdjacentHTML('afterbegin',tcCourseCardHtml());
      const head=document.querySelector('#exercise .head .sub');if(head)head.textContent=TC_course.enabled?'Подтягивания ведёт отдельный курс Морозова. Дополнительные упражнения ниже свернуты и не вмешиваются в структуру курса.':'Можно использовать обычный конструктор либо подключить отдельный курс Морозова для подтягиваний.';
      if(TC_course.enabled){
        host.querySelectorAll('.catalogGroup').forEach(g=>{const name=g.querySelector('.catalogHead .strong');if(name&&(name.textContent||'').trim()==='Турник')g.style.display='none'});
        const summary=host.querySelector('.catalogSummary .meta');if(summary)summary.textContent='Дополнительные упражнения TurnikCoach. Тяговая часть курса рассчитывается отдельно.';
        tcCollapseExtraCatalog(host);
      }
    }


    function tcAuxInterval(){return TC_course.level===3?TC_course.auxInterval3:10}
    function tcLastAuxDate(){
      const match=TC_course.history.find(h=>h.courseMode==='auxCourse'&&h.courseLevel===TC_course.level);
      return match?match.date:'';
    }
    function tcLastPullLoadDate(){
      let last=TC_course.lastCourseDate||'';
      for(const h of TC_course.history){
        if(['course','auxCourse','supplement'].includes(h.courseMode)&&h.date>last)last=h.date;
      }
      return last;
    }
    function tcSupplementBreak(){
      const all=TC_course.history.filter(h=>h.courseMode==='supplement'&&h.date&&h.courseLevel===TC_course.level).map(h=>h.date).sort();
      if(!all.length)return false;
      const elapsed=tcDayDiff(all[0],dateKey());
      // App convention: 30-day work interval followed by a 5-day pause, repeated.
      const phase=elapsed%35;
      return elapsed>=30&&phase>=30&&phase<=34;
    }
    function tcAuxDue(){
      const level=TC_course.level,today=dateKey();
      if(![3,6].includes(level)||!tcRunnableDefs(TC_COURSE[level].complexes[2].items).length)return false;
      if(!TC_course.enabled||![3,6].includes(level)||!TC_course.auxEnabled[level])return false;
      if(!TC_course.lastCourseDate||tcScheduledOn(today)||tcCourseDue()||tcTestDue()||tcMasteryDue())return false;
      if(tcDayDiff(tcLastPullLoadDate(),today)<2)return false;
      const lastAux=tcLastAuxDate();
      if(lastAux&&tcDayDiff(lastAux,today)<tcAuxInterval())return false;
      if(TC_course.history.some(h=>h.date===today&&['supplement','auxCourse'].includes(h.courseMode)))return false;
      return true;
    }
    function tcAuxCardHtml(){
      if(!tcAuxDue())return '';
      const title='Комплекс №2 · вспомогательная работа';
      if(tcCalibrationDefs('aux').length){
        return '<div class="todayCard" style="margin-top:12px;border-color:#6a5520"><div class="dateBig">'+title+
          '</div><button class="btn yellow full" style="margin-top:10px" onclick="tcOpenCourseCalibration(\'aux\')">Указать максимумы</button></div>';
      }
      if(tcNeedsWorkingWeight('aux'))return tcWorkingWeightCard('aux');
      const items=tcBuildAuxItems();
      if(!items.length)return tcNoEquipmentCard(TC_COURSE[TC_course.level].complexes[2].items);
      return '<div class="todayCard" style="margin-top:12px;border-color:#6a5520"><div class="dateBig">'+title+
        '</div><div class="meta">Это отдельная тяговая нагрузка по курсу, а не обычные упражнения в день восстановления.</div>'+
        tcCourseRowsHtml(items)+tcAdaptationNote(TC_COURSE[TC_course.level].complexes[2].items)+
        '<button class="btn ghost full" style="margin-top:10px" onclick="tcStartAuxWorkout()">Начать адаптированную тренировку</button></div>';
    }
    window.tcStartAuxWorkout=function(){
      if(W||!tcAuxDue())return;
      if(tcCalibrationDefs('aux').length){tcOpenCourseCalibration('aux');return;}
      if(tcNeedsWorkingWeight('aux')){tcOpenWorkingWeight('aux');return;}
      const items=tcBuildAuxItems();if(!items.length)return;
      unlockAudio();
      W={mode:'auxCourse',sessionIndex:0,exerciseIndex:0,setIndex:0,items,
        actual:tcSchemeTarget(items[0].def),early:false,courseLevel:TC_course.level,
        courseComplex:2,courseGoal:TC_course.goal,adapted:tcUnavailableDefs(TC_COURSE[TC_course.level].complexes[2].items).length>0};
      go('workout');
    };
    function tcCourseRowsHtml(items){
      return items.map(x=>{
        const seq=Array.from({length:x.plan.length},()=>tcPlanToken(x.def,x)).join('  ');
        const load=x.e.load?'<span class="meta" style="white-space:nowrap">+'+x.e.load+' кг</span>':'';
        return '<div class="planrow"><div class="grow"><div class="strong" style="font-size:15px">'+x.e.name+'</div>'+load+'</div><div class="r sets" style="white-space:nowrap">'+seq+'</div></div>';
      }).join('');
    }

    function tcExtraRowsHtml(items){return items.map(x=>'<div class="planrow"><div><div class="strong" style="font-size:15px">'+x.e.name+'</div><div class="meta">Дополнительное упражнение · '+metricTitle(x.e)+'</div></div><div class="r sets">'+x.plan.join(' · ')+'</div></div>').join('')}
    function tcSupplementHtml(){
      if(!TC_course.authorSupplement||!tcCourseLevel().supplement)return'';
      if(tcSupplementBreak())return '<div class="meta" style="margin-top:10px">Дополнительные подтягивания: пятидневная разгрузка.</div>';
      if(tcAuxDue()||tcCourseDue()||tcTestDue()||tcMasteryDue())return'';
      if(TC_course.history.some(h=>h.courseMode==='supplement'&&h.date===dateKey()))return'';
      const reps=Math.max(1,Math.floor(TC_course.pullMax*.8));
      const seq=Array(10).fill(String(reps)).join('  ');
      return '<div class="todayCard" style="margin-top:12px;border-color:#6a5520"><div class="row between"><div><div class="dateBig">Дополнительные подтягивания по курсу</div></div><span class="tag stage4">КУРС</span></div><div class="planrow"><div class="grow"><div class="strong" style="font-size:15px">Классические подтягивания</div></div><div class="r sets" style="white-space:normal">'+seq+'</div></div><button class="btn ghost full" style="margin-top:10px" onclick="tcStartSupplementWorkout()">Начать</button></div>';
    }



    function tcTodayCourseRecord(){
      const rec=TC_course.history.find(h=>h.courseMode==='course');
      return rec&&rec.date===dateKey()?rec:null;
    }
    function tcTodayExtraRecord(){
      return state.history.find(h=>h&&h.date===dateKey()&&h.type==='workout'&&h.session==='доп.')||null;
    }
    function tcTodayCourseDoneHtml(extras){
      if(!tcTodayCourseRecord())return '';
      let html='<div class="tcDoneStrip" id="tcTodayCourseDoneStrip" role="status">'+
        '<div class="tcDoneStripHead"><div><div class="tcDoneStripTitle">Основной комплекс выполнен</div>'+
        '<div class="tcDoneStripText">Результат сохранён. Сегодня можно отдельно выполнить выбранные упражнения на пресс, ноги, грудь и другие нетяговые группы.</div></div>'+
        '<span class="tcDoneBadge">ГОТОВО</span></div>'+
        '<button id="tcUndoTodayCourseBtn" type="button" class="btn ghost full tcUndoTodayCourseBtn">Ошибочно завершил — отменить запись</button></div>';
      const extraDone=tcTodayExtraRecord();
      if(extraDone){
        html+='<div class="todayCard tcAfterMainCard"><div class="row between"><div><div class="dateBig">Дополнительная тренировка выполнена</div>'+
          '<div class="meta">Запись сохранена в истории. Основной комплекс курса остаётся выполненным.</div></div><span class="tag stage4">ГОТОВО</span></div></div>';
        return html;
      }
      if(extras&&extras.length){
        html+='<div class="todayCard tcAfterMainCard"><div class="row between"><div><div class="dateBig">Дополнительная тренировка</div>'+
          '<div class="meta">Не меняет последовательность курса Морозова и не повторяет сегодняшнюю тяговую нагрузку.</div></div><span class="tag">ДОП.</span></div>'+
          tcExtraRowsHtml(extras)+
          '<button id="tcStartExtraAfterCourseBtn" type="button" class="btn yellow full" style="margin-top:12px">Начать дополнительную тренировку</button></div>';
      }else{
        html+='<div class="todayCard tcAfterMainCard"><div class="dateBig">Дополнительная тренировка</div>'+
          '<div class="meta">Дополнительные упражнения не выбраны.</div>'+
          '<button id="tcChooseExtrasAfterCourseBtn" type="button" class="btn ghost full" style="margin-top:10px">Выбрать упражнения</button></div>';
      }
      return html;
    }
    function tcBindTodayDoneActions(){
      const undo=document.getElementById('tcUndoTodayCourseBtn');
      if(undo&&undo.dataset.tcBound!=='1'){
        undo.dataset.tcBound='1';
        undo.addEventListener('click',function(ev){
          if(ev){ev.preventDefault();ev.stopPropagation()}
          window.tcOpenUndoTodayCourseConfirm();
        });
      }
      const extra=document.getElementById('tcStartExtraAfterCourseBtn');
      if(extra&&extra.dataset.tcBound!=='1'){
        extra.dataset.tcBound='1';
        extra.addEventListener('click',function(ev){
          if(ev){ev.preventDefault();ev.stopPropagation()}
          window.tcStartExtraWorkout();
        });
      }
      const choose=document.getElementById('tcChooseExtrasAfterCourseBtn');
      if(choose&&choose.dataset.tcBound!=='1'){
        choose.dataset.tcBound='1';
        choose.addEventListener('click',function(ev){
          if(ev){ev.preventDefault();ev.stopPropagation()}
          go('exercise');
        });
      }
    }
    function tcUndoLatestTodayCourseRecord(today){
      const rec=TC_course.history.find(h=>h.courseMode==='course');
      if(!rec||rec.date!==today)return false;
      const idx=TC_course.history.indexOf(rec);
      if(idx>=0)TC_course.history.splice(idx,1);
      TC_course.courseSeq=Math.max(0,(+TC_course.courseSeq||0)-1);
      const previous=TC_course.history.find(h=>h.courseMode==='course');
      TC_course.lastCourseDate=previous&&previous.date||'';
      TC_course.lastCourseTs=previous&&previous.ts||0;
      if(TC_course.testAnchorDate===rec.date&&!TC_course.lastTestDate&&!previous)TC_course.testAnchorDate='';
      return true;
    }
    window.tcOpenUndoTodayCourseConfirm=function(){
      if(!tcTodayCourseRecord())return;
      const box=q('sheetbox'),sheet=q('sheet');
      if(!box||!sheet)return;
      box.innerHTML='<div class="sheettitle">Отменить сегодняшнюю тренировку?</div>'+
        '<div class="sub" style="margin-top:7px;line-height:1.45">Будет удалена только ошибочно сохранённая сегодня основная тренировка курса. Предыдущая история останется без изменений, а сегодняшнее занятие снова станет доступно для запуска.</div>'+
        '<button id="tcConfirmUndoTodayCourseBtn" type="button" class="btn danger full" style="margin-top:16px">Отменить запись</button>'+
        '<button id="tcCancelUndoTodayCourseBtn" type="button" class="btn ghost full" style="margin-top:8px">Назад</button>';
      sheet.classList.add('open');
      const yes=document.getElementById('tcConfirmUndoTodayCourseBtn');
      const no=document.getElementById('tcCancelUndoTodayCourseBtn');
      if(yes)yes.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation()}window.tcUndoTodayCourseWorkout();return false};
      if(no)no.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation()}closeSheet();return false};
    };
    window.tcUndoTodayCourseWorkout=function(){
      const rec=tcTodayCourseRecord();
      if(!rec)return;
      if(!tcUndoLatestTodayCourseRecord(dateKey()))return;
      tcSelectedDate='';tcWeekOffset=0;
      const sheet=q('sheet');if(sheet)sheet.classList.remove('open');
      tcSaveCourse();render();
    };

    function tcRenderToday(){
      const now=new Date(),due=tcCourseDue(),l=tcCourseLevel(),c=tcCourseComplex(),items=tcBuildCourseItems(),extras=tcBuildExtraItems();
      q('todayTitle').textContent=fmtDate(now);
      if(tcSelectedDate&&tcSelectedDate!==dateKey()){
        q('todayTitle').textContent=fmtDate(tcDateFromKey(tcSelectedDate));
        q('todaySub').textContent='Курс Морозова · '+l.title+' · просмотр плана';
        q('todayList').innerHTML=tcWeeklyCalendarHtml()+tcPreviewCourseCard(tcSelectedDate);
        return;
      }
      if(tcTodayCourseRecord()){
        q('todaySub').textContent='Основной комплекс выполнен · дополнительные упражнения доступны';
        q('todayList').innerHTML=tcWeeklyCalendarHtml()+tcTodayCourseDoneHtml(extras);
        tcBindTodayDoneActions();
        tcQueueDecorate();
        return;
      }
      if(tcWeeklyMode()&&tcTestDue()){
        q('todaySub').textContent='Контрольный день · курс Морозова';
        q('todayList').innerHTML=tcWeeklyCalendarHtml()+tcCourseTestCard();
        return;
      }
      if(tcMasteryDue()){
        q('todaySub').textContent='Контроль освоения уровня · курс Морозова';
        q('todayList').innerHTML=tcWeeklyCalendarHtml()+tcPendingLevelHtml()+tcMasteryCardHtml();
        return;
      }

      if(due&&TC_course.level===7&&!tcAdvancedSelected()){
        q('todaySub').textContent='Седьмой уровень · подготовка комплекса';
        q('todayList').innerHTML=tcWeeklyCalendarHtml()+
          '<div class="todayCard"><div class="dateBig">Выберите два вспомогательных упражнения</div>'+
          '<div class="meta">Седьмой уровень требует двух упражнений из предыдущего уровня. До выбора фиктивные подходы не назначаются.</div>'+
          '<button class="btn yellow full" style="margin-top:12px" onclick="tcOpenAdvancedChoiceSheet()">Выбрать упражнения</button></div>';
        return;
      }
      if(due&&!tcRunnableDefs(tcOriginalCourseDefs()).length){
        q('todaySub').textContent='Курс Морозова · ограничение оборудования';
        q('todayList').innerHTML=tcWeeklyCalendarHtml()+tcNoEquipmentCard(tcOriginalCourseDefs());
        return;
      }
      if(due&&tcCalibrationDefs('main').length){
        q('todaySub').textContent='Курс Морозова · настройка нагрузки';
        q('todayList').innerHTML=tcWeeklyCalendarHtml()+tcCalibrationCard('main');
        return;
      }
      if(due&&tcNeedsWorkingWeight('main')){
        q('todaySub').textContent='Курс Морозова · дополнительный вес';
        q('todayList').innerHTML=tcWeeklyCalendarHtml()+tcWorkingWeightCard('main');
        return;
      }
      if(due){
        q('todaySub').textContent=tcTestDue()?'Контроль прогресса · курс Морозова':'Курс Морозова · '+l.title+' · '+tcCourseGoalName(TC_course.goal);
        q('todayList').innerHTML=tcWeeklyCalendarHtml()+tcPendingLevelHtml()+tcEquipmentMasteryNote()+'<div class="todayCard"><div class="row between"><div><div class="dateBig">'+(c.def?c.def.name:'Основной комплекс')+'</div><div class="sessionNo">'+l.frequency+'</div></div><span class="tag">КУРС</span></div>'+tcCourseRowsHtml(items)+tcAdaptationNote(tcOriginalCourseDefs())+'<button class="btn yellow full" style="margin-top:12px" onclick="tcStartCourseWorkout()">'+(tcUnavailableDefs(tcOriginalCourseDefs()).length?'Начать адаптированную тренировку':'Начать основной комплекс')+'</button><button class="btn ghost full" style="margin-top:8px" onclick="tcOpenCourseInfo()">ⓘ Советы автора</button></div>'+tcMasteryCardHtml();
      }else{
        const nextKey=tcWeeklyMode()?tcNextCourseDay():'';
        const next=new Date(TC_course.lastCourseDate+'T12:00:00');next.setDate(next.getDate()+2);
        q('todaySub').textContent=tcAuxDue()?'Вспомогательный комплекс №2 · отдельная тренировка':tcWeeklyMode()?'День без основного комплекса · следующая тренировка по календарю':'День без основного комплекса · восстановление тяговой нагрузки';
        let html='<div class="todayCard"><div class="row between"><div><div class="dateBig">Сегодня без основного комплекса</div><div class="sessionNo">Следующий основной комплекс — не раньше '+fmtKeyDate(nextKey||dateKey(next),false)+'</div></div><span class="tag stage4">ВОССТАНОВЛЕНИЕ</span></div>';
        if(extras.length){html+='<div class="info" style="margin-top:10px">Основной тяговый комплекс сегодня не назначен. Можно выполнить выбранные дополнительные упражнения без дополнительной тяговой нагрузки.</div>'+tcExtraRowsHtml(extras)+'<button class="btn yellow full" style="margin-top:12px" onclick="tcStartExtraWorkout()">Начать дополнительную тренировку</button>'}
        else html+='<div class="empty" style="margin-top:12px">Дополнительные упражнения не выбраны. Сегодня можно оставить полный отдых.</div><button class="btn ghost full" style="margin-top:10px" onclick="go(\'exercise\')">Выбрать пресс, ноги или отжимания</button>';
        const conflicts=tcConflictExercises();if(conflicts.length)html+='<div class="info" style="margin-top:10px"><b>Не поставлены автоматически в восстановительный день:</b> '+conflicts.map(e=>e.name).join(', ')+'. Они продолжают нагружать тяговую систему или относятся к сложным элементам.</div>';
        html+='<button class="btn ghost full" style="margin-top:8px" onclick="tcOpenCourseInfo()">ⓘ Советы автора</button>'+tcCourseControlStatusHtml()+'</div>'+tcSupplementHtml();q('todayList').innerHTML=tcWeeklyCalendarHtml()+tcPendingLevelHtml()+tcEquipmentMasteryNote()+tcAuxCardHtml()+html;
      }
      tcQueueDecorate();
    }


    function tcAuthorLevelText(level){
      if(level===1)return 'Автор относит сюда тех, кто делает 0–1 обычное подтягивание или работает с резиной. Основная задача уровня — увеличить силу тянущих мышц комплексно. Для сохранения правильной техники предлагается использовать помощь ног и резину.';
      if(level===2)return 'Автор переводит работу ближе к самим подтягиваниям: объём уменьшается, интенсивность увеличивается. Главный акцент — не допускать технических ошибок и научиться выполнять чёткие 2–4 подтягивания.';
      if(level===3)return 'Задача уровня — максимально увеличить количество подтягиваний. Автор предлагает комбинировать работу на силовую выносливость с упражнениями на вспомогательные звенья и отдельно подчёркивает важность работы ног и кора в подтягиваниях.';
      if(level===4)return 'При результате примерно 15–25 подтягиваний автор предлагает выбрать направление: продолжать развивать выносливость и постепенно идти к 25–30 повторениям либо смещать работу к одноповторному максимуму для выхода силой и подтягивания на одной руке.';
      if(level===5)return 'На этом уровне курс продолжает специализацию на выходе силой или подтягивании на одной руке и повышает требования к скоростно-силовой и тяжёлой тяговой работе.';
      if(level===6)return 'Шестой уровень продолжает специальную силовую подготовку: одноручные негативы, облегчённые одноручные варианты, работа хвата и тяжёлые подтягивания с дополнительным весом.';
      if(level===7)return 'Седьмой уровень автор строит вокруг прогрессии подтягивания на одной руке. Прогрессию предлагается подбирать по своему уровню и сочетать с упражнениями предыдущих уровней.';
      return '';
    }
    function tcAuthorGoalText(level,goal){
      if(level===4&&goal==='quantity')return 'Для увеличения количества автор выделяет комплекс №3: 3 подхода по 80% от максимума, 2 подхода широким хватом до максимума и 4×3 с дополнительным весом. Отдых между упражнениями комплекса — 2–4 минуты. Даже при цели увеличить количество автор допускает добавлять комплекс №1 и/или №2 примерно раз в неделю–10 дней.';
      if(level===4&&goal==='muscleup')return 'Для выхода силой автор назначает комплекс №1: плиометрические подтягивания, широкий хват по 80% от максимума и тягу к плечу хватом «игуаны».';
      if(level===4&&goal==='onearm')return 'Для подтягивания на одной руке автор назначает комплекс №2: асимметричные подтягивания, активный вис на одной руке и перехваты в висе на полусогнутых руках.';
      return '';
    }

    // Narrative notes from the supplied PDF, not imagined demonstrations from linked videos.
    const TC_SOURCE_TECHNIQUE={
      classic:{page:7,title:'Классический верхний хват',note:'Автор описывает работу мышц рук и спины с участием широчайших, трапециевидных, ромбовидных, круглой мышцы и сгибателей руки.'},
      wide:{page:9,title:'Широкий верхний хват',note:'Автор относит более выраженный акцент к мышцам спины и стабилизаторам плеча. В качестве варианта для проработки спины упоминает частичную амплитуду.'},
      chin:{page:11,title:'Нижний хват',note:'Нижний хват несколько увеличивает участие бицепса, однако распределение нагрузки, по пояснению автора, зависит от техники движения.'},
      shrug:{page:15,title:'Шраги',note:'Автор связывает движение с работой мышц, опускающих плечо, ротаторов плеча и, при большей амплитуде, трапеций.'},
      asym:{page:16,title:'Асимметричные подтягивания',note:'Тянущая сторона получает повышенную нагрузку, вспомогательная поддерживает положение тела и частично разгружает рабочую сторону.'},
      high:{page:19,title:'Высокие подтягивания',note:'По автору, высокие подтягивания развивают взрывную силу; целевые мышцы аналогичны классическим подтягиваниям.'},
      stages:{page:20,title:'Трёхстадийные подтягивания',note:'Разделение движения на стадии используется для развития контроля в разных частях амплитуды.'},
      band:{page:23,title:'Резина и помощь ног на начальном уровне',note:'Автор предлагает помощь ног и резину, чтобы обучаться подтягиванию с сохранением правильной техники. Подробные нюансы вынесены в видео.'},
      progression:{page:63,title:'Прогрессия подтягивания на одной руке',note:'Автор предлагает подобрать прогрессию по своему уровню и сочетать её с двумя упражнениями шестого уровня на выбор.'}
    };
    function tcSourceTechniqueKey(def){
      const id=(def&&def.id||'').replace(/_lv7_\d+$/,'');
      if(['c_pull80','c_pull50','c_pull80_l4','c_classic_max','c_test_pull','c_daily80'].includes(id))return 'classic';
      if(['c_wide80','c_wide_max_l4','c_wide_band_max'].includes(id))return 'wide';
      if(['c_chin_max'].includes(id))return 'chin';
      if(['c_shrug'].includes(id))return 'shrug';
      if(['c_asym80','c_asym_max','c_full_asym2'].includes(id))return 'asym';
      if(['c_high_max'].includes(id))return 'high';
      if(['c_three_stage50'].includes(id))return 'stages';
      if(['c_band','c_chair_pull'].includes(id))return 'band';
      if(['c_onearm_progression','c_onearm_progression_mu'].includes(id))return 'progression';
      return null;
    }
    function tcSourceExerciseInfo(def){
      const key=tcSourceTechniqueKey(def);
      return key?TC_SOURCE_TECHNIQUE[key]:null;
    }
    function tcAuthorExerciseNote(def){
      const info=tcSourceExerciseInfo(def);
      if(info)return info.note+' (PDF, стр. '+info.page+'.)';
      return 'В предоставленном PDF приведено задание для этого упражнения, но пошаговая техника в тексте не описана. Для подробной техники необходимы соответствующие видеоматериалы автора.';
    }

    function tcCurrentCalculationHtml(){
      if(!W||!['course','supplement','auxCourse'].includes(W.mode)||!W.items||!W.items.length)return '';
      const x=W.items[W.exerciseIndex],def=x&&(x.def||x.e.courseDef);
      if(!def)return '';
      const sch=def.scheme||{};
      let body='<b>'+x.e.name+'</b><br>';
      if(sch.type==='percent'){
        const base=sch.ref==='pull'?TC_course.pullMax:tcVariantMax(def),raw=base*(+sch.pct||0),target=tcSchemeTarget(def);
        body+=def.sets+' подхода × '+target+' повторений.<br>Расчёт: '+base+' × '+Math.round((+sch.pct||0)*100)+'% = '+String(Math.round(raw*10)/10).replace('.',',')+' → '+target+'.';
        if(def.id==='c_asym80')body+='<br>Общий план на обе стороны определяется по меньшему из двух зарегистрированных максимумов (правило TurnikCoach).';
      }else if(sch.type==='fixed'){
        body+=def.sets+' подхода × '+sch.value+'.';
      }else if(sch.type==='max'){
        body+=def.sets+' подхода × MAX.';
      }else if(sch.type==='range_reps'){
        body+=def.sets+' подхода × '+sch.min+'–'+sch.max+'.';
      }else if(sch.type==='timed'){
        body+=def.sets+' подхода × '+(sch.label||sch.value)+'.';
      }else{
        body+='План: '+tcSchemeLabel(def)+'.';
      }
      if(def.metric==='weighted'&&x.e.load)body+='<br>Дополнительный вес: +'+x.e.load+' кг.';
      if(def.metric==='reps_side'||def.metric==='time_side')body+='<br>Выполняется на каждую сторону.';
      return '<div class="tcInfoBlock"><h3>Расчёт текущего задания</h3><p>'+body+'</p></div>';
    }



    // Read-only seven-level catalogue. Browsing does not change a workout or saved preferences.
    function tcProgramEscape(v){
      return String(v==null?'':v).replace(/[&<>"']/g,ch=>({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
      }[ch]));
    }
    function tcProgramPrescription(def){
      const scheme=def.scheme||{};
      let target=tcSchemeLabel(def);
      if(scheme.type==='percent')target=Math.round((+scheme.pct||0)*100)+'% от максимума';
      if(scheme.type==='max')target='MAX';
      if(scheme.type==='choice')return 'Упражнение на выбор из указанного уровня';
      const sides=(def.metric==='reps_side'||def.metric==='time_side')?' на каждую руку':'';
      const units=(def.metric==='time'||def.metric==='time_side')?' сек':'';
      const weight=(def.metric==='weighted')?' с дополнительным весом':'';
      return def.sets+' подх.'+sides+' · '+target+units+weight;
    }

    const TC_TECHNIQUE_REFERENCE=[
      {page:7,title:'Классические подтягивания верхним хватом',note:'Автор описывает совместную работу мышц спины, рук, предплечий и грудных мышц.'},
      {page:8,title:'Общие мышцы при разных хватах',note:'В тексте указано участие мышц предплечий, кора и груди во всех вариантах подтягиваний. В описаниях ниже автор выделяет преимущественно целевые мышцы.'},
      {page:9,title:'Широкий верхний хват',note:'В курсе акцент отнесён к мышцам спины и стабилизаторам плеча. Для дополнительной работы спины автор упоминает частичную амплитуду без полного разгибания рук.'},
      {page:10,title:'Узкий верхний хват',note:'Автор отмечает усиленное участие мышц рук при сохранении нагрузки на спину; отдельно указаны мышцы предплечий.'},
      {page:11,title:'Нижний хват',note:'Автор предупреждает, что акцент на бицепсе не определяется только направлением хвата: распределение нагрузки зависит от техники.'},
      {page:12,title:'Узкий нижний хват',note:'В тексте объясняется возможность использовать момент силы рук и завершать движение мышцами спины. В сравнении с узким верхним хватом акцент смещён с предплечий на бицепс.'},
      {page:13,title:'Стандартный нижний хват: акцент на спину',note:'Описан вариант тяги грудью к перекладине с участием трапециевидных, ромбовидных, круглых мышц и задних дельт.'},
      {page:13,title:'Стандартный нижний хват: акцент на бицепс',note:'Для варианта с акцентом на бицепс автор описывает неполную амплитуду и движение локтей вперёд и вверх.'},
      {page:15,title:'Шраги на турнике',note:'По курсу прорабатываются мышцы, опускающие плечо, ротаторы плеча, а при большей амплитуде — трапеции.'},
      {page:16,title:'Асимметричные подтягивания',note:'Тянущая сторона получает большую нагрузку; вспомогательная сторона стабилизирует положение и частично разгружает рабочую.'},
      {page:17,title:'Подтягивания за голову',note:'Автор описывает вариант широкого хвата с дополнительной нагрузкой на круглые мышцы и ротаторы плеча. Индивидуальная пригодность движения в PDF не устанавливается.'},
      {page:18,title:'Подтягивания к темечку',note:'В курсе вариант с локтями, отведёнными в сторону, описан как более нагружающий бицепс, брахиалис и плечелучевую мышцу.'},
      {page:19,title:'Высокие подтягивания',note:'Автор связывает этот вариант с развитием взрывной силы; целевые мышцы аналогичны обычным подтягиваниям.'},
      {page:20,title:'Трёхстадийные подтягивания',note:'Разделение движения на фазы используется для развития контроля в каждой части амплитуды.'},
      {page:23,title:'Помощь резиной и ногами',note:'Для начального этапа предложено использовать резину и помощь ног ради сохранения техники. Подробности вынесены автором в видео, отсутствующие в текстовом PDF.'},
      {page:63,title:'Подтягивания на одной руке: прогрессия',note:'Рекомендуется подобрать прогрессию по своему текущему уровню и сочетать с двумя упражнениями шестого уровня на выбор.'}
    ];
    function tcProgramTechniqueReferenceHtml(){
      return '<details class="tcProgramLevel"><summary><span class="tcProgramChevron">▶</span>'+
        '<span class="tcProgramGrow">Справочник техники · PDF, стр. 7–23, 63</span></summary>'+
        '<div class="tcProgramLevelBody"><div class="tcProgramLine">Краткое изложение письменных пояснений автора. Видеоуроки, отмеченные в PDF, в справочник не включены, поскольку их содержание не представлено в документе.</div>'+
        TC_TECHNIQUE_REFERENCE.map(item=>'<details class="tcProgramNote"><summary>'+tcProgramEscape(item.title)+'</summary>'+
          '<p>'+tcProgramEscape(item.note)+'</p><div class="meta">PDF, стр. '+item.page+'</div></details>').join('')+
        '</div></details>';
    }
    function tcProgramExerciseHtml(def){
      const tip=tcAuthorExerciseNote(def);
      const noTip=!tcSourceExerciseInfo(def);
      const note=noTip?'<details class="tcProgramNote"><summary>Техника упражнения</summary><p>В текстовой части PDF пошаговая техника этого упражнения не описана. Для подробностей необходимы соответствующие видеоматериалы автора.</p></details>':'<details class="tcProgramNote"><summary>Пояснение автора</summary><p>'+tcProgramEscape(tip)+'</p></details>';
      return '<div class="tcProgramExercise"><div class="tcProgramExerciseName">'+tcProgramEscape(def.name)+'</div>'+ 
        (tcEquipmentReason(def)?'<div class="tcProgramRest"><b>Не назначается: '+tcProgramEscape(tcEquipmentReason(def))+'</b></div>':'')+
        '<div class="tcProgramPrescription">'+tcProgramEscape(tcProgramPrescription(def))+'</div>'+
        '<div class="tcProgramRest">Отдых: '+tcProgramEscape(tcCourseRestText(def.rest))+'</div>'+note+'</div>';
    }
    const TC_PDF_COMPLEX_PAGE={
      1:{1:24,2:25},2:{1:29},3:{1:33,2:35},
      4:{1:40,2:41,3:42},5:{1:50,2:51},6:{1:56,2:57},7:{1:62,2:64}
    };
    function tcProgramComplexHtml(levelNo,no,complex){
      const active=levelNo===TC_course.level&&no===tcCourseComplexNo();
      const sourcePage=TC_PDF_COMPLEX_PAGE[levelNo][no];
      return '<details class="tcProgramComplex"'+(active?' open':'')+'><summary><span class="tcProgramChevron">▶</span><span class="tcProgramGrow">'+tcProgramEscape(complex.name)+'</span>'+(active?'<span class="tcProgramCurrent">Следующий</span>':'')+'</summary>'+
        '<div class="tcProgramComplexBody">'+
        '<p class="tcProgramPurpose">Источник: PDF, стр. '+sourcePage+'. Число подходов и интервалы отдыха приведены по исходному курсу. Пометки о доступности оборудования относятся только к плану TurnikCoach.</p>'+
        (complex.purpose?'<p class="tcProgramPurpose">'+tcProgramEscape(complex.purpose)+'</p>':'')+
        complex.items.map(tcProgramExerciseHtml).join('')+'</div></details>';
    }
    function tcProgramLevelHtml(levelNo){
      const level=TC_COURSE[levelNo],active=levelNo===TC_course.level;
      const nums=Object.keys(level.complexes).map(Number).sort((a,b)=>a-b);
      return '<details class="tcProgramLevel"'+(active?' open':'')+'>'+
        '<summary><span class="tcProgramChevron">▶</span><span class="tcProgramGrow">Уровень '+levelNo+' · '+tcProgramEscape(level.title)+'</span>'+(active?'<span class="tcProgramCurrent">Ваш уровень</span>':'')+'</summary>'+
        '<div class="tcProgramLevelBody">'+
        (level.entry?'<div class="tcProgramLine"><b>Ориентир:</b> '+tcProgramEscape(level.entry)+'</div>':'')+
        '<div class="tcProgramLine"><b>Частота:</b> '+tcProgramEscape(level.frequency)+'</div>'+
        nums.map(no=>tcProgramComplexHtml(levelNo,no,level.complexes[no])).join('')+
        '<div class="tcProgramLine"><b>Контроль уровня:</b> '+tcProgramEscape(level.mastery)+'</div>'+
        (level.supplement?'<details class="tcProgramNote"><summary>Дополнительная работа по курсу</summary><p>'+tcProgramEscape(level.supplement)+'</p></details>':'')+
        '</div></details>';
    }
    function tcInjectProgramStyles(){
      if(document.getElementById('tcCourseProgramStyles'))return;
      const el=document.createElement('style');el.id='tcCourseProgramStyles';
      el.textContent='.tcProgramLevel{border:1px solid #35414d;border-radius:14px;margin:10px 0;background:#111920;overflow:visible}.tcProgramLevel[open]{border-color:#6e6040}.tcProgramLevel>summary,.tcProgramComplex>summary{list-style:none;display:flex;align-items:center;gap:9px;padding:13px 11px;min-height:48px;cursor:pointer}.tcProgramLevel>summary::-webkit-details-marker,.tcProgramComplex>summary::-webkit-details-marker,.tcProgramNote>summary::-webkit-details-marker{display:none}.tcProgramChevron{color:#ffd84d;font-size:12px;flex:none;transition:transform .15s ease}.tcProgramLevel[open]>summary>.tcProgramChevron,.tcProgramComplex[open]>summary>.tcProgramChevron{transform:rotate(90deg)}.tcProgramGrow{flex:1;min-width:0;font-weight:850;font-size:14px}.tcProgramCurrent{flex:none;font-size:10px;color:#17130a;background:#ffd84d;border-radius:7px;padding:4px 6px;font-weight:800}.tcProgramLevelBody{padding:0 11px 12px}.tcProgramLine{font-size:12px;color:#c6d0d9;line-height:1.45;margin:8px 0}.tcProgramComplex{background:#1b242c;border:1px solid #34414c;border-radius:11px;margin:9px 0;overflow:visible}.tcProgramComplexBody{padding:0 11px 10px}.tcProgramPurpose{font-size:12px;line-height:1.45;color:#bec7d2;margin:0 0 10px}.tcProgramExercise{border-top:1px solid #35404b;padding:10px 0}.tcProgramExerciseName{font-weight:850;color:#fff;font-size:13px;line-height:1.4}.tcProgramPrescription{font-size:12px;color:#ffd84d;font-weight:800;line-height:1.45;margin-top:3px}.tcProgramRest{font-size:11px;color:#b1bbc6;margin-top:4px}.tcProgramNote{margin-top:9px;padding:8px 9px;border-radius:9px;background:#121b23;border:1px solid #33404b}.tcProgramNote>summary{font-size:12px;color:#d4deea;cursor:pointer}.tcProgramNote p{font-size:12px;line-height:1.5;color:#c2ccd6;margin:7px 0 0}';
      document.head.appendChild(el);
    }
    window.tcOpenCourseProgram=function(){
      const sheet=q('sheet'),box=q('sheetbox');
      if(!sheet||!box)return;
      tcInjectProgramStyles();
      box.innerHTML='<div class="sheettitle">Программа курса</div>'+
        '<div class="sub" style="margin-top:5px">Артём Морозов · «Подтягивания с нуля до киборга». Откройте уровень, затем комплекс. Просмотр не меняет настройки курса и не запускает тренировку.</div>'+
        Array.from({length:7},(_,i)=>tcProgramLevelHtml(i+1)).join('')+
        tcProgramTechniqueReferenceHtml()+
        '<button class="btn yellow full" style="margin-top:13px" onclick="closeSheet()">Закрыть программу</button>';
      box.scrollTop=0;
      sheet.classList.add('open');
    };


    function tcAuthorFrequencyAdvice(){
      const l=tcCourseLevel(),level=TC_course.level,goal=TC_course.goal;
      const page={1:26,2:30,3:36,4:goal==='quantity'?46:goal==='muscleup'?44:45,5:goal==='onearm'?53:52,6:58,7:goal==='muscleup'?66:65}[level];
      let schedule=l.frequency;
      if(level===4){
        if(goal==='quantity')schedule='Для комплекса №3 автор указывает 3–5 тренировок в неделю. Пример на стр. 46: понедельник, среда, пятница и воскресенье — комплекс №3; между ними дни отдыха.';
        else if(goal==='muscleup')schedule='Для комплекса №1 автор указывает 2–4 тренировки в неделю; пример на стр. 44: понедельник, среда и суббота.';
        else schedule='Для комплекса №2 автор указывает 3–4 тренировки в неделю; пример на стр. 45: понедельник, среда, пятница и воскресенье.';
      }
      if(level===3)schedule='Комплекс №1 — три раза в неделю. Комплекс №2 — один раз в неделю или раз в 10 дней (стр. 36).';
      return '<div class="tcInfoBlock"><h3>Частота занятий · PDF, стр. '+page+'</h3><p>'+tcProgramEscape(schedule)+'</p></div>';
    }
    function tcAuthorRestAdvice(){
      const c=W&&W.mode==='auxCourse'?{no:2,def:TC_COURSE[TC_course.level].complexes[2]}:tcCourseComplex();
      if(!c.def)return '';
      const lines=c.def.items.map(x=>x.name+': '+tcCourseRestText(x.rest));
      return '<div class="tcInfoBlock"><h3>Отдых в текущем комплексе</h3><p>'+lines.map(tcProgramEscape).join('<br>')+'</p></div>';
    }
    function tcAdviceCurrentDef(){
      if(W&&W.items&&W.items.length){
        const current=W.items[W.exerciseIndex];
        if(current)return current.def||current.e&&current.e.courseDef||null;
      }
      const next=tcCourseComplex();
      return next.def&&next.def.items&&next.def.items[0]||null;
    }

    function tcAuthorTechniqueGuideHtml(){
      const rows=[
        ['Классический верхний хват','Нагрузка распределяется между мышцами рук и спины; автор перечисляет широчайшие, трапециевидные, ромбовидные, большую круглую, сгибатели руки, предплечья и грудные.','7–8'],
        ['Широкий верхний хват','Акцент сильнее смещается на спину и стабилизаторы плеча; автор также упоминает частичную амплитуду как вариант дополнительного акцента на спину.','9'],
        ['Узкий верхний хват','Акцент больше смещается на руки и предплечья, при сохранении работы спины.','10'],
        ['Нижний хват','Несколько увеличивается участие бицепса, но распределение нагрузки зависит от техники.','11–13'],
        ['Шраги','Работа мышц, опускающих плечо, ротаторов плеча и, при большей амплитуде, трапеций.','15'],
        ['Асимметричные подтягивания','Тянущая сторона получает повышенную нагрузку; вспомогательная стабилизирует положение и снимает часть нагрузки.','16'],
        ['Высокие подтягивания','Используются для развития взрывной силы.','19'],
        ['Трёхстадийные подтягивания','Разделение движения на фазы используется для развития нейромышечного контроля по амплитуде.','20']
      ];
      return rows.map(r=>'<div style="margin:8px 0"><b>'+r[0]+'</b><br>'+r[1]+' <span class="meta">PDF, стр. '+r[2]+'</span></div>').join('');
    }

    function tcAdvicePanel(title,body,opened){
      return '<details class="tcProgramNote"'+(opened?' open':'')+'><summary style="font-size:14px;font-weight:800">'+title+'</summary>'+
        '<div style="font-size:13px;line-height:1.55;color:#c6d0dd;padding-top:8px">'+body+'</div></details>';
    }
    window.tcOpenCourseInfo=function(){
      const l=tcCourseLevel();
      const c=W&&W.mode==='auxCourse'?
        {no:2,def:TC_COURSE[TC_course.level].complexes[2]}:tcCourseComplex();
      const def=tcAdviceCurrentDef(),source=tcSourceExerciseInfo(def);
      tcInjectProgramStyles();
      const exercise=def?
        '<b>'+tcProgramEscape(def.name)+'</b><br>'+tcProgramEscape(tcAuthorExerciseNote(def))+
        (source?'':''):'';
      const frequency=tcAuthorFrequencyAdvice();
      const rest=tcAuthorRestAdvice();
      const recovery='<b>В тексте курса:</b> '+tcProgramEscape(l.frequency)+
        (l.supplement?'<br><br>Автор предлагает пропускать ежедневные 10 подходов в дни основной тренировки и не менее пяти дней ежемесячно отдыхать от этой дополнительной работы (PDF, стр. '+(TC_course.level===3?34:43)+').':'')+
        '<br><br><b>Планировщик TurnikCoach:</b> в дни без основного тягового комплекса предлагает выбранную дополнительную работу. Это правило приложения, а не формулировка из PDF.';
      const nutrition='В предоставленном PDF нет рекомендаций по калорийности, норме белка, меню, режиму питания или числовой норме сна. Эти данные не добавляются от имени автора. Если будут предоставлены его отдельные материалы по питанию или восстановлению, их можно встроить в этот же раздел.';
      const safety='В юридическом разделе PDF (стр. 70) автор указывает на необходимость консультации со специалистом до начала тренировок.';
      const box=q('sheetbox');
      box.innerHTML='<div class="sheettitle">ⓘ Советы автора</div>'+
        '<div class="sub" style="margin-top:6px">'+tcProgramEscape(l.title)+' · '+tcProgramEscape(c.def?c.def.name:'')+'</div>'+
        (def?tcAdvicePanel('Текущее упражнение · техника и назначение',exercise,true):'')+
        (W?tcAdvicePanel('Расчёт текущего плана',tcCurrentCalculationHtml(),false):'')+
        tcAdvicePanel('Уровень и цель','<b>Идея этапа:</b> '+tcProgramEscape(tcAuthorLevelText(TC_course.level))+
          (tcAuthorGoalText(TC_course.level,TC_course.goal)?'<br><br>'+tcProgramEscape(tcAuthorGoalText(TC_course.level,TC_course.goal)):'')+
          '<br><br><b>Критерий освоения:</b> '+tcProgramEscape(l.mastery),false)+
        tcAdvicePanel('Частота и отдых по курсу',frequency+rest,false)+
        tcAdvicePanel('Восстановление и дополнительные занятия',recovery,false)+
        tcAdvicePanel('Справочник техники из PDF',tcAuthorTechniqueGuideHtml(),false)+
        tcAdvicePanel('Питание и сон',nutrition,false)+
        tcAdvicePanel('Перед началом тренировок',safety,false)+
        '<button class="btn yellow full" style="margin-top:14px" onclick="closeSheet()">Закрыть</button>';
      box.scrollTop=0;
      q('sheet').classList.add('open');
    };


    // Control trial is a single MAX set, separate from the author's workout complex.
    window.tcStartCourseTest=function(){
      if(W){return}
      if(!tcRecoveredForTest())return;
      const src=state.ex.find(e=>e.id==='pull')||{};
      const e={...src,id:'c_test_pull',name:'Контрольный максимум · классические подтягивания',
        max:TC_course.pullMax,media:src.media||'',muscles:Array.isArray(src.muscles)?src.muscles:[]};
      const def={id:e.id,name:e.name,metric:'reps',sets:1,scheme:{type:'max'},
        rest:{type:'manual',label:'После испытания'}};
      const item={e,def,plan:[TC_course.pullMax],planLabels:['MAX'],actual:[]};
      unlockAudio();
      W={mode:'courseTest',sessionIndex:0,exerciseIndex:0,setIndex:0,items:[item],
        actual:0,early:false,courseLevel:TC_course.level,courseGoal:TC_course.goal};
      go('workout');
    };
    window.tcConfirmCourseTest=function(){
      if(!W||W.mode!=='courseTest')return;
      const value=+(W.items[0].actual[0]);
      if(!Number.isInteger(value)||value<1)return;
      const previous=TC_course.pullMax,achieved=value>=TC_course.targetMax;
      const rec={date:dateKey(),ts:Date.now(),value,previous,goal:TC_course.targetMax,level:TC_course.level};
      TC_course.tests.unshift(rec);
      TC_course.lastTestDate=rec.date;
      TC_course.testAnchorDate=rec.date;
      TC_course.testDeferredUntil='';
      TC_course.lastCourseDate=rec.date;TC_course.lastCourseTs=rec.ts;
      TC_course.pullMax=value;
      const pull=state.ex.find(e=>e.id==='pull');if(pull)pull.max=value;
      tcSaveCourse();save();
      q('sheet').classList.remove('open');
      W=null;go('today');
      const box=q('sheetbox');
      box.innerHTML='<div class="sheettitle">Контроль завершён</div>'+
        '<div class="tcInfoBlock"><h3>Результат: '+value+'</h3><p>Предыдущий контроль: '+previous+
        '. Изменение: '+(value-previous>0?'+':'')+(value-previous)+
        '. Следующая нагрузка рассчитывается от '+value+' повторений.</p></div>'+
        (achieved?'<div class="tcInfoBlock"><h3>Цель достигнута</h3><p>Достигнут установленный ориентир '+TC_course.targetMax+
        '. Продолжить увеличение количества либо открыть настройки курса и выбрать дальнейшую цель. Уровень сам не изменяется.</p></div>':'')+
        '<button class="btn yellow full" onclick="closeSheet()">Продолжить</button>'+
        (achieved?'<button class="btn ghost full" style="margin-top:8px" onclick="closeSheet();tcOpenCourseSettings()">Настроить следующую цель</button>':'');
      q('sheet').classList.add('open');
    };
    window.tcDeferCourseTest=function(){
      if(!tcTestDue())return;
      const until=new Date(dateKey()+'T12:00:00');until.setDate(until.getDate()+7);
      TC_course.testDeferredUntil=dateKey(until);
      tcSaveCourse();render();
    };
    function tcRecoveredForTest(){
      const lastLoad=(TC_course.history||[]).find(h=>
        ['course','supplement','auxCourse'].includes(h.courseMode));
      const lastDate=lastLoad&&lastLoad.date>TC_course.lastCourseDate?lastLoad.date:TC_course.lastCourseDate;
      return !!lastDate&&tcDayDiff(lastDate,dateKey())>=2;
    }

    function tcCourseControlStatusHtml(){
      if(!TC_course.lastCourseDate)return '';
      const next=tcNextTestDate();
      if(!next)return '';
      const deferred=TC_course.testDeferredUntil&&TC_course.testDeferredUntil>next?TC_course.testDeferredUntil:next;
      if(TC_course.level===4&&TC_course.goal==='quantity'){
        const last=tcLatestTest();
        return '<div class="meta" style="margin-top:9px">Следующий контроль максимума: '+
          fmtKeyDate(deferred,false)+' · цель '+TC_course.targetMax+
          (last?' · последний '+last.value:'')+'</div>';
      }
      if(tcMasteryDefinition()){
        const latest=TC_course.masteryTests.find(t=>t.level===TC_course.level);
        return '<div class="meta" style="margin-top:9px">Следующая проверка норматива уровня: '+
          fmtKeyDate(deferred,false)+(latest?' · предыдущая: '+(latest.passed?'выполнен':'не выполнен'):'')+'</div>';
      }
      return '';
    }

    function tcCourseTestCard(){
      const next=tcNextTestDate(),due=tcTestDue(),ready=tcRecoveredForTest();
      if(TC_course.level!==4||TC_course.goal!=='quantity')return '';
      if(!next)return '<div class="meta" style="margin-top:8px">Первый контроль будет назначен после начала тренировочного цикла.</div>';
      const last=tcLatestTest();
      if(!due)return '<div class="meta" style="margin-top:8px">'+
        (TC_course.testDeferredUntil&&dateKey()>=next&&dateKey()<TC_course.testDeferredUntil?'Контроль перенесён на '+fmtKeyDate(TC_course.testDeferredUntil,false):'Контроль максимума: '+fmtKeyDate(next,false))+
        ' · цель '+TC_course.targetMax+(last?' · последний результат '+last.value:'')+'</div>';
      return '<div class="todayCard" style="margin-top:12px;border-color:#ffd84d">'+
        '<div class="dateBig">Контрольный максимум</div>'+
        '<div class="meta">Отдельное испытание после восстановления · цель '+TC_course.targetMax+
        ' · последний подтверждённый максимум '+TC_course.pullMax+'</div>'+
        (ready?'<button class="btn yellow full" style="margin-top:12px" onclick="tcStartCourseTest()">Начать контроль</button>':
          '<div class="meta" style="margin-top:8px">После предыдущей тренировки сегодня ещё требуется восстановление. Контроль будет доступен в следующий день без ограничения.</div>')+
        '<button class="btn ghost full" style="margin-top:8px" onclick="tcDeferCourseTest()">Перенести на 7 дней</button>'+
        '</div>';
    }


    // PDF "ТЕСТ МАСТЕРИНГ": only the criteria actually printed for levels 1–5.
    // Levels 6–7 have no quantified promotion test in the supplied PDF.
    function tcMasteryDefinition(){
      const level=TC_course.level;
      if(level===1||level===5)return null; // Source tests require unavailable band / external load.
      if(level===1)return {page:26,name:'Подтягивания с минимальной резиной',fields:[
        {id:'band',label:'Подтягивания с резиной, повторений',min:0},
        {id:'lowBand',label:'Использована резина минимального натяжения',check:true}
      ]};
      if(level===2)return {page:30,name:'Подтягивания средним хватом',fields:[
        {id:'regular',label:'Подтягивания средним хватом, повторений',min:0}
      ]};
      if(level===3)return {page:36,name:'Количество и широкий хват',fields:[
        {id:'regular',label:'Классические подтягивания, повторений',min:0},
        {id:'wide',label:'Подтягивания широким хватом, повторений',min:0}
      ]};
      if(level===4&&TC_course.goal!=='quantity')return {page:43,name:'Асимметричные и высокие подтягивания',fields:[
        {id:'left',label:'Асимметричные на левую руку, повторений',min:0},
        {id:'right',label:'Асимметричные на правую руку, повторений',min:0},
        {id:'high',label:'Подтягивания выше груди, повторений',min:0}
      ]};
      if(level===5)return {page:52,name:'Подтягивания с дополнительным весом',fields:[
        {id:'body',label:'Собственная масса тела, кг',min:0.1,step:'0.1'},
        {id:'added',label:'Дополнительный вес при подтягивании, кг',min:0,step:'0.5'}
      ]};
      return null;
    }
    function tcMasteryOutcome(level,values){
      if(level===1)return values.band>=8&&values.lowBand===true;
      if(level===2)return values.regular>=8;
      if(level===3)return values.regular>=15&&values.wide>=6;
      if(level===4)return TC_course.goal!=='quantity'&&values.left>=5&&values.right>=5&&values.high>=1;
      if(level===5)return values.body>0&&values.added>=0.6*values.body;
      return false;
    }
    function tcPendingLevelHtml(){
      const p=TC_course.pendingTransition;
      if(!p||p.from!==TC_course.level||p.to!==p.from+1)return '';
      return '<div class="todayCard" style="margin-top:12px;border-color:#5eae78">'+
        '<div class="dateBig">Норматив уровня '+p.from+' выполнен</div>'+
        '<div class="meta">Результат контрольного испытания сохранён. Текущий уровень не изменён.</div>'+
        '<button class="btn yellow full" style="margin-top:10px" onclick="tcAdvanceCourseLevel()">Перейти на уровень '+p.to+'</button>'+
        '</div>';
    }

    function tcEquipmentMasteryNote(){
      if(TC_course.level===1)return '<div class="info" style="margin-top:8px">Контрольный норматив автора требует резиновую петлю минимального натяжения. При наличии только турника это испытание не назначается; норматив сохранён в полной программе.</div>';
      if(TC_course.level===5)return '<div class="info" style="margin-top:8px">Контрольный норматив автора требует подтягивания с дополнительным весом. Без отягощения испытание не назначается; норматив сохранён в полной программе.</div>';
      return '';
    }
    function tcMasteryCardHtml(){
      const def=tcMasteryDefinition();
      if(!def||!TC_course.lastCourseDate)return '';
      const recovered=tcRecoveredForTest(),readyDate=tcNextTestDate();
      const due=readyDate&&dateKey()>=readyDate&&
        (!TC_course.testDeferredUntil||dateKey()>=TC_course.testDeferredUntil);
      if(!due)return '<div class="meta" style="margin-top:8px">Контроль нормативов уровня: '+
        (readyDate?fmtKeyDate(readyDate,false):'после начала цикла')+
        ' · ⓘ нормативы и техника находятся в советах автора.</div>';
      return '<div class="todayCard" style="margin-top:12px;border-color:#ffd84d">'+
        '<div class="dateBig">Контроль освоения уровня</div>'+
        '<div class="meta">'+def.name+' · норматив автора, PDF, стр. '+def.page+'</div>'+
        (recovered?'<button class="btn yellow full" style="margin-top:10px" onclick="tcOpenMasteryTest()">Проверить нормативы</button>':
          '<div class="meta" style="margin-top:8px">Контроль выполняется после восстановления от предыдущей тяговой нагрузки.</div>')+
        '<button class="btn ghost full" style="margin-top:8px" onclick="tcDeferMasteryTest()">Перенести на 7 дней</button></div>';
    }
    window.tcDeferMasteryTest=function(){
      if(!tcMasteryDefinition()||!TC_course.lastCourseDate)return;
      const d=new Date(dateKey()+'T12:00:00');d.setDate(d.getDate()+7);
      TC_course.testDeferredUntil=dateKey(d);tcSaveCourse();render();
    };
    window.tcOpenMasteryTest=function(){
      const def=tcMasteryDefinition();
      if(!def||!tcRecoveredForTest())return;
      const inputs=def.fields.map(f=>
        f.check?'<label style="display:flex;gap:9px;align-items:center;margin:12px 0"><input type="checkbox" id="tcMastery_'+f.id+'"><span>'+f.label+'</span></label>':
        '<label style="display:block;font-size:13px;color:#dae2eb;margin:12px 0">'+f.label+
        '<input id="tcMastery_'+f.id+'" type="number" inputmode="decimal" min="'+f.min+'"'+
        (f.step?' step="'+f.step+'"':' step="1"')+
        ' style="display:block;margin-top:5px;width:100%;box-sizing:border-box;padding:11px;border-radius:9px;background:#0c1218;color:#fff;border:1px solid #344250"></label>'
      ).join('');
      q('sheetbox').innerHTML='<div class="sheettitle">Контроль · '+def.name+'</div>'+
        '<div class="sub" style="margin-top:5px">PDF, стр. '+def.page+
        '. Введите фактически полученные результаты. Проверка не является частью основного комплекса и не меняет уровень автоматически.</div>'+
        inputs+'<button class="btn yellow full" onclick="tcSaveMasteryTest()">Сохранить результат</button>'+
        '<button class="btn ghost full" style="margin-top:8px" onclick="closeSheet()">Отмена</button>';
      q('sheet').classList.add('open');
    };
    window.tcSaveMasteryTest=function(){
      const def=tcMasteryDefinition();if(!def||!tcRecoveredForTest())return;
      const values={};
      for(const field of def.fields){
        const el=document.getElementById('tcMastery_'+field.id);
        if(!el)return;
        if(field.check){values[field.id]=!!el.checked;continue}
        const raw=String(el.value||'').trim();
        const n=Number(raw);
        if(raw===''||!Number.isFinite(n)||n<field.min||(!field.step&&!Number.isInteger(n))){
          el.style.borderColor='#ff7777';el.focus();return;
        }
        values[field.id]=n;
      }
      const passed=tcMasteryOutcome(TC_course.level,values);
      const rec={date:dateKey(),ts:Date.now(),level:TC_course.level,values,passed,sourcePage:def.page,goal:TC_course.goal};
      TC_course.masteryTests.unshift(rec);
      TC_course.lastTestDate=rec.date;
      TC_course.testAnchorDate=rec.date;
      TC_course.testDeferredUntil='';
      TC_course.lastCourseDate=rec.date;
      TC_course.lastCourseTs=rec.ts;
      TC_course.pendingTransition=passed&&TC_course.level<6?
        {from:TC_course.level,to:TC_course.level+1,testTs:rec.ts}:null;
      if(values.regular&&values.regular>TC_course.pullMax){
        TC_course.pullMax=values.regular;
        const pull=state.ex.find(e=>e.id==='pull');if(pull)pull.max=values.regular;
        save();
      }
      tcSaveCourse();
      q('sheet').classList.remove('open');
      go('today');
      q('sheetbox').innerHTML='<div class="sheettitle">Контроль уровня '+rec.level+'</div>'+
        '<div class="tcInfoBlock"><h3>'+(passed?'Норматив выполнен':'Норматив пока не выполнен')+
        '</h3><p>Результаты сохранены отдельно от основной тренировки. '+
        (passed?'Вы можете перейти к следующему уровню либо продолжить работу на текущем.':
         'Следующий контроль будет предложен по установленному интервалу.')+'</p></div>'+
        (passed?'<button class="btn yellow full" onclick="tcAdvanceCourseLevel()">Перейти на уровень '+(rec.level+1)+'</button>':'')+
        '<button class="btn ghost full" style="margin-top:8px" onclick="closeSheet()">Остаться на текущем уровне</button>';
      q('sheet').classList.add('open');
    };
    window.tcAdvanceCourseLevel=function(){
      const p=TC_course.pendingTransition;
      if(!p||p.from!==TC_course.level||p.to!==p.from+1||p.to>6)return;
      const current=TC_course.masteryTests.find(t=>t.ts===p.testTs&&t.level===p.from);
      if(!current||!current.passed)return;
      TC_course.level=p.to;TC_course.courseSeq=0;TC_course.weeklySessions=3;
      TC_course.pendingTransition=null;
      TC_course.lastTestDate='';TC_course.testAnchorDate='';
      TC_course.testDeferredUntil='';
      tcNormalizeGoal();
      // Keep the last load date so an immediate consecutive workout is not introduced.
      tcSaveCourse();
      q('sheet').classList.remove('open');
      W=null;go('today');
    };

    window.tcStartCourseWorkout=function(){
      if(!tcCourseDue()||W)return;
      if(!tcRunnableDefs(tcOriginalCourseDefs()).length)return;
      if(tcCalibrationDefs('main').length){tcOpenCourseCalibration('main');return;}
      if(tcNeedsWorkingWeight('main')){tcOpenWorkingWeight('main');return;}
      if(TC_course.level===7&&!tcAdvancedSelected()){tcOpenAdvancedChoiceSheet();return;}
      const items=tcBuildCourseItems();if(!items.length)return;unlockAudio();
      const c=tcCourseComplex();W={mode:'course',sessionIndex:0,exerciseIndex:0,setIndex:0,items,actual:tcSchemeTarget(items[0].def),early:false,courseLevel:TC_course.level,courseComplex:c.no,courseGoal:TC_course.goal,adapted:tcUnavailableDefs(tcOriginalCourseDefs()).length>0};go('workout');
    };
    window.tcStartExtraWorkout=function(){
      if(W)return;
      const items=tcBuildExtraItems();if(!items.length)return;unlockAudio();const idx=TC_course.extraSeq%3;W={mode:'extra',sessionIndex:idx,exerciseIndex:0,setIndex:0,items,actual:items[0].plan[0],early:false};go('workout');
    };
    window.tcStartSupplementWorkout=function(){
      if(W||!TC_course.authorSupplement||!tcCourseLevel().supplement||tcCourseDue()||tcAuxDue()||tcTestDue()||tcMasteryDue()||tcSupplementBreak()||TC_course.history.some(h=>h.courseMode==='supplement'&&h.date===dateKey()))return;
      const reps=Math.max(1,Math.floor(TC_course.pullMax*.8)),def={id:'c_daily80',name:'Классические подтягивания · авторское дополнение',metric:'reps',sets:10,scheme:{type:'fixed',value:reps,label:String(reps)},rest:{type:'manual',label:'отдых в PDF не задан'}};
      const e={id:def.id,name:def.name,metric:'reps',max:TC_course.pullMax,load:0,courseDef:def,media:'',muscles:[]};const item={e,def,plan:Array(10).fill(reps),planLabels:Array(10).fill(String(reps)),actual:[]};W={mode:'supplement',sessionIndex:0,exerciseIndex:0,setIndex:0,items:[item],actual:reps,early:false};go('workout');
    };

    function tcPrepareManualRest(label,note){
      window.__tcManualCourseRest=true;go('rest');const title=document.querySelector('#rest h1'),sub=document.querySelector('#rest .sub'),num=q('restNum'),buttons=document.querySelectorAll('#rest button');if(title)title.textContent=label==='минимальный'?'Минимальный отдых':'Отдых по самочувствию';if(sub)sub.textContent=note||('По курсу: '+label);if(num)num.textContent='—';if(buttons[0])buttons[0].textContent='Продолжить';if(buttons[1])buttons[1].style.display='none';
    }
    function tcRestoreRestUI(){const title=document.querySelector('#rest h1'),sub=document.querySelector('#rest .sub'),buttons=document.querySelectorAll('#rest button');if(title)title.textContent='Восстановись';if(sub)sub.textContent='За 3 секунды до окончания прозвучат три сигнала';if(buttons[0])buttons[0].textContent='Готов раньше';if(buttons[1])buttons[1].style.display='block';window.__tcManualCourseRest=false}


    function tcPlanToken(def,x){
      const sch=def.scheme||{};
      if(sch.type==='percent')return tcSchemeTarget(def)==null?'—':String(tcSchemeTarget(def));
      if(sch.type==='fixed')return String(sch.value);
      if(sch.type==='max')return 'MAX';
      if(sch.type==='range_reps')return sch.min+'–'+sch.max;
      if(sch.type==='timed')return sch.label||String(sch.value);
      if(sch.type==='choice')return 'НА ВЫБОР';
      const vals=(x&&x.plan)||[];
      return vals.length?String(vals[0]):tcSchemeLabel(def);
    }
    function tcSequenceCoursePlan(def,x){
      const sets=(x&&x.plan?x.plan.length:def.sets)||1;
      const token=tcPlanToken(def,x);
      const seq=Array.from({length:sets},()=>token).join('  ');
      let side='';
      if(def.metric==='reps_side'||def.metric==='time_side')side='на каждую сторону';
      if(def.metric==='weighted'&&x&&x.e&&x.e.load)side='+'+x.e.load+' кг';
      return '<span class="tcPlanMain">'+seq+'</span>'+(side?'<span class="tcPlanSide">'+side+'</span>':'');
    }

    const tcBeforeCourseRenderWork=window.renderWork;
    window.renderWork=function(){
      const r=tcBeforeCourseRenderWork();
      const planEl=q('wplan');
      if(!W||!['course','supplement','auxCourse','courseTest'].includes(W.mode)){
        if(planEl)planEl.classList.remove('tcCoursePlan');
        return r;
      }
      const x=W.items[W.exerciseIndex],def=x.def||x.e.courseDef;
      if(!def)return r;
      const token=tcPlanToken(def,x);
      q('wname').textContent=x.e.name;
      q('wmeta').textContent='Курс Морозова · упражнение '+(W.exerciseIndex+1)+
        ' из '+W.items.length+' · подход '+(W.setIndex+1)+' из '+x.plan.length+
        (x.e.load?' · +'+x.e.load+' кг':'');
      planEl.classList.add('tcCoursePlan');
      planEl.innerHTML=W.mode==='courseTest'?
        '<span class="tcPlanMain">MAX</span>':tcSequenceCoursePlan(def,x);
      const current=q('target');
      if(current)current.textContent=token;
      const unit=q('unitWord'); // Existing template uses unitWord, not factUnit.
      if(unit)unit.textContent=(def.metric==='time'||def.metric==='time_side'?'СЕКУНД':'ПОВТОРЕНИЙ')+
        (def.metric==='reps_side'||def.metric==='time_side'?' НА СТОРОНУ':'');
      const chips=q('chips');
      if(chips)chips.innerHTML=x.plan.map((_,i)=>{
        const actual=x.actual[i],done=actual!==undefined;
        const value=done?(actual===null?'—':String(actual)):token;
        return '<div class="chip '+(done?(actual===null?'skip':'ok'):'')+'">'+value+'</div>';
      }).join('');
      const image=q('visualImg'),fallback=q('mediaFallback');
      if(image){image.removeAttribute('src');image.style.display='none'}
      if(fallback)fallback.style.display='none';
      const legend=q('legend');if(legend)legend.textContent='';
      return r;
    };

    const tcBeforeCourseSetDone=window.setDone;
    window.setDone=function(skip){
      if(!W)return;
      if(q('sheet').classList.contains('open'))return;
      if(W&&W.mode==='courseTest'){
        if(skip){q('sheetbox').innerHTML='<div class="sheettitle">Контроль не выполнен</div><button class="btn ghost full" onclick="closeSheet()">Вернуться к попытке</button>';q('sheet').classList.add('open');return}
        const n=Number(W.actual);
        if(!Number.isInteger(n)||n<1){q('sheetbox').innerHTML='<div class="sheettitle">Введите результат</div><div class="sub">Укажите фактически выполненное количество повторений, затем завершите контроль.</div><button class="btn yellow full" onclick="closeSheet()">Вернуться</button>';q('sheet').classList.add('open');return}
        W.items[0].actual[0]=n;
        q('sheetbox').innerHTML='<div class="sheettitle">Подтвердить максимум</div><div class="dateBig" style="margin:12px 0">'+n+' повторений</div><button class="btn yellow full" onclick="tcConfirmCourseTest()">Сохранить результат</button><button class="btn ghost full" style="margin-top:8px" onclick="closeSheet()">Изменить значение</button>';
        q('sheet').classList.add('open');return;
      }
      if(!W||!['course','supplement','auxCourse'].includes(W.mode))return tcBeforeCourseSetDone(skip);
      tcPrimeAudio();const x=W.items[W.exerciseIndex],def=x.def||x.e.courseDef,target=x.plan[W.setIndex],actual=skip?null:W.actual;x.actual[W.setIndex]=actual;
      const advance=()=>{if(W.setIndex<x.plan.length-1){W.setIndex++;W.actual=x.plan[W.setIndex]||tcLastActualFor(def.id)||1;renderWork();return true}if(W.exerciseIndex<W.items.length-1){W.exerciseIndex++;W.setIndex=0;const nx=W.items[W.exerciseIndex];W.actual=nx.plan[0]||tcLastActualFor(nx.def.id)||1;renderWork();return true}return false};
      const more=W.setIndex<x.plan.length-1||W.exerciseIndex<W.items.length-1;
      if(!more){tcFinishSignal();askFeedback(false);return}
      const rr=tcAdaptiveCourseRest(def,target,actual,!!skip);advance();
      if(rr.manual)tcPrepareManualRest(rr.label,rr.note);else window.startRest(rr.seconds,rr.note);
    };

    const tcBeforeCourseFinishRest=window.finishRest;
    window.finishRest=function(){if(window.__tcManualCourseRest){tcRestoreRestUI();go('workout');return}return tcBeforeCourseFinishRest()};

    const tcBeforeCourseFinishWorkout=window.finishWorkout;
    window.finishWorkout=function(feel){
      if(!W)return;
      if(!['course','extra','supplement','auxCourse'].includes(W.mode))return tcBeforeCourseFinishWorkout(feel);
      let total=0,details=[];W.items.forEach(x=>{const actual=x.plan.map((_,i)=>x.actual[i]===undefined?null:x.actual[i]);const sum=actual.reduce((s,v)=>s+(Number.isFinite(+v)?+v:0),0);total+=sum;details.push({id:x.e.id,name:x.e.name,metric:x.e.metric,load:x.e.load||0,plan:x.plan.slice(),planLabels:(x.planLabels||x.plan.map(String)).slice(),actual,sum})});
      const rec={type:'workout',date:dateKey(),ts:Date.now(),feedback:feel,total,details,early:!!W.early,courseMode:W.mode,adapted:!!W.adapted,equipment:'bar',session:W.mode==='extra'?'доп.':'курс'};
      if(W.mode==='course'){rec.courseLevel=W.courseLevel;rec.courseComplex=W.courseComplex;rec.courseGoal=W.courseGoal;TC_course.history.unshift(rec);TC_course.courseSeq++;TC_course.lastCourseDate=rec.date;TC_course.lastCourseTs=rec.ts;if(!TC_course.testAnchorDate)TC_course.testAnchorDate=rec.date;tcSaveCourse()}
      else if(W.mode==='auxCourse'){rec.courseLevel=W.courseLevel;rec.courseComplex=2;rec.courseGoal=W.courseGoal;TC_course.history.unshift(rec);tcSaveCourse()}
      else if(W.mode==='extra'){TC_course.extraSeq++;tcSaveCourse();state.history.unshift(rec);save()}
      else {rec.courseLevel=TC_course.level;rec.courseComplex='дополнение';TC_course.history.unshift(rec);tcSaveCourse()}
      q('sheet').classList.remove('open');W=null;go('today');
    };

    const tcBeforeCourseInfo=window.tcOpenTrainingInfo;
    window.tcOpenTrainingInfo=function(){if(TC_course.enabled&&(W&&['course','supplement','auxCourse','courseTest'].includes(W.mode)||q('today').classList.contains('on')))return tcOpenCourseInfo();return tcBeforeCourseInfo()};


    function tcCourseTestsHtml(){
      const maxTests=TC_course.tests.map(t=>({
        date:t.date,ts:t.ts,
        label:'Контрольный максимум',
        summary:t.value+' повт. · предыдущий '+t.previous+
          ' · изменение '+(t.value-t.previous>0?'+':'')+(t.value-t.previous)
      }));
      const norms=TC_course.masteryTests.map(t=>({
        date:t.date,ts:t.ts,
        label:'Норматив уровня '+t.level,
        summary:(t.passed?'Выполнен':'Не выполнен')+
          (t.values&&t.values.regular!=null?' · обычные '+t.values.regular:'')
      }));
      const all=maxTests.concat(norms).sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,12);
      if(!all.length)return '';
      const rows=all.map(t=>'<div class="historyitem"><div class="row between"><b>'+
        fmtKeyDate(t.date,false)+'</b><span class="badge">'+t.label+'</span></div>'+
        '<div class="meta">'+t.summary+'</div></div>').join('');
      return '<div class="tcInfoBlock"><h3>Контрольные испытания</h3><p>Текущий максимум: '+
        TC_course.pullMax+' · цель: '+TC_course.targetMax+'</p></div>'+rows;
    }
    function tcCourseHistoryHtml(){if(!TC_course.enabled&&!TC_course.history.length)return'';const rows=TC_course.history.slice(0,8).map(h=>'<div class="historyitem"><div class="row between"><div><div class="strong" style="font-size:14px">'+(h.courseMode==='supplement'?'Дополнительные подтягивания по курсу':h.courseMode==='auxCourse'?'Вспомогательный комплекс №2 · уровень '+h.courseLevel:'Курс Морозова · уровень '+h.courseLevel+' · комплекс '+h.courseComplex)+(h.adapted?' · адаптация: только турник':'')+'</div><div class="meta">'+fmtRecordDate(h)+' · '+(h.feedback||'—')+'</div></div><span class="badge">КУРС</span></div>'+(h.details||[]).map(d=>'<div class="meta" style="margin-top:6px">'+d.name+': '+d.actual.map(v=>v===null?'—':v).join(' · ')+'</div>').join('')+'</div>').join('');return '<div class="exerciseProgressCard"><div class="progressHead"><div><div class="progressName">Курс Морозова</div><div class="meta">Отдельная история основной тяговой программы</div></div><span class="badge">ур. '+TC_course.level+'</span></div><div class="tcInfoBlock"><h3>Критерий текущего уровня</h3><p>'+tcCourseLevel().mastery+'</p></div>'+tcCourseTestsHtml()+rows+'</div>'}
    const tcBeforeCourseRenderHistory=window.renderHistory;
    window.renderHistory=function(){const r=tcBeforeCourseRenderHistory();const host=q('exerciseProgress');if(host){const old=document.getElementById('tcCourseHistoryWrap');if(old)old.remove();const wrap=document.createElement('div');wrap.id='tcCourseHistoryWrap';wrap.innerHTML=tcCourseHistoryHtml();host.parentNode.insertBefore(wrap,host)}return r};

    const tcBeforeCourseRender=window.render;
    window.render=function(){const r=tcBeforeCourseRender();tcDecorateCourseCatalog();if(TC_course.enabled&&q('today').classList.contains('on'))tcRenderToday();return r};

    // Initial redraw after installing the module.
    tcSanitizeSelectedEquipment();
    tcInjectCourseUiStyles();
    render();

})();
