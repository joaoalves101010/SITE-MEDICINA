/** Optional, home-only enhancement. It never participates in the app/intro/scroll lifecycle. */
export const COVER_ORIGIN = 'https://themedtimes.vercel.app';
export const MANIFEST_URL = `${COVER_ORIGIN}/edition-cover.json`;
export const REFRESH_MS = 5 * 60 * 1000;
export const MAX_COVER_BYTES = 3 * 1024 * 1024;
export const MAX_MANIFEST_BYTES = 16 * 1024;
export const BASE_COVER = Object.freeze({editionId:'004',date:'2026-10-25',image:Object.freeze({sha256:'1b51d66ece0df3b69ddd78a84dfa7ef20bf77d6e8bfd4a770b0d9781093b3657',width:1000,height:1480})});
const ownKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join(',') === [...keys].sort().join(',');
const plain = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
const todayUTC = () => new Date().toISOString().slice(0,10);

/** Fail closed: the publisher, path, dimensions and immutable digest are not configurable by JSON. */
export function validateManifest(raw, {today = todayUTC()} = {}) {
  if (!ownKeys(raw,['schemaVersion','editionId','date','image','label','credits']) || raw.schemaVersion !== 1) throw Error('cover-schema');
  if (typeof raw.editionId !== 'string' || !/^\d{3,9}$/.test(raw.editionId) || Number(raw.editionId) < 1) throw Error('cover-edition');
  if (typeof raw.date !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(raw.date) || !Number.isFinite(Date.parse(raw.date+'T00:00:00Z')) || new Date(raw.date+'T00:00:00Z').toISOString().slice(0,10) !== raw.date || raw.date > today) throw Error('cover-date');
  const img = raw.image;
  if (!ownKeys(img,['path','sha256','width','height']) || img.width !== 1000 || img.height !== 1480 || typeof img.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(img.sha256)) throw Error('cover-image');
  if (img.path !== `assets/edition-covers/edition-${raw.editionId}-${img.sha256}.svg`) throw Error('cover-path');
  if (!plain(raw.label,160) || !Array.isArray(raw.credits) || raw.credits.length < 1 || raw.credits.length > 10 || !raw.credits.every(value => plain(value,1000))) throw Error('cover-credits');
  return {schemaVersion:1,editionId:raw.editionId,date:raw.date,image:{path:img.path,sha256:img.sha256,width:1000,height:1480},label:raw.label,credits:[...raw.credits]};
}

/** Neither a higher edition with an older date nor a later date with an older ID can regress the pair. */
export function canAdvance(candidate, current) {
  const nextId = Number(candidate.editionId), currentId = Number(current.editionId);
  return nextId >= currentId && candidate.date >= current.date && (nextId !== currentId || candidate.date === current.date);
}
const sameCover = (a,b) => a.editionId === b.editionId && a.date === b.date && a.image.sha256 === b.image.sha256;
const shortDate = date => date.split('-').reverse().join('/');
const longDate = date => { const [y,m,d] = date.split('-'); return `${Number(d)} de ${['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][Number(m)-1]} de ${y}`; };

async function boundedResponse(response, url, type, limit, signal) {
  if (!response.ok || response.redirected || response.url !== url || response.type === 'opaque' || response.type === 'opaqueredirect') throw Error('cover-response');
  if (response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== type) throw Error('cover-content-type');
  const declared = response.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > limit)) throw Error('cover-size');
  const reader = response.body?.getReader?.();
  if (!reader) throw Error('cover-stream-unsupported');
  const chunks = []; let total = 0;
  try {
    for (;;) {
      if (signal?.aborted) throw Error('cover-aborted');
      const {value,done} = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) throw Error('cover-size');
      chunks.push(value);
    }
  } catch (error) { try { await reader.cancel(); } catch {} throw error; }
  finally { reader.releaseLock(); }
  if (!total) throw Error('cover-empty');
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
  return bytes;
}

