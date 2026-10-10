import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cleanSave,earn,purchase,rank} from '../public/progression.js';
test('credits are awarded only on banked points and fractional credits carry',()=>{const s=cleanSave();assert.equal(earn(s,9),0);assert.equal(earn(s,1),1);assert.equal(s.creds,1);assert.equal(s.rep,10);});
test('purchases deduct costs, require funds, and stop at maximum',()=>{const s=cleanSave();assert.equal(purchase(s,'motor'),false);earn(s,8500);assert.equal(s.creds,850);for(let i=0;i<3;i++)assert.equal(purchase(s,'motor'),true);assert.equal(s.creds,0);assert.equal(s.levels.motor,3);assert.equal(purchase(s,'motor'),false);assert.equal(purchase(s,'bogus'),false);assert.equal(rank(s.rep),'MOST WANTED');assert.deepEqual(cleanSave(JSON.parse(JSON.stringify(s))),s);});
test('malformed persisted values are clamped',()=>{const s=cleanSave({creds:-3,levels:{motor:99,battery:'bad'}});assert.equal(s.creds,0);assert.equal(s.levels.motor,3);assert.equal(s.levels.battery,0);});
