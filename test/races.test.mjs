import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CrewRace,GATES} from '../races.mjs';
test('countdown, ordered checkpoints, finish time and timeout',()=>{
 const r=new CrewRace([{id:'a',name:'Alice'},{id:'b',name:'Bob'}],1000);
 assert.equal(r.snapshot(2000).phase,'countdown');
 r.observe('a',{z:-201,x:0,parked:false},3000);assert.equal(r.entries[0].next,0);
 let now=6000;for(let z=0;z>=-1355;z-=5)r.observe('a',{z,x:0,parked:false},now+=100);
 assert.equal(r.entries[0].next,GATES.length);assert.ok(r.entries[0].time>0);
 assert.equal(r.snapshot(126001).phase,'finished');assert.equal(r.entries[1].time,null);
});
test('teleports, skipped checkpoints, parked riders and outside gates do not count',()=>{
 const r=new CrewRace([{id:'a',name:'Alice'}],0);
 r.observe('a',{z:-205,x:0,parked:false},6000);assert.equal(r.entries[0].next,0);
 r.observe('a',{z:-190,x:0,parked:false},6100);
 r.observe('a',{z:-200,x:10,parked:false},6200);assert.equal(r.entries[0].next,0);
 r.observe('a',{z:-195,x:0,parked:false},6300);r.observe('a',{z:-200,x:0,parked:true},6400);assert.equal(r.entries[0].next,0);
});

test('podium rewards pay finishers once, exclude DNF, and wait for race end',()=>{
 const r=new CrewRace(['a','b','c','d','e'].map(id=>({id,name:id})),0);
 r.entries[0].time=20000;r.entries[1].time=10000;r.entries[2].time=30000;r.entries[3].time=40000;
 assert.deepEqual(r.claimRewards(60000),[]);
 assert.deepEqual(r.claimRewards(125001).map(e=>[e.playerId,e.creds]),[['b',500],['a',300],['c',200],['d',100]]);
 assert.deepEqual(r.claimRewards(130000),[]);assert.equal(r.snapshot(130000).entries[4].prize,0);
});
