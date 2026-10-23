/** Accessible progressive enhancement of the reference's thin custom video controls.
 * The native player stays available until setup succeeds, and is restored on error.
 */
const players = new WeakMap();
const icon = {
  play: '<path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
  volume: '<path d="M3 9h4l5-4v14l-5-4H3Zm12-1c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
  muted: '<path d="M3 9h4l5-4v14l-5-4H3Zm12 0 6 6m0-6-6 6"/>',
  fullscreen: '<path d="M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6"/>',
  exit: '<path d="M9 3v6H3m12-6v6h6M3 15h6v6m6 0v-6h6"/>'
};
const svg = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${icon[name]}</svg>`;
export function formatTime(value) {
  const seconds = Math.max(0, Number.isFinite(Number(value)) ? Math.floor(Number(value)) : 0);
  const h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60), s = String(seconds % 60).padStart(2,'0');
  return h ? `${h}:${String(m).padStart(2,'0')}:${s}` : `${m}:${s}`;
}
export function progressRatio(time, duration) {
  return Number.isFinite(duration) && duration > 0 && Number.isFinite(time) ? Math.min(1,Math.max(0,time/duration)) : 0;
}
export function clampSeek(value, duration) {
  return Number.isFinite(duration) && duration > 0 ? Math.min(duration,Math.max(0,Number(value)||0)) : 0;
}
function enhance(video) {
  if (players.has(video)) return players.get(video);
  if (!video.hasAttribute('controls') || video.hasAttribute('data-decorative-video')) return null;
  const doc=video.ownerDocument, originalTabIndex=video.getAttribute('tabindex');
  const wrapper=doc.createElement('div');wrapper.className='custom-video-player';
  const controls=doc.createElement('div');controls.className='video-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','Controles do vídeo');
  controls.innerHTML=`<div class="video-controls-left"><button class="video-control video-control-play" type="button" aria-label="Reproduzir vídeo">${svg('play')}</button><span class="video-time" aria-hidden="true">0:00 / 0:00</span></div><div class="video-controls-right"><button class="video-control video-control-volume" type="button" aria-label="Desativar som">${svg('volume')}</button><button class="video-control video-control-fullscreen" type="button" aria-label="Entrar em tela cheia">${svg('fullscreen')}</button></div><div class="video-progress-wrapper"><div class="video-progress-track"><span class="video-progress-filled"></span></div><input class="video-progress-range" type="range" min="0" max="0" step="0.1" value="0" aria-label="Posição do vídeo" aria-valuetext="0:00 de 0:00" disabled></div>`;
  const status=doc.createElement('span');status.className='video-player-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const play=controls.querySelector('.video-control-play'),mute=controls.querySelector('.video-control-volume'),full=controls.querySelector('.video-control-fullscreen'),time=controls.querySelector('.video-time'),range=controls.querySelector('.video-progress-range'),fill=controls.querySelector('.video-progress-filled');
  const silent=video.dataset.silent==='true'||[video.currentSrc,video.getAttribute('src'),...Array.from(video.querySelectorAll('source'),s=>s.getAttribute('src'))].some(src=>src?.includes('innecta-tour.mp4'));
  const listeners=[];let restored=false,scrubbing=false,pendingPlay=false,playToken=0;
  const on=(target,event,handler,options)=>{target.addEventListener(event,handler,options);listeners.push(()=>target.removeEventListener(event,handler,options));};
  const announce=message=>{status.textContent=message;};
  function fullscreenActive(){return doc.fullscreenElement===wrapper||doc.webkitFullscreenElement===wrapper||!!video.webkitDisplayingFullscreen;}
  function update(){
    if(restored)return;
    const duration=video.duration,current=Number.isFinite(video.currentTime)?video.currentTime:0,finite=Number.isFinite(duration)&&duration>0;
    play.innerHTML=svg(video.paused?'play':'pause');play.setAttribute('aria-label',video.paused?'Reproduzir vídeo':'Pausar vídeo');play.setAttribute('aria-pressed',String(!video.paused));
    mute.innerHTML=svg(video.muted?'muted':'volume');mute.setAttribute('aria-label',`${video.muted?'Ativar':'Desativar'} som${silent?' — tour sem áudio':''}`);mute.setAttribute('aria-pressed',String(video.muted));mute.title=silent?'Este tour não contém áudio. O botão altera o estado de som do player.':video.muted?'Ativar som':'Desativar som';
    time.textContent=`${formatTime(current)} / ${finite?formatTime(duration):'0:00'}`;
    range.disabled=!finite;range.max=finite?String(duration):'0';
    if(!scrubbing){range.value=String(current);fill.style.width=`${progressRatio(current,duration)*100}%`;}
    range.setAttribute('aria-valuetext',`${formatTime(scrubbing?Number(range.value):current)} de ${formatTime(duration)}`);
    full.innerHTML=svg(fullscreenActive()?'exit':'fullscreen');full.setAttribute('aria-label',fullscreenActive()?'Sair da tela cheia':'Entrar em tela cheia');
    wrapper.classList.toggle('is-playing',!video.paused);wrapper.classList.toggle('is-paused',video.paused);
  }
  function restore(message=''){
    if(restored)return;restored=true;playToken++;
    listeners.splice(0).forEach(remove=>remove());video.controls=true;wrapper.classList.remove('video-enhanced');controls.remove();
    if(originalTabIndex===null)video.removeAttribute('tabindex');else video.setAttribute('tabindex',originalTabIndex);
    if(message)announce(message);else status.remove();
    players.delete(video);
  }
  async function togglePlay(){
    const token=++playToken;
    if(!video.paused||pendingPlay){pendingPlay=false;video.pause();update();return;}
    pendingPlay=true;
    try{await video.play();if(token!==playToken)return;pendingPlay=false;update();}
    catch(error){if(token!==playToken)return;pendingPlay=false;restore('Não foi possível iniciar o tour. Os controles nativos continuam disponíveis.');}
  }
  function seek(value){
    if(!Number.isFinite(video.duration)||video.duration<=0)return;
    try{video.currentTime=clampSeek(value,video.duration);fill.style.width=`${progressRatio(video.currentTime,video.duration)*100}%`;update();}
    catch{announce('Não foi possível avançar neste ponto do vídeo.');}
  }
  async function toggleFullscreen(){
    try{
      if(fullscreenActive()){
        if(doc.exitFullscreen)await doc.exitFullscreen();
        else if(doc.webkitExitFullscreen)await doc.webkitExitFullscreen();
        else if(video.webkitExitFullscreen)video.webkitExitFullscreen();
      }else if(wrapper.requestFullscreen)await wrapper.requestFullscreen();
      else if(wrapper.webkitRequestFullscreen)await wrapper.webkitRequestFullscreen();
      else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();
      else announce('Tela cheia não está disponível neste navegador.');
      update();
    }catch{announce('Não foi possível abrir a tela cheia. Você pode continuar assistindo aqui.');}
  }
  try{
    video.parentNode.insertBefore(wrapper,video);wrapper.append(video,controls,status);
    on(play,'click',togglePlay);on(video,'click',togglePlay);
    on(mute,'click',()=>{video.muted=!video.muted;update();});on(full,'click',toggleFullscreen);
    on(range,'pointerdown',()=>{scrubbing=true;});on(doc,'pointerup',()=>{if(scrubbing){scrubbing=false;update();}});on(range,'pointercancel',()=>{scrubbing=false;update();});
    on(range,'input',()=>seek(range.value));on(range,'change',()=>{scrubbing=false;seek(range.value);});
    on(video,'keydown',event=>{
      if(event.altKey||event.ctrlKey||event.metaKey)return;
      if(event.key===' '||event.key.toLowerCase()==='k'){event.preventDefault();togglePlay();}
      else if(event.key==='ArrowRight'){event.preventDefault();seek(video.currentTime+5);}
      else if(event.key==='ArrowLeft'){event.preventDefault();seek(video.currentTime-5);}
      else if(event.key.toLowerCase()==='m'){event.preventDefault();video.muted=!video.muted;update();}
      else if(event.key.toLowerCase()==='f'){event.preventDefault();toggleFullscreen();}
    });
    ['timeupdate','durationchange','loadedmetadata','canplay','play','pause','ended','volumechange'].forEach(event=>on(video,event,update));
    on(doc,'fullscreenchange',update);on(doc,'webkitfullscreenchange',update);on(video,'webkitbeginfullscreen',update);on(video,'webkitendfullscreen',update);
    on(video,'error',()=>restore('Não foi possível carregar o vídeo. Os controles nativos continuam disponíveis.'));
    if(!wrapper.requestFullscreen&&!wrapper.webkitRequestFullscreen&&!video.webkitEnterFullscreen)full.hidden=true;
    video.setAttribute('tabindex',originalTabIndex??'0');update();
    // Last step only: an exception before this point cannot remove native controls.
    wrapper.classList.add('video-enhanced');video.controls=false;
    const controller={video,wrapper,destroy(){restore();if(wrapper.parentNode){wrapper.parentNode.insertBefore(video,wrapper);wrapper.remove();}}};
    players.set(video,controller);return controller;
  }catch(error){restore();if(wrapper.parentNode){wrapper.parentNode.insertBefore(video,wrapper);wrapper.remove();}return null;}
}
/** Idempotent; call again after inserting modal content. Does not start playback. */
export function enhanceVideos(root=globalThis.document){
  if(!root?.querySelectorAll)return [];
  const candidates=[...(root.matches?.('video[controls]')?[root]:[]),...root.querySelectorAll('video[controls]')];
  return candidates.map(enhance).filter(Boolean);
}
