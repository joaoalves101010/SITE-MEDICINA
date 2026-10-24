import { initHomeIntro } from './home-intro.js';
import { usesNativeTouchScroll, readScrollPosition, setNativeScrollImmediate, createNativeScrollLock } from './scroll-policy.js';
import { createSharedScene } from './shared-scene.js';
import { initHero } from './hero.js';
import { createHeroCopyCycle } from './hero-copy.js';
import { enhanceVideos } from './video.js';
import { profiles, directoryProfiles, imageNotice } from './content.js';
import { renderProfileModal } from './pages.js';

const $ = (s, scope=document) => scope.querySelector(s);
const $$ = (s, scope=document) => [...scope.querySelectorAll(s)];
const allProfiles=[...profiles,...directoryProfiles];
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const nativeTouch=usesNativeTouchScroll(window);
const nativeScrollLock=nativeTouch?createNativeScrollLock(window,document):null;
const currentScrollY=()=>nativeScrollLock?.position??readScrollPosition(scroll,window,nativeTouch);
function syncNativeOverlayLock(){nativeScrollLock?.set(document.body.classList.contains('menu-open')||document.body.classList.contains('modal-open'));}
if(reduce.matches)$$('video[autoplay]').forEach(video=>{video.pause();video.removeAttribute('autoplay');});
let scroll, gsap, heroController, lastY=0, scrollFrame=0;
const main=$('main');
const backLink=$('.btn-wrapper');if(backLink){backLink.classList.add('case-back-fixed');document.body.append(backLink);}
const cleanups=[];
const on=(el,event,handler,options)=>{el?.addEventListener(event,handler,options);cleanups.push(()=>el?.removeEventListener(event,handler,options));};
// Start the artwork independently: motion/scroll initialization cannot delay its first frame.
const canvas=$('.hero-canvas');
const sharedScene=createSharedScene($('[data-shared-scene]'));
const homeIntro=initHomeIntro({hero:$('#home')});
const intro=!!canvas&&document.body.dataset.page==='home'&&homeIntro.intro&&!reduce.matches;
let pageGone=false;
if(canvas)initHero(canvas,{intro,getInitialScrollState:sharedScene.getInitialScrollState}).then(controller=>{if(pageGone)controller.dispose();else{heroController=controller;sharedScene.bindRenderer(controller);}}).catch(()=>{
  (canvas.closest('[data-shared-artwork]')||canvas.closest('.hero')||canvas.parentElement).dataset.renderMode='fallback';canvas.style.opacity='0';
});
// The second-fold globe is isolated from the working hero and loads only on home.
let bookController;
const bookRoot=$('[data-book]');
if(bookRoot)import('./book-controller.js').then(({createBookController,setBookScrollImmediate})=>{if(pageGone)return;bookController=createBookController(bookRoot,{scrollTo,scrollImmediate:target=>nativeTouch?setNativeScrollImmediate(window,target):setBookScrollImmediate(scroll,target),getScrollY:()=>currentScrollY(),onLayout:()=>updateScroll()});}).catch(()=>{bookRoot.dataset.bookState='static';});
let experienceController;
const experienceRoot=$('[data-experience-section]');
if(experienceRoot)Promise.all([import('./medical-experiences-controller.js'),import('./book-drag.js')]).then(([{createMedicalExperiences},{setBookScrollImmediate}])=>{if(pageGone)return;experienceController=createMedicalExperiences(experienceRoot,{scrollTo,nativeTouch,scrollImmediate:target=>nativeTouch?setNativeScrollImmediate(window,target):setBookScrollImmediate(scroll,target),getScrollY:()=>currentScrollY(),onLayout:()=>updateScroll()});}).catch(()=>{experienceRoot.dataset.state='static';});
let scienceController;
const scienceRoot=$('[data-science-globe]');
if(scienceRoot)import('./science-globe.js').then(({initScienceGlobe})=>initScienceGlobe(scienceRoot)).then(controller=>{if(pageGone)controller?.dispose();else scienceController=controller;}).catch(()=>{scienceRoot.dataset.globeState='fallback';});
function scrollTo(target, duration=850){if(scroll){scroll.scrollTo(target,{duration:reduce.matches?0:duration,easing:[.87,0,.13,1],disableLerp:reduce.matches});return;}const top=typeof target==='number'?target:target.getBoundingClientRect().top+window.scrollY;if(reduce.matches||duration===0)setNativeScrollImmediate(window,top);else window.scrollTo({top,behavior:'smooth'});}

