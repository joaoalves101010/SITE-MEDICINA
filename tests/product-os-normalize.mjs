import {restoreTimesEditorialSource,restoreTimesEditorialHTML} from './times-editorial-normalize.mjs';
import {readFileSync} from 'node:fs';
const changes=JSON.parse(readFileSync(new URL('./product-os-replacements.json',import.meta.url),'utf8'));
/** Reverse only the approved home product fold and its template integration, never adjacent content. */
export function restoreProductOSSource(path,value){value=restoreTimesEditorialSource(path,value);const rows=changes.source[path];if(!rows)return value;const binary=Buffer.isBuffer(value);let source=String(value);for(const{old:before,new:after}of [...rows].reverse()){if(!after||source.split(after).length-1!==1)continue;source=source.replace(after,()=>before);}return binary?Buffer.from(source):source;}
export function restoreProductOSHTML(html){let source=restoreTimesEditorialHTML(html);for(const{old:before,new:after}of changes.html){if(after&&source.split(after).length-1===1)source=source.replace(after,()=>before);}return source;}
