import {restoreFooterClosingSymbolSource,restoreFooterClosingSymbolHTML} from './footer-closing-symbol-normalize.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const baseline=JSON.parse(readFileSync(new URL('./favicon-symbol09-baseline.json',import.meta.url),'utf8'));
export function restoreFaviconSymbol09Source(path,value){
 value=restoreFooterClosingSymbolSource(path,value);
 const binary=Buffer.isBuffer(value);let source=String(value);
 if(path==='assets/favicon.svg'){
  if(createHash('sha256').update(value).digest('hex')===baseline.newIconSHA256)source=baseline.oldSVG;else return value;
 }else if(path==='js/templates.js'){
  source=source.replaceAll(`href="${baseline.hrefAfter}"`,`href="${baseline.hrefBefore}"`);
 }else if(path==='assets/manifest.json'){
  const manifest=JSON.parse(source);manifest.files=manifest.files.map(entry=>JSON.stringify(entry)===JSON.stringify(baseline.newEntry)?baseline.oldEntry:entry);source=JSON.stringify(manifest,null,2)+'\n';
 }else return value;
 return binary?Buffer.from(source):source;
}
export function restoreFaviconSymbol09HTML(html){return restoreFooterClosingSymbolHTML(html).replaceAll(`href="${baseline.hrefAfter}"`,`href="${baseline.hrefBefore}"`);}
