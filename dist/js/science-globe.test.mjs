import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GLOBE_VIEW,projectPoint,clipSegment,shouldAnimate,advanceLongitude,advanceGlobeMotion,MAX_LATITUDE,initScienceGlobe} from './science-globe.js';

test('orthographic center and antipode belong to opposite hemispheres',()=>{
 const center=projectPoint(GLOBE_VIEW.longitude,GLOBE_VIEW.latitude);
 assert.ok(Math.abs(center.x)<1e-12&&Math.abs(center.y)<1e-12);
 assert.ok(center.z>.999999&&center.visible);
 const back=projectPoint(GLOBE_VIEW.longitude+180,-GLOBE_VIEW.latitude);
 assert.ok(back.z<-.999999&&!back.visible);
});
test('longitude rotation is spherical, not rotation of a flat disc',()=>{
 const first=projectPoint(-50,-12);
 const quarter=projectPoint(-50,-12,{...GLOBE_VIEW,longitude:GLOBE_VIEW.longitude+90});
 assert.notEqual(Math.round(Math.hypot(first.x,first.y)*1000),Math.round(Math.hypot(quarter.x,quarter.y)*1000));
 const half=projectPoint(-50,-12,{...GLOBE_VIEW,longitude:GLOBE_VIEW.longitude+180});
 assert.equal(first.visible,true);assert.equal(half.visible,false);
});
test('horizon clipping never connects hidden hemisphere points',()=>{
 assert.equal(clipSegment({x:0,y:0,z:-1},{x:.2,y:.2,z:-.7}),null);
 const clipped=clipSegment({x:0,y:.2,z:.9},{x:.8,y:.3,z:-.5});
 assert.equal(clipped[1].z,0);assert.ok(Math.abs(Math.hypot(clipped[1].x,clipped[1].y)-1)<1e-12);
});
test('rotation resumes without a hidden-tab jump and wraps consistently',()=>{
 assert.ok(Math.abs(advanceLongitude(0,10000)-.2)<1e-12);
 assert.ok(Math.abs(advanceLongitude(179.99,100)+179.81)<1e-9);
 assert.equal(advanceLongitude(23,-100),23);
});
test('motion gates cover reduced motion, offscreen, hidden, pause and disposal',()=>{
 assert.equal(shouldAnimate(),true);
 for(const state of [{visible:false},{documentHidden:true},{reducedMotion:true},{userPaused:true},{disposed:true}])assert.equal(shouldAnimate(state),false);
});
function browserMock({available=true,reduced=true,onDraw=()=>{}}={}){
 const listeners=new Map(),frames=new Map();let id=0;
 const context={beginPath(){},arc(){},fill(){},stroke(){},save(){},clip(){},restore(){},moveTo(){},lineTo(){},closePath(){},setTransform(){},clearRect(){onDraw();}};
 const canvas={style:{},clientWidth:400,clientHeight:400,setAttribute(){},getContext(){return available?context:null;}};
 const fallback={style:{},getAttribute(){return 'fallback.svg';}};
 const toggle={disabled:false,attrs:{},setAttribute(name,value){this.attrs[name]=value;},querySelector(){return null;},addEventListener(name,fn){listeners.set(name,fn);},removeEventListener(name){listeners.delete(name);}};
 const host={dataset:{},matches(){return true;},querySelector(selector){return selector.includes('canvas')?canvas:selector.includes('fallback')?fallback:toggle;},getBoundingClientRect(){return {width:400,height:400};}};
 const win={devicePixelRatio:4,matchMedia(){return {matches:reduced,addEventListener(){},removeEventListener(){}};},requestAnimationFrame(fn){frames.set(++id,fn);return id;},cancelAnimationFrame(i){frames.delete(i);},addEventListener(){},removeEventListener(){}};
 globalThis.window=win;globalThis.document={hidden:false,addEventListener(){},removeEventListener(){}};
 return {canvas,fallback,toggle,host,frames,listeners,restore(){delete globalThis.window;delete globalThis.document;}};
}
test('fallback stays shown until complete first draw; DPR is capped and reduced motion still',async()=>{
 let environment;
 environment=browserMock({onDraw(){assert.equal(environment.canvas.style.opacity,'0');assert.equal(environment.fallback.style.opacity,'1');}});
 try{
  const controller=await initScienceGlobe(environment.host,{data:{dots:[],borders:[],brazil:[]}});
  assert.equal(environment.host.dataset.globeState,'ready');
  assert.equal(environment.canvas.width,700);assert.equal(environment.canvas.height,700);
  assert.equal(environment.canvas.style.opacity,'1');assert.equal(environment.fallback.style.opacity,'0');
  assert.equal(environment.frames.size,0);assert.equal(environment.toggle.disabled,true);
  controller.dispose();controller.dispose();assert.equal(controller.state,'disposed');
 }finally{environment.restore();}
});
test('missing Canvas2D fails open to the static globe',async()=>{
 const environment=browserMock({available:false});
 try{
  const controller=await initScienceGlobe(environment.host);
  assert.equal(environment.host.dataset.globeState,'fallback');assert.equal(environment.fallback.style.opacity,'1');
  assert.equal(environment.canvas.style.visibility,'hidden');assert.equal(controller.state,'fallback');controller.dispose();
 }finally{environment.restore();}
});
test('toggle and explicit visibility own only this globe animation',async()=>{
 const environment=browserMock({reduced:false});
 try{
  const controller=await initScienceGlobe(environment.host,{data:{dots:[],borders:[],brazil:[]}});
  assert.equal(environment.frames.size,1);
  environment.listeners.get('click')();assert.equal(environment.frames.size,0);assert.equal(environment.toggle.attrs['aria-pressed'],'true');
  environment.listeners.get('click')();assert.equal(environment.frames.size,1);
  controller.setVisible(false);assert.equal(environment.frames.size,0);
  controller.setVisible(true);assert.equal(environment.frames.size,1);
  controller.dispose();assert.equal(environment.frames.size,0);
 }finally{environment.restore();}
});
test('local assets contain Brazil geography and text-free vector fallback',()=>{
 const data=JSON.parse(fs.readFileSync(new URL('../assets/science-globe/geography.json',import.meta.url)));
 assert.ok(data.dots.length>3000);assert.ok(data.dots.some(p=>p[2]===1));assert.ok(data.borders.length>100);
 const svg=fs.readFileSync(new URL('../assets/science-globe/fallback.svg',import.meta.url),'utf8');
 assert.match(svg,/<svg/);assert.doesNotMatch(svg,/<text|<image|<script|href=/i);
 assert.match(svg,/#da9bb0/);assert.ok(svg.includes('viewBox="0 0 1000 1000"'));
});

test('pageshow or external visibility cannot restart an offscreen globe',async()=>{
 const environment=browserMock({reduced:false});let intersection;
 window.IntersectionObserver=class{constructor(callback){intersection=callback;}observe(){}disconnect(){}};
 try{
  const controller=await initScienceGlobe(environment.host,{data:{dots:[],borders:[],brazil:[]}});
  assert.equal(environment.toggle.hidden,false);
  intersection([{isIntersecting:false}]);assert.equal(environment.frames.size,0);
  controller.setVisible(false);controller.setVisible(true);assert.equal(environment.frames.size,0);
  intersection([{isIntersecting:true}]);assert.equal(environment.frames.size,1);
  controller.dispose();
 }finally{environment.restore();}
});

/** Event-target mocks exercise the listeners installed by initScienceGlobe itself. */
function interactiveBrowser({reduced=false}={}){
 class Target {
  constructor(){this.listeners=new Map();this.attrs={};this.style={};this.dataset={};}
  addEventListener(type,fn,options){const list=this.listeners.get(type)||[];list.push({fn,options});this.listeners.set(type,list);}
  removeEventListener(type,fn){this.listeners.set(type,(this.listeners.get(type)||[]).filter(item=>item.fn!==fn));}
  setAttribute(name,value){this.attrs[name]=String(value);}
  getAttribute(name){return this.attrs[name]??null;}
  removeAttribute(name){delete this.attrs[name];}
  emit(type,extra={}){
   const event={target:this,cancelable:true,defaultPrevented:false,propagationStopped:false,pointerId:1,pointerType:'mouse',button:0,isPrimary:true,clientX:200,clientY:200,timeStamp:100,
    preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.propagationStopped=true;},...extra};
   for(const {fn} of [...(this.listeners.get(type)||[])])fn(event);return event;
  }
 }
 let id=0,intersection,resize,draws=0;const frames=new Map();
 const ctx={beginPath(){},arc(){},fill(){},stroke(){},save(){},clip(){},restore(){},moveTo(){},lineTo(){},closePath(){},setTransform(){},clearRect(){draws++;}};
 const canvas=new Target();canvas.clientWidth=400;canvas.clientHeight=400;canvas.getContext=()=>ctx;
 const fallback=new Target();fallback.setAttribute('src','fallback.svg');
 const toggle=new Target();toggle.querySelector=()=>null;toggle.closest=()=>toggle;
 const host=new Target();host.tabIndex=-1;host.matches=()=>true;host.getBoundingClientRect=()=>({width:400,height:400});host.focus=()=>{doc.activeElement=host;};
 host.querySelector=s=>s.includes('canvas')?canvas:s.includes('fallback')?fallback:toggle;
 const captures=new Set();host.setPointerCapture=id=>captures.add(id);host.hasPointerCapture=id=>captures.has(id);host.releasePointerCapture=id=>{captures.delete(id);host.emit('lostpointercapture',{pointerId:id});};
 const motion=new Target();motion.matches=reduced;
 const win=new Target();win.devicePixelRatio=1;win.matchMedia=()=>motion;win.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};win.cancelAnimationFrame=id=>frames.delete(id);
 win.IntersectionObserver=class{constructor(fn){intersection=fn;}observe(){}disconnect(){intersection=null;}};
 win.ResizeObserver=class{constructor(fn){resize=fn;}observe(){}disconnect(){resize=null;}};
 const doc=new Target();doc.hidden=false;doc.activeElement=host;
 globalThis.window=win;globalThis.document=doc;
 return {host,canvas,fallback,toggle,win,doc,motion,frames,captures,get draws(){return draws;},
  frame(now){const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now));},
  intersect(value){intersection?.([{isIntersecting:value}]);},resize(){resize?.();},
  restore(){delete globalThis.window;delete globalThis.document;}};
}
async function readyInteractive(options){const env=interactiveBrowser(options);const control=await initScienceGlobe(env.host,{data:{dots:[],borders:[],brazil:[]}});return {...env,control};}

