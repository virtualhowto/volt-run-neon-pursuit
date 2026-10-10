import {CrewRace} from './races.mjs';
import {cleanCustom} from './public/customisation.js';
import {policeTurn,canTag} from './pursuit.mjs';
import {CrewChallenge} from './challenges.mjs';
import {randomUUID} from 'node:crypto';
import {WebSocket,WebSocketServer} from 'ws';

export const TRACK_LENGTH=3150;
const wrap=z=>z>0?z:z<-TRACK_LENGTH?z+TRACK_LENGTH:z;
const delta=(a,b)=>{let d=a-b;if(d>TRACK_LENGTH/2)d-=TRACK_LENGTH;if(d<-TRACK_LENGTH/2)d+=TRACK_LENGTH;return d;};
const number=(v,min,max,fallback=0)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback;
const send=(ws,message)=>{if(ws?.readyState===WebSocket.OPEN&&ws.bufferedAmount<256000)ws.send(JSON.stringify(message));};
export function attachRooms(server){
 const rooms=new Map();
 const wss=new WebSocketServer({server,path:'/ride',maxPayload:4096});
 function makeRoom(code){
  const room={challenge:new CrewChallenge(),code,players:new Map(),created:Date.now(),traffic:Array.from({length:36},(_,i)=>({id:i,x:[-6,-2,2,6][i%4],z:-25-i*80,speed:6+(i*7%11),lap:0})),cops:[{x:-3,z:25,target:null},{x:3,z:37,target:null}]};
  rooms.set(code,room);return room;
 }
 function payRace(room,now){for(const prize of room.race?.claimRewards(now)||[]){const rider=room.players.get(prize.playerId);if(!rider)continue;const reward={id:randomUUID(),creds:prize.creds,reason:prize.reason};rider.pendingRewards.push(reward);send(rider.ws,{type:'reward',...reward});}}
 function spawn(room,exclude){
  const riders=[...room.players.values()].filter(p=>p.id!==exclude&&p.ws);
  const leader=riders.sort((a,b)=>b.state.score-a.state.score)[0];
  const slot=riders.length;return {x:[-4,0,4,-7,7][slot%5],z:wrap((leader?.state.z||0)+Math.floor(slot/5)*4),y:0};
 }
 function leave(ws,grace=true){
  const p=ws.player;if(!p||p.ws!==ws)return;
  p.ws=null;p.disconnectedAt=Date.now();p.state.parked=true;
  if(!grace)ws.room.players.delete(p.id);
  ws.player=null;ws.room=null;
 }
 wss.on('connection',ws=>{
  ws.alive=true;ws.lastMessage=0;ws.on('pong',()=>ws.alive=true);
  ws.on('message',raw=>{
   let m;try{m=JSON.parse(raw);}catch{return;}
   if(!m||typeof m!=='object')return;
   if(m.type==='join'){
    if(ws.player)return;
    const code=String(m.room||'crew').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,20)||'crew';
    if(!rooms.has(code)&&rooms.size>=100){send(ws,{type:'error',message:'Server full. Please try again later.'});return;}
    const room=rooms.get(code)||makeRoom(code);
    let p=[...room.players.values()].find(p=>p.token===m.token&&typeof m.token==='string');
    const resumed=!!p;
    if(!p&&room.players.size>=12){send(ws,{type:'error',message:'Room full (12 riders). Create another room.'});return;}
    if(p?.ws){const previous=p.ws;previous.player=null;previous.room=null;previous.close(4001,'Session resumed elsewhere');}
    if(!p){const position=spawn(room);p={id:randomUUID(),token:randomUUID(),name:String(m.name||'Rider').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,16)||'Rider',ws:null,pendingRewards:[],lastHit:0,catchTime:0,lastState:Date.now(),state:{...position,speed:0,score:0,heat:0,angle:0,pitch:0,lean:0,parked:true,levels:{motor:0,battery:0,handling:0}}};room.players.set(p.id,p);}
    p.ws=ws;p.disconnectedAt=null;ws.player=p;ws.room=room;
    send(ws,{type:'joined',id:p.id,token:p.token,room:code,resumed,spawn:{x:p.state.x,y:p.state.y,z:p.state.z},capacity:12});for(const reward of p.pendingRewards)send(ws,{type:'reward',...reward});return;
   }
   const p=ws.player;if(!p)return;
   if(m.type==='leave'){leave(ws,false);send(ws,{type:'left'});ws.close(1000,'Left room');return;}
   if(m.type==='rewardAck'){p.pendingRewards=p.pendingRewards.filter(r=>r.id!==m.id);return;}
   if(m.type==='raceStart'){
    const room=ws.room,live=[...room.players.values()].filter(r=>r.ws);
    if(live.length<2){send(ws,{type:'notice',message:'Invite a friend: races need at least 2 riders.'});return;}
    if(room.race&&room.race.snapshot(Date.now()).phase!=='finished')return;
    payRace(room,Date.now());room.race=new CrewRace(live,Date.now());
    live.forEach((r,i)=>{const position={x:-7+i*14/Math.max(1,live.length-1),z:0,y:0};r.state={...r.state,...position,speed:0,heat:0,parked:true};r.lastHit=Date.now()+5000;r.catchTime=0;room.challenge.last.set(r.id,0);send(r.ws,{type:'spawn',spawn:position});});return;
   }
   if(m.type==='respawn'){
    ws.room.challenge.last.set(p.id,0);const position=spawn(ws.room,p.id);p.state={...p.state,...position,speed:0,score:0,heat:0,parked:true};p.catchTime=0;p.lastHit=Date.now();
    send(ws,{type:'spawn',spawn:position});return;
   }
   if(m.type==='state'){
    const now=Date.now();if(now-ws.lastMessage<35)return;ws.lastMessage=now;p.lastState=now;
    p.state={x:number(m.x,-11,11),z:number(m.z,-TRACK_LENGTH,45),y:number(m.y,0,20),speed:number(m.speed,0,50),score:Math.floor(number(m.score,0,1e9)),heat:number(m.heat,0,5),angle:number(m.angle,-10000,10000),pitch:number(m.pitch,-10000,10000),lean:number(m.lean,-10000,10000),parked:m.parked!==false,bike:m.bike==='performance'?'performance':'scrambler',custom:cleanCustom(m.custom),stunt:['360','BACKFLIP','FRONTFLIP','CORKSCREW','TABLETOP','MEGA LAUNCH','RAMP SEND','BOOST HOP','BUNNY HOP','SKY GATE','TRAFFIC VAULT','WHEELIE','ROOFTOP LAUNCH','ROOF GAP','ROOFTOP EXIT','PLAZA TRANSFER','CONTAINER LAUNCH','CONTAINER GAP','CRANE SEND','ROADBLOCK ESCAPE','CAR SURF','CAR HOP'].includes(m.stunt)?m.stunt:'',levels:Object.fromEntries(['motor','battery','handling'].map(k=>[k,Math.floor(number(m.levels?.[k],0,3))]))};
    ws.room.race?.observe(p.id,p.state,now);
    const reward=ws.room.challenge.observe(p.id,p.state.score);if(reward)for(const id of reward.recipients){const rider=ws.room.players.get(id);if(rider){const payload={id:reward.id,creds:reward.creds,stage:reward.stage};rider.pendingRewards.push(payload);send(rider.ws,{type:'reward',...payload});}}
   }
  });
  ws.on('close',()=>leave(ws));ws.on('error',()=>{});
 });
 let last=Date.now();
 const tick=setInterval(()=>{
  const now=Date.now(),dt=Math.min((now-last)/1000,.15);last=now;
  for(const [code,room]of rooms){
   for(const [id,p]of room.players){if(!p.ws&&now-p.disconnectedAt>15000)room.players.delete(id);if(now-p.lastState>2000)p.state.parked=true;}
   if(!room.players.size){rooms.delete(code);continue;}
   for(const car of room.traffic){car.z-=car.speed*dt;if(car.z<-TRACK_LENGTH){car.z+=TRACK_LENGTH;car.lap++;}}
   const live=[...room.players.values()].filter(p=>p.ws);
   payRace(room,now);const race=room.race?.snapshot(now);const pursuit=race&&race.phase!=='finished'?{id:null,seconds:0}:policeTurn(live,room.created,now);const active=live.filter(p=>!p.state.parked);const officer=active.find(p=>p.id===pursuit.id);if(officer)for(const rider of active){if(rider.id===officer.id||!canTag(officer,rider,delta(officer.state.z,rider.state.z),now))continue;rider.lastHit=officer.lastHit=now;const position={x:rider.state.x,z:wrap(rider.state.z-70),y:0};rider.state={...rider.state,...position,speed:0,heat:0};send(rider.ws,{type:'tagged',name:officer.name,spawn:position});const reward={id:randomUUID(),creds:75,reason:'RIDER TAGGED'};officer.pendingRewards.push(reward);send(officer.ws,{type:'reward',...reward});}

   const suspects=active.filter(p=>p.id!==pursuit.id&&p.state.heat>.5).sort((a,b)=>b.state.heat-a.state.heat);
   for(const [i,cop]of room.cops.entries()){
    const target=suspects[i%suspects.length]||active[0];cop.target=suspects.length?target?.id:null;
    if(target&&(!race||race.phase==='finished')){const st=target.state;const gap=cop.target?5+i*2:40+i*8;cop.z=wrap(cop.z+delta(wrap(st.z+gap),cop.z)*Math.min(1,dt*(.35+st.heat*.12)));cop.x+=(st.x+(i?1.8:-1.8)-cop.x)*Math.min(1,dt*.8);}
   }
   for(const p of active){
    const close=(!race||race.phase==='finished')&&p.id!==pursuit.id&&p.state.y<2&&room.cops.some(c=>c.target===p.id&&Math.abs(delta(c.z,p.state.z))<9);
    p.catchTime=close&&p.state.heat>1&&p.state.speed<8?p.catchTime+dt:Math.max(0,p.catchTime-dt);
    if(p.catchTime>4){send(p.ws,{type:'busted'});p.catchTime=0;p.state.parked=true;p.state.heat=0;}
   }
   for(let a=0;a<active.length;a++)for(let b=a+1;b<active.length;b++){
    const p=active[a],q=active[b];if(p.id===pursuit.id||q.id===pursuit.id)continue;if(now-p.lastHit<2200||now-q.lastHit<2200)continue;
    if(Math.abs(p.state.x-q.state.x)<.65&&Math.abs(delta(p.state.z,q.state.z))<1.25&&Math.abs(p.state.y-q.state.y)<.7&&Math.max(p.state.speed,q.state.speed)>8){p.lastHit=q.lastHit=now;send(p.ws,{type:'collision',name:q.name});send(q.ws,{type:'collision',name:p.name});}
   }
   const message={type:'world',room:code,serverTime:now,capacity:12,race,pursuit,challenge:room.challenge.snapshot(),roadblocks:active.some(p=>p.state.heat>=1),players:live.map(p=>({id:p.id,name:p.name,role:p.id===pursuit.id?'police':'rider',...p.state,catchTime:p.catchTime})).sort((a,b)=>b.score-a.score),traffic:room.traffic,cops:room.cops};
   const json=JSON.stringify(message);for(const p of live)if(p.ws.readyState===WebSocket.OPEN&&p.ws.bufferedAmount<256000)p.ws.send(json);
  }
 },50);
 const ping=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},10000);
 const cleanup=()=>{clearInterval(tick);clearInterval(ping);for(const ws of wss.clients)ws.terminate();wss.close();};
 server.on('close',cleanup);
 return {rooms,wss,close:cleanup};
}

