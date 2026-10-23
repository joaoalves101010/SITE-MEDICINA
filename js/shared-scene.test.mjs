import test from 'node:test';
import assert from 'node:assert/strict';
import {sharedSceneOffset,createSharedScene} from './shared-scene.js';

function environment({top=0,height=1600,artworkHeight=800,heroHeight=800,reduced=false}={}){
 const handlers=new Map(),observers=[];
 const target=prefix=>({addEventListener(type,fn){handlers.set(`${prefix}:${type}`,fn);},removeEventListener(type){handlers.delete(`${prefix}:${type}`);}});
 const properties=new Map();
 const artwork={clientHeight:artworkHeight,style:{setProperty(name,value){properties.set(name,value);}}};
 const hero={offsetHeight:heroHeight};
 const motion={...target('motion'),matches:reduced};
 const world={offsetHeight:height,top,querySelector(selector){return selector==='#home'?hero:artwork;},getBoundingClientRect(){return {top:this.top,bottom:this.top+this.offsetHeight,height:this.offsetHeight,left:0,right:1200};}};
 globalThis.window={...target('window'),innerHeight:800,matchMedia(){return motion;},ResizeObserver:class{constructor(callback){this.callback=callback;this.observed=[];this.disconnected=false;observers.push(this);}observe(node){this.observed.push(node);}disconnect(){this.disconnected=true;}}};
 globalThis.document={...target('document'),hidden:false};
 return {world,artwork,hero,motion,properties,handlers,observers,fire(type){handlers.get(type)?.();},restore(){delete globalThis.window;delete globalThis.document;}};
}
function renderer(){return {visible:[],disposed:0,setVisible(value){this.visible.push(value);},dispose(){this.disposed++;}};}

test('offset clamps before, across, and after the two-fold region',()=>{
 assert.equal(sharedSceneOffset(300,1600,800),0);
 assert.equal(sharedSceneOffset(0,1600,800),0);
 assert.equal(sharedSceneOffset(-400,1600,800),400);
 assert.equal(sharedSceneOffset(-800,1600,800),800);
 assert.equal(sharedSceneOffset(-1200,1600,800),800);
 assert.equal(sharedSceneOffset(-10,400,800),0);
});
test('same rendered geometry gives identical native and virtual-scroll offsets',()=>{
 const env=environment();
 try{
  const shared=createSharedScene(env.world);
  // Native scroll: world.top=-500; transformed main: world.top=-500.
  env.world.top=-500;shared.update();const native=env.artwork.style.transform;
  shared.update();assert.equal(env.artwork.style.transform,native);assert.equal(native,'translate3d(0,500px,0)');
  env.world.top=-801;shared.update();assert.equal(env.artwork.style.transform,'translate3d(0,800px,0)');
  shared.dispose();
 }finally{env.restore();}
});
test('one existing controller binds idempotently without creating another renderer',()=>{
 const env=environment();const hero=renderer();
 try{
  const shared=createSharedScene(env.world);
  assert.equal(shared.bindRenderer(hero),true);assert.equal(shared.bindRenderer(hero),true);
  assert.equal(shared.bindRenderer(renderer()),false);assert.equal(hero.visible.at(-1),true);
  shared.dispose();shared.dispose();assert.equal(hero.disposed,1);
 }finally{env.restore();}
});
test('resize and ResizeObserver recompute both geometry limits',()=>{
 const env=environment({top:-900});
 try{
  const shared=createSharedScene(env.world);assert.equal(env.artwork.style.transform,'translate3d(0,800px,0)');
  env.world.offsetHeight=2000;env.artwork.clientHeight=600;env.fire('window:resize');assert.equal(env.artwork.style.transform,'translate3d(0,900px,0)');
  env.world.top=-1900;env.observers[0].callback();assert.equal(env.artwork.style.transform,'translate3d(0,1400px,0)');
  assert.deepEqual(env.observers[0].observed,[env.world,env.artwork]);shared.dispose();
 }finally{env.restore();}
});
test('region, document, external and page visibility all gate internal IO requests',()=>{
 const env=environment();const hero=renderer();
 try{
  const shared=createSharedScene(env.world);shared.bindRenderer(hero);
  env.world.top=-1700;shared.update();hero.setVisible(true);assert.equal(hero.visible.at(-1),false);
  env.world.top=-700;shared.update();assert.equal(hero.visible.at(-1),true);
  document.hidden=true;env.fire('document:visibilitychange');assert.equal(hero.visible.at(-1),false);
  document.hidden=false;env.fire('document:visibilitychange');assert.equal(hero.visible.at(-1),true);
  shared.setVisible(false);hero.setVisible(true);assert.equal(hero.visible.at(-1),false);
  shared.setVisible(true);assert.equal(hero.visible.at(-1),true);
  env.fire('window:pagehide');hero.setVisible(true);assert.equal(hero.visible.at(-1),false);
  env.fire('window:pageshow');assert.equal(hero.visible.at(-1),true);
  hero.setVisible(false);shared.update();assert.equal(hero.visible.at(-1),false);
  shared.dispose();assert.equal(env.handlers.size,0);assert.equal(env.observers[0].disconnected,true);
 }finally{env.restore();}
});
test('late renderer binding after disposal is cleaned up, not revived',()=>{
 const env=environment();const hero=renderer();
 try{
  const shared=createSharedScene(env.world);shared.dispose();assert.equal(shared.bindRenderer(hero),false);assert.equal(hero.disposed,1);
  const transform=env.artwork.style.transform;env.world.top=-700;shared.update();assert.equal(env.artwork.style.transform,transform);
 }finally{env.restore();}
});
test('missing region has safe lifecycle methods and needs no browser globals',()=>{
 const shared=createSharedScene(null);assert.equal(shared.getInitialScrollState(),null);shared.update();shared.setVisible(false);shared.dispose();shared.dispose();
});

