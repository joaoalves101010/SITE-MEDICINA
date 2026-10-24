import test from 'node:test';
import assert from 'node:assert/strict';
import * as Three from './vendor/three-scene.js';
import {viscoseResourceQuality,viscoseGeometry,VISCOSE,createViscoseEngine} from './viscose-engine.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} ≈ ${b}`);

test('iPhone 14 DPR3 uses a surface-bounded retina buffer and a 768px focal photo cell',()=>{
 const full=viscoseResourceQuality({width:390,height:844,devicePixelRatio:3,mobile:true});
 close(full.pixelRatio,Math.sqrt(1500000/(390*844)));assert.equal(full.cellWidth,768);assert.equal(full.cellHeight,512);
 assert.equal(full.atlasBytes,13.5*1024*1024);assert.ok(full.bufferPixels<=1500000);
 const stage=viscoseResourceQuality({width:390,height:591,devicePixelRatio:3,mobile:true});
 assert.ok(stage.pixelRatio>2.5&&stage.pixelRatio<3);assert.equal(stage.cellWidth,768);assert.ok(stage.bufferPixels<=1500000);
 const geometry=viscoseGeometry(390,591),focalWidth=VISCOSE.baseWidth*geometry.plane*geometry.scale*geometry.fit;
 close(focalWidth,237.375);assert.ok(stage.cellWidth>=focalWidth*stage.pixelRatio*1.2);
});

test('mobile quality stays within 1.5M drawing pixels, 24MiB base atlas and texture limits',()=>{
 for(const [width,height]of[[320,420],[390,844],[430,932],[844,390],[1024,780],[2048,1536],[3840,2160]]){
  for(const devicePixelRatio of [1,2,3,4])for(const maxTextureSize of [256,1024,2048,4096]){
   const q=viscoseResourceQuality({width,height,devicePixelRatio,mobile:true,maxTextureSize});
   assert.ok(q.pixelRatio<=devicePixelRatio&&q.pixelRatio<=3);assert.ok(q.bufferPixels<=1500000);
   assert.ok(q.atlasBytes<=24*1024*1024);assert.ok(q.atlasWidth<=maxTextureSize);assert.ok(q.atlasHeight<=maxTextureSize);
  }
 }
 const dense=viscoseResourceQuality({width:320,height:420,devicePixelRatio:3,mobile:true});
 assert.equal(dense.pixelRatio,3);assert.equal(dense.cellWidth,1024);assert.equal(dense.cellHeight,682);assert.ok(dense.atlasBytes<24*1024*1024);
});

test('desktop quality is exactly the existing 512×341 atlas and 1.5 DPR cap',()=>{
 for(const [width,height]of[[390,844],[1512,870],[1920,1080]])for(const dpr of [1,1.25,2,3]){
  const q=viscoseResourceQuality({width,height,devicePixelRatio:dpr,mobile:false});
  assert.equal(q.pixelRatio,Math.min(1.5,dpr));assert.equal(q.cellWidth,512);assert.equal(q.cellHeight,341);assert.equal(q.atlasWidth,1536);assert.equal(q.atlasHeight,1023);assert.equal(q.atlasBytes,6285312);
 }
});

test('allocation accounts for the actual image count and returns finite fallback dimensions',()=>{
 for(let count=1;count<=8;count++){
  const q=viscoseResourceQuality({width:320,height:420,devicePixelRatio:3,mobile:true,count});
  assert.equal(q.cols,Math.ceil(Math.sqrt(count)));assert.equal(q.rows,Math.ceil(count/q.cols));
  assert.equal(q.atlasBytes,q.atlasWidth*q.atlasHeight*4);assert.ok(q.atlasBytes<=24*1024*1024);
 }
 for(const invalid of [NaN,Infinity,0,-1]){
  const q=viscoseResourceQuality({width:invalid,height:invalid,devicePixelRatio:invalid,mobile:true});
  assert.ok(Object.values(q).every(Number.isFinite));assert.ok(q.pixelRatio>0);
 }
});

