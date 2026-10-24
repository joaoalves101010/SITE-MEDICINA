import test from 'node:test';
import assert from 'node:assert/strict';
import {createBookViewport,bookScrollState,createBookController} from './book-controller.js';

const events=()=>({listeners:new Map(),addEventListener(name,fn){const list=this.listeners.get(name)||[];list.push(fn);this.listeners.set(name,list);},removeEventListener(name,fn){this.listeners.set(name,(this.listeners.get(name)||[]).filter(value=>value!==fn));},fire(name){for(const fn of [...this.listeners.get(name)||[]])fn({});}});
function environment({coarse=true,touch=5,width=390,height=844,offset=0,immediate=true}={}){
  const queries=new Map(),timers=new Map();let timerId=0,absoluteTop=2000;
  const orientation={...events(),angle:0,type:'portrait-primary'};
  const win={...events(),innerWidth:width,innerHeight:height,scrollY:absoluteTop+offset,navigator:{maxTouchPoints:touch},screen:{orientation},matchMedia(query){if(!queries.has(query))queries.set(query,{...events(),matches:query.includes('coarse')?coarse:query.includes('fine')?!coarse:false});return queries.get(query);},setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);},requestAnimationFrame(fn){return this.setTimeout(fn);},cancelAnimationFrame(id){this.clearTimeout(id);}};
  const node=()=>({...events(),dataset:{},style:{height:'',transform:'',setProperty(name,value){this[name]=value;}},hidden:false,setAttribute(){},removeAttribute(){},querySelector(){return null;}});
  const nodes=Object.fromEntries(['track','stage','visual','canvas','css','controls','hint','skip','status','prev','next'].map(name=>[name,node()]));
  nodes.track.getBoundingClientRect=()=>({top:absoluteTop-win.scrollY,bottom:absoluteTop-win.scrollY+(parseFloat(nodes.track.style.height)||5000)});
  nodes.visual.getBoundingClientRect=()=>({left:0,top:0,width:390,height:300});
  const root={...node(),querySelector(selector){return nodes[selector.match(/data-book-([^\]]+)/)?.[1]]||null;},querySelectorAll(){return[];}};
  const doc={...events(),documentElement:{clientHeight:height,clientWidth:width},visibilityState:'visible',body:{classList:{toggle(){}}},querySelector:()=>null};
  const writes=[],layouts=[];
  const loadEngines=async()=>[
    {createBookArt:async()=>({loadSpread:async()=>({}),dispose(){}})},
    {initBookRenderer:async()=>({mode:'fallback',setProgress(){},setVisible(){},resize(){},dispose(){}})},
    {initBookFallback(_root,options){return{ready:Promise.resolve().then(()=>options.onReady()),setProgress(){},setVisible(){},resize(){},dispose(){}};}}
  ];
  const makeController=()=>createBookController(root,{window:win,document:doc,loadEngines,getScrollY:()=>win.scrollY,onLayout:()=>layouts.push(true),scrollImmediate:immediate?(value=>{writes.push(value);win.scrollY=value;}):undefined});
  return {win,doc,root,nodes,queries,timers,orientation,writes,layouts,makeController,setAbsoluteTop(value){absoluteTop=value;}};
}
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};

test('mobile URL-bar height-only changes preserve initial height, travel and exact scroll pose',()=>{
  const env=environment(),viewport=createBookViewport(env.win,env.doc);
  const initial=bookScrollState(-1782,viewport.getHeight());assert.equal(initial.travel,4456.32);
  for(const height of [756,790,844,756]){
    env.win.innerHeight=height;const change=viewport.refresh();
    assert.equal(change.geometryChanged,false);assert.equal(change.changed,false);assert.equal(viewport.getHeight(),844);
    assert.deepEqual(bookScrollState(-1782,viewport.getHeight()),initial);
  }
});

test('mobile width changes and explicit orientation changes adopt the new layout height',()=>{
  const env=environment(),viewport=createBookViewport(env.win,env.doc);
  env.win.innerWidth=844;env.win.innerHeight=390;
  assert.equal(viewport.refresh().geometryChanged,true);assert.equal(viewport.getHeight(),390);
  env.win.innerHeight=360;assert.equal(viewport.refresh().changed,false);
  env.orientation.angle=90;assert.equal(viewport.refresh().changed,true);assert.equal(viewport.getHeight(),360);
  env.win.innerHeight=340;assert.equal(viewport.refresh().changed,false);assert.equal(viewport.getHeight(),360);
});

