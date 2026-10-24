import { bookEditorialChapters, bookCover } from './book-editorial.js';
import { drawWordmark, WORDMARK_VIEWBOX } from './wordmark.js';

/** Original medical editorial book: no product screenshots or reference artwork. */
export const BOOK_ART_SIZE=Object.freeze({width:2100,height:1200,pageWidth:1050});
const WINE_PAPERS=['#542a37','#572335','#633443','#4b2434','#5d2e3d','#502738'];
export const bookChapters=Object.freeze(bookEditorialChapters.map((chapter,index)=>Object.freeze({
 ...chapter,
 image:`/assets/book-pages/medical-${String(index+1).padStart(2,'0')}-${chapter.id}.webp`,
 illustration:`/assets/book-pages/medical-${chapter.id}-art.webp`,
 index:index+1,palette:Object.freeze({paper:WINE_PAPERS[index],ink:'#d7a5b7',light:'#f3eee6',accent:'#d7a5b7',caption:'#f3eee6'}),
 artType:'original-editorial-illustration'
})));
const W=2100,H=1200,P=1050,FONT_TIMEOUT=1800,IMAGE_TIMEOUT=10000;
const abortError=()=>Object.assign(new Error('Book artwork disposed'),{name:'AbortError'});
function bounded(promise,milliseconds,signal){return new Promise((resolve,reject)=>{let finished=false,timer;const done=(fn,value)=>{if(finished)return;finished=true;clearTimeout(timer);signal?.removeEventListener?.('abort',onAbort);fn(value);};const onAbort=()=>done(reject,abortError());if(signal?.aborted){onAbort();return;}signal?.addEventListener?.('abort',onAbort,{once:true});timer=setTimeout(()=>done(reject,new Error('Book asset deadline exceeded')),milliseconds);Promise.resolve(promise).then(value=>done(resolve,value),error=>done(reject,error));});}
function defaultImageLoader(doc,src,{signal}={}){return new Promise((resolve,reject)=>{const img=doc.createElement('img');let settled=false;const clean=()=>{img.onload=null;img.onerror=null;signal?.removeEventListener?.('abort',onAbort);};const fail=error=>{if(settled)return;settled=true;clean();img.removeAttribute?.('src');reject(error);};const onAbort=()=>fail(abortError());if(signal?.aborted){onAbort();return;}img.decoding='async';img.onload=()=>{if(settled)return;settled=true;clean();resolve(img);};img.onerror=()=>fail(new Error('Book illustration unavailable'));signal?.addEventListener?.('abort',onAbort,{once:true});img.src=src;});}
function releaseImage(image){try{image?.close?.();image?.removeAttribute?.('src');}catch{}}
function releaseCanvas(canvas){if(canvas){canvas.width=1;canvas.height=1;}}
function font(ctx,family,size,weight=400){ctx.font=`${weight} ${size}px "${family}", Arial, sans-serif`;}
export function wrapBookText(ctx,text,maxWidth){const words=String(text).split(/\s+/).filter(Boolean),lines=[];let line='';for(const word of words){const next=line?`${line} ${word}`:word;if(line&&ctx.measureText(next).width>maxWidth){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;}
function paragraph(ctx,family,text,x,y,width,size=29,leading=38){font(ctx,family,size);const lines=wrapBookText(ctx,text,width);lines.forEach((line,i)=>ctx.fillText(line,x,y+i*leading));return lines;}
function seedRandom(seed){let v=seed>>>0;return()=>{v=(1664525*v+1013904223)>>>0;return v/4294967296;};}
function grain(ctx,seed=1){const rnd=seedRandom(seed);ctx.save();for(let i=0;i<18000;i++){const x=rnd()*W,y=rnd()*H;ctx.globalAlpha=.018+rnd()*.045;ctx.fillStyle=i%3?'#321c28':'#f3eee6';const s=.5+rnd()*2.6;ctx.fillRect(x,y,s,s*.6);}ctx.globalAlpha=.06;ctx.strokeStyle='#d7a5b7';ctx.lineWidth=.65;for(let i=0;i<270;i++){const x=rnd()*W,y=rnd()*H;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+2+rnd()*11,y+rnd()*2);ctx.stroke();}ctx.restore();}
function display(ctx,family,word,{x=95,y=855,width=1910,size=610,color='#f3eee6',seed=1}={}){
 const chars=[...word.toLocaleUpperCase('pt-BR')];font(ctx,family,size,600);const natural=chars.map(c=>ctx.measureText(c).width),total=natural.reduce((a,b)=>a+b,0),sx=width/total,rnd=seedRandom(seed);let cursor=x;ctx.fillStyle=color;
 chars.forEach((c,i)=>{const w=natural[i]*sx;ctx.save();ctx.translate(cursor+w/2,y+(rnd()-.5)*24);ctx.rotate((rnd()-.5)*.035);ctx.scale(sx,1.12+(rnd()-.5)*.06);ctx.fillText(c,-natural[i]/2,0);ctx.restore();cursor+=w;});
}
export function containBookImage(image,box){const width=Number(image?.naturalWidth||image?.width)||0,height=Number(image?.naturalHeight||image?.height)||0;if(width<=0||height<=0)return null;const scale=Math.min(box.width/width,box.height/height),w=width*scale,h=height*scale;return{x:box.x+(box.width-w)/2,y:box.y+(box.height-h)/2,width:w,height:h};}
function paintBackground(ctx,family,index){
 if(index===0){ctx.fillStyle='#4b2434';ctx.fillRect(0,0,W,H);ctx.fillStyle='#542a37';ctx.fillRect(P,0,P,H);drawWordmark(ctx,{x:1130,y:230+(300-857*WORDMARK_VIEWBOX.height/WORDMARK_VIEWBOX.width)/2,width:857,fill:'#f3eee6'});}
 else{const chapter=bookChapters[index-1];ctx.fillStyle=chapter.palette.paper;ctx.fillRect(0,0,W,H);display(ctx,family,chapter.displayTitle,{x:60,y:index===6?620:(index===2?695:675),width:1980,color:chapter.palette.light,seed:index,size:index===6?570:650});}
 grain(ctx,index*541+82);
}
function paintIllustration(ctx,image,index){
 const box=index===0?{x:1080,y:390,width:1500,height:857}:index===4||index===6?{x:index===6?-190:-130,y:1200-1800/1.75,width:1800,height:1800/1.75}:{x:index===1||index===2?-160:-80,y:60,width:1995,height:1140};
 const rect=containBookImage(image,box);if(!rect)throw new Error('Invalid illustration dimensions');
 ctx.save();if(index===0){ctx.beginPath();ctx.rect(P,0,P,H);ctx.clip();}ctx.drawImage(image,rect.x,rect.y,rect.width,rect.height);ctx.restore();
}
function paintType(ctx,family,index){
 if(index===0){
  ctx.fillStyle='#f3eee6';font(ctx,family,25);ctx.fillText(bookCover.eyebrow,1152,100);font(ctx,family,37,600);ctx.fillText('',1940,100);
  font(ctx,family,39,500);ctx.fillText(bookCover.title,1148,174);
  ctx.fillStyle='#f3eee6';font(ctx,family,27);ctx.fillText(bookCover.backSummary,100,1059);font(ctx,family,20);ctx.fillText(bookCover.status,100,1122);
 }else{
  const chapter=bookChapters[index-1],p=chapter.palette;
  // Text remains anchored and never parallax-shifts with the pictured world.
  ctx.fillStyle=p.caption;paragraph(ctx,family,chapter.summary,1410,846,585,32,40);paragraph(ctx,family,chapter.excerpt,1410,985,585,26,34);
  const markWidth=20*WORDMARK_VIEWBOX.width/WORDMARK_VIEWBOX.height;drawWordmark(ctx,{x:1410,y:1120,width:markWidth,fill:p.caption});
  font(ctx,family,20,500);ctx.fillText(`/ ${chapter.module.toLocaleUpperCase('pt-BR')}`,1410+markWidth+12,1140);ctx.textAlign='right';ctx.fillText(`${String(chapter.index).padStart(2,'0')}`,1995,1140);ctx.textAlign='left';
 }
}
/**
 * Layer order: background (includes fixed display lettering), illustration, type.
 * Each canvas is fresh/caller-owned. Image refs are transient; no internal cache.
 * Image errors reject retryably, never cache an empty illustration permanently.
 */
export async function createBookArt({document:providedDocument,imageLoader}={}){
 const doc=providedDocument||globalThis.document;if(!doc?.createElement)throw new Error('Book artwork requires a document');let disposed=false,family='Roobert';const ownedFonts=[],active=new Set();
 const Font=doc.defaultView?.FontFace||globalThis.FontFace;
 if(Font&&doc.fonts?.add){const faces=[['Regular',400],['Medium',500],['SemiBold',600]].map(([name,weight])=>new Font('InnectaBookRoobert',`url("/assets/Roobert-${name}.woff2")`,{weight:String(weight),style:'normal'}));try{await bounded(Promise.all(faces.map(face=>face.load())),FONT_TIMEOUT);faces.forEach(face=>{doc.fonts.add(face);ownedFonts.push(face);});family='InnectaBookRoobert';}catch{}}
 else if(doc.fonts?.load){try{await bounded(Promise.all([doc.fonts.load('400 31px Roobert'),doc.fonts.load('600 610px Roobert')]),FONT_TIMEOUT);}catch{}}
 const loader=imageLoader||((src,options)=>defaultImageLoader(doc,src,options));
 function makeCanvas(alpha=true){const canvas=doc.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d',{alpha});if(!ctx){releaseCanvas(canvas);throw new Error('Canvas2D unavailable');}ctx.textBaseline='alphabetic';ctx.textAlign='left';return{canvas,ctx};}
 const api={
  async loadLayers(index){
   if(disposed)throw abortError();if(!Number.isInteger(index)||index<0||index>6)throw new RangeError('Book spread index must be 0–6');
   const controller=new AbortController(),surfaces=[];active.add(controller);let image;
   const src=bookChapters[Math.max(0,index-1)].illustration;
   try{
    const request=Promise.resolve().then(()=>loader(src,{signal:controller.signal}));request.then(value=>{if(controller.signal.aborted)releaseImage(value);},()=>{});
    try{image=await bounded(request,IMAGE_TIMEOUT,controller.signal);if(!containBookImage(image,{x:0,y:0,width:1,height:1}))throw new Error('Invalid illustration dimensions');}
    catch(error){if(disposed)throw abortError();throw Object.assign(new Error('Book illustration temporarily unavailable'),{name:'BookArtAssetError',retryable:true,source:src,cause:error});}
    if(disposed)throw abortError();
    const background=makeCanvas(false);surfaces.push(background.canvas);const illustration=makeCanvas(true);surfaces.push(illustration.canvas);const type=makeCanvas(true);surfaces.push(type.canvas);
    paintBackground(background.ctx,family,index);paintIllustration(illustration.ctx,image,index);paintType(type.ctx,family,index);
    const meta={index,width:W,height:H,chapter:index?bookChapters[index-1].id:null,imagesDrawn:1,imagesExpected:1,artType:'original-editorial-illustration'};
    for(const [name,surface,moveFactor] of [['background',background,0],['illustration',illustration,.06],['type',type,0]]){surface.canvas.bookArtInfo={...meta,layer:name};surface.canvas.moveFactor=moveFactor;}
    return{background:background.canvas,illustration:illustration.canvas,type:type.canvas};
   }catch(error){surfaces.forEach(releaseCanvas);throw error;}finally{controller.abort();active.delete(controller);releaseImage(image);}
  },
  async loadSpread(index){const layers=await api.loadLayers(index);let flat;try{if(disposed)throw abortError();flat=makeCanvas(false);flat.ctx.drawImage(layers.background,0,0);flat.ctx.drawImage(layers.illustration,0,0);flat.ctx.drawImage(layers.type,0,0);flat.canvas.bookArtInfo={...layers.background.bookArtInfo,layer:'flattened'};return flat.canvas;}catch(error){releaseCanvas(flat?.canvas);throw error;}finally{Object.values(layers).forEach(releaseCanvas);}},
  dispose(){if(disposed)return;disposed=true;active.forEach(controller=>controller.abort());active.clear();ownedFonts.forEach(face=>doc.fonts?.delete?.(face));ownedFonts.length=0;}
 };
 return api;
}
