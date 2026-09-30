import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cp, mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { catchNote, fieldEvidence, parseEntries, render, usageSummary } from "./feedback-report.mjs";

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