test('missing shared region never mutates or disposes a non-home hero',()=>{
 const env=environment();const hero=renderer();const setter=hero.setVisible;
 try{
  const shared=createSharedScene(null);
  assert.equal(shared.bindRenderer(hero),false);assert.equal(hero.setVisible,setter);assert.equal(hero.visible.length,0);
  shared.setVisible(false);shared.update();shared.dispose();
  assert.equal(hero.disposed,0);assert.equal(hero.visible.length,0);assert.equal(hero.setVisible,setter);
  assert.equal(shared.bindRenderer(hero),false);assert.equal(hero.disposed,0);
 }finally{env.restore();}
});

test('one renderer receives continuous scroll; CSS fallback mirrors travel and first-fold lens exit',()=>{
 const env=environment({height:3200});const hero=renderer(),offsets=[];
 hero.setScrollOffset=(...args)=>offsets.push(args);
 try{
  const shared=createSharedScene(env.world);shared.bindRenderer(hero);
  assert.deepEqual(shared.getInitialScrollState(),{offsetPx:0,heroHeightPx:800});
  assert.deepEqual(offsets.at(-1),[0,800]);
  assert.equal(env.properties.get('--shared-field-travel'),'0.000%');
  assert.equal(env.properties.get('--shared-lens-opacity'),'1.00000');
  env.world.top=-400;shared.update();
  assert.deepEqual(offsets.at(-1),[400,800]);
  assert.equal(env.properties.get('--shared-field-travel'),'9.000%');
  assert.equal(env.properties.get('--shared-lens-y'),'-360.000px');
  assert.equal(env.properties.get('--shared-lens-opacity'),'0.50000');
  env.world.top=-800;shared.update();
  assert.deepEqual(shared.getInitialScrollState(),{offsetPx:800,heroHeightPx:800});
  assert.equal(env.properties.get('--shared-lens-opacity'),'0.00000');
  env.world.top=-1600;shared.update();
  assert.equal(env.properties.get('--shared-field-travel'),'36.000%');
  assert.equal(env.properties.get('--shared-lens-opacity'),'0.00000');
  env.world.top=0;shared.update();
  assert.equal(env.properties.get('--shared-field-travel'),'0.000%');
  assert.equal(env.properties.get('--shared-lens-opacity'),'1.00000');
  assert.equal(hero.disposed,0);shared.dispose();
 }finally{env.restore();}
});

test('reduced motion suppresses field/lens translation but keeps the second fold lens-free',()=>{
 const env=environment({height:3200,top:-800,reduced:true});
 try{
  const shared=createSharedScene(env.world);
  assert.equal(env.properties.get('--shared-field-travel'),'0.000%');
  assert.equal(env.properties.get('--shared-lens-y'),'0.000px');
  assert.equal(env.properties.get('--shared-lens-opacity'),'0.00000');
  env.motion.matches=false;env.fire('motion:change');
  assert.equal(env.properties.get('--shared-field-travel'),'18.000%');
  env.hero.offsetHeight=1000;env.fire('window:resize');
  assert.equal(env.properties.get('--shared-field-travel'),'14.400%');
  assert.equal(env.properties.get('--shared-lens-opacity'),'0.10400');
  shared.dispose();assert.equal(env.handlers.size,0);
 }finally{env.restore();}
});
