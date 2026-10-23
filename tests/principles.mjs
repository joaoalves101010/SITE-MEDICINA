import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderHome,renderDocument} from '../js/templates.js';
import {principles} from '../js/content.js';
import {renderPrincipleVisual} from '../js/principle-visuals.js';

test('three distinct editorial diagrams replace all decorative letter orbs',()=>{
  const home=renderHome();
  assert.equal((home.match(/data-principle-visual=/g)||[]).length,3);
  assert.equal((home.match(/class="principle reveal"/g)||[]).length,3);
  for(const name of ['conectar','construir','acompanhar'])assert.ok(home.includes(`id="principle-${name}"`));
  assert.ok(!home.includes('glass-orb'));assert.ok(!home.includes('principle-fallback'));
  for(const [i,p] of principles.entries()){
    const diagram=renderPrincipleVisual(i);
    assert.ok(diagram.includes(`data-principle-visual="${i}"`));
    assert.ok(diagram.includes('<svg'));assert.ok(diagram.includes('role="img"'));
    assert.ok(diagram.includes('<title'));
    assert.ok(!diagram.includes('<button')&&!diagram.includes('<video')&&!diagram.includes('<canvas'));
    assert.ok(home.includes(p.title));assert.ok(home.includes(p.body));
  }
  assert.equal(new Set(principles.map((_,i)=>renderPrincipleVisual(i))).size,3);
});
test('diagrams use real Innecta concepts and distinguish AI from human accompaniment',()=>{
  const diagrams=principles.map((_,i)=>renderPrincipleVisual(i));
  for(const word of ['Currículo','Objetivo','Oportunidades'])assert.ok(diagrams[0].includes(word));
  for(const word of ['Entender','Aplicar','Validar','Entregar'])assert.ok(diagrams[1].includes(word));
  assert.ok(diagrams[2].includes('Mentor IA'));assert.ok(diagrams[2].includes('Ultra'));
  assert.match(diagrams[2],/acompanhamento humano/i);
  for(const diagram of diagrams)assert.ok(!/https?:\/\//.test(diagram.replace('http://www.w3.org/2000/svg','')));
});
test('only the homepage reel is removed; shared internal media and player remain',()=>{
  const home=renderHome();
  assert.ok(!home.includes('<video'));assert.ok(!home.includes('product-reel'));
  assert.ok(!home.includes('reel-section'));assert.ok(!home.includes('reel-caption'));
  assert.ok(!home.includes('tour visual sem áudio'));
  assert.ok(home.includes('data-marquee'));assert.ok(home.includes('editorial-cta'));
  const community=renderDocument({page:'community'});
  assert.ok(community.includes('<video'));assert.ok(community.includes('innecta-tour.mp4'));
});
test('art styling is homepage-only and preserves readable reduced-motion fallback',async()=>{
  assert.ok(renderDocument({page:'home'}).includes('/css/principle-visuals.css'));
  for(const page of ['community','directory','404'])assert.ok(!renderDocument({page}).includes('/css/principle-visuals.css'));
  const css=await readFile(new URL('../css/principle-visuals.css',import.meta.url),'utf8');
  assert.ok(css.includes('prefers-reduced-motion:reduce')||css.includes('prefers-reduced-motion: reduce'));
  assert.ok(!css.includes('infinite'));
  assert.ok(!css.includes('url('));
});
