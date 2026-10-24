/** Local-only native-radio enhancement. No persistence, requests, pinning or scroll ownership. */
export function createModuleExperience(root,options={}){
 const win=options.window||globalThis.window,doc=options.document||root?.ownerDocument||globalThis.document;
 const group=root?.querySelector?.('[data-module-interaction]');
 const radios=[...(group?.querySelectorAll?.('[data-module-choice]')||[])],panels=[...(group?.querySelectorAll?.('[data-module-panel]')||[])];
 if(!group||!radios.length||radios.length!==panels.length)return{select:()=>false,dispose(){},get selected(){return null;}};
 const status=group.querySelector('[data-module-status]'),known=new Map(radios.map(r=>[r.dataset.moduleChoice,r]));
 if(known.size!==radios.length||new Set(panels.map(p=>p.dataset.modulePanel)).size!==panels.length||panels.some(p=>!known.has(p.dataset.modulePanel)))return{select:()=>false,dispose(){},get selected(){return null;}};
 let disposed=false,selected=null,frame=0;
 const raf=options.requestAnimationFrame||win?.requestAnimationFrame?.bind(win)||((fn)=>setTimeout(fn,0));
 const caf=options.cancelAnimationFrame||win?.cancelAnimationFrame?.bind(win)||clearTimeout;
 function select(id,announce=true){
  if(disposed||!known.has(id))return false;
  selected=id;group.dataset.moduleSelected=id;
  for(const radio of radios)radio.checked=radio.dataset.moduleChoice===id;
  for(const panel of panels){const active=panel.dataset.modulePanel===id;panel.classList.toggle('is-current',active);panel.setAttribute('aria-hidden',String(!active));if(active)panel.removeAttribute('inert');else panel.setAttribute('inert','');}
  if(status&&announce){const label=known.get(id).closest?.('label')?.querySelector?.('span')?.textContent?.replace(/^\s*\d+\s*/,'').replace(/↗/g,'').trim()||id;status.textContent=`Perspectiva selecionada: ${label}.`;}
  return true;
 }
 function change(event){const target=event.target;if(radios.includes(target)&&target.checked)select(target.dataset.moduleChoice);}
 function keydown(event){if(!radios.includes(event.target)||event.altKey||event.ctrlKey||event.metaKey)return;const key=event.key;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(key)){event.stopPropagation();return;}if(key==='Home'||key==='End'){event.preventDefault();event.stopPropagation();const target=key==='Home'?radios[0]:radios.at(-1);select(target.dataset.moduleChoice);target.focus?.({preventScroll:true});}}
 group.addEventListener('change',change);group.addEventListener('keydown',keydown);group.classList.add('is-enhanced');
 select(radios.find(r=>r.checked)?.dataset.moduleChoice||radios[0].dataset.moduleChoice,false);
 // Enhancement compresses the no-JS reading edition once. Later selections use
 // overlapping grid cells, whose maximum intrinsic height remains unchanged.
 frame=raf(()=>{frame=0;if(disposed)return;if(options.onLayout)options.onLayout();else if(win?.dispatchEvent&&win?.Event)win.dispatchEvent(new win.Event('resize'));});
 return{select,get selected(){return selected;},dispose(){if(disposed)return;disposed=true;if(frame)caf(frame);frame=0;group.removeEventListener('change',change);group.removeEventListener('keydown',keydown);group.classList.remove('is-enhanced');delete group.dataset.moduleSelected;for(const panel of panels){panel.classList.remove('is-current');panel.removeAttribute('aria-hidden');panel.removeAttribute('inert');}if(status)status.textContent='';}};
}

/** Reinitialize the same semantic edition after a BFCache restoration. */
export function mountModuleExperiences(doc=globalThis.document,win=globalThis.window){
 if(!doc?.querySelectorAll||!win?.addEventListener)return{dispose(){}};
 let controllers=[],disposed=false;
 const start=()=>{if(disposed||controllers.length)return;controllers=[...doc.querySelectorAll('[data-module-experience]')].map(root=>createModuleExperience(root,{document:doc,window:win}));};
 const pause=()=>{controllers.forEach(c=>c.dispose());controllers=[];};
 const resume=()=>start();start();win.addEventListener('pagehide',pause);win.addEventListener('pageshow',resume);
 return{dispose(){if(disposed)return;disposed=true;pause();win.removeEventListener('pagehide',pause);win.removeEventListener('pageshow',resume);}};
}
if(typeof document!=='undefined'&&typeof window!=='undefined')mountModuleExperiences(document,window);
