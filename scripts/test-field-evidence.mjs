import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cp, mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { analyzeResults, catchNote, fieldEvidence, fieldModels, modelCoverage, parseEntries, render, usageSummary } from "./feedback-report.mjs";

const entry = (extra = {}) => ({ verdict: "helped", skills: ["shipify"], ...extra });

test("catches and helped cost exclude missing values and other verdicts", () => {
  const rows = parseEntries([
    entry({ catch: "Found an unhandled retry", tokens: 100 }),
    entry({ catch: "none", tokens: 300 }),
    entry(),
    entry({ verdict: "neutral", catch: "Found a stale link", tokens: 900 }),
  ].map(JSON.stringify).join("\n"));
  assert.deepEqual(fieldEvidence(rows), {
    helped: 3, catchCount: 1, catchRecorded: 2, catchRate: 1 / 3,
    medianTokens: 200, tokensRecorded: 2,
  });
  assert.equal(catchNote(rows[0]), "Found an unhandled retry");
  assert.equal(catchNote(rows[1]), "None reported.");
  assert.equal(catchNote(rows[2]), "Not recorded.");
  const html = render(rows);
  assert.match(html, /Catch<\/span><p>Found an unhandled retry/);
  assert.match(html, /33%/);
  assert.match(html, /200<small>2 of 3 helped/);
});

test("old entries remain unknown and recorded zero remains zero", () => {
  assert.deepEqual(fieldEvidence(parseEntries(JSON.stringify(entry()))), {
    helped: 1, catchCount: 0, catchRecorded: 0, catchRate: 0,
    medianTokens: null, tokensRecorded: 0,
  });
  assert.equal(fieldEvidence([entry({ tokens: 0, catch: "NONE" })]).medianTokens, 0);
  assert.equal(fieldEvidence([entry({ verdict: "hurt", catch: "Concrete catch" })]).catchRate, null);
});

test("usage has independent coverage and never imputes missing tool calls or duration as zero", () => {
  assert.deepEqual(usageSummary([{ tokens: 100, tools: 5 }, { tokens: 300 }, {}]), {
    tokens: { median: 200, recorded: 2 },
    tools: { median: 5, recorded: 1 },
    ms: { median: null, recorded: 0 },
  });
  assert.deepEqual(usageSummary([{ ms: 0 }, { tools: 0 }]).ms, { median: 0, recorded: 1 });
});

test("invalid catch fields fail with a located error", () => {
  for (const value of [null, 42, {}, "", "   "]) {
    assert.throws(() => parseEntries(JSON.stringify(entry({ catch: value }))), /line 1: catch must be/);
  }
  const html = render(parseEntries(JSON.stringify(entry({ catch: "Found <script>" }))));
  assert.match(html, /Found &lt;script&gt;/);
  assert.doesNotMatch(html, /<p>Found <script>/);
});

