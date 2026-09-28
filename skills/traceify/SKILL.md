---
name: traceify
description: Debug a failure whose cause is unknown. Capture symptoms, rank falsifiable hypotheses, run the cheapest discriminating test, and state the root cause before any fix. Use for errors, regressions, flaky or intermittent failures, and "it worked yesterday".
---

# Traceify

Find the cause, fix it minimally, prove the fix. Not for feature requests.

## 1. Capture symptoms first

Record before hypothesizing: exact error and exit code, expected vs actual, scope (who,
which path, how often), timeline (when it started, what changed near then), and where it
does and does not reproduce. If the report is thin, ask one question: "What is the
smallest thing I can do to see this myself?"

Intermittent: widen the timeline to the first occurrence, capture the conditions
(input, state, concurrency, environment, timing), and add instrumentation before
bisecting. Get a reliable trigger first.

## 2. Rank two to four hypotheses

Usual suspects: a recent change, a moved dependency, persisted state that disagrees with
the code, environment drift, a race.

```markdown
H1: <cause> (high|med|low) — because <evidence> — falsified by <observation> — test: <command>
```

A hypothesis without a falsifier is a belief.

## 3. Test the cheapest discriminator

Run the test that best separates H1 from the rest. Order of cost: read the log line,
`git log` the path, reproduce with minimal input, inspect runtime state, instrument,
bisect. Record each result; a falsified hypothesis still narrows the space. Stop at the
first confirmation unless evidence shows two causes.

## 4. State the root cause before editing

> The bug is **X** because **Y**, which causes **Z** when **condition**.

If you cannot write that sentence, keep testing. Separate the root cause (fix it), the
trigger (maybe guard it), and the symptom (should vanish).

## 5. Fix minimally

Smallest change at the root cause, one change at a time, no surrounding refactor. Add a
regression test when cheap: it should fail before the fix and pass after.

If the fix needs design decisions, spans several modules, migrates data, or changes a
contract, stop and return a root-cause brief (symptom, cause, evidence, fix scope, risk)
for planning with `shapeify`.

## 6. Verify

Reproduce the original trigger: the symptom is gone, nothing new broke nearby, the
regression test passes, persisted state is consistent. If verification fails, return to
step 2 with the new evidence. Never stack a second workaround on a wrong theory.

## Report

Symptom · root cause (one sentence) · evidence chain · fix · verification · regression
guard (or why none) · residual risk.
