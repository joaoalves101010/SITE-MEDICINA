import {restoreProductOSSource} from './product-os-normalize.mjs';
import {readFileSync} from 'node:fs';
const changes=JSON.parse(readFileSync(new URL('./mobile-lens-pose-replacements.json',import.meta.url),'utf8'));
/** Reverse only the reviewed touch-first home lens placement/pointer options; no artwork substitution. */
export function restoreMobileLensPoseSource(path,value){value=restoreProductOSSource(path,value);const rows=changes.source[path];if(!rows)return value;const binary=Buffer.isBuffer(value);let source=String(value);for(const{old:before,new:after}of [...rows].reverse()){if(!after||source.split(after).length-1!==1)continue;source=source.replace(after,()=>before);}return binary?Buffer.from(source):source;}
