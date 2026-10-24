const instances=new WeakMap();
const noop=()=>({select:()=>false,dispose(){},get selected(){return null;}});
/** Local, progressively enhanced tabs. This controller never owns page scroll. */
export function createJourneyGuide(root,{onLayout}={}){
 if(!root?.querySelector||!root?.querySelectorAll)return noop();
 if(instances.has(root))return instances.get(root);
 const list=root.querySelector('[data-journey-tabs]'),tabs=[...root.querySelectorAll('[data-journey-tab]')],panels=[...root.querySelectorAll('[data-journey-panel]')];
 const keys=tabs.map(tab=>tab.dataset.journeyTab);
 if(!list||!tabs.length||tabs.length!==panels.length||new Set(keys).size!==keys.length||keys.some(key=>!key||panels.filter(panel=>panel.dataset.journeyPanel===key).length!==1))return noop();
 let disposed=false,selected=keys[0];
 const saved=elements=>elements.map(element=>({element,attributes:Object.fromEntries(['role','tabindex','aria-selected','aria-labelledby','aria-hidden','inert','aria-orientation'].map(name=>[name,element.getAttribute(name)]))}));
 const original=saved([list,...tabs,...panels]),listWasHidden=list.hidden,previousEnhanced=root.dataset.journeyEnhanced;
 function select(key,{focus=false}={}){
  if(disposed||!keys.includes(key))return false;
  selected=key;
  for(const tab of tabs){const active=tab.dataset.journeyTab===key;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}
  for(const panel of panels){const active=panel.dataset.journeyPanel===key;panel.setAttribute('aria-hidden',String(!active));if(active)panel.removeAttribute('inert');else panel.setAttribute('inert','');}
  if(focus)tabs[keys.indexOf(key)].focus({preventScroll:true});
  return true;
 }
 function click(event){const tab=tabs.find(item=>item===event.target||item.contains?.(event.target));if(tab)select(tab.dataset.journeyTab);}
 function keydown(event){
  if(event.altKey||event.ctrlKey||event.metaKey)return;
  const index=tabs.findIndex(tab=>tab===event.target);if(index<0)return;
  // Keep the button's native Space activation, without a smooth-scroll
  // ancestor interpreting the same key as a request to move the page.
  if(event.key===' '){event.stopPropagation();return;}
  let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;
  event.preventDefault();event.stopPropagation();select(keys[next],{focus:true});
 }
 function restore(){
  for(const {element,attributes}of original)for(const[name,value]of Object.entries(attributes))if(value===null)element.removeAttribute(name);else element.setAttribute(name,value);
  list.hidden=listWasHidden;if(previousEnhanced===undefined)delete root.dataset.journeyEnhanced;else root.dataset.journeyEnhanced=previousEnhanced;
 }
 try{
  list.setAttribute('role','tablist');list.setAttribute('aria-orientation','horizontal');
  for(const tab of tabs)tab.setAttribute('role','tab');
  for(const panel of panels){panel.setAttribute('role','tabpanel');panel.setAttribute('tabindex','0');panel.setAttribute('aria-labelledby',tabs[keys.indexOf(panel.dataset.journeyPanel)].id);}
  select(selected);list.addEventListener('click',click);list.addEventListener('keydown',keydown);root.dataset.journeyEnhanced='true';list.hidden=false;
 }catch{
  list.removeEventListener?.('click',click);list.removeEventListener?.('keydown',keydown);restore();return noop();
 }
 const controller={select,get selected(){return disposed?null:selected;},dispose(){if(disposed)return;disposed=true;list.removeEventListener('click',click);list.removeEventListener('keydown',keydown);restore();instances.delete(root);}};
 instances.set(root,controller);
 // One optional geometry notification after enhancement; switching tabs keeps
 // their shared grid height and needs no resize event or scrolling side effect.
 if(typeof onLayout==='function')try{onLayout();}catch{}
 return controller;
}
