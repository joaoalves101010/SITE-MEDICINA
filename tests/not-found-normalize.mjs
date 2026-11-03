import {readFileSync} from 'node:fs';
const fixture=JSON.parse(readFileSync(new URL('./not-found-approved-documents.json',import.meta.url),'utf8'));
export const NOT_FOUND_IMPORT="import { renderNotFoundDocument } from './not-found-page.js';\n";
export const NOT_FOUND_GUARD="if(page==='404')return renderNotFoundDocument({build});";
/** Reverse exactly the two approved integration additions, never their neighbors. */
export function restoreNotFoundSource(path,value){
 if(path!=='js/templates.js')return value;
 const binary=Buffer.isBuffer(value);let source=String(value);
 for(const part of [NOT_FOUND_IMPORT,NOT_FOUND_GUARD])if(source.split(part).length===2)source=source.replace(part,'');
 return binary?Buffer.from(source):source;
}
/** Restore only a whole approved document; any unexpected HTML change stays detectable. */
export function restoreNotFoundHTML(html){
 if(!html.includes('data-not-found'))return html;
 const build=html.match(/<meta name="interny-build" content="([^"]*)">/)?.[1];
 if(build===undefined)return html;
 const expected=fixture.approved.replaceAll(fixture.token,build);
 return html===expected?fixture.previous.replaceAll(fixture.token,build):html;
}
