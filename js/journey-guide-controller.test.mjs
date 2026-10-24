import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderJourneyGuide,journeyIntents} from './journey-guide.js';
import {createJourneyGuide} from './journey-guide-controller.js';
class Element{
 constructor(dataset={}){this.dataset=dataset;this.attrs=new Map();this.events=new Map();this.hidden=false;this.focusCalls=[];this.id='';}
 setAttribute(name,value){this.attrs.set(name,String(value));}
 getAttribute(name){return this.attrs.get(name)??null;}
 removeAttribute(name){this.attrs.delete(name);}
 set tabIndex(value){this.setAttribute('tabindex',value);}
 get tabIndex(){return Number(this.getAttribute('tabindex')??0);}
 addEventListener(name,fn){this.events.set(name,[...this.events.get(name)||[],fn]);}
 removeEventListener(name,fn){this.events.set(name,(this.events.get(name)||[]).filter(value=>value!==fn));}
 emit(name,extra={}){const event={target:this,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...extra};for(const fn of [...this.events.get(name)||[]])fn(event);return event;}
 focus(options){this.focusCalls.push(options);}
 contains(node){return node?.parent===this;}
 get listenerCount(){return [...this.events.values()].reduce((sum,list)=>sum+list.length,0);}
}
function fixture(){
 const root=new Element(),list=new Element();list.hidden=true;
 const tabs=journeyIntents.map(intent=>Object.assign(new Element({journeyTab:intent.id}),{id:`journey-tab-${intent.id}`}));
 const panels=journeyIntents.map(intent=>Object.assign(new Element({journeyPanel:intent.id}),{id:`journey-panel-${intent.id}`}));
 tabs.forEach((tab,i)=>tab.setAttribute('aria-controls',panels[i].id));panels.forEach(panel=>panel.setAttribute('aria-labelledby',`journey-intent-${panel.dataset.journeyPanel}`));
 root.querySelector=selector=>selector==='[data-journey-tabs]'?list:null;
 root.querySelectorAll=selector=>selector==='[data-journey-tab]'?tabs:selector==='[data-journey-panel]'?panels:[];
 return {root,list,tabs,panels};
}

test('SSR retains #team and every complete intention before enhancement',()=>{
 const html=renderJourneyGuide();assert.match(html,/<section id="team" class="journey-guide" data-journey-guide/);assert.match(html,/Qual é o seu<br><i>próximo passo\?<\/i>/);
 assert.equal((html.match(/data-journey-tab=/g)||[]).length,3);assert.equal((html.match(/data-journey-panel=/g)||[]).length,3);assert.equal((html.match(/<li>/g)||[]).length,9);
 assert.match(html,/<div[^>]*data-journey-tabs[^>]* hidden>/);
 for(const tag of html.match(/<article\b[^>]*>/g)||[])assert.doesNotMatch(tag,/\shidden|aria-hidden|inert/);
 assert.doesNotMatch(html,/<(?:canvas|img|video|iframe|script)\b|data-book|book-track|book-stage/);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);assert.equal(new Set(ids).size,ids.length);
 for(const target of html.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g))assert.ok(ids.includes(target[1]),target[1]);
 assert.equal((html.match(/<h2\b/g)||[]).length,1);assert.equal((html.match(/<h3\b/g)||[]).length,3);
});

