import { usesNativeTouchScroll } from './scroll-policy.js';
import {createExperienceDiagnostic} from './experience-diagnostic.js';
import { medicalExperiences } from './medical-experiences.js';
import {createExperienceEngagement,experienceEntryVisual,experienceIntroDuration} from './experience-engagement.js';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));

/** Two-word blur/alpha-threshold morph; unchanged words remain crisp outside the filter. */
export function createExperienceMeta(root,{window:win=window,reduced=()=>false}={}){
  const groups=['left','right'].map(side=>{const node=root.querySelector(`[data-experience-meta="${side}"]`);return {node,goo:node?.querySelector('[data-experience-meta-goo]'),layers:[...node?.querySelectorAll('[data-experience-meta-layer]')||[]],held:node?.querySelector('[data-experience-meta-held]'),previous:['',''],moving:[false,false]};});
  let frame=0,disposed=false,start=0;
  function fade(node,amount){if(!node)return;node.style.opacity=String(amount<=0?0:amount>=1?1:Math.pow(amount,.4));node.style.filter=amount<=0||amount>=1?'none':`blur(${Math.min(8.5/amount-8.5,100)}px)`;}
  function draw(t){for(const group of groups){if(group.goo)group.goo.style.filter=t>=1?'none':'url(#experience-name-goo) blur(.35px)';for(let slot=0;slot<2;slot++){fade(group.layers[0]?.children[slot],group.moving[slot]?1-t:0);fade(group.layers[1]?.children[slot],group.moving[slot]?t:0);fade(group.held?.children[slot],group.moving[slot]?0:1);}}}
  function tick(now){frame=0;if(disposed)return;const elapsed=clamp((now-start)/1200);draw(Math.sqrt(1-Math.pow(elapsed-1,2)));if(elapsed<1)frame=win.requestAnimationFrame(tick);}
  return {set(left,right,{instant=false}={}){if(disposed)return;if(frame)win.cancelAnimationFrame(frame);frame=0;draw(1);for(const [i,parts]of[left,right].entries()){const group=groups[i];for(let slot=0;slot<2;slot++){const next=String(parts[slot]??'');group.moving[slot]=next!==group.previous[slot];if(group.layers[0]?.children[slot])group.layers[0].children[slot].textContent=group.previous[slot];if(group.layers[1]?.children[slot])group.layers[1].children[slot].textContent=next;if(group.held?.children[slot])group.held.children[slot].textContent=next;group.previous[slot]=next;}}if(instant||reduced()){draw(1);return;}draw(0);start=win.performance?.now?.()??performance.now();frame=win.requestAnimationFrame(tick);},pause(){if(frame)win.cancelAnimationFrame(frame);frame=0;draw(1);},dispose(){if(disposed)return;disposed=true;if(frame)win.cancelAnimationFrame(frame);frame=0;}};
}

