import { REPO, data, kfmt, modelName, type Entry, type FieldEvidence } from "../lib";
import { Card, Chip, Delta, Tip, Verdict } from "../ui";
import { MissingMeasurements } from "../MissingMeasurements";

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

function VerdictCounts({ entries }: { entries: Entry[] }) {
  const count = (v: string) => entries.filter((e) => e.verdict === v).length;
  return (
    <div className="row-s">
      <Verdict v="helped" /> {count("helped")} <Verdict v="neutral" /> {count("neutral")} <Verdict v="hurt" /> {count("hurt")}
      <span className="muted small">field runs</span>
    </div>
  );
}

export function Skills() {
  const names = data.skills;
  return (
    <div className="view">
      <p className="lead">Skillify's {names.length} engineering skills and {data.agents.length} agent roles, with field reports and measured results.</p>
      <div className="grid3">
        {names.map((s) => {
          const es = data.entries.filter((e) => e.skills.includes(s));
          const tasks = data.tasks.filter((t) => t.skill === s);
          const missing = es.map((e) => e.missing).filter((m) => m && !/^(nothing|none|n\/a)/i.test(m));
          return (
            <Card key={s} title={s} sub={<a href={`${REPO}/blob/main/skills/${s}/SKILL.md`} target="_blank" rel="noreferrer">SKILL.md ↗</a>}>
              <VerdictCounts entries={es} />
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
                  <MissingMeasurements tasks={tasks.map((t) => t.task)} />
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
      </div>
      <h3 className="section">Skillify agents</h3>
      <div className="grid4">
        {data.agents.map((a) => (
          <Card key={a.name} title={a.name} sub={<a href={`${REPO}/blob/main/agents/${a.name}.md`} target="_blank" rel="noreferrer">Agent definition ↗</a>}>
            <p className="small">{a.description}</p>
            <div className="row-s">{a.capabilities.map((c) => <Chip key={c}>{({ read: "Read files", shell: "Shell", edit: "Edit files", web: "Web" } as Record<string, string>)[c] ?? c}</Chip>)}</div>
            {a.skills.length ? <p className="small muted">Preloaded: {a.skills.map((s, i) => <span key={s}>{i ? ", " : ""}<a href={`${REPO}/blob/main/skills/${s}/SKILL.md`} target="_blank" rel="noreferrer">{s}</a></span>)}</p> : null}
            <VerdictCounts entries={data.entries.filter((e) => e.agent === a.name)} />
            <Evidence e={a.evidence} />
          </Card>
        ))}
      </div>
      <Card title="Recurring asks from Skillify runs" sub={`Phrases that show up in the "missing" notes of at least two runs (of ${data.asks.docs}).`}>
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
