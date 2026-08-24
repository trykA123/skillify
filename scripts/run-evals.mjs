#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import process from "node:process";

const repo = resolve(dirname(new URL(import.meta.url).pathname), "..");

function usage(code = 0) {
  const stream = code ? process.stderr : process.stdout;
  stream.write(`Usage: node scripts/run-evals.mjs [options]\n\n` +
    `  --adapter NAME   fixture, codex, claude, or opencode (default: fixture)\n` +
    `  --suite NAME     all, fleet, or a skill name (default: all)\n` +
    `  --case ID        Run one exact case ID from the selected suite\n` +
    `  --installed      Use installed/native instructions for natural-pause cases\n` +
    `  --model NAME     Optional model passed to the native harness\n` +
    `  --repeat N       Repetitions per case (default: 1)\n` +
    `  --limit N        Stop after N cases\n` +
    `  --out FILE       JSONL result path\n` +
    `  --dry-run        Resolve cases without invoking a model\n` +
    `  -h, --help       Show this help\n`);
  process.exit(code);
}

const args = process.argv.slice(2);
let adapter = "fixture";
let suiteName = "all";
let caseId;
let model;
let repeat = 1;
let limit = Infinity;
let outputPath;
let dryRun = false;
let installed = false;
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--adapter") adapter = args[++i];
  else if (arg === "--suite") suiteName = args[++i];
  else if (arg === "--case") caseId = args[++i];
  else if (arg === "--model") model = args[++i];
  else if (arg === "--repeat") repeat = Number(args[++i]);
  else if (arg === "--limit") limit = Number(args[++i]);
  else if (arg === "--out") outputPath = resolve(args[++i]);
  else if (arg === "--installed") installed = true;
  else if (arg === "--dry-run") dryRun = true;
  else if (arg === "-h" || arg === "--help") usage(0);
  else usage(64);
}
if (!["fixture", "codex", "claude", "opencode"].includes(adapter)) usage(64);
if (!Number.isInteger(repeat) || repeat < 1 || !Number.isInteger(limit) && limit !== Infinity) usage(64);

const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const skillPaths = new Map();
for (const family of ["entry", "pipeline", "teaching"]) {
  const manifest = await import("node:fs/promises").then(({ readdir }) => readdir(join(repo, family), { withFileTypes: true }));
  for (const item of manifest) if (item.isDirectory()) skillPaths.set(item.name, join(repo, family, item.name, "SKILL.md"));
}

const cases = [];
if (suiteName === "all" || suiteName === "fleet") {
  const fleet = await json(join(repo, "evals/agents/cases.json"));
  for (const item of fleet.cases) cases.push({ suite: "fleet", item });
}
if (suiteName !== "fleet") {
  const names = suiteName === "all" ? [...skillPaths.keys()].sort() : [suiteName];
  for (const name of names) {
    if (!skillPaths.has(name)) throw new Error(`unknown suite: ${name}`);
    const suite = await json(join(repo, `evals/${name}/cases.json`));
    for (const item of suite.cases) cases.push({ suite: name, item });
  }
}
const filteredCases = caseId ? cases.filter((entry) => entry.item.id === caseId) : cases;
if (caseId && filteredCases.length === 0) throw new Error(`unknown case: ${caseId}`);
const selected = filteredCases.slice(0, limit);
if (installed && !["fixture", "codex"].includes(adapter)) {
  throw new Error("--installed natural-pause event enforcement is supported only by fixture and codex adapters");
}
if (installed && selected.some((entry) => entry.item.expected.naturalPause !== "required")) {
  throw new Error("--installed may run only cases marked naturalPause");
}
if (dryRun) {
  console.log(`resolved ${selected.length} cases from ${suiteName}; adapter=${adapter}; repeat=${repeat}`);
  process.exit(0);
}

function execFile(command, commandArgs, input) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, commandArgs, { cwd: repo, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.stdin.on("error", (error) => {
      if (error.code !== "EPIPE") reject(error);
    });
    child.on("close", (code) => {
      if (code === 0) resolveRun(stdout.trim());
      else reject(new Error(`${command} exited ${code}: ${stderr.trim()}`));
    });
    child.stdin.end(input);
  });
}

