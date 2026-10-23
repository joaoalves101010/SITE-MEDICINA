import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initBookFallback } from './book-fallback.js';
import { bookPose } from './book-renderer.js';

function browser({context=true,hidden=false}={}) {
  const frames=new Map(),events=new Map(),draws=[];let frameId=0;
  const style=()=>({setProperty(key,value){this[key]=value;}});
  const doc={hidden,addEventListener(type,fn){events.set(type,fn);},removeEventListener(type,fn){if(events.get(type)===fn)events.delete(type);}};
  function el(tag){return {tag,ownerDocument:doc,style:style(),dataset:{},children:[],classList:{add(){}},setAttribute(){},append(...children){this.children.push(...children);for(const child of children)child.parent=this;},remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);},getContext(){return context?{clearRect(){},drawImage(...args){draws.push({face:this.owner,args});},owner:this}:null;}};}
  doc.createElement=el;
  const host={dataset:{}},root=el('div');root.clientWidth=1000;root.clientHeight=620;root.closest=()=>host;root.getBoundingClientRect=()=>({width:1000,height:620});
  const env={document:doc,requestAnimationFrame(fn){const id=++frameId;frames.set(id,fn);return id;},cancelAnimationFrame(id){frames.delete(id);}};
  return {doc,root,host,env,frames,events,draws,async flush(){const entries=[...frames.entries()];frames.clear();for(const [,fn]of entries)await fn();},visibility(value){doc.hidden=!value;events.get('visibilitychange')?.();}};
}
const page=index=>({index,width:2100,height:1200});
const world=b=>b.root.children[0];
const turn=b=>world(b).children[2];

