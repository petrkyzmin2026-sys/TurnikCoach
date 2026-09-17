/* TURNIKCOACH_HOTFIX 5.14.1-sound-background-timer */
(function(){
  'use strict';
  const VERSION='5.14.1-sound-background-timer';
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
})();
