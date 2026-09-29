import { categoryStats, data, modelName, pctChange, signedPct, usd } from "../lib";
import { Card, Chip, Delta, PairBars } from "../ui";

export function Categories({ focus }: { focus?: string }) {
  const cats = focus ? data.categories.filter((c) => c.id === focus) : data.categories;
  return (
    <div className="view">
      {focus ? (
        <a className="back" href="#/categories">
          ← All kinds of work
        </a>
      ) : (
        <p className="lead">The same results grouped by the kind of work. A category's score is the mean of its tasks' mean scores.</p>
      )}
      {cats.map((c) => {
        const tasks = data.tasks.filter((t) => t.category === c.id);
        const st = categoryStats(c.id);
        return (
          <Card key={c.id} title={c.label} sub={c.blurb}>
            <div className="row-s cat-tasks">
              {tasks.map((t) => (
                <a key={t.task} href={`#/tasks/${t.task}`}>
                  <Chip>
                    {t.task} · {t.skill}
                  </Chip>
                </a>
              ))}
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Score without → with skills</th>
                  <th className="n">Change</th>
                  <th className="n">Cost change</th>
                </tr>
              </thead>
              <tbody>
                {st.map((s) => (
                  <tr key={s.model}>
                    <td>{modelName(s.model)}</td>
                    <td>
                      <PairBars base={s.base} skill={s.skill} />
                    </td>
                    <td className="n">
                      <Delta d={s.skill - s.base} />
                    </td>
                    <td className="n">{s.estimate ? <span className="muted">est. only</span> : `${signedPct(pctChange(s.costBase, s.costSkill))} (${usd(s.costBase)} → ${usd(s.costSkill)})`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        );
      })}
    </div>
  );
}
