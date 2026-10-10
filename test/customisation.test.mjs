import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {cleanCustom} from '../public/customisation.js';
import {applyBikeFinish} from '../public/bike-finish.js';
test('custom appearance allows supported colours and discards malformed network values',()=>{const defaults=cleanCustom();assert.deepEqual(cleanCustom(null),defaults);assert.deepEqual(cleanCustom({paint:'<script>',jacket:42,unknown:'value'}),defaults);assert.equal(cleanCustom({paint:'red',jacket:'teal'}).jacket,'teal');assert.equal(cleanCustom({paint:'red'}).paint,'red');});
test('rider and bike colours remain independent, reset to factory, and do not affect another player',()=>{
 function rider(){const root=new T.Group();root.userData.bikeId='scrambler';for(const [name,material,color]of [['BIKE_body','VR3 Satin black alloy',0x111111],['RIDER_helmet','VR2 Graphite ceramic',0x222222],['RIDER_jacket','VR2 Technical riding jacket',0x333333]]){const m=new T.MeshStandardMaterial({color});m.name=material;const o=new T.Mesh(new T.BoxGeometry(),m);o.name=name;root.add(o);}return root;}
 const a=rider(),b=rider(),levels={motor:0,battery:0,handling:0};applyBikeFinish(a,levels,{paint:'red',helmet:'white',jacket:'teal'});applyBikeFinish(b,levels,{paint:'blue',jacket:'orange'});assert.equal(a.getObjectByName('BIKE_body').material.color.getHexString(),'ca3044');assert.equal(a.getObjectByName('RIDER_helmet').material.color.getHexString(),'e5ebee');assert.equal(b.getObjectByName('BIKE_body').material.color.getHexString(),'356dd0');applyBikeFinish(a,levels,{});assert.equal(a.getObjectByName('BIKE_body').material.color.getHex(),0x111111);assert.equal(a.getObjectByName('RIDER_jacket').material.color.getHex(),0x333333);assert.equal(b.getObjectByName('BIKE_body').material.color.getHexString(),'356dd0');
});
