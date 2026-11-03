import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderNotFoundDocument } from '../js/not-found-page.js';
import { renderDocument } from '../js/templates.js';
import { initNotFound, perspectivePose, renderBudget } from '../js/not-found.js';

class Target {
  constructor() { this.listeners = new Map(); this.dataset = {}; this.hidden = false; this.attrs = {}; this.style = {}; }
  addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(fn); }
  removeEventListener(name, fn) { this.listeners.get(name)?.delete(fn); }
  emit(name, event = {}) { for (const fn of this.listeners.get(name) || []) fn(event); }
  setAttribute(name, value) { this.attrs[name] = value; }
}
function fixture({ reduced = false, search = '?404Diagnostic=1', noContext = false } = {}) {
  const root = new Target(), doc = new Target(), win = new Target(), media = new Target();
  media.matches = reduced;
  doc.defaultView = win; doc.hidden = false; root.ownerDocument = doc;
  const nodes = Object.fromEntries(['[data-not-found-art]', 'canvas', '[data-toggle-motion]', '[data-change-perspective]', '[data-perspective-status]'].map(key => [key, new Target()]));
  const label = {}, icon = {};
  root.querySelector = selector => nodes[selector];
  nodes['[data-toggle-motion]'].querySelector = selector => selector === '[data-motion-label]' ? label : icon;
  nodes['[data-not-found-art]'].getBoundingClientRect = () => ({width:640,height:540,left:0,top:0});
  nodes['[data-not-found-art]'].clientWidth = 640;
  nodes['[data-not-found-art]'].dataset.renderMode = 'fallback';
  const classes = new Set(); root.classList = { add: x => classes.add(x), remove: x => classes.delete(x) };
  const raf = new Map(), timers = new Map(); let id = 0;
  win.location = { search }; win.devicePixelRatio = 3; win.matchMedia = () => media;
  win.requestAnimationFrame = fn => { raf.set(++id, fn); return id; };
  win.cancelAnimationFrame = id => raf.delete(id);
  win.setTimeout = fn => { timers.set(++id, fn); return id; };
  win.clearTimeout = id => timers.delete(id);
  const stats = { renders:0, releases:0, geometries:0, materials:0, rendererReleases:0,textures:0 };
  class Geometry { constructor(){stats.geometries++;this.attributes={position:{count:6,setXYZ(){}},uv:{getX:i=>i/6,getY:i=>i/6}};} setIndex(){} computeVertexNormals(){} computeBoundingSphere(){} dispose(){stats.releases++;} }
  const vector = () => ({set(x,y,z){Object.assign(this,{x,y,z});},setScalar(value){this.value=value;}});
  class Mesh {constructor(){this.position=vector();this.rotation=vector();this.scale=vector();}}
  class Scene {constructor(){this.rotation=vector();}add(){}}
  class Camera {constructor(){this.position={z:0};}updateProjectionMatrix(){}}
  class Material {constructor(data){Object.assign(this,data);stats.materials++;}dispose(){stats.releases++;}}
  class Renderer {constructor(){if(noContext)throw Error('WebGL unavailable');}setClearColor(){}setPixelRatio(value){stats.dpr=value;}setSize(){}render(){stats.renders++;}dispose(){stats.rendererReleases++;}}
  class TextureLoader {load(url,done){stats.textures++;const texture={dispose(){stats.releases++;}};queueMicrotask(()=>done(texture));return texture;}}
  const T = {TextureLoader,SphereGeometry:Geometry,Mesh,Scene,PerspectiveCamera:Camera,ShaderMaterial:Material,WebGLRenderer:Renderer};
  return {root,win,doc,media,nodes,label,icon,raf,timers,stats,T,flush(time=1000){const items=[...raf.values()];raf.clear();items.forEach(fn=>fn(time));}};
}