async function invoke(prompt) {
  if (adapter === "fixture") {
    if (prompt.includes("NATURAL FLOW")) {
      const fixtureResponse = process.env.SKILLIFY_FIXTURE_NATURAL_RESPONSE;
      if (fixtureResponse === "receipt") {
        return "Selected: Orientify · Standard · Concise · Operational · Solo\nI will inspect the repository now.";
      }
      if (fixtureResponse === "recommendation-late") {
        return "1. **Trace login** — follow one login request end to end.\n2. **Map boundary (recommended)** — focus on authentication seams.\n3. **Customize** — choose the controls.";
      }
      if (fixtureResponse === "continues") {
        return "1. **Trace login (recommended)** — follow one login request end to end.\n2. **Map boundary** — focus on authentication seams.\n3. **Customize** — choose the controls.\nI will inspect the repository now.";
      }
      return "1. **Trace login (recommended)** — follow one login request end to end and name dangerous seams.\n2. **Map authentication boundary** — focus on entry, identity checks, and response handling.\n3. **Customize** — choose rigor, response length, explanation, and ownership.";
    }
    const conversation = prompt.slice(Math.max(0, prompt.lastIndexOf("CONVERSATION SO FAR:")));
    const selected = {
      weight: conversation.match(/User: Weight: (Light|Standard|Heavy)/)?.[1] ?? "Standard",
      verbosity: conversation.match(/Verbosity: (Terse|Concise|Detailed)/)?.[1] ?? "Concise",
      explanation: conversation.match(/Explanation: (Layman|Operational|Expert)/)?.[1] ?? "Operational",
      ownership: conversation.match(/Ownership: (Solo|Team|Custom team)/)?.[1] ?? "Solo",
      roles: conversation.match(/Roles: ([^\n]+)/)?.[1]?.split(", ") ?? [],
    };
    if (prompt.includes("PHASE: CUSTOMIZATION")) {
      return "Customize this run\nWeight: W1 Light · W2 Standard · W3 Heavy — rigor and proof.\nVerbosity: V1 Terse · V2 Concise · V3 Detailed — response length.\nExplanation: E1 Layman · E2 Operational · E3 Expert — assumed knowledge.\nOwnership: O1 Solo · O2 Team · O3 Custom team — bounded owners.\nCurrent: W2 V2 E2 O1";
    }
    if (prompt.includes("PHASE: TOPOLOGY")) {
      const roleMap = selected.roles.length
        ? selected.roles.map((role) => {
          const mutability = role === "worker" ? "only code writer" : role === "reviewer" ? "independent, artifacts-only" : "read-only or declared artifacts only";
          return `${role} (${mutability})`;
        }).join(" → ")
        : "Scout (read-only) → Worker (only code writer)";
      return `Suggested team: ${roleMap}.\nCoordinator: parent session; Orchestrator not needed.\nConfirm this exact ownership map before dispatch.`;
    }
    if (prompt.includes("PHASE: EXECUTION")) {
      return `Selected: ${selected.weight} · ${selected.verbosity} · ${selected.explanation} · ${selected.ownership}\nThe confirmed smallest useful ownership map follows the contract and avoids every forbidden action.`;
    }
    return "1. **Balanced (recommended)** — use the smallest safe route.\n2. **Fast** — reduce ceremony.\n3. **Customize** — choose rigor, response length, explanation, and ownership.";
  }
  if (adapter === "codex") {
    const commandArgs = ["exec", "-", "--ephemeral", "--skip-git-repo-check", "--sandbox", "read-only", "--color", "never"];
    if (model) commandArgs.push("--model", model);
    return execFile("codex", commandArgs, prompt);
  }
  if (adapter === "claude") {
    const commandArgs = ["-p", "--no-session-persistence", "--permission-mode", "plan", "--tools", "", "--output-format", "text"];
    if (model) commandArgs.push("--model", model);
    return execFile("claude", commandArgs, prompt);
  }
  const commandArgs = ["run", "--pure", "--format", "default", "--dir", repo];
  if (model) commandArgs.push("--model", model);
  commandArgs.push(prompt);
  return execFile("opencode", commandArgs, "");
}

