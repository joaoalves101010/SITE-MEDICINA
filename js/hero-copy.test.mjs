import test from 'node:test';
import assert from 'node:assert/strict';
import {animateHeroFragments,createHeroCopyCycle,HERO_COPY_TIMING,HERO_SUFFIXES} from './hero-copy.js';
function recorder(){const calls=[];const timeline={to(...args){calls.push(['to',...args]);return this;},set(...args){calls.push(['set',...args]);return this;},add(...args){calls.push(['add',...args]);return this;},play(){calls.push(['play']);return this;}};return {calls,timeline,gsap:{timeline(options){calls.push(['timeline',options]);return timeline;}}};}
test('both prefix and suffix leave and enter at reference staggered timings',()=>{
 const r=recorder(),out=[{name:'out-prefix'},{name:'out-suffix'}],incoming=[{name:'in-prefix'},{name:'in-suffix'}];
 animateHeroFragments(r.gsap,out,incoming,()=>{},()=>{});
 const movement=r.calls.filter(c=>c[0]==='to'&&'yPercent' in c[2]);
 assert.equal(movement.length,4);
 assert.deepEqual(movement.map(c=>[c[1].name,c[2].yPercent,c[3]]),[['out-prefix',-150,0],['out-suffix',-150,.1],['in-prefix',0,.55],['in-suffix',0,.65]]);
 assert.ok(HERO_COPY_TIMING.enterFirst<HERO_COPY_TIMING.duration);
 assert.ok(HERO_COPY_TIMING.enterSecond<HERO_COPY_TIMING.duration+HERO_COPY_TIMING.stagger);
 assert.equal(r.calls.at(-1)[0],'play');
});
test('incoming fragments begin below the mask and fade independently',()=>{
 const r=recorder(),incoming=[{},{}];animateHeroFragments(r.gsap,[{},{}],incoming,()=>{},()=>{});
 const setup=r.calls.find(c=>c[0]==='set');assert.equal(setup[1],incoming);assert.equal(setup[2].yPercent,150);assert.equal(setup[2].opacity,0);
 const fades=r.calls.filter(c=>c[0]==='to'&&c[2].opacity===1);assert.equal(fades.length,2);assert.deepEqual(fades.map(c=>c[3]),[.55,.65]);
});
test('reduced motion leaves original wording untouched and creates no animation',()=>{
 const sentence={querySelector(){throw Error('Reduced motion must not clone or change text');}};
 const controller=createHeroCopyCycle(sentence,{}, {reducedMotion:true});controller.dispose();controller.dispose();
 assert.deepEqual(HERO_SUFFIXES,['conectar seu futuro.','construir seu caminho.','ampliar seu olhar.']);
});
test('missing animation library keeps the static readable heading',()=>{
 const controller=createHeroCopyCycle({querySelector(){throw Error('No library: no mutation');}},null);controller.dispose();
});

test('successive cycles animate the repeated prefix again, not just the varying suffix',()=>{
 const r=recorder(),a=[{name:'prefix-a'},{name:'suffix-a'}],b=[{name:'prefix-b'},{name:'suffix-b'}];
 animateHeroFragments(r.gsap,a,b,()=>{},()=>{});animateHeroFragments(r.gsap,b,a,()=>{},()=>{});
 const exits=r.calls.filter(c=>c[0]==='to'&&c[2].yPercent===-150).map(c=>c[1].name);
 assert.deepEqual(exits,['prefix-a','suffix-a','prefix-b','suffix-b']);
});

test('SSR hero is pending, fallback is gated, and artwork initializes before motion awaits',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {renderDocument}=await import('./templates.js');
 const html=renderDocument({page:'home'});
 assert.match(html,/<div class="shared-artwork" data-shared-artwork data-render-mode="pending"/);
 assert.match(html,/data-hero-prefix>Uma nova forma de/);
 assert.match(html,/modulepreload[^>]+three-scene/);
 const css=await readFile(new URL('../css/main.css',import.meta.url),'utf8');
 assert.match(css,/\.hero \.hero-fallback\{opacity:0;visibility:hidden/);
 assert.ok(!css.includes('.hero[data-render-mode="pending"] .hero-fallback{opacity:1'), 'Reduced motion must not expose pending fallback before static WebGL');
 assert.match(css,/\.hero\[data-render-mode="fallback"\] \.hero-fallback\{opacity:1;visibility:visible/);
 const app=await readFile(new URL('./app.js',import.meta.url),'utf8');
 assert.ok(app.indexOf('if(canvas)initHero')<app.indexOf("await import('./vendor/motion.js')"));
 assert.ok(!app.includes('await initHero'));
});
