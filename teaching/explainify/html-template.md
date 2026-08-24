# Simple HTML wiring page

A knowledge page with a wiring diagram as a single-file page. Inline CSS + inline SVG only — no CDN, no frameworks. One tiny inline script allowed: the theme toggle.

## Skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><module> — wiring</title>
<style>
  /* Theme system: dark by default (no flashbangs), light via [data-theme="light"].
     Accent: teal for explainify. */
  :root {
    color-scheme: dark;
    --paper: #0f1115; --ink: #e2e8f0; --muted: #94a3b8;
    --line: #1e293b; --panel: #161b24;
    --accent: #2dd4bf; --accent-soft: #0b2f2a;
    --code-bg: #0b0e13; --code-ink: #e2e8f0;
    /* diagram palette — SVGs must use these variables, never hardcoded colors */
    --diagram-bg: #10151d; --node-fill: #161c26; --node-stroke: #334155;
    --node-text: #e2e8f0; --node-sub: #94a3b8;
    --traced-fill: #0b2f2a; --traced-stroke: #2dd4bf; --arrow: #64748b;
  }
  html[data-theme="light"] {
    color-scheme: light;
    --paper: #fafaf9; --ink: #1c1917; --muted: #78716c;
    --line: #e7e5e4; --panel: #ffffff;
    --accent: #0d9488; --accent-soft: #f0fdfa;
    --code-bg: #1c1917; --code-ink: #fafaf9;
    --diagram-bg: #ffffff; --node-fill: #ffffff; --node-stroke: #94a3b8;
    --node-text: #334155; --node-sub: #64748b;
    --traced-fill: #f0fdfa; --traced-stroke: #0d9488; --arrow: #64748b;
  }
  body { margin: 0; background: var(--paper); color: var(--ink);
         font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.6; }
  main { max-width: 56rem; margin: 0 auto; padding: 3rem 1.5rem 4rem; }
  header { border-bottom: 2px solid var(--accent); padding-bottom: 1rem; margin-bottom: 2rem; }
  .meta { color: var(--muted); font-size: .85rem; letter-spacing: .05em; text-transform: uppercase; margin: 0 0 .5rem; }
  h1 { font-size: 2rem; margin: 0; }
  .diagram { background: var(--diagram-bg); border: 1px solid var(--line);
             border-radius: .75rem; padding: 1rem; margin: 1.5rem 0; }
  svg { width: 100%; height: auto; display: block; }
  .caption { color: var(--muted); font-size: .9rem; margin-top: .75rem; }
  section h2 { font-size: 1.15rem; margin-top: 2.5rem; }
  .legend { display: flex; gap: 1.5rem; flex-wrap: wrap; color: var(--muted); font-size: .85rem; margin-top: .75rem; }
  .legend span { display: inline-flex; align-items: center; gap: .4rem; }
  .swatch { width: 1.6rem; height: .35rem; border-radius: 2px; display: inline-block; }
  #theme-toggle { position: fixed; top: 1rem; right: 1rem; z-index: 50;
    background: var(--panel); color: var(--ink); border: 1px solid var(--line);
    border-radius: 99px; width: 2.4rem; height: 2.4rem; cursor: pointer; font-size: 1.1rem; }
  footer { max-width: 56rem; margin: 0 auto; padding: 0 1.5rem 3rem; color: var(--muted); }
  a { color: var(--accent); }
</style>
</head>
<body>
  <main>
    <header><p class="meta"><date> · explainify lesson</p><h1><module> — how it's wired</h1></header>
    <section><h2>What it does</h2><p>2–3 sentences, plain language</p></section>
    <section class="diagram">
      <h2>The wiring</h2>
      <svg viewBox="0 0 800 400" role="img" aria-label="<one-line description>">
        <!-- one box per module (real names), arrows labeled with the
             communication (call / event / data), traced path highlighted.
             Colors: fill="var(--node-fill)" stroke="var(--node-stroke)"
             text fill="var(--node-text)" / "var(--node-sub)"
             traced boxes: fill="var(--traced-fill)" stroke="var(--traced-stroke)"
             arrows: stroke="var(--arrow)" (traced: var(--traced-stroke)) -->
      </svg>
      <p class="caption"><the path, in words, with real line references></p>
      <div class="legend">
        <span><i class="swatch" style="background:var(--traced-stroke)"></i>traced path</span>
        <span><i class="swatch" style="background:var(--node-stroke)"></i>reference / data flow</span>
      </div>
    </section>
    <section><h2>Key symbols</h2><ul>…</ul></section>
    <section><h2>Gotchas</h2><ul>…</ul></section>
  </main>
  <footer><a href="<absolute or verified relative path to progress.html>">progress →</a></footer>
  <button id="theme-toggle" aria-label="Toggle theme">☀️</button>
  <script>
    // Theme toggle — dark by default, choice persisted.
    (function () {
      var saved = localStorage.getItem('theme');
      if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
      var btn = document.getElementById('theme-toggle');
      btn.textContent = saved === 'light' ? '🌙' : '☀️';
      btn.onclick = function () {
        var dark = document.documentElement.getAttribute('data-theme') !== 'light';
        document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
        localStorage.setItem('theme', dark ? 'light' : 'dark');
        btn.textContent = dark ? '🌙' : '☀️';
      };
    })();
  </script>
</body>
</html>
```

## Diagram rules

- Boxes: rounded rects, module names in the box, one accent (teal) + grays
- **Every color in the SVG is a CSS variable** — never hardcode hex inside `<svg>`; the theme must reach the diagram (see the palette in `:root`)
- Arrows: labeled with what flows (call / event / data / config)
- The traced path is the highlighted (accent-colored) arrow — one path, not the whole graph
- Real names only — the diagram must be greppable against the code
- The `progress →` footer link must actually resolve: same-repo pages use a relative path, cross-repo pages use an absolute `file://` path
