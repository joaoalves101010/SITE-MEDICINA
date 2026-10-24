import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {renderDocument,renderHome} from '../js/templates.js';
import {renderJourneyGuide,journeyIntents} from '../js/journey-guide.js';
import {restoreJourneyGuideSource,restoreJourneyGuideHTML} from './journey-guide-normalize.mjs';
const baseline=JSON.parse(await readFile(new URL('./journey-guide-baseline.json',import.meta.url),'utf8'));
const patches=JSON.parse(await readFile(new URL('./journey-guide-replacements.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');

test('home keeps the team anchor but no longer renders or loads any book presentation or engine',async()=>{
 const html=renderDocument({page:'home'}),home=renderHome(),app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
 assert.equal((home.match(/id="team"/g)||[]).length,1);assert.ok(home.includes('data-journey-guide'));assert.doesNotMatch(html,/data-book\b|book-canvas|\/assets\/book-pages\/|\/css\/book(?:-fallback)?\.css/);assert.ok(html.includes('/css/journey-guide.css'));
 assert.doesNotMatch(app,/bookController|bookRoot|import\([^)]*book-|from ['"][^'"]*book-/);assert.match(app,/import\('\.\/journey-guide-controller\.js'\)/);assert.match(app,/journeyGuide\?\.dispose\(\)/);assert.match(app,/setSmoothScrollImmediate\(scroll,target\)/);
 const visited=new Set();async function visit(url){const path=fileURLToPath(url);if(visited.has(path))return;visited.add(path);assert.doesNotMatch(path,/\/book(?:-[^/]+)?\.js$/,'active browser dependency cannot load archived book code');const source=await readFile(url,'utf8');for(const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*)['"](\.[^'"]+\.js)['"]/g))await visit(new URL(match[1],url));}await visit(new URL('../js/app.js',import.meta.url));

 const guide=renderJourneyGuide();assert.doesNotMatch(guide,/<(?:img|image|video|iframe|canvas)\b/i);assert.ok(home.indexOf('id="product-mosaic"')<home.indexOf('id="team"'));
});
test('three complete, locally meaningful paths remain readable before JavaScript and use existing module routes',()=>{
 const html=renderJourneyGuide();assert.deepEqual(journeyIntents.map(p=>p.id),['formacao','pesquisa','oportunidades']);assert.equal((html.match(/data-journey-panel=/g)||[]).length,3);assert.equal((html.match(/data-journey-tab=/g)||[]).length,3);assert.match(html,/<div[^>]*data-journey-tabs[^>]* hidden>/);assert.doesNotMatch(html,/role="tab(?:list|panel)?"/);
 for(const intent of journeyIntents){assert.ok(html.includes(intent.label));assert.ok(html.includes(intent.title));assert.equal(intent.actions.length,3);const panel=html.match(new RegExp(`<article[^>]*data-journey-panel="${intent.id}"[^>]*>`))?.[0];assert.ok(panel);assert.doesNotMatch(panel,/\shidden(?:[ >]|=)|aria-hidden|\sinert/);for(const link of intent.links){assert.match(link.href,/^\/modulos\/(?:hoje|trajetoria|pesquisa|explorar)\/$/);assert.ok(html.includes(`href="${link.href}"`));}}
 assert.match(html,/15 etapas em quatro movimentos/);for(const phase of['Entender','Aplicar','Validar','Entregar'])assert.ok(html.includes(phase));assert.match(html,/não é salva nem enviada/);
});
test('the guide is normal-flow DOM, not another pinned viewport, timeline, GPU or storage feature',async()=>{
 const controller=await readFile(new URL('../js/journey-guide-controller.js',import.meta.url),'utf8'),css=await readFile(new URL('../css/journey-guide.css',import.meta.url),'utf8');assert.doesNotMatch(controller,/requestAnimationFrame|setPointerCapture|getContext\(|fetch\(|localStorage|sessionStorage|scrollTo\(|addEventListener\(['"](?:scroll|wheel|touchmove)/);assert.doesNotMatch(css,/position\s*:\s*(?:fixed|sticky)|\b(?:min-)?height\s*:\s*100(?:d|s|l)?vh|scroll-snap/);assert.match(css,/#team\.journey-guide\{/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/grid-area:1\/1;visibility:hidden/);assert.match(css,/\.journey-guide-tabs\[hidden\]\{display:none\}/);
});
test('all prior runtime/artwork and eleven non-home documents remain exact outside the reviewed guide and touch-only integrations',async()=>{
 assert.equal(baseline.baseline,'aedc62e13595319184d66815657079482a38e19b');assert.deepEqual(Object.keys(patches.source),['js/app.js','js/templates.js','js/scroll-policy.js','js/medical-experiences-controller.js','css/medical-experiences.css','js/shared-scene.js','js/hero.js','css/science-globe.css']);
 for(const[path,expected]of Object.entries(baseline.protected)){const bytes=await readFile(new URL('../'+path,import.meta.url));assert.equal(hash(restoreJourneyGuideSource(path,bytes)),expected,path);}
 for(const row of baseline.routes){const html=renderDocument({...row.route,build:baseline.buildToken});assert.equal(hash(row.route.page==='home'?restoreJourneyGuideHTML(html):html),row.sha256,row.route.slug||row.route.page);}
});
test('restoring the archived home section cannot conceal changes outside team or duplicate integration blocks',()=>{
 const html=renderDocument({page:'home'}),restored=restoreJourneyGuideHTML(html);assert.ok(restored.includes(baseline.legacySection));assert.notEqual(restoreJourneyGuideHTML(html.replace('class="hero"','class="hero wrong"')),restored);assert.equal(restoreJourneyGuideSource('js/hero.js','unrelated mutation'),'unrelated mutation');const patch=patches.source['js/app.js'][0];assert.notEqual(restoreJourneyGuideSource('js/app.js',patch.new+patch.new),patch.old+patch.old);
});
