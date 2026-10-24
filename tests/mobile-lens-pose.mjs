import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderDocument,renderHome} from '../js/templates.js';
import {restoreMobileLensPoseSource} from './mobile-lens-pose-normalize.mjs';
const baseline=JSON.parse(await readFile(new URL('./mobile-lens-pose-baseline.json',import.meta.url),'utf8'));
const patches=JSON.parse(await readFile(new URL('./mobile-lens-pose-replacements.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');

test('the lens-pose change touches only three reviewed runtime files; every document and all styles/artwork remain exact',async()=>{
 assert.equal(baseline.baseline,'8df13f8db09501e2dbede144f361265f994c33df');
 assert.deepEqual(Object.keys(patches.source),['js/app.js','js/hero.js','js/shared-scene.js']);
 for(const[path,expected]of Object.entries(baseline.protected)){const bytes=await readFile(new URL('../'+path,import.meta.url));assert.equal(hash(restoreMobileLensPoseSource(path,bytes)),expected,path);}
 for(const row of baseline.routes)assert.equal(hash(renderDocument({...row.route,build:baseline.buildToken})),row.sha256,row.route.slug||row.route.page);
});

test('mobile home fixes placement and pointer drift without substituting the actual procedural lens',async()=>{
 const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8'),hero=await readFile(new URL('../js/hero.js',import.meta.url),'utf8'),shared=await readFile(new URL('../js/shared-scene.js',import.meta.url),'utf8');
 assert.match(app,/fixedLensPose:nativeTouch&&document\.body\.dataset\.page==='home'/);
 assert.match(hero,/lens\.position\.y = \.75 \+ \(options\.fixedLensPose\?0:scrollState\.lensOffsetY\);/);
 assert.match(hero,/if \(reduced \|\| options\.fixedLensPose\) return;/);
 assert.match(shared,/const lensY=motion\?\.matches\|\|options\.nativeTouch\?0:-offset\*\.9;/);
 assert.doesNotMatch(app+hero,/decorativeLens|pointerMotion|mobile-hero-lens|data-hero-lens/);
 assert.doesNotMatch(renderHome(),/mobile-hero-lens|data-hero-lens/);
 // Keep the existing refraction/alpha, internal procedural time and cube render path exactly.
 for(const literal of ['lensUniforms.uSphereAlpha.value = showLens * scrollState.lensAlpha;','lensUniforms.uRefractionPower.value = .75 * showLens * scrollState.lensAlpha;','if (scrollState.lensVisible) cubeCamera.update(renderer, scene);','lens.visible = scrollState.lensVisible;','if (!reduced) bgUniforms.uTime.value += .00007 * speed * delta * 60;','lens.scale.setScalar(3 + .5 * expandLens);','lens.position.x = -1.25 + .25 * expandLens;'])assert.ok(hero.includes(literal),literal);
 for(const literal of ['const lensOpacity=1-lensProgress*lensProgress*(3-2*lensProgress);','const fieldTravel=motion?.matches?0:progress*18;'])assert.ok(shared.includes(literal),literal);
});

test('exact pose normalization cannot conceal duplicated patches or unrelated desktop/rendering mutations',()=>{
 assert.equal(restoreMobileLensPoseSource('js/shaders/shaders.js','unrelated mutation'),'unrelated mutation');
 assert.equal(restoreMobileLensPoseSource('css/science-globe.css','unrelated mutation'),'unrelated mutation');
 const patch=patches.source['js/hero.js'][1];assert.ok(patch);assert.notEqual(restoreMobileLensPoseSource('js/hero.js',patch.new+patch.new),patch.old+patch.old);
 const changed=patch.new.replace('lens.position.x','lens.position.z');assert.notEqual(restoreMobileLensPoseSource('js/hero.js',changed),patch.old);
});
