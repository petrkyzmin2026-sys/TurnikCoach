/* TURNIKCOACH_HOTFIX 5.16.70-navigation-flow-owner */
(function(){
'use strict';
const VERSION='5.16.70-navigation-flow-owner';
const LABEL='5.16.70';
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
text.innerHTML="Архитектурное обновление без изменения привычного интерфейса: маршрутизация, системная кнопка «Назад», история экранов, закрытие sheet и выход из тренировки без сохранения вынесены из hotfix в TurnikNavigationFlow. Удалён старый обходной путь через baseGo; все переходы теперь идут через единый диспетчер навигации. История и сценарии тренировок не меняются.<br><br>Установить обновление сейчас?";
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
const TC_STANDARD_WORKOUT_MODULE_VERSION='1.0.0-action-owner';
const TC_STANDARD_WORKOUT_MODULE_MARKER='TURNIKCOACH_STANDARD_WORKOUT 1.0.0-action-owner';
const TC_STANDARD_WORKOUT_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/standard_workout.js?v='+encodeURIComponent(TC_STANDARD_WORKOUT_MODULE_VERSION);
const TC_STANDARD_WORKOUT_CACHE_KEY='tc_module_standard_workout_'+TC_STANDARD_WORKOUT_MODULE_VERSION;
const TC_REST_MODULE_VERSION='1.0.0-state-owner';
const TC_REST_MODULE_MARKER='TURNIKCOACH_REST 1.0.0-state-owner';
const TC_REST_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/rest.js?v='+encodeURIComponent(TC_REST_MODULE_VERSION);
const TC_REST_CACHE_KEY='tc_module_rest_'+TC_REST_MODULE_VERSION;
const TC_REST_POLICY_MODULE_VERSION='1.0.0-owner';
const TC_REST_POLICY_MODULE_MARKER='TURNIKCOACH_REST_POLICY 1.0.0-owner';
const TC_REST_POLICY_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/rest_policy.js?v='+encodeURIComponent(TC_REST_POLICY_MODULE_VERSION);
const TC_REST_POLICY_CACHE_KEY='tc_module_rest_policy_'+TC_REST_POLICY_MODULE_VERSION;
const TC_PRODUCT_UI_MODULE_VERSION='1.0.0-owner';
const TC_PRODUCT_UI_MODULE_MARKER='TURNIKCOACH_PRODUCT_UI 1.0.0-owner';
const TC_PRODUCT_UI_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/product_ui.js?v='+encodeURIComponent(TC_PRODUCT_UI_MODULE_VERSION);
const TC_PRODUCT_UI_CACHE_KEY='tc_module_product_ui_'+TC_PRODUCT_UI_MODULE_VERSION;
const TC_ACTIVE_WORKOUT_MODULE_VERSION='1.1.0-command-hooks';
const TC_ACTIVE_WORKOUT_MODULE_MARKER='TURNIKCOACH_ACTIVE_WORKOUT 1.1.0-command-hooks';
const TC_ACTIVE_WORKOUT_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/active_workout.js?v='+encodeURIComponent(TC_ACTIVE_WORKOUT_MODULE_VERSION);
const TC_ACTIVE_WORKOUT_CACHE_KEY='tc_module_active_workout_'+TC_ACTIVE_WORKOUT_MODULE_VERSION;
const TC_CORRECTION_MODULE_VERSION='1.0.0-owner';
const TC_CORRECTION_MODULE_MARKER='TURNIKCOACH_CORRECTION 1.0.0-owner';
const TC_CORRECTION_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/correction.js?v='+encodeURIComponent(TC_CORRECTION_MODULE_VERSION);
const TC_CORRECTION_CACHE_KEY='tc_module_correction_'+TC_CORRECTION_MODULE_VERSION;
const TC_COMPLETION_MODULE_VERSION='1.0.0-owner';
const TC_COMPLETION_MODULE_MARKER='TURNIKCOACH_COMPLETION 1.0.0-owner';
const TC_COMPLETION_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/completion.js?v='+encodeURIComponent(TC_COMPLETION_MODULE_VERSION);
const TC_COMPLETION_CACHE_KEY='tc_module_completion_'+TC_COMPLETION_MODULE_VERSION;
const TC_LIFECYCLE_MODULE_VERSION='1.0.0';
const TC_LIFECYCLE_MODULE_MARKER='TURNIKCOACH_WORKOUT_LIFECYCLE 1.0.0';
const TC_LIFECYCLE_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/lifecycle.js?v='+encodeURIComponent(TC_LIFECYCLE_MODULE_VERSION);
const TC_LIFECYCLE_CACHE_KEY='tc_module_lifecycle_'+TC_LIFECYCLE_MODULE_VERSION;
const TC_NAVIGATION_MODULE_VERSION='1.0.0';
const TC_NAVIGATION_MODULE_MARKER='TURNIKCOACH_NAVIGATION 1.0.0';
const TC_NAVIGATION_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/navigation.js?v='+encodeURIComponent(TC_NAVIGATION_MODULE_VERSION);
const TC_NAVIGATION_CACHE_KEY='tc_module_navigation_'+TC_NAVIGATION_MODULE_VERSION;
const TC_NAVIGATION_FLOW_MODULE_VERSION='1.0.0-owner';
const TC_NAVIGATION_FLOW_MODULE_MARKER='TURNIKCOACH_NAVIGATION_FLOW 1.0.0-owner';
const TC_NAVIGATION_FLOW_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/navigation_flow.js?v='+encodeURIComponent(TC_NAVIGATION_FLOW_MODULE_VERSION);
const TC_NAVIGATION_FLOW_CACHE_KEY='tc_module_navigation_flow_'+TC_NAVIGATION_FLOW_MODULE_VERSION;
const TC_WORKOUT_UI_MODULE_VERSION='1.0.0';
const TC_WORKOUT_UI_MODULE_MARKER='TURNIKCOACH_WORKOUT_UI 1.0.0';
const TC_WORKOUT_UI_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/workout_ui.js?v='+encodeURIComponent(TC_WORKOUT_UI_MODULE_VERSION);
const TC_WORKOUT_UI_CACHE_KEY='tc_module_workout_ui_'+TC_WORKOUT_UI_MODULE_VERSION;
const TC_COURSE_DOMAIN_MODULE_VERSION='1.1.0-viewstate-owner';
const TC_COURSE_DOMAIN_MODULE_MARKER='TURNIKCOACH_COURSE_DOMAIN 1.1.0-viewstate-owner';
const TC_COURSE_DOMAIN_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/course_domain.js?v='+encodeURIComponent(TC_COURSE_DOMAIN_MODULE_VERSION);
const TC_COURSE_DOMAIN_CACHE_KEY='tc_module_course_domain_'+TC_COURSE_DOMAIN_MODULE_VERSION;
const TC_COURSE_ACTIONS_MODULE_VERSION='1.1.0-hooks';
const TC_COURSE_ACTIONS_MODULE_MARKER='TURNIKCOACH_COURSE_ACTIONS 1.1.0-hooks';
const TC_COURSE_ACTIONS_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/course_actions.js?v='+encodeURIComponent(TC_COURSE_ACTIONS_MODULE_VERSION);
const TC_COURSE_ACTIONS_CACHE_KEY='tc_module_course_actions_'+TC_COURSE_ACTIONS_MODULE_VERSION;
const TC_PROGRESS_MODULE_VERSION='1.0.0-owner';
const TC_PROGRESS_MODULE_MARKER='TURNIKCOACH_PROGRESS 1.0.0-owner';
const TC_PROGRESS_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/progress.js?v='+encodeURIComponent(TC_PROGRESS_MODULE_VERSION);
const TC_PROGRESS_CACHE_KEY='tc_module_progress_'+TC_PROGRESS_MODULE_VERSION;
const TC_SCREEN_SHELL_MODULE_VERSION='1.0.0-owner';
const TC_SCREEN_SHELL_MODULE_MARKER='TURNIKCOACH_SCREEN_SHELL 1.0.0-owner';
const TC_SCREEN_SHELL_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/screen_shell.js?v='+encodeURIComponent(TC_SCREEN_SHELL_MODULE_VERSION);
const TC_SCREEN_SHELL_CACHE_KEY='tc_module_screen_shell_'+TC_SCREEN_SHELL_MODULE_VERSION;
const TC_SURFACE_MODULE_VERSION='1.0.0-owner';
const TC_SURFACE_MODULE_MARKER='TURNIKCOACH_SURFACE 1.0.0-owner';
const TC_SURFACE_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/surface.js?v='+encodeURIComponent(TC_SURFACE_MODULE_VERSION);
const TC_SURFACE_CACHE_KEY='tc_module_surface_'+TC_SURFACE_MODULE_VERSION;
const TC_COURSE_ACTION_NAMES=[
'tcSelectCourseDay','tcShiftCourseWeek','tcShowCourseToday',
'tcOpenAdvancedChoiceSheet','tcSaveAdvancedChoices',
'tcOpenCourseCalibration','tcSaveCourseCalibration',
'tcOpenWorkingWeight','tcSaveWorkingWeight','tcActionMessage',
'tcOpenCourseSettings','tcSaveCourseSettings','tcStartAuxWorkout',
'tcOpenUndoTodayCourseConfirm','tcUndoTodayCourseWorkout','tcChooseTransferRest',
'tcOpenCourseProgram','tcOpenCourseInfo','tcStartCourseTest','tcConfirmCourseTest',
'tcDeferCourseTest','tcDeferMasteryTest','tcOpenMasteryTest','tcSaveMasteryTest',
'tcAdvanceCourseLevel','tcStartCourseWorkout','tcStartTransferredCourseWorkout',
'tcStartExtraWorkout','tcStartSupplementWorkout'
];
const TC_COURSE_MODULE_VERSION='1.0.48-product-info-provider';
const TC_COURSE_MODULE_MARKER='TURNIKCOACH_COURSE 1.0.48-product-info-provider';
const TC_COURSE_MODULE_URL='https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/course.js?v='+encodeURIComponent(TC_COURSE_MODULE_VERSION);
const TC_COURSE_CACHE_KEY='tc_module_course_'+TC_COURSE_MODULE_VERSION;
let tcDomainPrimePromise=null,tcUiPrimePromise=null,tcStorePrimePromise=null,tcActionsPrimePromise=null,tcStandardWorkoutPrimePromise=null,tcRestPrimePromise=null,tcRestPolicyPrimePromise=null,tcProductUiPrimePromise=null,tcActiveWorkoutPrimePromise=null,tcCorrectionPrimePromise=null,tcCompletionPrimePromise=null,tcLifecyclePrimePromise=null,tcNavigationPrimePromise=null,tcNavigationFlowPrimePromise=null,tcWorkoutUiPrimePromise=null,tcCourseDomainPrimePromise=null,tcCourseActionsPrimePromise=null,tcProgressPrimePromise=null,tcScreenShellPrimePromise=null,tcSurfacePrimePromise=null,tcCoursePrimePromise=null;
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
function tcValidStandardWorkoutModule(js){return typeof js==='string'&&js.length>500&&js.length<64000&&js.includes(TC_STANDARD_WORKOUT_MODULE_MARKER)}
function tcValidRestModule(js){return typeof js==='string'&&js.length>500&&js.length<64000&&js.includes(TC_REST_MODULE_MARKER)}
function tcValidRestPolicyModule(js){return typeof js==='string'&&js.length>500&&js.length<64000&&js.includes(TC_REST_POLICY_MODULE_MARKER)}
function tcValidProductUiModule(js){return typeof js==='string'&&js.length>1000&&js.length<64000&&js.includes(TC_PRODUCT_UI_MODULE_MARKER)}
function tcValidActiveWorkoutModule(js){return typeof js==='string'&&js.length>500&&js.length<64000&&js.includes(TC_ACTIVE_WORKOUT_MODULE_MARKER)}
function tcValidCorrectionModule(js){return typeof js==='string'&&js.length>500&&js.length<64000&&js.includes(TC_CORRECTION_MODULE_MARKER)}
function tcValidCompletionModule(js){return typeof js==='string'&&js.length>500&&js.length<64000&&js.includes(TC_COMPLETION_MODULE_MARKER)}
function tcValidLifecycleModule(js){return typeof js==='string'&&js.length>500&&js.length<64000&&js.includes(TC_LIFECYCLE_MODULE_MARKER)}
function tcValidNavigationModule(js){return typeof js==='string'&&js.length>500&&js.length<64000&&js.includes(TC_NAVIGATION_MODULE_MARKER)}
function tcValidNavigationFlowModule(js){return typeof js==='string'&&js.length>1000&&js.length<64000&&js.includes(TC_NAVIGATION_FLOW_MODULE_MARKER)}
function tcValidWorkoutUiModule(js){return typeof js==='string'&&js.length>500&&js.length<64000&&js.includes(TC_WORKOUT_UI_MODULE_MARKER)}
function tcValidCourseDomainModule(js){return typeof js==='string'&&js.length>1000&&js.length<64000&&js.includes(TC_COURSE_DOMAIN_MODULE_MARKER)}
function tcValidCourseActionsModule(js){return typeof js==='string'&&js.length>1000&&js.length<64000&&js.includes(TC_COURSE_ACTIONS_MODULE_MARKER)}
function tcValidProgressModule(js){return typeof js==='string'&&js.length>1000&&js.length<64000&&js.includes(TC_PROGRESS_MODULE_MARKER)}
function tcValidScreenShellModule(js){return typeof js==='string'&&js.length>1000&&js.length<64000&&js.includes(TC_SCREEN_SHELL_MODULE_MARKER)}
function tcValidSurfaceModule(js){return typeof js==='string'&&js.length>1000&&js.length<64000&&js.includes(TC_SURFACE_MODULE_MARKER)}
function tcValidCourseModule(js){return typeof js==='string'&&js.length>1000&&js.length<256000&&js.includes(TC_COURSE_MODULE_MARKER)}
function tcDomainCacheReady(){return tcValidDomainModule(tcReadModuleCache(TC_DOMAIN_CACHE_KEY))}
function tcUiCacheReady(){return tcValidUiModule(tcReadModuleCache(TC_UI_CACHE_KEY))}
function tcStoreCacheReady(){return tcValidStoreModule(tcReadModuleCache(TC_STORE_CACHE_KEY))}
function tcActionsCacheReady(){return tcValidActionsModule(tcReadModuleCache(TC_ACTIONS_CACHE_KEY))}
function tcStandardWorkoutCacheReady(){return tcValidStandardWorkoutModule(tcReadModuleCache(TC_STANDARD_WORKOUT_CACHE_KEY))}
function tcRestCacheReady(){return tcValidRestModule(tcReadModuleCache(TC_REST_CACHE_KEY))}
function tcRestPolicyCacheReady(){return tcValidRestPolicyModule(tcReadModuleCache(TC_REST_POLICY_CACHE_KEY))}
function tcProductUiCacheReady(){return tcValidProductUiModule(tcReadModuleCache(TC_PRODUCT_UI_CACHE_KEY))}
function tcActiveWorkoutCacheReady(){return tcValidActiveWorkoutModule(tcReadModuleCache(TC_ACTIVE_WORKOUT_CACHE_KEY))}
function tcCorrectionCacheReady(){return tcValidCorrectionModule(tcReadModuleCache(TC_CORRECTION_CACHE_KEY))}
function tcCompletionCacheReady(){return tcValidCompletionModule(tcReadModuleCache(TC_COMPLETION_CACHE_KEY))}
function tcLifecycleCacheReady(){return tcValidLifecycleModule(tcReadModuleCache(TC_LIFECYCLE_CACHE_KEY))}
function tcNavigationCacheReady(){return tcValidNavigationModule(tcReadModuleCache(TC_NAVIGATION_CACHE_KEY))}
function tcNavigationFlowCacheReady(){return tcValidNavigationFlowModule(tcReadModuleCache(TC_NAVIGATION_FLOW_CACHE_KEY))}
function tcWorkoutUiCacheReady(){return tcValidWorkoutUiModule(tcReadModuleCache(TC_WORKOUT_UI_CACHE_KEY))}
function tcCourseDomainCacheReady(){return tcValidCourseDomainModule(tcReadModuleCache(TC_COURSE_DOMAIN_CACHE_KEY))}
function tcCourseActionsCacheReady(){return tcValidCourseActionsModule(tcReadModuleCache(TC_COURSE_ACTIONS_CACHE_KEY))}
function tcProgressCacheReady(){return tcValidProgressModule(tcReadModuleCache(TC_PROGRESS_CACHE_KEY))}
function tcScreenShellCacheReady(){return tcValidScreenShellModule(tcReadModuleCache(TC_SCREEN_SHELL_CACHE_KEY))}
function tcSurfaceCacheReady(){return tcValidSurfaceModule(tcReadModuleCache(TC_SURFACE_CACHE_KEY))}
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
function tcLoadStandardWorkoutModule(){
if(window.TurnikStandardWorkout&&window.TurnikStandardWorkout.version===TC_STANDARD_WORKOUT_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_STANDARD_WORKOUT_CACHE_KEY);
return tcValidStandardWorkoutModule(cached)&&tcEvalModule(cached,'standard-workout')&&!!window.TurnikStandardWorkout;
}
function tcLoadRestModule(){
if(window.TurnikRest&&window.TurnikRest.version===TC_REST_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_REST_CACHE_KEY);
return tcValidRestModule(cached)&&tcEvalModule(cached,'rest')&&!!window.TurnikRest;
}
function tcLoadRestPolicyModule(){
if(window.TurnikRestPolicy&&window.TurnikRestPolicy.version===TC_REST_POLICY_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_REST_POLICY_CACHE_KEY);
return tcValidRestPolicyModule(cached)&&tcEvalModule(cached,'rest-policy')&&!!window.TurnikRestPolicy;
}
function tcLoadProductUiModule(){
if(window.TurnikProductUI&&window.TurnikProductUI.version===TC_PRODUCT_UI_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_PRODUCT_UI_CACHE_KEY);
return tcValidProductUiModule(cached)&&tcEvalModule(cached,'product-ui')&&!!window.TurnikProductUI;
}
function tcLoadActiveWorkoutModule(){
if(window.TurnikActiveWorkout&&window.TurnikActiveWorkout.version===TC_ACTIVE_WORKOUT_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_ACTIVE_WORKOUT_CACHE_KEY);
return tcValidActiveWorkoutModule(cached)&&tcEvalModule(cached,'active-workout')&&!!window.TurnikActiveWorkout;
}
function tcLoadCorrectionModule(){
if(window.TurnikCorrection&&window.TurnikCorrection.version===TC_CORRECTION_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_CORRECTION_CACHE_KEY);
return tcValidCorrectionModule(cached)&&tcEvalModule(cached,'correction')&&!!window.TurnikCorrection;
}
function tcLoadCompletionModule(){
if(window.TurnikCompletion&&window.TurnikCompletion.version===TC_COMPLETION_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_COMPLETION_CACHE_KEY);
return tcValidCompletionModule(cached)&&tcEvalModule(cached,'completion')&&!!window.TurnikCompletion;
}
function tcLoadLifecycleModule(){
if(window.TurnikWorkoutLifecycle&&window.TurnikWorkoutLifecycle.version===TC_LIFECYCLE_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_LIFECYCLE_CACHE_KEY);
return tcValidLifecycleModule(cached)&&tcEvalModule(cached,'lifecycle')&&!!window.TurnikWorkoutLifecycle;
}
function tcLoadNavigationModule(){
if(window.TurnikNavigation&&window.TurnikNavigation.version===TC_NAVIGATION_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_NAVIGATION_CACHE_KEY);
return tcValidNavigationModule(cached)&&tcEvalModule(cached,'navigation')&&!!window.TurnikNavigation;
}
function tcLoadNavigationFlowModule(){
if(window.TurnikNavigationFlow&&window.TurnikNavigationFlow.version===TC_NAVIGATION_FLOW_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_NAVIGATION_FLOW_CACHE_KEY);
return tcValidNavigationFlowModule(cached)&&tcEvalModule(cached,'navigation-flow')&&!!window.TurnikNavigationFlow;
}
function tcLoadWorkoutUiModule(){
if(window.TurnikWorkoutUI&&window.TurnikWorkoutUI.version===TC_WORKOUT_UI_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_WORKOUT_UI_CACHE_KEY);
return tcValidWorkoutUiModule(cached)&&tcEvalModule(cached,'workout-ui')&&!!window.TurnikWorkoutUI;
}
function tcLoadCourseDomainModule(){
if(window.TurnikCourseDomain&&window.TurnikCourseDomain.version===TC_COURSE_DOMAIN_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_COURSE_DOMAIN_CACHE_KEY);
return tcValidCourseDomainModule(cached)&&tcEvalModule(cached,'course-domain')&&!!window.TurnikCourseDomain;
}
function tcLoadCourseActionsModule(){
if(window.TurnikCourseActions&&window.TurnikCourseActions.version===TC_COURSE_ACTIONS_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_COURSE_ACTIONS_CACHE_KEY);
return tcValidCourseActionsModule(cached)&&tcEvalModule(cached,'course-actions')&&!!window.TurnikCourseActions;
}
function tcLoadProgressModule(){
if(window.TurnikProgress&&window.TurnikProgress.version===TC_PROGRESS_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_PROGRESS_CACHE_KEY);
return tcValidProgressModule(cached)&&tcEvalModule(cached,'progress')&&!!window.TurnikProgress;
}
function tcLoadScreenShellModule(){
if(window.TurnikScreenShell&&window.TurnikScreenShell.version===TC_SCREEN_SHELL_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_SCREEN_SHELL_CACHE_KEY);
return tcValidScreenShellModule(cached)&&tcEvalModule(cached,'screen-shell')&&!!window.TurnikScreenShell;
}
function tcLoadSurfaceModule(){
if(window.TurnikSurface&&window.TurnikSurface.version===TC_SURFACE_MODULE_VERSION)return true;
const cached=tcReadModuleCache(TC_SURFACE_CACHE_KEY);
return tcValidSurfaceModule(cached)&&tcEvalModule(cached,'surface')&&!!window.TurnikSurface;
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
function tcPrimeStandardWorkoutModule(){
if(!tcStandardWorkoutPrimePromise)tcStandardWorkoutPrimePromise=tcPrimeModule(TC_STANDARD_WORKOUT_MODULE_URL,TC_STANDARD_WORKOUT_CACHE_KEY,tcValidStandardWorkoutModule,'standard-workout');
return tcStandardWorkoutPrimePromise;
}
function tcPrimeRestModule(){
if(!tcRestPrimePromise)tcRestPrimePromise=tcPrimeModule(TC_REST_MODULE_URL,TC_REST_CACHE_KEY,tcValidRestModule,'rest');
return tcRestPrimePromise;
}
function tcPrimeRestPolicyModule(){
if(!tcRestPolicyPrimePromise)tcRestPolicyPrimePromise=tcPrimeModule(TC_REST_POLICY_MODULE_URL,TC_REST_POLICY_CACHE_KEY,tcValidRestPolicyModule,'rest-policy');
return tcRestPolicyPrimePromise;
}
function tcPrimeProductUiModule(){
if(!tcProductUiPrimePromise)tcProductUiPrimePromise=tcPrimeModule(TC_PRODUCT_UI_MODULE_URL,TC_PRODUCT_UI_CACHE_KEY,tcValidProductUiModule,'product-ui');
return tcProductUiPrimePromise;
}
function tcPrimeActiveWorkoutModule(){
if(!tcActiveWorkoutPrimePromise)tcActiveWorkoutPrimePromise=tcPrimeModule(TC_ACTIVE_WORKOUT_MODULE_URL,TC_ACTIVE_WORKOUT_CACHE_KEY,tcValidActiveWorkoutModule,'active-workout');
return tcActiveWorkoutPrimePromise;
}
function tcPrimeCorrectionModule(){
if(!tcCorrectionPrimePromise)tcCorrectionPrimePromise=tcPrimeModule(TC_CORRECTION_MODULE_URL,TC_CORRECTION_CACHE_KEY,tcValidCorrectionModule,'correction');
return tcCorrectionPrimePromise;
}
function tcPrimeCompletionModule(){
if(!tcCompletionPrimePromise)tcCompletionPrimePromise=tcPrimeModule(TC_COMPLETION_MODULE_URL,TC_COMPLETION_CACHE_KEY,tcValidCompletionModule,'completion');
return tcCompletionPrimePromise;
}
function tcPrimeLifecycleModule(){
if(!tcLifecyclePrimePromise)tcLifecyclePrimePromise=tcPrimeModule(TC_LIFECYCLE_MODULE_URL,TC_LIFECYCLE_CACHE_KEY,tcValidLifecycleModule,'lifecycle');
return tcLifecyclePrimePromise;
}
function tcPrimeNavigationModule(){
if(!tcNavigationPrimePromise)tcNavigationPrimePromise=tcPrimeModule(TC_NAVIGATION_MODULE_URL,TC_NAVIGATION_CACHE_KEY,tcValidNavigationModule,'navigation');
return tcNavigationPrimePromise;
}
function tcPrimeNavigationFlowModule(){
if(!tcNavigationFlowPrimePromise)tcNavigationFlowPrimePromise=tcPrimeModule(TC_NAVIGATION_FLOW_MODULE_URL,TC_NAVIGATION_FLOW_CACHE_KEY,tcValidNavigationFlowModule,'navigation-flow');
return tcNavigationFlowPrimePromise;
}
function tcPrimeWorkoutUiModule(){
if(!tcWorkoutUiPrimePromise)tcWorkoutUiPrimePromise=tcPrimeModule(TC_WORKOUT_UI_MODULE_URL,TC_WORKOUT_UI_CACHE_KEY,tcValidWorkoutUiModule,'workout-ui');
return tcWorkoutUiPrimePromise;
}
function tcPrimeCourseDomainModule(){
if(!tcCourseDomainPrimePromise)tcCourseDomainPrimePromise=tcPrimeModule(TC_COURSE_DOMAIN_MODULE_URL,TC_COURSE_DOMAIN_CACHE_KEY,tcValidCourseDomainModule,'course-domain');
return tcCourseDomainPrimePromise;
}
function tcPrimeCourseActionsModule(){
if(!tcCourseActionsPrimePromise)tcCourseActionsPrimePromise=tcPrimeModule(TC_COURSE_ACTIONS_MODULE_URL,TC_COURSE_ACTIONS_CACHE_KEY,tcValidCourseActionsModule,'course-actions');
return tcCourseActionsPrimePromise;
}
function tcPrimeProgressModule(){
if(!tcProgressPrimePromise)tcProgressPrimePromise=tcPrimeModule(TC_PROGRESS_MODULE_URL,TC_PROGRESS_CACHE_KEY,tcValidProgressModule,'progress');
return tcProgressPrimePromise;
}
function tcPrimeScreenShellModule(){
if(!tcScreenShellPrimePromise)tcScreenShellPrimePromise=tcPrimeModule(TC_SCREEN_SHELL_MODULE_URL,TC_SCREEN_SHELL_CACHE_KEY,tcValidScreenShellModule,'screen-shell');
return tcScreenShellPrimePromise;
}
function tcPrimeSurfaceModule(){
if(!tcSurfacePrimePromise)tcSurfacePrimePromise=tcPrimeModule(TC_SURFACE_MODULE_URL,TC_SURFACE_CACHE_KEY,tcValidSurfaceModule,'surface');
return tcSurfacePrimePromise;
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
if(!tcStandardWorkoutCacheReady())tasks.push(tcPrimeStandardWorkoutModule());
if(!tcRestCacheReady())tasks.push(tcPrimeRestModule());
if(!tcRestPolicyCacheReady())tasks.push(tcPrimeRestPolicyModule());
if(!tcProductUiCacheReady())tasks.push(tcPrimeProductUiModule());
if(!tcActiveWorkoutCacheReady())tasks.push(tcPrimeActiveWorkoutModule());
if(!tcCorrectionCacheReady())tasks.push(tcPrimeCorrectionModule());
if(!tcCompletionCacheReady())tasks.push(tcPrimeCompletionModule());
if(!tcLifecycleCacheReady())tasks.push(tcPrimeLifecycleModule());
if(!tcNavigationCacheReady())tasks.push(tcPrimeNavigationModule());
if(!tcNavigationFlowCacheReady())tasks.push(tcPrimeNavigationFlowModule());
if(!tcWorkoutUiCacheReady())tasks.push(tcPrimeWorkoutUiModule());
if(!tcCourseDomainCacheReady())tasks.push(tcPrimeCourseDomainModule());
if(!tcCourseActionsCacheReady())tasks.push(tcPrimeCourseActionsModule());
if(!tcProgressCacheReady())tasks.push(tcPrimeProgressModule());
if(!tcScreenShellCacheReady())tasks.push(tcPrimeScreenShellModule());
if(!tcSurfaceCacheReady())tasks.push(tcPrimeSurfaceModule());
if(!tcCourseCacheReady())tasks.push(tcPrimeCourseModule());
if(tasks.length){const ready=await Promise.all(tasks);if(ready.some(x=>!x))return false}
return tcDomainCacheReady()&&tcUiCacheReady()&&tcStoreCacheReady()&&tcActionsCacheReady()&&tcStandardWorkoutCacheReady()&&tcRestCacheReady()&&tcRestPolicyCacheReady()&&tcProductUiCacheReady()&&tcActiveWorkoutCacheReady()&&tcCorrectionCacheReady()&&tcCompletionCacheReady()&&tcLifecycleCacheReady()&&tcNavigationCacheReady()&&tcNavigationFlowCacheReady()&&tcWorkoutUiCacheReady()&&tcCourseDomainCacheReady()&&tcCourseActionsCacheReady()&&tcProgressCacheReady()&&tcScreenShellCacheReady()&&tcSurfaceCacheReady()&&tcCourseCacheReady();
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
window.__TC_CORE_FOUNDATION={version:core.version,domainModule:window.TurnikDomain&&window.TurnikDomain.version||'',uiModule:window.TurnikUI&&window.TurnikUI.version||'',storeModule:window.TurnikWorkoutStore&&window.TurnikWorkoutStore.version||'',actionsModule:window.TurnikWorkoutActions&&window.TurnikWorkoutActions.version||'',standardWorkoutModule:window.TurnikStandardWorkout&&window.TurnikStandardWorkout.version||'',restModule:window.TurnikRest&&window.TurnikRest.version||'',restPolicyModule:window.TurnikRestPolicy&&window.TurnikRestPolicy.version||'',productUiModule:window.TurnikProductUI&&window.TurnikProductUI.version||'',activeWorkoutModule:window.TurnikActiveWorkout&&window.TurnikActiveWorkout.version||'',correctionModule:window.TurnikCorrection&&window.TurnikCorrection.version||'',completionModule:window.TurnikCompletion&&window.TurnikCompletion.version||'',lifecycleModule:window.TurnikWorkoutLifecycle&&window.TurnikWorkoutLifecycle.version||'',navigationModule:window.TurnikNavigation&&window.TurnikNavigation.version||'',navigationFlowModule:window.TurnikNavigationFlow&&window.TurnikNavigationFlow.version||'',workoutUiModule:window.TurnikWorkoutUI&&window.TurnikWorkoutUI.version||'',courseDomainModule:window.TurnikCourseDomain&&window.TurnikCourseDomain.version||'',courseActionsModule:window.TurnikCourseActions&&window.TurnikCourseActions.version||'',progressModule:window.TurnikProgress&&window.TurnikProgress.version||'',screenShellModule:window.TurnikScreenShell&&window.TurnikScreenShell.version||'',surfaceModule:window.TurnikSurface&&window.TurnikSurface.version||'',courseModule:TC_COURSE_MODULE_VERSION,modular:true};
return true;
}
tcLoadCoreModule();
tcPrimeDomainModule();
tcPrimeUiModule();
tcPrimeStoreModule();
tcPrimeActionsModule();
tcPrimeStandardWorkoutModule();
tcPrimeRestModule();
tcPrimeRestPolicyModule();
tcPrimeProductUiModule();
tcPrimeActiveWorkoutModule();
tcPrimeNavigationFlowModule();
tcPrimeWorkoutUiModule();
tcPrimeCourseDomainModule();
tcPrimeCourseActionsModule();
tcPrimeProgressModule();
tcPrimeScreenShellModule();
tcPrimeSurfaceModule();
tcPrimeCourseModule();
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
const surface=window.TurnikSurface;
if(!surface||typeof surface.install!=='function')throw new Error('TurnikCoach surface owner unavailable');
if(!surface.install({hotfixVersion:VERSION}))throw new Error('TurnikCoach surface owner install failed');
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
const sheet=document.getElementById('sheet');
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
tcDecorateBackControls();
const app=document.getElementById('app');
if(app&&typeof MutationObserver==='function'){
const mo=new MutationObserver(tcDecorateBackControls);
mo.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
window.__tcBackControlObserver=mo;
}
}
function installUpdate(){
if(window.__TC_HOTFIX_ACTIVE_VERSION===VERSION)return;
if(!tcLoadCoreModule()){showRuntimeNotice('Не удалось загрузить ядро TurnikCore. Текущая версия оставлена без изменений.','danger');return}
if(!tcDomainCacheReady()||!tcUiCacheReady()||!tcStoreCacheReady()||!tcActionsCacheReady()||!tcStandardWorkoutCacheReady()||!tcRestCacheReady()||!tcRestPolicyCacheReady()||!tcProductUiCacheReady()||!tcActiveWorkoutCacheReady()||!tcCorrectionCacheReady()||!tcCompletionCacheReady()||!tcLifecycleCacheReady()||!tcNavigationCacheReady()||!tcNavigationFlowCacheReady()||!tcWorkoutUiCacheReady()||!tcCourseDomainCacheReady()||!tcCourseActionsCacheReady()||!tcProgressCacheReady()||!tcScreenShellCacheReady()||!tcSurfaceCacheReady()||!tcCourseCacheReady()){
tcEnsureRequiredModules().then(ok=>{if(ok)installUpdate();else showRuntimeNotice('Модули приложения недоступны. Повторите обновление при подключении к интернету.','danger')});
return;
}
if(!tcLoadLifecycleModule()){showRuntimeNotice('Не удалось загрузить диспетчер жизненного цикла тренировки. Текущая версия оставлена без изменений.','danger');return}
if(!tcLoadNavigationModule()){showRuntimeNotice('Не удалось загрузить диспетчер навигации. Текущая версия оставлена без изменений.','danger');return}
if(!tcLoadNavigationFlowModule()){showRuntimeNotice('Не удалось загрузить обработчик навигации. Текущая версия оставлена без изменений.','danger');return}

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
window.tcPrimeAudio=tcPrimeAudio;
window.tcFinishSignal=tcFinishSignal;
['pointerdown','touchstart','click'].forEach(ev=>document.addEventListener(ev,tcPrimeAudio,{passive:true}));
function tcInstallRestPolicyOwner(){
const owner=window.TurnikRestPolicy;
if(!owner||typeof owner.install!=='function')throw new Error('TurnikCoach rest policy owner unavailable');
const ok=owner.install({baseSeconds:(e,sessionIndex)=>restSeconds(e,sessionIndex)});
if(!ok)throw new Error('TurnikCoach rest policy owner install failed');
return true;
}
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
function tcInstallRestStateOwner(){
const rest=window.TurnikRest;
if(!rest||typeof rest.install!=='function'||typeof rest.snapshot!=='function'||typeof rest.restore!=='function')throw new Error('TurnikCoach rest state owner unavailable');
const ok=rest.install({
ring:()=>document.getElementById('restNum'),
navigate:id=>window.go(id),
finish:()=>window.finishRest(),
primeAudio:()=>tcPrimeAudio(),
beep:()=>tcBeep(1120,.16,.42),
finishSignal:()=>tcFinishSignal(),
nextStep:()=>tcUpdateRestNextStep(),
setNote:value=>{
window.__tcLastRestNote=String(value||'');
const el=restReasonEl();
if(el){el.textContent=window.__tcLastRestNote;el.style.display='none'}
},
markManualAdd:delta=>{
const el=restReasonEl();
if(el&&!/добавлено вручную/.test(el.textContent))el.textContent+=' · добавлено вручную +'+delta+' с';
}
});
if(!ok)throw new Error('TurnikCoach rest state owner install failed');
return true;
}
function tcHapticConfirm(){
try{if(navigator.vibrate)navigator.vibrate(45)}catch(e){}
}
function tcInstallCompletionOwner(){
const owner=window.TurnikCompletion;
if(!owner||typeof owner.install!=='function')throw new Error('TurnikCoach completion owner unavailable');
const ok=owner.install({
getWorkout:()=>typeof W!=='undefined'?W:null,
notice:(message,tone)=>showRuntimeNotice(message,tone),
store:window.TurnikWorkoutStore,
lifecycle:window.TurnikWorkoutLifecycle,
activeWorkout:window.TurnikActiveWorkout,
clearActive:()=>typeof window.tcClearActiveWorkoutSnapshot==='function'?window.tcClearActiveWorkoutSnapshot():false,
closeSheet:()=>typeof window.closeSheet==='function'?window.closeSheet():false,
render:()=>typeof window.render==='function'?window.render():false,
navigate:id=>typeof window.go==='function'?window.go(id):false
});
if(!ok)throw new Error('TurnikCoach completion owner install failed');
return true;
}
function tcInstallHapticFeedback(){
if(window.__TC_HAPTIC_FEEDBACK_V2)return;
window.__TC_HAPTIC_FEEDBACK_V2=true;
const actions=window.TurnikWorkoutActions;
if(!actions||typeof actions.registerBefore!=='function'||typeof actions.registerAfter!=='function')throw new Error('TurnikCoach workout action dispatcher unavailable for haptics');
actions.registerBefore('haptic-feedback',50,ctx=>{
let record=null,index=-1,previous;
try{
if(typeof W!=='undefined'&&W&&Array.isArray(W.items)){
record=W.items[W.exerciseIndex];index=W.setIndex;previous=record&&record.actual&&record.actual[index];
}
}catch(e){record=null}
ctx.meta.haptic={record,index,previous};
});
actions.registerAfter('haptic-feedback',50,ctx=>{
try{
const h=ctx.meta.haptic||{},record=h.record,current=record&&Array.isArray(record.actual)?record.actual[h.index]:undefined;
if(!ctx.skip&&record&&h.previous===undefined&&current!==undefined&&current!==null)tcHapticConfirm();
}catch(e){}
});
}
function tcInstallWorkoutCorrection(){
const owner=window.TurnikCorrection;
if(!owner||typeof owner.install!=='function')throw new Error('TurnikCoach correction owner unavailable');
const ok=owner.install({
getWorkout:()=>typeof W!=='undefined'?W:null,
notice:(message,tone)=>showRuntimeNotice(message,tone),
discard:()=>window.tcDiscardWorkout(),
clearRestoreGuard:()=>{window.__tcRestoreSurfaceGuard=null},
rest:window.TurnikRest,
getManualRest:()=>window.__tcManualCourseRest||null,
setManualRest:value=>{window.__tcManualCourseRest=value||null},
finishRest:()=>typeof window.finishRest==='function'?window.finishRest():false,
navigate:id=>typeof window.go==='function'?window.go(id):false,
renderWorkout:()=>typeof window.renderWork==='function'?window.renderWork():false,
saveSnapshot:()=>typeof window.tcSaveActiveWorkoutSnapshot==='function'?window.tcSaveActiveWorkoutSnapshot():false,
refreshSurface:surface=>typeof window.tcRefreshActiveTrainingSurface==='function'?window.tcRefreshActiveTrainingSurface(surface):false,
actions:window.TurnikWorkoutActions,
navigation:window.TurnikNavigation,
workoutUi:window.TurnikWorkoutUI
});
if(!ok)throw new Error('TurnikCoach correction owner install failed');
return true;
}
function tcInstallWorkoutPersistence(){
const owner=window.TurnikActiveWorkout;
if(!owner||typeof owner.install!=='function')throw new Error('TurnikCoach active workout owner unavailable');
const rest=window.TurnikRest,actions=window.TurnikWorkoutActions,lifecycle=window.TurnikWorkoutLifecycle;
const ok=owner.install({
getWorkout:()=>typeof W!=='undefined'?W:null,
setWorkout:value=>{try{W=value;return true}catch(e){return false}},
clearWorkout:()=>{try{W=null;return true}catch(e){return false}},
screen:()=>{const el=document.querySelector('.screen.on');return el&&el.id?el.id:'workout'},
restSnapshot:()=>rest&&typeof rest.snapshot==='function'?rest.snapshot():{active:false,end:0,note:String(window.__tcLastRestNote||'')},
restoreRest:value=>!!(rest&&typeof rest.restore==='function'&&rest.restore(value,{navigate:true})),
stopRest:reason=>rest&&typeof rest.stop==='function'?rest.stop(reason):false,
getManualRest:()=>window.__tcManualCourseRest||null,
setManualRest:value=>{window.__tcManualCourseRest=value||null},
navigate:id=>window.go(id),
renderWorkout:()=>{if(typeof window.renderWork==='function')window.renderWork()},
armSurface:surface=>{if(typeof window.tcArmRestoreSurfaceGuard==='function')window.tcArmRestoreSurfaceGuard(surface);else if(typeof window.tcRefreshActiveTrainingSurface==='function')window.tcRefreshActiveTrainingSurface(surface)},
refreshSurface:surface=>{if(typeof window.tcRefreshActiveTrainingSurface==='function')window.tcRefreshActiveTrainingSurface(surface)},
notice:message=>showRuntimeNotice(message),
actions,lifecycle,rest,courseActions:window.TurnikCourseActions,
startNames:['adj','tcStartAuxWorkout','tcStartCourseTest','tcStartCourseWorkout','tcStartExtraWorkout','tcStartSupplementWorkout']
});
if(!ok)throw new Error('TurnikCoach active workout owner install failed');
return true;
}
restReasonEl();
if(!tcLoadDomainModule())throw new Error('TurnikCoach domain module unavailable after preflight');
if(!tcLoadUiModule())throw new Error('TurnikCoach UI module unavailable after preflight');
if(!tcLoadStoreModule())throw new Error('TurnikCoach workout store unavailable after preflight');
if(!tcLoadActionsModule())throw new Error('TurnikCoach workout action dispatcher unavailable after preflight');
if(!tcLoadStandardWorkoutModule())throw new Error('TurnikCoach standard workout module unavailable after preflight');
if(!tcLoadRestModule())throw new Error('TurnikCoach rest state owner unavailable after preflight');
if(!tcLoadRestPolicyModule())throw new Error('TurnikCoach rest policy owner unavailable after preflight');
if(!tcLoadProductUiModule())throw new Error('TurnikCoach product UI owner unavailable after preflight');
if(!tcLoadActiveWorkoutModule())throw new Error('TurnikCoach active workout owner unavailable after preflight');
if(!tcLoadCorrectionModule())throw new Error('TurnikCoach correction owner unavailable after preflight');
if(!tcLoadCompletionModule())throw new Error('TurnikCoach completion owner unavailable after preflight');
if(!tcLoadLifecycleModule())throw new Error('TurnikCoach workout lifecycle dispatcher unavailable after preflight');
if(!tcLoadNavigationModule())throw new Error('TurnikCoach navigation dispatcher unavailable after preflight');
if(!tcLoadNavigationFlowModule())throw new Error('TurnikCoach navigation flow owner unavailable after preflight');
if(!tcLoadWorkoutUiModule())throw new Error('TurnikCoach workout UI dispatcher unavailable after preflight');
if(!window.TurnikWorkoutUI.install())throw new Error('TurnikCoach workout UI dispatcher install failed');
if(!window.TurnikProductUI.install({
getWorkout:()=>typeof W!=='undefined'?W:null,getState:()=>typeof state!=='undefined'?state:null,
modelFor:e=>modelFor(e),unitShort:e=>unitShort(e),restSeconds:(e,i)=>restSeconds(e,i),
progressionHint:e=>progressionHint(e),currentSession:()=>currentSession()
}))throw new Error('TurnikCoach product UI owner install failed');
if(!window.TurnikUI.install())throw new Error('TurnikCoach UI dispatcher install failed');
if(!tcLoadCourseDomainModule())throw new Error('TurnikCoach course domain module unavailable after preflight');
if(!tcLoadCourseActionsModule())throw new Error('TurnikCoach course actions owner unavailable after preflight');
if(!tcLoadProgressModule())throw new Error('TurnikCoach progress owner unavailable after preflight');
if(!tcLoadScreenShellModule())throw new Error('TurnikCoach screen shell owner unavailable after preflight');
if(!tcLoadSurfaceModule())throw new Error('TurnikCoach surface owner unavailable after preflight');
if(!tcLoadCourseModule())throw new Error('TurnikCoach course module unavailable after preflight');
if(!window.TurnikCourseActions.captureAndInstall(TC_COURSE_ACTION_NAMES,'morozov-course'))throw new Error('TurnikCoach course actions ownership failed');

if(!tcRegisterCoreSources())throw new Error('TurnikCoach core source registration failed');
if(typeof window.tcFlushCourseBootstrapState==='function'&&!window.tcFlushCourseBootstrapState())throw new Error('TurnikCoach course bootstrap flush failed');
if(!window.TurnikScreenShell.install())throw new Error('TurnikCoach screen shell owner install failed');
tcInstallNavigationUpgrades();
if(!window.TurnikNavigationFlow.install({
navigation:window.TurnikNavigation,
surface:window.TurnikSurface,
rest:window.TurnikRest,
notice:(message,tone)=>showRuntimeNotice(message,tone),
clearActive:()=>typeof window.tcClearActiveWorkoutSnapshot==='function'?window.tcClearActiveWorkoutSnapshot():false
}))throw new Error('TurnikCoach navigation flow owner install failed');
tcInstallNavigationFoundation();
tcInstallCompletionOwner();
tcInstallHapticFeedback();
tcInstallRestPolicyOwner();
tcInstallWorkoutCorrection();
if(!window.TurnikProgress.install({
ui:window.TurnikUI,store:window.TurnikWorkoutStore,productUI:window.TurnikProductUI,
getGenericState:()=>typeof state!=='undefined'?state:null,
getCourseState:()=>typeof window.tcGetCourseStateSnapshot==='function'?window.tcGetCourseStateSnapshot():null
}))throw new Error('TurnikCoach progress owner install failed');
window.tcRenderProgressSummary=()=>window.TurnikProgress.render();
tcInstallRestStateOwner();
tcInstallWorkoutPersistence();
if(!window.TurnikNavigation.install())throw new Error('TurnikCoach navigation dispatcher install failed');
if(!window.TurnikWorkoutLifecycle.install())throw new Error('TurnikCoach workout lifecycle dispatcher install failed');
if(!window.TurnikWorkoutActions.install())throw new Error('TurnikCoach workout action dispatcher install failed');
if(!tcInstallCompletionOwner())throw new Error('TurnikCoach completion owner reclaim failed');
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