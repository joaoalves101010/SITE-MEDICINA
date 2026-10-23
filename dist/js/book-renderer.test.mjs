import test from 'node:test';
import assert from 'node:assert/strict';
import * as Three from './vendor/three-scene.js';
import {BOOK,bookPose,bookLayerOffset,textureWindow,requiredSpreads,spineCrease,leafGeometry,initBookRenderer} from './book-renderer.js';

const close=(a,b,epsilon=1e-9)=>assert.ok(Math.abs(a-b)<epsilon,`${a} ≈ ${b}`);
const flush=async()=>{for(let i=0;i<16;i++)await Promise.resolve();};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
function eventTarget(extra={}){const listeners=new Map();return Object.assign({addEventListener(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);},removeEventListener(name,fn){listeners.get(name)?.delete(fn);},emit(name,event={}){for(const fn of [...listeners.get(name)||[]])fn(event);},listenerCount(){return [...listeners.values()].reduce((n,list)=>n+list.size,0);}},extra);}
function fixture(overrides={}){
 let nextRaf=1;const rafs=new Map(),renderers=[],textures=[],frames=[],observers=[],resizeObservers=[];
 const host={dataset:{},clientWidth:900,clientHeight:600};
 const canvas=eventTarget({style:{},clientWidth:900,clientHeight:600,parentElement:host,closest:()=>host,getContext:()=>({}),setAttribute(){}});
 const doc=eventTarget({hidden:false});
 const win=eventTarget({devicePixelRatio:3,innerWidth:900,innerHeight:600,requestAnimationFrame(fn){const id=nextRaf++;rafs.set(id,fn);return id;},cancelAnimationFrame(id){rafs.delete(id);},IntersectionObserver:class{constructor(fn){this.fn=fn;this.disconnected=false;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}},ResizeObserver:class{constructor(fn){this.fn=fn;this.disconnected=false;resizeObservers.push(this);}observe(){}disconnect(){this.disconnected=true;}}});
 class Texture{constructor(image){this.image=image;this.disposed=false;textures.push(this);}dispose(){this.disposed=true;}}
 class Renderer{constructor(){this.info={programs:[]};this.capabilities={getMaxAnisotropy:()=>16};this.lost=false;this.disposed=false;renderers.push(this);}setClearColor(){}setPixelRatio(value){this.dpr=value;}setSize(w,h){this.size=[w,h];}getContext(){return{isContextLost:()=>this.lost};}render(scene,camera){const group=scene.children[0];frames.push({x:group.position.x,angles:group.children.slice(0,7).map(leaf=>leaf.rotation.y),textures:group.children.slice(0,7).map(leaf=>leaf.children.slice(0,2).map(face=>face.material.uniforms.uMap.value?.image.index??null)),scene,camera});}dispose(){this.disposed=true;}}
 const runtime={...Three,WebGLRenderer:Renderer,CanvasTexture:Texture};
 const loads=[];const loadSpread=async index=>{loads.push(index);return{index,width:2100,height:1200};};
 return{canvas,host,doc,win,rafs,renderers,textures,frames,loads,observers,resizeObservers,runtime,options:{loadSpread,runtimeLoader:async()=>runtime,env:{window:win,document:doc},timeoutMs:1000,...overrides},tick(){const callbacks=[...rafs.values()];rafs.clear();for(const fn of callbacks)fn(0);}};
}

test('seven deterministic rigid leaves open/reverse and recenter only the cover',()=>{
 close(BOOK.width/BOOK.height,.875);assert.equal(bookPose(-3).progress,0);assert.equal(bookPose(20).progress,6);
 const cover=bookPose(0);close(cover.centerX,-.525);assert.equal(cover.leaves.length,7);assert.ok(cover.leaves.every(leaf=>Object.is(leaf.angle,-0)));
 const half=bookPose(.5);close(half.centerX,-.2625);close(half.leaves[0].angle,-Math.PI/2);close(half.leaves[0].crease,1);
 const final=bookPose(6);close(final.centerX,0);assert.ok(final.leaves.slice(0,6).every(leaf=>leaf.angle===-Math.PI));assert.equal(final.leaves[6].turn,0);
 for(const p of [0,.2,1,2.35,5.8,6,4.25,0])assert.deepEqual(bookPose(p),bookPose(p));
});

