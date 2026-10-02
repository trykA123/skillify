import { REPO, data, modelById, modelName } from "../lib";
import { Card } from "../ui";
import { MethodDiagram } from "../art";

export function Method() {
  return (
    <div className="view prose">
      <Card title="The pipeline" sub="One task, two sides, the same grader.">
        <MethodDiagram />
      </Card>
      <Card title="How a paired run works">
        <ol>
          <li>Each task is a small real repo with a short git history and a prompt, like a ticket. It's copied into a fresh throwaway folder for every run.</li>
          <li>The model runs as a normal coding agent with real tools (read, edit, shell). No slash commands, no other skills, no memory.</li>
          <li>
            It runs twice per task: <b>without skills</b>, and <b>with the task's skill</b> loaded into its instructions. Everything else is identical. Each side has up to {data.runsPerArm} recorded repetitions.
          </li>
          <li>Each run's final answer and the repo it left behind are scored, then thrown away.</li>
        </ol>
      </Card>
      <Card title="How a score is computed">
        <p>
          <b>Coding and debugging tasks</b> have hidden tests the model never sees. Score = hidden tests passed ÷ total. If the repo's own tests fail afterwards, the score is halved, so breaking things costs.
        </p>
        <p>
          <b>Reviewing and clarifying tasks</b> have a rubric: planted bugs to find, or decisions a good engineer would raise. A separate model (Codex) grades the answer against it, with written penalties (for example −0.15 per wrong finding, or 0 if a buggy PR is approved). The grader returns what it credited and penalised; the Tasks view shows it per run.
        </p>
        <div className="formula">tests:  score = hidden_passed / hidden_total  × (repo tests pass ? 1 : 0.5)</div>
        <div className="formula">rubric: score = credited / items  − penalties   (0 if a buggy PR is approved)</div>
        <p>
          A model's score is the mean over all its runs on one side, on a 0–1 scale where 1.00 is perfect. <b>pts</b> are points out of 100: 0.78 → 0.95 is +17 or +18 pts depending on rounding.
        </p>
      </Card>
      <Card title="Cost, and its caveats">
        <p>Cost per run, turns and time come from the CLI's own usage report for each run. Cost per score point = mean cost ÷ mean score.</p>
        <p>For DeepSeek, the CLI prices tokens at Anthropic rates because it doesn't know DeepSeek's, so those dollar figures are estimates and are left out of comparisons. The DeepSeek account was actually billed about $0.01 per run.</p>
        <p>Field runs record tokens, tool calls and time when the harness reports them. Older entries didn't, and show "not recorded", never 0.</p>
        <p>Codex field runs update model cards and usage summaries after they are logged and published. Field tokens do not establish a dollar cost or a score improvement. Those comparisons require paired measurements.</p>
      </Card>
      <Card title="Honest limits">
        <ul>
          <li>
            Small sample: {data.fixtures} tasks, {data.runsPerArm} runs per side. Treat it as direction, not proof.
          </li>
          <li>Where a task was re-run after a skill changed, the later round replaces the earlier one for that model, task and side.</li>
          <li>Three DeepSeek review runs first failed to grade (the grader hit a usage limit). They were regraded later with the same rubric; the Tasks view marks them.</li>
          <li>Field verdicts and catches are each agent's own report, not independent measurements. Catch rate counts helped entries with a concrete catch divided by all helped entries; missing catches stay unknown and coverage is shown.</li>
          <li>Field feedback and grading runs do not supply paired results. Models enter numeric comparisons when both sides have recorded measurements.</li>
          <li>Tokens per helped run is the median of helped entries with recorded tokens. Missing usage is excluded. When several skills were loaded, the same catch and usage count for each; this cannot establish which skill caused the result.</li>
          <li>Coding and debugging fixtures already at 1.00 without skills cannot measure further gains. The shipify fast path has no paired cost measurement yet; no new paired runs were funded for skills-v2.</li>
          <li>teachify remains unmeasured. Interactive teaching needs a human learner; grading lesson text alone cannot establish teaching quality.</li>
        </ul>
      </Card>
      <Card title="Raw data">
        <ul>
          {data.modelCoverage.map((coverage) => {
            const m = modelById(coverage.model);
            return <li key={coverage.model}>
              {modelName(coverage.model)}:{" "}
              {m ? m.files.map((f, i) => (
                <span key={f}>
                  {i ? ", " : ""}
                  <a href={`${REPO}/blob/main/evals/results/${f}`} target="_blank" rel="noreferrer">
                    {f}
                  </a>
                </span>
              )) : <><a href={`${REPO}/blob/main/feedback/field.jsonl`} target="_blank" rel="noreferrer">{coverage.fieldRuns} field runs</a> · paired results not recorded</>}
            </li>;
          })}
          <li>
            Tasks: <a href={`${REPO}/tree/main/evals/paired`} target="_blank" rel="noreferrer">evals/paired</a> · runner: <a href={`${REPO}/blob/main/scripts/run-paired.mjs`} target="_blank" rel="noreferrer">scripts/run-paired.mjs</a> · field log: <a href={`${REPO}/blob/main/feedback/field.jsonl`} target="_blank" rel="noreferrer">feedback/field.jsonl</a>
          </li>
        </ul>
      </Card>
    </div>
  );
}
