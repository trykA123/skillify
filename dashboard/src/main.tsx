import { useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Tooltip } from "@base-ui/react/tooltip";
import { REPO, data } from "./lib";
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
  { id: "overview", label: "Overview", icon: I("M2 2h5v5H2zM9 2h5v3H9zM9 7h5v7H9zM2 9h5v5H2z"), title: "Overview", sub: "Do skills help, and what do they cost?" },
  { id: "evals", label: "Evals", icon: I("M2 14V8M6 14V4M10 14V9M14 14V2"), title: "Paired evals", sub: "Same tasks, with and without skills, per model" },
  { id: "tasks", label: "Tasks", icon: I("M5 4h9M5 8h9M5 12h9M2 4h.01M2 8h.01M2 12h.01"), title: "Tasks", sub: "What each task asks and exactly how it is scored" },
  { id: "categories", label: "Kinds of work", icon: I("M2 3h5l1 2h6v8H2z"), title: "Kinds of work", sub: "Coding, debugging, reviewing, clarifying" },
  { id: "field", label: "Field runs", icon: I("M3 2h10v12H3zM6 5h4M6 8h4M6 11h2"), title: "Field runs", sub: "What agents said about skills on real work" },
  { id: "skills", label: "Skills", icon: I("M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4L2.2 6.3l4-.6z"), title: "Skills", sub: "Per skill: field verdicts and measured effect" },
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

function App() {
  const [route, setRoute] = useState(parse);
  const [theme, setTheme] = useState(getTheme);
  const [menu, setMenu] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const main = useRef<HTMLElement>(null);
  const go = (h: string) => {
    location.hash = `#/${h}`;
  };
  useEffect(() => {
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
      const t = e.target as HTMLElement;
      if (t.closest("input, select, textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
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
      <div className={`app${menu ? " menu-open" : ""}`}>
        <aside className="side">
          <div className="brand">
            <span className="logo" aria-hidden="true" />
            <div>
              <div className="brand-t">Skillify</div>
              <div className="brand-s">Field recorder</div>
            </div>
          </div>
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
              {theme === "dark" ? "Light theme" : "Dark theme"}
            </button>
            <a className="btn ghost" href={REPO} target="_blank" rel="noreferrer">
              GitHub ↗
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
            <div className="top-r muted small">
              Last run {data.lastEntry ?? "—"} · built {data.generated.slice(0, 10)}
            </div>
          </header>
          {body}
        </main>
      </div>
    </Tooltip.Provider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
