import {restoreFaviconSymbol09Source,restoreFaviconSymbol09HTML} from './favicon-symbol09-normalize.mjs';
import {readFileSync} from 'node:fs';
import {renderFooterWordmark} from '../js/footer-wordmark.js';
const baseline=JSON.parse(readFileSync(new URL('./footer-wordmark-baseline.json',import.meta.url),'utf8'));
/** Footer-only changes, with exact reviewed literals and no broad replacements. */
export function restoreFooterWordmarkSource(path,value){
 value=restoreFaviconSymbol09Source(path,value);
 const rows=baseline.sourceReplacements[path];if(!rows)return value;const binary=Buffer.isBuffer(value);let source=String(value);
 for(const{old:before,new:after}of [...rows].reverse()){if(source.split(after).length-1>1)continue;source=source.replaceAll(after,before);}
 return binary?Buffer.from(source):source;
}
export function restoreFooterWordmarkHTML(html){return restoreFaviconSymbol09HTML(html).replaceAll(` aria-label="Conheça a the med"><span class="footer-cta-copy">Conheça a ${renderFooterWordmark()}</span>`,`>Conheça a THE MED`);}
