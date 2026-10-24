import {restoreMobileIntroSource,restoreMobileIntroHTML} from './mobile-intro-normalize.mjs';
import {readFileSync} from 'node:fs';
const baseline=JSON.parse(readFileSync(new URL('./trajectory-baseline.json',import.meta.url),'utf8'));
const changes=JSON.parse(readFileSync(new URL('./trajectory-replacements.json',import.meta.url),'utf8'));
/** Reviewed dispatch, isolated route assets, home greeting, footer alignment and document-title casing only. */
const previousTitle="const title=page==='project'?`${p.title} — THE MED | Your Medical Journey`:page==='community'?'Comunidade — THE MED | Your Medical Journey':page==='directory'?'Percursos — THE MED | Your Medical Journey':page==='404'?'Página não encontrada — THE MED | Your Medical Journey':'THE MED | Your Medical Journey'";
const currentTitle="const title=page==='project'?`${p.title} — the med | Your Medical Journey`:page==='community'?'Comunidade — the med | Your Medical Journey':page==='directory'?'Percursos — the med | Your Medical Journey':page==='404'?'Página não encontrada — the med | Your Medical Journey':'the med | Your Medical Journey'";
export function restoreModuleRevisionSource(path,value){value=restoreMobileIntroSource(path,value);const rows=changes.source[path];if(!rows)return value;const binary=Buffer.isBuffer(value);let source=String(value);if(path==='js/templates.js')source=source.replace(currentTitle,previousTitle);for(const{old:before,new:after}of [...rows].reverse()){if(source.split(after).length-1>1)continue;source=source.replaceAll(after,before);}return binary?Buffer.from(source):source;}
export function restoreModuleRevisionHTML(html){
 html=restoreMobileIntroHTML(html);
 html=html.replace(/(<title>[^<]*)the med( \| Your Medical Journey<\/title>)/g,'$1THE MED$2').replace(/(<meta property="og:title" content="[^"]*)the med( \| Your Medical Journey">)/g,'$1THE MED$2');
 const slug=html.match(/data-module-slug="([a-z-]+)"/)?.[1]||html.match(/data-module-experience="([a-z-]+)"/)?.[1]||(/<article\b[^>]*\bdata-trajectory(?:[ >]|=)/.test(html)?'trajetoria':null);
 if(/^<!doctype html>/i.test(html)&&slug&&baseline.legacyModules[slug]){const build=html.match(/data-build="([^"]*)"/)?.[1]??'dev';return baseline.legacyModules[slug].replaceAll(baseline.buildToken,build);}
 let output=html;for(const{old:before,new:after}of changes.html||[])output=output.replaceAll(after,before);return output;
}