test('404 has semantic SSR navigation, official wordmark, isolated runtime and noindex', () => {
  const html = renderNotFoundDocument({build:'test'});
  assert.equal((html.match(/<h1>/g)||[]).length, 1);
  assert.match(html, /lang="pt-BR"/); assert.match(html,/name="robots" content="noindex,follow"/);
  assert.match(html, /class="wordmark-svg"/); assert.match(html, /<canvas[^>]*aria-hidden="true"/);
  for (const route of ['/', '/#works', '/comunidade/', '/percursos/', '/modulos/pesquisa/']) assert.ok(html.includes(`href="${route}"`));
  assert.ok(!html.includes('/js/app.js')); assert.ok(!html.includes('http'));
  assert.equal(renderDocument({page:'404',build:'test'}),html);
  assert.equal(renderDocument({page:'project',slug:'unknown',build:'test'}),html);
  assert.match(renderNotFoundDocument({build:'"<script>'}), /&quot;&lt;script&gt;/);
});
test('quality budgets cap pixel ratio and perspectives stay bounded', () => {
  assert.deepEqual(renderBudget(390,3),{dpr:1.35,segments:48});
  assert.deepEqual(renderBudget(1440,3),{dpr:1.7,segments:64});
  assert.deepEqual(perspectivePose(3),perspectivePose(0));
  assert.deepEqual(perspectivePose(-1),perspectivePose(2));
});
test('forced static artwork does not load the GPU runtime', async () => {
  const f=fixture({search:'?webgl=0'});let loaded=false;
  const controller=await initNotFound(f.root,{loadRuntime:()=>{loaded=true;}});
  assert.equal(loaded,false);assert.equal(controller.mode,'fallback');assert.equal(f.raf.size,0);
  assert.equal(f.nodes['[data-toggle-motion]'].hidden,false);controller.dispose();
});
test('rejected imports and absent WebGL fail open, keeping accessible controls', async () => {
  for (const noContext of [false,true]) {
    const f=fixture({noContext});
    const controller=await initNotFound(f.root,{loadRuntime:()=>noContext?Promise.resolve(f.T):Promise.reject(Error('offline'))});
    assert.equal(controller.mode,'fallback');assert.equal(f.raf.size,0);assert.equal(f.nodes['[data-change-perspective]'].hidden,true);
    f.nodes['[data-toggle-motion]'].emit('click');assert.equal(f.label.textContent,'Retomar animações');controller.dispose();
  }
});
test('pause, repeated resume, tab visibility, bfcache and disposal own exactly one loop', async () => {
  const f=fixture();const controller=await initNotFound(f.root,{loadRuntime:()=>Promise.resolve(f.T)});
  assert.equal(controller.mode,'webgl');assert.equal(f.raf.size,1);assert.equal(f.stats.dpr,1.35);
  f.flush();assert.equal(f.raf.size,1);
  f.nodes['[data-toggle-motion]'].emit('click');assert.equal(f.raf.size,0);assert.equal(f.root.dataset.motion,'paused');
  const before=f.stats.renders;f.nodes['[data-change-perspective]'].emit('click');assert.equal(f.stats.renders,before+1);assert.match(f.nodes['[data-perspective-status]'].textContent,/Perspectiva 2/);
  f.nodes['[data-toggle-motion]'].emit('click');assert.equal(f.raf.size,1);
  f.win.emit('pageshow');assert.equal(f.raf.size,1);
  f.doc.hidden=true;f.doc.emit('visibilitychange');assert.equal(f.raf.size,0);
  f.doc.hidden=false;f.doc.emit('visibilitychange');assert.equal(f.raf.size,1);
  f.win.emit('pagehide',{persisted:true});assert.equal(f.raf.size,0);
  f.win.emit('pageshow');assert.equal(f.raf.size,1);
  controller.dispose();controller.dispose();assert.equal(f.raf.size,0);assert.equal(f.stats.releases,f.stats.geometries+f.stats.materials+f.stats.textures);assert.equal(f.stats.rendererReleases,1);
  for (const target of [f.win,f.doc,f.media,...Object.values(f.nodes)]) for (const set of target.listeners.values()) assert.equal(set.size,0);
});
test('reduced motion renders a still and never schedules an animation loop', async () => {
  const f=fixture({reduced:true});const controller=await initNotFound(f.root,{loadRuntime:()=>Promise.resolve(f.T)});
  assert.equal(controller.mode,'webgl');assert.ok(f.stats.renders>0);assert.equal(f.raf.size,0);
  assert.equal(f.root.dataset.motion,'paused');assert.equal(f.nodes['[data-toggle-motion]'].disabled,true);
  f.media.matches=false;f.media.emit('change');assert.equal(f.raf.size,1);
  f.media.matches=true;f.media.emit('change');assert.equal(f.raf.size,0);controller.dispose();
});
test('context loss reveals fallback and late imports cannot initialize after disposal', async () => {
  const f=fixture();const controller=await initNotFound(f.root,{loadRuntime:()=>Promise.resolve(f.T)});
  let prevented=false;f.nodes.canvas.emit('webglcontextlost',{preventDefault(){prevented=true;}});
  assert.ok(prevented);assert.equal(controller.mode,'fallback');assert.equal(f.raf.size,0);controller.dispose();
  const g=fixture();let resolve;const pending=initNotFound(g.root,{loadRuntime:()=>new Promise(r=>{resolve=r;})});
  g.win.emit('pagehide',{persisted:false});resolve(g.T);await pending;assert.equal(g.stats.renders,0);assert.equal(g.raf.size,0);
});
test('CSS provides responsive, opt-in animation and explicit reduced-motion shutdown', async () => {
  const css=await readFile(new URL('../css/not-found.css',import.meta.url),'utf8');
  assert.match(css,/@media\(max-width:760px\)/);assert.match(css,/@media\(max-width:370px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/animation:none!important/);
  assert.match(css,/animation-play-state:paused!important/);assert.match(css,/:focus-visible/);
  assert.ok(!css.includes('.nf-enhanced[data-motion=running]'));
});
