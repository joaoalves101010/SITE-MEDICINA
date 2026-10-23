import {restoreInternySource,restoreInternyHTML} from './interny-normalize.mjs';
import {restoreBookDrag} from './book-drag-normalize.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {bookEditorialChapters,bookCover} from '../js/book-editorial.js';
import {renderBookSection} from '../js/book-section.js';
import {bookChapters} from '../js/book-art.js';
const baseline=JSON.parse(await readFile(new URL('./book-medical-baseline.json',import.meta.url),'utf8'));
test('accepted animation, stage, app, global content and approved mosaic remain exact outside the isolated drag adapter',async()=>{
 for(const [path,expected] of Object.entries(baseline.protected)){let data=restoreInternySource(path,await readFile(new URL('../'+path,import.meta.url)));if(['js/book-controller.js','css/book.css','js/app.js','js/templates.js','assets/manifest.json'].includes(path))data=restoreBookDrag(path,data.toString());assert.equal(createHash('sha256').update(data).digest('hex'),expected,path);}
});
test('book-specific medical editorial copy is shared with semantic fallback without changing route identities',()=>{
 assert.equal(bookCover.title,'Sua formação médica, por inteiro.');assert.equal(bookEditorialChapters.length,6);
 const html=renderBookSection();for(const c of bookEditorialChapters){assert.ok(html.includes(c.summary));assert.ok(html.includes(c.body));assert.ok(html.includes(c.href));assert.ok(html.includes(c.displayTitle));}
 assert.match(html,/medical-00-cover\.webp/);assert.doesNotMatch(html,/\/assets\/tiles\/|Interfaces de demonstração/);
 const copy=bookEditorialChapters.map(c=>[c.summary,c.body,c.excerpt].join(' ')).join(' ');
 for(const concept of ['anatomia','currículo','residência','Congressos','editais','15 etapas','Entender','Aplicar','Validar','Entregar','Ligas acadêmicas','Mentor IA','Ultra','45 minutos'])assert.ok(copy.toLocaleLowerCase('pt-BR').includes(concept.toLocaleLowerCase('pt-BR')),concept);
 assert.match(copy,/inteligência artificial/);assert.match(copy,/acompanhamento humano/);
 assert.doesNotMatch(copy,/aprovação garantida|vaga garantida|cura garantida|nossos hospitais parceiros/i);
});
test('every book page retains a wine-family ground and cream editorial contrast',()=>{
 assert.equal(bookChapters.length,6);for(const c of bookChapters){const hex=c.palette.paper;assert.match(hex,/^#[\da-f]{6}$/i);const [r,g,b]=hex.slice(1).match(/../g).map(v=>parseInt(v,16));assert.ok(r>g&&r>b&&r<145&&g<85,`${c.id}: ${hex}`);assert.match(c.illustration,/\/medical-[a-z]+-art\.webp$/);}
});
