#!/usr/bin/env node

import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import process from "node:process";

const STATE = ".skillify-native.json";
const harnesses = new Set(["codex", "claude", "opencode", "copilot"]);

function usage(code = 0) {
  const stream = code ? process.stderr : process.stdout;
  stream.write(`Usage: node scripts/render-agents.mjs --harness NAME --dest DIR [options]\n\n` +
    `Options:\n` +
    `  --fleet DIR   Portable fleet root (default: <repo>/agents)\n` +
    `  --check       Verify generated files without writing\n` +
    `  --dry-run     Print the generation plan without writing\n` +
    `  -h, --help    Show this help\n`);
  process.exit(code);
}

const args = process.argv.slice(2);
let harness;
let destination;
let fleet;
let check = false;
let dryRun = false;
let uninstall = false;
let force = false;
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--harness") harness = args[++i];
  else if (arg === "--dest") destination = args[++i];
  else if (arg === "--fleet") fleet = args[++i];
  else if (arg === "--check") check = true;
  else if (arg === "--dry-run") dryRun = true;
  else if (arg === "--uninstall") uninstall = true;
  else if (arg === "--force") force = true;
  else if (arg === "-h" || arg === "--help") usage(0);
  else usage(64);
}

if (!harnesses.has(harness) || !destination) usage(64);
const repo = resolve(dirname(new URL(import.meta.url).pathname), "..");
fleet = resolve(fleet ?? join(repo, "agents"));
destination = resolve(destination);
if (["/", resolve(process.env.HOME ?? "/nonexistent"), repo, fleet].includes(destination)) {
  throw new Error(`refusing unsafe native-agent destination: ${destination}`);
}

const exists = async (path) => access(path).then(() => true, () => false);
const digest = (value) => createHash("sha256").update(value).digest("hex");
const json = async (path) => JSON.parse(await readFile(path, "utf8"));

function splitFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("role is missing frontmatter");
  const meta = {};
  for (const line of match[1].split("\n")) {
    const part = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (part) meta[part[1]] = part[2];
  }
  return { meta, body: match[2].trim() };
}

const known = new Set(["read", "shell", "edit", "web"]);
const toolMap = {
  claude: { read: ["Glob", "Grep", "Read"], shell: ["Bash"], edit: ["Edit", "Write"], web: ["WebFetch", "WebSearch"] },
  copilot: { read: ["read", "search"], shell: ["execute"], edit: ["edit"], web: ["web"] },
};
const tools = (name, caps) => [...new Set(caps.flatMap((cap) => toolMap[name][cap]))].sort();

function render(name, meta, body) {
  const caps = meta.capabilities.split(",").map((cap) => cap.trim()).filter(Boolean);
  for (const cap of caps) if (!known.has(cap)) throw new Error(`${name}: unknown capability '${cap}'`);
  const readOnly = !caps.includes("edit");
  const description = meta.description;
  if (harness === "codex") {
    const sandbox = meta.sandbox === "read-only" ? `sandbox_mode = "read-only"\n` : "";
    return `name = ${JSON.stringify(name)}\ndescription = ${JSON.stringify(description)}\n${sandbox}\n` +
      `developer_instructions = """\n${body.replaceAll('"""', '\\"\\"\\"')}\n"""\n`;
  }
  if (harness === "claude") {
    const skills = meta.skills ? `skills: ${meta.skills}\n` : "";
    return `---\nname: ${name}\ndescription: ${JSON.stringify(description)}\ntools: ${tools("claude", caps).join(", ")}\n${skills}---\n\n${body}\n`;
  }
  if (harness === "copilot") {
    return `---\nname: ${JSON.stringify(name)}\ndescription: ${JSON.stringify(description)}\n` +
      `tools: ${JSON.stringify(tools("copilot", caps))}\n---\n\n${body}\n`;
  }
  const permission = readOnly ? `permission:\n  edit: deny\n` : "";
  return `---\ndescription: ${JSON.stringify(description)}\nmode: subagent\n${permission}---\n\n${body}\n`;
}

