import { useEffect, useMemo, useState, type ReactNode, type RefObject } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { data, dur, kfmt, median, type Entry } from "../lib";
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
        Cost: {e.tokens !== undefined ? `${kfmt(e.tokens)} tokens · ${e.tools ?? "?"} tool calls · ${e.ms !== undefined ? dur(e.ms) : "?"}` : "not recorded"}
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
  const [open, setOpen] = useState<Entry | null>(null);
  const skills = uniq(data.entries.flatMap((e) => (e.skills.length ? e.skills : ["(none)"])));
  const agents = uniq(data.entries.map((e) => e.agent));
  const rows = useMemo(
    () =>
      data.entries
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => !verdict || e.verdict === verdict)
        .filter(({ e }) => !skill || (skill === "(none)" ? !e.skills.length : e.skills.includes(skill)))
        .filter(({ e }) => !agent || e.agent === agent)
        .filter(({ e }) => !q || [e.task, e.helped, e.hindered, e.missing, e.agent, e.model, e.skills.join(" ")].join(" ").toLowerCase().includes(q.toLowerCase()))
        .reverse(),
    [q, verdict, skill, agent],
  );
  const withCost = data.entries.filter((e) => e.tokens !== undefined);
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
        <span className="muted small">
          {rows.length} of {data.entries.length}
        </span>
      </div>
      {withCost.length ? (
        <p className="small muted">
          Cost recorded on {withCost.length} of {data.entries.length} runs · median {kfmt(median(withCost.map((e) => e.tokens!)))} tokens, {Math.round(median(withCost.map((e) => e.tools ?? 0)))} tool calls, {dur(median(withCost.map((e) => e.ms ?? 0)))}.
        </p>
      ) : null}
      <div className="split">
      <div className="list">
        {rows.map(({ e, i }) => (
          <button key={i} className={`row${wide && shown === e ? " sel" : ""}`} onClick={() => setOpen(e)}>
            <div className="row-main">
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
