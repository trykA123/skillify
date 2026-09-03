---
name: migrateify
description: Move dependencies, frameworks, or data to a new version without breaking things. Record where you stand, read what changed upstream, upgrade in small verified steps, and prove you can roll back before touching data. Use when upgrading dependencies or changing schemas.
---

# Migrateify

**Interaction gate.** Apply [the shared interaction gate](references/interaction-gate.md)
before task work. Infer Weight, Verbosity, and Ownership; treat Explanation as opt-in.
Show a route card only when routes are genuinely contested after a quick look at the
subject, the work is Heavy, or a step is destructive or irreversible — otherwise proceed
on the inferred route with a one-line receipt.

**A migration swaps contracts under living code.** The application keeps running; the
promises around it move. Discipline comes from three habits: pin where you stand, read
where you are going, and land one hop at a time. In pipeline use, hops are `S*`
slices per [artifacts](references/artifacts.md). Follow
[pipeline mode](references/pipeline-mode.md).

## Baseline before the first hop

Before bumping anything, capture the state you must preserve:

- current dependency versions and lockfile state;
- the test suite, lint, build, and startup path all green at the pinned versions;
- how the subject is deployed and how the previous version can be restored.

If the baseline cannot be made green, stop: that is a pre-existing defect, and a
migration built on it hides its own regressions. Report it and let the owner decide
whether fixing it is in scope.

## Upstream notes before edits

Read the changelog, release notes, and deprecation list for every intermediate major
version between the pinned and target release — not just the target. For each note that
touches your call sites, record: affected symbol or behavior, your usage count, and the
documented replacement. An undocumented breaking change is a finding, not a blocker;
a documented one you skipped is a self-inflicted one.

When notes and reality disagree, trust evidence over prose: verify which behavior the
new version actually exhibits, record the deviation in the result, and adapt the stage
plan. Do not silently absorb either direction.

## One verified hop at a time

Stage the route as separate landable hops — usually one dependency major version, or
one schema change, per hop:

1. **[ISOLATE]** each hop that changes public API surface, stored data, auth behavior,
   or runtime requirements.
2. **[BATCH]** mechanical fallout from one hop: call-site updates, codemods, type fixes.
3. After every hop, re-run the baseline proof before opening the next. A hop is landed
   when its proof passes and the tree could ship from it.

Prefer the official migration path (codemods, upgrade tools) over hand-rewrites; verify
its output rather than trusting it. When two viable staging routes exist and neither is
dominant — for example one big-bang hop against many small ones with real integration
risk between hops — show the choice card; otherwise take the staged route on a receipt.

## Stored data and schemas

Any transform of persisted state is Heavy by default. Before the first transform:

- prove the backup restores — a backup never tested is a hope, not a rollback;
- expand before contract: add the new shape, backfill, dual-read or shadow-write during
  the transition, switch readers, and retire the old shape as a later, separate hop;
- never make an irreversible transform part of the same step that changes code paths.

If no reversible route exists, name the point of no return explicitly in the plan and
get explicit approval before crossing it. Weight ceremony never authorizes destruction;
only the owner can.

## Route defects back

An upstream note contradicts observed behavior in a way that invalidates the stage plan,
or the target version removes a capability the product depends on with no replacement:
stop and return a structured deviation — what the notes claimed, what the evidence
shows, which stages are affected, and the proposed amended route. Do not force the plan
through as an implementation detail, and do not quietly patch around the gap.

## Done when

Every planned hop has landed behind passing proof, the final state is green at the
pinned target versions, the lockfile and migration artifacts are committed, stored-data
transforms have restore evidence or a consciously accepted point of no return, and the
result names any documented-but-unobserved upstream claims still worth watching.
