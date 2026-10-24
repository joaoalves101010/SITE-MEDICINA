import test from 'node:test';
import assert from 'node:assert/strict';
import {usesNativeTouchScroll,readScrollPosition,setNativeScrollImmediate,createNativeScrollLock} from './scroll-policy.js';
const device=(coarse,fine,touches)=>({matchMedia:q=>({matches:q==='(pointer: coarse)'?coarse:q==='(pointer: fine)'?fine:false}),navigator:{maxTouchPoints:touches}});
test('iPhone and touch-first tablet use native scrolling, desktop and fine-pointer hybrids retain the approved engine',()=>{
 assert.equal(usesNativeTouchScroll(device(true,false,5)),true);assert.equal(usesNativeTouchScroll(device(false,true,0)),false);assert.equal(usesNativeTouchScroll(device(false,true,10)),false);assert.equal(usesNativeTouchScroll({navigator:{maxTouchPoints:5}}),true);assert.equal(usesNativeTouchScroll({}),false);
});
test('native coordinates never read a stale virtual scroll instance; desktop zero stays zero',()=>{
 const virtual={scroll:{instance:{scroll:{y:1234}}}},win={scrollY:321};assert.equal(readScrollPosition(virtual,win,true),321);assert.equal(readScrollPosition(virtual,win,false),1234);virtual.scroll.instance.scroll.y=0;assert.equal(readScrollPosition(virtual,win,false),0);assert.equal(readScrollPosition(undefined,win),321);
});
test('Safari-compatible immediate scroll neutralizes global smooth CSS only for the synchronous call and restores it',()=>{
 let value='smooth',priority='';const calls=[];const style={getPropertyValue:()=>value,getPropertyPriority:()=>priority,setProperty(k,v,p=''){value=v;priority=p},removeProperty(){value='';priority=''}};const win={document:{documentElement:{style}},scrollTo(options){calls.push(options);assert.equal(value,'auto');assert.equal(priority,'important')}};
 setNativeScrollImmediate(win,420);assert.deepEqual(calls,[{top:420,behavior:'auto'}]);assert.equal(value,'smooth');assert.equal(priority,'');setNativeScrollImmediate(win,NaN);assert.equal(calls.length,1);
});
test('immediate CSS guard is restored even when scrollTo fails',()=>{let value='smooth';const win={document:{documentElement:{style:{get scrollBehavior(){return value},set scrollBehavior(v){value=v}}}},scrollTo(){throw Error('unavailable')}};assert.throws(()=>setNativeScrollImmediate(win,1));assert.equal(value,'smooth');});
test('native menu/modal lock preserves offset and restores every prior inline style without a persistent body lock',()=>{
 const style={position:'relative',top:'',left:'',right:'',width:'',overflow:'auto'},calls=[];const win={scrollY:840,document:{body:{style},documentElement:{style:{scrollBehavior:'smooth'}}},scrollTo:options=>calls.push(options)};
 const lock=createNativeScrollLock(win);lock.set(true);assert.equal(style.position,'fixed');assert.equal(style.top,'-840px');assert.equal(lock.position,840);win.scrollY=0;lock.set(true);assert.equal(lock.position,840);lock.set(false);assert.equal(style.position,'relative');assert.equal(style.overflow,'auto');assert.equal(style.top,'');assert.equal(lock.locked,false);assert.deepEqual(calls,[{top:840,behavior:'auto'}]);lock.dispose();assert.equal(calls.length,1);
});
