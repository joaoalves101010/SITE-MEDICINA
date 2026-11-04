import test from 'node:test';
import assert from 'node:assert/strict';
import {initAtlasVideo} from '../js/atlas-video.js';
import {renderAtlasSection} from '../js/ecosystem-sections.js';
function fixture({reduced=false,saveData=false}={}){
 const doc=new EventTarget();doc.hidden=false;
 const reduce=new EventTarget();reduce.matches=reduced;
 const win=new EventTarget();win.matchMedia=()=>reduce;win.navigator={connection:{saveData}};
 let intersect,disconnected=false;
 win.IntersectionObserver=class{constructor(cb){intersect=cb;}observe(){}disconnect(){disconnected=true;}};
 const video=new EventTarget();Object.assign(video,{ownerDocument:doc,paused:true,plays:0,parentElement:{querySelector:()=>fallback},play(){this.plays++;this.paused=false;this.dispatchEvent(new Event('play'));return Promise.resolve();},pause(){if(this.paused)return;this.paused=true;this.dispatchEvent(new Event('pause'));}});
 const fallback={hidden:true};const controller=initAtlasVideo(video,win);
 return {video,doc,win,reduce,fallback,controller,intersect:v=>intersect([{isIntersecting:v}]),get disconnected(){return disconnected;}};
}
test('full-resolution native, silent, inline loop defers fetching and keeps a fallback',()=>{
 const html=renderAtlasSection();assert.match(html,/controls muted loop playsinline preload="none"/);assert.match(html,/width="3420" height="1786"/);assert.match(html,/atlas-tour.mp4/);assert.match(html,/eco-video-fallback/);assert.doesNotMatch(html,/<video[^>]*autoplay/);
});
test('visible-only playback, hidden-tab pause, remembered manual pause, cleanup',()=>{
 const f=fixture();assert.equal(f.video.plays,0);f.intersect(true);assert.equal(f.video.paused,false);f.intersect(false);assert.equal(f.video.paused,true);f.intersect(true);assert.equal(f.video.paused,false);f.video.pause();f.intersect(false);f.intersect(true);assert.equal(f.video.paused,true);f.video.play();f.doc.hidden=true;f.doc.dispatchEvent(new Event('visibilitychange'));assert.equal(f.video.paused,true);f.doc.hidden=false;f.doc.dispatchEvent(new Event('visibilitychange'));assert.equal(f.video.paused,false);f.controller.dispose();assert.equal(f.disconnected,true);assert.equal(f.video.paused,true);
});
test('reduced motion and data saver retain manual native playback; errors reveal image link',()=>{
 for(const options of [{reduced:true},{saveData:true}]){const f=fixture(options);f.intersect(true);assert.equal(f.video.plays,0);f.video.play();assert.equal(f.video.paused,false);f.video.dispatchEvent(new Event('error'));assert.equal(f.video.hidden,true);assert.equal(f.fallback.hidden,false);f.controller.dispose();}
});
