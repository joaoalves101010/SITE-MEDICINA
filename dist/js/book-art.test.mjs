import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { bookEditorialChapters, bookCover } from './book-editorial.js';
import { profiles } from './content.js';
import { bookChapters, BOOK_ART_SIZE, containBookImage, wrapBookText, createBookArt } from './book-art.js';

function canvasDocument({fontFaces=false,missingContext=false}={}){
 const canvases=[],fonts=[],removed=[],faceSources=[];
 const doc={createElement(type){assert.equal(type,'canvas','injected image loader means no other DOM elements');const calls=[];
  const ctx={font:'400 20px Roobert',textAlign:'left',globalAlpha:1,
   measureText(text){const size=Number(this.font.match(/(\d+)px/)?.[1]||20);return{width:[...text].length*size*.51};},
   fillText(text,x,y){calls.push({kind:'text',text,x,y,width:this.measureText(text).width,align:this.textAlign});},
   fillRect(x,y,w,h){if(w>10)calls.push({kind:'rect',x,y,w,h});},
   drawImage(...args){calls.push({kind:'image',args});},beginPath(){},moveTo(){},lineTo(){},stroke(){},rect(){},clip(){},save(){},restore(){},translate(){},rotate(){},scale(){}
  };
  let matrix=[1,0,0,1,0,0];const stack=[];
  ctx.save=()=>stack.push(matrix.slice());ctx.restore=()=>{matrix=stack.pop()||[1,0,0,1,0,0];};
  ctx.translate=(x,y)=>{matrix[4]+=matrix[0]*x+matrix[2]*y;matrix[5]+=matrix[1]*x+matrix[3]*y;};
  ctx.scale=(x,y)=>{matrix[0]*=x;matrix[1]*=x;matrix[2]*=y;matrix[3]*=y;};
  ctx.rotate=angle=>{const[a,b,c,d]=matrix,co=Math.cos(angle),si=Math.sin(angle);matrix[0]=a*co+c*si;matrix[1]=b*co+d*si;matrix[2]=c*co-a*si;matrix[3]=d*co-b*si;};
  let shape=[];const point=(x,y)=>[matrix[0]*x+matrix[2]*y+matrix[4],matrix[1]*x+matrix[3]*y+matrix[5]];
  ctx.beginPath=()=>{shape=[];};ctx.moveTo=(x,y)=>shape.push(point(x,y));ctx.lineTo=(x,y)=>shape.push(point(x,y));ctx.bezierCurveTo=(...args)=>{for(let i=0;i<args.length;i+=2)shape.push(point(args[i],args[i+1]));};ctx.closePath=()=>{};
  ctx.fill=rule=>{assert.ok(shape.length>0);calls.push({kind:'vector',rule,bounds:{left:Math.min(...shape.map(p=>p[0])),right:Math.max(...shape.map(p=>p[0])),top:Math.min(...shape.map(p=>p[1])),bottom:Math.max(...shape.map(p=>p[1]))}});};
  const fillText=ctx.fillText;ctx.fillText=function(text,x,y){fillText.call(this,text,x,y);const call=calls.at(-1),size=Number(this.font.match(/(\d+)px/)?.[1]||20),ascent=size*(/[ÃÉ]/.test(text)? .91:.72),descent=size*(/Ç/.test(text)? .25:.016);const points=[];for(const px of[x,x+call.width])for(const py of[y-ascent,y+descent])points.push([matrix[0]*px+matrix[2]*py+matrix[4],matrix[1]*px+matrix[3]*py+matrix[5]]);call.bounds={left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))};};
  const canvas={width:0,height:0,calls,getContext(type,options){assert.equal(type,'2d');canvas.contextOptions=options;return missingContext?null:ctx;}};canvases.push(canvas);return canvas;
 },fonts:{load:()=>Promise.resolve([]),add:face=>fonts.push(face),delete:face=>removed.push(face)}};
 if(fontFaces)doc.defaultView={FontFace:class{constructor(family,source,style){this.family=family;this.source=source;this.style=style;faceSources.push(source);}load(){return Promise.resolve(this);}}};
 return{doc,canvases,fonts,removed,faceSources};
}
function image(width=1659,height=948){return{width,height,closed:0,close(){this.closed++;}};}
const goodLoader=()=>Promise.resolve(image());

