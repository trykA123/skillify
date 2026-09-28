#!/usr/bin/env node

import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import process from "node:process";

const repo = resolve(dirname(new URL(import.meta.url).pathname), "..");
const fixtures = join(repo, "evals/paired");

function usage(code = 0) {
  (code ? process.stderr : process.stdout).write(`Usage: node scripts/run-paired.mjs [options]

Runs each fixture task with real tools twice: without skills (base) and with the
task's skill loaded (skill). Scores with hidden tests or a rubric graded by another
model, and reports score, cost, turns, and time per arm.

  --task NAME        Fixture under evals/paired (default: all)
  --reps N           Runs per arm (default: 3)
  --model NAME       Model under test (default: sonnet)
  --grader NAME      codex or claude (default: codex)
  --arms LIST        base,skill (default: both)
  --jobs N           Parallel runs (default: 4)
  --out FILE         JSONL output
  --keep             Keep workspaces for inspection
`);
  process.exit(code);
}

const opts = { reps: 3, model: "sonnet", grader: "codex", arms: "base,skill", jobs: 4 };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 1) {
  const flag = argv[i];
  if (flag === "-h" || flag === "--help") usage(0);
  if (flag === "--keep") { opts.keep = true; continue; }
  const key = { "--task": "task", "--reps": "reps", "--model": "model", "--grader": "grader", "--arms": "arms", "--jobs": "jobs", "--out": "out" }[flag];
  if (!key || argv[i + 1] === undefined) usage(64);
  opts[key] = argv[++i];
}
opts.reps = Number(opts.reps);
opts.jobs = Number(opts.jobs);
const arms = opts.arms.split(",");

