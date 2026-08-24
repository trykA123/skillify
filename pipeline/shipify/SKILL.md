---
name: shipify
description: Executes a packet at senior standard — isolating risky steps, batching safe ones, classifying every deviation rather than improvising. Returns a structured Revision Request when the plan is wrong. Use when the user says "implement this" or hands you a plan.
---

# Shipify

**Output controls:** Inherit `Verbosity: Terse | Concise | Detailed` and
`Explanation: Expert | Operational | Teaching`; default to Concise and Operational.
These control presentation, never evidence or safety. Use plain technical English:
active voice, stable terms, conditions before commands, and no filler or process theatre.

**A junior-executable plan in, senior-grade work out.** Establish a baseline, verify
each step before the next, and never improvise around a false premise.

## Resolve the packet and weight

No packet is not a blocker: build a Light micro-packet inline. With a packet, validate
its outcome, scope, requirements, invariants, located and tagged steps, acceptance,
stops and risks. From a plan folder, read its index, packet and lowest ready slice.

Inherit the declared weight, or promote when evidence reveals more risk. Never silently
demote. Read exactly the applicable module before editing:

- [Light](references/weights/light.md) — small, reversible, targeted evidence.
- [Standard](references/weights/standard.md) — normal packet execution.
- [Heavy](references/weights/heavy.md) — production data, auth, schema, deployment,
  irreversible work, public contracts or coordinated agents; it also requires Standard.

Weight changes evidence depth and ceremony, not authorization, failure checks or data
protection.

## Stop on a bad packet

- **Revision Request** — a step assumption is wrong but intent holds: a path moved, a
  dependency is missing, or an equivalent local fact changed. Use Shapeify's template.
- **Packet Defect** — a material decision is missing, requirements conflict, a
  destructive action is ungrounded, or design and scope need reconsideration.

Do not force either class through as an implementation detail.

## Establish the baseline

Before the first edit, confirm branch, worktree and existing changes belong to this
task; never switch a shared checkout or absorb another writer's edits. Read the owning
symbol and nearest caller or test, run the cheapest check exercising current behavior,
and record pre-existing failures as out of scope.

## Execute by granularity

- **[ISOLATE]** — edit and verify immediately; return green before continuing.
- **[BATCH]** — group consecutive safe steps sharing one useful verification boundary.
  If red, isolate and discriminate the failing step.

Per step, restate the `R*`, `I*` and `A*` it serves; make the smallest coherent edit;
run its verification; record what changed and what ran. Evidence, not editing, marks a
step complete.

Stop as soon as evidence falsifies the step premise. Name the root cause of a failure
before repairing it, and never begin the next step while the current one is red.

## Classify every deviation

| Class | Action |
|---|---|
| Local correction | Fix an equivalent typo, path or API and record it. |
| Local defect | Repair implementation without changing requirements. |
| Plan defect | Stop with a Revision Request or Packet Defect. |
| Scope opportunity | Record as follow-up; keep it out of delivery. |
| Destructive surprise | Stop before mutation and ask. |

## Accept and report

Run every declared acceptance check plus the relevant compile, lint, type and test
checks. Inspect the diff for unexplained files, debug artifacts, secrets and scope
drift. Verify invariants independently. An unavailable check is not a pass: record the
reason, substitute evidence and residual risk.

Report outcome, deviations, follow-ups and one honest skill-map signal. Never claim a
check ran when it did not. Then hand to Reviewify under the selected weight's rule.

## Before finishing

Confirm there was a baseline, every completed step has evidence, every deviation is
classified, and the final diff still implements the packet rather than the discoveries
made along the way.