test('authored page geometry is rounded, thin, and selects canonical half UVs',()=>{
 const front=leafGeometry(),back=leafGeometry(true);assert.equal(front.positions.length,back.positions.length);
 let maxX=0,maxY=0;
 for(let i=0;i<front.positions.length;i+=3){const[x,y,z]=front.positions.slice(i,i+3);maxX=Math.max(maxX,x);maxY=Math.max(maxY,Math.abs(y));close(z,.0025);close(back.positions[i+2],-.0025);const uv=i/3*2;close(front.uvs[uv],.5+x/2.1);close(back.uvs[uv],.5-x/2.1);close(front.uvs[uv+1],y/1.2+.5);if(x>.95)assert.ok((x-.95)**2+(Math.max(0,Math.abs(y)-.5))**2<=.010000001);}
 close(maxX,1.05);close(maxY,.6);assert.equal(front.indices.length,back.indices.length);assert.deepEqual(front.indices.slice(0,3),[0,9,10]);assert.deepEqual(back.indices.slice(0,3),[0,10,9]);
 assert.ok(spineCrease(.00503,1)>.0013);assert.ok(spineCrease(.009915,1)<-.00059);assert.ok(Math.abs(spineCrease(.03,1))<1e-20);assert.equal(spineCrease(.005,0),0);
});

test('texture selection remains bounded and includes both visible artwork halves',()=>{
 for(let p=0;p<=6;p+=.05){const window=textureWindow(p);assert.ok(window.length<=3);assert.ok(window.every(i=>i>=0&&i<=6));assert.ok(requiredSpreads(p).every(i=>window.includes(i)));}
 assert.deepEqual(requiredSpreads(3),[3]);assert.deepEqual(requiredSpreads(3.1),[3,4]);
});

test('first actual draw uses latest restored progress and marks readiness only afterward',async()=>{
 const art=deferred();let progress=0;const f=fixture({getProgress:()=>progress,loadSpread:index=>index===0?art.promise:Promise.resolve({index,width:2100,height:1200})});
 const init=initBookRenderer(f.canvas,f.options);await flush();assert.equal(f.host.dataset.bookRender,'pending');assert.equal(f.frames.length,0);assert.equal(f.canvas.style.opacity,'0');progress=4.4;art.resolve({index:0,width:2100,height:1200});const controller=await init;
 assert.equal(controller.mode,'webgl');assert.equal(f.host.dataset.bookRender,'ready');close(f.frames[0].angles[4],-.4*Math.PI);assert.equal(f.frames[0].textures[4][0],4);assert.equal(f.frames[0].textures[4][1],5);assert.equal(f.renderers[0].dpr,1.5);assert.equal(f.renderers.length,1);controller.dispose();
});

test('progress redraws coalesce, reverse exactly, and never create an idle render loop',async()=>{
 const f=fixture();const c=await initBookRenderer(f.canvas,f.options);await flush();f.tick();await flush();const initial=f.frames.length;assert.equal(f.rafs.size,0);
 c.setProgress(.2);c.setProgress(.8);c.setProgress(.2);assert.equal(f.rafs.size,1);f.tick();close(f.frames.at(-1).angles[0],-.2*Math.PI);assert.equal(f.frames.length,initial+1);assert.equal(f.rafs.size,0);
 c.setProgress(0);f.tick();close(f.frames.at(-1).x,-.525);c.dispose();assert.ok(f.renderers[0].disposed);assert.ok(f.textures.every(t=>t.disposed));assert.equal(f.win.listenerCount()+f.doc.listenerCount()+f.canvas.listenerCount(),0);
});

