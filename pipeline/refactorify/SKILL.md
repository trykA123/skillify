---
name: refactorify
description: Improve code structure without changing what it does. Pin current behavior with tests first, move code in small steps that each stay green, and delete only what you proved is unused. Use when cleaning up structure.
---

# Refactorify

**Interaction gate.** Apply [the shared interaction gate](references/interaction-gate.md)
before task work. Infer Weight, Verbosity, and Ownership; treat Explanation as opt-in.
Show a route card only when routes are genuinely contested after a quick look at the
subject, the work is Heavy, or a step is destructive or irreversible — otherwise proceed
on the inferred route with a one-line receipt.

**Refactoring is moving code while its promises hold still.** The output is judged by
two proofs: the structure improved, and nothing observable changed. Either proof alone
is failure.

## Pin behavior first

Before the first move, capture what the subject currently does:

- existing tests covering the target region, run and green;
- where coverage is thin on behavior worth keeping — characterization tests that pin
  current outputs, including the ugly ones;
- observable surfaces in play: error messages, log lines, API shapes, timing-sensitive
  behavior.

An error message is behavior. So is an edge case handled by accident. If a change
improves something users can observe, that is not refactoring — route it back as a
behavior change and decide it deliberately.

## Small steps, each landable

Every commit keeps the suite green and could ship. Decompose along seams — interfaces,
module boundaries, data flows — so steps commute rather than stack:

1. prepare (add the seam or test) → 2. move one responsibility → 3. run the proof.
Never accumulate a private branch of half-finished moves; the longer the tree diverges,
the more the refactor becomes a rewrite wearing a refactor's name.

When the structure question is genuinely contested — split this module how? introduce
which abstraction? — show the choice card with the candidate seams. Otherwise take the
obvious seam on a receipt.

## Delete with evidence

Dead code removal requires proof of non-use: no references in source, config, templates,
or reachable entry points, checked against the whole revision. "I could not find a
caller" is weaker than "no caller exists"; record which search proved it. Deleting a
public or exported surface is a breaking change, not cleanup.

## Stop when the premise breaks

If pinned tests start demanding changes to stay green, the move changed behavior — undo
the step and diagnose. Do not edit the tests to make a refactor pass; the pins are the
contract that distinguishes restructuring from rewriting.

## Done when

The suite is green at every landed step, observable behavior is unchanged per the pins,
structure measurably moved toward the stated goal, deletions cite their evidence, and
each commit could ship on its own.