test('exact inertial integration is independent of refresh rate and settles to 2 degrees/sec',()=>{
 const start={longitude:-64,latitude:10,velocityX:-80,velocityY:28};
 function advance(steps,delta){let state=start;for(let i=0;i<steps;i++)state=advanceGlobeMotion(state,delta);return state;}
 const a=advance(60,1000/60),b=advance(120,1000/120),c=advance(10,100);
 for(const key of Object.keys(a)){assert.ok(Math.abs(a[key]-b[key])<1e-9,key);assert.ok(Math.abs(a[key]-c[key])<1e-9,key);}
 const settled=advance(600,1000/60);assert.ok(Math.abs(settled.velocityX-2)<1e-10);assert.ok(Math.abs(settled.velocityY)<1e-10);
 const clamped=advanceGlobeMotion({...start,latitude:59.9,velocityY:100},100);assert.equal(clamped.latitude,MAX_LATITUDE);assert.equal(clamped.velocityY,0);
});

test('mouse drag moves longitude and latitude, captures pointer, blocks hero events, then releases smoothly',async()=>{
 const env=await readyInteractive();const {host,control}=env;
 try{
  const before=control.view;const down=host.emit('pointerdown');assert.equal(down.defaultPrevented,true);assert.equal(env.captures.has(1),true);assert.equal(host.dataset.globeDragging,'true');assert.equal(env.frames.size,0);
  const move=host.emit('pointermove',{clientX:240,clientY:220,timeStamp:116});assert.equal(move.propagationStopped,true);assert.equal(move.defaultPrevented,true);
  assert.ok(control.view.longitude<before.longitude);assert.ok(control.view.latitude>before.latitude);
  host.emit('pointerup',{clientX:240,clientY:220,timeStamp:124});assert.equal(host.dataset.globeDragging,'false');assert.equal(env.captures.size,0);assert.ok(env.frames.size<=2);assert.ok(control.interaction.velocityX<0);
  const release=control.view.longitude;env.frame(1000000);assert.equal(control.view.longitude,release,'first RAF must not compare pointer timestamp to RAF timestamp');
  env.frame(1000016);assert.ok(control.view.longitude<release,'release momentum continues in drag direction');
  const beforeGap=control.view.longitude;env.frame(2000016);assert.ok(Math.abs(control.view.longitude-beforeGap)<18,'long frame gap is capped');
 }finally{control.dispose();env.restore();}
});

