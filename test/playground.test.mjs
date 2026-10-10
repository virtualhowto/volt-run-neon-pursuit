import {test} from 'node:test';
import assert from 'node:assert/strict';
import {surfaceAt,zoneAt,roadblockHit,ROADBLOCKS} from '../public/playground-layout.js';
import {CrewChallenge} from '../challenges.mjs';
import {driveSpeed,carRoof,impactDamage} from '../public/ride-physics.js';
import {policeTurn,canTag} from '../pursuit.mjs';
test('airborne throttle and boost cannot accelerate; ground boost accelerates',()=>{
 const air=driveSpeed(20,1,{grounded:false,gas:true,boost:true});assert.ok(air<=20);assert.equal(air,driveSpeed(20,1,{grounded:false,gas:false,boost:false}));assert.ok(driveSpeed(20,.2,{grounded:true,gas:true,boost:true})>driveSpeed(20,.2,{grounded:true,gas:true,boost:false}));
});
test('car roof catches only a descending rider aligned over the roof',()=>{
 const car={mesh:{position:{x:2,z:-20}}};assert.equal(carRoof(2,-20,2,-3,[car]),car);assert.equal(carRoof(2,-20,0,-3,[car]),null);assert.equal(carRoof(2,-20,2,3,[car]),null);assert.equal(carRoof(4,-20,2,-3,[car]),null);assert.ok(impactDamage(30)>impactDamage(10));assert.ok(impactDamage(20,'ROADBLOCK')>impactDamage(20));
});
test('police role rotates through friends and tags respect height and spawn protection',()=>{
 const players=[{id:'a'},{id:'b'},{id:'c'}];assert.equal(policeTurn(players,0,1).id,'a');assert.equal(policeTurn(players,0,90001).id,'b');assert.equal(policeTurn(players,0,180001).id,'c');assert.equal(policeTurn(players,0,270001).id,'a');assert.equal(policeTurn([players[0]],0,1).id,null);
 const rider={lastHit:0,state:{parked:false,x:0,y:0,speed:12}};assert.equal(canTag(rider,rider,1,10000),true);assert.equal(canTag(rider,{...rider,lastHit:9000},1,10000),false);assert.equal(canTag(rider,{...rider,state:{...rider.state,y:6}},1,10000),false);
});
test('rooftop and container surfaces catch descending riders but not riders below the deck',()=>{
 assert.equal(surfaceAt(-5,-429,8),6);assert.equal(surfaceAt(-5,-429,6),6);assert.equal(surfaceAt(-5,-429,0),0);assert.equal(surfaceAt(0,-429,8),0);assert.equal(surfaceAt(-5,-479,6),0);assert.equal(surfaceAt(5,-1830,4),3);
});
test('district boundaries and roadblock escape gaps match the world layout',()=>{
 assert.match(zoneAt(-400).name,/ROOFTOP/);assert.match(zoneAt(-1000).name,/SKATE/);assert.match(zoneAt(-1800).name,/CONSTRUCTION/);
 for(const b of ROADBLOCKS){assert.equal(roadblockHit(b.gap,0,b.z,b),false);assert.equal(roadblockHit(b.gap===0?5:0,0,b.z,b),true);assert.equal(roadblockHit(0,2,b.z,b),false);}
});
test('crew rewards use banked deltas, include contributors, and never recount unchanged scores',()=>{
 const c=new CrewChallenge(1000);assert.equal(c.observe('a',600),null);assert.equal(c.observe('a',600),null);const reward=c.observe('b',400);assert.deepEqual(reward.recipients,['a','b']);assert.equal(reward.creds,250);assert.equal(c.snapshot().stage,2);assert.equal(c.observe('b',400),null);assert.equal(c.observe('a',0),null);assert.equal(c.observe('a',500),null);assert.equal(c.snapshot().progress,500);
});
