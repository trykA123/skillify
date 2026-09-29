export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="lg-mark" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="var(--cyan)" />
          <stop offset="1" stopColor="var(--lime)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="var(--bg2)" stroke="var(--line2)" />
      <circle cx="16" cy="16" r="8.5" fill="none" stroke="var(--line2)" strokeWidth="2.5" />
      <path d="M16 24.5a8.5 8.5 0 0 1-7.4-12.7" fill="none" stroke="var(--cyan)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8.6 11.8A8.5 8.5 0 1 1 24 20.2" fill="none" stroke="url(#lg-mark)" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="24" cy="20.2" r="2.1" fill="var(--lime)" />
    </svg>
  );
}

const icon = (children: React.ReactNode) => (
  <svg className="k-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const KIND_ICONS: Record<string, React.ReactNode> = {
  coding: icon(
    <>
      <path d="M8 8l-4 4 4 4M16 8l4 4-4 4" />
      <path d="M13.5 5l-3 14" />
    </>,
  ),
  debugging: icon(
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </>,
  ),
  reviewing: icon(
    <>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
      <path d="M9 12.2l2 2 4-4.2" />
    </>,
  ),
  clarifying: icon(
    <>
      <path d="M9.2 9a3 3 0 1 1 4.3 2.7c-.9.4-1.5 1.2-1.5 2.2v.4" />
      <path d="M12 18h.01" />
      <path d="M19 3l.7 1.8L21.5 5.5l-1.8.7L19 8l-.7-1.8-1.8-.7 1.8-.7z" />
    </>,
  ),
};

export function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 400 400" aria-hidden="true">
      <defs>
        <radialGradient id="ha" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="var(--lime)" stopOpacity="0.5" />
          <stop offset="1" stopColor="var(--lime)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[60, 100, 140, 180].map((r, i) => (
        <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="var(--line2)" strokeDasharray={i % 2 ? "2 7" : "1 0"} />
      ))}
      <path d="M200 40a160 160 0 0 1 151 107" fill="none" stroke="var(--lime)" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 200a160 160 0 0 1 60-125" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="351" cy="147" r="5" fill="var(--lime)" />
      <circle cx="200" cy="200" r="60" fill="url(#ha)" />
    </svg>
  );
}

export function MethodDiagram() {
  const box = (x: number, y: number, w: number, t: string, s: string) => (
    <g>
      <rect className="n-box" x={x} y={y} width={w} height={56} rx={12} />
      <text className="n-t" x={x + 14} y={y + 24}>
        {t}
      </text>
      <text className="n-s" x={x + 14} y={y + 42}>
        {s}
      </text>
    </g>
  );
  return (
    <svg className="method-art" viewBox="0 0 820 190" role="img" aria-label="How a paired run works: one task runs without skills and with the skill, each run is graded, then the scores are compared.">
      {box(0, 67, 150, "Task repo", "prompt + trap")}
      {box(220, 12, 190, "Run without skills", "same model, same tools")}
      {box(220, 122, 190, "Run with the skill", "SKILL.md loaded")}
      {box(480, 67, 150, "Grader", "hidden tests / rubric")}
      {box(690, 67, 130, "Score 0–1", "mean of runs")}
      <path className="flow" d="M150 95 C185 95 185 40 220 40" />
      <path className="flow" d="M150 95 C185 95 185 150 220 150" />
      <path className="flow cyan" d="M410 40 C445 40 445 95 480 95" />
      <path className="flow lime" d="M410 150 C445 150 445 95 480 95" />
      <path className="flow" d="M630 95 L690 95" />
    </svg>
  );
}

export const FAVICON = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#5ee6ff"/><stop offset="1" stop-color="#c8ff4d"/></linearGradient></defs><rect x="1" y="1" width="30" height="30" rx="9" fill="#0a0c16"/><circle cx="16" cy="16" r="8.5" fill="none" stroke="#2a2e44" stroke-width="2.5"/><path d="M16 24.5a8.5 8.5 0 0 1-7.4-12.7" fill="none" stroke="#5ee6ff" stroke-width="2.5" stroke-linecap="round"/><path d="M8.6 11.8A8.5 8.5 0 1 1 24 20.2" fill="none" stroke="url(#g)" stroke-width="3.4" stroke-linecap="round"/><circle cx="24" cy="20.2" r="2.1" fill="#c8ff4d"/></svg>',
)}`;
