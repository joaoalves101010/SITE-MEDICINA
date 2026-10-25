import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash, webcrypto} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {BASE_COVER, validateManifest, canAdvance, createCoverController, createCoverStorage, startCoverPreview, REFRESH_MS, MAX_COVER_BYTES} from '../js/times-cover-live.js';

const ORIGIN='https://themedtimes.vercel.app';
const NOW=new Date('2026-10-27T12:00:00.000Z');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const copy=value=>structuredClone(value);
const bytesFor=(edition='005',suffix='')=>new TextEncoder().encode(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1480" viewBox="0 0 1000 1480"><title>THE MED TIMES edição ${edition}</title><rect width="1000" height="1480" fill="white"/><path d="M 0 0 L 1 1"/>${suffix}</svg>`);
function manifestFor({editionId='005',date='2026-10-26',bytes=bytesFor(editionId)}={}){
 const digest=sha(bytes);
 return {schemaVersion:1,editionId,date,image:{path:`assets/edition-covers/edition-${editionId}-${digest}.svg`,sha256:digest,width:1000,height:1480},label:'Prévia editorial · composição vetorial da edição publicada',credits:['Autora da fotografia 005 · CC BY 4.0 · https://commons.wikimedia.org/wiki/Example','A imagem desta edição não indica endosso da autora.']};
}
function currentManifest(){return {...manifestFor({editionId:'004',date:'2026-10-25'}),image:{...BASE_COVER.image,path:`assets/edition-covers/edition-004-${BASE_COVER.image.sha256}.svg`}};}
function response(value,url,type='application/json',options={}){
 const body=typeof value==='string'||value instanceof Uint8Array?value:JSON.stringify(value);
 const res=new Response(body,{status:options.status??200,headers:{'Content-Type':type,...options.headers}});
 Object.defineProperty(res,'url',{value:url});
 if(options.redirected)Object.defineProperty(res,'redirected',{value:true});
 return res;
}
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
const tick=()=>new Promise(resolve=>setImmediate(resolve));

class Element{
 constructor(tag,ownerDocument){this.tagName=tag.toUpperCase();this.nodeName=this.tagName;this.ownerDocument=ownerDocument;this.attributesMap=new Map();this.children=[];this.parentNode=null;this._text='';this.events=new Map();this.style={};this.dataset=new Proxy({},{get:(_,key)=>this.getAttribute('data-'+String(key).replace(/[A-Z]/g,x=>'-'+x.toLowerCase()))??undefined,set:(_,key,value)=>{this.setAttribute('data-'+String(key).replace(/[A-Z]/g,x=>'-'+x.toLowerCase()),value);return true;}});this.classList={contains:value=>this.className.split(/\s+/).includes(value),add:(...values)=>{this.className=[...new Set([...this.className.split(/\s+/).filter(Boolean),...values])].join(' ');}};}
 setAttribute(key,value){this.attributesMap.set(key,String(value));}
 getAttribute(key){return this.attributesMap.has(key)?this.attributesMap.get(key):null;}
 removeAttribute(key){this.attributesMap.delete(key);}
 hasAttribute(key){return this.attributesMap.has(key);}
 get attributes(){return [...this.attributesMap].map(([name,value])=>({name,value}));}
 get className(){return this.getAttribute('class')||'';} set className(value){this.setAttribute('class',value);}
 get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}set textContent(value){for(const child of this.children)child.parentNode=null;this.children=[];this._text=String(value);}
 get innerHTML(){throw Error('Network HTML must not be read or injected');}set innerHTML(_){throw Error('Network HTML must not be injected');}
 get href(){return this.getAttribute('href')||'';}set href(value){this.setAttribute('href',value);}
 get target(){return this.getAttribute('target')||'';}set target(value){this.setAttribute('target',value);}
 get rel(){return this.getAttribute('rel')||'';}set rel(value){this.setAttribute('rel',value);}
 get alt(){return this.getAttribute('alt')||'';}set alt(value){this.setAttribute('alt',value);}
 get width(){return Number(this.getAttribute('width'));}set width(value){this.setAttribute('width',value);}
 get height(){return Number(this.getAttribute('height'));}set height(value){this.setAttribute('height',value);}
 get src(){return this.getAttribute('src')||'';}set src(value){this.setAttribute('src',value);}
 get firstElementChild(){return this.children[0]||null;}get firstChild(){return this.children[0]||null;}get childNodes(){return this.children;}get parentElement(){return this.parentNode;}
 get isConnected(){return !!this.parentNode||this===this.ownerDocument?.root;}
 append(...nodes){for(const node of nodes)this.appendChild(typeof node==='string'?this.ownerDocument.createTextNode(node):node);}
 appendChild(node){if(node.parentNode)node.parentNode.removeChild(node);this.children.push(node);node.parentNode=this;return node;}
 removeChild(node){const i=this.children.indexOf(node);assert.ok(i>=0);this.children.splice(i,1);node.parentNode=null;return node;}
 replaceChildren(...nodes){for(const node of this.children)node.parentNode=null;this.children=[];this._text='';this.append(...nodes);}
 replaceChild(next,old){const i=this.children.indexOf(old);assert.ok(i>=0);if(next.parentNode)next.parentNode.removeChild(next);this.children[i]=next;next.parentNode=this;old.parentNode=null;this.ownerDocument.replacements.push({parent:this,old,next,snapshot:this.ownerDocument.rootSnapshot()});return old;}
 replaceWith(next){if(this.parentNode)this.parentNode.replaceChild(next,this);}
 remove(){this.parentNode?.removeChild(this);}
 contains(other){return this===other||this.children.some(child=>child.contains(other));}
 getBoundingClientRect(){return {height:this.classList.contains('times-editorial-photo-notice')?48:0,width:500};}
 closest(selector){let current=this;while(current){if(current.matches(selector))return current;current=current.parentNode;}return null;}
 matches(selector){if(selector.startsWith('#'))return this.getAttribute('id')===selector.slice(1);if(selector.startsWith('.'))return this.classList.contains(selector.slice(1));if(selector.startsWith('[')){const [key,value]=selector.slice(1,-1).split('=');return value?this.getAttribute(key)===value.replace(/^['"]|['"]$/g,''):this.hasAttribute(key);}return this.tagName===selector.toUpperCase();}
 querySelectorAll(selector){const last=selector.trim().split(/[ >]+/).at(-1);const results=[];for(const child of this.children){if(child.matches(last))results.push(child);results.push(...child.querySelectorAll(last));}return results;}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
 cloneNode(deep=false){const clone=new Element(this.tagName,this.ownerDocument);for(const [key,value]of this.attributesMap)clone.setAttribute(key,value);clone._text=this._text;if(deep)for(const child of this.children)clone.appendChild(child.cloneNode(true));return clone;}
 addEventListener(type,listener){const listeners=this.events.get(type)||[];listeners.push(listener);this.events.set(type,listeners);}
 removeEventListener(type,listener){this.events.set(type,(this.events.get(type)||[]).filter(x=>x!==listener));}
 dispatchEvent(event){for(const listener of this.events.get(event.type)||[])listener(event);}
 focus(options){this.ownerDocument.activeElement=this;this.ownerDocument.focusOptions=options;}
}
class FakeDocument{
 constructor(){this.replacements=[];this.root=new Element('main',this);this.body=this.root;this.documentElement=this.root;this.activeElement=null;this.visibilityState='visible';this.hidden=false;this.events=new Map();}
 createElement(tag){return new Element(tag,this);}createTextNode(text){const node=new Element('#text',this);node.textContent=text;return node;}createDocumentFragment(){return new Element('#fragment',this);}
 querySelector(selector){return this.root.querySelector(selector);}querySelectorAll(selector){return this.root.querySelectorAll(selector);}
 addEventListener(type,listener){this.events.set(type,listener);}removeEventListener(type,listener){if(this.events.get(type)===listener)this.events.delete(type);}
 rootSnapshot(){const figure=this.root.querySelector('.times-editorial-paper');return figure?snapshot(figure):null;}
}
function node(doc,tag,attrs={},text=''){const el=doc.createElement(tag);for(const [key,value]of Object.entries(attrs))el.setAttribute(key,value);if(text)el.textContent=text;return el;}
function initialFigure(doc){
 const figure=node(doc,'figure',{'class':'times-editorial-paper','data-times-preview-edition':'004','data-times-preview-date':'2026-10-25'});
 const link=node(doc,'a',{'class':'times-editorial-paper-link','href':ORIGIN+'/','target':'_blank','rel':'noopener noreferrer','aria-label':'Prévia da edição 004, de 25 de outubro de 2026.'});
 link.append(node(doc,'img',{'class':'times-editorial-frontpage','src':'/assets/the-med-times-frontpage-004.svg','width':1000,'height':1480,'alt':'THE MED TIMES: capa completa da edição 004, de 25 de outubro de 2026.','loading':'lazy','decoding':'async'}));
 const caption=node(doc,'figcaption',{'class':'times-editorial-paper-caption'});
 caption.append(node(doc,'span',{},'Prévia da edição 004 · 25/10/2026'),node(doc,'a',{'class':'times-editorial-credits','href':'/assets/the-med-times-frontpage-004-credits.txt','target':'_blank','rel':'noopener noreferrer'},'Créditos da prévia'),node(doc,'p',{'class':'times-editorial-photo-notice'},'Foto do Aedes: fonte gratuita CDC/PHIL. O uso desta imagem não implica endosso do CDC, HHS ou governo dos Estados Unidos ao THE MED TIMES.'));
 figure.append(link,caption);doc.root.append(figure);return figure;
}
function snapshot(figure){return {edition:figure.dataset.timesPreviewEdition,date:figure.dataset.timesPreviewDate,src:figure.querySelector('.times-editorial-frontpage')?.src,alt:figure.querySelector('.times-editorial-frontpage')?.alt,caption:figure.querySelector('.times-editorial-paper-caption')?.textContent,creditsURL:figure.querySelector('.times-editorial-credits')?.href,notice:figure.querySelector('.times-editorial-photo-notice')?.textContent,width:figure.querySelector('.times-editorial-frontpage')?.width,height:figure.querySelector('.times-editorial-frontpage')?.height};}
function harness(options={}){
 const doc=new FakeDocument(),figure=initialFigure(doc),requests=[],blobs=new Map(),revoked=[],writes=[];
 let serial=0,fetchImpl=options.fetchImpl,activeImages=[];
 class FakeImage extends Element{
  constructor(){super('img',doc);this.naturalWidth=options.naturalWidth??1000;this.naturalHeight=options.naturalHeight??1480;this.complete=false;activeImages.push(this);}
  set src(value){super.src=value;queueMicrotask(()=>{this.complete=true;if(options.imageError){this.onerror?.(new Error('Image failed'));this.dispatchEvent({type:'error'});}else{this.onload?.();this.dispatchEvent({type:'load'});}});}
  get src(){return super.src;}
  async decode(){if(options.decodeGate)await options.decodeGate.promise;if(options.decodeError||options.imageError)throw Error('Decode failed');}
 }
 class SafeURL extends URL{}
 SafeURL.createObjectURL=blob=>{const url=`blob:https://landing.example/${++serial}`;blobs.set(url,blob);return url;};
 SafeURL.revokeObjectURL=url=>revoked.push(url);
 const defaultFetch=async url=>url===ORIGIN+'/edition-cover.json'?response(options.manifest||manifestFor(),url):response(options.bytes||bytesFor(),url,'image/svg+xml');
 const env={document:doc,Image:FakeImage,crypto:webcrypto,URL:SafeURL,Blob,TextDecoder,TextEncoder,AbortController,setTimeout,clearTimeout,fetch:async(url,init)=>{requests.push({url,init});return (fetchImpl||defaultFetch)(url,init);},addEventListener(){},removeEventListener(){}};
 const storage=options.storage??{async read(){return options.record??null;},async write(record){writes.push(record);if(options.quota)throw Error('Quota exceeded');}};
 const controller=createCoverController({figure,env,storage,now:()=>NOW.toISOString().slice(0,10)});
 return {doc,figure,requests,blobs,revoked,writes,activeImages,env,controller,get visible(){return doc.root.querySelector('.times-editorial-paper');},setFetch(fn){fetchImpl=fn;}};
}

// Validation exercises actual consumer code, not duplicate test-side validation.
test('strict v1 manifest accepts an approved portrait and rejects invalid shapes and future dates',()=>{
 const good=manifestFor();assert.equal(validateManifest(good,{today:'2026-10-27'}).editionId,'005');
 const invalid=[null,[],{}, {...good,schemaVersion:2},{...good,unexpected:true},{...good,editionId:5},{...good,editionId:'5'},{...good,editionId:'00x'},{...good,date:'2026-02-30'},{...good,date:'2026-1-01'},{...good,date:'2026-10-28'},{...good,label:''},{...good,label:'x'.repeat(161)},{...good,credits:[]},{...good,credits:['x'.repeat(1001)]},{...good,credits:Array(11).fill('x')},{...good,credits:[{}]},{...good,image:{...good.image,unexpected:true}},{...good,image:{...good.image,width:999}},{...good,image:{...good.image,height:1481}},{...good,image:{...good.image,sha256:'x'.repeat(64)}}];
 for(const candidate of invalid)assert.throws(()=>validateManifest(candidate,{today:'2026-10-27'}),JSON.stringify(candidate));
});

test('cover path allows only the exact immutable filename under the fixed public journal origin',()=>{
 const good=manifestFor();
 for(const path of ['https://evil.example/paper.svg','https://127.0.0.1/paper.svg','//themedtimes.vercel.app/paper.svg','http://themedtimes.vercel.app/paper.svg','/assets/edition-covers/paper.svg','assets/edition-covers/../paper.svg','assets/edition-covers/%2e%2e/paper.svg',good.image.path+'?x=1',good.image.path+'#x',good.image.path.replace('edition-005','edition-004'),good.image.path.replace(good.image.sha256,'0'.repeat(64)),good.image.path.replace('.svg','.png')])assert.throws(()=>validateManifest({...good,image:{...good.image,path}},{today:'2026-10-27'}),path);
});

test('numeric edition and publication date both prevent regressions, while same-edition corrected art is eligible',()=>{
 const current=manifestFor();
 assert.equal(canAdvance(manifestFor({editionId:'006',date:'2026-10-27'}),current),true);
 assert.equal(canAdvance(manifestFor({editionId:'004',date:'2026-10-27'}),current),false);
 assert.equal(canAdvance(manifestFor({editionId:'006',date:'2026-10-25'}),current),false);
 assert.equal(canAdvance(manifestFor({editionId:'005',date:'2026-10-26',bytes:bytesFor('005','<!-- corrected -->')}),current),true);
});

test('unchanged approved004 is kept immediate and never fetched a second time',async()=>{
 const h=harness({manifest:currentManifest()});const before=snapshot(h.figure);
 assert.equal(await h.controller.refresh(),'unchanged');assert.deepEqual(snapshot(h.visible),before);assert.equal(h.requests.length,1);assert.equal(h.doc.replacements.length,0);h.controller.dispose();
});

test('005 is decoded off-DOM, then image, visible date, alt and edition-bound credits change together with fixed geometry',async()=>{
 const gate=deferred(),h=harness({decodeGate:gate});const before=snapshot(h.figure);const refresh=h.controller.refresh();
 for(let i=0;i<10&&h.activeImages.length===0;i++)await tick();
 assert.equal(h.activeImages.length,1);assert.deepEqual(snapshot(h.visible),before);assert.equal(h.doc.replacements.filter(x=>x.parent===h.doc.root).length,0);
 gate.resolve();assert.equal(await refresh,'updated');
 const after=snapshot(h.visible);assert.equal(after.edition,'005');assert.equal(after.date,'2026-10-26');assert.match(after.caption,/005.*26\/10\/2026/);assert.match(after.alt,/005/);assert.match(after.src,/^blob:/);assert.equal(after.width,1000);assert.equal(after.height,1480);assert.equal(h.visible.querySelector('.times-editorial-photo-notice').style.minHeight,'48px');assert.doesNotMatch(after.notice,/CDC|Harvard|HMS/);
 const paperLink=h.visible.querySelector('.times-editorial-paper-link'),creditsLink=h.visible.querySelector('.times-editorial-credits');
 assert.equal(paperLink.href,ORIGIN+'/');assert.equal(paperLink.target,'_blank');assert.equal(paperLink.rel,'noopener noreferrer');
 assert.match(paperLink.getAttribute('aria-label'),/edição 005, de 26 de outubro de 2026/);assert.doesNotMatch(paperLink.getAttribute('aria-label'),/004|25 de outubro/);
 assert.match(after.alt,/edição 005, de 26 de outubro de 2026/);assert.doesNotMatch(after.alt,/004|25 de outubro/);
 assert.match(creditsLink.getAttribute('aria-label'),/edição 005, de 26 de outubro de 2026/);assert.doesNotMatch(creditsLink.getAttribute('aria-label'),/004|25 de outubro/);
 assert.equal(h.visible.getAttribute('data-times-preview-edition'),'005');assert.equal(h.visible.getAttribute('data-times-preview-date'),'2026-10-26');assert.doesNotMatch(after.caption,/004|25\/10\/2026/);
 assert.equal(before.edition,'004');assert.equal(before.date,'2026-10-25');assert.match(before.caption,/004.*25\/10\/2026/);assert.match(before.notice,/CDC\/PHIL/);assert.match(before.notice,/não implica endosso/);
 const swaps=h.doc.replacements.filter(x=>x.parent===h.doc.root);assert.equal(swaps.length,1);assert.deepEqual(swaps[0].snapshot,after);
 assert.match(await h.blobs.get(after.creditsURL).text(),/Autora da fotografia 005/);assert.equal(h.writes.length,1);h.controller.dispose();
});

test('network requests revalidate manifest without credentials and reject redirects, with immutable bytes fetched separately',async()=>{
 const h=harness();assert.equal(await h.controller.refresh(),'updated');assert.equal(h.requests.length,2);
 for(const {url,init}of h.requests){assert.equal(new URL(url).origin,ORIGIN);assert.equal(init.credentials,'omit');assert.equal(init.redirect,'error');assert.ok(init.signal);}
 assert.equal(h.requests[0].init.cache,'no-cache');h.controller.dispose();
});

test('a failed subsequent fetch retains the exact last valid005 image and all metadata',async()=>{
 const h=harness();assert.equal(await h.controller.refresh(),'updated');const last=snapshot(h.visible);h.setFetch(async()=>{throw Error('Offline');});
 assert.equal(await h.controller.refresh(),'retained');assert.deepEqual(snapshot(h.visible),last);assert.equal(h.controller.current.editionId,'005');h.controller.dispose();
});

for(const [name,fetchImpl]of [
 ['offline',async()=>{throw Error('Offline');}],
 ['invalid JSON',async url=>response('{bad',url)],
 ['HTTP failure',async url=>response('{}',url,'application/json',{status:503})],
 ['wrong content type',async url=>response(manifestFor(),url,'text/html')],
 ['redirected manifest',async url=>response(manifestFor(),url,'application/json',{redirected:true})],
 ['unexpected response origin',async()=>response(manifestFor(),'https://127.0.0.1/edition-cover.json')],
 ['oversized manifest',async url=>response(' '.repeat(16385),url)],
 ['bad asset digest',async url=>url.endsWith('.json')?response(manifestFor(),url):response(bytesFor('006'),url,'image/svg+xml')],
 ['redirected image',async url=>url.endsWith('.json')?response(manifestFor(),url):response(bytesFor(),url,'image/svg+xml',{redirected:true})],
 ['wrong image media type',async url=>url.endsWith('.json')?response(manifestFor(),url):response(bytesFor(),url,'text/html')]
])test(`${name} fails closed without altering the approved cover or metadata`,async()=>{const h=harness({fetchImpl});const before=snapshot(h.figure);assert.equal(await h.controller.refresh(),'retained');assert.deepEqual(snapshot(h.visible),before);assert.equal(h.writes.length,0);h.controller.dispose();});

for(const [name,settings]of [['decode rejection',{decodeError:true}],['image error',{imageError:true}],['wrong natural image dimensions',{naturalWidth:999}]])test(`${name} leaves the old paper and credits intact and revokes rejected resources`,async()=>{const h=harness(settings);const before=snapshot(h.figure);assert.equal(await h.controller.refresh(),'retained');assert.deepEqual(snapshot(h.visible),before);assert.equal(h.writes.length,0);assert.ok(h.revoked.length>=1);h.controller.dispose();});

test('stale manifest004 cannot overwrite valid005 or download a regressive image',async()=>{
 const h=harness();await h.controller.refresh();const last=snapshot(h.visible);h.setFetch(async url=>response(currentManifest(),url));const count=h.requests.length;
 assert.equal(await h.controller.refresh(),'retained');assert.deepEqual(snapshot(h.visible),last);assert.equal(h.requests.length,count+1);h.controller.dispose();
});

test('storage quota errors never prevent a valid decoded cover from being displayed',async()=>{
 const h=harness({quota:true});assert.equal(await h.controller.refresh(),'updated');assert.equal(snapshot(h.visible).edition,'005');h.controller.dispose();
});

test('manifest text containing markup or javascript URLs is never interpreted as HTML or external link destinations',async()=>{
 const manifest=manifestFor();manifest.label='<img src=x onerror=alert(1)>';manifest.credits=['javascript:alert(1) <script>alert(1)</script> https://127.0.0.1/'];
 const h=harness({manifest});const status=await h.controller.refresh();
 // Conservative schema rejection and inert text-only rendering are both safe outcomes.
 if(status==='updated'){assert.equal(h.visible.querySelectorAll('script').length,0);assert.equal(h.visible.querySelectorAll('img').length,1);for(const a of h.visible.querySelectorAll('a'))assert.ok(a.href===ORIGIN+'/'||a.href.startsWith('blob:'),a.href);}else assert.equal(status,'retained');
 h.controller.dispose();
});

test('concurrent refreshes share one in-flight network operation',async()=>{
 const gate=deferred(),h=harness({decodeGate:gate});const a=h.controller.refresh(),b=h.controller.refresh();for(let i=0;i<10&&h.activeImages.length===0;i++)await tick();gate.resolve();await Promise.all([a,b]);assert.equal(h.requests.length,2);assert.equal(h.doc.replacements.filter(x=>x.parent===h.doc.root).length,1);h.controller.dispose();
});

test('unsupported WebCrypto/API paths retain the server-rendered preview without throwing',async()=>{
 const h=harness();h.env.crypto={};const before=snapshot(h.visible);assert.equal(await h.controller.refresh(),'retained');assert.deepEqual(snapshot(h.visible),before);h.controller.dispose();
});

test('live cover module has no global scrolling, hero/app dependency, HTML insertion, account or analytics integration',async()=>{
 const source=await readFile(new URL('../js/times-cover-live.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/\.innerHTML\s*=|insertAdjacentHTML|document\.write|scrollTo\s*\(|scrollBy\s*\(|preventDefault\s*\(|overflow\s*=|requestAnimationFrame|WebGL|gsap|ScrollTrigger|lenis|analytics|localStorage|sessionStorage|import\s.*(?:app|hero|scroll)/i);
});

test('last valid public cached005 restores offline as a complete verified image/date/credits bundle',async()=>{
 const manifest=manifestFor(),record={manifest,bytes:bytesFor()};const h=harness({record,fetchImpl:async()=>{throw Error('Offline');}});
 assert.equal(await h.controller.refresh(),'updated');const after=snapshot(h.visible);assert.equal(after.edition,'005');assert.equal(after.date,'2026-10-26');assert.match(after.caption,/005/);assert.match(await h.blobs.get(after.creditsURL).text(),/Autora da fotografia 005/);
 assert.equal(h.requests.length,1);assert.equal(h.writes.length,0);h.controller.dispose();
});

test('a fresh current004 manifest cannot regress a restored last-valid005 cache',async()=>{
 const h=harness({record:{manifest:manifestFor(),bytes:bytesFor()},fetchImpl:async url=>response(currentManifest(),url)});
 assert.equal(await h.controller.refresh(),'updated');assert.equal(snapshot(h.visible).edition,'005');assert.equal(h.requests.length,1);h.controller.dispose();
});

for(const [name,record]of [
 ['invalid cached manifest',{manifest:{schemaVersion:99},bytes:bytesFor()}],
 ['cached hash mismatch',{manifest:manifestFor(),bytes:bytesFor('006')}],
 ['cached oversized buffer',{manifest:manifestFor(),bytes:new Uint8Array(MAX_COVER_BYTES+1)}],
 ['cached foreign byte value',{manifest:manifestFor(),bytes:{byteLength:1}}],
 ['cached foreign URL',{manifest:{...manifestFor(),image:{...manifestFor().image,path:'https://127.0.0.1/x.svg'}},bytes:bytesFor()}]
])test(`${name} is ignored without altering the static fallback`,async()=>{const h=harness({record,fetchImpl:async()=>{throw Error('Offline');}});const before=snapshot(h.visible);assert.equal(await h.controller.refresh(),'retained');assert.deepEqual(snapshot(h.visible),before);h.controller.dispose();});

test('an unavailable private-mode storage read still permits a verified public network005 update',async()=>{
 const h=harness({storage:{async read(){throw Error('SecurityError');},async write(){throw Error('SecurityError');}}});assert.equal(await h.controller.refresh(),'updated');assert.equal(snapshot(h.visible).edition,'005');h.controller.dispose();
});

test('a valid same-edition image correction updates bytes and its corresponding credits together',async()=>{
 const h=harness();await h.controller.refresh();const prior=snapshot(h.visible);const bytes=bytesFor('005','<!-- revision 2 -->'),manifest=manifestFor({bytes});manifest.credits=['Fotografia corrigida · autora B · CC0'];
 h.setFetch(async url=>url.endsWith('.json')?response(manifest,url):response(bytes,url,'image/svg+xml'));assert.equal(await h.controller.refresh(),'updated');const next=snapshot(h.visible);
 assert.equal(next.edition,'005');assert.equal(next.date,prior.date);assert.notEqual(next.src,prior.src);assert.match(await h.blobs.get(next.creditsURL).text(),/Fotografia corrigida/);assert.ok(h.revoked.includes(prior.src));assert.ok(h.revoked.includes(prior.creditsURL));h.controller.dispose();
});

test('a pending decoded update cannot commit after disposal',async()=>{
 const gate=deferred(),h=harness({decodeGate:gate});const before=snapshot(h.visible);const running=h.controller.refresh();for(let i=0;i<10&&h.activeImages.length===0;i++)await tick();h.controller.dispose();gate.resolve();assert.equal(await running,'retained');assert.deepEqual(snapshot(h.visible),before);assert.ok(h.revoked.length>=1);
});

test('keyboard focus stays on the equivalent paper link without scrolling when a new cover commits',async()=>{
 const h=harness();const anchor=h.figure.querySelector('.times-editorial-paper-link');anchor.focus();assert.equal(await h.controller.refresh(),'updated');assert.equal(h.doc.activeElement,h.visible.querySelector('.times-editorial-paper-link'));assert.deepEqual(h.doc.focusOptions,{preventScroll:true});h.controller.dispose();
});

function fakeIDB({initial=null,quota=false}={}){
 const state={record:initial,keys:[],transactions:[],closed:0};
 const database={objectStoreNames:{contains:()=>true},close(){state.closed++;},transaction(name,mode){
  assert.equal(name,'cover');state.transactions.push(mode);const tx={abort(){queueMicrotask(()=>tx.onabort?.());},objectStore(){return {
   get(key){state.keys.push(['get',key]);const request={};queueMicrotask(()=>{request.result=state.record;request.onsuccess?.();queueMicrotask(()=>quota&&mode==='readwrite'?tx.onerror?.():tx.oncomplete?.());});return request;},
   put(record,key){state.keys.push(['put',key]);if(!quota)state.record=copy(record);return {};}
  };}};return tx;
 }};
 const indexedDB={open(name,version){assert.equal(name,'the-med-times-public-cover-v1');assert.equal(version,1);const request={result:database};queueMicrotask(()=>request.onsuccess?.());return request;}};
 return {state,env:{indexedDB,setTimeout,clearTimeout}};
}

test('browser cache uses a single bounded latest key, and read-write ordering cannot downgrade a newer edition',async()=>{
 const newer={manifest:manifestFor({editionId:'006',date:'2026-10-25'}),bytes:bytesFor('006')},older={manifest:manifestFor({editionId:'005',date:'2026-10-25'}),bytes:bytesFor()};
 const f=fakeIDB({initial:newer}),storage=createCoverStorage(f.env);assert.deepEqual(await storage.read(),newer);await storage.write(older);assert.equal(f.state.record.manifest.editionId,'006');
 assert.deepEqual(f.state.transactions,['readonly','readwrite']);assert.ok(f.state.keys.every(([,key])=>key==='latest'));assert.equal(f.state.keys.filter(([op])=>op==='put').length,0);
});

test('browser cache writes new valid public records without storing account data, credentials or extra keys',async()=>{
 const record={manifest:manifestFor({editionId:'005',date:'2026-10-25'}),bytes:bytesFor()};const f=fakeIDB(),storage=createCoverStorage(f.env);assert.equal(await storage.write(record),true);assert.deepEqual(Object.keys(f.state.record).sort(),['bytes','manifest']);assert.deepEqual(f.state.record,record);assert.equal(f.state.keys.filter(([op])=>op==='put').length,1);
});

test('unsupported IndexedDB, SecurityError, and transaction quota failures resolve harmlessly',async()=>{
 for(const indexedDB of [undefined,{open(){throw Error('SecurityError');}}]){const storage=createCoverStorage({indexedDB,setTimeout,clearTimeout});assert.equal(await storage.read(),null);assert.equal(await storage.write({manifest:manifestFor(),bytes:bytesFor()}),null);}
 const f=fakeIDB({quota:true}),storage=createCoverStorage(f.env);assert.equal(await storage.write({manifest:manifestFor(),bytes:bytesFor()}),null);assert.equal(f.state.record,null);
});

function schedulerHarness(){
 const doc=new FakeDocument();doc.body.dataset.page='home';const section=node(doc,'section',{id:'the-med-times'});doc.root.append(section);const figure=initialFigure(doc);section.append(figure);
 const timers=new Map(),events=new Map(),requests=[];let serial=0,observer;
 class IO{constructor(callback,options){this.callback=callback;this.options=options;observer=this;}observe(target){this.target=target;}disconnect(){this.disconnected=true;}emit(isIntersecting){this.callback([{target:this.target,isIntersecting}]);}}
 const env={document:doc,IntersectionObserver:IO,crypto:webcrypto,URL,Image:class{},Blob,TextDecoder,AbortController,fetch:async(url,init)=>{requests.push({url,init});return response(currentManifest(),url);},setTimeout(fn,delay){const id=++serial;timers.set(id,{fn,delay});return id;},clearTimeout(id){timers.delete(id);},addEventListener(type,fn){events.set(type,fn);},removeEventListener(type){events.delete(type);}};
 return {doc,env,timers,events,requests,get observer(){return observer;},async fireDelay(delay){const entry=[...timers].find(([,value])=>value.delay===delay);assert.ok(entry,`timer ${delay} exists`);timers.delete(entry[0]);await entry[1].fn();}};
}

test('near-fold scheduling is lazy, five-minute bounded, pauses hidden/offscreen and resumes without scroll listeners',async context=>{
 let time=0;context.mock.method(Date,'now',()=>time);const h=schedulerHarness(),live=startCoverPreview(h.env);assert.ok(live);assert.equal(h.requests.length,0);assert.equal(h.timers.size,0);assert.equal(h.observer.options.rootMargin,'400px 0px');
 h.observer.emit(true);await h.fireDelay(0);assert.equal(h.requests.length,1);assert.ok([...h.timers.values()].some(x=>x.delay===REFRESH_MS));
 h.observer.emit(false);assert.equal(h.timers.size,0);time=1000;h.observer.emit(true);assert.ok([...h.timers.values()].some(x=>x.delay===REFRESH_MS-1000));
 h.doc.visibilityState='hidden';h.doc.events.get('visibilitychange')();assert.equal(h.timers.size,0);time=REFRESH_MS+1;h.doc.visibilityState='visible';h.doc.events.get('visibilitychange')();await h.fireDelay(0);assert.equal(h.requests.length,2);
 assert.ok(!h.events.has('scroll'));assert.ok(!h.doc.events.has('scroll'));live.dispose();assert.equal(h.timers.size,0);assert.equal(h.observer.disconnected,true);assert.equal(h.events.size,0);assert.equal(h.doc.events.size,0);
});

test('no IntersectionObserver or non-home page never starts network work or scroll substitutes',()=>{
 const h=schedulerHarness();delete h.env.IntersectionObserver;assert.equal(startCoverPreview(h.env),null);assert.equal(h.requests.length,0);assert.equal(h.timers.size,0);
 const other=schedulerHarness();other.doc.body.dataset.page='community';assert.equal(startCoverPreview(other.env),null);assert.equal(other.requests.length,0);
});

test('manifest timeout aborts the request and safely retains the approved static cover',async()=>{
 const h=harness({fetchImpl:()=>new Promise(()=>{})}),before=snapshot(h.visible);h.env.setTimeout=callback=>setTimeout(callback,1);
 assert.equal(await h.controller.refresh(),'retained');assert.equal(h.requests[0].init.signal.aborted,true);assert.deepEqual(snapshot(h.visible),before);h.controller.dispose();
});

test('a stalled image decode has a bounded timeout and never clears the previous image',async()=>{
 const h=harness({decodeGate:deferred()}),before=snapshot(h.visible);h.env.setTimeout=(callback,delay)=>setTimeout(callback,delay===8000?1:delay);
 assert.equal(await h.controller.refresh(),'retained');assert.deepEqual(snapshot(h.visible),before);assert.ok(h.revoked.length>=1);h.controller.dispose();
});

for(const [name,bytes]of [
 ['non-SVG cover',new TextEncoder().encode('<html><script>alert(1)</script></html>')],
 ['invalid UTF-8 cover',new Uint8Array([60,115,118,103,62,255])]
])test(`${name} is rejected even with a matching content digest`,async()=>{const manifest=manifestFor({bytes}),h=harness({manifest,bytes}),before=snapshot(h.visible);assert.equal(await h.controller.refresh(),'retained');assert.deepEqual(snapshot(h.visible),before);assert.equal(h.activeImages.length,0);h.controller.dispose();});

test('declared oversized and incrementally oversized responses are rejected before any visible image swap',async()=>{
 for(const headers of [{'Content-Length':String(MAX_COVER_BYTES+1)},{'Content-Length':'0'}]){
  const bytes=headers['Content-Length']==='0'?new Uint8Array(MAX_COVER_BYTES+1):bytesFor();const h=harness({fetchImpl:async url=>url.endsWith('.json')?response(manifestFor(),url):response(bytes,url,'image/svg+xml',{headers})}),before=snapshot(h.visible);
  assert.equal(await h.controller.refresh(),'retained');assert.deepEqual(snapshot(h.visible),before);assert.equal(h.activeImages.length,0);h.controller.dispose();
 }
});

test('future cached and network editions are rejected regardless of valid image hash',async()=>{
 const manifest=manifestFor({editionId:'006',date:'2026-10-28',bytes:bytesFor('006')}),h=harness({record:{manifest,bytes:bytesFor('006')},manifest,bytes:bytesFor('006')}),before=snapshot(h.visible);
 assert.equal(await h.controller.refresh(),'retained');assert.deepEqual(snapshot(h.visible),before);assert.equal(h.requests.length,1);h.controller.dispose();
});

test('missing enhancement markup fails without a partial DOM mutation or uncaught error',async()=>{
 const h=harness();h.figure.querySelector('.times-editorial-photo-notice').remove();const before=snapshot(h.visible);
 assert.equal(await h.controller.refresh(),'retained');assert.deepEqual(snapshot(h.visible),before);assert.equal(h.doc.replacements.filter(x=>x.parent===h.doc.root).length,0);h.controller.dispose();
});

test('unavailable Blob URLs, image API and AbortController each preserve the static fallback',async()=>{
 for(const api of ['Blob','URL','Image','AbortController']){const h=harness(),before=snapshot(h.visible);h.env[api]=undefined;assert.equal(await h.controller.refresh(),'retained');assert.deepEqual(snapshot(h.visible),before);assert.equal(h.requests.length,0);h.controller.dispose();}
});


test('valid multibyte SVG text crossing byte 2048 is verified without truncating UTF-8',async()=>{
 const prefix='<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1480"><desc>';
 const bytes=new TextEncoder().encode(prefix+'a'.repeat(2047-prefix.length)+'é</desc></svg>');
 assert.equal(bytes[2047],195);assert.equal(bytes[2048],169);
 const h=harness({manifest:manifestFor({bytes}),bytes});assert.equal(await h.controller.refresh(),'updated');assert.equal(snapshot(h.visible).edition,'005');h.controller.dispose();
});
