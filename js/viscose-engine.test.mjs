import test from 'node:test';
import assert from 'node:assert/strict';
import * as Three from './vendor/three-scene.js';
import {VISCOSE,createViscoseState,viscoseEntry,viscoseGeometry,viscosePick,viscoseImpulse,stepViscose,createViscoseEngine} from './viscose-engine.js';
import {viscoseFragment,VISCOSE_MAX_CARDS} from './viscose-shaders.js';
const close=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} ≈ ${b}`);
const flush=async()=>{for(let i=0;i<40;i++)await Promise.resolve();};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function events(extra={}){const listeners=new Map();return {...extra,addEventListener(name,fn,options){const list=listeners.get(name)||[];list.push({fn,options});listeners.set(name,list);},removeEventListener(name,fn){listeners.set(name,(listeners.get(name)||[]).filter(item=>item.fn!==fn));},emit(name,props={}){const event={pointerId:1,pointerType:'mouse',button:0,buttons:1,isPrimary:true,clientX:600,clientY:350,timeStamp:100,target:{closest:()=>null},preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...props};for(const {fn} of [...listeners.get(name)||[]])fn(event);return event;},listeners};}
function fixture({intro=false,engaged=true,consumeSync=false,wheelOwned=null,diagnosticCallback=null,reduced=false,top=0,runtimeJob=null,runtimeJobs=null,imageJob=null,throwRender=false,compileFailure=false,forceLossEvent=false}={}){
 let time=0,id=0,imports=0,imageLoads=0,contextLost=false;const frames=new Map(),timers=new Map(),consumed=[],exits=[],diagnostics=[],renderers=[],textures=[],poses=[],selections=[],ready=[],modes=[],errors=[],observers=[],resizes=[],captures=new Set(),rect={left:0,top,width:1200,height:700,bottom:top+700};
 const media=events({matches:reduced}),win=events({devicePixelRatio:3,innerHeight:800,performance:{now:()=>time},requestAnimationFrame(fn){frames.set(++id,fn);return id;},cancelAnimationFrame(id){frames.delete(id);},setTimeout(fn,ms){timers.set(++id,{fn,at:time+ms});return id;},clearTimeout(id){timers.delete(id);},matchMedia:()=>media,IntersectionObserver:class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}},ResizeObserver:class{constructor(callback){this.callback=callback;resizes.push(this);}observe(){}disconnect(){this.disconnected=true;}}});
 const canvases=[];const doc=events({hidden:false,visibilityState:'visible',createElement(){const canvas={width:1,height:1,getContext:()=>({fillRect(){},save(){},beginPath(){},rect(){},clip(){},drawImage(){},restore(){},scale(){},fillText(){}})};canvases.push(canvas);return canvas;}});
 const canvas=events({style:{}}),surface=events({dataset:{},contains:node=>node===surface||!!node?.withinSurface,getBoundingClientRect:()=>({...rect}),setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture(id){captures.delete(id);surface.emit('lostpointercapture',{pointerId:id});}});
 class Texture{constructor(image){this.image=image;this.disposed=false;textures.push(this);}dispose(){this.disposed=true;}}
 class Renderer{constructor(){if(forceLossEvent&&contextLost)throw Error('Cannot initialize a renderer on a lost canvas context');this.capabilities={maxTextureSize:4096};this.info={programs:compileFailure?[{diagnostics:{runnable:false}}]:[]};this.draws=[];renderers.push(this);}setPixelRatio(value){this.dpr=value;}setClearColor(){}setSize(w,h){this.size=[w,h];}render(scene){if(throwRender)throw Error('draw failed');this.draws.push(scene.children[0].material.uniforms.uCards.value.map(v=>[v.x,v.y,v.z,v.w]));}getContext(){return {isContextLost:()=>contextLost};}dispose(){this.disposed=true;}forceContextLoss(){this.lost=true;if(forceLossEvent){contextLost=true;queueMicrotask(()=>canvas.emit('webglcontextlost'));}}}
 const emitSurface=surface.emit;surface.emit=function(name,props={}){return name==='wheel'?doc.emit(name,{target:surface,...props}):emitSurface.call(this,name,props);};
 const runtime={...Three,CanvasTexture:Texture,WebGLRenderer:Renderer},files=Array.from({length:8},(_,i)=>({src:`/photo-${i}.webp`,focalY:i===6?.35:.5}));
 const controller=createViscoseEngine(surface,{canvas,files,window:win,document:doc,intro,engaged,wheelOwned,onDiagnostic:snapshot=>{diagnostics.push(snapshot);diagnosticCallback?.(snapshot);},onWheelConsume:e=>{consumed.push(e);if(consumeSync){controller.setVisible(true);controller.updateBounds();controller.setEngaged(true);}},onWheelExit:(direction,event)=>exits.push({direction,event}),loadRuntime:()=>{imports++;return runtimeJobs?.[imports-1]?.promise||runtimeJob?.promise||Promise.resolve(runtime);},loadImage:async(src,signal)=>{imageLoads++;return imageJob?imageJob(src,signal):{width:1800,height:1200};},onPose:p=>poses.push(p),onSelection:i=>selections.push(i),onReady:r=>ready.push(r.mode),onMode:m=>modes.push(m),onFallback:e=>errors.push(e.message)});
 return {controller,win,doc,media,canvas,surface,frames,renderers,textures,poses,selections,ready,modes,errors,observers,resizes,captures,rect,canvases,runtime,timers,consumed,exits,diagnostics,stats:()=>({imports,imageLoads}),tick(ms=16.6667){time+=ms;for(const [key,timer] of [...timers])if(timer.at<=time){timers.delete(key);timer.fn();}const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(time);},settle(limit=1200){for(let i=0;frames.size&&i<limit;i++)this.tick();}};
}
test('eight-item resting arc preserves source card scale and deliberately adapts radius without duplicated cards',()=>{
 const s=createViscoseState(8,{intro:false}),f=stepViscose(s,1512,870,0),card=f.cards.find(c=>c.index===0);close(card.x/1512,.5);close(f.centre.x,1512*.5-340*4.46*.8);close(card.y,435);close(f.cardWidth/1512,.2654761905,1e-10);close(f.cardHeight/f.cardWidth,2/3);assert.equal(new Set(f.cards.map(c=>c.index)).size,8);assert.equal(f.cards.filter(c=>c.x>0&&c.x<1512&&c.y>0&&c.y<870).length,1);
});
test('resting focal photo is centered and contained at every responsive width',()=>{
 for(const width of [320,390,480,540,640,768,1024,1180,1512,1920]){
  const f=stepViscose(createViscoseState(8,{intro:false}),width,800,0),card=f.cards.find(c=>c.index===0);
  close(card.x,width*.5);assert.ok(card.x-f.cardWidth*.5>=8,`left contained at ${width}`);assert.ok(card.x+f.cardWidth*.5<=width-8,`right contained at ${width}`);
 }
});
test('birth, fan and stage shift remain deterministic through viewport changes',()=>{
 const s=createViscoseState(8),samples=[];for(let i=0;i<600;i++){const f=stepViscose(s,1200,700,1/60);if(i%60===0)samples.push(f.entryProgress);for(const c of f.cards)assert.ok([c.x,c.y,c.rotation,c.scaleX,c.scaleY].every(Number.isFinite));}
 assert.ok(samples.every((v,i)=>!i||v>=samples[i-1]));assert.equal(s.interactive,true);const t=s.elapsed;stepViscose(s,390,700,0);assert.equal(s.elapsed,t);assert.equal(viscoseEntry(0).birth,0);assert.equal(viscoseGeometry(390,700).offset,-3.5);
});
test('angular picks choose shortest winding and settle metadata only at the requested actual image',()=>{
 const s=createViscoseState(8,{intro:false});viscosePick(s,7);assert.ok(s.pick.to<0);for(let i=0;i<500;i++)stepViscose(s,1200,700,1/60);assert.equal(s.selected,7);close(s.velocity,0);viscosePick(s,1);for(let i=0;i<500;i++)stepViscose(s,1200,700,1/60);assert.equal(s.selected,1);assert.ok(Math.abs(s.spin)<Math.PI);
});
test('time-normalized damped motion reaches the same slot at 60Hz and 120Hz and parks without idle creep',()=>{
 const a=createViscoseState(8,{intro:false}),b=createViscoseState(8,{intro:false});viscoseImpulse(a,1400);viscoseImpulse(b,1400);for(let i=0;i<2400;i++){stepViscose(b,1200,700,1/120);if(i%2===0)stepViscose(a,1200,700,1/60);}assert.equal(a.selected,b.selected);assert.equal(a.velocity,0);assert.equal(b.velocity,0);assert.equal(a.frame.moving,false);assert.equal(b.frame.moving,false);
});
test('pointer response creates real rounded-field bridges, lean, swelling and then relaxes',()=>{
 const s=createViscoseState(8,{intro:false});let f=stepViscose(s,1200,700,0);const selected=f.cards.find(c=>c.index===0);s.pointer={x:selected.x-600,y:350-selected.y,inside:true,seeded:true,coarse:false};for(let i=0;i<120;i++)f=stepViscose(s,1200,700,1/60);assert.ok(f.cards.find(c=>c.index===0).scaleX>1.04);assert.equal(f.hovered,0);assert.ok(f.pointer.amount>.99);s.pointer.inside=false;for(let i=0;i<900;i++)f=stepViscose(s,1200,700,1/60);assert.ok(f.cards.find(c=>c.index===0).scaleX<1.00001);assert.equal(f.moving,false);
});
test('cursor tag uses independent elastic axes and a finite flattening exit',()=>{
 const s=createViscoseState(8,{intro:false});let f=stepViscose(s,1200,700,0);const card=f.cards.find(c=>c.index===0);s.pointer={x:card.x-600,y:350-card.y,inside:true,seeded:true,coarse:false};let maxX=0,maxY=0,different=false;
 for(let i=0;i<50;i++){f=stepViscose(s,1200,700,1/60);maxX=Math.max(maxX,f.tag.sx);maxY=Math.max(maxY,f.tag.sy);different ||= Math.abs(f.tag.sx-f.tag.sy)>.12;}assert.ok(maxX>1.02);assert.ok(maxY>1.05);assert.equal(different,true);close(f.tag.sx,1);close(f.tag.sy,1);
 s.pointer.inside=false;for(let i=0;i<18;i++)f=stepViscose(s,1200,700,1/60);close(f.tag.sx,.5);close(f.tag.sy,0);
});
test('viscous shape release follows remaining cursor envelope rather than cutting input to zero',()=>{
 const s=createViscoseState(8,{intro:false});let f=stepViscose(s,1200,700,0);const card=f.cards.find(c=>c.index===0);s.pointer={x:card.x-600,y:350-card.y,inside:true,seeded:true,coarse:false};for(let i=0;i<120;i++)f=stepViscose(s,1200,700,1/60);s.pointer.inside=false;stepViscose(s,1200,700,1/60);assert.ok(s.hover[0].f>.96);
});
test('source staging geometry is preserved until late shift before responsive count correction',()=>{
 const s=createViscoseState(8);s.elapsed=6.6;const f=stepViscose(s,1200,700,0),shift=viscoseEntry(6.6).shift,g=viscoseGeometry(1200,700);assert.ok(shift<.65);close(f.centre.x,600+g.offset*1200*.5*shift);
});
test('scrolling bounds reprojects pointer and lagged cursor without inventing a wake',async()=>{
 const f=fixture();await flush();f.settle();f.surface.emit('pointermove',{clientX:610,clientY:350});f.settle(300);const p=f.controller.debug.state.pointer,c=f.controller.debug.state.cursor,dx=p.x-c.x,dy=p.y-c.y;
 f.rect.top=-100;f.rect.bottom=600;f.controller.updateBounds();close(p.y,-100);close(p.x-c.x,dx);close(p.y-c.y,dy);f.controller.dispose();
});
test('stationary pointer leaves the effect when the stage scrolls past, except active capture',async()=>{
 const f=fixture();await flush();f.settle();f.surface.emit('pointermove',{clientX:600,clientY:350});assert.equal(f.controller.debug.state.pointer.inside,true);f.rect.top=-800;f.rect.bottom=-100;f.controller.updateBounds();assert.equal(f.controller.debug.state.pointer.inside,false);
 f.rect.top=0;f.rect.bottom=700;f.controller.updateBounds();f.surface.emit('pointerdown',{clientX:600,clientY:350});f.rect.top=-800;f.rect.bottom=-100;f.controller.updateBounds();assert.equal(f.controller.debug.state.pointer.inside,true);f.surface.emit('pointercancel');f.controller.updateBounds();assert.equal(f.controller.debug.state.pointer.inside,false);f.controller.dispose();
});
test('stationary touch hold activates liquid after160ms without capturing native vertical pan',async()=>{
 const f=fixture();await flush();f.settle();f.surface.emit('pointerdown',{pointerType:'touch'});f.tick(159);assert.equal(f.captures.size,0);assert.equal(!!f.controller.debug.state.pointer.held,false);f.tick(2);assert.equal(f.controller.debug.state.pointer.held,true);assert.equal(f.captures.size,0);
 const vertical=f.surface.emit('pointermove',{pointerType:'touch',clientY:370});assert.equal(vertical.prevented,undefined);assert.equal(!!f.controller.debug.state.pointer.held,false);assert.equal(f.captures.size,0);f.controller.dispose();assert.equal(f.timers.size,0);
});
test('GPU reveal occurs only after a real successful frame; atlas/DPR bounded and image indices match DOM model',async()=>{
 const f=fixture();assert.deepEqual(f.ready,['fallback']);assert.equal(f.renderers.length,0);await flush();assert.equal(f.ready.includes('webgl'),false);f.tick();assert.ok(f.renderers[0].draws.length>0);assert.equal(f.ready.at(-1),'webgl');assert.equal(f.controller.mode,'webgl');assert.equal(f.renderers[0].dpr,1.5);assert.ok(f.controller.debug.atlasBytes<=1536*1023*4);assert.deepEqual(f.renderers[0].draws.at(-1).map(v=>v[3]),f.poses.at(-1).cards.map(c=>c.index));f.controller.dispose();assert.ok(f.textures.every(t=>t.disposed&&t.image===null));assert.ok(f.renderers[0].disposed&&f.renderers[0].lost);
});
test('settled model stops RAF, coalesces invalidation and preserves identical state through fallback',async()=>{
 const f=fixture();await flush();f.settle();assert.equal(f.frames.size,0);f.controller.pick(3);assert.equal(f.frames.size,1);f.controller.pick(5);assert.equal(f.frames.size,1);f.settle();assert.equal(f.controller.index,5);const spin=f.controller.debug.state.spin;f.canvas.emit('webglcontextlost');f.settle();assert.equal(f.controller.mode,'fallback');assert.equal(f.controller.debug.state.spin,spin);assert.equal(f.errors.length,1);f.controller.dispose();
});
test('hidden/offscreen initial mount and delayed runtime cannot allocate GPU; visibility sources never override each other',async()=>{
 const far=fixture({top:5000});await flush();assert.equal(far.stats().imports,0);assert.equal(far.frames.size,0);far.controller.dispose();
 const job=deferred(),f=fixture({runtimeJob:job});f.controller.setVisible(false);job.resolve(f.runtime);await flush();assert.equal(f.renderers.length,0);f.observers[0].callback([{isIntersecting:true}]);f.win.emit('pageshow');assert.equal(f.frames.size,0);f.controller.setVisible(true);await flush();f.tick();assert.equal(f.controller.mode,'webgl');f.doc.hidden=true;f.doc.emit('visibilitychange');assert.equal(f.frames.size,0);f.doc.hidden=false;f.doc.emit('visibilitychange');f.observers[0].callback([{isIntersecting:false}]);f.win.emit('pageshow');assert.equal(f.frames.size,0);f.controller.dispose();
});
test('a stale hidden import cannot clear a newer visible GPU-loading latch',async()=>{
 const a=deferred(),b=deferred(),f=fixture({runtimeJobs:[a,b]});assert.equal(f.stats().imports,1);
 f.controller.setVisible(false);f.controller.setVisible(true);assert.equal(f.stats().imports,2);assert.equal(f.controller.debug.gpuLoading,true);
 a.resolve(f.runtime);await flush();assert.equal(f.controller.debug.gpuLoading,true);f.controller.setVisible(true);assert.equal(f.stats().imports,2);
 b.resolve(f.runtime);await flush();f.tick();assert.equal(f.renderers.length,1);assert.equal(f.controller.mode,'webgl');f.controller.dispose();
});
test('partial image loads abort on hide, release their atlas, and can retry without permanently empty cards',async()=>{
 const jobs=[];const f=fixture({imageJob:(src,signal)=>new Promise((resolve,reject)=>{jobs.push({src,signal,resolve});signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true});})});await flush();assert.equal(jobs.length,2);jobs[0].resolve({width:1800,height:1200});await flush();f.tick();assert.equal(f.controller.mode,'fallback','partial atlas must not hide complete DOM cards');f.controller.setVisible(false);assert.equal(jobs[1].signal.aborted,true);assert.ok(f.renderers[0].disposed);assert.equal(f.controller.mode,'fallback');f.controller.setVisible(true);await flush();assert.ok(f.renderers.length>=2);f.controller.dispose();for(const job of jobs)job.resolve({width:1800,height:1200});await flush();assert.ok(f.textures.every(t=>t.disposed));
});
test('shader failure preserves the functioning DOM ring rather than revealing an empty canvas',async()=>{
 for(const opts of [{throwRender:true},{compileFailure:true}]){const f=fixture(opts);await flush();f.tick();assert.equal(f.controller.mode,'fallback');assert.ok(!f.ready.includes('webgl'));assert.equal(f.errors.length,1);f.controller.pick(4);f.settle();assert.equal(f.controller.index,4);f.controller.dispose();}
});
test('reduced motion does not import WebGL and still supports immediate finite program selection',async()=>{
 const f=fixture({reduced:true,intro:true});await flush();assert.equal(f.stats().imports,0);f.controller.pick(6);f.tick();assert.equal(f.controller.index,6);assert.equal(f.frames.size,0);assert.equal(f.poses.at(-1).entryProgress,1);f.controller.dispose();
});
test('mouse angular drag is vertical at the front card, respects primary input and releases capture safely',async()=>{
 const f=fixture();await flush();f.settle();const first=f.controller.debug.state.spin;
 f.surface.emit('pointerdown',{clientX:600,clientY:350});assert.equal(f.captures.size,1);f.surface.emit('pointermove',{clientX:600,clientY:220,timeStamp:150});f.tick();assert.notEqual(f.controller.debug.state.spin,first);f.surface.emit('pointerup',{clientX:600,clientY:220,timeStamp:160});assert.equal(f.captures.size,0);f.settle();
 for(const reason of ['pointercancel','lostpointercapture']){f.surface.emit('pointerdown');f.surface.emit(reason);assert.equal(f.captures.size,0);assert.equal(f.controller.debug.state.dragging,false);}
 const e=f.surface.emit('pointerdown',{button:2});assert.equal(e.prevented,undefined);assert.equal(f.captures.size,0);f.controller.dispose();
});
test('a quick click focuses the photograph under release without waiting for a hover RAF',async()=>{
 const f=fixture();await flush();f.settle();f.controller.pick(1);for(let i=0;i<12;i++)f.tick();
 const card=f.poses.at(-1).cards.find(c=>c.index===1),x=card.x,y=card.y;
 f.controller.debug.state.frame.hovered=6; // intentionally stale cursor hover
 f.surface.emit('pointerdown',{clientX:x,clientY:y});f.surface.emit('pointerup',{clientX:x,clientY:y});
 assert.equal(f.controller.debug.state.pick?.index,1);f.settle();assert.equal(f.controller.index,1);f.controller.dispose();
});

test('viewport-owned wheel routes outside and index targets without intercepting zoom or editable fields',async()=>{
 let owned=true;const f=fixture({wheelOwned:()=>owned});await flush();f.settle();
 const outside={closest:()=>null};let e=f.doc.emit('wheel',{target:outside,deltaY:120,deltaX:0});assert.equal(e.prevented,true);assert.equal(e.stopped,true);
 const index={closest:s=>s.includes('button')?{}:null};e=f.doc.emit('wheel',{target:index,deltaY:120,deltaX:0});assert.equal(e.prevented,true);
 for(const props of [{ctrlKey:true},{metaKey:true},{target:{isContentEditable:true,closest:()=>null}},{target:{closest:s=>s.includes('input')?{}:null}},{target:{closest:s=>s.includes('contenteditable')?{}:null}}]){e=f.doc.emit('wheel',{target:outside,deltaY:120,deltaX:0,...props});assert.equal(e.prevented,undefined);}
 owned=false;e=f.doc.emit('wheel',{target:outside,deltaY:120,deltaX:0});assert.equal(e.prevented,undefined);f.controller.dispose();
});
test('viewport ownership consumes outside wheel during full intro without skipping any timeline',async()=>{
 const f=fixture({intro:true,wheelOwned:()=>true});await flush();const outside={closest:()=>null};for(let i=0;i<120;i++){const before=f.controller.debug.state.elapsed,e=f.doc.emit('wheel',{target:outside,deltaY:1e6,deltaX:0});assert.equal(e.prevented,true);close(f.controller.debug.state.elapsed,before);f.tick();}assert.ok(f.controller.debug.state.elapsed<2.1);assert.equal(f.exits.length,0);assert.equal(f.controller.debug.state.interactive,false);f.settle();assert.equal(f.controller.debug.state.interactive,true);assert.deepEqual(f.selections,[0]);f.controller.dispose();
});
test('owned huge wheel bursts settle and announce every adjacent institution before the next corridor',async()=>{
 const f=fixture({wheelOwned:()=>true});await flush();f.settle();const outside={closest:()=>null},slot=Math.PI*2/8;
 for(let destination=1;destination<8;destination++){for(let n=0;n<20;n++)f.doc.emit('wheel',{target:outside,deltaY:1e6,deltaX:0});f.settle();assert.equal(f.controller.index,destination);close(f.controller.debug.state.spin,destination*slot);assert.deepEqual(f.selections,Array.from({length:destination+1},(_,i)=>i));}
 let exit=f.doc.emit('wheel',{target:outside,deltaY:1e6,deltaX:0});assert.equal(exit.prevented,undefined);assert.equal(f.exits.at(-1).direction,1);
 for(let destination=6;destination>=0;destination--){for(let n=0;n<20;n++)f.doc.emit('wheel',{target:outside,deltaY:-1e6,deltaX:0});f.settle();assert.equal(f.controller.index,destination);}
 assert.deepEqual(f.selections,[0,1,2,3,4,5,6,7,6,5,4,3,2,1,0]);exit=f.doc.emit('wheel',{target:outside,deltaY:-1e6,deltaX:0});assert.equal(exit.prevented,undefined);assert.equal(f.exits.at(-1).direction,-1);f.controller.dispose();
});
test('continuous high-momentum owned packets cannot bypass a settled selection frame in either direction',async()=>{
 const f=fixture({wheelOwned:()=>true,consumeSync:true});await flush();f.settle();
 for(const direction of [1,-1]){const destination=direction>0?7:0;let frames=0;while((f.controller.index!==destination||f.controller.debug.state.velocity!==0)&&frames++<500){f.surface.emit('wheel',{deltaX:0,deltaY:direction*1e6});f.tick(1000/120);}assert.ok(frames<500);}
 assert.deepEqual(f.selections,[0,1,2,3,4,5,6,7,6,5,4,3,2,1,0]);for(let i=1;i<f.selections.length;i++)assert.equal(Math.abs(f.selections[i]-f.selections[i-1]),1);f.controller.dispose();
});
test('owned wheel can reverse an unfinished corridor without skipping its starting institution',async()=>{
 const f=fixture({wheelOwned:()=>true});await flush();f.settle();f.surface.emit('wheel',{deltaY:1e6,deltaX:0});f.tick();assert.ok(f.controller.debug.state.spin>0&&f.controller.debug.state.spin<Math.PI/4);f.surface.emit('wheel',{deltaY:-1e6,deltaX:0});f.settle();assert.equal(f.controller.index,0);assert.deepEqual(f.selections,[0]);assert.equal(f.exits.length,0);f.controller.dispose();
});
test('sequential keyboard step preserves pick easing, rejects unsettled turns and exits only settled edges',async()=>{
 const f=fixture({intro:true,wheelOwned:()=>true});await flush();assert.equal(f.controller.step(1),false);assert.equal(f.exits.length,0);f.settle();assert.equal(f.controller.step(1),true);assert.equal(f.controller.debug.state.pick.index,1);assert.equal(f.controller.step(1),false);f.settle();assert.equal(f.controller.index,1);assert.equal(f.controller.step(-1),true);f.settle();assert.equal(f.controller.index,0);const event={key:'ArrowUp'};assert.equal(f.controller.step(-1,event),false);assert.equal(f.exits.at(-1).direction,-1);assert.equal(f.exits.at(-1).event,event);f.controller.pick(7);f.settle();assert.equal(f.controller.step(1),false);assert.equal(f.exits.at(-1).direction,1);f.controller.dispose();
});
test('engaged wheel accepts the dominant axis; ctrl zoom, outside engagement and controls pass through',async()=>{
 const f=fixture();await flush();f.settle();const vertical=f.surface.emit('wheel',{deltaX:0,deltaY:120});assert.equal(vertical.prevented,true);assert.equal(vertical.stopped,true);close(f.controller.debug.state.velocity,120*.0022);assert.equal(f.consumed.length,1);
 const zoom=f.surface.emit('wheel',{deltaX:120,deltaY:2,ctrlKey:true});assert.equal(zoom.prevented,undefined);
 f.controller.setEngaged(false);const outside=f.surface.emit('wheel',{deltaX:120,deltaY:2});assert.equal(outside.prevented,undefined);f.controller.setEngaged(true);
 const horizontal=f.surface.emit('wheel',{deltaX:240,deltaY:2});assert.equal(horizontal.prevented,true);assert.equal(horizontal.stopped,true);assert.equal(f.doc.listeners.get('wheel')[0].options.capture,true);const control=f.surface.emit('pointerdown',{target:{closest:()=>({tagName:'BUTTON'})}});assert.equal(control.prevented,undefined);f.controller.dispose();
});
test('wheel over an intro index button stays in stage while native links and forms remain untouched',async()=>{
 const f=fixture({intro:true});await flush();const index={withinSurface:true,closest:selector=>selector.includes('button')?{}:null};const wheel=f.surface.emit('wheel',{target:index,deltaX:0,deltaY:120});assert.equal(wheel.prevented,true);assert.equal(f.controller.debug.state.interactive,false);
 const link={withinSurface:true,closest:selector=>selector.includes('a,')?{}:null};assert.equal(f.surface.emit('wheel',{target:link,deltaX:0,deltaY:120}).prevented,undefined);f.controller.dispose();
});
test('intro is engagement-gated and wheel, press, pick cannot skip its timeline',async()=>{
 const f=fixture({intro:true,engaged:false});await flush();for(let i=0;i<100;i++)f.tick();close(f.controller.debug.state.elapsed,0);assert.equal(f.frames.size,0);
 const outside=f.surface.emit('wheel',{deltaX:0,deltaY:120});assert.equal(outside.prevented,undefined);f.controller.setEngaged(true);f.tick();const before=f.controller.debug.state.elapsed;
 const held=f.surface.emit('wheel',{deltaX:0,deltaY:120});assert.equal(held.prevented,true);close(f.controller.debug.state.elapsed,before);close(f.controller.debug.state.velocity,0);f.surface.emit('pointerdown');assert.equal(f.captures.size,0);f.controller.pick(6);assert.equal(f.controller.debug.state.pick,null);close(f.controller.debug.state.elapsed,before);
 for(let i=0;i<600;i++)f.tick();assert.equal(f.controller.debug.state.interactive,true);f.controller.dispose();
});
test('repeated engagement sync does not reset the 120Hz intro clock or restart it',async()=>{
 const a=fixture({intro:true}),b=fixture({intro:true});await flush();for(let i=0;i<120;i++){a.tick(1000/120);b.controller.setEngaged(true);b.tick(1000/120);}close(a.controller.debug.state.elapsed,b.controller.debug.state.elapsed);assert.ok(a.controller.debug.state.elapsed<1.1);a.controller.dispose();b.controller.dispose();
});
test('extended text tail delays only readiness, preserving source motion timing',async()=>{
 const s=createViscoseState(8,{introDuration:8.9});for(let i=0;i<510;i++)stepViscose(s,1200,700,1/60);assert.equal(s.interactive,false);close(s.frame.entryElapsed,8.5,1e-7);close(viscoseEntry(s.elapsed).shift,1);close(viscoseEntry(s.elapsed).spin,Math.PI*2);for(let i=0;i<40;i++)stepViscose(s,1200,700,1/60);assert.equal(s.interactive,true);close(s.elapsed,8.9);
});
test('formed seed waits for a real GPU frame then completes the unchanged intro',async()=>{
 const jobs=[],f=fixture({intro:true,imageJob:()=>{const job=deferred();jobs.push(job);return job.promise;}});await flush();for(let i=0;i<160;i++)f.tick();close(f.controller.debug.state.elapsed,1.45);assert.equal(f.controller.debug.state.interactive,false);assert.equal(f.frames.size,0);
 for(let i=0;i<8;i++){jobs[i].resolve({width:1800,height:1200});await flush();}f.tick();assert.equal(f.controller.mode,'webgl');assert.deepEqual(f.ready,['fallback','webgl']);close(f.controller.debug.state.elapsed,1.45);f.tick();assert.ok(f.controller.debug.state.elapsed>1.45);for(let i=0;i<600;i++)f.tick();assert.equal(f.controller.debug.state.interactive,true);f.controller.dispose();
});
test('loading timeout releases seed into DOM fallback without a permanent intro gate',async()=>{
 const job=deferred(),f=fixture({intro:true,runtimeJob:job});for(let i=0;i<160;i++)f.tick();close(f.controller.debug.state.elapsed,1.45);f.tick(6600);assert.equal(f.controller.mode,'fallback');assert.equal(f.errors.length,1);for(let i=0;i<600;i++)f.tick();assert.equal(f.controller.debug.state.interactive,true);job.resolve(f.runtime);await flush();assert.equal(f.renderers.length,0);f.controller.dispose();assert.equal(f.timers.size,0);
});
test('realistic wheel packets with parent visibility/bounds sync retain the same source physics',async()=>{
 const a=fixture(),b=fixture({consumeSync:true});await flush();a.settle();b.settle();let peakA=0,peakB=0;
 for(let i=0;i<60;i++){a.surface.emit('wheel',{deltaX:0,deltaY:25,deltaMode:0});b.surface.emit('wheel',{deltaX:0,deltaY:25,deltaMode:0});a.tick();b.tick();peakA=Math.max(peakA,a.controller.debug.state.spin);peakB=Math.max(peakB,b.controller.debug.state.spin);}
 close(peakA,peakB);close(a.controller.debug.state.velocity,b.controller.debug.state.velocity);a.settle();b.settle();assert.equal(a.controller.index,b.controller.index);assert.equal(b.consumed.length,60);a.controller.dispose();b.controller.dispose();
});
test('continuous1500px trackpad packets advance and reverse without snap fighting the gesture',async()=>{
 const f=fixture({consumeSync:true});await flush();f.settle();for(let i=0;i<60;i++){f.surface.emit('wheel',{deltaX:0,deltaY:25,deltaMode:0});f.tick();assert.equal(f.controller.debug.state.settling,false);}f.settle();assert.equal(f.controller.index,1);
 for(let i=0;i<60;i++){f.surface.emit('wheel',{deltaX:0,deltaY:-25,deltaMode:0});f.tick();}f.settle();assert.equal(f.controller.index,0);const exit=f.surface.emit('wheel',{deltaX:0,deltaY:-25});assert.equal(exit.prevented,undefined);assert.equal(f.exits.at(-1).direction,-1);f.controller.dispose();
});
test('wheel snap waits80ms of silence without changing gain damping or speed cap',()=>{
 const s=createViscoseState(8,{intro:false});viscoseImpulse(s,100,{bounded:true});close(s.velocity,.22);for(let i=0;i<4;i++){stepViscose(s,1200,700,.016);assert.equal(s.settling,false);}close(s.velocity,.22*Math.pow(.94,.064*60));stepViscose(s,1200,700,.02);assert.equal(s.settling,true);
 viscoseImpulse(s,1e6,{bounded:true});close(s.velocity,12);viscoseImpulse(s,-1e6,{bounded:true});close(s.velocity,-12);
});
test('finite wheel stops at0 and7, releases outward events, and still permits cyclic button picks',async()=>{
 const f=fixture();await flush();f.settle();let e=f.surface.emit('wheel',{deltaX:0,deltaY:-100});assert.equal(e.prevented,undefined);assert.equal(f.exits.at(-1).direction,-1);
 for(let i=0;i<8;i++){f.surface.emit('wheel',{deltaX:0,deltaY:1000});f.settle();}assert.equal(f.controller.index,7);const spin=f.controller.debug.state.spin;
 e=f.surface.emit('wheel',{deltaX:0,deltaY:100});assert.equal(e.prevented,undefined);assert.equal(f.exits.at(-1).direction,1);close(f.controller.debug.state.spin,spin);
 f.controller.next(1);f.settle();assert.equal(f.controller.index,0);f.controller.next(-1);f.settle();assert.equal(f.controller.index,7);f.controller.dispose();
});
test('touch ownership waits for horizontal intent; vertical pan and multi-touch release without trapping',async()=>{
 const f=fixture();await flush();f.settle();f.surface.emit('pointerdown',{pointerType:'touch'});assert.equal(f.captures.size,0);const vertical=f.surface.emit('pointermove',{pointerType:'touch',clientY:400});assert.equal(vertical.prevented,undefined);assert.equal(f.captures.size,0);
 f.surface.emit('pointerdown',{pointerType:'touch'});f.surface.emit('pointermove',{pointerType:'touch',clientX:650});assert.equal(f.captures.size,1);const owned=f.surface.emit('touchmove',{touches:[{clientX:650,clientY:350}],cancelable:true});assert.equal(owned.stopped,true);f.surface.emit('touchmove',{touches:[{},{}]});assert.equal(f.captures.size,0);f.surface.emit('pointerdown',{pointerType:'touch'});f.surface.emit('pointermove',{pointerType:'touch',clientX:650});assert.equal(f.captures.size,1);f.surface.emit('pointerdown',{pointerType:'touch',isPrimary:false,pointerId:2});assert.equal(f.captures.size,0);f.controller.dispose();
});
test('dispose clears all RAF, observers, captures and listeners; late jobs cannot resurrect resources',async()=>{
 const job=deferred(),f=fixture({runtimeJob:job});f.surface.emit('pointerdown');f.controller.dispose();job.resolve(f.runtime);await flush();assert.equal(f.renderers.length,0);assert.equal(f.frames.size,0);assert.equal(f.captures.size,0);for(const target of[f.surface,f.canvas,f.doc,f.win,f.media])assert.ok([...target.listeners.values()].every(list=>list.length===0));assert.ok(f.observers.every(o=>o.disconnected));assert.ok(f.resizes.every(o=>o.disconnected));
});
test('a cached GPU ready before intro birth never announces fallback over the working renderer',async()=>{
 const f=fixture({intro:true,engaged:false});await flush();f.tick();assert.equal(f.controller.mode,'webgl');assert.equal(f.ready.at(-1),'webgl');f.controller.setEngaged(true);for(let i=0;i<35;i++)f.tick();assert.ok(f.controller.debug.state.elapsed>.4);assert.equal(f.controller.mode,'webgl');assert.equal(f.ready.at(-1),'webgl');assert.ok(!f.ready.slice(f.ready.indexOf('webgl')+1).includes('fallback'));f.controller.dispose();
});
test('real GPU failure before birth remains fallback when the seed becomes visible',async()=>{
 const f=fixture({intro:true,engaged:false,compileFailure:true});await flush();f.tick();assert.equal(f.controller.mode,'fallback');assert.equal(f.errors.length,1);f.controller.setEngaged(true);for(let i=0;i<35;i++)f.tick();assert.equal(f.controller.mode,'fallback');assert.equal(f.ready.at(-1),'fallback');assert.ok(!f.ready.includes('webgl'));f.controller.dispose();
});
test('optional diagnostics report real runtime preparation phases and all eight image counts',async()=>{
 const f=fixture();assert.equal(f.diagnostics[0].phase,'idle');assert.equal(f.diagnostics[0].loaded,0);await flush();f.tick();const phases=f.diagnostics.map(d=>d.phase);for(const phase of ['runtime','context','images','ready'])assert.ok(phases.includes(phase));assert.ok(f.diagnostics.some(d=>d.loaded===3));const d=f.controller.debug.diagnostic;assert.equal(d.phase,'ready');assert.equal(d.loaded,8);assert.equal(d.total,8);assert.equal(d.runtimeRevision,'131');assert.equal(d.contextLost,false);assert.equal(d.error,null);assert.ok(d.elapsedMs>=0);assert.equal(d.attempt,1);assert.ok(!JSON.stringify(d).includes('stack'));f.controller.dispose();
});
test('diagnostics retain loaded count and exact failure reason, then distinguish context loss',async()=>{
 const jobs=[],f=fixture({imageJob:()=>{const job=deferred();jobs.push(job);return job.promise;}});await flush();jobs[0].resolve({width:1800,height:1200});await flush();f.tick(6600);let d=f.controller.debug.diagnostic;assert.equal(d.phase,'fallback');assert.equal(d.loaded,1);assert.equal(d.error.name,'Error');assert.match(d.error.message,/timed out/);assert.equal(d.contextLost,false);assert.ok(d.elapsedMs>=6500);f.controller.dispose();
 const ready=fixture();await flush();ready.tick();ready.canvas.emit('webglcontextlost');d=ready.controller.debug.diagnostic;assert.equal(d.phase,'fallback');assert.equal(d.loaded,8);assert.equal(d.contextLost,true);assert.equal(d.error.message,'WebGL context lost');ready.controller.dispose();
});
test('paused diagnostics preserve partial count and a retry starts a clean numbered attempt',async()=>{
 const jobs=[],f=fixture({imageJob:()=>{const job=deferred();jobs.push(job);return job.promise;}});await flush();jobs[0].resolve({width:1800,height:1200});await flush();f.tick(20);f.controller.setVisible(false);let d=f.controller.debug.diagnostic;assert.equal(d.phase,'paused');assert.equal(d.loaded,1);assert.equal(d.attempt,1);const elapsed=d.elapsedMs;f.tick(1000);assert.equal(f.controller.debug.diagnostic.elapsedMs,elapsed);f.controller.setVisible(true);await flush();d=f.controller.debug.diagnostic;assert.equal(d.attempt,2);assert.equal(d.loaded,0);assert.equal(d.phase,'images');f.controller.dispose();
});
test('stale loss events without an owned GPU cannot turn cancellation into permanent fallback',async()=>{
 const f=fixture({imageJob:()=>new Promise(()=>{})});await flush();f.controller.setVisible(false);let d=f.controller.debug.diagnostic;assert.equal(d.lastDisposeReason,'offscreen-cancel');assert.equal(d.lastDisposeGeneration,d.generation);f.canvas.emit('webglcontextlost');d=f.controller.debug.diagnostic;assert.equal(d.contextLost,false);assert.equal(d.error,null);assert.equal(f.errors.length,0);f.controller.setVisible(true);await flush();assert.equal(f.stats().imports,2);assert.equal(f.controller.debug.gpuLoading,true);f.controller.dispose();
});
test('offscreen cancellation releases GPU resources without losing the reusable canvas context',async()=>{
 let calls=0;const f=fixture({forceLossEvent:true,imageJob:(src,signal)=>++calls<=2?new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true})):Promise.resolve({width:1800,height:1200})});await flush();const old=f.renderers[0];assert.ok(old);f.controller.setVisible(false);await flush();assert.equal(old.disposed,true);assert.equal(!!old.lost,false,'temporary cancellation must not call WEBGL_lose_context');assert.ok(f.textures.slice(0,2).every(t=>t.disposed&&t.image===null));assert.equal(f.errors.length,0);f.controller.setVisible(true);await flush();f.tick();assert.equal(f.stats().imports,2);assert.equal(f.controller.mode,'webgl');assert.equal(f.errors.length,0);const current=f.renderers.at(-1);f.controller.dispose();await flush();assert.equal(current.disposed,true);assert.equal(current.lost,true,'final disposal still releases the context');assert.equal(f.errors.length,0);
});
test('reduced-motion cancellation can resume GPU without poisoning the shared canvas',async()=>{
 let calls=0;const f=fixture({forceLossEvent:true,imageJob:(src,signal)=>++calls<=2?new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true})):Promise.resolve({width:1800,height:1200})});await flush();f.media.matches=true;f.media.emit('change');await flush();assert.equal(f.renderers[0].disposed,true);assert.equal(!!f.renderers[0].lost,false);f.media.matches=false;f.media.emit('change');await flush();f.tick();assert.equal(f.controller.mode,'webgl');assert.equal(f.errors.length,0);f.controller.dispose();
});
test('genuine owned-context loss falls back once even if forced cleanup queues another loss event',async()=>{
 const f=fixture({forceLossEvent:true});await flush();f.tick();assert.equal(f.controller.mode,'webgl');f.canvas.emit('webglcontextlost');await flush();assert.equal(f.controller.mode,'fallback');assert.equal(f.errors.length,1);assert.equal(f.controller.debug.diagnostic.contextLost,true);assert.equal(f.controller.debug.diagnostic.contextLoss.generation,1);assert.equal(f.renderers[0].lost,true);f.controller.setVisible(false);f.controller.setVisible(true);await flush();assert.equal(f.stats().imports,1);f.controller.dispose();
});
test('a throwing diagnostic observer cannot alter rendering or fail-open behavior',async()=>{
 const f=fixture({diagnosticCallback:()=>{throw Error('diagnostic panel failure');}});await flush();f.tick();assert.equal(f.controller.mode,'webgl');assert.equal(f.errors.length,0);f.controller.dispose();
});
test('authored shader specializes eight uniform slots, derivative AA, image fusion and sagging strands',()=>{assert.equal(VISCOSE_MAX_CARDS,8);for(const feature of ['roundedRect','mergeFields','strand','uLinkA','uAtlas','fwidth(field)','uPointer','uWake'])assert.ok(viscoseFragment.includes(feature));assert.ok(!viscoseFragment.includes('range*range)continue'),'long strands retain nearest-photo UVs');assert.ok(!viscoseFragment.includes('sdBridge'));assert.ok(!viscoseFragment.includes('snoise'));});
