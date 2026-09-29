#!/usr/bin/env node

import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import process from "node:process";

const repo = join(dirname(new URL(import.meta.url).pathname), "..");
const log = join(repo, "feedback", "field.jsonl");
const fields = ["agent", "model", "harness", "task", "skills", "helped", "hindered", "missing", "verdict"];
const verdicts = new Set(["helped", "neutral", "hurt"]);

const args = process.argv.slice(2);
if (args[0] === "--summary") {
  const rows = (await readFile(log, "utf8").catch(() => "")).split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const by = new Map();
  for (const r of rows) for (const s of r.skills.length ? r.skills : ["(none)"]) {
    const t = by.get(s) ?? { helped: 0, neutral: 0, hurt: 0 };
    t[r.verdict] += 1;
    by.set(s, t);
  }
  console.log(`${rows.length} entries`);
  for (const [s, t] of [...by].sort()) console.log(`${s.padEnd(14)} helped ${t.helped}  neutral ${t.neutral}  hurt ${t.hurt}`);
  process.exit(0);
}

const entry = { date: new Date().toISOString().slice(0, 10) };
for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace(/^--/, "");
  if (!fields.includes(key)) {
    console.error(`unknown field --${key}; fields: ${fields.join(", ")}`);
    process.exit(64);
  }
  entry[key] = args[i + 1] ?? "";
}
entry.skills = (entry.skills ?? "").split(",").map((s) => s.trim()).filter((s) => s && s !== "none");
if (!verdicts.has(entry.verdict) || !entry.agent || !entry.task) {
  console.error("need --agent, --task and --verdict helped|neutral|hurt");
  process.exit(64);
}
await mkdir(dirname(log), { recursive: true });
await appendFile(log, JSON.stringify(entry) + "\n");
console.log(`logged to feedback/field.jsonl`);
