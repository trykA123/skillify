#!/usr/bin/env node

import { writeFileSync } from "node:fs";

const SR = 48000, DUR = 151.2, N = Math.ceil(SR * DUR);
const TAU = Math.PI * 2;
const BEAT = 0.6, BAR = 2.4;
const bus = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
const drums = bus(), music = bus(), fx = bus();
const send = new Float32Array(N);
const kicks = [];
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 23;
const noise = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2147483648 - 1; };
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));

function add(b, t0, len, fn, gain = 1, pan = 0, wet = 0.25) {
	const s0 = Math.floor(t0 * SR), n = Math.floor(len * SR);
	const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
	for (let i = 0; i < n; i++) {
		const j = s0 + i;
		if (j < 0 || j >= N) continue;
		const v = fn(i / SR, i / n);
		b.L[j] += v * gl; b.R[j] += v * gr;
		send[j] += v * gain * wet;
	}
}

const STATIONS = [{ start: 0, dur: 12 }];
for (let k = 0; k < 10; k++) STATIONS.push({ start: 12 + k * 9.6, dur: 9.6 });
STATIONS.push({ start: 108, dur: 14.4 }, { start: 122.4, dur: 16.8 });
const T_OUT = 139.2, LEAD = 0.6, GLIDE = 1.6;
const at = (j, u) => STATIONS[j].start - LEAD + u;

function kick(t0, g = 0.55) {
	kicks.push(t0);
	add(drums, t0, 0.45, (t) => Math.sin(TAU * (44 * t + (70 / 22) * (1 - Math.exp(-t * 22)))) * env(t, 0.004, 0.16), g, 0, 0.03);
}
function rim(t0, g = 0.12, pan = -0.15) {
	let lp = 0, hp = 0;
	add(drums, t0, 0.12, (t) => { const n = noise(); lp += (n - lp) * 0.35; hp = n - lp; return (hp * 0.6 + Math.sin(TAU * 1650 * t) * 0.5) * env(t, 0.0008, 0.022); }, g, pan, 0.35);
}
function shaker(t0, g = 0.025, pan = 0.35) {
	let p = 0;
	add(drums, t0, 0.09, (t) => { const x = noise(); const h = x - p; p = x; return h * env(t, 0.012, 0.03); }, g, pan, 0.15);
}
function epiano(t0, m, len = 2.2, g = 0.1, pan = 0) {
	const f = hz(m);
	add(music, t0, len, (t, u) => {
		const idx = 1.6 * Math.exp(-t * 3.2);
		const tine = Math.sin(TAU * f * t + idx * Math.sin(TAU * f * t));
		const bark = 0.25 * Math.sin(TAU * f * 14 * t) * Math.exp(-t * 40);
		const trem = 1 + 0.08 * Math.sin(TAU * 4.6 * t);
		return (tine + bark) * env(t, 0.004, 1.1) * trem * (u > 0.9 ? (1 - u) / 0.1 : 1);
	}, g, pan, 0.4);
}
function chord(t0, notes, len = 2.3, g = 0.075, strum = 0.018) {
	notes.forEach((m, i) => epiano(t0 + i * strum, m, len, g * (i === 0 ? 0.8 : 1), -0.35 + (i / Math.max(1, notes.length - 1)) * 0.7));
}
function bass(t0, m, len, g = 0.22) {
	const f = hz(m);
	add(music, t0, len, (t, u) => (Math.sin(TAU * f * t) + 0.18 * Math.sin(TAU * 2 * f * t)) * env(t, 0.012, 0.9) * (u > 0.85 ? (1 - u) / 0.15 : 1), g, 0, 0.02);
}
function pad(t0, len, notes, g = 0.06, cut = 0.012, fin = 0.8, fout = 0.8) {
	const v = notes.flatMap((m) => [hz(m) * 0.996, hz(m) * 1.004]);
	const ph = v.map(() => (noise() + 1) / 2);
	let a1 = 0, a2 = 0, b1 = 0, b2 = 0;
	const s0 = Math.floor(t0 * SR), n = Math.floor(len * SR);
	for (let i = 0; i < n; i++) {
		const j = s0 + i; if (j < 0 || j >= N) continue;
		const t = i / SR;
		let l = 0, r = 0;
		for (let k = 0; k < v.length; k++) { const s = 2 * ((v[k] * t + ph[k]) % 1) - 1; if (k % 2) l += s; else r += s; }
		const c = cut * (1 + 0.35 * Math.sin(TAU * 0.07 * t));
		a1 += (l - a1) * c; a2 += (a1 - a2) * c; b1 += (r - b1) * c; b2 += (b1 - b2) * c;
		const e = Math.min(1, t / fin, (len - t) / fout) * g / v.length * 2;
		music.L[j] += a2 * e; music.R[j] += b2 * e; send[j] += (a2 + b2) * e * 0.35;
	}
}
function swell(t0, len, g = 0.06) {
	let lp = 0, bp = 0;
	add(fx, t0, len, (t, u) => { const n = noise(); lp += (n - lp) * (0.02 + 0.08 * Math.sin(Math.PI * u)); bp += (lp - bp) * 0.01; return (lp - bp) * Math.sin(Math.PI * u) ** 2; }, g, 0, 0.6);
}
function bell(t0, m, g = 0.06, pan = 0) {
	const f = hz(m);
	add(fx, t0, 3, (t) => (Math.sin(TAU * f * t) * Math.exp(-t * 1.6) + 0.35 * Math.sin(TAU * f * 3.01 * t) * Math.exp(-t * 4)) * Math.min(1, t / 0.004), g, pan, 0.6);
}
function tick(t0, g = 0.02, pan = 0, f = 2600) {
	add(fx, t0, 0.04, (t) => Math.sin(TAU * f * t) * env(t, 0.001, 0.008), g, pan, 0.2);
}
function blip(t0, up = true, g = 0.03, pan = 0) {
	add(fx, t0, 0.25, (t) => Math.sin(TAU * (up ? 880 + 900 * t : 1320 - 800 * t) * t) * env(t, 0.01, 0.07), g, pan, 0.4);
}
function motif(t0, root, g = 0.05) { [0, 7, 12, 14].forEach((d, i) => bell(t0 + i * 0.15, root + d + 12, g * (1 - i * 0.12), -0.3 + i * 0.2)); }

