/** Native finger scrolling on touch-first devices; desktop fine pointers keep the approved smooth engine. */
export function usesNativeTouchScroll(win=window){
 const matches=query=>{try{return !!win.matchMedia?.(query)?.matches;}catch{return false;}};
 return matches('(pointer: coarse)')||(!matches('(pointer: fine)')&&Number(win.navigator?.maxTouchPoints)>0);
}
export function readScrollPosition(scroll,win=window,nativeTouch=false){
 const virtual=scroll?.scroll?.instance?.scroll?.y;
 if(!nativeTouch&&Number.isFinite(virtual))return virtual;
 return Number(win.scrollY??win.pageYOffset)||0;
}
/** Auto must be truly instant even with the site's global scroll-behavior:smooth. */
export function setNativeScrollImmediate(win,target){
 if(!Number.isFinite(target))return;
 const style=win.document?.documentElement?.style;
 const previous=style?.getPropertyValue?.('scroll-behavior')??style?.scrollBehavior??'';
 const priority=style?.getPropertyPriority?.('scroll-behavior')||'';
 if(style?.setProperty)style.setProperty('scroll-behavior','auto','important');else if(style)style.scrollBehavior='auto';
 try{win.scrollTo({top:target,behavior:'auto'});}finally{
  if(style?.setProperty){if(previous)style.setProperty('scroll-behavior',previous,priority);else style.removeProperty?.('scroll-behavior');}else if(style)style.scrollBehavior=previous;
 }
}

/** iOS overlay lock: preserve the native page offset without trapping scroll after close. */
export function createNativeScrollLock(win=window,doc=win.document){
 let saved=null;
 const keys=['position','top','left','right','width','overflow'];
 function set(active){
  const style=doc?.body?.style;if(!style)return;
  if(active&&!saved){const y=readScrollPosition(null,win,true);saved={y,styles:Object.fromEntries(keys.map(k=>[k,style[k]||'']))};Object.assign(style,{position:'fixed',top:`${-y}px`,left:'0',right:'0',width:'100%',overflow:'hidden'});}
  else if(!active&&saved){const prior=saved;saved=null;for(const key of keys)style[key]=prior.styles[key];setNativeScrollImmediate(win,prior.y);}
 }
 return {set,dispose(){set(false);},get position(){return saved?.y;},get locked(){return !!saved;}};
}