test('desktop height remains live and finite without waiting for a resize notification',()=>{
  const env=environment({coarse:false,touch:0,width:1440,height:900}),viewport=createBookViewport(env.win,env.doc);
  assert.equal(viewport.stable,false);env.win.innerHeight=720;assert.equal(viewport.getHeight(),720);
  assert.ok(Math.abs(bookScrollState(-1000,viewport.getHeight()).travel-3801.6)<1e-9);
  env.win.innerHeight=0;assert.equal(viewport.getHeight(),900);
  const empty=createBookViewport({innerHeight:0,innerWidth:0});assert.equal(empty.getHeight(),1);
});

test('controller keeps track, stage and page progress fixed on a Safari chrome resize',async()=>{
  const env=environment({offset:1782}),controller=env.makeController();await flush();assert.equal(controller.interactive,true);
  const before={height:env.nodes.track.style.height,stage:env.root.style['--book-stage-height'],transform:env.nodes.stage.style.transform,progress:controller.progress};
  env.win.innerHeight=756;env.win.fire('resize');controller.update();
  assert.deepEqual({height:env.nodes.track.style.height,stage:env.root.style['--book-stage-height'],transform:env.nodes.stage.style.transform,progress:controller.progress},before);
  assert.equal(env.writes.length,0);controller.dispose();
});

test('pinned mobile rotation preserves the same held/eased logical pose with one immediate mapping',async()=>{
  const env=environment({offset:1782}),controller=env.makeController();await flush();const before=controller.progress;
  env.win.innerWidth=844;env.win.innerHeight=390;env.orientation.angle=90;
  env.win.fire('resize');assert.equal(env.writes.length,1);assert.ok(Math.abs(controller.progress-before)<1e-12);
  assert.equal(env.root.style['--book-stage-height'],'390px');assert.equal(env.nodes.track.style.height,'2449.2px');
  env.orientation.fire('change');env.win.fire('orientationchange');assert.equal(env.writes.length,1,'duplicate geometry notifications do not write scroll again');
  controller.dispose();
});

test('pinned rotation also accounts for preceding document reflow without changing logical progress',async()=>{
  const env=environment({offset:1782}),controller=env.makeController();await flush();const before=controller.progress;
  env.setAbsoluteTop(1500);env.win.innerWidth=844;env.win.innerHeight=390;env.win.fire('resize');
  assert.equal(env.writes.length,1);assert.ok(Math.abs(controller.progress-before)<1e-12);controller.dispose();
});


test('a same-height width reflow preserves the pinned pose without unnecessary repeated mapping',async()=>{
  const env=environment({offset:1782}),controller=env.makeController();await flush();const before=controller.progress;
  env.setAbsoluteTop(1800);env.win.innerWidth=430;env.win.fire('resize');
  assert.equal(env.writes.length,1);assert.ok(Math.abs(controller.progress-before)<1e-12);
  env.win.fire('resize');assert.equal(env.writes.length,1);controller.dispose();
});

test('offscreen, hidden and unavailable-immediate mobile geometry changes never force scroll',async()=>{
  for(const mode of ['offscreen','hidden','no-immediate']){
    const env=environment({offset:mode==='offscreen'?-100:1782,immediate:mode!=='no-immediate'}),controller=env.makeController();await flush();
    if(mode==='hidden'){env.doc.visibilityState='hidden';env.doc.fire('visibilitychange');}
    env.win.innerWidth=844;env.win.innerHeight=390;env.win.fire('resize');
    assert.equal(env.writes.length,0,mode);controller.dispose();
  }
});

test('desktop resize retains scroll geometry behavior and never performs mobile remapping',async()=>{
  const env=environment({coarse:false,touch:0,width:1440,height:900,offset:1782}),controller=env.makeController();await flush();
  const before=controller.progress;env.win.innerHeight=720;env.win.fire('resize');
  assert.notEqual(controller.progress,before);assert.equal(env.writes.length,0);assert.equal(env.root.style['--book-stage-height'],'720px');controller.dispose();
});

test('visibility restoration retains cached mobile height and disposal removes all new listeners',async()=>{
  const env=environment({offset:1782}),controller=env.makeController();await flush();const before=controller.progress;
  controller.setVisible(false);env.win.innerHeight=756;env.win.fire('resize');controller.setVisible(true);await flush();
  assert.equal(controller.progress,before);assert.equal(env.root.style['--book-stage-height'],'844px');
  controller.dispose();controller.dispose();const count=env.layouts.length;
  env.win.innerWidth=844;env.win.fire('resize');env.win.fire('orientationchange');env.orientation.fire('change');
  assert.equal(env.layouts.length,count);assert.equal(env.timers.size,0);
  for(const target of [env.win,env.doc,env.nodes.visual,env.orientation,...env.queries.values()])assert.ok([...target.listeners.values()].every(list=>list.length===0));
});
