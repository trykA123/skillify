# Simple HTML lesson page

A lesson as a single-file page. Inline CSS only — no CDN, no frameworks. One diagram max. One tiny inline script allowed: the theme toggle.

## Skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><lesson title></title>
<style>
  /* Theme system: dark by default (no flashbangs), light via [data-theme="light"].
     Accent: amber for promptify, teal for explainify. */
  :root {
    color-scheme: dark;
    --paper: #0f1115; --ink: #e2e8f0; --muted: #94a3b8;
    --line: #1e293b; --panel: #161b24;
    --accent: #f59e0b; --accent-soft: #1a1508;
    --code-bg: #0b0e13; --code-ink: #e2e8f0;
  }
  html[data-theme="light"] {
    color-scheme: light;
    --paper: #fafaf9; --ink: #1c1917; --muted: #78716c;
    --line: #e7e5e4; --panel: #ffffff;
    --accent: #d97706; --accent-soft: #fff7ed;
    --code-bg: #1c1917; --code-ink: #fafaf9;
  }
  body { margin: 0; background: var(--paper); color: var(--ink);
         font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.6; }
  main { max-width: 42rem; margin: 0 auto; padding: 3rem 1.5rem 4rem; }
  header { border-bottom: 2px solid var(--accent); padding-bottom: 1rem; margin-bottom: 2rem; }
  .meta { color: var(--muted); font-size: .85rem; letter-spacing: .05em; text-transform: uppercase; margin: 0 0 .5rem; }
  h1 { font-size: 2rem; margin: 0; }
  h2 { margin-top: 2.5rem; font-size: 1.15rem; }
  blockquote { margin: 1rem 0; padding: 1rem 1.25rem; border-left: 4px solid var(--accent);
               background: var(--accent-soft); font-style: italic; border-radius: 0 .5rem .5rem 0; }
  pre { background: var(--code-bg); color: var(--code-ink); padding: 1rem 1.25rem;
        border-radius: .5rem; overflow-x: auto; font-size: .9rem; }
  #theme-toggle { position: fixed; top: 1rem; right: 1rem; z-index: 50;
    background: var(--panel); color: var(--ink); border: 1px solid var(--line);
    border-radius: 99px; width: 2.4rem; height: 2.4rem; cursor: pointer; font-size: 1.1rem; }
  footer { max-width: 42rem; margin: 0 auto; padding: 0 1.5rem 3rem; color: var(--muted); }
  a { color: var(--accent); }
</style>
</head>
<body>
  <main>
    <header>
      <p class="meta"><date> · promptify lesson</p>
      <h1><lesson title></h1>
    </header>
    <section><h2>The pattern</h2><blockquote><their real words></blockquote></section>
    <section><h2>What it costs / earns</h2></section>
    <section><h2>The fix</h2><pre><before → after></pre></section>
    <section><h2>Try it</h2></section>
  </main>
  <footer><a href="../../progress.html">progress →</a></footer>
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

## Rules

- **Dark by default** — the dashboard is dark; a light page is a flashbang
- One accent color (amber for promptify, teal for explainify) — ink stays near-white in dark, near-black in light
- `blockquote` for the user's real words — the lesson is built on them
- `pre` for before/after diffs — the fix must be copy-pasteable
- Link back to the dashboard (`../../progress.html`) — the game is one journey
- Prints well — someone should be able to pin it to a wall
