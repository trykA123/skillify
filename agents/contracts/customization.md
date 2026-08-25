# Customization contract

Use this second-stage selector only after the user chooses **Customize**. Do not show it
before the first route card, and do not turn ordinary requests into configuration forms.

Show the inferred value as preselected for each independent axis and explain every value
in one short, concrete sentence:

| Axis | Values | Meaning |
|---|---|---|
| Weight | Light · Standard · Heavy | Rigor, recovery, and proof |
| Verbosity | Terse · Concise · Detailed | User-facing response length |
| Ownership | Solo · Team · Custom team | Whether separate roles own bounded work |

Explanation (Layman · Operational · Expert) is not a selector axis by default. Offer it
as one optional extra line for users who want to set the assumed knowledge explicitly.

Use one multi-field native form when the runtime supports it. In a text-only runtime,
label choices so numbers cannot be confused across axes:

```text
Customize this run

Weight:     W1 Light · W2 Standard · W3 Heavy
Verbosity:  V1 Terse · V2 Concise · V3 Detailed
Ownership:  O1 Solo · O2 Team · O3 Custom team
Optional:   Explanation E1 Layman · E2 Operational · E3 Expert

Current: W2 · V2 · O1
Reply with all values or only changes, for example: W1 V2 O2
```

The real selector includes the short meanings, not only the compact example above.
Accept labels, codes, or natural language. Unchanged axes keep their preselected values.

`Team` means the runtime proposes the smallest useful role topology for the task. It
never means the full fleet and it does not automatically add an Orchestrator. The parent
session can coordinate a simple sequential handoff. Add an Orchestrator only when
coordination is substantial: parallel lanes, branching handoffs, several roles,
integration ownership, or an iterative repair and review loop.

After `Team`, show the exact proposed roles, each role's mutability, and whether the parent
or an Orchestrator coordinates them. Wait for confirmation before dispatch. `Custom team`
lets the user name roles; validate them against capability, mutability, independence, and
single-writer constraints, then show the same ownership map for confirmation. Ask one
additional bounded role question only when the requested roles cannot be inferred safely.

After selection, show one receipt and wait for any required authority decision:

```text
Selected: Light · Concise · Team
Suggested team: Scout → Worker
```

Customization applies to the current task unless the user explicitly asks to save a
preference. It cannot grant authority, weaken required safeguards, create writer
collisions, or lower Weight below a risk-triggered minimum. If a requested value is not
valid, keep the nearest valid value and explain the constraint before execution.
