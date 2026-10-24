import {restoreWordmarkSource,restoreWordmarkHTML} from './wordmark-normalize.mjs';
import {readFileSync} from 'node:fs';
const baseline=JSON.parse(readFileSync(new URL('./the-med-baseline.json',import.meta.url),'utf8'));
const permitted=new Set(['js/templates.js','js/content.js','js/pages.js','js/science-content.js','js/medical-experiences.js','js/book-controller.js','js/app.js','js/book-art.js','js/book-editorial.js','js/book-section.js']);
/** Reverse only this reviewed identity, preserving the previous technical identifiers. */
export function restoreTheMedSource(path,value){
 value=restoreWordmarkSource(path,value);
 const binary=Buffer.isBuffer(value);
 if(path==='assets/manifest.json'){
  const manifest=JSON.parse(String(value));
  for(const entry of manifest.files||[]){const before=baseline.bookStaticEntries.find(item=>item.file===entry.file);if(before){entry.bytes=before.bytes;entry.sha256=before.sha256;}}
  const source=JSON.stringify(manifest,null,2)+'\n';return binary?Buffer.from(source):source;
 }
 if(!permitted.has(path))return value;
 let source=String(value);
 if(path==='js/templates.js')source=source.replaceAll('<span>THE MED</span></a>','<span>interny</span></a>').replaceAll('· THE MED ·','· INTERNY ·').replaceAll('THE MED · EM PRÉ-LANÇAMENTO','INTERNY · EM PRÉ-LANÇAMENTO');
 if(path==='js/pages.js')source=source.replaceAll('<p class="case-brand">THE MED</p>','<p class="case-brand">interny</p>').replaceAll('<span>THE MED</span><span>coletiva','<span>interny</span><span>coletiva').replaceAll('· THE MED ·','· INTERNY ·').replaceAll('THE MED / PERCURSOS','INTERNY / PERCURSOS');
 if(path==='js/content.js')source=source.replaceAll('THE MED / EM COMUM','INTERNY / EM COMUM');
 if(path==='js/book-art.js')source=source.replaceAll("'THE MED'","'INTERNY'").replaceAll('THE MED / ${chapter.module','INTERNY / ${chapter.module');
 if(path==='js/book-editorial.js')source=source.replaceAll('THE MED / PRÉ-LANÇAMENTO','INTERNY / PRÉ-LANÇAMENTO');
 source=source.replaceAll('THE MED','Interny');
 return binary?Buffer.from(source):source;
}
export function restoreTheMedHTML(html){return restoreWordmarkHTML(html)
 .replaceAll('<span>THE MED</span></a>','<span>interny</span></a>')
 .replaceAll('<p class="case-brand">THE MED</p>','<p class="case-brand">interny</p>')
 .replaceAll('<span>THE MED</span><span>coletiva','<span>interny</span><span>coletiva')
 .replaceAll('· THE MED ·','· INTERNY ·')
 .replaceAll('THE MED · EM PRÉ-LANÇAMENTO','INTERNY · EM PRÉ-LANÇAMENTO')
 .replaceAll('THE MED / PERCURSOS','INTERNY / PERCURSOS')
 .replaceAll('THE MED / EM COMUM','INTERNY / EM COMUM')
 .replaceAll('THE MED / PRÉ-LANÇAMENTO','INTERNY / PRÉ-LANÇAMENTO')
 .replaceAll('THE MED','Interny');}
