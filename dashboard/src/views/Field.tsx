import { useEffect, useMemo, useState, type ReactNode, type RefObject } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { data, dur, kfmt, type Entry } from "../lib";
import { Card, Chip, Verdict } from "../ui";

const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort();

function useWide() {
  const q = "(min-width: 1500px)";
  const [wide, setWide] = useState(() => matchMedia(q).matches);
  useEffect(() => {
    const m = matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

function Detail({ e, Title }: { e: Entry; Title: (p: { className: string; children: string }) => ReactNode }) {
  return (
    <>
      <p className="row-catch"><b>Catch:</b> {e.catchNote}</p>
      <Title className="sheet-t">{e.task}</Title>
      <div className="row-s">
        <Verdict v={e.verdict} />
        <span className="muted">
          {e.date} · {e.agent} · {e.model} · {e.harness}
        </span>
      </div>
      <p className="small">Skills: {e.skills.length ? e.skills.join(", ") : "none loaded"}</p>
      <Card title="What helped">
        <p>{e.helped || "—"}</p>
      </Card>
      <Card title="What got in the way">
        <p>{e.hindered || "—"}</p>
      </Card>
      <Card title="What was missing">
        <p>{e.missing || "—"}</p>
      </Card>
      <p className="small muted">
        Tokens: {e.tokens === undefined ? "not recorded" : kfmt(e.tokens)} · Tool calls: {e.tools ?? "not recorded"} · Duration: {e.ms === undefined ? "not recorded" : dur(e.ms)}
      </p>
    </>
  );
}

const H2 = ({ className, children }: { className: string; children: string }) => <h2 className={className}>{children}</h2>;

export function Field({ search }: { search: RefObject<HTMLInputElement | null> }) {
  const [q, setQ] = useState("");
  const [verdict, setVerdict] = useState("");
  const [skill, setSkill] = useState("");
  const [agent, setAgent] = useState("");
  const [model, setModel] = useState("");
  const [harness, setHarness] = useState("");
  const [open, setOpen] = useState<Entry | null>(null);
  const skills = uniq(data.entries.flatMap((e) => (e.skills.length ? e.skills : ["(none)"])));
  const agents = uniq(data.entries.map((e) => e.agent));
  const models = uniq(data.entries.map((e) => e.model));
  const harnesses = uniq(data.entries.map((e) => e.harness));
  const rows = useMemo(
    () =>
      data.entries
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => !verdict || e.verdict === verdict)
        .filter(({ e }) => !skill || (skill === "(none)" ? !e.skills.length : e.skills.includes(skill)))
        .filter(({ e }) => !agent || e.agent === agent)
        .filter(({ e }) => !model || e.model === model)
        .filter(({ e }) => !harness || e.harness === harness)
        .filter(({ e }) => !q || [e.catch, e.task, e.helped, e.hindered, e.missing, e.agent, e.model, e.harness, e.skills.join(" ")].join(" ").toLowerCase().includes(q.toLowerCase()))
        .reverse(),
    [q, verdict, skill, agent, model, harness],
  );
  const costs = [
    { key: "tokens" as const, label: "tokens", format: kfmt },
    { key: "tools" as const, label: "tool calls", format: (n: number) => String(n) },
    { key: "ms" as const, label: "duration", format: dur },
  ].map((c) => ({ ...c, ...data.fieldUsage[c.key] }));
  const wide = useWide();
  const shown = open ?? (wide ? rows[0]?.e ?? null : null);
  return (
    <div className="view">
      <p className="lead">
        Every agent that ran real work ended its report with a skill-feedback block: which skills it used, what helped, what got in the way, what was missing. These are those blocks, verbatim in spirit, newest first.
      </p>
      <div className="filters">
        <input ref={search} className="search" placeholder="Search runs  ( / )" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search field runs" />
        <select value={verdict} onChange={(e) => setVerdict(e.target.value)} aria-label="Verdict">
          <option value="">All verdicts</option>
          <option value="helped">helped</option>
          <option value="neutral">neutral</option>
          <option value="hurt">hurt</option>
        </select>
        <select value={skill} onChange={(e) => setSkill(e.target.value)} aria-label="Skill">
          <option value="">All skills</option>
          {skills.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={agent} onChange={(e) => setAgent(e.target.value)} aria-label="Agent">
          <option value="">All agents</option>
          {agents.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={model} onChange={(e) => setModel(e.target.value)} aria-label="Model">
          <option value="">All models</option>
          {models.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select value={harness} onChange={(e) => setHarness(e.target.value)} aria-label="Harness">
          <option value="">All harnesses</option>
          {harnesses.map((h) => <option key={h}>{h}</option>)}
        </select>
        <span className="muted small" role="status">
          {rows.length} of {data.entries.length}
        </span>
      </div>
      {costs.some((c) => c.recorded) ? (
        <p className="small muted">
          {costs.map((c) => `${c.label}: ${c.recorded ? `median ${c.format(c.median!)} (${c.recorded}/${data.entries.length} recorded)` : "not recorded"}`).join(" · ")}
        </p>
      ) : null}
      <div className="split">
      <div className="list">
        {rows.map(({ e, i }) => (
          <button key={i} className={`row${wide && shown === e ? " sel" : ""}`} onClick={() => setOpen(e)}>
            <div className="row-main">
              <div className="row-catch small"><b>Catch:</b> {e.catchNote}</div>
              <div className="row-t">{e.task}</div>
              <div className="row-s">
                <Verdict v={e.verdict} />
                <span className="muted">
                  {e.agent} · {e.model}
                </span>
                {(e.skills.length ? e.skills : ["no skill"]).map((s) => (
                  <Chip key={s}>{s}</Chip>
                ))}
              </div>
            </div>
            <div className="row-side muted small">
              {e.date}
              {e.tokens !== undefined ? ` · ${kfmt(e.tokens)} tok` : ""}
            </div>
          </button>
        ))}
      </div>
      <aside className="pane" aria-label="Run details">{wide && shown ? <Detail e={shown} Title={H2} /> : null}</aside>
      </div>
      <Dialog.Root open={!!open && !wide} onOpenChange={(o) => !o && setOpen(null)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="backdrop" />
          <Dialog.Popup className="sheet">
            {open ? (
              <>
                <Detail e={open} Title={(p) => <Dialog.Title className={p.className}>{p.children}</Dialog.Title>} />
                <Dialog.Close className="btn">Close (Esc)</Dialog.Close>
              </>
            ) : null}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
