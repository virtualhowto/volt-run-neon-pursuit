import {createNeonCity} from './neon-city.js';
import {mountBike} from './bikes.js';
import {policeBeacon,flashBeacon} from './police-bike.js';
import {driveSpeed,carRoof,impactDamage} from './ride-physics.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildCar,upgradeWorld} from './graphics.js';
import {createGarage} from './garage.js';
import {applyBikeFinish} from './bike-finish.js';
import {StuntRun,TRICKS,comboMultiplier} from './stunts.js';
import {createStuntFX} from './stunt-fx.js';
import {buildPlayground} from './playground.js';
import {Multiplayer} from './multiplayer.js';
import {createRemoteRiders} from './riders.js';
const $=id=>document.getElementById(id), keys=new Set();
const scene=new T.Scene();scene.background=new T.Color(0x101b31);scene.fog=new T.FogExp2(0x101b31,.009);
const renderer=new T.WebGLRenderer({canvas:$('game'),antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
const camera=new T.PerspectiveCamera(65,innerWidth/innerHeight,.1,500);camera.position.set(7,4.5,8);scene.add(new T.HemisphereLight(0xabcaff,0x382941,2.5));const sun=new T.DirectionalLight(0xffd2aa,3);sun.position.set(-30,60,30);scene.add(sun);
const mats=new Map();function mat(color){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.7}));return mats.get(color);}
function box(w,h,d,color,x=0,y=0,z=0,parent=scene){const o=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));o.position.set(x,y,z);parent.add(o);return o;}
function bar(a,b,r,color,parent){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);const o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),8),mat(color));o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());parent.add(o);return o;}
function bike(color=0xc9ff37){const g=new T.Group();for(const z of [-.85,.85]){const wheel=new T.Mesh(new T.TorusGeometry(.43,.09,8,16),mat(0x111724));wheel.rotation.y=Math.PI/2;wheel.position.set(0,.46,z);g.add(wheel);bar([-.15,.46,z],[.15,.46,z],.05,0xa3b2c3,g);}for(const [a,b] of [[[0,.46,.85],[0,1.15,.1]],[[0,1.15,.1],[0,.46,-.85]],[[0,.46,-.85],[0,.5,.15]],[[0,.5,.15],[0,.46,.85]],[[0,.5,.15],[0,1.15,.1]],[[0,1.15,.1],[0,1.25,-.55]],[[0,1.25,-.55],[0,.46,-.85]]])bar(a,b,.065,color,g);box(.22,.42,.32,0x202d40,0,.8,-.12,g);box(.35,.1,.38,0x111724,0,1.22,.17,g);bar([-.35,1.4,-.64],[.35,1.4,-.64],.05,0xd4e0e9,g);box(.4,.57,.3,0xebe7db,0,1.65,.04,g);const head=new T.Mesh(new T.SphereGeometry(.22,12,8),mat(0x202a3f));head.position.set(0,2.15,-.09);g.add(head);box(.32,.09,.13,color,0,2.15,-.28,g);for(const s of [-1,1]){bar([s*.16,1.85,0],[s*.32,1.4,-.64],.065,0xebe7db,g);bar([s*.12,1.39,.1],[s*.24,.75,.25],.09,0x303f61,g);}return g;}
const beacon=policeBeacon();scene.add(beacon);const player=bike();scene.add(player);player.userData.fallback=[...player.children];
box(400,.1,4000,0x1b2940,0,-.17,-1800);box(18,.12,4000,0x263249,0,-.08,-1800);for(const x of [-10,10])box(2,.25,4000,0x54647a,x,0,-1800);
let seed=17;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const blocks=[];for(let i=0;i<100;i++){const z=-i*35;for(const side of [-1,1]){const x=side*(18+rand()*7),h=8+rand()*35;box(9+rand()*7,h,22, [0x253b53,0x304660,0x27324a][i%3],x,h/2,z);for(let j=2;j<h;j+=4)box(.05,.8,15,i%3===0?0xc9ff37:0x6788ab,x-side*6,j,z);if(i%3===0){box(.15,6,.15,0x718599,side*10,3,z);box(1.3,.12,.5,0xffd1a3,side*9.6,6,z);}}for(const x of [-3,3])box(.1,.01,4,0x8b9bad,x,.01,z);blocks.push(z);}
const ramps=[],hoops=[];
for(let i=0;i<26;i++){
 const rz=-45-i*125,rx=[0,-5,5][i%3],mega=i%3===0;
 const deck=box(mega?4.6:3.5,.28,mega?11:7,0x44555b,rx,mega?1.5:.8,rz);deck.rotation.x=mega?.29:.23;
 for(const side of [-1,1]){const rail=box(.12,.1,mega?11:7,mega?0xffb33a:0xc9ff37,rx+side*(mega?2.2:1.65),mega?1.7:1,rz);rail.rotation.x=deck.rotation.x;}
 ramps.push({x:rx,z:rz,used:false,mega});
 const hoop=new T.Mesh(new T.TorusGeometry(2,.055,8,40),new T.MeshStandardMaterial({color:mega?0xffad36:0xc9ff37,emissive:mega?0xff7616:0x7dc922,emissiveIntensity:2}));hoop.position.set(rx,mega?12:7.5,rz-(mega?23:18));scene.add(hoop);hoops.push({mesh:hoop,used:false});
}
function car(color,police=false){const g=buildCar(color,police);scene.add(g);return g;}
const traffic=[];for(let i=0;i<36;i++){const m=car([0x8ba2a9,0xcc7b60,0x6a80a5,0xd0be86][i%4]);m.position.set([-6,-2,2,6][i%4],0,-25-i*80);traffic.push({mesh:m,speed:5+rand()*10,near:false});}
const cops=[car(0xe4e8e8,true),car(0xe4e8e8,true)];cops.forEach((c,i)=>c.position.set(i?3:-3,0,25+i*12));
const updateGraphics=upgradeWorld(scene,renderer,sun,player);
const neonCity=createNeonCity(scene,renderer,camera,sun);
const playground=buildPlayground(scene);ramps.push(...playground.ramps);
let lateralSpeed=0;
let health=100,blood=0,surfCar=null,surfOffset=0,isPolice=false,policeId=null;
let grounded=true,lastZone=null,soloChallenge=0,soloClaimed=false;
let playing=false,paused=false,speed=0,x=0,z=0,y=0,vy=0,score=0,heat=0,battery=100,combo=0,tricks=[],air=0,spin=0,flip=0,cooldown=0,catchTime=0,invincible=0,toastUntil=0,lastSend=0,elapsed=0;let best=0;try{best=Number(localStorage.getItem('neon-best'))||0;}catch{}let sound=false,audio,osc,gain;
const stunt=new StuntRun(),stuntFX=createStuntFX(scene);let chainTime=0,landingShake=0,wheelieTime=0,stuntLabel='';
let wasPaused=false;const garage=createGarage(()=>{wasPaused=paused;paused=true;keys.clear();},()=>{paused=wasPaused;},id=>mountBike(player,id));
function toast(text){$('toast').textContent=text;toastUntil=elapsed+2;}
function add(points,text){combo+=points;tricks.push(text);chainTime=2.8;heat=Math.min(5,heat+.13);stuntLabel=text;drawCombo();}
function drawCombo(){const multiplier=comboMultiplier(tricks);$('comboPoints').textContent=combo?'+'+Math.round(combo*multiplier).toLocaleString()+' / Ã—'+multiplier.toFixed(1):'';$('comboText').textContent=tricks.slice(-3).join(' + ');$('chainFill').style.width=(combo?Math.min(1,chainTime/2.8)*100:0)+'%';}
function bank(){if(combo){const awarded=Math.round(combo*comboMultiplier(tricks));score+=awarded;if(!net.room&&!soloClaimed){soloChallenge+=awarded;if(soloChallenge>=5000){soloClaimed=true;garage.bank(1500);}}const earned=garage.bank(awarded);$('status').textContent='+'+earned+' STATUS CREDS / G TO UPGRADE';toast('BANKED '+awarded.toLocaleString()+' / '+earned+' CREDS'+(!net.room&&soloClaimed?' / SOLO CONTRACT COMPLETE':''));combo=0;tricks=[];chainTime=0;drawCombo();}if(score>best){best=score;try{localStorage.setItem('neon-best',best);}catch{}}}
function launch(velocity,label,points){if(surfCar){label='CAR HOP';points+=200;speed=Math.max(speed,surfCar.speed+8);surfCar=null;}stunt.launch();grounded=false;vy=velocity;air=0;add(points,label);}
function reset(){lateralSpeed=0;health=100;blood=0;surfCar=null;playground.reset();grounded=true;lastZone=null;soloChallenge=0;soloClaimed=false;stunt.reset();chainTime=wheelieTime=landingShake=0;hoops.forEach(h=>{h.used=false;h.mesh.visible=true;});speed=x=z=y=vy=score=heat=combo=air=spin=flip=catchTime=0;battery=100+25*garage.save.levels.battery;tricks=[];invincible=2;ramps.forEach(r=>r.used=false);traffic.forEach((c,i)=>{c.mesh.position.z=-25-i*80;c.near=false;c.vaultFlight=-1;});cops.forEach((c,i)=>c.position.set(i?3:-3,0,25+i*12));$('comboPoints').textContent='';$('comboText').textContent='';}
function start(){reset();playing=true;paused=false;$('menu').style.display='none';$('pause').textContent='PAUSE';toast('SEND IT. LAND IT. BANK IT.');}
function crash(reason){const damage=impactDamage(speed,reason);health=Math.max(0,health-damage);blood=1;surfCar=null;stunt.cancel();chainTime=0;landingShake=.45;combo=0;tricks=[];speed=3;battery=Math.max(0,battery-15);heat=Math.min(5,heat+.5);invincible=2;$('comboPoints').textContent='';$('comboText').textContent='';drawCombo();toast(reason+' / -'+damage+' HEALTH / COMBO LOST');if(health<=0)end('WIPED OUT');}
function end(reason='BUSTED'){playing=false;keys.clear();combo=0;tricks=[];$('menu').style.display='block';$('menu').querySelector('.eyebrow').textContent=reason+' / FINAL SCORE '+score;$('start').innerHTML='RIDE AGAIN <span>â†—</span>';toast(reason==='WIPED OUT'?'HEALTH DEPLETED / RIDE AGAIN':'THE LAW CAUGHT UP.');}
$('start').onclick=start;$('pause').onclick=()=>{if(!playing)return;paused=!paused;$('pause').textContent=paused?'RESUME':'PAUSE';};
const raceHUD=document.createElement('div');raceHUD.id='raceHUD';raceHUD.hidden=true;document.body.append(raceHUD);
const raceGate=new T.Group();for(const side of [-1,1])box(.22,7,.22,0x33dcec,side*9,3.5,0,raceGate);box(18,.22,.22,0x33dcec,0,7,0,raceGate);scene.add(raceGate);raceGate.visible=false;
const remoteRiders=createRemoteRiders(scene,camera);
let rosterKey='';
const net=new Multiplayer({
 joined(m){$('network').textContent='ROOM / '+m.room;$('roomBar').hidden=false;$('inviteUrl').value=inviteURL(m.room);if(!m.resumed)startAt(m.spawn);else toast('RECONNECTED / BACK WITH YOUR CREW');},
 status(text){$('network').textContent=text.toUpperCase();if(net.room){$('roomBar').hidden=false;$('inviteUrl').value=inviteURL(net.room);}},
 left(){raceHUD.hidden=true;raceGate.visible=false;$('startRace').disabled=false;isPolice=false;policeId=null;remoteRiders.clear();$('riders').replaceChildren();$('roomBar').hidden=true;$('network').textContent='SOLO FREERIDE';rosterKey='';},
 error(message){toast(message);},
 spawn(position){startAt(position);},
 collision(name){if(playing&&!paused&&!garage.active&&invincible<=0)crash('RIDER COLLISION / '+name);},
 busted(){if(playing)end();},
 tagged(m){crash('TAGGED BY '+m.name);if(playing){x=m.spawn.x;z=m.spawn.z;y=0;vy=0;grounded=true;invincible=5;stunt.reset();}},
 reward(m){let claims=[];try{claims=JSON.parse(localStorage.getItem('neon-challenge-claims')||'[]');if(!Array.isArray(claims))claims=[];}catch{}if(!claims.includes(m.id)){garage.bank(m.creds*10);claims.push(m.id);try{localStorage.setItem('neon-challenge-claims',JSON.stringify(claims.slice(-100)));}catch{}toast((m.reason||'CREW CONTRACT COMPLETE')+' / +'+m.creds+' CREDS');}net.ackReward(m.id);},
 world(m){
  remoteRiders.set(m.players,net.id);
  const race=m.race,entry=race?.entries.find(e=>e.id===net.id);raceHUD.hidden=!race;
  if(race){const rank=race.entries.findIndex(e=>e.id===net.id)+1;raceHUD.textContent=race.phase==='countdown'?'RACE STARTS IN '+race.seconds+' / PODIUM: 500 / 300 / 200 CR':race.phase==='finished'?'RACE RESULTS  /  '+race.entries.map((e,i)=>(i+1)+'. '+e.name+' '+(e.time===null?'DNF':(e.time/1000).toFixed(2)+'s +'+e.prize+' CR')).join(' / '):entry?.time!==null&&entry?'FINISHED / '+(entry.time/1000).toFixed(2)+'s / +'+entry.prize+' CR WHEN RACE ENDS':'CREW RACE / GATE '+((entry?.next||0)+1)+'/'+race.gates.length+'  /  '+race.seconds+'s LEFT';$('startRace').disabled=race.phase!=='finished';}
  else $('startRace').disabled=false;
  raceGate.visible=!!race&&race.phase==='racing'&&!!entry&&entry.time===null;if(raceGate.visible)raceGate.position.z=race.gates[entry.next];
  const self=m.players.find(p=>p.id===net.id);if(self)catchTime=self.catchTime;isPolice=m.pursuit?.id===net.id;if(policeId!==m.pursuit?.id){policeId=m.pursuit?.id;toast(isPolice?'YOUR TURN: POLICE / TAG RIDERS FOR 75 CR':'POLICE SHIFT CHANGED / KEEP MOVING');}
  $('network').textContent='ROOM '+m.room+' / '+m.players.length+'/12';
  const key=JSON.stringify(m.players.map(p=>[p.id,p.name,p.score,p.parked,p.role]));
  if(key!==rosterKey){rosterKey=key;$('riders').replaceChildren();const title=document.createElement('strong');title.textContent='CREW LEADERBOARD';$('riders').append(title);for(const [i,p]of m.players.entries()){const row=document.createElement('div');row.className=p.id===net.id?'self':'';const name=document.createElement('span');name.textContent=(i+1)+'. '+p.name+(p.role==='police'?' [POLICE]':'')+(p.id===net.id?' (YOU)':'')+(p.parked?'  /  PARKED':'');const points=document.createElement('b');points.textContent=p.score.toLocaleString();row.append(name,points);$('riders').append(row);}}
 }
});
function inviteURL(room){const url=new URL(location.href);url.search='';url.hash='';url.searchParams.set('room',room);return url.href;}
function startAt(position){start();x=position.x;z=position.z;y=0;speed=0;invincible=3;toast('CREW FREERIDE / TRAFFIC AND POLICE ARE SHARED');}
function restart(){if(net.room){net.respawn();}else{start();z=-Number($('route').value||0);x=z===-320?-5:z===-1720?5:0;if(z<0)invincible=4;}}
const invited=new URLSearchParams(location.search).get('room');if(invited)$('room').value=invited;
try{$('name').value=localStorage.getItem('neon-rider-name')||'';}catch{}
$('join').onclick=()=>{const name=$('name').value.trim()||'Rider';try{localStorage.setItem('neon-rider-name',name);}catch{}net.join($('room').value.trim()||'crew',name);};
$('createRoom').onclick=()=>{$('room').value='crew-'+Array.from(crypto.getRandomValues(new Uint8Array(3)),v=>v.toString(16).padStart(2,'0')).join('');$('join').click();};
$('startRace').onclick=()=>net.startRace();
$('leaveRoom').onclick=()=>{net.leave();toast('LEFT ROOM / SOLO FREERIDE');};
$('copyInvite').onclick=async()=>{try{await navigator.clipboard.writeText($('inviteUrl').value);toast('INVITE LINK COPIED');}catch{$('inviteUrl').focus();$('inviteUrl').select();toast('SELECTED INVITE LINK / COPY TO SHARE');}};
$('start').onclick=restart;
function updateSharedWorld(){
 if(!net.connected||!net.world)return;
 const age=Math.min((performance.now()-net.receivedAt)/1000,.2);
 for(const data of net.world.traffic){const c=traffic[data.id];if(!c)continue;c.speed=data.speed;if(c.lap!==data.lap){c.lap=data.lap;c.near=false;}let cz=data.z-data.speed*age;if(cz<-3150)cz+=3150;c.mesh.position.set(data.x,0,cz);}
 for(const [i,data]of net.world.cops.entries()){cops[i].position.set(data.x,0,data.z);}
}
$('sound').onclick=()=>{sound=!sound;if(!audio){audio=new AudioContext();osc=audio.createOscillator();gain=audio.createGain();osc.type='sawtooth';osc.connect(gain);gain.connect(audio.destination);gain.gain.value=0;osc.start();}audio.resume();$('sound').textContent=sound?'SOUND ON':'SOUND OFF';};
function key(k,down){if(down){if(k==='p'&&!keys.has(k)&&!garage.active)$('pause').click();if(!keys.has(k)&&playing&&!paused&&!garage.active&&(!net.room||net.connected)){
 if(k===' '&&grounded&&speed>3)launch(keys.has('shift')?9.5:7.2,keys.has('shift')?'BOOST HOP':'BUNNY HOP',keys.has('shift')?100:50);
 if(TRICKS[k]&&!grounded&&y>.4){if(stunt.begin(k,y)){stuntLabel=TRICKS[k].name;$('status').textContent=stuntLabel+' / COMPLETE BEFORE LANDING';}else toast('FINISH YOUR CURRENT TRICK');}
 if(k==='b'&&grounded)bank();if(k==='r')restart();
 }keys.add(k);}else keys.delete(k);}
