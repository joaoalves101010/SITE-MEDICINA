/** Reproducible local preprocessing; original D3 copyright headers are kept in
 * the read-only source assets. d3-array © Mike Bostock; d3-geo © Mike Bostock and
 * Charles Karney. D3 is used only here, not shipped or injected into window. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { GLOBE_VIEW, projectPoint, clipSegment, graticuleLines } from '../js/science-globe.js';
const base=fileURLToPath(new URL('../',import.meta.url));
const source=path.join(base,'tools/globe-source');
const output=path.join(base,'assets/science-globe');
fs.mkdirSync(output,{recursive:true});
const sandbox=vm.createContext({});
for(const name of ['d3-array.min.js','d3-geo.min.js'])vm.runInContext(fs.readFileSync(path.join(source,name),'utf8'),sandbox);
const geo=sandbox.d3;
const countries=JSON.parse(fs.readFileSync(path.join(source,'countries.json'),'utf8'));
const features=countries.features.map(feature=>({feature,bounds:geo.geoBounds(feature)}));
const brazil=features.find(item=>item.feature.properties.ADM0_A3==='BRA').feature;
const insideBounds=([lon,lat],[[west,south],[east,north]])=>lat>=south&&lat<=north&&(west<=east?lon>=west&&lon<=east:lon>=west||lon<=east);
const dots=[];
for(let lat=-88.2;lat<=88.2;lat+=1.6){
 for(let lon=-179.2;lon<180;lon+=1.6){
  const point=[Number(lon.toFixed(2)),Number(lat.toFixed(2))];
  const land=features.find(item=>insideBounds(point,item.bounds)&&geo.geoContains(item.feature,point));
  if(land)dots.push([...point,land.feature.properties.ADM0_A3==='BRA'?1:0]);
 }
}
function lines(feature){return feature.geometry.type==='Polygon'?feature.geometry.coordinates:feature.geometry.coordinates.flat();}
const borders=countries.features.flatMap(lines);
const brazilLines=lines(brazil);
const data={version:1,view:GLOBE_VIEW,spacingDegrees:1.6,dots,borders,brazil:brazilLines};
fs.writeFileSync(path.join(output,'geography.json'),JSON.stringify(data));
const size=1000,r=475,c=500;
const fixed=n=>n.toFixed(2);
function pathFor(lines){let d='';for(const line of lines){let a=null;for(const coords of line){const b=projectPoint(...coords);if(a){const seg=clipSegment(a,b);if(seg)d+=`M${fixed(c+seg[0].x*r)},${fixed(c-seg[0].y*r)}L${fixed(c+seg[1].x*r)},${fixed(c-seg[1].y*r)}`;}a=b;}}return d;}
const fills=brazilLines.map(line=>{const points=line.map(coords=>projectPoint(...coords)).filter(p=>p.visible);return `<path d="${points.map((p,i)=>`${i?'L':'M'}${fixed(c+p.x*r)},${fixed(c-p.y*r)}`).join('')}Z" fill="#b26880" fill-opacity=".24"/>`;}).join('');
const dotGroups=Array.from({length:8},()=>[]);
for(const [lon,lat,bra]of dots){const p=projectPoint(lon,lat);if(p.z>.008)dotGroups[(bra?4:0)+Math.min(3,Math.floor(p.z*4))].push(p);}
const dotMarkup=dotGroups.map((points,i)=>`<g fill="${i<4?'#f7efe2':'#da9bb0'}" fill-opacity="${fixed(i<4?.68+(i%4)*.08:.8+(i%4)*.06)}">${points.map(p=>`<circle cx="${fixed(c+p.x*r)}" cy="${fixed(c-p.y*r)}" r="${fixed(Math.max(.62,Math.min(1.4,size/800))*(.68+(i%4)*.11))}"/>`).join('')}</g>`).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none"><circle cx="500" cy="500" r="475" fill="#100a0e"/>${fills}<path d="${pathFor(graticuleLines())}" stroke="#f3e9d8" stroke-opacity=".38" stroke-width=".556"/><path d="${pathFor(borders)}" stroke="#f3e9d8" stroke-opacity=".74" stroke-width=".667"/>${dotMarkup}<path d="${pathFor(brazilLines)}" stroke="#dea0b3" stroke-opacity=".85"/><circle cx="500" cy="500" r="475" stroke="#f7efe2" stroke-opacity=".72" stroke-width=".77"/></svg>`;
fs.writeFileSync(path.join(output,'fallback.svg'),svg);
console.log(JSON.stringify({dots:dots.length,brazilDots:dots.filter(p=>p[2]).length,borderRings:borders.length,geographyBytes:fs.statSync(path.join(output,'geography.json')).size,fallbackBytes:Buffer.byteLength(svg)}));
