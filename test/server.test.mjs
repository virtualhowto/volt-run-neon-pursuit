import {test} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {WebSocket} from 'ws';
import {createServer} from '../server.mjs';
test('serves game and local Three.js; isolates multiplayer rooms',async()=>{
 const s=createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const url=`http://127.0.0.1:${s.address().port}`;const sockets=[];
 try{for(const p of ['/','/health','/game.js','/vendor/three/build/three.module.js','/assets/ebike.glb'])assert.equal((await fetch(url+p)).status,200,p);assert.equal((await fetch(url+'/missing')).status,404);
 const connect=async(room,name)=>{const w=new WebSocket(url.replace('http','ws')+'/ride');sockets.push(w);await once(w,'open');const joined=new Promise(resolve=>w.on('message',d=>{const m=JSON.parse(d);if(m.type==='joined')resolve(m);}));w.send(JSON.stringify({type:'join',room,name}));await joined;return w;};
 const a=await connect('same','Alice'),b=await connect('same','Bob'),c=await connect('other','Else');const snapshot=w=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('snapshot timeout')),2000);w.on('message',d=>{const m=JSON.parse(d);if(m.type==='world'&&m.players.length&&m.players.every(p=>p.score===42)){clearTimeout(timer);resolve(m.players);}});});const pa=snapshot(a),pc=snapshot(c);for(const w of [a,b,c])w.send(JSON.stringify({type:'state',x:0,y:0,z:0,score:42}));const players=await pa;assert.equal(players.length,2);assert.deepEqual(players.map(p=>p.name).sort(),['Alice','Bob']);assert.equal((await pc).length,1);
 }finally{for(const w of sockets)w.terminate();await new Promise(resolve=>s.close(resolve));}
});