const extension = harness === "codex" ? ".toml" : harness === "copilot" ? ".agent.md" : ".md";
const outputs = new Map();
const roleFiles = (await readdir(fleet)).filter((file) => file.endsWith(".md")).sort();
for (const file of roleFiles) {
  const { meta, body } = splitFrontmatter(await readFile(join(fleet, file), "utf8"));
  const name = basename(file, ".md");
  if (meta.name !== name) throw new Error(`${file}: frontmatter name must be ${name}`);
  if (!meta.description || !meta.capabilities) throw new Error(`${file}: needs description and capabilities`);
  const text = render(name, meta, body);
  outputs.set(name, { file: `${name}${extension}`, text, hash: digest(text) });
}

let prior = { agents: {} };
const statePath = join(destination, STATE);
if (await exists(statePath)) prior = await json(statePath);

if (uninstall) {
  if (prior.harness !== harness) {
    console.error(`cannot uninstall: ${statePath} is not managed for ${harness}`);
    process.exit(1);
  }
  const conflicts = [];
  for (const item of Object.values(prior.agents ?? {})) {
    const path = join(destination, item.file);
    if (await exists(path)) {
      const current = digest(await readFile(path, "utf8"));
      if (!force && current !== item.hash) conflicts.push(`${item.file}: edited after generation`);
    }
  }
  if (conflicts.length) {
    console.error(`refusing to uninstall edited native agents:\n  ${conflicts.join("\n  ")}\nUse --force to remove them.`);
    process.exit(1);
  }
  console.log(`${dryRun ? "would remove" : "removing"}: ${Object.keys(prior.agents ?? {}).length} ${harness} agents from ${destination}`);
  if (!dryRun) {
    for (const item of Object.values(prior.agents ?? {})) await rm(join(destination, item.file), { force: true });
    await rm(statePath, { force: true });
  }
  process.exit(0);
}

if (check) {
  const problems = [];
  if (prior.harness !== harness) problems.push(`state harness is ${prior.harness ?? "missing"}, expected ${harness}`);
  for (const [name, output] of outputs) {
    const path = join(destination, output.file);
    if (!(await exists(path))) problems.push(`${output.file}: missing`);
    else if (digest(await readFile(path, "utf8")) !== output.hash) problems.push(`${output.file}: stale or edited`);
    if (prior.agents?.[name]?.hash !== output.hash) problems.push(`${output.file}: state is stale`);
  }
  for (const name of Object.keys(prior.agents ?? {})) {
    if (!outputs.has(name)) problems.push(`${prior.agents[name].file}: retired managed agent remains`);
  }
  if (problems.length) {
    console.error(`native agents are stale:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`fresh: ${outputs.size} ${harness} agents in ${destination}`);
  process.exit(0);
}

console.log(`${dryRun ? "would generate" : "generating"}: ${outputs.size} ${harness} agents -> ${destination}`);
if (dryRun) process.exit(0);

await mkdir(destination, { recursive: true });
const conflicts = [];
for (const output of outputs.values()) {
  const path = join(destination, output.file);
  const managed = Object.values(prior.agents ?? {}).find((item) => item.file === output.file);
  if (await exists(path)) {
    const current = digest(await readFile(path, "utf8"));
    if (!force && (!managed || current !== managed.hash)) conflicts.push(`${output.file}: unrecognized or edited`);
  }
}
if (conflicts.length) {
  console.error(`refusing to replace native agents:\n  ${conflicts.join("\n  ")}\nUse --force after inspection.`);
  process.exit(1);
}
for (const [name, old] of Object.entries(prior.agents ?? {})) {
  if (!outputs.has(name)) await rm(join(destination, old.file), { force: true });
}
for (const output of outputs.values()) await writeFile(join(destination, output.file), output.text);

const state = {
  schemaVersion: 1,
  harness,
  source: fleet,
  agents: Object.fromEntries([...outputs].map(([name, value]) => [name, { file: value.file, hash: value.hash }])),
};
await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
console.log(`done: ${outputs.size} agents generated`);
