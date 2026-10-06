/* TURNIKCOACH_PROGRESS 1.0.0 */
(function(){
'use strict';
const VERSION='1.0.0';
if(window.TurnikProgress&&window.TurnikProgress.version===VERSION)return;
function store(){return window.TurnikWorkoutStore||null}
function dateLabel(k){
if(!/^\d{4}-\d{2}-\d{2}$/.test(k||''))return k||'—';
const p=k.split('-');return p[2]+'.'+p[1]+'.'+p[0];
}
function titleOf(x){
const r=x.raw||{};
if(x.source==='course'){
if(x.mode==='course')return'Курс Морозова'+(x.courseComplex!=null?' · комплекс '+x.courseComplex:'');
if(x.mode==='auxCourse')return'Морозов · вспомогательный комплекс';
if(x.mode==='supplement')return'Морозов · дополнительная тяга';
return'Курс Морозова';
}
if(x.mode==='extra'||r.courseMode==='extra')return'Дополнительная тренировка';
return r.session?('Тренировка '+r.session):'Тренировка';
}
function badgeOf(x){
if(x.source==='course')return'КУРС';
if(x.mode==='extra'||(x.raw&&x.raw.courseMode==='extra'))return'ДОП.';
return'ТРЕНИРОВКА';
}
function detailsHtml(x){
return(x.details||[]).map(d=>{
const vals=(d.actual||[]).map(v=>v===null?'—':v===undefined?'·':String(v)).join(' · ');
const load=d.load?(' · +'+d.load+' кг'):'';
return '<div class="meta" style="margin-top:6px">'+(d.name||'Упражнение')+load+': '+(vals||'—')+'</div>';
}).join('');
}
function historyHtml(){
const st=store(),a=st?st.list({limit:40}):[];
if(!a.length)return'<div class="empty">История тренировок пока пустая.</div>';
return'<div class="row between" style="margin-bottom:10px"><div><div class="strong">История тренировок</div><div class="meta">Все завершённые тренировки в одном хронологическом списке.</div></div></div>'+
a.map(x=>{
const moved=x.transferred&&x.plannedDate&&x.plannedDate!==x.date?' · перенос с '+dateLabel(x.plannedDate):'';
return'<div class="historyitem"><div class="row between"><div><div class="strong" style="font-size:14px">'+titleOf(x)+'</div><div class="meta">'+dateLabel(x.date)+(x.feedback?' · '+x.feedback:'')+moved+'</div></div><span class="badge">'+badgeOf(x)+'</span></div>'+detailsHtml(x)+'</div>';
}).join('');
}
function renderHistory(){
const host=document.getElementById('historyList'),st=store();
if(!host||!st)return false;
host.innerHTML=historyHtml();host.dataset.tcUnifiedHistory='1';return true;
}
function drawEmpty(ctx,w,h,text){
ctx.clearRect(0,0,w,h);ctx.fillStyle='#10171d';ctx.fillRect(0,0,w,h);
ctx.fillStyle='#8995a3';ctx.font='13px Arial';ctx.textAlign='center';ctx.fillText(text,w/2,h/2);
}
function drawVolume(){
const c=document.getElementById('volumeChart'),st=store();if(!c||!st)return false;
const data=st.list({limit:8}).reverse(),dpr=Math.max(1,window.devicePixelRatio||1),r=c.getBoundingClientRect();
const w=r.width,h=r.height;c.width=Math.max(1,Math.floor(w*dpr));c.height=Math.max(1,Math.floor(h*dpr));
const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
if(!data.length){drawEmpty(ctx,w,h,'После первой тренировки здесь появится график');return true}
const vals=data.map(x=>st.metrics(x).reps),max=Math.max(...vals,1),pad={l:36,r:12,t:15,b:28},pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;
ctx.clearRect(0,0,w,h);ctx.fillStyle='#10171d';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#2c3742';ctx.lineWidth=1;
for(let i=0;i<=4;i++){const y=pad.t+ph*i/4;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke()}
const gap=pw/data.length,bw=Math.min(28,gap/1.7);
data.forEach((x,i)=>{const v=vals[i],bh=ph*v/max,xx=pad.l+gap*i+(gap-bw)/2,y=pad.t+ph-bh;ctx.fillStyle='#ffd84d';ctx.fillRect(xx,y,bw,bh);ctx.fillStyle='#9aa5b3';ctx.font='10px Arial';ctx.textAlign='center';ctx.fillText((x.date||'').slice(5),xx+bw/2,h-9)});
ctx.fillStyle='#9aa5b3';ctx.font='10px Arial';ctx.textAlign='right';ctx.fillText(String(max),pad.l-5,pad.t+4);ctx.fillText('0',pad.l-5,pad.t+ph+3);return true;
}
function render(){
const ok=renderHistory();
const card=document.getElementById('volumeChart')&&document.getElementById('volumeChart').closest('.chartCard');
if(card){const t=card.querySelector('.chartTitle'),l=card.querySelector('.legendMini');if(t)t.textContent='Объём всех тренировок';if(l)l.textContent='Фактические повторения из обычных тренировок и курса Морозова.'}
setTimeout(drawVolume,70);return ok;
}
function install(){
if(!window.TurnikUI||typeof window.TurnikUI.registerAddon!=='function')return false;
window.TurnikUI.registerAddon('progress','unified-history',100,()=>render());return true;
}
window.TurnikProgress={version:VERSION,install,render,renderHistory,drawVolume,debug:()=>({version:VERSION,installed:!!(window.TurnikUI&&window.TurnikUI.debug().addons.progress&&window.TurnikUI.debug().addons.progress.some(x=>x.name==='unified-history'))})};
install();
try{window.dispatchEvent(new CustomEvent('turnikprogress:ready',{detail:{version:VERSION}}))}catch(e){}
})();