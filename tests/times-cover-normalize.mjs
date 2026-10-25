/** Reverse only the single exact approved, independent home-only module insertion. */
export const COVER_SOURCE_INSERTION = '${page===\'home\'?\'<script type="module" src="/js/times-cover-live.js"></script>\':\'\'}';
export const COVER_HTML_INSERTION = '<script type="module" src="/js/times-cover-live.js"></script>';
const removeOnce = (source,fragment) => source.split(fragment).length === 2 ? source.replace(fragment,'') : source;
export function restoreTimesCoverSource(path,value) {
  if(path!=='js/templates.js')return value;
  const restored=removeOnce(String(value),COVER_SOURCE_INSERTION);
  return Buffer.isBuffer(value)?Buffer.from(restored):restored;
}
export const restoreTimesCoverHTML = html => removeOnce(html,COVER_HTML_INSERTION);