test("field-only Codex models have cards without fabricated paired scores", () => {
  const rows = parseEntries(JSON.stringify(entry({ model: "gpt-6", harness: "codex" })));
  const html = render(rows);
  assert.match(html, /id="model-coverage"/);
  assert.match(html, /<td>gpt-6<\/td><td>codex<\/td><td class="n">1<\/td><td>Not recorded<\/td>/);
  assert.match(html, /data-k="model" data-v="gpt-6"/);
  assert.match(html, /data-k="harness" data-v="codex"/);
  assert.match(html, /data-model="gpt-6" data-harness="codex"/);
  const card = html.match(/<article class="mcard" data-model="gpt-6" data-evidence="field">[\s\S]*?<\/article>/)?.[0];
  assert.ok(card, "Codex needs a model card even without paired results");
  assert.match(card, /1 field runs/);
  assert.match(card, /Score improvement<\/dt><dd>Not measured/);
  assert.match(card, /Cost per run<\/dt><dd>Not recorded/);
  assert.doesNotMatch(card, /class="score2"|class="pbs|\$0/);
});

test("coverage keeps exact model identities and distinguishes paired results from field counts", () => {
  const rows = [{ model: "gpt-6", harness: "codex" }, { model: "gpt-6", harness: "codex" }, { model: "sonnet-5.5", harness: "claude" }];
  const models = [{ model: "sonnet", base: { n: 3 }, skill: { n: 3 } }, { model: "gpt-6-astra", base: { n: 1 }, skill: { n: 2 } }];
  assert.deepEqual(modelCoverage(rows, models), [
    { model: "gpt-6", fieldRuns: 2, harnesses: ["codex"], paired: false },
    { model: "gpt-6-astra", fieldRuns: 0, harnesses: [], paired: true },
    { model: "sonnet", fieldRuns: 0, harnesses: [], paired: true },
    { model: "sonnet-5.5", fieldRuns: 1, harnesses: ["claude"], paired: false },
  ]);
  assert.deepEqual(modelCoverage([]), []);
  assert.equal(modelCoverage([], [{ model: "gpt-6", base: { n: 1 } }])[0].paired, false);
});

test("new field entries refresh exact model cards while missing usage stays unknown", () => {
  const rows = parseEntries([
    entry({ model: "gpt-6", harness: "codex", catch: "none", tokens: 0, tools: 0, ms: 0 }),
    entry({ model: "gpt-6", harness: "codex", verdict: "neutral", tokens: 100 }),
    entry({ model: "gpt-6", harness: "codex" }),
    entry({ model: "gpt-next", harness: "codex", verdict: "hurt" }),
  ].map(JSON.stringify).join("\n"));
  const [gpt, next] = fieldModels(rows);
  assert.deepEqual(gpt.verdicts, { helped: 2, neutral: 1, hurt: 0 });
  assert.deepEqual(gpt.usage.tokens, { median: 50, recorded: 2 });
  assert.deepEqual(gpt.usage.tools, { median: 0, recorded: 1 });
  assert.deepEqual(next.usage.ms, { median: null, recorded: 0 });
  assert.equal(next.model, "gpt-next");
  rows.push(entry({ model: "gpt-6", harness: "codex", tokens: 300, catch: "Found a missing retry guard" }));
  const updated = fieldModels(rows)[0];
  assert.equal(updated.fieldRuns, 4);
  assert.equal(updated.verdicts.helped, 3);
  assert.deepEqual(updated.usage.tokens, { median: 100, recorded: 3 });
  assert.equal(updated.evidence.catchCount, 1);
  assert.equal(updated.evidence.catchRecorded, 2);
});

const paired = (model, extra = {}) => analyzeResults({
  rows: [
    { model, task: "fixture", arm: "base", score: 0.4, cost: 0.02, turns: 1, seconds: 20, ...extra },
    { model, task: "fixture", arm: "skill", score: 0.8, cost: 0.03, turns: 2, seconds: 30, ...extra },
  ],
  files: [],
}, { fixture: { kind: "tests", skill: "shipify" } });

test("paired results replace a field card and populate task and cost comparisons", () => {
  const rows = parseEntries([
    entry({ model: "gpt-6", harness: "codex" }),
    entry({ model: "gpt-next", harness: "codex" }),
  ].map(JSON.stringify).join("\n"));
  const results = paired("gpt-6");
  assert.deepEqual(fieldModels(rows, results.models).map((m) => m.model), ["gpt-next"]);
  const html = render(rows, results);
  assert.equal([...html.matchAll(/class="mcard" data-model="gpt-6"/g)].length, 1);
  assert.doesNotMatch(html, /data-model="gpt-6" data-evidence="field"/);
  assert.match(html, /Mean score 0.40 without skills, 0.80 with skills/);
  assert.match(html, /data-cpp="gpt-6\|base">\$0.050/);
  assert.match(html, /class="tk-r pending" data-model="gpt-next"/);
  assert.match(html, /<th scope="row">gpt-next<\/th><td class="n">Not recorded/);
  assert.match(html, /<b>gpt-next<\/b> <a[^>]+>1 field runs<\/a>; paired results not recorded/);
});

test("GPT estimates do not inherit DeepSeek prices or billing claims", () => {
  const results = paired("gpt-6", { costSource: "cli-estimate" });
  const html = render([], results);
  assert.match(html, /Cost is a CLI estimate, not a provider invoice/);
  assert.match(html, /not comparable: CLI estimate/);
  assert.match(html, /with estimated costs excluded from comparisons/);
  assert.doesNotMatch(html, /DeepSeek|Anthropic|\$0\.01 per run/);
});

test("logger carries catch, accepts legacy entries, and rejects empty catch without appending", async () => {
  const root = await mkdtemp(join(tmpdir(), "skillify-field-test-"));
  try {
    await mkdir(join(root, "scripts"));
    for (const name of ["log-feedback.mjs", "feedback-report.mjs"]) {
      await cp(new URL(name, import.meta.url), join(root, "scripts", name));
    }
    const script = join(root, "scripts", "log-feedback.mjs");
    const args = [script, "--agent", "worker", "--task", "fixture", "--verdict", "helped", "--skills", "shipify"];
    for (const extra of [["--catch", "Caught a missing guard", "--tokens", "120"], ["--catch", "none"], []]) {
      execFileSync(process.execPath, [...args, ...extra], { stdio: "pipe" });
    }
    const log = join(root, "feedback", "field.jsonl");
    const before = await readFile(log, "utf8");
    const rows = parseEntries(before);
    assert.equal(rows[0].catch, "Caught a missing guard");
    assert.equal(rows[0].tokens, 120);
    assert.equal(rows[1].catch, "none");
    assert.equal(rows[2].catch, undefined);
    assert.equal(spawnSync(process.execPath, [...args, "--catch", ""]).status, 64);
    assert.equal(await readFile(log, "utf8"), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
