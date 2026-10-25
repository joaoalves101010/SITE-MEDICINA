import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {renderTimesEditorial} from '../js/times-editorial.js';
import {renderTimesFrontpage} from '../js/times-frontpage.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const hash=value=>createHash('sha256').update(value).digest('hex');
const baseline=JSON.parse(await read('tests/times-frontpage-baseline.json'));
const source=JSON.parse(await read('scripts/times-frontpage/edition-004.json'));
const proof=JSON.parse(await read('scripts/times-frontpage/layout-proof.json'));
const svg=await read('assets/the-med-times-frontpage-004.svg');

test('only the paper representation changes; approved right-side copy, desks, CTA and URL policy remain exact',async()=>{
 assert.equal(baseline.baseline,'c979ef77067dcabaa55f4a1754590a1e260f19aa');
 const before=baseline.originalSource['js/times-editorial.js'],after=await read('js/times-editorial.js');
 const oldPaper=before.match(/<figure class="times-editorial-paper">[^]*?<\/figure>/)[0];
 const restored=after.replace("import { renderTimesFrontpage } from './times-frontpage.js';\n",'').replace('/** Evergreen marketing copy with a separately dated sample cover; no live-feed claim. */','/** A timeless editorial introduction, not a live cover or a promise of daily output. */').replace('${renderTimesFrontpage(href)}',oldPaper);
 assert.equal(restored,before);
 for(const[path,digest]of Object.entries(baseline.protected))assert.equal(hash(await readFile(new URL('../'+path,import.meta.url))),digest,path);
 const withoutPaper=css=>css.replace(/\.times-editorial-(?:paper|masthead|frontpage|credits|photo-notice)[^{}]*\{[^{}]*\}/g,'').replace(/\s+/g,'');
 assert.equal(withoutPaper(await read('css/times-editorial.css')),withoutPaper(baseline.originalSource['css/times-editorial.css']));
});

test('frozen edition/date are visible and the complete cover has a full-reading accessible destination',()=>{
 const block=renderTimesFrontpage('https://themedtimes.vercel.app/');
 assert.match(block,/data-times-preview-edition="004" data-times-preview-date="2026-10-25"/);
 assert.match(block,/>Prévia da edição 004 · 25\/10\/2026<\/span>/);
 assert.match(block,/aria-label="Abrir o THE MED TIMES para leitura completa em nova aba\. Prévia da edição 004, de 25 de outubro de 2026\."/);
 assert.match(block,/class="times-editorial-paper-link" href="https:\/\/themedtimes\.vercel\.app\/" target="_blank" rel="noopener noreferrer"/);
 assert.match(block,/width="1000" height="1480"/);assert.match(block,/loading="lazy" decoding="async"/);assert.match(block,/<\/p><\/figcaption><\/figure>$/);
 assert.doesNotMatch(block,/edição de hoje|ao vivo|atualizada automaticamente|<iframe|<canvas|<video|<script/i);
 assert.doesNotMatch(renderTimesFrontpage(null),/class="times-editorial-paper-link"/);
 assert.match(renderTimesEditorial(),/>Ler o jornal<\/span>/);
});

test('actual edition articles provide every headline, deck and body block without invented or mutated news',()=>{
 assert.equal(source.editionId,'004');assert.equal(source.localDate,'2026-10-25');
 const articles=new Map(source.articles.map(a=>[a.id,a]));assert.equal(articles.size,9);
 const seen=new Set();let textWords=0;
 for(const block of proof.blocks){
  if(!block.tag)continue;
  const [id,type,index]=block.tag.split(':');const article=articles.get(id);assert.ok(article,id);seen.add(id);
  if(['title','teaser-title'].includes(type))assert.equal(block.text,article.title);
  else if(type==='deck')assert.equal(block.text,article.deck);
  else if(type==='source')assert.equal(block.text,article.sourceName);
  else if(type==='paragraph')assert.equal(block.text,article.paragraphs[Number(index)],id);
  else if(type==='implication')assert.equal(block.text,article.implication);
  textWords+=block.text.split(/\s+/).length;
 }
 assert.equal(seen.size,9);assert.ok(textWords>=700,textWords);
 assert.match(svg,/THE MED TIMES — edição 004 · 25\/10\/2026/);
 assert.doesNotMatch(proof.blocks.map(b=>b.text).join(" "),/New York Times|\bNYT\b|lorem ipsum|\bQA\b|prova estática|captura de navegador/i);
});

