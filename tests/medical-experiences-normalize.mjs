/** Strip only the new bounded section/hooks for earlier approved-scope assertions. */
export function restoreMedicalExperiences(path,source){
 if(path==='js/templates.js')return source.replace("import { renderMedicalExperiences } from './medical-experiences.js';\n",'').replace('${renderMedicalExperiences()}','').replace('<link rel="stylesheet" href="/css/medical-experiences.css">','');
 if(path==='js/app.js')return source.replace(/let experienceController;\nconst experienceRoot=[\s\S]*?(?=let scienceController;)/,'').replace('experienceController?.update();','').replace('experienceController?.setVisible(false);','').replace('experienceController?.setVisible(true);','').replace('experienceController?.dispose();','');
 if(path==='assets/manifest.json'){const value=JSON.parse(source);value.files=value.files.filter(file=>!file.file.startsWith('experiences/'));delete value.international_experiences;return JSON.stringify(value,null,2)+'\n';}
 return source;
}
export function restoreMedicalExperiencesHTML(html){return html.replace(/<section id="medical-experiences"[\s\S]*?<\/section>/,'').replace('<link rel="stylesheet" href="/css/medical-experiences.css">','');}
