import {restoreJourneyGuideSource,restoreJourneyGuideHTML} from './journey-guide-normalize.mjs';
import {readFileSync} from 'node:fs';
const changes=JSON.parse(readFileSync(new URL('./mobile-intro-replacements.json',import.meta.url),'utf8'));
/** Reverse only reviewed native-touch routing, stable book viewport and home head-gate literals. */
export function restoreMobileIntroSource(path,value){value=restoreJourneyGuideSource(path,value);const rows=changes.source[path];if(!rows)return value;const binary=Buffer.isBuffer(value);let source=String(value);for(const{old:before,new:after}of [...rows].reverse()){if(!after||source.split(after).length-1!==1)continue;source=source.replace(after,()=>before);}return binary?Buffer.from(source):source;}
export function restoreMobileIntroHTML(html){let source=restoreJourneyGuideHTML(html);for(const{old:before,new:after}of changes.html){if(source.split(after).length-1===1)source=source.replace(after,()=>before);}return source;}
