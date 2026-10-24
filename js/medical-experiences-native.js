/** Touch-first gallery: the browser owns horizontal and vertical gestures, never a GPU intro. */
export function nearestExperienceCard(ring,cards){
 if(!cards.length)return 0;
 const viewport=ring.getBoundingClientRect?.(),center=(viewport?.left||0)+(ring.clientWidth||viewport?.width||0)/2;
 let nearest=0,distance=Infinity;
 cards.forEach((card,index)=>{const rect=card.getBoundingClientRect?.();const x=rect?rect.left+rect.width/2:(viewport?.left||0)+(card.offsetLeft||0)+(card.offsetWidth||0)/2-(ring.scrollLeft||0);const delta=Math.abs(x-center);if(delta<distance){distance=delta;nearest=index;}});
 return nearest;
}
export function createNativeMedicalExperiences(root,options={}){
 const noop={update(){},setVisible(){},dispose(){},selected:0,enhanced:false};
 if(!root)return noop;
 const win=options.window||globalThis.window,doc=options.document||root.ownerDocument||globalThis.document;
 const stage=root.querySelector('[data-experience-stage]'),ring=root.querySelector('[data-experience-ring]');
 const cards=[...root.querySelectorAll('[data-experience-card]')],panels=[...root.querySelectorAll('[data-experience-panel]')],jumps=[...root.querySelectorAll('[data-experience-jump]')];
 if(!win||!stage||!ring||!cards.length||panels.length!==cards.length)return noop;
 const controls=root.querySelector('[data-experience-controls]'),counter=root.querySelector('[data-experience-counter]'),status=root.querySelector('[data-experience-status]'),hint=root.querySelector('[data-experience-hint]');
 const prev=root.querySelector('[data-experience-prev]'),next=root.querySelector('[data-experience-next]'),continueButton=root.querySelector('[data-experience-continue]');
 const reduced=win.matchMedia?.('(prefers-reduced-motion: reduce)'),cleanup=[],original={state:root.dataset.state,hidden:panels.map(panel=>panel.hidden),controls:controls?.hidden,continue:continueButton?.hidden,counter:counter?.textContent,status:status?.textContent,hint:hint?.textContent,ringHidden:ring.getAttribute?.('aria-hidden'),prev:prev?.disabled,next:next?.disabled,jumps:jumps.map(button=>({disabled:button.disabled,current:button.getAttribute?.('aria-current')}))};
 let selected=0,requested=null,visible=true,disposed=false,frame=0,notifying=false;
 let lastWidth=ring.clientWidth||ring.getBoundingClientRect?.().width||0;
 const notifyLayout=()=>{if(notifying||disposed)return;notifying=true;try{options.onLayout?.();}finally{notifying=false;}};
 const on=(target,type,fn,settings)=>{target?.addEventListener?.(type,fn,settings);cleanup.push(()=>target?.removeEventListener?.(type,fn,settings));};
 const active=()=>!disposed&&visible&&!doc?.hidden&&doc?.visibilityState!=='hidden';
 const stop=()=>{if(frame)win.cancelAnimationFrame?.(frame);frame=0;};
 function select(index,announce=false){
  if(disposed)return;const nextIndex=Math.max(0,Math.min(cards.length-1,Math.round(index)||0)),changed=selected!==nextIndex;selected=nextIndex;
  panels.forEach((panel,i)=>{panel.hidden=i!==selected;});
  jumps.forEach((button,i)=>{button.disabled=false;if(i===selected)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');});
  if(counter)counter.textContent=`${String(selected+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;
  if(prev)prev.disabled=selected===0;if(next)next.disabled=selected===cards.length-1;
  if(status&&announce&&changed)status.textContent=`${selected+1} de ${cards.length}: ${panels[selected].querySelector?.('h3')?.textContent||'Instituição selecionada'}.`;
  if(changed)notifyLayout();
 }
 function update(){if(!active()||notifying)return;const nearest=nearestExperienceCard(ring,cards);if(requested===nearest)requested=null;select(nearest,true);}
 function schedule(){if(!active()||frame)return;if(!win.requestAnimationFrame){update();return;}frame=win.requestAnimationFrame(()=>{frame=0;update();});}
 function go(index,behavior){
  if(!active())return;const target=Math.max(0,Math.min(cards.length-1,Math.round(index)||0));requested=target;
  const viewport=ring.getBoundingClientRect?.(),card=cards[target].getBoundingClientRect?.();
  const left=card&&viewport?(ring.scrollLeft||0)+card.left+card.width/2-viewport.left-(ring.clientWidth||viewport.width)/2:(cards[target].offsetLeft||0)-(cards[0].offsetLeft||0);
  const max=Math.max(0,(ring.scrollWidth||Infinity)-(ring.clientWidth||0));
  ring.scrollTo?.({left:Math.max(0,Math.min(max,left)),behavior:behavior||(reduced?.matches?'auto':'smooth')});
  select(target,true);
 }
 root.dataset.state='native';ring.removeAttribute?.('aria-hidden');
 if(controls)controls.hidden=false;if(continueButton)continueButton.hidden=true;
 if(hint)hint.textContent='Deslize para o lado ou use as setas para conhecer as instituições.';
 on(ring,'pointerdown',()=>{requested=null;},{passive:true});
 on(ring,'scroll',schedule,{passive:true});on(ring,'scrollend',()=>{requested=null;update();},{passive:true});
 on(prev,'click',()=>go((requested??selected)-1));on(next,'click',()=>go((requested??selected)+1));
 jumps.forEach(button=>on(button,'click',()=>go(Number(button.dataset.experienceJump))));
 on(stage,'keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey||event.target?.isContentEditable||event.target?.closest?.('a,button,input,textarea,select,[contenteditable="true"]'))return;
  let target;if(event.key==='ArrowLeft')target=(requested??selected)-1;if(event.key==='ArrowRight')target=(requested??selected)+1;if(event.key==='Home')target=0;if(event.key==='End')target=cards.length-1;
  if(target===undefined||!active())return;event.preventDefault();event.stopPropagation();go(target);
 });
 on(win,'resize',()=>{const width=ring.clientWidth||ring.getBoundingClientRect?.().width||0;if(Math.abs(width-lastWidth)<.5)return;lastWidth=width;go(requested??selected,'auto');},{passive:true});on(doc,'visibilitychange',()=>{if(active())schedule();else stop();});
 for(const details of root.querySelectorAll('details'))on(details,'toggle',notifyLayout);
 select(nearestExperienceCard(ring,cards));notifyLayout();
 return {update,setVisible(value){visible=!!value;if(visible)update();else stop();},dispose(){
  if(disposed)return;disposed=true;stop();cleanup.splice(0).forEach(fn=>fn());
  if(original.state===undefined)delete root.dataset.state;else root.dataset.state=original.state;
  panels.forEach((panel,i)=>{panel.hidden=original.hidden[i];});
  if(controls)controls.hidden=original.controls;if(continueButton)continueButton.hidden=original.continue;
  if(counter)counter.textContent=original.counter;if(status)status.textContent=original.status;if(hint)hint.textContent=original.hint;
  if(prev)prev.disabled=original.prev;if(next)next.disabled=original.next;
  if(original.ringHidden==null)ring.removeAttribute?.('aria-hidden');else ring.setAttribute?.('aria-hidden',original.ringHidden);
  jumps.forEach((button,i)=>{button.disabled=original.jumps[i].disabled;const current=original.jumps[i].current;if(current==null)button.removeAttribute('aria-current');else button.setAttribute('aria-current',current);});
 },get selected(){return selected;},get enhanced(){return !disposed;}};
}
