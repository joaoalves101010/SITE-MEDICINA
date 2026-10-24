import {restoreModuleRevisionSource,restoreModuleRevisionHTML} from './trajectory-normalize.mjs';
import {readFileSync} from 'node:fs';
const baseline=JSON.parse(readFileSync(new URL('./footer-closing-symbol-baseline.json',import.meta.url),'utf8'));
/** Only the approved footer-closing image, appended local CSS and manifest record. */
export function restoreFooterClosingSymbolSource(path,value){
 value=restoreModuleRevisionSource(path,value);
 const binary=Buffer.isBuffer(value);let source=String(value);
 if(path==='js/templates.js'){
  if(source.split(baseline.markup).length-1>1)return value;source=source.replace(baseline.markup,'');
 }else if(path==='css/wordmark.css'){
  if(!baseline.cssAddition||source.split(baseline.cssAddition).length-1!==1)return value;source=source.replace(baseline.cssAddition,'');
 }else if(path==='assets/manifest.json'){
  const manifest=JSON.parse(source);manifest.files=manifest.files.filter(entry=>JSON.stringify(entry)!==JSON.stringify(baseline.manifestEntry));source=JSON.stringify(manifest,null,2)+'\n';
 }else return value;
 return binary?Buffer.from(source):source;
}
export function restoreFooterClosingSymbolHTML(html){html=restoreModuleRevisionHTML(html);return html.split(baseline.markup).length-1===1?html.replace(baseline.markup,''):html;}
