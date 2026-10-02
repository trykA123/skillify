import raw from "./data.json";

export type Arm = { n: number; score: number; cost: number; turns: number; seconds: number };
export type ModelTask = { task: string; base: Arm; skill: Arm };
export type Model = { model: string; estimate: boolean; base: Arm; skill: Arm; files: string[]; tasks: ModelTask[] };
export type ModelCoverage = { model: string; fieldRuns: number; harnesses: string[]; paired: boolean };
export type Usage = Record<"tokens" | "tools" | "ms", { median: number | null; recorded: number }>;
export type FieldModel = ModelCoverage & { verdicts: Record<"helped" | "neutral" | "hurt", number>; evidence: FieldEvidence; usage: Usage };
export type Task = {
  task: string;
  skill: string;
  kind: "tests" | "rubric";
  category: string;
  sub: string;
  prompt: string;
  history: string[];
  note: string;
  rubricItems: string[];
  rubricLabel: string;
  hiddenTests: number;
  hiddenFiles: string[];
  scoring: string;
};
export type Run = {
  task: string;
  arm: "base" | "skill";
  model: string;
  score: number;
  cost: number;
  turns: number;
  seconds: number;
  costSource: string;
  hidden: string | null;
  visibleOk: boolean | null;
  failed: string[];
  credited: string[];
  penalties: string[];
  regraded: string | null;
};
export type Entry = {
  date: string;
  agent: string;
  model: string;
  harness: string;
  task: string;
  skills: string[];
  helped: string;
  hindered: string;
  missing: string;
  verdict: "helped" | "neutral" | "hurt";
  catch?: string;
  catchNote: string;
  tokens?: number;
  tools?: number;
  ms?: number;
};
export type Category = { id: string; label: string; blurb: string };
export type FieldEvidence = {
  helped: number;
  catchCount: number;
  catchRecorded: number;
  catchRate: number | null;
  medianTokens: number | null;
  tokensRecorded: number;
};
export type Agent = {
  name: string;
  description: string;
  capabilities: string[];
  skills: string[];
  evidence: FieldEvidence;
};

export const data = raw as unknown as {
  generated: string;
  lastEntry: string | null;
  categories: Category[];
  tasks: Task[];
  models: Model[];
  modelCoverage: ModelCoverage[];
  fieldModels: FieldModel[];
  runsPerArm: number;
  fixtures: number;
  headline: { pre: string; em: string };
  runs: Run[];
  entries: Entry[];
  skills: string[];
  agents: Agent[];
  fieldBySkill: Record<string, FieldEvidence>;
  fieldUsage: Usage;
  asks: { docs: number; asks: [string, number][] };
};

export const REPO = "https://github.com/trykA123/skillify";
export const MODEL_NAMES: Record<string, string> = { haiku: "Claude Haiku", sonnet: "Claude Sonnet", "deepseek-flash": "DeepSeek Flash" };
export const modelName = (m: string) => MODEL_NAMES[m] ?? m;
export const estimatedCostNote = (model: string) => model === "deepseek-flash" ? "Claude Code estimated this at Anthropic prices; it doesn't know DeepSeek's. The DeepSeek account was billed about $0.01 per run." : "Cost is a CLI estimate, not a provider invoice. Estimated costs are excluded from comparisons.";
export const modelById = (id: string) => data.models.find((m) => m.model === id);
export const missingModels = (tasks?: string[]) => data.modelCoverage.filter((m) => {
  const model = modelById(m.model);
  return !model || (tasks !== undefined && !model.tasks.some((t) => tasks.includes(t.task)));
});

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
export const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
export const pts = (d: number) => (Math.abs(d) < 0.005 ? "±0 pts" : `${d > 0 ? "+" : "−"}${Math.round(Math.abs(d) * 100)} pts`);
export const pctChange = (a: number, b: number) => (a ? Math.round((100 * (b - a)) / a) : 0);
export const signedPct = (p: number) => (p > 0 ? `+${p}%` : p < 0 ? `−${-p}%` : "0%");
export const usd = (v: number) => `$${v >= 1 ? v.toFixed(2) : v.toFixed(3)}`;
export const dir = (d: number) => (d > 0.005 ? "up" : d < -0.005 ? "down" : "flat");
export const s2 = (v: number) => v.toFixed(2);
export const dur = (ms: number) => (ms >= 60000 ? `${(ms / 60000).toFixed(1)} min` : `${Math.round(ms / 1000)} s`);
export const kfmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

export const taskById = (id: string) => data.tasks.find((t) => t.task === id);
export const catById = (id: string) => data.categories.find((c) => c.id === id);

export function categoryStats(catId: string) {
  const ids = data.tasks.filter((t) => t.category === catId).map((t) => t.task);
  return data.models.flatMap((m) => {
    const ts = m.tasks.filter((t) => ids.includes(t.task));
    if (!ts.length) return [];
    const base = mean(ts.map((t) => t.base.score));
    const skill = mean(ts.map((t) => t.skill.score));
    const costBase = mean(ts.map((t) => t.base.cost));
    const costSkill = mean(ts.map((t) => t.skill.cost));
    return [{ model: m.model, estimate: m.estimate, n: ts.length, base, skill, costBase, costSkill }];
  });
}

export const scoreMeaning = (kind?: "tests" | "rubric") =>
  kind === "tests"
    ? "Hidden tests passed ÷ total hidden tests, halved if the repo's own tests break."
    : kind === "rubric"
      ? "Rubric credit from a separate grader model (Codex), minus penalties in the rubric."
      : "Each run scores 0–1: hidden tests passed ÷ total for coding tasks, rubric credit from a separate grader (Codex) for review and clarifying tasks.";
