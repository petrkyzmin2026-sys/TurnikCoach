/* TURNIKCOACH_HOTFIX 5.16.52-workout-action-owner */
(function(){
'use strict';
const VERSION='5.16.52-workout-action-owner';
const LABEL='5.16.52';
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
text.innerHTML="Продолжена архитектурная очистка без изменения привычного интерфейса. Теперь действие «Сделано / Пропустить» имеет одного владельца — TurnikWorkoutActions. Курс Морозова, виброотклик, исправление предыдущего подхода и сохранение активной тренировки больше не переопределяют setDone друг поверх друга, а подключаются к единому диспетчеру. Это снижает риск некликабельных кнопок и конфликтов между режимами.<br><br>Установить обновление сейчас?";
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
yes.onclick=async()=>{
if(typeof W!=='undefined'&&W){
text.textContent='Сначала завершите или отмените текущую тренировку. Обновление перезапустит экран, чтобы не потерять незаписанные подходы.';
return;
}
yes.disabled=true;later.disabled=true;yes.textContent='Подготовка…';
text.textContent='Проверяю и сохраняю модули обновления. История тренировок не изменяется.';
const modulesReady=await tcEnsureRequiredModules();
if(!modulesReady){
yes.disabled=false;later.disabled=false;yes.textContent='Повторить';
text.textContent='Не удалось подготовить модуль курса. Проверьте интернет и повторите — текущая версия приложения остаётся без изменений.';
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
const CORE_MODULE_BUNDLED="/* TURNIKCOACH_CORE 1.0.0 */\n(function(){\n'use strict';\nconst VERSION='1.0.0';\nif(window.TurnikCore&&window.TurnikCore.version===VERSION)return;\nconst listeners=new Map(),sources=new Map();\nfunction clone(v){try{return JSON.parse(JSON.stringify(v))}catch(e){return null}}\nfunction readText(key,fallback=''){try{const v=localStorage.getItem(key);return v==null?fallback:v}catch(e){return fallback}}\nfunction writeText(key,value){try{localStorage.setItem(key,String(value));return true}catch(e){return false}}\nfunction readJSON(key,fallback=null){try{const raw=localStorage.getItem(key);if(raw==null)return clone(fallback);const v=JSON.parse(raw);return v==null?clone(fallback):v}catch(e){return clone(fallback)}}\nfunction writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(e){return false}}\nfunction remove(key){try{localStorage.removeItem(key);return true}catch(e){return false}}\nfunction on(type,fn){\nif(typeof fn!=='function')return()=>{};\nif(!listeners.has(type))listeners.set(type,new Set());\nlisteners.get(type).add(fn);\nreturn()=>{const set=listeners.get(type);if(set)set.delete(fn)};\n}\nfunction emit(type,payload){\nconst set=listeners.get(type);if(!set)return;\n[...set].forEach(fn=>{try{fn(payload)}catch(e){console.error('TurnikCore event',type,e)}});\n}\nfunction registerSource(name,adapter){\nif(!name||!adapter||typeof adapter.snapshot!=='function')return false;\nsources.set(String(name),adapter);emit('source:registered',{name:String(name)});return true;\n}\nfunction source(name){return sources.get(String(name))||null}\nfunction sourceSnapshot(name){\nconst a=source(name);if(!a)return null;\ntry{return clone(a.snapshot())}catch(e){console.error('TurnikCore source snapshot',name,e);return null}\n}\nfunction normalizeWorkout(record,sourceName){\nif(!record||typeof record!=='object')return null;\nconst ts=Number(record.ts||record.timestamp||0)||0;\nconst date=String(record.date||'');\nconst mode=String(record.courseMode||record.mode||record.session||record.type||'workout');\nconst details=Array.isArray(record.details)?record.details:\n Array.isArray(record.exercises)?record.exercises:[];\nreturn{\nid:String(sourceName)+':'+String(ts||date||'0')+':'+mode,\nsource:String(sourceName),\nts,date,mode,\nsession:record.session||'',\nfeedback:record.feedback||record.feel||'',\ncourseLevel:record.courseLevel==null?null:record.courseLevel,\ncourseComplex:record.courseComplex==null?null:record.courseComplex,\ncourseGoal:record.courseGoal||'',\nplannedDate:record.plannedDate||date,\ntransferred:!!record.transferred,\nrunId:record.runId||'',\ndetails:clone(details)||[],\nraw:clone(record)\n};\n}\nfunction historyFrom(name){\nconst a=source(name);if(!a)return[];\nlet rows=[];\ntry{rows=typeof a.history==='function'?a.history():[]}catch(e){console.error('TurnikCore source history',name,e)}\nreturn(Array.isArray(rows)?rows:[]).map(r=>normalizeWorkout(r,name)).filter(Boolean);\n}\nfunction allHistory(){\nconst rows=[];for(const name of sources.keys())rows.push(...historyFrom(name));\nconst seen=new Set(),out=[];\nrows.sort((a,b)=>(b.ts||0)-(a.ts||0));\nfor(const r of rows){\nconst sig=r.source+'|'+r.ts+'|'+r.date+'|'+r.mode+'|'+(r.courseComplex??'');\nif(seen.has(sig))continue;seen.add(sig);out.push(r);\n}\nreturn out;\n}\nfunction snapshot(){\nconst out={version:VERSION,sources:{}};\nfor(const name of sources.keys())out.sources[name]=sourceSnapshot(name);\nreturn out;\n}\nfunction replaceSource(name,next){\nconst a=source(name);if(!a||typeof a.restore!=='function')return false;\ntry{const ok=a.restore(clone(next));if(ok!==false)emit('state:changed',{source:name});return ok!==false}catch(e){console.error('TurnikCore source restore',name,e);return false}\n}\nfunction transact(name,mutator){\nconst a=source(name);if(!a||typeof mutator!=='function')return false;\nconst before=sourceSnapshot(name);if(before==null)return false;\nconst next=clone(before);let result;\ntry{result=mutator(next)}catch(e){console.error('TurnikCore transaction',name,e);return false}\nif(result===false)return false;\nreturn replaceSource(name,next);\n}\nwindow.TurnikCore={\nversion:VERSION,\nstorage:{readText,writeText,readJSON,writeJSON,remove},\nevents:{on,emit},\nregisterSource,source,sourceSnapshot,snapshot,replaceSource,transact,\nhistory:{all:allHistory,from:historyFrom,normalize:normalizeWorkout},\ndebug(){return{version:VERSION,sources:[...sources.keys()],historyCount:allHistory().length}}\n};\ntry{window.dispatchEvent(new CustomEvent('turnikcore:ready',{detail:{version:VERSION}}))}catch(e){}\n})();";
const TC_DOMAIN_MODULE_VERSION='1.0.0';
const TC_DOMAIN_MODULE_MARKER='TURNIKCOACH_DOMAIN 1.0.0';
const TC_DOMAIN_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/domain.js?v='+encodeURIComponent(TC_DOMAIN_MODULE_VERSION);
const TC_DOMAIN_CACHE_KEY='tc_module_domain_'+TC_DOMAIN_MODULE_VERSION;
const TC_UI_MODULE_VERSION='1.0.0';
const TC_UI_MODULE_MARKER='TURNIKCOACH_UI 1.0.0';
const TC_UI_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/ui.js?v='+encodeURIComponent(TC_UI_MODULE_VERSION);
const TC_UI_CACHE_KEY='tc_module_ui_'+TC_UI_MODULE_VERSION;
const TC_STORE_MODULE_VERSION='1.2.0-undo-restore';
const TC_STORE_MODULE_MARKER='TURNIKCOACH_WORKOUT_STORE 1.2.0-undo-restore';
const TC_STORE_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/store.js?v='+encodeURIComponent(TC_STORE_MODULE_VERSION);
const TC_STORE_CACHE_KEY='tc_module_store_'+TC_STORE_MODULE_VERSION;
const TC_ACTIONS_MODULE_VERSION='1.0.0';
const TC_ACTIONS_MODULE_MARKER='TURNIKCOACH_WORKOUT_ACTIONS 1.0.0';
const TC_ACTIONS_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/actions.js?v='+encodeURIComponent(TC_ACTIONS_MODULE_VERSION);
const TC_ACTIONS_CACHE_KEY='tc_module_actions_'+TC_ACTIONS_MODULE_VERSION;
const TC_COURSE_MODULE_VERSION='1.0.42-action-owner';
const TC_COURSE_MODULE_MARKER='TURNIKCOACH_COURSE 1.0.42-action-owner';
const TC_COURSE_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/course.js?v='+encodeURIComponent(TC_COURSE_MODULE_VERSION);
const TC_COURSE_CACHE_KEY='tc_module_course_'+TC_COURSE_MODULE_VERSION;
let tcDomainPrimePromise=null,tcUiPrimePromise=null,tcStorePrimePromise=null,tcActionsPrimePromise=null,tcCoursePrimePromise=null;
function tcEvalModule(js,label){try{(0,eval)(js);return true}catch(e){console.error('TurnikCoach module '+label,e);return false}}
function tcLoadCoreModule(){
if(window.TurnikCore&&window.TurnikCore.version==='1.0.0')return true;
return tcEvalModule(CORE_MODULE_BUNDLED,'core')&&!!window.TurnikCore;
}
function tcReadModuleCache(key){try{return localStorage.getItem(key)||''}catch(e){return''}}
function tcWriteModuleCache(key,js){try{localStorage.setItem(key,js);return true}catch(e){return false}}
function tcValidDomainModule(js){return typeof js==='string'&&js.length>500&&js.length<64000&&js.includes(TC_DOMAIN_MODULE_MARKER)}
function tcValidUiModule(js){return typeof js==='string'&&js.length>500&&js.length<64000&&js.includes(TC_UI_MODULE_MARKER)}
function tcValidStoreModule(js){return typeof js==='string'&&js.length>500&&js.length<64000&&js.includes(TC_STORE_MODULE_MARKER)}
function tcValidActionsModule(js){return typeof js==='string'&&js.length>500&&js.length<64000&&js.includes(TC_ACTIONS_MODULE_MARKER)}
function tcValidCourseModule(js){return typeof js==='string'&&js.length>1000&&js.length<256000&&js.includes(TC_COURSE_MODULE_MARKER)}
function tcDomainCacheReady(){return tcValidDomainModule(tcReadModuleCache(TC_DOMAIN_CACHE_KEY))}
function tcUiCacheReady(){return tcValidUiModule(tcReadModuleCache(TC_UI_CACHE_KEY))}
function tcStoreCacheReady(){return tcValidStoreModule(tcReadModuleCache(TC_STORE_CACHE_KEY))}
function tcActionsCacheReady(){return tcValidActionsModule(tcReadModuleCache(TC_ACTIONS_CACHE_KEY))}
function tcCourseCacheReady(){return tcValidCourseModule(tcReadModuleCache(TC_COURSE_CACHE_KEY))}
function tcLoadDomainModule(){
if(window.TurnikDomain&&window.TurnikDomain.version===TC_DOMAIN_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_DOMAIN_CACHE_KEY);
return tcValidDomainModule(cached)&&tcEvalModule(cached,'domain')&&!!window.TurnikDomain;
}
function tcLoadUiModule(){
if(window.TurnikUI&&window.TurnikUI.version===TC_UI_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_UI_CACHE_KEY);
return tcValidUiModule(cached)&&tcEvalModule(cached,'ui')&&!!window.TurnikUI;
}
function tcLoadStoreModule(){
if(window.TurnikWorkoutStore&&window.TurnikWorkoutStore.version===TC_STORE_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_STORE_CACHE_KEY);
return tcValidStoreModule(cached)&&tcEvalModule(cached,'store')&&!!window.TurnikWorkoutStore;
}
function tcLoadActionsModule(){
if(window.TurnikWorkoutActions&&window.TurnikWorkoutActions.version===TC_ACTIONS_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_ACTIONS_CACHE_KEY);
return tcValidActionsModule(cached)&&tcEvalModule(cached,'actions')&&!!window.TurnikWorkoutActions;
}
function tcLoadCourseModule(){
if(window.__TC_COURSE_MODULE_VERSION===TC_COURSE_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_COURSE_CACHE_KEY);
return tcValidCourseModule(cached)&&tcEvalModule(cached,'course');
}
function tcPrimeModule(url,key,valid,label){
return fetch(url,{cache:'no-store'})
.then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.text()})
.then(js=>{if(!valid(js))throw new Error('invalid '+label+' module');if(!tcWriteModuleCache(key,js))throw new Error(label+' cache write failed');return true})
.catch(e=>{console.error('TurnikCoach '+label+' module download',e);return false});
}
function tcPrimeDomainModule(){
if(!tcDomainPrimePromise)tcDomainPrimePromise=tcPrimeModule(TC_DOMAIN_MODULE_URL,TC_DOMAIN_CACHE_KEY,tcValidDomainModule,'domain');
return tcDomainPrimePromise;
}
function tcPrimeUiModule(){
if(!tcUiPrimePromise)tcUiPrimePromise=tcPrimeModule(TC_UI_MODULE_URL,TC_UI_CACHE_KEY,tcValidUiModule,'ui');
return tcUiPrimePromise;
}
function tcPrimeStoreModule(){
if(!tcStorePrimePromise)tcStorePrimePromise=tcPrimeModule(TC_STORE_MODULE_URL,TC_STORE_CACHE_KEY,tcValidStoreModule,'store');
return tcStorePrimePromise;
}
function tcPrimeActionsModule(){
if(!tcActionsPrimePromise)tcActionsPrimePromise=tcPrimeModule(TC_ACTIONS_MODULE_URL,TC_ACTIONS_CACHE_KEY,tcValidActionsModule,'actions');
return tcActionsPrimePromise;
}
function tcPrimeCourseModule(){
if(!tcCoursePrimePromise)tcCoursePrimePromise=tcPrimeModule(TC_COURSE_MODULE_URL,TC_COURSE_CACHE_KEY,tcValidCourseModule,'course');
return tcCoursePrimePromise;
}
async function tcEnsureRequiredModules(){
if(!tcLoadCoreModule())return false;
const tasks=[];
if(!tcDomainCacheReady())tasks.push(tcPrimeDomainModule());
if(!tcUiCacheReady())tasks.push(tcPrimeUiModule());
if(!tcStoreCacheReady())tasks.push(tcPrimeStoreModule());
if(!tcActionsCacheReady())tasks.push(tcPrimeActionsModule());
if(!tcCourseCacheReady())tasks.push(tcPrimeCourseModule());
if(tasks.length){const ready=await Promise.all(tasks);if(ready.some(x=>!x))return false}
return tcDomainCacheReady()&&tcUiCacheReady()&&tcStoreCacheReady()&&tcActionsCacheReady()&&tcCourseCacheReady();
}
function tcRegisterCoreSources(){
const core=window.TurnikCore;if(!core)return false;
core.registerSource('generic',{
snapshot:()=>typeof state!=='undefined'?state:null,
history:()=>typeof state!=='undefined'&&state&&Array.isArray(state.history)?state.history:[],
restore:next=>{if(typeof state==='undefined'||!next)return false;state=next;try{localStorage.setItem('tc_v4',JSON.stringify(next));return true}catch(e){console.error('TurnikCoach generic state restore',e);return false}}
});
core.registerSource('course',{
snapshot:()=>typeof window.tcGetCourseStateSnapshot==='function'?window.tcGetCourseStateSnapshot():null,
history:()=>{const x=typeof window.tcGetCourseStateSnapshot==='function'?window.tcGetCourseStateSnapshot():null;return x&&Array.isArray(x.history)?x.history:[]},
restore:next=>typeof window.tcRestoreCourseStateSnapshot==='function'?window.tcRestoreCourseStateSnapshot(next):false
});
window.__TC_CORE_FOUNDATION={version:core.version,domainModule:window.TurnikDomain&&window.TurnikDomain.version||'',uiModule:window.TurnikUI&&window.TurnikUI.version||'',storeModule:window.TurnikWorkoutStore&&window.TurnikWorkoutStore.version||'',actionsModule:window.TurnikWorkoutActions&&window.TurnikWorkoutActions.version||'',courseModule:TC_COURSE_MODULE_VERSION,modular:true};
return true;
}
tcLoadCoreModule();
tcPrimeDomainModule();
tcPrimeUiModule();
tcPrimeStoreModule();
tcPrimeActionsModule();
tcPrimeCourseModule();
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
const storeSummary=window.TurnikWorkoutStore&&window.TurnikWorkoutStore.summary?window.TurnikWorkoutStore.summary({now:Date.now()}):null;
const metrics=storeSummary?{week:storeSummary.week,total:storeSummary.total,pullMax:Number.isFinite(+pulled)&&+pulled>0?Math.floor(+pulled):0}:
tcProgressMetrics(generic&&generic.history,course&&course.history,pulled,Date.now());
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
window.tcRenderProgressSummary=renderSummary;
if(window.TurnikUI&&typeof window.TurnikUI.register==='function'){
window.TurnikUI.register('progress','*',10000,()=>{
setTimeout(()=>{renderSummary();tcQueueDecorate()},0);
return false;
});
}
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
function tcCompletionHistoryFingerprint(snapshot){
const a=snapshot&&Array.isArray(snapshot.history)?snapshot.history:[];
const json=JSON.stringify(a);let h=2166136261;
for(let i=0;i<json.length;i++){h^=json.charCodeAt(i);h=Math.imul(h,16777619)}
return a.length+':'+(h>>>0).toString(16);
}
function tcCompletionHistorySignature(){
const store=window.TurnikWorkoutStore;
if(!store||typeof store.sourceSnapshot!=='function')return null;
const generic=store.sourceSnapshot('generic'),course=store.sourceSnapshot('course');
if(!generic||!course)return null;
return{generic:tcCompletionHistoryFingerprint(generic),course:tcCompletionHistoryFingerprint(course)};
}
window.tcUndoLastCompletion=function(){
const tx=tcReadCompletionUndo();
if(!tx){showRuntimeNotice('Срок быстрой отмены истёк.','danger');return false}
try{
const store=window.TurnikWorkoutStore;
if(!store||typeof store.restoreSnapshots!=='function'||!tx.state||!tx.course){
showRuntimeNotice('Хранилище тренировки недоступно. История не изменена.','danger');return false;
}
if(tx.after){
const now=tcCompletionHistorySignature();
if(!now||now.generic!==tx.after.generic||now.course!==tx.after.course){
showRuntimeNotice('После сохранения история изменилась. Отмена недоступна, новые записи сохранены.','danger');return false;
}
}
if(!store.restoreSnapshots({generic:tx.state,course:tx.course})){
showRuntimeNotice('Не удалось восстановить историю. Запись отмены сохранена.','danger');return false;
}
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
const store=window.TurnikWorkoutStore;
const tx={
savedAt:Date.now(),
state:store&&store.sourceSnapshot?store.sourceSnapshot('generic'):null,
course:store&&store.sourceSnapshot?store.sourceSnapshot('course'):null
};
const summary=tcWorkoutSummary(workoutBefore,feel);
const result=baseFinish.apply(this,arguments);
if(typeof W==='undefined'||!W){
tx.after=tcCompletionHistorySignature();
if(tx.state&&tx.course&&tx.after)try{localStorage.setItem(TC_COMPLETION_UNDO_KEY,JSON.stringify(tx))}catch(e){}
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
if(!tcLoadCoreModule()){showRuntimeNotice('Не удалось загрузить ядро TurnikCore. Текущая версия оставлена без изменений.','danger');return}
if(!tcDomainCacheReady()||!tcUiCacheReady()||!tcStoreCacheReady()||!tcCourseCacheReady()){
tcEnsureRequiredModules().then(ok=>{if(ok)installUpdate();else showRuntimeNotice('Модули приложения недоступны. Повторите обновление при подключении к интернету.','danger')});
return;
}

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
const tcApp=document.getElementById('app');
if(tcApp){
const mo=new MutationObserver(tcQueueDecorate);
mo.observe(tcApp,{childList:true,subtree:true});
window.__tcProductObserver=mo;
}
try{render()}catch(e){tcQueueDecorate()}
tcQueueDecorate();
restReasonEl();
if(!tcLoadDomainModule())throw new Error('TurnikCoach domain module unavailable after preflight');
if(!tcLoadUiModule())throw new Error('TurnikCoach UI module unavailable after preflight');
if(!tcLoadStoreModule())throw new Error('TurnikCoach workout store unavailable after preflight');
if(!window.TurnikUI.install())throw new Error('TurnikCoach UI dispatcher install failed');
if(!tcLoadCourseModule())throw new Error('TurnikCoach course module unavailable after preflight');
window.TurnikUI.register('today','*',10000,()=>{setTimeout(tcQueueDecorate,0);return false});
window.TurnikUI.register('plan','*',10000,()=>{setTimeout(tcQueueDecorate,0);return false});
tcRegisterCoreSources();
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