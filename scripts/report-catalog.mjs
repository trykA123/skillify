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
lines.push("");

process.stdout.write(lines.join("\n"));
