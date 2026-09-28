#!/usr/bin/env node

import { writeFileSync } from "node:fs";

const SR = 48000, DUR = 136, N = SR * DUR;
const TAU = Math.PI * 2;
const bus = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
const drums = bus(), music = bus(), fx = bus();
const send = new Float32Array(N);
const kicks = [];
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 11;
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

function kick(t0, g = 0.9) {
	kicks.push(t0);
	add(drums, t0, 0.5, (t) => Math.sin(TAU * (46 * t + (120 / 26) * (1 - Math.exp(-t * 26)))) * env(t, 0.002, 0.17) + 0.22 * noise() * env(t, 0.0005, 0.004), g, 0, 0.02);
}
function hat(t0, g = 0.1, pan = 0.3, open = false) {
	let p = 0;
	add(drums, t0, open ? 0.25 : 0.06, (t) => { const x = noise(); const h = x - p; p = x; return h * env(t, 0.001, open ? 0.08 : 0.017); }, g, pan, 0.05);
}
function clap(t0, g = 0.3) {
	let lp = 0;
	add(drums, t0, 0.3, (t) => { const n = noise(); lp += (n - lp) * 0.3; const b = [0, 0.011, 0.023].reduce((s, o) => s + (t >= o ? Math.exp(-(t - o) / 0.006) : 0), 0) + Math.exp(-t / 0.09) * 0.6; return (n - lp) * b; }, g, -0.1, 0.35);
}
function tick(t0, g = 0.07, pan = 0, f = 2400) {
	add(fx, t0, 0.03, (t) => noise() * env(t, 0.0005, 0.004) + Math.sin(TAU * f * t) * env(t, 0.0005, 0.004) * 0.6, g, pan, 0.1);
}
function pluck(t0, m, g = 0.2, pan = 0, dec = 0.35, b = music) {
	const f = hz(m);
	add(b, t0, dec * 4, (t) => (Math.sin(TAU * f * t) + 0.45 * Math.sin(TAU * 2 * f * t) * Math.exp(-t * 9) + 0.2 * Math.sin(TAU * 3.01 * f * t) * Math.exp(-t * 14)) * env(t, 0.003, dec), g, pan, 0.35);
}
function bell(t0, m, g = 0.15, pan = 0) {
	const f = hz(m);
	add(fx, t0, 2.6, (t) => (Math.sin(TAU * f * t) * Math.exp(-t * 2.2) + 0.5 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * 4) + 0.25 * Math.sin(TAU * f * 5.4 * t) * Math.exp(-t * 7)) * Math.min(1, t / 0.002), g, pan, 0.5);
}
function bass(t0, m, len, g = 0.3) {
	const f = hz(m); let lp = 0;
	add(music, t0, len, (t, u) => { const saw = 2 * ((f * t) % 1) - 1; lp += (saw - lp) * (0.05 + 0.12 * Math.exp(-t * 12)); return (lp * 0.8 + Math.sin(TAU * f * t) * 0.65) * env(t, 0.005, 0.6) * (u < 0.9 ? 1 : (1 - u) / 0.1); }, g, 0, 0.03);
}
function pad(t0, len, notes, g = 0.07, cut = 0.018, fin = 0.6, fout = 0.6) {
	const v = notes.flatMap((m) => [hz(m) * 0.995, hz(m) * 1.005, hz(m) * 1.0]);
	const ph = v.map(() => (noise() + 1) / 2);
	let a1 = 0, a2 = 0, b1 = 0, b2 = 0;
	const s0 = Math.floor(t0 * SR), n = Math.floor(len * SR);
	for (let i = 0; i < n; i++) {
		const j = s0 + i; if (j < 0 || j >= N) continue;
		const t = i / SR;
		let l = 0, r = 0;
		for (let k = 0; k < v.length; k++) { const s = 2 * ((v[k] * t + ph[k]) % 1) - 1; if (k % 2) l += s; else r += s; }
		const c = cut * (1 + 0.4 * Math.sin(TAU * 0.11 * t));
		a1 += (l - a1) * c; a2 += (a1 - a2) * c; b1 += (r - b1) * c; b2 += (b1 - b2) * c;
		const e = Math.min(1, t / fin, (len - t) / fout) * g / v.length * 2;
		music.L[j] += a2 * e; music.R[j] += b2 * e; send[j] += (a2 + b2) * e * 0.3;
	}
}
function riser(t0, len, g = 0.2) {
	let lp = 0;
	add(fx, t0, len, (t, u) => { const n = noise(); lp += (n - lp) * (0.01 + 0.35 * u * u); return lp * u * u * 1.4; }, g, 0, 0.4);
}
function whoosh(t0, len, g = 0.2, pan = 0) {
	let lp = 0, bp = 0;
	add(fx, t0, len, (t, u) => { const n = noise(); lp += (n - lp) * (0.03 + 0.25 * Math.sin(Math.PI * u)); bp += (lp - bp) * 0.02; return (lp - bp) * Math.sin(Math.PI * u) ** 2; }, g, pan, 0.3);
}
function impact(t0, g = 0.7) {
	add(drums, t0, 2.4, (t) => Math.sin(TAU * (32 * t + 10 * (1 - Math.exp(-t * 6)))) * env(t, 0.003, 0.75), g, 0, 0.2);
	let lp = 0;
	add(fx, t0, 1.2, (t) => { const n = noise(); lp += (n - lp) * 0.08; return lp * env(t, 0.001, 0.25); }, g * 0.6, 0, 0.5);
}
function blip(t0, up = true, g = 0.1, pan = 0) {
	add(fx, t0, 0.2, (t) => Math.sin(TAU * (up ? 700 + 4000 * t : 1400 - 3500 * t) * t) * env(t, 0.004, 0.05), g, pan, 0.3);
}
function thud(t0, g = 0.4) {
	add(fx, t0, 0.4, (t) => Math.sin(TAU * (70 - 30 * t) * t) * env(t, 0.002, 0.08) + noise() * env(t, 0.0005, 0.01) * 0.4, g, 0, 0.15);
}
function buzz(t0, g = 0.12) {
	add(fx, t0, 0.35, (t) => (Math.sin(TAU * 196 * t) + Math.sin(TAU * 207.7 * t)) * 0.5 * Math.sign(Math.sin(TAU * 98 * t)) * 0.5 * env(t, 0.004, 0.12), g, 0, 0.2);
}
function heartbeat(t0, g = 0.5) {
	add(drums, t0, 0.35, (t) => Math.sin(TAU * (55 + 40 * Math.exp(-t * 30)) * t) * env(t, 0.004, 0.09), g, 0, 0.1);
}
function chime(t0, g = 0.12) { [76, 81, 88].forEach((m, i) => pluck(t0 + i * 0.05, m, g, -0.3 + i * 0.3, 0.4, fx)); }

