import {spawn, execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile, mkdir, writeFile, stat, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {WIDTH, HEIGHT, FPS, DURATION, SKILLS, ROLES, SCENES} from './timeline.mjs';

const root=dirname(fileURLToPath(import.meta.url));
const run=promisify(execFile);
const film=join(root,'skillify-cinematic.mp4');
const out=join(root,'verification');
await mkdir(join(out,'decoded'),{recursive:true});
const check=(condition,message)=>{if(!condition)throw new Error(message);};
const {stdout}=await run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',film]);
const probe=JSON.parse(stdout);
const video=probe.streams.find(stream=>stream.codec_type==='video');
const audio=probe.streams.find(stream=>stream.codec_type==='audio');
check(Number(probe.format.duration)>=120,'Film is shorter than 120 seconds.');
check(Number(probe.format.duration)===DURATION,'Duration differs from the source timeline.');
check(video.width===WIDTH&&video.height===HEIGHT,'Film resolution differs from 1920x1080.');
check(video.avg_frame_rate==='30/1','Film frame rate differs from 30fps.');
check(Number(video.nb_frames)===DURATION*FPS,'Unexpected video frame count.');
check(audio&&audio.channels===2&&Number(audio.sample_rate)===48000,'Expected 48kHz stereo audio.');
check(SKILLS.length===11&&new Set(SKILLS.map(skill=>skill.name)).size===11,'Expected eleven unique skills.');
check(ROLES.length===4&&new Set(ROLES.map(role=>role.name)).size===4,'Expected four unique roles.');
for(let i=1;i<SCENES.length;i++)check(SCENES[i-1].end===SCENES[i].start,'Timeline has a gap or overlap.');
const captions=await readFile(join(root,'captions.vtt'),'utf8');
const player=await readFile(join(root,'player.html'),'utf8');
for(const item of [...SKILLS,...ROLES]) {
  check(captions.includes(item.name),`Captions omit ${item.name}.`);
  check(player.includes(item.name),`Transcript omits ${item.name}.`);
  const source=await readFile(join(root,'..','..',item.source),'utf8');
  check(source.includes(`name: ${item.name}`),`Brief pointer is invalid: ${item.source}.`);
}
const artifactSizes=[];
async function sizes(dir) {
  for(const item of await readdir(dir,{withFileTypes:true})) {
    if(item.name==='node_modules'||item.name==='.git')continue;
    const path=join(dir,item.name);
    if(item.isDirectory())await sizes(path);
    else {
      const bytes=(await stat(path)).size;
      check(bytes<90_000_000,`Artifact exceeds 90 MB: ${path}`);
      artifactSizes.push({file:path.slice(root.length+1),bytes});
    }
  }
}
await sizes(root);
const {stdout:luma}=await run('ffmpeg',['-hide_banner','-loglevel','error','-i',film,'-vf','scale=160:90:flags=area,format=gray','-f','rawvideo','pipe:1'],{encoding:'buffer',maxBuffer:128*1024*1024});
const pixels=160*90;
check(luma.length===pixels*FPS*DURATION,'Luminance analysis did not decode every frame.');
let maxArea=0,maxMeanJump=0,maxAreaFrame=0,maxMeanFrame=0;
let previousMean=0;
const means=[];
for(let frame=0;frame<FPS*DURATION;frame++) {
  const start=frame*pixels;
  let sum=0,changed=0;
  for(let i=0;i<pixels;i++) {
    const value=luma[start+i];sum+=value;
    if(frame>0&&Math.abs(value-luma[start-pixels+i])>=51)changed++;
  }
  const mean=sum/pixels/255;
  means.push(mean);
  if(frame>0) {
    const jump=Math.abs(mean-previousMean),area=changed/pixels;
    if(jump>maxMeanJump){maxMeanJump=jump;maxMeanFrame=frame;}
    if(area>maxArea){maxArea=area;maxAreaFrame=frame;}
  }
  previousMean=mean;
}
check(maxArea<.25,'A consecutive frame changes at least 25% of its area by 20% luminance.');
check(maxMeanJump<.1,'A consecutive frame changes its mean luminance by at least 10%.');
let maxLargeReversals=0;
for(let start=0;start<means.length-FPS;start++) {
  let last=means[start],direction=0,reversals=0;
  for(let i=start+1;i<=start+FPS;i++) {
    const delta=means[i]-last;
    if(Math.abs(delta)>=.1) {
      const next=Math.sign(delta);
      if(direction&&next!==direction)reversals++;
      direction=next;last=means[i];
    }
  }
  maxLargeReversals=Math.max(maxLargeReversals,reversals);
}
check(maxLargeReversals===0,'Detected repeated large full-frame luminance reversals.');
const {stderr:audioLog}=await run('ffmpeg',['-hide_banner','-i',film,'-vn','-af','ebur128=peak=true','-f','null','-'],{maxBuffer:4*1024*1024});
const summary=audioLog.slice(audioLog.lastIndexOf('Summary:'));
const integrated=Number(summary.match(/I:\s+(-?[\d.]+) LUFS/)?.[1]);
const truePeak=Number(summary.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1]);
check(Number.isFinite(integrated)&&integrated>=-18&&integrated<=-14,'Audio loudness is outside -18 to -14 LUFS.');
check(Number.isFinite(truePeak)&&truePeak<=-.7,'Audio true peak exceeds -0.7 dBFS.');
await writeFile(join(out,'audio-analysis.txt'),summary+'\n');
await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',film,'-filter_complex','showwavespic=s=1920x280:split_channels=1:colors=0xff603b|0xc8d2dd','-frames:v','1','-update','1',join(out,'audio-waveform.png')]);
const points=SCENES.filter(scene=>scene.id!=='agents').map(scene=>({id:scene.id,t:scene.id==='system'?94:(scene.start+scene.end)/2}));
points.push(...ROLES.map(role=>({id:role.name,t:(role.start+role.end)/2})));
for(const point of points)await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(point.t),'-i',film,'-frames:v','1','-q:v','2','-update','1',join(out,'decoded',point.id+'.jpg')]);
await writeFile(join(out,'decoded-list.txt'),points.map(point=>`file '${join(out,'decoded',point.id+'.jpg')}'\nduration 1`).join('\n'));
await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',join(out,'decoded-list.txt'),'-vf','fps=1,scale=480:270,tile=4x5:padding=8:margin=8:color=0x080b0f','-frames:v','1','-update','1',join(out,'decoded-contact.jpg')]);
const transitions=SCENES.slice(1).map(scene=>({id:`transition-${scene.id}`,t:scene.start}));
for(const point of transitions)await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(point.t),'-i',film,'-frames:v','1','-q:v','2','-update','1',join(out,'decoded',point.id+'.jpg')]);
await writeFile(join(out,'transition-list.txt'),transitions.map(point=>`file '${join(out,'decoded',point.id+'.jpg')}'\nduration 1`).join('\n'));
await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',join(out,'transition-list.txt'),'-vf','fps=1,scale=480:270,tile=4x4:padding=8:margin=8:color=0x080b0f','-frames:v','1','-update','1',join(out,'decoded-transitions.jpg')]);
const report={
  passed:true,
  media:{duration:Number(probe.format.duration),width:video.width,height:video.height,frameRate:video.avg_frame_rate,frames:Number(video.nb_frames),bytes:Number(probe.format.size),videoCodec:video.codec_name,audioCodec:audio.codec_name,audioChannels:audio.channels,audioSampleRate:Number(audio.sample_rate)},
  coverage:{skills:SKILLS.map(skill=>skill.name),roles:ROLES.map(role=>role.name),scenes:SCENES.length,decodedRepresentativeFrames:points.length,decodedTransitions:transitions.length,captionAndTranscriptCoverage:true,briefPointersVerified:true},
  luminance:{decodedFrames:means.length,sampleWidth:160,sampleHeight:90,pixelDeltaThreshold:51,maxChangedAreaFraction:maxArea,maxChangedAreaTime:maxAreaFrame/FPS,maxConsecutiveMeanJump:maxMeanJump,maxConsecutiveMeanJumpTime:maxMeanFrame/FPS,maxLargeReversalsPerSecond:maxLargeReversals,areaLimit:.25,meanJumpLimit:.1},
  audio:{integratedLUFS:integrated,truePeakDBFS:truePeak,perceptualListening:'Not performed by the text-only rendering environment.'},
  artifactSizes,
};
await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,media:report.media,luminance:report.luminance,audio:report.audio,skills:SKILLS.length,roles:ROLES.length},null,2));