const Dmaj9 = [50, 57, 61, 64, 66], Bm9 = [47, 54, 57, 61, 62], Gmaj7 = [43, 50, 54, 59, 62], A69 = [45, 52, 54, 57, 59];
const PROG = [[Dmaj9, 38], [Bm9, 35], [Gmaj7, 43], [A69, 45]];
const bars = [];
for (let t = 0; t < DUR - 0.01; t += BAR) bars.push(t);

bars.forEach((t0, bi) => {
	const [ch, root] = PROG[bi % 4];
	const inIntro = t0 < 12, inOutro = t0 >= T_OUT;
	const drumsOn = t0 >= 9.6 && t0 < T_OUT + 2.4 && !(t0 >= 108 && t0 < 110.4);
	const drumFade = inOutro ? 1 - (t0 - T_OUT) / 4.8 : 1;
	pad(t0, BAR + 0.3, ch, inIntro ? 0.075 : 0.055, 0.012, 0.4, 0.4);
	if (t0 >= 2.4) {
		const g = inIntro ? 0.06 : 0.07;
		chord(t0, ch.slice(1), 2.3, g);
		if (!inIntro && bi % 2 === 1) chord(t0 + 1.5, ch.slice(2), 0.9, g * 0.6, 0.012);
	}
	if (t0 >= 7.2) { bass(t0, root, 1.0, 0.2); bass(t0 + 1.5, root, 0.5, 0.14); bass(t0 + 1.8, root + 12, 0.5, 0.08); }
	if (drumsOn) {
		kick(t0, 0.5 * drumFade); kick(t0 + 1.5, 0.28 * drumFade);
		rim(t0 + 1.2, 0.1 * drumFade);
		for (let s = 0; s < 8; s++) shaker(t0 + s * 0.3 + (s % 2 ? 0.04 : 0), (s % 2 ? 0.02 : 0.028) * drumFade, s % 2 ? 0.35 : 0.25);
	}
});

for (let i = 0; i < 14; i++) tick(2.7 + i * 0.09, 0.018, -0.2 + (i % 3) * 0.2, 2400 + (i % 4) * 90);
motif(5.3, 62, 0.05);
swell(7.4, 3.0, 0.04);

STATIONS.forEach((st, j) => {
	if (j) motif(at(j, 0.25), [62, 59, 55, 57][j % 4], 0.035);
	const glideStart = st.start + st.dur - GLIDE;
	if (j < STATIONS.length - 1) swell(glideStart - 0.2, GLIDE + 0.6, 0.05);
});

