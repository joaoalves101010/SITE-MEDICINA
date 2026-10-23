import {medicalExperiences} from '../js/medical-experiences.js';
import assert from 'node:assert/strict';
import { readFile, stat, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { projects, profiles, directoryProfiles } from '../js/content.js';
import { caseMediaPatterns, renderProfileModal } from '../js/pages.js';
import { renderDocument } from '../js/templates.js';
import { scienceReadings, scienceInstitutions } from '../js/science-content.js';
const root=resolve(import.meta.dirname,'..'),dist=join(root,'dist');
const exists=async p=>{try{return (await stat(p)).isFile();}catch{return false;}};
const walk=async dir=>(await Promise.all((await readdir(dir,{withFileTypes:true})).map(async entry=>entry.isDirectory()?walk(join(dir,entry.name)):[join(dir,entry.name)]))).flat();
let assertions=0;const check=(test,message)=>{assert.ok(test,message);assertions++;};
check(projects.length===8,'Eight complete module records');check(profiles.length===6,'Six homepage product/process profiles');check(new Set(projects.map(p=>p.slug)).size===8,'Unique project slugs');
for(const p of projects){check(projects.some(n=>n.slug===p.next),`Next-project exists: ${p.slug}`);check(p.sections.length>=2,`Substantive internal sections: ${p.slug}`);}
const files=await walk(dist);const pages=files.filter(p=>p.endsWith('.html'));check(pages.length===12,'Eleven physical routes plus404');
const external=new Set();let localRefs=0;
for(const file of pages){const html=await readFile(file,'utf8');check((html.match(/<h1\b/g)||[]).length===1,`One h1: ${file}`);check(html.includes('lang="pt-BR"'),`Portuguese lang: ${file}`);check(!/undefined|\[object Object\]/.test(html),`No render holes: ${file}`);check(html.includes('innecta-build'),`Build marker: ${file}`);check(!/monopo|saigon|skyler|cartier|nomad|murakami/i.test(html.replaceAll('innecta-monopo','innecta-build')),`No source identity/client claims: ${file}`);const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);check(ids.length===new Set(ids).size,`Unique IDs: ${file}`);for(const match of html.matchAll(/\b(?:src|href|poster)="([^"]+)"/g)){let url=match[1];if(url.startsWith('#')){check(ids.includes(decodeURIComponent(url.slice(1))),`Local anchor ${url}: ${file}`);continue;}if(/^https?:/.test(url)){external.add(url);continue;}if(!url.startsWith('/'))throw Error(`Nonportable reference ${url}`);const [pathname,hash]=url.split('#');const relative=pathname.replace(/^\//,'');const target=join(dist,relative.endsWith('/')?relative+'index.html':relative||'index.html');check(await exists(target),`Reference exists ${url}: ${file}`);localRefs++;if(hash){const targetHtml=await readFile(target,'utf8');check(targetHtml.includes(`id="${hash}"`),`Cross-route anchor ${url}`);}}}
for(const url of external)check(['https://innectaos.vercel.app/','https://innecta.vercel.app/',...scienceReadings.map(x=>x.href),...scienceInstitutions.map(x=>x.href),...medicalExperiences.flatMap(p=>[p.href,p.requirementsUrl,p.scopeUrl,p.photoCredit.sourceUrl,p.photoCredit.licenseUrl].filter(Boolean))].includes(url),`Only verified outbound link: ${url}`);
for(const file of files.filter(p=>p.endsWith('.css'))){const css=await readFile(file,'utf8');for(const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)){const url=match[1];check(url.startsWith('/'),`Local CSS asset: ${url}`);check(await exists(join(dist,url)),`CSS asset exists: ${url}`);}}
check(renderDocument({page:'project',slug:'missing'}).includes('não encontrada'),'Unknown project gracefully produces404');
const expectedPatterns={trajetoria:['C','F','P','F','P','C','C','C','F','CCCC','F','CCCC'],hoje:['I','IP'],explorar:['I','PFFF'],mentor:['I','PF'],acervo:['C','C','F'],ligas:['C','FF','PPCCCCC'],pesquisa:['I','F','I','PP','IPP','I'],club:['FI','FCF']};
for(const p of projects){const html=await readFile(join(dist,'modulos',p.slug,'index.html'),'utf8');const sequence=[...html.matchAll(/data-media-sequence="([^"]+)"/g)].map(m=>m[1]);check(JSON.stringify(sequence)===JSON.stringify(expectedPatterns[p.slug]),`Exact source media sequence: ${p.slug}`);check(!html.includes('<footer'),`No shared footer in case: ${p.slug}`);check(html.includes('interface-notice'),`SSR demonstration notice: ${p.slug}`);}
check(directoryProfiles.length===2,'Source directory has two editorial profiles');check(directoryProfiles[0].gallery.length===8&&directoryProfiles[1].gallery.length===9,'Source directory gallery lengths8/9');
const directory=await readFile(join(dist,'percursos/index.html'),'utf8');check((directory.match(/data-profile=/g)||[]).length===2,'Directory emits two cards');check(!directory.includes('<footer'),'Directory ends without shared footer');check(directory.includes('interface-notice'),'Directory SSR demonstration notice');
for(const profile of [...profiles,...directoryProfiles]){const html=renderProfileModal(profile);check(html.includes('data-modal-close'),'Every profile is dismissible');check(html.includes('profile-title'),'Every profile has accessible heading');}
const community=await readFile(join(dist,'comunidade/index.html'),'utf8');check((community.match(/data-editorial-entry=/g)||[]).length===17,'Complete source editorial entry sequence');check(community.includes('interface-notice'),'Community SSR demonstration notice');
check((await readFile(join(dist,'404.html'),'utf8')).includes('hero-canvas'),'404 procedural hero fallback');
const build=JSON.parse(await readFile(join(dist,'build.json'),'utf8'));
console.log(JSON.stringify({status:'passed',assertions,pages:pages.length,localReferences:localRefs,externalLinks:[...external],build:build.build,browser:'not run; root owns native QA'},null,2));
