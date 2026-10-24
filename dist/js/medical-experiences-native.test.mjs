import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNativeMedicalExperiences,nearestExperienceCard} from './medical-experiences-native.js';
import {createMedicalExperiences} from './medical-experiences-controller.js';
import {renderMedicalExperiences,medicalExperiences} from './medical-experiences.js';
function node(extra={}){const events=new Map(),attrs=new Map();return Object.assign({events,attrs,dataset:{},style:{},hidden:false,textContent:'',disabled:false,addEventListener(type,fn,options){if(!events.has(type))events.set(type,new Set());events.get(type).add(fn);this.settings??={};this.settings[type]=options;},removeEventListener(type,fn){events.get(type)?.delete(fn);},emit(type,fields={}){const event={target:this,defaultPrevented:false,stopped:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;},...fields};for(const fn of events.get(type)||[])fn(event);return event;},setAttribute(name,value){attrs.set(name,String(value));},getAttribute(name){return attrs.get(name)??null;},removeAttribute(name){attrs.delete(name);},querySelector(){return null;},querySelectorAll(){return[];},count(){return [...events.values()].reduce((n,set)=>n+set.size,0);}},extra);}
function fixture({reduced=false}={}){
 let width=390,next=0;const frames=new Map(),scrolls=[],media=node({matches:reduced}),header={inert:false};
 const win=node({innerHeight:800,matchMedia:()=>media,requestAnimationFrame(fn){frames.set(++next,fn);return next;},cancelAnimationFrame(id){frames.delete(id);},scrollTo(){throw new Error('The page must not scroll programmatically');}});
 const doc=node({hidden:false,visibilityState:'visible',querySelector:()=>header});
 const stage=node(),ring=node({scrollLeft:0,get clientWidth(){return width;},get scrollWidth(){return width+width*.912*7;},getBoundingClientRect:()=>({left:0,width,height:width*.872/1.5}),scrollTo(options){scrolls.push(options);this.scrollLeft=options.left;}});ring.setAttribute('aria-hidden','true');
 const cards=medicalExperiences.map((data,i)=>node({dataset:{experienceCard:String(i)},getBoundingClientRect:()=>({left:width*.064+i*width*.912-ring.scrollLeft,width:width*.872,height:width*.872/1.5}),image:{src:data.image,style:{objectPosition:data.objectPosition||'50% 50%'}}}));
 const panels=medicalExperiences.map(data=>node({querySelector:selector=>selector==='h3'?{textContent:data.name}:null})),jumps=cards.map((_,i)=>node({dataset:{experienceJump:String(i)}}));
 const names=['controls','counter','status','hint','prev','next','continue'];const nodes=Object.fromEntries(names.map(name=>[name,node()]));nodes.controls.hidden=true;nodes.hint.textContent='Original hint';const details=node();
 const root=node({querySelector(selector){const key=selector.match(/^\[data-experience-(.+)\]$/)?.[1];return key==='stage'?stage:key==='ring'?ring:nodes[key]||null;},querySelectorAll(selector){return selector==='[data-experience-card]'?cards:selector==='[data-experience-panel]'?panels:selector==='[data-experience-jump]'?jumps:selector==='details'?[details]:[];}});
 return{root,win,doc,header,stage,ring,cards,panels,jumps,nodes,details,media,frames,scrolls,options:{window:win,document:doc},resize(value){width=value;ring.clientWidth=width;ring.scrollWidth=width+width*.912*7;win.emit('resize');},flush(){const work=[...frames.values()];frames.clear();work.forEach(fn=>fn());}};
}

test('native branch exits before any GPU loader, engagement, header lock or document input listener',()=>{
 const f=fixture();let imports=0;const c=createMedicalExperiences(f.root,{...f.options,nativeTouch:true,loadEngine(){imports++;throw new Error('Never load native GPU');}});assert.equal(imports,0);assert.equal(c.enhanced,true);assert.equal(f.root.dataset.state,'native');assert.equal(f.header.inert,false);for(const type of['wheel','touchstart','touchmove','keydown','pointermove'])assert.equal(f.doc.events.has(type),false,type);assert.equal(f.stage.events.has('wheel'),false);assert.equal(f.ring.events.has('touchmove'),false);c.dispose();
});

