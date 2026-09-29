import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Tooltip } from "@base-ui/react/tooltip";
import { dir, pts, s2, scoreMeaning } from "./lib";

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useCountUp(target: number, ms = 1100) {
  const [v, setV] = useState(() => (reduced() ? target : 0));
  useEffect(() => {
    if (reduced()) return setV(target);
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function CountUp({ value, format = (x: number) => String(Math.round(x)) }: { value: number; format?: (x: number) => string }) {
  return <>{format(useCountUp(value))}</>;
}

export function useSpotlight() {
  useEffect(() => {
    const on = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.(".card") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    addEventListener("pointermove", on, { passive: true });
    return () => removeEventListener("pointermove", on);
  }, []);
}

export function Ring({ base, skill, label }: { base: number; skill: number; label: string }) {
  const R = 66, C = 2 * Math.PI * R, R2 = 52, C2 = 2 * Math.PI * R2;
  const [on, setOn] = useState(reduced());
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const d = skill - base;
  const shown = useCountUp(Math.round(d * 100));
  return (
    <div className="ring">
      <svg viewBox="0 0 160 160" role="img" aria-label={`${label}: ${s2(base)} without skills, ${s2(skill)} with skills, ${pts(d)}`}>
        <g transform="rotate(-90 80 80)">
          <circle className="track" cx="80" cy="80" r={R} />
          <circle className="track thin" cx="80" cy="80" r={R2} />
          <circle className="arc-skill" cx="80" cy="80" r={R} strokeDasharray={C} strokeDashoffset={on ? C * (1 - skill) : C} />
          <circle className="arc-base" cx="80" cy="80" r={R2} strokeDasharray={C2} strokeDashoffset={on ? C2 * (1 - base) : C2} />
        </g>
        <text className="ring-v" x="80" y="86" textAnchor="middle">
          {d >= 0 ? "+" : "−"}
          {Math.abs(Math.round(shown))}
        </text>
        <text className="ring-s" x="80" y="103" textAnchor="middle">
          PTS
        </text>
      </svg>
      <div className="ring-n">{label}</div>
      <div className="ring-sub">
        <i>{s2(base)}</i> → <b>{s2(skill)}</b>
      </div>
    </div>
  );
}

export function Tip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={<span className="tip-t" tabIndex={0} />}>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={8}>
          <Tooltip.Popup className="tip">{content}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function Score({ v, n, kind, label }: { v: number; n?: number; kind?: "tests" | "rubric"; label?: string }) {
  return (
    <Tip
      content={
        <>
          <b>
            {s2(v)} {label ?? "score"}
          </b>
          {n ? <> · mean of {n} runs</> : null}
          <br />
          {scoreMeaning(kind)}
          <br />
          1.00 is perfect.
        </>
      }
    >
      <span className="num">{s2(v)}</span>
    </Tip>
  );
}

export function Delta({ d, big }: { d: number; big?: boolean }) {
  return (
    <Tip content={<>Score change with skills, in points out of 100. {pts(d)} = {d >= 0 ? "+" : "−"}{Math.abs(d).toFixed(2)} on the 0–1 score.</>}>
      <span className={`delta ${dir(d)}${big ? " big" : ""}`}>{pts(d)}</span>
    </Tip>
  );
}

export function PairBars({ base, skill }: { base: number; skill: number }) {
  return (
    <div className="pairbars" aria-label={`without skills ${s2(base)}, with skills ${s2(skill)}`}>
      <div className="pb">
        <span className="pb-l">without</span>
        <span className="pb-t">
          <i style={{ transform: `scaleX(${Math.max(0, Math.min(1, base))})` }} />
        </span>
        <span className="pb-v num">{s2(base)}</span>
      </div>
      <div className={`pb skill ${dir(skill - base)}`}>
        <span className="pb-l">with skills</span>
        <span className="pb-t">
          <i style={{ transform: `scaleX(${Math.max(0, Math.min(1, skill))})` }} />
        </span>
        <span className="pb-v num">{s2(skill)}</span>
      </div>
    </div>
  );
}

export function Verdict({ v }: { v: "helped" | "neutral" | "hurt" }) {
  return <span className={`verdict v-${v}`}>{v}</span>;
}

export function Chip({ children, tone }: { children: ReactNode; tone?: string }) {
  return <span className={`chip${tone ? ` c-${tone}` : ""}`}>{children}</span>;
}

export function Card({ title, sub, children, className }: { title?: ReactNode; sub?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card${className ? ` ${className}` : ""}`}>
      {title ? (
        <header className="card-h">
          <h3>{title}</h3>
          {sub ? <p>{sub}</p> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="stat">
      <div className="stat-v">{value}</div>
      <div className="stat-l">{label}</div>
      {hint ? <div className="stat-h">{hint}</div> : null}
    </div>
  );
}

function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function Dumbbell({ rows }: { rows: { label: string; base: number; skill: number }[] }) {
  const [ref, W] = useWidth<HTMLElement>(460);
  const lo = Math.max(0, Math.floor((Math.min(...rows.flatMap((r) => [r.base, r.skill])) - 0.04) * 20) / 20);
  const rowH = W > 700 ? 64 : 48, pad = { l: W > 700 ? 130 : 104, r: 40, t: 14, b: 34 };
  const H = pad.t + rows.length * rowH + pad.b;
  const x = (v: number) => pad.l + ((v - lo) / (1 - lo)) * (W - pad.l - pad.r);
  const ticks: number[] = [];
  for (let t = lo; t <= 1.0001; t += lo <= 0.5 ? 0.1 : 0.05) ticks.push(Math.round(t * 100) / 100);
  return (
    <figure className="dumbbell" ref={ref}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Mean score without and with skills per model">
        <defs>
          <linearGradient id="dbgrad" x1="0" x2="1">
            <stop offset="0" stopColor="var(--cyan)" stopOpacity="0.6" />
            <stop offset="1" stopColor="var(--lime)" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={pad.t} y2={H - pad.b + 4} className="grid" />
            <text x={x(t)} y={H - pad.b + 18} className="axis" textAnchor="middle">
              {t.toFixed(2)}
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          const cy = pad.t + i * rowH + rowH / 2;
          const up = r.skill >= r.base;
          return (
            <g key={r.label} className="db-row">
              <text x={0} y={cy + 4} className="db-l">
                {r.label}
              </text>
              <line x1={x(r.base)} x2={x(r.skill)} y1={cy} y2={cy} className={`db-link ${up ? "up" : "down"}`} />
              <circle cx={x(r.base)} cy={cy} r={5.5} className="db-base" />
              <circle cx={x(r.skill)} cy={cy} r={6.5} className={`db-skill ${up ? "up" : "down"}`} />
              <text x={x(r.base) - 10} y={cy - 10} className="db-v" textAnchor="middle">
                {s2(r.base)}
              </text>
              <text x={x(r.skill) + 10} y={cy - 10} className="db-v strong" textAnchor="middle">
                {s2(r.skill)}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="db-key">
        <span><i className="k-base" /> without skills</span>
        <span><i className="k-skill" /> with skills</span>
        {lo > 0 ? <span className="muted">axis starts at {lo.toFixed(2)}, not 0</span> : null}
      </figcaption>
    </figure>
  );
}

export function SlopeChart({ rows }: { rows: { label: string; base: number; skill: number }[] }) {
  const W = 420, H = 220, pad = { l: 44, r: 118, t: 16, b: 28 };
  const y = (v: number) => pad.t + (1 - v) * (H - pad.t - pad.b);
  const x0 = pad.l, x1 = W - pad.r;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const order = rows.map((r, i) => ({ i, y: y(r.skill) })).sort((a, b) => a.y - b.y);
  const ly: number[] = [];
  order.forEach((o, k) => {
    ly[o.i] = k === 0 ? o.y : Math.max(o.y, ly[order[k - 1].i] + 15);
  });
  return (
    <svg className="slope" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Score without and with skills per model">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x0} x2={x1} y1={y(t)} y2={y(t)} className="grid" />
          <text x={x0 - 8} y={y(t) + 4} className="axis" textAnchor="end">
            {t.toFixed(2)}
          </text>
        </g>
      ))}
      <text x={x0} y={H - 8} className="axis" textAnchor="middle">
        without
      </text>
      <text x={x1} y={H - 8} className="axis" textAnchor="middle">
        with skills
      </text>
      {rows.map((r, i) => (
        <g key={r.label} className={`sl s${i}`}>
          <line x1={x0} x2={x1} y1={y(r.base)} y2={y(r.skill)} />
          <circle cx={x0} cy={y(r.base)} r={4} />
          <circle cx={x1} cy={y(r.skill)} r={4} />
          <text x={x1 + 10} y={ly[i] + 4} className="sl-l">
            {r.label} {s2(r.skill)}
          </text>
        </g>
      ))}
    </svg>
  );
}
