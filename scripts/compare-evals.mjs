#!/usr/bin/env node

import { readFile } from "node:fs/promises";

if (process.argv.length !== 4) {
  console.error("usage: node compare-evals.mjs BASELINE.jsonl CANDIDATE.jsonl");
  process.exit(64);
}

async function load(path) {
  return (await readFile(path, "utf8")).split("\n").filter(Boolean).map(JSON.parse);
}

const [baseline, candidate] = await Promise.all(process.argv.slice(2).map(load));
const rate = (rows) => rows.length ? rows.filter((row) => row.passed).length / rows.length : 0;
const key = (row) => `${row.suite}/${row.case}#${row.repetition}`;
const base = new Map(baseline.map((row) => [key(row), row]));
const current = new Map(candidate.map((row) => [key(row), row]));
const regressions = [];
const improvements = [];
for (const [id, row] of current) {
  const prior = base.get(id);
  if (prior?.passed && !row.passed) regressions.push(id);
  if (prior && !prior.passed && row.passed) improvements.push(id);
}

console.log(`baseline:  ${(rate(baseline) * 100).toFixed(1)}% (${baseline.length} runs)`);
console.log(`candidate: ${(rate(candidate) * 100).toFixed(1)}% (${candidate.length} runs)`);
console.log(`regressions: ${regressions.length}${regressions.length ? ` — ${regressions.join(", ")}` : ""}`);
console.log(`improvements: ${improvements.length}${improvements.length ? ` — ${improvements.join(", ")}` : ""}`);
process.exit(regressions.length ? 1 : 0);
