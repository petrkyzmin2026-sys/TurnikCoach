/* TURNIKCOACH_HOTFIX 5.14.0-adaptive-rest */
(function(){
  'use strict';
  const VERSION='5.14.0-adaptive-rest';
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

  const originalStartRest=window.startRest;
  window.startRest=function(sec,note){
    const el=restReasonEl();
    if(el)el.textContent=note||'Отдых рассчитан по нагрузке и факту предыдущего подхода';
    return originalStartRest(sec);
  };

  const originalAddRest=window.addRest;
  window.addRest=function(){
    originalAddRest();
    const el=restReasonEl();
    if(el&&!/добавлено вручную/.test(el.textContent))el.textContent+=' · добавлено вручную +30 с';
  };

  window.setDone=function(skip){
    if(!W)return;
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

    beep(480,.42,.16);
    if(W.exerciseIndex<W.items.length-1){
      const next=W.items[W.exerciseIndex+1];
      const rest=window.transitionRest(x.e,next.e,W.sessionIndex,target,actual,!!skip);
      W.exerciseIndex++;
      W.setIndex=0;
      W.actual=W.items[W.exerciseIndex].plan[0];
      window.startRest(rest.seconds,rest.note);
      return;
    }
    askFeedback(false);
  };

  restReasonEl();
  console.log('TurnikCoach hotfix active:',VERSION);
})();
