import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createModuleExperience,mountModuleExperiences} from './module-experiences-controller.js';
import {renderModuleExperience,moduleExperienceSlugs,moduleExperienceData} from './module-experiences.js';

class Classes{constructor(){this.values=new Set();}add(...values){values.forEach(v=>this.values.add(v));}remove(...values){values.forEach(v=>this.values.delete(v));}contains(v){return this.values.has(v);}toggle(v,force){if(force===undefined)force=!this.values.has(v);if(force)this.values.add(v);else this.values.delete(v);return force;}}
class Target{constructor(){this.events=new Map();this.classList=new Classes();this.dataset={};this.attrs=new Map();}addEventListener(type,fn){if(!this.events.has(type))this.events.set(type,new Set());this.events.get(type).add(fn);}removeEventListener(type,fn){this.events.get(type)?.delete(fn);}emit(type,data={}){const event={type,target:this,defaultPrevented:false,propagationStopped:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.propagationStopped=true;},...data};for(const fn of this.events.get(type)||[])fn(event);return event;}setAttribute(k,v){this.attrs.set(k,String(v));}removeAttribute(k){this.attrs.delete(k);}getAttribute(k){return this.attrs.get(k)??null;}count(){return [...this.events.values()].reduce((sum,set)=>sum+set.size,0);}}
function fixture(ids=['estudo','trajetoria','pesquisa']){
 const group=new Target(),status={textContent:''},panels=ids.map(id=>Object.assign(new Target(),{dataset:{modulePanel:id}})),radios=ids.map((id,i)=>Object.assign(new Target(),{dataset:{moduleChoice:id},checked:i===0,focusCalls:[],focus(options){this.focusCalls.push(options);},closest(){return{querySelector(){return{textContent:`0${i+1} ${id} ↗`};}};}}));
 group.querySelectorAll=selector=>selector==='[data-module-choice]'?radios:selector==='[data-module-panel]'?panels:[];
 group.querySelector=selector=>selector==='[data-module-status]'?status:null;
 const root={querySelector:selector=>selector==='[data-module-interaction]'?group:null};
 const win=new Target();let next=0;const frames=new Map(),cancelled=[];win.requestAnimationFrame=callback=>{frames.set(++next,callback);return next;};win.cancelAnimationFrame=id=>{cancelled.push(id);frames.delete(id);};win.Event=class{constructor(type){this.type=type;}};win.dispatches=[];win.dispatchEvent=event=>win.dispatches.push(event.type);
 const doc={querySelectorAll:selector=>selector==='[data-module-experience]'?[root]:[]};root.ownerDocument=doc;
 const options={window:win,document:doc};return{root,group,status,panels,radios,win,doc,frames,cancelled,options,flush(){const queue=[...frames.values()];frames.clear();queue.forEach(fn=>fn());}};
}

test('all seven route narratives have four folds, authored SVG and no raster/media/next-thumbnail',()=>{
 assert.deepEqual(moduleExperienceSlugs,['hoje','explorar','mentor','acervo','ligas','pesquisa','club']);
 for(const slug of moduleExperienceSlugs){const html=renderModuleExperience(slug),data=moduleExperienceData[slug];assert.match(html,new RegExp(`data-module-experience="${slug}"`));assert.equal((html.match(/<section\b/g)||[]).length,4);assert.deepEqual([...html.matchAll(/data-module-fold="(\d)"/g)].map(m=>m[1]),['1','2','3','4']);assert.doesNotMatch(html,/<(?:img|video|canvas|iframe)\b/i);assert.doesNotMatch(html,/next-project|\/assets\/|<script|onclick=/i);assert.match(html,/<svg class="module-hero-art"[^>]+role="img"/);assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/data-module-panel=/g)||[]).length,data.choices.length);assert.equal((html.match(/data-module-choice=/g)||[]).length,data.choices.length);assert.doesNotMatch(html,/<[^>]+\shidden(?:\s|=|>)/);for(const panelTag of html.match(/<div[^>]+data-module-panel[^>]*>/g)||[])assert.doesNotMatch(panelTag,/aria-hidden|\sinert/);assert.match(html,/Sua escolha fica apenas nesta página e não é salva nem enviada/);assert.equal((html.match(/href="https?:[^\"]+"/g)||[]).length,1);assert.match(html,/href="https:\/\/innectaos\.vercel\.app\/" target="_blank" rel="noopener noreferrer"/);for(const suffix of['intro','experimentar','contexto','continuar'])assert.ok(html.includes(`id="${slug}-${suffix}"`));}
 assert.equal(renderModuleExperience('trajetoria'),'');assert.equal(renderModuleExperience('missing'),'');
});

