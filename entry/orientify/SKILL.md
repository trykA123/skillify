---
name: orientify
description: Understand an unknown codebase before you plan or change anything. Follows one real flow end to end, finds which parts do real work, and flags risky spots. Writes a Codebase Brief and changes no files. Use when dropped into an unfamiliar repo, or returning after time away.
---

# Orientify

**Interaction gate.** Apply [the shared interaction gate](references/interaction-gate.md)
before task work. Infer Weight, Verbosity, and Ownership; treat Explanation as opt-in.
Show a route card only when routes are genuinely contested after a quick look at the
subject, the work is Heavy, or a step is destructive or irreversible — otherwise proceed
on the inferred route with a one-line receipt.

You can't have intent about a codebase you don't understand. Build the model, write the
brief, change nothing.

Most of this an agent does natively when asked. Three things it reliably doesn't, and
they are the reason this skill exists: **tracing one flow all the way through** rather
than sampling files, **applying the deletion test** instead of describing structure, and
**naming traps without fixing them**.

## Quick orient

If the repo has under ~20 meaningful source files, you already have a recent brief, or
the question is narrow ("where does X live?"), write five lines and stop:

```markdown
**Shape:** <what the system is, entry → exit>
**Entry:** <where things start>
**Flow:** <the one path, 2-3 hops>
**Seams:** <where modules meet>
**Watch out:** <one trap, or none spotted>
```

Escalate only if that reveals more than expected — unclear boundaries, more modules than
the file count suggested.

If Mapify is available and a catalogue or `.mapify/` library exists, query its compact
index before a broad scan. Treat every hit as an unverified starting pointer: confirm
the current path and symbol, then trace current code normally. A missing or stale map
changes nothing about the orientation bar. Orientify remains read-only; when a durable
multi-file or historical discovery passes Mapify's retention gate, use its read-only
`propose` operation and include one compact deposit candidate after the brief rather
than writing memory during orientation.

## Full orient

**Scan.** README, CONTEXT.md or AGENTS.md for the intended story. Entry points — main,
index, handlers, CLI, config. `git log` walked back for what keeps changing, and why it
attracts change. Dependencies and test layout. Note it when there's no git history
rather than pretending the hot-spot read is complete.

**Trace one flow end to end.** Pick the path the repo exists for — a request, a run, a
render, a build — and follow it through every module it touches. Where you had to bounce
between files to hold one idea, that's not your failing, that's data about the design.

**Find the seams** with the deletion test: *would deleting this concentrate complexity,
or just move it?* A module that only moves complexity is shallow, and the seam is in the
wrong place. Real seams are where modules meet without leaking.

**Name the traps.** What looks alive but isn't — unreferenced exports, half-finished
migrations, TODO empires. What's dangerous — untested, recently rewritten, clever.
**Name them, don't defuse them.** Fixing is a different job and doing it here means the
orientation never finishes.

## The brief

```markdown
## Codebase Brief — <repo>
<date — briefs rot>

### Vocabulary
<terms from the docs, plus what the code actually calls things>

### Architecture
<~10 lines: entry → seams → exits>

### Hot spots
<what keeps changing, and why it attracts change>

### Seams
<where modules meet; what the deletion test said>

### Traps
<dangerous, untested, half-migrated — named, not fixed>

### Open questions
<what orientation couldn't resolve — these feed undumbify or the user>

### Orientation check
<the flow you traced, in 3 lines — proof the map is real>
```

## Done when

A fresh agent reading the brief asks no orientation questions. The session ends when the
brief is written. Refactoring or fixing anything is a scope violation — it goes in Open
Questions instead.

The orientation check is the part worth guarding: without a flow actually traced, the
brief is a plausible summary of directory names rather than a map of the system.
