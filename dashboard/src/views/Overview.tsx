import { categoryStats, data, dir, modelName, pctChange, pts, signedPct } from "../lib";
import { Card, CountUp, Delta, Dumbbell, PairBars, Ring, Score, Tip } from "../ui";
import { HeroArt, KIND_ICONS } from "../art";

export function Overview({ go }: { go: (h: string) => void }) {
  const e = data.entries;
  const loaded = e.filter((x) => x.skills.length);
  const helped = loaded.filter((x) => x.verdict === "helped").length;
  const none = e.filter((x) => !x.skills.length);
  const short = (m: string) => modelName(m).replace("Claude ", "");
  let best = { t: "", m: "", d: -1 };
  for (const m of data.models) for (const t of m.tasks) if (t.skill.score - t.base.score > best.d) best = { t: t.task, m: m.model, d: t.skill.score - t.base.score };
  return (
    <div className="view">
      <section className="hero">
        <HeroArt />
        <div>
          <p className="eyebrow">Paired evals · {data.fixtures} tasks × {data.runsPerArm} runs per side</p>
          <h2>
            {data.headline.pre}
            <span className="accent">{data.headline.em}</span>
          </h2>
          <p>
            Every model ran the same tasks twice: once plain, once with the task's skill loaded. The rings show the score gain in points out of 100. <button className="link" onClick={() => go("method")}>How it's measured →</button>
          </p>
        </div>
        <div className="rings">
          {data.models.map((m) => (
            <Ring key={m.model} label={short(m.model)} base={m.base.score} skill={m.skill.score} />
          ))}
        </div>
      </section>

      <div className="stats">
        <div className="stat">
          <div className="stat-v">
            <CountUp value={data.runs.length} />
          </div>
          <div className="stat-l">Paired eval runs</div>
          <div className="stat-h">{data.models.length} models · 2 sides</div>
        </div>
        <div className="stat">
          <div className="stat-v">
            <CountUp value={e.length} />
          </div>
          <div className="stat-l">Field runs logged</div>
          <div className="stat-h">{loaded.length} loaded a skill</div>
        </div>
        <div className="stat">
          <div className="stat-v accent">
            <CountUp value={loaded.length ? (100 * helped) / loaded.length : 0} format={(x) => `${Math.round(x)}%`} />
          </div>
          <div className="stat-l">of runs with a skill said it helped</div>
          <div className="stat-h">
            {helped}/{loaded.length} · without a skill: {none.filter((x) => x.verdict === "helped").length}/{none.length}
          </div>
        </div>
        <div className="stat">
          <div className="stat-v">{pts(best.d)}</div>
          <div className="stat-l">Biggest single gain</div>
          <div className="stat-h">
            <button className="link" onClick={() => go(`tasks/${best.t}`)}>{best.t}</button> · {short(best.m)}
          </div>
        </div>
      </div>

      <div className="grid2">
        <Card title="Score without → with skills" sub="Mean over all tasks, one row per model. Hover a number for how it's computed.">
          <Dumbbell rows={data.models.map((m) => ({ label: modelName(m.model).replace("Claude ", ""), base: m.base.score, skill: m.skill.score }))} />
        </Card>
        <Card title="What skills changed, per model" sub="Score in points out of 100; cost per run from the CLI's usage report.">
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

      <h3 className="section">Where skills pay off</h3>
      <div className="grid4">
        {data.categories.map((c) => {
          const st = categoryStats(c.id);
          const top = Math.max(...st.map((s) => s.skill - s.base));
          return (
            <Card key={c.id} className={`clickable kind ${c.id}`}>
              <button className="cover" onClick={() => go(`categories/${c.id}`)} aria-label={`Open ${c.label}`} />
              <div className="k-top">
                <div>
                  <div className="k-name">
                    {KIND_ICONS[c.id]}
                    {c.label}
                  </div>
                  <p className="muted small">{c.blurb}</p>
                </div>
                <div className={`k-gain ${dir(top)}`}>
                  {pts(top).replace(" pts", "")}
                  <small>best gain · pts</small>
                </div>
              </div>
              {st.map((s) => (
                <div key={s.model} className="cat-row">
                  <span className="cat-m">{short(s.model)}</span>
                  <PairBars base={s.base} skill={s.skill} />
                  <Delta d={s.skill - s.base} />
                </div>
              ))}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
