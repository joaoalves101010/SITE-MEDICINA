const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const experienceIntroDuration=count=>Math.max(8.37,7.87+.7+Math.max(0,count-1)*.015);
/** Source-timed DOM typography; renderer motion phases remain independent. */
export function experienceEntryVisual(elapsed,count,reduced=false){
 const t=Math.max(0,Number(elapsed)||0),end=experienceIntroDuration(count);
 return{complete:reduced||t>=end,indexOpacity:reduced?1:1-Math.pow(1-clamp((t-4.762)/.95),5),glyphs:Array.from({length:count},(_,i)=>{const reveal=1-Math.pow(1-clamp((t-4.762-i*.015)/.95),5),fade=Math.pow(clamp((t-7.87-i*.015)/.7),3);return{y:reduced?0:(1-reveal)*110,opacity:reduced?0:1-fade};})};
}
/** A local viewport latch, never a global overflow lock. Deliberate exits remain available. */
export function createExperienceEngagement(stage,options={}){
 const win=options.window||window,doc=options.document||document,cleanups=[];
 let active=false,blocked=false,disposed=false,aligning=false,touch=null;
 const on=(t,n,f,o)=>{t?.addEventListener?.(n,f,o);cleanups.push(()=>t?.removeEventListener?.(n,f,o));};
 const allowed=()=>!disposed&&!options.nativeTouch?.()&&options.allowed?.()!==false&&!options.reduced?.()&&doc.visibilityState!=='hidden';
 function change(value){if(active===value)return;active=value;options.onChange?.(value);}
 function release(block=true){if(block)blocked=true;change(false);}
 function bounds(){const r=stage.getBoundingClientRect(),vh=Math.max(1,win.innerHeight||1),h=Number(r.height??r.bottom-r.top),visible=Math.max(0,Math.min(vh,r.bottom)-Math.max(0,r.top)),offset=Math.abs(r.top+h*.5-vh*.5);return {r,vh,h,visible,offset,valid:h>0&&Number.isFinite(h),whole:visible>=Math.min(vh,h)*.94,centered:offset<=Math.max(32,vh*.12)};}
 function alignPosition(){const {r,vh}=bounds(),target=(vh-r.height)*.5,y=Number(options.getScrollY?.()??win.scrollY)||0;options.scrollImmediate?.(Math.max(0,y+r.top-target));}
 function align(){if(!active||!allowed())return;alignPosition();}
 function update(){
  if(disposed||aligning)return;const b=bounds(),{vh,h,visible,offset,whole,centered}=b;
  if(visible<Math.min(vh,h)*.5||offset>vh*.65)blocked=false;
  if(!allowed()||!b.valid){change(false);return;}
  if(active&&(!whole||!centered)){
   // Existing smooth-scroll deltas must not unlock the gallery mid-intro. Large
   // deliberate jumps (anchors, scrollbar, explicit exits) still leave normally.
   if(visible>0&&offset<=vh*.65){aligning=true;try{alignPosition();}finally{aligning=false;}const aligned=bounds();if(aligned.whole&&aligned.centered)return;}
   change(false);return;
  }
  // A restored page may stop before the old 94% latch. Acquire on meaningful
  // entry, then finish synchronous positioning before the first intro tick.
  const substantial=visible>=Math.min(vh,h)*.65&&offset<=vh*.35;
  if(!active&&!blocked&&substantial){aligning=true;try{alignPosition();}finally{aligning=false;}const aligned=bounds();if(allowed()&&aligned.valid&&aligned.whole&&aligned.centered)change(true);}
 }
 on(doc,'wheel',event=>{
  if(event.ctrlKey||event.metaKey||event.target?.isContentEditable||event.target?.closest?.('input,select,textarea,[contenteditable=""],[contenteditable="true"],[contenteditable="plaintext-only"]'))return;
  // This listener is registered before the renderer: acquire and cancel old
  // page inertia first, then its same-event handler owns the aligned viewport.
  update();
 },{capture:true,passive:true});
 on(doc,'touchstart',event=>{const t=event.touches?.[0];touch=event.touches?.length===1&&t?{x:t.clientX,y:t.clientY}:null;if(!touch&&active)release();},{capture:true,passive:true});
 on(doc,'touchmove',event=>{if(!active||!touch)return;const t=event.touches?.[0];if(event.touches?.length!==1||!t){release();touch=null;return;}const dx=t.clientX-touch.x,dy=t.clientY-touch.y;if(Math.abs(dy)>9&&Math.abs(dy)>=Math.abs(dx)*.85){release();touch=null;}},{capture:true,passive:true});
 on(doc,'touchend',()=>{touch=null;},{capture:true,passive:true});on(doc,'touchcancel',()=>{touch=null;},{capture:true,passive:true});
 on(win,'keydown',event=>{if(event.key==='Escape'&&active)release();});
 on(win,'blur',()=>release(false));
 return{update,align,release,get engaged(){return active;},dispose(){if(disposed)return;release(false);disposed=true;cleanups.splice(0).forEach(f=>f());}};
}
