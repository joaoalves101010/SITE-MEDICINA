/** Authored thin, rounded, rigid-hinge book. Reuses local Three r131 only. */
export const BOOK = Object.freeze({width:1.05,height:1.2,radius:.1,thickness:.005,leaves:7,maxProgress:6});
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,Number(value)||0));
export function bookPose(progress){
 const p=clamp(progress,0,6);
 return {progress:p,centerX:-.525*(1-clamp(p)),leaves:Array.from({length:7},(_,index)=>{
  const turn=clamp(p-index);
  return {index,turn,angle:-Math.PI*turn,depth:(1-turn)*(-.005*index)+turn*(.005*index-.035),crease:Math.sin(Math.PI*turn)};
 })};
}
export function textureWindow(progress){const center=Math.round(clamp(progress,0,6));return [center-1,center,center+1].filter(index=>index>=0&&index<=6);}
export function requiredSpreads(progress){const p=clamp(progress,0,6);return [...new Set([Math.floor(p),Math.ceil(p)])];}
/** Adjacent halves of one spread use the same angle, so art stays continuous at the spine. */
export function bookLayerOffset(progress,index,pointer={x:0,y:0},reduced=false){
 const p=clamp(progress,0,6),i=clamp(index,0,6);
 const relativeAngle=Math.PI*(clamp(p-i)-(i>0?1-clamp(p-i+1):0));
 return {x:reduced?0:.1*relativeAngle-.02*clamp(pointer.x,-1,1),y:reduced?0:-.02*clamp(pointer.y,-1,1)};
}
export function spineCrease(x,amount){return amount*(.00133876*Math.exp(-Math.pow((x-.00503)/.002,2))-.00060307*Math.exp(-Math.pow((x-.009915)/.002,2)));}
/** Original geometry, not the reference GLB: grid strips make the tiny binding crease possible. */
export function leafGeometry(back=false){
 const xs=[0,.00503,.009915,.015015,.02002,.06,.20,.40,.60,.80,.95];
 for(let i=1;i<=8;i++)xs.push(.95+.1*Math.sin(i/8*Math.PI/2));
 const positions=[],uvs=[],indices=[],rows=9;
 for(const x of xs){const maxY=x<=.95?.6:.5+Math.sqrt(Math.max(0,.01-(x-.95)**2));for(let j=0;j<rows;j++){
  const y=-maxY+2*maxY*j/(rows-1);positions.push(x,y,back?-.0025:.0025);
  uvs.push(back?.5-x/(2*BOOK.width):.5+x/(2*BOOK.width),y/BOOK.height+.5);
 }}
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<rows-1;j++){
  const a=i*rows+j,b=(i+1)*rows+j,c=b+1,d=a+1;indices.push(...(back?[a,c,b,a,d,c]:[a,b,c,a,c,d]));
 }
 return {positions,uvs,indices};
}
function edgeGeometry(){
 const outline=[[0,-.6],[.95,-.6]];
 for(let i=1;i<=10;i++){const a=i/10*Math.PI/2;outline.push([.95+.1*Math.sin(a),-.5-.1*Math.cos(a)]);}
 outline.push([1.05,.5]);for(let i=1;i<=10;i++){const a=i/10*Math.PI/2;outline.push([.95+.1*Math.cos(a),.5+.1*Math.sin(a)]);}outline.push([0,.6]);
 const positions=[],uvs=[],indices=[];
 for(let i=0;i<outline.length;i++){const [x,y]=outline[i];positions.push(x,y,-.0025,x,y,.0025);uvs.push(0,0,0,1);const n=(i+1)%outline.length;indices.push(i*2,n*2,n*2+1,i*2,n*2+1,i*2+1);}
 return {positions,uvs,indices};
}
const VERTEX=`varying vec2 vUv;varying vec3 vNormal;varying vec3 vWorld;varying float vSpine;void main(){vUv=uv;vSpine=position.x;vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`;
const FRAGMENT=`precision highp float;uniform sampler2D uMap;uniform sampler2D uIllustration;uniform sampler2D uType;uniform float uHasMap;uniform float uHasLayers;uniform vec2 uLayerOffset;uniform vec3 uColor;uniform vec3 uKey;uniform vec3 uFill;uniform float uSpine;varying vec2 vUv;varying vec3 vNormal;varying vec3 vWorld;varying float vSpine;void main(){vec3 normal=normalize(vNormal);vec3 key=normalize(uKey-vWorld),fill=normalize(uFill-vWorld),view=normalize(cameraPosition-vWorld);float diffuse=.61+.35*max(dot(normal,key),0.)+.12*max(dot(normal,fill),0.);float spec=pow(max(dot(normal,normalize(key+view)),0.),28.)*.065;vec3 ink=uColor;if(uHasMap>.5)ink=texture2D(uMap,vUv).rgb;if(uHasLayers>.5){vec2 artUv=vUv+uLayerOffset;vec4 art=texture2D(uIllustration,artUv);art.a*=step(0.,artUv.x)*step(artUv.x,1.)*step(0.,artUv.y)*step(artUv.y,1.);ink=mix(ink,art.rgb,art.a);vec4 lettering=texture2D(uType,vUv);ink=mix(ink,lettering.rgb,lettering.a);}float binding=mix(1.,.78+.22*smoothstep(0.,.038,abs(vSpine)),uSpine);float grain=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)*.005;gl_FragColor=vec4(ink*diffuse*binding+vec3(spec+grain),1.);}`;
const SHADOW_FRAGMENT=`varying vec2 vUv;uniform float uOpen;void main(){vec2 p=(vUv-.5)*2.;float width=mix(.48,.91,uOpen);float d=pow(abs(p.x)/width,8.)+pow(abs(p.y)/.83,8.);float alpha=exp(-d*1.8)*.26;gl_FragColor=vec4(.015,.005,.01,alpha);}`;

