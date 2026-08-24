#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";

const repo = resolve(dirname(new URL(import.meta.url).pathname), "..");
let jsonOutput = false;
let check = false;
let budgetPath = join(repo, "evals/token-budgets.json");

function usage(code = 0) {
  const stream = code ? process.stderr : process.stdout;
  stream.write("Usage: node scripts/report-token-footprint.mjs [--json] [--check] [--budgets FILE]\n");
  process.exit(code);
}

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--json") jsonOutput = true;
  else if (args[i] === "--check") check = true;
  else if (args[i] === "--budgets") budgetPath = resolve(args[++i]);
  else if (args[i] === "-h" || args[i] === "--help") usage(0);
  else usage(64);
}

const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const measure = (text) => ({
  words: text.trim() ? text.trim().split(/\s+/).length : 0,
  bytes: Buffer.byteLength(text, "utf8"),
});

function splitFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("source is missing frontmatter");
  const meta = {};
  for (const line of match[1].split("\n")) {
    const part = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (part) meta[part[1]] = part[2];
  }
  return { meta, body: match[2].trim() };
}

async function markdownBelow(root) {
  const result = [];
  async function walk(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const target = join(path, entry.name);
      if (entry.isDirectory()) await walk(target);
      else if (entry.isFile() && entry.name.endsWith(".md")) result.push(target);
    }
  }
  try { await walk(root); } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return result.sort();
}

const skills = [];
const skillDescriptions = [];
for (const family of ["entry", "pipeline", "teaching"]) {
  const familyPath = join(repo, family);
  const directories = (await readdir(familyPath, { withFileTypes: true }))
    .filter((item) => item.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of directories) {
    const path = join(familyPath, entry.name, "SKILL.md");
    const source = await readFile(path, "utf8");
    const parsed = splitFrontmatter(source);
    skillDescriptions.push(`${parsed.meta.name}: ${parsed.meta.description}`);
    const references = [];
    for (const referencePath of await markdownBelow(join(dirname(path), "references"))) {
      references.push({ path: relative(repo, referencePath), ...measure(await readFile(referencePath, "utf8")) });
    }
    skills.push({
      name: parsed.meta.name,
      path: relative(repo, path),
      entrypoint: measure(source),
      conditionalReferences: references,
    });
  }
}
skills.sort((a, b) => a.name.localeCompare(b.name));

const fleetRoot = join(repo, "agents");
const manifest = await json(join(fleetRoot, "manifest.json"));
const contractText = new Map();
for (const [name, path] of Object.entries(manifest.contracts)) {
  contractText.set(name, await readFile(join(fleetRoot, path), "utf8"));
}

function namesFor(profiles, specific = []) {
  return [...new Set([
    ...profiles.flatMap((profile) => manifest.contractProfiles?.[profile] ?? manifest.globalContracts ?? []),
    ...specific,
  ])];
}

function compose(names, role) {
  const sections = names.map((name) => `## Shared contract: ${name}\n\n${contractText.get(name).trim()}`);
  sections.push(`## Role\n\n${role.trim()}`);
  return sections.join("\n\n");
}

const agents = [];
const agentDescriptions = [];
for (const [name, spec] of Object.entries(manifest.agents).sort(([a], [b]) => a.localeCompare(b))) {
  const parsed = splitFrontmatter(await readFile(join(fleetRoot, spec.role), "utf8"));
  agentDescriptions.push(`${name}: ${parsed.meta.description}`);
  const rootNames = namesFor(["base", "interactive", "delegated"], spec.contracts);
  const delegatedNames = namesFor(["base", "delegated"], spec.contracts);
  agents.push({
    name,
    role: spec.role,
    root: { contracts: rootNames, ...measure(compose(rootNames, parsed.body)) },
    delegated: { contracts: delegatedNames, ...measure(compose(delegatedNames, parsed.body)) },
  });
}

const report = {
  schemaVersion: 1,
  measurement: "UTF-8 bytes and whitespace-delimited words; model token counts vary",
  discovery: measure([...skillDescriptions.sort(), ...agentDescriptions.sort()].join("\n")),
  skills,
  agents,
};

const budgetConfig = await json(budgetPath);
const failures = [];
const budgets = budgetConfig.budgets;
if (report.discovery.bytes > budgets.discovery.maxBytes) {
  failures.push(`discovery: ${report.discovery.bytes} > ${budgets.discovery.maxBytes} bytes`);
}
for (const skill of report.skills) {
  const exception = budgets.skillEntrypoint.exceptions?.[skill.name];
  const limit = exception?.maxBytes ?? budgets.skillEntrypoint.defaultMaxBytes;
  if (skill.entrypoint.bytes > limit) failures.push(`${skill.name} entrypoint: ${skill.entrypoint.bytes} > ${limit} bytes`);
}
for (const agent of report.agents) {
  if (agent.root.bytes > budgets.rootAgent.defaultMaxBytes) {
    failures.push(`${agent.name} root: ${agent.root.bytes} > ${budgets.rootAgent.defaultMaxBytes} bytes`);
  }
  if (agent.delegated.bytes > budgets.delegatedAgent.defaultMaxBytes) {
    failures.push(`${agent.name} delegated: ${agent.delegated.bytes} > ${budgets.delegatedAgent.defaultMaxBytes} bytes`);
  }
}

if (jsonOutput) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  console.log("Skillify prompt footprint (bytes / words; not exact model tokens)\n");
  console.log(`Discovery: ${report.discovery.bytes} / ${report.discovery.words}`);
  console.log("\nSkills:");
  for (const skill of report.skills) {
    console.log(`  ${skill.name.padEnd(16)} ${String(skill.entrypoint.bytes).padStart(6)} / ${String(skill.entrypoint.words).padStart(4)}  refs=${skill.conditionalReferences.length}`);
  }
  console.log("\nAgents (root -> delegated):");
  for (const agent of report.agents) {
    console.log(`  ${agent.name.padEnd(16)} ${String(agent.root.bytes).padStart(6)} -> ${String(agent.delegated.bytes).padStart(6)}`);
  }
}

if (check && failures.length) {
  for (const failure of failures) console.error(`budget exceeded: ${failure}`);
  process.exit(1);
}
if (check) console.error(`Token footprint budgets valid: ${skills.length} skills, ${agents.length} agents.`);
