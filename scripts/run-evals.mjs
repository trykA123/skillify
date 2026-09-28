#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import process from "node:process";

const repo = resolve(dirname(new URL(import.meta.url).pathname), "..");
const adapters = ["fixture", "claude", "codex", "opencode"];

function usage(code = 0) {
  (code ? process.stderr : process.stdout).write(`Usage: node scripts/run-evals.mjs [options]

  --adapter NAME   ${adapters.join(", ")} (default: fixture)
  --skill NAME     Run one skill's cases (default: all)
  --case ID        Run one case
  --model NAME     Model passed to the harness
  --repeat N       Repetitions per case (default: 1)
  --out FILE       Write JSONL results
  --routes-only    Run only routing cases
  --catalog DIR    Route against every SKILL.md under DIR too (for example ~/.claude/skills)
`);
  process.exit(code);
}

const opts = { adapter: "fixture", repeat: 1 };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 1) {
  const flag = argv[i];
  if (flag === "-h" || flag === "--help") usage(0);
  if (flag === "--routes-only") { opts.routesOnly = true; continue; }
  const key = { "--adapter": "adapter", "--skill": "skill", "--case": "case", "--model": "model", "--repeat": "repeat", "--out": "out", "--catalog": "catalog" }[flag];
  if (!key || argv[i + 1] === undefined) usage(64);
  opts[key] = argv[++i];
}
opts.repeat = Number(opts.repeat);
if (!adapters.includes(opts.adapter) || !Number.isInteger(opts.repeat) || opts.repeat < 1) usage(64);

