import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, join, extname, resolve} from 'node:path';
import {once} from 'node:events';
import {tmpdir} from 'node:os';
import {WIDTH, HEIGHT, FPS, DURATION, SKILLS, ROLES, SCENES} from './timeline.mjs';
import {writeScore} from './score.mjs';

const root=dirname(fileURLToPath(import.meta.url));
const cache=process.env.REEL_CACHE||join(tmpdir(),'skillify-cinematic-v2');
const moduleName=process.env.PLAYWRIGHT_MODULE||'playwright-core';
const {chromium}=await import(moduleName);
const executable=process.env.BROWSER_PATH||'/opt/helium-browser-bin/helium';
const preview=process.argv.includes('--frames');
const port=Number(process.env.REEL_PORT||5921);
if(port<5920||port>5939) throw new Error('REEL_PORT must be within 5920-5939.');
await mkdir(cache,{recursive:true});
await mkdir(join(root,'stills'),{recursive:true});
const types={'.html':'text/html','.mjs':'text/javascript','.ttf':'font/ttf','.jpg':'image/jpeg','.mp4':'video/mp4','.vtt':'text/vtt'};
const server=createServer(async(req,res)=>{
  try {
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!path.startsWith(root+'/')&&path!==root) {res.writeHead(403).end();return;}
    const data=await readFile(path===root?join(root,'index.html'):path);
    res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'});res.end(data);
  } catch {res.writeHead(404).end();}
});
await new Promise((accept,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',accept);});
let browser;
function command(bin,args) {
  return new Promise((accept,reject)=>{
    const child=spawn(bin,args,{stdio:['ignore','inherit','inherit']});
    child.once('error',reject);child.once('exit',code=>code===0?accept():reject(new Error(`${bin} exited ${code}`)));
  });
}
const formatTime=t=>`${String(Math.floor(t/3600)).padStart(2,'0')}:${String(Math.floor(t/60)%60).padStart(2,'0')}:${(t%60).toFixed(3).padStart(6,'0')}`;
try {
  browser=await chromium.launch({executablePath:executable,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--hide-scrollbars']});
  const page=await browser.newPage({viewport:{width:WIDTH,height:HEIGHT},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/index.html?recording=1`);
  await page.waitForTimeout(5500);
  await page.waitForFunction(()=>window.filmReady);
  await page.evaluate(async()=>{await document.fonts.load('400 76px Rubik');await document.fonts.load('400 20px JetBrains');});
  await page.evaluate(scenes=>{
    for(const scene of scenes)for(const t of [scene.start-.54,scene.start,scene.start+.54,scene.end-.54,scene.end,scene.end+.54])window.drawFrame(Math.max(0,Math.min(130,t)));
  },SCENES);
  const times=SCENES.map(scene=>({id:scene.id,t:scene.id==='system'?94:(scene.start+scene.end)/2}));
  for(const role of ROLES) times.push({id:role.name,t:(role.start+role.end)/2});
  for(const scene of SCENES.slice(1)) times.push({id:`transition-${scene.id}`,t:scene.start});
  for(const {id,t} of times) {
    await page.evaluate(t=>window.drawFrame(t),t);
    await page.screenshot({path:join(root,'stills',`${id}.jpg`),type:'jpeg',quality:92});
  }
  await page.evaluate(()=>window.drawFrame(12));
  await page.screenshot({path:join(root,'poster.jpg'),type:'jpeg',quality:95});
  const captions=[...SCENES.filter(scene=>scene.id!=='agents'),...ROLES].sort((a,b)=>a.start-b.start);
  const vtt=['WEBVTT','',...captions.flatMap(scene=>{
    const skill=SKILLS.find(skill=>skill.name===scene.id);
    const role=ROLES.find(role=>role.name===scene.name);
    const extra={power:'An agent has power. Power needs direction.',method:'Give it a method. Skillify. Engineering skills for AI coding agents.',principles:'Intent. Evidence. Judgment. Understand before changing. Prove before claiming.',resolve:'Skillify. Better agents. Deliberate engineering. github.com/trykA123/skillify'};
    const value=skill?`${skill.name}. ${skill.verb} ${skill.detail}`:role?`${role.name}. ${role.heading} ${role.detail}`:extra[scene.id]||scene.title;
    return [`${formatTime(scene.start)} --> ${formatTime(scene.end)}`,value,''];
  })].join('\n');
  await writeFile(join(root,'captions.vtt'),vtt);
  const representative=times.filter(item=>!item.id.startsWith('transition-')&&item.id!=='agents');
  await writeFile(join(cache,'contact.txt'),representative.map(item=>`file '${join(root,'stills',item.id+'.jpg')}'\nduration 1`).join('\n'));
  await command('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',join(cache,'contact.txt'),'-vf',`fps=1,scale=480:270,drawtext=fontfile=${join(root,'fonts','JetBrainsMono.ttf')}:text='%{n}':x=15:y=240:fontsize=13:fontcolor=white,tile=4x5:padding=8:margin=8:color=0x080b0f`,'-frames:v','1','-update','1',join(root,'contact-sheet.jpg')]);
  if(errors.length) throw new Error(errors.join('\n'));
  console.log(`Inspected-frame set: ${times.length} rendered stills.`);
  if(preview) { console.log('Frame rendering complete.'); }
  else {
    const score=await writeScore(join(cache,'score.wav'));
    console.log(`Original score: ${JSON.stringify(score)}`);
    const silent=join(cache,'picture.mp4');
    const encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','mjpeg','-framerate',String(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','17','-maxrate','4600k','-bufsize','9200k','-pix_fmt','yuv420p','-movflags','+faststart',silent],{stdio:['pipe','inherit','inherit']});
    let encodeError=null;encoder.once('error',error=>encodeError=error);
    const encoded=new Promise((accept,reject)=>encoder.once('exit',code=>code===0?accept():reject(new Error(`Encoder exited ${code}`))));
    const started=performance.now();
    for(let frame=0;frame<DURATION*FPS;frame++) {
      if(encodeError) throw encodeError;
      const url=await page.evaluate(t=>{window.drawFrame(t);return document.querySelector('#film').toDataURL('image/jpeg',.97);},frame/FPS);
      const data=Buffer.from(url.slice(url.indexOf(',')+1),'base64');
      if(!encoder.stdin.write(data)) await once(encoder.stdin,'drain');
      if(frame%300===0&&frame>0) console.log(`Frame ${frame}/${DURATION*FPS}; ${(frame/((performance.now()-started)/1000)).toFixed(1)} rendered fps.`);
    }
    encoder.stdin.end();await encoded;
    const elapsed=(performance.now()-started)/1000;
    console.log(`Picture rendered in ${elapsed.toFixed(2)}s (${(DURATION*FPS/elapsed).toFixed(2)}fps).`);
    await command('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',silent,'-i',join(cache,'score.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-af','loudnorm=I=-16:TP=-1.5:LRA=9','-ar','48000','-c:a','aac','-b:a','192k','-t',String(DURATION),'-movflags','+faststart',join(root,'skillify-cinematic.mp4')]);
    await command('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',join(root,'skillify-cinematic.mp4'),'-filter_complex','[0:v]trim=start=9:end=13,setpts=PTS-STARTPTS[v0];[0:v]trim=start=35:end=39,setpts=PTS-STARTPTS[v1];[0:v]trim=start=59:end=63,setpts=PTS-STARTPTS[v2];[0:v]trim=start=86:end=90,setpts=PTS-STARTPTS[v3];[0:v]trim=start=104:end=108,setpts=PTS-STARTPTS[v4];[0:v]trim=start=123:end=127,setpts=PTS-STARTPTS[v5];[v0][v1][v2][v3][v4][v5]concat=n=6:v=1:a=0,scale=960:540[v]','-map','[v]','-an','-c:v','libx264','-preset','medium','-crf','21','-movflags','+faststart',join(root,'preview.mp4')]);
    const size=(await stat(join(root,'skillify-cinematic.mp4'))).size;
    if(size>=90_000_000) throw new Error(`Film exceeds the 90 MB artifact limit: ${size}`);
    await writeFile(join(root,'render-stats.json'),JSON.stringify({duration:DURATION,width:WIDTH,height:HEIGHT,fps:FPS,frames:DURATION*FPS,bytes:size,pictureRenderSeconds:elapsed,pictureRenderFps:DURATION*FPS/elapsed,score},null,2)+'\n');
    console.log(`Film complete: ${size} bytes.`);
  }
} finally {
  if(browser) await browser.close();
  await new Promise(accept=>server.close(accept));
}
