#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import process from "node:process";

const repo = join(dirname(new URL(import.meta.url).pathname), "..");
const VERDICTS = ["helped", "neutral", "hurt"];
const STOP = new Set(("a an and are as at be been but by for from had has have if in into is it its of on or so that the their then there these this to was were what when which while with without not no nor via per than too very can could should would will just also only own more most some any all each other such our out up over under again about after before because between both do does did doing done get got how i you we they he she them his her my your ours us me").split(" "));
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
    return { date: "", agent: "", model: "", harness: "", task: "", helped: "", hindered: "", missing: "", ...r, skills: Array.isArray(r.skills) ? r.skills : [] };
  });
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
  const kept = cand.filter(([g, c]) => !cand.some(([h, k]) => h !== g && k === c && h.includes(g)));
  kept.sort((a, b) => b[1] - a[1] || b[0].split(" ").length - a[0].split(" ").length || a[0].localeCompare(b[0]));
  return { docs: docs.length, asks: kept.slice(0, 12) };
}

const dot = (v) => `<span class="dot ${v}" aria-hidden="true"></span>`;
const badge = (v) => `<span class="badge ${v}">${dot(v)}${v}</span>`;

const legend = () => `<ul class="legend">${VERDICTS.map((v) => `<li>${dot(v)}${v}</li>`).join("")}</ul>`;

function tableView(head, body) {
  return `<details class="tv"><summary>Table view</summary><div class="scroll"><table><thead><tr>${head.map((h, i) => `<th${i ? ' class="n"' : ""}>${esc(h)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c, i) => `<td${i ? ' class="n"' : ""}>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>`;
}

function hbars(items) {
  const max = Math.max(1, ...items.map(([, t]) => total(t)));
  const rows = items.map(([label, t]) => {
    let x = 0;
    const segs = VERDICTS.filter((v) => t[v]).map((v) => {
      const w = (100 * t[v]) / max;
      const s = `<rect class="${v}" x="${x.toFixed(2)}%" y="0" width="${w.toFixed(2)}%" height="24"><title>${esc(label)}: ${t[v]} ${v}</title></rect><text class="on" x="${(x + w / 2).toFixed(2)}%" y="16" text-anchor="middle">${t[v]}</text>`;
      x += w;
      return s;
    });
    return `<div class="hrow"><div class="hlabel" title="${esc(label)}">${esc(label)}</div><svg class="hbar" height="24" role="img" aria-label="${esc(label)}: ${VERDICTS.map((v) => `${t[v]} ${v}`).join(", ")}">${segs.join("")}</svg><div class="htotal">${total(t)}</div></div>`;
  });
  return `<div class="hbars">${rows.join("")}</div>`;
}

function weekChart(ws) {
  if (!ws.length) return `<p class="muted">No dated entries.</p>`;
  const max = Math.max(1, ...ws.map(([, t]) => total(t)));
  const H = 160;
  const n = ws.length;
  const step = Math.ceil(n / 8);
  const colW = 100 / n;
  const bw = colW * 0.7;
  const cols = ws.map(([k, t], i) => {
    let y = H;
    const x = i * colW + (colW - bw) / 2;
    return VERDICTS.filter((v) => t[v]).map((v) => {
      const h = (H * t[v]) / max;
      y -= h;
      return `<rect class="${v}" x="${x.toFixed(2)}%" y="${y.toFixed(1)}" width="${bw.toFixed(2)}%" height="${h.toFixed(1)}"><title>week of ${k}: ${t[v]} ${v}</title></rect>${h >= 14 ? `<text class="on" x="${(x + bw / 2).toFixed(2)}%" y="${(y + h / 2 + 4).toFixed(1)}" text-anchor="middle">${t[v]}</text>` : ""}`;
    }).join("");
  });
  const labels = ws.map(([k], i) => (i % step === 0 ? `<text class="axis" x="${(i * colW + colW / 2).toFixed(2)}%" y="14" text-anchor="middle">${k.slice(5)}</text>` : "")).join("");
  const totals = ws.map(([, t], i) => `<text class="axis" x="${(i * colW + colW / 2).toFixed(2)}%" y="${(H - (H * total(t)) / max - 4).toFixed(1)}" text-anchor="middle">${total(t)}</text>`).join("");
  return `<div class="wk"><span class="ytick" style="top:0">${max}</span><span class="ytick" style="top:${H}px">0</span><div class="wkplot" style="max-width:${Math.max(n * 72, 160)}px"><svg height="${H + 6}" role="img" aria-label="Entries per week, stacked by verdict"><line class="grid" x1="0" x2="100%" y1="${H}" y2="${H}"/>${cols.join("")}${totals}</svg><svg height="20" aria-hidden="true">${labels}</svg></div></div><p class="muted small">Week starting (MM-DD), Monday. Count is entries.</p>`;
}

