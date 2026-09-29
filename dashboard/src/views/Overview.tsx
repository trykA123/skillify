import { categoryStats, data, dir, modelName, pctChange, pts, signedPct } from "../lib";
import { Card, Delta, Dumbbell, PairBars, Score, Stat, Tip } from "../ui";

export function Overview({ go }: { go: (h: string) => void }) {
  const e = data.entries;
  const loaded = e.filter((x) => x.skills.length);
  const helped = loaded.filter((x) => x.verdict === "helped").length;
  const none = e.filter((x) => !x.skills.length);
  const runs = data.runs.length;
  return (
    <div className="view">
      <Card className="headline">
        <p className="eyebrow">Paired evals · {data.fixtures} tasks × {data.runsPerArm} runs per side</p>
        <h2>
          {data.headline.pre}
          <span className="accent">{data.headline.em}</span>
        </h2>
        <p className="muted">
          Every model ran the same tasks twice: once plain, once with the task's skill loaded. <button className="link" onClick={() => go("method")}>How it's measured →</button>
        </p>
      </Card>

      <div className="stats">
        <Stat label="Paired eval runs" value={runs} hint={`${data.models.length} models`} />
        <Stat label="Field runs logged" value={e.length} hint={`${loaded.length} loaded a skill`} />
        <Stat
          label="Field runs with a skill that helped"
          value={loaded.length ? `${Math.round((100 * helped) / loaded.length)}%` : "—"}
          hint={`${helped} of ${loaded.length}; without a skill: ${none.filter((x) => x.verdict === "helped").length} of ${none.length}`}
        />
        <Stat label="Last field entry" value={data.lastEntry ?? "—"} />
      </div>

      <div className="grid2">
        <Card title="Score without → with skills" sub="Mean over all tasks. Hover a number for how it's computed.">
          <Dumbbell rows={data.models.map((m) => ({ label: modelName(m.model).replace("Claude ", ""), base: m.base.score, skill: m.skill.score }))} />
        </Card>
        <Card title="What skills changed, per model">
          <table className="tbl">
            <thead>
              <tr>
                <th>Model</th>
                <th className="n">Score</th>
                <th className="n">Change</th>
                <th className="n">Cost / run</th>
              </tr>
            </thead>
            <tbody>
              {data.models.map((m) => (
                <tr key={m.model}>
                  <td>{modelName(m.model)}</td>
                  <td className="n">
                    <Score v={m.base.score} n={m.base.n} /> → <Score v={m.skill.score} n={m.skill.n} />
                  </td>
                  <td className="n">
                    <Delta d={m.skill.score - m.base.score} />
                  </td>
                  <td className="n">
                    {m.estimate ? (
                      <Tip content="The CLI prices DeepSeek at Anthropic rates. DeepSeek billed about $0.01 per run.">
                        <span className="muted">≈$0.01 billed</span>
                      </Tip>
                    ) : (
                      <span className={dir(-(m.skill.cost - m.base.cost))}>{signedPct(pctChange(m.base.cost, m.skill.cost))}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <h3 className="section">By kind of work</h3>
      <div className="grid4">
        {data.categories.map((c) => {
          const st = categoryStats(c.id);
          return (
            <Card key={c.id} className="clickable" title={c.label} sub={c.blurb}>
              <button className="cover" onClick={() => go(`categories/${c.id}`)} aria-label={`Open ${c.label}`} />
              {st.map((s) => (
                <div key={s.model} className="cat-row">
                  <span className="cat-m">{modelName(s.model).replace("Claude ", "")}</span>
                  <PairBars base={s.base} skill={s.skill} />
                  <Delta d={s.skill - s.base} />
                </div>
              ))}
            </Card>
          );
        })}
      </div>

      <p className="muted small">
        Biggest single gain: {(() => {
          let best = { t: "", m: "", d: -1 };
          for (const m of data.models) for (const t of m.tasks) if (t.skill.score - t.base.score > best.d) best = { t: t.task, m: m.model, d: t.skill.score - t.base.score };
          return (
            <>
              <button className="link" onClick={() => go(`tasks/${best.t}`)}>{best.t}</button> on {modelName(best.m)}, {pts(best.d)}. Cost figures are the CLI's own usage report; <button className="link" onClick={() => go("method")}>see Method</button>.
            </>
          );
        })()}
      </p>
    </div>
  );
}