const eventTarget=extra=>({...extra,listeners:new Map(),addEventListener(name,fn){this.listeners.set(name,[...this.listeners.get(name)||[],fn]);},removeEventListener(name,fn){this.listeners.set(name,(this.listeners.get(name)||[]).filter(value=>value!==fn));},fire(name){for(const fn of [...this.listeners.get(name)||[]])fn({});}});
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
function fixture(){
 let id=0;const frames=new Map(),timers=new Map(),renderers=[],textures=[],canvases=[],draws=[],rect={left:0,top:0,width:390,height:591,bottom:591};
 const win=eventTarget({innerWidth:390,innerHeight:844,devicePixelRatio:3,navigator:{maxTouchPoints:5},matchMedia:query=>eventTarget({matches:query.includes('coarse')}),requestAnimationFrame(fn){frames.set(++id,fn);return id;},cancelAnimationFrame(key){frames.delete(key);},setTimeout(fn){timers.set(++id,fn);return id;},clearTimeout(key){timers.delete(key);}});
 const doc=eventTarget({visibilityState:'visible',hidden:false,createElement(){const node={width:1,height:1,getContext:()=>({fillRect(){},save(){},beginPath(){},rect(){},clip(){},drawImage(...args){draws.push(args);},restore(){},scale(){},fillText(){}})};canvases.push(node);return node;}});
 const canvas=eventTarget({style:{},getBoundingClientRect:()=>({...rect})}),surface=eventTarget({dataset:{},getBoundingClientRect:()=>({...rect})});
 class Texture{constructor(image){this.image=image;textures.push(this);}dispose(){this.disposed=true;}}
 class Renderer{constructor(){this.capabilities={maxTextureSize:4096};this.info={programs:[]};this.ratios=[];this.sizes=[];renderers.push(this);}setPixelRatio(value){this.dpr=value;this.ratios.push(value);}setClearColor(){}setSize(w,h){this.sizes.push([w,h]);}render(){}dispose(){this.disposed=true;}forceContextLoss(){this.lost=true;}}
 const files=Array.from({length:8},(_,i)=>({src:`/photo-${i}.webp`}));
 const controller=createViscoseEngine(surface,{window:win,document:doc,canvas,files,intro:false,loadRuntime:async()=>({...Three,CanvasTexture:Texture,WebGLRenderer:Renderer}),loadImage:async()=>({width:1800,height:1200})});
 return {win,doc,canvas,surface,rect,frames,timers,renderers,textures,canvases,draws,controller,tick(){const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(16);}};
}

test('retina allocation keeps original photos and the same renderer/atlas through resize, then disposes them',async()=>{
 const f=fixture();await flush();f.tick();assert.equal(f.controller.mode,'webgl');
 assert.equal(f.renderers.length,1);assert.equal(f.textures.length,2);assert.equal(f.canvases.length,2);
 assert.ok(f.renderers[0].dpr>2.5);assert.deepEqual([f.canvases[0].width,f.canvases[0].height],[2304,1536]);assert.equal(f.controller.debug.atlasBytes,13.5*1024*1024);
 assert.equal(f.draws.length,8);for(const [image,,,dw,dh]of f.draws){assert.equal(image.width,1800);assert.equal(image.height,1200);assert.ok(dw<=image.width&&dh<=image.height,'authentic source images are downsampled, never upsampled');}
 const ratioCalls=f.renderers[0].ratios.length,sizeCalls=f.renderers[0].sizes.length;
 for(let i=0;i<8;i++){f.controller.resize();f.tick();}
 assert.equal(f.renderers[0].ratios.length,ratioCalls);assert.equal(f.renderers[0].sizes.length,sizeCalls,'unchanged geometry causes no render-buffer resize');
 f.rect.width=844;f.rect.height=460;f.win.fire('resize');f.tick();
 assert.equal(f.renderers.length,1);assert.equal(f.textures.length,2);assert.equal(f.canvases.length,2,'no replacement atlas/context on orientation');assert.equal(f.draws.length,8,'no photo re-decode/repaint on resize');
 assert.ok(Math.floor(844*f.renderers[0].dpr)*Math.floor(460*f.renderers[0].dpr)<=1500000);
 f.controller.dispose();assert.ok(f.textures.every(texture=>texture.disposed&&texture.image===null));assert.ok(f.renderers[0].disposed&&f.renderers[0].lost);assert.ok(f.canvases.every(canvas=>canvas.width===1&&canvas.height===1));assert.equal(f.frames.size,0);assert.equal(f.timers.size,0);
});
