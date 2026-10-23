/** Original Innecta SDF compositor, informed by the observed Morphin Viscose behavior.
 * No component source/shader copied. Rounded fields, smooth unions and tapered
 * strands are standard analytic distance-field constructions. */
export const VISCOSE_MAX_CARDS=8;
export const viscoseVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export const viscoseFragment=`
precision highp float;
#define N ${VISCOSE_MAX_CARDS}
varying vec2 vUv;
uniform vec2 uResolution,uSize,uGrid;
uniform vec2 uPositions[N],uLinkA[N],uLinkB[N];
uniform vec4 uCards[N],uLinks[N];
uniform float uAngles[N];
uniform float uCount,uLinkCount,uCorner,uUnion,uBlend,uTime,uBirth,uTextured;
uniform vec4 uPointer,uWake,uGlass,uTag;
uniform vec3 uInk,uPage;
uniform sampler2D uAtlas,uTagMap;
float roundedRect(vec2 p,vec2 h,float r){vec2 q=abs(p)-h+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
float mergeFields(float a,float b,float radius){float h=max(radius-abs(a-b),0.)/max(radius,.0001);return min(a,b)-h*h*radius*.25;}
float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float softNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y)*2.-1.;}
vec2 cellUV(vec2 p,float cell){return (vec2(mod(cell,uGrid.x),floor(cell/uGrid.x))+clamp(p,.003,.997))/uGrid;}
float strand(vec2 p,vec2 a,vec2 b,vec4 shape){vec2 segment=b-a;float len=length(segment);if(len<.01)return 1e5;vec2 along=segment/len,across=vec2(-along.y,along.x);vec2 q=p-(a+b)*.5;float t=clamp(dot(q,along)/len+.5,0.,1.);float arc=4.*t*(1.-t);float width=mix(shape.x,shape.y,pow(arc,.85));float lateral=dot(q,across)+shape.z*arc*across.y;return max(abs(dot(q,along))-len*.5,abs(lateral)-width);}
// Analytic rounded-box gradient, used only by the original focus lens.
vec2 focusGlassNormal(vec2 local,vec2 halfSize,float radius){
 vec2 edge=abs(local)-halfSize+radius,corner=max(edge,0.);
 vec2 direction=length(corner)>.0001?corner/max(length(corner),.0001):(edge.x>edge.y?vec2(1.,0.):vec2(0.,1.));
 return direction*sign(local);
}
void main(){
 vec2 original=(vUv-.5)*uResolution,p=original;
 float lip=max(0.,(abs(p.y)-uResolution.y*.42)/max(1.,uResolution.y*.08));lip=clamp(lip,0.,1.);float bend=1.-sqrt(max(0.,1.-lip*lip));
 p.y-=sign(p.y)*bend*(uGlass.x+sin(p.x*.02)*uGlass.z);p.x*=1.-bend*uGlass.y;
 // Keep the silhouette anchored to the cursor while refracting the scene
 // beneath it. A circular lens profile concentrates displacement at the rim.
 vec2 focusHalf=max(vec2(.001),vec2(52.,20.)*abs(uTag.zw));float focusRadius=min(20.,min(focusHalf.x,focusHalf.y));
 float focusDistance=roundedRect(original-uTag.xy,focusHalf,focusRadius),focusOn=min(abs(uTag.z),abs(uTag.w));
 vec2 focusNormal=focusGlassNormal(original-uTag.xy,focusHalf,focusRadius);
 if(focusOn>.001&&focusDistance<0.){float edgeWeight=1.-clamp(-focusDistance/max(1.,focusHalf.y),0.,1.);p+=focusNormal*39.5*(1.-sqrt(max(0.,1.-edgeWeight*edgeWeight)));}
 float pointerDistance=length(p-uPointer.xy);float halo=1.-smoothstep(0.,max(1.,uWake.x),pointerDistance);float unionRadius=uUnion+uPointer.w*uPointer.z*halo*halo;
 float field=1e6,nearest=1e6,second=1e6,cell0=0.,cell1=0.,shade0=1.,shade1=1.;vec2 uv0=vec2(.5),uv1=vec2(.5);
 for(int i=0;i<N;i++){
  if(float(i)>=uCount)break;vec4 card=uCards[i];float growth=max(card.x,card.y);if(growth<.0001)continue;
  // Nearest texture coordinates are required even far from a card: a long
  // liquid strand must stretch its adjacent photographs, never a default cell.
  vec2 q=p-uPositions[i];
  float c=cos(uAngles[i]),s=sin(uAngles[i]);q=vec2(c*q.x+s*q.y,-s*q.x+c*q.y);
  vec2 halfSize=max(uSize*.5*card.xy,vec2(.001));float maxRadius=min(halfSize.x,halfSize.y);float radius=mix(maxRadius,min(uCorner,maxRadius),smoothstep(.3,1.,min(card.x,card.y)));
  float distance=roundedRect(q,halfSize,radius);field=mergeFields(field,distance,unionRadius);vec2 local=q/(2.*halfSize)+.5;local.y=1.-local.y;
  if(distance<nearest){second=nearest;uv1=uv0;cell1=cell0;shade1=shade0;nearest=distance;uv0=local;cell0=card.w;shade0=card.z;}else if(distance<second){second=distance;uv1=local;cell1=card.w;shade1=card.z;}
 }
 for(int i=0;i<N;i++){
  if(float(i)>=uLinkCount)break;vec4 link=uLinks[i];if(link.x < -3.)continue;vec2 mid=(uLinkA[i]+uLinkB[i])*.5;float reach=length(uLinkB[i]-uLinkA[i])*.5+max(link.x,0.)+link.w+8.;if(distance(p,mid)>reach)continue;field=mergeFields(field,strand(p,uLinkA[i],uLinkB[i],link),link.w);
 }
 if(uBirth>.001)field+=softNoise(p*.018+vec2(uTime*.19,-uTime*.13))*uBirth;
 if(uWake.y>.001)field+=sin(pointerDistance*.05-uTime*7.)*uWake.y*exp(-pointerDistance/max(1.,uWake.x));
 float aa=clamp(fwidth(field),.5,2.);float alpha=1.-smoothstep(-aa,aa,field);vec3 color=uInk;float mixAmount=smoothstep(-uBlend,uBlend,second-nearest);
 if(uTextured>.5){vec3 a=texture2D(uAtlas,cellUV(uv0,cell0)).rgb,b=texture2D(uAtlas,cellUV(uv1,cell1)).rgb;color=mix(b,a,mixAmount);}color*=mix(shade1,shade0,mixAmount);color+=bend*uGlass.w;
 // Frost, directional edge light, and per-pixel ink inversion remain in
 // screen space; only the underlying imagery went through the optical warp.
 float focusAA=clamp(fwidth(focusDistance),.5,2.);
 if(focusOn>.001){float ta=1.-smoothstep(-focusAA,focusAA,focusDistance);if(ta>.001){
 vec3 under=mix(uPage,color,alpha),glass=mix(under,vec3(1.),.16);
 float rim=clamp(1.+focusDistance/max(1.,focusRadius),0.,1.);glass+=rim*rim*.02*dot(focusNormal,normalize(vec2(-1.,1.)));
 vec2 tuv=(original-uTag.xy)/(focusHalf*2.)+.5;float mask=texture2D(uTagMap,clamp(tuv,0.,1.)).a;float lum=dot(glass,vec3(.2126,.7152,.0722));
 glass=mix(glass,vec3(1.-smoothstep(.46,.54,lum)),mask);color=mix(color,glass,ta);alpha=max(alpha,ta);
 }}
 if(alpha<.001)discard;gl_FragColor=vec4(color,alpha);
}`;
