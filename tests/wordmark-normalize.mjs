import {restoreFooterWordmarkSource,restoreFooterWordmarkHTML} from './footer-wordmark-normalize.mjs';
import {readFileSync} from 'node:fs';
import {renderWordmark} from '../js/wordmark.js';
const baseline=JSON.parse(readFileSync(new URL('./wordmark-baseline.json',import.meta.url),'utf8'));
const replacements=JSON.parse(readFileSync(new URL('./wordmark-replacements.json',import.meta.url),'utf8'));
/** Exact approved vector-mark substitutions only; all unrelated bytes remain guarded. */
export function restoreWordmarkSource(path,value){
 value=restoreFooterWordmarkSource(path,value);
 const binary=Buffer.isBuffer(value);
 if(path==='assets/manifest.json'){
  const manifest=JSON.parse(String(value));
  if(baseline.wordmarkEntry)manifest.files=manifest.files.filter(entry=>JSON.stringify(entry)!==JSON.stringify(baseline.wordmarkEntry));
  for(const entry of manifest.files||[]){const before=baseline.bookStaticEntries.find(item=>item.file===entry.file);if(before){entry.bytes=before.bytes;entry.sha256=before.sha256;}}
  const source=JSON.stringify(manifest,null,2)+'\n';return binary?Buffer.from(source):source;
 }
 if(!replacements[path])return value;
 let source=String(value);for(const {old:before,new:after} of [...replacements[path]].reverse()){if(source.split(after).length-1>1)continue;source=source.replaceAll(after,before);}
 return binary?Buffer.from(source):source;
}
export function restoreWordmarkHTML(html){let source=restoreFooterWordmarkHTML(html);
 for(const name of ['brand','case','community']){
  const mark=name==='brand'?`<span class="brand-wordmark" aria-hidden="true">${renderWordmark()}</span>`:`<span class="${name}-wordmark">${renderWordmark({label:'the med'})}</span>`;
  source=source.replaceAll(mark,name==='case'?'THE MED':'<span>THE MED</span>');
 }
 return source.replaceAll('<link rel="stylesheet" href="/css/wordmark.css">','');
}
