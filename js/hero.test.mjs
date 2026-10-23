import test from 'node:test';
import assert from 'node:assert/strict';
import { initHero, getHeroScrollState } from './hero.js';
import * as T from './vendor/three-scene.js';
import * as shaders from './shaders/shaders.js';

test('exact local Three r131 exports construct geometry, shader and camera', () => {
  assert.equal(T.REVISION, '131');
  const geometry = new T.SphereGeometry(.4, 64, 64);
  assert.equal(geometry.parameters.radius, .4);
  assert.equal(geometry.parameters.widthSegments, 64);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(45, 16 / 9, .1, 20);
  camera.position.set(0, 0, -4);
  const material = new T.ShaderMaterial({ vertexShader: shaders.LENS_VERT, fragmentShader: shaders.LENS_FRAG });
  scene.add(new T.Mesh(geometry, material));
  assert.equal(scene.children.length, 1);
  assert.equal(camera.fov, 45);
  assert.equal(typeof T.EffectComposer, 'function');
  assert.equal(typeof T.RenderPass, 'function');
  assert.equal(typeof T.ShaderPass, 'function');
  geometry.dispose(); material.dispose();
});

test('lens preserves source chromatic refraction and Fresnel shader mechanics', () => {
  assert.match(shaders.LENS_VERT, /mRefractionRatio \* 0\.99/);
  assert.match(shaders.LENS_VERT, /mRefractionRatio \* 0\.98/);
  assert.match(shaders.LENS_FRAG, /textureCube/);
  assert.match(shaders.GRAIN_FRAG, /random\(uvRandom\)\*0\.075/);
  assert.match(shaders.BACKGROUND_FRAG, /snoise3/);
});

test('missing canvas fails open without throwing and dispose is repeatable', async () => {
  const hero = await initHero(null);
  assert.equal(hero.mode, 'fallback');
  assert.equal(hero.reason, 'Canvas unavailable');
  hero.reveal(); hero.setVisible(false); hero.dispose(); hero.dispose();
});

function mockBrowser() {
  const host = { dataset: {}, clientWidth: 1280, clientHeight: 800 };
  const canvas = {
    dataset: {}, style: {}, clientWidth: 1280, clientHeight: 800,
    getContext() { return null; }, closest() { return host; },
    setAttribute() {}, addEventListener() {}, removeEventListener() {},
  };
  globalThis.window = {
    location: { search: '' }, innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
    matchMedia() { return { matches: false }; },
  };
  globalThis.document = {};
  return { canvas, host, restore() { delete globalThis.window; delete globalThis.document; } };
}

test('forced static mode makes canvas non-blocking and communicates fallback', async () => {
  const { canvas, host, restore } = mockBrowser();
  try {
    const hero = await initHero(canvas, { forceFallback: true });
    assert.equal(hero.mode, 'fallback');
    assert.equal(canvas.style.visibility, 'hidden');
    assert.equal(canvas.style.pointerEvents, 'none');
    assert.equal(canvas.dataset.heroState, 'fallback');
    assert.equal(host.dataset.renderMode, 'fallback');
    hero.dispose();
  } finally { restore(); }
});

test('actual Three WebGL-constructor failure returns fallback, not a pending loader', async () => {
  const { canvas, host, restore } = mockBrowser();
  const error = console.error;
  console.error = () => {};
  try {
    const hero = await initHero(canvas);
    assert.equal(hero.mode, 'fallback');
    assert.match(hero.reason, /WebGL context/);
    assert.equal(canvas.style.opacity, '0');
    assert.equal(host.dataset.renderMode, 'fallback');
    hero.dispose();
  } finally { console.error = error; restore(); }
});

const nextTurn = () => new Promise(resolve => setImmediate(resolve));
function mockRuntime(onRender = () => {}, capture = {}) {
  return {
    ...T,
    ShaderMaterial: class extends T.ShaderMaterial {
      constructor(options) { super(options); (capture.materials ||= []).push(this); }
    },
    Mesh: class extends T.Mesh {
      constructor(geometry,material) { super(geometry,material); (capture.meshes ||= []).push(this); }
    },
    WebGLRenderer: class {
      constructor() { this.info = { programs: [] }; }
      setPixelRatio() {} setClearColor() {} setSize() {} dispose() {}
      getContext() { return { isContextLost: () => false }; }
    },
    EffectComposer: class {
      constructor() {
        this.renderTarget1 = { dispose() {} };
        this.renderTarget2 = { dispose() {} };
      }
      addPass() {} setSize() {} render() { onRender(); }
    },
    RenderPass: class {},
    ShaderPass: class {
      constructor(options) { this.material = new T.ShaderMaterial(options); }
    },
    CubeCamera: class {
      constructor() { this.position = new T.Vector3(); }
      update() { capture.cubeUpdates=(capture.cubeUpdates||0)+1; }
    },
  };
}
function frameQueue() {
  const frames = new Map(); let id = 0;
  window.requestAnimationFrame = callback => { frames.set(++id, callback); return id; };
  window.cancelAnimationFrame = frame => frames.delete(frame);
  return {
    get size() { return frames.size; },
    run() { const [key, callback] = frames.entries().next().value; frames.delete(key); callback(performance.now()); },
  };
}

