import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {medicalExperiences,renderMedicalExperiences} from '../js/medical-experiences.js';
const html=renderMedicalExperiences();
test('eight editorial programmes remain in the verified order with official destinations and no ranking claims',()=>{
 assert.deepEqual(medicalExperiences.map(p=>p.id),['mayo','cleveland','yale','harvard','ucl','oxford','nus','queensland']);
 for(const p of medicalExperiences){assert.equal(p.checkedAt,'2026-10-23');assert.ok(p.href.startsWith('https://'));assert.ok(p.requirementsUrl.startsWith('https://'));for(const field of ['name','shortName','country','city','type','duration','program','summary','eligibility','status','photoCaption','imageAlt'])assert.ok(p[field]?.length>0,p.id+': '+field);}
 assert.match(html,/não um ranking de procura/);assert.match(html,/Não implica parceria com a THE MED/);assert.match(html,/<time datetime="2026-10-23">23\/10\/2026<\/time>/);assert.doesNotMatch(html,/mais procurados do mundo|aprovação garantida|nossos parceiros/i);
});
test('clinical participation and observership cannot be confused, and hard eligibility/status restrictions are visible',()=>{
 const by=Object.fromEntries(medicalExperiences.map(p=>[p.id,p]));assert.equal(by.cleveland.type,'Observership');assert.match(by.cleveland.eligibility,/exclusivamente observacional.*sem atendimento a pacientes.*sem crédito acadêmico/);assert.match(by.cleveland.eligibility,/não estar no último ano/);assert.match(by.cleveland.status,/encerradas.*01\/12\/2026 a 31\/01\/2027/);assert.ok(by.cleveland.href.includes('physician-observer'));
 assert.match(by.harvard.eligibility,/FCMSCSP/);assert.match(by.harvard.eligibility,/Universidade de São Paulo/);assert.match(by.harvard.eligibility,/Apenas faculdades internacionais aprovadas/);
 assert.match(by.oxford.status,/encerrada/);assert.match(by.oxford.status,/Novas datas ainda não/);assert.match(by.yale.eligibility,/somente via VSLO/);assert.match(by.mayo.eligibility,/participar do VSLO/);assert.match(by.nus.status,/clínica ou apenas observacional depende da alocação/);assert.match(by.queensland.eligibility,/médicos graduados não são elegíveis/);
});
test('all eight licensed photographs retain exact served intrinsic dimensions and visible credits',async()=>{
 const sources=JSON.parse(await readFile(new URL('../assets/experiences/credits.json',import.meta.url),'utf8'));
 for(const p of medicalExperiences){const source=sources.find(s=>s.id===p.id);assert.ok(source);assert.deepEqual([p.imageWidth,p.imageHeight],source.served_dimensions);assert.equal(p.image,source.served_path);assert.equal(p.photoCredit.author,source.photographer);assert.equal(p.photoCredit.sourceUrl,source.source_url);assert.equal(p.photoCredit.licenseUrl,source.license_url);assert.ok(html.includes(`width="${p.imageWidth}" height="${p.imageHeight}"`));assert.ok(html.includes(p.photoCredit.sourceUrl.replaceAll('&','&amp;')));assert.match(p.photoCredit.changes,/Redimensionamento.*WebP.*recorte/);}
 assert.match(html,/<details class="experience-credits">/);assert.match(html,/A versão adaptada da fotografia permanece sob a mesma licença/);assert.match(html,/biblioteca, não o local de prática clínica/);assert.match(html,/não um hospital de alocação/);
});
test('semantic fallback exposes every programme and photo while enhanced controls have stable hooks',()=>{
 assert.equal((html.match(/data-experience-card="\d"/g)||[]).length,8);assert.equal((html.match(/data-experience-panel="\d"/g)||[]).length,8);assert.equal((html.match(/data-experience-jump="\d"/g)||[]).length,8);
 for(const p of medicalExperiences){assert.ok(html.includes(`id="experience-${p.id}"`));assert.ok(html.includes(`aria-labelledby="experience-title-${p.id}"`));assert.ok(html.includes(p.summary));assert.ok(html.includes(p.eligibility));assert.ok(html.includes(p.status));}
 assert.doesNotMatch(html,/<article[^>]+hidden/);assert.match(html,/data-experience-controls hidden/);assert.match(html,/role="status" aria-live="polite" aria-atomic="true"/);assert.match(html,/touch-action|data-experience-stage/);assert.equal((html.match(/data-experience-meta-layer=/g)||[]).length,4);
});
test('styles are section scoped and distinguish interactive arc from readable no-JS layout',async()=>{
 const css=await readFile(new URL('../css/medical-experiences.css',import.meta.url),'utf8');assert.match(css,/touch-action:pan-y pinch-zoom/);assert.match(css,/\.medical-experiences\[data-state="interactive"\] \.experience-stage\{display:block\}/);assert.match(css,/\.experience-stage\{display:none/);assert.match(css,/@media\(max-width:640px\)/);assert.match(css,/prefers-reduced-motion:reduce/);assert.doesNotMatch(css,/(?:^|\n)(?:body|html|main|\.container)[\s{]/);assert.doesNotMatch(css,/position:fixed|overflow:hidden!important/);
});

// The GPU compositor owns its frosted hover label; the HTML label is fallback-only.
test("WebGL and fallback never paint duplicate hover labels",async()=>{const css=await readFile(new URL("../css/medical-experiences.css",import.meta.url),"utf8");assert.match(css,/data-render-mode="webgl"\] \.experience-cursor-tag[^}]*display:none/);});
