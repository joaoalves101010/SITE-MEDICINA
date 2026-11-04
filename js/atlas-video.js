/** Native controls remain usable without JS. No video fetch until visible or played. */
export function initAtlasVideo(video,win=globalThis.window){
 if(!video)return null;
 const doc=video.ownerDocument,reduce=win.matchMedia('(prefers-reduced-motion: reduce)'),listeners=[];
 let visible=false,userPaused=false,automaticPause=false,disposed=false;
 const on=(target,event,handler)=>{target.addEventListener(event,handler);listeners.push(()=>target.removeEventListener(event,handler));};
 video.muted=true;
 const pause=()=>{if(!video.paused){automaticPause=true;video.pause();}};
 const sync=()=>{
  if(disposed)return;
  if(!visible||doc.hidden||reduce.matches||win.navigator?.connection?.saveData){pause();return;}
  if(!userPaused)video.play().catch(()=>{});
 };
 on(video,'pause',()=>{if(automaticPause)automaticPause=false;else userPaused=true;});
 on(video,'play',()=>{userPaused=false;automaticPause=false;});
 on(doc,'visibilitychange',sync);
 on(reduce,'change',sync);
 on(win,'pagehide',pause);
 on(win,'pageshow',sync);
 on(video,'error',()=>{pause();video.hidden=true;const fallback=video.parentElement.querySelector('.eco-video-fallback');if(fallback)fallback.hidden=false;});
 let observer;
 if(win.IntersectionObserver){observer=new win.IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);sync();},{threshold:.15});observer.observe(video);}
 // Without observers, retain manual native playback instead of eager downloading.
 return {dispose(){disposed=true;observer?.disconnect();listeners.splice(0).forEach(remove=>remove());video.pause();}};
}

if(globalThis.document&&globalThis.window){
 const controller=initAtlasVideo(document.querySelector(".eco-atlas-video"));
 window.addEventListener("pagehide",event=>{if(!event.persisted)controller?.dispose();});
}
