import {test} from 'node:test';
import assert from 'node:assert/strict';
import {StuntRun,TRICKS,comboMultiplier} from '../public/stunts.js';
test('air tricks pay only on completion; short landings bail',()=>{const s=new StuntRun();s.launch();assert.equal(s.begin('x',5),true);assert.equal(s.update(.3,5,25),null);assert.equal(s.begin('q',5),false);assert.equal(s.land().bail,true);assert.equal(s.completed,0);});
test('all tricks finish, reset their pose, and repeated tricks diminish',()=>{for(const key of Object.keys(TRICKS)){const s=new StuntRun();s.launch();assert.equal(s.begin(key,.1),false);s.begin(key,8);const reward=s.update(TRICKS[key].duration,8,25);assert.equal(reward.points,TRICKS[key].points);assert.deepEqual(s.pose,{pitch:0,yaw:0,roll:0});s.begin(key,8);assert.equal(s.update(TRICKS[key].duration,8,25).points,Math.round(TRICKS[key].points/2));const landed=s.land();assert.equal(landed.bail,false);assert.equal(landed.tricks,2);assert.ok(landed.points>0);}});
test('combo variety raises the multiplier and it is capped at five',()=>{assert.ok(comboMultiplier(['360','BACKFLIP'])>comboMultiplier(['360','360']));assert.equal(comboMultiplier(Array(100).fill('360')),5);});

test('a collision cancels the trick and prevents a clean landing',()=>{const s=new StuntRun();s.launch();s.begin('x',8);s.cancel();assert.equal(s.update(2,2,10),null);assert.equal(s.land().bail,true);s.launch();assert.equal(s.land().bail,false);});
