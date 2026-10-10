import {mountBike} from './bikes.js';
import {policeBeacon,flashBeacon} from './police-bike.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {applyBikeFinish} from './bike-finish.js';
export function createRemoteRiders(scene,camera){
 const riders=new Map();
 function remove(id){const r=riders.get(id);if(!r)return;scene.remove(r.root);r.beacon.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});r.label.remove();r.root.userData.bikeModel?.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});r.root.getObjectByName('Capacity LEDs')?.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});riders.delete(id);}
 return {
  set(players,self){const live=new Set();for(const p of players){if(p.id===self)continue;live.add(p.id);let r=riders.get(p.id);if(!r){const root=new T.Group();root.position.set(p.x,p.y,p.z);scene.add(root);const label=document.createElement('div');label.className='rider-tag';document.body.append(label);const beacon=policeBeacon();root.add(beacon);r={root,label,target:p,model:null,beacon};riders.set(p.id,r);}r.target=p;mountBike(r.root,p.bike);r.label.classList.toggle('police',p.role==='police');r.label.textContent=(p.role==='police'?'🚨 POLICE / ':'')+p.name+(p.parked?' · PARKED':p.stunt?' · '+p.stunt:'');applyBikeFinish(r.root,p.levels,p.custom);}for(const id of riders.keys())if(!live.has(id))remove(id);},
  update(dt){const alpha=1-Math.exp(-dt*14);for(const r of riders.values()){applyBikeFinish(r.root,r.target.levels,r.target.custom);flashBeacon(r.beacon,r.target.role==='police',performance.now()/1000);const p=r.target,target=new T.Vector3(p.x,p.y,p.z);if(r.root.position.distanceTo(target)>30)r.root.position.copy(target);else r.root.position.lerp(target,alpha);r.root.rotation.x=T.MathUtils.lerp(r.root.rotation.x,p.pitch,alpha);r.root.rotation.y=T.MathUtils.lerp(r.root.rotation.y,p.angle,alpha);r.root.rotation.z=T.MathUtils.lerp(r.root.rotation.z,p.lean,alpha);const pos=r.root.position.clone().add(new T.Vector3(0,2.65,0));const ahead=pos.clone().sub(camera.position).dot(camera.getWorldDirection(new T.Vector3()))>0;pos.project(camera);r.label.hidden=!ahead||Math.abs(pos.x)>1||Math.abs(pos.y)>1;r.label.style.transform=`translate(${(pos.x*.5+.5)*innerWidth}px,${(-pos.y*.5+.5)*innerHeight}px) translate(-50%,-100%)`;r.root.visible=ahead;}},
  clear(){for(const id of [...riders.keys()])remove(id);}
 };
}