function run(command, args, { cwd, input = "", timeout = 900_000 } = {}) {
  return new Promise((done) => {
    const child = spawn(command, args, { cwd, stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), timeout);
    child.stdout.on("data", (c) => { out += c; });
    child.stderr.on("data", (c) => { err += c; });
    child.on("error", (e) => { clearTimeout(timer); done({ code: -1, out, err: String(e) }); });
    child.on("close", (code) => { clearTimeout(timer); done({ code, out, err }); });
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}

const exists = (path) => stat(path).then(() => true, () => false);

async function workspace(dir, task) {
  const ws = await mkdtemp(join(tmpdir(), `paired-${task.name}-`));
  const git = (...args) => run("git", ["-c", "user.name=dev", "-c", "user.email=dev@example.com", ...args], { cwd: ws });
  await git("init", "-q", "-b", "main");
  const [first, second] = task.history;
  if (await exists(join(dir, "before"))) {
    await cp(join(dir, "before"), ws, { recursive: true });
    await git("add", "-A");
    await git("commit", "-qm", first);
    for (const entry of await readdir(ws)) if (entry !== ".git") await rm(join(ws, entry), { recursive: true });
    await cp(join(dir, "repo"), ws, { recursive: true });
    await git("add", "-A");
    await git("commit", "-qm", second);
  } else {
    await cp(join(dir, "repo"), ws, { recursive: true });
    await git("add", "-A");
    await git("commit", "-qm", first);
  }
  return ws;
}

async function skillPrompt(task) {
  const dir = join(repo, "skills", task.skill);
  let text = `This skill is loaded for the task. Follow it.\n\n${await readFile(join(dir, "SKILL.md"), "utf8")}`;
  if (await exists(join(dir, "references"))) text += `\n\nThis skill's reference files are in ${join(dir, "references")}. Read one when the skill says to.`;
  return { text, dir };
}

const tools = ["Read", "Edit", "Write", "Glob", "Grep", "Bash(bun:*)", "Bash(git:*)", "Bash(ls:*)", "Bash(cat:*)", "Bash(grep:*)",
  "Bash(rg:*)", "Bash(find:*)", "Bash(head:*)", "Bash(tail:*)", "Bash(wc:*)", "Bash(node:*)", "Bash(sed -n:*)", "Bash(diff:*)"];

async function attempt(task, arm) {
  const ws = await workspace(task.dir, task);
  const args = ["-p", "--output-format", "json", "--model", opts.model, "--no-session-persistence", "--disable-slash-commands",
    "--setting-sources", "project", "--permission-mode", "dontAsk", "--allowedTools", ...tools];
  let promptFile;
  if (arm === "skill") {
    const skill = await skillPrompt(task);
    promptFile = join(ws, "..", `${ws.split("/").pop()}.skill.md`);
    await writeFile(promptFile, skill.text);
    args.push("--append-system-prompt-file", promptFile, "--add-dir", skill.dir);
  }
  const started = Date.now();
  let meta = {};
  for (let tries = 0; tries < 3; tries += 1) {
    const res = await run("claude", args, { cwd: ws, input: task.prompt });
    try { meta = JSON.parse(res.out); } catch { meta = { result: res.out || res.err, is_error: true, terminal_reason: "unparsed" }; }
    if (meta.terminal_reason !== "api_error" && meta.terminal_reason !== "unparsed") break;
    await new Promise((r) => setTimeout(r, 60_000));
  }
  if (meta.terminal_reason === "api_error" || meta.terminal_reason === "unparsed") {
    if (promptFile) await rm(promptFile, { force: true });
    if (!opts.keep) await rm(ws, { recursive: true, force: true });
    return { task: task.name, arm, model: opts.model, invalid: true, score: 0, detail: { apiError: String(meta.result ?? "").slice(0, 200) }, seconds: 0 };
  }
  const answer = meta.result ?? "";
  const scored = task.kind === "tests" ? await scoreTests(task, ws) : await scoreRubric(task, ws, answer);
  if (promptFile) await rm(promptFile, { force: true });
  if (!opts.keep) await rm(ws, { recursive: true, force: true });
  return {
    task: task.name, arm, model: opts.model, score: scored.score, detail: scored.detail,
    cost: meta.total_cost_usd ?? null, turns: meta.num_turns ?? null, seconds: Math.round((Date.now() - started) / 1000),
    error: meta.is_error ? String(answer).slice(0, 300) : undefined, workspace: opts.keep ? ws : undefined, answer,
  };
}

async function scoreTests(task, ws) {
  await cp(join(task.dir, "hidden"), join(ws, "__hidden__"), { recursive: true });
  const count = (text, word) => Number(text.match(new RegExp(`^\\s*(\\d+) ${word}`, "m"))?.[1] ?? 0);
  const hidden = await run("bun", ["test", "./__hidden__"], { cwd: ws, timeout: 120_000 });
  const visible = await run("bun", ["test", "./test"], { cwd: ws, timeout: 120_000 });
  const h = hidden.err + hidden.out;
  const v = visible.err + visible.out;
  const pass = count(h, "pass");
  const total = pass + count(h, "fail");
  const visibleOk = count(v, "fail") === 0 && count(v, "pass") > 0;
  const failed = [...h.matchAll(/^\(fail\) (.+?) \[/gm)].map((m) => m[1]);
  return { score: total ? (pass / total) * (visibleOk ? 1 : 0.5) : 0, detail: { hidden: `${pass}/${total}`, visibleOk, failed } };
}

async function scoreRubric(task, ws, answer) {
  const changed = (await run("git", ["status", "--porcelain"], { cwd: ws })).out.trim();
  const prompt = `You are grading an AI assistant's answer against a rubric. Be strict and literal.\n\n` +
    `TASK GIVEN TO THE ASSISTANT:\n${task.prompt}\n\nRUBRIC:\n${JSON.stringify(task.rubric, null, 2)}\n\n` +
    `FILES THE ASSISTANT CHANGED: ${changed || "none"}\n\nANSWER:\n${answer}\n\n` +
    `Return only JSON: {"score": number between 0 and 1, "credited": [string], "penalties": [string]}`;
  const graderArgs = opts.grader === "codex"
    ? ["codex", ["exec", "-", "--ephemeral", "--skip-git-repo-check", "--sandbox", "read-only", "--color", "never"]]
    : ["claude", ["-p", "--model", "opus", "--no-session-persistence", "--tools", "", "--output-format", "text"]];
  const res = await run(graderArgs[0], graderArgs[1], { input: prompt, cwd: tmpdir(), timeout: 300_000 });
  const json = res.out.match(/\{[\s\S]*\}\s*$/)?.[0] ?? res.out.match(/\{[\s\S]*\}/)?.[0];
  try {
    const graded = JSON.parse(json);
    return { score: Math.max(0, Math.min(1, Number(graded.score))), detail: { credited: graded.credited, penalties: graded.penalties, changed: changed || undefined } };
  } catch {
    return { score: 0, detail: { graderError: (res.out + res.err).slice(-300) } };
  }
}

const names = (await readdir(fixtures)).filter((n) => !opts.task || n === opts.task).sort();
const tasks = [];
for (const name of names) {
  const dir = join(fixtures, name);
  tasks.push({ name, dir, ...JSON.parse(await readFile(join(dir, "task.json"), "utf8")) });
}
if (!tasks.length) usage(64);

const queue = [];
for (const task of tasks) for (const arm of arms) for (let r = 0; r < opts.reps; r += 1) queue.push([task, arm]);
const rows = [];
async function worker() {
  while (queue.length) {
    const [task, arm] = queue.shift();
    const row = await attempt(task, arm);
    if (!row.invalid) rows.push(row);
    if (row.invalid) { console.log(`${row.task.padEnd(20)} ${arm.padEnd(5)} INVALID (api error, excluded)`); continue; }
    console.log(`${row.task.padEnd(20)} ${arm.padEnd(5)} score ${row.score.toFixed(2)}  $${(row.cost ?? 0).toFixed(3)}  ${row.turns ?? "?"} turns  ${row.seconds}s  ${JSON.stringify(row.detail).slice(0, 140)}`);
  }
}
await Promise.all(Array.from({ length: opts.jobs }, worker));

const mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
console.log(`\n| task | arm | score | cost $ | turns | seconds |\n|---|---|---:|---:|---:|---:|`);
for (const task of tasks) {
  for (const arm of arms) {
    const r = rows.filter((x) => x.task === task.name && x.arm === arm);
    console.log(`| ${task.name} | ${arm} (n=${r.length}) | ${mean(r.map((x) => x.score)).toFixed(2)} | ${mean(r.map((x) => x.cost ?? 0)).toFixed(3)} | ${mean(r.map((x) => x.turns ?? 0)).toFixed(1)} | ${mean(r.map((x) => x.seconds)).toFixed(0)} |`);
  }
}
for (const arm of arms) {
  const r = rows.filter((x) => x.arm === arm);
  console.log(`| **all** | ${arm} | ${mean(r.map((x) => x.score)).toFixed(2)} | ${mean(r.map((x) => x.cost ?? 0)).toFixed(3)} | ${mean(r.map((x) => x.turns ?? 0)).toFixed(1)} | ${mean(r.map((x) => x.seconds)).toFixed(0)} |`);
}
if (opts.out) {
  await mkdir(dirname(resolve(opts.out)), { recursive: true });
  await writeFile(resolve(opts.out), rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
}
