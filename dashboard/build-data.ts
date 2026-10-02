import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { analyzeResults, catchNote, evalHeadline, fieldEvidence, loadResults, modelCoverage, parseEntries, recurringAsks, usageSummary } from "../scripts/feedback-report.mjs";
import cats from "./categories.json";

const repo = join(import.meta.dir, "..");
const read = (p: string) => readFile(join(repo, p), "utf8");

const entries = parseEntries(await read("feedback/field.jsonl").catch(() => ""));
const skills = (await readdir(join(repo, "skills"), { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();
const agents = await Promise.all((await readdir(join(repo, "agents"))).filter((name) => name.endsWith(".md")).sort().map(async (file) => {
  const source = await read(`agents/${file}`);
  const header = source.match(/^---\n([\s\S]*?)\n---\n/);
  if (!header) throw new Error(`${file}: missing frontmatter`);
  const meta = Object.fromEntries(header[1].split("\n").flatMap((line) => {
    const part = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    return part ? [[part[1], part[2]]] : [];
  }));
  if (meta.name !== file.slice(0, -3) || !meta.description || !meta.capabilities) throw new Error(`${file}: invalid agent metadata`);
  return {
    name: meta.name,
    description: meta.description,
    capabilities: meta.capabilities.split(",").map((c) => c.trim()).filter(Boolean),
    skills: (meta.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    evidence: fieldEvidence(entries.filter((e: any) => e.agent === meta.name)),
  };
}));
const fieldBySkill = Object.fromEntries([...skills, "(none)"].map((name) => [
  name,
  fieldEvidence(entries.filter((e: any) => name === "(none)" ? !e.skills.length : e.skills.includes(name))),
]));

const pairedDir = join(repo, "evals", "paired");
const kinds: Record<string, { skill: string; kind: string }> = {};
const tasks = [];
for (const name of (await readdir(pairedDir)).sort()) {
  const t = JSON.parse(await readFile(join(pairedDir, name, "task.json"), "utf8"));
  kinds[name] = { skill: t.skill, kind: t.kind };
  let hiddenTests = 0;
  const hiddenFiles: string[] = [];
  for (const f of await readdir(join(pairedDir, name, "hidden")).catch(() => [] as string[])) {
    const src = await readFile(join(pairedDir, name, "hidden", f), "utf8");
    hiddenFiles.push(f);
    hiddenTests += (src.match(/\b(?:test|it)\s*\(/g) ?? []).length;
  }
  const items: string[] = t.rubric?.planted ?? t.rubric?.decisions ?? [];
  const scoring =
    t.kind === "tests"
      ? `Run in a fresh copy of the repo. ${hiddenTests} hidden tests the model never sees check the behaviour. Score = hidden tests passed ÷ ${hiddenTests || "total"}. If the repo's own visible tests fail afterwards, the score is halved.`
      : `A separate model (Codex) grades the final answer against the rubric below. ${t.rubric?.scoring ?? ""}`.trim();
  const meta = (cats.tasks as Record<string, { category: string; sub: string }>)[name];
  tasks.push({
    task: name,
    skill: t.skill,
    kind: t.kind,
    category: meta?.category ?? "other",
    sub: meta?.sub ?? "",
    prompt: t.prompt,
    history: t.history ?? [],
    note: t.note ?? "",
    rubricItems: items,
    rubricLabel: t.rubric?.planted ? "Planted issues" : t.rubric?.decisions ? "Decisions it should raise" : "",
    hiddenTests,
    hiddenFiles,
    scoring,
  });
}

const results = await loadResults(join(repo, "evals", "results"));
const analysis = analyzeResults(results, kinds);
const headline = evalHeadline(analysis.models);
const runs = results.rows.map((r: any) => ({
  task: r.task,
  arm: r.arm,
  model: r.model,
  score: r.score,
  cost: r.cost,
  turns: r.turns,
  seconds: r.seconds,
  costSource: r.costSource ?? "cli",
  hidden: r.detail?.hidden ?? null,
  visibleOk: r.detail?.visibleOk ?? null,
  failed: r.detail?.failed ?? [],
  credited: r.detail?.credited ?? [],
  penalties: r.detail?.penalties ?? [],
  regraded: r.detail?.regraded ?? null,
}));

const data = {
  generated: new Date().toISOString(),
  lastEntry: entries.map((e: any) => e.date).sort().at(-1) ?? null,
  categories: cats.categories,
  tasks,
  models: analysis.models.map((m: any) => ({ model: m.model, estimate: m.estimate, base: m.base, skill: m.skill, files: m.files, tasks: m.tasks })),
  modelCoverage: modelCoverage(entries, analysis.models),
  runsPerArm: analysis.runsPerArm,
  fixtures: analysis.fixtures,
  headline,
  runs,
  skills,
  agents,
  fieldBySkill,
  fieldUsage: usageSummary(entries),
  entries: entries.map((e: any) => ({ ...e, catchNote: catchNote(e) })),
  asks: recurringAsks(entries.filter((e: any) => e.skills.some((s: string) => skills.includes(s)))),
};

await writeFile(join(import.meta.dir, "src", "data.json"), JSON.stringify(data));
console.log(`data.json: ${tasks.length} tasks, ${runs.length} runs, ${entries.length} field entries`);
