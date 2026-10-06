/* TURNIKCOACH_UI 1.0.0 */
(function(){
'use strict';
const VERSION='1.0.0';
if(window.TurnikUI&&window.TurnikUI.version===VERSION)return;
const presenters=new Map();
let installed=false,baseRender=null,rendering=false;
function bucket(area){
const key=String(area||'');
if(!presenters.has(key))presenters.set(key,[]);
return presenters.get(key);
}
function register(area,name,priority,renderer){
if(!area||!name||typeof renderer!=='function')return false;
const list=bucket(area),key=String(name),next={name:key,priority:Number(priority)||0,renderer};
const i=list.findIndex(x=>x.name===key);
if(i>=0)list.splice(i,1,next);else list.push(next);
list.sort((a,b)=>b.priority-a.priority||a.name.localeCompare(b.name));
return true;
}
function unregister(area,name){
const list=bucket(area),i=list.findIndex(x=>x.name===String(name));
if(i<0)return false;list.splice(i,1);return true;
}
function resolveState(area,context){
if(!window.TurnikDomain||typeof window.TurnikDomain.resolve!=='function')return{area:String(area),source:'fallback',kind:'EMPTY'};
return window.TurnikDomain.resolve(area,context||{});
}
function renderArea(area,context){
const state=resolveState(area,context),list=bucket(area);
for(const p of list){
if(p.name!=='*'&&p.name!==state.source)continue;
try{
const result=p.renderer(state,context||{});
if(result!==false)return{area:String(area),presenter:p.name,state};
}catch(e){console.error('TurnikUI presenter',area,p.name,e)}
}
return{area:String(area),presenter:'none',state};
}
function activeArea(){
const on=document.querySelector('.screen.on');
if(!on)return'';
if(on.id==='today')return'today';
if(on.id==='exercise')return'plan';
if(on.id==='historyScreen')return'progress';
return'';
}
function renderActive(context){
const area=activeArea();return area?renderArea(area,context):null;
}
function install(){
if(installed)return true;
if(typeof window.render!=='function')return false;
installed=true;baseRender=window.render;
window.render=function(){
if(rendering)return baseRender.apply(this,arguments);
rendering=true;
try{
const result=baseRender.apply(this,arguments);
renderActive({reason:'render'});
return result;
}finally{rendering=false}
};
return true;
}
function debug(){
const areas={};for(const [area,list] of presenters)areas[area]=list.map(x=>({name:x.name,priority:x.priority}));
return{version:VERSION,installed,activeArea:activeArea(),areas};
}
window.TurnikUI={version:VERSION,register,unregister,renderArea,renderActive,resolveState,install,debug};
try{window.dispatchEvent(new CustomEvent('turnikui:ready',{detail:{version:VERSION}}))}catch(e){}
})();