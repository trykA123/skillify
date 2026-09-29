#!/usr/bin/env node

import { writeFileSync } from "node:fs";

const SR = 48000, BAR = 10 / 3, DUR = 47 * BAR, N = Math.ceil(SR * DUR);
const TAU = Math.PI * 2;
const bus = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
const drums = bus(), music = bus(), fx = bus();
const send = new Float32Array(N);
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 31;
const noise = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2147483648 - 1; };
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));

function add(b, t0, len, fn, gain = 1, pan = 0, wet = 0.3) {
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

const CH = (k) => 6 * BAR + k * 3 * BAR;
const T_AG = CH(10), T_EV = T_AG + 3 * BAR, T_FIN = T_EV + 4 * BAR;
const SUB = [[0, 3.0], [0, 3.6, 4.8, 6.2], [0, 4.2, 5.6], [0, 2.8, 6.0], [0, 4.6], [0, 2.2, 5.2], [0, 2.8, 5.4], [0, 3.2, 5.2], [0, 2.8], [0, 2.6, 5.6]];
const KFT = [0, BAR, 2 * BAR, 4 * BAR, ...SUB.flatMap((s, k) => s.map((u) => CH(k) + u)), T_AG, T_EV, T_EV + 2.8, T_EV + 7.4, T_FIN, T_FIN + 8.6];
const GOLD = [CH(0) + 3.0, CH(1) + 6.2, CH(2) + 5.6, CH(3) + 2.8, CH(4) + 0.8, CH(5) + 5.2, CH(6) + 2.8, CH(6) + 3.5, CH(6) + 4.2, CH(6) + 5.4, CH(7) + 3.2, CH(7) + 5.2, CH(8) + 2.8, CH(9) + 2.6, CH(9) + 5.6, T_AG + 5.3, T_EV + 2.8, T_EV + 7.4];

function piano(t0, m, g = 0.08, pan = 0, len = 4) {
	const f = hz(m), d = 0.9 + 1.6 * Math.exp(-(m - 48) / 24);
	let lp = 0;
	add(music, t0, len, (t, u) => {
		const s = Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * f * 2.003 * t) * Math.exp(-t * 3) + 0.12 * Math.sin(TAU * f * 3.01 * t) * Math.exp(-t * 6) + 0.5 * Math.sin(TAU * f * 1.0015 * t);
		const hammer = noise() * Math.exp(-t * 90) * 0.25;
		lp += (s * 0.6 + hammer - lp) * 0.35;
		return lp * env(t, 0.006, d) * (u > 0.85 ? (1 - u) / 0.15 : 1);
	}, g, pan, 0.45);
}
function strings(t0, len, notes, g = 0.05, attack = 1.8, release = 2) {
	const v = notes.flatMap((m) => [-0.08, -0.03, 0.02, 0.07].map((c) => hz(m) * Math.pow(2, c / 12)));
	const ph = v.map(() => (noise() + 1) / 2);
	let a1 = 0, a2 = 0, b1 = 0, b2 = 0;
	const s0 = Math.floor(t0 * SR), n = Math.floor(len * SR);
	for (let i = 0; i < n; i++) {
		const j = s0 + i; if (j < 0 || j >= N) continue;
		const t = i / SR;
		let l = 0, r = 0;
		for (let k = 0; k < v.length; k++) { const s = 2 * ((v[k] * t + ph[k] + 0.002 * Math.sin(TAU * 5.1 * t + k)) % 1) - 1; if (k % 2) l += s; else r += s; }
		const c = 0.11 * (1 + 0.3 * Math.sin(TAU * 0.05 * t));
		a1 += (l - a1) * c; a2 += (a1 - a2) * c; b1 += (r - b1) * c; b2 += (b1 - b2) * c;
		const e = Math.min(1, t / attack, (len - t) / release) * g / v.length * 3;
		music.L[j] += a2 * e; music.R[j] += b2 * e; send[j] += (a2 + b2) * e * 0.5;
	}
}
function drone(t0, len, m, g = 0.08) {
	const f = hz(m);
	add(music, t0, len, (t, u) => (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2 * t + Math.sin(TAU * 0.07 * t))) * Math.min(1, t / 4, (len - t) / 4), g, 0, 0.1);
}
function bell(t0, m, g = 0.035, pan = 0) {
	const f = hz(m);
	add(fx, t0, 4, (t) => (Math.sin(TAU * f * t) * Math.exp(-t * 1.1) + 0.3 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * 2.6) + 0.12 * Math.sin(TAU * f * 5.4 * t) * Math.exp(-t * 5)) * Math.min(1, t / 0.01), g, pan, 0.7);
}
function pulse(t0, g = 0.28) {
	add(drums, t0, 0.8, (t) => Math.sin(TAU * (42 * t + (30 / 14) * (1 - Math.exp(-t * 14)))) * env(t, 0.012, 0.22), g, 0, 0.05);
}

const Em9 = [40, 47, 50, 54, 55], Cmaj = [36, 43, 47, 52, 54], G69 = [43, 50, 52, 57, 59], Dfs = [42, 45, 50, 52, 59];
const PROG = [Em9, Cmaj, G69, Dfs];
const SCALE = [64, 66, 67, 69, 71, 74, 76, 78, 79, 81, 83, 86, 88, 90, 91];

drone(0, DUR - 1, 28, 0.035);
for (let b = 0; b < 47; b++) {
	const t0 = b * BAR, ch = PROG[b % 4];
	const inIntro = t0 < 2 * BAR, fin = t0 >= T_FIN;
	if (t0 >= 4 * BAR) strings(t0, BAR + 1.6, ch.slice(1).map((m) => m + 12), fin ? 0.07 : 0.05, 1.4, 1.6);
	if (t0 >= 2 * BAR && t0 < T_FIN + 2 * BAR) {
		const arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[4] + 12, ch[3] + 24];
		const density = t0 < 4 * BAR ? 2 : t0 < CH(0) ? 4 : 6;
		for (let n = 0; n < density; n++) piano(t0 + n * (BAR / 6) * (6 / density) + (n % 2 ? 0.02 : 0), arp[n % arp.length], 0.055 - n * 0.004, -0.4 + (n / density) * 0.8);
		piano(t0, ch[0], 0.06, 0, 5);
	}
	if (t0 >= CH(0) && t0 < T_FIN) {
		pulse(t0, 0.26);
		if (t0 >= CH(3)) pulse(t0 + BAR / 2, 0.14);
	}
	if (inIntro) continue;
}
for (let k = 0; k < 10; k++) { const T = CH(k); [71, 74, 78].forEach((m, i) => piano(T + 0.6 + i * 0.28, m + (k % 2 ? 2 : 0), 0.05, -0.2 + i * 0.2)); }
GOLD.forEach((t, i) => bell(t, SCALE[8 + (i % 6)], 0.03, -0.4 + (i % 5) * 0.2));

strings(T_FIN, 4 * BAR - 1, [52, 55, 59, 62, 66, 71], 0.08, 2.5, 5);
piano(T_FIN + 0.2, 40, 0.08, 0, 7); piano(T_FIN + 0.2, 52, 0.06, 0, 7);
[76, 79, 83, 86, 88].forEach((m, i) => piano(T_FIN + 2.4 + i * 0.32, m, 0.045, -0.3 + i * 0.15, 5));
bell(T_FIN + 3.8, 88, 0.035);

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