const Am = [57, 60, 64, 69], F = [53, 57, 60, 65], Cm = [55, 60, 64, 67], G = [55, 59, 62, 67], Dm = [57, 62, 65, 69], Em = [55, 59, 64, 71];
const ROOT = { Am: 45, F: 41, Cm: 48, G: 43, Dm: 38, Em: 40 };
const CH = { Am, F, Cm, G, Dm, Em };

// 0–8 open
for (const b of [0.5, 1.0, 1.5]) heartbeat(b, 0.55);
for (let i = 0; i < 14; i++) tick(2.2 + i * 0.075, 0.06, -0.2 + (i % 3) * 0.2);
pluck(3.5, 81, 0.1, 0.2, 0.3);
riser(3.0, 1.0, 0.16);
impact(4.0, 0.65);
pad(4.0, 4.3, Am, 0.1, 0.012, 1.5, 0.5);
for (let i = 0; i < 10; i++) pluck(4.25 + i * 0.035, [69, 72, 76, 79, 81, 84, 88, 91, 93, 96][i], 0.05, -0.6 + i * 0.13, 0.25);
bell(5.0, 81, 0.1);
riser(7.2, 0.8, 0.2); whoosh(7.25, 0.75, 0.18);

// 8–13 hook
const stabs = [69, 72, 74, 76, 79, 81, 84, 86, 88, 91];
for (let k = 0; k < 10; k++) {
	const t = 8 + k * 0.5;
	kick(t, 0.95);
	if (k % 2) clap(t, 0.26);
	pluck(t, stabs[k], 0.15, k % 2 ? 0.25 : -0.25, 0.18);
	pluck(t, stabs[k] - 12, 0.11, 0, 0.18);
	for (let s = 1; s < 4; s++) hat(t + s * 0.125, s === 2 ? 0.09 : 0.045, s % 2 ? 0.35 : -0.35);
	bass(t, [45, 45, 41, 41, 48, 48, 43, 43, 45, 45][k], 0.46, 0.28);
}
impact(8.0, 0.5);

