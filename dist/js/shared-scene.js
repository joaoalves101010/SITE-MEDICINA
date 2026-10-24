/** Position/lifecycle owner for one existing hero renderer across two folds. */
export function sharedSceneOffset(top, worldHeight, artworkHeight) {
  const limit=Math.max(0,(Number(worldHeight)||0)-(Number(artworkHeight)||0));
  return Math.min(limit,Math.max(0,-(Number(top)||0)));
}

/**
 * Keeps the viewport-height artwork in view within its two-section world.
 * Reads rendered geometry, so native scrolling and transformed smooth scrolling
 * use exactly the same calculation. Never creates a canvas or renderer.
 */
export function createSharedScene(world, options = {}) {
  const win=typeof window==='undefined'?null:window;
  const doc=typeof document==='undefined'?null:document;
  const nativeSticky=!!options.nativeTouch&&!!win?.CSS?.supports?.('overflow','clip')&&!!win?.CSS?.supports?.('height','100lvh');
  const artwork=world?.querySelector?.('[data-shared-artwork]');
  const hero=world?.querySelector?.('#home');
  const motion=win?.matchMedia?.('(prefers-reduced-motion: reduce)');
  let disposed=false, externalVisible=true, pageVisible=true, regionVisible=false;
  let renderer=null, originalSetVisible=null, rendererRequestedVisible=true;
  let observer=null, lastTransform='', lastScrollStyle='';
  const cleanups=[];
  const controller={
    update,
    getInitialScrollState(){
      if(disposed||!world||!artwork||!win)return null;
      const rect=world.getBoundingClientRect();
      const artworkHeight=artwork.clientHeight||win.innerHeight||1;
      return {
        offsetPx:sharedSceneOffset(rect.top,world.offsetHeight||rect.height||0,artworkHeight),
        heroHeightPx:hero?.offsetHeight||artworkHeight,
      };
    },
    bindRenderer(value){
      if(!value || !world || !artwork || !win || !doc)return false;
      if(disposed){value.dispose?.();return false;}
      if(renderer){if(renderer===value){update();return true;}return false;}
      renderer=value;
      originalSetVisible=value.setVisible?.bind(value);
      if(originalSetVisible){
        // initHero's own IO invokes this controller property dynamically.
        // Gate only this already-created instance; shared hero code is untouched.
        value.setVisible=visible=>{rendererRequestedVisible=!!visible;applyVisibility();};
      }
      update();return true;
    },
    setVisible(value){externalVisible=!!value;applyVisibility();},
    dispose(){
      if(disposed)return;
      disposed=true;observer?.disconnect();
      cleanups.splice(0).forEach(remove=>remove());
      originalSetVisible?.(false);renderer?.dispose?.();
      renderer=null;originalSetVisible=null;
    },
  };
  function listen(target,type,handler,options){target?.addEventListener?.(type,handler,options);cleanups.push(()=>target?.removeEventListener?.(type,handler,options));}
  function applyVisibility(){
    originalSetVisible?.(!disposed && externalVisible && pageVisible && !doc?.hidden && regionVisible && rendererRequestedVisible);
  }
  function update(){
    if(disposed||!world||!artwork||!win)return;
    const rect=world.getBoundingClientRect();
    const worldHeight=world.offsetHeight||rect.height||0;
    const artworkHeight=artwork.clientHeight||win.innerHeight||0;
    const offset=sharedSceneOffset(rect.top,worldHeight,artworkHeight);
    const transform=`translate3d(0,${Math.round(offset*1000)/1000}px,0)`;
    if(!nativeSticky&&transform!==lastTransform){artwork.style.transform=transform;lastTransform=transform;}
    // The viewport remains bounded while its field samples a continuous world.
    // At zero scroll every value is the original first-screen presentation.
    const heroHeight=hero?.offsetHeight||artworkHeight||1;
    const progress=offset/heroHeight;
    const lensProgress=Math.min(1,Math.max(0,progress));
    const lensOpacity=1-lensProgress*lensProgress*(3-2*lensProgress);
    const fieldTravel=motion?.matches?0:progress*18;
    const lensY=motion?.matches||options.nativeTouch?0:-offset*.9;
    const scrollStyle=`${fieldTravel}|${lensY}|${lensOpacity}`;
    if(scrollStyle!==lastScrollStyle){
      artwork.style.setProperty?.('--shared-field-travel',`${fieldTravel.toFixed(3)}%`);
      artwork.style.setProperty?.('--shared-lens-y',`${lensY.toFixed(3)}px`);
      artwork.style.setProperty?.('--shared-lens-opacity',lensOpacity.toFixed(5));
      lastScrollStyle=scrollStyle;
    }
    renderer?.setScrollOffset?.(offset,heroHeight);
    const bottom=Number.isFinite(rect.bottom)?rect.bottom:rect.top+worldHeight;
    const viewportHeight=win.innerHeight||artworkHeight;
    regionVisible=worldHeight>0 && bottom>0 && rect.top<viewportHeight;
    applyVisibility();
  }
  if(!world||!artwork||!win||!doc)return controller;
  listen(win,'resize',update,{passive:true});
  listen(motion,'change',update);
  listen(doc,'visibilitychange',applyVisibility);
  listen(win,'pagehide',()=>{pageVisible=false;applyVisibility();});
  listen(win,'pageshow',()=>{pageVisible=true;update();});
  if('ResizeObserver' in win){
    observer=new win.ResizeObserver(update);observer.observe(world);observer.observe(artwork);
  }
  // Scroll is supplied by the app's existing native/Locomotive callback. There
  // is deliberately no extra RAF loop, wheel handler, or second scroll engine.
  update();
  return controller;
}