const cue = (j, u, fn) => fn(at(j, u));
for (let i = 0; i < 15; i++) cue(1, 0.5 + i * 0.04, (t) => tick(t, 0.012, -0.5 + i * 0.07, 2800 + i * 50));
[1.9, 2.36, 2.82, 3.28, 3.74, 4.2].forEach((u, i) => cue(1, u, (t) => bell(t, [74, 76, 78, 81, 83, 86][i], 0.022, -0.3 + i * 0.12)));
[2, 3, 4].forEach((i, n) => cue(2, 3.2 + n * 0.7, (t) => (n === 1 ? motif(t, 66, 0.03) : tick(t, 0.02, 0.2, 900))));
cue(2, 5.0, (t) => bell(t, 78, 0.035));
[1.8, 2.15, 2.5, 2.85].forEach((u) => cue(3, u + 0.3, (t) => tick(t, 0.02, 0.2, 1500)));
cue(3, 5.0, (t) => bell(t, 81, 0.035));
for (let i = 0; i < 6; i++) cue(4, 1.4 + i * 0.18, (t) => bell(t, [74, 76, 78, 81, 83, 86][i], 0.018, -0.5 + i * 0.2));
cue(4, 4.2, (t) => bell(t, 88, 0.03));
[1.2, 1.7, 2.2, 2.7].forEach((u) => cue(5, u, (t) => tick(t, 0.02, 0, 2200)));
cue(5, 4.1, (t) => bell(t, 81, 0.03));
[1.7, 1.88, 2.06, 2.24, 2.42].forEach((u, i) => cue(6, u, (t) => blip(t, true, 0.018, -0.4 + i * 0.2)));
[3.1, 3.6, 4.0, 4.4, 4.8].forEach((u) => cue(6, u, (t) => tick(t, 0.02, 0.3, 3200)));
[2.3, 3.0, 3.7].forEach((u) => cue(7, u, (t) => tick(t, 0.025, 0.3, 1200)));
cue(7, 5.3, (t) => bell(t, 74, 0.035));
for (let i = 0; i < 12; i++) cue(8, 3.9 + i * 0.05, (t) => tick(t, 0.012, 0.2, 1200 + i * 90));
cue(8, 4.6, (t) => motif(t, 69, 0.03));
for (let i = 0; i < 12; i++) cue(9, 2.15 + i * 0.16, (t) => tick(t, 0.014, -0.4 + (i % 5) * 0.2, 2800 - i * 100));
cue(9, 4.8, (t) => bell(t, 81, 0.03));
cue(10, 2.6, (t) => bell(t, 70, 0.025));
cue(10, 4.3, (t) => motif(t, 74, 0.035));
for (const [u, out] of [[1.8, 1], [1.85, 1], [3.4, 0], [3.5, 0], [4.3, 1], [7.2, 0], [7.7, 1], [9.8, 0], [10.2, 1], [11.2, 0], [11.5, 1]]) cue(11, u, (t) => blip(t, !!out, 0.022, out ? 0.4 : -0.3));
cue(11, 8.9, (t) => tick(t, 0.03, 0.3, 700));
cue(11, 12.3, (t) => motif(t, 74, 0.035));
[4.4, 4.7, 5.0].forEach((u, i) => cue(12, u, (t) => { for (let n = 0; n < 4; n++) bell(t + n * 0.16, 74 + [0, 4, 7, 12][n] + i * 2, 0.016, -0.4 + i * 0.4); }));
[10.3, 10.6, 10.9].forEach((u, i) => cue(12, u, (t) => bell(t, [78, 74, 69][i], 0.03, -0.4 + i * 0.4)));

swell(T_OUT, 5.0, 0.06);
pad(T_OUT + 2.4, 9.6, [38, 50, 57, 61, 64, 66, 69], 0.08, 0.01, 1.5, 4);
chord(T_OUT + 4.2, [57, 61, 64, 66, 69], 5.5, 0.07, 0.05);
motif(T_OUT + 4.6, 62, 0.04);
bell(T_OUT + 8.0, 74, 0.03, 0.2);

kicks.sort((a, b) => a - b);
let ki = 0, last = -10;
for (let i = 0; i < N; i++) {
	const t = i / SR;
	while (ki < kicks.length && kicks[ki] <= t) last = kicks[ki++];
	const duck = 1 - 0.22 * Math.exp(-(t - last) / 0.14);
	music.L[i] *= duck; music.R[i] *= duck;
}
function wav(path, L, R) {
	const data = Buffer.alloc(N * 8);
	for (let i = 0; i < N; i++) { data.writeFloatLE(L[i], i * 8); data.writeFloatLE(R[i], i * 8 + 4); }
	const h = Buffer.alloc(44);
	h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
	h.writeUInt32LE(16, 16); h.writeUInt16LE(3, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24);
	h.writeUInt32LE(SR * 8, 28); h.writeUInt16LE(8, 32); h.writeUInt16LE(32, 34); h.write("data", 36); h.writeUInt32LE(data.length, 40);
	writeFileSync(path, Buffer.concat([h, data]));
}
const dir = process.argv[2] ?? ".";
wav(`${dir}/drums.wav`, drums.L, drums.R);
wav(`${dir}/music.wav`, music.L, music.R);
wav(`${dir}/fx.wav`, fx.L, fx.R);
wav(`${dir}/send.wav`, send, send);
console.log(`stems written to ${dir}`);
