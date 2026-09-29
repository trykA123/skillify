#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import process from "node:process";

const repo = join(dirname(new URL(import.meta.url).pathname), "..");
const VERDICTS = ["helped", "neutral", "hurt"];
const STOP = new Set(("a an and are as at be been but by for from had has have if in into is it its of on or so that the their then there these this to was were what when which while with without not no nor via per than too very can could should would will just also only own more most some any all each other such our out up over under again about after before because between both do does did doing done get got how i you we they he she them his her my your ours us me").split(" "));
const GENERIC = new Set("never run shared worker brief guidance skill skills note notes line thing role use used using make made need needs like lack lacked missing way".split(" "));
const COST_KEYS = ["tokens", "tools", "ms"];
const RAW_URL = "https://github.com/trykA123/skillify/tree/main/evals/results";
const BLOB_URL = "https://github.com/trykA123/skillify/blob/main/evals/results";
const MODEL_NAMES = { haiku: ["Claude Haiku", "Haiku"], sonnet: ["Claude Sonnet", "Sonnet"], "deepseek-flash": ["DeepSeek Flash", "DeepSeek"] };
const NONE = /^(nothing|none|n\/a|na|-|—|no)\.?$/i;

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const pct = (n, d) => (d ? Math.round((100 * n) / d) : 0);

export function parseEntries(text) {
  return text.split("\n").map((l, i) => [l.trim(), i + 1]).filter(([l]) => l).map(([l, n]) => {
    let r;
    try {
      r = JSON.parse(l);
    } catch {
      throw new Error(`field.jsonl line ${n}: invalid JSON`);
    }
    if (!VERDICTS.includes(r.verdict)) throw new Error(`field.jsonl line ${n}: bad verdict "${r.verdict}"`);
    for (const k of COST_KEYS) if (r[k] !== undefined && !(Number.isInteger(r[k]) && r[k] >= 0)) throw new Error(`field.jsonl line ${n}: ${k} must be a non-negative integer`);
    return { date: "", agent: "", model: "", harness: "", task: "", helped: "", hindered: "", missing: "", ...r, skills: Array.isArray(r.skills) ? r.skills : [] };
  });
}

export async function loadResults(dir) {
  const found = [];
  const walk = async (d) => {
    for (const e of await readdir(d, { withFileTypes: true }).catch(() => [])) {
      const p = join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.name.endsWith(".jsonl")) found.push(relative(dir, p).split("\\").join("/"));
    }
  };
  await walk(dir);
  found.sort();
  const groups = new Map();
  const files = [];
  for (const file of found) {
    const models = new Set();
    (await readFile(join(dir, file), "utf8")).split("\n").forEach((l, i) => {
      if (!l.trim()) return;
      let r;
      try {
        r = JSON.parse(l);
      } catch {
        throw new Error(`${file} line ${i + 1}: invalid JSON`);
      }
      if (!r.model || !r.task || !["base", "skill"].includes(r.arm) || ![r.score, r.cost, r.turns, r.seconds].every(Number.isFinite)) throw new Error(`${file} line ${i + 1}: bad result row`);
      models.add(r.model);
      const k = `${r.model}\u0000${r.task}\u0000${r.arm}`;
      const g = groups.get(k);
      if (g && g.file === file) g.rows.push(r);
      else groups.set(k, { file, rows: [r] });
    });
    files.push({ file, models: [...models] });
  }
  return { rows: [...groups.values()].flatMap((g) => g.rows), files };
}

const mean = (rs, k) => rs.reduce((s, r) => s + r[k], 0) / rs.length;
const armStat = (rs) => (rs.length ? { n: rs.length, score: mean(rs, "score"), cost: mean(rs, "cost"), turns: mean(rs, "turns"), seconds: mean(rs, "seconds") } : null);
const change = (a, b) => (a ? Math.round((100 * (b - a)) / a) : null);
const modelName = (m, short = false) => (MODEL_NAMES[m] ?? [m, m])[short ? 1 : 0];

export function analyzeResults(results, kinds = {}) {
  const { rows, files } = results;
  const order = (m) => (m in MODEL_NAMES ? Object.keys(MODEL_NAMES).indexOf(m) : 99);
  const names = [...new Set(rows.map((r) => r.model))].sort((a, b) => order(a) - order(b) || a.localeCompare(b));
  const tasks = [...new Set(rows.map((r) => r.task))].sort();
  const cell = (m, t) => {
    const pick = (arm) => armStat(rows.filter((r) => r.model === m && r.arm === arm && (t === undefined || r.task === t)));
    return { base: pick("base"), skill: pick("skill") };
  };
  const models = names.map((m) => ({ model: m, estimate: rows.some((r) => r.model === m && r.costSource === 'cli-estimate'), ...cell(m), files: files.filter((f) => f.models.includes(m)).map((f) => f.file), tasks: tasks.map((t) => ({ task: t, ...cell(m, t) })).filter((c) => c.base && c.skill) })).filter((m) => m.base && m.skill);
  const perTask = tasks.map((t) => {
    const per = models.map((m) => ({ model: m.model, ...m.tasks.find((c) => c.task === t) })).filter((c) => c.base);
    return { task: t, skill: kinds[t]?.skill ?? "", kind: kinds[t]?.kind ?? "", per, best: Math.max(-1, ...per.map((c) => c.skill.score - c.base.score)) };
  }).filter((t) => t.per.length).sort((a, b) => b.best - a.best || a.task.localeCompare(b.task));
  const runsPerArm = Math.max(0, ...rows.map((r) => rows.filter((x) => x.model === r.model && x.task === r.task && x.arm === r.arm).length));
  return { models, tasks: perTask, runsPerArm, fixtures: tasks.length, kinds };
}

export function evalHeadline(models) {
  let best = null;
  for (const a of models) for (const b of models) {
    if (a.estimate || b.estimate) continue;
    if (a === b || !(a.skill.score > a.base.score) || a.skill.score < b.base.score - 0.03 || !(a.skill.cost < b.base.cost)) continue;
    const ratio = a.skill.cost / b.base.cost;
    if (!best || b.base.score > best.b.base.score || (b.base.score === best.b.base.score && ratio < best.ratio)) best = { a, b, ratio };
  }
  if (best) {
    const d = best.a.skill.score - best.b.base.score;
    const verb = d >= 0.005 ? "scores above" : d > -0.005 ? "matches" : "scores close to";
    return { pre: `${modelName(best.a.model, true)} with skills ${verb} ${modelName(best.b.model, true)} without them (${best.a.skill.score.toFixed(2)} vs ${best.b.base.score.toFixed(2)}), `, em: `at ~${Math.round(best.ratio * 100)}% of the cost.` };
  }
  const gain = [...models].sort((x, y) => y.skill.score - y.base.score - (x.skill.score - x.base.score))[0];
  if (gain && gain.skill.score > gain.base.score) return { pre: `Skills lifted ${modelName(gain.model, true)} from ${gain.base.score.toFixed(2)} to ${gain.skill.score.toFixed(2)}, `, em: `for ${signed(change(gain.base.cost, gain.skill.cost))} cost per run.` };
  return { pre: "Skills did not raise the mean score for any model in this run.", em: "" };
}

const signed = (p) => (p === null ? "n/a" : p > 0 ? `+${p}%` : p < 0 ? `\u2212${-p}%` : "0%");
const usd = (v) => `$${v >= 1 ? v.toFixed(2) : v.toFixed(3)}`;
const arrow = (d, eps = 0.005) => (d > eps ? "\u25B2" : d < -eps ? "\u25BC" : "=");
const dir = (d, eps = 0.005) => (d > eps ? "up" : d < -eps ? "down" : "flat");
const sgn2 = (d) => (Math.abs(d) < 0.005 ? "0.00" : `${d > 0 ? "+" : "\u2212"}${Math.abs(d).toFixed(2)}`);
const pts = (d) => (Math.abs(d) < 0.005 ? "no change" : `${d > 0 ? "+" : "\u2212"}${Math.round(Math.abs(d) * 100)} pts`);

function bars(base, skill, cls = "") {
  const row = (lab, v, kind) => `<div class="pb ${kind}"><span class="pl">${lab}</span><span class="trk"><span class="fill" style="--w:${Math.max(0, Math.min(1, v)).toFixed(4)}"></span></span><span class="pv">${v.toFixed(2)}</span></div>`;
  return `<div class="pbs ${cls}">${row("no skills", base, "b")}${row("with skills", skill, skill < base - 0.005 ? "s down" : "s")}</div>`;
}

