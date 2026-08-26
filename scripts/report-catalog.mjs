#!/usr/bin/env node

// Prints a markdown catalog of skills and agent roles for humans.
// Used by CI to render a browsable summary on every run.

import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import process from "node:process";

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const families = ["entry", "pipeline", "teaching"];

const lines = [];
lines.push("## Skillify catalog", "");
lines.push("### Skills", "");
lines.push("| Family | Skill | Description |");
lines.push("|---|---|---|");
for (const family of families) {
  const entries = (await readdir(join(root, family), { withFileTypes: true }))
    .filter((e) => e.isDirectory());
  for (const entry of entries) {
    const source = await readFile(join(root, family, entry.name, "SKILL.md"), "utf8");
    const meta = source.match(/^description: (.*)$/m)?.[1] ?? "";
    lines.push(`| ${family} | ${entry.name} | ${meta.replaceAll("|", "\\|")} |`);
  }
}

const manifest = JSON.parse(await readFile(join(root, "agents", "manifest.json"), "utf8"));
lines.push("", "### Agent roles", "");
lines.push("| Group | Role | Interaction | Mutability | Description |");
lines.push("|---|---|---|---|---|");
for (const [name, spec] of Object.entries(manifest.agents).sort(([a], [b]) => a.localeCompare(b))) {
  const roleSource = await readFile(join(root, "agents", spec.role), "utf8");
  const description = roleSource.match(/^description: (.*)$/m)?.[1] ?? "";
  const interaction = spec.interaction ?? "delegated";
  lines.push(
    `| ${spec.group} | ${name} | ${interaction} | ${spec.mutability} | ${description.replaceAll("|", "\\|")} |`,
  );
}

const familyCounts = {};
for (const family of ["entry", "pipeline", "teaching"]) {
  const entries = (await readdir(join(root, family), { withFileTypes: true }))
    .filter((e) => e.isDirectory());
  familyCounts[family] = entries.length;
}
lines.push("", "### Shape", "", "```mermaid", "pie showData title Skills per family");
for (const [family, count] of Object.entries(familyCounts)) lines.push(`    "${family}" : ${count}`);
lines.push("```");

lines.push("", "### Eval coverage", "");
lines.push("| Suite | Cases |");
lines.push("|---|---:|");
let total = 0;
const suiteNames = [];
const suiteCounts = [];
for (const dir of (await readdir(join(root, "evals"), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!dir.isDirectory() || dir.name === "adapters") continue;
  const casePath = join(root, "evals", dir.name, "cases.json");
  try {
    const suite = JSON.parse(await readFile(casePath, "utf8"));
    const count = Array.isArray(suite.cases) ? suite.cases.length : 0;
    total += count;
    suiteNames.push(`"${dir.name}"`);
    suiteCounts.push(count);
    lines.push(`| ${dir.name} | ${count} |`);
  } catch { /* no cases.json in this directory */ }
}
lines.push(`| **total** | **${total}** |`, "");
if (suiteNames.length) {
  lines.push("```mermaid", "xychart-beta horizontal", '    title "Behavioral cases per suite"', `    x-axis [${suiteNames.join(", ")}]`, `    y-axis "Cases" 0 --> ${Math.max(...suiteCounts)}`, `    bar [${suiteCounts.join(", ")}]`, "```", "");
}
lines.push("");
process.stdout.write(lines.join("\n"));
