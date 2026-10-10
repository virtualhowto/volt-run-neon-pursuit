import * as T from 'three';
import {ZONES,PLATFORMS,KICKERS,ROADBLOCKS,zoneAt,surfaceAt,roadblockHit} from './playground-layout.js';
export function buildPlayground(scene){
 const group=new T.Group();scene.add(group);
 const materials=new Map();
 function box(w,h,d,x,y,z,color){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.65,metalness:.25}));const m=new T.Mesh(new T.BoxGeometry(w,h,d),materials.get(color));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;group.add(m);return m;}
 function sign(text,x,y,z,color){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#101923';ctx.fillRect(0,0,1024,128);ctx.fillStyle='#'+color.toString(16).padStart(6,'0');ctx.fillRect(0,115,1024,13);ctx.font='bold 44px sans-serif';ctx.textAlign='center';ctx.fillText(text,512,78);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(16,2),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));m.position.set(x,y,z);group.add(m);}
 for(const zone of ZONES.slice(1)){const z=-zone.start;sign(zone.name,0,9,z,zone.color);for(const x of [-9,9])box(.2,10,.2,x,5,z,zone.color);}
 for(const p of PLATFORMS){box(p.w,.5,p.d,p.x,p.y-.25,p.z,p.color);for(const side of [-1,1]){box(.08,.08,p.d,p.x+side*(p.w/2-.1),p.y+.08,p.z,0x60d9ff);for(const dz of [-p.d/2+3,p.d/2-3])box(.4,p.y,.4,p.x+side*2,p.y/2,p.z+dz,0x26313c);}if(p.y===6){for(const dz of [-15,15]){box(.7,1.2,2,p.x-2,p.y+.6,p.z+dz,0x84969d);}}else{for(let dz=-p.d/2;dz<p.d/2;dz+=2)box(p.w,.09,.09,p.x,p.y-.7,p.z+dz,0xb97d4c);}}
 const ramps=KICKERS.map(k=>{const m=box(4.4,.25,8,k.x,k.base+1,k.z,0x333e4a);m.rotation.x=.24;for(const side of [-1,1]){const edge=box(.14,.12,8,k.x+side*2.1,k.base+1.15,k.z,k.color);edge.rotation.x=.24;}return {...k,used:false,mega:false};});
 // Concrete transitions around the rideable central plaza.
 for(const z of [-980,-1170,-1380])for(const side of [-1,1]){for(let i=0;i<8;i++){const h=.15+(i/7)**2*2.7;box(.42,h,20,side*(7.4+i*.4),h/2,z,0x8b919c);}box(.12,.12,22,side*7.1,.15,z,0xec80ff);}
 // Crane, suspended load and stacked cargo frame the construction route.
 for(let h=0;h<24;h+=3){box(1.1,2.9,1.1,10,h+1.45,-1880,0xd3972e);box(1.5,.12,1.5,10,h,-1880,0x353a43);}
 box(21,.7,.8,1,24,-1880,0xf0b73d);box(.08,12,.08,-6,18,-1880,0x242d36);box(2,.3,3,-6,12,-1880,0xd79b33);
 for(const z of [-1700,-1990,-2060])for(const side of [-1,1]){box(2.5,2.6,12,side*9,1.3,z,side===1?0xa36636:0x35727a);}
 const blocks=ROADBLOCKS.map(b=>{const meshes=[];for(let bx=-8;bx<=8;bx+=2){if(Math.abs(bx-b.gap)<2.4)continue;meshes.push(box(1.8,1.2,.7,bx,.6,b.z,0x233545));meshes.push(box(1.8,.18,.75,bx,.85,b.z,0xf3ca48));const lamp=box(.4,.18,.4,bx,1.3,b.z,0xff3e4e);meshes.push(lamp);}return {...b,meshes,passed:false};});
 return {ramps,zoneAt,surfaceAt,reset(){ramps.forEach(r=>r.used=false);blocks.forEach(b=>{b.passed=false;b.failed=false;});},update(time,active){for(const b of blocks)b.meshes.forEach((m,i)=>{m.visible=active;if(i%3===2)m.scale.y=1+Math.sin(time*12)*.3;});},check(x,y,z,active){if(!active)return null;for(const b of blocks){if(roadblockHit(x,y,z,b)){b.failed=true;return 'hit';}if(!b.passed&&z<b.z-2&&z>b.z-8){b.passed=true;if(!b.failed)return 'clear';}}return null;}};
}
