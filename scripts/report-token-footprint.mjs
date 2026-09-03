#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, readdir, realpath, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";

const repo = resolve(dirname(new URL(import.meta.url).pathname), "..");
let jsonOutput = false;
let markdownOutput = false;
let check = false;
let budgetPath = join(repo, "evals/token-budgets.json");

function usage(code = 0) {
  const stream = code ? process.stderr : process.stdout;
  stream.write("Usage: node scripts/report-token-footprint.mjs [--json] [--markdown] [--check] [--budgets FILE]\n");
  process.exit(code);
}

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--json") jsonOutput = true;
  else if (args[i] === "--markdown") markdownOutput = true;
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
      else if ((entry.isFile() || entry.isSymbolicLink()) && entry.name.endsWith(".md")) result.push(target);
    }
  }
  try { await walk(root); } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return result.sort();
}

const localMarkdownLinks = (source) => [...source.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)]
  .map((match) => match[1].trim())
  .filter((target) => target && !/^(?:https?:|mailto:)/.test(target) && !target.includes("<"));

async function canonical(path) {
  try { return await realpath(path); } catch { return resolve(path); }
}

async function promptFiles(entrypoint, weight) {
  const files = [];
  const visited = new Set();
  async function visit(path, kind = "reference") {
    const canonicalPath = await canonical(path);
    if (visited.has(canonicalPath)) return;
    visited.add(canonicalPath);
    const source = await readFile(path, "utf8");
    files.push({
      path: relative(repo, path),
      canonicalPath: relative(repo, canonicalPath),
      kind,
      ...measure(source),
      hash: createHash("sha256").update(source).digest("hex"),
    });
    for (const target of localMarkdownLinks(source)) {
      const linked = resolve(dirname(path), target);
      if (!await stat(linked).then(() => true, () => false)) continue;
      const linkedRelative = relative(dirname(entrypoint), linked);
      if (/^references[\\/]weights[\\/](?:light|standard|heavy)\.md$/.test(linkedRelative)) continue;
      await visit(linked);
    }
  }

  await visit(entrypoint, "entrypoint");
  const standard = join(dirname(entrypoint), "references", "weights", `${String(weight).toLowerCase()}.md`);
  if (await stat(standard).then(() => true, () => false)) await visit(standard, `${weight} weight`);
  return files;
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
const budgetConfig = await json(budgetPath);
const budgets = budgetConfig.budgets;
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

const chainSkills = budgets.pipelineChain?.skills ?? ["undumbify", "shapeify", "shipify", "reviewify"];
const chainFilesByCanonicalPath = new Map();
const chainStages = [];
for (const chainSkill of chainSkills) {
  const skill = skills.find((candidate) => candidate.name === chainSkill);
  if (!skill) {
    chainStages.push({ name: chainSkill, weight: "Standard", files: [], bytes: 0, words: 0, missing: true });
    continue;
  }
  const files = await promptFiles(resolve(repo, skill.path), "Standard");
  const stageCanonicalPaths = new Set();
  for (const file of files) {
    stageCanonicalPaths.add(file.canonicalPath);
    const existing = chainFilesByCanonicalPath.get(file.canonicalPath);
    if (existing) {
      existing.paths.push(file.path);
      existing.canonicalPaths.push(file.canonicalPath);
      if (!existing.kinds.includes(file.kind)) existing.kinds.push(file.kind);
      if (!existing.stages.includes(chainSkill)) existing.stages.push(chainSkill);
    } else {
      chainFilesByCanonicalPath.set(file.canonicalPath, {
        hash: file.hash,
        path: file.path,
        canonicalPath: file.canonicalPath,
        paths: [file.path],
        canonicalPaths: [file.canonicalPath],
        kinds: [file.kind],
        stages: [chainSkill],
        words: file.words,
        bytes: file.bytes,
      });
    }
  }
  const stageFiles = files.map((file) => ({
    path: file.path,
    canonicalPath: file.canonicalPath,
    kind: file.kind,
    words: file.words,
    bytes: file.bytes,
    hash: file.hash,
  }));
  const uniqueStageFiles = files.filter((file) => stageCanonicalPaths.has(file.canonicalPath) &&
    files.findIndex((candidate) => candidate.canonicalPath === file.canonicalPath) === files.indexOf(file));
  chainStages.push({
    name: chainSkill,
    weight: "Standard",
    files: stageFiles,
    bytes: uniqueStageFiles.reduce((sum, file) => sum + file.bytes, 0),
    words: uniqueStageFiles.reduce((sum, file) => sum + file.words, 0),
  });
}
const chainFiles = [...chainFilesByCanonicalPath.values()];
const pipelineChain = {
  schemaVersion: 1,
  weight: "Standard",
  skills: chainSkills,
  bytes: chainFiles.reduce((sum, file) => sum + file.bytes, 0),
  words: chainFiles.reduce((sum, file) => sum + file.words, 0),
  files: chainFiles,
  stages: chainStages,
  deduplication: "canonical resolved path; aliases of the same symlink target count once, distinct files count separately",
};
if (budgets.pipelineChain?.maxBytes !== undefined) pipelineChain.maxBytes = budgets.pipelineChain.maxBytes;

const report = {
  schemaVersion: 1,
  measurement: "UTF-8 bytes and whitespace-delimited words; model token counts vary",
  discovery: measure([...skillDescriptions.sort(), ...agentDescriptions.sort()].join("\n")),
  skills,
  agents,
  pipelineChain,
};

const failures = [];
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
if (budgets.pipelineChain) {
  if (pipelineChain.stages.some((stage) => stage.missing)) {
    failures.push(`pipelineChain: missing configured skill (${pipelineChain.stages.filter((stage) => stage.missing).map((stage) => stage.name).join(", ")})`);
  }
  if (pipelineChain.bytes > budgets.pipelineChain.maxBytes) {
    failures.push(`pipelineChain (${chainSkills.join("+")} Standard): ${pipelineChain.bytes} > ${budgets.pipelineChain.maxBytes} bytes`);
  }
}

if (jsonOutput) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else if (markdownOutput) {
  const status = (bytes, limit) => {
    const ratio = bytes / limit;
    return ratio > 1 ? "🔴" : ratio >= 0.85 ? "🟡" : "🟢";
  };
  const rows = ["| Subject | Bytes | Budget | |", "|---|---:|---:|:-:|"];
  const discoveryLimit = budgets.discovery.maxBytes;
  rows.push(`| discovery | ${report.discovery.bytes} | ${discoveryLimit} | ${status(report.discovery.bytes, discoveryLimit)} |`);
  const limitsFor = {};
  for (const skill of report.skills) {
    const exception = budgets.skillEntrypoint.exceptions?.[skill.name];
    const limit = exception?.maxBytes ?? budgets.skillEntrypoint.defaultMaxBytes;
    limitsFor[skill.name] = limit;
    rows.push(`| ${skill.name} | ${skill.entrypoint.bytes} | ${limit} | ${status(skill.entrypoint.bytes, limit)} |`);
  }
  for (const agent of report.agents) {
    rows.push(`| ${agent.name} · root | ${agent.root.bytes} | ${budgets.rootAgent.defaultMaxBytes} | ${status(agent.root.bytes, budgets.rootAgent.defaultMaxBytes)} |`);
    rows.push(`| ${agent.name} · delegated | ${agent.delegated.bytes} | ${budgets.delegatedAgent.defaultMaxBytes} | ${status(agent.delegated.bytes, budgets.delegatedAgent.defaultMaxBytes)} |`);
  }
  if (budgets.pipelineChain) {
    rows.push(`| pipeline chain · Standard | ${report.pipelineChain.bytes} | ${budgets.pipelineChain.maxBytes} | ${status(report.pipelineChain.bytes, budgets.pipelineChain.maxBytes)} |`);
  }

  const hChart = (title, names, values) => {
    console.log("```mermaid");
    console.log("xychart-beta horizontal");
    console.log(`    title "${title}"`);
    console.log(`    x-axis [${names.map((n) => `"${n}"`).join(", ")}]`);
    console.log(`    y-axis "Bytes" 0 --> ${Math.max(...values)}`);
    console.log(`    bar [${values.join(", ")}]`);
    console.log("```", "");
  };

  console.log("## Prompt footprint", "");
  console.log(`Discovery: **${report.discovery.bytes}** / ${discoveryLimit} bytes`, "");
  if (budgets.pipelineChain) {
    console.log(`Pipeline chain (Standard, deduplicated): **${report.pipelineChain.bytes}** / ${budgets.pipelineChain.maxBytes} bytes`, "");
    console.log("| Chain stage | Unique stage bytes | Files |", "|---|---:|---:|");
    for (const stage of report.pipelineChain.stages) {
      console.log(`| ${stage.name} | ${stage.bytes} | ${stage.files.length}${stage.missing ? " (missing)" : ""} |`);
    }
    console.log(`Unique files: ${report.pipelineChain.files.length}; aliases of one canonical resolved path are counted once.`, "");
  }
  console.log(rows.join("\n"), "");
  console.log("🟢 under 85% · 🟡 near limit · 🔴 over budget", "");
  hChart(
    "Skill entrypoints",
    report.skills.map((s) => s.name),
    report.skills.map((s) => s.entrypoint.bytes),
  );
  hChart(
    "Agent prompts - root",
    report.agents.map((a) => a.name),
    report.agents.map((a) => a.root.bytes),
  );
  hChart(
    "Agent prompts - delegated",
    report.agents.map((a) => a.name),
    report.agents.map((a) => a.delegated.bytes),
  );
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
  console.log(`\nPipeline chain (Standard, deduplicated): ${report.pipelineChain.bytes} / ${budgets.pipelineChain?.maxBytes ?? "unbounded"} bytes`);
  console.log(`  skills: ${report.pipelineChain.skills.join(" -> ")}`);
  console.log(`  unique files: ${report.pipelineChain.files.length}`);
  for (const stage of report.pipelineChain.stages) {
    console.log(`  ${stage.name.padEnd(16)} ${String(stage.bytes).padStart(6)} / ${stage.files.length} files${stage.missing ? " · MISSING" : ""}`);
  }
  for (const file of report.pipelineChain.files) {
    const aliases = file.paths.length > 1 ? ` aliases=${file.paths.length - 1}` : "";
    console.log(`    ${file.path} -> ${file.canonicalPath} (${file.bytes} bytes${aliases})`);
  }
}

if (check && failures.length) {
  for (const failure of failures) console.error(`budget exceeded: ${failure}`);
  process.exit(1);
}
if (check) console.error(`Token footprint budgets valid: ${skills.length} skills, ${agents.length} agents.`);
