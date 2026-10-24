import {restoreFooterClosingSymbolSource} from './footer-closing-symbol-normalize.mjs';
import {restoreFaviconSymbol09Source,restoreFaviconSymbol09HTML} from './favicon-symbol09-normalize.mjs';
import {restoreInternySource,restoreInternyHTML} from './interny-normalize.mjs';
import {restoreBookTemplate} from './book-normalize.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderDocument} from '../js/templates.js';
import {projects} from '../js/content.js';
const closingSymbol=JSON.parse(await readFile(new URL('./footer-closing-symbol-baseline.json',import.meta.url),'utf8'));
const symbol09=JSON.parse(await readFile(new URL('./favicon-symbol09-baseline.json',import.meta.url),'utf8'));
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
      assert.ok(brand?.includes('class="brand-wordmark"'),route.page);assert.equal(brand.replace(/<[^>]*>/g,'').trim(),'');
      assert.ok(!brand?.includes('>OS</text>'),route.page);
    }
  }
  const home=renderDocument({page:'home'});
  assert.equal((home.match(/>OS<\/text>/g)||[]).length,5);
  assert.ok(home.includes('class="science-spark"'));
});
test('historical glyph typography and original favicon are still exactly recoverable',async()=>{
  for(const glyph of [fixture.sharedNew,fixture.scienceNew,fixture.faviconNew]){
    assert.ok(glyph.includes('letter-spacing="0"'));
    assert.ok(glyph.includes('text-anchor="middle"'));
    assert.ok(glyph.includes('dominant-baseline="central"'));
    assert.ok(glyph.includes('lengthAdjust="spacingAndGlyphs"'));
    assert.ok(glyph.includes('>OS</text>'));
    assert.ok(!glyph.includes('<rect'));
  }
  const icon=restoreInternySource('assets/favicon.svg',await readFile(new URL('../assets/favicon.svg',import.meta.url),'utf8'));
  assert.ok(icon.includes('viewBox="0 0 64 64"'));
  assert.ok(icon.includes('<rect width="64" height="64" rx="16" fill="#743047"/>'));
});


test('favicon uses the exact approved option09 vector on a solid wine background',async()=>{
 const icon=await readFile(new URL('../assets/favicon.svg',import.meta.url),'utf8');assert.equal(hash(icon),symbol09.newIconSHA256);assert.match(icon,/viewBox="0 0 64 64"/);assert.equal((icon.match(/<rect\b/g)||[]).length,1);assert.match(icon,/<rect width="64" height="64" fill="#501F30"\/>/);assert.equal((icon.match(/<path\b/g)||[]).length,1);assert.match(icon,/<path fill="#FFFFFF" fill-rule="evenodd"/);const path=icon.match(/<path\b[^>]*\bd="([^"]+)"/)?.[1];assert.ok(path);assert.equal(hash(path),symbol09.approvedPathSHA256);assert.doesNotMatch(icon,/<(?:text|image|script|foreignObject|style)\b|font-family|>OS<|\b(?:href|src|opacity)=/);
 const manifest=JSON.parse(await readFile(new URL('../assets/manifest.json',import.meta.url),'utf8'));assert.deepEqual(manifest.files.find(entry=>entry.file==='favicon.svg'),symbol09.newEntry);assert.equal(symbol09.newEntry.bytes,Buffer.byteLength(icon));assert.equal(symbol09.newEntry.sha256,hash(icon));
});
test('favicon retains the approved aspect ratio and centered four-pixel vertical clearspace',async()=>{
 const icon=await readFile(new URL('../assets/favicon.svg',import.meta.url),'utf8'),transform=icon.match(/transform="translate\(([\d.]+) ([\d.]+)\) scale\(([\d.]+)\)"/);assert.ok(transform);const[,x,y,scale]=transform.map(Number);assert.ok(Math.abs(scale-50.4/236)<1e-9);assert.equal(y,6.8);assert.ok(Math.abs(x-(64-217*scale)/2)<1e-8);assert.ok(Math.abs(236*scale-50.4)<1e-8);assert.ok(Math.abs((64-x-217*scale)-x)<1e-8);assert.doesNotMatch(icon,/rotate|skew|matrix/);
});
test('all twelve favicon links bust only the icon cache while unrelated branding and motion remain exact',async()=>{
 const routes=[{page:'home'},{page:'community'},{page:'directory'},{page:'404'},...projects.map(p=>({page:'project',slug:p.slug}))];for(const route of routes){const html=renderDocument(route);assert.equal(html.split(`href="${symbol09.hrefAfter}"`).length-1,1);assert.ok(restoreFaviconSymbol09HTML(html).includes(`href="${symbol09.hrefBefore}"`));}
 for(const[path,expected]of Object.entries(symbol09.protected)){const current=await readFile(new URL('../'+path,import.meta.url));assert.equal(hash(restoreFaviconSymbol09Source(path,current)),expected,path);}
 const icon=await readFile(new URL('../assets/favicon.svg',import.meta.url),'utf8');assert.notEqual(restoreFaviconSymbol09Source('assets/favicon.svg',icon.replace('#FFFFFF','#000000')),symbol09.oldSVG,'an unapproved color change cannot hide behind normalization');
});