// 13–16 statement
pad(13.0, 3.1, [45, 57, 60, 64, 71], 0.09, 0.016, 0.3, 0.3);
for (let i = 0; i < 10; i++) tick(13.4 + i * 0.03, 0.04, -0.5 + i * 0.1, 3000);
bell(13.4, 76, 0.1);
riser(15.0, 1.0, 0.2); whoosh(15.55, 0.5, 0.25, 0.4);

// 16–110 groove
const bars = [];
const prog = ["Am", "F", "Cm", "G"];
const prog2 = ["F", "G", "Am", "Em"];
for (let t = 16; t < 110; t += 2) bars.push(t);
bars.forEach((t0, bi) => {
	const chapter = Math.floor((t0 - 16) / 8);
	const name = (t0 >= 64 && t0 < 80 ? prog2 : prog)[bi % 4];
	const chord = CH[name], root = ROOT[name];
	const agents = t0 >= 96;
	pad(t0, 2.05, chord, agents ? 0.07 : 0.06, 0.016, 0.15, 0.15);
	for (let b = 0; b < 4; b++) {
		const t = t0 + b * 0.5;
		const breakdown = t0 === 96;
		if (!breakdown) kick(t, 0.78);
		if (chapter >= 1 && b % 2 === 1) clap(t, 0.18);
		hat(t + 0.25, 0.08, 0.3);
		if (chapter >= 2) { hat(t + 0.125, 0.03, -0.3); hat(t + 0.375, 0.03, -0.3); }
		if (b === 3 && bi % 2) hat(t + 0.25, 0.05, 0.3, true);
		if (!breakdown) bass(t, root, 0.22, 0.24);
		if (!breakdown) bass(t + 0.25, root + (b === 3 ? 7 : 12), 0.2, 0.16);
		if (chapter >= 3 && !agents) for (let s = 0; s < 4; s++) pluck(t + s * 0.125, chord[(b + s) % 4] + 12, 0.028, s % 2 ? 0.4 : -0.4, 0.12);
	}
});
for (let k = 0; k < 10; k++) { const t = 16 + k * 8; if (k) { whoosh(t - 0.45, 0.5, 0.22, 0.5); impact(t, 0.28); } }
whoosh(95.55, 0.5, 0.22, 0.5); impact(96, 0.3);
whoosh(109.55, 0.5, 0.22, 0.5); impact(110, 0.35);

