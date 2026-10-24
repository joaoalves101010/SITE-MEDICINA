import { journeyStages, evidenceTopics, possibilityTracks, prioritySteps } from './trajectory-page.js';

/** Route-local editorial controls. No account, storage, network or saved plan. */
export function createTrajectory(root, { window: win=globalThis.window, document: doc=root?.ownerDocument, onLayout }={}) {
  if (!root || !doc) return { dispose(){} };
  const cleanups=[], changed=[]; let disposed=false,layoutFrame=0;
  const queueLayout=()=>{if(disposed||layoutFrame||!win?.requestAnimationFrame)return;layoutFrame=win.requestAnimationFrame(()=>{layoutFrame=0;if(disposed)return;if(onLayout)onLayout();else if(win.dispatchEvent&&win.Event)win.dispatchEvent(new win.Event('resize'));});};
  const query=selector=>root.querySelector(selector);
  const listen=(node,type,fn)=>{node?.addEventListener(type,fn);cleanups.push(()=>node?.removeEventListener(type,fn));};
  const attr=(node,name,value)=>{if(!node)return;changed.push([node,name,node.getAttribute(name)]);if(value===null)node.removeAttribute(name);else node.setAttribute(name,String(value));};
  const text=(selector,value)=>{const node=query(selector);if(node)node.textContent=value;};
  const list=(selector,items)=>{const node=query(selector);if(!node)return;node.replaceChildren(...items.map(value=>{const item=doc.createElement('li');item.textContent=value;return item;}));};
  const groups=[
    {key:'stage',selector:'[data-journey-stage]',attribute:'journeyStage',values:journeyStages,panel:'#trajectory-stage-panel',apply(value){text('[data-stage-title]',value.title);text('[data-stage-copy]',value.copy);}},
    {key:'evidence',selector:'[data-evidence-tab]',attribute:'evidenceTab',values:evidenceTopics,panel:'#trajectory-evidence-panel',apply(value){text('[data-evidence-title]',value.title);text('[data-evidence-body]',value.body);list('[data-evidence-list]',value.list);}},
    {key:'possibility',selector:'[data-possibility-tab]',attribute:'possibilityTab',values:possibilityTracks,panel:'#trajectory-possibility-panel',apply(value){text('[data-possibility-title]',value.title);text('[data-possibility-body]',value.body);text('[data-possibility-preparation]',value.preparation);text('[data-possibility-context]',value.context);text('[data-possibility-dedication]',value.dedication);}}
  ];
  for(const group of groups){
    const buttons=[...root.querySelectorAll(group.selector)];const panel=query(group.panel);
    if(!buttons.length||!panel)continue;
    const parent=buttons[0].closest('[data-tabs-group]')||buttons[0].parentElement;
    attr(parent,'role','tablist');attr(parent,'aria-orientation','horizontal');
    attr(panel,'role','tabpanel');attr(panel,'tabindex','0');attr(panel,'aria-labelledby',panel.getAttribute('aria-labelledby'));
    for(const[ i,button]of buttons.entries()){
      if(!button.id)attr(button,'id',`trajectory-${group.key}-tab-${i}`);
      attr(button,'role','tab');attr(button,'aria-controls',panel.id);attr(button,'aria-pressed',null);
      // Record the baseline once; subsequent state changes remain local.
      attr(button,'tabindex',i?'-1':'0');attr(button,'aria-selected',String(i===0));
    }
    let active=buttons.findIndex(button=>button.dataset[group.attribute]===Object.keys(group.values)[0]);if(active<0)active=0;
    const select=(index,focus=false)=>{
      if(disposed||!Number.isInteger(index)||index<0||index>=buttons.length)return;
      const button=buttons[index],key=button.dataset[group.attribute],value=group.values[key];if(!value)return;
      active=index;for(const[ i,item]of buttons.entries()){item.setAttribute('aria-selected',String(i===index));item.tabIndex=i===index?0:-1;item.classList.toggle('is-active',i===index);}
      panel.setAttribute('aria-labelledby',button.id);group.apply(value);root.dataset[group.key]=key;
      if(focus)button.focus({preventScroll:true});queueLayout();
    };
    for(const[ i,button]of buttons.entries()){
      listen(button,'click',()=>select(i));
      listen(button,'keydown',event=>{
        if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
        if(event.key===' '){event.stopPropagation();return;}
        let next;if(event.key==='ArrowRight')next=(active+1)%buttons.length;else if(event.key==='ArrowLeft')next=(active-1+buttons.length)%buttons.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;else return;
        event.preventDefault();event.stopPropagation();select(next,true);
      });
    }
    select(active);
  }
  const radios=[...root.querySelectorAll('input[name="journey-priority"]')];
  const selectPriority=key=>{const value=prioritySteps[key];if(disposed||!value)return;list('[data-next-step-list]',value.steps);root.dataset.priority=key;const label=query('[data-next-step-label]');if(label)label.textContent=value.label;queueLayout();};
  radios.forEach(radio=>{listen(radio,'change',()=>{if(radio.checked)selectPriority(radio.value);});listen(radio,'keydown',event=>{if(event.altKey||event.ctrlKey||event.metaKey)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(event.key))event.stopPropagation();});});
  selectPriority(radios.find(radio=>radio.checked)?.value||'organize');
  root.dataset.enhanced='true';
  const dispose=()=>{if(disposed)return;disposed=true;if(layoutFrame)win?.cancelAnimationFrame?.(layoutFrame);layoutFrame=0;cleanups.splice(0).forEach(fn=>fn());delete root.dataset.enhanced;for(const[node,name,value]of changed.reverse()){if(value===null)node.removeAttribute(name);else node.setAttribute(name,value);} };
  listen(win,'pagehide',event=>{if(!event.persisted)dispose();});
  return {dispose};
}
if(typeof document!=='undefined')createTrajectory(document.querySelector('[data-trajectory]'));
