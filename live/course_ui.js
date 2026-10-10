/* TURNIKCOACH_COURSE_UI 1.0.0-owner */
(function(){
'use strict';
const VERSION='1.0.0-owner',AREAS=['today','plan','progress'],providers=new Map();
let installed=false,ui=null;
function bucket(area){const key=String(area||'');if(!providers.has(key))providers.set(key,[]);return providers.get(key)}
function register(area,owner,priority,renderer){
if(!AREAS.includes(String(area))||!owner||typeof renderer!=='function')return false;
const rows=bucket(area),key=String(owner),next={owner:key,priority:Number(priority)||0,renderer};
const i=rows.findIndex(x=>x.owner===key);if(i>=0)rows.splice(i,1,next);else rows.push(next);
rows.sort((a,b)=>b.priority-a.priority||a.owner.localeCompare(b.owner));return true;
}
function unregister(area,owner){
const rows=bucket(area),i=rows.findIndex(x=>x.owner===String(owner));if(i<0)return false;rows.splice(i,1);return true;
}
function render(area,view,context){
for(const row of bucket(area)){try{const result=row.renderer(view,context||{});if(result!==false)return true}catch(e){console.error('TurnikCourseUI '+area+' '+row.owner,e)}}
return false;
}
function install(nextUi){
if(nextUi)ui=nextUi;
if(!ui||typeof ui.register!=='function')throw new Error('TurnikCourseUI requires TurnikUI');
if(installed)return true;
for(const area of AREAS)ui.register(area,'morozov',100,(view,context)=>render(area,view,context));
installed=true;return true;
}
function debug(){
const map={};for(const area of AREAS)map[area]=bucket(area).map(x=>({owner:x.owner,priority:x.priority}));
let singleOwner=false;
try{
const d=ui&&ui.debug?ui.debug():null;
singleOwner=!!d&&AREAS.every(area=>(d.areas&&d.areas[area]||[]).filter(x=>x.name==='morozov').length===1);
}catch(e){}
return{version:VERSION,installed,areas:map,singleOwner};
}
window.TurnikCourseUI={version:VERSION,register,unregister,render,install,debug};
try{window.dispatchEvent(new CustomEvent('turnikcourseui:ready',{detail:{version:VERSION}}))}catch(e){}
})();