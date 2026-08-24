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

function compose(contracts, role) {
  const sections = contracts.map(({ name, text }) => `## Shared contract: ${name}\n\n${text.trim()}`);
  sections.push(`## Role\n\n${role.trim()}`);
  return sections.join("\n\n");
}

function openCodeMode(name) {
  return ["questar", "teacher"].includes(name) ? "all" : "subagent";
}

function isDirectCapable(harnessName, name) {
  return (harnessName === "opencode" && openCodeMode(name) === "all") ||
    (harnessName === "copilot" && name === "orchestrator");
}

function contractNamesFor(manifest, harnessName, name, spec) {
  const profiles = manifest.contractProfiles;
  if (!profiles) return [...manifest.globalContracts, ...(spec.contracts ?? [])];
  for (const profile of ["base", "interactive", "delegated"]) {
    if (!Array.isArray(profiles[profile])) {
      throw new Error(`manifest contractProfiles.${profile} must be an array`);
    }
  }
  const directCapable = isDirectCapable(harnessName, name);
  const profileNames = directCapable
    ? ["base", "interactive", "delegated"]
    : ["base", "delegated"];
  return [...new Set([
    ...profileNames.flatMap((profile) => profiles[profile] ?? []),
    ...(spec.contracts ?? []),
  ])];
}

const capabilityTools = {
  claude: {
    inspect: ["Glob", "Grep", "Read"], shell: ["Bash"], "artifact-write": ["Write"],
    "code-edit": ["Edit", "Write"], "web-research": ["WebFetch", "WebSearch"],
    delegate: ["Agent"], escalate: [],
  },
  copilot: {
    inspect: ["read", "search"], shell: ["execute"], "artifact-write": ["edit"],
    "code-edit": ["edit"], "web-research": ["web"],
    delegate: ["agent"], escalate: [],
  },
  opencode: {},
  codex: {},
};

function claudeTools(spec) {
  const result = [];
  for (const capability of spec.capabilities) result.push(...(capabilityTools.claude[capability] ?? []));
  return [...new Set(result)].sort();
}

function toolsFor(harnessName, spec) {
  const result = [];
  for (const capability of spec.capabilities) {
    result.push(...(capabilityTools[harnessName]?.[capability] ?? []));
  }
  return [...new Set(result)].sort();
}

function yamlString(value) {
  return JSON.stringify(value);
}

function yamlBlock(value) {
  return value.split("\n").map((line) => `  ${line}`).join("\n");
}

function interactiveRootPrompt(contracts) {
  const sections = contracts.map(({ name, text }) =>
    `## Interactive root contract: ${name}\n\n${text.trim()}`);
  return `This role is the direct owner of the current session. Apply the following ` +
    `interaction contracts before task work. They are supplied as the initial prompt so ` +
    `delegated uses of the same definition do not pay for or reopen root selection.\n\n` +
    sections.join("\n\n");
}

function render(harnessName, name, description, source, spec) {
  const body = compose(source.contracts, source.role);
  if (harnessName === "codex") {
    const escaped = body.replaceAll('"""', '\\"\\"\\"');
    return `name = ${JSON.stringify(name)}\ndescription = ${JSON.stringify(description)}\n\n` +
      `developer_instructions = """\n${escaped}\n"""\n`;
  }
  if (harnessName === "claude") {
    const tools = claudeTools(spec);
    return `---\nname: ${name}\ndescription: ${yamlString(description)}\n` +
      `initialPrompt: |-\n${yamlBlock(interactiveRootPrompt(source.interactiveContracts))}\n` +
      `tools: ${tools.join(", ")}\n---\n\n${body}\n`;
  }
  if (harnessName === "copilot") {
    const tools = toolsFor("copilot", spec);
    const agents = spec.capabilities.includes("delegate") ? `agents: ["*"]\n` : "";
    const userInvocable = isDirectCapable("copilot", name);
    const disableModelInvocation = userInvocable;
    return `---\nname: ${yamlString(name)}\ndescription: ${yamlString(description)}\n` +
      `target: vscode\nuser-invocable: ${userInvocable}\ndisable-model-invocation: ${disableModelInvocation}\n` +
      `tools: ${JSON.stringify(tools)}\n${agents}---\n\n${body}\n`;
  }
  const mode = openCodeMode(name);
  return `---\ndescription: ${description}\nmode: ${mode}\n---\n\n${body}\n`;
}

const manifestPath = join(fleet, "manifest.json");
const manifest = await json(manifestPath);
const extension = harness === "codex" ? ".toml" : harness === "copilot" ? ".agent.md" : ".md";
const outputs = new Map();

const interactiveContracts = [];
if (harness === "claude" && manifest.contractProfiles) {
  for (const contractName of manifest.contractProfiles.interactive ?? []) {
    const target = manifest.contracts[contractName];
    if (!target) throw new Error(`unknown interactive contract: ${contractName}`);
    interactiveContracts.push({ name: contractName, text: await readFile(join(fleet, target), "utf8") });
  }
}

for (const [name, spec] of Object.entries(manifest.agents).sort(([a], [b]) => a.localeCompare(b))) {
  const rolePath = join(fleet, spec.role);
  const parsed = splitFrontmatter(await readFile(rolePath, "utf8"));
  if (parsed.meta.name !== name) throw new Error(`${spec.role}: role name must be ${name}`);
  const contractNames = contractNamesFor(manifest, harness, name, spec);
  const contracts = [];
  for (const contractName of contractNames) {
    const target = manifest.contracts[contractName];
    contracts.push({ name: contractName, text: await readFile(join(fleet, target), "utf8") });
  }
  const text = render(harness, name, parsed.meta.description ?? "", {
    contracts,
    interactiveContracts,
    role: parsed.body,
  }, spec);
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
  source: manifestPath,
  manifest: digest(await readFile(manifestPath, "utf8")),
  agents: Object.fromEntries([...outputs].map(([name, value]) => [name, { file: value.file, hash: value.hash }])),
};
await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
console.log(`done: ${outputs.size} agents generated`);