const frontmatter = (text) => Object.fromEntries(
  (text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "").split("\n")
    .map((line) => line.match(/^([a-z-]+):\s*(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));

const skillNames = (await readdir(join(repo, "skills"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
const skills = new Map();
for (const name of skillNames) {
  const text = await readFile(join(repo, "skills", name, "SKILL.md"), "utf8");
  skills.set(name, { text, description: frontmatter(text).description });
}
const others = new Map();
async function collect(dir, depth = 0) {
  if (depth > 3) return;
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.name === "SKILL.md") {
      const meta = frontmatter(await readFile(path, "utf8"));
      if (meta.name && meta.description && !skills.has(meta.name)) others.set(meta.name, meta.description);
    } else if (entry.isDirectory() || entry.isSymbolicLink()) {
      await collect(path, depth + 1);
    }
  }
}
if (opts.catalog) await collect(resolve(opts.catalog.replace(/^~/, process.env.HOME)));
const catalogNames = [...skillNames, ...others.keys()].sort((a, b) => b.length - a.length);
const catalog = [...[...skills].map(([name, skill]) => [name, skill.description]), ...others]
  .sort(([a], [b]) => a.localeCompare(b)).map(([name, description]) => `- ${name}: ${description}`).join("\n");

const cases = [];
for (const file of (await readdir(join(repo, "evals"))).filter((f) => f.endsWith(".json")).sort()) {
  const suite = JSON.parse(await readFile(join(repo, "evals", file), "utf8"));
  for (const item of suite.cases) cases.push({ ...item, skill: suite.skill });
}
const selected = cases.filter((c) => (!opts.routesOnly || c.route !== undefined) && (!opts.skill || c.skill === opts.skill) && (!opts.case || c.id === opts.case));
if (!selected.length) {
  console.error("no matching cases");
  process.exit(1);
}

const sandbox = await mkdtemp(join(tmpdir(), "skillify-eval-"));

function run(command, args, input, cwd = sandbox) {
  return new Promise((done, fail) => {
    const child = spawn(command, args, { cwd, stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (chunk) => { out += chunk; });
    child.stderr.on("data", (chunk) => { err += chunk; });
    child.on("error", fail);
    child.on("close", (code) => (code === 0 ? done(out.trim()) : fail(new Error(`${command} exited ${code}: ${err.slice(-400)}`))));
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}

function ask(prompt) {
  const model = opts.model ? ["--model", opts.model] : [];
  if (opts.adapter === "claude") return run("claude", ["-p", "--no-session-persistence", "--tools", "", "--output-format", "text", ...model], prompt);
  if (opts.adapter === "codex") return run("codex", ["exec", "-", "--ephemeral", "--skip-git-repo-check", "--sandbox", "read-only", "--color", "never", ...model], prompt);
  return run("opencode", ["run", "--pure", ...model, prompt], "");
}

function routePrompt(item) {
  return `These skills are installed. Each is loaded only when its description fits the request.\n\n${catalog}\n\n` +
    `User request:\n${item.prompt}\n\nReply with only the name of the one skill you would load first, or "none".`;
}

function behaviorPrompt(item) {
  const context = item.context ? `\n\nContext:\n${item.context}` : "";
  return `You have loaded this skill:\n\n${skills.get(item.skill).text}\n\n` +
    `This is a simulation. The project named in the request exists but you cannot inspect it and have no tools. ` +
    `Do not ask for access and do not treat the current directory as the project. Show the work you would do: ` +
    `the commands you would run, plausible results for a typical project of that kind, and the output you would ` +
    `deliver, following the skill.${context}\n\n` +
    `User request:\n${item.prompt}`;
}

async function grade(item, answer) {
  const prompt = `Grade this assistant response. Pass only if every expected behavior is present and no forbidden behavior occurs. ` +
    `Judge meaning, not wording. The assistant had no tools and was told to simulate: planned commands, plausible ` +
    `results, and a described or partial artifact count as doing the work. Grade the method, not whether it really ran.\n\nExpected:\n${item.behaviors.map((b) => `- ${b}`).join("\n")}\n\n` +
    `Forbidden:\n${(item.forbidden ?? []).map((b) => `- ${b}`).join("\n") || "- none"}\n\nResponse:\n${answer}\n\n` +
    `Return only JSON: {"passed": boolean, "missing": [string], "forbiddenSeen": [string]}`;
  const raw = await ask(prompt);
  const json = raw.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return { passed: false, missing: ["grader returned no JSON"], forbiddenSeen: [] };
  return JSON.parse(json);
}

const revision = await run("git", ["rev-parse", "--short", "HEAD"], "", repo).catch(() => "unknown");
const rows = [];
for (const item of selected) {
  for (let repetition = 1; repetition <= opts.repeat; repetition += 1) {
    let row;
    if (opts.adapter === "fixture") {
      row = { passed: true, note: "fixture: cases resolved, no model called" };
    } else if (item.route !== undefined) {
      const raw = (await ask(routePrompt(item))).toLowerCase();
      const hits = [...catalogNames, "none"].map((name) => [name, raw.search(new RegExp(`(^|[^a-z-])${name.replace(/[-]/g, "\\-")}($|[^a-z-])`))]).filter(([, at]) => at >= 0);
      const answer = hits.sort((a, b) => a[1] - b[1] || b[0].length - a[0].length)[0]?.[0] ?? raw.slice(0, 40);
      const expected = [item.route ?? "none"].flat();
      row = { passed: expected.includes(answer), answer, expected };
    } else {
      const answer = await ask(behaviorPrompt(item));
      row = { ...(await grade(item, answer)), answer };
    }
    rows.push({ suite: item.skill, case: item.id, repetition, adapter: opts.adapter, model: opts.model ?? "default", revision, ...row });
    console.log(`${row.passed ? "pass" : "FAIL"}  ${item.skill}/${item.id}${row.passed ? "" : `  ${JSON.stringify(row.missing ?? row.answer)}`}`);
  }
}

const passed = rows.filter((row) => row.passed).length;
console.log(`\n${passed}/${rows.length} passed`);
if (opts.out) {
  await mkdir(dirname(resolve(opts.out)), { recursive: true });
  await writeFile(resolve(opts.out), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
}
process.exit(passed === rows.length ? 0 : 1);
