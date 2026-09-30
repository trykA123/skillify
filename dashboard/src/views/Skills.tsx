import { REPO, data, kfmt, modelName, type FieldEvidence } from "../lib";
import { Card, Chip, Delta, Tip, Verdict } from "../ui";

function Evidence({ e }: { e: FieldEvidence }) {
  return (
    <dl className="field-evidence">
      <div>
        <dt><Tip content="Concrete catches on helped entries ÷ all helped entries. Missing catches stay unknown. A shared catch counts for every skill loaded; this does not establish causation.">Catch rate</Tip></dt>
        <dd>{e.catchRecorded ? `${Math.round(100 * e.catchRate!)}%` : "Not recorded"}
          <small>{e.catchCount}/{e.helped} helped · catch recorded on {e.catchRecorded}/{e.helped}</small>
        </dd>
      </div>
      <div>
        <dt>Tokens / helped run</dt>
        <dd>{e.medianTokens === null ? "Not recorded" : kfmt(e.medianTokens)}
          <small>Median · usage recorded on {e.tokensRecorded}/{e.helped}</small>
        </dd>
      </div>
    </dl>
  );
}

export function Skills() {
  const names = data.skills;
  const none = data.entries.filter((e) => !e.skills.length);
  return (
    <div className="view">
      <p className="lead">Each skill with what the field said about it and what the paired evals measured. "(none)" is the baseline: runs that loaded no skill.</p>
      <div className="grid3">
        {names.map((s) => {
          const es = data.entries.filter((e) => e.skills.includes(s));
          const count = (v: string) => es.filter((e) => e.verdict === v).length;
          const tasks = data.tasks.filter((t) => t.skill === s);
          const missing = es.map((e) => e.missing).filter((m) => m && !/^(nothing|none|n\/a)/i.test(m));
          return (
            <Card key={s} title={s} sub={<a href={`${REPO}/blob/main/skills/${s}/SKILL.md`} target="_blank" rel="noreferrer">SKILL.md ↗</a>}>
              <div className="row-s">
                <Verdict v="helped" /> {count("helped")} <Verdict v="neutral" /> {count("neutral")} <Verdict v="hurt" /> {count("hurt")}
                <span className="muted small">field runs</span>
              </div>
              <Evidence e={data.fieldBySkill[s]} />
              {tasks.length ? (
                <>
                  <h4>Measured</h4>
                  {tasks.map((t) => (
                    <div key={t.task} className="wc-r">
                      <a href={`#/tasks/${t.task}`}>{t.task}</a>
                      {data.models.map((m) => {
                        const c = m.tasks.find((x) => x.task === t.task);
                        return c ? (
                          <span key={m.model} className="mini">
                            <span className="muted">{modelName(m.model).replace("Claude ", "")}</span> <Delta d={c.skill.score - c.base.score} />
                          </span>
                        ) : null;
                      })}
                    </div>
                  ))}
                </>
              ) : (
                <p className="small muted">{s === "teachify" ? "Unmeasured: interactive teaching needs a human learner. Lesson text alone cannot establish teaching quality." : "No paired eval yet."}</p>
              )}
              {missing.length ? (
                <>
                  <h4>Asked for</h4>
                  <ul className="asks">
                    {missing.slice(-3).map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </Card>
          );
        })}
        <Card title="(none)" sub="Runs that loaded no skill">
          <div className="row-s">
            <Verdict v="helped" /> {none.filter((e) => e.verdict === "helped").length} <Verdict v="neutral" /> {none.filter((e) => e.verdict === "neutral").length} <Verdict v="hurt" /> {none.filter((e) => e.verdict === "hurt").length}
          </div>
          <Evidence e={data.fieldBySkill["(none)"]} />
        </Card>
      </div>
      <Card title="Recurring asks across all runs" sub={`Phrases that show up in the "missing" notes of at least two runs (of ${data.asks.docs}).`}>
        <div className="row-s">
          {data.asks.asks.map(([p, n]) => (
            <Chip key={p}>
              {p} · {n}
            </Chip>
          ))}
        </div>
      </Card>
    </div>
  );
}
