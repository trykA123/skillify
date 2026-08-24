---
name: traceify
description: Structured repair loop for when something is broken — symptoms before hypotheses, falsifiable hypotheses ranked, cheapest discriminating test first, root cause named before any fix. Handles trivial fixes end to end; hands non-trivial ones to the pipeline. Use when "it was working yesterday" or "this error makes no sense."
---

# Traceify

**Controls are optional.** Infer `Weight: Light | Standard | Heavy`,
`Verbosity: Terse | Concise | Detailed`, and
`Explanation: Layman | Operational | Expert`; default to risk-based weight, Concise,
and Operational. Never require a control block. Before substantial work, offer two to
four concrete approaches through the runtime's choice UI or a numbered list; recommend
one and wait for the selection. For a tiny obvious request, show a one-line selection
receipt and proceed. Controls never weaken evidence, safety, or authorization.

Something is broken. Find out why, fix it minimally, prove it's fixed.

This is not the build pipeline — no brief, no packet, no slices. A symptom, a
hypothesis, a test, a fix. The loop is abductive: you infer causes from effects rather
than deducing effects from specs, which is why the discipline below matters more here
than anywhere else. Guessing feels identical to reasoning right up until the fix doesn't
hold.

Use it for errors, stack traces, regressions, 502s, timeouts, corruption and
intermittent failures. Not for "I want to improve X" — that's a feature.

## 1. Capture symptoms — before any hypothesis

- **Error** — exact message, stack trace, exit code, status
- **Behaviour** — what happens versus what should, stated as the delta
- **Scope** — everyone or one endpoint, always or sometimes
- **Timeline** — when it started, what changed near then
- **Environment** — where it reproduces, and where it doesn't

If the report is thin, ask exactly one question: *"What's the smallest thing I can do to
see this myself?"*

**If it's intermittent**, don't force a hypothesis. Widen the timeline to the first
occurrence rather than the latest, capture the conditions envelope — input, persisted
state, concurrency, environment, timing — and reach for instrumentation before
bisecting. A bug you can't summon is a data-gathering problem first and a diagnosis
problem second. Get a reliable trigger, then think.

## 2. Rank falsifiable hypotheses

Two to four, ranked by likelihood. What usually did it, in rough order: something
changed recently, a dependency moved, persisted state disagrees with the code's
assumptions, the environment drifted, or something is racing.

```markdown
### H1: <hypothesis> (likelihood: high/med/low)
**Because:** <reasoning from evidence>
**Falsified by:** <the observation that would rule this out>
**Cheapest test:** <command or check>
```

A hypothesis with no falsifier is a belief. Write the falsifier first if it helps.

## 3. Test the cheapest discriminator first

Run the cheapest test that separates H1 from the rest. Confirmed, go to step 4;
falsified, move to H2. Don't test them all — stop at the first confirmation unless the
evidence genuinely suggests two causes.

Reach for these roughly in order: read the log line, check `git log` on the affected
path, reproduce with minimal input, inspect runtime state, add temporary
instrumentation, bisect against a known-good point.

Record what each test showed. Falsified hypotheses still narrow the space.

## 4. Name the root cause

Before touching anything:

> The bug is **X** because **Y**, which causes **Z** when **condition**.

If you can't say that cleanly, you don't understand it yet — keep testing. Fixing at
this point produces a change that makes the symptom go away for a reason you can't
state, which is indistinguishable from luck.

Keep three things apart: the **root cause** (fix this), the **trigger** (may deserve a
guard), and the **symptom** (should vanish on its own once the cause is gone).

## 5. Fix minimally

The smallest change that addresses the root cause. Not the symptom, not a workaround
that masks it.

One change at a time so causation stays visible. Preserve behaviour outside the bug. Add
a regression guard when it's cheap. Do not refactor the surrounding code — *while I'm
here* is how a one-line fix becomes an unreviewable diff.

**Trivial** — a config value, a typo, a missing env var, an obvious correction: apply
it, verify, done. No pipeline.

**Non-trivial** — needs design decisions, spans files, requires migration, changes a
contract: stop and hand over.

```markdown
## Root-Cause Brief
**Symptom:** <what the user sees>
**Root cause:** <one sentence>
**Evidence:** <what confirmed it>
**Fix scope:** <what needs to change>
**Risk:** <what could go wrong with the fix>
**Constraints:** <what the fix must not break>
→ undumbify if there are design decisions; shapeify if the plan is obvious
```

## 6. Verify

The original symptom is gone when you reproduce the trigger. No new symptoms in the
affected area. The regression guard passes. Persisted state is consistent, if state was
involved.

If verification fails the hypothesis was wrong or incomplete — return to step 2 with the
new evidence. **Do not stack workarounds.** Two fixes layered over one misunderstanding
is how a bug becomes permanent.

## 7. Report

```markdown
**Symptom:** <what was broken>
**Root cause:** <one sentence>
**Evidence chain:** <the observations that led there>
**Fix:** <what changed>
**Verification:** <how you confirmed it>
**Regression guard:** <what was added, or why it wasn't worth it>
**Residual risk:** <noticed but not fixed, or none>
```

Dispatched as a delegated agent, return the whole report — and the Root-Cause Brief instead of
a fix when the fix is non-trivial, so the parent can route it.

## Before you close

The failure mode here isn't process, it's self-deception: check that the root cause was
stated *before* the fix rather than reconstructed after it, and that the symptom
disappearing is explained by the change rather than merely coincident with it.