test('shared book pose drives a true hinged front/back sheet and closed recentering',async()=>{
  const b=browser(),loads=[];
  const c=initBookFallback(b.root,{env:b.env,loadSpread:async index=>{loads.push(index);return page(index);},getProgress:()=>.5});
  await b.flush();assert.equal(await c.ready,true);assert.equal(c.mode,'css');
  const pose=bookPose(.5);
  assert.equal(world(b).style.transform,`translateX(${pose.centerX/2.1*100}%)`);
  assert.equal(turn(b).style.transform,`translateZ(3px) rotateY(${pose.leaves[0].angle*180/Math.PI}deg)`);
  assert.equal(turn(b).children.length,2);assert.deepEqual(loads,[0,1]);
  assert.equal(b.host.dataset.bookRender,'fallback-ready');assert.equal(b.frames.size,0);c.dispose();
});
test('closed cover and exact chapter stops never wait for the next screenshot',async()=>{
  const b=browser(),loads=[];
  const c=initBookFallback(b.root,{env:b.env,loadSpread:index=>{loads.push(index);return index===0?Promise.resolve(page(index)):new Promise(()=>{});}});
  await b.flush();assert.equal(await c.ready,true);assert.deepEqual(loads,[0]);
  assert.equal(world(b).dataset.progress,'0');c.dispose();
  const b2=browser(),loads2=[];
  const c2=initBookFallback(b2.root,{env:b2.env,getProgress:()=>3,loadSpread:async index=>{loads2.push(index);return page(index);}});
  await b2.flush();assert.deepEqual(loads2,[3]);assert.equal(await c2.ready,true);c2.dispose();
});
test('leaving an exact stop loads the adjacent spread and refreshes both page faces',async()=>{
  const b=browser(),loads=[];
  const c=initBookFallback(b.root,{env:b.env,getProgress:()=>2,loadSpread:async index=>{loads.push(index);return page(index);}});
  await b.flush();assert.deepEqual(loads,[2]);
  c.setProgress(2.1);await b.flush();assert.deepEqual(loads,[2,3]);
  assert.deepEqual(b.draws.slice(-4).map(d=>[d.args[0].index,d.args[1]]),[[2,0],[3,1050],[2,1050],[3,0]]);
  c.setProgress(2);await b.flush();assert.equal(b.draws.at(-1).args[0].index,2);c.dispose();
});
test('forward and reverse scrubbing show canonical full-spread halves with no idle rendering',async()=>{
  const b=browser(),c=initBookFallback(b.root,{env:b.env,loadSpread:async index=>page(index)});
  await b.flush();
  c.setProgress(3.25);await b.flush();
  assert.equal(world(b).dataset.spread,'3');assert.equal(turn(b).style.transform,'translateZ(3px) rotateY(-45deg)');
  const recent=b.draws.slice(-4).map(d=>[d.args[0].index,d.args[1]]);
  assert.deepEqual(recent,[[3,0],[4,1050],[3,1050],[4,0]]);
  const count=b.draws.length;c.setProgress(3.75);await b.flush();assert.equal(b.draws.length,count);
  c.setProgress(1.5);await b.flush();assert.equal(world(b).dataset.spread,'1');assert.equal(turn(b).style.transform,'translateZ(3px) rotateY(-90deg)');
  c.setProgress(6);await b.flush();assert.equal(turn(b).style.visibility,'hidden');assert.equal(world(b).dataset.spread,'6');
  assert.equal(b.frames.size,0);c.dispose();
});
test('latest explicit progress wins over a stale startup getter',async()=>{
  const b=browser(),c=initBookFallback(b.root,{env:b.env,loadSpread:async index=>page(index),getProgress:()=>0});
  c.setProgress(4);await b.flush();assert.equal(world(b).dataset.spread,'4');c.dispose();
});
test('first draw rechecks restored progress after asynchronous artwork loading',async()=>{
  const b=browser();let progress=0,resolveFirst,first=true;
  const c=initBookFallback(b.root,{env:b.env,getProgress:()=>progress,loadSpread:async index=>first?(first=false,new Promise(resolve=>{resolveFirst=()=>resolve(page(index));})):page(index)});
  const flushing=b.flush();await Promise.resolve();progress=4.4;resolveFirst();await flushing;
  assert.equal(await c.ready,true);assert.equal(world(b).dataset.spread,'4');assert.equal(world(b).dataset.progress,'4.4');c.dispose();
});
test('high-rate progress updates coalesce and load only latest required pages',async()=>{
  const b=browser(),loads=[];
  const c=initBookFallback(b.root,{env:b.env,loadSpread:async index=>{loads.push(index);return page(index);}});
  for(let i=0;i<100;i++)c.setProgress(i/100*6);
  assert.equal(b.frames.size,1);await b.flush();assert.deepEqual(loads,[5,6]);assert.equal(b.frames.size,0);c.dispose();
});
test('rapid async direction changes serialize loading and ignore obsolete art',async()=>{
  const b=browser(),loads=[];let releaseFirst,active=0,maximum=0;
  const c=initBookFallback(b.root,{env:b.env,loadSpread:async index=>{loads.push(index);active++;maximum=Math.max(maximum,active);if(loads.length===1)await new Promise(resolve=>releaseFirst=resolve);active--;return page(index);}});
  const flushing=b.flush();await Promise.resolve();c.setProgress(5.25);releaseFirst();await flushing;
  assert.equal(world(b).dataset.spread,'5');assert.deepEqual(loads,[0,5,6]);assert.equal(maximum,1);assert.ok(c.debug.cachedSpreads.length<=3);c.dispose();
});
test('cache holds at most three borrowed spreads without mutating shared pixel buffers',async()=>{
  const b=browser(),canvases=[];
  const c=initBookFallback(b.root,{env:b.env,loadSpread:async index=>{const canvas=page(index);canvases.push(canvas);return canvas;}});
  await b.flush();for(const p of [2.3,4.7,6,1.3]){c.setProgress(p);await b.flush();assert.ok(c.debug.cachedSpreads.length<=3);}
  assert.ok(canvases.every(canvas=>canvas.width===2100&&canvas.height===1200));
  const faces=[...world(b).children.slice(0,2),...turn(b).children];c.dispose();
  assert.ok(canvases.every(canvas=>canvas.width===2100&&canvas.height===1200));
  assert.ok(faces.every(canvas=>canvas.width===1&&canvas.height===1));
});
test('external/document visibility gate work and restore the latest pose',async()=>{
  const b=browser({hidden:true}),loads=[];
  const c=initBookFallback(b.root,{env:b.env,loadSpread:async index=>{loads.push(index);return page(index);}});
  c.setProgress(2.2);assert.equal(b.frames.size,0);assert.equal(loads.length,0);
  b.visibility(true);await b.flush();assert.equal(world(b).dataset.spread,'2');
  c.setVisible(false);c.setProgress(4.5);assert.equal(b.frames.size,0);
  c.setVisible(true);await b.flush();assert.equal(world(b).dataset.spread,'4');
  c.setProgress(1);b.visibility(false);assert.equal(b.frames.size,0);c.dispose();
});
test('hidden while awaiting a page does not draw or allocate the next page',async()=>{
  const b=browser();let releaseFirst;const loads=[];
  const c=initBookFallback(b.root,{env:b.env,loadSpread:index=>{loads.push(index);return new Promise(resolve=>releaseFirst=()=>resolve(page(index)));}});
  const flushing=b.flush();await Promise.resolve();c.setVisible(false);releaseFirst();await flushing;
  assert.deepEqual(loads,[0]);assert.equal(b.draws.length,0);assert.equal(b.frames.size,0);c.dispose();
});
test('dispose cancels queued work and invalidates unresolved artwork safely',async()=>{
  const b=browser();let releaseFirst;const canvas=page(0);
  const c=initBookFallback(b.root,{env:b.env,loadSpread:()=>new Promise(resolve=>releaseFirst=()=>resolve(canvas))});
  const flushing=b.flush();await Promise.resolve();c.dispose();releaseFirst();await flushing;
  assert.equal(await c.ready,false);assert.equal(canvas.width,2100);assert.equal(canvas.height,1200);assert.equal(b.root.children.length,0);assert.equal(b.events.size,0);assert.equal(b.draws.length,0);
  c.dispose();c.setProgress(2);c.setVisible(true);c.resize();assert.equal(b.frames.size,0);
});
test('missing Canvas2D fails open without a hidden forever pending state',async()=>{
  const b=browser({context:false});let error;
  const c=initBookFallback(b.root,{env:b.env,loadSpread:async index=>page(index),onError:e=>error=e});
  assert.equal(c.mode,'unavailable');assert.equal(await c.ready,false);assert.match(error.message,/Canvas 2D/);assert.equal(b.root.children.length,0);c.dispose();
});
test('CSS uses real front/back surfaces and preserves native input ownership',async()=>{
  const css=await readFile(new URL('../css/book-fallback.css',import.meta.url),'utf8');
  assert.ok(css.includes('.book-css[hidden]{display:none}'));
  assert.ok(css.includes('transform-style:preserve-3d'));assert.ok(css.includes('backface-visibility:hidden'));
  assert.ok(css.includes('transform:rotateY(180deg)'));assert.ok(css.includes('pointer-events:none'));
  assert.ok(!css.includes('animation:'));assert.ok(!css.includes('transition:'));
  const source=await readFile(new URL('./book-fallback.js',import.meta.url),'utf8');
  assert.ok(!source.includes('preventDefault'));assert.ok(!source.includes("addEventListener('wheel'"));
});
