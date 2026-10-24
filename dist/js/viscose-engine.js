import {VISCOSE_MAX_CARDS,viscoseVertex,viscoseFragment} from './viscose-shaders.js';
import {usesNativeTouchScroll} from './scroll-policy.js';
const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const smooth=v=>{const t=clamp(v);return t*t*(3-2*t);};
const out=v=>1-Math.pow(1-clamp(v),3);
const inOut=v=>{const t=clamp(v);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
const approach=(dt,rate)=>1-Math.pow(1-rate,dt*60);
const mod=(v,n)=>(v%n+n)%n;
const signedSlot=i=>i===0?0:i%2?(i+1)/2:-i/2;
const wrapped=v=>Math.atan2(Math.sin(v),Math.cos(v));
const elastic=(value,period)=>{const t=clamp(value);return t===0||t===1?t:1+Math.pow(2,-10*t)*Math.sin((t-period/4)*TAU/period);};
export const VISCOSE=Object.freeze({refWidth:1512,baseWidth:90,baseRadius:340,restScale:4.46,damping:.94,scrollSpeed:.0022,maxSpeed:12,snapTime:.8,pickTime:.55,introDuration:8.37});
export function createViscoseState(count=8,{intro=true,introDuration=VISCOSE.introDuration}={}){
 const n=Math.max(1,Math.min(VISCOSE_MAX_CARDS,Math.round(count))),entryDuration=Math.max(VISCOSE.introDuration,Number.isFinite(introDuration)?introDuration:VISCOSE.introDuration);
 return {count:n,entryDuration,wheelBounds:null,wheelCorridor:null,wheelQuiet:0,spin:0,velocity:0,elapsed:intro?0:entryDuration,interactive:!intro,settling:false,target:0,cap:0,pick:null,selected:0,announced:-1,dragging:false,cursor:{x:0,y:0,amount:0,wake:0},pointer:{x:0,y:0,inside:false,seeded:false,coarse:false},focus:{x:0,y:0,plane:-1},hover:Array.from({length:n},()=>({f:0,x:0,y:0,side:0,web:0})),tag:{x:.5,y:0,shown:false,tween:null},frame:null};
}
export function viscoseEntry(time){
 const t=Math.max(0,time-.25);return {birth:out(t/1.2),launch:inOut((t-1.2)/1.95),spread:out((t-3)/3.6),spin:TAU*inOut((t-5.52)/2.6),shift:inOut((t-5.72)/2.2)};
}
export function viscoseGeometry(width,height){
 const w=Math.max(1,width),h=Math.max(1,height),narrow=w<=1024,tight=w<=640,fit=clamp(w/VISCOSE.refWidth,.5,1.75);
 return {width:w,height:h,fit,plane:narrow?1.25:1,radius:(narrow?1.3:1)*(tight?.82:1),scale:narrow?4.22:4.46,offset:tight?-3.5:narrow?-2.5:-2};
}
export function viscosePick(state,index){
 if(!state.interactive)return false;state.wheelBounds=null;state.wheelCorridor=null;state.wheelQuiet=0;
 const slot=TAU/state.count,cell=mod(Math.round(index),state.count),base=cell*slot,target=base+Math.round((state.spin-base)/TAU)*TAU;
 state.velocity=0;state.settling=false;
 const distance=Math.abs(target-state.spin)/slot;if(distance<.00001){state.spin=target;state.pick=null;return;}
 state.pick={index:cell,from:state.spin,to:target,elapsed:0,duration:VISCOSE.pickTime*Math.sqrt(Math.max(1,distance))};
}
function wheelBounds(state){
 if(!state.wheelBounds){const slot=TAU/state.count,origin=Math.round((state.spin-state.selected*slot)/TAU)*TAU;state.wheelBounds={min:origin,max:origin+(state.count-1)*slot};}
 return state.wheelBounds;
}
function wheelSettled(state){const slot=TAU/state.count;return !state.pick&&!state.dragging&&state.velocity===0&&Math.abs(state.spin-Math.round(state.spin/slot)*slot)<.0008&&state.announced===state.selected;}
function adjacentCorridor(state,delta){
 const limits=wheelBounds(state),slot=TAU/state.count;
 if(!state.wheelCorridor||wheelSettled(state)){
  const position=(state.spin-limits.min)/slot,anchor=clamp(Math.round(position),0,state.count-1);
  let from=anchor,to=clamp(anchor+Math.sign(delta),0,state.count-1);
  // If a wheel interrupts a deliberate drag/pick, constrain its current pair.
  if(!wheelSettled(state)&&Math.abs(position-anchor)>.0008){from=Math.floor(position);to=Math.ceil(position);}
  state.wheelCorridor={min:clamp(limits.min+Math.min(from,to)*slot,limits.min,limits.max),max:clamp(limits.min+Math.max(from,to)*slot,limits.min,limits.max)};
 }
 return state.wheelCorridor;
}
export function viscoseImpulse(state,delta,{bounded=false,sequential=false}={}){if(!state.interactive)return false;if(bounded){wheelBounds(state);if(sequential)adjacentCorridor(state,delta);else state.wheelCorridor=null;}else{state.wheelBounds=null;state.wheelCorridor=null;}state.wheelQuiet=0;state.pick=null;state.settling=false;state.wheelQuiet=.08;state.velocity=clamp(state.velocity+delta*VISCOSE.scrollSpeed,-VISCOSE.maxSpeed,VISCOSE.maxSpeed);}

function moveSpin(state,dt){
 if(state.pick){const pick=state.pick;pick.elapsed+=dt;state.spin=pick.from+(pick.to-pick.from)*inOut(pick.elapsed/pick.duration);if(pick.elapsed>=pick.duration){state.spin=pick.to;state.pick=null;}return;}
 if(state.dragging)return;
 state.wheelQuiet=Math.max(0,state.wheelQuiet-dt);const limits=state.wheelCorridor||state.wheelBounds;
 state.spin+=state.velocity*dt;if(limits)state.spin=clamp(state.spin,limits.min,limits.max);state.velocity*=Math.pow(VISCOSE.damping,dt*60);
 const slot=TAU/state.count,decay=-Math.log(VISCOSE.damping)*60,rate=4.8/VISCOSE.snapTime;
 if(!state.settling&&state.wheelQuiet<=0&&Math.abs(state.velocity)<Math.max(1,decay*slot*.5)){state.target=Math.round((state.spin+state.velocity/decay)/slot)*slot;if(limits)state.target=clamp(state.target,limits.min,limits.max);state.cap=Math.max(Math.abs(state.velocity),slot*.5*rate);state.settling=true;}
 let gap=0;if(state.settling){gap=state.target-state.spin;const speed=clamp(gap*rate,-state.cap,state.cap);state.velocity+=(speed-state.velocity)*clamp(rate*dt);}
 if(Math.abs(state.velocity)<.0015&&Math.abs(gap)<.0008){state.spin+=gap;state.velocity=0;}
 if(limits&&((state.spin<=limits.min&&state.velocity<0)||(state.spin>=limits.max&&state.velocity>0))){state.velocity=0;state.target=state.spin;state.settling=true;}
}
export function stepViscose(state,width,height,delta=1/60,{reduced=false,engaged=true,launchReady=true}={}){
 const dt=clamp(delta,0,.05),geometry=viscoseGeometry(width,height),p=state.pointer,c=state.cursor;
 if(reduced){state.elapsed=state.entryDuration;state.interactive=true;state.velocity=0;state.pick=null;state.spin=Math.round(state.spin/(TAU/state.count))*(TAU/state.count);}
 if(!state.interactive){if(engaged)state.elapsed=Math.min(state.elapsed+dt,launchReady?state.entryDuration:1.45);if(state.elapsed>=state.entryDuration){state.elapsed=state.entryDuration;state.interactive=true;state.spin=TAU;}}
 else moveSpin(state,dt);
 const entry=viscoseEntry(state.elapsed);if(!state.interactive)state.spin=entry.spin;
 // Preserve source card scale, but adapt its ten-slot arc to the real item count.
 // The focal card remains centered at every responsive width; the intro enters
 // this resting radius continuously rather than jumping on a media breakpoint.
 const g=(1+(geometry.scale-1)*entry.shift)*geometry.fit;
 const correction=smooth((entry.shift-.65)/.35),sourceR=VISCOSE.baseRadius*geometry.radius*g;
 const W=VISCOSE.baseWidth*geometry.plane*g,H=W/1.5,R=sourceR*(1+(state.count/10-1)*correction),sourceCx=geometry.offset*width*.5*entry.shift,cx=sourceCx+(-R*entry.shift-sourceCx)*correction,launch=inOut(entry.launch),slot=TAU/state.count;
 const track=p.inside&&p.seeded&&state.interactive&&!reduced&&(!p.coarse||state.dragging||p.held);
 c.amount+=((track?1:0)-c.amount)*approach(dt,.12);c.x+=(p.x-c.x)*approach(dt,.3);c.y+=(p.y-c.y)*approach(dt,.3);c.wake=Math.max(c.wake*Math.pow(.94,dt*60),clamp(Math.hypot(p.x-c.x,p.y-c.y)/(Math.max(dt,.001)*2600)));
 if(c.amount<.0001)c.amount=0;if(c.wake<.0001)c.wake=0;
 const deform=c.amount>.001&&state.interactive&&!reduced;
 const generation=Math.max(1,Math.abs(signedSlot(state.count-1))),travel=[0],cumulative=[0];
 for(let n=1;n<=generation;n++){travel[n]=smooth((entry.spread-.06-(n-1)/generation*.34)/.6);cumulative[n]=cumulative[n-1]+travel[n];}
 const cards=[],world=[],order=[];let selected=0,nearest=1e9,hovered=-1,responding=false;
 for(let i=0;i<state.count;i++){
  const signed=signedSlot(i),n=Math.abs(signed),birth=i===0?entry.birth:travel[n],angle=Math.sign(signed)*slot*cumulative[n]+state.spin;
  const x=Math.cos(angle)*R*launch+cx,y=Math.sin(angle)*R*launch,cell=mod(-signed,state.count),focusDistance=Math.abs(wrapped(angle));
  if(focusDistance<nearest){nearest=focusDistance;selected=cell;}
  const h=state.hover[i],distance=Math.hypot(c.x-x,c.y-y),reach=Math.max(1,W*1.7),f=deform?smooth((reach-distance)/(reach*.78))*c.amount*birth:0;
  const follow=approach(dt,f>h.f?.14:.06),pull=distance>0?26*geometry.fit*f/distance:0;h.f+=(f-h.f)*follow;h.x+=((c.x-x)*pull-h.x)*follow;h.y+=((c.y-y)*pull-h.y)*follow;
  const side=state.focus.plane>=0&&state.focus.plane!==i&&deform?smooth((W*2.4-Math.hypot(state.focus.x-x,state.focus.y-y))/(W*2.4*.8))*birth:0;
  h.side+=(side-h.side)*approach(dt,side>h.side?.14:.06);const away=Math.hypot(x-state.focus.x,y-state.focus.y),push=away>0?17*geometry.fit*h.side/away:0;
  const wx=x+h.x+(x-state.focus.x)*push,wy=y+h.y+(y-state.focus.y)*push,swell=Math.max(.05,1+.09*h.f-.035*h.side);
  const sx=out(birth/(i===0?.7:.34))*swell,sy=out((birth-(i===0?.18:.06))/(i===0?.74:.36))*swell,rotation=angle*launch;
  const a=Math.cos(rotation),b=Math.sin(rotation),qx=c.x-wx,qy=c.y-wy;
  if(track&&hovered<0&&Math.abs(qx*a+qy*b)<=W*.5*sx&&Math.abs(-qx*b+qy*a)<=H*.5*sy)hovered=i;
  cards.push({plane:i,index:cell,x:width*.5+wx,y:height*.5-wy,rotation:-rotation,scaleX:sx,scaleY:sy,brightness:1-.15*h.side});
  world.push({x:wx,y:wy,restX:x,restY:y,sx,sy,swell});order.push(i);
  if(Math.abs(h.f-f)+Math.abs(h.x)+Math.abs(h.y)+h.side>.002)responding=true;
 }
 state.selected=selected;if(hovered>=0)state.focus={x:world[hovered].restX,y:world[hovered].restY,plane:hovered};else state.focus.plane=-1;
 order.sort((a,b)=>signedSlot(a)-signedSlot(b));const links=[],linkCount=entry.spread>.995?state.count:Math.max(0,state.count-1),finalGap=Math.max(1,2*R*Math.sin(slot/2)-H);
 for(let k=0;k<linkCount;k++){
  const ia=order[k],ib=order[(k+1)%state.count],a=world[ia],b=world[ib],ha=state.hover[ia];
  const separation=Math.hypot(a.restX-b.restX,a.restY-b.restY)-H*.5*(a.sy/a.swell+b.sy/b.swell),gap=clamp(separation/finalGap),midX=(a.x+b.x)*.5,midY=(a.y+b.y)*.5;
  const target=deform?smooth((W*1.15-Math.hypot(c.x-midX,c.y-midY))/(W*1.15*.85))*c.amount:0;
  ha.web+=(target-ha.web)*approach(dt,target>ha.web?.14:.06);
  const end=W*.5*Math.max(Math.pow(1-gap,.4),.2*ha.web)-2.9,mid=end*(1-.65*smooth(gap/.7)),sag=6*g*Math.pow(gap,1.5),fillet=Math.min(14*g*smooth(gap/.35),Math.max(mid,0)*1.5);
  links.push({a:{x:width*.5+a.x,y:height*.5-a.y},b:{x:width*.5+b.x,y:height*.5-b.y},rEnd:end,rMid:mid,sag,fillet});
  if(ha.web>.001)responding=true;
 }
 const showTag=hovered>=0&&!p.coarse&&width>1024&&!reduced,tag=state.tag;
 if(reduced){tag.x=.5;tag.y=0;tag.shown=false;tag.tween=null;}
 else{
  if(showTag!==tag.shown){tag.shown=showTag;tag.tween={show:showTag,elapsed:0,x:tag.x,y:tag.y};}
  if(tag.tween){const tween=tag.tween;tween.elapsed+=dt;if(tween.show){tag.x=tween.x+(1-tween.x)*elastic(tween.elapsed/.62,.5);tag.y=tween.y+(1-tween.y)*elastic(tween.elapsed/.74,.42);if(tween.elapsed>=.74){tag.x=tag.y=1;tag.tween=null;}}else{const ease=Math.pow(clamp(tween.elapsed/.28),4);tag.x=tween.x+(.5-tween.x)*ease;tag.y=tween.y*(1-ease);if(tween.elapsed>=.28){tag.x=.5;tag.y=0;tag.tween=null;}}}
 }
 const frame={width,height,cardWidth:W,cardHeight:H,cornerRadius:6*geometry.plane*g,cards,links,selected,hovered:hovered<0?-1:cards[hovered].index,spin:state.spin,interactive:state.interactive,entryElapsed:state.elapsed,entryProgress:clamp(state.elapsed/state.entryDuration),centre:{x:width*.5+cx,y:height*.5},pointer:{x:c.x,y:c.y,amount:c.amount,melt:34*geometry.fit,reach:260*geometry.fit,wave:4*geometry.fit*c.wake*c.amount},tag:{x:c.x+64,y:c.y-38,sx:state.tag.x,sy:state.tag.y},union:35*geometry.plane*geometry.fit,blend:Math.max(.5,14*geometry.plane*g),birthNoise:3*geometry.fit*(1-smooth((entry.birth-.2)/.75)),moving:!state.interactive||state.dragging||!!state.pick||!!state.tag.tween||Math.abs(state.velocity)>.0001||responding||c.amount>.001||c.wake>.001};
 state.frame=frame;return frame;
}

// Hit the visible rotated photograph at release, not a previous RAF's hover.
function cardAtPoint(frame,x,y){
 if(!frame)return -1;
 for(const card of frame.cards){
  if(card.scaleX<.01||card.scaleY<.01)continue;
  const dx=x-card.x,dy=y-card.y,c=Math.cos(card.rotation),s=Math.sin(card.rotation),qx=Math.abs(dx*c+dy*s),qy=Math.abs(-dx*s+dy*c),hw=frame.cardWidth*card.scaleX*.5,hh=frame.cardHeight*card.scaleY*.5,r=Math.min(frame.cornerRadius*Math.min(card.scaleX,card.scaleY),hw,hh);
  if(qx>hw||qy>hh)continue;
  if(Math.hypot(Math.max(0,qx-hw+r),Math.max(0,qy-hh+r))<=r)return card.index;
 }
 return -1;
}

function defaultImage(src,signal,win){return new Promise((resolve,reject)=>{const image=new win.Image();let finished=false;const done=(error)=>{if(finished)return;finished=true;image.onload=image.onerror=null;signal?.removeEventListener('abort',abort);error?reject(error):resolve(image);};const abort=()=>{image.src='';done(new Error('Image load aborted'));};image.decoding='async';image.onload=()=>done();image.onerror=()=>done(new Error('Institution photograph unavailable'));signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();else image.src=src;});}
function runtimeTypes(T){
 const probe=new T.SphereGeometry(1,3,2),Geometry=T.BufferGeometry||Object.getPrototypeOf(T.SphereGeometry.prototype).constructor,Attribute=T.Float32BufferAttribute||probe.attributes.position.constructor;probe.dispose();
 if(T.CanvasTexture)return {Geometry,Attribute,Texture:T.CanvasTexture};
 const cube=new T.WebGLCubeRenderTarget(1),Texture=Object.getPrototypeOf(cube.texture.constructor);cube.dispose();return {Geometry,Attribute,Texture};
}
// Higher density is restricted to touch-first devices. These are base RGBA
// atlas/drawing-buffer budgets, not an estimate of total driver/MSAA memory.
export function viscoseResourceQuality({width=1,height=1,devicePixelRatio=1,mobile=false,count=8,maxTextureSize=4096}={}){
 const positive=(value,fallback)=>Number.isFinite(Number(value))&&Number(value)>0?Number(value):fallback;
 const w=positive(width,1),h=positive(height,1),dpr=positive(devicePixelRatio,1),n=Math.max(1,Math.min(8,Math.round(positive(count,8))));
 const cols=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/cols),maxTexture=Math.max(1,Math.floor(positive(maxTextureSize,4096)));
 const pixelBudget=1500000,atlasBudget=24*1024*1024;
 const pixelRatio=mobile?Math.min(dpr,3,Math.sqrt(pixelBudget/(w*h))):Math.min(1.5,dpr);
 const geometry=viscoseGeometry(w,h),focalWidth=VISCOSE.baseWidth*geometry.plane*geometry.scale*geometry.fit;
 const desiredCell=mobile?(focalWidth*pixelRatio*1.2>768?1024:768):512;
 let cellWidth=Math.max(1,Math.min(desiredCell,Math.floor(maxTexture/cols))),cellHeight=mobile?Math.max(1,Math.floor(cellWidth/1.5)):Math.round(cellWidth/1.5);
 if(mobile)while(cellWidth>1&&(cellHeight*rows>maxTexture||cellWidth*cols*cellHeight*rows*4>atlasBudget)){cellWidth--;cellHeight=Math.max(1,Math.floor(cellWidth/1.5));}
 return {pixelRatio,cols,rows,cellWidth,cellHeight,atlasWidth:cellWidth*cols,atlasHeight:cellHeight*rows,atlasBytes:cellWidth*cols*cellHeight*rows*4,bufferPixels:Math.floor(w*pixelRatio)*Math.floor(h*pixelRatio),pixelBudget,atlasBudget};
}
function createGPU(canvas,T,doc,win,files,onImage){
 const types=runtimeTypes(T),renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
 const mobile=usesNativeTouchScroll(win),maxTexture=renderer.capabilities?.maxTextureSize||4096,rect=canvas.getBoundingClientRect?.();
 const qualityFor=(width,height)=>viscoseResourceQuality({width,height,devicePixelRatio:win.devicePixelRatio,mobile,count:files.length,maxTextureSize:maxTexture});
 const quality=qualityFor(rect?.width||canvas.clientWidth||win.innerWidth||1,rect?.height||canvas.clientHeight||win.innerHeight||1);
 let pixelRatio=quality.pixelRatio;renderer.setPixelRatio(pixelRatio);renderer.setClearColor?.(0,0);
 const {cols,rows,cellWidth,cellHeight}=quality;
 const atlas=doc.createElement('canvas');atlas.width=cols*cellWidth;atlas.height=rows*cellHeight;const ctx=atlas.getContext('2d');if(!ctx){renderer.dispose();throw Error('Atlas canvas unavailable');}ctx.fillStyle='#542a37';ctx.fillRect(0,0,atlas.width,atlas.height);
 const texture=new types.Texture(atlas);texture.flipY=false;texture.encoding=3000;texture.wrapS=texture.wrapT=1001;texture.minFilter=texture.magFilter=1006;texture.generateMipmaps=false;texture.needsUpdate=true;
 const tagCanvas=doc.createElement('canvas');tagCanvas.width=208;tagCanvas.height=80;const tagContext=tagCanvas.getContext('2d');if(tagContext){tagContext.scale(2,2);tagContext.font='500 14px Roobert,Arial,sans-serif';tagContext.textAlign='center';tagContext.textBaseline='middle';tagContext.fillStyle='#fff';tagContext.fillText('Focar ↗',52,20);}
 const tagTexture=new types.Texture(tagCanvas);tagTexture.generateMipmaps=false;tagTexture.minFilter=tagTexture.magFilter=1006;tagTexture.needsUpdate=true;
 const v2=()=>new T.Vector2(),v4=()=>new T.Vector4();
 const uniforms={uResolution:{value:v2()},uSize:{value:v2()},uGrid:{value:new T.Vector2(cols,rows)},uPositions:{value:Array.from({length:8},v2)},uLinkA:{value:Array.from({length:8},v2)},uLinkB:{value:Array.from({length:8},v2)},uCards:{value:Array.from({length:8},v4)},uLinks:{value:Array.from({length:8},v4)},uAngles:{value:new Float32Array(8)},uCount:{value:files.length},uLinkCount:{value:0},uCorner:{value:0},uUnion:{value:0},uBlend:{value:1},uTime:{value:0},uBirth:{value:0},uTextured:{value:0},uPointer:{value:v4()},uWake:{value:v4()},uGlass:{value:new T.Vector4(60,.05,5,.05)},uTag:{value:v4()},uInk:{value:new T.Vector3(.329,.165,.216)},uPage:{value:new T.Vector3(.086,.055,.071)},uAtlas:{value:texture},uTagMap:{value:tagTexture}};
 const geometry=new types.Geometry();geometry.setAttribute('position',new types.Attribute([-1,-1,0,1,-1,0,1,1,0,-1,-1,0,1,1,0,-1,1,0],3));geometry.setAttribute('uv',new types.Attribute([0,0,1,0,1,1,0,0,1,1,0,1],2));
 const material=new T.ShaderMaterial({vertexShader:viscoseVertex,fragmentShader:viscoseFragment,uniforms,transparent:true,depthWrite:false,depthTest:false,extensions:{derivatives:true}}),mesh=new T.Mesh(geometry,material),scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.01,10);mesh.frustumCulled=false;scene.add(mesh);
 let disposed=false,loaded=0,lastW=0,lastH=0;
 return {get loaded(){return loaded;},get atlasBytes(){return atlas.width*atlas.height*4;},get resourceQuality(){return {...quality,mobile,pixelRatio,width:lastW,height:lastH,bufferPixels:Math.floor(lastW*pixelRatio)*Math.floor(lastH*pixelRatio)};},paint(image,index){if(disposed)return;const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height;if(!(w>0&&h>0))throw Error('Invalid institution image');const scale=Math.max(cellWidth/w,cellHeight/h),dw=w*scale,dh=h*scale,x=index%cols*cellWidth,y=Math.floor(index/cols)*cellHeight,focus=clamp(files[index].focalY??.5),dy=(cellHeight-dh)*focus;ctx.save();ctx.beginPath();ctx.rect(x,y,cellWidth,cellHeight);ctx.clip();ctx.drawImage(image,x+(cellWidth-dw)*.5,y+dy,dw,dh);ctx.restore();loaded++;texture.needsUpdate=true;onImage();},draw(frame,time){if(disposed||loaded<files.length)return false;const {width:w,height:h}=frame;if(w!==lastW||h!==lastH){if(mobile){const nextRatio=qualityFor(w,h).pixelRatio;if(Math.abs(nextRatio-pixelRatio)>.0001){pixelRatio=nextRatio;renderer.setPixelRatio(pixelRatio);}}renderer.setSize(w,h,false);lastW=w;lastH=h;}uniforms.uResolution.value.set(w,h);uniforms.uSize.value.set(frame.cardWidth,frame.cardHeight);uniforms.uCorner.value=frame.cornerRadius;uniforms.uUnion.value=frame.union;uniforms.uBlend.value=frame.blend;uniforms.uBirth.value=frame.birthNoise;uniforms.uTime.value=time;uniforms.uTextured.value=1;uniforms.uLinkCount.value=frame.links.length;
  for(let i=0;i<8;i++){const c=frame.cards[i];if(c){uniforms.uPositions.value[i].set(c.x-w*.5,h*.5-c.y);uniforms.uAngles.value[i]=-c.rotation;uniforms.uCards.value[i].set(c.scaleX,c.scaleY,c.brightness,c.index);}else uniforms.uCards.value[i].set(0,0,1,0);const l=frame.links[i];if(l){uniforms.uLinkA.value[i].set(l.a.x-w*.5,h*.5-l.a.y);uniforms.uLinkB.value[i].set(l.b.x-w*.5,h*.5-l.b.y);uniforms.uLinks.value[i].set(l.rEnd,l.rMid,l.sag,l.fillet);}else uniforms.uLinks.value[i].set(-100,-100,0,0);}
  const p=frame.pointer,t=frame.tag;uniforms.uPointer.value.set(p.x,p.y,p.amount,p.melt);uniforms.uWake.value.set(p.reach,p.wave,.05,7);uniforms.uTag.value.set(t.x,t.y,t.sx,t.sy);renderer.render(scene,camera);const gl=renderer.getContext?.();if(gl?.isContextLost?.())throw Error('WebGL context lost');const programs=renderer.info?.programs||[];if(programs.some(p=>p.diagnostics?.runnable===false))throw Error('SDF shader compilation unavailable');return true;},dispose({loseContext=true}={}){if(disposed)return;disposed=true;uniforms.uAtlas.value=uniforms.uTagMap.value=null;texture.dispose();tagTexture.dispose();texture.image=tagTexture.image=null;geometry.dispose();material.dispose();scene.clear?.();renderer.dispose();if(loseContext)renderer.forceContextLoss?.();atlas.width=atlas.height=tagCanvas.width=tagCanvas.height=1;}};
}

