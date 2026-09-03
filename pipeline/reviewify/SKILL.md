---
name: reviewify
description: Judge work against its goal, not against taste. Look deep in a few places, report only findings that have a location and a fix, and give one verdict. Use after implementing, or to review a diff or pull request.
---

# Reviewify

**Interaction gate.** Apply [the shared interaction gate](references/interaction-gate.md)
before task work. Infer Weight, Verbosity, and Ownership; treat Explanation as opt-in.
Show a route card only when routes are genuinely contested after a quick look at the
subject, the work is Heavy, or a step is destructive or irreversible — otherwise proceed
on the inferred route with a one-line receipt.

**Work in, one evidence-backed verdict out.** Judge the implementation against its
requirements, invariants, priorities and anti-examples—not against personal taste.
Follow [artifacts](references/artifacts.md) for F* findings, coverage, and review
paths. In pipeline mode, follow [pipeline mode](references/pipeline-mode.md) for the
bound repair loop.

## Resolve weight and output mode

Inherit weight from the packet. Without one, infer from the review boundary and state
it. Promote on a Heavy trigger; never silently demote. Read the matching module:

- [Light](references/weights/light.md) — changed contract and nearest failure path.
- [Standard](references/weights/standard.md) — normal implementation review.
- [Heavy](references/weights/heavy.md) — production data, auth, schema, deployment,
  irreversible work, public contracts or coordinated agents; it also requires Standard.

Weight controls coverage. Output mode controls packaging:

- **Solo** — findings and fixes for the builder who was present.
- **Full** — standalone handoff for another person, agent, team or plan folder.

Infer the mode and state it in one word. Do not turn a quick review into ceremony.

## Review in contract order

State the file, slice or commit boundary. Read the packet before the diff; diff-first
anchors the review to what was written instead of what was required. Reconstruct the
intended design in three to five lines. If intent cannot be reconstructed, the first
finding is Blocking.

Requirement fit and invariant safety are always lenses. Choose only one or two more
with real surface—boundaries, public contracts, failure modes, data integrity, security,
priority alignment or anti-examples—and say what was skipped. Trace at least one
realistic failure path end to end.

## Grade and filter

| Severity | Meaning | Effect |
|---|---|---|
| **Blocking** | Violates a requirement, invariant, contract or safety property | Stops delivery |
| **Material** | Correct today but carries concrete risk or debt | Fix or named-owner acceptance |
| **Advisory** | Improvement with no correctness consequence | Optional |

Drop linter/type-checker restatements, cost-free style preferences, rewrites outside the
change, and anything without a location and concrete fix. Cap Advisory findings at three
in Solo and five in Full.

Each finding names the problem, severity, location, concrete consequence, fix and proof.
Full mode also names type, affected `R*`/`I*`, observed behavior, principle, and what
evidence would prove the finding wrong.

## Issue one verdict

| Verdict | Condition | Route |
|---|---|---|
| **Approve** | No Blocking; every Material is fixed or accepted by a named decision owner with a reason | done |
| **Fix required** | Blocking exists, design holds | Shipify |
| **Rework** | Implementation is wrong, plan is sound | Shipify |
| **Replan** | The plan is wrong | Shapeify as a Packet Defect |

After fixes, use Delta review: re-check prior findings, changed lines and affected
acceptance evidence, then scan for repair consequences. Reopen full coverage only when
the repair changes design, scope or an invariant.

## Durable decisions

Full mode may produce an ADR only when the decision constrains future work, rejects a
real alternative for a reason, and is costly to reverse. Add a glossary entry only when
a competent engineer would not guess the term and misreading it causes a real mistake.

## Skip when

A one-line change with a passing direct test, a revert, a generated-file update or a
direct code question does not earn a review gate. Answer the question or report the
existing check instead.

## Before emitting

Confirm every finding survived because someone must act, the severity reflects its real
cost, coverage matches the selected weight, and the verdict follows mechanically from
the findings rather than the desire to say something.
