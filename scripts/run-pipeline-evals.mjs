#!/usr/bin/env node

import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const suitePath = resolve(repo, "evals/pipeline/cases.json");
const STAGES = ["undumbify", "shapeify", "shipify", "reviewify"];
const TOPOLOGY = {
  id: "TOPO-1",
  roles: ["planner", "worker", "reviewer"],
  coordinator: "parent",
  writer: "worker",
  worktrees: { planner: "read-only", worker: "dedicated", reviewer: "dedicated" },
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const fingerprint = (value) => JSON.stringify(value);
const PIPELINE_KINDS = new Set(["approve", "authority-escalation", "delta-repair", "no-progress"]);
const PIPELINE_CATEGORIES = new Set(["integration", "authority", "boundary"]);
const PIPELINE_TERMINALS = new Set(["approved", "blocked"]);
const PIPELINE_TERMINATIONS = new Set(["approved", "authority-stop", "equivalent-repair"]);
const INDEX_STATUSES = new Set(["draft", "ready", "active", "review-ready", "changes-requested", "blocked", "done"]);

function usage(code = 0) {
  const stream = code ? process.stderr : process.stdout;
  stream.write(`Usage: node scripts/run-pipeline-evals.mjs [options]\n\n` +
    `  --adapter fixture   Run the deterministic state-transition fixture (default)\n` +
    `  --case ID           Run one exact pipeline-chain case\n` +
    `  --repeat N          Repetitions per case (default: 1)\n` +
    `  --limit N           Stop after N cases\n` +
    `  --out FILE          JSONL result path\n` +
    `  --dry-run           Resolve cases without executing transitions\n` +
    `  -h, --help          Show this help\n`);
  process.exit(code);
}

export function parseArgs(args) {
  const options = { adapter: "fixture", repeat: 1, limit: Infinity, dryRun: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--adapter") options.adapter = args[++index];
    else if (arg === "--case") options.caseId = args[++index];
    else if (arg === "--repeat") options.repeat = Number(args[++index]);
    else if (arg === "--limit") options.limit = Number(args[++index]);
    else if (arg === "--out") options.out = resolve(args[++index]);
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "-h" || arg === "--help") usage(0);
    else usage(64);
  }
  if (options.adapter !== "fixture" || !Number.isInteger(options.repeat) || options.repeat < 1 ||
      (!Number.isInteger(options.limit) && options.limit !== Infinity)) usage(64);
  return options;
}

