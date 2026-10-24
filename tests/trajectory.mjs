import './portable-export.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderDocument} from '../js/templates.js';
import {projects} from '../js/content.js';
import {renderWordmark} from '../js/wordmark.js';
import {restoreModuleRevisionSource,restoreModuleRevisionHTML} from './trajectory-normalize.mjs';
const baseline=JSON.parse(await readFile(new URL('./trajectory-baseline.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');
const moduleRoutes=projects.map(p=>({page:'project',slug:p.slug}));

test('all eight module routes use at most four substantial sections without photos or next thumbnails',()=>{
 for(const route of moduleRoutes){const html=renderDocument(route);const sections=(html.match(/<section\b/g)||[]).length;assert.ok(sections>=1&&sections<=4,`${route.slug}: ${sections} sections`);assert.doesNotMatch(html,/<(?:img|image|video|iframe|canvas)\b/i);assert.doesNotMatch(html,/project--thumbnail|data-media-sequence|next-project-image/);assert.match(html,/<h1\b/);assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.ok(html.includes('https://innectaos.vercel.app/'));assert.doesNotMatch(html,/<footer\b[^>]*\bid="contact"/);assert.doesNotMatch(html,/aprovação garantida|vaga garantida|cura garantida|nossos parceiros/i);}
});
test('trajectory retains all seven real perspectives and progressive no-JS access',()=>{
 const html=renderDocument({page:'project',slug:'trajetoria'});for(const label of ['Visão','Currículo Studio','Instituições','Comparar','Residência','Internacional','Meu Caminho'])assert.ok(html.includes(label),label);for(const id of ['trajectory-vision','trajectory-curriculum','trajectory-possibilities','trajectory-next'])assert.ok(html.includes(`id="${id}"`),id);assert.equal((html.match(/data-trajectory-section/g)||[]).length,4);assert.match(html,/<details\b[^>]*data-trajectory-fallback/);assert.doesNotMatch(html,/data-enhanced="true"/);for(const target of ['data-stage-title','data-stage-copy','data-evidence-title','data-evidence-body','data-evidence-list','data-possibility-title','data-possibility-body','data-next-step-list'])assert.ok(html.includes(target),target);
});
test('seven sibling experiences provide four local folds, native controls and visible no-JS alternatives',()=>{
 for(const route of moduleRoutes.filter(r=>r.slug!=='trajetoria')){const html=renderDocument(route);assert.ok(html.includes(`data-module-experience="${route.slug}"`));assert.equal((html.match(/data-module-fold=/g)||[]).length,4);for(const suffix of ['intro','experimentar','contexto','continuar'])assert.ok(html.includes(`id="${route.slug}-${suffix}"`));assert.match(html,/<fieldset\b/);assert.match(html,/type="radio"/);assert.match(html,/data-module-choice=/);assert.match(html,/data-module-panel=/);assert.doesNotMatch(html,/aria-hidden="true"[^>]*data-module-panel|data-module-panel="[^"]+"[^>]*(?:hidden|inert)|class="[^"]*is-enhanced/);}
});
test('four nonmodule documents and all existing implementation files remain exact outside explicit exceptions',async()=>{
 for(const row of baseline.routes.filter(r=>r.route.page!=='project')){const html=renderDocument({...row.route,build:baseline.buildToken});assert.equal(hash(restoreModuleRevisionHTML(html)),row.sha256,row.route.page);}
 for(const[path,expected]of Object.entries(baseline.protected)){const bytes=await readFile(new URL('../'+path,import.meta.url));assert.equal(hash(restoreModuleRevisionSource(path,bytes)),expected,path);}
});
test('historical module normalization is limited to the approved eight routes and preserves build identifiers',()=>{
 for(const row of baseline.routes.filter(r=>r.route.page==='project')){const html=renderDocument({...row.route,build:baseline.buildToken});assert.equal(hash(restoreModuleRevisionHTML(html)),row.sha256,row.route.slug);}
 const home=renderDocument({page:'home',build:'brand-new-build'});assert.ok(restoreModuleRevisionHTML(home).includes('brand-new-build'));assert.notEqual(restoreModuleRevisionHTML(home.replace('class="hero"','class="hero unauthorized-change"')),restoreModuleRevisionHTML(home));assert.equal(restoreModuleRevisionSource('js/hero.js','unauthorized trajectory text'),'unauthorized trajectory text');
});


test('isolated route assets and accessible vector navigation do not leak into other pages',()=>{
 for(const route of moduleRoutes){const html=renderDocument(route),css=route.slug==='trajetoria'?'trajectory':'module-experiences',js=route.slug==='trajetoria'?'trajectory':'module-experiences-controller';assert.ok(html.includes(`<link rel="stylesheet" href="/css/${css}.css">`));assert.ok(html.includes(`<script type="module" src="/js/${js}.js"></script>`));assert.ok(html.indexOf(`/js/${js}.js`)<html.indexOf('/js/app.js'),'route enhancement precedes smooth-scroll initialization');assert.match(html,/<body data-page="module"/);assert.ok(html.includes(renderWordmark()));assert.match(html,/<a[^>]+href="\/"[^>]*aria-label="[^"]+"/);const brand=html.match(/<a class="(?:trajectory|module)-wordmark"[^]*?<\/a>/)?.[0];assert.ok(brand,'approved module home signature');assert.equal(brand.replace(/<[^>]*>/g,'').trim(),'','no duplicated visible brand text regardless of CSS');assert.equal((brand.match(/<svg\b/g)||[]).length,1);assert.match(brand,/aria-label="THE MED[^"]+"/);const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);for(const match of html.matchAll(/\baria-(?:controls|labelledby|describedby)="([^"]+)"/g))for(const id of match[1].split(/\s+/))assert.ok(ids.includes(id),`${route.slug}: ${id}`);}
 for(const row of baseline.routes.filter(r=>r.route.page!=='project')){const html=renderDocument(row.route);assert.doesNotMatch(html,/href="\/css\/(?:trajectory|module-experiences)\.css"|src="\/js\/(?:trajectory|module-experiences-controller)\.js"/);}
});
test('home greeting keeps its two original animated fragments while only the approved wordmark copy changes',async()=>{
 const html=renderDocument({page:'home'}),greeting=html.match(/<div class="intro-greeting"[^]*?<\/div>/)?.[0];assert.ok(greeting);assert.equal((greeting.match(/<span\b/g)||[]).length,2);assert.ok(greeting.includes('<span>Olá.</span>'));assert.ok(greeting.includes(`<span>Bem-vindo à <i class="intro-brand-mark">${renderWordmark()}</i></span>`));assert.match(greeting,/aria-hidden="true"/);const css=await readFile(new URL('../css/wordmark.css',import.meta.url),'utf8');assert.match(css,/\.intro-greeting \.intro-brand-mark\{display:inline-block;width:3\.73em;height:\.8em;vertical-align:-\.08em;font-style:normal\}/);
});

test('small inactive controls and editorial labels retain readable contrast on wine and cream',async()=>{
 const trajectory=await readFile(new URL('../css/trajectory.css',import.meta.url),'utf8');const modules=await readFile(new URL('../css/module-experiences.css',import.meta.url),'utf8');
 const rgb=hex=>hex.match(/\w\w/g).map(x=>parseInt(x,16));const luminance=rgb=>rgb.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
 const ratio=(foreground,background,alpha)=>{const fg=rgb(foreground),bg=rgb(background),a=luminance(fg.map((v,i)=>alpha*v+(1-alpha)*bg[i])),b=luminance(bg);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
 const opacity=(css,selector)=>{const block=css.split(selector+'{')[1]?.split('}')[0];assert.ok(block,selector);return Number(block.match(/(?:^|;)opacity:([.\d]+)/)?.[1]??1);};
 for(const selector of ['#trajectory .trajectory-tabs button','#trajectory .trajectory-overline','#trajectory .trajectory-editorial-note','#trajectory .trajectory-source-note','#trajectory .trajectory-priority-option small','#trajectory .trajectory-context-links>p'])assert.ok(ratio('501f30','f3ebdd',opacity(trajectory,selector))>=4.5,selector);
 assert.equal(opacity(trajectory,'#trajectory .trajectory-tabs-possibilities small'),1,'nested tab labels do not multiply opacity');
 for(const selector of ['#trajectory .trajectory-map-caption','#trajectory .trajectory-possibilities-footnote','#trajectory .trajectory-prelaunch-copy'])assert.ok(ratio('f3ebdd','501f30',opacity(trajectory,selector))>=4.5,selector);
 for(const selector of ['.module-experience .module-kicker>span','.module-experience .module-choice b','.module-experience .module-panel-copy li:before'])assert.ok(ratio('501f30','f3eee6',opacity(modules,selector))>=4.5,selector);
});