test('every native radio maps uniquely to a complete no-JS reading panel',()=>{
 for(const slug of moduleExperienceSlugs){const html=renderModuleExperience(slug),d=moduleExperienceData[slug];assert.equal((html.match(/ checked/g)||[]).length,1);assert.match(html,/<fieldset[^>]*><legend>/);for(const c of d.choices){assert.ok(html.includes(`aria-controls="${slug}-panel-${c.id}"`));assert.ok(html.includes(`id="${slug}-panel-${c.id}"`));assert.ok(c.steps.length===3);assert.ok(c.title&&c.body&&c.foot);}}
});

test('truthful module distinctions remain explicit, without invented openings, people or 15 stage names',()=>{
 const mentor=renderModuleExperience('mentor'),research=renderModuleExperience('pesquisa'),explore=renderModuleExperience('explorar'),club=renderModuleExperience('club');
 assert.match(mentor,/Inteligência artificial/i);assert.match(mentor,/ACOMPANHAMENTO HUMANO/);assert.match(mentor,/Uma sessão mensal de 45 minutos/);assert.match(mentor,/Mensagens para/);assert.match(mentor,/Revisões para/);assert.match(mentor,/apoio digital.*acompanhamento humano/);
 assert.match(research,/15 etapas/);for(const phase of['Entender','Aplicar','Validar','Entregar'])assert.match(research,new RegExp(phase));assert.match(research,/Quinze etapas conectadas pelos movimentos Entender, Aplicar, Validar e Entregar/);assert.match(research,/orientação e responsabilidade/);
 assert.match(explore,/organizar a busca e reconhecer o que vale investigar/);assert.match(explore,/fonte oficial/);assert.match(club,/escolha fica apenas nesta página e não é salva nem enviada/);assert.match(club,/Valores, condições e benefícios serão apresentados quando definidos/);
});

test('initial enhancement selects the checked radio without live announcement and gates inactive content accessibly',()=>{
 const f=fixture(),controller=createModuleExperience(f.root,f.options);assert.equal(controller.selected,'estudo');assert.ok(f.group.classList.contains('is-enhanced'));assert.equal(f.status.textContent,'');assert.equal(f.panels[0].getAttribute('aria-hidden'),'false');assert.equal(f.panels[0].getAttribute('inert'),null);assert.equal(f.panels[1].getAttribute('aria-hidden'),'true');assert.equal(f.panels[1].getAttribute('inert'),'');assert.equal(f.frames.size,1);f.flush();assert.deepEqual(f.win.dispatches,['resize']);controller.dispose();
});

test('native change updates selection, radio checks, reading panel and live message, without relayout',()=>{
 const f=fixture(),controller=createModuleExperience(f.root,f.options);f.flush();f.radios[1].checked=true;f.group.emit('change',{target:f.radios[1]});assert.equal(controller.selected,'trajetoria');assert.deepEqual(f.radios.map(r=>r.checked),[false,true,false]);assert.ok(f.panels[1].classList.contains('is-current'));assert.equal(f.panels[1].getAttribute('inert'),null);assert.equal(f.panels[0].getAttribute('inert'),'');assert.equal(f.status.textContent,'Perspectiva selecionada: trajetoria.');assert.equal(f.frames.size,0);assert.deepEqual(f.win.dispatches,['resize']);controller.dispose();
});

test('unrelated or unchecked changes and unknown programmatic keys do not modify state',()=>{
 const f=fixture(),controller=createModuleExperience(f.root,f.options);f.group.emit('change',{target:new Target()});f.radios[2].checked=false;f.group.emit('change',{target:f.radios[2]});assert.equal(controller.select('not-a-choice'),false);assert.equal(controller.selected,'estudo');assert.equal(f.status.textContent,'');controller.dispose();
});

test('native arrow and Space handling stays native but does not reach Locomotive; Home/End select endpoints',()=>{
 const f=fixture(),controller=createModuleExperience(f.root,f.options);
 for(const key of['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ']){const event=f.group.emit('keydown',{target:f.radios[0],key});assert.equal(event.propagationStopped,true,key);assert.equal(event.defaultPrevented,false,key);}
 const end=f.group.emit('keydown',{target:f.radios[0],key:'End'});assert.equal(end.propagationStopped,true);assert.equal(end.defaultPrevented,true);assert.equal(controller.selected,'pesquisa');assert.deepEqual(f.radios[2].focusCalls,[{preventScroll:true}]);
 const home=f.group.emit('keydown',{target:f.radios[2],key:'Home'});assert.equal(home.defaultPrevented,true);assert.equal(controller.selected,'estudo');assert.deepEqual(f.radios[0].focusCalls,[{preventScroll:true}]);controller.dispose();
});