test('pending hides canvas and fallback until runtime and first successful frame', async () => {
  const { canvas, host, restore } = mockBrowser();
  const frames = frameQueue(); let finishImport; let renders = 0;
  const load = new Promise(resolve => { finishImport = resolve; });
  try {
    const pending = initHero(canvas, { loadRuntime: () => load, timeoutMs: 5000 });
    assert.equal(host.dataset.renderMode, 'pending');
    assert.equal(host.dataset.heroState, 'pending');
    assert.equal(canvas.dataset.heroState, 'pending');
    assert.equal(canvas.style.visibility, 'hidden');
    assert.equal(canvas.style.opacity, '0');
    finishImport(mockRuntime(() => {
      renders++;
      assert.equal(host.dataset.renderMode, 'pending');
      assert.equal(canvas.style.opacity, '0');
    }));
    await nextTurn();
    assert.equal(frames.size, 1);
    assert.equal(renders, 0);
    assert.equal(host.dataset.renderMode, 'pending');
    frames.run();
    const hero = await pending;
    assert.equal(renders, 1);
    assert.equal(hero.mode, 'webgl');
    assert.equal(host.dataset.renderMode, 'webgl');
    assert.equal(host.dataset.heroState, 'ready');
    assert.equal(canvas.style.visibility, 'visible');
    assert.equal(canvas.style.opacity, '1');
    assert.equal(canvas.style.transition, 'opacity 800ms ease');
    hero.dispose();
    assert.equal(frames.size, 0);
  } finally { restore(); }
});

test('runtime timeout resolves controller and ignores a late runtime', async () => {
  const { canvas, host, restore } = mockBrowser();
  let finishImport, accessed = false;
  const load = new Promise(resolve => { finishImport = resolve; });
  try {
    const hero = await initHero(canvas, { loadRuntime: () => load, timeoutMs: 20 });
    assert.equal(hero.mode, 'fallback');
    assert.match(hero.reason, /timed out/);
    assert.equal(host.dataset.renderMode, 'fallback');
    finishImport({ get Scene() { accessed = true; throw new Error('Late runtime must not initialize'); } });
    await nextTurn();
    assert.equal(accessed, false);
    assert.equal(hero.mode, 'fallback');
    assert.equal(canvas.style.visibility, 'hidden');
    hero.dispose();
  } finally { restore(); }
});

test('stalled first RAF times out without publishing a WebGL frame', async () => {
  const { canvas, host, restore } = mockBrowser();
  const frames = frameQueue(); let renders = 0;
  try {
    const hero = await initHero(canvas, { loadRuntime: async () => mockRuntime(() => renders++), timeoutMs: 25 });
    assert.equal(hero.mode, 'fallback');
    assert.match(hero.reason, /timed out/);
    assert.equal(host.dataset.heroState, 'fallback');
    assert.equal(renders, 0);
    assert.equal(frames.size, 0);
    hero.dispose();
  } finally { restore(); }
});


test('scroll state is zero-default, continuous forward/back, and lens-free by science', () => {
  assert.deepEqual(getHeroScrollState(), {progress:0,fieldY:0,lensAlpha:1,lensOffsetY:0,lensVisible:true});
  assert.deepEqual(getHeroScrollState(400,800), {progress:.5,fieldY:-.2,lensAlpha:.5,lensOffsetY:.9,lensVisible:true});
  assert.deepEqual(getHeroScrollState(800,800), {progress:1,fieldY:-.4,lensAlpha:0,lensOffsetY:1.8,lensVisible:false});
  assert.equal(getHeroScrollState(1600,800).fieldY,-.8);
  assert.deepEqual(getHeroScrollState(0,800),getHeroScrollState());
  assert.deepEqual(getHeroScrollState(800,800,true),{progress:1,fieldY:0,lensAlpha:0,lensOffsetY:0,lensVisible:false});
  assert.match(shaders.BACKGROUND_FRAG,/uniform float uScrollOffset/);
  assert.match(shaders.BACKGROUND_FRAG,/uv.y \+= uScrollOffset/);
});

