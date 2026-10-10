/* TURNIKCOACH_SCREEN_SHELL 1.0.0-owner */
(function(){
'use strict';
const VERSION='1.0.0-owner';
if(window.TurnikScreenShell&&window.TurnikScreenShell.version===VERSION)return;
let installed=false;
const NAV={
n1:{icon:'◫',label:'План'},
n2:{icon:'●',label:'Сегодня'},
n3:{icon:'⌁',label:'Прогресс'}
};
const HEADERS={
exercise:{k:'ПЛАН',title:'План',sub:'Программа, упражнения и параметры, по которым TurnikCoach строит тренировки.'},
historyScreen:{k:'ПРОГРЕСС',title:'Прогресс',sub:'История тренировок, объём, максимумы и контрольные результаты.'},
today:{k:'СЕГОДНЯ'}
};
function navItem(id){
const x=NAV[id],el=document.getElementById(id);
if(!x||!el)return false;
el.innerHTML='<span>'+x.icon+'</span>'+x.label;
el.setAttribute('aria-label',x.label);
return true;
}
function screenHeader(id){
const x=HEADERS[id],root=document.getElementById(id);
if(!x||!root)return false;
const k=root.querySelector('.head .k'),h1=root.querySelector('.head h1'),sub=root.querySelector('.head .sub');
if(k&&x.k)k.textContent=x.k;
if(h1&&x.title)h1.textContent=x.title;
if(sub&&x.sub)sub.textContent=x.sub;
return true;
}
function apply(){
Object.keys(NAV).forEach(navItem);
Object.keys(HEADERS).forEach(screenHeader);
const viewport=document.querySelector('meta[name="viewport"]');
if(viewport)viewport.setAttribute('content','width=device-width,initial-scale=1');
return true;
}
function install(){
if(installed){apply();return true}
installed=true;return apply();
}
function debug(){
return{
version:VERSION,installed,
nav:Object.fromEntries(Object.keys(NAV).map(id=>{const el=document.getElementById(id);return[id,el?(el.getAttribute('aria-label')||''):null]})),
headers:Object.fromEntries(Object.keys(HEADERS).map(id=>{const el=document.getElementById(id);return[id,el&&el.querySelector('.head h1')?el.querySelector('.head h1').textContent:null]}))
};
}
window.TurnikScreenShell={version:VERSION,install,apply,debug};
try{window.dispatchEvent(new CustomEvent('turnikscreenshell:ready',{detail:{version:VERSION}}))}catch(e){}
})();