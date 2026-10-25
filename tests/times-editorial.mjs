import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderDocument,renderHome} from '../js/templates.js';
import {PUBLIC_TIMES_URL} from '../js/times-config.js';
import {TIMES_SECTIONS,resolvePublicTimesURL,renderTimesEditorial} from '../js/times-editorial.js';
import {restoreTimesEditorialSource,restoreTimesEditorialHTML} from './times-editorial-normalize.mjs';
const baseline=JSON.parse(await readFile(new URL('./times-editorial-baseline.json',import.meta.url),'utf8'));
const replacements=JSON.parse(await readFile(new URL('./times-editorial-replacements.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');

test('all pre-existing runtime, visual assets and routes survive the exact bounded insertion',async()=>{
 assert.equal(baseline.baseline,'9ba4cf1528d1e40cdae1b3ba8dc0429d69e58255');
 assert.deepEqual(Object.keys(replacements.source),['js/templates.js']);
 for(const[path,expected]of Object.entries(baseline.protected))assert.equal(hash(restoreTimesEditorialSource(path,await readFile(new URL('../'+path,import.meta.url)))),expected,path);
 for(const {route,sha256}of baseline.routes)assert.equal(hash(restoreTimesEditorialHTML(renderDocument({...route,build:baseline.buildToken}))),sha256,route.slug||route.page);
});

test('preservation normalization cannot conceal adjacent changes, duplicate folds or unrelated mutations',()=>{
 const home=renderHome(),restored=restoreTimesEditorialHTML(home),block=renderTimesEditorial();
 assert.notEqual(restoreTimesEditorialHTML(home.replace('id="medical-experiences"','id="altered-experiences"')),restored);
 assert.equal(restoreTimesEditorialHTML(block+block),block+block);
 assert.equal(restoreTimesEditorialSource('js/hero.js','unapproved hero change'),'unapproved hero change');
 const patch=replacements.source['js/templates.js'][0];
 assert.equal(restoreTimesEditorialSource('js/templates.js',patch.new+patch.new),patch.new+patch.new);
});

test('one home-only newspaper follows capabilities and precedes the existing international experiences',()=>{
 const home=renderHome(),block=renderTimesEditorial();
 assert.equal(home.split(block).length-1,1);
 const ids=['science','product-os','partners','the-med-times','medical-experiences','manifesto'];
 for(let i=1;i<ids.length;i++)assert.ok(home.indexOf(`id="${ids[i-1]}"`)<home.indexOf(`id="${ids[i]}"`),`${ids[i-1]} before ${ids[i]}`);
 assert.ok(home.includes(block+'<section id="medical-experiences"'));
 assert.match(home,/href="https:\/\/themed-os\.vercel\.app\/"/);
 const document=renderDocument({page:'home'});assert.equal((document.match(/href="\/css\/times-editorial.css"/g)||[]).length,1);
 for(const{route}of baseline.routes.filter(row=>row.route.page!=='home'))assert.doesNotMatch(renderDocument(route),/times-editorial|the-med-times-masthead/);
});

test('pending configuration is truthful static text, not a dead button or a private link',()=>{
 assert.equal(renderTimesEditorial(),renderTimesEditorial({publicUrl:PUBLIC_TIMES_URL}));
 const block=renderTimesEditorial({publicUrl:''});
 assert.match(block,/data-times-availability="coming-soon"/);
 assert.match(block,/>Em breve<\/p>/);assert.match(block,/>Leitura disponível em breve<\/p>/);
 assert.doesNotMatch(block,/class="times-editorial-(?:button|paper-link)"|<button\b|\btabindex=|\baria-disabled=|\brole="button"/);
 assert.doesNotMatch(block,/Ler o jornal|chatgpt\.site/);
 assert.doesNotMatch(block,/class="times-editorial-(?:button|paper-link)"/);
 for(const publicUrl of [null,'','  '])assert.match(renderTimesEditorial({publicUrl}),/data-times-availability="coming-soon"/);
});

test('one configured HTTPS destination renders the real reading anchor with safe attributes and escaping',()=>{
 const publicUrl=' https://journal-public.vercel.app/leitura/?origem=themed&idioma=pt ';
 const block=renderTimesEditorial({publicUrl});
 assert.match(block,/data-times-availability="available"/);assert.equal((block.match(/<a class="times-editorial-button"/g)||[]).length,1);assert.equal((block.match(/<a class="times-editorial-paper-link"/g)||[]).length,1);
 assert.match(block,/href="https:\/\/journal-public\.vercel\.app\/leitura\/\?origem=themed&amp;idioma=pt"/);
 assert.match(block,/target="_blank" rel="noopener noreferrer" aria-describedby="times-editorial-access"/);
 assert.match(block,/>Ler o jornal<\/span>/);assert.match(block,/THE MED TIMES · abre em nova aba/);
 assert.doesNotMatch(block,/Em breve|Leitura disponível em breve/);
 const tricky=renderTimesEditorial({publicUrl:'https://journal-public.vercel.app/?q=" onclick="x&x=<tag>'});
 assert.doesNotMatch(tricky,/ onclick=|<tag>/);assert.match(tricky,/%22/);assert.match(tricky,/&amp;x=/);
});

test('unsafe, private, internal and malformed URL values fail closed without executing coercion',()=>{
 const invalid=[null,42,{},[],{toString(){throw Error('must not coerce');}},'', '#', '/jornal/', '//journal-public.vercel.app/', 'javascript:alert(1)','data:text/html,news','http://journal-public.vercel.app/','https://user:secret@journal-public.vercel.app/','https://journal-public.vercel.app:8443/','https://localhost/','https://foo.localhost/','https://portal.local/','https://portal.internal/','https://portal.test/','https://portal.invalid/','https://127.0.0.1/','https://10.0.0.1/','https://0x7f000001/','https://2130706433/','https://[::1]/','https://private-preview.chatgpt.site/','https://chatgpt.site/','https://chatgpt.com/','https://private-preview.chatgpt.site./','https://user@public.example/','https://journal-public.vercel.app/\nnext','https:\\journal-public.vercel.app/'];
 for(const value of invalid){assert.equal(resolvePublicTimesURL(value),null);assert.doesNotMatch(renderTimesEditorial({publicUrl:value}),/class="times-editorial-(?:button|paper-link)"/);}
 assert.equal(resolvePublicTimesURL('https://journal-public.vercel.app'),'https://journal-public.vercel.app/');
 assert.equal(resolvePublicTimesURL('https://JOURNAL-PUBLIC.vercel.app:443/'),'https://journal-public.vercel.app/');
});

test('official horizontal logo is preserved byte-for-byte with intrinsic size, lazy loading and accessible text',async()=>{
 assert.equal(hash(await readFile(new URL('../assets/the-med-times-masthead.svg',import.meta.url))),'f6d9bec3d6aad270324e4af2cf0f5794b9aa8c02b3e72f4ffe2a86662e3a1b38');
 const block=renderTimesEditorial();
 assert.match(block,/<section id="the-med-times" class="times-editorial" aria-labelledby="times-editorial-title">/);
 assert.match(block,/<h2 id="times-editorial-title">/);
 assert.match(block,/<img class="times-editorial-frontpage" src="\/assets\/the-med-times-frontpage-004.svg" width="1000" height="1480" alt="THE MED TIMES: capa completa da edição 004, de 25 de outubro de 2026[^"]*" loading="lazy" decoding="async">/);
 assert.equal((block.match(/<img\b/g)||[]).length,1);assert.doesNotMatch(block,/<h1\b|<canvas\b|<video\b|<iframe\b|<script\b/);
});

test('editorial copy is worldwide, Portuguese, sourced and evergreen with the six actual desks',()=>{
 const block=renderTimesEditorial().split('<div class="times-editorial-copy">')[1];
 assert.deepEqual(TIMES_SECTIONS,['Pesquisa','Clínica','Saúde pública','Formação','Inovação','Instituições']);
 assert.equal((block.match(/<li>/g)||[]).length,6);for(const name of TIMES_SECTIONS)assert.ok(block.includes(`<li>${name}</li>`));
 for(const copy of ['A medicina avança.','Sua visão também.','no mundo, em português e com as fontes à vista.','ampliar seu repertório','entender o contexto por trás das descobertas.'])assert.ok(block.includes(copy),copy);
 assert.doesNotMatch(block,/96|08:00|todos os dias|diariamente|edição de hoje|últimas notícias|notícias em tempo real|garantia|parceria oficial|vagas garantidas|aprovaç[ãa]o|<time\b|202\d|\d{2}\/\d{2}/i);
 assert.doesNotMatch(block,/próxima prova|emprego|checkout|pagamento|Asaas/i);
});

test('presentation remains scoped, native-flow, mobile-readable and reduced-motion safe without runtime dependencies',async()=>{
 const source=await readFile(new URL('../js/times-editorial.js',import.meta.url),'utf8'),css=await readFile(new URL('../css/times-editorial.css',import.meta.url),'utf8'),app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/addEventListener|requestAnimationFrame|fetch\(|getContext\(|localStorage|sessionStorage|scrollTo\(|setTimeout\(/);
 assert.doesNotMatch(app,/times-editorial|times-config/);
 assert.doesNotMatch(css,/position\s*:\s*(?:fixed|sticky)|scroll-snap|@keyframes|url\(|@import|animation\s*:|(?:^|[;{])\s*(?:order|grid-area|translate|transform)\s*:/);
 for(const[,selector]of css.replace(/\/\*[^]*?\*\//g,'').matchAll(/(?:^|[{}])\s*([^{}]+)\{/g)){if(selector.startsWith('@media'))continue;for(const part of selector.split(','))assert.match(part.trim(),/^\.times-editorial(?:[-:. >[]|$)/,part);}
 assert.match(css,/@media\(max-width:1023px\)/);assert.match(css,/grid-template-columns:1fr/);assert.match(css,/minmax\(0,1fr\)/);assert.match(css,/width:100%;height:auto/);
 assert.match(css,/:focus-visible/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/transition:none/);
 assert.ok(css.length<8500);assert.doesNotMatch(source,/import .* from (?!'\.\/(?:times-config|times-frontpage)\.js')/);
});
