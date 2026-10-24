import {restoreInternySource,restoreInternyHTML} from './interny-normalize.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderHome,renderDocument} from '../js/templates.js';
import {renderScienceSection} from '../js/science-content.js';
const motif=JSON.parse(await readFile(new URL('./brand-motif-baseline.json',import.meta.url)));
const hash=v=>createHash('sha256').update(v).digest('hex');
const baseline=JSON.parse(await readFile(new URL('./shared-seam-baseline.json',import.meta.url)));
test('approved phrase motion, interactive globe and scientific content are unchanged',async()=>{
  // Only the requested background scroll/lens-exit API may change hero.js.
  for(const [file,sha] of Object.entries(baseline.files).filter(([file])=>file!=='js/hero.js'))assert.equal(hash(restoreInternySource(file,await readFile(new URL('../'+file,import.meta.url)))),sha,file);
  assert.equal(hash(restoreInternyHTML(renderScienceSection()).replace(motif.scienceNew,motif.scienceOld)),baseline.scienceContentSHA256);
});
test('one shared canvas spans both sections; no second scene or join gradient remains',()=>{
  const html=renderHome();
  assert.equal((html.match(/class="hero-canvas"/g)||[]).length,1);
  assert.equal((html.match(/data-shared-scene/g)||[]).length,1);
  assert.equal((html.match(/data-shared-artwork/g)||[]).length,1);
  assert.ok(!html.includes('science-background-canvas'));assert.ok(!html.includes('hero-gradient'));
  assert.ok(html.includes('</section><section class="science-section"'));
  assert.ok(html.includes('</section></div><div class="container home-content">'));
  assert.ok(renderDocument({page:'home'}).includes('.shared-artwork .hero-fallback{opacity:1;visibility:visible}'));
});
test('shared viewport follows existing scroll before throttled effects and retains original intro',async()=>{
  const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
  assert.equal((app.match(/initHero\(canvas/g)||[]).length,1);
  assert.ok(app.includes('onScroll(y=window.scrollY){sharedScene.update()'));
  assert.ok(app.includes("const homeIntro=initHomeIntro({hero:$('#home')});"));
  assert.ok(!app.includes('initScienceBackground'));
  const css=await readFile(new URL('../css/science-globe.css',import.meta.url),'utf8');
  assert.match(css,/\.shared-artwork\{[^}]*height:100dvh/);
  assert.match(css,/\.home-world>#home\.hero,\.home-world>\.science-section\{[^}]*background:transparent/);
  assert.match(css,/\.home-world:after\{[^}]*bottom:-2px/);
  assert.ok(!css.includes('.science-background-shade'));
});

test('zero-offset shader reduces exactly to approved shader source; no colors or noise math change',async()=>{
  const shader=await readFile(new URL('../js/shaders/shaders.js',import.meta.url),'utf8');
  const original=shader
    .replace('// Reference procedural shaders; background adds a zero-default scroll sampling offset.','// Exact procedural shader strings extracted from the reference.')
    .replace('\\nuniform float uScrollOffset;','')
    .replace('\\n    uv.y += uScrollOffset;','');
  assert.equal(hash(original),'b6447ecb6cf09dfd29da438f46ba5a11f26ea57f67cbe993b57ccdcd04af85b8');
});

test('science exit fully covers canvas/grain before its clipped boundary without affecting content',async()=>{
  const css=await readFile(new URL('../css/science-globe.css',import.meta.url),'utf8');
  const fade=css.match(/\.home-world:after\{([^}]+)\}/)?.[1];
  assert.ok(fade);
  assert.ok(fade.includes('bottom:-2px'));
  assert.ok(fade.includes('height:calc(clamp(100px,18vw,340px) + 2px)'));
  assert.ok(fade.includes('rgba(22,14,18,0),#160e12 88%,#160e12 100%'));
  assert.ok(fade.includes('z-index:0'));assert.ok(fade.includes('pointer-events:none'));
  assert.match(css,/\.home-world\{[^}]*overflow:hidden;[^}]*background:#160e12/);
  // Even at the shortest mobile fade, >10 CSS pixels are opaque before the
  // boundary; fractional transforms and high-DPR sampling cannot expose grain.
  const minimumOpaqueBeforeClip=(100+2)*(1-.88)-2;
  assert.ok(minimumOpaqueBeforeClip>10);
  assert.match(css,/\.home-world>#home\.hero,\.home-world>\.science-section\{[^}]*z-index:1/);
});


test('capability words are the new third fold; old works links resolve without the removed grid',async()=>{
  const html=renderHome();
  assert.ok(!html.includes('<section id="works">'));
  assert.ok(!html.includes('UM ECOSSISTEMA. MUITOS CAMINHOS.'));
  assert.ok(!html.includes('class="project-grid"'));
  assert.ok(html.includes('</section></div><div class="container home-content"><section id="partners"><span id="works" class="legacy-anchor" aria-hidden="true"></span>'));
  assert.ok(html.includes('CONEXÕES QUE FAZEM SUA TRAJETÓRIA AVANÇAR'));
  assert.ok(html.indexOf('id="partners"')<html.indexOf('id="manifesto"'));
  const css=await readFile(new URL('../css/science-globe.css',import.meta.url),'utf8');
  assert.match(css,/\.home-content>#partners\{margin-top:0;padding-top:8vw\}/);
  assert.match(css,/\.home-content>#partners:before\{top:0;-webkit-mask-image:linear-gradient\(to bottom,transparent,#000 30%\);mask-image:linear-gradient\(to bottom,transparent,#000 30%\)\}/);
  assert.match(css,/#partners>#works\.legacy-anchor\{[^}]*position:absolute;display:block;[^}]*width:0;height:0;margin:0;padding:0/);
});