// Navigation is never gated by WebGL, motion initialization, or media readiness.
const menu=$('#mobile-menu'),menuToggle=$('.menu-toggle');
let menuFocus=null;
function closeMenu(restore=true){if(!menu||menu.hidden)return;document.body.classList.remove('menu-open');syncNativeOverlayLock();menuToggle?.setAttribute('aria-expanded','false');menuToggle?.setAttribute('aria-label','Abrir menu');scroll?.start();setTimeout(()=>{if(!document.body.classList.contains('menu-open'))menu.hidden=true;},reduce.matches?0:750);if(restore)menuFocus?.focus();}
function openMenu(){if(!menu)return;menuFocus=document.activeElement;menu.hidden=false;menuToggle.setAttribute('aria-expanded','true');menuToggle.setAttribute('aria-label','Fechar menu');scroll?.stop();requestAnimationFrame(()=>{document.body.classList.add('menu-open');syncNativeOverlayLock();});setTimeout(()=>$('a',menu)?.focus(),50);}
on(menuToggle,'click',()=>document.body.classList.contains('menu-open')?closeMenu():openMenu());
on(menu,'click',event=>{if(event.target.closest('a'))closeMenu(false);});
on(document,'keydown',event=>{if(event.key==='Escape')closeMenu();if(event.key==='Tab'&&document.body.classList.contains('menu-open')){const focusable=[menuToggle,...$$('a',menu)];const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
on(window,'resize',()=>{if(window.innerWidth>=1024)closeMenu(false);});
$$('[data-back-top]').forEach(button=>on(button,'click',()=>scrollTo(0,700)));
on(document,'click',event=>{const anchor=event.target.closest('a[href]');if(!anchor||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;const url=new URL(anchor.href,location.href);if(url.origin===location.origin&&url.pathname===location.pathname&&url.hash&&!url.hash.startsWith('#percurso/')){const target=document.getElementById(decodeURIComponent(url.hash.slice(1)));if(target){event.preventDefault();history.replaceState({...history.state,innectaScrollY:currentScrollY()},'',location.href);history.pushState(null,'',url.hash);scrollTo(target);if(anchor.classList.contains('skip-link'))target.focus({preventScroll:true});}}});

// Readable by default; reveal observers are added only after a working setup.
const revealElements=$$('.reveal');
if('IntersectionObserver' in window&&!reduce.matches){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-inview');observer.unobserve(entry.target);}}),{rootMargin:'0px 0px 5% 0px',threshold:.01});revealElements.forEach(el=>{if(el.getBoundingClientRect().top<innerHeight)el.classList.add('is-inview');else observer.observe(el);});document.documentElement.classList.add('motion-ready');cleanups.push(()=>observer.disconnect());}else revealElements.forEach(el=>el.classList.add('is-inview'));

function onScroll(y=window.scrollY){sharedScene.update();bookController?.update();experienceController?.update();const diff=y-lastY;if(Math.abs(diff)>2){document.body.classList.toggle('sc-down',diff>0&&y>100);lastY=y;}if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;const h=innerHeight;const footer=$('[data-footer]');document.body.classList.toggle('light-section',!!footer&&footer.getBoundingClientRect().top<h*.65);if(reduce.matches)return;$$('.manifesto-lines>span').forEach(line=>{const rect=line.getBoundingClientRect();const progress=Math.max(0,Math.min(1,(h*.82-rect.top)/(h*.55)));line.style.setProperty('--mask',1-progress);});$$('[data-marquee]').forEach(el=>{const rect=el.parentElement.getBoundingClientRect();el.style.transform=`translate3d(${(h*.5-rect.top)*-.16}px,0,0)`;});$$('[data-tile-row]').forEach((el,i)=>{const rect=el.closest('.tiles').getBoundingClientRect();el.style.transform=`translate3d(${(h*.5-rect.top)*.075*(i%2?1:-1)}px,0,0)`;});if(innerWidth>=1024)$$('[data-parallax]').forEach(el=>{const rect=el.parentElement.getBoundingClientRect();const progress=Math.max(-1,Math.min(1,(h*.5-rect.top-rect.height*.5)/h));el.style.translate=`0 ${progress*Number(el.dataset.parallax)*36}px`;});});}
on(window,'scroll',()=>onScroll(),{passive:true});

// Original local GSAP/Locomotive machinery is progressive enhancement.
try{const motion=await import('./vendor/motion.js');gsap=motion.gsap;if(!reduce.matches&&!nativeTouch){scroll=new motion.LocomotiveScroll({el:main,smooth:true,smoothMobile:.5,touchMultiplier:3.5,useKeyboard:true,tablet:{smooth:true},smartphone:{smooth:true,horizontalGesture:true}});scroll.on('scroll',event=>onScroll(event.scroll?.y||0));document.body.dataset.scrollEngine='locomotive';}else document.body.dataset.scrollEngine=nativeTouch?'native-touch':'native-reduced';}catch(error){document.body.dataset.scrollEngine='native-fallback';document.documentElement.classList.remove('has-scroll-smooth','has-scroll-init');document.body.style.overflow='';main.style.transform='';console.warn('THE MED: native scrolling retained.',error);}
function updateScroll(){scroll?.update();onScroll(currentScrollY());}
$$('.principle-loop').forEach(video=>{video.muted=true;on(video,'error',()=>video.parentElement.classList.add('media-failed'));if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting&&!reduce.matches)video.play().catch(()=>{});else video.pause();}),{rootMargin:'100px'});observer.observe(video);cleanups.push(()=>observer.disconnect());}});
$$('img').forEach(img=>{if(!img.complete)on(img,'load',updateScroll,{once:true});});
document.fonts?.ready.then(updateScroll);on(window,'load',updateScroll,{once:true});
setTimeout(updateScroll,120);setTimeout(updateScroll,800);

