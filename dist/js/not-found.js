import { loadEarthTextures, EARTH_VERTEX, EARTH_FRAGMENT } from './not-found-earth.js';
/** THE MED 404: one local Three.js scene, native navigation, no scroll capture. */
export const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
export function renderBudget(width, dpr = 1) {
  return { dpr: Math.min(Math.max(1, dpr), width < 760 ? 1.35 : 1.7), segments: width < 760 ? 48 : 64 };
}
export function perspectivePose(index) {
  const poses = [[-.12, -.25, -.32], [.2, .7, .15], [-.2, 1.45, -.55]];
  return poses[((index % poses.length) + poses.length) % poses.length];
}

const vertexShader = `
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;
const fragmentShader = `
precision highp float;
varying vec3 vNormal;
varying vec3 vWorld;
uniform float uTime;
uniform float uKind;
uniform float uPhase;
vec3 environment(vec3 d) {
  float t = uTime * .075 + uPhase;
  float wave = sin(d.x * 3.4 + d.y * 2.2 + t) * .5 + .5;
  float fold = sin(d.z * 5.0 - d.y * 4.0 + t * .7) * .5 + .5;
  vec3 wine = vec3(.25, .075, .14);
  vec3 rose = vec3(.68, .38, .43);
  vec3 sand = vec3(.94, .77, .63);
  vec3 c = mix(wine, rose, smoothstep(.15, .9, wave));
  c = mix(c, sand, pow(fold, 3.0) * .8);
  float softbox = pow(max(0.0, dot(d, normalize(vec3(-.7, 1.0, 1.0)))), 20.0);
  float strip = exp(-pow((d.y + d.x * .45 - .45) * 15.0, 2.0)) * smoothstep(-.4, .5, d.z);
  c += vec3(.65, .49, .37) * softbox + vec3(.8, .68, .55) * strip * .75;
  return c;
}
void main() {
  vec3 n = normalize(vNormal);
  vec3 view = normalize(vWorld - cameraPosition);
  float facing = max(0.0, dot(-view, n));
  float fresnel = pow(1.0 - facing, 3.2);
  vec3 reflected = environment(reflect(view, n));
  vec3 refracted;
  refracted.r = environment(refract(view, n, .68)).r;
  refracted.g = environment(refract(view, n, .665)).g;
  refracted.b = environment(refract(view, n, .65)).b;
  float caustic = pow(.5 + .5 * sin(vWorld.x * 5.0 + vWorld.y * 3.0 + uTime * .18 + uPhase), 9.0);
  vec3 glass = mix(refracted * .63, reflected, .22 + fresnel * .78);
  glass += vec3(.67, .43, .34) * caustic * facing * .15;
  glass += vec3(.74, .59, .46) * pow(1.0 - facing, 14.0) * .6;
  vec3 metal = reflected * .8 + vec3(.21, .10, .11);
  gl_FragColor = vec4(mix(glass, metal, uKind), 1.0);
}`;

export async function initNotFound(root, { loadRuntime = () => import('./vendor/three-earth.js'), loadTextures = loadEarthTextures } = {}) {
  if (!root) return null;
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const art = root.querySelector('[data-not-found-art]');
  const canvas = root.querySelector('canvas');
  const pauseButton = root.querySelector('[data-toggle-motion]');
  const perspectiveButton = root.querySelector('[data-change-perspective]');
  const status = root.querySelector('[data-perspective-status]');
  const diagnostic = new URLSearchParams(win.location.search).get('404Diagnostic') === '1';
  const media = win.matchMedia('(prefers-reduced-motion: reduce)');
  const cleanups = [], resources = [];
  const textureAbort = new AbortController();
  let renderer, scene, camera, orb, ringA, ringB, satellite, satelliteB, material, metal;
  let raf = 0, last = 0, elapsed = 0, paused = false, disposed = false, inView = true;
  let initialized = false, failed = false, perspective = 0, pageHidden = false, watchdog;
  const pointer = { x: 0, y: 0 }, aim = { x: 0, y: 0 };
  const pose = { x: -.12, y: -.25, z: -.32 };
  const listen = (target, type, callback, options) => {
    target.addEventListener(type, callback, options);
    cleanups.push(() => target.removeEventListener(type, callback, options));
  };
  const motionAllowed = () => !paused && !media.matches && !doc.hidden && !pageHidden && inView && !disposed;
  const stop = () => { if (raf) win.cancelAnimationFrame(raf); raf = 0; last = 0; };
  const release = () => {
    resources.splice(0).forEach(resource => { try { resource.dispose(); } catch {} });
    try { renderer?.dispose(); } catch {}
  };
  const fallback = () => {
    if (failed || disposed) return;
    failed = true; initialized = false; textureAbort.abort(); win.clearTimeout(watchdog); stop(); release();
    art.dataset.renderMode = 'fallback'; perspectiveButton.hidden = true;
  };
  function render(dt = 0) {
    if (!initialized || failed || disposed) return;
    elapsed += dt;
    const blend = dt ? 1 - Math.exp(-dt * 4) : 1;
    const target = perspectivePose(perspective);
    pose.x += (target[0] - pose.x) * blend;
    pose.y += (target[1] - pose.y) * blend;
    pose.z += (target[2] - pose.z) * blend;
    pointer.x += (aim.x - pointer.x) * blend;
    pointer.y += (aim.y - pointer.y) * blend;
    scene.rotation.set(pose.x + pointer.y * .09, pose.y + pointer.x * .13, pose.z);
    orb.position.y = Math.sin(elapsed * .38) * .07;
    orb.rotation.y = elapsed * .035;
    ringA.rotation.y = .22 + Math.sin(elapsed * .17) * .16;
    ringB.rotation.z = -.6 + elapsed * .035;
    satellite.position.set(Math.cos(elapsed * .22) * 1.62, Math.sin(elapsed * .22) * .48, Math.sin(elapsed * .22) * .9);
    satelliteB.position.set(Math.cos(-elapsed * .17 + 2.4) * 1.95, Math.sin(-elapsed * .17 + 2.4) * .75, Math.sin(-elapsed * .17 + 2.4) * .9);
    material.uniforms.uTime.value = elapsed;
    material.uniforms.uPhase.value += ((perspective * .65) - material.uniforms.uPhase.value) * blend;
    metal.uniforms.uTime.value = elapsed;
    renderer.render(scene, camera);
    if (diagnostic) canvas.dataset.frames = String(Number(canvas.dataset.frames || 0) + 1);
  }
  function tick(now) {
    raf = 0;
    if (!motionAllowed() || !initialized || failed) return;
    const dt = last ? Math.min((now - last) / 1000, .04) : 0;
    last = now;
    try { render(dt); } catch { fallback(); return; }
    raf = win.requestAnimationFrame(tick);
  }
  function syncMotion() {
    root.dataset.motion = motionAllowed() ? 'running' : 'paused';
    pauseButton.setAttribute('aria-pressed', String(paused || media.matches));
    pauseButton.querySelector('[data-motion-label]').textContent = media.matches ? 'Movimento reduzido' : paused ? 'Retomar animações' : 'Pausar animações';
    pauseButton.disabled = media.matches;
    if (!motionAllowed()) stop();
    else if (initialized && !raf && !failed) raf = win.requestAnimationFrame(tick);
  }
  function resize() {
    if (!initialized || failed || disposed) return;
    const { width, height } = art.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setPixelRatio(renderBudget(width, win.devicePixelRatio).dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Fit the orbit horizontally on narrow screens without clipping the sphere.
    camera.position.z = camera.aspect < 1.15 ? 6.8 : 6.0;
    camera.updateProjectionMatrix();
    try { render(); } catch { fallback(); }
  }
  const controller = {
    get mode() { return art.dataset.renderMode; },
    dispose() {
      if (disposed) return;
      disposed = true; textureAbort.abort(); win.clearTimeout(watchdog); stop(); cleanups.splice(0).forEach(fn => fn()); release();
      root.dataset.motion = 'paused'; root.classList.remove('nf-enhanced');
    },
  };
  pauseButton.hidden = false;
  root.classList.add('nf-enhanced');
  syncMotion();
  listen(pauseButton, 'click', () => { paused = !paused; syncMotion(); });
  listen(media, 'change', () => { aim.x = aim.y = 0; syncMotion(); if (initialized) render(); });
  listen(doc, 'visibilitychange', syncMotion);
  listen(win, 'pagehide', event => { if (event.persisted) { pageHidden = true; syncMotion(); } else controller.dispose(); });
  listen(win, 'pageshow', () => { pageHidden = false; syncMotion(); });
  listen(art, 'pointermove', event => {
    if (!motionAllowed() || event.pointerType === 'touch') return;
    const rect = art.getBoundingClientRect();
    aim.x = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
    aim.y = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
  }, { passive: true });
  listen(art, 'pointerleave', () => { aim.x = aim.y = 0; });
  listen(perspectiveButton, 'click', () => {
    perspective = (perspective + 1) % 3;
    status.textContent = `Perspectiva ${perspective + 1} de 3. A navegação continua disponível.`;
    if (!motionAllowed()) render();
  });
  listen(canvas, 'webglcontextlost', event => { event.preventDefault(); fallback(); });
  if (win.IntersectionObserver) {
    const observer = new win.IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncMotion(); });
    observer.observe(art); cleanups.push(() => observer.disconnect());
  }
  if (new URLSearchParams(win.location.search).get('webgl') === '0') return controller;
  watchdog = win.setTimeout(fallback, 4500);
  try {
    const T = await loadRuntime();
    if (disposed || failed) return controller;
    renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x160e12, 0);
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(40, 1, .1, 30);
    const { segments } = renderBudget(art.clientWidth, win.devicePixelRatio);
    const sphereGeometry = new T.SphereGeometry(1, segments, Math.round(segments * .75));
    resources.push(sphereGeometry);
    const makeMaterial = kind => {
      const value = new T.ShaderMaterial({ vertexShader, fragmentShader, uniforms: { uTime: { value: 0 }, uKind: { value: kind }, uPhase: { value: 0 } } });
      resources.push(value); return value;
    };
    const textures = await loadTextures(T, {signal: textureAbort.signal});
    if (disposed || failed) { Object.values(textures).forEach(texture => texture.dispose()); return controller; }
    resources.push(...Object.values(textures));
    material = new T.ShaderMaterial({ vertexShader: EARTH_VERTEX, fragmentShader: EARTH_FRAGMENT,
      uniforms: {uDay:{value:textures.day},uClouds:{value:textures.clouds},uNight:{value:textures.night},uTime:{value:0},uPhase:{value:0}} });
    resources.push(material); metal = makeMaterial(1);
    orb = new T.Mesh(sphereGeometry, material); orb.scale.setScalar(1.12); scene.add(orb);
    const makeRing = (radius, thickness) => {
      // Reuse the locally available geometry class, mapping its UV grid to a torus.
      const geometry = new T.SphereGeometry(1, segments, 12);
      const position = geometry.attributes.position, uv = geometry.attributes.uv;
      for (let i = 0; i < position.count; i++) {
        const u = uv.getX(i) * Math.PI * 2, v = uv.getY(i) * Math.PI * 2;
        const r = radius + thickness * Math.cos(v);
        position.setXYZ(i, r * Math.cos(u), r * Math.sin(u), thickness * Math.sin(v));
      }
      // SphereGeometry omits pole triangles. A torus needs every quad, including the seam.
      const indices = [];
      for (let y = 0; y < 12; y++) for (let x = 0; x < segments; x++) {
        const a = y * (segments + 1) + x, b = a + segments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
      geometry.setIndex(indices);
      position.needsUpdate = true; geometry.computeVertexNormals(); geometry.computeBoundingSphere();
      resources.push(geometry); const mesh = new T.Mesh(geometry, metal); scene.add(mesh); return mesh;
    };
    ringA = makeRing(1.57, .013); ringA.rotation.set(1.03, .22, .08);
    ringB = makeRing(1.96, .0045); ringB.rotation.set(1.3, -.6, -.6);
    satellite = new T.Mesh(sphereGeometry, metal); satellite.scale.setScalar(.115); scene.add(satellite);
    satelliteB = new T.Mesh(sphereGeometry, metal); satelliteB.scale.setScalar(.045); scene.add(satelliteB);
    initialized = true;
    resize();
    if (failed) return controller;
    win.clearTimeout(watchdog);
    art.dataset.renderMode = 'webgl';
    perspectiveButton.hidden = false;
    if (win.ResizeObserver) { const observer = new win.ResizeObserver(resize); observer.observe(art); cleanups.push(() => observer.disconnect()); }
    else listen(win, 'resize', resize);
    syncMotion();
  } catch { fallback(); }
  return controller;
}

if (typeof document !== 'undefined') initNotFound(document.querySelector('[data-not-found]'));
