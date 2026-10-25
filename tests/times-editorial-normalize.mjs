import {restoreTimesCoverSource,restoreTimesCoverHTML} from './times-cover-normalize.mjs';
import {readFileSync} from 'node:fs';
import {renderTimesEditorial} from '../js/times-editorial.js';
const changes=JSON.parse(readFileSync(new URL('./times-editorial-replacements.json',import.meta.url),'utf8'));

/** Reverse only one exact approved insertion; neighboring content is never matched. */
export function restoreTimesEditorialSource(path,value){value=restoreTimesCoverSource(path,value);const rows=changes.source[path];if(!rows)return value;const binary=Buffer.isBuffer(value);let source=String(value);for(const{old:before,new:after}of [...rows].reverse()){if(!after||source.split(after).length-1!==1)continue;source=source.replace(after,()=>before);}return binary?Buffer.from(source):source;}
export function restoreTimesEditorialHTML(html){let source=restoreTimesCoverHTML(html);for(const fragment of [renderTimesEditorial(),'<link rel="stylesheet" href="/css/times-editorial.css">']){if(source.split(fragment).length-1===1)source=source.replace(fragment,'');}return source;}
