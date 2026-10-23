import {restoreBookHTML} from './book-normalize.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { renderDocument } from '../js/templates.js';
import { renderScienceSection, scienceReadings, scienceInstitutions } from '../js/science-content.js';
const tilesBaseline=JSON.parse(await readFile(new URL('./tiles-baseline.json',import.meta.url)));
const motif=JSON.parse(await readFile(new URL('./brand-motif-baseline.json',import.meta.url)));
const digest=value=>createHash('sha256').update(value).digest('hex');
const baseline=JSON.parse(await readFile(new URL('./science-baseline.json',import.meta.url)));
const removedWorks=await readFile(new URL('./removed-home-works.html',import.meta.url),'utf8');
const homeVisualBaseline=JSON.parse(await readFile(new URL('./home-principles-reel-baseline.json',import.meta.url),'utf8'));
test('approved home revisions leave original hero, protected text, later sections and other pages byte-equivalent',()=>{
  for(const route of baseline.rendered){
    let html=restoreBookHTML(renderDocument({...route,build:'scope-baseline'}));
    if(route.page==='home'){
      html=html.replace(/<section class="tiles tiles--rotated"[\s\S]*?<\/section>/,tilesBaseline.oldBlock).replace('<link rel="stylesheet" href="/css/tiles.css">','');
      html=html.replace(/ id="principle-(?:conectar|construir|acompanhar)"/g,'');
      // Normalize only the approved artwork replacement and homepage reel removal.
      html=html.replace(/<figure[^>]*data-principle-visual="(\d)"[^>]*>[\s\S]*?<\/figure>/g,(_,index)=>homeVisualBaseline.visuals[Number(index)]);
      html=html.replace('<div class="container"><section class="editorial-cta',homeVisualBaseline.reel+'<div class="container"><section class="editorial-cta');
      html=html.replace('<link rel="stylesheet" href="/css/principle-visuals.css">','');
      // Restore only the explicitly removed card block for the original scope hash.
      html=html.replace('<section id="partners"><span id="works" class="legacy-anchor" aria-hidden="true"></span>',removedWorks+'<section id="partners">');
      // Normalize only the approved shared-artwork reparenting, not hero copy/layout.
      html=html.replace(/<div class="home-world" data-shared-scene><div class="shared-artwork"[^>]*>(.*?)<\/div><section class="hero" id="home">/s,(_,artwork)=>`<section class="hero" id="home" data-render-mode="pending">${artwork}<div class="hero-gradient"></div>`);
      html=html.replace(renderScienceSection()+'</div>','').replace('<link rel="stylesheet" href="/css/science-globe.css">','').replace('<style>.shared-artwork .hero-fallback{opacity:1;visibility:visible}.home-world .shared-artwork{height:100%}</style>','');
    }
    // Normalize only the user-requested star-to-OS glyph replacement.
    html=html.replaceAll(motif.sharedNew,motif.sharedOld);
    assert.equal(digest(html),route.sha256,`${route.page}/${route.slug||''} outside approved scope`);
  }
});
test('phrase cycle, downstream typography and content are untouched by approved scroll-artwork changes',async()=>{
  // hero.js now intentionally accepts scroll input; its zero-scroll invariants
  // and shader continuity are covered by hero.test.mjs, not a stale whole-file hash.
  for(const [file,hash] of Object.entries(baseline.sources).filter(([file])=>file!=='js/hero.js'))assert.equal(digest(await readFile(new URL('../'+file,import.meta.url))),hash,file);
});
test('globe is the second section; no text or headline is inside sphere artwork',()=>{
  const html=renderDocument({page:'home'});
  assert.match(html,/<\/section><section class="science-section"/);
  assert.ok(html.indexOf('id="science"')<html.indexOf('id="works"'));
  const sphere=html.split('<div class="science-sphere"')[1].split('</div>')[0];
  assert.ok(sphere.includes('fallback.svg'));assert.ok(sphere.includes('data-globe-canvas'));
  assert.ok(!sphere.includes('<h2')&&!sphere.includes('<h3')&&!sphere.includes('science-institution'));
  assert.ok(html.includes('data-globe-toggle'));assert.ok(html.includes('aria-pressed="false"'));
});
test('four primary-source readings are dated; experimental result and independent references are explicit',()=>{
  const html=renderScienceSection();
  assert.equal(scienceReadings.length,4);assert.equal(scienceInstitutions.length,4);
  for(const item of scienceReadings){assert.ok(/^https:\/\/(doi\.org|www\.nature\.com|www\.who\.int)\//.test(item.href));assert.ok(html.includes(item.headline));assert.ok(html.includes(item.year));assert.ok(html.includes(item.href));}
  for(const item of scienceInstitutions){assert.ok(html.includes(item.name));assert.ok(html.includes(item.href));}
  assert.ok(html.includes('experimental'));assert.ok(html.includes('estudo inicial'));
  assert.ok(html.includes('Referências editoriais independentes.'));assert.ok(html.includes('Sem vínculo institucional com a Innecta.'));
  assert.equal((html.match(/rel="noopener noreferrer"/g)||[]).length,8);
  assert.ok(html.includes('perspectivas.<br> Conhecimento'));assert.ok(html.includes('<svg class="science-spark"'));assert.ok(!html.includes('✳'));
});
test('isolated home enhancement supports lifecycle, static mobile and reduced-motion presentation',async()=>{
  const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
  assert.ok(app.includes("if(scienceRoot)import('./science-globe.js')"));
  assert.ok(app.includes('scienceController?.setVisible(false)'));assert.ok(app.includes('scienceController?.setVisible(true)'));assert.ok(app.includes('scienceController?.dispose()'));
  const css=await readFile(new URL('../css/science-globe.css',import.meta.url),'utf8');
  assert.ok(css.includes('@media(max-width:1023px)'));assert.ok(css.includes('@media(max-width:480px)'));assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
  assert.ok(css.includes('.shared-artwork[data-render-mode="pending"]'));assert.ok(css.includes('.shared-artwork[data-render-mode="fallback"]'));assert.ok(css.includes('touch-action:pan-y'));assert.ok(css.includes('[data-globe-dragging="true"]'));
  assert.ok(renderScienceSection().includes('science-globe-hint'));assert.ok(!renderScienceSection().includes('science-background-canvas'));
  assert.equal((renderDocument({page:'home'}).match(/class="hero-canvas"/g)||[]).length,1);
  assert.ok(!app.includes("import('./science-background.js')"));assert.ok(app.includes('sharedScene.dispose()'));assert.ok(app.includes('sharedScene.setVisible(false)'));assert.ok(app.includes('onScroll(y=window.scrollY){sharedScene.update()'));
  for(const {page,slug} of baseline.rendered.filter(r=>r.page!=='home'))assert.ok(!renderDocument({page,slug}).includes('science-section'));
});
