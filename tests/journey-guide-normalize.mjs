import {readFileSync} from 'node:fs';
const changes=JSON.parse(readFileSync(new URL('./journey-guide-replacements.json',import.meta.url),'utf8'));
/** Approved home guide replacement and touch-only gallery edition; desktop mechanics stay guarded. */
export function restoreJourneyGuideSource(path,value){const rows=changes.source[path];if(!rows)return value;const binary=Buffer.isBuffer(value);let source=String(value);for(const{old:before,new:after}of [...rows].reverse()){if(!after||source.split(after).length-1!==1)continue;source=source.replace(after,()=>before);}return binary?Buffer.from(source):source;}
export function restoreJourneyGuideHTML(html){let source=html;for(const{old:before,new:after}of changes.html){if(after&&source.split(after).length-1===1)source=source.replace(after,()=>before);}return source;}
