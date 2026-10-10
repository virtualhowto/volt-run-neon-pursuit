export const TRICKS={q:{name:'360',points:250,duration:.62,yaw:Math.PI*2},e:{name:'BACKFLIP',points:400,duration:.82,pitch:-Math.PI*2},f:{name:'FRONTFLIP',points:450,duration:.8,pitch:Math.PI*2},x:{name:'CORKSCREW',points:750,duration:1.05,yaw:Math.PI*2,roll:Math.PI*2},c:{name:'TABLETOP',points:300,duration:.58,table:true}};
export class StuntRun{
 constructor(){this.reset();}
 reset(){this.failed=false;this.active=null;this.completed=0;this.repeats={};this.pose={pitch:0,yaw:0,roll:0};this.height=0;this.distance=0;this.flight=0;}
 launch(){this.failed=false;this.active=null;this.completed=0;this.repeats={};this.pose={pitch:0,yaw:0,roll:0};this.height=0;this.distance=0;this.flight++;}
 begin(key,height){if(!TRICKS[key]||this.active||height<.45)return false;this.active={key,time:0};return true;}
 update(dt,height,speed){this.height=Math.max(this.height,height);this.distance+=Math.max(0,speed)*dt;if(!this.active)return null;const a=this.active,t=TRICKS[a.key];a.time+=dt;const progress=Math.min(1,a.time/t.duration);const eased=progress*progress*(3-2*progress);this.pose={pitch:(t.pitch||0)*eased,yaw:(t.yaw||0)*eased,roll:t.table?Math.sin(progress*Math.PI)*1.2:(t.roll||0)*eased};if(progress<1)return null;this.repeats[a.key]=(this.repeats[a.key]||0)+1;this.completed++;this.active=null;this.pose={pitch:0,yaw:0,roll:0};return {name:t.name,points:Math.round(t.points/this.repeats[a.key])};}
 cancel(){this.active=null;this.failed=true;this.pose={pitch:0,yaw:0,roll:0};}
 land(){const bail=!!this.active||this.failed;const result={bail,height:this.height,distance:this.distance,tricks:this.completed,points:bail?0:Math.round(Math.max(0,this.distance-10)*4+Math.max(0,this.height-3)*35)};this.active=null;this.pose={pitch:0,yaw:0,roll:0};return result;}
}
export function comboMultiplier(names){return Math.min(5,1+new Set(names).size*.35+Math.max(0,names.length-3)*.1);}

