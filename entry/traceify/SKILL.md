---
name: traceify
description: Structured repair loop for when something is broken. Observe symptoms, form hypotheses, test them, confirm root cause, apply minimal fix, verify no regression. Standalone for trivial fixes; feeds the pipeline when the fix needs planning. Use when "it was working yesterday" or "this error makes no sense."
---

# Traceify

Something is broken. Your job: find out why, fix it minimally, prove it's fixed.

This is NOT the build pipeline. There's no brief, no packet, no slices. There's a
symptom, a hypothesis, a test, and a fix. The loop is tight and abductive — you infer
causes from effects, not deduce effects from specs.

## When To Use

- Error messages, stack traces, unexpected behavior
- "It was working before" / "Something changed and now it's broken"
- Performance regression, data corruption, intermittent failure
- 502s, timeouts, crashes, silent failures

## When NOT To Use

- Greenfield work or features → the build pipeline (undumbify → shapeify → shipify)
- "I want to improve X" → that's a feature, not a bug
- Exploratory "what if" → `explorify`

## 1. Capture Symptoms

Gather what's observable BEFORE forming hypotheses:

- **Error:** Exact message, stack trace, exit code, HTTP status
- **Behavior:** What happens vs what should happen (the delta)
- **Scope:** Who/what is affected? All users? One endpoint? Intermittent?
- **Timeline:** When did it start? What changed around that time?
- **Environment:** Where does it reproduce? Prod only? Local only? Specific conditions?

If the user's report is thin, ask ONE question: "What's the smallest thing I can do to
see this myself?"

**If it's intermittent ("I can't repro it"):** don't force a hypothesis yet. Widen the
timeline (first occurrence, not just the latest), capture the **conditions envelope**
— input, persisted state, concurrency, environment, timing — and reach for
instrumentation (logs, traces, metrics) before bisecting. A bug you can't summon is a
data-gathering problem first and a diagnosis problem second: get a reliable trigger,
then form hypotheses.

## 2. Form Ranked Hypotheses

Generate 2-4 hypotheses ranked by likelihood. Use these heuristics for ranking:

1. **Recent changes** — What was deployed, edited, or configured recently?
   (Check git log, config diffs, deployment timestamps.)
2. **Dependency changes** — Did an upstream service, package, or API change?
3. **State corruption** — Is persisted state inconsistent with code assumptions?
4. **Environment drift** — Did the runtime, network, or permissions change?
5. **Concurrency/timing** — Race condition, timeout, ordering assumption?

Each hypothesis must be **falsifiable** — state what observation would rule it out.

```markdown
### H1: <hypothesis> (likelihood: high/med/low)
**Because:** <reasoning from evidence>
**Falsified by:** <observation that rules this out>
**Cheapest test:** <command or check to confirm/deny>
```

## 3. Test Hypotheses (Cheapest First)

Execute the cheapest discriminating test for H1. If it's confirmed → go to step 4.
If falsified → move to H2. Do NOT test all hypotheses — stop at the first confirmed one
unless evidence suggests multiple causes.

Testing techniques (prefer in order):
1. Read the relevant log line / error output
2. Check git log / diff for recent changes in the affected path
3. Reproduce with minimal input
4. Inspect runtime state (DB row, env var, config value, process status)
5. Add temporary instrumentation (log line, breakpoint, trace)
6. Bisect (if regression with known-good point)

Record what each test showed. Evidence accumulates even from falsified hypotheses.

## 4. Confirm Root Cause

Before fixing, state the root cause in one sentence:

> "The bug is <X> because <Y>, which causes <Z> when <condition>."

If you can't state this clearly, you don't understand it yet. Keep testing.

Distinguish:
- **Root cause:** The underlying defect (fix this)
- **Trigger:** The condition that exposes it (may need a guard too)
- **Symptom:** What the user sees (should disappear after fix)

## 5. Apply Minimal Fix

The fix should be the **smallest change that addresses the root cause**. Not the symptom.
Not a workaround that masks it. The root cause.

Rules:
- Fix the root cause, not the symptom
- One change at a time (so you can verify causation)
- Preserve existing behavior outside the bug
- Add a regression guard if cheap (test, assertion, validation)
- Do NOT refactor surrounding code while fixing ("while I'm here..." is scope creep)

If the fix is **trivial** (one-line config change, typo fix, missing env var, obvious
code correction): apply it inline, verify, done. No pipeline needed.

If the fix is **non-trivial** (needs design decisions, touches multiple files, requires
migration, changes contracts): produce a **Root-Cause Brief** and hand to the pipeline:

```markdown
## Root-Cause Brief
**Symptom:** <what the user sees>
**Root cause:** <one sentence>
**Evidence:** <what confirmed it>
**Fix scope:** <what needs to change>
**Risk:** <what could go wrong with the fix>
**Constraints:** <what the fix must not break>
→ Route to: undumbify (if design decisions needed) or shapeify (if plan is obvious)
```

## 6. Verify Fix

After applying the fix:
1. The original symptom is gone (reproduce the trigger → no bug)
2. No new symptoms introduced (run existing tests / checks for affected area)
3. The regression guard passes (if added)
4. State is consistent (if bug involved persisted state)

If verification fails: the root cause hypothesis was wrong or incomplete. Return to
step 2 with new evidence. Do NOT stack workarounds.

## 7. Report

```markdown
## Diagnosis Report

**Symptom:** <what was broken>
**Root cause:** <one sentence>
**Evidence chain:** <key observations that led to the cause>
**Fix:** <what was changed>
**Verification:** <how you confirmed it's fixed>
**Regression guard:** <test/assertion added, or "none — too costly, here's why">
**Residual risk:** <related issues noticed but not fixed, or None>
**Skill map signal:** <one honest line, e.g. "resolved in 2 hypotheses → clean symptom description", or "none">
```

## Topology Behavior

- **Single-agent:** Traceify runs inline. The loop is fast — observe, think, check,
  fix. No formal artifacts until the report.
- **Subagent:** If dispatched as a subagent (e.g., "go figure out why X is broken"),
  return the full Diagnosis Report. If the fix is non-trivial, return the Root-Cause
  Brief for the parent to route.

## Interaction With Pipeline

- Trivial fix → traceify handles end-to-end, no pipeline involvement
- Non-trivial fix → traceify produces Root-Cause Brief → undumbify or shapeify
- Fix reveals architectural problem → traceify produces brief → undumbify (rethink)
- Fix is a known pattern → traceify notes it as follow-up, doesn't block

## Final Gate

- [ ] Symptoms captured before hypotheses formed
- [ ] Hypotheses are falsifiable and ranked
- [ ] Cheapest discriminating test run first
- [ ] Root cause stated clearly before fix attempted
- [ ] Fix addresses root cause, not symptom
- [ ] Fix is minimal (no "while I'm here" scope creep)
- [ ] Verification confirms symptom gone + no regression
- [ ] Report is evidence-based