test('touch horizontal intent owns only horizontal motion and prevents Locomotive touchmove',async()=>{
 const env=await readyInteractive();const {host,control}=env;
 try{
  const initial=control.view;const down=host.emit('pointerdown',{pointerType:'touch'});assert.equal(down.defaultPrevented,false);assert.equal(env.captures.size,0);
  const undecided=host.emit('touchmove',{touches:[{clientX:203,clientY:202}]});assert.equal(undecided.defaultPrevented,false);assert.equal(undecided.propagationStopped,false);
  const touch=host.emit('touchmove',{touches:[{clientX:230,clientY:204}]});assert.equal(touch.defaultPrevented,true);assert.equal(touch.propagationStopped,true);assert.equal(env.captures.has(1),true);
  const move=host.emit('pointermove',{pointerType:'touch',clientX:230,clientY:220,timeStamp:116});assert.equal(move.propagationStopped,true);assert.notEqual(control.view.longitude,initial.longitude);assert.equal(control.view.latitude,initial.latitude,'touch drag is horizontal-only');
  assert.equal(host.listeners.get('touchmove')[0].options.passive,false);
  host.emit('pointerup',{pointerType:'touch',timeStamp:120});assert.equal(control.interaction.dragging,false);
 }finally{control.dispose();env.restore();}
});

