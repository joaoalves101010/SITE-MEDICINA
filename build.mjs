import { mkdir, cp, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderDocument } from './js/templates.js';
import { projects } from './js/content.js';
const root=resolve(import.meta.dirname||'.');
const dist=resolve(root,'dist');
await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
for(const folder of ['css','js','assets'])await cp(resolve(root,folder),resolve(dist,folder),{recursive:true});
const build='innecta-monopo-'+new Date().toISOString().replace(/[:.]/g,'-');
const routes=[{path:'',page:'home'},{path:'comunidade',page:'community'},{path:'percursos',page:'directory'},...projects.map(p=>({path:`modulos/${p.slug}`,page:'project',slug:p.slug}))];
for(const route of routes){const dir=resolve(dist,route.path);await mkdir(dir,{recursive:true});await writeFile(resolve(dir,'index.html'),renderDocument({...route,build}));}
await writeFile(resolve(dist,'404.html'),renderDocument({page:'404',build}));
await writeFile(resolve(dist,'build.json'),JSON.stringify({build,createdAt:new Date().toISOString(),routes:routes.map(r=>'/'+(r.path?r.path+'/':'')),status:'Static build complete; deployment validation is separate'},null,2));
console.log(`Built ${routes.length} routes + 404: ${build}`);