async function sourceFor(entry) {
  if (entry.suite !== "fleet") {
    let source = await readFile(skillPaths.get(entry.suite), "utf8");
    for (const reference of entry.item.expected.references ?? []) {
      source += `\n\n## Referenced module\n${await readFile(resolve(dirname(skillPaths.get(entry.suite)), reference), "utf8")}`;
    }
    return source;
  }
  const manifest = await json(join(repo, "agents/manifest.json"));
  const descriptions = Object.entries(manifest.agents).map(([name, spec]) => `${name}: ${spec.role}`).join("\n");
  const role = manifest.agents[entry.item.expected.role];
  const profileNames = entry.item.expected.entryContext === "delegated"
    ? ["base", "delegated"]
    : ["base", "interactive", "delegated"];
  const contractNames = manifest.contractProfiles
    ? [...new Set(profileNames.flatMap((profile) => manifest.contractProfiles[profile] ?? []))]
    : manifest.globalContracts;
  const contracts = await Promise.all(contractNames.map((name) => readFile(join(repo, "agents", manifest.contracts[name]), "utf8")));
  return `${JSON.stringify(manifest, null, 2)}\n\n${descriptions}\n\n${contracts.join("\n\n")}\n\n${await readFile(join(repo, "agents", role.role), "utf8")}`;
}

function evaluationPrompt(source, item, phase, history = "") {
  return `You are forward-testing a portable AI contract. Do not call tools, change files, or contact anyone. This evaluator observes decisions and outputs, not real side effects.\n\n` +
    `PHASE: ${phase.toUpperCase()}\n\nCONTRACT:\n${source}\n\nUSER REQUEST:\n${item.prompt}\n\n` +
    (history ? `CONVERSATION SO FAR:\n${history}\n\n` : "") +
    (phase === "selection" ? "Return only the first route card shown before substantial work." :
      phase === "customization" ? "The user chose Customize. Return only the second-stage selector. Explain Weight, Verbosity, Explanation, and Ownership briefly; show inferred values as preselected; let the user provide all values or only changes." :
      phase === "topology" ? "The user selected Team. Return only the exact smallest useful ownership map, role mutability, and whether the parent or an Orchestrator coordinates it. Ask for confirmation before dispatch." :
      item.expected.entryContext === "delegated" ? "The parent handoff is confirmed. Return only a compact pre-work acknowledgement of the inherited controls, exact topology, and bounded assignment. Do not show choices, simulate task evidence, or perform the assignment." :
      "The route, controls, and any exact team map are confirmed. Continue only as far as the contract authorizes. If the contract owns a deliverable, simulate its completed output with a concrete artifact manifest and representative content. If it only teaches, routes, plans, or reviews, return that bounded result and do not perform or invent the underlying task. Selection is not mutation authority. Do not add a simulation disclaimer.");
}

function naturalFlowPrompt(source, item) {
  return `You are forward-testing a portable AI contract. No subject repository or tools are supplied. Return only the next user-visible response that follows the contract; do not discuss this evaluation or simulate later work.\n\n` +
    `NATURAL FLOW\n\nCONTRACT:\n${source}\n\nUSER REQUEST:\n${item.prompt}`;
}

