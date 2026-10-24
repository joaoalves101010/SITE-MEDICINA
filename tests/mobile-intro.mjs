import {restoreJourneyGuideSource,restoreJourneyGuideHTML} from './journey-guide-normalize.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderDocument} from '../js/templates.js';
import {bookScrollState} from '../js/book-controller.js';
import {restoreMobileIntroSource,restoreMobileIntroHTML} from './mobile-intro-normalize.mjs';
const baseline=JSON.parse(await readFile(new URL('./mobile-intro-baseline.json',import.meta.url),'utf8'));
const patches=JSON.parse(await readFile(new URL('./mobile-intro-replacements.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');
const allowed=['js/app.js','js/book-controller.js','js/experience-engagement.js','js/medical-experiences-controller.js','js/templates.js','js/viscose-engine.js'];

test('native-touch and welcome changes preserve every existing asset, shader, artwork and unrelated runtime byte',async()=>{
 assert.equal(baseline.baseline,'be6cfa8c6033c9a12a7d956bfd90d7f8aa2fa9ad');assert.deepEqual(Object.keys(patches.source),allowed);
 for(const[path,expected]of Object.entries(baseline.protected)){const bytes=await readFile(new URL('../'+path,import.meta.url));assert.equal(hash(restoreMobileIntroSource(path,bytes)),expected,path);}
});
test('eleven other documents are exact; home changes only its reviewed first-paint head gate and local stylesheet',()=>{
 for(const row of baseline.routes){const html=renderDocument({...row.route,build:baseline.buildToken});if(row.route.page==='home'){assert.equal(hash(restoreMobileIntroHTML(html)),row.sha256);assert.equal((html.match(/data-home-intro-bootstrap/g)||[]).length,1);assert.ok(html.indexOf('data-home-intro-bootstrap')<html.indexOf('/css/main.css'));assert.ok(patches.html.every(p=>p.old===''&&html.indexOf(p.new)<html.indexOf('</head>')));assert.equal(restoreMobileIntroHTML(html).split('</head>')[1],restoreJourneyGuideHTML(html).split('</head>')[1],'body content and layout markup are untouched');}else{assert.equal(hash(html),row.sha256,row.route.slug||row.route.page);assert.doesNotMatch(html,/data-home-intro-bootstrap|\/css\/home-intro\.css/);}}
});
test('exact patch reversal cannot conceal unrelated mutations or duplicate the new integration',async()=>{
 const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8'),home=renderDocument({page:'home'});
 assert.notEqual(hash(restoreMobileIntroSource('js/app.js',app.replace("'native-touch'","'unexpected-engine'"))),baseline.protected['js/app.js']);
 assert.notEqual(restoreMobileIntroHTML(home.replace('class="hero"','class="hero unauthorized"')),restoreMobileIntroHTML(home));
 assert.equal(restoreMobileIntroSource('js/hero.js','native-touch unrelated mutation'),'native-touch unrelated mutation');
 const patch=patches.source['js/viscose-engine.js'][0];assert.notEqual(restoreMobileIntroSource('js/viscose-engine.js',patch.new+patch.new),patch.old+patch.old);
});
test('touch-first native scrolling and fresh home welcome are integrated before the asynchronous motion import',async()=>{
 const app=restoreJourneyGuideSource('js/app.js',await readFile(new URL('../js/app.js',import.meta.url),'utf8'));assert.match(app,/const nativeTouch=usesNativeTouchScroll\(window\)/);assert.match(app,/if\(!reduce\.matches&&!nativeTouch\)\{scroll=new motion\.LocomotiveScroll/);assert.match(app,/getScrollY:\(\)=>currentScrollY\(\)/);assert.match(app,/nativeTouch\?setNativeScrollImmediate\(window,target\):setBookScrollImmediate\(scroll,target\)/);assert.doesNotMatch(app,/innecta-intro-seen|sessionStorage|localStorage/);assert.ok(app.indexOf('const homeIntro=initHomeIntro')<app.indexOf("await import('./vendor/motion.js')"));assert.match(app,/homeIntro\.dispose\(\)/);assert.match(app,/nativeScrollLock\?\.dispose\(\)/);
 const book=await readFile(new URL('../js/book-controller.js',import.meta.url),'utf8');assert.match(book,/const stable=usesNativeTouchScroll\(win\)/);
});
test('book reading holds, reversible smoothstep pose and total travel keep the approved geometric formula',()=>{
 for(const height of[568,720,844,1080]){const start=bookScrollState(0,height),middle=bookScrollState(-height*.88*2.5,height),last=bookScrollState(-height*99,height);assert.equal(start.progress,0);assert.equal(start.travel,height*.88*6);assert.ok(Math.abs(middle.progress-2.5)<1e-12);assert.equal(last.progress,6);assert.equal(bookScrollState(height,height).progress,0);for(const fraction of[.01,.15])assert.equal(bookScrollState(-height*.88*(2+fraction),height).progress,2);assert.equal(bookScrollState(-height*.88*2.9,height).progress,3);}
});