// Adopt the head-started welcome; no session flag and no delayed first-paint gate.
let copyCycle={dispose(){}};
homeIntro.whenStarted.then(()=>{if(!pageGone)copyCycle=createHeroCopyCycle($('.hero-sentence'),gsap,{reducedMotion:reduce.matches,delay:homeIntro.introDelay});});

const videoControllers=enhanceVideos(document);cleanups.push(()=>videoControllers.forEach(controller=>controller.destroy()));
// Native video controls remain available. Custom cover only initiates playback.
$$('[data-play-video]').forEach(button=>{const video=document.getElementById(button.dataset.playVideo);on(button,'click',async()=>{try{await video.play();button.hidden=true;}catch{button.hidden=true;video.focus();}});on(video,'play',()=>button.hidden=true);on(video,'ended',()=>button.hidden=false);on(video,'error',()=>{button.hidden=true;video.insertAdjacentHTML('afterend','<p class="media-error">Não foi possível reproduzir o tour. Explore as interfaces nas páginas dos módulos.</p>');});});

// Accessible full-screen editorial modal, history-aware and repeat-safe.
const dialog=$('.profile-dialog');let modalVideoControllers=[];let activeProfile=null,modalFocus=null,carouselIndex=0,carouselToken=0,modalPushed=false;
function profileFromHash(hash=location.hash){if(!hash.startsWith('#percurso/'))return null;return allProfiles.find(p=>p.id===decodeURIComponent(hash.slice('#percurso/'.length)));}
function renderCarousel(delta){if(!activeProfile)return;const gallery=activeProfile.gallery?.length?activeProfile.gallery:[activeProfile.image||activeProfile.cover];carouselIndex=(carouselIndex+delta+gallery.length)%gallery.length;const token=++carouselToken;const image=$('[data-carousel-image]',dialog),count=$('[data-carousel-count]',dialog);if(count)count.textContent=`${carouselIndex+1} / ${gallery.length}`;if(!image)return;image.style.opacity='0';setTimeout(()=>{if(token!==carouselToken||!activeProfile)return;image.src=gallery[carouselIndex];image.alt=`${activeProfile.title}: interface ${carouselIndex+1}`;image.onload=()=>image.style.opacity='1';if(image.complete)image.style.opacity='1';},reduce.matches?0:120);}
function openProfile(profile,push=true){if(!profile||!dialog)return;modalFocus=document.activeElement;activeProfile=profile;carouselIndex=0;modalVideoControllers.forEach(controller=>controller.destroy());$('.modal-content',dialog).innerHTML=renderProfileModal(profile);modalVideoControllers=enhanceVideos(dialog);dialog.setAttribute('aria-labelledby','profile-title');if(!dialog.open)dialog.showModal();scroll?.stop();document.body.classList.add('modal-open');syncNativeOverlayLock();if(push){history.replaceState({...history.state,innectaScrollY:currentScrollY()},'',location.href);history.pushState({innectaModal:profile.id},'',`#percurso/${profile.id}`);modalPushed=true;}else modalPushed=!!history.state?.innectaModal;setTimeout(()=>$('[data-modal-close]',dialog)?.focus(),0);const slider=$('.profile-slider',dialog);let downX=0;if(slider){slider.onpointerdown=event=>downX=event.clientX;slider.onpointerup=event=>{if(Math.abs(event.clientX-downX)>50)renderCarousel(event.clientX<downX?1:-1);};}}
function dismissProfile(restore=true){if(!dialog?.open)return;$$('video',dialog).forEach(video=>video.pause());modalVideoControllers.forEach(controller=>controller.destroy());modalVideoControllers=[];dialog.close();activeProfile=null;carouselToken++;document.body.classList.remove('modal-open');syncNativeOverlayLock();scroll?.start();if(restore)modalFocus?.focus();}
function closeProfile(){const didPush=modalPushed;dismissProfile();modalPushed=false;if(didPush)history.back();else history.replaceState(null,'',location.pathname+location.search);}
on(document,'click',event=>{const opener=event.target.closest('[data-profile]');if(opener){const profile=allProfiles.find(p=>p.id===opener.dataset.profile||p.slug===opener.dataset.profile);openProfile(profile);}});
on(dialog,'click',event=>{if(event.target.closest('[data-modal-close]'))closeProfile();if(event.target.closest('[data-carousel-prev]'))renderCarousel(-1);if(event.target.closest('[data-carousel-next]'))renderCarousel(1);if(event.target.closest('[data-modal-top]'))(innerWidth<1024?$('.profile-modal',dialog):$('[data-modal-scroll]',dialog))?.scrollTo({top:0,behavior:reduce.matches?'auto':'smooth'});});
on(dialog,'cancel',event=>{event.preventDefault();closeProfile();});
on(dialog,'keydown',event=>{if(event.key==='ArrowRight')renderCarousel(1);if(event.key==='ArrowLeft')renderCarousel(-1);});
on(window,'popstate',event=>{const profile=profileFromHash();if(profile)openProfile(profile,false);else{dismissProfile();const target=location.hash?document.getElementById(decodeURIComponent(location.hash.slice(1))):null;if(typeof event.state?.innectaScrollY==='number')scrollTo(event.state.innectaScrollY,0);else if(target)scrollTo(target,0);else scrollTo(0,0);}});
const initialProfileHash=homeIntro.initialHash||location.hash,initialProfile=profileFromHash(initialProfileHash);if(initialProfile){if(homeIntro.intro)homeIntro.whenStarted.then(()=>{if(!pageGone)setTimeout(()=>{if(!pageGone&&location.hash===initialProfileHash)openProfile(initialProfile,false);},homeIntro.remainingMs);});else openProfile(initialProfile,false);}

