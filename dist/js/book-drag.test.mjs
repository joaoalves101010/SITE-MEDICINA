import {restoreMedicalExperiences} from '../tests/medical-experiences-normalize.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {bookRawForProgress,bookDragProgress,bookDragHit,createBookDrag,setBookScrollImmediate} from './book-drag.js';
import {bookScrollState} from './book-controller.js';
import {restoreBookDrag} from '../tests/book-drag-normalize.mjs';
const eventTarget=()=>({events:new Map(),addEventListener(name,fn,options){const listeners=this.events.get(name)||[];listeners.push({fn,options});this.events.set(name,listeners);},removeEventListener(name,fn){this.events.set(name,(this.events.get(name)||[]).filter(l=>l.fn!==fn));},fire(name,data={}){const event={pointerId:4,pointerType:'mouse',button:0,buttons:1,isPrimary:true,clientX:600,clientY:350,target:{closest:()=>null},preventDefault(){this.prevented=true;},...data};for(const {fn}of this.events.get(name)||[])fn(event);return event;}});
function fixture({progress=2,enabled=true,failCapture=false}={}){
 const frames=new Map();let id=0,position=bookRawForProgress(progress)*704,active=false;const captures=new Set(),scrolls=[],snaps=[],ownership=[];
 const win={...eventTarget(),requestAnimationFrame(fn){frames.set(++id,fn);return id;},cancelAnimationFrame(n){frames.delete(n);}};
 const doc={...eventTarget(),visibilityState:'visible'};
 const rect={left:100,top:100,width:1000,height:600};
 const visual={...eventTarget(),dataset:{},getBoundingClientRect:()=>rect,setPointerCapture(id){if(failCapture)throw Error('capture unavailable');captures.add(id);},hasPointerCapture:id=>captures.has(id),releasePointerCapture(id){captures.delete(id);this.fire('lostpointercapture',{pointerId:id});}};
 const state=()=>({...bookScrollState(-position,800),enabled,top:2000,scrollY:2000+position});
 const drag=createBookDrag(visual,{window:win,document:doc,getState:state,scrollImmediate(y){position=y-2000;scrolls.push(y);},snapTo:index=>snaps.push(index),onActive(value){active=value;ownership.push(value);}});
 return {win,doc,visual,frames,captures,scrolls,snaps,ownership,drag,state,setEnabled(value){enabled=value;},get active(){return active;},tick(){const tasks=[...frames.values()];frames.clear();for(const fn of tasks)fn();}};
}
test('drag inverse roundtrips the accepted held/eased scroll pose without changing its timing',()=>{
 for(let i=0;i<=6000;i++){const p=i/1000;assert.ok(Math.abs(bookScrollState(-bookRawForProgress(p)*704,800).progress-p)<1e-10,p);}
 assert.equal(bookRawForProgress(-5),0);assert.equal(bookRawForProgress(Infinity),0);assert.equal(bookRawForProgress(99),6);
});
test('pointer distance moves a leaf continuously in either direction and remains bounded to adjacent pages',()=>{
 assert.equal(bookDragProgress(2,-235,1000),2.5);assert.equal(bookDragProgress(2,235,1000),1.5);
 assert.equal(bookDragProgress(2,-5000,1000),3);assert.equal(bookDragProgress(2,5000,1000),1);
 assert.equal(bookDragProgress(0,100,1000),0);assert.equal(bookDragProgress(6,-100,1000),6);
});
test('hit testing follows visible open spread/centered cover instead of giant stage whitespace',()=>{
 const r={left:0,top:0,width:1000,height:700};assert.ok(bookDragHit(r,500,350,0));assert.ok(!bookDragHit(r,100,350,0));assert.ok(bookDragHit(r,100,350,1));assert.ok(!bookDragHit(r,500,5,1));assert.ok(!bookDragHit(r,999,350,1));
});
test('mouse capture cancels inertia, coalesces pointer events and writes only the real scroll master',()=>{
 const f=fixture();const event=f.visual.fire('pointerdown');assert.equal(event.prevented,true);assert.ok(f.captures.has(4));assert.equal(f.active,true);assert.equal(f.scrolls[0],3408);
 f.visual.fire('pointermove',{clientX:500});f.visual.fire('pointermove',{clientX:365});assert.equal(f.frames.size,1);assert.equal(f.state().progress,2);f.tick();assert.ok(Math.abs(f.state().progress-2.5)<1e-10);assert.equal(f.scrolls.length,2);
 f.visual.fire('pointerup',{clientX:300});assert.deepEqual(f.snaps,[3]);assert.equal(f.drag.active,false);assert.equal(f.captures.size,0);assert.equal(f.active,false);assert.equal(f.frames.size,0);f.drag.dispose();
});
test('reverse dragging and releases snap from current pose; next wheel scroll cannot restore detached state',()=>{
 const f=fixture({progress:4});f.visual.fire('pointerdown');f.visual.fire('pointermove',{clientX:900});f.tick();assert.ok(f.state().progress<3.5);f.visual.fire('pointerup',{clientX:900});assert.deepEqual(f.snaps,[3]);const before=f.state().progress;f.drag.sync();assert.equal(f.state().progress,before);f.drag.dispose();
});
test('plain click during a partial turn never snaps or changes its visible angle',()=>{
 const f=fixture({progress:2.37});const before=f.state().progress;f.visual.fire('pointerdown');f.visual.fire('pointerup');assert.deepEqual(f.snaps,[]);assert.ok(Math.abs(f.state().progress-before)<1e-12);f.drag.dispose();
});
test('touch, pen, non-primary/right clicks, controls and empty corners retain native behavior',()=>{
 for(const event of [{pointerType:'touch'},{pointerType:'pen'},{isPrimary:false},{button:2},{clientY:100},{target:{closest:()=>({tagName:'BUTTON'})}}]){const f=fixture();const e=f.visual.fire('pointerdown',event);assert.equal(f.drag.active,false);assert.equal(e.prevented,undefined);assert.equal(f.scrolls.length,0);f.drag.dispose();}
 const f=fixture({progress:0});f.visual.fire('pointerdown',{clientX:150});assert.equal(f.drag.active,false);f.drag.dispose();
});
test('unavailable/reduced-motion semantic reading cannot capture or manipulate scroll',()=>{
 const f=fixture({enabled:false});f.visual.fire('pointerdown');assert.equal(f.drag.active,false);assert.equal(f.scrolls.length,0);f.drag.dispose();
});
test('capture failure is fail-open and leaves normal scrolling untouched',()=>{
 const f=fixture({failCapture:true});assert.doesNotThrow(()=>f.visual.fire('pointerdown'));assert.equal(f.drag.active,false);assert.equal(f.active,false);assert.equal(f.scrolls.length,0);f.drag.dispose();
});
test('pointercancel, lost capture, button loss and blur release without unsolicited navigation',()=>{
 for(const kind of ['pointercancel','lostpointercapture','buttons','blur']){const f=fixture();f.visual.fire('pointerdown');f.visual.fire('pointermove',{clientX:350});assert.equal(f.frames.size,1);
  if(kind==='blur')f.win.fire('blur');else if(kind==='buttons')f.visual.fire('pointermove',{buttons:0});else f.visual.fire(kind);
  assert.equal(f.drag.active,false,kind);assert.equal(f.frames.size,0,kind);assert.equal(f.captures.size,0,kind);assert.deepEqual(f.snaps,[],kind);assert.equal(f.active,false,kind);f.drag.dispose();}
});
test('resize, pagehide, hidden, disabled/offscreen and dispose cancel pending input without stale RAF work',()=>{
 for(const kind of ['resize','pagehide','hidden','disabled','dispose']){const f=fixture();f.visual.fire('pointerdown');f.visual.fire('pointermove',{clientX:350});
  if(kind==='hidden'){f.doc.visibilityState='hidden';f.doc.fire('visibilitychange');}else if(kind==='disabled'){f.setEnabled(false);f.drag.sync();}else if(kind==='dispose')f.drag.dispose();else f.win.fire(kind);
  const count=f.scrolls.length;f.tick();assert.equal(f.scrolls.length,count);assert.equal(f.drag.active,false);assert.equal(f.captures.size,0);assert.deepEqual(f.snaps,[]);f.drag.dispose();}
});
test('wheel remains passive and cancels ownership so ordinary scrolling resumes immediately',()=>{
 const f=fixture();assert.equal(f.win.events.get('wheel')[0].options.passive,true);f.visual.fire('pointerdown');const e=f.win.fire('wheel');assert.equal(e.prevented,undefined);assert.equal(f.drag.active,false);assert.equal(f.active,false);f.drag.dispose();
});
test('unrelated pointer events cannot interrupt or steal an active mouse gesture; disposal removes all listeners',()=>{
 const f=fixture();f.visual.fire('pointerdown');f.visual.fire('pointermove',{pointerId:12,clientX:100});f.visual.fire('pointerup',{pointerId:12});f.visual.fire('pointercancel',{pointerId:12});assert.equal(f.drag.active,true);assert.equal(f.frames.size,0);f.drag.dispose();for(const target of[f.win,f.doc,f.visual])assert.ok([...target.events.values()].every(list=>list.length===0));
});
test('normal scroll timing, accepted motion/art and geometry are untouched outside the new input adapter',async()=>{
 const baseline=JSON.parse(await readFile(new URL('../tests/book-medical-baseline.json',import.meta.url),'utf8'));
 for(const path of ['js/book-renderer.js','js/book-controller.js','js/book-fallback.js','css/book.css','css/book-fallback.css','js/app.js']){const text=await readFile(new URL('./../'+path,import.meta.url),'utf8');assert.equal(createHash('sha256').update(restoreBookDrag(path,text)).digest('hex'),baseline.protected[path],path);}
 const app=await readFile(new URL('./app.js',import.meta.url),'utf8');assert.ok(app.includes("scrollImmediate:target=>setBookScrollImmediate(scroll,target)"));assert.ok(!app.slice(app.indexOf('let bookController;'),app.indexOf('let scienceController;')).includes('scroll?.stop()'));assert.ok(!app.includes('onDragActive:'));
 const css=await readFile(new URL('../css/book.css',import.meta.url),'utf8');assert.ok(!css.includes('touch-action'));const drag=await readFile(new URL('./book-drag.js',import.meta.url),'utf8');assert.ok(!drag.includes("'touchmove'"));
});
test('all approved medical art/copy, hero/globe, internal content and diagonal screenshot assets match the published release',async()=>{
 const baseline=JSON.parse(await readFile(new URL('../tests/book-drag-baseline.json',import.meta.url),'utf8'));
 for(const[path,expected]of Object.entries(baseline.protected)){let bytes=await readFile(new URL('../'+path,import.meta.url));if(['js/templates.js','js/app.js','assets/manifest.json'].includes(path))bytes=restoreMedicalExperiences(path,bytes.toString());assert.equal(createHash('sha256').update(bytes).digest('hex'),expected,path);}
});
test('actual vendored methods avoid the duration-zero NaN and synchronously transform/dispatch finite drag coordinates',async()=>{
 const {runInNewContext}=await import('node:vm');const source=await readFile(new URL('./vendor/motion.js',import.meta.url),'utf8');
 function method(name,occurrence=-1){const marker=`key:"${name}",value:`;const offsets=[];let offset=0;while((offset=source.indexOf(marker,offset))>=0){offsets.push(offset+marker.length);offset+=marker.length;}const start=offsets[occurrence<0?offsets.length+occurrence:occurrence];assert.ok(start>0,name);let end=source.indexOf('{',start),depth=1,quote=null,escape=false;for(end++;depth;end++){const c=source[end];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote=null;}else if(c==='"'||c==="'"||c==='`')quote=c;else if(c==='{')depth++;else if(c==='}')depth--;}return source.slice(start,end);}
 const frames=new Map(),transforms=[],dispatches=[];let id=0;
 const scope={Date:{now:()=>0},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),h:Object.assign,w:arr=>arr,f:v=>v,r:{prototype:{}},x:()=>function(){dispatches.push(this.instance.scroll.y);},pt:()=>v=>v,M:v=>v,tt:(a,b,t)=>a+(b-a)*t};
 const engine={instance:{scroll:{x:0,y:1200},delta:{x:0,y:1800},limit:{x:0,y:5000}},directionAxis:'y',direction:'vertical',startScrollTs:0,lerp:.1,html:{classList:{remove(){}}},sections:{main:{persistent:true,inView:true,el:{}}},transform(_el,x,y){transforms.push(y);},detectElements(){},transformElements(){},startScrolling(){this.isScrolling=true;},isScrolling:false};
 for(const name of ['stopScrolling','setScroll','updateScroll','checkScroll','scrollTo'])engine[name]=runInNewContext(`(${method(name,['setScroll','scrollTo'].includes(name)?-2:-1)})`,scope);
 engine.scrollTo(2300,{duration:0,disableLerp:true});assert.ok(Number.isNaN(engine.instance.scroll.y),'the actual old tween reproduces 0/0 with a same-millisecond clock');assert.ok(frames.size>0);
 const scroll={scroll:engine,setScroll:(x,y)=>engine.setScroll(x,y)};
 setBookScrollImmediate(scroll,2500,{});assert.equal(engine.instance.scroll.y,2500);assert.equal(engine.instance.delta.y,2500);assert.equal(transforms.at(-1),-2500);assert.equal(dispatches.at(-1),2500);assert.equal(engine.animatingScroll,false);assert.equal(engine.scrollToRaf,null);
 for(let n=0;n<20;n++){setBookScrollImmediate(scroll,2500+n*10,{});assert.ok(Number.isFinite(engine.instance.scroll.y));assert.equal(dispatches.at(-1),2500+n*10);}
 setBookScrollImmediate(scroll,99999,{});assert.equal(engine.instance.scroll.y,5000);setBookScrollImmediate(scroll,-100,{});assert.equal(engine.instance.scroll.y,0);
});
test('native immediate scrolling is finite, instant and leaves global smooth-navigation semantics alone',()=>{
 const calls=[],win={scrollTo:value=>calls.push(value)};setBookScrollImmediate(null,420,win);assert.deepEqual(calls,[{top:420,behavior:'instant'}]);setBookScrollImmediate(null,NaN,win);assert.equal(calls.length,1);
});