export function validatePipelineSuite(suite) {
  const errors = [];
  if (!suite || typeof suite !== "object" || Array.isArray(suite)) return ["suite must be an object"];
  if (suite.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (suite.suite !== "pipeline-chain") errors.push("suite must be pipeline-chain");
  if (fingerprint(suite.stages) !== fingerprint(STAGES)) errors.push(`stages must be ${STAGES.join(" -> ")}`);
  if (!Array.isArray(suite.cases) || suite.cases.length < 3) return [...errors, "cases must contain at least three entries"];
  const ids = new Set();
  suite.cases.forEach((item, index) => {
    const at = `cases[${index}]`;
    if (!item || typeof item !== "object" || Array.isArray(item)) { errors.push(`${at} must be an object`); return; }
    if (typeof item.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) errors.push(`${at}.id is invalid`);
    else if (ids.has(item.id)) errors.push(`${at}.id is duplicated`);
    else ids.add(item.id);
    if (!PIPELINE_CATEGORIES.has(item.category)) errors.push(`${at}.category is invalid`);
    if (typeof item.prompt !== "string" || item.prompt.trim().length < 10) errors.push(`${at}.prompt is invalid`);
    if (!item.scenario || !PIPELINE_KINDS.has(item.scenario.kind)) errors.push(`${at}.scenario.kind is invalid`);
    if (item.scenario?.repairEvidence !== undefined &&
        (!Array.isArray(item.scenario.repairEvidence) || item.scenario.repairEvidence.some((value) => typeof value !== "string" || !value.trim()))) {
      errors.push(`${at}.scenario.repairEvidence is invalid`);
    }
    const expected = item.expected;
    if (!expected || typeof expected !== "object") { errors.push(`${at}.expected is invalid`); return; }
    if (!PIPELINE_TERMINALS.has(expected.terminal)) errors.push(`${at}.expected.terminal is invalid`);
    if (!PIPELINE_TERMINATIONS.has(expected.termination)) errors.push(`${at}.expected.termination is invalid`);
    if (!Array.isArray(expected.stages) || expected.stages.length < 3 || expected.stages.some((stage) => !STAGES.includes(stage))) {
      errors.push(`${at}.expected.stages is invalid`);
    }
    if (!Array.isArray(expected.indexStatuses) || expected.indexStatuses.length < 3 ||
        expected.indexStatuses.some((status) => !INDEX_STATUSES.has(status))) {
      errors.push(`${at}.expected.indexStatuses is invalid`);
    }
    for (const field of ["singleReceipt", "stableIds", "stableTopology"]) {
      if (expected[field] !== true) errors.push(`${at}.expected.${field} must be true`);
    }
    for (const field of ["authorityEscalation", "deltaRepair"]) {
      if (expected[field] !== undefined && typeof expected[field] !== "boolean") errors.push(`${at}.expected.${field} must be boolean`);
    }
  });
  return errors;
}

function initialState(item) {
  return {
    schemaVersion: 1,
    pipelineId: `PIPE-${item.id}`,
    receipt: {
      id: "RCPT-1",
      mode: "pipeline",
      weight: "Standard",
      verbosity: "Concise",
      ownership: "Team",
      topologyId: TOPOLOGY.id,
      selectionCount: 1,
    },
    topology: clone(TOPOLOGY),
    intentBrief: null,
    packet: null,
    index: null,
    execution: null,
    review: null,
    executionHistory: [],
    reviewHistory: [],
    repairCycles: [],
    indexTransitions: [],
    events: [],
    snapshots: [],
    terminal: null,
    termination: null,
  };
}

function snapshot(state) {
  const result = clone(state);
  delete result.snapshots;
  return result;
}

function transition(state, stage, action) {
  action();
  state.events.push({
    stage,
    receiptId: state.receipt.id,
    topologyId: state.topology.id,
    selectionCount: state.receipt.selectionCount,
  });
  state.snapshots.push({ stage, state: snapshot(state) });
}

function applyFault(state, point) {
  const fault = process.env.SKILLIFY_PIPELINE_FAULT;
  if (!fault) return;
  if (fault === "reselect" && point === "after-shapeify") state.receipt.selectionCount = 2;
  if (fault === "break-provenance" && point === "after-shapeify") state.packet.sourceBriefId = "IB-missing";
  if (fault === "drift-id" && point === "after-shapeify") state.packet.requirements[0].id = "R9";
  if (fault === "skip-review" && point === "before-reviewify") state.packet.acceptance = [];
}

function runTransitions(item) {
  const state = initialState(item);
  const kind = item.scenario.kind;
  transition(state, "undumbify", () => {
    state.intentBrief = {
      schemaVersion: 1,
      id: "IB-1",
      intent: "Make checkout confirmation clearer without slowing the approved path.",
      constraints: ["Keep one writer per worktree", "Do not delete production data"],
      antiExamples: ["No silent mutation", "No route reselection in delegated lanes"],
      priorities: ["correctness", "evidence", "speed"],
      currentState: "Checkout confirmation exists but its persisted state is not covered by the direct proof.",
      targetState: "The confirmation change is implemented and its persisted state is directly verified.",
      feelingOfDone: "The reviewer can trace each requirement from the Brief to observed evidence.",
      topology: clone(TOPOLOGY),
    };
  });
  transition(state, "shapeify", () => {
    state.packet = {
      schemaVersion: 1,
      id: "PKT-1",
      sourceBriefId: state.intentBrief.id,
      weight: state.receipt.weight,
      planFolder: `plans/2026-09-03-${item.id}/`,
      indexPath: `plans/2026-09-03-${item.id}/index.md`,
      requirements: [{ id: "R1", source: "IB-1.targetState", text: state.intentBrief.targetState }],
      invariants: [{ id: "I1", source: "IB-1.constraints", text: "Unapproved mutation never occurs." }],
      steps: [{ id: "P1", slice: "S1", location: "checkout confirmation", dependsOn: [] }],
      slices: [{ id: "S1", status: "ready", steps: ["P1"], acceptance: ["A1"] }],
      acceptance: [{ id: "A1", proves: ["R1", "I1"], proofOwner: "testify", condition: "Direct proof observes persisted checkout state." }],
    };
    state.index = {
      schemaVersion: 1,
      path: state.packet.indexPath,
      status: "draft",
      owner: "parent/integration-owner",
      transitions: [{ status: "draft", actor: "shapeify" }],
    };
    state.indexTransitions.push({ status: "draft", actor: "shapeify" });
    state.index.transitions.push({ status: "ready", actor: "shapeify" });
    state.index.status = "ready";
    state.indexTransitions.push({ status: "ready", actor: "shapeify" });
    applyFault(state, "after-shapeify");
  });

  transition(state, "shipify", () => {
    const destructive = kind === "authority-escalation";
    state.indexTransitions.push({ status: "active", actor: "parent/integration-owner", requestedBy: "shipify" });
    state.index.transitions.push({ status: "active", actor: "parent/integration-owner", requestedBy: "shipify" });
    state.index.status = "active";
    state.execution = {
      schemaVersion: 1,
      packetId: state.packet.id,
      sliceId: "S1",
      baselineRevision: "REV-BASE",
      evidencePath: `${state.packet.planFolder}evidence/S1-report.md`,
      status: destructive ? "blocked" : "review-ready",
      requestedIndexStatus: destructive ? "blocked" : "review-ready",
      evidenceFingerprint: "EVIDENCE-1",
      steps: [{ stepId: "P1", result: destructive ? "stopped-before-mutation" : "passed", check: "checkout-state-test" }],
      acceptance: [{ acceptanceId: "A1", result: destructive ? "not-run" : "passed", proofOwner: "testify" }],
      authorityEscalation: destructive ? {
        decision: "unapproved production deletion discovered",
        requestedFrom: "parent",
        beforeMutation: true,
        recoveryPointPreserved: true,
      } : null,
    };
    state.executionHistory.push(clone(state.execution));
    state.indexTransitions.push({ status: state.execution.requestedIndexStatus, actor: "parent/integration-owner", requestedBy: "shipify" });
    state.index.transitions.push({ status: state.execution.requestedIndexStatus, actor: "parent/integration-owner", requestedBy: "shipify" });
    state.index.status = state.execution.requestedIndexStatus;
    if (destructive) {
      state.terminal = "blocked";
      state.termination = { reason: "authority-stop", nextOwner: "parent" };
    }
  });

  if (kind === "authority-escalation") return state;

  transition(state, "reviewify", () => {
    applyFault(state, "before-reviewify");
    const finding = kind === "delta-repair" || kind === "no-progress";
    state.review = {
      schemaVersion: 1,
      id: "REV-1",
      mode: "full",
      executionEvidencePath: state.execution.evidencePath,
      coverage: [{ requirementId: "R1", invariantId: "I1", acceptanceId: "A1", observed: true }],
      findings: finding ? [{ id: "F1", severity: "Blocking", affected: ["R1", "I1"], fix: "Make the persisted-state proof observable." }] : [],
      verdict: finding ? "changes-requested" : "Approve",
      requestedIndexStatus: finding ? "changes-requested" : "done",
      actor: "reviewer",
    };
    state.reviewHistory.push(clone(state.review));
    state.indexTransitions.push({ status: state.review.requestedIndexStatus, actor: "parent/integration-owner", requestedBy: "reviewify" });
    state.index.transitions.push({ status: state.review.requestedIndexStatus, actor: "parent/integration-owner", requestedBy: "reviewify" });
    state.index.status = state.review.requestedIndexStatus;
    if (!finding) {
      state.terminal = "approved";
      state.termination = { reason: "approved", nextOwner: "done" };
    }
  });

  if (kind !== "delta-repair" && kind !== "no-progress") return state;

  const progressed = kind === "delta-repair";
  transition(state, "shipify", () => {
    state.indexTransitions.push({ status: "active", actor: "parent/integration-owner", requestedBy: "shipify-repair" });
    state.index.transitions.push({ status: "active", actor: "parent/integration-owner", requestedBy: "shipify-repair" });
    state.index.status = "active";
    const evidenceFingerprint = progressed ? "EVIDENCE-2" : "EVIDENCE-1";
    const newEvidence = progressed ? (item.scenario.repairEvidence?.[0] ?? "new observed proof") : "";
    state.execution = {
      ...clone(state.execution),
      status: "review-ready",
      requestedIndexStatus: "review-ready",
      evidencePath: `${state.packet.planFolder}evidence/S1-repair-1-report.md`,
      evidenceFingerprint,
      repair: { findingId: "F1", newEvidence, equivalent: !progressed },
      steps: [{ stepId: "P1", result: "passed", check: progressed ? "persisted-state-test" : "checkout-state-test" }],
      acceptance: [{ acceptanceId: "A1", result: "passed", proofOwner: "testify", evidence: newEvidence }],
    };
    state.executionHistory.push(clone(state.execution));
    state.repairCycles.push({ cycle: 1, findingId: "F1", before: "changes-requested", evidenceBefore: "EVIDENCE-1", evidenceAfter: evidenceFingerprint, newEvidence: Boolean(newEvidence), equivalent: !progressed });
    state.indexTransitions.push({ status: "review-ready", actor: "parent/integration-owner", requestedBy: "shipify" });
    state.index.transitions.push({ status: "review-ready", actor: "parent/integration-owner", requestedBy: "shipify" });
    state.index.status = "review-ready";
  });
  transition(state, "reviewify", () => {
    const equivalent = !progressed;
    state.review = {
      schemaVersion: 1,
      id: "REV-2",
      priorReviewId: "REV-1",
      mode: "delta",
      executionEvidencePath: state.execution.evidencePath,
      coverage: [{ requirementId: "R1", invariantId: "I1", acceptanceId: "A1", observed: true }],
      findings: equivalent ? [{ id: "F1", severity: "Blocking", affected: ["R1", "I1"], fix: "Produce new evidence or route the plan defect." }] : [],
      verdict: equivalent ? "changes-requested" : "Approve",
      requestedIndexStatus: equivalent ? "blocked" : "done",
      actor: "reviewer",
      rechecked: ["prior finding F1", "changed lines", "acceptance A1", "repair consequences"],
    };
    state.reviewHistory.push(clone(state.review));
    state.indexTransitions.push({ status: state.review.requestedIndexStatus, actor: "parent/integration-owner", requestedBy: "reviewify" });
    state.index.transitions.push({ status: state.review.requestedIndexStatus, actor: "parent/integration-owner", requestedBy: "reviewify" });
    state.index.status = state.review.requestedIndexStatus;
    state.terminal = equivalent ? "blocked" : "approved";
    state.termination = equivalent
      ? { reason: "equivalent-repair", nextOwner: "shapeify or parent", cycles: state.repairCycles.length }
      : { reason: "approved", nextOwner: "done", cycles: state.repairCycles.length };
  });
  return state;
}

function validateState(item, state) {
  const checks = [];
  const check = (name, condition, detail) => checks.push({ name, passed: Boolean(condition), detail });
  const expectedStages = item.expected.stages;
  const actualStages = state.events.map((event) => event.stage);
  const actualStatuses = state.indexTransitions.map((entry) => entry.status);
  check("stage chain", JSON.stringify(actualStages) === JSON.stringify(expectedStages), `${actualStages.join(" -> ")} (expected ${expectedStages.join(" -> ")})`);
  check("expected terminal", state.terminal === item.expected.terminal, `${state.terminal} (expected ${item.expected.terminal})`);
  check("expected termination", state.termination?.reason === item.expected.termination, `${state.termination?.reason ?? "missing"} (expected ${item.expected.termination})`);
  check("index lifecycle", JSON.stringify(actualStatuses) === JSON.stringify(item.expected.indexStatuses), `${actualStatuses.join(" -> ")} (expected ${item.expected.indexStatuses.join(" -> ")})`);
  const singleReceipt = state.receipt.selectionCount === 1 && state.events.every((event) => event.receiptId === "RCPT-1");
  check("single entry receipt", singleReceipt === item.expected.singleReceipt, `actual=${singleReceipt}, expected=${item.expected.singleReceipt}`);
  const stableTopology = state.events.every((event) => event.topologyId === TOPOLOGY.id) && fingerprint(state.topology) === fingerprint(TOPOLOGY);
  check("stable topology", stableTopology === item.expected.stableTopology, `actual=${stableTopology}, expected=${item.expected.stableTopology}`);
  const stableIds = state.intentBrief?.id === "IB-1" && state.packet?.id === "PKT-1" &&
    state.packet.sourceBriefId === state.intentBrief?.id && state.packet.requirements[0]?.id === "R1" &&
    state.packet.invariants[0]?.id === "I1" && state.packet.acceptance[0]?.id === "A1" &&
    state.packet.steps[0]?.id === "P1" && state.packet.slices[0]?.id === "S1";
  check("stable artifact IDs", stableIds === item.expected.stableIds, `actual=${stableIds}, expected=${item.expected.stableIds}`);
  check("canonical index", state.packet?.indexPath?.endsWith("/index.md") && state.index?.path === state.packet?.indexPath &&
    !state.packet?.indexPath?.endsWith("/README.md"), state.index?.path ?? "missing");
  check("Brief-to-packet provenance", state.packet?.requirements[0]?.source === "IB-1.targetState" && state.packet?.sourceBriefId === "IB-1", state.packet?.requirements[0]?.source ?? "missing");
  check("acceptance ownership", state.packet?.acceptance[0]?.proofOwner === "testify", `A1 proofOwner=${state.packet?.acceptance[0]?.proofOwner ?? "missing"}`);
  check("execution evidence", state.executionHistory.length >= 1 && state.executionHistory.every((execution) => execution.evidencePath.includes("evidence/")), `${state.executionHistory.length} evidence records`);
  if (Object.hasOwn(item.expected, "authorityEscalation")) {
    const authorityEscalation = state.execution?.authorityEscalation?.beforeMutation === true &&
      state.execution?.authorityEscalation?.recoveryPointPreserved === true && state.terminal === "blocked";
    check("expected authority escalation", authorityEscalation === item.expected.authorityEscalation, `actual=${authorityEscalation}, expected=${item.expected.authorityEscalation}`);
  }
  if (Object.hasOwn(item.expected, "deltaRepair")) {
    const first = state.reviewHistory[0];
    const second = state.reviewHistory[1];
    const deltaRepair = first?.verdict === "changes-requested" && second?.mode === "delta" &&
      second?.priorReviewId === "REV-1" && second?.rechecked?.length === 4;
    check("expected delta repair", deltaRepair === item.expected.deltaRepair, `actual=${deltaRepair}, expected=${item.expected.deltaRepair}`);
  }
  if (item.scenario.kind === "authority-escalation") {
    check("authority stop skips review", state.reviewHistory.length === 0 && actualStages.at(-1) === "shipify", "Reviewify did not run after blocked execution");
    check("authority index ownership", state.indexTransitions.some((entry) => entry.actor === "parent/integration-owner" && entry.status === "blocked"), "parent owns blocked index transition");
  } else {
    check("review coverage", state.reviewHistory.every((review) => review.coverage.some((coverage) => coverage.requirementId === "R1" && coverage.invariantId === "I1" && coverage.acceptanceId === "A1")), "R1/I1 -> A1 observed");
    check("verdict state", state.review?.verdict === (state.terminal === "approved" ? "Approve" : "changes-requested"), `${state.review?.verdict ?? "missing"} -> ${state.terminal}`);
  }
  if (item.scenario.kind === "delta-repair" || item.scenario.kind === "no-progress") {
    const first = state.reviewHistory[0];
    const second = state.reviewHistory[1];
    const cycle = state.repairCycles[0];
    check("delta review", first?.verdict === "changes-requested" && second?.mode === "delta" && second?.priorReviewId === "REV-1" && second?.rechecked?.length === 4, "REV-1 -> delta REV-2 rechecks prior finding, changed lines, acceptance and consequences");
    check("repair evidence transition", Boolean(cycle) && (item.scenario.kind === "delta-repair" ? cycle.newEvidence && cycle.evidenceBefore !== cycle.evidenceAfter : !cycle.newEvidence && cycle.equivalent), cycle ? `${cycle.evidenceBefore} -> ${cycle.evidenceAfter}` : "missing repair cycle");
    check("repair termination", item.scenario.kind === "delta-repair"
      ? state.terminal === "approved" && state.termination.reason === "approved"
      : state.terminal === "blocked" && state.termination.reason === "equivalent-repair" && state.repairCycles.length === 1,
    `${state.termination?.reason ?? "missing"}, cycles=${state.repairCycles.length}`);
  }
  if (process.env.SKILLIFY_PIPELINE_FAULT === "skip-review") {
    check("fault injection must fail acceptance", state.packet.acceptance.length > 0, "acceptance was intentionally removed");
  }
  return {
    passed: checks.every((entry) => entry.passed),
    evidence: checks.map((entry) => `${entry.passed ? "PASS" : "FAIL"} ${entry.name}: ${entry.detail}`),
  };
}

async function writeArtifact(root, relativePath, content) {
  const target = resolve(root, relativePath);
  if (target !== root && !target.startsWith(`${root}/`)) throw new Error(`artifact path escapes fixture root: ${relativePath}`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${content.trim()}\n`);
  return target;
}

async function materializeAndValidateArtifacts(state, artifactRoot) {
  const planFolder = state.packet.planFolder;
  const planRoot = resolve(artifactRoot, planFolder);
  if (!planRoot.startsWith(`${artifactRoot}/`)) throw new Error(`plan folder escapes fixture root: ${planFolder}`);
  await writeArtifact(artifactRoot, `${planFolder}intent-brief.md`, `
# Intent Brief
**schemaVersion:** ${state.intentBrief.schemaVersion}
**ID:** ${state.intentBrief.id}
**Target:** ${state.intentBrief.targetState}
**Invariant:** ${state.intentBrief.constraints[1]}
`);
  await writeArtifact(artifactRoot, `${planFolder}packet.md`, `
# Worker Packet
**schemaVersion:** ${state.packet.schemaVersion}
**ID:** ${state.packet.id}
**Source Brief:** ${state.packet.sourceBriefId}
**Requirement:** ${state.packet.requirements.map((item) => `${item.id} <- ${item.source}`).join(", ")}
**Invariant:** ${state.packet.invariants.map((item) => `${item.id} <- ${item.source}`).join(", ")}
**Step:** ${state.packet.steps.map((item) => `${item.id} -> ${item.slice}`).join(", ")}
**Slice:** ${state.packet.slices.map((item) => `${item.id} -> ${item.acceptance.join(",")}`).join(", ")}
**Acceptance:** ${state.packet.acceptance.map((item) => `${item.id} proves ${item.proves.join(",")} owner ${item.proofOwner}`).join("; ")}
`);
  await writeArtifact(artifactRoot, `${planFolder}slices/S1-checkout.md`, `
# Slice S1
**schemaVersion:** 1
**Packet:** ${state.packet.id}
**Steps:** P1
**Acceptance:** A1 proves R1, I1
`);
  await writeArtifact(artifactRoot, `${planFolder}index.md`, `
# Plan
**schemaVersion:** 1
**Packet:** ${state.packet.id}
**Status:** ${state.index.status}
**Slices:** S1 status ${state.index.status}
**Revision Log:**
${state.indexTransitions.map((entry) => `- ${entry.status} by ${entry.actor}`).join("\n")}
`);
  for (const execution of state.executionHistory) {
    await writeArtifact(artifactRoot, execution.evidencePath, `
# Execution Evidence
**schemaVersion:** ${execution.schemaVersion}
**Packet:** ${execution.packetId}
**Slice:** ${execution.sliceId}
**Status:** ${execution.status}
**Fingerprint:** ${execution.evidenceFingerprint}
**Acceptance:** ${execution.acceptance.map((item) => `${item.acceptanceId} ${item.result} proves R1, I1`).join("; ")}
`);
  }
  if (state.review) {
    await writeArtifact(artifactRoot, `${planFolder}reviews/S1-review.md`, `
# Review S1
**schemaVersion:** ${state.review.schemaVersion}
**ID:** ${state.review.id}
**Packet:** ${state.packet.id}
**Evidence:** ${state.review.executionEvidencePath}
**Coverage:** ${state.review.coverage.map((item) => `${item.requirementId}, ${item.invariantId} -> ${item.acceptanceId}`).join("; ")}
**Findings:** ${state.review.findings.map((item) => `${item.id} affects ${item.affected.join(",")}`).join("; ") || "none"}
**Verdict:** ${state.review.verdict}
`);
  }

  const checks = [];
  const checkFile = async (name, relativePath, needles) => {
    try {
      const content = await readFile(resolve(artifactRoot, relativePath), "utf8");
      const missing = needles.filter((needle) => !content.includes(needle));
      checks.push({ name, passed: missing.length === 0, detail: missing.length ? `missing ${missing.join(", ")}` : relativePath });
    } catch (error) {
      checks.push({ name, passed: false, detail: `${relativePath}: ${error.code ?? error.message}` });
    }
  };
  await checkFile("intent artifact", `${planFolder}intent-brief.md`, ["schemaVersion:** 1", "IB-1"]);
  await checkFile("packet artifact", `${planFolder}packet.md`, ["schemaVersion:** 1", "PKT-1", "IB-1", "R1", "I1", "P1", "S1", "A1", "testify"]);
  await checkFile("slice artifact", `${planFolder}slices/S1-checkout.md`, ["schemaVersion:** 1", "PKT-1", "P1", "A1", "R1", "I1"]);
  await checkFile("index artifact", `${planFolder}index.md`, ["schemaVersion:** 1", `Status:** ${state.index.status}`, "S1"]);
  for (const [index, execution] of state.executionHistory.entries()) {
    await checkFile(`execution artifact ${index + 1}`, execution.evidencePath, ["schemaVersion:** 1", "PKT-1", "S1", "A1", "R1", "I1", execution.evidenceFingerprint]);
  }
  if (state.review) {
    await checkFile("review artifact", `${planFolder}reviews/S1-review.md`, ["schemaVersion:** 1", state.review.id, "PKT-1", state.review.executionEvidencePath, "R1", "I1", "A1", state.review.verdict]);
  } else {
    try {
      await readFile(resolve(planRoot, "reviews/S1-review.md"), "utf8");
      checks.push({ name: "authority review absence", passed: false, detail: "review artifact exists after authority stop" });
    } catch (error) {
      checks.push({ name: "authority review absence", passed: error.code === "ENOENT", detail: error.code === "ENOENT" ? "no review emitted" : error.message });
    }
  }
  return {
    passed: checks.every((entry) => entry.passed),
    evidence: checks.map((entry) => `${entry.passed ? "PASS" : "FAIL"} ${entry.name}: ${entry.detail}`),
  };
}

export function evaluateCase(item) {
  const state = runTransitions(item);
  const validation = validateState(item, state);
  return { ...validation, state };
}

export async function runPipelineEvals(options = {}) {
  const { adapter = "fixture", caseId, repeat = 1, limit = Infinity, out, dryRun = false } = options;
  if (adapter !== "fixture") throw new Error("pipeline-chain runner requires the fixture adapter; native model execution is not implemented");
  const suite = JSON.parse(await readFile(suitePath, "utf8"));
  const suiteErrors = validatePipelineSuite(suite);
  if (suiteErrors.length) throw new Error(`invalid pipeline suite:\n- ${suiteErrors.join("\n- ")}`);
  const filtered = caseId ? suite.cases.filter((item) => item.id === caseId) : suite.cases;
  if (caseId && filtered.length === 0) throw new Error(`unknown pipeline case: ${caseId}`);
  const selected = filtered.slice(0, limit);
  if (dryRun) {
    console.log(`resolved ${selected.length} cases from pipeline-chain; adapter=${adapter}; repeat=${repeat}`);
    return 0;
  }
  const results = [];
  for (const item of selected) {
    for (let repetition = 1; repetition <= repeat; repetition += 1) {
      const evaluation = evaluateCase(item);
      const artifactRoot = await mkdtemp(join(tmpdir(), "skillify-pipeline-artifacts-"));
      let artifactValidation;
      try {
        artifactValidation = await materializeAndValidateArtifacts(evaluation.state, artifactRoot);
      } finally {
        await rm(artifactRoot, { recursive: true, force: true });
      }
      const result = {
        schemaVersion: 1,
        suite: "pipeline-chain",
        case: item.id,
        adapter,
        model: "deterministic-fixture",
        revision: "fixture",
        dirty: true,
        repetition,
        passed: evaluation.passed && artifactValidation.passed,
        evidence: [...evaluation.evidence, ...artifactValidation.evidence],
        state: evaluation.state,
        gradedAt: new Date().toISOString(),
      };
      results.push(result);
      console.log(`${result.passed ? "PASS" : "FAIL"} pipeline/${item.id} #${repetition}`);
    }
  }
  if (out) {
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, `${results.map((result) => JSON.stringify(result)).join("\n")}\n`);
    console.log(`results: ${out}`);
  }
  const passed = results.filter((result) => result.passed).length;
  console.log(`summary: ${passed}/${results.length} passed · adapter=${adapter} · model=deterministic-fixture`);
  return passed === results.length ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    process.exitCode = await runPipelineEvals(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
