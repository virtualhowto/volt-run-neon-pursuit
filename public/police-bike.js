import * as T from 'three';
export function policeBeacon(){const group=new T.Group();for(const [x,color]of [[-.25,0x278aff],[.25,0xff2442]]){const material=new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:3});const mesh=new T.Mesh(new T.BoxGeometry(.24,.12,.18),material);mesh.position.set(x,1.45,.55);group.add(mesh);}group.visible=false;return group;}
export function flashBeacon(group,active,time){group.visible=active;if(active)group.children.forEach((o,i)=>o.material.emissiveIntensity=(Math.floor(time*8)%2===i)?6:.2);}
