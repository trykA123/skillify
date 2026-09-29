#!/usr/bin/env node

import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import process from "node:process";

const repo = resolve(dirname(new URL(import.meta.url).pathname), "..");
const budget = { description: 400, catalog: 2800, skill: 4500, reference: 3200, agent: 1500 };
const errors = [];
const rows = [];
const exists = (path) => access(path).then(() => true, () => false);
const bytes = (text) => Buffer.byteLength(text);

function frontmatter(text, file) {
  const block = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!block) {
    errors.push(`${file}: missing frontmatter`);
    return {};
  }
  return Object.fromEntries(block[1].split("\n").map((l) => l.match(/^([a-z-]+):\s*(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));
}

async function checkLinks(file, text) {
  for (const [, target] of text.matchAll(/\]\(([^)#\s]+)\)/g)) {
    if (/^[a-z]+:/.test(target)) continue;
    if (!(await exists(join(dirname(file), target)))) errors.push(`${file}: broken link ${target}`);
  }
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink()) errors.push(`${path}: symlinks are not allowed in skills`);
    else if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

const skillNames = (await readdir(join(repo, "skills"), { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name).sort();
let catalog = 0;
for (const name of skillNames) {
  const dir = join(repo, "skills", name);
  const file = join(dir, "SKILL.md");
  const text = await readFile(file, "utf8");
  const meta = frontmatter(text, file);
  if (meta.name !== name) errors.push(`${file}: name must be ${name}`);
  if (!meta.description) errors.push(`${file}: description missing`);
  else if (bytes(meta.description) > budget.description) errors.push(`${file}: description ${bytes(meta.description)}B > ${budget.description}B`);
  catalog += bytes(`${name}: ${meta.description ?? ""}`);
  if (bytes(text) > budget.skill) errors.push(`${file}: ${bytes(text)}B > ${budget.skill}B`);
  let refs = 0;
  for (const path of await walk(dir)) {
    if (!path.endsWith(".md")) continue;
    const body = await readFile(path, "utf8");
    await checkLinks(path, body);
    if (path !== file) {
      refs += bytes(body);
      if (bytes(body) > budget.reference) errors.push(`${path}: ${bytes(body)}B > ${budget.reference}B`);
    }
  }
  rows.push([name, bytes(text), refs]);
}
if (catalog > budget.catalog) errors.push(`skill descriptions total ${catalog}B > ${budget.catalog}B`);

const agentFiles = (await readdir(join(repo, "agents"))).filter((f) => f.endsWith(".md")).sort();
for (const file of agentFiles) {
  const path = join(repo, "agents", file);
  const text = await readFile(path, "utf8");
  const meta = frontmatter(text, path);
  const name = file.replace(/\.md$/, "");
  if (meta.name !== name) errors.push(`${path}: name must be ${name}`);
  for (const cap of (meta.capabilities ?? "").split(",").map((c) => c.trim())) {
    if (!["read", "shell", "edit", "web"].includes(cap)) errors.push(`${path}: unknown capability '${cap}'`);
  }
  for (const [, skill] of text.matchAll(/`([a-z]+ify)`/g)) {
    if (!skillNames.includes(skill)) errors.push(`${path}: references missing skill ${skill}`);
  }
  if (bytes(text) > budget.agent) errors.push(`${path}: ${bytes(text)}B > ${budget.agent}B`);
  rows.push([`agent:${name}`, bytes(text), 0]);
}

const installer = await readFile(join(repo, "install.sh"), "utf8");
const listed = installer.match(/^SKILLS=\(([^)]*)\)/m)?.[1].trim().split(/\s+/).sort() ?? [];
if (listed.join() !== skillNames.join()) errors.push(`install.sh SKILLS (${listed}) differs from skills/ (${skillNames})`);

const plugin = JSON.parse(await readFile(join(repo, ".claude-plugin/plugin.json"), "utf8"));
const pluginSkills = (plugin.skills ?? []).map((p) => p.replace(/^\.\/skills\//, "")).sort();
if (pluginSkills.join() !== skillNames.join()) errors.push(`.claude-plugin/plugin.json skills differ from skills/`);

for (const file of (await readdir(join(repo, "evals"))).filter((f) => f.endsWith(".json"))) {
  const suite = JSON.parse(await readFile(join(repo, "evals", file), "utf8"));
  if (!skillNames.includes(suite.skill)) errors.push(`evals/${file}: unknown skill ${suite.skill}`);
  for (const item of suite.cases ?? []) {
    if (!item.id || !item.prompt) errors.push(`evals/${file}: case needs id and prompt`);
    if (item.route === undefined && !item.behaviors?.length) errors.push(`evals/${file}:${item.id}: needs route or behaviors`);
    for (const route of [item.route ?? []].flat()) {
      if (route !== "none" && !skillNames.includes(route)) errors.push(`evals/${file}:${item.id}: unknown route ${route}`);
    }
  }
}
for (const doc of ["README.md"]) await checkLinks(join(repo, doc), await readFile(join(repo, doc), "utf8"));

if (process.argv.includes("--report")) {
  console.log("| file | entry bytes | reference bytes |\n|---|---:|---:|");
  for (const [name, entry, refs] of rows) console.log(`| ${name} | ${entry} | ${refs} |`);
  console.log(`| descriptions (always loaded) | ${catalog} | |`);
}
if (errors.length) {
  console.error(errors.map((e) => `error: ${e}`).join("\n"));
  process.exit(1);
}
console.log(`ok: ${skillNames.length} skills, ${agentFiles.length} agents, descriptions ${catalog}B`);
