/* TURNIKCOACH_COURSE 1.0.0-morozov */
(function(){
  'use strict';
  const COURSE_MODULE_VERSION='1.0.0-morozov';
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
      return{enabled:false,level:m<=1?1:m<=3?2:m<=14?3:4,goal:'quantity',pullMax:m,weightedLoad:+((weighted&&weighted.load)||0),courseSeq:0,extraSeq:0,lastCourseDate:'',lastCourseTs:0,authorSupplement:false,history:[],tests:[]};
    }
    function tcLoadCourse(){
      let c=tcCourseDefault();
      try{const raw=JSON.parse(localStorage.getItem(TC_COURSE_KEY)||'null');if(raw&&typeof raw==='object')c={...c,...raw}}catch(e){}
      c.level=tcClamp(Math.floor(+c.level||1),1,7);c.pullMax=Math.max(1,Math.floor(+c.pullMax||1));c.weightedLoad=Math.max(0,+c.weightedLoad||0);c.courseSeq=Math.max(0,Math.floor(+c.courseSeq||0));c.extraSeq=Math.max(0,Math.floor(+c.extraSeq||0));c.history=Array.isArray(c.history)?c.history:[];c.tests=Array.isArray(c.tests)?c.tests:[];
      return c;
    }
    let TC_course=tcLoadCourse();
    function tcSaveCourse(){try{localStorage.setItem(TC_COURSE_KEY,JSON.stringify(TC_course));return true}catch(e){console.error('course save',e);return false}}
    function tcCourseLevel(){return TC_COURSE[TC_course.level]||TC_COURSE[1]}
    function tcCourseGoalName(g){return g==='muscleup'?'Выход силой':g==='onearm'?'Подтягивание на одной руке':'Количество подтягиваний'}
    function tcGoalOptions(level){if(level<=3)return[['quantity','Количество подтягиваний']];if(level===4)return[['quantity','Количество подтягиваний'],['muscleup','Выход силой'],['onearm','Подтягивание на одной руке']];return[['muscleup','Выход силой'],['onearm','Подтягивание на одной руке']]}
    function tcNormalizeGoal(){const a=tcGoalOptions(TC_course.level).map(x=>x[0]);if(!a.includes(TC_course.goal))TC_course.goal=a[0]}
    function tcCourseComplexNo(){
      const l=tcCourseLevel(),ids=Object.keys(l.complexes).map(Number);
      if(TC_course.level===4){if(TC_course.goal==='muscleup')return 1;if(TC_course.goal==='onearm')return 2;const seq=[3,3,3,1,3,3,3,2];return seq[TC_course.courseSeq%seq.length]}
      if(TC_course.level===5){return TC_course.goal==='onearm'?2:1}
      if(TC_course.level===7){return TC_course.goal==='muscleup'?2:1}
      const seq=l.sequence&&l.sequence.length?l.sequence:ids;
      return seq[TC_course.courseSeq%seq.length]||ids[0]||1;
    }
    function tcCourseComplex(){const no=tcCourseComplexNo();return{no,def:tcCourseLevel().complexes[no]}}
    function tcDayDiff(a,b){if(!a||!b)return 999;const x=new Date(a+'T12:00:00'),y=new Date(b+'T12:00:00');return Math.round((y-x)/86400000)}
    function tcCourseDue(){if(!TC_course.lastCourseDate)return true;return tcDayDiff(TC_course.lastCourseDate,dateKey())>=2}
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
        '<button class="btn '+(enabled?'ghost':'yellow')+' full" style="margin-top:12px" onclick="tcOpenCourseSettings()">'+(enabled?'Настроить курс':'Подключить курс')+'</button></div>';
    }
    window.tcOpenCourseSettings=function(){
      tcNormalizeGoal();const l=tcCourseLevel(),goals=tcGoalOptions(TC_course.level);
      const box=q('sheetbox');
      box.innerHTML='<div class="sheettitle">Курс Морозова</div><div class="sub" style="margin-top:6px">Курс работает отдельным блоком. Обычный каталог остаётся для пресса, ног, отжиманий и другой дополнительной работы.</div>'+
      '<div class="tcInfoBlock"><h3>Состояние</h3><p><label style="display:flex;gap:9px;align-items:center"><input id="tcCourseEnabled" type="checkbox" '+(TC_course.enabled?'checked':'')+'> использовать курс подтягиваний</label></p></div>'+
      '<div class="tcInfoBlock"><h3>Уровень</h3><p><select id="tcCourseLevel" style="width:100%;margin-top:4px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px">'+Object.keys(TC_COURSE).map(n=>'<option value="'+n+'" '+(+n===TC_course.level?'selected':'')+'>'+n+' · '+TC_COURSE[n].title+'</option>').join('')+'</select></p></div>'+
      '<div class="tcInfoBlock"><h3>Текущий максимум</h3><p><input id="tcCourseMax" type="number" min="1" value="'+TC_course.pullMax+'" style="width:100%;box-sizing:border-box;margin-top:4px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px"></p></div>'+
      '<div class="tcInfoBlock"><h3>Цель</h3><p><select id="tcCourseGoal" style="width:100%;margin-top:4px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px">'+goals.map(g=>'<option value="'+g[0]+'" '+(g[0]===TC_course.goal?'selected':'')+'>'+g[1]+'</option>').join('')+'</select></p></div>'+
      '<div class="tcInfoBlock"><h3>Дополнительный вес</h3><p>Используется в комплексах, где курс назначает тяжёлые подтягивания с весом.<input id="tcCourseLoad" type="number" min="0" step="0.5" value="'+TC_course.weightedLoad+'" style="width:100%;box-sizing:border-box;margin-top:7px;background:#0c1218;color:#fff;border:1px solid #3a4653;border-radius:10px;padding:10px"></p></div>'+
      (l.supplement?'<div class="tcInfoBlock"><h3>Авторское дополнение</h3><p><label style="display:flex;gap:9px;align-items:flex-start"><input id="tcCourseSupplement" type="checkbox" '+(TC_course.authorSupplement?'checked':'')+'><span>'+l.supplement+'</span></label></p></div>':'')+
      '<div class="tcInfoBlock"><h3>Критерий освоения уровня</h3><p>'+l.mastery+'</p></div>'+
      '<button class="btn yellow full" style="margin-top:14px" onclick="tcSaveCourseSettings()">Сохранить</button><button class="btn ghost full" style="margin-top:8px" onclick="closeSheet()">Отмена</button>';
      q('sheet').classList.add('open');
      const levelEl=document.getElementById('tcCourseLevel');if(levelEl)levelEl.onchange=()=>{TC_course.level=tcClamp(+levelEl.value||1,1,7);tcNormalizeGoal();tcSaveCourse();closeSheet();tcOpenCourseSettings()};
    };
    window.tcSaveCourseSettings=function(){
      const enabled=document.getElementById('tcCourseEnabled'),level=document.getElementById('tcCourseLevel'),mx=document.getElementById('tcCourseMax'),goal=document.getElementById('tcCourseGoal'),load=document.getElementById('tcCourseLoad'),sup=document.getElementById('tcCourseSupplement');
      TC_course.enabled=!!(enabled&&enabled.checked);TC_course.level=tcClamp(+(level&&level.value)||TC_course.level,1,7);TC_course.pullMax=Math.max(1,Math.floor(+(mx&&mx.value)||TC_course.pullMax));TC_course.goal=(goal&&goal.value)||TC_course.goal;TC_course.weightedLoad=Math.max(0,+(load&&load.value)||0);if(sup)TC_course.authorSupplement=!!sup.checked;tcNormalizeGoal();
      if(TC_course.enabled){state.ex.forEach(e=>{if(TC_PULL_CONFLICT_IDS.has(e.id)){e.sel=false;e.main=false}})}
      const pull=state.ex.find(e=>e.id==='pull');if(pull)pull.max=TC_course.pullMax;const wp=state.ex.find(e=>e.id==='weightedPull');if(wp)wp.load=TC_course.weightedLoad;
      tcSaveCourse();save();closeSheet();render();
    };

    function tcDecorateCourseCatalog(){
      const host=q('exerciseList');if(!host)return;