test('vertical touch intent and ambiguous small motion do not interfere with document scrolling',async()=>{
 const env=await readyInteractive();const {host,control}=env;
 try{
  const before=control.view;host.emit('pointerdown',{pointerType:'touch'});
  const move=host.emit('pointermove',{pointerType:'touch',clientX:204,clientY:240,timeStamp:116});assert.equal(move.defaultPrevented,false);assert.equal(move.propagationStopped,false);
  const touch=host.emit('touchmove',{touches:[{clientX:204,clientY:240}]});assert.equal(touch.defaultPrevented,false);assert.equal(touch.propagationStopped,false);assert.equal(env.captures.size,0);
  host.emit('pointermove',{pointerType:'touch',clientX:350,clientY:250,timeStamp:132});assert.deepEqual(control.view,before,'vertical ownership cannot later be stolen');
  host.emit('pointerup',{pointerType:'touch'});assert.equal(env.frames.size,1);
 }finally{control.dispose();env.restore();}
});

test('paused and reduced motion permit direct manual dragging but never inertia or autorotation',async()=>{
 for(const reduced of [false,true]){
  const env=await readyInteractive({reduced});const {host,control}=env;
  try{
   if(!reduced)env.toggle.emit('click');assert.equal(env.frames.size,0);
   const before=control.view.longitude;host.emit('pointerdown');host.emit('pointermove',{clientX:260,timeStamp:116});assert.notEqual(control.view.longitude,before);host.emit('pointerup',{timeStamp:120});
   env.frame(1000);assert.equal(env.frames.size,0);assert.equal(control.interaction.velocityX,0);assert.equal(control.interaction.velocityY,0);
   host.emit('keydown',{key:'ArrowRight'});assert.equal(env.frames.size,0);
   assert.equal(env.toggle.disabled,reduced);assert.equal(env.toggle.attrs['aria-pressed'],'true');
  }finally{control.dispose();env.restore();}
 }
});

test('pause button and descendants, non-primary and non-left pointers never start drag',async()=>{
 const env=await readyInteractive();const {host,control}=env;
 try{
  const child={closest:()=>env.toggle};
  for(const extra of [{target:env.toggle},{target:child},{button:2},{isPrimary:false}]){const event=host.emit('pointerdown',extra);assert.equal(control.interaction.dragging,false);assert.equal(event.defaultPrevented,false);}
  const keyboard=host.emit('keydown',{target:env.toggle,key:'ArrowRight'});assert.equal(keyboard.defaultPrevented,false);
  env.toggle.emit('click');assert.equal(control.interaction.userPaused,true);assert.equal(env.frames.size,0);
 }finally{control.dispose();env.restore();}
});

