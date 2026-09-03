# Pipeline artifacts

One pipeline, one ID space. This file owns the canonical handoff schemas for
`Undumbify → Shapeify → Shipify → Reviewify`, plus the side-skill hooks.
It never grants authority or weakens safeguards.

**Schema version:** `1`. Durable Briefs, packets, execution evidence, indexes and
reviews must record `schemaVersion: 1` (or an equivalent heading) so a receiver can
reject an older or unknown shape instead of guessing.

## ID space

Stable IDs are `R*`, `I*`, `A*`, `P*`, `S*`, `F*`, `T*`. Never rename them mid-delivery.

- `R*` — testable requirement. Origin: Intent Brief `target_state` + `constraints`.
- `I*` — invariant. Origin: Intent Brief `constraints`, `anti_examples`, `priorities`.
- `A*` — acceptance check. Proves named `R*`/`I*`. Owner: Testify claims, Shapeify names proof owner.
- `P*` — ordered plan step. Depends on `P*` or none. Acyclic.
- `S*` — slice. A committable unit of `P*` steps with its own acceptance.
- `F*` — review finding. Names affected `R*`/`I*`.
- `T*` — test claim. Each `T*` maps to one `A*` or `R*`. Testify owns `T*`.

## Intent Brief → Requirements

When an Intent Brief is supplied, Undumbify emits the Intent Brief YAML and Shapeify
converts it mechanically:

| Brief field | Becomes |
|---|---|
| `target_state`, `intent` | `R*` requirements, one per testable behaviour |
| `constraints`, `anti_examples`, `priorities` | `I*` invariants + `Constraints & Priorities` |
| `current_state`, `Evidence` | `Evidence` `[FACT]` entries with sources |
| `assumptions` | `Evidence` `[ASSUMPTION]` + `how execution checks it` |
| `supplied` | `Evidence` `[DECISION]` + what it rules out |
| `risks` | `Risk Register` rows |
| `feeling_of_done` | `Acceptance` observable checks |
| `topology` | `Topology` + Heavy `execution topology` |

Each generated `R*`/`I*` cites its Brief field and line or stable Brief ID. No Brief line
that constrains execution may disappear without a downstream `R*`/`I*`/`A*` mapping.

Standalone Shapeify and Shipify remain valid when no Brief exists. In that case the
packet or Light micro-packet is the source of truth: mark each `R*`/`I*` as
`[STANDALONE]` with the request, inspected evidence or an explicit user decision as
its source. Do not invent an Intent Brief merely to satisfy provenance, and do not ask
Undumbify to repeat a decision-ready request.

## Plan folder

Use a folder for sliced work, cross-session execution, or explicit request.
Otherwise Light inline packet only.

```text
plans/<YYYY-MM-DD>-<slug>/
  index.md
  packet.md
  slices/S1-<slug>.md
  evidence/S<n>-report.md
  reviews/S<n>-review.md
```

`index.md` is the one canonical plan index. Do not use `README.md` as a plan index.
Shapeify creates the index and packet; after handoff, the parent or named integration
owner is the only owner allowed to mutate lifecycle status. Shipify records requested
status and execution evidence, and Reviewify records its verdict; neither role edits
`index.md` because both are artifacts-only lanes.

Minimal schema:

```markdown
# Plan — <slug>
**schemaVersion:** 1
**Weight:** Light | Standard | Heavy
**Status:** draft | ready | active | review-ready | changes-requested | blocked | done
**Slices:**
- S1: <name> — status: ready | active | review-ready | changes-requested | blocked | done — depends on: none | S*
**Revision Log:**
- [REV <YYYY-MM-DD>] P<n>: <what changed and why>
```

Lifecycle: `draft → ready → active → review-ready → done`. A review may move a slice
from `review-ready` to `changes-requested`; an accepted repair returns it to `active`,
then `review-ready`. `blocked` carries a Revision Request or Packet Defect ID and can
resume only after its owner resolves that decision. The parent or integration owner
applies these index transitions from the Shipify/Reviewify artifacts.

## Evidence and reviews

- Shipify writes `evidence/S<n>-report.md`: scope, outcome, step table (granularity, files, verification, result), acceptance table (check, proof, result), deviations, residual risks, follow-ups.
- Reviewify writes `reviews/S<n>-review.md`: boundary, reconstructed design, findings `F*` with affected `R*`/`I*`, coverage table (`R*`/`I*` → proof), one verdict.
- Delta review re-checks prior `F*`, changed lines, affected acceptance. Full coverage only when design, scope, or invariant changed.

## Side-skill hooks

- **Testify** — owns `T*` proof claims. Shapeify defines every `A*`, maps it to `R*`/`I*`,
  and names the proof owner; Testify may implement the `T*` test that proves that
  acceptance check but cannot redefine acceptance. Every `T*` names its `A*` or `R*` in
  the test name or assertion message. Quarantine record lives in
  `evidence/quarantine.md`: symptom, conditions envelope, decision.
- **Refactorify** — pins are `T*` by another name. Characterization tests become `T*` before the first move. Deletion proof cites search command + scope. Behaviour change routes back as Packet Defect, never silent test edit.
- **Migrateify** — hops are `S*`. Each hop is independently committable with its own `A*`. Deviation report uses Revision Request fields (`Step P<n>`, Discovery, Affected assumption, Proposed amendment, Blast radius).
- **Releaseify** — requires Reviewify `Approve` on every slice. Changelog entry cites commit, PR, or `P*`/`S*`. Rollback plan names previous artifact, revert command, data reversal or accepted irreversibility, owner. Tag built from exactly the tagged revision.

## Revision Request vs Packet Defect

```markdown
## Revision Request
**Step:** P<n>
**Discovery:** <what the code or runtime actually shows>
**Affected assumption:** <which one is wrong>
**Proposed amendment:** <minimal plan change>
**Blast radius:** <other steps affected, or none>
```

- **Revision Request** — step assumption wrong, intent holds. Shapeify amends in place, appends Revision Log, re-checks downstream.
- **Packet Defect** — requirements conflict, material decision missing, destructive action ungrounded, scope must change. Routes to Undumbify. Shipify stops.
