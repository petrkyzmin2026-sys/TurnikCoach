/* TURNIKCOACH_HOTFIX 5.16.0-morozov-course */
(function(){
  'use strict';
  const VERSION='5.16.0-morozov-course';
  const LABEL='5.16.0';
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
    text.innerHTML='Добавлен отдельный курс Артёма Морозова «Подтягивания с нуля до киборга»: 7 уровней, авторские комплексы, проценты/MAX, интервалы отдыха и критерии перехода. В дни без основного комплекса TurnikCoach предлагает выбранные дополнительные упражнения — например пресс, ноги или отжимания.<br><br>Установить обновление сейчас?';
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


  const COURSE_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/course.js';
  const COURSE_MODULE_CACHE='tc_course_module_cache_v1';
  function tcValidCourseModule(js){return typeof js==='string'&&js.length>1000&&js.length<256000&&js.includes('TURNIKCOACH_COURSE')}
  function tcEvalCourseModule(js){
    if(!tcValidCourseModule(js))return false;
    try{(0,eval)(js);return true}catch(e){console.error('TurnikCoach course module',e);return false}
  }
  function tcLoadCourseModule(){
    let cached='';
    try{cached=localStorage.getItem(COURSE_MODULE_CACHE)||''}catch(e){}
    if(tcValidCourseModule(cached))tcEvalCourseModule(cached);
    try{
      fetch(COURSE_MODULE_URL,{cache:'no-store'}).then(r=>r.ok?r.text():Promise.reject(new Error('HTTP '+r.status))).then(js=>{
        if(!tcValidCourseModule(js))return;
        try{localStorage.setItem(COURSE_MODULE_CACHE,js)}catch(e){}
        if(window.__TC_COURSE_MODULE_VERSION!=='1.0.0-morozov')tcEvalCourseModule(js);
      }).catch(()=>{});
    }catch(e){}
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
