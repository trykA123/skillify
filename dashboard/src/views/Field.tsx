import { useMemo, useState, type RefObject } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { data, dur, kfmt, median, type Entry } from "../lib";
import { Card, Chip, Verdict } from "../ui";

const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort();

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
      <div className="list">
        {rows.map(({ e, i }) => (
          <button key={i} className="row" onClick={() => setOpen(e)}>
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
      <Dialog.Root open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="backdrop" />
          <Dialog.Popup className="sheet">
            {open ? (
              <>
                <Dialog.Title className="sheet-t">{open.task}</Dialog.Title>
                <div className="row-s">
                  <Verdict v={open.verdict} />
                  <span className="muted">
                    {open.date} · {open.agent} · {open.model} · {open.harness}
                  </span>
                </div>
                <p className="small">Skills: {open.skills.length ? open.skills.join(", ") : "none loaded"}</p>
                <Card title="What helped">
                  <p>{open.helped || "—"}</p>
                </Card>
                <Card title="What got in the way">
                  <p>{open.hindered || "—"}</p>
                </Card>
                <Card title="What was missing">
                  <p>{open.missing || "—"}</p>
                </Card>
                <p className="small muted">
                  Cost: {open.tokens !== undefined ? `${kfmt(open.tokens)} tokens · ${open.tools ?? "?"} tool calls · ${open.ms !== undefined ? dur(open.ms) : "?"}` : "not recorded"}
                </p>
                <Dialog.Close className="btn">Close (Esc)</Dialog.Close>
              </>
            ) : null}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
