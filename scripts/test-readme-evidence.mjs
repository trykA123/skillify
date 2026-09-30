import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeResults, evalHeadline } from "./feedback-report.mjs";
import { evidenceSection, replaceEvidence } from "./readme-evidence.mjs";

const rows = [];
for (const model of ["haiku", "sonnet", "deepseek-flash"]) {
  for (const task of ["coding", "clarifying"]) for (const arm of ["base", "skill"]) {
    rows.push({
      model, task, arm, score: task === "coding" || arm === "skill" ? 1 : 0.5,
      cost: model === "sonnet" ? 0.4 : arm === "base" ? 0.1 : 0.2,
      turns: 5, seconds: 10,
      ...(model === "deepseek-flash" ? { costSource: "cli-estimate" } : {}),
    });
  }
}
const analysis = analyzeResults({ rows, files: [] }, {
  coding: { skill: "shipify", kind: "tests" },
  clarifying: { skill: "undumbify", kind: "rubric" },
});

test("README numbers and headline use the dashboard analysis", () => {
  const section = evidenceSection(analysis);
  const headline = evalHeadline(analysis.models);
  assert.ok(section.includes(headline.pre + headline.em));
  assert.match(section, /Claude Haiku \| 0\.75 \| 1\.00 \| \$0\.100 → \$0\.200 \(\+100%\)/);
  assert.match(section, /\$0\.133 → \$0\.200 \(\+50%\)/);
  assert.match(section, /DeepSeek Flash.*estimate.*not comparable/);
  assert.match(section, /clarifying.*undumbify.*0\.50 → 1\.00/);
  assert.match(section, /3 model\/task comparisons/);
  assert.match(section, /teachify.*unmeasured/);
  assert.match(section, /2 fixtures.*up to 1/);
});

test("replacement changes only the evidence section and is idempotent", () => {
  const before = "# Title\n\n## Does it help?\n\nstale\n\n### Field feedback\n\nKeep this literally.\n";
  const section = evidenceSection(analysis);
  const after = replaceEvidence(before, section);
  assert.ok(after.startsWith("# Title\n\n## Does it help?\n"));
  assert.ok(after.endsWith("### Field feedback\n\nKeep this literally.\n"));
  assert.equal(replaceEvidence(after, section), after);
  assert.throws(() => replaceEvidence("# No evidence heading", section), /evidence section/);
});

test("no results produce no numeric or quality claims", () => {
  const section = evidenceSection(analyzeResults({ rows: [], files: [] }));
  assert.match(section, /No paired results recorded/);
  assert.doesNotMatch(section, /\$|score.*1\.00|lifted/);
});