test('Tab Escape page-navigation and keys outside native radios are not intercepted',()=>{
 const f=fixture(),controller=createModuleExperience(f.root,f.options);for(const key of['Tab','Escape','PageUp','PageDown','Enter']){const event=f.group.emit('keydown',{target:f.radios[0],key});assert.equal(event.defaultPrevented,false,key);assert.equal(event.propagationStopped,false,key);}const outside=f.group.emit('keydown',{target:new Target(),key:'ArrowDown'});assert.equal(outside.propagationStopped,false);controller.dispose();
});

test('Alt Ctrl and Meta shortcuts remain untouched on every handled radio key',()=>{
 const f=fixture(),controller=createModuleExperience(f.root,f.options);
 for(const modifier of['altKey','ctrlKey','metaKey'])for(const key of['Home','End','ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ']){const event=f.group.emit('keydown',{target:f.radios[0],key,[modifier]:true});assert.equal(event.defaultPrevented,false,`${modifier}+${key}`);assert.equal(event.propagationStopped,false,`${modifier}+${key}`);assert.equal(controller.selected,'estudo');}
 assert.equal(f.radios.reduce((n,r)=>n+r.focusCalls.length,0),0);assert.equal(f.status.textContent,'');controller.dispose();
});

test('dispose restores complete semantic content and cancels the sole scheduled layout notification',()=>{
 const f=fixture(),controller=createModuleExperience(f.root,f.options);controller.select('pesquisa');controller.dispose();controller.dispose();assert.equal(f.group.count(),0);assert.equal(f.frames.size,0);assert.equal(f.cancelled.length,1);assert.ok(!f.group.classList.contains('is-enhanced'));assert.equal(f.group.dataset.moduleSelected,undefined);assert.equal(f.status.textContent,'');for(const p of f.panels){assert.equal(p.getAttribute('aria-hidden'),null);assert.equal(p.getAttribute('inert'),null);assert.ok(!p.classList.contains('is-current'));}assert.equal(controller.select('estudo'),false);f.flush();assert.deepEqual(f.win.dispatches,[]);
});

test('custom layout callback is called once and does not dispatch a synthetic resize',()=>{
 const f=fixture();let calls=0;const controller=createModuleExperience(f.root,{...f.options,onLayout:()=>calls++});f.flush();controller.select('pesquisa');controller.select('estudo');f.flush();assert.equal(calls,1);assert.deepEqual(f.win.dispatches,[]);controller.dispose();
});

test('BFCache pagehide cleans up and pageshow re-enhances checked state without duplicate listeners',()=>{
 const f=fixture(),manager=mountModuleExperiences(f.doc,f.win);assert.equal(f.group.count(),2);f.radios[1].checked=true;f.group.emit('change',{target:f.radios[1]});f.win.emit('pagehide');assert.equal(f.group.count(),0);assert.ok(!f.group.classList.contains('is-enhanced'));f.win.emit('pageshow',{persisted:true});assert.equal(f.group.count(),2);assert.equal(f.group.dataset.moduleSelected,'trajetoria');assert.equal(f.status.textContent,'');f.win.emit('pageshow',{persisted:true});assert.equal(f.group.count(),2);manager.dispose();manager.dispose();assert.equal(f.group.count(),0);assert.equal(f.win.count(),0);
});

test('missing or malformed markup is a no-op and never hides static content',()=>{
 for(const root of[null,{}, {querySelector:()=>null}]){const c=createModuleExperience(root,{});assert.equal(c.select('x'),false);assert.equal(c.selected,null);c.dispose();}
 const f=fixture();f.panels[0].dataset.modulePanel='unknown';const c=createModuleExperience(f.root,f.options);assert.equal(c.selected,null);assert.equal(f.group.count(),0);assert.ok(!f.group.classList.contains('is-enhanced'));c.dispose();
 const duplicate=fixture(['same','same']);assert.equal(createModuleExperience(duplicate.root,duplicate.options).selected,null);
});

test('implementation has no storage/network/scroll ownership and CSS reserves all panel heights with reduced-motion support',()=>{
 const source=fs.readFileSync(new URL('./module-experiences-controller.js',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../css/module-experiences.css',import.meta.url),'utf8');
 assert.doesNotMatch(source,/localStorage|sessionStorage|fetch\(|XMLHttpRequest|scrollTo\(|\.stop\(|\.start\(/);assert.match(css,/\.is-enhanced \.module-choice-panel\{grid-area:1\/1;visibility:hidden/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.doesNotMatch(css,/(?:^|\})\s*(?:body|html|:root)\s*\{/);assert.doesNotMatch(css,/position:fixed|100vh|scroll-snap-type/);
});
