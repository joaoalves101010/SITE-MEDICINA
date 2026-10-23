/**
 * Innecta procedural hero.
 * Scene geometry, Fresnel/refraction, noise and grain are source-preserving
 * adaptations of the reference. The wine/cream palette is Innecta-specific.
 * No page content, navigation, or scrolling depends on WebGL readiness.
 */
import {
  BACKGROUND_VERT, BACKGROUND_FRAG, LENS_VERT, LENS_FRAG,
  GRAIN_VERT, GRAIN_FRAG,
} from './shaders/shaders.js';

const clamp = (n, low = 0, high = 1) => Math.max(low, Math.min(high, n));
const expoOut = n => n >= 1 ? 1 : 1 - Math.pow(2, -10 * Math.max(0, n));
const expoInOut = n => n <= 0 ? 0 : n >= 1 ? 1 : n < .5
  ? Math.pow(2, 20 * n - 10) / 2
  : (2 - Math.pow(2, -20 * n + 10)) / 2;

/** Scroll adds only a field sample offset and first-fold lens exit. */
export function getHeroScrollState(offsetPx=0, heroHeightPx=1, reducedMotion=false) {
  const offset=Number.isFinite(Number(offsetPx))?Math.max(0,Number(offsetPx)):0;
  const height=Number.isFinite(Number(heroHeightPx))?Math.max(1,Number(heroHeightPx)):1;
  const normalized=offset/height, progress=clamp(normalized);
  const eased=progress*progress*(3-2*progress);
  return {
    progress,
    // Negative sample Y makes the visible field travel upward as content does.
    fieldY:reducedMotion || normalized===0?0:-.4*normalized,
    lensAlpha:1-eased,
    lensOffsetY:reducedMotion?0:1.8*eased,
    lensVisible:progress<1,
  };
}

/**
 * @param {HTMLCanvasElement} canvas Decorative, aria-hidden canvas.
 * @param {{intro?: boolean, forceFallback?: boolean, pixelRatio?: number, timeoutMs?: number, loadRuntime?: Function, getInitialScrollState?: Function}} options
 * @returns {Promise<{mode:string,reason:string,dispose:Function,reveal:Function,setVisible:Function,setScrollOffset:Function}>}
 * intro=true preserves reference 0.35s/4s/5s artwork opening timing. Call reveal()
 * to skip the opening for returning navigation. Reduced motion renders one still.
 */
