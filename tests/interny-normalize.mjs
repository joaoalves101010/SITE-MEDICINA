import {restoreTheMedSource,restoreTheMedHTML} from './the-med-normalize.mjs';
import {readFileSync} from 'node:fs';
const mappings=JSON.parse(readFileSync(new URL('./interny-replacements.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('./interny-baseline.json',import.meta.url),'utf8'));
const motif=JSON.parse(readFileSync(new URL('./brand-motif-baseline.json',import.meta.url),'utf8'));
/** Reverse only reviewed branding literals, never runtime/layout expressions. */
export function restoreInternySource(path,value){
 value=restoreTheMedSource(path,value);
 const binary=Buffer.isBuffer(value);
 if(!mappings[path]&&path!=='assets/manifest.json')return value;
 let source=String(value);
 for(const {old:before,new:after} of [...(mappings[path]||[])].reverse())source=source.replaceAll(after,before);
 if(path==='assets/manifest.json'){
  const manifest=JSON.parse(source);
  for(const entry of manifest.files||[]){const old=baseline.bookStaticEntries.find(item=>item.file===entry.file);if(old){entry.bytes=old.bytes;entry.sha256=old.sha256;}}
  source=JSON.stringify(manifest,null,2)+'\n';
 }
 return binary?Buffer.from(source):source;
}
/** Rendered equivalents of the same approved copy/signature changes. */
export function restoreInternyHTML(html){
 return restoreTheMedHTML(html)
  .replaceAll('<span>interny</span></a>',`<span>innecta</span><svg viewBox="0 0 32 32" fill="none" aria-hidden="true">${motif.sharedNew}</svg></a>`)
  .replaceAll('<span class="header-caption" lang="en">Your Medical<br>Journey</span>','<span class="header-caption">Um novo olhar<br>para a sua trajetória.</span>')
  .replaceAll('<p class="book-kicker">Interny | Your Medical Journey</p>','<p class="book-kicker">INNECTA OS · FORMAÇÃO MÉDICA, COM CONTEXTO</p>')
  .replaceAll('Interny | Your Medical Journey — início','Innecta — início')
  .replaceAll(' — Interny | Your Medical Journey',' — Innecta')
  .replaceAll('Interny | Your Medical Journey','Innecta — Sua trajetória, um novo olhar')
  .replaceAll('Interface de demonstração da Interny, preservada com a identidade visual anterior do produto.','Interface de demonstração da Innecta.')
  .replaceAll('Interfaces de demonstração da Interny, preservadas com a identidade visual anterior do produto.','Interfaces de demonstração da Innecta.')
  .replaceAll('name="interny-build"','name="innecta-build"')
  .replaceAll('>interny<','>innecta<')
  .replaceAll('Interny','Innecta').replaceAll('INTERNY','INNECTA');
}
