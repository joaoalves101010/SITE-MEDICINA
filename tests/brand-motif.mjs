import {restoreInternySource,restoreInternyHTML} from './interny-normalize.mjs';
import {restoreBookTemplate} from './book-normalize.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderDocument} from '../js/templates.js';
import {projects} from '../js/content.js';
const tilesBaseline=JSON.parse(await readFile(new URL('./tiles-baseline.json',import.meta.url)));
const fixture=JSON.parse(await readFile(new URL('./brand-motif-baseline.json',import.meta.url)));
const hash=value=>createHash('sha256').update(value).digest('hex');

test('only the glyph changes in shared templates, science spark and favicon',async()=>{
  for(const [file,oldGlyph,newGlyph] of [
    ['js/templates.js',fixture.sharedOld,fixture.sharedNew],
    ['js/science-content.js',fixture.scienceOld,fixture.scienceNew],
    ['assets/favicon.svg',fixture.faviconOld,fixture.faviconNew],
  ]){
    let current=restoreInternySource(file,await readFile(new URL('../'+file,import.meta.url),'utf8'));
    if(file==='js/templates.js')current=restoreBookTemplate(current).replace(/<section class="tiles tiles--rotated"[\s\S]*?<\/section>/,tilesBaseline.oldSourceBlock).replace('<link rel="stylesheet" href="/css/tiles.css">','');
    assert.equal(current.split(newGlyph).length-1,1,file);
    assert.equal(hash(current.replace(newGlyph,oldGlyph)),fixture.sourceHashes[file],file);
    assert.ok(!current.includes(oldGlyph),file);
  }
});
test('all rendered brand motifs use literal uppercase OS, with no asterisk path remaining',()=>{
  const routes=[{page:'home'},{page:'community'},{page:'directory'},{page:'404'},...projects.map(p=>({page:'project',slug:p.slug}))];
  for(const route of routes){
    const html=renderDocument(route);
    assert.ok(!html.includes('M16 0v32M0 16h32'),route.page);
    if(route.page!=='project'){
      const brand=html.match(/<a class="brand"[\s\S]*?<\/a>/)?.[0];
      assert.ok(brand?.includes('<span>interny</span>'),route.page);
      assert.ok(!brand?.includes('>OS</text>'),route.page);
    }
  }
  const home=renderDocument({page:'home'});
  assert.equal((home.match(/>OS<\/text>/g)||[]).length,5);
  assert.ok(home.includes('class="science-spark"'));
});
test('glyph typography is bounded and neutral; favicon retains its original colored box',async()=>{
  for(const glyph of [fixture.sharedNew,fixture.scienceNew,fixture.faviconNew]){
    assert.ok(glyph.includes('letter-spacing="0"'));
    assert.ok(glyph.includes('text-anchor="middle"'));
    assert.ok(glyph.includes('dominant-baseline="central"'));
    assert.ok(glyph.includes('lengthAdjust="spacingAndGlyphs"'));
    assert.ok(glyph.includes('>OS</text>'));
    assert.ok(!glyph.includes('<rect'));
  }
  const icon=await readFile(new URL('../assets/favicon.svg',import.meta.url),'utf8');
  assert.ok(icon.includes('viewBox="0 0 64 64"'));
  assert.ok(icon.includes('<rect width="64" height="64" rx="16" fill="#743047"/>'));
});
