/** Historic scope tests compare the explicitly approved 404 replacement to its former document. */
import {renderDocument as renderCurrentDocument} from '../js/templates.js';
import {restoreNotFoundHTML} from './not-found-normalize.mjs';
export * from '../js/templates.js';
export function renderDocument(options){return restoreNotFoundHTML(renderCurrentDocument(options));}
