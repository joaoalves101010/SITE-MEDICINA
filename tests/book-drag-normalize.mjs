import {restoreMedicalExperiences} from './medical-experiences-normalize.mjs';
/** Reconstruct the user-approved mechanics before the isolated mouse adapter. */
export function restoreBookDrag(path,source){
 source=restoreMedicalExperiences(path,source);
 if(path==='js/book-controller.js')return source
  .replace("export { setBookScrollImmediate } from './book-drag.js';\n",'')
  .replace("import { createBookDrag } from './book-drag.js';\n",'')
  .replace('function restore(){drag?.cancel();pinHeader(false);','function restore(){pinHeader(false);')
  .replace('function update(){if(disposed)return;drag?.sync();','function update(){if(disposed)return;')
  .replace('function go(index){drag?.cancel();if(!interactive)return;','function go(index){if(!interactive)return;')
  .replace(/  const drag=createBookDrag\(visual,[\s\S]*?on\(fine,'change',updateHint\);\n/,'')
  .replace('dispose(){if(disposed)return;drag.dispose();pinHeader(false);disposed=true;','dispose(){if(disposed)return;pinHeader(false);disposed=true;');
 if(path==='js/app.js')return source.replace('then(({createBookController,setBookScrollImmediate})=>','then(({createBookController})=>').replace(/scrollTo,scrollImmediate:target=>[\s\S]*?getScrollY:\(\)=>scroll\?\.scroll\?\.instance\?\.scroll\?\.y\|\|window.scrollY/, 'scrollTo,getScrollY:()=>scroll?.scroll?.instance?.scroll?.y||window.scrollY');
 if(path==='css/book.css')return source.replace(/\n\/\* Book-only mouse drag affordance;[^]*$/,'');
 return source;
}