/** Progressive section adapter; the independently authored engine owns all ring motion. */
export function createMedicalExperiences(root,options={}){
  if(!root)return {update(){},setVisible(){},dispose(){}};
  const win=options.window||window,doc=options.document||document;
  const nativeTouch=options.nativeTouch??usesNativeTouchScroll(win);
  let touchIntroStarted=false;
  const stage=root.querySelector('[data-experience-stage]'),canvas=root.querySelector('[data-experience-canvas]'),ring=root.querySelector('[data-experience-ring]');
  if(!stage||!canvas||!ring)return {update(){},setVisible(){},dispose(){}};
  const panels=[...root.querySelectorAll('[data-experience-panel]')],cards=[...root.querySelectorAll('[data-experience-card]')],jumps=[...root.querySelectorAll('[data-experience-jump]')];
  const controls=root.querySelector('[data-experience-controls]'),status=root.querySelector('[data-experience-status]'),counter=root.querySelector('[data-experience-counter]'),entry=root.querySelector('[data-experience-entry-title]'),tag=root.querySelector('[data-experience-cursor-tag]');
  const continueLabel=root.querySelector('[data-experience-continue-label]');
  const header=doc.querySelector?.('.site-header'),headerWasInert=header?.inert??false;
  const media=win.matchMedia('(prefers-reduced-motion: reduce)'),hint=root.querySelector('[data-experience-hint]'),cleanup=[];
  const diagnostic=createExperienceDiagnostic({window:win,document:doc,reduced:()=>media.matches});
  const defaultHint=hint?.textContent||'Arraste para explorar. Use as setas para escolher.';
  const on=(target,event,fn,opts)=>{target?.addEventListener?.(event,fn,opts);cleanup.push(()=>target?.removeEventListener?.(event,fn,opts));};
  const loader=options.loadEngine||(()=>import('./viscose-engine.js'));
  let disposed=false,externalVisible=true,engine=null,starting=false,failed=false,generation=0,selected=0,announced=-1,introComplete=false,entryElapsed=0,cursorPoint=null;
  const glyphs=[...root.querySelectorAll('[data-experience-entry-glyph]')],indexList=root.querySelector('[data-experience-index]'),introDuration=experienceIntroDuration(glyphs.length);
  const viewport=()=>Math.max(1,win.innerHeight||doc.documentElement?.clientHeight||1);
  const allowed=()=>!disposed&&externalVisible&&doc.visibilityState!=='hidden';
  const near=()=>{const r=root.getBoundingClientRect();return r.top<viewport()+700&&r.bottom>-700;};
  const visible=()=>{if(!allowed())return false;const r=stage.getBoundingClientRect();return r.top<viewport()&&r.bottom>0;};
  function syncCursor(){const r=stage.getBoundingClientRect(),p=cursorPoint;doc.body?.classList?.toggle('experience-cursor-active',!!p&&allowed()&&root.dataset.state==='interactive'&&p.x>=r.left&&p.x<=r.left+r.width&&p.y>=r.top&&p.y<=r.bottom);}
  function presentationActive(){if(!nativeTouch)return engagement.engaged;if(!allowed()||doc.body?.classList?.contains('menu-open'))return false;const r=stage.getBoundingClientRect(),height=Number(r.height??r.bottom-r.top)||0,shown=Math.max(0,Math.min(viewport(),r.bottom)-Math.max(0,r.top));if(height>0&&shown>=Math.min(viewport(),height)*.65)touchIntroStarted=true;return touchIntroStarted&&visible();}
  function syncWaiting(){root.dataset.entryWaiting=String(!media.matches&&!introComplete&&entryElapsed<=.25&&!presentationActive());}
  const meta=createExperienceMeta(root,{window:win,reduced:()=>media.matches});
  const engagement=createExperienceEngagement(stage,{window:win,document:doc,nativeTouch:()=>nativeTouch,allowed:()=>allowed()&&!doc.body?.classList?.contains('menu-open'),reduced:()=>media.matches,getScrollY:options.getScrollY,scrollImmediate:options.scrollImmediate,onChange(active){root.dataset.engaged=String(active);doc.body?.classList?.toggle('experience-reading-active',active);if(header)header.inert=active?true:headerWasInert;engine?.setEngaged?.(active);syncWaiting();}});
  function select(index,instant=false){
    const next=((Math.round(index)%medicalExperiences.length)+medicalExperiences.length)%medicalExperiences.length,p=medicalExperiences[next];
    if(!p||disposed)return;selected=next;
    for(const [i,panel]of panels.entries())panel.hidden=i!==next;
    for(const [i,button]of jumps.entries()){if(i===next)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');}
    if(continueLabel)continueLabel.textContent=next===medicalExperiences.length-1?'Continuar página':'Pular galeria';
    if(counter)counter.textContent=`${String(next+1).padStart(2,'0')} / ${String(medicalExperiences.length).padStart(2,'0')}`;
    if(introComplete||media.matches)meta.set([String(next+1).padStart(2,'0'),p.shortName],[p.type,p.country],{instant:instant||!visible()});
    if(status&&visible()&&announced!==next){status.textContent=`${next+1} de ${medicalExperiences.length}: ${p.name}. ${p.type}. ${p.country}.`;announced=next;}
    options.onLayout?.();
  }
  function pose(frame){
    if(disposed||root.dataset.state!=='interactive')return;
    for(const card of frame.cards){const node=cards[card.index];if(!node)continue;node.style.width=`${frame.cardWidth}px`;node.style.height=`${frame.cardHeight}px`;node.style.borderRadius=`${frame.cornerRadius}px`;node.style.transform=`translate3d(${card.x-frame.cardWidth*.5}px,${card.y-frame.cardHeight*.5}px,0) rotate(${card.rotation}rad) scale(${card.scaleX},${card.scaleY})`;node.style.opacity=String(card.scaleX<.001||card.scaleY<.001?0:card.brightness);}
    root.dataset.interactive=String(frame.interactive);
    introComplete=!!frame.interactive;entryElapsed=frame.entryElapsed??frame.entryProgress*introDuration;syncWaiting();
    const entryState=experienceEntryVisual(frame.entryElapsed??frame.entryProgress*introDuration,glyphs.length,media.matches);
    if(entry)entry.style.opacity='1';for(const [i,glyph]of glyphs.entries()){glyph.style.transform=`translateY(${entryState.glyphs[i].y}%)`;glyph.style.opacity=String(entryState.glyphs[i].opacity);}if(indexList)indexList.style.opacity=String(entryState.indexOpacity);
    for(const [i,button]of jumps.entries()){button.disabled=!introComplete&&!media.matches;button.classList?.toggle('is-front',i===frame.selected);}for(const button of [root.querySelector('[data-experience-prev]'),root.querySelector('[data-experience-next]')])if(button)button.disabled=!introComplete&&!media.matches;
    if(tag){const t=frame.tag||{};tag.style.transform=`translate3d(${frame.width*.5+(t.x||0)}px,${frame.height*.5-(t.y||0)}px,0) scale(${t.sx||1},${t.sy||0})`;tag.style.opacity=(t.sy||0)>.001&&frame.width>1024?'1':'0';}
  }
  function restore(){root.dataset.state='static';delete root.dataset.renderMode;delete root.dataset.interactive;delete root.dataset.entryWaiting;for(const p of panels)p.hidden=false;if(controls)controls.hidden=true;if(status)status.textContent='';meta.pause();options.onLayout?.();}
  function release(){generation++;engine?.dispose();engine=null;starting=false;meta.pause();}
  async function start(){
    if(starting||engine||failed||!allowed()||!near())return;starting=true;const token=++generation;
    try{const {createViscoseEngine}=await loader();if(disposed||token!==generation||!allowed()||!near()){starting=false;return;}
      root.dataset.state='interactive';root.dataset.renderMode='fallback';syncWaiting();if(controls)controls.hidden=false;select(selected,true);
      const created=createViscoseEngine(stage,{canvas,onDiagnostic:diagnostic.enabled?snapshot=>diagnostic.update(snapshot):undefined,engaged:false,introDuration,wheelEnabled:()=>!nativeTouch,wheelOwned:()=>engagement.engaged,onWheelConsume:()=>engagement.align(),onWheelExit:()=>engagement.release(),files:medicalExperiences.map(p=>({src:p.image,focalY:p.id==='nus'?.35:.5})),window:win,document:doc,onPose:frame=>{if(!disposed&&token===generation)pose(frame);},onSelection:index=>{if(!disposed&&token===generation)select(index);},onReady(result){if(disposed||token!==generation)return;const mode=typeof result==='string'?result:result?.mode;diagnostic.update({mode});root.dataset.renderMode=mode==='webgl'?'webgl':'fallback';},onMode(mode){if(!disposed&&token===generation){diagnostic.update({mode});root.dataset.renderMode=mode==='webgl'?'webgl':'fallback';}},onFallback(error){if(!disposed&&token===generation){diagnostic.update({mode:'fallback',error});root.dataset.renderMode='fallback';}}});
      if(disposed||token!==generation){created?.dispose();return;}engine=created;engine.setVisible(visible());engagement.update();engine.setEngaged?.(presentationActive());engine.resize();starting=false;options.onLayout?.();
    }catch(error){if(disposed||token!==generation)return;starting=false;failed=true;release();restore();diagnostic.update({mode:'fallback',phase:'fallback',error});options.onError?.(error);}
  }
  function update(){if(disposed)return;engagement.update();if(engagement.engaged&&header)header.inert=true;syncWaiting();if(hint)hint.textContent=media.matches?'Use os botões ou as setas do teclado para escolher.':defaultHint;if(media.matches)meta.pause();if(!engine){if(allowed()&&near())void start();return;}engine.updateBounds();syncCursor();const active=visible();engine.setVisible(active);if(nativeTouch)engine.setEngaged?.(presentationActive());if(!active){meta.pause();doc.body?.classList?.remove('experience-cursor-active');}}
  function pick(index){if(engine)engine.pick(index);}
  for(const button of jumps)on(button,'click',event=>{event.stopPropagation();pick(Number(button.dataset.experienceJump));});
  on(root.querySelector('[data-experience-prev]'),'click',()=>engine?.next(-1));on(root.querySelector('[data-experience-next]'),'click',()=>engine?.next(1));
  // Page-navigation keys share the finite wheel journey while this viewport is
  // owned. Tab/Escape, browser shortcuts and focused form actions stay native.
  on(doc,'keydown',event=>{
    if(!engagement.engaged||event.ctrlKey||event.metaKey||event.altKey||event.target?.isContentEditable||event.target?.closest?.('input,textarea,select,[contenteditable=""],[contenteditable="true"],[contenteditable="plaintext-only"]'))return;
    if((event.key===' '||event.key==='Spacebar')&&event.target?.closest?.('button,a,summary'))return;
    const down=['ArrowDown','PageDown','End'].includes(event.key),up=['ArrowUp','PageUp','Home'].includes(event.key),space=event.key===' '||event.key==='Spacebar';
    if(!down&&!up&&!space)return;
    event.preventDefault?.();event.stopPropagation?.();event.stopImmediatePropagation?.();
    if(introComplete)engine?.step?.(up||(space&&event.shiftKey)?-1:1,event);
  },{capture:true});
  on(stage,'keydown',event=>{if(event.target?.closest?.('a,input,textarea,select'))return;let target;if(event.key==='ArrowRight'||event.key==='ArrowDown')target=selected+1;if(event.key==='ArrowLeft'||event.key==='ArrowUp')target=selected-1;if(event.key==='Home')target=0;if(event.key==='End')target=medicalExperiences.length-1;if(target===undefined||!engine)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();if(event.key==='ArrowRight'||event.key==='ArrowDown')engine.next(1);else if(event.key==='ArrowLeft'||event.key==='ArrowUp')engine.next(-1);else pick(target);});
  on(root.querySelector('[data-experience-continue]'),'click',()=>{engagement.release();const target=root.querySelector('[data-experience-details]');if(target){options.scrollTo?.(target);target.focus?.({preventScroll:true});}});
  on(doc,'pointermove',event=>{cursorPoint=Number.isFinite(event.clientX)&&Number.isFinite(event.clientY)?{x:event.clientX,y:event.clientY}:null;syncCursor();},{passive:true});
  on(win,'blur',()=>{cursorPoint=null;syncCursor();});
  on(win,'resize',()=>{engine?.resize();update();options.onLayout?.();});on(doc,'visibilitychange',update);on(media,'change',update);
  for(const details of root.querySelectorAll('details'))on(details,'toggle',()=>options.onLayout?.());
  let observer;if(win.IntersectionObserver){observer=new win.IntersectionObserver(update,{rootMargin:'700px'});observer.observe(root);}
  update();
  return {update,setVisible(value){externalVisible=!!value;update();},dispose(){if(disposed)return;disposed=true;diagnostic.dispose();engagement.dispose();if(header)header.inert=headerWasInert;doc.body?.classList?.remove('experience-reading-active');release();meta.dispose();doc.body?.classList?.remove('experience-cursor-active');observer?.disconnect();cleanup.splice(0).forEach(fn=>fn());},get selected(){return selected;},get enhanced(){return !!engine;}};
}