window.addEventListener('keydown',e=>{if(['INPUT'].includes(e.target.tagName))return;const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();key(k,true);});window.addEventListener('keyup',e=>key(e.key.toLowerCase(),false));window.addEventListener('blur',()=>{keys.clear();if(playing&&!paused)$('pause').click();});
for(const b of document.querySelectorAll('[data-key]')){b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);key(b.dataset.key,true);};b.onpointerup=b.onpointercancel=()=>key(b.dataset.key,false);}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
let last=performance.now();function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.04);last=now;elapsed+=dt;updateSharedWorld();if(playing&&!paused&&!garage.active&&(!net.room||net.connected)&&net.world?.race?.phase!=='countdown'){cooldown-=dt;invincible-=dt;for(const c of traffic){if(!net.room){c.mesh.position.z-=c.speed*dt;if(c.mesh.position.z>z+30){c.mesh.position.z=z-250-rand()*500;c.near=false;}}}const boost=keys.has('shift')&&grounded&&speed>1&&battery>0;const gas=keys.has('w')||keys.has('arrowup'),brake=keys.has('s')||keys.has('arrowdown');if(surfCar&&!gas&&!brake&&!boost)speed=surfCar.speed;else speed=driveSpeed(speed,dt,{grounded,gas,brake,boost,motor:garage.save.levels.motor,police:isPolice});battery=T.MathUtils.clamp(battery+(boost?-26:10)*dt,0,100+25*garage.save.levels.battery);const steer=(keys.has('a')||keys.has('arrowleft')?1:0)-(keys.has('d')||keys.has('arrowright')?1:0);const grip=grounded?1:.32;const targetLateral=-steer*(2+Math.min(speed,25)*.19)*(1+garage.save.levels.handling*.08);lateralSpeed+=(targetLateral-lateralSpeed)*(1-Math.exp(-dt*(grounded?5:1.8)));x=T.MathUtils.clamp(x+lateralSpeed*dt*grip,-11,11);if(surfCar&&grounded){surfOffset-=(speed-surfCar.speed)*dt;z=surfCar.mesh.position.z+surfOffset;}else z-=speed*dt;player.rotation.z=T.MathUtils.lerp(player.rotation.z,-lateralSpeed*.038,.15);const roof=carRoof(x,z,y,vy,traffic);if(surfCar&&roof!==surfCar)surfCar=null;const surface=Math.max(playground.surfaceAt(x,z,y),roof?1.45:0);if(grounded&&y>surface+.02){stunt.launch();grounded=false;}if(y>surface+.02||vy>0||!grounded){grounded=false;
 y+=vy*dt;vy-=12*dt;air+=dt;const completed=stunt.update(dt,Math.max(0,y),speed);if(completed)add(completed.points,completed.name);
 if(y<=surface&&vy<=0){const landing=stunt.land();y=surface;vy=air=0;grounded=true;player.rotation.set(0,0,0);if(landing.bail){if(!stunt.failed)crash('BAILED / INCOMPLETE TRICK');}else{if(roof&&surface===1.45){surfCar=roof;surfOffset=z-roof.mesh.position.z;speed=roof.speed;add(350,'CAR SURF');toast('CAR SURF / SPACE TO HOP OFF');}if(landing.points>0)add(landing.points,landing.height>8?'SKY HIGH LANDING':'CLEAN LANDING');chainTime=2.8;landingShake=Math.min(.5,.12+landing.height*.025);stuntFX.burst(x,z,y);if(landing.tricks>=2)toast('EPIC COMBO / '+landing.tricks+' AIR TRICKS');}}
 else{player.rotation.x=stunt.pose.pitch;player.rotation.y=stunt.pose.yaw;player.rotation.z=stunt.pose.roll+steer*.12;chainTime=2.8;}
}else{
 grounded=true;y=surface;player.rotation.x=T.MathUtils.lerp(player.rotation.x,keys.has('v')&&speed>6?.48:0,.18);player.rotation.y=0;
 if(keys.has('v')&&speed>6){wheelieTime+=dt;chainTime=2.8;if(wheelieTime>=.5){wheelieTime=0;add(45,'WHEELIE');}}else{wheelieTime=0;chainTime-=dt;if(combo&&chainTime<=0)bank();}
}
for(const r of ramps){if(!r.used&&Math.abs(z-r.z)<(r.mega?5:3.8)&&Math.abs(x-r.x)<(r.mega?2.2:1.7)&&grounded&&Math.abs(y-(r.base||0))<.2&&speed>8){r.used=true;launch((r.power??(r.mega?14.5:10))+speed*.1+garage.save.levels.handling*.6,r.label||(r.mega?'MEGA LAUNCH':'RAMP SEND'),r.mega||r.label?250:150);}}
const roadblocksActive=net.room?!!net.world?.roadblocks:heat>=1;const blockResult=playground.check(x,y,z,roadblocksActive);if(blockResult==='hit'&&!isPolice&&invincible<=0)crash('POLICE ROADBLOCK');if(blockResult==='clear'&&!isPolice){add(350,'ROADBLOCK ESCAPE');toast('ROADBLOCK CLEARED / +350');}
for(const h of hoops){if(!h.used&&Math.abs(z-h.mesh.position.z)<2.3&&Math.hypot(x-h.mesh.position.x,y+1-h.mesh.position.y)<1.85){h.used=true;h.mesh.visible=false;add(500,'SKY GATE');toast('SKY GATE / +500');}}
for(const c of traffic){const dz=Math.abs(c.mesh.position.z-z),dx=Math.abs(c.mesh.position.x-x);if(y>1.6&&dz<2&&dx<1.3&&c.vaultFlight!==stunt.flight){c.vaultFlight=stunt.flight;add(250,'TRAFFIC VAULT');}if(dz<2.3&&dx<1.3&&y<1.3&&invincible<=0)crash('TRAFFIC COLLISION');if(!c.near&&speed>6&&dz<2&&dx>=1.3&&dx<2.6){c.near=true;add(100,'NEAR MISS');}}heat=Math.max(0,heat-dt*(speed>22?.08:.015));if(!net.room){cops.forEach((c,i)=>{const chase=heat>.5;const target=z+(chase?4+i*4:40+i*8);c.position.z=T.MathUtils.lerp(c.position.z,target,dt*(chase?.25+heat*.12:.4));c.position.x=T.MathUtils.lerp(c.position.x,x+(i?2:-2),dt*.6);});const closest=Math.min(...cops.map(c=>c.position.z-z));if(heat>1&&y<2&&speed<8&&closest<9)catchTime+=dt;else catchTime=Math.max(0,catchTime-dt);if(catchTime>4)end();}if(z<-3150){z=0;playground.reset();hoops.forEach(h=>{h.used=false;h.mesh.visible=true;});ramps.forEach(r=>r.used=false);traffic.forEach((c,i)=>c.mesh.position.z=-25-i*80);cops.forEach((c,i)=>c.position.z=20+i*10);toast('NEW LAP / KEEP THE COMBO ALIVE');}}
if(net.connected&&elapsed-lastSend>.05){lastSend=elapsed;net.send({x,z,y,speed,angle:player.rotation.y,pitch:player.rotation.x,lean:player.rotation.z,score,heat,stunt:stunt.active?TRICKS[stunt.active.key].name:(y>0?stuntLabel:""),bike:garage.selectedBike,custom:garage.custom,levels:garage.save.levels,parked:!playing||paused||garage.active});}
remoteRiders.update(dt);blood=Math.max(0,blood-dt*.55);$('blood').style.opacity=blood*.75;$('healthValue').textContent=health;$('healthFill').style.width=health+'%';$('healthFill').style.background=health<35?'#ff354e':'#c9ff37';$('role').textContent=net.world?.race&&net.world.race.phase!=='finished'?'CREW RACE / POLICE SHIFT PAUSED':net.room?(net.world?.pursuit?.id?(isPolice?'POLICE / TAG THE RIDERS':'RIDER / EVADE THE POLICE')+'  /  '+(net.world?.pursuit?.seconds||0)+'s':'WAITING FOR A FRIEND / POLICE ROTATION NEEDS 2'):'SOLO FREERIDE';$('role').dataset.role=isPolice?'police':'rider';$('motorMode').textContent=!grounded&&keys.has('shift')?'FREE REV / NO AIR BOOST':surfCar?'CAR SURF / SPACE TO HOP':grounded&&keys.has('shift')&&speed>1?'BOOST / TRACTION':' ';