/** Scoped enhancement. The very same model paints the DOM arc and the SDF canvas. */
export function createViscoseEngine(surface,options={}){
 const win=options.window||globalThis.window,doc=options.document||globalThis.document,canvas=options.canvas||surface?.querySelector?.('canvas'),files=(options.files||[]).slice(0,8).map(file=>typeof file==='string'?{src:file}:file);
 const state=createViscoseState(files.length||8,{intro:options.intro!==false,introDuration:options.introDuration});
 const cleanups=[],request=fn=>win.requestAnimationFrame(fn),cancel=id=>win.cancelAnimationFrame(id),on=(target,name,fn,opts)=>{target?.addEventListener?.(name,fn,opts);cleanups.push(()=>target?.removeEventListener?.(name,fn,opts));};
 const media=win.matchMedia?.('(prefers-reduced-motion: reduce)');let reduced=!!media?.matches,disposed=false,external=true,engaged=options.engaged!==false,pageVisible=true,intersecting=true,frameId=0,lastTime=0,clock=0,gpu=null,gpuGeneration=0,gpuLoading=false,gpuFailed=false,mode='fallback',ready=false,drag=null,bounds={left:0,top:0,width:1,height:1},abort=null,observer,resizeObserver,generation=0,loadTimer=0,touchHoldTimer=0,decision=canvas&&files.length?'pending':'fallback';
 const visible=()=>!disposed&&external&&pageVisible&&intersecting&&!doc.hidden&&doc.visibilityState!=='hidden';
 const diagnostic={phase:'idle',loaded:0,total:files.length,attempt:0,runtimeRevision:null,error:null,contextLost:false,imageErrors:[],lastDisposeReason:null,lastDisposeGeneration:null,contextLoss:null};let diagnosticStart=null,diagnosticEnd=null;
 const diagnosticNow=()=>win.performance?.now?.()??Date.now();
 function diagnosticSnapshot(){return {...diagnostic,error:diagnostic.error?{...diagnostic.error}:null,imageErrors:diagnostic.imageErrors.map(error=>({...error})),contextLoss:diagnostic.contextLoss?{...diagnostic.contextLoss}:null,generation,elapsedMs:diagnosticStart===null?0:Math.max(0,(diagnosticEnd??diagnosticNow())-diagnosticStart),mode,visible:visible(),engaged,disposed};}
 function notifyDiagnostic(){if(options.onDiagnostic)try{options.onDiagnostic(diagnosticSnapshot());}catch{/* A support observer must not affect the experience. */}}
 function diagnosticPhase(phase,patch={},finished=false){Object.assign(diagnostic,patch,{phase});if(finished&&diagnosticEnd===null&&diagnosticStart!==null)diagnosticEnd=diagnosticNow();notifyDiagnostic();}
 function markDisposal(reason){if(!gpu)return;diagnostic.lastDisposeReason=reason;diagnostic.lastDisposeGeneration=generation;notifyDiagnostic();}
 const errorRecord=error=>({name:String(error?.name||'Error'),message:String(error?.message??error??'WebGL unavailable')});
 const interactive=()=>visible()&&!reduced&&state.interactive;
 const clearLoadTimer=()=>{if(loadTimer)(win.clearTimeout||globalThis.clearTimeout)(loadTimer);loadTimer=0;};
 function updateBounds(){if(disposed)return;const rect=surface.getBoundingClientRect();bounds={left:rect.left,top:rect.top,width:Math.max(1,rect.width||surface.clientWidth||1),height:Math.max(1,rect.height||surface.clientHeight||1)};
  const p=state.pointer;if(p.seeded&&Number.isFinite(p.clientX)&&Number.isFinite(p.clientY)){const x=p.clientX-bounds.left-bounds.width*.5,y=bounds.height*.5-(p.clientY-bounds.top);state.cursor.x+=x-p.x;state.cursor.y+=y-p.y;p.x=x;p.y=y;p.inside=!!drag?.owned||insideBounds(p.clientX,p.clientY);}
 }
 function insideBounds(x,y){return x>=bounds.left&&x<=bounds.left+bounds.width&&y>=bounds.top&&y<=bounds.top+bounds.height;}
 function announce(frame){if(frame.interactive&&!state.dragging&&!state.pick&&state.velocity===0&&frame.selected!==state.announced){state.announced=frame.selected;options.onSelection?.(frame.selected);}}
 function draw(dt=0){const frame=stepViscose(state,bounds.width,bounds.height,dt,{reduced,engaged,launchReady:decision!=='pending'});options.onPose?.(frame);announce(frame);if(!ready&&frame.cards.some(card=>card.scaleX>.01&&card.scaleY>.01)){ready=true;options.onReady?.({mode});}if(gpu&&visible()){try{if(gpu.draw(frame,clock)&&mode!=='webgl'){mode='webgl';decision='webgl';clearLoadTimer();diagnosticPhase('ready',{},true);options.onMode?.('webgl');options.onReady?.({mode:'webgl'});}}catch(error){fallback(error);}}return frame;}
 function tick(time){frameId=0;if(!visible())return;const dt=lastTime?Math.min(.05,Math.max(0,(time-lastTime)/1000)):1/60;lastTime=time;clock+=dt;const frame=draw(dt);if(frame.moving&&!reduced&&(state.interactive||(engaged&&(state.elapsed<1.45||decision!=='pending'))))schedule();}
 function schedule(){if(visible()&&!frameId)frameId=request(tick);}
 function stop(){if(frameId)cancel(frameId);frameId=0;lastTime=0;}
 function fallback(error){if(disposed)return;const recorded=errorRecord(error);decision='fallback';clearLoadTimer();gpuFailed=true;gpuLoading=false;abort?.abort();abort=null;markDisposal('fallback');gpu?.dispose();gpu=null;mode='fallback';diagnosticPhase('fallback',{error:diagnostic.error||recorded,contextLost:diagnostic.contextLost||recorded.message==='WebGL context lost'},true);if(canvas?.style)canvas.style.opacity='0';options.onMode?.('fallback');options.onFallback?.(error instanceof Error?error:new Error(String(error||'WebGL unavailable')));schedule();}
 async function startGPU(){
  if(gpu||gpuLoading||gpuFailed||!visible()||reduced||!canvas||!files.length)return;
  gpuLoading=true;const token=++generation,job=new AbortController();abort=job;diagnosticStart=diagnosticNow();diagnosticEnd=null;diagnosticPhase('runtime',{attempt:diagnostic.attempt+1,loaded:0,runtimeRevision:null,error:null,contextLost:false,imageErrors:[],contextLoss:null});clearLoadTimer();loadTimer=(win.setTimeout||globalThis.setTimeout)(()=>{loadTimer=0;if(!disposed&&token===generation&&visible()&&decision==='pending')fallback(Error('Gallery image preparation timed out; the DOM gallery remains available'));},6500);
  try{const T=await(options.loadRuntime?options.loadRuntime():import('./vendor/three-scene.js'));if(disposed||token!==generation||job.signal.aborted||!visible()||reduced){if(token===generation&&abort===job)gpuLoading=false;return;}
   diagnosticPhase('context',{runtimeRevision:String(T.REVISION||'unknown')});gpu=createGPU(canvas,T,doc,win,files,schedule);gpuGeneration=token;diagnosticPhase('images');let cursor=0,success=0;const load=options.loadImage||((src,signal)=>defaultImage(src,signal,win));
   const worker=async()=>{while(cursor<files.length&&!job.signal.aborted&&!disposed){const index=cursor++;try{const image=await load(files[index].src,job.signal);if(job.signal.aborted||disposed||token!==generation)return;gpu?.paint(image,index);success++;diagnosticPhase('images',{loaded:success});}catch(error){if(job.signal.aborted)return;diagnostic.imageErrors.push({index,...errorRecord(error)});notifyDiagnostic();options.onImageError?.(index,error);}}};
   await Promise.all([worker(),worker()]);if(disposed||token!==generation||job.signal.aborted)return;if(success<files.length)throw Error('Some institution photographs are unavailable; the DOM gallery remains visible');gpuLoading=false;schedule();
  }catch(error){if(!disposed&&token===generation&&!job.signal.aborted)fallback(error);}
 }
 // A temporary cancellation must not lose the reusable canvas context. Stale
 // loss events are ignored unless they belong to a current owned GPU attempt.
 function cancelPending(reason='offscreen-cancel'){clearLoadTimer();if(!gpuLoading)return;generation++;abort?.abort();abort=null;gpuLoading=false;if(gpu){markDisposal(reason);gpu.dispose({loseContext:false});gpu=null;mode='fallback';options.onMode?.('fallback');}}
 function sync(){if(!visible()){stop();cancelGesture();cancelPending();if(diagnostic.phase!=='paused')diagnosticPhase('paused',{},true);return;}if(diagnostic.phase==='paused')diagnosticPhase(gpu?(mode==='webgl'?'ready':'images'):gpuFailed?'fallback':'idle');updateBounds();schedule();void startGPU();}
 function pick(index){if(disposed||!state.interactive)return;cancelGesture();viscosePick(state,index);if(reduced){state.spin=mod(Math.round(index),state.count)*TAU/state.count;state.pick=null;}schedule();}
 function step(direction,event){if(disposed||!visible()||!state.interactive||!wheelSettled(state))return false;const sign=Math.sign(direction);if(!sign)return false;const index=state.selected+sign;if(index<0||index>=state.count){options.onWheelExit?.(sign,event);return false;}pick(index);return true;}
 function track(event){const p=state.pointer;p.clientX=event.clientX;p.clientY=event.clientY;p.coarse=event.pointerType==='touch';p.x=event.clientX-bounds.left-bounds.width*.5;p.y=bounds.height*.5-(event.clientY-bounds.top);p.inside=true;if(!p.seeded){p.seeded=true;state.cursor.x=p.x;state.cursor.y=p.y;}}
 function pointerAngle(x,y){const centre=state.frame?.centre||{x:bounds.width*.5,y:bounds.height*.5};return Math.atan2(-(y-bounds.top-centre.y),x-bounds.left-centre.x);}
 function excluded(event){return !!event.target?.closest?.('a,button,input,select,textarea,summary,[contenteditable="true"],[data-viscose-controls]');}
 function clearTouchHold(){if(touchHoldTimer)(win.clearTimeout||globalThis.clearTimeout)(touchHoldTimer);touchHoldTimer=0;state.pointer.held=false;}
 function cancelGesture(){clearTouchHold();if(!drag)return;const old=drag;drag=null;state.dragging=false;state.velocity=0;state.settling=false;try{if(surface.hasPointerCapture?.(old.id))surface.releasePointerCapture(old.id);}catch{}delete surface.dataset.viscoseDragging;}
 function down(event){if(event.isPrimary===false){cancelGesture();schedule();return;}if(!interactive()||excluded(event)||drag||(event.pointerType!=='touch'&&event.button!==0))return;updateBounds();track(event);const touch=event.pointerType==='touch';drag={id:event.pointerId,touch,owned:!touch,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,angle:pointerAngle(event.clientX,event.clientY),time:Number(event.timeStamp)||0,travel:0};if(touch){clearTouchHold();touchHoldTimer=(win.setTimeout||globalThis.setTimeout)(()=>{touchHoldTimer=0;if(drag?.touch&&!drag.owned&&interactive()){state.pointer.held=true;schedule();}},160);return;}state.wheelBounds=null;state.wheelCorridor=null;state.wheelQuiet=0;state.pick=null;state.settling=false;state.velocity=0;state.dragging=true;try{surface.setPointerCapture(event.pointerId);}catch{drag=null;state.dragging=false;return;}surface.dataset.viscoseDragging='true';event.preventDefault?.();schedule();}
 function claimTouch(x,y){if(!drag?.touch||drag.owned)return;const dx=x-drag.startX,dy=y-drag.startY;if(Math.hypot(dx,dy)<9)return;if(Math.abs(dy)>=Math.abs(dx)*.85){cancelGesture();return;}clearTouchHold();drag.owned=true;state.wheelBounds=null;state.wheelCorridor=null;state.wheelQuiet=0;state.pick=null;state.velocity=0;state.settling=false;state.dragging=true;try{surface.setPointerCapture(drag.id);}catch{cancelGesture();return;}surface.dataset.viscoseDragging='true';}
 function move(event){if(!interactive())return;track(event);if(!drag){schedule();return;}if(event.pointerId!==drag.id)return;if(!drag.touch&&event.buttons!==undefined&&!(event.buttons&1)){cancelGesture();schedule();return;}if(drag.touch){claimTouch(event.clientX,event.clientY);if(!drag||!drag.owned)return;}event.preventDefault?.();const angle=pointerAngle(event.clientX,event.clientY),dx=event.clientX-drag.x,dy=event.clientY-drag.y,turn=drag.touch?-dx/Math.max(240,bounds.width)*Math.PI:wrapped(angle-drag.angle),now=Number(event.timeStamp)||drag.time+16,dt=Math.max(8,now-drag.time)/1000;state.spin+=turn;state.velocity=clamp(turn/dt,-VISCOSE.maxSpeed,VISCOSE.maxSpeed);drag.travel+=Math.abs(dx)+Math.abs(dy);drag.x=event.clientX;drag.y=event.clientY;drag.angle=angle;drag.time=now;schedule();}
 function up(event){if(!drag||event.pointerId!==drag.id)return;track(event);const ended=drag;clearTouchHold();drag=null;state.dragging=false;try{if(surface.hasPointerCapture?.(ended.id))surface.releasePointerCapture(ended.id);}catch{}delete surface.dataset.viscoseDragging;state.pointer.inside=!ended.touch&&insideBounds(event.clientX,event.clientY);if(!ended.owned){schedule();return;}if(ended.travel<5){state.velocity=0;const selected=cardAtPoint(state.frame,event.clientX-bounds.left,event.clientY-bounds.top);if(selected>=0)pick(selected);}schedule();}
 on(surface,'pointerdown',down);on(surface,'pointermove',move);on(surface,'pointerup',up);on(surface,'pointerleave',event=>{if(Number.isFinite(event.clientX)&&Number.isFinite(event.clientY))track(event);state.pointer.inside=!!drag?.owned;schedule();});on(surface,'pointercancel',event=>{if(event.pointerId===drag?.id){cancelGesture();state.pointer.inside=false;schedule();}});on(surface,'lostpointercapture',event=>{if(event.pointerId===drag?.id){cancelGesture();schedule();}});
 on(surface,'touchmove',event=>{if(!drag?.touch)return;if(event.touches?.length!==1){cancelGesture();schedule();return;}claimTouch(event.touches[0].clientX,event.touches[0].clientY);if(drag?.owned){event.stopPropagation?.();if(event.cancelable!==false)event.preventDefault?.();}},{passive:false});
 // Capture before Locomotive; viewport ownership is explicit and temporary.
 on(doc,'wheel',event=>{
  const owned=!!options.wheelOwned?.();
  if(options.wheelEnabled?.()===false)return;
  if(!visible()||!engaged||reduced||event.ctrlKey||event.metaKey||event.target?.isContentEditable||event.target?.closest?.('input,select,textarea,[contenteditable=""],[contenteditable="true"],[contenteditable="plaintext-only"]'))return;
  if(!owned&&(!surface.contains?.(event.target)||event.target?.closest?.('a,summary')))return;
  const delta=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;if(!Number.isFinite(delta)||Math.abs(delta)<1)return;
  if(state.interactive){const limits=wheelBounds(state),idle=owned?wheelSettled(state):!state.pick&&Math.abs(state.velocity)<.02;if(idle&&((delta<0&&state.spin<=limits.min+.001)||(delta>0&&state.spin>=limits.max-.001))){cancelGesture();options.onWheelExit?.(Math.sign(delta),event);return;}}
  event.preventDefault?.();event.stopPropagation?.();cancelGesture();options.onWheelConsume?.(event);
  if(state.interactive&&engaged&&visible())viscoseImpulse(state,delta,{bounded:true,sequential:owned});schedule();
 },{passive:false,capture:true});
 on(surface,'keydown',event=>{if(excluded(event)||!state.interactive)return;let index;if(event.key==='ArrowRight'||event.key==='ArrowDown')index=state.selected+1;if(event.key==='ArrowLeft'||event.key==='ArrowUp')index=state.selected-1;if(event.key==='Home')index=0;if(event.key==='End')index=state.count-1;if(index===undefined)return;event.preventDefault?.();event.stopPropagation?.();pick(index);});
 on(win,'blur',()=>{cancelGesture();state.pointer.inside=false;schedule();});on(win,'resize',()=>{cancelGesture();updateBounds();schedule();});on(win,'pagehide',()=>{pageVisible=false;sync();});on(win,'pageshow',()=>{pageVisible=true;sync();});on(doc,'visibilitychange',sync);on(media,'change',()=>{reduced=!!media.matches;cancelGesture();if(reduced){cancelPending('reduced-motion');state.pointer.inside=false;}sync();});on(canvas,'webglcontextlost',event=>{event.preventDefault?.();if(disposed||!gpu||gpuFailed||gpuGeneration!==generation)return;diagnostic.contextLoss={generation,lastDisposeReason:diagnostic.lastDisposeReason,lastDisposeGeneration:diagnostic.lastDisposeGeneration};fallback(Error('WebGL context lost'));});
 const initialRect=surface.getBoundingClientRect();intersecting=initialRect.bottom>-100&&initialRect.top<(win.innerHeight||1000)+100;
 if(win.IntersectionObserver){observer=new win.IntersectionObserver(entries=>{intersecting=!!entries[0]?.isIntersecting;sync();},{rootMargin:'100px'});observer.observe(surface);}else{const rect=surface.getBoundingClientRect();intersecting=rect.bottom>-100&&rect.top<(win.innerHeight||1000)+100;}
 if(win.ResizeObserver){resizeObserver=new win.ResizeObserver(()=>{updateBounds();schedule();});resizeObserver.observe(surface);}
 notifyDiagnostic();updateBounds();draw(0);sync();
 return {pick,step,next:(delta=1)=>pick((state.pick?.index??state.selected)+delta),setVisible(value){external=!!value;sync();},setEngaged(value){const next=!!value;if(next===engaged)return;engaged=next;if(!engaged){cancelGesture();state.wheelBounds=null;state.wheelCorridor=null;}lastTime=0;sync();},updateBounds,resize(){cancelGesture();updateBounds();schedule();},dispose(){if(disposed)return;cancelGesture();disposed=true;generation++;stop();clearLoadTimer();abort?.abort();markDisposal('dispose');gpu?.dispose();gpu=null;observer?.disconnect();resizeObserver?.disconnect();cleanups.splice(0).forEach(fn=>fn());diagnosticPhase('paused',{},true);},get mode(){return mode;},get index(){return state.selected;},get debug(){return {state,gpuLoading,engaged,decision,diagnostic:diagnosticSnapshot(),visible:visible(),disposed,pendingFrame:!!frameId,atlasBytes:gpu?.atlasBytes||0};}};
}
