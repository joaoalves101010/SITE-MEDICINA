import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';
import {EARTH_ASSETS, EARTH_VERTEX, EARTH_FRAGMENT, loadEarthTextures} from '../js/not-found-earth.js';

test('Earth imagery is local, documented and kept within transfer budgets', () => {
  for (const asset of [...Object.values(EARTH_ASSETS), '/assets/earth/earth-poster-nasa.jpg']) {
    assert.match(asset, /^\/assets\/earth\/earth-[a-z]+-nasa\.jpg$/);
    const file = readFileSync(new URL('..' + asset, import.meta.url));
    assert.equal(file.readUInt16BE(0), 0xffd8);
    assert.ok(file.length < 800_000);
  }
  assert.ok(statSync(new URL('../assets/earth/SOURCES.md', import.meta.url)).size > 500);
  assert.match(EARTH_VERTEX, /vUv = uv/);
  assert.match(EARTH_FRAGMENT, /texture2D\(uDay, vUv\)/);
  assert.match(EARTH_FRAGMENT, /texture2D\(uNight, vUv\)/);
  assert.match(EARTH_FRAGMENT, /texture2D\(uClouds, cloudUv\)/);
});

test('all Earth textures load concurrently and remain owned by the controller', async () => {
  const requested = [], released = [];
  const textures = await loadEarthTextures({}, {loadTexture: async url => {
    requested.push(url); return {url, dispose: () => released.push(url)};
  }});
  assert.equal(requested.length, 3);
  assert.deepEqual(Object.keys(textures), ['day', 'clouds', 'night']);
  assert.equal(released.length, 0);
  assert.equal(textures.day.url, EARTH_ASSETS.day);
});

test('a failed map releases successful textures, including late resolutions', async () => {
  const released = [];
  let finish;
  const result = loadEarthTextures({}, {loadTexture: url => {
    if (url === EARTH_ASSETS.clouds) return Promise.reject(Error('offline'));
    if (url === EARTH_ASSETS.night) return new Promise(resolve => { finish = () => resolve({dispose: () => released.push('night')}); });
    return Promise.resolve({dispose: () => released.push('day')});
  }});
  finish();
  await assert.rejects(result, /Earth texture unavailable/);
  assert.deepEqual(released.sort(), ['day', 'night']);
});

test('deadline releases maps and disposes textures arriving after abandonment', async () => {
  let late; const released = [];
  const result = loadEarthTextures({}, {timeoutMs: 5, loadTexture: url => {
    if (url === EARTH_ASSETS.clouds) return new Promise(resolve => { late = () => resolve({dispose: () => released.push('late')}); });
    return Promise.resolve({dispose: () => released.push(url)});
  }});
  await assert.rejects(result, /Earth texture unavailable/);
  assert.equal(released.length, 2);
  late(); await Promise.resolve();
  assert.equal(released.length, 3);
});

test('abort cancels pending texture ownership and an already-aborted request starts no downloads', async () => {
  const controller = new AbortController(); let released = 0, late;
  const result = loadEarthTextures({}, {signal: controller.signal, loadTexture: url => {
    if (url === EARTH_ASSETS.clouds) return new Promise(resolve => { late = () => resolve({dispose: () => released++}); });
    return Promise.resolve({dispose: () => released++});
  }});
  await Promise.resolve(); controller.abort();
  await assert.rejects(result, /Earth texture unavailable/);
  assert.equal(released, 2);
  late(); await Promise.resolve(); assert.equal(released, 3);
  await assert.rejects(loadEarthTextures({}, {signal: controller.signal, loadTexture: () => assert.fail('unexpected download')}));
});