test('keyboard controls are semantic, scoped, clamped and restored on disposal',async()=>{
 const env=await readyInteractive({reduced:true});const {host,control}=env;
 try{
  assert.equal(host.tabIndex,0);assert.equal(host.attrs.role,'group');assert.equal(host.attrs['aria-label'],'Globo interativo');assert.equal(host.attrs['aria-describedby'],'science-globe-hint');assert.equal(host.style.touchAction,'pan-y pinch-zoom');
  const before=control.view.longitude;const event=host.emit('keydown',{key:'ArrowRight'});assert.equal(control.view.longitude,before-4);assert.equal(event.defaultPrevented,true);assert.equal(event.propagationStopped,true);
  for(let i=0;i<20;i++)host.emit('keydown',{key:'ArrowDown',shiftKey:true});assert.equal(control.view.latitude,60);
  for(let i=0;i<20;i++)host.emit('keydown',{key:'ArrowUp',shiftKey:true});assert.equal(control.view.latitude,-60);
  const ignored=host.emit('keydown',{key:'ArrowLeft',ctrlKey:true});assert.equal(ignored.defaultPrevented,false);
  control.dispose();assert.equal(host.tabIndex,-1);assert.equal(host.attrs.role,undefined);assert.equal(host.attrs['aria-describedby'],undefined);assert.equal(host.style.touchAction,'');
 }finally{control.dispose();env.restore();}
});

test('cancel, capture loss, resize, hidden, offscreen and dispose terminate active gesture safely',async()=>{
 const env=await readyInteractive();const {host,control}=env;
 try{
  const start=()=>{host.emit('pointerdown');host.emit('pointermove',{clientX:230,timeStamp:116});assert.equal(control.interaction.dragging,true);};
  for(const action of [()=>host.emit('pointercancel'),()=>host.emit('lostpointercapture'),()=>env.resize()]){start();action();assert.equal(control.interaction.dragging,false);assert.equal(env.captures.size,0);assert.equal(control.interaction.velocityY,0);}
  start();env.doc.hidden=true;env.doc.emit('visibilitychange');env.frame(1000);assert.equal(control.interaction.dragging,false);assert.equal(env.frames.size,0);env.doc.hidden=false;env.doc.emit('visibilitychange');assert.equal(env.frames.size,1);
  const current=control.view.longitude;env.frame(9999999);assert.equal(control.view.longitude,current,'visibility resume has zero initial delta');
  start();env.intersect(false);env.frame(1000);assert.equal(control.interaction.dragging,false);assert.equal(env.frames.size,0);control.setVisible(false);control.setVisible(true);assert.equal(env.frames.size,0);env.intersect(true);
  start();control.dispose();assert.equal(env.frames.size,0);assert.equal(env.captures.size,0);assert.equal(host.dataset.globeDragging,'false');assert.ok([...host.listeners.values()].every(list=>list.length===0));
  const disposedView=control.view;host.emit('pointermove',{clientX:350,timeStamp:130});assert.deepEqual(control.view,disposedView);
 }finally{control.dispose();env.restore();}
});

test('multitouch and reduced-motion change cancel current drag without blocking a pinch',async()=>{
 const env=await readyInteractive();const {host,control}=env;
 try{
  host.emit('pointerdown',{pointerType:'touch'});host.emit('pointermove',{pointerType:'touch',clientX:250,timeStamp:116});
  const pinch=host.emit('touchmove',{touches:[{clientX:250,clientY:200},{clientX:300,clientY:200}]});assert.equal(pinch.defaultPrevented,false);assert.equal(control.interaction.dragging,false);
  host.emit('pointerdown');host.emit('pointermove',{clientX:250,timeStamp:116});env.motion.matches=true;env.motion.emit('change');env.frame(1000);assert.equal(control.interaction.dragging,false);assert.equal(env.frames.size,0);assert.equal(control.interaction.velocityX,0);
 }finally{control.dispose();env.restore();}
});

test('high-rate manual pointer moves coalesce into one drawing per animation frame',async()=>{
 const env=interactiveBrowser();const control=await initScienceGlobe(env.host,{data:{dots:[],borders:[],brazil:[]}});
 try{
  const baseline=env.draws;env.host.emit('pointerdown');
  for(let i=1;i<=12;i++)env.host.emit('pointermove',{clientX:200+i*2,timeStamp:100+i*2});
  assert.equal(env.draws,baseline);assert.equal(env.frames.size,1);assert.notEqual(control.view.longitude,GLOBE_VIEW.longitude);
  env.frame(200);assert.equal(env.draws,baseline+1);assert.equal(env.frames.size,0);
  env.host.emit('pointerup',{timeStamp:125});env.frame(216);const initial=env.draws;env.frame(232);assert.equal(env.draws,initial+1,'inertia draws at display cadence, not only 30 Hz');
 }finally{control.dispose();env.restore();}
});
