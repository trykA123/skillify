#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { analyzeResults, evalHeadline, loadResults } from "./feedback-report.mjs";

const names = { haiku: "Claude Haiku", sonnet: "Claude Sonnet", "deepseek-flash": "DeepSeek Flash" };
const modelName = (name) => names[name] ?? name;
const usd = (n) => `$${n >= 1 ? n.toFixed(2) : n.toFixed(3)}`;
const change = (a, b) => {
  if (!a) return "n/a";
  const n = Math.round(100 * (b - a) / a);
  return n > 0 ? `+${n}%` : n < 0 ? `−${-n}%` : "0%";
};

export function evidenceSection(analysis) {
  const { models, tasks, fixtures, runsPerArm } = analysis;
  const intro = "Generated from existing results by `node scripts/readme-evidence.mjs`; the dashboard uses the same analysis. No new paired runs are needed to refresh this section.";
  const unmeasured = "`teachify` remains unmeasured: interactive teaching needs a human learner. Grading lesson text alone cannot establish teaching quality. The shipify fast path's cost effect also remains unmeasured.";
  if (!models.length) return `${intro}\n\nNo paired results recorded.\n\n${unmeasured}\n`;
  const headline = evalHeadline(models);
  const table = models.map((m) => {
    const cost = `${usd(m.base.cost)} → ${usd(m.skill.cost)}`;
    const point = m.base.score > 0 && m.skill.score > 0
      ? `${usd(m.base.cost / m.base.score)} → ${usd(m.skill.cost / m.skill.score)} (${change(m.base.cost / m.base.score, m.skill.cost / m.skill.score)})`
      : "n/a";
    return `| ${modelName(m.model)} | ${m.base.score.toFixed(2)} | ${m.skill.score.toFixed(2)} | ${cost} (${m.estimate ? "CLI estimate" : change(m.base.cost, m.skill.cost)}) | ${m.estimate ? "not comparable" : point} |`;
  });
  const gains = tasks.filter((t) => t.best >= 0.005).map((t) => {
    const improved = t.per.filter((m) => m.skill.score - m.base.score >= 0.005);
    return `- [${t.task}](evals/paired/${t.task}/task.json)${t.skill ? ` (${t.skill})` : ""}: ${improved.map((m) => `${modelName(m.model)} ${m.base.score.toFixed(2)} → ${m.skill.score.toFixed(2)} (+${Math.round(100 * (m.skill.score - m.base.score))} pts)`).join("; ")}.`;
  });
  const ceiling = tasks.filter((t) => t.kind === "tests").reduce((n, t) => n + t.per.filter((m) => m.base.score >= 0.995).length, 0);
  const limits = ceiling ? `\n- Coding and debugging baselines already score 1.00 on ${ceiling} model/task comparisons. These fixtures cannot measure further score gains at that ceiling.` : "";
  return `${intro}

\`scripts/run-paired.mjs\` runs each task in a throwaway repo with real tools, without skills and with the task's skill loaded. Hidden tests grade coding tasks; a separate model grades open-ended tasks against a rubric.

${headline.pre}${headline.em}

| Model | Score without skills | Score with skills | Cost per run | Cost per score point |
|---|---:|---:|---|---|
${table.join("\n")}

${gains.length ? gains.join("\n") : "No task recorded a score improvement."}${limits}

The sample is small: ${fixtures} fixtures, up to ${runsPerArm} runs per arm. Means are per recorded run. Later rounds replace earlier results for the same model, task and arm. Treat these scores as direction, not proof. CLI cost estimates are not invoices; DeepSeek estimates use Anthropic prices and are excluded from cost comparisons.

${unmeasured}

Raw runs: [evals/results/](evals/results/). The dashboard recomputes its Overview headline and Evals numbers from the same files.
`;
}

export function replaceEvidence(readme, section) {
  const start = readme.indexOf("## Does it help?\n");
  const end = readme.indexOf("### Field feedback\n", start);
  if (start < 0 || end < 0) throw new Error("README evidence section headings are missing");
  return readme.slice(0, start) + "## Does it help?\n\n" + section.trim() + "\n\n" + readme.slice(end);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--check")) throw new Error("usage: node scripts/readme-evidence.mjs [--check]");
  const root = new URL("../", import.meta.url);
  const kinds = {};
  for (const name of (await readdir(new URL("evals/paired/", root))).sort()) {
    const task = JSON.parse(await readFile(new URL(`evals/paired/${name}/task.json`, root), "utf8"));
    kinds[name] = { skill: task.skill, kind: task.kind };
  }
  const analysis = analyzeResults(await loadResults(fileURLToPath(new URL("evals/results/", root))), kinds);
  const path = new URL("README.md", root);
  const before = await readFile(path, "utf8");
  const after = replaceEvidence(before, evidenceSection(analysis));
  if (args.includes("--check")) {
    if (after !== before) {
      console.error("README evidence is stale; run node scripts/readme-evidence.mjs");
      process.exitCode = 1;
    } else console.log("README evidence matches existing results");
  } else {
    if (after !== before) await writeFile(path, after);
    console.log("README evidence regenerated from existing results");
  }
}