export async function initHero(canvas, options = {}) {
  let mode = 'pending', reason = '', disposed = false, renderer, scene, camera;
  let composer, background, lens, cubeTarget, cubeCamera, grainPass;
  let raf = 0, redrawRaf = 0, resizeTimer = 0, observer, last = 0, visible = true;
  let scrollOffsetPx = 0, scrollHeroHeightPx = 1;
  let intro = options.intro !== false, elapsed = 0, reduced = false;
  let pixelRatio = 1, renderScene = null;
  let startupTimer = 0, startupFrame = 0, resolveStartupFrame = null;
  const timeoutMs = Math.max(1, Math.min(options.timeoutMs ?? 4000, 15000));
  let startupDeadline = 0;
  const cleanups = [];
  const owned = [];
  const win = typeof window === 'undefined' ? null : window;
  const doc = typeof document === 'undefined' ? null : document;
  const host = canvas?.closest?.('.hero') || canvas?.parentElement;
  const mouse = { x: 0, y: 0 }, cameraPosition = { x: 0, y: 0 };
  const controller = {
    get mode() { return mode; },
    get reason() { return reason; },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(startupTimer);
      cancelStartupFrame();
      stop();
      cleanups.splice(0).forEach(fn => fn());
      observer?.disconnect();
      release();
      if (canvas?.style) canvas.style.opacity = '0';
    },
    reveal() {
      intro = false;
      elapsed = 8;
      if (mode === 'webgl' && renderScene) {
        try { renderScene(0); } catch (error) { failOpen(error); }
      }
    },
    setScrollOffset(offsetPx, heroHeightPx) {
      if (disposed) return;
      const offset=Number.isFinite(Number(offsetPx))?Math.max(0,Number(offsetPx)):0;
      const height=Number.isFinite(Number(heroHeightPx))?Math.max(1,Number(heroHeightPx)):1;
      if (offset===scrollOffsetPx && height===scrollHeroHeightPx) return;
      scrollOffsetPx=offset;scrollHeroHeightPx=height;
      // Ambient animation already draws the newest state. Reduced-motion and
      // paused loops need at most one manual draw for the latest scroll input.
      requestScrollDraw();
    },
    setVisible(value) {
      visible = !!value;
      if (!visible) stop();
      else if (mode === 'webgl' && !disposed) resume();
    },
  };

  function listen(target, type, handler, opts) {
    target?.addEventListener?.(type, handler, opts);
    cleanups.push(() => target?.removeEventListener?.(type, handler, opts));
  }
  function emit(name, detail = {}) {
    if (canvas?.dispatchEvent && typeof CustomEvent === 'function') {
      canvas.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
    }
  }
  function requestScrollDraw() {
    if (disposed || mode!=='webgl' || !renderScene || !visible || doc?.hidden || redrawRaf) return;
    if (raf) return;
    redrawRaf=win.requestAnimationFrame(() => {
      redrawRaf=0;
      if (disposed || mode!=='webgl' || !visible || doc?.hidden) return;
      try { renderScene(0); } catch (error) { failOpen(error); }
    });
  }
  function stop() {
    if (raf && win) win.cancelAnimationFrame(raf);
    raf = 0;
    if (redrawRaf && win) win.cancelAnimationFrame(redrawRaf);
    redrawRaf = 0;
    if (resizeTimer && win) win.clearTimeout(resizeTimer);
    resizeTimer = 0;
  }
  function cancelStartupFrame() {
    if (startupFrame && win) win.cancelAnimationFrame(startupFrame);
    startupFrame = 0;
    resolveStartupFrame?.();
    resolveStartupFrame = null;
  }
  function release() {
    // Dispose each owned GPU resource once; no forceContextLoss on navigation.
    for (const item of owned.splice(0)) { try { item.dispose?.(); } catch { /* fail open */ } }
    try { composer?.renderTarget1?.dispose(); composer?.renderTarget2?.dispose(); } catch { /* fail open */ }
    try { composer?.copyPass?.material?.dispose(); } catch { /* fail open */ }
    try { renderer?.dispose(); } catch { /* fail open */ }
  }
  function failOpen(error) {
    if (disposed || mode === 'fallback') return controller;
    clearTimeout(startupTimer);
    cancelStartupFrame();
    mode = 'fallback';
    reason = typeof error === 'string' ? error : error?.message || 'WebGL unavailable';
    stop();
    observer?.disconnect();
    cleanups.splice(0).forEach(fn => fn());
    release();
    if (canvas?.style) { canvas.style.opacity = '0'; canvas.style.visibility = 'hidden'; }
    if (canvas?.dataset) canvas.dataset.heroState = 'fallback';
    if (host?.dataset) { host.dataset.renderMode = 'fallback'; host.dataset.heroState = 'fallback'; }
    emit('hero:fallback', { reason });
    return controller;
  }

  if (!canvas?.getContext || !win || !doc) return failOpen('Canvas unavailable');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.opacity = '0';
  canvas.style.visibility = 'hidden';
  canvas.style.pointerEvents = 'none';
  canvas.dataset.heroState = 'pending';
  if (host?.dataset) { host.dataset.renderMode = 'pending'; host.dataset.heroState = 'pending'; }
  if (options.forceFallback || new URLSearchParams(win.location.search).get('webgl') === '0') {
    return failOpen('Static artwork requested');
  }

  startupDeadline = performance.now() + timeoutMs;
  const timeout = new Promise(resolve => {
    startupTimer = setTimeout(() => {
      if (mode === 'pending') failOpen('WebGL initialization timed out');
      resolve(controller);
    }, timeoutMs);
  });
  // Runtime injection is optional and exists for deterministic non-browser tests.
  // Production always loads the local vendor and has no external dependency.
  const initialize = async () => {
  try {
    const T = await (options.loadRuntime ? options.loadRuntime() : import('./vendor/three-scene.js'));
    if (disposed || mode !== 'pending') return controller;
    if (performance.now() >= startupDeadline) return failOpen('WebGL initialization timed out');
    const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
    reduced = motion.matches;
    const size = () => ({
      width: Math.max(1, canvas.clientWidth || host?.clientWidth || win.innerWidth),
      height: Math.max(1, canvas.clientHeight || host?.clientHeight || win.innerHeight),
    });
    let { width, height } = size();
    pixelRatio = Math.min(options.pixelRatio || win.devicePixelRatio || 1, 2);
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(45, width / height, .1, 20);
    camera.position.set(0, 0, -4);
    camera.lookAt(scene.position);
    // Deliberately inside try: the reference's unchecked constructor could
    // deadlock its loader forever on environments without a usable context.
    renderer = new T.WebGLRenderer({ canvas, precision: 'highp', powerPreference: 'high-performance' });
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x100b0e);
    renderer.setSize(width, height, false);
    composer = new T.EffectComposer(renderer);
    composer.addPass(new T.RenderPass(scene, camera));
    grainPass = new T.ShaderPass({
      uniforms: { tDiffuse: { value: null }, amount: { value: 0 } },
      vertexShader: GRAIN_VERT, fragmentShader: GRAIN_FRAG,
    });
    grainPass.renderToScreen = true;
    composer.addPass(grainPass);
    owned.push(grainPass.material);

    const color = rgb => new T.Vector3(...rgb.map(c => c / 255));
    const bgUniforms = {
      uTime: { value: 0 },
      uScrollOffset: { value: 0 },
      uBaseFirstColor: { value: color([103, 28, 49]) },
      uBaseSecondColor: { value: color([225, 191, 158]) },
      uBaseThirdColor: { value: color([246, 236, 218]) },
      uAccentColor: { value: color([22, 11, 17]) },
      uZoom: { value: width < 1024 ? .1 : .2 },
      uBaseFrequency: { value: 2.6 }, uAccentOpacity: { value: 1 },
      uAccentFrequency: { value: 2.2 }, uNoiseIntensity: { value: 0 },
      uOpacityBackground: { value: 0 }, uBgProgress: { value: 0 },
      u_res: { value: new T.Vector2(width, height) },
    };
    const bgGeometry = new T.SphereGeometry(1, 32, 32);
    const bgMaterial = new T.ShaderMaterial({
      uniforms: bgUniforms, vertexShader: BACKGROUND_VERT, fragmentShader: BACKGROUND_FRAG,
      side: T.BackSide, transparent: true, defines: { PI: Math.PI, PR: pixelRatio.toFixed(1) },
    });
    owned.push(bgGeometry, bgMaterial);
    background = new T.Mesh(bgGeometry, bgMaterial);
    const fovY = camera.position.z * Math.tan(camera.fov * Math.PI / 360) * 2;
    background.scale.set(Math.abs(fovY * camera.aspect), Math.abs(fovY), fovY);
    background.lookAt(camera.position);
    scene.add(background);

    cubeTarget = new T.WebGLCubeRenderTarget(256, {
      format: T.RGBFormat, generateMipmaps: true,
      minFilter: T.LinearMipmapLinearFilter, encoding: T.sRGBEncoding,
    });
    owned.push(cubeTarget);
    cubeCamera = new T.CubeCamera(.1, 10, cubeTarget);
    const lensUniforms = {
      mRefractionRatio: { value: .016 }, mFresnelBias: { value: .016 },
      mFresnelPower: { value: 4.206 }, mFresnelScale: { value: 2.442 },
      uSphereAlpha: { value: 0 }, uRefractionPower: { value: 0 },
      tCube: { value: cubeTarget.texture },
    };
    const lensGeometry = new T.SphereGeometry(.4, 64, 64);
    const lensMaterial = new T.ShaderMaterial({
      uniforms: lensUniforms, vertexShader: LENS_VERT, fragmentShader: LENS_FRAG,
      transparent: true, side: T.FrontSide,
    });
    owned.push(lensGeometry, lensMaterial);
    lens = new T.Mesh(lensGeometry, lensMaterial);
    lens.scale.set(3, 3, 3);
    lens.position.set(-1.25, .75, -1.5);
    scene.add(lens);
    // Source cube-camera position remains at the original sphere position
    // while the show animation nudges the sphere X from -1.25 to -1.
    cubeCamera.position.copy(lens.position);

    const assertRender = () => {
      if (renderer.getContext().isContextLost()) throw new Error('WebGL context lost');
      if (renderer.info.programs?.some(program => program.diagnostics?.runnable === false)) {
        throw new Error('Hero shader could not compile');
      }
    };
    renderScene = delta => {
      const scrollState=getHeroScrollState(scrollOffsetPx,scrollHeroHeightPx,reduced);
      bgUniforms.uScrollOffset.value=scrollState.fieldY;
      const t = reduced || !intro ? 8 : elapsed;
      const pre = expoInOut(clamp((t - .35) / 2));
      const full = expoInOut(clamp((t - 4) / 2));
      const showLens = expoOut(clamp(t - 5));
      const expandLens = expoOut(clamp((t - 5) / 2));
      bgUniforms.uOpacityBackground.value = .8 * pre;
      bgUniforms.uBgProgress.value = .25 * pre + .75 * full;
      // Correct the reference's malformed speed tween and frame dependence.
      const speed = 100 - 70 * full;
      if (!reduced) bgUniforms.uTime.value += .00007 * speed * delta * 60;
      else bgUniforms.uTime.value = .72;
      lensUniforms.uSphereAlpha.value = showLens * scrollState.lensAlpha;
      lensUniforms.uRefractionPower.value = .75 * showLens * scrollState.lensAlpha;
      lens.scale.setScalar(3 + .5 * expandLens);
      lens.position.x = -1.25 + .25 * expandLens;
      lens.position.y = .75 + scrollState.lensOffsetY;
      const easing = 1 - Math.pow(.94, Math.max(1, delta * 60));
      cameraPosition.x += ((reduced ? 0 : mouse.x) - cameraPosition.x) * easing;
      cameraPosition.y += ((reduced ? 0 : mouse.y) - cameraPosition.y) * easing;
      camera.position.x = -cameraPosition.x * .6;
      camera.position.y = -cameraPosition.y * .3;
      camera.lookAt(scene.position);
      lens.visible = false;
      if (scrollState.lensVisible) cubeCamera.update(renderer, scene);
      lens.visible = scrollState.lensVisible;
      composer.render(delta);
      assertRender();
    };

    function frame(now) {
      raf = 0;
      if (disposed || mode !== 'webgl' || !visible || doc.hidden) return;
      const delta = Math.min((now - last) / 1000 || 1 / 60, .05);
      last = now;
      elapsed += delta;
      try { renderScene(delta); } catch (error) { failOpen(error); return; }
      if (!reduced) raf = win.requestAnimationFrame(frame);
    }
    function onResize() {
      if (disposed || mode !== 'webgl') return;
      ({ width, height } = size());
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      background.scale.x = Math.abs(fovY * camera.aspect);
      bgUniforms.u_res.value.set(width, height);
      bgUniforms.uZoom.value = width < 1024 ? .1 : .2;
      try { renderScene(0); } catch (error) { failOpen(error); }
    }
    // resume is assigned below once the closure's frame is ready.
    resume = () => {
      if (disposed || mode !== 'webgl' || !visible || doc.hidden || raf || redrawRaf) return;
      last = performance.now();
      raf = win.requestAnimationFrame(frame);
    };
    listen(win, 'pointermove', event => {
      if (reduced) return;
      mouse.x = event.clientX / win.innerWidth * 2 - 1;
      mouse.y = event.clientY / win.innerHeight * 2 - 1;
    }, { passive: true });
    listen(win, 'resize', () => {
      win.clearTimeout(resizeTimer);
      resizeTimer = win.setTimeout(onResize, 100);
    }, { passive: true });
    listen(doc, 'visibilitychange', () => doc.hidden ? stop() : resume());
    listen(motion, 'change', event => {
      reduced = event.matches;
      if (reduced) { stop(); try { renderScene(0); } catch (error) { failOpen(error); } }
      else resume();
    });
    listen(canvas, 'webglcontextlost', event => {
      event.preventDefault();
      failOpen('WebGL context lost');
    });
    // Do not restart repeatedly on context restoration; the useful CSS
    // alternative remains available without risking a reinitialization loop.
    if ('IntersectionObserver' in win && host) {
      observer = new win.IntersectionObserver(entries => {
        controller.setVisible(entries.some(entry => entry.isIntersecting));
      }, { rootMargin: '100px' });
      observer.observe(host);
    }

    last = performance.now();
    elapsed = reduced || !intro ? 8 : 0;
    // Wait for a real animation-frame opportunity, then compile and draw before
    // declaring readiness. A suspended RAF is covered by the same deadline.
    await new Promise(resolve => {
      resolveStartupFrame = resolve;
      startupFrame = win.requestAnimationFrame(() => {
        startupFrame = 0;
        resolveStartupFrame = null;
        resolve();
      });
    });
    if (disposed || mode !== 'pending') return controller;
    if (performance.now() >= startupDeadline) return failOpen('WebGL initialization timed out');
    // Read restored/native/smooth-scroll geometry at the last possible moment,
    // before any visible frame. Other routes omit this callback and stay at zero.
    const initialScroll=options.getInitialScrollState?.();
    if (initialScroll) controller.setScrollOffset(initialScroll.offsetPx,initialScroll.heroHeightPx);
    renderScene(1 / 60);
    // A synchronous driver call cannot be pre-empted by a timer. Check its
    // elapsed budget too, so a late draw never replaces an already chosen fallback.
    if (performance.now() >= startupDeadline) return failOpen('WebGL initialization timed out');
    clearTimeout(startupTimer);
    mode = 'webgl';
    canvas.dataset.heroState = 'ready';
    if (host?.dataset) { host.dataset.renderMode = 'webgl'; host.dataset.heroState = 'ready'; }
    canvas.style.transition = reduced ? 'none' : 'opacity 800ms ease';
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';
    emit('hero:ready', { revision: T.REVISION, reducedMotion: reduced });
    if (!reduced) resume();
    return controller;
  } catch (error) {
    return failOpen(error);
  }
  };
  return Promise.race([initialize(), timeout]);

  // Function declaration is hoisted so controller methods are always safe.
  function resume() { /* assigned after scene initialization */ }
}
