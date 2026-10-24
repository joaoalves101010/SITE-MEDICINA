import {restoreModuleRevisionHTML} from './trajectory-normalize.mjs';
import {renderFooterWordmark} from '../js/footer-wordmark.js';
import {restoreFooterWordmarkSource,restoreFooterWordmarkHTML} from './footer-wordmark-normalize.mjs';
import {renderWordmark,drawWordmark,WORDMARK_PATH,WORDMARK_COMMANDS,WORDMARK_VIEWBOX} from '../js/wordmark.js';
import {restoreWordmarkSource,restoreWordmarkHTML} from './wordmark-normalize.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderDocument,arrow} from '../js/templates.js';
import {projects,productUrl,siteUrl,directoryProfiles} from '../js/content.js';
import {renderProfileModal} from '../js/pages.js';
import {bookCover} from '../js/book-editorial.js';
import {restoreInternySource,restoreInternyHTML} from './interny-normalize.mjs';
import {restoreTheMedSource,restoreTheMedHTML} from './the-med-normalize.mjs';
const footerWordmark=JSON.parse(await readFile(new URL('./footer-wordmark-baseline.json',import.meta.url),'utf8'));
const currentWordmark=JSON.parse(await readFile(new URL('./wordmark-baseline.json',import.meta.url),'utf8'));
const currentBrand=JSON.parse(await readFile(new URL('./the-med-baseline.json',import.meta.url),'utf8'));
const baseline=JSON.parse(await readFile(new URL('./interny-baseline.json',import.meta.url),'utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const routes=[{page:'home'},{page:'community'},{page:'directory'},{page:'404'},...projects.map(p=>({page:'project',slug:p.slug}))];
test('all twelve routes expose the selected THE MED signature and accessible authored content',()=>{
 for(const route of routes){const html=renderDocument(route);assert.match(html,/<title>[^<]*the med \| Your Medical Journey<\/title>/);assert.match(html,/name="interny-build"/);assert.ok(!/\b(?:Innecta|INNECTA|Interny|INTERNY)\b/.test(html),route.slug||route.page);assert.doesNotMatch(html.replace(/<[^>]*>/g,' '),/\b(?:interny|innecta)\b/i);for(const attribute of html.matchAll(/(?:aria-label|alt|title)="([^"]*)"/g))assert.doesNotMatch(attribute[1],/\b(?:interny|innecta)\b/i);if(route.page!=='project'){const brand=html.match(/<a class="brand"[^]*?<\/a>/)?.[0];assert.ok(brand?.includes(renderWordmark()));assert.ok(brand?.includes('THE MED | Your Medical Journey — início'));assert.ok(!brand?.includes('>OS</text>'));assert.equal(brand.replace(/<[^>]*>/g,'').trim(),'');assert.match(html,/<span class="header-caption" lang="en">Your Medical<br>Journey<\/span>/);}}
 for(const p of directoryProfiles)assert.doesNotMatch(renderProfileModal(p),/\b(?:Innecta|INNECTA|Interny|INTERNY)\b/);
});
test('verified legacy destinations and original product media are not fabricated or renamed',()=>{
 assert.equal(productUrl,'https://innectaos.vercel.app/');assert.equal(siteUrl,'https://innecta.vercel.app/');
 const home=renderDocument({page:'home'}),community=renderDocument({page:'community'});
 assert.match(home,/https:\/\/innectaos\.vercel\.app\//);assert.match(community,/innecta-tour\.mp4/);
 assert.match(community,/preservadas com a identidade visual anterior do produto/);
 assert.doesNotMatch(home,/https:\/\/(?:interny|internyos)\.vercel\.app/);
});
test('only reviewed source branding literals change; all CSS, fonts, artwork masters and motion remain byte-equivalent',async()=>{
 for(const [path,expected] of Object.entries(baseline.protected)){const bytes=await readFile(new URL('../'+path,import.meta.url));assert.equal(sha(restoreInternySource(path,bytes)),expected,path);}
});
test('generated static book pages are locked to the new labels while original medical visuals remain preserved',async()=>{
 assert.equal(bookCover.eyebrow,'YOUR MEDICAL JOURNEY');assert.equal(bookCover.status,'THE MED / PRÉ-LANÇAMENTO');
 const source=await readFile(new URL('../js/book-art.js',import.meta.url),'utf8');assert.match(source,/drawWordmark\(ctx/);assert.doesNotMatch(source,/display\(ctx,family,'THE MED'/);
 for(const [path,expected] of Object.entries(currentWordmark.bookStaticCurrent))assert.equal(sha(restoreFooterWordmarkSource(path,await readFile(new URL('../'+path,import.meta.url)))),expected,path);
 const manifest=JSON.parse(await readFile(new URL('../assets/manifest.json',import.meta.url),'utf8'));
 for(const [path,expected] of Object.entries(currentWordmark.bookStaticCurrent)){const entry=manifest.files.find(f=>'assets/'+f.file===path);assert.ok(entry,path);assert.equal(entry.sha256,expected,path);}
});
test('historical normalization is explicit, reversible and does not conceal layout mutations',()=>{
 const html=renderDocument({page:'home'});const restored=restoreInternyHTML(html);assert.ok(restored.includes('<span>innecta</span>'));assert.ok(restored.includes('Um novo olhar<br>para a sua trajetória.'));
 const mutation=html.replace('class="hero"','class="hero unauthorized-layout"');assert.notEqual(restoreInternyHTML(mutation),restored);
 assert.equal(restoreInternySource('js/hero.js','Interny unrelated text'),'Interny unrelated text');
});

test('wordmark gains only the requested modest letter spacing on desktop and mobile',async()=>{
 const css=await readFile(new URL('../css/main.css',import.meta.url),'utf8');
 const oldRule='.brand{display:inline-flex;align-items:center;gap:.45vw;font-size:2.2vw;font-weight:550;letter-spacing:-.11em;line-height:.9}';
 const newRule=oldRule.replace('letter-spacing:-.11em','letter-spacing:-.07em');
 assert.equal(css.split(newRule).length-1,1);
 assert.equal(sha(css.replace(newRule,oldRule)),baseline.protected['css/main.css']);
 assert.match(css,/\.brand\{font-size:7\.2vw;gap:1\.5vw\}/);
});


test('THE MED changes only authored identity against the last approved spacing release',async()=>{
 for(const[path,expected]of Object.entries(currentBrand.protected)){const bytes=await readFile(new URL('../'+path,import.meta.url));assert.equal(sha(restoreTheMedSource(path,bytes)),expected,path);}
});
test('THE MED keeps natural word spacing, precise casing, technical IDs and semantic labels',()=>{
 const home=renderDocument({page:'home'});assert.ok(home.includes(renderWordmark()));assert.ok(home.includes(`${renderWordmark()}</span></a>`));assert.ok(home.includes('THE MED | Your Medical Journey'));assert.doesNotMatch(home,/THE&nbsp;MED|THE[–—_-]MED/);assert.match(home,/name="interny-build"/);
 assert.equal(restoreTheMedSource('js/hero.js','THE MED is not approved here'),'THE MED is not approved here');
 const old=restoreTheMedHTML(home);assert.ok(old.includes('<span>interny</span></a>'));const changed=home.replace('class="hero"','class="hero wrong-layout"');assert.notEqual(restoreTheMedHTML(changed),old);
});


test('approved option 02 is an inline font-independent vector with accessible plain-text naming',()=>{
 const svg=renderWordmark();assert.match(svg,/<svg\b/);assert.match(svg,/viewBox="0 0 281 60"/);assert.match(svg,/<path\b/);assert.doesNotMatch(svg,/<(?:text|image|rect|foreignObject)\b|font-family|\b(?:href|src)=/);
 for(const route of routes){const html=renderDocument(route);const expected=svg;assert.ok(html.includes(expected),route.slug||route.page);assert.equal((html.match(/class="wordmark-svg"/g)||[]).length,route.page==='home'?3:(route.page==='community'||route.slug==='trajetoria')?2:1,'one mark per approved signature placement, including the home product OS');assert.equal(html.split('<link rel="stylesheet" href="/css/wordmark.css">').length-1,1);assert.doesNotMatch(html,/<span class="sr-only">the med<\/span>/);assert.match(html,/<title>[^<]*the med \| Your Medical Journey<\/title>/);}
});
test('wordmark integration preserves all prior runtime, typography, visuals and interaction bytes',async()=>{
 for(const[path,expected]of Object.entries(currentWordmark.protected)){const bytes=await readFile(new URL('../'+path,import.meta.url));assert.equal(sha(restoreWordmarkSource(path,bytes)),expected,path);}
 const css=await readFile(new URL('../css/wordmark.css',import.meta.url),'utf8');assert.doesNotMatch(css,/font-family|letter-spacing|position:|transform:|background:|animation:|transition:/);assert.match(css,/\.brand-wordmark\{[^}]*width:3\.73em;[^}]*height:\.9em/);
 const html=renderDocument({page:'community'});assert.equal(restoreWordmarkHTML(html).includes('class="community-wordmark"'),false);assert.notEqual(restoreWordmarkHTML(html.replace('coletiva','mutated-copy')),restoreWordmarkHTML(html));
});


test('standalone SVG and book drawing use the same approved paths with no network, font guess or raster',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../assets/manifest.json',import.meta.url),'utf8'));assert.deepEqual(manifest.files.find(entry=>entry.file==='the-med-wordmark.svg'),currentWordmark.wordmarkEntry);const svg=await readFile(new URL('../assets/the-med-wordmark.svg',import.meta.url),'utf8');assert.ok(svg.includes(`d="${WORDMARK_PATH}"`));assert.doesNotMatch(svg,/<(?:text|image|rect|foreignObject)\b|font-family/);assert.match(svg,/aria-label="the med"/);
 const calls=[],ctx={save:()=>calls.push(['save']),restore:()=>calls.push(['restore']),translate:(...p)=>calls.push(['translate',...p]),scale:(...p)=>calls.push(['scale',...p]),beginPath:()=>calls.push(['begin']),moveTo:(...p)=>calls.push(['M',...p]),lineTo:(...p)=>calls.push(['L',...p]),bezierCurveTo:(...p)=>calls.push(['C',...p]),closePath:()=>calls.push(['Z']),fill:rule=>calls.push(['fill',rule])};
 const box=drawWordmark(ctx,{x:10,y:20,width:562,fill:'#f3eee6'});assert.deepEqual(box,{x:10,y:20,width:562,height:120});assert.deepEqual(calls.filter(c=>['M','L','C','Z'].includes(c[0])),WORDMARK_COMMANDS);assert.deepEqual(calls.find(c=>c[0]==='scale'),['scale',2,2]);assert.deepEqual(calls.find(c=>c[0]==='fill'),['fill','evenodd']);assert.equal(WORDMARK_VIEWBOX.width/WORDMARK_VIEWBOX.height,281/60);
 assert.equal(drawWordmark(ctx,{width:0}),null);assert.equal(drawWordmark(ctx,{width:Infinity}),null);for(const[path,expected]of Object.entries(currentWordmark.added))assert.equal(sha(restoreFooterWordmarkSource(path,await readFile(new URL('../'+path,import.meta.url)))),expected,path);
});


test('brand signatures contain no duplicate text nodes regardless of CSS availability',()=>{
 const textOf=html=>html.replace(/<[^>]*>/g,'').trim();const svgCount=html=>(html.match(/<svg\b/g)||[]).length;
 for(const route of routes){const html=renderDocument(route);if(route.page!=='project'){const brand=html.match(/<a class="brand"[^]*?<\/a>/)?.[0];assert.ok(brand);assert.equal(textOf(brand),'');assert.equal(svgCount(brand),1);assert.match(brand,/aria-label="THE MED \| Your Medical Journey — início"/);}
  if(route.page==='project'){const brand=restoreModuleRevisionHTML(html).match(/<p class="case-brand"[^]*?<\/p>/)?.[0];assert.ok(brand);assert.equal(textOf(brand),'');assert.equal(svgCount(brand),1);assert.match(brand,/role="img" aria-label="the med"/);assert.doesNotMatch(brand,/aria-hidden|sr-only/);}
  if(route.page==='community'){const heading=html.match(/<h1 class="community-identity"[^]*?<\/h1>/)?.[0];assert.ok(heading);assert.equal(textOf(heading),'coletiva');const brand=heading.match(/<span class="community-wordmark"[^]*?<\/span>/)?.[0];assert.ok(brand);assert.equal(textOf(brand),'');assert.equal(svgCount(brand),1);assert.match(brand,/role="img" aria-label="the med"/);assert.doesNotMatch(brand,/aria-hidden|sr-only/);}
 }
 const oldFailure='<a class="brand"><svg></svg><span class="sr-only">the med</span></a>';assert.notEqual(textOf(oldFailure),'','would reject the previous unstyled duplicate');
});


test('footer CTA contains exactly one approved vector mark, unchanged arrow and no duplicate brand text',()=>{
 for(const page of ['home','community']){const html=renderDocument({page}),contact=html.match(/<div class="contact">[^]*?<\/div>/)?.[0],link=contact?.match(/<a\b[^]*?<\/a>/)?.[0];assert.ok(link);assert.equal(link.replace(/<[^>]*>/g,'').trim(),'Conheça a');assert.equal(link.split(renderFooterWordmark()).length-1,1);assert.equal(link.split(arrow).length-1,1);assert.equal((link.match(/<svg\b/g)||[]).length,2);assert.match(link,/href="https:\/\/innectaos\.vercel\.app\/" target="_blank" rel="noopener" aria-label="Conheça a the med"/);assert.ok(link.includes(`d="${WORDMARK_PATH}"`));assert.doesNotMatch(link,/sr-only|<text\b|<image\b/);
  for(const id of ['footer-brand-gradient-wide','footer-brand-gradient-narrow'])assert.equal(html.split(`id="${id}"`).length-1,1);assert.equal(restoreFooterWordmarkHTML(link).includes('Conheça a THE MED '+arrow),true);}
 for(const route of routes.filter(r=>!['home','community'].includes(r.page)))assert.doesNotMatch(renderDocument(route),/footer-brand-gradient-/);
});
test('footer SVG continues the original three-stop gradient and retains a proportionate fit from320px',async()=>{
 const svg=renderFooterWordmark(),gradients=[...svg.matchAll(/<linearGradient id="([^"]+)"[^]*?x1="([^"]+)"[^]*?x2="([^"]+)"[^]*?<\/linearGradient>/g)];assert.equal(gradients.length,2);for(const g of gradients){assert.match(g[0],/gradientUnits="userSpaceOnUse"/);assert.ok(g[0].includes('<stop offset="0" stop-color="#6d2944"/>'));assert.ok(g[0].includes('<stop offset=".5" stop-color="#b16e78"/>'));assert.ok(g[0].includes('<stop offset="1" stop-color="#a56e3c"/>'));assert.ok(Math.abs(Number(g[2])+5.051*281/4.115)<1e-7);}
 const settings=[{font:2.08,gap:1.2,arrow:2.4},{font:6.93,gap:4,arrow:7}];for(let i=0;i<2;i++){const q=settings[i],expected=(4.115+(q.gap+q.arrow)/q.font)*281/4.115;assert.ok(Math.abs(Number(gradients[i][3])-expected)<1e-7);}
 for(const width of [320,390,500,768,1024,1180,1920]){const q=width<=1023?settings[1]:settings[0],used=((5.051+4.115)*q.font+q.gap+q.arrow)*width/100,available=(width<=1023?87.2:74.84)*width/100;assert.ok(used<available,`${width}: ${used} < ${available}`);}
 const css=await readFile(new URL('../css/wordmark.css',import.meta.url),'utf8');assert.match(css,/\.contact>a \.footer-wordmark\{[^}]*width:4\.115em;height:\.8786476868em/);assert.match(css,/fill:url\(#footer-brand-gradient-narrow\)/);assert.match(svg,/fill="url\(#footer-brand-gradient-wide\)"/);assert.doesNotMatch(svg,/<text\b|<image\b|<rect\b/);
});
test('footer identity update is restricted to its exact markup, local helper and scoped CSS',async()=>{
 for(const[path,expected]of Object.entries(footerWordmark.protected))assert.equal(sha(restoreFooterWordmarkSource(path,await readFile(new URL('../'+path,import.meta.url)))),expected,path);for(const[path,expected]of Object.entries(footerWordmark.added))assert.equal(sha(await readFile(new URL('../'+path,import.meta.url))),expected,path);
});


test('only document and Open Graph titles use the requested lowercase brand on all twelve routes',()=>{
 for(const route of routes){const html=renderDocument(route);const prefix=route.page==='project'?projects.find(p=>p.slug===route.slug).title+' — ':route.page==='community'?'Comunidade — ':route.page==='directory'?'Percursos — ':route.page==='404'?'Página não encontrada — ':'';const expected=prefix+'the med | Your Medical Journey';assert.equal(html.match(/<title>([^<]*)<\/title>/)?.[1],expected);assert.equal(html.match(/<meta property="og:title" content="([^"]*)">/)?.[1],expected);assert.match(html,/name="description"/);}
});
