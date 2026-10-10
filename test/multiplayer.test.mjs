import {test} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {WebSocket} from 'ws';
import {createServer} from '../server.mjs';

test('friend police tags a rider, awards credits, and rotates the role',async t=>{
 const {client,server}=await setup(t);const cop=await client('chase','Cop'),rider=await client('chase','Rider');cop.send({x:0,z:-100,y:0,speed:20,parked:false});rider.send({x:0,z:-101,y:0,speed:15,parked:false});assert.equal((await rider.wait(m=>m.type==='tagged')).name,'Cop');assert.equal((await cop.wait(m=>m.type==='reward')).creds,75);
 server.multiplayer.rooms.get('chase').created=Date.now()-90001;const world=await rider.wait(m=>m.type==='world'&&m.pursuit.id===rider.joined.id);assert.equal(world.players.find(p=>p.id===rider.joined.id).role,'police');
});

test('crew contract rewards contributors and preserves unacknowledged rewards across reconnect',async t=>{
 const {client}=await setup(t);const a=await client('contract','Alice'),b=await client('contract','Bob'),watcher=await client('contract','Watcher');
 a.send({score:8000,parked:true});b.send({score:7000,parked:true});
 const ra=await a.wait(m=>m.type==='reward'),rb=await b.wait(m=>m.type==='reward');assert.equal(ra.id,rb.id);assert.equal(ra.creds,250);
 const world=await watcher.wait(m=>m.type==='world'&&m.challenge.stage===2);assert.equal(world.challenge.progress,0);assert.equal(watcher.history.some(m=>m.type==='reward'),false);
 a.ws.close();await once(a.ws,'close');const resumed=await client('contract','Alice',a.joined.token);assert.equal((await resumed.wait(m=>m.type==='reward')).id,ra.id);
 resumed.ws.send(JSON.stringify({type:'rewardAck',id:ra.id}));resumed.ws.close();await once(resumed.ws,'close');const again=await client('contract','Alice',a.joined.token);await again.wait(m=>m.type==='world');assert.equal(again.history.some(m=>m.type==='reward'),false);
});

async function setup(t){
 const server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');const url=`http://127.0.0.1:${server.address().port}`;const clients=[];
 t.after(async()=>{for(const c of clients)c.ws.terminate();server.multiplayer.close();await new Promise(resolve=>server.close(resolve));});
 async function client(room,name,token){
  const ws=new WebSocket(url.replace('http','ws')+'/ride'),history=[],pending=[];
  ws.on('message',raw=>{const m=JSON.parse(raw);history.push(m);for(const waiter of [...pending])if(waiter.predicate(m)){clearTimeout(waiter.timer);pending.splice(pending.indexOf(waiter),1);waiter.resolve(m);}});
  const wait=(predicate,timeout=2500)=>{const found=history.find(predicate);if(found)return Promise.resolve(found);return new Promise((resolve,reject)=>{const waiter={predicate,resolve,timer:setTimeout(()=>{pending.splice(pending.indexOf(waiter),1);reject(Error('message timeout'));},timeout)};pending.push(waiter);});};
  const c={ws,history,wait,send:state=>ws.send(JSON.stringify({type:'state',...state}))};clients.push(c);
  await once(ws,'open');ws.send(JSON.stringify({type:'join',room,name,token}));c.joined=await wait(m=>m.type==='joined'||m.type==='error');return c;
 }
 return {server,url,client};
}
test('shared traffic and police snapshots, room isolation, names and upgrades',async t=>{
 const {client}=await setup(t);const a=await client('Crew','Alice'),b=await client('crew','Bob'),c=await client('other','Else');
 a.send({x:-4,z:-50,y:0,speed:14,score:400,heat:3,bike:'performance',custom:{paint:'red',jacket:'teal',pants:'invalid'},stunt:'CORKSCREW',lean:4,parked:false,levels:{motor:2}});b.send({x:4,z:-52,y:1,speed:10,score:100,heat:1,parked:false});
 const wa=await a.wait(m=>m.type==='world'&&m.players.length===2&&m.players[0].score===400);
 const wb=await b.wait(m=>m.type==='world'&&m.serverTime===wa.serverTime);
 assert.deepEqual(wa.traffic,wb.traffic);assert.deepEqual(wa.cops,wb.cops);assert.equal(wa.traffic.length,36);assert.equal(wa.players[0].levels.motor,2);assert.equal(wa.players[0].name,'Alice');assert.equal(wa.players[0].stunt,'CORKSCREW');assert.equal(wa.players[0].lean,4);assert.equal(wa.players[0].bike,'performance');assert.equal(wa.players[0].custom.paint,'red');assert.equal(wa.players[0].custom.jacket,'teal');assert.equal(wa.players[0].custom.pants,'factory');assert.equal(wa.players[1].custom.paint,'factory');assert.ok(wa.cops.some(cop=>cop.target===b.joined.id));assert.equal(wa.pursuit.id,a.joined.id);
 const other=await c.wait(m=>m.type==='world');assert.equal(other.players.length,1);assert.equal(other.players[0].name,'Else');
 const later=await a.wait(m=>m.type==='world'&&m.serverTime>wa.serverTime);assert.notEqual(later.traffic[0].z,wa.traffic[0].z);
});
test('disconnect removes rider; resume restores identity and score',async t=>{
 const {client}=await setup(t);const a=await client('resume','Alice'),b=await client('resume','Bob');a.send({x:3,z:-90,score:888,parked:true});await b.wait(m=>m.type==='world'&&m.players.some(p=>p.score===888));a.ws.close();await once(a.ws,'close');
 await b.wait(m=>m.type==='world'&&m.players.length===1&&m.players[0].id===b.joined.id);
 const again=await client('resume','Alice',a.joined.token);assert.equal(again.joined.resumed,true);assert.equal(again.joined.id,a.joined.id);assert.equal(again.joined.spawn.z,-90);
 const w=await again.wait(m=>m.type==='world'&&m.players.length===2);assert.equal(w.players.find(p=>p.id===again.joined.id).score,888);
});
test('rider contact crashes both riders and parked riders remain protected',async t=>{
 const {client,server}=await setup(t);await client('contact','Officer');const a=await client('contact','Alice'),b=await client('contact','Bob');a.send({x:0,z:-20,y:0,speed:15,parked:false});b.send({x:0,z:-20,y:0,speed:15,parked:false});
 assert.equal((await a.wait(m=>m.type==='collision')).name,'Bob');assert.equal((await b.wait(m=>m.type==='collision')).name,'Alice');
 const room=server.multiplayer.rooms.get('contact');for(const p of room.players.values()){p.lastHit=0;p.state.parked=true;}const count=a.history.filter(m=>m.type==='collision').length;const time=Date.now();await a.wait(m=>m.type==='world'&&m.serverTime>time+120);assert.equal(a.history.filter(m=>m.type==='collision').length,count);
});
test('room capacity, rejected invalid payloads, and fresh respawn',async t=>{
 const {client}=await setup(t);const riders=[];for(let i=0;i<12;i++)riders.push(await client('capacity','Rider '+i));const extra=await client('capacity','Extra');assert.equal(extra.joined.type,'error');assert.match(extra.joined.message,/full/);
 const a=riders[0];a.ws.send('null');a.ws.send('{broken');a.send({x:999,y:-99,z:-99999,speed:999,score:-10,levels:{motor:99},parked:true});const w=await a.wait(m=>m.type==='world'&&m.players.find(p=>p.id===a.joined.id)?.x===11);const p=w.players.find(p=>p.id===a.joined.id);assert.equal(p.z,-3150);assert.equal(p.y,0);assert.equal(p.score,0);assert.equal(p.levels.motor,3);
 a.ws.send(JSON.stringify({type:'respawn'}));const spawned=await a.wait(m=>m.type==='spawn');assert.ok(spawned.spawn.x>=-11&&spawned.spawn.x<=11);assert.ok(spawned.spawn.z>=-3150);
});