test('approved black option09 appears only once at the end of each shared footer',()=>{
 const routes=[{page:'home'},{page:'community'},{page:'directory'},{page:'404'},...projects.map(p=>({page:'project',slug:p.slug}))];for(const route of routes){const html=renderDocument(route),expected=['home','community'].includes(route.page)?1:0;assert.equal(html.split(closingSymbol.markup).length-1,expected);assert.equal((html.match(/class="footer-closing-symbol"/g)||[]).length,expected);if(expected){assert.ok(html.includes('</div>'+closingSymbol.markup+'<button class="back-top"'));assert.ok(html.indexOf(closingSymbol.markup)>html.indexOf('class="footer-note"'));}}
});
test('closing symbol uses the unchanged approved black vector, with no new background or font dependency',async()=>{
 const bytes=await readFile(new URL('../'+closingSymbol.asset,import.meta.url)),svg=bytes.toString();assert.equal(bytes.length,closingSymbol.approvedBytes);assert.equal(hash(bytes),closingSymbol.approvedSHA256);assert.match(svg,/viewBox="0 0 217 236"/);assert.equal((svg.match(/<path\b/g)||[]).length,1);assert.match(svg,/<path fill="#000000" fill-rule="evenodd"/);assert.equal(hash(svg.match(/<path\b[^>]*\bd="([^"]+)"/)[1]),closingSymbol.approvedPathSHA256);assert.doesNotMatch(svg,/<(?:rect|text|image|script|foreignObject)\b|font-family/);assert.match(closingSymbol.markup,/alt="Símbolo the med" width="217" height="236" loading="lazy" decoding="async"/);
 const manifest=JSON.parse(await readFile(new URL('../assets/manifest.json',import.meta.url),'utf8'));assert.deepEqual(manifest.files.find(entry=>entry.file==='the-med-symbol-09-preto.svg'),closingSymbol.manifestEntry);assert.equal(closingSymbol.manifestEntry.bytes,bytes.length);assert.equal(closingSymbol.manifestEntry.sha256,hash(bytes));
});
test('closing-symbol sizing is bounded and the rest of the footer, favicon and motion stay exact',async()=>{
 const css=await readFile(new URL('../css/wordmark.css',import.meta.url),'utf8');assert.match(css,/\.footer-closing-symbol\{width:clamp\(80px,8vw,130px\);margin:clamp\(48px,7vw,100px\) 0 0 12\.58vw\}/);assert.match(css,/\.footer-closing-symbol img\{display:block;width:100%;height:auto\}/);assert.match(css,/@media\(max-width:1023px\)\{\.footer-closing-symbol\{margin-left:6\.4vw\}\}/);
 for(const width of [320,390,768,1024,1180,1920]){const mark=Math.max(80,Math.min(width*.08,130)),gap=Math.max(48,Math.min(width*.07,100)),left=width*(width<=1023?.064:.1258);assert.ok(left+mark<width-left);assert.ok(Math.abs(left-(width-width*(width<=1023?.872:.7484))/2)<1e-8);assert.ok(mark>=80&&mark<=130);assert.ok(mark<width*.872);assert.ok(gap>=48&&gap<=100);}
 for(const[path,expected]of Object.entries(closingSymbol.protected)){const bytes=await readFile(new URL('../'+path,import.meta.url));assert.equal(hash(restoreFooterClosingSymbolSource(path,bytes)),expected,path);}
});