function statTable(title, items) {
  return `<section class="card"><h2>${title}</h2><div class="scroll"><table><thead><tr><th>${title.replace("Per ", "")}</th><th class="n">Entries</th><th class="n">Helped</th><th class="n">Neutral</th><th class="n">Hurt</th><th class="n">Helped %</th></tr></thead><tbody>${items.map(([k, t]) => `<tr><td>${esc(k || "(unknown)")}</td><td class="n">${total(t)}</td><td class="n">${t.helped}</td><td class="n">${t.neutral}</td><td class="n">${t.hurt}</td><td class="n">${pct(t.helped, total(t))}%</td></tr>`).join("")}</tbody></table></div></section>`;
}

const CSS = `
:root{color-scheme:light dark;--bg:#f6f7f9;--card:#fff;--text:#1b1f24;--muted:#5b6672;--line:#d9dde3;--helped:#1a7f4b;--neutral:#9a6700;--hurt:#c0392b;--on:#fff;--accent:#0b5cad}
@media (prefers-color-scheme:dark){:root{--bg:#0f1216;--card:#181c22;--text:#e8ebef;--muted:#9aa5b1;--line:#2c333c;--helped:#3fb97a;--neutral:#d9a441;--hurt:#ef6b5e;--on:#0f1216;--accent:#6cb0f5}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:1100px;margin:0 auto;padding:16px}
h1{font-size:1.5rem;margin:8px 0 4px}h2{font-size:1.05rem;margin:0 0 12px}
.muted{color:var(--muted)}.small{font-size:.8rem;margin:6px 0 0}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px;margin-top:16px;min-width:0}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 16px}
.stat b{display:block;font-size:1.8rem;line-height:1.2;font-variant-numeric:tabular-nums}
.stat span{color:var(--muted);font-size:.85rem}
.split{display:flex;gap:10px;flex-wrap:wrap;margin-top:4px}
.split b{font-size:1.3rem;display:inline}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px}
.dot.helped,rect.helped{background:var(--helped);fill:var(--helped)}
.dot.neutral,rect.neutral{background:var(--neutral);fill:var(--neutral)}
.dot.hurt,rect.hurt{background:var(--hurt);fill:var(--hurt)}
.badge{white-space:nowrap;font-weight:600}
.badge.helped{color:var(--helped)}.badge.neutral{color:var(--neutral)}.badge.hurt{color:var(--hurt)}
.legend{display:flex;gap:16px;list-style:none;padding:0;margin:0 0 12px;font-size:.85rem}
.hrow{display:grid;grid-template-columns:minmax(70px,130px) 1fr 28px;gap:8px;align-items:center;margin:6px 0}
.hlabel{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.9rem}
.htotal{color:var(--muted);text-align:right;font-variant-numeric:tabular-nums;font-size:.85rem}
svg{display:block;width:100%;overflow:visible}
svg text{fill:var(--text);font:12px system-ui,sans-serif}
svg text.on{fill:var(--on);font-weight:700}
svg text.axis{fill:var(--muted);font-size:11px}
.grid{stroke:var(--line);stroke-width:1}
.wk{position:relative;padding-left:26px}.wkplot{min-width:0}
.ytick{position:absolute;left:0;font-size:11px;color:var(--muted);transform:translateY(-6px)}
table{border-collapse:collapse;width:100%;font-size:.88rem}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--muted);font-weight:600;white-space:nowrap}
.n{text-align:right;font-variant-numeric:tabular-nums}
.scroll{overflow-x:auto}
details.tv{margin-top:10px}summary{cursor:pointer;color:var(--accent);font-size:.85rem}
input[type=search]{width:100%;padding:10px 12px;font:inherit;color:var(--text);background:var(--bg);border:1px solid var(--line);border-radius:8px;margin-bottom:12px}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
#entries td.t{min-width:160px}
ul.asks{margin:0;padding:0;list-style:none}
ul.asks li{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid var(--line)}
ul.asks b{font-variant-numeric:tabular-nums}
@media (max-width:760px){
.grid2{grid-template-columns:1fr}.stats{grid-template-columns:1fr 1fr}
#entries thead{display:none}
#entries tr{display:block;border-bottom:1px solid var(--line);padding:8px 0}
#entries td{display:block;border:0;padding:2px 0}
#entries td[data-l]::before{content:attr(data-l) ": ";color:var(--muted);font-weight:600}
}
`;