test('full science hides mesh and skips cube sampling; scrolling back restores both', async () => {
  const {canvas,restore}=mockBrowser();const frames=frameQueue();const capture={};
  try {
    const pending=initHero(canvas,{intro:false,loadRuntime:async()=>mockRuntime(()=>{},capture),timeoutMs:5000});
    await nextTurn();frames.run();const hero=await pending;
    const background=capture.materials[0],lens=capture.meshes[1],material=capture.materials[1];
    assert.equal(background.uniforms.uScrollOffset.value,0);
    assert.equal(lens.position.y,.75);assert.equal(material.uniforms.uSphereAlpha.value,1);
    const initialCubeUpdates=capture.cubeUpdates;
    hero.setScrollOffset(800,800);assert.equal(frames.size,1);frames.run();
    assert.equal(lens.visible,false);assert.equal(material.uniforms.uSphereAlpha.value,0);
    assert.equal(material.uniforms.uRefractionPower.value,0);assert.equal(background.uniforms.uScrollOffset.value,-.4);
    assert.equal(capture.cubeUpdates,initialCubeUpdates);
    hero.setScrollOffset(0,800);frames.run();
    assert.equal(lens.visible,true);assert.equal(lens.position.y,.75);
    assert.equal(background.uniforms.uScrollOffset.value,0);assert.equal(capture.cubeUpdates,initialCubeUpdates+1);
    hero.dispose();assert.equal(frames.size,0);
  } finally {restore();}
});

test('reduced-motion scroll redraws are coalesced, remove lens, and never animate field',async()=>{
  const {canvas,restore}=mockBrowser();const frames=frameQueue();const capture={};let renders=0;
  window.matchMedia=()=>({matches:true});
  try{
    const pending=initHero(canvas,{loadRuntime:async()=>mockRuntime(()=>renders++,capture),timeoutMs:5000});
    await nextTurn();frames.run();const hero=await pending;
    assert.equal(frames.size,0);const before=renders;
    hero.setScrollOffset(200,800);hero.setScrollOffset(500,800);hero.setScrollOffset(800,800);
    hero.setVisible(true);assert.equal(frames.size,1);frames.run();
    assert.equal(renders,before+1);assert.equal(frames.size,0);
    assert.equal(capture.materials[0].uniforms.uScrollOffset.value,0);assert.equal(capture.meshes[1].visible,false);
    hero.setScrollOffset(0,800);frames.run();assert.equal(capture.meshes[1].visible,true);assert.equal(frames.size,0);
    hero.setVisible(false);document.hidden=true;hero.setScrollOffset(800,800);assert.equal(frames.size,0);
    document.hidden=false;hero.setVisible(true);assert.equal(frames.size,1);frames.run();
    assert.equal(capture.meshes[1].visible,false);assert.equal(capture.materials[0].uniforms.uScrollOffset.value,0);assert.equal(frames.size,0);
    hero.dispose();
  }finally{restore();}
});

test('fallback controller accepts scroll updates without scheduling or throwing',async()=>{
  const {canvas,restore}=mockBrowser();const frames=frameQueue();
  try{const hero=await initHero(canvas,{forceFallback:true});hero.setScrollOffset(800,800);assert.equal(frames.size,0);hero.dispose();hero.setScrollOffset(0,800);}
  finally{restore();}
});


test('restored science scroll is sampled before the first visible draw in both motion modes',async()=>{
  for(const reduced of [false,true]){
    const {canvas,restore}=mockBrowser();const frames=frameQueue();const capture={};let offset=0,reads=0;
    window.matchMedia=()=>({matches:reduced});
    try{
      const pending=initHero(canvas,{intro:false,timeoutMs:5000,
        getInitialScrollState:()=>{reads++;return {offsetPx:offset,heroHeightPx:800};},
        loadRuntime:async()=>mockRuntime(()=>{
          assert.equal(capture.meshes[1].visible,false);
          assert.equal(capture.materials[0].uniforms.uScrollOffset.value,reduced?0:-.4);
          assert.equal(canvas.style.opacity,'0');
        },capture),
      });
      await nextTurn();offset=800;frames.run();const hero=await pending;
      assert.equal(hero.mode,'webgl');assert.equal(reads,1);assert.equal(capture.cubeUpdates||0,0);
      assert.equal(canvas.style.opacity,'1');hero.dispose();
    }finally{restore();}
  }
});
