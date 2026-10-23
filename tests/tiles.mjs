import {restoreBookTemplate,restoreBookApp} from './book-normalize.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderDocument,renderHome} from '../js/templates.js';
const hash=v=>createHash('sha256').update(v).digest('hex');
const baseline=JSON.parse(await readFile(new URL('./tiles-baseline.json',import.meta.url)));
const assets=JSON.parse(await readFile(new URL('../assets/tiles/manifest.json',import.meta.url)));
const tiles=renderHome().match(/<section class="tiles tiles--rotated"[\s\S]*?<\/section>/)[0];
test('all eight originals retain their full 2880×1800 pixels and exact source bytes',async()=>{
  assert.equal(assets.length,8);
  for(const asset of assets){
    const bytes=await readFile(new URL('../'+asset.file,import.meta.url));
    assert.equal(hash(bytes),asset.sha256,asset.slug);
    assert.equal(bytes.readUInt32BE(16),2880);assert.equal(bytes.readUInt32BE(20),1800);
    assert.equal(bytes.length,asset.bytes);
    assert.ok(tiles.includes('/'+asset.file),asset.slug);
  }
});
test('same four rows and twelve lazily decoded images now use complete originals',()=>{
  assert.ok(tiles.includes('id="product-mosaic"'));
  assert.equal((tiles.match(/data-tile-row=/g)||[]).length,4);
  assert.equal((tiles.match(/<img /g)||[]).length,12);
  assert.equal((tiles.match(/loading="lazy" decoding="async" width="2880" height="1800"/g)||[]).length,12);
  assert.ok(!tiles.includes('-detail'));assert.ok(!tiles.includes('.webp'));
});
test('only collage markup and home stylesheet inclusion change; row motion stays byte-identical',async()=>{
  const source=await readFile(new URL('../js/templates.js',import.meta.url),'utf8');
  const restored=restoreBookTemplate(source).replace(/<section class="tiles tiles--rotated"[\s\S]*?<\/section>/,baseline.oldSourceBlock).replace('<link rel="stylesheet" href="/css/tiles.css">','');
  assert.equal(hash(restored),baseline.templatesSha256);
  assert.equal(hash(restoreBookApp(await readFile(new URL('../js/app.js',import.meta.url),'utf8'))),baseline.appSha256);
  for(const page of ['community','directory','404','project'])assert.ok(!renderDocument({page,slug:'trajetoria'}).includes('/css/tiles.css'));
});
test('smaller full-aspect frames contain screenshots without crop or magnification',async()=>{
  const css=await readFile(new URL('../css/tiles.css',import.meta.url),'utf8');
  assert.ok(css.includes('rotate(45deg)'));assert.ok(css.includes('width:34vw'));assert.ok(css.includes('width:52vw'));
  assert.ok(css.includes('aspect-ratio:8/5'));assert.ok(css.includes('object-fit:contain'));assert.ok(css.includes('transform:none'));
  assert.ok(!css.includes('object-fit:cover'));assert.ok(!css.includes('scale('));
  assert.ok(!css.includes('animation:'));assert.ok(!css.includes('transition:'));
});
