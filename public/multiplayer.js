export class Multiplayer {
 constructor(handlers={}){this.handlers=handlers;this.room=null;this.id=null;this.token=null;this.socket=null;this.connected=false;this.world=null;this.receivedAt=0;this.retry=0;this.timer=null;this.generation=0;}
 join(room,name){this.leave();this.room=room.toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,20)||'crew';this.name=name.slice(0,16)||'Rider';this.retry=0;this.open();}
 open(){
  if(!this.room)return;const generation=++this.generation;this.handlers.status?.(this.retry?'Reconnecting…':'Connecting…');
  const ws=this.socket=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ride`);
  ws.onopen=()=>{if(generation!==this.generation)return;ws.send(JSON.stringify({type:'join',room:this.room,name:this.name,token:this.token}));};
  ws.onmessage=e=>{if(generation!==this.generation)return;let m;try{m=JSON.parse(e.data);}catch{return;}
   if(m.type==='joined'){this.id=m.id;this.token=m.token;this.connected=true;this.retry=0;this.handlers.joined?.(m);}
   if(m.type==='world'){this.world=m;this.receivedAt=performance.now();this.handlers.world?.(m);}
   if(m.type==='tagged')this.handlers.tagged?.(m);
   if(m.type==='reward')this.handlers.reward?.(m);
   if(m.type==='spawn')this.handlers.spawn?.(m.spawn);
   if(m.type==='collision')this.handlers.collision?.(m.name);
   if(m.type==='busted')this.handlers.busted?.();
   if(m.type==='notice')this.handlers.error?.(m.message);
   if(m.type==='error'){this.handlers.error?.(m.message);this.leave();}
  };
  ws.onerror=()=>{};
  ws.onclose=()=>{if(generation!==this.generation||!this.room)return;this.connected=false;this.handlers.status?.('Reconnecting…');this.retry++;this.timer=setTimeout(()=>this.open(),Math.min(1000*2**(this.retry-1),8000));};
 }
 send(state){if(this.connected&&this.socket?.readyState===1)this.socket.send(JSON.stringify({type:'state',...state}));}
 ackReward(id){if(this.connected)this.socket.send(JSON.stringify({type:'rewardAck',id}));}
 startRace(){if(this.connected)this.socket.send(JSON.stringify({type:'raceStart'}));}
 respawn(){if(this.connected)this.socket.send(JSON.stringify({type:'respawn'}));}
 leave(){clearTimeout(this.timer);this.generation++;const ws=this.socket;if(ws?.readyState===1)ws.send(JSON.stringify({type:'leave'}));ws?.close();this.room=null;this.token=null;this.id=null;this.connected=false;this.world=null;this.socket=null;this.handlers.left?.();}
}
