import {WIDTH, HEIGHT, DURATION, SKILLS, ROLES, SCENES} from './timeline.mjs';

const canvas = document.querySelector('#film');
const c = canvas.getContext('2d', {alpha: false});
const TAU = Math.PI * 2;
const RED = '#ff603b';
const WHITE = '#eff1f2';
const MUTED = '#a8b4bf';
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = v => { const x = clamp(v); return x * x * (3 - 2 * x); };
const out = v => 1 - Math.pow(1 - clamp(v), 3);
const hash = v => { const x = Math.sin(v * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
let ink = 1;
const background = document.createElement('canvas');
background.width = WIDTH;
background.height = HEIGHT;
const b = background.getContext('2d');
b.fillStyle = '#080b0f';
b.fillRect(0, 0, WIDTH, HEIGHT);
const light = b.createRadialGradient(1320, 480, 20, 1130, 530, 1100);
light.addColorStop(0, '#17202a');
light.addColorStop(.6, '#10161c');
light.addColorStop(1, '#080b0f');
b.fillStyle = light;
b.fillRect(0, 0, WIDTH, HEIGHT);
for (let i = 0; i < 14000; i++) {
  b.fillStyle = `rgba(170,185,200,${.012 + hash(i + 33) * .035})`;
  b.fillRect(hash(i + 1) * WIDTH, hash(i + 6) * HEIGHT, 1, 1);
}

function text(value, x, y, size, color = WHITE, weight = 400, align = 'left', family = 'Rubik') {
  const alpha = c.globalAlpha;
  c.globalAlpha *= ink;
  c.fillStyle = color;
  c.font = `${weight} ${size}px ${family}`;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(value, x, y);
  c.globalAlpha = alpha;
}

function lines(value, x, y, size, width, color = MUTED, weight = 400, leading = 1.45) {
  c.font = `${weight} ${size}px Rubik`;
  const words = value.split(' ');
  let line = '';
  let offset = 0;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (c.measureText(next).width > width && line) { text(line, x, y + offset, size, color, weight); line = word; offset += size * leading; }
    else line = next;
  }
  if (line) text(line, x, y + offset, size, color, weight);
}

function path(points, color = MUTED, width = 1, close = false, fill = null) {
  if (!points.length) return;
  c.beginPath();
  c.moveTo(...points[0]);
  for (const p of points.slice(1)) c.lineTo(...p);
  if (close) c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function circle(x, y, r, color = MUTED, width = 1, fill = null) {
  c.beginPath(); c.arc(x, y, r, 0, TAU);
  if (fill) { c.fillStyle = fill; c.fill(); }
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}

function glow(points, width = 2.5) {
  c.save(); c.shadowColor = RED; c.shadowBlur = 12;
  path(points, RED, width); c.restore();
}

function project(p, center, angle, scale = 1) {
  let [x, y, z] = p;
  const cy = Math.cos(angle), sy = Math.sin(angle);
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  const cx = Math.cos(-.42), sx = Math.sin(-.42);
  [y, z] = [y * cx - z * sx, y * sx + z * cx];
  const k = 1000 / (1000 + z);
  return [center[0] + x * k * scale, center[1] + y * k * scale, z];
}

function mesh(points, edges, center, angle, scale = 1, color = '#586775', width = 1.3) {
  const ps = points.map(p => project(p, center, angle, scale));
  for (const [a, d] of edges) path([ps[a].slice(0, 2), ps[d].slice(0, 2)], color, width);
  return ps;
}

function ring(radius, y, center, angle, scale = 1, color = '#52616d', tilt = 0) {
  const points = [];
  for (let i = 0; i <= 96; i++) {
    const a = i / 96 * TAU;
    points.push(project([Math.cos(a) * radius, y + Math.sin(a) * radius * Math.sin(tilt), Math.sin(a) * radius * Math.cos(tilt)], center, angle, scale).slice(0, 2));
  }
  path(points, color, 1.3);
  return points;
}

function box(x, y, z, w, h, d, center, angle, scale = 1, accent = false) {
  const points = [[x-w/2,y-h/2,z-d/2],[x+w/2,y-h/2,z-d/2],[x+w/2,y+h/2,z-d/2],[x-w/2,y+h/2,z-d/2],[x-w/2,y-h/2,z+d/2],[x+w/2,y-h/2,z+d/2],[x+w/2,y+h/2,z+d/2],[x-w/2,y+h/2,z+d/2]];
  const ps = points.map(p => project(p, center, angle, scale));
  const faces = [[0,1,2,3],[4,5,6,7],[0,4,5,1],[3,7,6,2],[0,3,7,4],[1,5,6,2]];
  const colors = accent ? ['#85351f','#be492d','#fa6944','#8b3421','#d94e2b','#d15b3b'] : ['#26323e','#374654','#62717e','#202c38','#435462','#526373'];
  faces.map((f,i) => ({f,i,z:f.reduce((sum,j)=>sum+ps[j][2],0)/4})).sort((a,b)=>b.z-a.z).forEach(({f,i})=>path(f.map(j=>ps[j].slice(0,2)),accent?'#ff906c':'#7f8c97',.85,true,colors[i]));
}

function lattice(center, angle, t, scale = 1) {
  const points = [], edges = [];
  for (let z = 0; z < 4; z++) for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    points.push([(x-1.5)*135,(y-1.5)*135,(z-1.5)*135]);
    const i = z*16+y*4+x;
    if (x < 3) edges.push([i,i+1]);
    if (y < 3) edges.push([i,i+4]);
    if (z < 3) edges.push([i,i+16]);
  }
  const ps = mesh(points,edges,center,angle,scale,'#607585',1.2);
  const route = [0,1,5,21,22,26,42,43,47,63];
  const visible = Math.min(route.length-1, t*.8+2);
  const stroke = [];
  for (let i=0;i<route.length-1;i++) {
    if (i > visible) break;
    stroke.push(ps[route[i]].slice(0,2));
    if (i+1>visible) {
      stroke.push([lerp(ps[route[i]][0],ps[route[i+1]][0],visible-i),lerp(ps[route[i]][1],ps[route[i+1]][1],visible-i)]);
      break;
    }
  }
  glow(stroke,3);
  for (const i of route) circle(ps[i][0],ps[i][1],4,RED,1.5,'#10161c');
}

function signal(center, t) {
  const p = smooth((t-.5)/3.5);
  for (let j=0;j<30;j++) {
    const ps=[];
    for (let i=0;i<=90;i++) {
      const x=-350+i/90*700;
      const chaos=Math.sin(x*.012+j*.26+t*.35)*85+Math.sin(x*.027+j*.7)*32;
      const ordered=Math.sin(x*.009)*20;
      const y=lerp((j-14.5)*9+chaos,(j-14.5)*13+ordered,p);
      ps.push([center[0]+x,center[1]+y]);
    }
    path(ps,j===15?RED:`rgba(131,150,164,${.15+j/100})`,j===15?3:1);
  }
  for (let i=0;i<3;i++) {
    const x=center[0]-225+i*225;
    c.save(); c.globalAlpha*=out((t-1.8-i*.15)/.9);
    circle(x,center[1],13,RED,2,'#10161c');
    path([[x,center[1]+35],[x,center[1]+250]],'#4d5b68',1);
    text(['known','assumed','unknown'][i],x,center[1]+286,20,MUTED,400,'center','JetBrains');
    c.restore();
  }
}

function lens(center, angle, t) {
  for(let k=0;k<5;k++) ring(245-k*12,(k-2)*58,center,angle,1,k===2?RED:'#617180',.13);
  for(let i=0;i<3;i++) {
    const a=i*TAU/3+.3;
    const p=project([Math.cos(a)*330,-130,Math.sin(a)*330],center,angle);
    const q=project([0,70,0],center,angle);
    path([p.slice(0,2),q.slice(0,2)],i===0?RED:'#81909a',1.6);
    circle(p[0],p[1],10,i===0?RED:WHITE,2,'#11171d');
    text(['official','independent','confidence'][i],p[0],p[1]-25,19,MUTED,400,'center','JetBrains');
  }
  const a=t*.3;
  const beam=[];
  for(let i=0;i<5;i++) beam.push(project([Math.sin(a)*70,(i-2)*65,Math.cos(a)*70],center,angle).slice(0,2));
  glow(beam,3);
}

function trace(center,t) {
  const progress=smooth((t-.4)/4.4);
  for(let j=0;j<9;j++) {
    const ps=[];
    for(let i=0;i<=100;i++) {
      const x=-360+i*7.2;
      const spread=1-smooth((i/100-.3)/.45)*progress;
      const y=(j-4)*55*spread+Math.sin(i*.10+j*.65+t*.14)*34*spread;
      ps.push([center[0]+x,center[1]+y]);
    }
    path(ps,j===4?RED:`rgba(114,136,151,${.5*(1-progress*.55)})`,j===4?3:1);
  }
  const x=center[0]+80;
  const r=lerp(190,36,progress);
  circle(x,center[1],r,RED,1.8);
  circle(x,center[1],r+8,'#5c3b33',1);
  text('cause',x,center[1]+r+42,21,RED,400,'center','JetBrains');
  const y=center[1]+275;
  text('hypothesis',center[0]-295,y,19,MUTED,400,'center','JetBrains');
  text('test',center[0],y,19,MUTED,400,'center','JetBrains');
  text('confirm',center[0]+295,y,19,MUTED,400,'center','JetBrains');
  path([[center[0]-190,y-7],[center[0]-45,y-7]],'#4c5b67',1);
  path([[center[0]+45,y-7],[center[0]+205,y-7]],'#4c5b67',1);
}

function measure(center,angle,t) {
  for(let i=0;i<11;i++) {
    const h=90+hash(i+400)*250;
    box((i-5)*50,80-h/2,0,26,h,135,center,angle,.95,i===6);
  }
  const scan=lerp(-240,160,smooth(t/5));
  const ps=[[-350,scan,-130],[350,scan,-130],[350,scan,130],[-350,scan,130],[-350,scan,-130]].map(p=>project(p,center,angle).slice(0,2));
  glow(ps,1.4);
  for(let i=0;i<7;i++) {
    const p=project([-390,160-i*65,0],center,angle);
    path([[p[0]-12,p[1]],[p[0]+12,p[1]]],'#718392',1);
  }
  text('observed',center[0]-190,center[1]+320,20,WHITE,400,'center','JetBrains');
  text('reproducible',center[0]+190,center[1]+320,20,RED,400,'center','JetBrains');
}

function blueprint(center,angle,t) {
  const p=smooth((t-.6)/3.5);
  const gaps=lerp(138,48,p);
  for(let j=0;j<5;j++) {
    const y=(j-2)*gaps;
    box(0,y,0,370,12,290,center,angle,.88,j===2);
    const line=[[-235,y,-190],[235,y,-190],[235,y,190],[-235,y,190],[-235,y,-190]].map(a=>project(a,center,angle,.88).slice(0,2));
    path(line,'#50616f',1);
    if(j%2===0) {
      const q=project([270,y,170],center,angle,.88);
      path([[q[0],q[1]],[q[0]+60,q[1]]],'#627381',1);
      text(['files','checks','traps'][j/2],q[0]+72,q[1]+7,19,MUTED,400,'left','JetBrains');
    }
  }
  for(let x of [-175,175]) for(let z of [-125,125]) {
    const a=project([x,-2*gaps,z],center,angle,.88), b=project([x,2*gaps,z],center,angle,.88);
    path([a.slice(0,2),b.slice(0,2)],'#96a1aa',1.5);
  }
}

function aperture(center,angle,t) {
  const radius=lerp(300,180,smooth((t-.5)/3.6));
  for(let i=0;i<8;i++) {
    const a=i*TAU/8+t*.08;
    const points=[];
    for(const [r,offset] of [[radius,.0],[radius+110,.05],[radius+110,.65],[radius,.38]]) points.push(project([Math.cos(a+offset)*r,Math.sin(a+offset)*r,0],center,angle*.3).slice(0,2));
    path(points,'#8a99a5',1.2,true,i%2?'#26323c':'#35434f');
  }
  const r=radius*.68;
  circle(center[0],center[1],r,RED,2);
  text('outcome',center[0],center[1]-40,24,WHITE,400,'center','JetBrains');
  text('scope',center[0],center[1]+4,24,WHITE,400,'center','JetBrains');
  text('stop rules',center[0],center[1]+48,24,RED,400,'center','JetBrains');
}

function assembly(center,angle,t) {
  const p=smooth((t-.3)/5.5);
  for(let j=3;j>=0;j--) for(let i=0;i<4;i++) {
    const arrival=out((p-(j*4+i)*.023)/.48);
    const x=(i-1.5)*102, z=(j-1.5)*102;
    const y=lerp(-470-j*50,0,arrival);
    if(arrival>.04) {
      c.save();c.globalAlpha*=arrival;
      box(x,y,z,88,90,88,center,angle,.9,j===1&&i===2);
      c.restore();
    }
  }
  for(let i=0;i<3;i++) {
    const y=180+i*45;
    const points=[[-250,y,-230],[250,y,-230],[250,y,230],[-250,y,230],[-250,y,-230]].map(p=>project(p,center,angle,.9).slice(0,2));
    path(points,i===0?RED:'#3e505e',i===0?2:1);
  }
  const check=out((t-4.5)/1);
  c.save();c.globalAlpha*=check;
  text('baseline',center[0]-210,center[1]+342,19,MUTED,400,'center','JetBrains');
  text('verify',center[0],center[1]+342,19,WHITE,400,'center','JetBrains');
  text('real result',center[0]+215,center[1]+342,19,RED,400,'center','JetBrains');
  c.restore();
}

function verdict(center,angle,t) {
  const p=smooth((t-.6)/3.6);
  box(0,0,0,260,320,260,center,angle,.9,false);
  const sweep=lerp(-320,320,p);
  const points=[[-210,sweep,-210],[210,sweep,-210],[210,sweep,210],[-210,sweep,210],[-210,sweep,-210]].map(v=>project(v,center,angle,.9).slice(0,2));
  glow(points,2);
  const y=center[1]+325;
  for(let i=0;i<3;i++) {
    const x=center[0]-210+i*210;
    const selected=i===1&&t>3.8;
    text(['fix','approve','replan'][i],x,y,22,selected?RED:MUTED,400,'center','JetBrains');
    if(selected) path([[x-44,y+14],[x+44,y+14]],RED,2);
  }
}

function release(center,angle,t) {
  const p=smooth((t-.5)/4);
  for(let i=0;i<5;i++) {
    const y=100-i*110;
    ring(190+i*28,y,center,angle,.83,i===2?RED:'#61707d');
  }
  box(0,lerp(105,-355,p),0,110,100,110,center,angle,.83,true);
  const route=[];
  for(let i=0;i<100;i++) {
    const a=i/99*TAU*.8;
    route.push(project([Math.cos(a)*335,lerp(-370,110,i/99),Math.sin(a)*335],center,angle,.83).slice(0,2));
  }
  path(route,'#a2b0ba',1.5);
  text('rollout',center[0]-180,center[1]+330,20,WHITE,400,'center','JetBrains');
  text('rollback',center[0]+180,center[1]+330,20,RED,400,'center','JetBrains');
}

function teach(center,angle,t) {
  const p=smooth((t-.4)/4.8);
  for(let i=4;i>=0;i--) {
    const radius=90+i*47;
    const ps=[];
    for(let j=0;j<=4;j++) {
      const a=j/4*TAU+Math.PI/4;
      const y=(i-2)*lerp(18,100,p);
      ps.push(project([Math.cos(a)*radius,y,Math.sin(a)*radius],center,angle,.9).slice(0,2));
    }
    path(ps,i===2?RED:'#83939f',i===2?2.5:1.5);
    if(i<4) {
      const a=project([Math.cos(Math.PI/4)*radius,(i-2)*lerp(18,100,p),Math.sin(Math.PI/4)*radius],center,angle,.9);
      const next=project([Math.cos(Math.PI/4)*(radius+47),(i-1)*lerp(18,100,p),Math.sin(Math.PI/4)*(radius+47)],center,angle,.9);
      path([a.slice(0,2),next.slice(0,2)],'#536775',1);
    }
  }
  text('explain',center[0]-220,center[1]+345,20,MUTED,400,'center','JetBrains');
  text('practise',center[0],center[1]+345,20,WHITE,400,'center','JetBrains');
  text('check',center[0]+220,center[1]+345,20,RED,400,'center','JetBrains');
}

function skillScene(skill,t) {
  const u=t-skill.start;
  const flipped=['map','blueprint','teach'].includes(skill.visual);
  const landscape=['signal','trace'].includes(skill.visual);
  const center=landscape?[1030,600]:flipped?[575,510]:[1330,510];
  const angle=-.65+u*.045;
  const x=flipped?1050:112;
  const y=landscape?250:292;
  c.save();c.globalAlpha*=out((u+.2)/1);
  c.translate(lerp(-34,0,out((u+.2)/1.1)),0);
  text(skill.name,x,y,76,WHITE,400);
  lines(skill.verb,landscape?950:x+2,landscape?250:391,42,landscape?780:710,WHITE,300,1.25);
  lines(skill.detail,landscape?114:x+2,landscape?925:487,26,landscape?1100:570,MUTED,400,1.5);
  c.restore();
  c.save();c.globalAlpha*=out((u+.1)/.9);
  c.translate(lerp(65,0,out((u+.1)/1.6)),0);
  const zoom=landscape?1.65:flipped?1.2:skill.visual==='assembly'?1.2:1;
  c.translate(center[0],center[1]);c.scale(zoom,zoom);c.translate(-center[0],-center[1]);
  const instruments={map:lattice,signal,lens,trace,measure,blueprint,aperture,assembly,verdict,release,teach};
  if(['signal','trace'].includes(skill.visual)) instruments[skill.visual](center,u);
  else instruments[skill.visual](center,angle,u);
  c.restore();
  c.save();c.globalAlpha*=landscape?0:out((u-1)/1.2);
  const stageY=925;
  const names=['understand','decide','prove','execute','pass it on'];
  const index = Math.min(4, Math.floor(SKILLS.indexOf(skill)/2.3));
  let stageX=114;
  for(let i=0;i<names.length;i++) {
    text(names[i],stageX,stageY,17,i===index?RED:'#586775',400,'left','JetBrains');
    c.font='400 17px JetBrains';stageX+=c.measureText(names[i]).width+34;
  }
  c.restore();
}

function power(t) {
  const p=smooth(t/7);
  const center=[1180,470];
  for(let j=0;j<65;j++) {
    const ps=[];
    for(let i=0;i<85;i++) {
      const a=i/84*TAU*1.25+j*.1;
      const radius=180+j*3.2;
      const x=Math.cos(a)*radius;
      const y=Math.sin(a)*radius;
      const z=Math.sin(a*2+j*.1+t*.12)*120;
      ps.push(project([x,y,z],center,-.5+t*.09,1.15).slice(0,2));
    }
    path(ps,j%12===0?RED:`rgba(139,156,170,${.07+j*.0015})`,j%12===0?1.8:1);
  }
  c.save();c.globalAlpha*=smooth((t-.4)/1.5);
  text('An agent',112,590,118,WHITE,300);
  text('has power.',112,725,118,WHITE,300);
  c.restore();
  c.save();c.globalAlpha*=smooth((t-3.6)/1.4);
  text('Power needs direction.',116,814,28,MUTED,400);
  c.restore();
  const route=[];
  for(let i=0;i<100;i++) {
    const x=i/99*1920;
    const y=910+Math.sin(i*.08+t*.3)*lerp(32,0,p);
    route.push([x,y]);
  }
  glow(route,1.8);
}

function method(t) {
  const u=t-8;
  const center=[1350,490];
  for(let i=0;i<11;i++) {
    const a=i/11*TAU-.6+u*.07;
    const radius=lerp(390,270,smooth(u/5));
    box(Math.cos(a)*radius,Math.sin(a)*radius,Math.sin(a*2)*80,65,85,65,center,-.3+u*.05,.85,i===3);
  }
  ring(270,0,center,-.3+u*.05,.85,'#657787',.8);
  text('Give it',112,383,122,WHITE,300);
  text('a method.',112,523,122,WHITE,300);
  c.save();c.globalAlpha*=out((u-1.2)/1);
  text('skillify',116,683,72,RED,500);
  lines('Engineering skills for AI coding agents.',118,751,26,600,MUTED);
  c.restore();
  const q=project([0,0,0],center,-.3+u*.05,.85);
  circle(q[0],q[1],54,RED,2.5);
  path([[q[0]-26,q[1]+12],[q[0]-2,q[1]-12],[q[0]+26,q[1]+12]],WHITE,2);
}

function system(t) {
  const u=t-84;
  const p=smooth((u-3)/6);
  text('Eleven disciplines.',112,215,74,WHITE,300);
  text('One method.',112,307,74,WHITE,300);
  const points=[];
  for(let i=0;i<11;i++) {
    const a=i/11*TAU-.8+u*.06;
    const r=320;
    const orbit=[1180+Math.cos(a)*r,575+Math.sin(a)*r*.73];
    const grid=[230+(i%6)*292, i<6?568:778];
    const x=lerp(orbit[0],grid[0],p), y=lerp(orbit[1],grid[1],p);
    points.push([x,y]);
    circle(x,y,lerp(32,19,p),i===7?RED:'#b0bac2',1.6,'#111922');
    const alpha=out((u-.1-i*.07)/1)*(1-smooth((p-.06)/.14)+smooth((p-.82)/.14));
    c.save();c.globalAlpha*=alpha;
    const labelX=lerp(x+(Math.cos(a)>=0?50:-50),x,p);
    const labelY=lerp(y+7,y+63,p);
    const align=p>.7?'center':Math.cos(a)>=0?'left':'right';
    text(SKILLS[i].name,labelX,labelY,21,i===7?RED:WHITE,400,align,'JetBrains');
    c.restore();
  }
  for(let i=0;i<points.length-1;i++) {
    const a=points[i],d=points[i+1];
    path([[a[0]+20,a[1]],[d[0]-20,d[1]]],i===6?RED:'#384b5b',1.3);
  }
  const q=points[7];
  circle(q[0],q[1],29,RED,1.3);
  c.save();c.globalAlpha*=out((u-7.2)/1.1);
  text('Use the smallest skill that fits.',112,940,27,MUTED,400);
  c.restore();
}

function agents(t) {
  const u=t-96;
  text('Four roles.',112,194,74,WHITE,300);
  text('Clear boundaries.',112,287,74,WHITE,300);
  const active=Math.max(0,Math.min(3,Math.floor(u/3.5)));
  const current=ROLES[active];
  const x=[300,740,1180,1620];
  const center=[960,640];
  for(let i=0;i<4;i++) {
    const local=u-i*3.5;
    const chosen=i===active;
    const height=chosen?235:150;
    const unitCenter=[x[i],630];
    const angle=-.55+u*.035;
    if(i===0) {
      for(let j=0;j<4;j++) box((j%2-.5)*82,-Math.floor(j/2)*85,0,70,70,70,unitCenter,angle,.9,chosen&&j===2);
    } else if(i===1) {
      for(let j=0;j<4;j++) ring(95-j*15,-j*42,unitCenter,angle,.9,chosen&&j===1?RED:'#8595a1',.3);
    } else if(i===2) {
      box(0,-65,0,140,height,140,unitCenter,angle,.9,chosen);
    } else {
      box(0,-70,0,120,155,120,unitCenter,angle,.9,chosen);
      ring(125,-80,unitCenter,angle,.9,chosen?RED:'#8595a1',.7);
    }
    text(ROLES[i].name,x[i],790,34,chosen?RED:WHITE,400,'center');
    text(i===2?'edit':i===1?'read + web':'read only',x[i],832,18,MUTED,400,'center','JetBrains');
    if(i<3) path([[x[i]+130,650],[x[i+1]-130,650]],'#485d6e',1.4);
    if(chosen) {
      circle(x[i],650,146,RED,1);
      path([[x[i],858],[x[i],884]],RED,1.3);
    }
  }
  c.save();c.globalAlpha*=smooth((u-active*3.5+.15)/.55)*smooth((3.5-(u-active*3.5)+.15)/.55);
  text(current.heading,112,939,31,WHITE,400);
  text(current.detail,112,985,22,MUTED,400);
  c.restore();
}

function principles(t) {
  const u=t-110;
  const words=['Intent.','Evidence.','Judgment.'];
  for(let i=0;i<3;i++) {
    const alpha=out((u-i*.9)/1.4);
    c.save();c.globalAlpha*=alpha;
    const y=310+i*157+lerp(34,0,alpha);
    text(words[i],112,y,142,i===2?RED:WHITE,300);
    c.restore();
  }
  const center=[1490,490];
  const angle=-.7+u*.045;
  for(let i=0;i<3;i++) ring(200+i*42,0,center,angle,.9,i===1?RED:'#80909d',i*1.05+.1);
  box(0,0,0,74,74,74,center,angle,.9,true);
  c.save();c.globalAlpha*=out((u-3.8)/1.3);
  text('Understand before changing.',114,860,29,MUTED,400);
  text('Prove before claiming.',114,908,29,WHITE,400);
  c.restore();
}

function resolve(t) {
  const u=t-120;
  const progress=smooth(u/4);
  const x=1210, y=590;
  for(let i=0;i<11;i++) {
    const a=i/11*TAU-.4+u*.045;
    const radius=lerp(380,165,progress);
    const center=[x+Math.cos(a)*radius,y+Math.sin(a)*radius*.7];
    c.save();c.globalAlpha*=lerp(.7,.3,progress);
    circle(...center,lerp(25,8,progress),i===7?RED:'#9aabb8',1.4);
    c.restore();
  }
  const points=[];
  for(let i=0;i<160;i++) {
    const a=i/159*TAU;
    points.push([x+Math.cos(a)*165,y+Math.sin(a)*115]);
  }
  c.save();c.globalAlpha*=progress;glow(points,2);c.restore();
  text('skillify',112,496,220,WHITE,500);
  c.save();c.globalAlpha*=out((u-.8)/1.4);
  text('Better agents.',120,620,52,WHITE,300);
  text('Deliberate engineering.',120,691,52,RED,300);
  c.restore();
  c.save();c.globalAlpha*=out((u-3.1)/1.1);
  text('github.com/trykA123/skillify',122,849,25,MUTED,400,'left','JetBrains');
  c.restore();
  const length=lerp(300,1400,smooth((u-.5)/4));
  path([[120,928],[120+length,928]],RED,2);
}

export function drawFrame(time) {
  const t=clamp(time,0,DURATION);
  c.globalAlpha=1;
  c.drawImage(background,0,0);
  for(let i=0;i<42;i++) {
    const x=hash(i+640)*WIDTH;
    const y=hash(i+200)*HEIGHT;
    c.fillStyle='rgba(150,174,192,.15)';
    c.fillRect(x+Math.sin(t*.07+i)*5,y+Math.cos(t*.08+i)*5,1.5,1.5);
  }
  const scenes=SCENES.filter(scene => t>=scene.start-.55&&t<=scene.end+.55);
  for(const scene of scenes) {
    c.save();
    const alpha=smooth((t-scene.start+.55)/1.1)*smooth((scene.end+.55-t)/1.1);
    ink=smooth((t-scene.start)/.45)*smooth((scene.end-t)/.45);
    c.globalAlpha=alpha;
    if(scene.id==='power') power(t);
    else if(scene.id==='method') method(t);
    else if(scene.id==='system') system(t);
    else if(scene.id==='agents') agents(t);
    else if(scene.id==='principles') principles(t);
    else if(scene.id==='resolve') resolve(t);
    else skillScene(SKILLS.find(skill=>skill.name===scene.id),t);
    c.restore();
  }
  ink=1;
  c.fillStyle='#080b0f';
  c.fillRect(0,0,WIDTH,64);c.fillRect(0,1024,WIDTH,56);
  c.save();c.globalAlpha=.74;
  text('skillify',112,108,18,WHITE,500);
  const active=SCENES.find(scene=>t>=scene.start&&t<scene.end)||SCENES.at(-1);
  text(active.id==='agents'?'agents':active.id==='power'||active.id==='method'?'from signal to certainty':active.id==='resolve'?'engineering, with intent':active.title,1808,108,15,MUTED,400,'right','JetBrains');
  c.restore();
  if(t<1.1||t>128.4) {
    c.fillStyle=`rgba(8,11,15,${t<1.1?1-smooth(t/1.1):smooth((t-128.4)/1.6)})`;
    c.fillRect(0,0,WIDTH,HEIGHT);
  }
}
