import { catById, data, dir, modelName, pctChange, s2, signedPct, usd } from "../lib";
import { Card, Chip, Delta, PairBars, Score, Tip } from "../ui";

export function Evals() {
  return (
    <div className="view">
      <p className="lead">
        Each model ran {data.fixtures} tasks, {data.runsPerArm} times per side: once with no skills, once with the task's skill loaded. Everything else was the same: the repo, the prompt, the tools. The difference is what the skill bought.
      </p>
      <div className="grid3">
        {data.models.map((m) => {
          const d = m.skill.score - m.base.score;
          const cpp = (a: typeof m.base) => (a.score ? a.cost / a.score : 0);
          return (
            <Card key={m.model} title={modelName(m.model)} sub={`${m.base.n} runs without · ${m.skill.n} runs with skills`}>
              <div className="big-score">
                <Score v={m.base.score} n={m.base.n} />
                <span className="arrow">→</span>
                <span className={`hl ${dir(d)}`}>
                  <Score v={m.skill.score} n={m.skill.n} />
                </span>
                <Delta d={d} big />
              </div>
              <PairBars base={m.base.score} skill={m.skill.score} />
              <dl className="kv">
                <dt>Cost per run</dt>
                <dd>
                  {m.estimate ? (
                    <Tip content="Claude Code estimated this at Anthropic prices; it doesn't know DeepSeek's. The DeepSeek account was billed about $0.01 per run.">
                      <span>
                        {usd(m.base.cost)} → {usd(m.skill.cost)} <span className="muted">est.</span>
                      </span>
                    </Tip>
                  ) : (
                    <>
                      {usd(m.base.cost)} → {usd(m.skill.cost)} <span className="chg">{signedPct(pctChange(m.base.cost, m.skill.cost))}</span>
                    </>
                  )}
                </dd>
                <dt>Cost per score point</dt>
                <dd>
                  {m.estimate ? (
                    <span className="muted">not comparable</span>
                  ) : (
                    <Tip content="Mean cost per run ÷ mean score. Lower means the quality cost less.">
                      <span>
                        {usd(cpp(m.base))} → {usd(cpp(m.skill))} <span className={`chg ${dir(cpp(m.base) - cpp(m.skill))}`}>{signedPct(pctChange(cpp(m.base), cpp(m.skill)))}</span>
                      </span>
                    </Tip>
                  )}
                </dd>
                <dt>Turns</dt>
                <dd>
                  {m.base.turns.toFixed(1)} → {m.skill.turns.toFixed(1)} <span className="chg">{signedPct(pctChange(m.base.turns, m.skill.turns))}</span>
                </dd>
                <dt>Time</dt>
                <dd>
                  {Math.round(m.base.seconds)} s → {Math.round(m.skill.seconds)} s <span className="chg">{signedPct(pctChange(m.base.seconds, m.skill.seconds))}</span>
                </dd>
              </dl>
              <div className="wc">
                {(() => {
                  const up = m.tasks.filter((t) => t.skill.score - t.base.score >= 0.05);
                  const down = m.tasks.filter((t) => t.skill.score - t.base.score <= -0.05);
                  const flat = m.tasks.filter((t) => Math.abs(t.skill.score - t.base.score) < 0.05);
                  return (
                    <>
                      {up.length ? <h4>Improved</h4> : null}
                      {up.map((t) => (
                        <div key={t.task} className="wc-r">
                          <a href={`#/tasks/${t.task}`}>{t.task}</a> <Delta d={t.skill.score - t.base.score} />
                        </div>
                      ))}
                      {down.length ? <h4>Got worse</h4> : null}
                      {down.map((t) => (
                        <div key={t.task} className="wc-r">
                          <a href={`#/tasks/${t.task}`}>{t.task}</a> <Delta d={t.skill.score - t.base.score} />
                        </div>
                      ))}
                      {flat.length ? <h4>No change</h4> : null}
                      {flat.length ? (
                        <p className="muted small">
                          {flat.map((t) => t.task).join(", ")}
                          {flat.every((t) => t.base.score > 0.995) ? " (already 1.00 without skills)" : ""}
                        </p>
                      ) : null}
                    </>
                  );
                })()}
              </div>
            </Card>
          );
        })}
      </div>
      <Card title="Every task, every model" sub="Mean score without → with the task's skill. Green cells gained 10 pts or more; red lost 10 or more. Open a task to see each run and how it was graded.">
        <div className="scroll-x">
          <table className="matrix">
            <thead>
              <tr>
                <th>Task</th>
                <th>Kind</th>
                {data.models.map((m) => (
                  <th key={m.model}>{modelName(m.model)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.tasks.map((t) => (
                <tr key={t.task}>
                  <td>
                    <a href={`#/tasks/${t.task}`}>{t.task}</a>
                    <div className="muted small">{t.skill} · {t.kind === "tests" ? `${t.hiddenTests} hidden tests` : "rubric, graded by Codex"}</div>
                  </td>
                  <td>
                    <Chip tone={t.category}>{catById(t.category)?.label}</Chip>
                  </td>
                  {data.models.map((m) => {
                    const c = m.tasks.find((x) => x.task === t.task);
                    if (!c) return <td key={m.model} className="muted">—</td>;
                    const d = c.skill.score - c.base.score;
                    return (
                      <td key={m.model} className={d >= 0.1 ? "hot" : d <= -0.1 ? "cold" : ""}>
                        <div className="cell">
                          <span className="v">
                            {s2(c.base.score)} → {s2(c.skill.score)}
                          </span>
                          <Delta d={d} />
                          <span className="muted small">{m.estimate ? "cost est." : `cost ${signedPct(pctChange(c.base.cost, c.skill.cost))}`}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