async function fetchBytes(env, url, type, limit, cache, aborters) {
  const abort = new env.AbortController(); aborters.add(abort);
  let timer;
  try {
    return await Promise.race([
      (async () => boundedResponse(await env.fetch(url,{mode:'cors',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',cache,signal:abort.signal}),url,type,limit,abort.signal))(),
      new Promise((_,reject) => { timer = env.setTimeout(() => {abort.abort();reject(Error('cover-timeout'));},12000); })
    ]);
  } finally { env.clearTimeout(timer); aborters.delete(abort); }
}

export async function verifyBytes(bytes, manifest, env = globalThis) {
  if (!(bytes instanceof Uint8Array) || !bytes.byteLength || bytes.byteLength > MAX_COVER_BYTES) throw Error('cover-size');
  const digest = new Uint8Array(await env.crypto.subtle.digest('SHA-256',bytes));
  if ([...digest].map(byte => byte.toString(16).padStart(2,'0')).join('') !== manifest.image.sha256) throw Error('cover-hash');
  // The verified SVG is used only as an <img> Blob, never injected into the DOM or opened as a document.
  const head = new env.TextDecoder('utf-8',{fatal:true}).decode(bytes);
  if (!/^\s*(?:<\?xml[^>]*>\s*)?<svg\b/.test(head)) throw Error('cover-svg');
}

async function decodeCover(env, url) {
  const image = new env.Image(); image.decoding = 'async'; image.width = 1000; image.height = 1480;
  let timer;
  try {
    await Promise.race([
      new Promise((resolve,reject) => {
        image.onload = () => {if(typeof image.decode !== 'function')resolve();}; image.onerror = () => reject(Error('cover-decode'));
        image.src = url;
        if (typeof image.decode === 'function') image.decode().then(resolve,reject);
      }),
      new Promise((_,reject) => { timer = env.setTimeout(() => reject(Error('cover-decode-timeout')),8000); })
    ]);
    if (image.naturalWidth !== 1000 || image.naturalHeight !== 1480) throw Error('cover-dimensions');
    return image;
  } finally { env.clearTimeout(timer); image.onload = null; image.onerror = null; }
}

/** Assemble off-DOM; one replaceWith publishes the already-decoded image, date and credit bundle together. */
export function buildCommit(figure, manifest, image, creditURL) {
  const next = figure.cloneNode(true), document = figure.ownerDocument;
  const oldImage = next.querySelector('.times-editorial-frontpage');
  const caption = next.querySelector('.times-editorial-paper-caption');
  const label = caption?.querySelector('span'), credits = next.querySelector('.times-editorial-credits');
  const notice = next.querySelector('.times-editorial-photo-notice'), link = next.querySelector('.times-editorial-paper-link');
  if (!oldImage || !label || !credits || !notice || !link) throw Error('cover-markup');
  image.className = 'times-editorial-frontpage'; image.width = 1000; image.height = 1480;
  image.alt = `THE MED TIMES: capa completa da edição ${manifest.editionId}, de ${longDate(manifest.date)}, com manchetes e colunas da edição.`;
  oldImage.replaceWith(image);
  next.dataset.timesPreviewEdition = manifest.editionId; next.dataset.timesPreviewDate = manifest.date;
  label.textContent = `Prévia da edição ${manifest.editionId} · ${shortDate(manifest.date)}`;
  link.setAttribute('aria-label',`Abrir o THE MED TIMES para leitura completa em nova aba. Prévia da edição ${manifest.editionId}, de ${longDate(manifest.date)}.`);
  credits.href = creditURL;
  credits.setAttribute('aria-label',`Créditos da prévia da edição ${manifest.editionId}, de ${longDate(manifest.date)} — abre em nova aba.`);
  // The existing link opens an edition-bound, complete plain-text attribution document.
  // Keep this small notice compact; no source/license/no-endorsement entry is discarded from the document.
  notice.textContent = manifest.label;
  const noticeHeight = figure.querySelector('.times-editorial-photo-notice')?.getBoundingClientRect?.().height;
  if (Number.isFinite(noticeHeight) && noticeHeight > 0) notice.style.minHeight = `${Math.ceil(noticeHeight)}px`;
  return () => {
    if (figure.isConnected === false) throw Error('cover-detached');
    const focused = document.activeElement;
    const focusClass = focused === figure.querySelector('.times-editorial-paper-link') ? '.times-editorial-paper-link' : focused === figure.querySelector('.times-editorial-credits') ? '.times-editorial-credits' : null;
    figure.replaceWith(next);
    // Do not move the page or lose keyboard focus if refresh coincides with reading the caption.
    if (focusClass) {try {next.querySelector(focusClass)?.focus({preventScroll:true});} catch {}}
    return next;
  };
}

/** Single bounded public record. One read-write transaction prevents an older tab overwriting a newer edition. */
export function createCoverStorage(env = globalThis) {
  const operation = (writeRecord) => new Promise(resolve => {
    let database, transaction, finished = false;
    const finish = value => {if(finished)return;finished=true;env.clearTimeout(timer);try{database?.close();}catch{}resolve(value);};
    const timer = env.setTimeout(() => {try{transaction?.abort();}catch{}finish(null);},1500);
    try {
      const request = env.indexedDB.open('the-med-times-public-cover-v1',1);
      request.onupgradeneeded = () => {if(!request.result.objectStoreNames.contains('cover'))request.result.createObjectStore('cover');};
      request.onerror = request.onblocked = () => finish(null);
      request.onsuccess = () => {
        database = request.result;
        if(finished){database.close();return;}
        database.onversionchange = () => database.close();
        try {
          transaction = database.transaction('cover',writeRecord?'readwrite':'readonly');
          const records = transaction.objectStore('cover'), read = records.get('latest'); let result = null;
          read.onerror = () => finish(null);
          read.onsuccess = () => {
            result = read.result || null;
            if(!writeRecord)return;
            let previous = null;
            try {previous=validateManifest(result?.manifest);} catch {}
            if (!previous || canAdvance(writeRecord.manifest,previous)) records.put(writeRecord,'latest');
          };
          transaction.oncomplete = () => finish(writeRecord ? true : result);
          transaction.onerror = transaction.onabort = () => finish(null);
        } catch {finish(null);}
      };
    } catch {finish(null);}
  });
  return {read:() => operation(),write:record => operation(record)};
}

export function createCoverController({figure,env=globalThis,storage,now=todayUTC} = {}) {
  let current=BASE_COVER, currentFigure=figure, disposed=false, pending=null, restored=false;
  let activeURLs=[];
  const aborters=new Set();
  const revoke = urls => {for(const url of urls)try{env.URL.revokeObjectURL(url);}catch{}};
  const supported = () => Boolean(figure && env.fetch && env.crypto?.subtle && env.AbortController && env.Blob && env.URL?.createObjectURL && env.URL?.revokeObjectURL && env.Image && env.TextDecoder);
  const cache = storage || createCoverStorage(env);
  const install = async (manifest,bytes) => {
    if(!canAdvance(manifest,current)||sameCover(manifest,current)||disposed)return false;
    await verifyBytes(bytes,manifest,env);
    const urls=[];
    try {
      const imageURL=env.URL.createObjectURL(new env.Blob([bytes],{type:'image/svg+xml'}));urls.push(imageURL);
      const image=await decodeCover(env,imageURL);
      if(disposed||!canAdvance(manifest,current))return false;
      const credits = `THE MED TIMES — CRÉDITOS DA PRÉVIA\nEdição ${manifest.editionId} · ${shortDate(manifest.date)}\n\n${manifest.label}\n\n${manifest.credits.join('\n\n')}\n\nLEITURA COMPLETA\n${COVER_ORIGIN}/\n`;
      const creditURL=env.URL.createObjectURL(new env.Blob([credits],{type:'text/plain;charset=utf-8'}));urls.push(creditURL);
      const commit=buildCommit(currentFigure,manifest,image,creditURL);
      currentFigure=commit(); current=manifest;
      const previousURLs=activeURLs;activeURLs=urls.splice(0);revoke(previousURLs);
      return true;
    } finally {revoke(urls);}
  };
  const run = async () => {
    if(!supported()||disposed)return 'retained';
    let changed=false;
    if(!restored){
      restored=true;
      try {
        const saved=await cache.read();
        if(saved){
          const manifest=validateManifest(saved.manifest,{today:now()});
          if(!(saved.bytes instanceof Uint8Array) && !(saved.bytes instanceof ArrayBuffer))throw Error('cover-cache-bytes');
          if(!saved.bytes.byteLength||saved.bytes.byteLength>MAX_COVER_BYTES)throw Error('cover-cache-size');
          const bytes=saved.bytes instanceof Uint8Array?saved.bytes:new Uint8Array(saved.bytes);
          if(canAdvance(manifest,current))changed=await install(manifest,bytes);
        }
      } catch {}
    }
    if(disposed)return 'retained';
    try {
      const json=await fetchBytes(env,MANIFEST_URL,'application/json',MAX_MANIFEST_BYTES,'no-cache',aborters);
      const manifest=validateManifest(JSON.parse(new env.TextDecoder('utf-8',{fatal:true}).decode(json)),{today:now()});
      if(disposed||!canAdvance(manifest,current))return changed?'updated':'retained';
      if(sameCover(manifest,current))return changed?'updated':'unchanged';
      const url=`${COVER_ORIGIN}/${manifest.image.path}`;
      const bytes=await fetchBytes(env,url,'image/svg+xml',MAX_COVER_BYTES,'force-cache',aborters);
      if(await install(manifest,bytes)){
        // Storage is optional and never gates the visible, verified update.
        try {await cache.write({manifest,bytes});} catch {}
        return 'updated';
      }
    } catch {}
    return changed?'updated':'retained';
  };
  return {
    refresh(){if(pending)return pending;pending=run().catch(()=> 'retained').finally(()=>{pending=null;});return pending;},
    get current(){return current;},
    dispose(){disposed=true;for(const abort of aborters)abort.abort();revoke(activeURLs);activeURLs=[];}
  };
}

/** Revalidate at most once per five minutes, and only while the fold is near the visible viewport. */
export function startCoverPreview(env = globalThis) {
  const document=env.document, figure=document?.querySelector('#the-med-times .times-editorial-paper');
  if(!figure||document.body?.dataset.page!=='home'||!env.IntersectionObserver)return null;
  const section=figure.closest('#the-med-times');
  if(!section||!figure.querySelector('.times-editorial-paper-link'))return null;
  const controller=createCoverController({figure,env});
  let near=false, timer=null, lastAttempt=-Infinity, stopped=false, inFlight=false;
  const visible=()=>document.visibilityState!=='hidden';
  const cancel=()=>{if(timer!==null)env.clearTimeout(timer);timer=null;};
  const schedule=()=>{
    cancel();if(stopped||!near||!visible()||inFlight)return;
    const remaining=Math.max(0,REFRESH_MS-(Date.now()-lastAttempt));
    timer=env.setTimeout(tick,remaining);
  };
  const tick=async()=>{
    timer=null;if(stopped||!near||!visible()||inFlight)return;
    lastAttempt=Date.now();inFlight=true;
    try{await controller.refresh();}finally{inFlight=false;schedule();}
  };
  const observer=new env.IntersectionObserver(entries=>{for(const entry of entries)if(entry.target===section)near=entry.isIntersecting;schedule();},{rootMargin:'400px 0px',threshold:0});
  const onVisibility=()=>schedule();
  const onPageHide=event=>{cancel();if(!event.persisted)dispose();};
  const onPageShow=()=>schedule();
  const dispose=()=>{if(stopped)return;stopped=true;cancel();observer.disconnect();document.removeEventListener('visibilitychange',onVisibility);env.removeEventListener('pagehide',onPageHide);env.removeEventListener('pageshow',onPageShow);controller.dispose();};
  observer.observe(section);document.addEventListener('visibilitychange',onVisibility);
  env.addEventListener('pagehide',onPageHide);env.addEventListener('pageshow',onPageShow);
  return {controller,dispose};
}

if(typeof window!=='undefined') {try{startCoverPreview(window);}catch{/* Enhancement failure leaves the approved static cover intact. */}}
