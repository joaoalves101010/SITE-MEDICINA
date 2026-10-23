import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderDocument} from '../js/templates.js';
import {projects,productUrl,siteUrl,directoryProfiles} from '../js/content.js';
import {renderProfileModal} from '../js/pages.js';
import {bookCover} from '../js/book-editorial.js';
import {restoreInternySource,restoreInternyHTML} from './interny-normalize.mjs';
const baseline=JSON.parse(await readFile(new URL('./interny-baseline.json',import.meta.url),'utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const routes=[{page:'home'},{page:'community'},{page:'directory'},{page:'404'},...projects.map(p=>({page:'project',slug:p.slug}))];
test('all twelve routes expose the selected Interny signature and accessible authored content',()=>{
 for(const route of routes){const html=renderDocument(route);assert.match(html,/<title>[^<]*Interny \| Your Medical Journey<\/title>/);assert.match(html,/name="interny-build"/);assert.ok(!/\b(?:Innecta|INNECTA)\b/.test(html),route.slug||route.page);if(route.page!=='project'){const brand=html.match(/<a class="brand"[^]*?<\/a>/)?.[0];assert.ok(brand?.includes('<span>interny</span>'));assert.ok(brand?.includes('Interny | Your Medical Journey — início'));assert.ok(!brand?.includes('<svg'));assert.match(html,/<span class="header-caption" lang="en">Your Medical<br>Journey<\/span>/);}}
 for(const p of directoryProfiles)assert.doesNotMatch(renderProfileModal(p),/\b(?:Innecta|INNECTA)\b/);
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
 assert.equal(bookCover.eyebrow,'YOUR MEDICAL JOURNEY');assert.equal(bookCover.status,'INTERNY / PRÉ-LANÇAMENTO');
 const source=await readFile(new URL('../js/book-art.js',import.meta.url),'utf8');assert.match(source,/'INTERNY'/);assert.match(source,/`INTERNY \/ \$\{chapter.module/);
 for(const [path,expected] of Object.entries(baseline.bookStaticNew))assert.equal(sha(await readFile(new URL('../'+path,import.meta.url))),expected,path);
 const manifest=JSON.parse(await readFile(new URL('../assets/manifest.json',import.meta.url),'utf8'));
 for(const [path,expected] of Object.entries(baseline.bookStaticNew)){const entry=manifest.files.find(f=>'assets/'+f.file===path);assert.ok(entry,path);assert.equal(entry.sha256,expected,path);}
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
