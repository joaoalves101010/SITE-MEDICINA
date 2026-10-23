/** Independent second-fold globe. Orthographic spherical rotation; no hero/global state. */
export const GLOBE_VIEW = Object.freeze({ longitude: -64, latitude: 10, roll: -7 });
export const ROTATION_DEGREES_PER_SECOND = 2;
export const MAX_LATITUDE = 60;
export const INERTIA_DAMPING = 3.8;
const RAD = Math.PI / 180;
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
const wrap = value => ((value+180)%360+360)%360-180;

/** Exact exponential integration: independent of frame rate, including the return to autorotation. */
export function advanceGlobeMotion(state, deltaMs, targetSpeed=ROTATION_DEGREES_PER_SECOND) {
  const dt=clamp(Number(deltaMs)||0,0,100)/1000, decay=Math.exp(-INERTIA_DAMPING*dt);
  const vx=Number(state.velocityX)||0, vy=Number(state.velocityY)||0;
  const longitude=wrap(state.longitude+targetSpeed*dt+(vx-targetSpeed)*(1-decay)/INERTIA_DAMPING);
  const rawLatitude=state.latitude+vy*(1-decay)/INERTIA_DAMPING;
  return {longitude,latitude:clamp(rawLatitude,-MAX_LATITUDE,MAX_LATITUDE),
    velocityX:targetSpeed+(vx-targetSpeed)*decay,
    velocityY:Math.abs(rawLatitude)>=MAX_LATITUDE?0:vy*decay};
}
const ASSETS = new URL('../assets/science-globe/', import.meta.url);

export function geographicVector(longitude, latitude) {
  const lon = longitude * RAD, lat = latitude * RAD, cos = Math.cos(lat);
  return [cos * Math.sin(lon), Math.sin(lat), cos * Math.cos(lon)];
}
export function projectionMatrix(view = GLOBE_VIEW) {
  const a = view.longitude * RAD, b = view.latitude * RAD, c = view.roll * RAD;
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
  return [cc*ca+sc*sb*sa, -sc*cb, -cc*sa+sc*sb*ca,
    sc*ca-cc*sb*sa, cc*cb, -sc*sa-cc*sb*ca,
    cb*sa, sb, cb*ca];
}
export function projectVector(vector, matrix) {
  const [x,y,z] = vector;
  const px=matrix[0]*x+matrix[1]*y+matrix[2]*z;
  const py=matrix[3]*x+matrix[4]*y+matrix[5]*z;
  const pz=matrix[6]*x+matrix[7]*y+matrix[8]*z;
  return { x:px, y:py, z:pz, visible:pz>=0 };
}
export function projectPoint(longitude, latitude, view = GLOBE_VIEW) {
  return projectVector(geographicVector(longitude, latitude), projectionMatrix(view));
}
export function shouldAnimate({ visible=true, documentHidden=false, reducedMotion=false, userPaused=false, disposed=false } = {}) {
  return visible && !documentHidden && !reducedMotion && !userPaused && !disposed;
}
export function advanceLongitude(longitude, deltaMs, speed=ROTATION_DEGREES_PER_SECOND) {
  const delta = Math.max(0, Math.min(Number(deltaMs)||0, 100));
  return ((longitude + delta * speed / 1000 + 180) % 360 + 360) % 360 - 180;
}
export function clipSegment(a, b) {
  if (a.z < 0 && b.z < 0) return null;
  if (a.z >= 0 && b.z >= 0) return [a,b];
  const t=a.z/(a.z-b.z), x=a.x+(b.x-a.x)*t, y=a.y+(b.y-a.y)*t;
  const length=Math.hypot(x,y)||1, edge={x:x/length,y:y/length,z:0,visible:true};
  return a.z>=0 ? [a,edge] : [edge,b];
}
export function graticuleLines() {
  const result=[];
  for(let lon=-180;lon<180;lon+=15){const line=[];for(let lat=-90;lat<=90;lat+=2)line.push([lon,lat]);result.push(line);}
  for(let lat=-75;lat<=75;lat+=15){const line=[];for(let lon=-180;lon<=180;lon+=2)line.push([lon,lat]);result.push(line);}
  return result;
}

