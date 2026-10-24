import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderDocument,renderHome} from '../js/templates.js';
import {renderProductOS} from '../js/product-os.js';
import {WORDMARK_PATH} from '../js/wordmark.js';
import {restoreProductOSSource,restoreProductOSHTML} from './product-os-normalize.mjs';
const baseline=JSON.parse(await readFile(new URL('./product-os-baseline.json',import.meta.url),'utf8'));
const patches=JSON.parse(await readFile(new URL('./product-os-replacements.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');

test('product introduction changes only the home insertion and template imports; all previous files and eleven routes remain exact',async()=>{
 assert.equal(baseline.baseline,'a4d70b7c4d13fce2ea31f6e705a53e28ded36927');
 assert.deepEqual(Object.keys(patches.source),['js/templates.js']);
 for(const[path,expected]of Object.entries(baseline.protected)){const bytes=await readFile(new URL('../'+path,import.meta.url));assert.equal(hash(restoreProductOSSource(path,bytes)),expected,path);}
 for(const row of baseline.routes){const html=renderDocument({...row.route,build:baseline.buildToken});assert.equal(hash(row.route.page==='home'?restoreProductOSHTML(html):html),row.sha256,row.route.slug||row.route.page);}
});

test('normalization cannot conceal adjacent-section edits, duplicate product folds or a changed unrelated runtime',()=>{
 const html=renderHome(),restored=restoreProductOSHTML(html);
 assert.notEqual(restoreProductOSHTML(html.replace('id="partners"','id="partners-mutated"')),restored);
 assert.equal(restoreProductOSSource('js/app.js','changed motion'),'changed motion');
 const patch=patches.source['js/templates.js'][0];assert.ok(patch);assert.notEqual(restoreProductOSSource('js/templates.js',patch.new+patch.new),patch.old+patch.old);
 const insertion=patches.html.find(row=>row.new.startsWith('<section'));assert.ok(insertion);assert.equal(insertion.old,'');assert.equal(restoreProductOSHTML(insertion.new+insertion.new),insertion.new+insertion.new);
});

test('the product fold follows the complete hero/science world and precedes the unchanged capability words',()=>{
 const home=renderHome(),block=renderProductOS();
 assert.equal(home.split(block).length-1,1);assert.equal((home.match(/id="product-os"/g)||[]).length,1);
 assert.ok(home.includes('</section></div><div class="container home-content">'+block+'<section id="partners">'));
 assert.ok(home.indexOf('id="science"')<home.indexOf('id="product-os"'));assert.ok(home.indexOf('id="product-os"')<home.indexOf('id="partners"'));
 const doc=renderDocument({page:'home'});assert.equal((doc.match(/href="\/css\/product-os.css"/g)||[]).length,1);
 for(const {route} of baseline.routes.filter(row=>row.route.page!=='home'))assert.doesNotMatch(renderDocument(route),/product-os/);
});

test('official vector plus OS, truthful three-step copy and real native links work without JavaScript',()=>{
 const block=renderProductOS();assert.match(block,/<section id="product-os" class="product-os" aria-labelledby="product-os-title">/);assert.match(block,/<h2 id="product-os-title">/);
 assert.ok(block.includes(WORDMARK_PATH));assert.match(block,/role="img" aria-label="the med OS"/);assert.match(block,/>OS<\/span>/);assert.ok(block.includes('EM PRÉ-LANÇAMENTO'));
 assert.doesNotMatch(block,/<(?:img|image|video|iframe|canvas|script|button)\b|\shidden(?:[ >]|=)|\sinert(?:[ >]|=)|onclick=|javascript:/i);
 const external=[...block.matchAll(/<a\b[^>]*href="(https?:[^"]+)"[^>]*>/g)];assert.equal(external.length,1);assert.equal(external[0][1],'https://themed-os.vercel.app/');assert.match(external[0][0],/target="_blank"/);assert.match(external[0][0],/rel="noopener noreferrer"/);assert.match(external[0][0],/aria-label="Conhecer o the med OS — abrir o produto em nova aba"/);
 assert.equal((block.match(/<li>/g)||[]).length,3);for(const phase of ['Planejar','Construir','Avançar'])assert.ok(block.includes(`<h3>${phase}</h3>`));
 const internal=[...block.matchAll(/href="(\/modulos\/[^\"]+)"/g)];assert.equal(internal.length,8);for(const[,href]of internal)assert.match(href,/^\/modulos\/(?:hoje|trajetoria|pesquisa|ligas|explorar|mentor)\/$/);
 assert.doesNotMatch(block,/garant(?:e|ia)|aprovad[oa] em|parceir[oa] oficial|checkout|pagamento|Asaas/i);
});

test('new presentation is scoped normal-flow DOM, keyboard-visible and reduced-motion safe with no runtime dependency',async()=>{
 const source=await readFile(new URL('../js/product-os.js',import.meta.url),'utf8'),css=await readFile(new URL('../css/product-os.css',import.meta.url),'utf8'),app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/addEventListener|requestAnimationFrame|fetch\(|getContext\(|localStorage|sessionStorage|scrollTo\(|setTimeout\(/);assert.doesNotMatch(app,/product-os/);
 assert.doesNotMatch(css,/position\s*:\s*(?:fixed|sticky)|scroll-snap|@keyframes|url\(|@import|animation\s*:/);
 for(const[,selector]of css.replace(/\/\*[^]*?\*\//g,'').matchAll(/(?:^|[{}])\s*([^{}]+)\{/g)){if(selector.startsWith('@media'))continue;for(const part of selector.split(','))assert.match(part.trim(),/^\.product-os(?:[-:. >[]|$)/,part);}
 assert.match(css,/:focus-visible/);assert.match(css,/@media\(max-width:1023px\)/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/transition:none/);assert.match(css,/grid-template-columns:minmax\(0,1\.15fr\) minmax\(0,\.85fr\)/);assert.match(css,/grid-template-columns:1fr/);
});


test('only the product-fold destination changes; its presentation and all other product links stay intact',async()=>{
 const source=await readFile(new URL('../js/product-os.js',import.meta.url),'utf8');
 const destination='https://themed-os.vercel.app/',previous='https://innectaos.vercel.app/';
 assert.equal(source.split(destination).length-1,1);
 assert.equal(hash(source.replace(destination,previous)),'7855c167f296945568a80dd0592849fbfaf1db4a7003096c51ab5334db7b9c08');
 const home=renderDocument({page:'home'}),outside=home.replace(renderProductOS(),'');
 assert.equal(home.split(destination).length-1,1);assert.ok(outside.includes(previous));assert.ok(!outside.includes(destination));
});
