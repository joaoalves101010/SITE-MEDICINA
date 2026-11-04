import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderDocument,renderHome} from '../js/templates.js';
import {renderEcosystemSections,ATLAS_URL,LIBRARY_URL} from '../js/ecosystem-sections.js';
import {restoreEcosystemHTML,restoreEcosystemSource} from './ecosystem-normalize.mjs';
const baseline=JSON.parse(readFileSync(new URL('./ecosystem-baseline.json',import.meta.url),'utf8'));
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('new sections are the only changes to all twelve generated documents and template integration',()=>{
 assert.equal(restoreEcosystemSource('js/templates.js',read('js/templates.js')),baseline.templates);
 for(const row of baseline.routes)assert.equal(createHash('sha256').update(restoreEcosystemHTML(renderDocument({...row.route,build:'ecosystem-scope'}))).digest('hex'),row.sha256,JSON.stringify(row.route));
});
test('two accessible home-only sections have exact placement and safe real destinations',()=>{
 const home=renderHome();const ids=['the-med-times','the-med-atlas','the-med-library','medical-experiences'];
 for(let i=1;i<ids.length;i++)assert.ok(home.indexOf(`id="${ids[i-1]}"`)<home.indexOf(`id="${ids[i]}"`));
 for(const id of ids.slice(1,3))assert.equal(home.split(`id="${id}"`).length,2);
 const block=renderEcosystemSections();assert.equal((block.match(/<h2 /g)||[]).length,2);
 const links=[...block.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)];assert.equal(links.length,4);
 for(const [,url]of links)assert.ok([ATLAS_URL,LIBRARY_URL].includes(url));
 for(const [tag]of links){assert.match(tag,/target="_blank"/);assert.match(tag,/rel="noopener noreferrer"/);}
 for(const row of baseline.routes.filter(r=>r.route.page!=='home'))assert.doesNotMatch(renderDocument(row.route),/eco-section|ecosystem-sections.css/);
});
test('real imagery is local, lazy, dimensioned, labelled and light; availability copy is truthful',()=>{
 const block=renderEcosystemSections();assert.equal((block.match(/loading="lazy" decoding="async"/g)||[]).length,2);
 for(const p of ['atlas-study','library-acervo'])assert.ok(statSync(new URL('../assets/ecosystem/'+p+'.webp',import.meta.url)).size<100000);
 assert.match(block,/Prévia educacional/);assert.equal((block.match(/Ativação pelo Club em preparação/g)||[]).length,2);
 assert.match(block,/Texto completo e condições de acesso dependem de cada fonte/);assert.doesNotMatch(block,/acesso imediato|integração ativa|parceria|garantido/i);
});
test('no additional runtime; responsive normal-flow CSS, visible focus and reduced motion',()=>{
 const js=read('js/ecosystem-sections.js'),css=read('css/ecosystem-sections.css');
 assert.doesNotMatch(js,/fetch\(|addEventListener|localStorage|requestAnimationFrame|<canvas|<iframe|<button|<script/);
 assert.doesNotMatch(css,/position\s*:\s*(fixed|sticky)|scroll-snap|@keyframes|@import/);
 assert.match(css,/max-width:1023px/);assert.match(css,/max-width:479px/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/:focus-visible/);
 for(const[,selector]of css.replace(/\/\*[^]*?\*\//g,'').matchAll(/(?:^|[{}])\s*([^{}]+)\{/g)){if(selector.startsWith('@media'))continue;for(const part of selector.split(','))assert.match(part.trim(),/^\.eco-/);}
});
test('scope normalization cannot conceal changed copy, duplicated sections or neighboring mutations',()=>{
 const home=renderHome(),block=renderEcosystemSections();assert.equal(restoreEcosystemHTML(block+block),block+block);
 assert.notEqual(restoreEcosystemHTML(home.replace('Vá além da superfície.','mutated')),restoreEcosystemHTML(home));
 assert.notEqual(restoreEcosystemHTML(home.replace('id="medical-experiences"','id="mutated"')),restoreEcosystemHTML(home));
 assert.equal(restoreEcosystemSource('js/app.js','unchanged'),'unchanged');
});