// Unobtrusive demonstration disclaimer; never invent client/people claims.
const notice=document.createElement('p');notice.className='interface-notice';notice.textContent=imageNotice;
const noticeTarget=$('.project--details')||$('#directory-grid')||$('.reel-caption');if(!$('.interface-notice'))noticeTarget?.insertAdjacentElement('afterend',notice);

// Cursor is an addition, not a replacement for the system pointer.
const cursor=$('.dot-cursor');
if(cursor&&matchMedia('(pointer:fine)').matches&&!reduce.matches){on(document,'pointermove',event=>{cursor.style.left=`${event.clientX}px`;cursor.style.top=`${event.clientY}px`;cursor.style.opacity='1';const target=event.target.closest('[data-cursor]');cursor.classList.toggle('active',!!target);$('span',cursor).textContent=target?.dataset.cursor||'';},{passive:true});on(document,'pointerleave',()=>cursor.style.opacity='0');}
const originalHash=homeIntro.initialHash||location.hash;if(originalHash&&!originalHash.startsWith('#percurso/')){const target=document.getElementById(decodeURIComponent(originalHash.slice(1)));if(target)homeIntro.whenStarted.then(()=>{if(!pageGone)setTimeout(()=>{if(!pageGone&&(!location.hash||location.hash===originalHash))scrollTo(target,0);},Math.max(250,homeIntro.remainingMs));});}
// Lifecycle cleanup keeps back/forward cache and context recovery predictable.
on(window,'pagehide',event=>{if(event.persisted){scroll?.stop();heroController?.setVisible(false);scienceController?.setVisible(false);bookController?.setVisible(false);experienceController?.setVisible(false);sharedScene.setVisible(false);return;}pageGone=true;nativeScrollLock?.dispose();homeIntro.dispose();copyCycle.dispose();heroController?.dispose();scienceController?.dispose();bookController?.dispose();experienceController?.dispose();sharedScene.dispose();scroll?.destroy();cleanups.splice(0).forEach(fn=>fn());});
on(window,'pageshow',event=>{if(event.persisted){navigating=false;gsap?.set([main,$('.site-header')].filter(Boolean),{clearProps:'opacity,transform'});const c=$('.dot-cursor');if(c){c.style.opacity='0';c.classList.remove('active');}scroll?.start();heroController?.setVisible(true);scienceController?.setVisible(true);bookController?.setVisible(true);experienceController?.setVisible(true);sharedScene.setVisible(true);updateScroll();}});
document.body.dataset.ready='true';updateScroll();