test('large jumps retain the last valid frame until required art arrives; texture cache stays at most three',async()=>{
 const pending=new Map();const f=fixture({loadSpread:index=>index<=1?Promise.resolve({index,width:2100,height:1200}):(pending.has(index)?pending.get(index).promise:(pending.set(index,deferred()),pending.get(index).promise))});
 const c=await initBookRenderer(f.canvas,f.options);await flush();f.tick();const before=f.frames.length;c.setProgress(4.5);await flush();f.tick();assert.equal(f.frames.length,before);assert.equal(f.host.dataset.bookLoading,'true');
 for(const index of [4,5]){pending.get(index).resolve({index,width:2100,height:1200});await flush();}f.tick();close(f.frames.at(-1).angles[4],-Math.PI/2);assert.ok(f.textures.filter(t=>!t.disposed).length<=3);
 c.setProgress(1);await flush();f.tick();assert.equal(f.frames.at(-1).textures[1][0],1);assert.ok(f.textures.filter(t=>!t.disposed).length<=3);c.dispose();
});

test('artwork jobs are bounded to two and stale jobs never allocate textures or mutate borrowed canvases',async()=>{
 const pending=new Map(),started=[];let active=0,maxActive=0;const f=fixture({loadSpread:index=>{started.push(index);active++;maxActive=Math.max(maxActive,active);const job=deferred();pending.set(index,job);return job.promise.finally(()=>active--);}});
 const init=initBookRenderer(f.canvas,f.options);await flush();pending.get(0).resolve({index:0,width:2100,height:1200});pending.get(1).resolve({index:1,width:2100,height:1200});const c=await init;await flush();
 c.setProgress(2.2);await flush();c.setProgress(4.5);c.setProgress(6);await flush();assert.ok(maxActive<=2);assert.ok(active<=2);
 const stale={index:2,width:2100,height:1200};pending.get(2)?.resolve(stale);pending.get(3)?.resolve({index:3,width:2100,height:1200});await flush();assert.ok(!f.textures.some(t=>t.image?.index===2));assert.equal(stale.width,2100);
 c.dispose();for(const job of pending.values())job.resolve({width:2100,height:1200});await flush();assert.ok(f.textures.every(t=>t.disposed));assert.equal(stale.height,1200);
});

test('visibility, page lifecycle and intersection pause work without overriding each other',async()=>{
 const f=fixture();const c=await initBookRenderer(f.canvas,f.options);await flush();f.tick();
 f.observers[0].fn([{isIntersecting:false}]);c.setProgress(3);await flush();assert.equal(f.rafs.size,0);assert.deepEqual(f.loads.sort(),[0,1]);f.win.emit('pageshow');assert.equal(f.rafs.size,0);
 f.observers[0].fn([{isIntersecting:true}]);await flush();assert.equal(f.rafs.size,1);f.tick();c.setVisible(false);f.win.emit('pageshow');c.setProgress(4);await flush();assert.equal(f.rafs.size,0);
 c.setVisible(true);await flush();f.win.emit('pagehide');assert.equal(f.rafs.size,0);f.win.emit('pageshow');await flush();assert.equal(f.rafs.size,1);f.doc.hidden=true;f.doc.emit('visibilitychange');assert.equal(f.rafs.size,0);f.doc.hidden=false;f.doc.emit('visibilitychange');await flush();f.tick();assert.equal(f.rafs.size,0);c.dispose();
});

test('context loss switches once to fallback and resize cannot resurrect disposed GPU resources',async()=>{
 const failures=[];const f=fixture({onFallback:(error,c)=>failures.push([error.message,c.mode])});const c=await initBookRenderer(f.canvas,f.options);let prevented=false;f.canvas.emit('webglcontextlost',{preventDefault(){prevented=true;}});assert.ok(prevented);assert.equal(c.mode,'fallback');assert.equal(f.host.dataset.bookRender,'fallback');assert.equal(f.canvas.style.visibility,'hidden');assert.equal(failures.length,1);c.resize();c.setProgress(4);c.setVisible(true);assert.equal(f.rafs.size,0);assert.ok(f.renderers[0].disposed);assert.ok(f.observers.every(o=>o.disconnected));c.dispose();assert.equal(failures.length,1);
});

