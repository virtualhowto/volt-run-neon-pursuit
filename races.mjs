export const racePrize=place=>[500,300,200][place-1]??100;
export const GATES=[-200,-450,-750,-1050,-1350];
export class CrewRace {
 constructor(players,now){this.start=now+5000;this.end=this.start+120000;this.entries=players.map(p=>({id:p.id,name:p.name,next:0,lastZ:0,time:null}));}
 observe(id,state,now){const e=this.entries.find(e=>e.id===id);if(!e||e.time!==null||now<this.start||now>this.end)return;
 const gate=GATES[e.next];const travel=e.lastZ-state.z;
 if(!state.parked&&travel>=0&&travel<=15&&e.lastZ>gate&&state.z<=gate&&Math.abs(state.x)<=9){e.next++;if(e.next===GATES.length)e.time=now-this.start;}
 e.lastZ=state.z;
 }
 claimRewards(now){if(this.paid||this.snapshot(now).phase!=='finished')return [];this.paid=true;return this.snapshot(now).entries.filter(e=>e.time!==null).map((e,i)=>({playerId:e.id,creds:racePrize(i+1),reason:'RACE FINISH / PLACE '+(i+1)}));}
 snapshot(now){const done=now>=this.end||this.entries.every(e=>e.time!==null);return {phase:done?'finished':now<this.start?'countdown':'racing',seconds:Math.max(0,Math.ceil(((now<this.start?this.start:this.end)-now)/1000)),gates:GATES,entries:this.entries.map(e=>({id:e.id,name:e.name,next:e.next,time:e.time})).sort((a,b)=>(a.time??Infinity)-(b.time??Infinity)||b.next-a.next).map((e,i)=>({...e,place:e.time===null?null:i+1,prize:e.time===null?0:racePrize(i+1)}))};}
}
