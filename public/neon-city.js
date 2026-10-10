import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
export function createNeonCity(scene,renderer,camera,sun){
 scene.children.filter(o=>o.type==='Sky'||o.material?.type==='ShaderMaterial'&&o.geometry?.type==='BoxGeometry').forEach(o=>scene.remove(o));
 scene.background=new T.Color(0x030914);scene.fog=new T.FogExp2(0x071426,.013);
 const hemi=scene.children.find(o=>o.isHemisphereLight);hemi.color.set(0x7aabdb);hemi.groundColor.set(0x17172d);hemi.intensity=.65;sun.color.set(0x87b5f9);sun.intensity=.65;renderer.toneMappingExposure=1;
 const glow=(color,power=2)=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:power,roughness:.3});
 const materials=[glow(0x19d9ff),glow(0xd52cff),glow(0xffa960)];
 const box=(w,h,d,x,y,z,m)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);scene.add(o);return o;};
 const lit=[];
 for(const o of [...scene.children]){if(!o.isMesh)continue;const g=o.geometry.parameters;
 if(g.width===18&&g.depth===4000){o.material=new T.MeshPhysicalMaterial({map:o.material.map,bumpMap:o.material.map,bumpScale:.017,color:0x626e81,metalness:.25,roughness:.27,clearcoat:1,clearcoatRoughness:.07});}
 if(g.height>7&&g.depth===22){o.material.color.set(0x40516a);o.material.roughness=.46;const side=Math.sign(o.position.x),edge=o.position.x-side*g.width/2;const m=materials[lit.length%3];box(.1,g.height,.1,edge-side*.06,g.height/2,o.position.z-8,m);box(.14,.12,15,edge-side*.1,4.5,o.position.z,m);lit.push(o);}
 // Convert roadside foliage to illuminated district sculptures.
 if(o.geometry.type==='IcosahedronGeometry'){o.material=new T.MeshStandardMaterial({color:0x153542,metalness:.6,roughness:.3,wireframe:true,emissive:0x087588,emissiveIntensity:.5});}
 }
 const env=new T.Scene();env.background=new T.Color(0x172236);for(let i=0;i<8;i++){const panel=new T.Mesh(new T.PlaneGeometry(12,25),materials[i%3]);panel.position.set(Math.cos(i*Math.PI/4)*18,8,Math.sin(i*Math.PI/4)*18);panel.lookAt(0,4,0);env.add(panel);}
 const pmrem=new T.PMREMGenerator(renderer);const old=scene.environment;scene.environment=pmrem.fromScene(env,.08).texture;old?.dispose();scene.environmentIntensity=.28;pmrem.dispose();
 for(let i=0;i<70;i++){const z=-i*45;for(const side of [-1,1]){box(.06,.02,36,side*8,.025,z,materials[i%3]);if(i%4===0){const light=new T.PointLight(side<0?0x16c9ff:0xd733ff,18,22,2);light.position.set(side*7,3,z);scene.add(light);light.userData.districtLight=true;}}}
 function sign(text,color){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#06111d';ctx.fillRect(0,0,1024,256);ctx.strokeStyle=color;ctx.lineWidth=8;ctx.strokeRect(10,10,1004,236);ctx.fillStyle=color;ctx.font='bold 80px sans-serif';ctx.textAlign='center';ctx.fillText(text,512,156);return new T.CanvasTexture(c);}
 for(let i=0;i<22;i++){const side=i%2?1:-1;const texture=sign(['NEON PURSUIT','ION DISTRICT','CHARGE // 48V','AFTERHOURS'][i%4],i%2?'#ff50de':'#5fe9ff');const mesh=new T.Mesh(new T.PlaneGeometry(9,2.25),new T.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:0xffffff,emissiveIntensity:1.5,side:T.DoubleSide}));mesh.position.set(side*12,7,-i*140-30);mesh.rotation.y=-side*Math.PI/2;scene.add(mesh);}
 const count=1600,positions=new Float32Array(count*6);const rainGeometry=new T.BufferGeometry();rainGeometry.setAttribute('position',new T.BufferAttribute(positions,3));const rain=new T.LineSegments(rainGeometry,new T.LineBasicMaterial({color:0x8db9d1,transparent:true,opacity:.25,depthWrite:false}));rain.frustumCulled=false;scene.add(rain);
 const drops=Array.from({length:count},()=>({x:Math.random()*50-25,y:Math.random()*26,z:Math.random()*85-60}));
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.5,.5,1.05);composer.addPass(bloom);composer.addPass(new OutputPass());
 let quality='high';try{quality=localStorage.getItem('neon-quality')||'high';}catch{}
 const control=document.createElement('select');control.id='graphicsQuality';control.setAttribute('aria-label','Graphics quality');for(const [id,label]of [['high','NEON / HIGH'],['low','NEON / LOW']]){const opt=document.createElement('option');opt.value=id;opt.textContent=label;control.append(opt);}control.value=quality;document.querySelector('header')?.append(control);if(!control.isConnected)document.body.append(control);
 function apply(){quality=control.value;renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='high'?1.5:1));renderer.shadowMap.enabled=quality==='high';bloom.enabled=quality==='high';rain.visible=quality==='high';composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);try{localStorage.setItem('neon-quality',quality);}catch{}}
 control.onchange=apply;apply();window.addEventListener('resize',()=>composer.setSize(innerWidth,innerHeight));
 return {render(z,time){for(const light of scene.children.filter(o=>o.userData.districtLight))light.visible=quality==='high'&&Math.abs(light.position.z-z)<80;
 for(let i=0;i<count;i++){const d=drops[i],height=((d.y-time*17)%26+26)%26;const j=i*6;positions[j]=d.x;positions[j+1]=height;positions[j+2]=z+d.z;positions[j+3]=d.x+.12;positions[j+4]=height-.7;positions[j+5]=z+d.z+.12;}rainGeometry.attributes.position.needsUpdate=true;composer.render();}};
}
