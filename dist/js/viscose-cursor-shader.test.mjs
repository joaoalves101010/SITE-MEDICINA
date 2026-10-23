import test from 'node:test';
import assert from 'node:assert/strict';
import {viscoseFragment} from './viscose-shaders.js';
test('focus glass refracts sample coordinates before card fields and keeps screen-space mask',()=>{
 assert.ok(viscoseFragment.includes('focusGlassNormal'));
 assert.ok(viscoseFragment.indexOf('p+=focusNormal')<viscoseFragment.indexOf('float field='));
 assert.match(viscoseFragment,/focusDistance=roundedRect\(original-uTag\.xy/);
});
test('focus glass includes frost, directional rim and contrast-adaptive ink',()=>{
 assert.match(viscoseFragment,/glass=mix\(under,vec3\(1\.\),\.16\)/);
 assert.match(viscoseFragment,/rim\*rim\*\.02\*dot\(focusNormal/);
 assert.match(viscoseFragment,/1\.-smoothstep\(\.46,\.54,lum\)/);
});
