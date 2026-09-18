/* TURNIKCOACH_HOTFIX 5.14.2-consent-update */
(function(){
  'use strict';
  const VERSION='5.14.2-consent-update';
  const LABEL='5.14.2';
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
    text.innerHTML='Обновление содержит исправление звукового сигнала и корректный отсчёт отдыха после сворачивания приложения.<br><br>Установить обновление сейчас?';
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
    if(el)el.textContent=note||'Отдых рассчитан по нагрузке и факту предыдущего подхода';
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
    restReasonEl();
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