test('timeout and abort settle promptly and ignore late runtime import',async()=>{
 const late=deferred();const f=fixture({runtimeLoader:()=>late.promise,timeoutMs:10});const c=await initBookRenderer(f.canvas,f.options);assert.equal(c.mode,'fallback');late.resolve(f.runtime);await flush();assert.equal(f.renderers.length,0);c.dispose();
 const later=deferred(),abort=new AbortController();const a=fixture({runtimeLoader:()=>later.promise,signal:abort.signal});const init=initBookRenderer(a.canvas,a.options);abort.abort();const stopped=await init;assert.equal(stopped.mode,'fallback');later.resolve(a.runtime);await flush();assert.equal(a.renderers.length,0);
});

test('constructor failures fail open and production local Three texture adapter works',async()=>{
 const f=fixture();f.options.runtimeLoader=async()=>({...f.runtime,WebGLRenderer:class{constructor(){throw new Error('No GPU');}}});const c=await initBookRenderer(f.canvas,f.options);assert.equal(c.mode,'fallback');assert.match(f.host.dataset.bookError,/No GPU/);
 const a=fixture();a.options.runtimeLoader=async()=>({...Three,WebGLRenderer:a.runtime.WebGLRenderer});const valid=await initBookRenderer(a.canvas,a.options);assert.equal(valid.mode,'webgl');assert.ok(a.frames[0].scene.children[0].children[0].children[0].material.uniforms.uMap.value.isTexture);valid.dispose();
});

test('retryable artwork errors keep the rendered book usable and retry on the next explicit progress update',async()=>{
 const counts=new Map();const f=fixture({loadSpread:async index=>{counts.set(index,(counts.get(index)||0)+1);if(index===3&&counts.get(index)===1)throw Object.assign(new Error('Image not ready'),{retryable:true});return{index,width:2100,height:1200};}});
 const c=await initBookRenderer(f.canvas,f.options);await flush();f.tick();const before=f.frames.length;c.setProgress(3);await flush();f.tick();assert.equal(c.mode,'webgl');assert.equal(f.frames.length,before);assert.equal(f.host.dataset.bookLoading,'true');c.setProgress(3);await flush();f.tick();assert.equal(counts.get(3),2);assert.equal(f.frames.at(-1).textures[3][0],3);assert.equal(f.host.dataset.bookLoading,'false');c.dispose();
});

test('a hidden section does not drain its queued artwork job until visibility returns',async()=>{
 const pending=new Map(),loads=[];const f=fixture({loadSpread:index=>{loads.push(index);if(index<2)return Promise.resolve({index,width:2100,height:1200});const job=deferred();pending.set(index,job);return job.promise;}});
 const c=await initBookRenderer(f.canvas,f.options);await flush();c.setProgress(4);await flush();assert.deepEqual(loads,[0,1,4,3]);c.setVisible(false);pending.get(4).resolve({index:4,width:2100,height:1200});pending.get(3).resolve({index:3,width:2100,height:1200});await flush();assert.deepEqual(loads,[0,1,4,3]);assert.equal(f.rafs.size,0);c.setVisible(true);await flush();assert.deepEqual(loads,[0,1,4,3,5]);c.dispose();pending.get(5).resolve({index:5,width:2100,height:1200});await flush();
});

test('an expanded 160% canvas contains raised page vertices throughout reversible half-turns',async()=>{
 const f=fixture();f.canvas.clientWidth=900;f.canvas.clientHeight=900/1.75*1.6;const c=await initBookRenderer(f.canvas,f.options);await flush();
 for(const p of [0,.25,.5,.75,1,1.5,2.5,3.5,4.5,5.5,6,3.5,.5,0]){
  c.setProgress(p);await flush();f.tick();const{scene,camera}=f.frames.at(-1);scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  for(const hinge of scene.children[0].children.slice(0,7))for(const mesh of hinge.children){const vertices=mesh.geometry.attributes.position;for(let i=0;i<vertices.count;i++){const point=new Three.Vector3(vertices.getX(i),vertices.getY(i),vertices.getZ(i)).applyMatrix4(mesh.matrixWorld).project(camera);assert.ok(Math.abs(point.x)<1,`p=${p} x=${point.x}`);assert.ok(Math.abs(point.y)<1,`p=${p} y=${point.y}`);}}
 }
 c.dispose();
});

