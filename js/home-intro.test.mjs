import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {bootstrapHomeIntro,initHomeIntro,HOME_INTRO_BOOTSTRAP,HOME_INTRO_CRITICAL_CSS} from './home-intro.js';
import {renderDocument} from './templates.js';
function target(extra={}){const listeners=new Map();return Object.assign({addEventListener(event,fn){if(!listeners.has(event))listeners.set(event,new Set());listeners.get(event).add(fn);},removeEventListener(event,fn){listeners.get(event)?.delete(fn);},emit(event,arg={}){for(const fn of [...listeners.get(event)||[]])fn(arg);},count(){return [...listeners.values()].reduce((sum,set)=>sum+set.size,0);}},extra);}
function fixture({reduced=false,now=0,markup=true,url='https://example.test/'}={}){
 let time=now,nextId=1;const timers=new Map(),scrolls=[],media=target({matches:reduced}),greeting={children:[{},{}]},hero={querySelector:selector=>selector==='.intro-greeting'&&markup?greeting:null};
 const doc=target({documentElement:{dataset:{}},querySelector:selector=>selector==='#home'?hero:null});
 const location=new URL(url);
 const history={scrollRestoration:'auto',state:{retained:'state'},replaceState(state,title,url){this.state=state;location.href=new URL(url,location.href).href;}};
 const win=target({location,history,performance:{now:()=>time},matchMedia:()=>media,scrollTo:args=>scrolls.push(args),setTimeout(fn,delay){const id=nextId++;timers.set(id,{fn,at:time+Math.max(0,delay)});return id;},clearTimeout(id){timers.delete(id);}});
 return{win,doc,hero,media,timers,scrolls,advance(ms){const end=time+ms;for(;;){const entry=[...timers].filter(([,timer])=>timer.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!entry)break;time=entry[1].at;timers.delete(entry[0]);entry[1].fn();}time=end;}};
}