function modelCard(m, kinds = {}) {
  const d = m.skill.score - m.base.score;
  const kv = (l, a, b, f) => `<div class="kv-r"><dt>${l}</dt><dd>${f(a)} \u2192 ${f(b)} <span class="chg">${signed(change(a, b))}</span></dd></div>`;
  const label = (t) => `${esc(t.task)}${kinds[t.task]?.skill ? ` <small>${esc(kinds[t.task].skill)}</small>` : ""}`;
  const up = m.tasks.filter((t) => t.skill.score - t.base.score >= 0.05).sort((a, b) => (b.skill.score - b.base.score) - (a.skill.score - a.base.score));
  const down = m.tasks.filter((t) => t.skill.score - t.base.score <= -0.05);
  const flat = m.tasks.filter((t) => Math.abs(t.skill.score - t.base.score) < 0.05);
  const li = (t) => `<li>${label(t)} <b class="${dir(t.skill.score - t.base.score)}">${pts(t.skill.score - t.base.score)}</b> <span>${t.base.score.toFixed(2)} \u2192 ${t.skill.score.toFixed(2)}</span></li>`;
  const allTop = flat.length && flat.every((t) => t.base.score >= 0.995);
  const costLine = m.estimate ? "" : `<p class="wc-cost">Each run cost ${signed(change(m.base.cost, m.skill.cost))} (${usd(m.base.cost)} \u2192 ${usd(m.skill.cost)}), took ${(m.skill.turns - m.base.turns).toFixed(1)} more turns and ${Math.round(m.skill.seconds - m.base.seconds)} s longer.</p>`;
  const what = `<div class="wc"><p class="wc-sum">Scored <b>${m.skill.score.toFixed(2)}</b> of 1.00 with skills vs <b>${m.base.score.toFixed(2)}</b> without: <b class="${dir(d)}">${pts(d)}</b>.</p>${up.length ? `<h4>Improved</h4><ul>${up.map(li).join("")}</ul>` : ""}${down.length ? `<h4>Got worse</h4><ul>${down.map(li).join("")}</ul>` : ""}${flat.length ? `<h4>No change</h4><p class="wc-flat">${flat.map(label).join(", ")}${allTop ? " \u2014 already 1.00 without skills" : ""}</p>` : ""}${costLine}</div>`;
  return `<article class="mcard" data-model="${esc(m.model)}"><h3>${esc(modelName(m.model))}</h3><p class="mn">${m.base.n} runs no skills / ${m.skill.n} runs with skills</p><div class="score2" aria-label="Mean score ${m.base.score.toFixed(2)} without skills, ${m.skill.score.toFixed(2)} with skills"><span>${m.base.score.toFixed(2)}</span><i>\u2192</i><b class="${dir(d)}">${m.skill.score.toFixed(2)}</b><em class="${dir(d)}">${arrow(d)} ${pts(d)}</em></div>${bars(m.base.score, m.skill.score)}<dl class="kv">${kv("Cost per run", m.base.cost, m.skill.cost, usd)}${kv("Turns", m.base.turns, m.skill.turns, (v) => v.toFixed(1))}${kv("Time", m.base.seconds, m.skill.seconds, (v) => `${Math.round(v)} s`)}</dl>${what}${m.estimate ? `<p class="mn est">Cost here is Claude Code's estimate at Anthropic prices, not the provider's bill. DeepSeek actually billed about $0.01 per run (account balance before and after).</p>` : ""}</article>`;
}

function taskCard(t) {
  const rows = t.per.map((c) => {
    const d = c.skill.score - c.base.score;
    const cls = d >= 0.25 ? " win" : d <= -0.25 ? " loss" : "";
    return `<div class="tk-r${cls}" data-model="${esc(c.model)}" data-delta="${d.toFixed(2)}"><span class="tm">${esc(modelName(c.model, true))}</span><div class="tb"><span class="tv">${c.base.score.toFixed(2)} \u2192 ${c.skill.score.toFixed(2)}</span>${bars(c.base.score, c.skill.score, "mini")}</div><span class="td ${dir(d)}">${arrow(d)} ${pts(d)}</span><span class="tc">${signed(change(c.base.cost, c.skill.cost))}</span></div>`;
  }).join("");
  const grader = t.kind === "rubric" ? "rubric graded by Codex" : t.kind === "tests" ? "hidden tests" : "";
  return `<article class="tkcard" data-task="${esc(t.task)}"><h3>${esc(t.task)}</h3><p class="mn">${[t.skill && `skill: ${esc(t.skill)}`, grader].filter(Boolean).join(" / ") || "&nbsp;"}</p><div class="tk-h"><span></span><span>score</span><span>score change</span><span>cost change</span></div>${rows}</article>`;
}

function costPoint(models) {
  const cpp = (s) => (s.score > 0 ? s.cost / s.score : null);
  const cell = (m, arm) => {
    const v = cpp(m[arm]);
    return `<td class="n" data-cpp="${esc(m.model)}|${arm}">${v === null ? "n/a" : usd(v)}</td>`;
  };
  const body = models.map((m) => {
    if (m.estimate) return `<tr><th scope="row">${esc(modelName(m.model))}</th><td class="n" colspan="3">not comparable: estimated at Anthropic prices, billed about $0.01 per run</td></tr>`;
    const a = cpp(m.base), b = cpp(m.skill);
    return `<tr><th scope="row">${esc(modelName(m.model))}</th>${cell(m, "base")}${cell(m, "skill")}<td class="n">${a && b ? signed(change(a, b)) : "n/a"}</td></tr>`;
  }).join("");
  return `<div class="scroll"><table class="cpp"><thead><tr><th>Model</th><th class="n">No skills</th><th class="n">With skills</th><th class="n">Change</th></tr></thead><tbody>${body}</tbody></table></div>`;
}

function methodNote(ev) {
  const kinds = Object.values(ev.kinds);
  const tests = kinds.filter((k) => k.kind === "tests").length;
  const rubric = kinds.filter((k) => k.kind === "rubric").length;
  const graders = kinds.length ? `${tests} tasks are graded by hidden tests and ${rubric} by a rubric graded by Codex.` : "Grader type is not recorded for these tasks.";
  const links = ev.models.map((m) => `<li><b>${esc(modelName(m.model))}</b> ${m.files.map((f) => `<a href="${BLOB_URL}/${esc(f)}">${esc(f.split("/").pop())}</a>`).join(", ")}</li>`).join("");
  return `<p>${ev.fixtures} ${ev.fixtures === 1 ? "fixture" : "fixtures"}, up to ${ev.runsPerArm} ${ev.runsPerArm === 1 ? "run" : "runs"} per arm per task. ${esc(graders)} Each task runs in a throwaway repo, once with no skills and once with the task's skill loaded.</p><p>Results are read from <a href="${RAW_URL}">evals/results</a> in file-name order. When a later round re-ran a model, task and arm, the later round supersedes the earlier one (r2 supersedes r1). Means are per run. Cost is the CLI's own usage report, not an invoice.</p><ul class="raw">${links}</ul>`;
}