test('initial native rail exposes controls and one complete panel without moving either page or rail',()=>{
 const f=fixture(),c=createNativeMedicalExperiences(f.root,f.options);assert.equal(f.ring.getAttribute('aria-hidden'),null);assert.equal(f.nodes.controls.hidden,false);assert.equal(f.nodes.continue.hidden,true);assert.deepEqual(f.panels.map(p=>p.hidden),[false,true,true,true,true,true,true,true]);assert.equal(f.nodes.counter.textContent,'01 / 08');assert.equal(f.nodes.prev.disabled,true);assert.equal(f.nodes.next.disabled,false);assert.equal(f.nodes.status.textContent,'');assert.equal(f.scrolls.length,0);assert.equal(f.frames.size,0);c.dispose();
});

test('arrows and jump buttons scroll only the ring, update counter/details, and respect endpoints and reduced motion',()=>{
 const f=fixture(),c=createNativeMedicalExperiences(f.root,f.options);f.nodes.next.emit('click');assert.equal(c.selected,1);assert.equal(f.scrolls.at(-1).behavior,'smooth');assert.ok(Math.abs(f.scrolls.at(-1).left-390*.912)<1e-7);assert.equal(f.nodes.counter.textContent,'02 / 08');assert.equal(f.panels[1].hidden,false);f.jumps[7].emit('click');assert.equal(c.selected,7);assert.equal(f.nodes.next.disabled,true);assert.equal(f.nodes.prev.disabled,false);f.media.matches=true;f.nodes.prev.emit('click');assert.equal(c.selected,6);assert.equal(f.scrolls.at(-1).behavior,'auto');assert.equal(f.jumps[6].getAttribute('aria-current'),'true');c.dispose();
});

test('native scroll tracks nearest card with a single coalesced frame and no idle animation',()=>{
 const f=fixture(),c=createNativeMedicalExperiences(f.root,f.options);f.ring.scrollLeft=390*.912*3.15;assert.equal(nearestExperienceCard(f.ring,f.cards),3);f.ring.emit('scroll');f.ring.emit('scroll');assert.equal(f.frames.size,1);f.flush();assert.equal(c.selected,3);assert.equal(f.nodes.counter.textContent,'04 / 08');assert.match(f.nodes.status.textContent,/4 de 8/);assert.equal(f.frames.size,0);assert.equal(f.ring.settings.scroll.passive,true);c.dispose();
});

test('only local Left/Right/Home/End keys are handled; vertical/browser/form keys remain native',()=>{
 const f=fixture(),c=createNativeMedicalExperiences(f.root,f.options);const right=f.stage.emit('keydown',{key:'ArrowRight'});assert.equal(right.defaultPrevented,true);assert.equal(c.selected,1);f.stage.emit('keydown',{key:'End'});assert.equal(c.selected,7);f.stage.emit('keydown',{key:'Home'});assert.equal(c.selected,0);
 for(const key of['ArrowUp','ArrowDown','PageUp','PageDown',' ','Escape','Tab'])assert.equal(f.stage.emit('keydown',{key}).defaultPrevented,false,key);
 for(const modifier of['altKey','ctrlKey','metaKey'])assert.equal(f.stage.emit('keydown',{key:'ArrowRight',[modifier]:true}).defaultPrevented,false);
 assert.equal(f.stage.emit('keydown',{key:'ArrowRight',target:{closest:()=>({})}}).defaultPrevented,false);assert.equal(c.selected,0);c.dispose();
});

test('height-only browser-toolbar resize is inert; actual width change keeps selected card via ring-only auto scroll',()=>{
 const f=fixture(),c=createNativeMedicalExperiences(f.root,f.options);f.jumps[3].emit('click');const before=f.scrolls.length;f.win.innerHeight=700;f.win.emit('resize');assert.equal(f.scrolls.length,before);assert.equal(c.selected,3);f.resize(480);assert.equal(f.scrolls.length,before+1);assert.equal(f.scrolls.at(-1).behavior,'auto');assert.ok(Math.abs(f.scrolls.at(-1).left-480*.912*3)<1e-7);assert.equal(c.selected,3);c.dispose();
});