function geometryTypes(T){
 const probe=new T.SphereGeometry(1,3,2);
 const result={Geometry:T.BufferGeometry||Object.getPrototypeOf(T.SphereGeometry.prototype).constructor,Attribute:T.Float32BufferAttribute||probe.attributes.position.constructor,Object3D:T.Group||Object.getPrototypeOf(T.Mesh.prototype).constructor};probe.dispose();
 if(T.CanvasTexture)result.Texture=T.CanvasTexture;
 else{const target=new T.WebGLCubeRenderTarget(1);result.Texture=Object.getPrototypeOf(target.texture.constructor);target.dispose();}
 return result;
}
function makeGeometry(types,description){
 const geometry=new types.Geometry();geometry.setAttribute('position',new types.Attribute(description.positions,3));geometry.setAttribute('uv',new types.Attribute(description.uvs,2));geometry.setIndex(description.indices);geometry.computeVertexNormals();return geometry;
}

/** No idle RAF: rendering is requested only by progress, texture, resize or visibility changes. */
export async function initBookRenderer(canvas,{loadSpread,loadLayers,getProgress=()=>0,runtimeLoader,onFallback,signal,env={},timeoutMs=4000}={}){
 const win=env.window||(typeof window==='undefined'?null:window),doc=env.document||(typeof document==='undefined'?null:document);
 const request=env.requestAnimationFrame||(callback=>win.requestAnimationFrame(callback));
 const cancel=env.cancelAnimationFrame||(id=>win.cancelAnimationFrame(id));
 const now=env.now||(()=>performance.now());
 const host=canvas?.closest?.('[data-book-visual]')||canvas?.parentElement;
 const motion=win?.matchMedia?.('(prefers-reduced-motion: reduce)');let reduced=!!motion?.matches;const pointer={x:0,y:0};
 let mode='pending',disposed=false,visible=true,pageVisible=true,intersecting=true,raf=0,progress=0,renderer,scene,camera,group,types,T;
 let deadline=0,timer=0,revision=0,observer,resizeObserver,shadow,smallUploads=Number(win?.innerWidth||canvas?.clientWidth)>0&&Number(win?.innerWidth||canvas?.clientWidth)<=640;
 const owned=[],leaves=[],cache=new Map(),jobs=new Map(),queue=[],cleanups=[];let wanted=new Set(),activeJobs=0;
 let resolveFailure;const failure=new Promise(resolve=>{resolveFailure=resolve;});
 const controller={
  get mode(){return mode==='ready'?'webgl':mode==='pending'?'pending':'fallback';},
  setProgress(value){if(disposed||mode==='fallback')return;const next=clamp(value,0,6);progress=next;refreshTextures();schedule();},
  setVisible(value){visible=!!value;if(!visible)stop();else{refreshTextures();schedule();}},
  setPointer(x=0,y=0){if(disposed||mode==='fallback')return;const nextX=clamp(x,-1,1),nextY=clamp(y,-1,1);if(pointer.x===nextX&&pointer.y===nextY)return;pointer.x=nextX;pointer.y=nextY;schedule();},
  resize,
  dispose(){if(disposed)return;disposed=true;revision++;clearTimeout(timer);stop();observer?.disconnect();resizeObserver?.disconnect();cleanups.splice(0).forEach(fn=>fn());release();},
 };
 function listen(target,event,fn,options){target?.addEventListener?.(event,fn,options);cleanups.push(()=>target?.removeEventListener?.(event,fn,options));}
 function active(){return !disposed&&mode==='ready'&&visible&&pageVisible&&intersecting&&!doc?.hidden;}
 function stop(){if(raf)cancel(raf);raf=0;}
 function disposeTextures(bundle){for(const texture of [bundle.background,bundle.illustration,bundle.type])if(texture){texture.dispose();texture.image=null;}for(const canvas of bundle.ownedUploads||[]){canvas.width=1;canvas.height=1;}}
 function uploadImage(image){
  if(!smallUploads||typeof loadLayers!=='function')return {image,owned:null};
  const target=doc.createElement?.('canvas'),context=target?.getContext?.('2d');if(!context)throw new Error('Book mobile texture preparation unavailable');
  const scale=Math.min(1,1050/image.width,600/image.height);target.width=Math.max(1,Math.round(image.width*scale));target.height=Math.max(1,Math.round(image.height*scale));
  try{context.drawImage(image,0,0,target.width,target.height);}catch(error){target.width=1;target.height=1;throw error;}return {image:target,owned:target};
 }
 function release(){
  for(const job of queue.splice(0)){jobs.delete(job.index);job.resolve(null);}jobs.clear();wanted.clear();
  // Disposing GPU objects alone does not release their borrowed CPU canvas references.
  for(const leaf of leaves)for(const material of leaf.faceMaterials)for(const name of ['uMap','uIllustration','uType'])material.uniforms[name].value=null;
  for(const bundle of cache.values())disposeTextures(bundle);cache.clear();
  for(const item of owned.splice(0)){try{item.dispose?.();}catch{}}try{renderer?.dispose();}catch{}
  group?.clear?.();scene?.clear?.();leaves.length=0;renderer=scene=camera=group=shadow=types=null;observer=resizeObserver=null;
 }
 function fail(error){if(disposed||mode==='fallback')return controller;mode='fallback';revision++;clearTimeout(timer);stop();observer?.disconnect();resizeObserver?.disconnect();cleanups.splice(0).forEach(fn=>fn());release();if(host?.dataset){host.dataset.bookRender='fallback';host.dataset.bookError=error?.message||String(error||'Renderer unavailable');}if(canvas?.style){canvas.style.opacity='0';canvas.style.visibility='hidden';}try{onFallback?.(error,controller);}catch{}resolveFailure(controller);return controller;}
 function schedule(){if(!active()||raf)return;raf=request(()=>{raf=0;if(!active())return;try{draw();}catch(error){fail(error);}});}
 function makeMaterial(color,spine=1){const material=new T.ShaderMaterial({uniforms:{uMap:{value:null},uIllustration:{value:null},uType:{value:null},uHasMap:{value:0},uHasLayers:{value:0},uLayerOffset:{value:new T.Vector2()},uColor:{value:new T.Vector3(...color)},uKey:{value:new T.Vector3(-2,4,6)},uFill:{value:new T.Vector3(3,-1,4)},uSpine:{value:spine}},vertexShader:VERTEX,fragmentShader:FRAGMENT,side:T.FrontSide});owned.push(material);return material;}
 function createLeaf(index){
  const hinge=new types.Object3D();const faceMaterials=[];const geometries=[];
  for(const back of [false,true]){const geometry=makeGeometry(types,leafGeometry(back));owned.push(geometry);geometries.push({geometry,base:new Float32Array(geometry.attributes.position.array)});const material=makeMaterial([.96,.93,.87]);faceMaterials.push(material);hinge.add(new T.Mesh(geometry,material));}
  const geometry=makeGeometry(types,edgeGeometry());owned.push(geometry);geometries.push({geometry,base:new Float32Array(geometry.attributes.position.array)});
  const edgeMaterial=makeMaterial(index===0||index===6?[.29,.075,.14]:[.83,.79,.71],0);edgeMaterial.side=2;hinge.add(new T.Mesh(geometry,edgeMaterial));group.add(hinge);
  leaves.push({hinge,faceMaterials,geometries,lastCrease:-1,index});
 }
 function createBinding(){
  const positions=[],uvs=[],indices=[],segments=16;
  for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;for(const y of [-.606,.606]){positions.push(Math.cos(a)*.016,y,-.033+Math.sin(a)*.016);uvs.push(i/segments,y>.0?1:0);}}
  for(let i=0;i<segments;i++){const a=i*2;indices.push(a,a+2,a+3,a,a+3,a+1);}
  const geometry=makeGeometry(types,{positions,uvs,indices});owned.push(geometry);group.add(new T.Mesh(geometry,makeMaterial([.23,.055,.11],0)));
 }
 function setupScene(){
  scene=new T.Scene();camera=new T.PerspectiveCamera(36,1,.01,15);group=new types.Object3D();scene.add(group);
  for(let i=0;i<7;i++)createLeaf(i);createBinding();
  const geometry=makeGeometry(types,{positions:[-1.3,-.78,-.075,1.3,-.78,-.075,1.3,.78,-.075,-1.3,.78,-.075],uvs:[0,0,1,0,1,1,0,1],indices:[0,1,2,0,2,3]});owned.push(geometry);
  const material=new T.ShaderMaterial({uniforms:{uOpen:{value:0}},vertexShader:VERTEX,fragmentShader:SHADOW_FRAGMENT,transparent:true,depthWrite:false});owned.push(material);shadow=new T.Mesh(geometry,material);scene.add(shadow);
 }
 function refreshTextures(){
  if(!T||disposed||mode==='fallback')return;
  wanted=new Set(typeof loadLayers==='function'?requiredSpreads(progress):textureWindow(progress));for(let i=queue.length-1;i>=0;i--)if(!wanted.has(queue[i].index)){const [job]=queue.splice(i,1);jobs.delete(job.index);job.resolve(null);}for(const [index,texture]of cache)if(!wanted.has(index)){disposeTextures(texture);cache.delete(index);}
  if(mode!=='pending'&&(!visible||!pageVisible||!intersecting||doc?.hidden))return;
  for(const index of [...requiredSpreads(progress),...wanted])loadTexture(index).catch(error=>{if(error?.retryable){if(host?.dataset)host.dataset.bookLoading='true';}else if(requiredSpreads(progress).includes(index))fail(error);});
  pumpTextureQueue();
 }
 function pumpTextureQueue(){
  if(mode!=='pending'&&(!visible||!pageVisible||!intersecting||doc?.hidden))return;
  while(activeJobs<2&&queue.length){
   const job=queue.shift();
   if(disposed||mode==='fallback'||!wanted.has(job.index)){jobs.delete(job.index);job.resolve(null);continue;}
   activeJobs++;
   Promise.resolve().then(()=>{
    if(disposed||mode==='fallback'||job.token!==revision)return null;
    return typeof loadLayers==='function'?loadLayers(job.index):loadSpread(job.index);
   }).then(art=>{
    // Artwork is borrowed from the caller: never resize or mutate its canvas.
    if(disposed||mode==='fallback'||job.token!==revision||!wanted.has(job.index))return null;
    const layered=typeof loadLayers==='function',canvases=layered?[art?.background,art?.illustration,art?.type]:[art];
    if(canvases.some(image=>!image||!(image.width>0)||!(image.height>0)))throw new Error('Invalid book artwork');
    const textures=[],ownedUploads=[];try{for(const image of canvases){const upload=uploadImage(image);if(upload.owned)ownedUploads.push(upload.owned);const texture=new types.Texture(upload.image);textures.push(texture);texture.needsUpdate=true;texture.encoding=T.sRGBEncoding;texture.generateMipmaps=false;texture.minFilter=T.LinearFilter??1006;texture.anisotropy=Math.min(8,renderer.capabilities?.getMaxAnisotropy?.()||1);}}catch(error){textures.forEach(texture=>{texture.dispose();texture.image=null;});for(const canvas of ownedUploads){canvas.width=1;canvas.height=1;}throw error;}
    const factor=layered?art.illustration.moveFactor:null;
    const bundle={ownedUploads,background:textures[0],illustration:textures[1]||null,type:textures[2]||null,moveFactor:typeof factor==='number'?{x:factor,y:factor}:{x:factor?.x??.06,y:factor?.y??.06}};
    cache.set(job.index,bundle);schedule();return bundle;
   }).then(job.resolve,job.reject).finally(()=>{activeJobs--;if(jobs.get(job.index)===job)jobs.delete(job.index);pumpTextureQueue();});
  }
 }
 function loadTexture(index){
  if(cache.has(index))return Promise.resolve(cache.get(index));if(jobs.has(index))return jobs.get(index).promise;
  const job={index,token:revision};job.promise=new Promise((resolve,reject)=>{job.resolve=resolve;job.reject=reject;});jobs.set(index,job);queue.push(job);pumpTextureQueue();return job.promise;
 }
 function applyPose(){
  const pose=bookPose(progress);group.position.x=pose.centerX;shadow.position.x=0;shadow.material.uniforms.uOpen.value=clamp(progress);
  for(const state of pose.leaves){const leaf=leaves[state.index];leaf.hinge.rotation.y=state.angle;leaf.hinge.position.z=state.depth;
   if(Math.abs(leaf.lastCrease-state.crease)>1e-7){for(const {geometry,base}of leaf.geometries){const positions=geometry.attributes.position.array;for(let i=0;i<positions.length;i+=3)positions[i+2]=base[i+2]+spineCrease(base[i],state.crease);geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();}leaf.lastCrease=state.crease;}
   for(let side=0;side<2;side++){const index=state.index+side,bundle=index<=6?cache.get(index):null,uniforms=leaf.faceMaterials[side].uniforms;
    uniforms.uMap.value=bundle?.background||null;uniforms.uIllustration.value=bundle?.illustration||null;uniforms.uType.value=bundle?.type||null;uniforms.uHasMap.value=bundle?1:0;uniforms.uHasLayers.value=bundle?.illustration?1:0;
    const offset=bookLayerOffset(progress,index,pointer,reduced);uniforms.uLayerOffset.value.set(offset.x*(bundle?.moveFactor.x||0),offset.y*(bundle?.moveFactor.y||0));
   }
  }
 }
 function draw(){
  if(disposed||mode==='fallback'||!renderer||!scene)return;
  const complete=requiredSpreads(progress).every(index=>cache.has(index));
  if(host?.dataset)host.dataset.bookLoading=String(!complete);
  if(!complete)return;applyPose();renderer.render(scene,camera);
  if(renderer.getContext().isContextLost()||renderer.info?.programs?.some(program=>program.diagnostics?.runnable===false))throw new Error('Book WebGL rendering unavailable');
 }
 function resize(){
  if(disposed||mode==='fallback'||!renderer||!camera)return;
  const nextSmall=Number(win.innerWidth||canvas.clientWidth)<=640;if(nextSmall!==smallUploads){smallUploads=nextSmall;for(const bundle of cache.values())disposeTextures(bundle);cache.clear();refreshTextures();}
  const width=Math.max(1,canvas.clientWidth||host?.clientWidth||win.innerWidth),height=Math.max(1,canvas.clientHeight||host?.clientHeight||win.innerHeight);
  renderer.setPixelRatio(Math.min(win.devicePixelRatio||1,1.5));renderer.setSize(width,height,false);camera.aspect=width/height;
  const distance=Math.max(1.35,2.26/camera.aspect)/(2*Math.tan(18*Math.PI/180))*1.03+.12;
  camera.position.set(0,.045,Math.min(13,distance));camera.lookAt(new T.Vector3(0,0,0));camera.updateProjectionMatrix();schedule();
 }
 if(signal?.aborted)return fail(new Error('Book initialization aborted'));
 if(signal)listen(signal,'abort',()=>{fail(new Error('Book initialization aborted'));controller.dispose();},{once:true});
 if(!canvas?.getContext||!win||!doc||(typeof loadSpread!=='function'&&typeof loadLayers!=='function'))return fail(new Error('Book canvas unavailable'));
 if(host?.dataset)host.dataset.bookRender='pending';canvas.style.opacity='0';canvas.style.visibility='hidden';canvas.setAttribute?.('aria-hidden','true');
 deadline=now()+timeoutMs;
 const timeout=new Promise(resolve=>{timer=setTimeout(()=>resolve(fail(new Error('Book initialization timed out'))),timeoutMs);});
 const startup=(async()=>{
  try{
   T=await(runtimeLoader?runtimeLoader():import('./vendor/three-scene.js'));if(disposed||mode==='fallback')return controller;
   types=geometryTypes(T);renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,stencil:false,powerPreference:'high-performance'});renderer.setClearColor(0,0);setupScene();resize();
   // Query again after artwork resolves: scroll restoration can happen during IO.
   while(!disposed&&mode!=='fallback'){
    progress=clamp(getProgress(),0,6);refreshTextures();const required=requiredSpreads(progress);
    if(required.every(index=>cache.has(index)))break;
    await Promise.all(required.map(loadTexture));if(now()>=deadline)throw new Error('Book initialization timed out');
   }
   if(disposed||mode==='fallback')return controller;draw();if(now()>=deadline)throw new Error('Book initialization timed out');
   mode='ready';clearTimeout(timer);if(host?.dataset)host.dataset.bookRender='ready';canvas.style.visibility='visible';canvas.style.opacity='1';
   listen(motion,'change',()=>{reduced=!!motion.matches;schedule();});
   listen(host,'pointermove',event=>{if(reduced||event.pointerType==='touch'||!host?.getBoundingClientRect)return;const rect=host.getBoundingClientRect();if(rect.width>0&&rect.height>0)controller.setPointer(2*(event.clientX-rect.left)/rect.width-1,2*(event.clientY-rect.top)/rect.height-1);},{passive:true});listen(host,'pointerleave',()=>controller.setPointer(0,0));
   listen(doc,'visibilitychange',()=>{if(doc.hidden)stop();else{refreshTextures();schedule();}});listen(win,'resize',resize,{passive:true});
   listen(win,'pagehide',()=>{pageVisible=false;stop();});listen(win,'pageshow',()=>{pageVisible=true;refreshTextures();schedule();});
   listen(canvas,'webglcontextlost',event=>{event.preventDefault();fail(new Error('Book WebGL context lost'));});
   if('IntersectionObserver'in win){observer=new win.IntersectionObserver(entries=>{intersecting=entries.some(entry=>entry.isIntersecting);if(intersecting){refreshTextures();schedule();}else stop();},{rootMargin:'100px'});observer.observe(host);}
   if('ResizeObserver'in win){resizeObserver=new win.ResizeObserver(resize);resizeObserver.observe(canvas);}
   return controller;
  }catch(error){return fail(error);}
 })();
 return Promise.race([startup,timeout,failure]);
}
