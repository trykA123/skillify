import argparse
import math
import random
import struct
import subprocess
import wave
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
W, H, FPS, DURATION = 1920, 1080, 24, 120
BG = (10, 14, 18)
WHITE = (240, 241, 234)
MUTED = (130, 143, 148)
LIME = (195, 244, 116)
BLUE = (133, 156, 251)
CORAL = (255, 141, 109)
LINE = (38, 48, 53)
FONT_PATH = "/usr/share/fonts/inter/InterVariable.ttf"
MONO_PATH = "/usr/share/fonts/Adwaita/AdwaitaMono-Regular.ttf"


def clamp(x, a=0, b=1):
    return max(a, min(b, x))


def ease(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def mix(a, b, x):
    return a + (b - a) * x


def color(a, b, x):
    return tuple(round(mix(v, w, clamp(x))) for v, w in zip(a, b))


@lru_cache(maxsize=64)
def font(size, weight=400, mono=False):
    f = ImageFont.truetype(MONO_PATH if mono else FONT_PATH, size)
    if not mono:
        try:
            f.set_variation_by_axes([weight])
        except OSError:
            pass
    return f


def txt(d, x, y, message, size=36, fill=WHITE, weight=400, mono=False, anchor="la"):
    d.text((int(x), int(y)), message, font=font(size, weight, mono), fill=fill, anchor=anchor)


def label(d, x, y, message, fill=MUTED, size=24, anchor="la"):
    txt(d, x, y, message.upper(), size, fill, 500, True, anchor)


def rule(d, x1, y1, x2, y2, fill=LINE, width=2):
    d.line((int(x1), int(y1), int(x2), int(y2)), fill=fill, width=width)


def card(d, box, outline=LINE, fill=(17, 23, 27), radius=24, width=2):
    d.rounded_rectangle(tuple(map(int, box)), radius=radius, fill=fill, outline=outline, width=width)


def dot(d, x, y, radius, fill):
    d.ellipse((int(x-radius), int(y-radius), int(x+radius), int(y+radius)), fill=fill)


def fade(t, start, end):
    return ease((t-start)/(end-start))


def scene_alpha(t, duration):
    return fade(t, 0, 0.7) * (1-fade(t, duration-0.75, duration))


def dim(c, a):
    return color(BG, c, a)


def backdrop():
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    for x in range(96, W, 96):
        rule(d, x, 0, x, H, (18, 25, 29), 1)
    for y in range(96, H, 96):
        rule(d, 0, y, W, y, (18, 25, 29), 1)
    for x in range(96, W, 96):
        for y in range(96, H, 96):
            dot(d, x, y, 1, (42, 52, 56))
    return im


BASE = backdrop()


def frame_shell(t, section, accent=LIME):
    im = BASE.copy()
    d = ImageDraw.Draw(im)
    for i in range(7):
        x=120+((t*31+i*263)%(W-240))
        y=192+((i*149)%(H-330))
        rule(d,x,y,x+58,y,dim(accent,0.12),2)
    rule(d, 80, 76, W-80, 76)
    label(d, 82, 37, "SKILLIFY / MOTION STUDY", WHITE, 20)
    label(d, W-82, 37, section, MUTED, 20, "ra")
    rule(d, 80, H-88, W-80, H-88)
    label(d, 82, H-66, "SMALL RULES. STRONGER WORK.", MUTED, 18)
    label(d, W-82, H-66, f"{int(t//60):02}:{int(t%60):02} / 02:00", MUTED, 18, "ra")
    rule(d, 80, H-88, 80+(W-160)*t/DURATION, H-88, accent, 3)
    return im, d


def mark(d, x, y, scale=1, alpha=1):
    heights = [42, 74, 56, 100, 70, 118, 66, 94, 52, 80]
    for i, h in enumerate(heights):
        px = x+i*20*scale
        d.rounded_rectangle((int(px), int(y-h*scale), int(px+10*scale), int(y)), radius=int(5*scale), fill=dim(LIME, alpha))


def scene_0(t, g):
    im, d = frame_shell(g, "01 / THE QUESTION")
    a = scene_alpha(t, 12)
    for i in range(72):
        theta = i*2.39996
        r = 18+math.sqrt(i)*50
        drift = 24*math.sin(t*0.62+i*0.3)
        x = 1390+math.cos(theta)*r+drift
        y = 500+math.sin(theta)*r+17*math.sin(t*0.8+i)
        dot(d, x, y, 2+(i%5==0)*2, dim(LIME if i%3 else BLUE, a*0.5))
    appear = fade(t, 0.6, 2.0)
    label(d, 135, 245, "THE REQUEST", dim(LIME, appear*a), 22)
    txt(d, 125, 350, "Make it", 142, dim(WHITE, appear*a), 700)
    qshift = 26*(1-ease((t-1.5)/1.4))
    txt(d, 125+qshift, 525, "better?", 142, dim(WHITE, appear*a), 700)
    if t > 4.2:
        rule(d, 140, 755, 140+min(1050,(t-4.2)*360), 755, dim(LIME,a), 4)
        label(d, 145, 790, "A GOOD INTENTION NEEDS A METHOD", dim(MUTED, fade(t, 4.5, 5.6)*a), 26)
    rise = ease((t-7.1)/1.7)
    if rise:
        d.rounded_rectangle((120, 205, 1820, 875), radius=32, fill=dim((19, 27, 30), rise*a), outline=dim(LIME, rise*a), width=2)
        mark(d, 185, 360, 1.1, rise*a)
        txt(d, 440, 260, "SKILLIFY", 152, dim(WHITE, rise*a), 750)
        txt(d, 448, 485, "Engineering judgment, made repeatable.", 54, dim(MUTED, rise*a), 400)
        label(d, 448, 615, "10 SKILLS  /  4 AGENTS  /  ONE FEEDBACK LOOP", dim(LIME, rise*a), 26)
    return im


SKILLS = [
    ("ORIENT", "Trace one real flow.", "orientify"),
    ("TRACE", "Name the root cause.", "traceify"),
    ("RESEARCH", "Rank the evidence.", "researchify"),
    ("CLARIFY", "Make intent complete.", "undumbify"),
    ("SHAPE", "Plan the real work.", "shapeify"),
    ("SHIP", "Verify the result.", "shipify"),
    ("REVIEW", "Judge against intent.", "reviewify"),
    ("RELEASE", "Ship with rollback.", "releaseify"),
    ("AUDIT", "Measure before grading.", "audify"),
    ("TEACH", "Make learning stick.", "teachify"),
]


def scene_1(t, g):
    im, d = frame_shell(g, "02 / THE SKILLS", BLUE)
    a = scene_alpha(t, 18)
    label(d, 120, 165, "TEN SMALL SKILLS", dim(BLUE,a), 26)
    idx = min(9, int(t/1.72))
    phase = t-idx*1.72
    main_a = fade(phase, 0, 0.35)*(1-fade(phase, 1.45, 1.72))
    verb, principle, name = SKILLS[idx]
    x = 142+60*(1-ease(phase/0.55))
    txt(d, x, 345, verb, 178, dim(WHITE,main_a*a), 760)
    txt(d, 148, 585, principle, 60, dim(MUTED,main_a*a), 400)
    label(d, 152, 705, f"/{name}", dim(BLUE,main_a*a), 27)
    for i, (v, _, _) in enumerate(SKILLS):
        yy = 200+i*67
        is_active = i==idx
        xx = 1370-(14 if is_active else 0)
        rule(d, xx, yy+41, 1776, yy+41, dim(BLUE if is_active else LINE,a), 2)
        txt(d, xx, yy, f"{i+1:02}", 26, dim(BLUE if is_active else MUTED,a), 500, True)
        txt(d, xx+75, yy, v.title(), 37, dim(WHITE if is_active else MUTED,a), 630 if is_active else 390)
    return im


STAGES = [
    ("01", "UNDUMBIFY", "decide", "What does done mean?"),
    ("02", "SHAPEIFY", "plan", "Name the files and checks."),
    ("03", "SHIPIFY", "build", "Prove each step."),
    ("04", "REVIEWIFY", "judge", "One clear verdict."),
]


def scene_2(t, g):
    im, d = frame_shell(g, "03 / THE FLOW", LIME)
    a = scene_alpha(t, 20)
    label(d, 120, 155, "FROM VAGUE TO VERIFIED", dim(LIME,a), 25)
    txt(d, 115, 215, "A disciplined path", 94, dim(WHITE,a), 700)
    selected = min(3, int(t/4.8))
    xs = [120, 550, 980, 1410]
    for i, (n, title, verb, body) in enumerate(STAGES):
        on = fade(t, i*3.45, i*3.45+0.8)
        focus = 1 if i==selected else 0
        x=xs[i]; y=435-18*focus*ease((t-selected*4.8)/0.6)
        card(d, (x,y,x+385,y+360), dim(LIME if focus else LINE,on*a), dim((25,35,33) if focus else (17,23,27),on*a), 22, 3 if focus else 2)
        label(d, x+28, y+26, n+" / "+verb, dim(LIME if focus else MUTED,on*a), 22)
        txt(d, x+28, y+95, title, 35, dim(WHITE,on*a), 690)
        rule(d,x+28,y+164,x+355,y+164,dim(LIME if focus else LINE,on*a),2)
        words=body.split(" ")
        half=max(1,len(words)//2)
        txt(d,x+28,y+205," ".join(words[:half]),31,dim(WHITE if focus else MUTED,on*a),400)
        txt(d,x+28,y+251," ".join(words[half:]),31,dim(WHITE if focus else MUTED,on*a),400)
        if i<3:
            run=fade(t, i*4.8+3.0, i*4.8+4.3)
            rule(d,x+387,y+180,x+387+40*run,y+180,dim(LIME,run*a),4)
            dot(d,x+388+35*run,y+180,5,dim(LIME,run*a))
    p=fade(t, 16.5, 18.5)
    label(d, 120, 870, "INTENT  →  PLAN  →  EVIDENCE  →  VERDICT", dim(LIME,p*a), 27)
    return im


AGENTS = [
    ("SCOUT", "READ", "Find the exact seam.", BLUE),
    ("WORKER", "EDIT", "Implement one bounded job.", LIME),
    ("REVIEWER", "READ", "Challenge the result.", CORAL),
    ("RESEARCHER", "READ + WEB", "Bring current evidence.", WHITE),
]


def scene_3(t, g):
    im,d=frame_shell(g,"04 / THE AGENTS",CORAL)
    a=scene_alpha(t,20)
    label(d,120,155,"FOUR BOUNDED AGENTS",dim(CORAL,a),25)
    txt(d,115,220,"The right access.",96,dim(WHITE,a),700)
    txt(d,120,348,"For the right job.",64,dim(MUTED,a),400)
    center=(960,595)
    focus=min(3,int(t/4.8))
    positions=[(480,625),(1450,625),(960,835),(960,505)]
    for i,(name,access,job,accent) in enumerate(AGENTS):
        x,y=positions[i]
        on=fade(t,0.7+i*0.5,1.4+i*0.5)
        pulse=0.35+0.65*(1 if i==focus else 0)
        rule(d,center[0],center[1],x,y,dim(accent,on*a*pulse),3)
        dot(d,mix(center[0],x,(t*0.17+i*0.23)%1),mix(center[1],y,(t*0.17+i*0.23)%1),5,dim(accent,on*a*pulse))
        if i==3:
            bx=(1030,435,1685,570)
        elif i==2:
            bx=(630,815,1290,950)
        elif i==1:
            bx=(1300,590,1810,755)
        else:
            bx=(110,590,620,755)
        card(d,bx,dim(accent,on*a*pulse),dim((23,31,34),on*a),20,3 if i==focus else 2)
        label(d,bx[0]+24,bx[1]+17,access,dim(accent,on*a),19)
        txt(d,bx[0]+24,bx[1]+48,name,43,dim(WHITE,on*a),700)
        txt(d,bx[0]+24,bx[1]+103,job,25,dim(MUTED,on*a),400)
    dot(d,*center,35,dim((27,36,39),a))
    dot(d,*center,14,dim(LIME,a))
    return im


METRICS=[("HAIKU",0.78,0.95),("SONNET",0.97,0.99),("DEEPSEEK",0.95,1.00)]


def scene_4(t,g):
    im,d=frame_shell(g,"05 / THE EVIDENCE",BLUE)
    a=scene_alpha(t,20)
    label(d,120,155,"MEASURE, DON'T ASSUME",dim(BLUE,a),25)
    txt(d,115,215,"A test for the method.",86,dim(WHITE,a),700)
    label(d,120,340,"SIX REAL TASKS  /  THREE RUNS PER ARM",dim(MUTED,a),22)
    for i,(name,before,after) in enumerate(METRICS):
        yy=430+i*145
        on=fade(t,1.5+i*2.2,2.4+i*2.2)
        label(d,120,yy,name,dim(WHITE,on*a),27)
        rule(d,430,yy+16,1510,yy+16,dim(LINE,on*a),18)
        rule(d,430,yy+16,430+1080*before,yy+16,dim((74,88,95),on*a),18)
        prog=before+(after-before)*ease((t-(3+i*2.3))/2.8)
        rule(d,430,yy+16,430+1080*prog,yy+16,dim(BLUE if i<2 else LIME,on*a),10)
        dot(d,430+1080*prog,yy+16,14,dim(BLUE if i<2 else LIME,on*a))
        txt(d,1560,yy-14,f"{before:.2f} → {prog:.2f}",35,dim(WHITE,on*a),630)
    late=fade(t,12,14)
    card(d,(115,870,1800,960),dim(BLUE,late*a),dim((22,30,35),late*a),17,2)
    label(d,145,895,"SMALL SAMPLE. DIRECTIONAL EVIDENCE. HONEST LIMITS.",dim(WHITE,late*a),25)
    return im


def scene_5(t,g):
    im,d=frame_shell(g,"06 / THE LOOP",LIME)
    a=scene_alpha(t,18)
    label(d,120,155,"WORK IN THE REAL WORLD",dim(LIME,a),25)
    txt(d,115,215,"The system learns.",96,dim(WHITE,a),700)
    terms=[("HELPED",LIME), ("HINDERED",CORAL), ("MISSING",BLUE)]
    for i,(name,accent) in enumerate(terms):
        x=125+i*545;y=505+20*math.sin(t*0.45+i)
        on=fade(t,i*1.7+0.5,i*1.7+1.4)
        card(d,(x,y,x+480,y+160),dim(accent,on*a),dim((23,31,33),on*a),22)
        label(d,x+26,y+23,f"0{i+1} / FIELD SIGNAL",dim(accent,on*a),20)
        txt(d,x+26,y+67,name,51,dim(WHITE,on*a),670)
    for i,(accent,start) in enumerate(((LIME,0),(CORAL,120),(BLUE,240))):
        angle=(t*27+start)%360
        r=70+i*24
        d.arc((960-r,790-r,960+r,790+r),angle,angle+95,fill=dim(accent,a*0.75),width=4)
        th=math.radians(angle+95)
        dot(d,960+math.cos(th)*r,790+math.sin(th)*r,6,dim(accent,a))
        card_x=125+i*545+240
        rule(d,card_x,670,960+math.cos(math.radians(start))*r,790+math.sin(math.radians(start))*r,dim(accent,a*0.26),2)
    dot(d,960,790,18,dim((31,43,41),a))
    dot(d,960,790,7,dim(LIME,a))
    p=fade(t,10,12)
    label(d,120,865,"FEEDBACK  →  REFINEMENT  →  BETTER WORK",dim(LIME,p*a),29)
    return im


def scene_6(t,g):
    im,d=frame_shell(g,"07 / SKILLIFY",LIME)
    a=scene_alpha(t,12)
    cx,cy=960,480
    converge=ease((t-0.8)/4.2)
    for ring in range(3):
        radius=165+ring*110
        d.arc((cx-radius,cy-radius,cx+radius,cy+radius),-90+t*12+ring*37,45+t*12+ring*37,fill=dim(LINE,a*(1-converge)*0.8),width=2)
    for i in range(280):
        theta=i*2.39996+t*(0.07+(i%7)*0.004)
        radius=38+math.sqrt(i)*29
        ox=cx+math.cos(theta)*radius
        oy=cy+math.sin(theta)*radius*0.62
        band=i%10
        tx=cx-100+band*22+((i//10)%3-1)*3
        ty=390-((i//10)*17)%112
        p=converge**(0.7+(i%6)*0.07)
        dot(d,mix(ox,tx,p),mix(oy,ty,p),2+(i%23==0)*2,dim(LIME if i%5 else BLUE,a*(1-0.75*converge)))
    reveal=fade(t,4.3,5.5)
    if reveal:
        mark(d,cx-100,450,1.05,reveal*a)
        txt(d,cx,540,"SKILLIFY",125,dim(WHITE,reveal*a),760,"", "mm")
        txt(d,cx,700,"Small rules. Stronger work.",51,dim(MUTED,reveal*a),400,"", "mm")
        label(d,cx,800,"TEN SKILLS  /  FOUR AGENTS  /  ONE BETTER WAY TO WORK",dim(LIME,reveal*a),23)
    return im


SCENES=[(0,12,scene_0),(12,30,scene_1),(30,50,scene_2),(50,70,scene_3),(70,90,scene_4),(90,108,scene_5),(108,120,scene_6)]


def make_frame(t):
    for start,end,scene in SCENES:
        if t<end or end==DURATION:
            return scene(t-start,t)


def audio(path):
    sr=24000
    total=sr*DURATION
    rng=random.Random(113)
    chords=[(110,130.81,164.81),(98,123.47,146.83),(130.81,164.81,196),(87.31,110,130.81)]
    with wave.open(str(path),"wb") as wav:
        wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(sr)
        chunk=bytearray()
        for n in range(total):
            t=n/sr
            bar=int(t/2.4)
            chord=chords[bar%4]
            beat=t%0.6
            half=t%0.3
            section=0.28 if t<10 else 0.7 if t<50 else 0.48 if t<70 else 0.84 if t<108 else 0.44
            pad=sum(math.sin(2*math.pi*f*t) for f in chord)*0.036
            bass=math.sin(2*math.pi*chord[0]/2*t)*0.095*(1-0.45*beat/0.6)
            kick=(math.sin(2*math.pi*(104*beat-76*beat*beat))*math.exp(-22*beat)*0.32) if t>10 else 0
            hat=(rng.random()*2-1)*math.exp(-70*half)*0.055 if t>12 else 0
            snare=(rng.random()*2-1)*math.exp(-32*beat)*0.055 if t>28 and int(t/0.6)%4 in (1,3) else 0
            arp_note=chord[(int(t/0.3)+bar)%3]*2
            arp=math.sin(2*math.pi*arp_note*t)*math.exp(-12*half)*0.07 if t>12 else 0
            swell=0.018*math.sin(2*math.pi*0.13*t)
            v=(pad+bass+kick+hat+snare+arp+swell)*section
            v*=min(1,t/2.5,(DURATION-t)/3.2)
            chunk.extend(struct.pack('<h',int(clamp(v,-1,1)*32767)))
            if len(chunk)>=sr*2:
                wav.writeframesraw(chunk);chunk.clear()
        wav.writeframes(chunk)


def render():
    silent=ROOT/"skillify-showreel-silent.mp4"
    sound=ROOT/"skillify-score.wav"
    final=ROOT/"skillify-showreel.mp4"
    command=["ffmpeg","-hide_banner","-loglevel","error","-y","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-","-an","-c:v","libx264","-preset","veryfast","-crf","19","-pix_fmt","yuv420p","-movflags","+faststart",str(silent)]
    with open(ROOT/"render.log","w") as log:
        proc=subprocess.Popen(command,stdin=subprocess.PIPE,stderr=log)
        try:
            for n in range(FPS*DURATION):
                proc.stdin.write(make_frame(n/FPS).tobytes())
                if n%(FPS*10)==0:
                    print(f"rendered {n//FPS:03}/{DURATION}s",flush=True)
        finally:
            proc.stdin.close()
        if proc.wait():
            raise RuntimeError("ffmpeg render failed; see render.log")
    print("composing original score",flush=True)
    audio(sound)
    subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(silent),"-i",str(sound),"-c:v","copy","-c:a","aac","-b:a","192k","-t",str(DURATION),"-movflags","+faststart",str(final)],check=True)
    print(final,flush=True)


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--stills",action="store_true")
    args=parser.parse_args()
    if args.stills:
        stills=ROOT/"stills";stills.mkdir(exist_ok=True)
        for sec in (2,8,15,22,34,43,56,63,75,83,94,103,112,117):
            make_frame(sec).save(stills/f"{sec:03}.png")
        print(stills)
    else:
        render()
