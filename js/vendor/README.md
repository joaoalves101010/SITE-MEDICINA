# Local renderer

`three-scene.js` contains the original Three.js r131 module and matching EffectComposer, RenderPass, ShaderPass and Pass modules from the locally saved reference chunks. The tiny module loader is authored here; no npm/CDN/network resolution is needed. Only named classes needed by the scene are exposed. Three.js and its example postprocessing are MIT-licensed; see THREE-LICENSE.txt.

Scene shader strings in ../shaders/ are preserved from the recovered procedural reference, with wine/cream palette supplied as uniforms by ../hero.js. No Monopo photos, branded videos, client work or people are included. Roobert font files are present elsewhere in assets; redistribution rights are unresolved. See FONTES_E_LICENCAS.md.
