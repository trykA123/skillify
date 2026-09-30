import {createWriteStream} from 'node:fs';
import {once} from 'node:events';
import {DURATION, SKILLS, ROLES} from './timeline.mjs';

const RATE = 48000;
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = v => { const x = clamp(v); return x*x*(3-2*x); };
const freq = midi => 440 * 2 ** ((midi-69)/12);
const random = n => { const x=Math.sin(n*12.9898+78.233)*43758.5453;return (x-Math.floor(x))*2-1; };
const events = [];
const beat = 60 / 88;
const chords = [[38,50,53,57,62],[34,46,50,53,58],[41,53,57,60,65],[36,48,52,55,60]];

for(let bar=0;bar<47;bar++) {
  const start=16+bar*4*beat;
  if(start>123) break;
  const chord=chords[Math.floor(bar/4)%4];
  const strength=start<84?.45:start<110?.82:.32;
  for(let step=0;step<8;step++) {
    const t=start+step*beat/2;
    const midi=chord[[1,3,2,4,1,2,3,4][step]];
    events.push({t,kind:'pluck',f:freq(midi),amp:.042*strength,pan:(step%3-1)*.4,length:2});
    if(step%2===0&&t<110) events.push({t,kind:'kick',amp:.09*strength,pan:0,length:.6});
    if(step%2===1&&t<110) events.push({t,kind:'hat',amp:.014*strength,pan:step%4===1?-.45:.45,length:.1});
  }
}

for(const skill of SKILLS) {
  events.push({t:skill.start+.35,kind:'bell',f:freq(74+SKILLS.indexOf(skill)%5),amp:.045,pan:.22,length:3});
  events.push({t:skill.start-.45,kind:'air',amp:.042,pan:-.2,length:1.2});
}
for(const role of ROLES) events.push({t:role.start+.2,kind:'bell',f:freq(69+ROLES.indexOf(role)*2),amp:.05,pan:(ROLES.indexOf(role)-1.5)*.25,length:3});
for(let i=0;i<7;i++) events.push({t:111+i*1.7,kind:'bell',f:freq([62,65,69,74,69,65,62][i]),amp:.064,pan:(i%3-1)*.35,length:5});
events.push({t:120.4,kind:'bloom',f:freq(50),amp:.12,pan:0,length:8.7});
events.sort((a,b)=>a.t-b.t);

function eventSample(event,t,index) {
  const s=t-event.t;
  if(s<0||s>event.length) return 0;
  const noise=random(index);
  if(event.kind==='kick') return Math.sin(TAU*(48*s+34*(1-Math.exp(-s*28))/28))*Math.exp(-s*11)*event.amp;
  if(event.kind==='hat') return (noise-random(index-1))*.5*Math.exp(-s*55)*event.amp;
  if(event.kind==='air') return (noise*.18+Math.sin(TAU*180*s)*.03)*Math.sin(Math.PI*s/event.length)**2*event.amp;
  if(event.kind==='bloom') {
    const env=smooth(s/.4)*(1-smooth((s-5)/3.7));
    return (Math.sin(TAU*event.f*s)+.45*Math.sin(TAU*event.f*1.5*s)+.35*Math.sin(TAU*event.f*2*s))*env*event.amp;
  }
  const attack=smooth(s/.015);
  const release=1-smooth((s-event.length*.75)/(event.length*.25));
  const decay=Math.exp(-s*(event.kind==='bell'?1.3:3.6));
  const harmonics=Math.sin(TAU*event.f*s)+.35*Math.sin(TAU*event.f*2.002*s)*Math.exp(-s*2)+.15*Math.sin(TAU*event.f*3.99*s)*Math.exp(-s*4);
  return harmonics*attack*release*decay*event.amp;
}

export async function writeScore(destination) {
  const length=RATE*DURATION;
  const header=Buffer.alloc(44);
  header.write('RIFF');header.writeUInt32LE(length*4+36,4);header.write('WAVE',8);header.write('fmt ',12);
  header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(2,22);header.writeUInt32LE(RATE,24);
  header.writeUInt32LE(RATE*4,28);header.writeUInt16LE(4,32);header.writeUInt16LE(16,34);
  header.write('data',36);header.writeUInt32LE(length*4,40);
  const stream=createWriteStream(destination);
  stream.write(header);
  const delayLeft=new Float64Array(Math.round(RATE*.409));
  const delayRight=new Float64Array(Math.round(RATE*.613));
  let low=0;
  let cursor=0;
  let active=[];
  let peak=0;
  for(let start=0;start<length;start+=8192) {
    const count=Math.min(8192,length-start);
    const data=Buffer.alloc(count*4);
    for(let j=0;j<count;j++) {
      const i=start+j,t=i/RATE;
      while(cursor<events.length&&events[cursor].t<=t) active.push(events[cursor++]);
      if(i%4800===0) active=active.filter(event=>event.t+event.length>=t);
      const cycle=16*beat;
      const chordNumber=Math.floor(Math.max(0,t-16)/cycle);
      const chord=chords[chordNumber%4];
      const previous=chords[(chordNumber+3)%4];
      const blend=chordNumber===0?1:smooth(((t-16)%cycle)/1.2);
      const fade=smooth(t/3)*(1-smooth((t-126)/4));
      const pad=notes=>Math.sin(TAU*freq(notes[0])*t)*.022+Math.sin(TAU*freq(notes[1])*.999*t)*.013+Math.sin(TAU*freq(notes[2])*t)*.012;
      const drone=(pad(chord)*blend+pad(previous)*(1-blend))*(.7+.3*smooth((t-14)/3));
      low+=(random(i)-low)*.035;
      const texture=low*.008*(.5+.5*Math.sin(t*.07));
      let l=drone+texture,r=drone-texture;
      for(const event of active) {
        const sample=eventSample(event,t,i);
        l+=sample*Math.sqrt((1-event.pan)/2);r+=sample*Math.sqrt((1+event.pan)/2);
      }
      const dl=i%delayLeft.length,dr=i%delayRight.length;
      const oldL=delayLeft[dl],oldR=delayRight[dr];
      delayLeft[dl]=l*.35+oldL*.4;delayRight[dr]=r*.35+oldR*.4;
      l=(l+oldR*.24)*fade;r=(r+oldL*.24)*fade;
      peak=Math.max(peak,Math.abs(l),Math.abs(r));
      data.writeInt16LE(Math.round(clamp(l,-1,1)*32767),j*4);
      data.writeInt16LE(Math.round(clamp(r,-1,1)*32767),j*4+2);
    }
    if(!stream.write(data)) await once(stream,'drain');
  }
  stream.end();await once(stream,'finish');
  return {duration:DURATION,rate:RATE,channels:2,preMasterPeak:peak,events:events.length};
}
