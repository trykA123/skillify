import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Tooltip } from "@base-ui/react/tooltip";
import { Dialog } from "@base-ui/react/dialog";
import { REPO, catById, data } from "./lib";
import { useSpotlight } from "./ui";
import { FAVICON, Logo } from "./art";
import { Overview } from "./views/Overview";
import { Evals } from "./views/Evals";
import { TaskDetail, TaskList } from "./views/Tasks";
import { Categories } from "./views/Categories";
import { Field } from "./views/Field";
import { Skills } from "./views/Skills";
import { Method } from "./views/Method";

const I = (d: string) => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const VIEWS: { id: string; label: string; icon: ReactNode; title: string; sub: string }[] = [
  { id: "overview", label: "Overview", icon: I("M2 2h5v5H2zM9 2h5v3H9zM9 7h5v7H9zM2 9h5v5H2z"), title: "Overview", sub: "Do skills help AI agents, and what do they cost?" },
  { id: "evals", label: "Evals", icon: I("M2 14V8M6 14V4M10 14V9M14 14V2"), title: "Paired evals", sub: "Same tasks, with and without skills, per model" },
  { id: "tasks", label: "Tasks", icon: I("M5 4h9M5 8h9M5 12h9M2 4h.01M2 8h.01M2 12h.01"), title: "Tasks", sub: "What each task asks and exactly how it is scored" },
  { id: "categories", label: "Kinds of work", icon: I("M2 3h5l1 2h6v8H2z"), title: "Kinds of work", sub: "Coding, debugging, reviewing, clarifying" },
  { id: "field", label: "Field runs", icon: I("M3 2h10v12H3zM6 5h4M6 8h4M6 11h2"), title: "Field runs", sub: "What agents said about skills on real work" },
  { id: "skills", label: "Skills", icon: I("M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4L2.2 6.3l4-.6z"), title: "Skills & agents", sub: "Skillify's engineering skills and portable agent roles" },
  { id: "method", label: "Method", icon: I("M8 2a6 6 0 100 12A6 6 0 008 2zM8 7v4M8 5h.01"), title: "Method", sub: "How runs are done, scored and priced" },
];

