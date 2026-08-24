---
name: orientify
description: Orient in a codebase you don't know before planning or changing anything. Traces one real flow end to end, applies the deletion test to suspected shallow modules, names landmines without defusing them. Produces a Codebase Brief and touches nothing. Use when dropped into an unfamiliar repo, or returning after a long gap.
---

# Orientify

**Controls are optional.** Infer `Weight: Light | Standard | Heavy`,
`Verbosity: Terse | Concise | Detailed`, and
`Explanation: Layman | Operational | Expert`; default to risk-based weight, Concise,
and Operational. Never require a control block. Before substantial work, offer two to
four entries through the runtime's choice UI or a numbered list; put the recommended
concrete route first and wait for the selection. For a tiny obvious request, show a
one-line selection receipt and proceed. End every substantial card with a selectable
**Customize** entry or the runtime equivalent. If selected, show one second-stage
selector listing every allowed Weight, Verbosity, Explanation, and
Ownership (Solo, Team, or Custom team) value with a one-sentence meaning and
inferred values preselected. Accept only changes and confirm one final receipt. Team
means the smallest useful roles, never the full fleet. Keep a simple handoff
parent-coordinated; add an Orchestrator only when coordination is substantial.
Customization cannot weaken safeguards or grant authority.

You can't have intent about a codebase you don't understand. Build the model, write the
brief, change nothing.

Most of this an agent does natively when asked. Three things it reliably doesn't, and
they are the reason this skill exists: **tracing one flow all the way through** rather
than sampling files, **applying the deletion test** instead of describing structure, and
**naming landmines without fixing them**.

## Quick orient

If the repo has under ~20 meaningful source files, you already have a recent brief, or
the question is narrow ("where does X live?"), write five lines and stop:

```markdown
**Shape:** <what the system is, entry → exit>
**Entry:** <where things start>
**Flow:** <the one path, 2-3 hops>
**Seams:** <where modules meet>
**Watch out:** <one landmine, or none spotted>
```

Escalate only if that reveals more than expected — unclear boundaries, more modules than
the file count suggested.

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

**Name the landmines.** What looks alive but isn't — unreferenced exports, half-finished
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

### Landmines
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
