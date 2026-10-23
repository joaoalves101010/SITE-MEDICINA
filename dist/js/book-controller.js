import { createBookDrag } from './book-drag.js';
export { setBookScrollImmediate } from './book-drag.js';
const clamp=(v,min,max)=>Math.min(max,Math.max(min,Number.isFinite(v)?v:min));
export function bookScrollState(top,viewportHeight,steps=6){
  const height=Math.max(1,Number(viewportHeight)||1),step=height*.88,travel=step*steps;
  const offset=clamp(-top,0,travel),raw=offset/step,index=Math.min(steps,Math.floor(raw));
  const fraction=index===steps?0:raw-index,t=clamp((fraction-.16)/.68,0,1);
  return {height,step,travel,offset,progress:index+t*t*(3-2*t),raw};
}
export function createSpreadCache(load,limit=3){
  const cache=new Map(),pending=new Map();let disposed=false,epoch=0;
  return {async load(index){if(disposed)throw new Error('Book artwork disposed');if(cache.has(index)){const value=cache.get(index);cache.delete(index);cache.set(index,value);return value;}if(pending.has(index))return pending.get(index);const requestEpoch=epoch;const task=Promise.resolve().then(()=>{if(disposed)throw new Error('Book artwork disposed');return load(index);}).then(value=>{if(disposed)throw new Error('Book artwork disposed');if(requestEpoch===epoch){cache.set(index,value);while(cache.size>limit)cache.delete(cache.keys().next().value);}return value;}).finally(()=>pending.delete(index));pending.set(index,task);return task;},clear(){epoch++;cache.clear();},dispose(){disposed=true;cache.clear();pending.clear();},get size(){return cache.size;}};
}
export function createBookController(root,options={}){
  if(!root)return {update(){},setVisible(){},dispose(){}};
  const win=options.window||window,doc=options.document||document;
  const track=root.querySelector('[data-book-track]'),stage=root.querySelector('[data-book-stage]'),visual=root.querySelector('[data-book-visual]'),canvas=root.querySelector('[data-book-canvas]'),cssRoot=root.querySelector('[data-book-css]');
  const controls=root.querySelector('[data-book-controls]'),hint=root.querySelector('[data-book-hint]'),skip=root.querySelector('[data-book-skip]'),status=root.querySelector('[data-book-status]');
  const chapters=[...root.querySelectorAll('[data-book-chapter]')],jumps=[...root.querySelectorAll('[data-book-jump]')],prev=root.querySelector('[data-book-prev]'),next=root.querySelector('[data-book-next]');
  if(!track||!stage||!visual||!canvas||!cssRoot)return {update(){},setVisible(){},dispose(){}};
  const header=doc.querySelector?.('.site-header'),headerWasInert=header?.inert??false;
  function pinHeader(active){doc.body?.classList?.toggle('book-reading-active',!!active);if(header)header.inert=active?true:headerWasInert;}
  const reduce=win.matchMedia('(prefers-reduced-motion: reduce)');
  const engineLoader=options.loadEngines||(()=>Promise.all([import('./book-art.js'),import('./book-renderer.js'),import('./book-fallback.js')]));
  const cleanup=[];const on=(target,event,fn,opts)=>{target?.addEventListener?.(event,fn,opts);cleanup.push(()=>target?.removeEventListener?.(event,fn,opts));};
  let disposed=false,externalVisible=true,starting=false,interactive=false,gpu=null,css=null,art=null,cache=null,engines=null,progress=0,active=-1,announceTimer=0,generation=0,navTarget=null,gpuStarting=false,gpuAttempted=false,fallbackReady=false,gpuAbort=null,failed=false;
  const viewport=()=>Math.max(1,win.innerHeight||doc.documentElement?.clientHeight||1);
  const state=()=>bookScrollState(track.getBoundingClientRect().top,viewport());
  const within=(margin=0)=>{const rect=track.getBoundingClientRect();return rect.top<viewport()+margin&&rect.bottom>-margin;};
  const allowed=()=>!disposed&&externalVisible&&doc.visibilityState!=='hidden'&&!reduce.matches;
  const visible=()=>allowed()&&within(100);
  function notifyLayout(){options.onLayout?.();}
  function caption(value){const index=Math.round(clamp(value,0,6));if(index===active)return;active=index;for(const [i,chapter] of chapters.entries())chapter.hidden=i!==index;for(const button of jumps){if(Number(button.dataset.bookJump)===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');}if(prev)prev.disabled=index===0;if(next)next.disabled=index===6;win.clearTimeout(announceTimer);announceTimer=win.setTimeout(()=>{if(!disposed&&status)status.textContent=index?`Capítulo ${index} de 6: ${chapters[index]?.querySelector('h3')?.textContent||''}`:'Capa do livro Innecta';},180);}
  function enable(){interactive=true;root.dataset.bookState='interactive';for(const node of [controls,hint,skip])if(node)node.hidden=false;root.style.setProperty('--book-stage-height',`${viewport()}px`);track.style.height=`${state().travel+viewport()}px`;active=-1;update();notifyLayout();}
  function restore(){drag?.cancel();pinHeader(false);interactive=false;root.dataset.bookState='static';track.style.height='';stage.style.transform='';for(const node of [controls,hint,skip])if(node)node.hidden=true;for(const chapter of chapters)chapter.hidden=false;visual.dataset.bookRender='pending';cssRoot.hidden=true;win.clearTimeout(announceTimer);if(status)status.textContent='';notifyLayout();}
  function release(){generation++;gpuAbort?.abort();gpuAbort=null;gpuStarting=false;gpuAttempted=false;fallbackReady=false;gpu?.dispose();css?.dispose();art?.dispose();cache?.dispose();gpu=css=art=cache=null;starting=false;}
  function startCss(){if(!allowed()||!interactive||css||!cache||!engines)return;fallbackReady=false;cssRoot.hidden=false;const token=generation;try{css=engines[2].initBookFallback(cssRoot,{loadSpread:index=>cache.load(index),getProgress:()=>progress,visible:visible(),onReady(){if(disposed||token!==generation)return;fallbackReady=true;if(gpu?.mode==='webgl'){css?.dispose();css=null;cssRoot.hidden=true;cache?.clear();visual.dataset.bookRender='ready';}else{visual.dataset.bookRender='fallback-ready';void upgrade(token);}},onError(){if(disposed||token!==generation)return;if(gpu?.mode!=='webgl'){failed=true;release();restore();}}});css.setProgress(progress);css.setVisible(visible());}catch{failed=true;release();restore();}}
  function pauseUpgrade(){if(!gpuStarting)return;const pending=gpuAbort;gpuAbort=null;gpuStarting=false;gpuAttempted=false;pending?.abort();}
  async function upgrade(token=generation){
    if(gpuStarting||gpuAttempted||!fallbackReady||!interactive||!allowed()||!within(900))return;
    gpuStarting=true;gpuAttempted=true;const abort=new AbortController();gpuAbort=abort;
    try{const controller=await engines[1].initBookRenderer(canvas,{loadSpread:index=>cache.load(index),loadLayers:art?.loadLayers?index=>art.loadLayers(index):undefined,getProgress:()=>progress,signal:abort.signal,onFallback(){if(disposed||token!==generation||abort.signal.aborted)return;gpu=null;startCss();}});
      if(disposed||token!==generation||abort.signal.aborted){controller?.dispose();return;}gpu=controller;gpu?.setVisible(visible());gpu?.setProgress(progress);
      if(gpu?.mode==='webgl'){css?.dispose();css=null;cssRoot.hidden=true;cache?.clear();visual.dataset.bookRender='ready';}else startCss();
    }catch(error){if(!disposed&&token===generation&&!abort.signal.aborted){startCss();options.onError?.(error);}}
    finally{if(gpuAbort===abort){gpuStarting=false;gpuAbort=null;}}
  }
  async function start(){if(starting||interactive||failed||!allowed()||!within(900))return;starting=true;const token=++generation;try{const loaded=await engineLoader();if(disposed||token!==generation||!allowed()||!within(900)){starting=false;return;}engines=loaded;const created=await engines[0].createBookArt();if(disposed||token!==generation||!allowed()||!within(900)){created?.dispose();starting=false;return;}art=created;cache=createSpreadCache(index=>art.loadSpread(index));enable();startCss();if(css?.ready)await css.ready;if(disposed||token!==generation||!interactive)return;
      // The CSS book already has the same pose and art; WebGL replaces it only
      // after an actual frame. No page-wide loading gate or alternative artwork.
      await upgrade(token);starting=false;
    }catch(error){if(disposed||token!==generation)return;starting=false;if(css){visual.dataset.bookRender='fallback-ready';}else{failed=true;release();restore();}options.onError?.(error);}}
  function update(){if(disposed)return;drag?.sync();if(reduce.matches){if(interactive){release();restore();}return;}if(!interactive){if(allowed()&&within(900))void start();return;}const nextState=state();root.style.setProperty('--book-stage-height',`${nextState.height}px`);const height=`${nextState.travel+nextState.height}px`;if(track.style.height!==height)track.style.height=height;stage.style.transform=`translate3d(0,${nextState.offset}px,0)`;progress=nextState.progress;pinHeader(allowed()&&track.getBoundingClientRect().top<=0&&track.getBoundingClientRect().top>=-nextState.travel);caption(progress);const isVisible=visible();if(!allowed()||!within(900))pauseUpgrade();gpu?.setVisible(isVisible);css?.setVisible(isVisible);gpu?.setProgress(progress);css?.setProgress(progress);if(navTarget!==null&&Math.abs(nextState.raw-navTarget)<.02)navTarget=null;if(fallbackReady&&!gpuAttempted)void upgrade();}
  function go(index){drag?.cancel();if(!interactive)return;const target=clamp(index,0,6);navTarget=target;const currentY=options.getScrollY?.()??win.scrollY??0;const top=track.getBoundingClientRect().top+currentY;options.scrollTo?.(top+state().step*target,700);}
  const drag=createBookDrag(visual,{window:win,document:doc,getState(){const s=state(),top=track.getBoundingClientRect().top,scrollY=options.getScrollY?.()??win.scrollY??0;return {enabled:interactive&&fallbackReady&&allowed()&&top<=2&&top>=-s.travel-2&&typeof options.scrollImmediate==='function',progress:s.progress,step:s.step,top:top+scrollY,scrollY};},scrollImmediate:target=>{navTarget=null;options.scrollImmediate?.(target);},snapTo:go});
  const fine=win.matchMedia('(pointer:fine)');const updateHint=()=>{if(hint)hint.textContent=fine.matches?'Role ou arraste para virar as páginas. Volte para reler.':'Role para virar as páginas. Volte para reler.';};updateHint();on(fine,'change',updateHint);
  on(prev,'click',()=>go((navTarget??active)-1));on(next,'click',()=>go((navTarget??active)+1));for(const button of jumps)on(button,'click',()=>go(Number(button.dataset.bookJump)));
  on(skip,'click',event=>{const end=root.querySelector('#book-end');if(!end)return;event.preventDefault();event.stopPropagation();options.scrollTo?.(end,700);end.focus?.({preventScroll:true});});
  on(controls,'keydown',event=>{let target;if(event.key==='ArrowRight')target=(navTarget??active)+1;if(event.key==='ArrowLeft')target=(navTarget??active)-1;if(event.key==='Home')target=0;if(event.key==='End')target=6;if(target===undefined)return;event.preventDefault();event.stopPropagation();go(target);});
  on(win,'resize',()=>{update();gpu?.resize();css?.resize();notifyLayout();});on(doc,'visibilitychange',()=>{if(doc.visibilityState==='hidden')pauseUpgrade();update();gpu?.setVisible(visible());css?.setVisible(visible());});on(reduce,'change',update);
  let observer;if(win.IntersectionObserver){observer=new win.IntersectionObserver(()=>update(),{rootMargin:'900px'});observer.observe(track);}
  update();
  return {update,setVisible(value){externalVisible=!!value;if(!externalVisible)pauseUpgrade();update();gpu?.setVisible(visible());css?.setVisible(visible());},go,dispose(){if(disposed)return;drag.dispose();pinHeader(false);disposed=true;release();observer?.disconnect();cleanup.splice(0).forEach(fn=>fn());win.clearTimeout(announceTimer);},get progress(){return progress;},get interactive(){return interactive;}};
}
