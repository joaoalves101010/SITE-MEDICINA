import {readFileSync} from 'node:fs';
const fixture=JSON.parse(readFileSync(new URL('./ecosystem-approved.json',import.meta.url),'utf8'));
const removeOnce=(source,fragment)=>source.split(fragment).length===2?source.replace(fragment,''):source;
/** Only exact approved insertions are removed; duplicates and mutations remain visible. */
export function restoreEcosystemSource(path,value){
 if(path!=='js/templates.js')return value;
 let source=String(value);for(const fragment of fixture.source)source=removeOnce(source,fragment);
 return Buffer.isBuffer(value)?Buffer.from(source):source;
}
export function restoreEcosystemHTML(html){let source=html;for(const fragment of fixture.html)source=removeOnce(source,fragment);return source;}
