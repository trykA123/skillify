import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, join, resolve, extname} from 'node:path';

const root=dirname(fileURLToPath(import.meta.url));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const port=Number(process.env.REEL_PORT||5922);
if(port<5920||port>5939)throw new Error('REEL_PORT must be within 5920-5939.');
await mkdir(join(root,'verification'),{recursive:true});
const types={'.html':'text/html','.mjs':'text/javascript','.ttf':'font/ttf','.jpg':'image/jpeg','.mp4':'video/mp4','.vtt':'text/vtt'};
const server=createServer(async(req,res)=>{
  try {
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!path.startsWith(root+'/')){res.writeHead(403).end();return;}
    const data=await readFile(path);
    const headers={'Content-Type':types[extname(path)]||'application/octet-stream','Accept-Ranges':'bytes'};
    const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if(range) {
      const start=Number(range[1]),end=Math.min(data.length-1,range[2]?Number(range[2]):data.length-1);
      res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});res.end(data.subarray(start,end+1));
    } else {res.writeHead(200,{...headers,'Content-Length':data.length});res.end(data);}
  } catch {res.writeHead(404).end();}
});
await new Promise((accept,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',accept);});
let browser;
const report={errors:[],viewports:[]};
const check=(condition,message)=>{if(!condition)throw new Error(message);};
try {
  browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'/opt/helium-browser-bin/helium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
  for(const [name,width,height] of [['phone',390,844],['desktop',1440,1080]]) {
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    page.on('pageerror',error=>report.errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/player.html`);
    await page.waitForTimeout(5500);await page.evaluate(()=>document.fonts.ready);
    const result=await page.evaluate(()=>{
      const video=document.querySelector('video');
      return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,autoplay:video.autoplay,paused:video.paused,controls:video.controls,duration:video.duration,videoWidth:video.videoWidth,videoHeight:video.videoHeight,captionTracks:video.textTracks.length};
    });
    check(result.scrollWidth===result.width,`${name} overflows horizontally.`);
    check(!result.autoplay&&result.paused&&result.controls,`${name} does not provide viewer-controlled playback.`);
    check(result.duration===130&&result.videoWidth===1920&&result.videoHeight===1080,`${name} fails to load the film.`);
    check(result.captionTracks===1,`${name} fails to load its caption track.`);
    await page.screenshot({path:join(root,'verification',`player-${name}.png`),fullPage:true});
    await page.locator('summary').click();
    check(await page.locator('details').getAttribute('open')!==null,`${name} transcript does not open.`);
    await page.screenshot({path:join(root,'verification',`transcript-${name}.png`),fullPage:true});
    if(name==='desktop') {
      await page.evaluate(async()=>{const video=document.querySelector('video');video.currentTime=103.4;await video.play();});
      await page.waitForTimeout(1500);
      result.playback=await page.evaluate(()=>{
        const video=document.querySelector('video');
        return {currentTime:video.currentTime,paused:video.paused,readyState:video.readyState,error:video.error?.message||null,audioTracks:video.captureStream().getAudioTracks().length,videoFrames:video.getVideoPlaybackQuality().totalVideoFrames};
      });
      check(result.playback.currentTime>103.8&&!result.playback.paused&&!result.playback.error,'Film fails to play and seek in Helium.');
      check(result.playback.audioTracks===1,'Browser does not decode an audio track.');
      await page.evaluate(()=>document.querySelector('video').pause());
    }
    report.viewports.push({name,...result});await page.close();
  }
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  page.on('pageerror',error=>report.errors.push(error.message));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(`http://127.0.0.1:${port}/index.html`);await page.waitForTimeout(5500);
  await page.waitForFunction(()=>window.filmReady);
  report.reducedMotion=await page.evaluate(()=>({playDisabled:document.querySelector('#play').disabled,noteVisible:!document.querySelector('#motion-note').hidden,time:Number(document.querySelector('#seek').value),scrollWidth:document.documentElement.scrollWidth,width:innerWidth}));
  check(report.reducedMotion.playDisabled&&report.reducedMotion.noteVisible&&report.reducedMotion.time===12,'Reduced-motion source does not remain a static manual preview.');
  check(report.reducedMotion.scrollWidth===390,'Reduced-motion source overflows at 390px.');
  await page.locator('#seek').focus();await page.keyboard.press('ArrowRight');
  check(Number(await page.locator('#seek').inputValue())>12,'Source seek control is not keyboard operable.');
  await page.screenshot({path:join(root,'verification','source-reduced-motion-phone.png'),fullPage:true});
  check(report.errors.length===0,`Browser errors: ${report.errors.join(', ')}`);
  report.passed=true;await writeFile(join(root,'verification','browser-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
} finally {
  if(browser)await browser.close();
  await new Promise(accept=>server.close(accept));
}
