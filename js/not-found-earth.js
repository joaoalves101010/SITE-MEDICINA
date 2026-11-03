/** NASA Blue Marble surface, cloud cover and Black Marble night lights.
 * Historical composite imagery, not live weather. Provenance: assets/earth/SOURCES.md.
 */
export const EARTH_ASSETS = {
  day: '/assets/earth/earth-day-nasa.jpg',
  clouds: '/assets/earth/earth-clouds-nasa.jpg',
  night: '/assets/earth/earth-night-nasa.jpg',
};

export function loadEarthTextures(T, {loadTexture, signal, timeoutMs = 4000} = {}) {
  const loader = loadTexture || (url => new Promise((resolve, reject) => new T.TextureLoader().load(url, resolve, undefined, reject)));
  return new Promise((resolve, reject) => {
    const textures = {};
    let finished = false;
    const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); };
    const fail = () => {
      if (finished) return;
      finished = true; cleanup();
      Object.values(textures).forEach(texture => texture.dispose());
      reject(Error('Earth texture unavailable'));
    };
    const abort = () => fail();
    const timer = setTimeout(fail, timeoutMs);
    signal?.addEventListener('abort', abort, {once: true});
    if (signal?.aborted) { fail(); return; }
    for (const [name, url] of Object.entries(EARTH_ASSETS)) {
      if (finished) break;
      try {
        Promise.resolve(loader(url)).then(texture => {
          if (finished) { texture.dispose(); return; }
          textures[name] = texture;
          if (Object.keys(textures).length === Object.keys(EARTH_ASSETS).length) {
            finished = true; cleanup(); resolve(textures);
          }
        }, fail);
      } catch { fail(); }
    }
  });
}

export const EARTH_VERTEX = `
varying vec3 vNormal;
varying vec3 vWorld;
varying vec2 vUv;
void main() {
  vUv = uv;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

export const EARTH_FRAGMENT = `
precision highp float;
varying vec3 vNormal;
varying vec3 vWorld;
varying vec2 vUv;
uniform sampler2D uDay;
uniform sampler2D uClouds;
uniform sampler2D uNight;
uniform float uTime;
uniform float uPhase;
void main() {
  vec3 normal = normalize(vNormal);
  vec3 light = normalize(vec3(-.6, .55, 1.0));
  vec3 view = normalize(cameraPosition - vWorld);
  float facing = max(dot(view, normal), 0.0);
  float sun = dot(normal, light);
  float daylight = smoothstep(-.10, .28, sun);
  vec3 surface = texture2D(uDay, vUv).rgb;
  vec3 night = texture2D(uNight, vUv).rgb;
  vec2 cloudUv = vec2(fract(vUv.x + uTime * .0012), vUv.y);
  float cloud = smoothstep(.12, .92, texture2D(uClouds, cloudUv).r);
  float shadow = smoothstep(.15, .95, texture2D(uClouds, cloudUv + vec2(.0025, -.001)).r);
  float diffuse = .12 + .88 * max(sun, 0.0);
  // Linear-space lighting keeps oceans deep and snow/cloud whites natural.
  vec3 ground = pow(surface, vec3(2.2)) * diffuse * (1.0 - shadow * .25);
  float ocean = smoothstep(.0, .09, surface.b - max(surface.r, surface.g));
  vec3 halfVector = normalize(light + view);
  float glint = pow(max(dot(normal, halfVector), 0.0), 55.0) * ocean * (1.0 - cloud);
  ground += vec3(.38, .46, .52) * glint * max(sun, 0.0);
  ground = mix(ground, vec3(.85, .91, 1.0) * diffuse, cloud * .87);
  ground = mix(pow(night, vec3(2.2)) * .75 + ground * .07, ground, daylight);
  float atmosphere = pow(1.0 - facing, 3.8) * (.2 + daylight * .8);
  ground += vec3(.07, .21, .46) * atmosphere * .8;
  gl_FragColor = vec4(pow(max(ground, vec3(0.0)), vec3(1.0 / 2.2)), 1.0);
}`;