// Source-style route choreography around normal, directly loadable HTML links.
if(gsap&&!reduce.matches&&document.body.dataset.page==='project'){
  gsap.fromTo($('.case-back-fixed .background'),{opacity:0,scale:.6},{opacity:1,scale:1,duration:.6,delay:2.2,ease:'power3.out',clearProps:'all'});
  gsap.fromTo($('.case-back-fixed .content'),{opacity:0,xPercent:100},{opacity:1,xPercent:0,duration:.6,delay:2.45,ease:'power3.out',clearProps:'all'});
  gsap.fromTo($('.project--title'),{opacity:0,yPercent:50},{opacity:1,yPercent:0,duration:.8,delay:2.45,ease:'power3.out',clearProps:'all'});
  gsap.fromTo($('.project--thumbnail'),{opacity:0,yPercent:20},{opacity:1,yPercent:0,duration:.8,delay:2.5,ease:'power3.out',clearProps:'all'});
}
let navigating=false;
on(document,'click',event=>{const anchor=event.target.closest('a[href]');if(!anchor||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||anchor.target==='_blank'||anchor.hasAttribute('download'))return;const url=new URL(anchor.href,location.href);if(url.origin!==location.origin||url.pathname===location.pathname||reduce.matches||!gsap)return;event.preventDefault();if(navigating)return;navigating=true;closeMenu(false);const duration=document.body.dataset.page==='project'&&url.pathname.startsWith('/modulos/')?.4:.85;gsap.to(main,{opacity:0,y:-25,duration,ease:'power3.inOut'});gsap.to($('.site-header'),{opacity:0,duration});setTimeout(()=>location.assign(url.href),duration*1000);});