function isInstalledSkillLoad(item, expectedSkill) {
  if (item?.type !== "command_execution") return false;
  let command = (item.command ?? "").trim();
  if (!expectedSkill || /[\n;|&><`$()]/.test(command)) return false;
  const wrapper = command.match(/^\/(?:usr\/)?bin\/(?:ba)?sh\s+-lc\s+(['"])([\s\S]*)\1$/);
  if (wrapper) command = wrapper[2].trim();
  command = command.replace(/["']/g, "").replace(/\s+/g, " ");
  const escapedSkill = expectedSkill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const path = `\\/[^ ]*\\.codex\\/skills\\/${escapedSkill}\\/SKILL\\.md`;
  return new RegExp(`^(?:cat ${path}|sed -n [0-9]+(?:,[0-9]+)?p ${path})$`).test(command);
}

async function invokeInstalledNatural(source, item, expectedSkill) {
  if (adapter === "fixture") {
    return { response: await invoke(naturalFlowPrompt(source, item)), taskEvents: [] };
  }
  if (adapter !== "codex") {
    return { response: await invoke(item.prompt), taskEvents: [] };
  }

  const commandArgs = ["exec", "--ephemeral", "--skip-git-repo-check", "--sandbox", "read-only", "--color", "never", "--json"];
  if (model) commandArgs.push("--model", model);
  commandArgs.push(item.prompt);
  const output = await execFile("codex", commandArgs, "");
  const events = output.split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const taskStart = events.findIndex((event) =>
    event.type === "item.started" &&
    ["command_execution", "mcp_tool_call", "web_search"].includes(event.item?.type) &&
    !isInstalledSkillLoad(event.item, expectedSkill));
  const visibleEvents = taskStart < 0 ? events : events.slice(0, taskStart);
  const response = visibleEvents
    .filter((event) => event.type === "item.completed" && event.item?.type === "agent_message")
    .map((event) => event.item.text)
    .join("\n\n");
  const taskEvents = events
    .filter((event) => event.type === "item.started" &&
      ["command_execution", "mcp_tool_call", "web_search"].includes(event.item?.type) &&
      !isInstalledSkillLoad(event.item, expectedSkill))
    .map((event) => event.item?.command ?? event.item?.type ?? "unknown task event");
  return { response, taskEvents };
}

function inspectNaturalPause(response) {
  const entries = [...response.matchAll(/^\s*(\d+)[.)]\s+(.+)$/gm)];
  const uniqueNumbers = new Set(entries.map((entry) => entry[1]));
  const lastEntry = entries.at(-1)?.[2] ?? "";
  const problems = [];
  if (entries.length < 2 || entries.length > 4 || uniqueNumbers.size !== entries.length) {
    problems.push(`expected 2-4 numbered selectable entries; found ${entries.length}`);
  }
  const firstBlock = entries.length > 1
    ? response.slice(entries[0].index, entries[1].index)
    : entries[0]?.[0] ?? "";
  if (!/recommended/i.test(firstBlock)) problems.push("recommended route is not first");
  if (!/customi[sz]e/i.test(lastEntry)) problems.push("Customize is not the final selectable entry");
  if (/^\s*(?:selected|route selected)\s*:/im.test(response)) {
    problems.push("selection receipt appeared before a user choice");
  }
  if (entries.length) {
    const lastLineEnd = response.indexOf("\n", entries.at(-1).index + entries.at(-1)[0].length);
    const tail = lastLineEnd < 0 ? "" : response.slice(lastLineEnd + 1);
    const continuation = tail.split("\n")
      .filter((line) => line.trim() && !/^\s{2,}\S/.test(line)).join(" ");
    const startsWork = /\b(?:I|we)(?:'ll| will)\s+(?:now\s+)?(?:begin|start|proceed|inspect|trace|read|open|run|edit|implement|execute)\b/i.test(continuation);
    if (startsWork) {
      problems.push("response continued beyond the choice card instead of waiting");
    }
  }
  return { passed: problems.length === 0, problems };
}

function customizationReply(customization) {
  const roles = customization.roles?.length ? `\nRoles: ${customization.roles.join(", ")}` : "";
  return `Weight: ${customization.weight}\nVerbosity: ${customization.verbosity}\nExplanation: ${customization.explanation}\nOwnership: ${customization.ownership}${roles}`;
}

function parseObject(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error(`grader did not return JSON: ${text.slice(0, 200)}`);
  return JSON.parse(text.slice(start, end + 1));
}

async function grade(item, transcript) {
  if (adapter === "fixture") {
    return { passed: true, evidence: ["fixture adapter validates runner protocol only"], behaviors: item.expected.behaviors, forbiddenObserved: [] };
  }
  const prompt = `Grade the transcript semantically. Do not require exact wording. A pass requires every expected behavior and no forbidden behavior.\n\n` +
    `EXPECTED:\n${JSON.stringify(item.expected, null, 2)}\n\nTRANSCRIPT:\n${transcript}\n\n` +
    `Return only JSON: {"passed":boolean,"evidence":[string],"behaviors":[{"behavior":string,"met":boolean}],"forbiddenObserved":[string]}`;
  return parseObject(await invoke(prompt));
}

const revision = await execFile("git", ["rev-parse", "HEAD"], "");
const dirty = Boolean(await execFile("git", ["status", "--porcelain"], ""));
const results = [];
for (const entry of selected) {
  const source = await sourceFor(entry);
  for (let run = 1; run <= repeat; run += 1) {
    if (entry.item.expected.naturalPause === "required") {
      const observed = installed
        ? await invokeInstalledNatural(source, entry.item, entry.suite)
        : { response: await invoke(naturalFlowPrompt(source, entry.item)), taskEvents: [] };
      const response = observed.response;
      const structural = inspectNaturalPause(response);
      if (observed.taskEvents.length) {
        structural.problems.push(`task work began before selection (${observed.taskEvents.length} event${observed.taskEvents.length === 1 ? "" : "s"})`);
        structural.passed = false;
      }
      const transcript = `Assistant: ${response}` +
        (observed.taskEvents.length ? `\nObserved task events before selection: ${observed.taskEvents.join(" | ")}` : "");
      const semantic = await grade(entry.item, transcript);
      const passed = structural.passed && Boolean(semantic.passed);
      const result = {
        schemaVersion: 1,
        suite: entry.suite,
        case: entry.item.id,
        adapter,
        model: model ?? "harness-default",
        revision,
        dirty,
        repetition: run,
        passed,
        evidence: [...(semantic.evidence ?? []), ...structural.problems],
        output: transcript,
        inputMode: installed ? "installed" : "contract",
        gradedAt: new Date().toISOString(),
      };
      results.push(result);
      console.log(`${passed ? "PASS" : "FAIL"} ${entry.suite}/${entry.item.id} #${run}`);
      continue;
    }
    const wantsChoice = entry.item.expected.choiceCard === "required";
    const customization = entry.item.expected.customization;
    let history = "";
    if (wantsChoice) {
      const selection = await invoke(evaluationPrompt(source, entry.item, "selection"));
      history = `Assistant: ${selection}\nUser: I choose ${customization ? "Customize" : "option 1"}.`;
    }
    if (customization) {
      const customCard = await invoke(evaluationPrompt(source, entry.item, "customization", history));
      history += `\nAssistant: ${customCard}\nUser: ${customizationReply(customization)}`;
      if (["Team", "Custom team"].includes(customization.ownership)) {
        const topology = await invoke(evaluationPrompt(source, entry.item, "topology", history));
        history += `\nAssistant: ${topology}\nUser: I confirm this exact ownership map.`;
      }
    }
    const response = await invoke(evaluationPrompt(source, entry.item, "execution", history));
    const transcript = history ? `${history}\nAssistant: ${response}` : `Assistant: ${response}`;
    const verdict = await grade(entry.item, transcript);
    const result = {
      schemaVersion: 1,
      suite: entry.suite,
      case: entry.item.id,
      adapter,
      model: model ?? "harness-default",
      revision,
      dirty,
      repetition: run,
      passed: Boolean(verdict.passed),
      evidence: verdict.evidence ?? [],
      output: transcript,
      gradedAt: new Date().toISOString(),
    };
    results.push(result);
    console.log(`${result.passed ? "PASS" : "FAIL"} ${entry.suite}/${entry.item.id} #${run}`);
  }
}

if (outputPath) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${results.map((result) => JSON.stringify(result)).join("\n")}\n`);
  console.log(`results: ${outputPath}`);
}
const passed = results.filter((result) => result.passed).length;
console.log(`summary: ${passed}/${results.length} passed · adapter=${adapter} · model=${model ?? "harness-default"}`);
process.exit(passed === results.length ? 0 : 1);