test('serialized head bootstrap gates before body/stylesheet paint and retains the actual two-span SVG greeting',()=>{
 const html=renderDocument({page:'home'}),head=html.slice(0,html.indexOf('</head>'));assert.ok(head.indexOf('data-home-intro-bootstrap')<head.indexOf('/css/main.css'));assert.ok(head.includes('data-home-intro-critical'));assert.ok(head.includes('/css/home-intro.css'));assert.match(html,/<div class="intro-greeting" aria-hidden="true"><span>Olá\.<\/span><span>Bem-vindo à <i class="intro-brand-mark"><svg/);
 const f=fixture();vm.runInNewContext(HOME_INTRO_BOOTSTRAP,{window:f.win,document:f.doc});assert.equal(f.doc.documentElement.dataset.homeIntro,'active');assert.equal(f.win.history.scrollRestoration,'manual');assert.equal(f.scrolls.length,1);assert.equal(f.scrolls[0].top,0);
 assert.match(HOME_INTRO_CRITICAL_CSS,/#home \.hero-sentence\{opacity:0;visibility:hidden\}/);
});

test('CSS starts the greeting immediately and preserves all later approved timings',()=>{
 const css=readFileSync(new URL('../css/home-intro.css',import.meta.url),'utf8');assert.match(css,/home-intro-enter 1\.2s [^;]+ 0s both/);assert.match(css,/home-intro-exit 1\.2s [^;]+ 4\.5s forwards/);assert.match(css,/home-intro-header 1s [^;]+ 5\.1s forwards/);assert.match(css,/home-intro-seal \.8s 5\.5s/);assert.match(css,/home-intro-show \.001s 5\.2s/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/\.intro-greeting\{display:none!important\}/);
});

test('module adopts elapsed head timeline, runs once per document, and needs no GSAP',()=>{
 const f=fixture({now:100});const state=bootstrapHomeIntro(f.win,f.doc);f.advance(800);f.doc.emit('animationstart',{animationName:'home-intro-enter',elapsedTime:0});f.advance(1700);const c=initHomeIntro({hero:f.hero,document:f.doc,window:f.win});assert.equal(c.intro,true);assert.equal(c.startedAt,900);assert.equal(c.introDelay,3500);assert.equal(c.remainingMs,5100);assert.equal(initHomeIntro({document:f.doc,window:f.win}),c);assert.equal(bootstrapHomeIntro(f.win,f.doc),state);
 f.advance(3500);assert.equal(c.introDelay,0);f.advance(1600);assert.equal(c.intro,false);assert.equal(f.doc.documentElement.dataset.homeIntro,'done');assert.equal(f.win.history.scrollRestoration,'auto');assert.equal(f.timers.size,0);assert.equal(f.win.count()+f.doc.count()+f.media.count(),0);
});

test('every full reload creates a fresh intro, with no session/local-storage access',()=>{
 for(let i=0;i<3;i++){const f=fixture();Object.defineProperty(f.win,'sessionStorage',{get(){throw new Error('Storage must not be accessed');}});Object.defineProperty(f.win,'localStorage',{get(){throw new Error('Storage must not be accessed');}});bootstrapHomeIntro(f.win,f.doc);const c=initHomeIntro({document:f.doc,window:f.win});assert.equal(c.intro,true);assert.equal(c.introDelay,5200);c.finish();assert.equal(bootstrapHomeIntro(f.win,f.doc).ended,true);}
});

test('reduced motion bypasses animation, restoration changes and timers; later preference change also opens gate',()=>{
 const reduced=fixture({reduced:true});bootstrapHomeIntro(reduced.win,reduced.doc);const c=initHomeIntro({document:reduced.doc,window:reduced.win});assert.equal(c.intro,false);assert.equal(c.introDelay,0);assert.equal(reduced.scrolls.length,0);assert.equal(reduced.win.history.scrollRestoration,'auto');assert.equal(reduced.timers.size,0);
 const live=fixture();bootstrapHomeIntro(live.win,live.doc);live.media.matches=true;live.media.emit('change');assert.equal(live.doc.documentElement.dataset.homeIntro,'done');assert.equal(live.timers.size,0);
});

test('no JavaScript has no active gate; non-home pages contain no intro bootstrap or CSS',()=>{
 const home=renderDocument({page:'home'});assert.match(home,/<!doctype html><html lang="pt-BR"><head>/);const css=readFileSync(new URL('../css/main.css',import.meta.url),'utf8');assert.match(css,/\.intro-greeting\{display:none;/);
 for(const page of ['community','directory','404','project']){const html=renderDocument({page,slug:'trajetoria'});assert.ok(!html.includes('data-home-intro-bootstrap'));assert.ok(!html.includes('/css/home-intro.css'));}
});

test('head watchdog opens page when all modules fail, and bootstrap exceptions fail open immediately',()=>{
 const f=fixture();bootstrapHomeIntro(f.win,f.doc);f.advance(7999);assert.equal(f.doc.documentElement.dataset.homeIntro,'active');f.advance(1);assert.equal(f.doc.documentElement.dataset.homeIntro,'done');assert.equal(f.win.__theMedHomeIntro.reason,'watchdog');assert.equal(f.win.history.scrollRestoration,'auto');assert.equal(f.timers.size,0);
 const broken=fixture();broken.win.matchMedia=()=>{throw new Error('Unavailable');};bootstrapHomeIntro(broken.win,broken.doc);assert.equal(broken.doc.documentElement.dataset.homeIntro,'done');assert.equal(broken.timers.size,0);
});

test('missing markup, disposal and BFCache pagehide cannot strand or replay the gate',()=>{
 const missing=fixture({markup:false});bootstrapHomeIntro(missing.win,missing.doc);const c=initHomeIntro({document:missing.doc,window:missing.win});assert.equal(c.intro,false);assert.equal(missing.win.__theMedHomeIntro.reason,'missing-markup');
 const f=fixture();bootstrapHomeIntro(f.win,f.doc);const live=initHomeIntro({document:f.doc,window:f.win});f.win.emit('pagehide');assert.equal(live.intro,false);assert.equal(f.doc.documentElement.dataset.homeIntro,'done');live.dispose();assert.equal(f.timers.size,0);assert.equal(initHomeIntro({document:f.doc,window:f.win}),live);assert.equal(live.intro,false);
});

test('slow blocking CSS does not consume the animation clock, while the independent head watchdog remains bounded',async()=>{
 const f=fixture();bootstrapHomeIntro(f.win,f.doc);f.advance(3000);const c=initHomeIntro({document:f.doc,window:f.win});assert.equal(c.introDelay,5200);assert.equal(c.remainingMs,6800);f.doc.emit('animationstart',{animationName:'unrelated',elapsedTime:0});assert.equal(c.startedAt,0);
 f.doc.emit('animationstart',{animationName:'home-intro-enter',elapsedTime:0});await c.whenStarted;assert.equal(c.startedAt,3000);f.advance(1000);assert.equal(c.introDelay,4200);assert.equal(c.remainingMs,5800);f.advance(4000);assert.equal(c.intro,false);assert.equal(f.win.__theMedHomeIntro.reason,'watchdog');c.dispose();
});

test('instant home reset uses Safari-compatible auto and restores existing inline scroll behavior',()=>{
 const f=fixture();let behavior='smooth',priority='important';const seen=[];f.doc.documentElement.style={getPropertyValue:()=>behavior,getPropertyPriority:()=>priority,setProperty(key,value,importance){behavior=value;priority=importance;},removeProperty(){behavior='';priority='';}};f.win.scrollTo=options=>seen.push({options,behavior,priority});bootstrapHomeIntro(f.win,f.doc);assert.equal(seen[0].options.behavior,'auto');assert.equal(seen[0].behavior,'auto');assert.equal(seen[0].priority,'important');assert.equal(behavior,'smooth');assert.equal(priority,'important');
});

test('a blocked or missing head bootstrap is never restarted late by the app module',()=>{
 const f=fixture();const c=initHomeIntro({hero:f.hero,document:f.doc,window:f.win});assert.equal(c.intro,false);assert.equal(c.introDelay,0);assert.equal(c.remainingMs,0);assert.equal(f.doc.documentElement.dataset.homeIntro,undefined);assert.equal(f.timers.size,0);assert.equal(f.scrolls.length,0);
});

test('home hash is suppressed before parse and restored without a new entry or losing history state',()=>{
 const f=fixture({url:'https://example.test/?view=welcome#works'}),calls=[],replace=f.win.history.replaceState.bind(f.win.history);f.win.history.replaceState=(...args)=>{calls.push(args);replace(...args);};const originalState=f.win.history.state;
 bootstrapHomeIntro(f.win,f.doc);assert.equal(f.win.location.href,'https://example.test/?view=welcome');assert.equal(f.win.location.hash,'');assert.equal(f.win.history.state,originalState);const c=initHomeIntro({document:f.doc,window:f.win});assert.equal(c.initialHash,'#works');
 f.win.history.state={...originalState,scroll:123};c.finish();assert.equal(f.win.location.hash,'#works');assert.deepEqual(f.win.history.state,{retained:'state',scroll:123});assert.equal(calls.length,2);
});

test('intervening URL or history navigation owns the URL and cannot be overwritten by old intro hash',()=>{
 for(const change of [f=>f.win.history.replaceState({new:true},'','#contact'),f=>{f.win.history.replaceState({new:true},'','/other/');},f=>{f.win.emit('popstate');}]){const f=fixture({url:'https://example.test/#works'});const state=bootstrapHomeIntro(f.win,f.doc);change(f);const nextURL=f.win.location.href;state.finish();assert.equal(f.win.location.href,nextURL);assert.notEqual(f.win.location.hash,'#works');}
});

test('watchdog restores a suppressed hash; reduced motion and failed history writes leave native hashes untouched',()=>{
 const f=fixture({url:'https://example.test/#works'});bootstrapHomeIntro(f.win,f.doc);assert.equal(f.win.location.hash,'');f.advance(8000);assert.equal(f.win.location.hash,'#works');
 const reduced=fixture({reduced:true,url:'https://example.test/#works'});bootstrapHomeIntro(reduced.win,reduced.doc);assert.equal(reduced.win.location.hash,'#works');assert.equal(reduced.scrolls.length,0);
 const denied=fixture({url:'https://example.test/#works'});denied.win.history.replaceState=()=>{throw new Error('History unavailable');};bootstrapHomeIntro(denied.win,denied.doc);assert.equal(denied.win.location.hash,'#works');denied.advance(8000);assert.equal(denied.doc.documentElement.dataset.homeIntro,'done');
});
