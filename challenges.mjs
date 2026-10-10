import {randomUUID} from 'node:crypto';
export class CrewChallenge {
 constructor(target=15000){this.id=randomUUID();this.target=target;this.stage=1;this.progress=0;this.last=new Map();this.contributors=new Set();}
 observe(id,score){const previous=this.last.get(id)||0;this.last.set(id,score);const gained=Math.max(0,score-previous);if(!gained)return null;this.progress+=gained;this.contributors.add(id);if(this.progress<this.target)return null;const reward={id:this.id+':'+this.stage,creds:250,recipients:[...this.contributors],stage:this.stage};this.stage++;this.progress=0;this.contributors.clear();return reward;}
 snapshot(){return {stage:this.stage,progress:this.progress,target:this.target,contributors:this.contributors.size};}
}
