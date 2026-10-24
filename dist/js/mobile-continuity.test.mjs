import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as policy from './scroll-policy.js';
const fixture=()=>{const handlers=new Map();return {handlers,document:{addEventListener(type,fn,opts){handlers.set(type,{fn,opts})},removeEventListener(type){handlers.delete(type)}},fire(type,event={}){handlers.get(type)?.fn(event)}}};
test('a queued initial-anchor callback cannot overwrite manual mobile scrolling',()=>{
 for(const kind of ['touchmove','wheel','keydown']){const f=fixture(),guard=policy.createDeferredNavigationGuard(f.document,true);let writes=0;const queued=()=>guard.run(()=>writes++);f.fire(kind,{key:'PageDown'});queued();assert.equal(writes,0,kind);assert.equal(f.handlers.size,0);}
});
test('uninterrupted links still restore once; desktop keeps prior behavior; non-scroll keys do not cancel',()=>{
 const f=fixture(),guard=policy.createDeferredNavigationGuard(f.document,true);let calls=0;f.fire('keydown',{key:'a'});guard.run(()=>calls++);guard.run(()=>calls++);assert.equal(calls,1);assert.equal(f.handlers.size,0);
 const desktop=fixture(),plain=policy.createDeferredNavigationGuard(desktop.document,false);assert.equal(desktop.handlers.size,0);plain.run(()=>calls++);assert.equal(calls,2);
});
test('guard never captures input and disposal prevents delayed writes',()=>{
 const f=fixture(),guard=policy.createDeferredNavigationGuard(f.document,true);assert.equal(f.handlers.get('touchmove').opts.passive,true);assert.equal(f.handlers.get('wheel').opts.passive,true);guard.dispose();let called=false;guard.run(()=>called=true);assert.equal(called,false);assert.equal(f.handlers.size,0);
});
test('native background uses stable compositor positioning and main clipping does not create a scroll container',async()=>{
 const css=await readFile(new URL('../css/science-globe.css',import.meta.url),'utf8');assert.match(css,/@supports\s*\(overflow:clip\)/);assert.match(css,/body\[data-page="home"\]>main\{overflow:clip\}/);assert.match(css,/position:sticky;top:0;height:100lvh;margin-bottom:-100lvh/);
 const app=await readFile(new URL('./app.js',import.meta.url),'utf8');assert.match(app,/if\(!nativeTouch\)\{sharedScene\.update\(\);experienceController\?\.update\(\);\}/);assert.match(app,/if\(nativeTouch\)\{sharedScene\.update\(\);experienceController\?\.update\(\);\}/);assert.match(app,/initialNavigation\.run\(\(\)=>scrollTo\(target,0\)\)/);assert.match(app,/pagehide',event=>\{if\(nativeTouch\)initialNavigation\.dispose\(\);if\(event\.persisted\)/);
});
