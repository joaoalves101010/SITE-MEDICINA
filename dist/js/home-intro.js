/** Home welcome starts in the document head, never after the motion/GPU imports. */
export const HOME_INTRO_CRITICAL_CSS = `html[data-home-intro="active"] #home .hero-sentence{opacity:0;visibility:hidden}html[data-home-intro="active"] #home .intro-greeting{display:block}html[data-home-intro="active"] .site-header{opacity:0;transform:translateY(-100%)}html[data-home-intro="active"] #home .scroll-seal{opacity:0}`;

/** Self-contained: serialized into the home head before any body content can paint. */
export function bootstrapHomeIntro(win, doc) {
 if (win.__theMedHomeIntro) return win.__theMedHomeIntro;
 const root=doc.documentElement,now=()=>win.performance?.now?.()??Date.now();
 let resolveStarted;const whenStarted=new Promise(resolve=>{resolveStarted=resolve;});
 const state={bootAt:now(),startedAt:null,initialHash:win.location?.hash||'',whenStarted,ended:false,reason:'',timer:0,now,finish:null};
 win.__theMedHomeIntro=state;
 let media,originalRestoration,changedRestoration=false,originalURL='',suppressedURL='',hashSuppressed=false,navigationChanged=false;
 const markNavigation=()=>{navigationChanged=true;};
 const resetScroll=()=>{if(state.ended)return;const style=root.style,previous=style?.getPropertyValue?.('scroll-behavior')||'',priority=style?.getPropertyPriority?.('scroll-behavior')||'';try{style?.setProperty?.('scroll-behavior','auto','important');win.scrollTo({top:0,left:0,behavior:'auto'});}catch{try{win.scrollTo(0,0);}catch{}}finally{if(previous)style?.setProperty?.('scroll-behavior',previous,priority);else style?.removeProperty?.('scroll-behavior');}};
 const animationStart=event=>{if(state.ended||state.startedAt!==null||event.animationName!=='home-intro-enter')return;state.startedAt=now()-Math.max(0,Number(event.elapsedTime)||0)*1000;resolveStarted(state.startedAt);doc.removeEventListener?.('animationstart',animationStart);};
 const pageHide=()=>state.finish('pagehide');
 const motionChange=()=>{if(media?.matches)state.finish('reduced-motion');};
 state.finish=(reason='complete')=>{
  if(state.ended)return;state.ended=true;state.reason=reason;
  win.clearTimeout(state.timer);root.dataset.homeIntro='done';
  win.removeEventListener?.('pagehide',pageHide);doc.removeEventListener?.('DOMContentLoaded',resetScroll);doc.removeEventListener?.('animationstart',animationStart);if(state.startedAt===null)resolveStarted(null);media?.removeEventListener?.('change',motionChange);
  win.removeEventListener?.('hashchange',markNavigation);win.removeEventListener?.('popstate',markNavigation);
  if(hashSuppressed&&!navigationChanged&&win.location?.href===suppressedURL)try{win.history.replaceState(win.history.state,'',originalURL);}catch{}
  if(changedRestoration)try{win.history.scrollRestoration=originalRestoration;}catch{}
 };
 try {
  media=win.matchMedia?.('(prefers-reduced-motion: reduce)');
  if(media?.matches){state.finish('reduced-motion');return state;}
  root.dataset.homeIntro='active';
  // Native fragment navigation can run after DOMContentLoaded; suppress it before parsing.
  if(state.initialHash)try{originalURL=win.location.href;win.history.replaceState(win.history.state,'',originalURL.split('#')[0]);suppressedURL=win.location.href;hashSuppressed=!win.location.hash;if(hashSuppressed){win.addEventListener?.('hashchange',markNavigation);win.addEventListener?.('popstate',markNavigation);}}catch{}
  try{if(win.history&&'scrollRestoration'in win.history){originalRestoration=win.history.scrollRestoration;win.history.scrollRestoration='manual';changedRestoration=true;}}catch{}
  resetScroll();
  doc.addEventListener?.('animationstart',animationStart);doc.addEventListener?.('DOMContentLoaded',resetScroll,{once:true});win.addEventListener?.('pagehide',pageHide,{once:true});media?.addEventListener?.('change',motionChange);
  // Independent of modules, styles, fonts and WebGL: never strand a gated page.
  state.timer=win.setTimeout(()=>state.finish('watchdog'),8000);
 } catch {state.finish('bootstrap-error');}
 return state;
}
export const HOME_INTRO_BOOTSTRAP=`(${bootstrapHomeIntro.toString()})(window,document);`;
const instances=new WeakMap();

/** CSS is the animation engine here; adopting it never restarts the first-paint timeline. */
export function initHomeIntro({hero,document:doc=globalThis.document,window:win=globalThis.window}={}) {
 if(!doc||!win)return {intro:false,introDelay:0,remainingMs:0,startedAt:0,initialHash:'',finish(){},dispose(){}};
 if(instances.has(doc))return instances.get(doc);
 hero=hero||doc.querySelector?.('#home');
 // If the head bootstrap was blocked, leave already-readable content alone: never gate late.
 const state=win.__theMedHomeIntro||null;
 let timer=0;
 const remaining=duration=>state&&!state.ended?(state.startedAt===null?duration:Math.max(0,duration-(state.now()-state.startedAt))):0;
 const finish=(reason='complete')=>{win.clearTimeout(timer);state?.finish(reason);};
 const controller={get intro(){return !!state&&!state.ended;},get introDelay(){return remaining(5200);},get remainingMs(){return remaining(6800);},get startedAt(){return state?.startedAt??0;},get initialHash(){return state?.initialHash||'';},whenStarted:state?.whenStarted||Promise.resolve(null),finish,dispose(){finish('dispose');}};
 instances.set(doc,controller);
 if(!state||state.ended)return controller;
 if(!hero?.querySelector?.('.intro-greeting')){finish('missing-markup');return controller;}
 const arm=()=>{if(!state.ended)timer=win.setTimeout(()=>finish(),remaining(6800));};
 if(state.startedAt!==null)arm();else state.whenStarted.then(arm);
 return controller;
}
