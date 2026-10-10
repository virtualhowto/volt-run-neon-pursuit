export const ZONES=[
 {name:'AFTERHOURS / STREET RUN',start:0,end:300,color:0xc9ff37,hint:'Warm up. Follow the amber mega ramps.'},
 {name:'SKYLINE / ROOFTOP ROUTE',start:300,end:850,color:0x60d9ff,hint:'LEFT LANE: launch onto the blue rooftop decks.'},
 {name:'CONCRETE / SKATE PLAZA',start:850,end:1600,color:0xec80ff,hint:'Follow the pink kickers and link air tricks.'},
 {name:'HARDHAT / CONSTRUCTION YARD',start:1600,end:2450,color:0xffb33a,hint:'RIGHT LANE: jump the container decks. Watch roadblocks.'},
 {name:'ESCAPE / FINAL STRETCH',start:2450,end:3151,color:0xc9ff37,hint:'Bank your combo before the next lap.'}
];
export const PLATFORMS=[
 {x:-5,z:-429,w:5,d:70,y:6,color:0x405666},
 {x:-5,z:-520,w:5,d:70,y:6,color:0x405666},
 {x:5,z:-1830,w:5,d:52,y:3,color:0x9b5531},
 {x:5,z:-1903,w:5,d:52,y:3,color:0x375d65}
];
export const KICKERS=[
 {x:-5,z:-365,base:0,power:16,label:'ROOFTOP LAUNCH',color:0x60d9ff},
 {x:-5,z:-461,base:6,power:7,label:'ROOF GAP',color:0x60d9ff},
 {x:-5,z:-551,base:6,power:12,label:'ROOFTOP EXIT',color:0x60d9ff},
 ...[0,1,2,3,4].map(i=>({x:[0,5,-5,0,5][i],z:-935-i*95,base:0,power:i%2?14:11,label:'PLAZA TRANSFER',color:0xec80ff})),
 {x:5,z:-1772,base:0,power:12,label:'CONTAINER LAUNCH',color:0xffb33a},
 {x:5,z:-1852,base:3,power:7,label:'CONTAINER GAP',color:0xffb33a},
 {x:5,z:-1920,base:3,power:13,label:'CRANE SEND',color:0xffb33a}
];
export const ROADBLOCKS=[{z:-690,gap:-5},{z:-1470,gap:5},{z:-2240,gap:0},{z:-2780,gap:-5}];
export function zoneAt(z){const distance=Math.max(0,-z);return ZONES.find(v=>distance>=v.start&&distance<v.end)||ZONES[0];}
export function surfaceAt(x,z,previousY){let floor=0;for(const p of PLATFORMS)if(Math.abs(x-p.x)<=p.w/2&&Math.abs(z-p.z)<=p.d/2&&previousY>=p.y-.15)floor=Math.max(floor,p.y);return floor;}
export function roadblockHit(x,y,z,block){return Math.abs(z-block.z)<1.6&&Math.abs(x-block.gap)>2&&Math.abs(x)<9.2&&y<1.5;}
