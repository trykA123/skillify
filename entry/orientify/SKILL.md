---
name: orientify
description: Orient yourself in a codebase you don't know before planning or changing anything. Produces a Codebase Brief — vocabulary, architecture, hot spots, seams, landmines. Use when dropped into a repo for the first time, or returning after a long gap.
disable-model-invocation: true
argument-hint: "a codebase to orient in, or nothing to orient in the current one"
---

# Orientify

You can't have intent about a codebase you don't understand. Before explorify (diverge), undumbify (converge), shapeify (plan) — there is the cold start. Orientify is that step: build the mental model in one focused session, output a **Codebase Brief**, touch nothing.

## When To Use

- Dropped into a repo you've never seen (or don't remember)
- Returning after weeks away — the brief beats the memory
- Before any planning skill, when the codebase is the subject

## When NOT To Use

- You already know the codebase — go straight to undumbify/shapeify
- Mid-debug (traceify owns that loop — don't stop to orient)
- Exploring options (explorify) — orientation is not ideation

## Quick Orient (small scope)

If ANY of these hold, produce a **5-line brief** instead of the full process:

- The repo has <20 meaningful source files
- You already have a recent orientify brief for this repo
- The user's question is narrow ("where does X live?" / "what calls Y?")

```markdown
**Shape:** <one line — what the system is, entry → exit>
**Entry:** <where things start>
**Flow:** <the one path, 2-3 hops>
**Seams:** <where modules meet, one line>
**Watch out:** <one landmine, or "none spotted">
```

Done. No full scan, no hot-spot analysis, no deletion test. If the quick brief reveals
hidden complexity (more modules than expected, unclear boundaries), escalate to the full
process below.

---

## Full Process

### 1. Scan

- README / CONTEXT.md / AGENTS.md — the intended story of the repo
- Entry points: main, index, handlers, CLI, config — where things start
- Hot spots: `git log --oneline` walked back — what keeps changing (skip when no git history; note it)
- Dependencies and test layout — what it leans on, how it proves itself
- If your harness offers compact-output wrappers (for git log, tree, read, search), prefer them — same truth, less noise; otherwise run the commands directly

### 2. Trace One Flow End-To-End

Pick the one path the repo exists for — a request, a run, a render, a build — and follow it from entry to exit, through every module it touches. Note where understanding required bouncing between files. Friction is data.

### 3. Find The Seams

Apply the **deletion test** to anything suspected shallow: would deleting it concentrate complexity, or just move it? The seams are where modules meet without leaking.

### 4. Map Dead Code And Landmines

What looks alive but isn't (unreferenced exports, half-migrations, TODO empires). What is dangerous (untested, recently rewritten, clever). Landmines get **named, not defused** — fixing is out of scope.

### 5. Emit The Codebase Brief

```markdown
## Codebase Brief — <repo>
<date — briefs rot>

### Vocabulary
<terms from CONTEXT.md/README, plus what the code actually calls things>

### Architecture
<~10 lines: the shape of the system, entry → seams → exits>

### Hot Spots
<files that keep changing — and why they attract change>

### Seams
<where modules meet; what the deletion test said about each>

### Landmines
<dangerous, untested, half-migrated — named, not fixed>

### Open Questions
<what orientation couldn't resolve — these feed undumbify or the user>

### Orientation Check
<the one flow you traced, in 3 lines — proof the map is real>
```

## Completion Criterion

A fresh agent reading the brief asks zero orientation questions. The session ends when the brief is written — one session, artifact only. Refactoring, fixing, or "while I'm here" work is a scope violation; record it as an Open Question instead.

## Final Gate

- [ ] Scanned README/context, entry points, hot spots (or noted absent git history)
- [ ] One end-to-end flow traced and recorded
- [ ] Deletion test applied to suspected shallow modules
- [ ] Landmines named, not fixed
- [ ] Brief complete with all sections, dated
- [ ] No code changed, no files modified

## Topology Behavior

- **Single-agent:** The brief is your working map — keep it tight, but complete. The artifact matters more than the chat.
- **Subagent:** Return the full Codebase Brief as your output. The parent routes it: to undumbify for intent, or to the human for orientation.
