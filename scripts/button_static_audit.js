'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');

const files=[
  'app/src/main/assets/index.html',
  'app/src/main/assets/app_v4.js',
  'live/course.js',
  'live/hotfix.js',
];
const source=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const handlerNames=new Set();
for(const m of source.matchAll(/onclick\s*=\s*["']([^"']+)["']/g)){
  const code=m[1];
  const call=code.match(/\b([A-Za-z_$][\w$]*)\s*\(/);
  if(call)handlerNames.add(call[1]);
}
const declared=name=>
  new RegExp('function\\s+'+name.replace(/[$]/g,'\\$&')+'\\s*\\(').test(source)||
  new RegExp('window\\.'+name.replace(/[$]/g,'\\$&')+'\\s*=').test(source)||
  new RegExp('(?:const|let|var)\\s+'+name.replace(/[$]/g,'\\$&')+'\\s*=').test(source);

const allowed=new Set(['setTimeout']);
const unresolved=[...handlerNames].filter(n=>!allowed.has(n)&&!declared(n)).sort();
assert.deepEqual(unresolved,[], 'Unresolved inline button handlers: '+unresolved.join(', '));

const literalButtons=[...source.matchAll(/<button\b/gi)].length;
const createdButtons=[...source.matchAll(/createElement\(['"]button['"]\)/g)].length;
const disabledAssignments=[...source.matchAll(/\.disabled\s*=\s*true/g)].length;
const critical=[
  'tcStartCourseWorkout','tcStartExtraWorkout','tcStartSupplementWorkout','tcStartAuxWorkout',
  'tcUndoTodayCourseWorkout','tcOpenUndoTodayCourseConfirm','tcDiscardWorkout'
];
const missingCritical=critical.filter(n=>!declared(n));
assert.deepEqual(missingCritical,[], 'Missing critical actions: '+missingCritical.join(', '));

assert(source.includes('tcStartExtraAfterCourseBtn'),
  'After-main extra-workout action must have a stable DOM id');
assert(source.includes('addEventListener(\'click\''),
  'Critical dynamically rendered actions should have programmatic click listeners');

console.log(JSON.stringify({
  files,
  literalButtons,
  createdButtons,
  inlineHandlers:[...handlerNames].sort(),
  disabledAssignments,
  unresolved,
  critical
},null,2));
