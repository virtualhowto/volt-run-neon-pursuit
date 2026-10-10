export function driveSpeed(speed,dt,{grounded,gas,brake,boost,motor=0,police=false}){
 if(!grounded)return Math.max(0,speed-.15*dt);
 const limit=(boost?37:24)+motor*2.2+(police?5:0);
 return Math.max(0,Math.min(limit,speed+((gas?7+motor*1.2:-1.3-speed*.06)+(boost?11:0)-(brake?18:0))*dt));
}
export function carRoof(x,z,previousY,vy,cars){
 if(vy>0||previousY<1.4)return null;
 return cars.find(c=>Math.abs(x-c.mesh.position.x)<.86&&Math.abs(z-(c.mesh.position.z+.25))<1.15)||null;
}
export function impactDamage(speed,reason=''){return Math.min(65,18+Math.round(Math.max(0,speed)*.8)+(reason.includes('ROADBLOCK')?12:0));}
