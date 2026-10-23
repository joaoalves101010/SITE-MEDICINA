const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number.isFinite(value)?value:min));

// Invert only the reading hold/ease, never change ordinary scroll choreography.
export function bookRawForProgress(value){
  const p=clamp(value,0,6),index=Math.floor(p),fraction=p-index;
  if(!fraction||index===6)return p;
  const t=.5-Math.sin(Math.asin(1-2*fraction)/3);
  return index+.16+.68*t;
}
export function bookDragProgress(start,deltaX,width){
  return clamp(start-deltaX/Math.max(160,width*.47),Math.max(0,start-1),Math.min(6,start+1));
}
export function bookDragHit(rect,x,y,progress){
  if(!rect||!(rect.width>0)||!(rect.height>0))return false;
  const open=clamp(progress,0,1),halfWidth=rect.width*(.235+.235*open),halfHeight=Math.min(rect.height*.5,rect.width*.94/1.75/2);
  return Math.abs(x-(rect.left+rect.width/2))<=halfWidth&&Math.abs(y-(rect.top+rect.height/2))<=halfHeight;
}

/** The vendored duration:0 tween has a 0/0 first iteration: bypass that tween only here. */
export function setBookScrollImmediate(scroll,target,win=window){
  if(!Number.isFinite(target))return;
  const engine=scroll?.scroll;
  if(engine?.instance&&typeof engine.stopScrolling==='function'&&typeof engine.checkScroll==='function'&&typeof scroll.setScroll==='function'){
    const limit=Number.isFinite(engine.instance.limit?.y)?engine.instance.limit.y:target;
    engine.stopScrolling();engine.animatingScroll=false;
    scroll.setScroll(engine.instance.scroll.x||0,clamp(target,0,Math.max(0,limit)));
    // Existing vendor step transforms sections before dispatching its scroll event.
    engine.checkScroll(true);
  }else win.scrollTo({top:target,behavior:'instant'});
}

/** Mouse-only input adapter. Scroll remains the sole owner of the rendered pose. */
export function createBookDrag(visual,options={}){
  const win=options.window||window,doc=options.document||document;
  const raf=fn=>win.requestAnimationFrame(fn),caf=id=>win.cancelAnimationFrame(id);
  const cleanups=[];let drag=null,frame=0,disposed=false,hover=false;
  const on=(target,name,fn,opts)=>{target?.addEventListener?.(name,fn,opts);cleanups.push(()=>target?.removeEventListener?.(name,fn,opts));};
  const state=()=>options.getState?.();
  const eligible=s=>!disposed&&!!s?.enabled&&doc.visibilityState!=='hidden';
  function cursor(value){hover=value;if(visual?.dataset)visual.dataset.bookDraggable=String(value);}
  function point(event){return Number.isFinite(event.clientX)&&Number.isFinite(event.clientY);}
  function ignoreTarget(target){return !!target?.closest?.('a,button,input,select,textarea,[contenteditable="true"],[data-book-controls]');}
  function apply(){
    frame=0;if(!drag)return;
    const s=state();if(!eligible(s)){cancel();return;}
    drag.progress=bookDragProgress(drag.start,drag.x-drag.startX,drag.width);
    options.scrollImmediate?.(drag.top+bookRawForProgress(drag.progress)*drag.step);
  }
  function releaseCapture(current){try{if(visual.hasPointerCapture?.(current.id))visual.releasePointerCapture(current.id);}catch{}}
  function finish(snap){
    if(!drag)return;
    if(frame){caf(frame);frame=0;}
    const current=drag;drag=null;delete visual.dataset.bookDragging;
    releaseCapture(current);options.onActive?.(false);
    cursor(false);
    if(snap&&eligible(state())&&current.moved)options.snapTo?.(Math.round(current.progress));
  }
  function cancel(){finish(false);}
  function down(event){
    const s=state();if(drag||event.pointerType!=='mouse'||event.button!==0||event.isPrimary===false||!point(event)||!eligible(s)||ignoreTarget(event.target)||!bookDragHit(visual.getBoundingClientRect(),event.clientX,event.clientY,s.progress))return;
    const rect=visual.getBoundingClientRect();
    try{visual.setPointerCapture(event.pointerId);}catch{return;}
    drag={id:event.pointerId,start:s.progress,progress:s.progress,startX:event.clientX,x:event.clientX,width:rect.width,top:s.top,step:s.step,moved:false};
    visual.dataset.bookDragging='true';cursor(true);event.preventDefault();
    // Cancel any pre-existing smooth-scroll inertia before taking ownership.
    options.onActive?.(true);options.scrollImmediate?.(s.scrollY);
  }
  function move(event){
    if(!drag){const s=state();cursor(event.pointerType==='mouse'&&point(event)&&eligible(s)&&!ignoreTarget(event.target)&&bookDragHit(visual.getBoundingClientRect(),event.clientX,event.clientY,s.progress));return;}
    if(event.pointerId!==drag.id)return;
    if(event.buttons!==undefined&&!(event.buttons&1)){cancel();return;}
    if(!point(event))return;event.preventDefault();drag.x=event.clientX;
    drag.moved=drag.moved||Math.abs(drag.x-drag.startX)>2;
    if(drag.moved&&!frame)frame=raf(apply);
  }
  function up(event){if(!drag||event.pointerId!==drag.id)return;if(point(event)){drag.x=event.clientX;drag.moved=drag.moved||Math.abs(drag.x-drag.startX)>2;}if(drag.moved){if(frame){caf(frame);frame=0;}apply();}finish(true);}
  on(visual,'pointerdown',down);on(visual,'pointermove',move);on(visual,'pointerup',up);
  on(visual,'pointercancel',event=>{if(event.pointerId===drag?.id)cancel();});
  on(visual,'lostpointercapture',event=>{if(event.pointerId===drag?.id)cancel();});
  on(visual,'pointerleave',()=>{if(!drag)cursor(false);});
  on(visual,'dragstart',event=>{if(drag)event.preventDefault();});
  on(win,'wheel',cancel,{passive:true});on(win,'blur',cancel);on(win,'pagehide',cancel);on(win,'resize',cancel);
  on(doc,'visibilitychange',()=>{if(doc.visibilityState==='hidden')cancel();});
  return {cancel,sync(){if(!eligible(state())){cancel();if(hover)cursor(false);}},dispose(){if(disposed)return;cancel();disposed=true;cleanups.splice(0).forEach(fn=>fn());delete visual.dataset.bookDraggable;},get active(){return !!drag;}};
}