const JS = `
const q=document.getElementById("q"),rows=[...document.querySelectorAll("#entries tbody tr")],c=document.getElementById("count");
q.addEventListener("input",()=>{const s=q.value.toLowerCase().trim();let n=0;for(const r of rows){const on=!s||r.textContent.toLowerCase().includes(s);r.hidden=!on;if(on)n++}c.textContent=n+" of "+rows.length+" shown"});
`;

export function render(rows) {
  const N = rows.length;
  const withSkill = rows.filter((r) => r.skills.length).length;
  const totals = rows.reduce((t, r) => ((t[r.verdict] += 1), t), blank());
  const bySkill = group(rows, (r) => (r.skills.length ? r.skills : ["(none)"]));
  const ws = weeks(rows);
  const asks = recurringAsks(rows);
  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
  const updated = rows.map((r) => r.date).sort().at(-1) ?? "n/a";

  const stat = (v, l) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`;
  const split = `<div class="stat"><div class="split">${VERDICTS.map((v) => `<span>${dot(v)}<b>${totals[v]}</b> ${v} <span class="muted">(${pct(totals[v], N)}%)</span></span>`).join("")}</div><span>verdict split</span></div>`;

  const entryRows = sorted.map((r) => `<tr><td data-l="Date">${esc(r.date)}</td><td data-l="Verdict">${badge(r.verdict)}</td><td data-l="Agent">${esc(r.agent)}</td><td data-l="Model">${esc(r.model)}</td><td data-l="Harness">${esc(r.harness)}</td><td class="t" data-l="Task">${esc(r.task)}</td><td data-l="Skills">${esc(r.skills.join(", ") || "(none)")}</td><td class="t" data-l="Helped">${esc(r.helped)}</td><td class="t" data-l="Hindered">${esc(r.hindered)}</td><td class="t" data-l="Missing">${esc(r.missing)}</td></tr>`).join("");

  const asksHtml = asks.asks.length
    ? `<ul class="asks">${asks.asks.map(([g, c]) => `<li><span>${esc(g)}</span><b>${c} of ${asks.docs}</b></li>`).join("")}</ul>`
    : `<p class="muted">${asks.docs < 2 ? "Too few entries with a \"missing\" note." : "No word or phrase repeats across entries yet."}</p>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Skillify field feedback</title><style>${CSS}</style></head>
<body><main>
<h1>Skillify field feedback</h1>
<p class="muted">Generated from feedback/field.jsonl. Latest entry: ${esc(updated)}.</p>
<div class="stats">${stat(N, "entries")}${stat(`${pct(withSkill, N)}%`, `runs that loaded a skill (${withSkill} of ${N})`)}${split}${stat(`${pct(totals.helped, N)}%`, "helped")}</div>
<div class="grid2">
<section class="card"><h2>Verdicts per skill</h2>${legend()}${hbars(bySkill)}<p class="muted small">Bar length is entries. A run with several skills counts once per skill.</p>${tableView(["Skill", "Helped", "Neutral", "Hurt", "Total"], bySkill.map(([k, t]) => [k, t.helped, t.neutral, t.hurt, total(t)]))}</section>
<section class="card"><h2>Verdicts over time</h2>${legend()}${weekChart(ws)}${tableView(["Week of", "Helped", "Neutral", "Hurt", "Total"], ws.map(([k, t]) => [k, t.helped, t.neutral, t.hurt, total(t)]))}</section>
</div>
<div class="grid2">${statTable("Per agent", group(rows, (r) => [r.agent]))}${statTable("Per model", group(rows, (r) => [r.model]))}</div>
<section class="card"><h2>Recurring asks</h2><p class="muted small" style="margin:0 0 8px">Words and phrases (up to 3 words) that appear in the "missing" field of at least 2 entries. Counts are entries, not occurrences.</p>${asksHtml}</section>
<section class="card"><h2>All entries</h2><input id="q" type="search" placeholder="Search entries" aria-label="Search entries"><p id="count" class="muted small" role="status">${N} of ${N} shown</p><div class="scroll"><table id="entries"><thead><tr><th>Date</th><th>Verdict</th><th>Agent</th><th>Model</th><th>Harness</th><th>Task</th><th>Skills</th><th>Helped</th><th>Hindered</th><th>Missing</th></tr></thead><tbody>${entryRows}</tbody></table></div></section>
</main><script>${JS}</script></body></html>
`;
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const input = opt("--input", join(repo, "feedback", "field.jsonl"));
  const output = opt("--output", join(repo, "feedback", "index.html"));
  const rows = parseEntries(await readFile(input, "utf8").catch(() => ""));
  await writeFile(output, render(rows));
  console.log(`wrote ${output} (${rows.length} entries)`);
}