// chapter cues (u + chapter start)
const at = (k, u) => 16 + k * 8 + u;
for (let i = 0; i < 15; i++) tick(at(0, 0.5 + i * 0.04), 0.05, -0.5 + i * 0.07, 2800 + i * 60);
[0, 1, 2, 3, 4, 5].forEach((i) => pluck(at(0, 1.9 + i * 0.46), [69, 72, 76, 79, 81, 84][i], 0.08, -0.3 + i * 0.12, 0.3, fx));
thud(at(0, 5.1), 0.3); thud(at(0, 5.35), 0.3); bell(at(0, 5.9), 81, 0.08);
for (let i = 0; i < 20; i++) tick(at(1, 0.8 + i * 0.045), 0.035, 0.2);
[[2.7, 3.2, false], [3.4, 3.9, true], [4.1, 4.6, false]].forEach(([a, b, ok]) => { whoosh(at(1, a), b - a, 0.08, 0.3); if (ok) chime(at(1, b), 0.1); else thud(at(1, b), 0.25); });
riser(at(1, 4.4), 0.6, 0.1); bell(at(1, 5.0), 76, 0.1); pluck(at(1, 6.7), 88, 0.08, 0.3, 0.3, fx);
for (let i = 0; i < 20; i++) tick(at(2, 0.6 + i * 0.035), 0.03, -0.2);
[1.8, 2.15, 2.5, 2.85].forEach((t, i) => { thud(at(2, t + 0.25), 0.18); tick(at(2, t + 0.25), 0.05, 0.3, 1800 - i * 200); });
whoosh(at(2, 4.0), 0.35, 0.1, -0.4); bell(at(2, 5.0), 84, 0.1); pluck(at(2, 5.6), 88, 0.08, 0.3, 0.3, fx);
for (let i = 0; i < 6; i++) pluck(at(3, 1.4 + i * 0.18), [72, 74, 76, 79, 81, 84][i], 0.07, -0.5 + i * 0.2, 0.25, fx);
bell(at(3, 4.2), 88, 0.1, 0.2); whoosh(at(3, 5.8), 0.7, 0.14); chime(at(3, 6.3), 0.08);
[1.2, 1.7, 2.2, 2.7].forEach((t, i) => { tick(at(4, t), 0.06, 0, 2200); pluck(at(4, t), [69, 72, 76, 79][i], 0.05, 0, 0.2, fx); });
thud(at(4, 2.8), 0.22); thud(at(4, 3.3), 0.22); bell(at(4, 4.1), 81, 0.09); tick(at(4, 5.4), 0.06);
for (let i = 0; i < 16; i++) tick(at(5, 0.8 + i * 0.035), 0.03, 0.1);
[1.7, 1.88, 2.06, 2.24, 2.42].forEach((t, i) => blip(at(5, t), true, 0.07, -0.4 + i * 0.2));
[3.1, 3.6, 4.0, 4.4, 4.8].forEach((t) => chime(at(5, t), 0.05));
bell(at(5, 5.3), 88, 0.1);
whoosh(at(6, 1.8), 2.4, 0.06, 0.2);
[2.3, 3.0, 3.7].forEach((t) => { thud(at(6, t), 0.3); tick(at(6, t), 0.08, 0.3, 1500); });
impact(at(6, 5.3), 0.35); clap(at(6, 5.3), 0.2);
[1.6, 1.72, 1.84, 1.96, 2.08].forEach((t) => tick(at(7, t), 0.05, 0.3));
add(fx, at(7, 3.4), 0.3, (t) => noise() * env(t, 0.005, 0.08) * Math.sin(TAU * 900 * t), 0.08, -0.3, 0.2);
for (let i = 0; i < 18; i++) tick(at(7, 3.9 + i * 0.05), 0.04, 0.2, 1200 + i * 90);
chime(at(7, 4.6), 0.09); bell(at(7, 5.4), 76, 0.08);
for (let i = 0; i < 12; i++) tick(at(8, 1.8 + i * 0.16 + 0.35), 0.05, -0.4 + (i % 5) * 0.2, 3000 - i * 120);
bell(at(8, 4.8), 81, 0.1); tick(at(8, 5.8), 0.06);
pluck(at(9, 1.6), 72, 0.06, -0.2, 0.2, fx); pluck(at(9, 2.0), 76, 0.06, 0, 0.2, fx);
buzz(at(9, 2.6), 0.12); chime(at(9, 4.3), 0.12); bell(at(9, 4.3), 88, 0.08);

// 96–110 agents
for (const [t, , out] of [[1.8, 0, 1], [1.85, 1, 1], [3.4, 0, 0], [3.5, 1, 0], [4.3, 2, 1], [7.2, 2, 0], [7.7, 3, 1], [9.8, 3, 0], [10.2, 2, 1], [11.2, 2, 0], [11.5, 3, 1]]) blip(96 + t, !!out, 0.09, out ? 0.4 : -0.3);
[4.8, 5.4, 6.0, 10.7].forEach((t) => chime(96 + t + 0.5, 0.04));
thud(96 + 8.9, 0.45); tick(96 + 8.92, 0.12, 0.3, 1200);
riser(97.0, 1.0, 0.16); impact(98, 0.3);
impact(96 + 12.3, 0.25); pluck(96 + 12.3, 88, 0.12, 0.3, 0.4, fx); pluck(96 + 12.3, 76, 0.1, 0.3, 0.4, fx);

// 110–126 evidence, half time
for (let t0 = 110; t0 < 126; t0 += 2) {
	const i = (t0 - 110) / 2;
	const name = ["Am", "F", "Cm", "G", "Am", "F", "Dm", "Em"][i];
	pad(t0, 2.05, CH[name], 0.085, 0.02, 0.2, 0.2);
	kick(t0, 0.7); clap(t0 + 1, 0.16);
	hat(t0 + 0.5, 0.05, 0.3); hat(t0 + 1.5, 0.05, 0.3);
	bass(t0, ROOT[name], 0.9, 0.22); bass(t0 + 1, ROOT[name], 0.9, 0.18);
}
[1.0, 1.2, 1.4].forEach((t, i) => tick(110 + t, 0.06, -0.3 + i * 0.3));
[3.3, 3.55, 3.8].forEach((t, i) => pluck(110 + t, [57, 60, 64][i], 0.08, -0.3 + i * 0.3, 0.3, fx));
[4.4, 4.7, 5.0].forEach((t, i) => { for (let n = 0; n < 5; n++) pluck(110 + t + n * 0.18, 69 + [0, 3, 7, 10, 12][n] + i * 2, 0.04, -0.4 + i * 0.4, 0.2, fx); });
chime(116.6, 0.08);
[10.3, 10.6, 10.9].forEach((t, i) => pluck(110 + t, [76, 64, 57][i], 0.12, -0.4 + i * 0.4, 0.4, fx));
bell(122.6, 88, 0.12);
riser(125.0, 1.0, 0.18);