function layeredArt(index){return Object.fromEntries(['background','illustration','type'].map(layer=>[layer,{index,layer,width:2100,height:1200,moveFactor:layer==='illustration'?.06:0}]));}

test('relative-angle artwork parallax is zero at rest and exactly reversible without an ambient clock',()=>{
 for(let index=0;index<=6;index++){const offset=bookLayerOffset(index,index);close(offset.x,0);close(offset.y,0);}
 close(bookLayerOffset(2.5,2).x,.05*Math.PI);close(bookLayerOffset(2.5,3).x,-.05*Math.PI);
 const forward=[0,.25,.5,.75,1,1.5,2.5,5.5,6].map(p=>bookLayerOffset(p,Math.floor(p)));
 const reverse=[6,5.5,2.5,1.5,1,.75,.5,.25,0].map(p=>bookLayerOffset(p,Math.floor(p))).reverse();assert.deepEqual(forward,reverse);
 assert.deepEqual(bookLayerOffset(3.5,3,{x:1,y:-1},true),{x:0,y:0});close(bookLayerOffset(3,3,{x:100,y:-100}).x,-.02);close(bookLayerOffset(3,3,{x:100,y:-100}).y,.02);
});

test('three independent alpha-over textures share each spread; type stays anchored and UV overflow is transparent',async()=>{
 const f=fixture({loadLayers:async index=>layeredArt(index),loadSpread:()=>{throw new Error('Do not flatten WebGL layers');}});const c=await initBookRenderer(f.canvas,f.options);await flush();
 c.setProgress(2.5);await flush();f.tick();const group=f.frames.at(-1).scene.children[0];
 const left=group.children[1].children[1].material,right=group.children[2].children[0].material;
 for(const material of [left,right]){const u=material.uniforms;assert.equal(u.uHasLayers.value,1);assert.equal(u.uMap.value.image.layer,'background');assert.equal(u.uIllustration.value.image.layer,'illustration');assert.equal(u.uType.value.image.layer,'type');close(u.uLayerOffset.value.x,.05*Math.PI*.06);assert.match(material.fragmentShader,/texture2D\(uType,vUv\)/);assert.match(material.fragmentShader,/texture2D\(uMap,vUv\)/);assert.match(material.fragmentShader,/art\.a\*=step\(0\.,artUv\.x\).*step\(artUv\.y,1\.\)/);}
 assert.equal(left.uniforms.uIllustration.value,right.uniforms.uIllustration.value);assert.equal(left.uniforms.uType.value,right.uniforms.uType.value);
 c.setProgress(2);await flush();f.tick();close(right.uniforms.uLayerOffset.value.x,0);c.setProgress(2.5);await flush();f.tick();close(right.uniforms.uLayerOffset.value.x,.05*Math.PI*.06);c.dispose();
});

test('layer cache stays at six mipmap-free textures and releases all GPU ownership without touching canvases',async()=>{
 const art=[];const f=fixture({loadLayers:async index=>{const value=layeredArt(index);art.push(value);return value;}});const c=await initBookRenderer(f.canvas,f.options);await flush();
 for(const p of [1.5,3.5,5.5,6,2.5,0]){c.setProgress(p);await flush();f.tick();const live=f.textures.filter(texture=>!texture.disposed);assert.ok(live.length<=6);assert.ok(live.every(texture=>texture.generateMipmaps===false&&texture.minFilter===1006));const bytes=live.reduce((sum,t)=>sum+t.image.width*t.image.height*4,0);assert.ok(bytes<=60480000);}
 c.dispose();assert.ok(f.textures.every(texture=>texture.disposed));for(const spread of art)for(const image of Object.values(spread)){assert.equal(image.width,2100);assert.equal(image.height,1200);}
});

