import { useState } from "react";
import { REPO, catById, data, dur, modelName, pctChange, signedPct, taskById, usd } from "../lib";
import { Card, Chip, Delta, PairBars, Score } from "../ui";

export function TaskList() {
  return (
    <div className="view">
      <p className="lead">Six tasks in throwaway repos. Coding and debugging tasks are scored by hidden tests; reviewing and clarifying tasks by a rubric that a separate model grades. Open a task to see exactly how.</p>
      <div className="list">
        {data.tasks.map((t) => {
          const per = data.models.map((m) => ({ m, c: m.tasks.find((x) => x.task === t.task) })).filter((x) => x.c);
          return (
            <a key={t.task} className="row" href={`#/tasks/${t.task}`}>
              <div className="row-main">
                <div className="row-t">{t.task}</div>
                <div className="row-s">
                  <Chip tone={t.category}>{catById(t.category)?.label}</Chip>
                  <Chip>{t.skill}</Chip>
                  <span className="muted">{t.kind === "tests" ? `${t.hiddenTests} hidden tests` : `rubric · ${t.rubricItems.length} items`}</span>
                </div>
              </div>
              <div className="row-side">
                {per.map(({ m, c }) => (
                  <span key={m.model} className="mini">
                    <span className="muted">{modelName(m.model).replace("Claude ", "")}</span> <Delta d={c!.skill.score - c!.base.score} />
                  </span>
                ))}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function RunList({ task, model, arm }: { task: string; model: string; arm: "base" | "skill" }) {
  const runs = data.runs.filter((r) => r.task === task && r.model === model && r.arm === arm);
  const t = taskById(task)!;
  return (
    <ol className="runs">
      {runs.map((r, i) => (
        <li key={i}>
          <div className="run-h">
            <span className="num">run {i + 1}</span>
            <Score v={r.score} kind={t.kind} label="this run" />
            {r.hidden ? <span className="muted">hidden tests {r.hidden}</span> : null}
            {r.visibleOk === false ? <span className="bad">repo tests failed (×0.5)</span> : null}
            <span className="muted">
              {r.turns} turns · {dur(r.seconds * 1000)} · {usd(r.cost)}
              {r.costSource === "cli-estimate" ? " est." : ""}
            </span>
          </div>
          {r.failed.length ? <p className="small bad">Failed: {r.failed.join("; ")}</p> : null}
          {r.credited.length ? (
            <ul className="credits">
              {r.credited.map((c, j) => (
                <li key={j} className="ok">
                  ✓ {c}
                </li>
              ))}
            </ul>
          ) : null}
          {r.penalties.length ? (
            <ul className="credits">
              {r.penalties.map((c, j) => (
                <li key={j} className="bad">
                  − {c}
                </li>
              ))}
            </ul>
          ) : null}
          {r.regraded ? <p className="small muted">Regraded: {r.regraded}</p> : null}
        </li>
      ))}
    </ol>
  );
}

function CreditMatrix({ task }: { task: string }) {
  const t = taskById(task)!;
  const ids = t.rubricItems.map((x) => x.match(/^([A-Z]\d+):/)?.[1]).filter(Boolean) as string[];
  if (!ids.length || ids.length !== t.rubricItems.length) return null;
  const rows = data.models.flatMap((m) =>
    (["base", "skill"] as const).flatMap((arm) =>
      data.runs
        .filter((r) => r.task === task && r.model === m.model && r.arm === arm)
        .map((r, i) => ({ key: `${m.model}-${arm}-${i}`, label: `${modelName(m.model).replace("Claude ", "")} · ${arm === "base" ? "without" : "with"} #${i + 1}`, arm, hits: ids.map((id) => r.credited.some((c) => c.trim().startsWith(id))), score: r.score, first: i === 0 && arm === "base" })),
    ),
  );
  return (
    <Card title="Credit matrix" sub="Each row is one run; each column is a planted issue. Lit means the grader credited the run with finding it. Cyan = without skills, lime = with the skill.">
      <div className="cm" style={{ ["--n" as string]: ids.length }}>
        <div className="cm-row">
          <span className="cm-h">run</span>
          {ids.map((id) => (
            <span key={id} className="cm-h">
              {id}
            </span>
          ))}
          <span className="cm-h">score</span>
        </div>
        {rows.map((r) => (
          <div key={r.key} style={{ display: "contents" }}>
            {r.first ? <div className="cm-sep" /> : null}
            <div className="cm-row">
              <span className="cm-label">{r.label}</span>
              {r.hits.map((h, k) => (
                <span key={k} className={`cm-cell${h ? " hit" : ""}${h && r.arm === "base" ? " base" : ""}`}>
                  {h ? "✓" : "·"}
                </span>
              ))}
              <span className="cm-score">{r.score.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function TaskDetail({ id }: { id: string }) {
  const t = taskById(id);
  const [open, setOpen] = useState<string | null>(null);
  if (!t) return <div className="view">Unknown task.</div>;
  return (
    <div className="view">
      <a className="back" href="#/tasks">
        ← All tasks
      </a>
      <div className="task-head">
        <h2>{t.task}</h2>
        <div className="row-s">
          <Chip tone={t.category}>{catById(t.category)?.label}</Chip>
          <Chip>{t.sub}</Chip>
          <Chip>skill: {t.skill}</Chip>
        </div>
      </div>
      <div className="grid2">
        <Card title="The task" sub="Exactly what the model was told.">
          <blockquote className="prompt">{t.prompt}</blockquote>
          {t.history.length ? (
            <p className="small muted">
              Repo history: {t.history.map((h, i) => <code key={i}>{h}</code>)}
            </p>
          ) : null}
          {t.note ? (
            <p className="small">
              <b>The trap:</b> {t.note}
            </p>
          ) : null}
        </Card>
        <Card title="How it's scored" sub={t.kind === "tests" ? "Hidden tests" : "Rubric, graded by Codex"}>
          <p>{t.scoring}</p>
          {t.rubricItems.length ? (
            <>
              <h4>{t.rubricLabel}</h4>
              <ul className="rubric">
                {t.rubricItems.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </>
          ) : null}
          {t.hiddenFiles.length ? (
            <p className="small muted">
              Hidden test file{t.hiddenFiles.length > 1 ? "s" : ""}:{" "}
              {t.hiddenFiles.map((f) => (
                <a key={f} href={`${REPO}/blob/main/evals/paired/${t.task}/hidden/${f}`} target="_blank" rel="noreferrer">
                  {f}
                </a>
              ))}
            </p>
          ) : null}
        </Card>
      </div>
      <CreditMatrix task={t.task} />
      <h3 className="section">Results</h3>
      {data.models.map((m) => {
        const c = m.tasks.find((x) => x.task === t.task);
        if (!c) return null;
        const key = m.model;
        return (
          <Card key={key} title={modelName(m.model)}>
            <div className="res">
              <PairBars base={c.base.score} skill={c.skill.score} />
              <Delta d={c.skill.score - c.base.score} big />
              <span className="muted small">
                cost {m.estimate ? "est. " : ""}
                {usd(c.base.cost)} → {usd(c.skill.cost)} ({signedPct(pctChange(c.base.cost, c.skill.cost))}) · turns {c.base.turns.toFixed(1)} → {c.skill.turns.toFixed(1)}
              </span>
              <button className="btn" onClick={() => setOpen(open === key ? null : key)} aria-expanded={open === key}>
                {open === key ? "Hide runs" : "Show every run"}
              </button>
            </div>
            {open === key ? (
              <div className="grid2 runs-grid">
                <div>
                  <h4>Without skills</h4>
                  <RunList task={t.task} model={m.model} arm="base" />
                </div>
                <div>
                  <h4>With {t.skill}</h4>
                  <RunList task={t.task} model={m.model} arm="skill" />
                </div>
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
