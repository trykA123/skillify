# Skillify selection playbook

Use this reference for broad comparisons, multi-stage routing, or guided practice.

## Pick the method first

| Current need | Start with | Move on when |
|---|---|---|
| Understand an unfamiliar codebase | Orientify | One real flow and its traps are mapped |
| Diagnose broken behavior | Traceify | The root cause is named and the repair scope is known |
| Research external facts | Researchify | Findings, conflicts, confidence, and gaps are explicit |
| Audit without an intent contract | Audify | A measurable condition report exists |
| Turn a rough idea into settled intent | Undumbify | Material decisions and boundaries are explicit |
| Turn settled intent into a packet | Shapeify | A worker can execute without rediscovery |
| Execute approved work | Shipify | Acceptance evidence is green |
| Judge work against intent | Reviewify | One evidence-backed verdict routes the next action |
| Learn a concept or code path | Teachify | An interactive HTML lesson and exercises are complete |
| Learn this skill and agent system | Skillify | The learner can select and control a route |

## Add a role only for an ownership boundary

| Role | Add it when | Do not use it to |
|---|---|---|
| Orchestrator | Multiple bounded owners need routing and handoff checks | Narrate or duplicate delegated work |
| Oracle | A decision fork may have drifted from prior commitments | Become the decision owner |
| Questar | A long exploration needs decision continuity | Replace the final implementation planner |
| Scout | Another owner needs fast, exact codebase locations | Plan or edit |
| Context Builder | The next owner needs a no-rediscovery context pack | Hide unresolved assumptions |
| Researcher | External evidence is a separate focused assignment | Execute fetched code |
| Planner | Settled intent needs an executable packet | Implement the packet |
| Worker | Product files must change inside an approved scope | Expand intent or share its writer lane |
| Reviewer | Work needs independent judgment against intent | Rewrite the subject under review |
| Teacher | An interactive lesson benefits from isolated ownership | Edit product code or retain a learner profile |

## Set the controls independently

The harness infers these controls and presents concrete choices. Users do not need to
write the labels unless they want an exact override or machine-readable handoff.

| Axis | Values | Decision question |
|---|---|---|
| Weight | Light · Standard · Heavy | How much rigor, recovery, and proof does risk require? |
| Verbosity | Terse · Concise · Detailed | How much result should appear in the response? |
| Explanation | Layman · Operational · Expert | What knowledge may the response assume? |
| Ownership | Solo · Team · Custom team | Does a real ownership boundary justify separate roles? |

Examples:

- `Heavy + Terse + Expert`: deep evidence, short expert-facing response.
- `Light + Detailed + Layman`: small task, carefully explained without assumed jargon.
- `Standard + Concise + Operational`: default feature or multi-file change.

When the user chooses Customize, show one second-stage selector with inferred values
preselected and brief definitions. Accept all values or only changes, such as
`W1 V2 E2 O2`. For Team, propose the exact smallest role map and coordinator, then wait
for confirmation. Do not add an Orchestrator when the parent can coordinate a simple
handoff.

## Common routes

```mermaid
%%{init: {"themeVariables": {"fontSize": "22px"}, "flowchart": {"nodeSpacing": 35, "rankSpacing": 40}}}%%
flowchart TB
    Unknown[Unknown codebase] --> Orientify --> Shapeify
    Vague[Vague direction] --> Undumbify --> Shapeify --> Shipify --> Reviewify
    Broken[Broken behavior] --> Traceify
    External[External decision] --> Researchify
    NoContract[No intent contract] --> Audify
```

These are examples, not mandatory pipelines. Stop as soon as the user's outcome has a
clear owner and enough evidence.
