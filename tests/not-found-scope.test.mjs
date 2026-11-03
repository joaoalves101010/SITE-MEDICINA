import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderDocument} from '../js/templates.js';
import {restoreNotFoundHTML,restoreNotFoundSource,NOT_FOUND_IMPORT,NOT_FOUND_GUARD} from './not-found-normalize.mjs';
const fixture=JSON.parse(readFileSync(new URL('./not-found-approved-documents.json',import.meta.url),'utf8'));
test('only the complete approved 404 document is normalized for historical scope tests',()=>{
 const html=renderDocument({page:'404',build:fixture.token});
 assert.equal(html,fixture.approved);
 assert.equal(restoreNotFoundHTML(html),fixture.previous);
 const mutated=html.replace('Nem todo desvio','Unexpected change');
 assert.equal(restoreNotFoundHTML(mutated),mutated);
 for(const page of ['home','community','directory']){const other=renderDocument({page,build:'review'});assert.equal(restoreNotFoundHTML(other),other);}
 const custom=renderDocument({page:'404',build:'review-42'});
 assert.equal(restoreNotFoundHTML(custom),fixture.previous.replaceAll(fixture.token,'review-42'));
});
test('404 source normalization removes each approved integration fragment exactly once',()=>{
 const source=NOT_FOUND_IMPORT+'before;'+NOT_FOUND_GUARD+'after;';
 assert.equal(restoreNotFoundSource('js/templates.js',source),'before;after;');
 assert.equal(restoreNotFoundSource('js/app.js',source),source);
 assert.equal(restoreNotFoundSource('js/templates.js',NOT_FOUND_GUARD+NOT_FOUND_GUARD),NOT_FOUND_GUARD+NOT_FOUND_GUARD);
 assert.equal(restoreNotFoundSource('js/templates.js',source+'unexpected;'),'before;after;unexpected;');
});
