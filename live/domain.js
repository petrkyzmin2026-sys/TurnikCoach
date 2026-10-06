/* TURNIKCOACH_DOMAIN 1.0.0 */
(function(){
'use strict';
const VERSION='1.0.0';
if(window.TurnikDomain&&window.TurnikDomain.version===VERSION)return;
const areas=new Map();
function bucket(area){
const key=String(area||'');
if(!areas.has(key))areas.set(key,[]);
return areas.get(key);
}
function register(area,name,priority,resolver){
if(!area||!name||typeof resolver!=='function')return false;
const list=bucket(area),key=String(name);
const next={name:key,priority:Number(priority)||0,resolver};
const i=list.findIndex(x=>x.name===key);
if(i>=0)list.splice(i,1,next);else list.push(next);
list.sort((a,b)=>b.priority-a.priority||a.name.localeCompare(b.name));
return true;
}
function unregister(area,name){
const list=bucket(area),i=list.findIndex(x=>x.name===String(name));
if(i<0)return false;list.splice(i,1);return true;
}
function normalize(area,entry,value){
if(!value||typeof value!=='object')return null;
const out=Object.assign({},value);
out.area=String(area);out.source=entry.name;
if(!out.kind)out.kind='UNKNOWN';
return out;
}
function resolve(area,context){
const list=bucket(area),ctx=context&&typeof context==='object'?context:{};
for(const entry of list){
try{
const value=entry.resolver(ctx);
const normalized=normalize(area,entry,value);
if(normalized)return normalized;
}catch(e){console.error('TurnikDomain resolver',area,entry.name,e)}
}
return{area:String(area),source:'fallback',kind:'EMPTY'};
}
function snapshot(context){
return{
version:VERSION,
today:resolve('today',context),
plan:resolve('plan',context),
progress:resolve('progress',context)
};
}
function debug(){
const r={version:VERSION,areas:{}};
for(const [area,list] of areas)r.areas[area]=list.map(x=>({name:x.name,priority:x.priority}));
return r;
}
window.TurnikDomain={
version:VERSION,
register,unregister,resolve,snapshot,debug,
today:context=>resolve('today',context),
plan:context=>resolve('plan',context),
progress:context=>resolve('progress',context)
};
try{window.dispatchEvent(new CustomEvent('turnikdomain:ready',{detail:{version:VERSION}}))}catch(e){}
})();