test('editorial actions and physical module links are truthful, local and complete',()=>{
 const html=renderJourneyGuide();assert.equal(journeyIntents.length,3);
 for(const intent of journeyIntents){assert.equal(intent.actions.length,3);assert.ok(intent.actions.every(action=>action.title&&action.body));for(const link of intent.links){assert.match(link.href,/^\/modulos\/(?:hoje|trajetoria|pesquisa|explorar)\/$/);assert.ok(html.includes(`href="${link.href}"`));}}
 assert.match(html,/Hoje/);assert.match(html,/Visão e o Currículo Studio/);assert.match(html,/15 etapas em quatro movimentos: Entender, Aplicar, Validar e Entregar/);assert.match(html,/Internacional, em Trajetória/);assert.match(html,/fonte oficial/);assert.match(html,/não é uma garantia de vaga ou elegibilidade/);assert.match(html,/pré-lançamento/);assert.match(html,/não é salva nem enviada/);
 assert.doesNotMatch(html,/checkout|mailto:|https?:\/\//);
});

test('enhancement creates horizontal tabs, one tab stop and accessible inactive panels',()=>{
 const f=fixture();let layouts=0;const c=createJourneyGuide(f.root,{onLayout:()=>layouts++});
 assert.equal(c.selected,'formacao');assert.equal(f.root.dataset.journeyEnhanced,'true');assert.equal(f.list.hidden,false);assert.equal(f.list.getAttribute('role'),'tablist');assert.equal(f.list.getAttribute('aria-orientation'),'horizontal');assert.equal(layouts,1);
 assert.deepEqual(f.tabs.map(tab=>tab.tabIndex),[0,-1,-1]);assert.deepEqual(f.tabs.map(tab=>tab.getAttribute('aria-selected')),['true','false','false']);
 for(const [i,panel]of f.panels.entries()){assert.equal(panel.getAttribute('role'),'tabpanel');assert.equal(panel.getAttribute('aria-labelledby'),f.tabs[i].id);assert.equal(panel.getAttribute('tabindex'),'0');assert.equal(panel.getAttribute('aria-hidden'),String(i!==0));assert.equal(panel.getAttribute('inert'),i===0?null:'');}
 c.dispose();
});

test('pointer and programmatic selection update semantics without focus or layout side effects',()=>{
 const f=fixture();let layouts=0;const c=createJourneyGuide(f.root,{onLayout:()=>layouts++});
 f.list.emit('click',{target:{parent:f.tabs[1]}});assert.equal(c.selected,'pesquisa');assert.deepEqual(f.tabs.map(tab=>tab.tabIndex),[-1,0,-1]);assert.equal(f.panels[0].getAttribute('inert'),'');assert.equal(f.panels[1].getAttribute('inert'),null);
 assert.equal(c.select('oportunidades'),true);assert.equal(c.select('missing'),false);assert.equal(c.selected,'oportunidades');assert.equal(layouts,1);assert.ok(f.tabs.every(tab=>tab.focusCalls.length===0));
 f.list.emit('click',{target:new Element()});assert.equal(c.selected,'oportunidades');c.dispose();
});

test('Left/Right wrap; Home/End select endpoints and focus only the selected tab',()=>{
 const f=fixture(),c=createJourneyGuide(f.root);
 const left=f.list.emit('keydown',{target:f.tabs[0],key:'ArrowLeft'});assert.equal(c.selected,'oportunidades');assert.equal(left.prevented,true);assert.equal(left.stopped,true);
 f.list.emit('keydown',{target:f.tabs[2],key:'ArrowRight'});assert.equal(c.selected,'formacao');
 f.list.emit('keydown',{target:f.tabs[0],key:'End'});assert.equal(c.selected,'oportunidades');
 f.list.emit('keydown',{target:f.tabs[2],key:'Home'});assert.equal(c.selected,'formacao');
 assert.deepEqual(f.tabs[0].focusCalls,[{preventScroll:true},{preventScroll:true}]);assert.deepEqual(f.tabs[2].focusCalls,[{preventScroll:true},{preventScroll:true}]);c.dispose();
});

test('Up/Down, page navigation, native Enter and modifiers remain untouched',()=>{
 const f=fixture(),c=createJourneyGuide(f.root);
 for(const key of['ArrowUp','ArrowDown','PageUp','PageDown','Tab','Escape','Enter']){const event=f.list.emit('keydown',{target:f.tabs[0],key});assert.equal(event.prevented,undefined,key);assert.equal(event.stopped,undefined,key);}
 for(const modifier of['altKey','ctrlKey','metaKey'])for(const key of['ArrowLeft','ArrowRight','Home','End']){const event=f.list.emit('keydown',{target:f.tabs[0],key,[modifier]:true});assert.equal(event.prevented,undefined);assert.equal(event.stopped,undefined);}
 const outside=f.list.emit('keydown',{target:new Element(),key:'ArrowRight'});assert.equal(outside.prevented,undefined);assert.equal(c.selected,'formacao');c.dispose();
});

test('Space retains native button activation without reaching smooth-scroll ancestors',()=>{
 const f=fixture(),c=createJourneyGuide(f.root),event=f.list.emit('keydown',{target:f.tabs[1],key:' '});
 assert.equal(event.prevented,undefined);assert.equal(event.stopped,true);assert.equal(c.selected,'formacao');
 f.list.emit('click',{target:f.tabs[1]});assert.equal(c.selected,'pesquisa');c.dispose();
});

test('dispose restores semantic SSR reading, removes listeners and is idempotent',()=>{
 const f=fixture(),c=createJourneyGuide(f.root);c.select('pesquisa');c.dispose();c.dispose();assert.equal(c.selected,null);assert.equal(c.select('formacao'),false);assert.equal(f.list.listenerCount,0);assert.equal(f.list.hidden,true);assert.equal(f.root.dataset.journeyEnhanced,undefined);assert.equal(f.list.getAttribute('role'),null);
 for(const tab of f.tabs){assert.equal(tab.getAttribute('role'),null);assert.equal(tab.getAttribute('tabindex'),null);assert.equal(tab.getAttribute('aria-selected'),null);}
 for(const panel of f.panels){assert.equal(panel.getAttribute('role'),null);assert.equal(panel.getAttribute('aria-hidden'),null);assert.equal(panel.getAttribute('inert'),null);assert.equal(panel.getAttribute('aria-labelledby'),`journey-intent-${panel.dataset.journeyPanel}`);}
});

test('repeated mount reuses one instance and explicit remount after disposal is clean',()=>{
 const f=fixture(),one=createJourneyGuide(f.root),two=createJourneyGuide(f.root);assert.equal(one,two);assert.equal(f.list.listenerCount,2);one.select('pesquisa');assert.equal(two.selected,'pesquisa');two.dispose();
 const three=createJourneyGuide(f.root);assert.notEqual(three,one);assert.equal(three.selected,'formacao');assert.equal(f.list.listenerCount,2);three.dispose();assert.equal(f.list.listenerCount,0);
});

test('missing or mismatched markup is fail-open without hiding content',()=>{
 for(const root of[null,{}, {querySelector(){return null;},querySelectorAll(){return[];}}]){const c=createJourneyGuide(root);assert.equal(c.selected,null);assert.equal(c.select('formacao'),false);c.dispose();}
 for(const mode of['duplicate','mismatch','count']){const f=fixture();if(mode==='duplicate')f.tabs[1].dataset.journeyTab='formacao';if(mode==='mismatch')f.panels[0].dataset.journeyPanel='missing';if(mode==='count')f.panels.pop();const c=createJourneyGuide(f.root);assert.equal(c.selected,null);assert.equal(f.root.dataset.journeyEnhanced,undefined);assert.equal(f.list.hidden,true);assert.equal(f.list.listenerCount,0);assert.ok(f.panels.every(panel=>panel.getAttribute('aria-hidden')===null));}
});

test('a layout observer failure does not break selection or cleanup',()=>{
 const f=fixture(),c=createJourneyGuide(f.root,{onLayout(){throw Error('observer');}});assert.equal(c.selected,'formacao');assert.equal(c.select('pesquisa'),true);c.dispose();assert.equal(f.list.listenerCount,0);
});

test('guide has no global scroll listeners, navigation ownership, storage or network work',()=>{
 const source=fs.readFileSync(new URL('./journey-guide-controller.js',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../css/journey-guide.css',import.meta.url),'utf8');
 assert.doesNotMatch(source,/scrollTo\(|scrollBy\(|requestAnimationFrame|setTimeout|localStorage|sessionStorage|fetch\(|XMLHttpRequest|window\.addEventListener|document\.addEventListener|addEventListener\(['"](?:scroll|resize|wheel|touchmove)/);
 assert.doesNotMatch(css,/position:(?:fixed|sticky)|100(?:d|s)?vh|scroll-snap/);assert.match(css,/#team\.journey-guide\{/);assert.match(css,/grid-area:1\/1;visibility:hidden/);assert.match(css,/prefers-reduced-motion:reduce/);assert.doesNotMatch(css,/(?:^|\})\s*(?:html|body|:root)\s*\{/);
});
