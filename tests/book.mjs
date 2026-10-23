import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderDocument,renderHome} from '../js/templates.js';
import {bookEditorialChapters as profiles} from '../js/book-editorial.js';
import {bookScrollState,createSpreadCache,createBookController} from '../js/book-controller.js';
import {bookBaseline,restoreBookTemplate,restoreBookApp} from './book-normalize.mjs';
const hash=v=>createHash('sha256').update(v).digest('hex');
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
function fakeEnv({top=0,reduced=false,engineLoaderOverride=null,gpuFactory=null,dragEnabled=false}={}){
 const events=()=>({events:{},addEventListener(k,f){(this.events[k]??=[]).push(f);},removeEventListener(k,f){this.events[k]=(this.events[k]||[]).filter(x=>x!==f);},fire(k,event={}){for(const f of this.events[k]||[])f(event);}});
 const element=()=>({...events(),dataset:{},hidden:false,style:{height:'',transform:'',setProperty(k,v){this[k]=v;}},attrs:{},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},querySelector(){return null;}});
 const nodes=Object.fromEntries(['track','stage','visual','canvas','css','controls','hint','skip','status','prev','next'].map(x=>[x,element()]));let position=top;
 nodes.track.getBoundingClientRect=()=>({top:position,bottom:position+(parseFloat(nodes.track.style.height)||5000)});
 nodes.visual.getBoundingClientRect=()=>({left:100,top:100,width:1000,height:600});const captures=new Set(),frames=new Map(),ownership=[];let frameId=0;nodes.visual.setPointerCapture=id=>captures.add(id);nodes.visual.hasPointerCapture=id=>captures.has(id);nodes.visual.releasePointerCapture=id=>captures.delete(id);
 const chapters=Array.from({length:7},(_,i)=>({...element(),querySelector:()=>({textContent:'Chapter '+i})}));
 const jumps=Array.from({length:7},(_,i)=>({...element(),dataset:{bookJump:String(i)}}));
 const root={...element(),querySelector(sel){const name=sel.match(/data-book-([^\]]+)/)?.[1];return nodes[name]||null;},querySelectorAll(sel){return sel==='[data-book-chapter]'?chapters:sel==='[data-book-jump]'?jumps:[];}};
 const header={inert:false};const classes=new Set();const media={...events(),matches:reduced};const win={...events(),innerHeight:800,scrollY:2000,matchMedia:()=>media,setTimeout,clearTimeout,requestAnimationFrame(fn){frames.set(++frameId,fn);return frameId;},cancelAnimationFrame(id){frames.delete(id);}};const doc={...events(),visibilityState:'visible',querySelector:()=>header,body:{classList:{toggle(name,value){if(value)classes.add(name);else classes.delete(name);}}}};
 let imports=0,artDisposes=0,cssDisposes=0,gpuDisposes=0;const poses=[],visible=[],calls=[];
 const loadEngines=async()=>{imports++;return[
  {createBookArt:async()=>({loadSpread:async index=>({width:2100,height:1200,index}),loadLayers:async index=>({background:{index},illustration:{index},type:{index}}),dispose(){artDisposes++;}})},
  {initBookRenderer:async(...args)=>gpuFactory?gpuFactory(...args):({mode:'fallback',setProgress:p=>poses.push(p),setVisible:v=>visible.push(v),resize(){},dispose(){gpuDisposes++;}})},
  {initBookFallback(_root,options){const ready=Promise.resolve().then(()=>options.loadSpread(Math.floor(options.getProgress()))).then(()=>{options.onReady();return true;});return{ready,setProgress:p=>poses.push(p),setVisible:v=>visible.push(v),resize(){},dispose(){cssDisposes++;}}}}
 ];};
 const controller=createBookController(root,{window:win,document:doc,loadEngines:engineLoaderOverride||loadEngines,scrollImmediate:dragEnabled?(target=>{const absolute=position+win.scrollY;win.scrollY=target;position=absolute-target;}):undefined,onDragActive:(active,resume)=>ownership.push({active,resume}),scrollTo:(...v)=>calls.push(v),getScrollY:()=>win.scrollY});
 return{controller,root,nodes,captures,frames,ownership,chapters,jumps,win,doc,media,header,classes,poses,visible,calls,setTop:v=>position=v,stats:()=>({imports,artDisposes,cssDisposes,gpuDisposes})};
}
test('finite scroll pose is monotonic, held at readable stops and exactly reversible',()=>{
 const end=bookScrollState(-999999,800);assert.equal(end.progress,6);assert.equal(end.offset,end.travel);
 assert.equal(bookScrollState(200,800).progress,0);assert.equal(bookScrollState(-704,800).progress,1);
 const values=Array.from({length:101},(_,i)=>bookScrollState(-end.travel*i/100,800).progress);
 for(let i=1;i<values.length;i++)assert.ok(values[i]>=values[i-1]);
 for(let i=0;i<=100;i++)assert.equal(bookScrollState(-end.travel*i/100,800).progress,values[i]);
 assert.equal(bookScrollState(-704*.1,800).progress,0);assert.equal(bookScrollState(-704*.9,800).progress,1);
});
test('shared artwork cache deduplicates jobs and bounds retained borrowed canvases without pixel mutation',async()=>{
 let loads=0;const images=[];const cache=createSpreadCache(async index=>{loads++;const c={width:2100,height:1200,index};images.push(c);return c;});
 const [a,b]=await Promise.all([cache.load(0),cache.load(0)]);assert.equal(a,b);assert.equal(loads,1);
 for(let i=1;i<7;i++)await cache.load(i);assert.equal(cache.size,3);cache.dispose();assert.equal(cache.size,0);
 for(const c of images)assert.equal(c.width,2100);await assert.rejects(cache.load(1),/disposed/);
});
test('GPU handoff clears flattened retention even when a borrowed CSS artwork job resolves late',async()=>{
 let resolve;const cache=createSpreadCache(()=>new Promise(r=>resolve=r));const pending=cache.load(1);await Promise.resolve();cache.clear();const canvas={width:2100,height:1200};resolve(canvas);assert.equal(await pending,canvas);assert.equal(cache.size,0);assert.equal(canvas.width,2100);cache.dispose();
});
test('book enhances only near its section; reduced motion preserves the full semantic reading layout',async()=>{
 const far=fakeEnv({top:10000});await flush();assert.equal(far.stats().imports,0);far.controller.dispose();
 const reduced=fakeEnv({reduced:true});await flush();assert.equal(reduced.stats().imports,0);assert.equal(reduced.controller.interactive,false);assert.ok(reduced.chapters.every(c=>!c.hidden));reduced.controller.dispose();
});
test('pin, controls and reversal follow actual scroll geometry rather than private page state',async()=>{
 const env=fakeEnv();await flush();assert.equal(env.controller.interactive,true);assert.equal(env.nodes.track.style.height,'5024px');assert.equal(env.chapters[0].hidden,false);
 env.setTop(-1408);env.controller.update();assert.equal(env.controller.progress,2);assert.equal(env.chapters[2].hidden,false);assert.equal(env.nodes.stage.style.transform,'translate3d(0,1408px,0)');
 env.controller.go(5);assert.deepEqual(env.calls.at(-1),[4112,700]);assert.equal(env.controller.progress,2,'navigation does not decouple rendered pose from scroll');
 env.setTop(-704);env.controller.update();assert.equal(env.controller.progress,1);assert.equal(env.chapters[1].hidden,false);
 env.nodes.controls.fire('keydown',{key:'Home',preventDefault(){},stopPropagation(){}});assert.equal(env.calls.at(-1)[0],1296);
 env.controller.dispose();assert.ok(env.stats().artDisposes>0);assert.ok(env.stats().cssDisposes>0);
});
test('offscreen, page lifecycle and runtime reduced-motion changes stop the enhanced view safely',async()=>{
 const env=fakeEnv();await flush();env.controller.setVisible(false);assert.equal(env.visible.at(-1),false);env.controller.setVisible(true);assert.equal(env.visible.at(-1),true);
 env.setTop(-10000);env.controller.update();assert.equal(env.visible.at(-1),false);env.setTop(-704);env.controller.update();assert.equal(env.visible.at(-1),true);
 env.media.matches=true;env.media.fire('change');assert.equal(env.controller.interactive,false);assert.ok(env.chapters.every(c=>!c.hidden));assert.equal(env.nodes.track.style.height,'');env.controller.dispose();
});
test('global header is hidden and inert only while the finite book is pinned',async()=>{
 const env=fakeEnv({top:50});await flush();assert.equal(env.header.inert,false);assert.equal(env.classes.has('book-reading-active'),false);
 env.setTop(-704);env.controller.update();assert.equal(env.header.inert,true);assert.equal(env.classes.has('book-reading-active'),true);
 env.controller.setVisible(false);assert.equal(env.header.inert,false);env.controller.setVisible(true);assert.equal(env.header.inert,true);
 env.setTop(-5000);env.controller.update();assert.equal(env.header.inert,false);assert.equal(env.classes.has('book-reading-active'),false);
 env.setTop(-704);env.controller.update();env.controller.dispose();assert.equal(env.header.inert,false);assert.equal(env.classes.has('book-reading-active'),false);
});
test('late engine imports cannot allocate after disposal',async()=>{
 let resolve,artCalls=0,imports=0;const promise=new Promise(r=>resolve=r);
 const env=fakeEnv({engineLoaderOverride:()=>{imports++;return promise;}});assert.equal(imports,1);env.controller.dispose();
 resolve([{createBookArt(){artCalls++;return{};}},{},{}]);await flush();assert.equal(artCalls,0);assert.equal(env.controller.interactive,false);
});
test('controller wires independent artwork layers into the GPU fidelity path',async()=>{
 let received;const env=fakeEnv({gpuFactory:async(_canvas,options)=>{received=options;return{mode:'webgl',setVisible(){},setProgress(){},resize(){},dispose(){}};}});await flush();assert.equal(typeof received.loadLayers,'function');const layers=await received.loadLayers(3);await flush();assert.equal(layers.illustration.index,3);assert.equal(layers.type.index,3);assert.equal(env.nodes.visual.dataset.bookRender,'ready');env.controller.dispose();
});
test('pending GPU upgrade aborts on pagehide and can safely retry after persisted restoration',async()=>{
 const jobs=[];let disposed=0;
 const env=fakeEnv({gpuFactory:(_canvas,options)=>new Promise(resolve=>{const job={options,resolve};jobs.push(job);options.signal.addEventListener('abort',()=>resolve({mode:'fallback',dispose(){disposed++;}}),{once:true});})});
 await flush();assert.equal(jobs.length,1);env.controller.setVisible(false);assert.equal(jobs[0].options.signal.aborted,true);await flush();
 env.controller.setVisible(true);await flush();assert.equal(jobs.length,2);assert.equal(jobs[1].options.signal.aborted,false);
 jobs[1].resolve({mode:'webgl',setVisible(){},setProgress(){},resize(){},dispose(){disposed++;}});await flush();assert.equal(env.nodes.visual.dataset.bookRender,'ready');assert.equal(env.nodes.css.hidden,true);assert.ok(env.stats().cssDisposes>0);assert.ok(disposed>0);
 env.controller.dispose();
});
test('pending GPU allocation is also aborted when the book scrolls beyond the lazy region',async()=>{
 const jobs=[];const env=fakeEnv({gpuFactory:(_canvas,options)=>new Promise(resolve=>{jobs.push(options);options.signal.addEventListener('abort',()=>resolve({mode:'fallback',dispose(){}}),{once:true});})});
 await flush();assert.equal(jobs.length,1);env.setTop(-10000);env.controller.update();assert.equal(jobs[0].signal.aborted,true);env.controller.dispose();await flush();
});
test('six original narratives and links survive in semantic HTML with original illustrations and no system screenshots',()=>{
 const home=renderHome();assert.ok(home.includes('data-book'));assert.ok(home.includes('id="team"'));assert.ok(!home.includes('class="members"'));
 for(const p of profiles){assert.ok(home.includes(p.displayTitle));assert.ok(home.includes(p.body));assert.ok(home.includes(p.href));}
 assert.equal((home.match(/data-book-chapter=/g)||[]).length,7);assert.equal((home.match(/data-book-jump=/g)||[]).length,7);
 const book=home.slice(home.indexOf('<section id="team"'),home.indexOf('<section id="team"')+home.slice(home.indexOf('<section id="team"')).indexOf('</section>'));assert.ok(!book.includes('/assets/tiles/'));assert.ok(!book.includes('Interfaces de demonstração'));assert.equal((book.match(/\/assets\/book-pages\//g)||[]).length,7);assert.ok(home.includes('data-book-skip'));
 for(const page of ['community','directory','404','project'])assert.ok(!renderDocument({page,slug:'trajetoria'}).includes('data-book-track'));
});
test('protected homepage and scroll machinery differ only by the bounded book integration',async()=>{
 const templates=await readFile(new URL('../js/templates.js',import.meta.url),'utf8'),app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
 assert.equal(hash(restoreBookTemplate(templates)),bookBaseline.templatesSHA);assert.equal(restoreBookApp(app),bookBaseline.app);
 assert.ok(app.includes('sharedScene.update();bookController?.update();'));
 const controller=await readFile(new URL('../js/book-controller.js',import.meta.url),'utf8');assert.ok(!controller.includes("'wheel'"));assert.ok(!controller.includes("'touchmove'"));
 const css=await readFile(new URL('../css/book.css',import.meta.url),'utf8');assert.ok(css.includes('(max-height:700px)'));assert.ok(css.includes('prefers-reduced-motion:reduce'));
});

test('active drag cancellation never latches the global scroll engine and permits visibility/BFCache recovery',async()=>{
 for(const reason of ['bfcache','hidden','reduced','dispose']){
  const env=fakeEnv({dragEnabled:true});await flush();
  const pointer={pointerId:1,pointerType:'mouse',button:0,buttons:1,isPrimary:true,clientX:600,clientY:350,preventDefault(){}};
  env.nodes.visual.fire('pointerdown',pointer);assert.equal(env.captures.size,1);
  if(reason==='bfcache')env.controller.setVisible(false);
  else if(reason==='hidden'){env.doc.visibilityState='hidden';env.doc.fire('visibilitychange');}
  else if(reason==='reduced'){env.media.matches=true;env.media.fire('change');}
  else env.controller.dispose();
  assert.equal(env.captures.size,0);assert.equal(env.ownership.length,0,'controller never takes global stop/start ownership');assert.equal(env.calls.length,0);
  if(reason==='bfcache')env.controller.setVisible(true);
  else if(reason==='hidden'){env.doc.visibilityState='visible';env.doc.fire('visibilitychange');}
  else if(reason==='reduced'){env.media.matches=false;env.media.fire('change');}
  if(reason!=='dispose'){await flush();env.nodes.visual.fire('pointerdown',pointer);assert.equal(env.captures.size,1,reason+' allows a new drag after return');}
  env.controller.dispose();assert.equal(env.captures.size,0);assert.equal(env.ownership.length,0);
 }
});