test('crew race starts the shared grid and countdown, finishes in checkpoint order',async t=>{
 const {client,server}=await setup(t);const a=await client('race','Alice');
 a.ws.send(JSON.stringify({type:'raceStart'}));assert.match((await a.wait(m=>m.type==='notice')).message,/friend/);
 const b=await client('race','Bob');a.ws.send(JSON.stringify({type:'raceStart'}));
 await a.wait(m=>m.type==='spawn');await b.wait(m=>m.type==='spawn');
 const countdown=await a.wait(m=>m.type==='world'&&m.race?.phase==='countdown');assert.equal(countdown.race.entries.length,2);assert.equal(countdown.pursuit.id,null);
 const race=server.multiplayer.rooms.get('race').race;race.start=Date.now()-1000;
 for(let z=0;z>=-1350;z-=10)race.observe(a.joined.id,{z,x:0,parked:false},Date.now());
 const finished=await a.wait(m=>m.type==='world'&&m.race?.entries[0].time!==null&&m.race?.entries[0].id===a.joined.id);assert.equal(finished.race.entries[0].next,5);
});

test('race prize is delivered once and replayed until acknowledged',async t=>{
 const {client,server}=await setup(t);const a=await client('prizes','Alice'),b=await client('prizes','Bob');
 a.ws.send(JSON.stringify({type:'raceStart'}));await a.wait(m=>m.type==='world'&&m.race);
 const race=server.multiplayer.rooms.get('prizes').race;race.entries[0].time=20000;race.entries[1].time=30000;
 const reward=await a.wait(m=>m.type==='reward');assert.equal(reward.creds,500);assert.match(reward.reason,/PLACE 1/);
 assert.equal((await b.wait(m=>m.type==='reward')).creds,300);
 await a.wait(m=>m.type==='world'&&m.race.phase==='finished');assert.equal(a.history.filter(m=>m.type==='reward').length,1);
 a.ws.close();await once(a.ws,'close');const resumed=await client('prizes','Alice',a.joined.token);assert.equal((await resumed.wait(m=>m.type==='reward')).id,reward.id);
});
