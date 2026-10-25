import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderDocument} from '../js/templates.js';
import {projects} from '../js/content.js';
import {restoreTimesCoverSource,restoreTimesCoverHTML,COVER_SOURCE_INSERTION,COVER_HTML_INSERTION} from './times-cover-normalize.mjs';
const read=path=>readFile(new URL('../'+path,import.meta.url));
const hash=value=>createHash('sha256').update(value).digest('hex');
const baseline=JSON.parse(await read('tests/times-cover-baseline.json'));

test('approved static cover, paper markup, all existing CSS/assets/runtime/generator are byte-exact',async()=>{
 assert.equal(baseline.baseline,'b9a6aac26c5c8f3e8c4b0143311f99f886d6df71');
 assert.ok(Object.keys(baseline.protected).length===188);
 for(const[path,sha]of Object.entries(baseline.protected))assert.equal(hash(restoreTimesCoverSource(path,await read(path))),sha,path);
 assert.equal(hash(await read('assets/the-med-times-frontpage-004.svg')),'1b51d66ece0df3b69ddd78a84dfa7ef20bf77d6e8bfd4a770b0d9781093b3657');
});

test('module insertion is independent, deferred by module semantics, home-only and exactly reversible',async()=>{
 const source=String(await read('js/templates.js'));
 assert.equal(source.split(COVER_SOURCE_INSERTION).length,2);
 assert.equal(restoreTimesCoverSource('js/templates.js',source).includes('times-cover-live'),false);
 const home=renderDocument({page:'home'});
 assert.equal(home.split(COVER_HTML_INSERTION).length,2);
 assert.ok(home.indexOf(COVER_HTML_INSERTION)>home.indexOf('<script type="module" src="/js/app.js"></script>'));
 assert.equal(restoreTimesCoverHTML(COVER_HTML_INSERTION+COVER_HTML_INSERTION),COVER_HTML_INSERTION+COVER_HTML_INSERTION);
 assert.equal(restoreTimesCoverSource('js/templates.js',COVER_SOURCE_INSERTION+COVER_SOURCE_INSERTION),COVER_SOURCE_INSERTION+COVER_SOURCE_INSERTION);
 for(const route of [{page:'community'},{page:'directory'},{page:'404'},...projects.map(p=>({page:'project',slug:p.slug}))])assert.doesNotMatch(renderDocument(route),/times-cover-live/);
 assert.doesNotMatch(String(await read('js/app.js')),/times-cover-live/);
});

test('new optional runtime has no third-party/global app/scroll/animation or unsafe-HTML coupling',async()=>{
 const source=String(await read('js/times-cover-live.js'));
 assert.doesNotMatch(source,/\bimport\b|innerHTML|outerHTML|insertAdjacentHTML|eval\(|new Function|document\.write|requestAnimationFrame|\bWebGL\b|scrollTo\(|scrollBy\(|preventDefault\(|addEventListener\(['"](?:scroll|wheel|touchmove)['"]|localStorage|sessionStorage|sendBeacon|analytics|cookie/);
 assert.match(source,/credentials:'omit'/);assert.match(source,/redirect:'error'/);assert.match(source,/referrerPolicy:'no-referrer'/);
 assert.match(source,/rootMargin:'400px 0px'/);
 assert.match(source,/visibilitychange/);assert.match(source,/MAX_COVER_BYTES = 3 \* 1024 \* 1024/);
 assert.equal((source.match(/records\.put\(/g)||[]).length,1);assert.match(source,/records\.put\(writeRecord,'latest'\)/);
 assert.doesNotMatch(source,/https:\/\/(?!themedtimes\.vercel\.app)/);
});
