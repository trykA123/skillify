---
name: orientify
description: Build a working map of an unfamiliar codebase before planning or changing it. Traces one real flow end to end, finds the real seams, and names traps without fixing them. Read-only. Use when entering a new repo or returning after a long gap.
---

# Orientify

Understand first, change nothing. Three things matter more than breadth: trace one flow
all the way through, test each boundary with the deletion test, and name traps instead
of fixing them.

## Quick orient

For under ~20 source files or a narrow question ("where does X live?"), answer in five
lines and stop:

```markdown
**Shape:** <what the system is, entry → exit>
**Entry:** <where execution starts>
**Flow:** <the main path, 2–3 hops with file:symbol>
**Seams:** <where modules meet>
**Watch out:** <one trap, or none found>
```

## Full orient

1. **Scan.** README, AGENTS.md or CLAUDE.md, entry points (main, handlers, CLI, config),
   dependencies, test layout. Run `git log --stat` over recent history to find the
   files that change most, and read why they change. Say so if there is no history.
2. **Trace one flow end to end.** Pick the path the repo exists for (a request, a job,
   a render, a build) and follow it through every module it touches, with file:line.
3. **Find seams with the deletion test.** Would deleting this module concentrate
   complexity or only move it? A module that only moves it is shallow.
4. **Name traps.** Dead code that looks alive, half-finished migrations, untested or
   recently rewritten hot paths, clever code. Name them; do not fix them.

## Codebase brief

```markdown
## Codebase Brief — <repo> — <date>
**Vocabulary:** <domain terms, and what the code calls them>
**Architecture:** <~10 lines: entry → seams → exits>
**Hot spots:** <what changes often, and why>
**Seams:** <boundaries and what the deletion test showed>
**Traps:** <named, not fixed>
**Open questions:** <what orientation could not settle>
**Traced flow:** <3 lines with file:symbol — proof the map is real>
```

Done when a fresh agent could start work from the brief without asking orientation
questions. Any fix you noticed goes under Open questions, not into the code.