const zone=playground.zoneAt(z);$('districtName').textContent=zone.name;const next=3150+z;$('routeHint').textContent=zone.hint+' / LAP '+Math.max(0,Math.round(next))+'m LEFT';if(playing&&zone!==lastZone){lastZone=zone;toast(zone.name);}const challenge=net.room?net.world?.challenge:null;$('challengeTitle').textContent=net.room?'CREW CONTRACT '+(challenge?.stage||1)+' / +250 CR EACH':'SOLO CONTRACT / +150 CR';$('challengeProgress').textContent=net.room?((challenge?.progress||0).toLocaleString()+' / 15,000 BANKED  /  '+(challenge?.contributors||0)+' CONTRIBUTORS'):(soloClaimed?'COMPLETE / BONUS CREDITED':Math.min(5000,soloChallenge).toLocaleString()+' / 5,000 BANKED');$('challengeFill').style.width=(net.room?Math.min(100,(challenge?.progress||0)/150):Math.min(100,soloChallenge/50))+'%';$('contracts').hidden=!playing||garage.active;playground.update(elapsed,net.room?!!net.world?.roadblocks:heat>=1);

player.position.set(x,y,z);beacon.position.copy(player.position);beacon.rotation.copy(player.rotation);flashBeacon(beacon,isPolice,elapsed);player.visible=invincible<=0||Math.floor(elapsed*10)%2===0;const camPos=playing?new T.Vector3(x*.8,3.8+y*.85,z+7.3):new T.Vector3(7,4.5,8);camera.position.lerp(camPos,playing?.1:.025);camera.lookAt(playing?new T.Vector3(x,y+1.2,z-4):new T.Vector3(0,1,-3));camera.fov=T.MathUtils.lerp(camera.fov,60+speed*.28,.05);camera.updateProjectionMatrix();landingShake=Math.max(0,landingShake-dt);if(playing&&!paused){camera.position.y+=Math.sin(elapsed*65)*landingShake*.25;}if(!playing)player.rotation.y=Math.sin(elapsed*.2)*.15;
$('score').textContent=String(score).padStart(6,'0');$('best').textContent='BEST '+best;$('speed').textContent=Math.round(speed*3.6);$('battery').style.width=(battery/(100+25*garage.save.levels.battery)*100)+'%';$('heat').textContent=Array.from({length:5},(_,i)=>i<Math.ceil(heat)?'◆':'◇').join(' ');$('chase').textContent=catchTime>1?'BUSTED IN '+Math.ceil(4-catchTime)+'s / MOVE!':heat>1?'POLICE IN PURSUIT':'KEEP IT CLEAN. OR DON\'T.';if(elapsed>toastUntil)$('toast').textContent='';if(gain){gain.gain.setTargetAtTime(sound&&playing&&!paused?.015:0,audio.currentTime,.1);osc.frequency.setTargetAtTime((!grounded&&keys.has('shift')?520+Math.sin(elapsed*22)*50:70+speed*9),audio.currentTime,.1);}drawCombo();$('airInfo').textContent=y>.2?y.toFixed(1)+'m HIGH / '+stunt.distance.toFixed(0)+'m DISTANCE'+(stunt.active?' / '+TRICKS[stunt.active.key].name:''):combo?'LINK ANOTHER TRICK OR PRESS B TO BANK':'';stuntFX.update(paused?0:dt,x,y,z,playing&&!paused&&(!grounded||(grounded&&keys.has('shift')&&speed>1)));applyBikeFinish(player,garage.save.levels,garage.custom);garage.update(dt);updateGraphics(z,elapsed);neonCity.render(z,elapsed);}
requestAnimationFrame(frame);








