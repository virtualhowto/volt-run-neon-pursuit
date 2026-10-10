import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
export const BIKES={performance:{name:'BLACKOUT PERFORMANCE',description:'Full suspension · Mid drive · Hydraulic brakes',path:'/assets/ebike-performance.glb'},scrambler:{name:'STREET SCRAMBLER',description:'Fat tyres · Twin shocks · Hydraulic discs',path:'/assets/ebike-scrambler.glb'}};
export const bikeId=id=>Object.hasOwn(BIKES,id)?id:'scrambler';
const cache=new Map();
function template(id){if(!cache.has(id))cache.set(id,new GLTFLoader().loadAsync(BIKES[id].path).then(g=>g.scene).catch(e=>{cache.delete(id);throw e;}));return cache.get(id);}
export async function mountBike(root,id,hideRider=false){id=bikeId(id);if(root.userData.requestedBike===id)return;root.userData.requestedBike=id;
 try{const source=await template(id);if(root.userData.requestedBike!==id)return;const model=source.clone(true);model.traverse(o=>{if(hideRider&&o.name.startsWith('RIDER'))o.visible=false;if(o.isMesh){o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();o.castShadow=o.receiveShadow=true;}});
 const previous=root.userData.bikeModel;if(previous){root.remove(previous);previous.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});}for(const o of root.userData.fallback||[])root.remove(o);root.userData.fallback=[];root.add(model);root.userData.bikeModel=model;root.userData.bikeId=id;root.userData.finish=null;
 }catch(e){root.userData.requestedBike=null;console.error('Bike model failed to load',e);}
}