test('medical book copy is shared without changing global profile identity or module routes',()=>{
 assert.deepEqual(BOOK_ART_SIZE,{width:2100,height:1200,pageWidth:1050});assert.equal(bookChapters.length,6);
 for(let i=0;i<6;i++){const c=bookChapters[i];for(const key of ['id','title','href'])assert.equal(c[key],profiles[i][key]);for(const key of ['id','title','displayTitle','role','module','summary','body','excerpt','href'])assert.equal(c[key],bookEditorialChapters[i][key]);assert.equal(c.image,`/assets/book-pages/medical-${String(i+1).padStart(2,'0')}-${c.id}.webp`);assert.equal(c.illustration,`/assets/book-pages/medical-${c.id}-art.webp`);assert.equal(c.index,i+1);assert.ok(Object.isFrozen(c));assert.equal(c.artType,'original-editorial-illustration');assert.equal('secondaryImage'in c,false);}
 assert.match(bookChapters[5].excerpt,/Mentor IA: inteligência artificial/);assert.match(bookChapters[5].excerpt,/Ultra: acompanhamento humano/);assert.match(bookChapters[5].excerpt,/45 minutos/);
 const source=fs.readFileSync(new URL('./book-art.js',import.meta.url),'utf8');assert.doesNotMatch(source,/\/assets\/tiles\/|\/assets\/acompanhamento|https?:\/\//);
});

test('illustration containment preserves the original image aspect',()=>{for(const[w,h]of[[1659,948],[1024,1536],[1000,1000]]){const b={x:0,y:0,width:2100,height:1200},r=containBookImage({width:w,height:h},b);assert.ok(r.x>=0&&r.y>=0);assert.ok(r.x+r.width<=2100+.01&&r.y+r.height<=1200+.01);assert.ok(Math.abs(r.width/r.height-w/h)<1e-12);}assert.equal(containBookImage({},{}),null);});

test('seven spreads expose fresh opaque background and separate alpha art/type layers',async()=>{
 const env=canvasDocument(),loaded=[],sources=[];const art=await createBookArt({document:env.doc,imageLoader:src=>{sources.push(src);const img=image();loaded.push(img);return Promise.resolve(img);}});
 try{const outputs=[];for(let index=0;index<=6;index++){
  const layers=await art.loadLayers(index);outputs.push(layers);assert.deepEqual(Object.keys(layers),['background','illustration','type']);
  for(const[name,canvas]of Object.entries(layers)){assert.equal(canvas.width,2100);assert.equal(canvas.height,1200);assert.equal(canvas.bookArtInfo.index,index);assert.equal(canvas.bookArtInfo.layer,name);assert.equal(canvas.bookArtInfo.artType,'original-editorial-illustration');assert.equal(canvas.moveFactor,name==='illustration'?.06:0);assert.equal(canvas.contextOptions.alpha,name!=='background');}
  assert.equal(layers.background.calls.filter(c=>c.kind==='image').length,0);assert.equal(layers.type.calls.filter(c=>c.kind==='image').length,0);
  const draws=layers.illustration.calls.filter(c=>c.kind==='image');assert.equal(draws.length,1);assert.equal(draws[0].args.length,5,'full image, no screenshot crop');assert.ok(layers.background.calls.some(c=>c.kind===(index===0?'vector':'text')));const mark=(index===0?layers.background:layers.type).calls.filter(c=>c.kind==='vector');assert.equal(mark.length,1,'one selected vector signature per spread');assert.equal(mark[0].rule,'evenodd');assert.ok(mark[0].bounds.left>=0&&mark[0].bounds.right<=2100);assert.ok(mark[0].bounds.top>=0&&mark[0].bounds.bottom<=1200);assert.ok(layers.type.calls.some(c=>c.kind==='text'));
  for(const c of layers.type.calls.filter(c=>c.kind==='text')){assert.ok(c.x>=0&&c.x<=2100);assert.ok(c.y>=0&&c.y<=1200);assert.ok(c.align==='right'||c.x+c.width<=2020,`caption overflow ${index}: ${c.text}`);}
 }
 const fresh=await art.loadLayers(1);assert.notEqual(fresh.background,outputs[1].background);assert.equal(sources.length,8);assert.ok(sources.every(src=>/^\/assets\/book-pages\/medical-[a-z]+-art\.webp$/.test(src)));assert.ok(loaded.every(i=>i.closed===1));
 }finally{art.dispose();}
});

test('flattened fallback draws layers in order and releases only its own intermediate canvases',async()=>{
 const env=canvasDocument(),art=await createBookArt({document:env.doc,imageLoader:goodLoader});try{
 const borrowed=await art.loadLayers(2),flat=await art.loadSpread(2);assert.equal(flat.width,2100);assert.equal(flat.height,1200);assert.equal(flat.bookArtInfo.layer,'flattened');
 const draws=flat.calls.filter(c=>c.kind==='image');assert.deepEqual(draws.map(c=>c.args[0].bookArtInfo.layer),['background','illustration','type']);assert.ok(draws.every(c=>c.args[0].width===1&&c.args[0].height===1));
 assert.ok(Object.values(borrowed).every(c=>c.width===2100&&c.height===1200));art.dispose();assert.equal(flat.width,2100,'caller owns successful outputs after dispose');assert.equal(borrowed.type.width,2100);
 }finally{art.dispose();}
});

test('unavailable art rejects retryably without creating or caching blank layers',async()=>{
 const env=canvasDocument();let works=false;const art=await createBookArt({document:env.doc,imageLoader:()=>works?goodLoader():Promise.reject(new Error('offline'))});try{
 await assert.rejects(art.loadLayers(2),e=>e.name==='BookArtAssetError'&&e.retryable&&e.source.endsWith('/medical-direcao-art.webp'));assert.equal(env.canvases.length,0);works=true;assert.equal((await art.loadLayers(2)).illustration.width,2100);
 }finally{art.dispose();}
});

test('dispose aborts pending work, releases late images, and forbids new requests',async()=>{
 const env=canvasDocument();let resolvePending,signal;const art=await createBookArt({document:env.doc,imageLoader:(src,options)=>{signal=options.signal;return new Promise(resolve=>{resolvePending=resolve;});}});
 const pending=art.loadLayers(6);await new Promise(resolve=>setImmediate(resolve));art.dispose();await assert.rejects(pending,{name:'AbortError'});assert.equal(signal.aborted,true);const late=image();resolvePending(late);await new Promise(resolve=>setImmediate(resolve));assert.equal(late.closed,1);assert.equal(env.canvases.length,0);await assert.rejects(art.loadSpread(0),{name:'AbortError'});art.dispose();
});

test('invalid art dimensions reject retryably and release decoded image',async()=>{const env=canvasDocument(),bad=image(0,0),art=await createBookArt({document:env.doc,imageLoader:()=>Promise.resolve(bad)});try{await assert.rejects(art.loadLayers(1),e=>e.name==='BookArtAssetError'&&e.retryable);assert.equal(bad.closed,1);assert.equal(env.canvases.length,0);}finally{art.dispose();}});

test('three local Roobert faces have isolated lifecycle ownership',async()=>{const env=canvasDocument({fontFaces:true}),art=await createBookArt({document:env.doc,imageLoader:goodLoader});assert.deepEqual(env.faceSources,['url("/assets/Roobert-Regular.woff2")','url("/assets/Roobert-Medium.woff2")','url("/assets/Roobert-SemiBold.woff2")']);assert.equal(env.fonts.length,3);art.dispose();assert.deepEqual(env.removed,env.fonts);});

test('out-of-order requests work, invalid indices reject, and prose wrapping preserves words',async()=>{const env=canvasDocument(),art=await createBookArt({document:env.doc,imageLoader:goodLoader});try{for(const i of[6,2,0,4])assert.equal((await art.loadLayers(i)).background.bookArtInfo.index,i);for(const i of[-1,7,.5,'2',NaN])await assert.rejects(art.loadLayers(i),RangeError);const ctx=env.canvases[0].getContext('2d',{}),text='Um próximo passo de cada vez.';assert.equal(wrapBookText(ctx,text,70).join(' '),text);}finally{art.dispose();}});

test('context failure releases allocated pixels and transient image',async()=>{const env=canvasDocument({missingContext:true}),img=image(),art=await createBookArt({document:env.doc,imageLoader:()=>Promise.resolve(img)});try{await assert.rejects(art.loadLayers(1),/Canvas2D unavailable/);assert.equal(env.canvases[0].width,1);assert.equal(img.closed,1);}finally{art.dispose();}});

test('slow art has a bounded ten-second retryable deadline',async()=>{const env=canvasDocument(),art=await createBookArt({document:env.doc,imageLoader:()=>new Promise(()=>{})});const start=Date.now();try{await assert.rejects(art.loadLayers(1),e=>e.name==='BookArtAssetError'&&e.retryable);assert.ok(Date.now()-start>=9900&&Date.now()-start<11500);assert.equal(env.canvases.length,0);}finally{art.dispose();}});

test('caption ink meets 4.5:1 contrast against every reserved paper zone',()=>{
 const luminance=hex=>{const channels=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;};
 for(const c of bookChapters){const a=luminance(c.palette.caption),b=luminance(c.palette.paper),contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert.ok(contrast>=4.5,`${c.title}: ${contrast}`);}
});


test('display accents stay above the Orientação caption zone without dropping the glyph',async()=>{
 const env=canvasDocument(),art=await createBookArt({document:env.doc,imageLoader:goodLoader});try{const layers=await art.loadLayers(6),letters=layers.background.calls.filter(c=>c.kind==='text');const cedilla=letters.find(c=>c.text==='Ç');assert.ok(cedilla,'accented chapter letter preserved');assert.ok(cedilla.bounds.bottom<795,`cedilla reaches caption: ${cedilla.bounds.bottom}`);for(const c of letters){assert.ok(c.bounds.top>=0,`${c.text} clipped above spread`);if(c.bounds.right>1370)assert.ok(c.bounds.bottom<795,`${c.text} overlaps caption zone`);}}finally{art.dispose();}
});

test('all served illustrations and semantic fallback spreads resolve locally as WebP assets',()=>{
 const paths=[bookCover.image,...bookChapters.flatMap(c=>[c.image,c.illustration])];
 for(const path of paths){const data=fs.readFileSync(new URL(`..${path}`,import.meta.url));assert.equal(data.subarray(0,4).toString(),'RIFF',path);assert.equal(data.subarray(8,12).toString(),'WEBP',path);assert.ok(data.length>10000,path);}
});


test('medical editorial titles, truthful concepts and wine/cream palette are explicit',()=>{
 assert.equal(bookCover.title,'Sua formação médica, por inteiro.');
 assert.deepEqual(bookChapters.map(c=>c.displayTitle),['ROTINA','TRAJETÓRIA','OPORTUNIDADES','PESQUISA','LIGAS','ORIENTAÇÃO']);
 const terms=[/anatomia/i,/residência/i,/congressos.*fonte/i,/15 etapas.*Entender.*Aplicar.*Validar.*Entregar/i,/ligas.*simulação/i,/Mentor IA.*inteligência artificial.*Ultra.*humano.*45 minutos/i];
 for(let i=0;i<6;i++){const c=bookChapters[i];assert.match(c.body,terms[i]);assert.equal(c.palette.light,'#f3eee6');assert.equal(c.palette.caption,'#f3eee6');assert.equal(c.palette.accent,'#d7a5b7');assert.match(c.palette.paper,/^#[4-6][0-9a-f][2-3][0-9a-f][3-4][0-9a-f]$/);}
 assert.match(bookChapters[3].excerpt,/15 etapas, em um ciclo de Entender, Aplicar, Validar e Entregar/);assert.match(bookCover.status,/PRÉ-LANÇAMENTO/);
});

test('art-only revision preserves loader, layer ownership, move factors and lifecycle implementation',()=>{
 const source=fs.readFileSync(new URL('./book-art.js',import.meta.url),'utf8'),runtime=source.slice(source.indexOf('export async function createBookArt'));
 assert.equal(createHash('sha256').update(runtime).digest('hex'),'4cc53b223b6714ef44ce27351d87dff3f7571fce4ae2e95d446f55e8e738ba86');
});

test('approved Rotina text stays exact while other chapters use concise grounded benefit language',()=>{
 assert.equal(bookChapters[0].summary,'Entre anatomia, aulas e revisões, reconheça o que pede atenção hoje.');
 assert.equal(bookChapters[0].excerpt,'O Hoje aproxima prioridades e próximos passos para organizar o estudo e os compromissos da formação médica.');
 assert.equal(bookChapters[0].body,'A formação médica reúne aulas, anatomia, revisões e compromissos. O Hoje propõe aproximar prioridades e próximos passos para organizar a atenção, sem perder de vista o percurso de formação.');
 for(const chapter of bookChapters.slice(1))assert.doesNotMatch(chapter.body,/propõe|propõem|a proposta/i);
 assert.ok(bookChapters[5].body.length<=260);
});

test('wide research and human-guidance scenes reserve more clear caption space without modifying layer geometry',async()=>{
 const env=canvasDocument(),art=await createBookArt({document:env.doc,imageLoader:goodLoader});try{
  for(const index of[4,6]){const layers=await art.loadLayers(index),draw=layers.illustration.calls.find(c=>c.kind==='image');const[,x,y,width,height]=draw.args;assert.equal(width,1800);assert.equal(x,index===6?-190:-130);assert.ok(Math.abs(y+height-1200)<1e-8);assert.equal(layers.illustration.width,2100);assert.equal(layers.illustration.moveFactor,.06);}
 }finally{art.dispose();}
});