const parse = () => {
  const [view = "overview", arg] = location.hash.replace(/^#\/?/, "").split("/");
  return { view: VIEWS.some((v) => v.id === view) ? view : "overview", arg };
};

function getTheme(): "dark" | "light" {
  try {
    const s = localStorage.getItem("skillify-theme");
    if (s === "dark" || s === "light") return s;
  } catch {}
  return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

type Hit = { label: string; kind: string; href: string };

function Palette({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const all = useMemo<Hit[]>(
    () => [
      ...VIEWS.map((v) => ({ label: v.title, kind: "view", href: `#/${v.id}` })),
      ...data.tasks.map((t) => ({ label: `${t.task} · ${t.skill}`, kind: catById(t.category)?.label ?? "task", href: `#/tasks/${t.task}` })),
      ...data.categories.map((c) => ({ label: c.label, kind: "kind of work", href: `#/categories/${c.id}` })),
    ],
    [],
  );
  const hits = all.filter((h) => h.label.toLowerCase().includes(q.toLowerCase())).slice(0, 12);
  const pick = (h?: Hit) => {
    if (!h) return;
    location.hash = h.href;
    setOpen(false);
  };
  useEffect(() => {
    if (open) {
      setQ("");
      setI(0);
    }
  }, [open]);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="backdrop" />
        <Dialog.Popup className="cmdk" aria-label="Jump to">
          <input
            autoFocus
            placeholder="Jump to a view, task or kind of work…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setI(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") (e.preventDefault(), setI((x) => Math.min(hits.length - 1, x + 1)));
              else if (e.key === "ArrowUp") (e.preventDefault(), setI((x) => Math.max(0, x - 1)));
              else if (e.key === "Enter") pick(hits[i]);
            }}
          />
          {hits.length ? (
            <ul role="listbox">
              {hits.map((h, k) => (
                <li key={h.href}>
                  <button aria-selected={k === i} onMouseEnter={() => setI(k)} onClick={() => pick(h)}>
                    {h.label}
                    <small>{h.kind}</small>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty">Nothing matches “{q}”.</div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function App() {
  const [route, setRoute] = useState(parse);
  const [theme, setTheme] = useState(getTheme);
  const [menu, setMenu] = useState(false);
  const [cmdk, setCmdk] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const main = useRef<HTMLElement>(null);
  useSpotlight();
  const go = (h: string) => {
    location.hash = `#/${h}`;
  };
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>("link[rel=icon]") ?? document.head.appendChild(Object.assign(document.createElement("link"), { rel: "icon" }));
    link.href = FAVICON;
    const on = () => {
      setRoute(parse());
      setMenu(false);
      main.current?.scrollTo({ top: 0 });
    };
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("skillify-theme", theme);
    } catch {}
  }, [theme]);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdk((o) => !o);
        return;
      }
      const t = e.target as HTMLElement;
      if (t.closest("input, select, textarea, [role=dialog]") || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= VIEWS.length) go(VIEWS[n - 1].id);
      else if (e.key === "/") {
        e.preventDefault();
        if (parse().view !== "field") go("field");
        setTimeout(() => search.current?.focus(), 30);
      }
    };
    addEventListener("keydown", on);
    return () => removeEventListener("keydown", on);
  }, []);
  const v = VIEWS.find((x) => x.id === route.view)!;
  const body =
    route.view === "overview" ? <Overview go={go} /> :
    route.view === "evals" ? <Evals /> :
    route.view === "tasks" ? (route.arg ? <TaskDetail id={route.arg} /> : <TaskList />) :
    route.view === "categories" ? <Categories focus={route.arg} /> :
    route.view === "field" ? <Field search={search} /> :
    route.view === "skills" ? <Skills /> : <Method />;
  return (
    <Tooltip.Provider delay={150}>
      <div className="ambient" aria-hidden="true">
        <div className="orb a" />
        <div className="orb b" />
        <div className="orb c" />
        <div className="grid-dots" />
      </div>
      <div className={`app${menu ? " menu-open" : ""}`}>
        <aside className="side">
          <div className="brand">
            <Logo />
            <div>
              <div className="brand-t">Skillify</div>
              <div className="brand-s">Signal · field recorder</div>
            </div>
          </div>
          <button className="cmdk-btn" onClick={() => setCmdk(true)}>
            {I("M7 12A5 5 0 107 2a5 5 0 000 10zM14 14l-3.5-3.5")}
            Jump to…
            <kbd>⌘K</kbd>
          </button>
          <nav aria-label="Views">
            {VIEWS.map((x, i) => (
              <a key={x.id} href={`#/${x.id}`} className={x.id === route.view ? "on" : ""} aria-current={x.id === route.view ? "page" : undefined}>
                {x.icon}
                <span>{x.label}</span>
                <kbd>{i + 1}</kbd>
              </a>
            ))}
          </nav>
          <div className="side-foot">
            <button className="btn ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
              {theme === "dark" ? I("M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3M8 11a3 3 0 100-6 3 3 0 000 6z") : I("M13 9.5A5.5 5.5 0 116.5 3a4.5 4.5 0 006.5 6.5z")}
              {theme === "dark" ? "Light theme" : "Dark theme"}
            </button>
            <a className="btn ghost" href={REPO} target="_blank" rel="noreferrer">
              {I("M6 13c-3 1-3-1.5-4-2m8 4v-2.5c0-.8.1-1.4-.4-1.9 2-.2 4-1 4-4.3a3.4 3.4 0 00-.9-2.3 3.1 3.1 0 00-.1-2.3s-.7-.2-2.4.9a8.2 8.2 0 00-4.3 0C4.2 1.8 3.5 2 3.5 2a3.1 3.1 0 00-.1 2.3 3.4 3.4 0 00-.9 2.3c0 3.3 2 4.1 4 4.3-.5.5-.5 1-.4 1.9V15")}
              GitHub
            </a>
          </div>
        </aside>
        <main ref={main}>
          <header className="top">
            <button className="btn ghost burger" onClick={() => setMenu(!menu)} aria-label="Menu" aria-expanded={menu}>
              ☰
            </button>
            <div>
              <h1>{v.title}</h1>
              <p>{v.sub}</p>
            </div>
            <div className="top-r">
              <span className="live when">
                <i /> last run {data.lastEntry ?? "—"}
              </span>
            </div>
          </header>
          <div key={location.hash} style={{ display: "contents" }}>
            {body}
          </div>
        </main>
      </div>
      <Palette open={cmdk} setOpen={setCmdk} />
    </Tooltip.Provider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