// 126–136 outro
impact(126, 0.55);
pad(126, 10, [45, 57, 60, 64, 71], 0.12, 0.012, 0.4, 3.5);
heartbeat(126.5, 0.45); heartbeat(127.0, 0.45);
for (let i = 0; i < 8; i++) pluck(127.35 + i * 0.045, [69, 72, 76, 79, 81, 84, 88, 91][i], 0.05, -0.5 + i * 0.14, 0.5, fx);
bell(129.5, 76, 0.09, 0.2);
heartbeat(135.0, 0.35); bell(135.0, 81, 0.08);

// sidechain + reverb + master
kicks.sort((a, b) => a - b);
let ki = 0, last = -10;
for (let i = 0; i < N; i++) {
	const t = i / SR;
	while (ki < kicks.length && kicks[ki] <= t) last = kicks[ki++];
	const duck = 1 - 0.5 * Math.exp(-(t - last) / 0.11);
	music.L[i] *= duck; music.R[i] *= duck;
}
function comb(input, d, fb, damp) {
	const out = new Float32Array(N), buf = new Float32Array(d); let idx = 0, lp = 0;
	for (let i = 0; i < N; i++) { const y = buf[idx]; lp = y * (1 - damp) + lp * damp; buf[idx] = input[i] + lp * fb; out[i] = y; idx = (idx + 1) % d; }
	return out;
}
function allpass(input, d, g = 0.5) {
	const out = new Float32Array(N), buf = new Float32Array(d); let idx = 0;
	for (let i = 0; i < N; i++) { const b = buf[idx]; const y = -input[i] + b; buf[idx] = input[i] + b * g; out[i] = y; idx = (idx + 1) % d; }
	return out;
}
function reverb(offset) {
	const sum = new Float32Array(N);
	for (const ms of [29.7, 37.1, 41.1, 43.7]) { const c = comb(send, Math.floor((ms + offset) * SR / 1000), 0.8, 0.35); for (let i = 0; i < N; i++) sum[i] += c[i] * 0.25; }
	return allpass(allpass(sum, Math.floor((5.0 + offset * 0.1) * SR / 1000)), Math.floor((1.7 + offset * 0.05) * SR / 1000));
}
const wetL = reverb(0), wetR = reverb(2.3);
const pcm = Buffer.alloc(N * 4);
let peak = 0;
const mixL = new Float32Array(N), mixR = new Float32Array(N);
for (let i = 0; i < N; i++) {
	mixL[i] = drums.L[i] + music.L[i] + fx.L[i] + wetL[i] * 0.35;
	mixR[i] = drums.R[i] + music.R[i] + fx.R[i] + wetR[i] * 0.35;
	peak = Math.max(peak, Math.abs(mixL[i]), Math.abs(mixR[i]));
}
for (let i = 0; i < N; i++) {
	const fade = Math.min(1, i / (SR * 0.02), (N - i) / (SR * 0.8));
	const l = Math.tanh(mixL[i] * 0.95) * fade, r = Math.tanh(mixR[i] * 0.95) * fade;
	pcm.writeInt16LE(Math.round(l * 30000), i * 4);
	pcm.writeInt16LE(Math.round(r * 30000), i * 4 + 2);
}
const head = Buffer.alloc(44);
head.write("RIFF", 0); head.writeUInt32LE(36 + pcm.length, 4); head.write("WAVE", 8); head.write("fmt ", 12);
head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(2, 22); head.writeUInt32LE(SR, 24);
head.writeUInt32LE(SR * 4, 28); head.writeUInt16LE(4, 32); head.writeUInt16LE(16, 34); head.write("data", 36); head.writeUInt32LE(pcm.length, 40);
writeFileSync(process.argv[2] ?? "score.wav", Buffer.concat([head, pcm]));
console.log(`peak before limiter ${peak.toFixed(2)}`);
