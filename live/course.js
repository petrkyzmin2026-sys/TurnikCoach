/* TURNIKCOACH_COURSE 1.0.10-all-levels */
(function(){
  'use strict';
  const COURSE_MODULE_VERSION='1.0.10-all-levels';
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
      return{enabled:false,level:m<=1?1:m<=3?2:m<=14?3:4,goal:'quantity',pullMax:m,weightedLoad:+((weighted&&weighted.load)||0),courseSeq:0,extraSeq:0,lastCourseDate:'',lastCourseTs:0,authorSupplement:false,history:[],tests:[],testPeriodWeeks:3,targetMax:30,testAnchorDate:'',lastTestDate:'',testDeferredUntil:'',weeklySessions:3,masteryTests:[],pendingTransition:null};
    }
    function tcLoadCourse(){
      let c=tcCourseDefault();
      try{const raw=JSON.parse(localStorage.getItem(TC_COURSE_KEY)||'null');if(raw&&typeof raw==='object')c={...c,...raw}}catch(e){}
      c.level=tcClamp(Math.floor(+c.level||1),1,7);c.pullMax=Math.max(1,Math.floor(+c.pullMax||1));c.weightedLoad=Math.max(0,+c.weightedLoad||0);c.courseSeq=Math.max(0,Math.floor(+c.courseSeq||0));c.extraSeq=Math.max(0,Math.floor(+c.extraSeq||0));c.history=Array.isArray(c.history)?c.history:[];c.tests=Array.isArray(c.tests)?c.tests:[];c.masteryTests=Array.isArray(c.masteryTests)?c.masteryTests:[];c.pendingTransition=c.pendingTransition&&typeof c.pendingTransition==='object'?c.pendingTransition:null;c.testPeriodWeeks=[2,3,4].includes(+c.testPeriodWeeks)?+c.testPeriodWeeks:3;c.weeklySessions=[3,4].includes(+c.weeklySessions)?+c.weeklySessions:3;c.targetMax=Math.max(1,Math.floor(+c.targetMax||30));c.testAnchorDate=/^\d{4}-\d{2}-\d{2}$/.test(c.testAnchorDate||'')?c.testAnchorDate:'';c.lastTestDate=/^\d{4}-\d{2}-\d{2}$/.test(c.lastTestDate||'')?c.lastTestDate:'';c.testDeferredUntil=/^\d{4}-\d{2}-\d{2}$/.test(c.testDeferredUntil||'')?c.testDeferredUntil:'';
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
    function tcCourseComplexNo(){
      const l=tcCourseLevel(),ids=Object.keys(l.complexes).map(Number);
      if(TC_course.level===3||TC_course.level===6)return 1;
      if(TC_course.level===4){if(TC_course.goal==='muscleup')return 1;if(TC_course.goal==='onearm')return 2;const seq=[3,3,3,1,3,3,3,2];return seq[TC_course.courseSeq%seq.length]}
      if(TC_course.level===5){return TC_course.goal==='onearm'?2:1}
      if(TC_course.level===7){return TC_course.goal==='muscleup'?2:1}
      const seq=l.sequence&&l.sequence.length?l.sequence:ids;
      return seq[TC_course.courseSeq%seq.length]||ids[0]||1;
    }
    function tcCourseComplex(){const no=tcCourseComplexNo();return{no,def:tcCourseLevel().complexes[no]}}
    function tcDayDiff(a,b){if(!a||!b)return 999;const x=new Date(a+'T12:00:00'),y=new Date(b+'T12:00:00');return Math.round((y-x)/86400000)}
    // Level 4 quantity: an actual weekly calendar, not rolling "48 hours since last workout".
    // Default three sessions (within the author's 3–5 range) preserve days between workouts.
    function tcWeeklyMode(){return TC_course.enabled&&TC_course.level>=1&&TC_course.level<=7}
    function tcCourseWeekdays(){
      const l=TC_course.level,g=TC_course.goal;
      if(l===1)return [1,3,5,0]; // Page 26: alternating complexes 1 and 2.
      if(l===2)return TC_course.weeklySessions===4?[1,3,6,0]:[1,3,6]; // 2–4/week.
      if(l===3)return [1,3,6]; // Main complex 1 three times/week; auxiliary is separate.
      if(l===4){
        if(g==='quantity')return TC_course.weeklySessions===4?[1,3,5,0]:[1,3,6];
        return g==='onearm'?[1,3,5,0]:[1,3,6];
      }
      if(l===5)return g==='onearm'?[1,3,5,0]:[1,3,6];
      if(l===6)return [1,3,6];
      return [1,4,6]; // Page 65–66: level seven.
    }
    function tcDateFromKey(k){return new Date(k+'T12:00:00')}
    function tcScheduledOn(k){return tcCourseWeekdays().includes(tcDateFromKey(k).getDay())}
    function tcCourseDue(){
      if(!tcWeeklyMode())return false;
      const today=dateKey();
      if(TC_course.lastCourseDate===today||tcTestDue()||tcMasteryDue())return false;
      if(!TC_course.lastCourseDate)return true; // First course session may start on setup day.
      return tcScheduledOn(today);
    }
    function tcNextCourseDay(){
      const today=tcDateFromKey(dateKey());
      for(let i=0;i<10;i++){
        const day=new Date(today);day.setDate(today.getDate()+i);
        const key=dateKey(day);
        if(tcScheduledOn(key)&&key!==TC_course.lastCourseDate&&
           (i>0||tcCourseDue()))return key;
      }
      return '';
    }
    function tcWeeklyCalendarHtml(){
      if(!tcWeeklyMode())return '';
      const names=['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
      const today=tcDateFromKey(dateKey()),offset=(today.getDay()+6)%7;
      const mon=new Date(today);mon.setDate(today.getDate()-offset);
      const days=Array.from({length:7},(_,i)=>{
        const day=new Date(mon);day.setDate(mon.getDate()+i);
        const key=dateKey(day),planned=tcScheduledOn(key),completed=TC_course.history.some(h=>h.courseMode==='course'&&h.date===key);
        const testDone=TC_course.tests.some(t=>t.date===key);
        const dueTest=key===dateKey()&&(tcTestDue()||tcMasteryDue());
        const missed=key<dateKey()&&planned&&!completed&&!testDone;
        const type=testDone?'ТЕСТ':completed?'ГОТОВО':dueTest?'ТЕСТ':missed?'ПРОП.':planned?'КУРС':tcExtraExercises().length?'ДОП.':'ОТД.';
        const status=key===dateKey()?' tcWeekToday':'';
        return '<div class="tcWeekDay'+status+'"><b>'+names[i]+'</b><span>'+day.getDate()+'</span><small>'+type+'</small></div>';
      });
      return '<div class="tcWeekCalendar" aria-label="Расписание недели">'+days.join('')+'</div>';
    }

    function tcExtraExercises(){return selected().filter(e=>!TC_PULL_HEAVY_IDS.has(e.id)&&e.g!=='Турник'&&e.g!=='Элементы')}
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
    function tcSchemeTarget(def){
      const s=def.scheme||{};
      if(s.type==='fixed'||s.type==='timed')return Math.max(0,+s.value||0);
      if(s.type==='percent'&&s.ref==='pull')return Math.max(1,Math.floor(TC_course.pullMax*(+s.pct||0)));
      if(s.type==='range_reps')return Math.max(1,+s.min||1);
      if(s.type==='max'&&s.ref==='pull')return TC_course.pullMax;
      return tcLastActualFor(def.id)||1;
    }
    function tcDisplayScheme(def){
      const s=def.scheme||{};
      if(s.type==='percent'&&s.ref==='pull')return tcSchemeTarget(def)+' · '+Math.round(s.pct*100)+'% от '+TC_course.pullMax;
      return tcSchemeLabel(def);
    }
    function tcBuildCourseItems(){
      const c=tcCourseComplex();if(!c.def)return[];
      return c.def.items.map(def=>{
        const target=tcSchemeTarget(def),labels=Array.from({length:def.sets},()=>tcDisplayScheme(def));
        const e={id:def.id,name:def.name,metric:def.metric||'reps',max:TC_course.pullMax,load:tcItemLoad(def),courseDef:def};
        return{e,def,plan:Array.from({length:def.sets},()=>target),planLabels:labels,actual:[]};
      });
    }
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
        (enabled?'<div class="tcInfoBlock"><h3>'+l.title+'</h3><p><b>Цель:</b> '+tcCourseGoalName(TC_course.goal)+'<br><b>Следующий:</b> '+(c.def?c.def.name:'—')+'<br><b>Текущий максимум:</b> '+TC_course.pullMax+'<br><b>Частота по курсу:</b> '+l.frequency+'</p></div>':'<div class="sub" style="margin-top:10px">Отдельная система тренировок: уровни, комплексы, проценты, MAX, отдых и контрольные критерии берутся из курса. Остальные упражнения TurnikCoach можно использовать отдельно.</div>')+
        '<button class="btn yellow full" style="margin-top:12px" onclick="tcOpenCourseProgram()">Программа курса</button>'+ '<button class="btn ghost full" style="margin-top:8px" onclick="tcOpenCourseSettings()">'+(enabled?'Настройки курса':'Подключить курс')+'</button></div>';
    }
    window.tcOpenCourseSettings=function(){
      tcNormalizeGoal();const l=tcCourseLevel(),goals=tcGoalOptions(TC_course.level);
      const box=q('sheetbox');
      box.innerHTML='<div class="sheettitle">Курс Морозова</div><div class="sub" style="margin-top:6px">Курс работает отдельным блоком. Обычный каталог остаётся для пресса, ног, отжиманий и другой дополнительной работы.</div>'+
      '<div class="tcInfoBlock"><h3>Состояние</h3><p><label style="display:flex;gap:9px;align-items:center"><input id="tcCourseEnabled" type="checkbox" '+(TC_course.enabled?'checked':'')+'> Включить курс Морозова</label></p></div>'+
      '<div class="tcInfoBlock"><h3>Уровень</h3><p><select id="tcCourseLevel" style="width:100%;margin-top:4px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px">'+Object.keys(TC_COURSE).map(n=>'<option value="'+n+'" '+(+n===TC_course.level?'selected':'')+'>'+n+' · '+TC_COURSE[n].title+'</option>').join('')+'</select></p></div>'+
      '<div class="tcInfoBlock"><h3>Текущий максимум</h3><p><input id="tcCourseMax" type="number" min="1" value="'+TC_course.pullMax+'" style="width:100%;box-sizing:border-box;margin-top:4px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px"></p></div>'+
      '<div class="tcInfoBlock"><h3>Цель</h3><p><select id="tcCourseGoal" style="width:100%;margin-top:4px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px">'+goals.map(g=>'<option value="'+g[0]+'" '+(g[0]===TC_course.goal?'selected':'')+'>'+g[1]+'</option>').join('')+'</select></p></div>'+
      (TC_course.level===4&&TC_course.goal==='quantity'?'<div class="tcInfoBlock"><h3>Основной комплекс · недельный план</h3><p>Число тренировок: <select id="tcWeeklySessions" style="background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:8px;padding:7px"><option value="3" '+(TC_course.weeklySessions===3?'selected':'')+'>3 раза · ПН, СР, СБ</option><option value="4" '+(TC_course.weeklySessions===4?'selected':'')+'>4 раза · ПН, СР, ПТ, ВС</option></select><br><br>Три дня — расписание TurnikCoach в пределах частоты, указанной автором. Четыре дня — пример из PDF; в нём занятия в воскресенье и следующий понедельник идут подряд.</p></div>':'')+
      '<div class="tcInfoBlock"><h3>Дополнительный вес</h3><p>Используется в комплексах, где курс назначает тяжёлые подтягивания с весом.<input id="tcCourseLoad" type="number" min="0" step="0.5" value="'+TC_course.weightedLoad+'" style="width:100%;box-sizing:border-box;margin-top:7px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px"></p></div>'+
      (l.supplement?'<div class="tcInfoBlock"><h3>Дополнительные подтягивания по курсу</h3><p><label style="display:flex;gap:9px;align-items:flex-start"><input id="tcCourseSupplement" type="checkbox" '+(TC_course.authorSupplement?'checked':'')+'><span>'+l.supplement+'</span></label></p></div>':'')+
      tcAuthorFrequencyAdvice()+tcAuthorRestAdvice()+tcAuthorSourceBoundaries()+
      (TC_course.level===4&&TC_course.goal==='quantity'?'<div class="tcInfoBlock"><h3>Контроль максимума · TurnikCoach</h3><p>Цель: <input id="tcTargetMax" type="number" min="1" step="1" value="'+TC_course.targetMax+'" style="width:65px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:8px;padding:7px"> повторений.<br><br>Проверять каждые <select id="tcTestWeeks" style="background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:8px;padding:7px">'+[2,3,4].map(n=>'<option value="'+n+'" '+(TC_course.testPeriodWeeks===n?'selected':'')+'>'+n+' недели</option>').join('')+'</select><br><br>Контроль назначается после восстановления; результат сохраняется отдельно от основной тренировки.</p></div>':'')+
      '<div class="tcInfoBlock"><h3>Критерий освоения уровня</h3><p>'+l.mastery+'</p></div>'+
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
      const weeklyEl=document.getElementById('tcWeeklySessions');if(weeklyEl)TC_course.weeklySessions=[3,4].includes(+weeklyEl.value)?+weeklyEl.value:3;
      const targetEl=document.getElementById('tcTargetMax'),weeksEl=document.getElementById('tcTestWeeks');if(targetEl)TC_course.targetMax=Math.max(1,Math.floor(+targetEl.value||TC_course.targetMax));if(weeksEl)TC_course.testPeriodWeeks=[2,3,4].includes(+weeksEl.value)?+weeksEl.value:3;
      TC_course.enabled=!!(enabled&&enabled.checked);TC_course.level=tcClamp(+(level&&level.value)||TC_course.level,1,7);TC_course.pullMax=Math.max(1,Math.floor(+(mx&&mx.value)||TC_course.pullMax));TC_course.goal=(goal&&goal.value)||TC_course.goal;TC_course.weightedLoad=Math.max(0,+(load&&load.value)||0);if(sup)TC_course.authorSupplement=!!sup.checked;tcNormalizeGoal();
      if(TC_course.level!==oldLevel||TC_course.goal!==oldGoal){
        TC_course.courseSeq=0;TC_course.pendingTransition=null;
        TC_course.testAnchorDate='';TC_course.lastTestDate='';TC_course.testDeferredUntil='';
      }
      if(TC_course.enabled){state.ex.forEach(e=>{if(TC_PULL_CONFLICT_IDS.has(e.id)){e.sel=false;e.main=false}})}
      const pull=state.ex.find(e=>e.id==='pull');if(pull)pull.max=TC_course.pullMax;const wp=state.ex.find(e=>e.id==='weightedPull');if(wp)wp.load=TC_course.weightedLoad;
      tcSaveCourse();save();closeSheet();render();
    };

    function tcInjectCourseUiStyles(){
      if(document.getElementById('tcCourseUiStyles'))return;
      const st=document.createElement('style');st.id='tcCourseUiStyles';
      st.textContent="#sheet.open{overflow:hidden!important}#sheet .sheetbox{max-height:min(88dvh,calc(100vh - 22px))!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding-bottom:max(28px,calc(18px + env(safe-area-inset-bottom)))!important}#sheet .sheetbox::-webkit-scrollbar{width:4px}#sheet .sheetbox::-webkit-scrollbar-thumb{background:#475563;border-radius:999px}.tcExtrasDetails{margin:10px 0 16px;border:1px solid #2e3945;border-radius:16px;background:#111820;overflow:hidden}.tcExtrasSummary{list-style:none;display:flex;align-items:center;gap:9px;padding:14px;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent}.tcExtrasSummary::-webkit-details-marker{display:none}.tcExtrasTri{display:inline-block;font-size:15px;color:#ffd84d;transition:transform .16s ease;transform:rotate(0deg)}.tcExtrasDetails[open] .tcExtrasTri{transform:rotate(90deg)}.tcExtrasSummaryText{flex:1;min-width:0}.tcExtrasSummaryTitle{font-weight:900;font-size:15px;color:#fff}.tcExtrasSummaryMeta{font-size:11px;color:#939eac;margin-top:2px}.tcExtrasBody{padding:0 10px 10px}.tcExtrasBody>.card,.tcExtrasBody>.catalogGroup{margin-top:8px}#workout #wplan.tcCoursePlan{min-width:118px;text-align:right;line-height:1.1}#workout #wplan.tcCoursePlan .tcPlanMain{display:block;color:#ffd84d;font-size:23px;font-weight:950;white-space:nowrap;letter-spacing:.02em}#workout #wplan.tcCoursePlan .tcPlanSub{display:block;color:#9aa6b2;font-size:11px;font-weight:700;margin-top:5px;white-space:nowrap}#workout #wplan.tcCoursePlan .tcPlanSide{display:block;color:#c9d1d9;font-size:10px;font-weight:700;margin-top:3px;white-space:nowrap}";
      st.textContent+='.tcWeekCalendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin:10px 0 12px}.tcWeekDay{min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;border:1px solid #33414b;background:#151f28;border-radius:9px;padding:6px 1px;color:#c6d1db;font-size:10px}.tcWeekDay b{font-size:10px}.tcWeekDay span{font-size:13px;font-weight:850}.tcWeekDay small{font-size:8px;font-weight:800;color:#a5b4c1}.tcWeekToday{border-color:#ffd84d;background:#2a281b;color:#ffd84d}.tcWeekToday small{color:#ffd84d}';
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

    function tcDecorateCourseCatalog(){
      const host=q('exerciseList');if(!host)return;
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
      const reps=Math.max(1,Math.floor(TC_course.pullMax*.8));
      const seq=Array(10).fill(String(reps)).join('  ');
      return '<div class="todayCard" style="margin-top:12px;border-color:#6a5520"><div class="row between"><div><div class="dateBig">Дополнительные подтягивания по курсу</div></div><span class="tag stage4">КУРС</span></div><div class="planrow"><div class="grow"><div class="strong" style="font-size:15px">Классические подтягивания</div></div><div class="r sets" style="white-space:normal">'+seq+'</div></div><button class="btn ghost full" style="margin-top:10px" onclick="tcStartSupplementWorkout()">Начать</button></div>';
    }


    function tcRenderToday(){
      const now=new Date(),due=tcCourseDue(),l=tcCourseLevel(),c=tcCourseComplex(),items=tcBuildCourseItems(),extras=tcBuildExtraItems();
      q('todayTitle').textContent=fmtDate(now);
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
      if(due){
        q('todaySub').textContent=tcTestDue()?'Контроль прогресса · курс Морозова':'Курс Морозова · '+l.title+' · '+tcCourseGoalName(TC_course.goal);
        q('todayList').innerHTML=tcWeeklyCalendarHtml()+tcPendingLevelHtml()+tcCourseTestCard()+'<div class="todayCard"><div class="row between"><div><div class="dateBig">'+(c.def?c.def.name:'Основной комплекс')+'</div><div class="sessionNo">'+l.frequency+'</div></div><span class="tag">КУРС</span></div>'+tcCourseRowsHtml(items)+'<div class="meta" style="margin-top:10px">Текущий уровень: '+l.title+' · контроль: '+l.mastery+'</div><button class="btn yellow full" style="margin-top:12px" onclick="tcStartCourseWorkout()">Начать основной комплекс</button><button class="btn ghost full" style="margin-top:8px" onclick="tcOpenCourseInfo()">ⓘ Советы автора</button></div>'+tcMasteryCardHtml();
      }else{
        const nextKey=tcWeeklyMode()?tcNextCourseDay():'';
        const next=new Date(TC_course.lastCourseDate+'T12:00:00');next.setDate(next.getDate()+2);
        q('todaySub').textContent=tcWeeklyMode()?'День без основного комплекса · следующая тренировка по календарю':'День без основного комплекса · восстановление тяговой нагрузки';
        let html='<div class="todayCard"><div class="row between"><div><div class="dateBig">Сегодня без курса</div><div class="sessionNo">Следующий основной комплекс — не раньше '+fmtKeyDate(nextKey||dateKey(next),false)+'</div></div><span class="tag stage4">ВОССТАНОВЛЕНИЕ</span></div>';
        if(extras.length){html+='<div class="info" style="margin-top:10px">Подтягивания сегодня не повторяем. Можно выполнить выбранные дополнительные упражнения, которые не относятся к тяговому блоку курса.</div>'+tcExtraRowsHtml(extras)+'<button class="btn yellow full" style="margin-top:12px" onclick="tcStartExtraWorkout()">Начать дополнительную тренировку</button>'}
        else html+='<div class="empty" style="margin-top:12px">Дополнительные упражнения не выбраны. Сегодня можно оставить полный отдых.</div><button class="btn ghost full" style="margin-top:10px" onclick="go(\'exercise\')">Выбрать пресс, ноги или отжимания</button>';
        const conflicts=tcConflictExercises();if(conflicts.length)html+='<div class="info" style="margin-top:10px"><b>Не поставлены автоматически в восстановительный день:</b> '+conflicts.map(e=>e.name).join(', ')+'. Они продолжают нагружать тяговую систему или относятся к сложным элементам.</div>';
        html+='<button class="btn ghost full" style="margin-top:8px" onclick="tcOpenCourseInfo()">ⓘ Советы автора</button></div>'+tcCourseTestCard()+tcMasteryCardHtml()+tcSupplementHtml();q('todayList').innerHTML=tcWeeklyCalendarHtml()+tcPendingLevelHtml()+html;
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
    function tcAuthorExerciseNote(def){
      if(!def)return '';
      const id=def.id||'';
      if(id.includes('wide'))return 'По тексту курса широкий верхний хват сильнее смещает акцент на мышцы спины и подключает стабилизаторы плеча. Автор отмечает, что для большего акцента на спину часто используют частичную амплитуду без полного разгибания рук.';
      if(id.includes('pull80')||id==='c_classic_max'||id.includes('pull50'))return 'Классические подтягивания верхним хватом автор описывает как вариант, где нагрузка относительно равномерно распределяется между мышцами рук и спины.';
      if(id.includes('plyo')||id.includes('high'))return 'Высокие подтягивания в курсе используются для развития взрывной силы; целевые мышцы остаются теми же, что и в классических подтягиваниях.';
      if(id.includes('three_stage'))return 'Трёхстадийные подтягивания автор использует для нейромышечного контроля: движение разделяется на фазы, чтобы лучше контролировать работу в каждой части амплитуды.';
      if(id.includes('asym'))return 'Асимметричные подтягивания увеличивают нагрузку на тянущую сторону, а вспомогательная сторона стабилизирует положение и снимает часть нагрузки.';
      if(id.includes('shrug'))return 'Шраги в курсе направлены на мышцы, опускающие плечо, ротаторы плеча и при большей амплитуде — трапеции.';
      if(id.includes('chin'))return 'Нижний хват немного сильнее переносит нагрузку на бицепс, но автор подчёркивает, что распределение нагрузки сильно зависит от техники.';
      if(def.tip)return def.tip;
      return 'В тексте PDF для этого упражнения в текущем разделе отдельное техническое пояснение не приведено; курс задаёт его место, объём и режим работы в составе комплекса.';
    }

    function tcCurrentCalculationHtml(){
      if(!window.W||!['course','supplement'].includes(W.mode)||!W.items||!W.items.length)return '';
      const x=W.items[W.exerciseIndex],def=x&&(x.def||x.e.courseDef);
      if(!def)return '';
      const sch=def.scheme||{};
      let body='<b>'+x.e.name+'</b><br>';
      if(sch.type==='percent'&&sch.ref==='pull'){
        const raw=TC_course.pullMax*(+sch.pct||0),target=tcSchemeTarget(def);
        body+=def.sets+' подхода × '+target+' повторений.<br>Расчёт: '+TC_course.pullMax+' × '+Math.round((+sch.pct||0)*100)+'% = '+String(Math.round(raw*10)/10).replace('.',',')+' → '+target+'.';
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

    function tcAuthorComplexHtml(c){
      if(!c||!c.def)return '';
      return c.def.items.map(def=>'<div class="tcInfoBlock"><h3>'+def.name+'</h3><p><b>По курсу:</b> '+def.sets+' подх. · '+tcSchemeLabel(def)+' · отдых '+tcCourseRestText(def.rest)+'<br><br>'+tcAuthorExerciseNote(def)+'</p></div>').join('');
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
    function tcProgramExerciseHtml(def){
      const tip=tcAuthorExerciseNote(def);
      const noTip=tip.indexOf('отдельное техническое пояснение не приведено')>=0;
      const note=(!noTip&&tip)?'<details class="tcProgramNote"><summary>Пояснение к упражнению</summary><p>'+tcProgramEscape(tip)+'</p></details>':'';
      return '<div class="tcProgramExercise"><div class="tcProgramExerciseName">'+tcProgramEscape(def.name)+'</div>'+
        '<div class="tcProgramPrescription">'+tcProgramEscape(tcProgramPrescription(def))+'</div>'+
        '<div class="tcProgramRest">Отдых: '+tcProgramEscape(tcCourseRestText(def.rest))+'</div>'+note+'</div>';
    }
    function tcProgramComplexHtml(levelNo,no,complex){
      const active=levelNo===TC_course.level&&no===tcCourseComplexNo();
      return '<details class="tcProgramComplex"'+(active?' open':'')+'><summary><span class="tcProgramChevron">▶</span><span class="tcProgramGrow">'+tcProgramEscape(complex.name)+'</span>'+(active?'<span class="tcProgramCurrent">Следующий</span>':'')+'</summary>'+
        '<div class="tcProgramComplexBody">'+
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
      const c=tcCourseComplex();
      if(!c.def)return '';
      const lines=c.def.items.map(x=>x.name+': '+tcCourseRestText(x.rest));
      return '<div class="tcInfoBlock"><h3>Отдых в текущем комплексе</h3><p>'+lines.map(tcProgramEscape).join('<br>')+'</p></div>';
    }
    function tcAuthorSourceBoundaries(){
      return '<div class="tcInfoBlock"><h3>Питание и восстановление</h3><p>В предоставленном PDF не установлены суточная калорийность, нормы белка, режим питания и продолжительность сна. Приписывать автору конкретные цифры нельзя. Из курса здесь приведены только указанные им дни отдыха, интервалы между подходами и перерыв в дополнительной ежедневной работе.</p></div>';
    }

    window.tcOpenCourseInfo=function(){
      const l=tcCourseLevel(),c=tcCourseComplex(),box=q('sheetbox');
      const goalText=tcAuthorGoalText(TC_course.level,TC_course.goal);
      box.innerHTML='<div class="sheettitle">Советы автора · '+l.title+'</div>'+
      '<div class="sub" style="margin-top:6px">Рекомендации и значения из PDF. Расчёт задания TurnikCoach указан отдельно.</div>'+
      tcCurrentCalculationHtml()+
      '<div class="tcInfoBlock"><h3>Что автор говорит об этом уровне</h3><p>'+tcAuthorLevelText(TC_course.level)+'</p></div>'+
      (goalText?'<div class="tcInfoBlock"><h3>Для выбранной цели</h3><p>'+goalText+'</p></div>':'')+
      '<div class="tcInfoBlock"><h3>Текущий комплекс</h3><p><b>'+(c.def?c.def.name:'—')+'</b><br>'+(c.def&&c.def.purpose?c.def.purpose:'')+'</p></div>'+
      tcAuthorComplexHtml(c)+
      '<div class="tcInfoBlock"><h3>Критерий освоения уровня</h3><p>'+l.mastery+'</p></div>'+
      (l.supplement?'<div class="tcInfoBlock"><h3>Дополнительные подтягивания по курсу</h3><p>'+l.supplement+'</p></div>':'')+
      '<button class="btn yellow full" style="margin-top:14px" onclick="closeSheet()">Понятно</button>';
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
        ['course','supplement'].includes(h.courseMode));
      const lastDate=lastLoad&&lastLoad.date||TC_course.lastCourseDate;
      return !!lastDate&&tcDayDiff(lastDate,dateKey())>=2;
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
      if(level===4)return values.left>=5&&values.right>=5&&values.high>=1;
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
      TC_course.level=p.to;TC_course.courseSeq=0;
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
      if(!tcCourseDue())return;
      const items=tcBuildCourseItems();if(!items.length)return;unlockAudio();
      const c=tcCourseComplex();W={mode:'course',sessionIndex:0,exerciseIndex:0,setIndex:0,items,actual:tcSchemeTarget(items[0].def),early:false,courseLevel:TC_course.level,courseComplex:c.no,courseGoal:TC_course.goal};go('workout');
    };
    window.tcStartExtraWorkout=function(){
      const items=tcBuildExtraItems();if(!items.length)return;unlockAudio();const idx=TC_course.extraSeq%3;W={mode:'extra',sessionIndex:idx,exerciseIndex:0,setIndex:0,items,actual:items[0].plan[0],early:false};go('workout');
    };
    window.tcStartSupplementWorkout=function(){
      const reps=Math.max(1,Math.floor(TC_course.pullMax*.8)),def={id:'c_daily80',name:'Классические подтягивания · авторское дополнение',metric:'reps',sets:10,scheme:{type:'fixed',value:reps,label:String(reps)},rest:{type:'manual',label:'отдых в PDF не задан'}};
      const e={id:def.id,name:def.name,metric:'reps',max:TC_course.pullMax,load:0,courseDef:def};const item={e,def,plan:Array(10).fill(reps),planLabels:Array(10).fill(String(reps)),actual:[]};W={mode:'supplement',sessionIndex:0,exerciseIndex:0,setIndex:0,items:[item],actual:reps,early:false};go('workout');
    };

    function tcPrepareManualRest(label,note){
      window.__tcManualCourseRest=true;go('rest');const title=document.querySelector('#rest h1'),sub=document.querySelector('#rest .sub'),num=q('restNum'),buttons=document.querySelectorAll('#rest button');if(title)title.textContent=label==='минимальный'?'Минимальный отдых':'Отдых по самочувствию';if(sub)sub.textContent=note||('По курсу: '+label);if(num)num.textContent='—';if(buttons[0])buttons[0].textContent='Продолжить';if(buttons[1])buttons[1].style.display='none';
    }
    function tcRestoreRestUI(){const title=document.querySelector('#rest h1'),sub=document.querySelector('#rest .sub'),buttons=document.querySelectorAll('#rest button');if(title)title.textContent='Восстановись';if(sub)sub.textContent='За 3 секунды до окончания прозвучат три сигнала';if(buttons[0])buttons[0].textContent='Готов раньше';if(buttons[1])buttons[1].style.display='block';window.__tcManualCourseRest=false}


    function tcPlanToken(def,x){
      const sch=def.scheme||{};
      if(sch.type==='percent'&&sch.ref==='pull')return String(tcSchemeTarget(def));
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
      if(!W||!['course','supplement','courseTest'].includes(W.mode)){const wp=q('wplan');if(wp)wp.classList.remove('tcCoursePlan');return r;}
      const x=W.items[W.exerciseIndex],def=x.def||x.e.courseDef;if(!def)return r;
      q('wname').textContent=x.e.name;q('wmeta').textContent='Курс Морозова · упражнение '+(W.exerciseIndex+1)+' из '+W.items.length+' · подход '+(W.setIndex+1)+' из '+x.plan.length+(x.e.load?' · +'+x.e.load+' кг':'');q('wplan').classList.add('tcCoursePlan');q('wplan').innerHTML=tcSequenceCoursePlan(def,x);if(W.mode==='courseTest'){q('wplan').innerHTML='<span class="tcPlanMain">MAX</span>';q('target').textContent='MAX';q('chips').innerHTML='<div class="chip">MAX</div>';}q('factUnit').textContent=tcUnitForMetric(def.metric)+(x.e.load?' · +'+x.e.load+' кг':'');const fb=q('mediaFallback'),img=q('visualImg');if(img){img.removeAttribute('src');img.style.display='none'}if(fb)fb.style.display='none';return r;
    };

    const tcBeforeCourseSetDone=window.setDone;
    window.setDone=function(skip){
      if(W&&W.mode==='courseTest'){
        if(skip){q('sheetbox').innerHTML='<div class="sheettitle">Контроль не выполнен</div><button class="btn ghost full" onclick="closeSheet()">Вернуться к попытке</button>';q('sheet').classList.add('open');return}
        const n=Number(W.actual);
        if(!Number.isInteger(n)||n<1){q('sheetbox').innerHTML='<div class="sheettitle">Введите результат</div><div class="sub">Укажите фактически выполненное количество повторений, затем завершите контроль.</div><button class="btn yellow full" onclick="closeSheet()">Вернуться</button>';q('sheet').classList.add('open');return}
        W.items[0].actual[0]=n;
        q('sheetbox').innerHTML='<div class="sheettitle">Подтвердить максимум</div><div class="dateBig" style="margin:12px 0">'+n+' повторений</div><button class="btn yellow full" onclick="tcConfirmCourseTest()">Сохранить результат</button><button class="btn ghost full" style="margin-top:8px" onclick="closeSheet()">Изменить значение</button>';
        q('sheet').classList.add('open');return;
      }
      if(!W||!['course','supplement'].includes(W.mode))return tcBeforeCourseSetDone(skip);
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
      if(!W||!['course','extra','supplement'].includes(W.mode))return tcBeforeCourseFinishWorkout(feel);
      let total=0,details=[];W.items.forEach(x=>{const actual=x.plan.map((_,i)=>x.actual[i]===undefined?null:x.actual[i]);const sum=actual.reduce((s,v)=>s+(Number.isFinite(+v)?+v:0),0);total+=sum;details.push({id:x.e.id,name:x.e.name,metric:x.e.metric,load:x.e.load||0,plan:x.plan.slice(),planLabels:(x.planLabels||x.plan.map(String)).slice(),actual,sum})});
      const rec={type:'workout',date:dateKey(),ts:Date.now(),feedback:feel,total,details,early:!!W.early,courseMode:W.mode,session:W.mode==='extra'?'доп.':'курс'};
      if(W.mode==='course'){rec.courseLevel=W.courseLevel;rec.courseComplex=W.courseComplex;rec.courseGoal=W.courseGoal;TC_course.history.unshift(rec);TC_course.courseSeq++;TC_course.lastCourseDate=rec.date;TC_course.lastCourseTs=rec.ts;if(!TC_course.testAnchorDate)TC_course.testAnchorDate=rec.date;tcSaveCourse()}
      else if(W.mode==='extra'){TC_course.extraSeq++;tcSaveCourse();state.history.unshift(rec);save()}
      else {rec.courseLevel=TC_course.level;rec.courseComplex='дополнение';TC_course.history.unshift(rec);tcSaveCourse()}
      q('sheet').classList.remove('open');W=null;go('today');
    };

    const tcBeforeCourseInfo=window.tcOpenTrainingInfo;
    window.tcOpenTrainingInfo=function(){if(TC_course.enabled&&(W&&['course','supplement','courseTest'].includes(W.mode)||q('today').classList.contains('on')))return tcOpenCourseInfo();return tcBeforeCourseInfo()};


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
    function tcCourseHistoryHtml(){if(!TC_course.enabled&&!TC_course.history.length)return'';const rows=TC_course.history.slice(0,8).map(h=>'<div class="historyitem"><div class="row between"><div><div class="strong" style="font-size:14px">'+(h.courseMode==='supplement'?'Дополнительные подтягивания по курсу':'Курс Морозова · уровень '+h.courseLevel+' · комплекс '+h.courseComplex)+'</div><div class="meta">'+fmtRecordDate(h)+' · '+(h.feedback||'—')+'</div></div><span class="badge">КУРС</span></div>'+(h.details||[]).map(d=>'<div class="meta" style="margin-top:6px">'+d.name+': '+d.actual.map(v=>v===null?'—':v).join(' · ')+'</div>').join('')+'</div>').join('');return '<div class="exerciseProgressCard"><div class="progressHead"><div><div class="progressName">Курс Морозова</div><div class="meta">Отдельная история основной тяговой программы</div></div><span class="badge">ур. '+TC_course.level+'</span></div><div class="tcInfoBlock"><h3>Критерий текущего уровня</h3><p>'+tcCourseLevel().mastery+'</p></div>'+tcCourseTestsHtml()+rows+'</div>'}
    const tcBeforeCourseRenderHistory=window.renderHistory;
    window.renderHistory=function(){const r=tcBeforeCourseRenderHistory();const host=q('exerciseProgress');if(host){const old=document.getElementById('tcCourseHistoryWrap');if(old)old.remove();const wrap=document.createElement('div');wrap.id='tcCourseHistoryWrap';wrap.innerHTML=tcCourseHistoryHtml();host.parentNode.insertBefore(wrap,host)}return r};

    const tcBeforeCourseRender=window.render;
    window.render=function(){const r=tcBeforeCourseRender();tcDecorateCourseCatalog();if(TC_course.enabled&&q('today').classList.contains('on'))tcRenderToday();return r};

    // Initial redraw after installing the module.
    tcInjectCourseUiStyles();
    render();

})();