function measured(ev) {
  if (!ev || !ev.models.length) return "";
  const h = evalHeadline(ev.models);
  const worse = ev.models.filter((m) => m.skill.score < m.base.score - 0.005).map((m) => {
    const t = [...m.tasks].sort((a, b) => a.skill.score - a.base.score - (b.skill.score - b.base.score))[0];
    return `${modelName(m.model, true)} scored lower with skills (${m.base.score.toFixed(2)} \u2192 ${m.skill.score.toFixed(2)}), mostly on ${t.task} (${t.base.score.toFixed(2)} \u2192 ${t.skill.score.toFixed(2)}).`;
  });
  return `<section class="ch" id="measured"><div class="ch-h"><span class="no">PAIRED EVALS</span><h2>Measured, not claimed</h2></div><p class="ch-d">Does it help, and what does it cost? The same tasks ran twice per model, once without skills and once with them. Every number below is computed from the raw result files.</p><p class="ch-d how"><b>How to read it.</b> A score runs from 0 to 1: the share of hidden tests passed, or the rubric credit an independent grader (Codex) gave. \u201cpts\u201d are score points out of 100, so <b>+18 pts</b> means the mean score rose by 0.18, for example 0.78 \u2192 0.95 (the 0.01 difference is rounding). Cost change is the percent change in dollars per run.</p>
<p class="ev-head">${esc(h.pre)}${h.em ? `<em>${esc(h.em)}</em>` : ""}</p>${worse.map((w) => `<p class="ev-warn">${esc(w)}</p>`).join("")}
<div class="ev-grid">${ev.models.map((m) => modelCard(m, ev.kinds)).join("")}</div>
<div class="panel sub"><h3>Per task</h3><p class="ch-d">Small bars: grey is without skills, colour is with skills. Rows tinted green gained 0.25 or more; red lost 0.25 or more. Tasks are sorted by their biggest gain.</p><div class="tk-grid">${ev.tasks.map(taskCard).join("")}</div></div>
<div class="panel sub"><h3>Cost per score point</h3><p class="ch-d">Mean cost per run divided by mean score. Lower is cheaper for the same quality. It answers whether the extra spend buys anything.</p>${costPoint(ev.models)}</div>
<div class="panel sub method"><h3>Method</h3>${methodNote(ev)}</div></section>`;
}

const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null;
};
const fmtNum = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e4 ? `${Math.round(v / 1e3)}k` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}k` : String(Math.round(v)));
const fmtMs = (ms) => {
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`;
};
const FMT = { tokens: fmtNum, tools: fmtNum, ms: fmtMs };
const NOREC = `<span class="norec">not recorded</span>`;

function costGroup(rows, keyOf, title) {
  const m = new Map();
  for (const r of rows) m.set(keyOf(r), [...(m.get(keyOf(r)) ?? []), r]);
  const body = [...m].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).map(([k, rs]) => {
    const cells = COST_KEYS.map((c) => {
      const v = rs.filter((r) => r[c] !== undefined).map((r) => r[c]);
      return `<td class="n" data-cost="${c}">${v.length ? `${FMT[c](median(v))}<small>${v.length} of ${rs.length}</small>` : NOREC}</td>`;
    }).join("");
    return `<tr><th scope="row">${esc(k)}</th><td class="n">${rs.length}</td>${cells}</tr>`;
  }).join("");
  return `<div class="scroll"><table class="cpp costt"><thead><tr><th>${title}</th><th class="n">Runs</th><th class="n">Tokens / run</th><th class="n">Tool calls / run</th><th class="n">Duration / run</th></tr></thead><tbody>${body}</tbody></table></div>`;
}

function fieldCost(rows) {
  if (!rows.length) return "";
  return `<div class="panel sub"><h3>Cost per run</h3><p class="ch-d">Median of the runs that recorded it. "2 of 5" means 2 of 5 entries have the value. Old entries did not record cost, so they are left out, never counted as 0.</p>${costGroup(rows, (r) => r.agent || "(unknown)", "Agent")}${costGroup(rows, (r) => r.model || "(unknown)", "Model")}</div>`;
}

function cardCost(r) {
  const parts = COST_KEYS.filter((c) => r[c] !== undefined);
  if (!parts.length) return `<div class="cost none">cost ${NOREC}</div>`;
  const lab = { tokens: "tokens", tools: "tool calls", ms: "duration" };
  return `<div class="cost">${COST_KEYS.map((c) => `<span>${lab[c]} ${r[c] !== undefined ? `<b>${FMT[c](r[c])}</b>` : NOREC}</span>`).join("")}</div>`;
}

const blank = () => ({ helped: 0, neutral: 0, hurt: 0 });
const total = (t) => t.helped + t.neutral + t.hurt;

function group(rows, keys) {
  const m = new Map();
  for (const r of rows) for (const k of keys(r)) {
    const t = m.get(k) ?? blank();
    t[r.verdict] += 1;
    m.set(k, t);
  }
  return [...m].sort((a, b) => total(b[1]) - total(a[1]) || a[0].localeCompare(b[0]));
}