/** root is [data-science-globe], or a container containing it. No markup replacement. */
export async function initScienceGlobe(root, options={}) {
  const doc=typeof document==='undefined'?null:document;
  const win=typeof window==='undefined'?null:window;
  root=root || doc;
  const host=root?.matches?.('[data-science-globe]')?root:root?.querySelector?.('[data-science-globe]');
  let disposed=false, visible=true, inViewport=true, userPaused=false, raf=0, observer, resizeObserver;
  let ready=false, width=0, height=0, longitude=GLOBE_VIEW.longitude, latitude=GLOBE_VIEW.latitude, last=null, lastDraw=0;
  let velocityX=ROTATION_DEGREES_PER_SECOND, velocityY=0, pointer=null, manualRaf=0;
  let fetchTimer=0, abort, ctx, data, motion;
  const cleanups=[];
  const canvas=host?.querySelector?.('[data-globe-canvas]');
  const fallback=host?.querySelector?.('[data-globe-fallback]');
  const toggle=host?.querySelector?.('[data-globe-toggle]');
  const controller={
    get state(){return disposed?'disposed':ready?'ready':'fallback';},
    get view(){return {longitude,latitude,roll:GLOBE_VIEW.roll};},
    get interaction(){return {dragging:pointer?.intent==='owned',pointerType:pointer?.type||null,userPaused,reducedMotion:!!motion?.matches,velocityX,velocityY};},
    dispose(){if(disposed)return;disposed=true;cancelGesture();stop();cancelManualDraw();clearTimeout(fetchTimer);abort?.abort();observer?.disconnect();resizeObserver?.disconnect();cleanups.splice(0).forEach(fn=>fn());},
    setVisible(value){visible=!!value;if(!visible)cancelGesture();sync();},
  };
  function listen(target,type,handler,opts){target?.addEventListener?.(type,handler,opts);cleanups.push(()=>target?.removeEventListener?.(type,handler,opts));}
  function stop(){if(raf&&win)win.cancelAnimationFrame(raf);raf=0;last=null;lastDraw=0;}
  function allowed(){return pointer?.intent!=='owned'&&ready&&shouldAnimate({visible:visible&&inViewport,documentHidden:!!doc?.hidden,reducedMotion:!!motion?.matches,userPaused,disposed});}
  function updateToggle(){
    if(!toggle)return;
    const paused=userPaused||!!motion?.matches;
    toggle.setAttribute('aria-pressed',String(paused));
    toggle.setAttribute('aria-label',motion?.matches?'Globo estático: movimento reduzido ativado':paused?'Retomar rotação do globo':'Pausar rotação do globo');
    toggle.disabled=!!motion?.matches||!ready;
    const label=toggle.querySelector?.('[data-globe-toggle-label]')||toggle.querySelector?.('[data-globe-toggle-text]');
    const icon=toggle.querySelector?.('[data-globe-toggle-icon]');
    if(icon)icon.textContent=paused?'▶':'Ⅱ';
    if(label)label.textContent=motion?.matches?'Movimento reduzido':paused?'Retomar rotação':'Pausar rotação';
    else toggle.textContent=motion?.matches?'Movimento reduzido':paused?'Retomar rotação':'Pausar rotação';
  }
  function sync(){
    updateToggle();
    if(!allowed()){stop();return;}
    if(!raf){last=null;raf=win.requestAnimationFrame(frame);}
  }
  function fail(){
    ready=false;cancelGesture();stop();cancelManualDraw();
    if(host?.dataset)host.dataset.globeState='fallback';
    if(canvas?.style){canvas.style.opacity='0';canvas.style.visibility='hidden';}
    if(fallback?.style){fallback.style.opacity='1';fallback.style.visibility='visible';}
    updateToggle();
  }
  if(!host||!canvas||!win||!doc)return controller;
  host.dataset.globeState='pending';
  canvas.setAttribute('aria-hidden','true');
  canvas.style.opacity='0';canvas.style.visibility='hidden';canvas.style.pointerEvents='none';
  if(fallback){if(!fallback.getAttribute('src'))fallback.src=new URL('fallback.svg',ASSETS).href;fallback.style.opacity='1';fallback.style.visibility='visible';}
  if(toggle)toggle.disabled=true;
  try{
    ctx=canvas.getContext('2d',{alpha:true});
    if(!ctx){fail();return controller;}
    motion=win.matchMedia('(prefers-reduced-motion: reduce)');
    if(options.data)data=options.data;
    else{
      abort=new AbortController();
      fetchTimer=setTimeout(()=>abort.abort(),5000);
      const response=await fetch(new URL('geography.json',ASSETS),{signal:abort.signal});
      if(!response.ok)throw new Error('Globe geography unavailable');
      data=await response.json();clearTimeout(fetchTimer);
    }
    if(disposed)return controller;
    if(!Array.isArray(data.dots)||!Array.isArray(data.borders)||!Array.isArray(data.brazil))throw new Error('Invalid globe geometry');
    const dots=data.dots.map(([lon,lat,brazil])=>({v:geographicVector(lon,lat),brazil:!!brazil}));
    const borders=data.borders.map(line=>line.map(([lon,lat])=>geographicVector(lon,lat)));
    const brazil=data.brazil.map(line=>line.map(([lon,lat])=>geographicVector(lon,lat)));
    const grid=graticuleLines().map(line=>line.map(([lon,lat])=>geographicVector(lon,lat)));
    function strokeLines(lines,matrix,r,cx,cy,color,lineWidth){
      ctx.beginPath();
      for(const line of lines){
        let previous=null;
        for(const v of line){const point=projectVector(v,matrix);if(previous){const segment=clipSegment(previous,point);if(segment){ctx.moveTo(cx+segment[0].x*r,cy-segment[0].y*r);ctx.lineTo(cx+segment[1].x*r,cy-segment[1].y*r);}}previous=point;}
      }
      ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();
    }
    function draw(){
      if(disposed||!width||!height)return;
      const r=Math.min(width,height)*.475,cx=width/2,cy=height/2;
      const matrix=projectionMatrix({...GLOBE_VIEW,longitude,latitude});
      ctx.clearRect(0,0,width,height);
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle='#100a0e';ctx.fill();
      ctx.save();ctx.clip();
      // Brazil is a geographic polygon, not a painted area on the canvas.
      for(const line of brazil){
        const pts=line.map(v=>projectVector(v,matrix));ctx.beginPath();let started=false;
        for(let i=1;i<pts.length;i++){const seg=clipSegment(pts[i-1],pts[i]);if(!seg)continue;if(!started){ctx.moveTo(cx+seg[0].x*r,cy-seg[0].y*r);started=true;}ctx.lineTo(cx+seg[1].x*r,cy-seg[1].y*r);}
        if(started){ctx.closePath();ctx.fillStyle='rgba(178,104,128,.24)';ctx.fill();}
      }
      strokeLines(grid,matrix,r,cx,cy,'rgba(243,233,216,.38)',Math.max(.38,width/1800));
      strokeLines(borders,matrix,r,cx,cy,'rgba(243,233,216,.74)',Math.max(.45,width/1500));
      const pointRadius=Math.max(.62,Math.min(1.4,width/800));
      // Batch paths by hemisphere depth and color to keep draw calls bounded.
      const batches=Array.from({length:8},()=>[]);
      for(const dot of dots){const p=projectVector(dot.v,matrix);if(p.z>.008)batches[(dot.brazil?4:0)+Math.min(3,Math.floor(p.z*4))].push(p);}
      for(let group=0;group<8;group++){
        ctx.beginPath();const depth=group%4,pr=pointRadius*(.68+depth*.11);
        for(const p of batches[group]){const x=cx+p.x*r,y=cy-p.y*r;ctx.moveTo(x+pr,y);ctx.arc(x,y,pr,0,Math.PI*2);}
        ctx.fillStyle=group<4?`rgba(247,239,226,${.68+depth*.08})`:`rgba(218,155,176,${.8+depth*.06})`;ctx.fill();
      }
      strokeLines(brazil,matrix,r,cx,cy,'rgba(222,160,179,.85)',Math.max(.75,width/1000));
      ctx.restore();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.lineWidth=Math.max(.65,width/1300);ctx.strokeStyle='rgba(247,239,226,.72)';ctx.stroke();
    }
    function resize(){
      if(disposed)return;
      cancelGesture();stop();cancelManualDraw();
      const rect=host.getBoundingClientRect();
      width=Math.max(1,Math.round(canvas.clientWidth||rect.width||800));
      height=Math.max(1,Math.round(canvas.clientHeight||rect.height||width));
      const dpr=Math.min(win.devicePixelRatio||1,1.75);
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      draw();if(ready)sync();
    }
    controller.draw=draw;
    controller.resize=resize;
    resize();
    // Keep the static SVG in place until the first complete drawing succeeds.
    ready=true;host.dataset.globeState='ready';
    if(toggle)toggle.hidden=false;
    canvas.style.transition=motion.matches?'none':'opacity 650ms ease';canvas.style.visibility='visible';canvas.style.opacity='1';
    if(fallback){fallback.style.transition=motion.matches?'none':'opacity 650ms ease';fallback.style.opacity='0';}
    listen(toggle,'click',()=>{if(motion.matches)return;cancelGesture();userPaused=!userPaused;resetVelocity();sync();});
    listen(motion,'change',()=>{cancelGesture();resetVelocity();sync();if(motion.matches)draw();});
    listen(doc,'visibilitychange',()=>{if(doc.hidden)cancelGesture();sync();});
    listen(win,'blur',()=>{cancelGesture();sync();});
    listen(win,'pagehide',()=>controller.setVisible(false));
    listen(win,'pageshow',()=>controller.setVisible(true));
    if('IntersectionObserver'in win){observer=new win.IntersectionObserver(entries=>{inViewport=entries.some(entry=>entry.isIntersecting);if(!inViewport)cancelGesture();sync();},{rootMargin:'120px'});observer.observe(host);}
    if('ResizeObserver'in win){resizeObserver=new win.ResizeObserver(()=>{try{resize();}catch{fail();}});resizeObserver.observe(host);}else listen(win,'resize',()=>{try{resize();}catch{fail();}},{passive:true});
    installInteraction();updateToggle();sync();
  }catch{clearTimeout(fetchTimer);fail();}
  return controller;

  function cancelManualDraw(){if(manualRaf&&win)win.cancelAnimationFrame(manualRaf);manualRaf=0;}
  function requestManualDraw(){
    if(motion?.matches){try{controller.draw();}catch{fail();}return;}
    if(manualRaf)return;
    manualRaf=win.requestAnimationFrame(now=>{
      manualRaf=0;if(!canInteract())return;lastDraw=now;
      try{controller.draw();}catch{fail();}
    });
  }
  function resetVelocity(){velocityX=userPaused||motion?.matches?0:ROTATION_DEGREES_PER_SECOND;velocityY=0;}
  function cancelGesture(){
    const previous=pointer;pointer=null;cancelManualDraw();
    if(host?.dataset)host.dataset.globeDragging='false';
    if(previous){try{if(host.hasPointerCapture?.(previous.id))host.releasePointerCapture?.(previous.id);}catch{}}
    resetVelocity();
    if(previous&&canInteract()){try{controller.draw();}catch{fail();}}
  }
  function canInteract(){return ready&&!disposed&&visible&&inViewport&&!doc?.hidden;}
  function excluded(event){return event.target===toggle||!!event.target?.closest?.('button,a,input,select,textarea,[contenteditable="true"]');}
  function eventTime(event){return Number.isFinite(event.timeStamp)?event.timeStamp:performance.now();}
  function ownGesture(){
    if(!pointer||pointer.intent==='owned')return;
    pointer.intent='owned';velocityX=0;velocityY=0;stop();host.dataset.globeDragging='true';
    try{host.setPointerCapture?.(pointer.id);}catch{}
  }
  function decideIntent(x,y){
    if(!pointer||pointer.intent!=='pending')return;
    const dx=Math.abs(x-pointer.startX),dy=Math.abs(y-pointer.startY);
    if(Math.max(dx,dy)<8)return;
    if(dx>dy*1.15)ownGesture();
    else if(dy>=dx*1.15||Math.max(dx,dy)>18){pointer.intent='vertical';}
  }
  function installInteraction(){
    const saved={};for(const name of ['tabindex','role','aria-label','aria-describedby'])saved[name]=host.getAttribute?.(name);
    const oldTabIndex=host.tabIndex, oldTouchAction=host.style?.touchAction;
    host.tabIndex=0;host.setAttribute?.('role','group');host.setAttribute?.('aria-label','Globo interativo');host.setAttribute?.('aria-describedby','science-globe-hint');
    if(host.style)host.style.touchAction='pan-y pinch-zoom';
    cleanups.push(()=>{host.tabIndex=oldTabIndex;for(const [name,value] of Object.entries(saved)){if(value==null)host.removeAttribute?.(name);else host.setAttribute?.(name,value);}if(host.style)host.style.touchAction=oldTouchAction||'';});
    listen(host,'pointerdown',event=>{
      if(!canInteract()||excluded(event))return;
      if(event.isPrimary===false){cancelGesture();sync();return;}
      if(pointer||((event.pointerType||'mouse')!=='touch'&&event.button!==undefined&&event.button!==0))return;
      pointer={id:event.pointerId,type:event.pointerType||'mouse',intent:'pending',startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,time:eventTime(event)};
      if(pointer.type!=='touch'){ownGesture();event.preventDefault?.();event.stopPropagation?.();host.focus?.({preventScroll:true});}
    });
    listen(host,'pointermove',event=>{
      if(!pointer||event.pointerId!==pointer.id||!canInteract())return;
      decideIntent(event.clientX,event.clientY);
      if(pointer.intent!=='owned')return;
      event.stopPropagation?.();if(event.cancelable!==false)event.preventDefault?.();
      const now=eventTime(event),dt=now-pointer.time,dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
      const scale=180/Math.max(180,width||host.getBoundingClientRect().width||400);
      const deltaX=-dx*scale,deltaY=pointer.type==='touch'?0:dy*scale;
      const oldLatitude=latitude;longitude=wrap(longitude+deltaX);latitude=clamp(latitude+deltaY,-MAX_LATITUDE,MAX_LATITUDE);
      if(dt>0&&dt<160&&!userPaused&&!motion.matches){
        const weight=1-Math.exp(-dt/38);
        velocityX+=(clamp(deltaX*1000/dt,-180,180)-velocityX)*weight;
        velocityY+=(clamp((latitude-oldLatitude)*1000/dt,-120,120)-velocityY)*weight;
      }else if(dt>=160||userPaused||motion.matches){velocityX=0;velocityY=0;}
      pointer.x=event.clientX;pointer.y=event.clientY;pointer.time=now;
      requestManualDraw();
    },{passive:false});
    listen(host,'pointerup',event=>{
      if(!pointer||event.pointerId!==pointer.id)return;
      const previous=pointer,owned=previous.intent==='owned';pointer=null;host.dataset.globeDragging='false';
      if(owned){
        event.stopPropagation?.();
        const idle=Math.max(0,eventTime(event)-previous.time);
        if(userPaused||motion.matches){velocityX=0;velocityY=0;}
        else {const decay=Math.exp(-INERTIA_DAMPING*Math.min(idle,500)/1000);velocityX*=decay;velocityY*=decay;}
      }
      try{if(host.hasPointerCapture?.(previous.id))host.releasePointerCapture?.(previous.id);}catch{}
      sync();
    });
    const cancel=event=>{if(pointer&&event.pointerId===pointer.id){cancelGesture();sync();}};
    listen(host,'pointercancel',cancel);listen(host,'lostpointercapture',cancel);
    // Locomotive consumes bubbling TouchEvents independently from PointerEvents. Only
    // an owned horizontal gesture is stopped here; vertical scrolling stays untouched.
    listen(host,'touchmove',event=>{
      if(!pointer||pointer.type!=='touch'||!canInteract())return;
      if(event.touches?.length!==1){cancelGesture();sync();return;}
      const touch=event.touches[0];decideIntent(touch.clientX,touch.clientY);
      if(pointer?.intent==='owned'){event.stopPropagation?.();if(event.cancelable!==false)event.preventDefault?.();}
    },{passive:false});
    listen(host,'keydown',event=>{
      if(!canInteract()||event.target!==host||event.altKey||event.ctrlKey||event.metaKey)return;
      const step=event.shiftKey?10:4;
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
      event.preventDefault?.();event.stopPropagation?.();cancelGesture();
      if(event.key==='ArrowLeft')longitude=wrap(longitude+step);
      if(event.key==='ArrowRight')longitude=wrap(longitude-step);
      if(event.key==='ArrowUp')latitude=clamp(latitude-step,-MAX_LATITUDE,MAX_LATITUDE);
      if(event.key==='ArrowDown')latitude=clamp(latitude+step,-MAX_LATITUDE,MAX_LATITUDE);
      try{controller.draw();}catch{fail();return;}sync();
    });
    listen(host,'dragstart',event=>{if(!excluded(event)&&canInteract())event.preventDefault?.();});
  }
  function frame(now){
    raf=0;if(!allowed())return;
    const delta=last===null?0:Math.max(0,Math.min(now-last,100));last=now;
    const next=advanceGlobeMotion({longitude,latitude,velocityX,velocityY},delta);
    longitude=next.longitude;latitude=next.latitude;velocityX=next.velocityX;velocityY=next.velocityY;
    const isCoasting=Math.abs(velocityX-ROTATION_DEGREES_PER_SECOND)+Math.abs(velocityY)>.15;
    if(!lastDraw||(isCoasting&&now!==lastDraw)||now-lastDraw>=1000/30){
      lastDraw=now;
      try{controller.draw();}catch{fail();return;}
    }
    raf=win.requestAnimationFrame(frame);
  }
}