test('letterforms are outlined and self-contained, not dependent on browser fallback typography',()=>{
 assert.match(svg,/viewBox="0 0 1000 1480"/);assert.match(svg,/<rect width="1000" height="1480" fill="#fff"\/>/);
 assert.doesNotMatch(svg,/<text\b|<foreignObject\b|<script\b|@font-face|font-family=|https?:\/\/[^"\s]+\.(?:woff|ttf|otf)/i);
 const ids=new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 for(const[,id]of svg.matchAll(/xlink:href="#([^"]+)"/g))assert.ok(ids.has(id),id);
 assert.ok((svg.match(/<use\b/g)||[]).length>5000);
 assert.equal(hash(svg),proof.svgSha256);
 assert.ok(gzipSync(svg).length<450000,'efficient reusable glyphs + two embedded photos');
});

test('all recorded typesetting fits the portrait sheet and no body column crosses the bottom divider',()=>{
 assert.equal(proof.width,1000);assert.equal(proof.height,1480);
 for(const b of proof.blocks){assert.ok(b.x>=30&&b.x+b.width<=975,b.tag);assert.ok(b.y>=20&&b.y+b.height<1465,b.tag);}
 for(const b of proof.blocks.filter(b=>b.y>=1140&&b.tag))assert.ok(b.y+b.height<1440,b.tag);
 for(const b of proof.blocks.filter(b=>b.y<1091&&b.tag&&!b.tag.includes('teaser')))assert.ok(b.y+b.height<=1070,b.tag);
});

test('both real photographs retain whole frames and documented public-domain sources/credits',async()=>{
 assert.equal((svg.match(/<image\b/g)||[]).length,2);
 for(const image of svg.matchAll(/<image\b([^>]+)>?/g))assert.match(image[1],/preserveAspectRatio="xMidYMid meet"/);
 assert.doesNotMatch(svg,/<clipPath\b|clip-path=|filter=/);
 const credits=await read('assets/the-med-times-frontpage-004-credits.txt');
 assert.equal(source.photos.length,2);
 for(const photo of source.photos){assert.equal(photo.license,'Domínio público');assert.equal(photo.kind,'context-photograph');assert.equal(photo.cleared,true);assert.ok(credits.includes(photo.credit));assert.ok(credits.includes(photo.sourceUrl));assert.ok(credits.includes(photo.licenseUrl));}
 assert.match(credits,/Fonte gratuita: CDC\/PHIL/);assert.match(credits,/não implica endosso do CDC, HHS ou governo dos Estados Unidos/);
 const block=renderTimesFrontpage('https://themedtimes.vercel.app/');assert.match(block,/href="\/assets\/the-med-times-frontpage-004-credits.txt"/);assert.match(block,/>Créditos da prévia</);assert.match(block,/fonte gratuita CDC\/PHIL/);assert.match(block,/não implica endosso do CDC, HHS ou governo dos Estados Unidos ao THE MED TIMES/);
 assert.ok((await read('scripts/times-frontpage/fonts/FONT-LICENSE.txt')).length>1000);
});

test('paper is whole-page at 320/390 mobile and desktop widths with no crop or nested scrolling',async()=>{
 const css=await read('css/times-editorial.css'),front=css.match(/\.times-editorial-frontpage\{([^}]+)\}/)[1];
 assert.match(front,/width:100%;height:auto;aspect-ratio:1000\/1480;object-fit:contain/);
 assert.doesNotMatch(front,/object-fit:cover|overflow-y|overflow:auto|height:\d+(?:px|vh)|min-height:100vh/);
 assert.doesNotMatch(css,/overflow-y|overflow:auto/);
 for(const width of [320,390,1440]){const container=width*(width<=1023?.872:.7484);const paper=width<=1023?Math.min(container,560):(container-Math.max(42,Math.min(width*.058,108)))/2;assert.ok(paper>0&&paper<=container);assert.ok(paper*1.48<1000);}
 assert.match(css,/\.times-editorial-paper\{display:block;align-self:start/);assert.match(css,/\.times-editorial-paper-link:focus-visible/);
});


test('generator inputs are frozen and the new outlined body fonts are OFL 1.1, not Nimbus/AGPL',async()=>{
 const manifest=JSON.parse(await read('scripts/times-frontpage/SOURCE-MANIFEST.json'));
 for(const[path,digest]of Object.entries(manifest.copiedFiles))assert.equal(hash(await readFile(new URL('../scripts/times-frontpage/'+path,import.meta.url))),digest,path);
 assert.equal(manifest.fontLicense,'SIL Open Font License 1.1');
 assert.equal(Object.keys(manifest.fontMetadata).length,5);
 for(const[name,meta]of Object.entries(manifest.fontMetadata)){assert.match(name,/^Liberation(?:Serif|Sans)-/);assert.ok(meta.version.some(v=>v.includes('2.1.5')));assert.ok(meta.license.some(v=>v.includes('SIL Open Font License, Version 1.1')));}
 const license=await read('scripts/times-frontpage/fonts/FONT-LICENSE.txt');assert.match(license,/SIL OPEN FONT LICENSE Version 1.1/);assert.match(license,/any document created using the fonts or their derivatives/);
 assert.doesNotMatch(await read('scripts/times-frontpage/render.py'),/Nimbus|AGPL/);
});