test('pointer parallax is coalesced, stops offscreen, and reduced motion anchors every art layer',async()=>{
 const motion=eventTarget({matches:false});const f=fixture({loadLayers:async index=>layeredArt(index)});f.win.matchMedia=()=>motion;const c=await initBookRenderer(f.canvas,f.options);await flush();f.tick();
 c.setPointer(.2,.3);c.setPointer(1,-1);assert.equal(f.rafs.size,1);f.tick();let u=f.frames.at(-1).scene.children[0].children[0].children[0].material.uniforms;close(u.uLayerOffset.value.x,-.02*.06);close(u.uLayerOffset.value.y,.02*.06);assert.equal(f.rafs.size,0);
 c.setVisible(false);c.setPointer(-1,1);assert.equal(f.rafs.size,0);c.setVisible(true);f.tick();close(u.uLayerOffset.value.x,.02*.06);
 motion.matches=true;motion.emit('change');c.setProgress(.5);await flush();f.tick();u=f.frames.at(-1).scene.children[0].children[0].children[0].material.uniforms;close(u.uLayerOffset.value.x,0);close(u.uLayerOffset.value.y,0);assert.equal(f.rafs.size,0);c.dispose();assert.equal(motion.listenerCount(),0);
});

test('mobile layered uploads are owned half-size canvases, capped at 15.12MB and released on eviction',async()=>{
 const originals=[],uploads=[];const f=fixture({loadLayers:async index=>{const art=layeredArt(index);originals.push(art);return art;}});f.win.innerWidth=390;
 f.doc.createElement=tag=>{assert.equal(tag,'canvas');const upload={width:0,height:0,getContext:()=>({drawImage(source,x,y,w,h){upload.source=source;upload.drawn=[x,y,w,h];}})};uploads.push(upload);return upload;};
 const c=await initBookRenderer(f.canvas,f.options);await flush();c.setProgress(2.5);await flush();f.tick();const live=f.textures.filter(t=>!t.disposed);assert.equal(live.length,6);assert.ok(live.every(t=>t.image.width===1050&&t.image.height===600));assert.equal(live.reduce((n,t)=>n+t.image.width*t.image.height*4,0),15120000);assert.ok(live.every(t=>t.image!==t.image.source));
 f.win.innerWidth=900;c.resize();await flush();f.tick();assert.ok(f.textures.filter(t=>!t.disposed).every(t=>t.image.width===2100&&t.image.height===1200));assert.ok(uploads.every(image=>image.width===1&&image.height===1));
 c.dispose();for(const spread of originals)for(const image of Object.values(spread)){assert.equal(image.width,2100);assert.equal(image.height,1200);}
});

test('context loss and disposal clear scene samplers and texture image references without changing borrowed art',async()=>{
 for(const fail of [false,true]){
  const originals=[];const f=fixture({loadLayers:async index=>{const art=layeredArt(index);originals.push(art);return art;}});const c=await initBookRenderer(f.canvas,f.options);c.setProgress(2.5);await flush();f.tick();const scene=f.frames.at(-1).scene,group=scene.children[0],materials=group.children.slice(0,7).flatMap(hinge=>hinge.children.slice(0,2).map(mesh=>mesh.material));
  if(fail)f.canvas.emit('webglcontextlost',{preventDefault(){}});else c.dispose();
  assert.ok(materials.every(material=>['uMap','uIllustration','uType'].every(name=>material.uniforms[name].value===null)));assert.ok(f.textures.every(texture=>texture.disposed&&texture.image===null));assert.equal(scene.children.length,0);assert.equal(group.children.length,0);
  for(const spread of originals)for(const image of Object.values(spread)){assert.equal(image.width,2100);assert.equal(image.height,1200);}c.dispose();
 }
});

test('a failed mobile drawImage releases its owned upload canvas immediately',async()=>{
 const original=layeredArt(0),uploads=[];const f=fixture({loadLayers:async()=>original});f.win.innerWidth=390;f.doc.createElement=()=>{const canvas={width:0,height:0,getContext:()=>({drawImage(){throw new Error('Upload draw failed');}})};uploads.push(canvas);return canvas;};
 const c=await initBookRenderer(f.canvas,f.options);assert.equal(c.mode,'fallback');assert.match(f.host.dataset.bookError,/Upload draw failed/);assert.ok(uploads.length>0);assert.ok(uploads.every(canvas=>canvas.width===1&&canvas.height===1));assert.equal(original.background.width,2100);assert.equal(original.background.height,1200);c.dispose();
});