function weekStart(date) {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function weeks(rows) {
  const m = new Map();
  for (const r of rows) {
    const w = weekStart(r.date);
    if (!w) continue;
    const t = m.get(w) ?? blank();
    t[r.verdict] += 1;
    m.set(w, t);
  }
  if (!m.size) return [];
  const keys = [...m.keys()].sort();
  const out = [];
  for (let d = new Date(`${keys[0]}T00:00:00Z`); d.toISOString().slice(0, 10) <= keys.at(-1); d.setUTCDate(d.getUTCDate() + 7)) {
    const k = d.toISOString().slice(0, 10);
    out.push([k, m.get(k) ?? blank()]);
  }
  return out;
}

export function recurringAsks(rows) {
  const docs = rows.map((r) => r.missing.trim()).filter((s) => s && !NONE.test(s));
  const counts = new Map();
  for (const doc of docs) {
    const words = doc.toLowerCase().replace(/[’']/g, "").split(/[^a-z0-9]+/).filter(Boolean);
    const seen = new Set();
    for (let n = 1; n <= 3; n++) for (let i = 0; i + n <= words.length; i++) {
      const g = words.slice(i, i + n);
      const edge = (w) => !STOP.has(w) && w.length > 2;
      if (!edge(g[0]) || !edge(g[n - 1])) continue;
      seen.add(g.join(" "));
    }
    for (const g of seen) counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  const cand = [...counts].filter(([, c]) => c >= 2);
  const solo = ([g]) => !g.includes(" ");
  const phrases = cand.filter((e) => !solo(e));
  const kept = cand.filter((e) => {
    const [g, c] = e;
    if (cand.some(([h, k]) => h !== g && k === c && h.includes(g))) return false;
    return !solo(e) || (g.length >= 4 && !GENERIC.has(g) && !phrases.some(([h]) => h.split(" ").includes(g)));
  });
  kept.sort((a, b) => b[0].split(" ").length - a[0].split(" ").length || b[1] - a[1] || a[0].localeCompare(b[0]));
  return { docs: docs.length, asks: kept.slice(0, 12) };
}

const label = (v) => ({ helped: "helped", neutral: "neutral", hurt: "hurt" })[v];

function shape(v, x, y, r) {
  if (v === "helped") return `<circle class="${v}" cx="${x}" cy="${y}" r="${r}"/>`;
  if (v === "neutral") return `<path class="${v}" d="M${x} ${y - r * 1.2}L${x + r * 1.2} ${y}L${x} ${y + r * 1.2}L${x - r * 1.2} ${y}Z"/>`;
  return `<path class="${v}" d="M${x} ${y - r * 1.15}L${x + r * 1.1} ${y + r * 0.9}L${x - r * 1.1} ${y + r * 0.9}Z"/>`;
}

const glyph = (v, s = 12) => `<svg class="gl" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true">${shape(v, s / 2, s / 2, s * 0.36)}</svg>`;
const legend = () => `<ul class="legend">${VERDICTS.map((v) => `<li>${glyph(v)}${label(v)}</li>`).join("")}</ul>`;

function tableView(head, body) {
  return `<details class="tv"><summary>Table view</summary><div class="scroll"><table><thead><tr>${head.map((h, i) => `<th${i ? ' class="n"' : ""}>${esc(h)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c, i) => `<td${i ? ' class="n"' : ""}>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>`;
}

function polar(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function ring(rows) {
  const N = rows.length;
  if (!N) return "";
  const order = VERDICTS.flatMap((v) => rows.filter((r) => r.verdict === v));
  const step = 360 / N;
  const gap = N > 1 ? Math.min(3, step * 0.2) : 0;
  const arcs = order.map((r, i) => {
    const a0 = -90 + i * step + gap / 2;
    const a1 = -90 + (i + 1) * step - gap / 2 - (N === 1 ? 0.01 : 0);
    const [x0, y0] = polar(200, 200, 150, a0);
    const [x1, y1] = polar(200, 200, 150, a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `<path class="arc ${r.verdict}" style="--i:${i}" pathLength="1" d="M${x0.toFixed(2)} ${y0.toFixed(2)}A150 150 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}"><title>${esc(r.task || r.agent)}: ${r.verdict}</title></path>`;
  });
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const [x0, y0] = polar(200, 200, 186, i * 6);
    const [x1, y1] = polar(200, 200, i % 5 === 0 ? 174 : 180, i * 6);
    return `M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }).join("");
  const skilled = order.map((r, i) => {
    const a0 = -90 + i * step + gap / 2;
    const a1 = -90 + (i + 1) * step - gap / 2 - (N === 1 ? 0.01 : 0);
    const [x0, y0] = polar(200, 200, 118, a0);
    const [x1, y1] = polar(200, 200, 118, a1);
    return `<path class="inner ${r.skills.length ? "on" : ""}" style="--i:${i}" pathLength="1" d="M${x0.toFixed(2)} ${y0.toFixed(2)}A118 118 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}"/>`;
  });
  return `<figure class="dial"><svg viewBox="0 0 400 400" role="img" aria-label="One arc per run, ${VERDICTS.map((v) => `${rows.filter((r) => r.verdict === v).length} ${v}`).join(", ")}"><path class="ticks" d="${ticks}"/>${arcs.join("")}${skilled.join("")}<text class="big" x="200" y="214" text-anchor="middle">${N}</text><text class="cap" x="200" y="246" text-anchor="middle">${N === 1 ? "RUN" : "RUNS"} LOGGED</text></svg><figcaption>Outer ring: one arc per run, by verdict. Inner ring: solid if the run loaded a skill.</figcaption></figure>`;
}

function heroText(N, w, wh, wn, wu) {
  if (!N) return { head: "No runs recorded yet.", em: "", sub: "Log the first entry to start the recorder." };
  if (!w) return { head: "No run has loaded a skill yet.", em: "loaded a skill", sub: `${N} ${N === 1 ? "run is" : "runs are"} logged. None used a skill, so there is nothing to judge.` };
  if (wh === w) return { head: w === 1 ? "The one run that loaded a skill said it helped." : "Every run that loaded a skill said it helped.", em: "said it helped", sub: null };
  if (!wh) return { head: `No run that loaded a skill said it helped.`, em: "No run", sub: null };
  return { head: `${wh} of ${w} runs that loaded a skill said it helped.`, em: `${wh} of ${w}`, sub: null };
}

function headline(h) {
  const t = esc(h.head);
  const e = esc(h.em);
  return e && t.includes(e) ? t.replace(e, `<em>${e}</em>`) : t;
}

function split(t, n, cls) {
  const segs = VERDICTS.filter((v) => t[v]).map((v) => `<span class="seg ${v}" style="flex:${t[v]}" title="${t[v]} ${v}"></span>`).join("");
  return `<div class="cmp ${cls}"><div class="cmp-h"><b>${n}</b> ${cls === "with" ? (n === 1 ? "run loaded a skill" : "runs loaded a skill") : (n === 1 ? "run loaded none" : "runs loaded none")}</div><div class="cmp-bar" role="img" aria-label="${VERDICTS.map((v) => `${t[v]} ${v}`).join(", ")}">${segs || '<span class="seg empty" style="flex:1"></span>'}</div><div class="cmp-f">${VERDICTS.map((v) => `<span>${glyph(v, 10)}<b>${t[v]}</b> ${v}</span>`).join("")}</div></div>`;
}

function skillBars(items) {
  const max = Math.max(1, ...items.map(([, t]) => total(t)));
  return `<div class="sk">${items.map(([label, t], r) => {
    let x = 0;
    const segs = VERDICTS.filter((v) => t[v]).map((v, k) => {
      const w = (100 * t[v]) / max;
      const out = `<g class="bseg" style="--i:${r * 3 + k}"><rect class="${v}" x="${x.toFixed(3)}%" y="0" width="${w.toFixed(3)}%" height="34" rx="3"><title>${esc(label)}: ${t[v]} ${v}</title></rect>${w >= 5 ? `<text class="on" x="${(x + w / 2).toFixed(3)}%" y="22" text-anchor="middle">${t[v]}</text>` : ""}</g>`;
      x += w;
      return out;
    });
    return `<div class="sk-row" data-skill="${esc(label)}"><div class="sk-h"><div class="hlabel" title="${esc(label)}">${esc(label)}</div><div class="htotal">${total(t)} ${total(t) === 1 ? "run" : "runs"}</div></div><svg class="track" height="34" role="img" aria-label="${esc(label)}: ${VERDICTS.map((v) => `${t[v]} ${v}`).join(", ")}"><rect class="rail" x="0" y="0" width="100%" height="34" rx="3"/>${segs.join("")}</svg><div class="sk-f">${VERDICTS.filter((v) => t[v]).map((v) => `<span>${glyph(v, 10)}${t[v]} ${v}</span>`).join("")}</div></div>`;
  }).join("")}</div>`;
}

function river(rows) {
  const N = rows.length;
  if (!N) return `<p class="muted">No entries.</p>`;
  const L = { helped: 44, neutral: 110, hurt: 176 };
  const padL = 96, padR = 44, W = 960, H = 250;
  const step = N > 1 ? Math.max(56, (W - padL - padR) / (N - 1)) : 0;
  const width = N > 1 ? padL + padR + step * (N - 1) : W;
  const pts = rows.map((r, i) => [N > 1 ? padL + i * step : width / 2, L[r.verdict]]);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < N; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += `C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
  }
  const lanes = VERDICTS.map((v) => `<line class="lane" x1="${padL - 20}" x2="${width - padR + 20}" y1="${L[v]}" y2="${L[v]}"/><text class="lane-t" x="${padL - 32}" y="${L[v] + 4}" text-anchor="end">${v}</text>`).join("");
  let prev = null;
  const dates = rows.map((r, i) => {
    if (r.date === prev) return "";
    prev = r.date;
    return `<line class="tick" x1="${pts[i][0]}" x2="${pts[i][0]}" y1="206" y2="214"/><text class="date-t" x="${pts[i][0]}" y="232" text-anchor="${i === 0 && N > 1 ? "start" : "middle"}">${esc(r.date || "undated")}</text>`;
  }).join("");
  const marks = rows.map((r, i) => `<a class="mk" href="#run-${i}" style="--i:${i}" data-date="${esc(r.date)}" data-verdict="${r.verdict}" data-agent="${esc(r.agent)}" data-task="${esc(r.task)}" aria-label="${esc(r.date)}, ${r.verdict}, ${esc(r.agent)}: ${esc(r.task)}"><title>${esc(r.task)}</title><circle class="hit" cx="${pts[i][0]}" cy="${pts[i][1]}" r="22"/>${shape(r.verdict, pts[i][0], pts[i][1], 11)}</a>`).join("");
  return `<div class="scroll river-w"><svg class="river" style="min-width:${Math.min(width, Math.max(N * 64, 560))}px" viewBox="0 0 ${width} ${H}" role="group" aria-label="Runs in log order, placed by verdict">${lanes}<path class="flow wide" d="${d}"/><path class="flow" pathLength="1" d="${d}"/>${dates}${marks}</svg></div><p class="swipe">Swipe sideways to see every run.</p><div class="peek" id="peek" role="status" aria-live="polite"><span class="peek-h">Hover or focus a mark to read its task.</span></div>`;
}

function matrix(rows) {
  const agents = group(rows, (r) => [r.agent || "(unknown)"]).map(([k]) => k);
  const models = group(rows, (r) => [r.model || "(unknown)"]).map(([k]) => k);
  if (!agents.length) return "";
  const cell = new Map();
  for (const r of rows) {
    const k = `${r.agent || "(unknown)"}\u0000${r.model || "(unknown)"}`;
    cell.set(k, [...(cell.get(k) ?? []), r.verdict]);
  }
  const max = Math.max(1, ...[...cell.values()].map((v) => v.length));
  const head = models.map((m) => `<div class="mh" title="${esc(m)}">${esc(m)}</div>`).join("");
  const body = agents.map((a) => {
    const n = rows.filter((r) => (r.agent || "(unknown)") === a).length;
    const cells = models.map((m) => {
      const v = cell.get(`${a}\u0000${m}`) ?? [];
      if (!v.length) return `<div class="mc empty" aria-label="${esc(a)} on ${esc(m)}: no runs"><span>·</span></div>`;
      const c = VERDICTS.map((x) => `${v.filter((y) => y === x).length} ${x}`).join(", ");
      const dots = VERDICTS.flatMap((x) => v.filter((y) => y === x).map(() => x)).map((x) => glyph(x, 16)).join("");
      return `<div class="mc" style="--a:${(0.05 + (0.2 * v.length) / max).toFixed(2)}" role="img" aria-label="${esc(a)} on ${esc(m)}: ${c}"><b>${v.length}</b><div class="dots">${dots}</div></div>`;
    }).join("");
    return `<div class="mr" title="${esc(a)}"><span>${esc(a)}</span><i>${n} ${n === 1 ? "run" : "runs"}</i></div>${cells}`;
  }).join("");
  return `<div class="scroll"><div class="matrix" style="--cols:${models.length}"><div class="mh corner">agent \\ model</div>${head}${body}</div></div>`;
}

function cloud(asks) {
  if (!asks.asks.length) return `<p class="muted">${asks.docs < 2 ? 'Too few entries with a "missing" note.' : "No phrase repeats across entries yet."}</p>`;
  const max = Math.max(...asks.asks.map(([, c]) => c));
  const min = Math.min(...asks.asks.map(([, c]) => c));
  return `<ul class="cloud">${asks.asks.map(([g, c], i) => {
    const t = max === min ? 0.5 : (c - min) / (max - min);
    return `<li style="--s:${(1 + t * 1.6).toFixed(2)};--i:${i}"><span>${esc(g)}</span><i>${c} of ${asks.docs}</i></li>`;
  }).join("")}</ul>`;
}

function quote(kind, text) {
  const none = !text.trim() || NONE.test(text.trim());
  return `<blockquote class="q ${kind}${none ? " none" : ""}"><span class="ql">${kind === "helped" ? "Helped" : kind === "hindered" ? "Got in the way" : "Missing"}</span><p>${esc(none ? (text.trim() || "Nothing recorded.") : text)}</p></blockquote>`;
}

function card(r, i) {
  return `<article class="run ${r.verdict}" id="run-${i}" data-verdict="${r.verdict}" data-agent="${esc(r.agent)}" data-skills="${esc(r.skills.length ? r.skills.join("|") : "(none)")}"><header><div class="run-top"><span class="badge ${r.verdict}">${glyph(r.verdict, 14)}${label(r.verdict)}</span><time>${esc(r.date)}</time></div><h3>${esc(r.task)}</h3><div class="meta"><span>${esc(r.agent)}</span><span>${esc(r.model)}</span><span>${esc(r.harness)}</span></div><div class="skills">${(r.skills.length ? r.skills : ["(none)"]).map((s) => `<span class="chip-s${s === "(none)" ? " nn" : ""}">${esc(s)}</span>`).join("")}</div></header>${quote("helped", r.helped)}${quote("hindered", r.hindered)}${quote("missing", r.missing)}${cardCost(r)}</article>`;
}

const CSS = `
:root{color-scheme:dark;--bg:#0a0c11;--bg2:#10141c;--panel:#131822;--text:#eae6da;--muted:#8d95a3;--line:#252c39;--helped:#4fd8a0;--neutral:#f0b95a;--hurt:#ff6b5f;--on:#08110d;--accent:#e9d8a6;--glow:rgba(79,216,160,.10);--glow2:rgba(240,185,90,.07);--grid:rgba(234,230,218,.035);--disp:"Instrument Serif","Iowan Old Style","Palatino Linotype",Georgia,serif;--sans:"Hanken Grotesk","Helvetica Neue",Arial,sans-serif;--mono:"JetBrains Mono",ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace}
@media (prefers-color-scheme:light){:root{color-scheme:light;--bg:#f2eee4;--bg2:#e9e4d6;--panel:#fbf8f0;--text:#15171d;--muted:#5d6472;--line:#d3ccb9;--helped:#0b8a5c;--neutral:#a3670a;--hurt:#c1352a;--on:#fbf8f0;--accent:#3a3320;--glow:rgba(11,138,92,.10);--glow2:rgba(163,103,10,.08);--grid:rgba(21,23,29,.05)}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:400 16px/1.55 var(--sans);overflow-x:hidden;position:relative}
body::before{content:"";position:fixed;inset:0;z-index:-1;background:radial-gradient(60% 50% at 85% 0%,var(--glow),transparent 70%),radial-gradient(50% 40% at 0% 40%,var(--glow2),transparent 70%),linear-gradient(var(--grid) 1px,transparent 1px) 0 0/48px 48px,linear-gradient(90deg,var(--grid) 1px,transparent 1px) 0 0/48px 48px,var(--bg)}
main{max-width:1180px;margin:0 auto;padding:0 clamp(18px,4vw,40px) 40px}
h1,h2,h3{font-weight:400;margin:0}
.muted{color:var(--muted)}
.mono,.kicker,.legend,.lane-t,.date-t{font-family:var(--mono)}
.bar{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:20px 0;font:500 .72rem/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.bar b{color:var(--text);font-weight:600}
.rec{display:inline-flex;align-items:center;gap:8px}.rec::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--hurt)}
.hero{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr);gap:clamp(20px,4vw,56px);align-items:center;padding:clamp(20px,5vw,64px) 0 clamp(24px,4vw,48px)}
.hero h1{font-family:var(--disp);font-size:clamp(2.7rem,8.4vw,7.2rem);line-height:.94;letter-spacing:-.02em;text-wrap:balance}
.hero h1 em{font-style:italic;color:var(--helped);position:relative}
.hero .sub{max-width:34rem;margin:22px 0 0;color:var(--muted);font-size:1.02rem}
.kicker{font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:0 0 18px}
.dial{margin:0;position:relative}
.dial svg{width:100%;height:auto;max-width:440px;margin:0 auto;display:block;overflow:visible}
.dial figcaption{font:.72rem/1.5 var(--mono);color:var(--muted);text-align:center;max-width:26rem;margin:10px auto 0}
.arc{fill:none;stroke-width:26;stroke-dasharray:1;stroke-dashoffset:0;animation:draw 1.5s cubic-bezier(.3,.7,.2,1) backwards;animation-delay:calc(var(--i)*110ms + 200ms)}
.arc.helped{stroke:var(--helped)}.arc.neutral{stroke:var(--neutral)}.arc.hurt{stroke:var(--hurt)}
.inner{fill:none;stroke-width:6;stroke:var(--line);stroke-dasharray:1;animation:draw 1.2s ease backwards;animation-delay:calc(var(--i)*110ms + 500ms)}.inner.on{stroke:var(--text)}
.ticks{fill:none;stroke:var(--muted);stroke-width:1;opacity:.5;animation:fade 1.4s ease backwards}
.dial .big{font:400 7.6rem/1 var(--disp);fill:var(--text);font-size:110px}
.dial .cap{font:500 12px var(--mono);letter-spacing:.18em;fill:var(--muted)}
.facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden;margin:8px 0 0}
.stat{background:var(--panel);padding:18px 20px}
.stat b{display:block;font:400 clamp(2.2rem,4.4vw,3.4rem)/1 var(--disp);font-variant-numeric:tabular-nums}
.stat span{display:flex;align-items:center;gap:7px;margin-top:8px;color:var(--muted);font:.74rem/1.35 var(--mono);letter-spacing:.06em;text-transform:uppercase}
.stat.helped b{color:var(--helped)}.stat.neutral b{color:var(--neutral)}.stat.hurt b{color:var(--hurt)}
.compare{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px}
.cmp{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px 20px}
.cmp-h{font-size:.95rem;color:var(--muted)}.cmp-h b{font:400 2rem/1 var(--disp);color:var(--text);margin-right:4px}
.cmp-bar{display:flex;gap:3px;height:16px;margin:14px 0 12px;transform-origin:left;animation:grow 1.2s cubic-bezier(.3,.7,.2,1) backwards .5s}
.seg{border-radius:3px;min-width:6px}.seg.helped{background:var(--helped)}.seg.neutral{background:var(--neutral)}.seg.hurt{background:var(--hurt)}.seg.empty{background:var(--line)}
.cmp-f{display:flex;flex-wrap:wrap;gap:6px 16px;font:.76rem/1.3 var(--mono);color:var(--muted)}.cmp-f span{display:inline-flex;align-items:center;gap:6px}.cmp-f b{color:var(--text)}
section.ch{margin-top:clamp(48px,8vw,104px)}
.ch-h{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;margin-bottom:8px}
.ch-h .no{font:500 .72rem var(--mono);letter-spacing:.16em;color:var(--muted);text-transform:uppercase}
.ch-h h2{font:400 clamp(2rem,5vw,3.6rem)/1 var(--disp);letter-spacing:-.01em}
.ch-d{color:var(--muted);max-width:42rem;margin:0 0 26px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:clamp(16px,3vw,32px);min-width:0}
.legend{display:flex;flex-wrap:wrap;gap:6px 18px;list-style:none;padding:0;margin:0 0 18px;font-size:.74rem;color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
.legend li{display:inline-flex;align-items:center;gap:7px}
.gl{flex:none;display:inline-block;vertical-align:middle}
.helped{fill:var(--helped)}.neutral{fill:var(--neutral)}.hurt{fill:var(--hurt)}
svg{overflow:visible}
.sk{display:grid;gap:26px}
.sk-h{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:8px}
.hlabel{font:400 clamp(1.5rem,3vw,2.2rem)/1.1 var(--disp);overflow-wrap:anywhere}
.htotal{font:.74rem var(--mono);color:var(--muted);white-space:nowrap;letter-spacing:.06em;text-transform:uppercase}
.track{display:block;width:100%}
.rail{fill:var(--line);opacity:.45}
.bseg{transform-box:fill-box;transform-origin:left center;animation:grow 1.2s cubic-bezier(.3,.7,.2,1) backwards;animation-delay:calc(var(--i)*140ms + 250ms)}
.track text.on{fill:var(--on);font:600 14px var(--mono)}
.sk-f{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:8px;font:.74rem var(--mono);color:var(--muted)}.sk-f span{display:inline-flex;align-items:center;gap:6px}
.note{font:.74rem/1.5 var(--mono);color:var(--muted);margin:22px 0 0}
details.tv{margin-top:18px}summary{cursor:pointer;color:var(--accent);font:.78rem var(--mono);letter-spacing:.06em}
.scroll{overflow-x:auto;max-width:100%}
table{border-collapse:collapse;width:100%;font-size:.86rem;margin-top:10px}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)}th{color:var(--muted);font:500 .72rem var(--mono);text-transform:uppercase}.n{text-align:right;font-variant-numeric:tabular-nums}
.river{display:block;width:100%;height:auto}
.lane{stroke:var(--line);stroke-width:1;stroke-dasharray:2 6}
.lane-t{font-size:12px;fill:var(--muted);letter-spacing:.1em;text-transform:uppercase}
.date-t{font-size:12px;fill:var(--muted)}.tick{stroke:var(--muted);stroke-width:1}
.flow{fill:none;stroke:var(--muted);stroke-width:2.5;stroke-linecap:round;stroke-dasharray:1;animation:draw 2.2s cubic-bezier(.3,.7,.2,1) backwards .3s}
.flow.wide{stroke:var(--muted);stroke-width:26;opacity:.10;stroke-dasharray:none;animation:fade 2s ease backwards .6s}
.mk{cursor:pointer;outline:none}
.mk .hit{fill:transparent}
.mk path,.mk circle:not(.hit){transform-box:fill-box;transform-origin:center;animation:pop .7s cubic-bezier(.3,.9,.3,1.2) backwards;animation-delay:calc(var(--i)*130ms + 500ms);transition:transform .25s ease}
.mk:hover path,.mk:focus-visible path,.mk:hover circle:not(.hit),.mk:focus-visible circle:not(.hit){transform:scale(1.35)}
.mk:focus-visible .hit{stroke:var(--text);stroke-width:2;fill:none}
.swipe{display:none;font:.72rem var(--mono);color:var(--muted);margin:8px 0 0}
.peek{margin-top:14px;padding:14px 16px;border:1px solid var(--line);border-radius:10px;background:var(--bg2);min-height:4.4em;font-size:.95rem}
.peek-h{color:var(--muted);font:.8rem var(--mono)}
.peek b{font:400 1.35rem/1.25 var(--disp);display:block;margin-top:4px}
.peek .pm{font:.74rem var(--mono);color:var(--muted);display:flex;flex-wrap:wrap;gap:4px 14px;align-items:center;letter-spacing:.04em;text-transform:uppercase}
.matrix{display:grid;grid-template-columns:minmax(120px,.9fr) repeat(var(--cols),minmax(104px,1fr));gap:6px;min-width:min-content}
.mh{font:500 .72rem/1.3 var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.06em;padding:0 4px 8px;align-self:end;overflow-wrap:anywhere}
.mr{display:flex;flex-direction:column;justify-content:center;font:400 1.3rem/1.15 var(--disp);padding-right:8px;overflow-wrap:anywhere}.mr i{font:normal .7rem var(--mono);color:var(--muted);margin-top:4px;letter-spacing:.06em}
.mc{border-radius:10px;padding:12px;min-height:84px;background:color-mix(in srgb,var(--accent) calc(var(--a)*100%),transparent);border:1px solid var(--line);animation:fade 1s ease backwards .5s}
.mc b{font:400 2rem/1 var(--disp);display:block}
.mc .dots{display:flex;flex-wrap:wrap;gap:3px;margin-top:8px}
.mc.empty{background:none;border-style:dashed;display:grid;place-items:center;color:var(--muted);opacity:.6}
.cloud{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px 28px;align-items:baseline}
.cloud li{font-family:var(--disp);font-size:calc(1.5rem*var(--s));line-height:1.1;animation:rise .9s ease backwards;animation-delay:calc(var(--i)*90ms + 300ms);overflow-wrap:anywhere}
.cloud li:nth-child(3n+2){font-style:italic}
.cloud i{font:normal .72rem var(--mono);color:var(--muted);margin-left:8px;letter-spacing:.04em;white-space:nowrap}
.filters{display:grid;gap:14px;margin-bottom:22px}
input[type=search]{width:100%;padding:14px 16px;font:inherit;color:var(--text);background:var(--panel);border:1px solid var(--line);border-radius:12px}
.fg{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.fg>span{font:500 .7rem var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);min-width:5.4rem}
.chip{font:.78rem var(--mono);color:var(--text);background:transparent;border:1px solid var(--line);border-radius:999px;padding:6px 12px;cursor:pointer;display:inline-flex;align-items:center;gap:7px}
.chip:hover{border-color:var(--muted)}
.chip[aria-pressed=true]{background:var(--text);color:var(--bg);border-color:var(--text)}
.chip[aria-pressed=true] .gl *{fill:var(--bg)}
.clear{font:.78rem var(--mono);color:var(--accent);background:none;border:0;cursor:pointer;text-decoration:underline;padding:6px}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
#count{font:.76rem var(--mono);color:var(--muted);margin:0 0 16px}
.runs{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,440px),1fr));gap:18px}
.run{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:22px;display:flex;flex-direction:column;gap:14px;min-width:0;border-top:3px solid var(--line);scroll-margin-top:24px}
.run.helped{border-top-color:var(--helped)}.run.neutral{border-top-color:var(--neutral)}.run.hurt{border-top-color:var(--hurt)}
.run:target{outline:2px solid var(--accent);outline-offset:3px}
.run[hidden]{display:none}
.run-top{display:flex;justify-content:space-between;align-items:center;gap:10px;font:.74rem var(--mono);color:var(--muted)}
.badge{display:inline-flex;align-items:center;gap:7px;font:600 .74rem var(--mono);letter-spacing:.1em;text-transform:uppercase;white-space:nowrap}
.badge.helped{color:var(--helped)}.badge.neutral{color:var(--neutral)}.badge.hurt{color:var(--hurt)}
.run h3{font:400 1.7rem/1.12 var(--disp);margin-top:10px;overflow-wrap:anywhere}
.meta{display:flex;flex-wrap:wrap;gap:4px 12px;font:.74rem var(--mono);color:var(--muted);margin-top:8px}
.meta span+span::before{content:"/";margin-right:12px;opacity:.5}
.skills{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.chip-s{font:.72rem var(--mono);border:1px solid var(--text);border-radius:6px;padding:2px 8px}.chip-s.nn{border-style:dashed;border-color:var(--muted);color:var(--muted)}
.q{margin:0;padding:2px 0 2px 16px;border-left:2px solid var(--line);position:relative}
.q .ql{display:block;font:500 .68rem var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.q p{margin:0;font:400 1.08rem/1.5 var(--disp);overflow-wrap:anywhere}
.q.helped{border-left-color:var(--helped)}.q.hindered{border-left-color:var(--hurt)}.q.missing{border-left-color:var(--neutral)}
.q.none p{color:var(--muted);font-style:italic}
.empty-s{display:none;padding:40px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:16px}
footer{margin-top:clamp(56px,9vw,120px);border-top:1px solid var(--line);padding:32px 0 8px;display:grid;grid-template-columns:1.3fr 1fr;gap:28px}
footer h2{font:400 1.8rem/1.1 var(--disp);margin-bottom:12px}
footer pre{margin:0;padding:16px;background:var(--panel);border:1px solid var(--line);border-radius:12px;font:.78rem/1.6 var(--mono);white-space:pre-wrap;overflow-wrap:anywhere}
footer p{margin:0 0 10px;color:var(--muted)}
footer a{color:var(--accent)}
.gen{font:.72rem var(--mono);color:var(--muted)}
.ev-head{font:400 clamp(1.5rem,3.2vw,2.4rem)/1.2 var(--disp);margin:0 0 22px;max-width:52rem;text-wrap:balance}.ev-head em{color:var(--helped)}
.ev-warn{font:.8rem/1.5 var(--mono);color:var(--hurt);margin:-8px 0 20px}
.ev-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px}
.mcard,.tkcard{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:22px;min-width:0}
.mcard h3{font:400 2rem/1.1 var(--disp)}.wc{margin-top:16px;border-top:1px dashed var(--line);padding-top:14px;font-size:.86rem}.wc h4{font:600 .66rem var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:12px 0 6px}.wc ul{list-style:none;margin:0;padding:0;display:grid;gap:4px}.wc li{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:baseline}.wc li small,.wc-flat small{font:.66rem var(--mono);color:var(--muted)}.wc li span{font:.7rem var(--mono);color:var(--muted)}.wc-sum{margin:0}.wc-flat{margin:0;color:var(--muted)}.wc-cost{margin:12px 0 0;color:var(--muted)}.wc .up{color:var(--helped)}.wc .down{color:var(--hurt)}.how{border-left:2px solid var(--line);padding-left:12px}.tkcard h3{font:400 1.5rem/1.15 var(--disp);overflow-wrap:anywhere}
.mn{font:.72rem/1.4 var(--mono);color:var(--muted);margin:6px 0 14px;letter-spacing:.04em}
.score2{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px 12px;font:400 clamp(2.4rem,5vw,3.4rem)/1 var(--disp);font-variant-numeric:tabular-nums}
.score2 span{color:var(--muted)}.score2 i{font-style:normal;color:var(--muted);font-size:.6em}
.up{color:var(--helped)}.down{color:var(--hurt)}.flat{color:var(--muted)}
.score2 em{font:600 .78rem var(--mono);font-style:normal;letter-spacing:.06em}
.pbs{display:grid;gap:8px;margin:16px 0 4px}
.pb{display:grid;grid-template-columns:5.6rem minmax(0,1fr) 2.6rem;gap:10px;align-items:center;font:.72rem var(--mono);color:var(--muted)}
.pv{text-align:right;color:var(--text);font-variant-numeric:tabular-nums}
.trk{display:block;height:14px;background:color-mix(in srgb,var(--line) 55%,transparent);border-radius:3px;overflow:hidden}
.fill{display:block;height:100%;width:100%;border-radius:3px;transform:scaleX(var(--w));transform-origin:left center;animation:barin 1.1s cubic-bezier(.3,.7,.2,1) backwards .3s}
.pb.b .fill{background:var(--muted)}.pb.s .fill{background:var(--helped)}.pb.s.down .fill{background:var(--hurt)}
.pbs.mini{gap:3px;margin:4px 0 0}.pbs.mini .pb{grid-template-columns:minmax(0,1fr);}.pbs.mini .pl,.pbs.mini .pv{display:none}.pbs.mini .trk{height:7px}
.kv{margin:18px 0 0;display:grid;gap:0}
.kv-r{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:8px 0;border-top:1px solid var(--line);font:.78rem var(--mono)}
.kv dt{color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-size:.7rem}.kv dd{margin:0;font-variant-numeric:tabular-nums}.chg{color:var(--neutral);font-weight:600;margin-left:6px}
.panel.sub{margin-top:18px}.panel.sub h3{font:400 1.7rem/1.1 var(--disp);margin-bottom:6px}
.tk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,360px),1fr));gap:14px}
.tkcard{padding:18px;background:var(--bg2)}
.tk-h,.tk-r{display:grid;grid-template-columns:4.4rem minmax(0,1fr) 4.2rem 3rem;gap:8px;align-items:center}
.tk-h{font:.62rem/1.2 var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.05em;padding:0 6px 6px}.tk-h span:nth-child(n+3){text-align:right}
.tk-r{padding:8px 6px;border-radius:8px;border-top:1px solid var(--line);font:.74rem var(--mono)}
.tk-r.win{background:color-mix(in srgb,var(--helped) 14%,transparent)}.tk-r.loss{background:color-mix(in srgb,var(--hurt) 14%,transparent)}
.tk-r .tv{white-space:nowrap;color:var(--muted);font-variant-numeric:tabular-nums}.tk-r .td{text-align:right;font-weight:600;white-space:nowrap}.tk-r .tc{text-align:right;color:var(--neutral)}.tk-r .tm{overflow-wrap:anywhere}
.tk-r.win .td{font-size:.86rem}
table.cpp{margin-top:6px}table.cpp th[scope=row]{font:400 1.1rem var(--disp);text-transform:none;color:var(--text)}
.costt{margin-top:14px}.costt small{display:block;font:.64rem var(--mono);color:var(--muted)}
.norec{font:italic .74rem var(--mono);color:var(--muted)}
.cost{display:flex;flex-wrap:wrap;gap:4px 16px;font:.72rem var(--mono);color:var(--muted);border-top:1px dashed var(--line);padding-top:10px}.cost b{color:var(--text);font-weight:500}
.method p{margin:0 0 10px;color:var(--muted);max-width:48rem}.method a{color:var(--accent)}.raw{margin:0;padding:0;list-style:none;font:.76rem/1.9 var(--mono)}.raw a{margin-right:8px;overflow-wrap:anywhere}
@keyframes barin{from{transform:scaleX(0)}}
@keyframes draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes rise{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
@media (max-width:820px){.hero{grid-template-columns:1fr}.dial svg{max-width:300px}.compare{grid-template-columns:1fr}footer{grid-template-columns:1fr}.facts{grid-template-columns:1fr 1fr}}
@media (max-width:820px){.swipe{display:block}}
@media (max-width:520px){.tkcard,.mcard{padding:16px}.tk-h,.tk-r{grid-template-columns:3.4rem minmax(0,1fr) 3.9rem 2.7rem;gap:6px}.tk-r{padding:8px 4px;font-size:.68rem}.pb{grid-template-columns:5rem minmax(0,1fr) 2.4rem}.bar span:last-child{display:none}.hero h1{font-size:clamp(2.5rem,13.5vw,3.6rem)}.fg>span{width:100%}.run{padding:18px}.mc b{font-size:1.7rem}.cloud{gap:6px 18px}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
`;

const JS = `
(()=>{
const cards=[...document.querySelectorAll(".run")],q=document.getElementById("q"),c=document.getElementById("count"),none=document.getElementById("none"),clr=document.getElementById("clear");
const sel={verdict:new Set(),skill:new Set(),agent:new Set()};
function apply(){const s=q.value.toLowerCase().trim();let n=0;for(const r of cards){const sk=r.dataset.skills.split("|");const ok=(!s||r.textContent.toLowerCase().includes(s))&&(!sel.verdict.size||sel.verdict.has(r.dataset.verdict))&&(!sel.agent.size||sel.agent.has(r.dataset.agent))&&(!sel.skill.size||sk.some(x=>sel.skill.has(x)));r.hidden=!ok;if(ok)n++}
c.textContent=n+" of "+cards.length+" runs shown";none.style.display=n?"none":"block";clr.hidden=!(s||sel.verdict.size||sel.skill.size||sel.agent.size)}
q.addEventListener("input",apply);
for(const b of document.querySelectorAll(".chip")){b.addEventListener("click",()=>{const set=sel[b.dataset.k],on=b.getAttribute("aria-pressed")!=="true";b.setAttribute("aria-pressed",on);on?set.add(b.dataset.v):set.delete(b.dataset.v);apply()})}
clr.addEventListener("click",()=>{q.value="";for(const k in sel)sel[k].clear();for(const b of document.querySelectorAll(".chip"))b.setAttribute("aria-pressed","false");apply()});
const peek=document.getElementById("peek");
const show=(m)=>{const d=m.dataset;peek.replaceChildren();const meta=document.createElement("div");meta.className="pm";meta.textContent=[d.date,d.verdict.toUpperCase(),d.agent].join("  /  ");const t=document.createElement("b");t.textContent=d.task;peek.append(meta,t)};
for(const m of document.querySelectorAll(".mk")){m.addEventListener("mouseenter",()=>show(m));m.addEventListener("focus",()=>show(m))}
})();
`;

export function render(rows, evals = null) {
  const N = rows.length;
  const chrono = rows.map((r, i) => [r, i]).sort((a, b) => a[0].date.localeCompare(b[0].date) || a[1] - b[1]).map(([r]) => r);
  const sorted = [...chrono].reverse();
  const withSkill = rows.filter((r) => r.skills.length);
  const noSkill = rows.filter((r) => !r.skills.length);
  const tally = (rs) => rs.reduce((t, r) => ((t[r.verdict] += 1), t), blank());
  const totals = tally(rows);
  const tw = tally(withSkill);
  const tn = tally(noSkill);
  const bySkill = group(rows, (r) => (r.skills.length ? r.skills : ["(none)"]));
  const ws = weeks(rows);
  const asks = recurringAsks(rows);
  const updated = rows.map((r) => r.date).sort().at(-1) ?? "n/a";
  const generated = new Date().toISOString().slice(0, 10);
  const hero = heroText(N, withSkill.length, tw.helped, tw.neutral, tw.hurt);
  const skillsAll = [...new Set(rows.flatMap((r) => (r.skills.length ? r.skills : ["(none)"])))].sort();
  const agentsAll = [...new Set(rows.map((r) => r.agent))].sort();
  const chip = (k, v, n, extra = "") => `<button type="button" class="chip" data-k="${k}" data-v="${esc(v)}" aria-pressed="false">${extra}${esc(v)} <span class="muted">${n}</span></button>`;

  const stat = (v, l, cls = "") => `<div class="stat ${cls}"><b>${v}</b><span>${l}</span></div>`;
  const facts = `<div class="facts">${stat(N, "entries")}${stat(`${pct(withSkill.length, N)}%`, `loaded a skill (${withSkill.length} of ${N})`)}${VERDICTS.slice(0, 0).join("")}${stat(totals.helped, `${glyph("helped", 11)}helped (${pct(totals.helped, N)}%)`, "helped")}${stat(totals.hurt, `${glyph("hurt", 11)}hurt (${pct(totals.hurt, N)}%)`, "hurt")}</div>`;
  const neutralNote = `${totals.neutral} neutral (${pct(totals.neutral, N)}%)`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><title>Skillify flight recorder: do skills help agents?</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"><style>${CSS}</style></head>
<body><main>
<div class="bar"><span class="rec"><b>Skillify</b>&nbsp;flight recorder</span><span>Latest entry ${esc(updated)}</span></div>
<section class="hero"><div><p class="kicker">Field feedback / ${N} ${N === 1 ? "run" : "runs"} logged by the agents that ran them</p><h1>${headline(hero)}</h1>${hero.sub ? `<p class="sub">${esc(hero.sub)}</p>` : `<p class="sub">Across all ${N} runs: ${esc(neutralNote)}. ${withSkill.length} of ${N} loaded a skill; ${noSkill.length} loaded none. Every verdict is the agent's own report.</p>`}</div>${ring(rows)}</section>
${facts}
<div class="compare">${split(tw, withSkill.length, "with")}${split(tn, noSkill.length, "without")}</div>

${measured(evals)}

<section class="ch"><div class="ch-h"><span class="no">CH 01</span><h2>Verdicts per skill</h2></div><p class="ch-d">Each bar is one skill. Length is runs, on one shared scale. A run that loaded several skills counts once for each. "(none)" is the runs that loaded no skill.</p><div class="panel">${legend()}${skillBars(bySkill)}${tableView(["Skill", "Helped", "Neutral", "Hurt", "Total"], bySkill.map(([k, t]) => [k, t.helped, t.neutral, t.hurt, total(t)]))}</div></section>

<section class="ch"><div class="ch-h"><span class="no">CH 02</span><h2>The run log</h2></div><p class="ch-d">Every run is one mark, in log order, placed on the lane of its verdict. Shape repeats the verdict so colour is never the only cue. Select a mark to jump to its card.</p><div class="panel">${legend()}${river(chrono)}${tableView(["Week of", "Helped", "Neutral", "Hurt", "Total"], ws.map(([k, t]) => [k, t.helped, t.neutral, t.hurt, total(t)]))}</div></section>

<section class="ch"><div class="ch-h"><span class="no">CH 03</span><h2>Who flew what</h2></div><p class="ch-d">Agents down, models across. Each glyph is one run. Cell shade follows the run count against the busiest cell.</p><div class="panel">${legend()}${matrix(rows)}</div>${fieldCost(rows)}</section>

<section class="ch"><div class="ch-h"><span class="no">CH 04</span><h2>Recurring asks</h2></div><p class="ch-d">Phrases that appear in the "missing" note of at least 2 runs. Size follows the count. The count is runs, not mentions, out of ${asks.docs} runs with a "missing" note.</p><div class="panel">${cloud(asks)}</div></section>

<section class="ch"><div class="ch-h"><span class="no">CH 05</span><h2>Transcripts</h2></div><p class="ch-d">The full note from every run, newest first.</p>
<div class="filters"><input id="q" type="search" placeholder="Search tasks and notes" aria-label="Search entries"><div class="fg"><span>Verdict</span>${VERDICTS.map((v) => chip("verdict", v, totals[v], glyph(v))).join("")}</div><div class="fg"><span>Skill</span>${skillsAll.map((s) => chip("skill", s, bySkill.find(([k]) => k === s)?.[1] ? total(bySkill.find(([k]) => k === s)[1]) : 0)).join("")}</div><div class="fg"><span>Agent</span>${agentsAll.map((a) => chip("agent", a, rows.filter((r) => r.agent === a).length)).join("")}<button type="button" class="clear" id="clear" hidden>Clear filters</button></div></div>
<p id="count" role="status">${N} of ${N} runs shown</p>
<div class="runs">${sorted.map((r) => card(r, chrono.indexOf(r))).join("")}</div><div class="empty-s" id="none">No run matches these filters.</div></section>

<footer><div><h2>Add a run</h2><pre>node scripts/log-feedback.mjs \\
  --agent worker --model sonnet-5.5 --harness claude \\
  --tokens 48000 --tools 32 --ms 210000 \\
  --task "what you did" --skills shipify,reviewify \\
  --helped "..." --hindered "..." --missing "..." \\
  --verdict helped</pre></div><div><h2>Source</h2><p>Skills and this recorder live at <a href="https://github.com/trykA123/skillify">github.com/trykA123/skillify</a>. The page is rebuilt from feedback/field.jsonl on each push.</p><p class="gen">Generated ${esc(generated)}</p></div></footer>
</main><script>${JS}</script></body></html>
`;
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const input = opt("--input", join(repo, "feedback", "field.jsonl"));
  const output = opt("--output", join(repo, "feedback", "index.html"));
  const rows = parseEntries(await readFile(input, "utf8").catch(() => ""));
  const resultsDir = opt("--results", join(repo, "evals", "results"));
  const pairedDir = opt("--paired", join(repo, "evals", "paired"));
  const kinds = {};
  for (const t of await readdir(pairedDir).catch(() => [])) {
    const j = JSON.parse(await readFile(join(pairedDir, t, "task.json"), "utf8").catch(() => "null"));
    if (j) kinds[t] = { skill: j.skill, kind: j.kind };
  }
  const evals = analyzeResults(await loadResults(resultsDir), kinds);
  await writeFile(output, render(rows, evals));
  console.log(`wrote ${output} (${rows.length} entries)`);
}
