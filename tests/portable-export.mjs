import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),record=JSON.parse(await readFile(new URL('./portable-export-equivalence.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');
const portableKeys=new Set([...record.files.map(row=>row.file),'assets/manifest.json',...record.omittedPrivateFiles]);
function unaffected(value){value=structuredClone(value);for(const field of ['protected','protectedFiles'])for(const key of portableKeys)if(value[field])delete value[field][key];if(value.manifest?.science_globe)delete value.manifest.science_globe.geography_source;return JSON.stringify(value);}
test('portable export retains the exact previously public provenance and build files',async()=>{
 assert.equal(record.publicBaseline,'9525a9133e567823e0c19524ac371514bb80cb10');
 for(const row of record.files){const bytes=await readFile(new URL(row.file,root));assert.equal(hash(bytes),row.exportSHA256,row.file);assert.doesNotMatch(bytes.toString(),/\/workspace\/|\/home\/agent\//);}
 const manifest=JSON.parse(await readFile(new URL('assets/manifest.json',root),'utf8'));assert.equal(manifest.science_globe.geography_source,record.portableGeography);
});
test('portable fixture adaptation changes only documented provenance hashes and excludes hosting identity',async()=>{
 for(const row of record.fixtureRemainders){const fixture=JSON.parse(await readFile(new URL(row.fixture,import.meta.url),'utf8'));assert.equal(hash(unaffected(fixture)),row.sha256,row.fixture);for(const field of ['protected','protectedFiles'])for(const file of record.omittedPrivateFiles)assert.ok(!Object.hasOwn(fixture[field]||{},file));}
 for(const row of record.manifestVariants){const fixture=JSON.parse(await readFile(new URL(row.fixture,import.meta.url),'utf8'));assert.equal(fixture.protected['assets/manifest.json'],row.exportSHA256,row.fixture);}
 const original={protected:{'js/hero.js':'original','assets/manifest.json':'portable'}};assert.notEqual(unaffected(original),unaffected({protected:{...original.protected,'js/hero.js':'mutation'}}),'unrelated runtime guards cannot be normalized away');
});
test('portable tests and provenance contain no private workspace or hosting file',async()=>{
 for(const file of record.omittedPrivateFiles)await assert.rejects(access(new URL(file,root)));
 for(const name of await readdir(new URL('./',import.meta.url))){if(!/\.(?:mjs|json)$/.test(name)||name==='portable-export.mjs')continue;const source=await readFile(new URL(name,import.meta.url),'utf8');assert.doesNotMatch(source,/\/workspace\/|\/home\/agent\//,name);}
});
