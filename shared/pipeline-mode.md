# Pipeline mode

Unattended `Undumbify → Shapeify → Shipify → Reviewify`. One receipt at entry,
inheritance afterwards, no re-selection inside lanes. It changes ceremony, never
authority or safety.

## Entry receipt

Pipeline mode is opt-in by naming it. Accept `pipeline`, `pipeline mode`, or the
explicit topology `Planner → Worker → Reviewer`:

```text
Selected: Pipeline · Standard · Concise · Team: Planner → Worker → Reviewer
```

This single receipt replaces per-stage choice cards. Delegated lanes inherit
Weight, Verbosity, and exact topology per the handoff contract and do not reopen
selection unless a new material decision falls outside their boundary.

Use pipeline mode when intent is settled enough to plan, or when Undumbify will
settle it first. Do not use it for open exploration, single-file questions, or
anything inside a traceify loop.

## What inherits, what stops

Inherits unchanged through every handoff: Weight, Verbosity, Ownership topology,
`R*`/`I*`/`A*`/`P*`/`S*` IDs, plan folder paths, revision.

The canonical plan index is `plans/<date>-<slug>/index.md`. Shapeify creates it; the
parent or named integration owner applies status transitions from the execution and
review artifacts. Shipify and Reviewify do not mutate the index from their
artifacts-only lanes.

Each lane still stops on its own contract:

- Planner on thin intent: open question in packet, no guess.
- Worker on false premise: Revision Request or Packet Defect, never quiet patch.
- Reviewer on Blocking: verdict routes to Shipify or Shapeify, never silent fix.
- Any lane on destructive surprise, missing authority, writer collision, or new
  material product/architecture/safety decision: stop and escalate.

Selection never grants authority. Pipeline mode never grants it either.
Destructive actions and material decisions need their own explicit approval,
even mid-pipeline.

## Repair loop bound

`Worker → Reviewer` loops only while each repair carries new evidence and the
plan premise still holds:

1. Shipify repairs, cites evidence, hands to Reviewify.
2. Reviewify Delta-reviews prior `F*`, changed lines, affected acceptance.
3. Stop when evidence falsifies the premise, the same `F*` survives an
   equivalent repair, or two cycles pass without progress.

Then route the defect: Revision Request when a step assumption is wrong,
Packet Defect when requirements, invariants, or scope must change. A retry
count is not permission to repeat work without new information.

## Weight in pipeline

Inherit the declared weight, promote on new risk, never silently demote.

- **Light** — inline packet, inline evidence, Reviewify skippable only for a
  trivial reversible change with passing direct check and stated residual risk.
- **Standard** — full packet, per-slice evidence, Reviewify required.
- **Heavy** — Standard plus decision owners, proof owners, rollback drill,
  dedicated branch/worktree, independent reviewer. Self-approve is Partial
  with residual risk, never Approve.

## Topology

At most one product-code writer per working directory. Parallel lanes are
read-only or isolated dirs with a named integration owner. Parent coordinates
linear `Planner → Worker → Reviewer`. Add Orchestrator only for parallel
lanes, branching handoffs, or iterative repair needing integration ownership.
