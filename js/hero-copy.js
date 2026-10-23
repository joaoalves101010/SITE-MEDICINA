/** Reference two-fragment sentence choreography, without gating readable copy. */
export const HERO_SUFFIXES = ['conectar seu futuro.', 'construir seu caminho.', 'ampliar seu olhar.'];
export const HERO_COPY_TIMING = Object.freeze({duration:.9,stagger:.1,enterFirst:.55,enterSecond:.65,interval:4500});

/** Both outgoing and incoming fragments participate; entry overlaps the exit. */
export function animateHeroFragments(gsap, outgoing, incoming, activate, complete) {
  const t=HERO_COPY_TIMING;
  const timeline=gsap.timeline({paused:true,onComplete:complete});
  timeline.to(outgoing[0],{yPercent:-150,duration:t.duration,ease:'expo.inOut',force3D:true},0);
  timeline.to(outgoing[0],{opacity:0,duration:t.duration*.5,ease:'none'},0);
  timeline.to(outgoing[1],{yPercent:-150,duration:t.duration,ease:'expo.inOut',force3D:true},t.stagger);
  timeline.to(outgoing[1],{opacity:0,duration:t.duration*.5,ease:'none'},t.stagger);
  timeline.set(incoming,{yPercent:150,opacity:0,force3D:true},0);
  timeline.add(activate,t.enterFirst);
  timeline.to(incoming[0],{yPercent:0,duration:t.duration,ease:'expo.out',force3D:true},t.enterFirst);
  timeline.to(incoming[0],{opacity:1,duration:t.duration*.5,ease:'none'},t.enterFirst);
  timeline.to(incoming[1],{yPercent:0,duration:t.duration,ease:'expo.out',force3D:true},t.enterSecond);
  timeline.to(incoming[1],{opacity:1,duration:t.duration*.5,ease:'none'},t.enterSecond);
  timeline.play();
  return timeline;
}

export function createHeroCopyCycle(sentence,gsap,{reducedMotion=false,delay=0}={}) {
  const noop={dispose(){}};
  if(!sentence||!gsap||reducedMotion)return noop;
  const original=sentence.querySelector('.hero-copy-layer');
  if(!original)return noop;
  const clone=original.cloneNode(true);
  clone.removeAttribute('data-hero-current');
  clone.classList.add('hero-copy-layer--clone');
  clone.style.visibility='hidden';
  original.setAttribute('aria-hidden','true');clone.setAttribute('aria-hidden','true');
  sentence.append(clone);
  const layers=[original,clone];
  const fragments=layers.map(layer=>[layer.querySelector('[data-hero-prefix]'),layer.querySelector('[data-hero-word]')]);
  if(fragments.some(pair=>pair.some(el=>!el))){clone.remove();return noop;}
  const prefix=fragments[0][0].textContent;
  sentence.setAttribute('aria-label',`${prefix} ${HERO_SUFFIXES[0]}`);
  let active=0,index=0,timeline=null,interval=0,disposed=false;
  const start=setTimeout(()=>{interval=setInterval(()=>{
    if(disposed||sentence.ownerDocument.hidden||timeline?.isActive())return;
    const next=1-active;index=(index+1)%HERO_SUFFIXES.length;
    fragments[next][0].textContent=prefix;
    fragments[next][1].textContent=HERO_SUFFIXES[index];
    timeline=animateHeroFragments(gsap,fragments[active],fragments[next],()=>{
      layers[active].style.visibility='hidden';layers[next].style.visibility='visible';
      sentence.setAttribute('aria-label',`${prefix} ${HERO_SUFFIXES[index]}`);active=next;
    },()=>{timeline=null;});
  },HERO_COPY_TIMING.interval);},delay);
  return {dispose(){
    if(disposed)return;disposed=true;clearTimeout(start);clearInterval(interval);timeline?.kill();
    fragments[0][1].textContent=HERO_SUFFIXES[index];
    gsap.set(fragments[0],{clearProps:'transform,opacity'});
    original.style.visibility='';original.removeAttribute('aria-hidden');clone.remove();
    sentence.removeAttribute('aria-label');
  }};
}