test('synchronous parent layout update cannot recurse through the selected panel change',()=>{
 const f=fixture();let c,calls=0;c=createNativeMedicalExperiences(f.root,{...f.options,onLayout(){calls++;c?.update();}});const before=calls;f.nodes.next.emit('click');assert.equal(c.selected,1);assert.equal(calls,before+1);c.update();assert.equal(calls,before+1);c.dispose();
});

test('visibility pauses pending work and disposal restores the complete semantic SSR reading list',()=>{
 const f=fixture(),c=createNativeMedicalExperiences(f.root,f.options);f.ring.emit('scroll');assert.equal(f.frames.size,1);c.setVisible(false);assert.equal(f.frames.size,0);f.ring.scrollLeft=390*.912*5;f.ring.emit('scroll');assert.equal(c.selected,0);c.setVisible(true);assert.equal(c.selected,5);f.doc.hidden=true;f.doc.emit('visibilitychange');f.ring.emit('scroll');assert.equal(f.frames.size,0);c.dispose();c.dispose();assert.ok(f.panels.every(panel=>!panel.hidden));assert.equal(f.root.dataset.state,undefined);assert.equal(f.nodes.controls.hidden,true);assert.equal(f.ring.getAttribute('aria-hidden'),'true');assert.equal(f.nodes.hint.textContent,'Original hint');assert.equal(f.frames.size,0);assert.equal([f.win,f.doc,f.stage,f.ring,f.details,...Object.values(f.nodes),...f.jumps].reduce((sum,n)=>sum+n.count(),0),0);assert.equal(f.header.inert,false);
});

test('CSS gives coarse-pointer SSR a large 3:2 image immediately while preserving all no-JS details and original photos',()=>{
 const css=readFileSync(new URL('../css/medical-experiences.css',import.meta.url),'utf8'),html=renderMedicalExperiences();assert.match(css,/@media \(pointer:coarse\),\(hover:none\) and \(pointer:none\)/);assert.match(css,/flex:0 0 87\.2vw;width:87\.2vw;height:auto;aspect-ratio:3\/2/);assert.match(css,/scroll-snap-type:x proximity/);assert.match(css,/touch-action:pan-x pan-y pinch-zoom/);assert.match(css,/data-state="native"\] \.experience-static-photo\{display:none\}/);assert.equal((html.match(/data-experience-card=/g)||[]).length,8);assert.equal((html.match(/data-experience-panel=/g)||[]).length,8);for(const article of html.match(/<article[^>]*data-experience-panel[^>]*>/g)||[])assert.doesNotMatch(article,/hidden|inert/);for(const data of medicalExperiences)assert.ok(html.includes(`src="${data.image}"`));
});

test('native return precedes every desktop engine and diagnostic setup',()=>{
 const current=readFileSync(new URL('./medical-experiences-controller.js',import.meta.url),'utf8');assert.match(current,/if\(nativeTouch\)return createNativeMedicalExperiences\(root,\{\.\.\.options,window:win,document:doc\}\);/);const branch=current.indexOf('if(nativeTouch)return createNativeMedicalExperiences');assert.ok(branch<current.indexOf('const loader=options.loadEngine'));assert.ok(branch<current.indexOf('const diagnostic=createExperienceDiagnostic'));
});

test('a finger interruption cancels a pending button destination without capturing the gesture',()=>{
 const f=fixture(),c=createNativeMedicalExperiences(f.root,f.options);f.jumps[6].emit('click');const touch=f.ring.emit('pointerdown',{pointerType:'touch'});assert.equal(touch.defaultPrevented,false);assert.equal(touch.stopped,false);assert.equal(f.ring.settings.pointerdown.passive,true);f.ring.scrollLeft=390*.912*2;f.ring.emit('scroll');f.flush();assert.equal(c.selected,2);f.nodes.next.emit('click');assert.equal(c.selected,3);c.dispose();
});
