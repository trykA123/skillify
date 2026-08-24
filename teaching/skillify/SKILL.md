---
name: skillify
description: Teaches users how to choose and combine Skillify skills, portable agent roles, and output controls for a real task. Use when someone asks how this repository works, which skill or agent to use, or wants guided practice. Do not activate for a task that already maps cleanly to another skill unless the user asks to learn the system.
---

# Skillify

**Controls are optional.** Infer `Weight: Light | Standard | Heavy`,
`Verbosity: Terse | Concise | Detailed`, and
`Explanation: Layman | Operational | Expert`; default to risk-based weight, Concise,
and Operational. Never require a control block. Before substantial work, offer two to
four concrete approaches through the runtime's choice UI or a numbered list; recommend
one and wait for the selection. For a tiny obvious request, show a one-line selection
receipt and proceed. Controls never weaken evidence, safety, or authorization.

Teach the system through the user's real task. The learner should leave knowing what to
invoke, why it fits, what not to add, and how to express the request portably.

## Choose a lesson mode

- **Route** — default when the user has a task. Recommend the smallest useful skill or
  role setup and provide a ready-to-use invocation.
- **Tour** — use when the user asks how the system works. Explain the method, role, and
  runtime split before covering only the relevant families.
- **Practice** — use when the user wants to learn by doing. Give one scenario, let the
  user choose, then explain the strongest choice and one tempting mismatch.

Read [the playbook](references/playbook.md) for a broad comparison, a multi-stage task,
or Practice mode. Do not load it for an obvious single-skill route.

## Build the smallest useful route

1. Name the user's outcome and current stage: unknown territory, unclear intent,
   planning, execution, diagnosis, review, research, or teaching.
2. Select the one skill that owns that method. Add another only when a real handoff is
   required.
3. Add agent roles only when separate ownership, context isolation, concurrency, or
   reviewer independence improves the task. One agent using one skill is valid.
4. Infer the three independent controls: Weight for rigor, Verbosity for response length,
   and Explanation for assumed knowledge. Express them through concrete choices, not a
   configuration form.
5. Explain the decisive reason in one sentence and provide a natural portable prompt.

Prefer a direct skill over a fleet when one owner can finish safely. Never recommend the
full pipeline or all roles as a default. Weight does not grant authority, and Heavy does
not imply Detailed.

## Teach, then stop

For Route mode, return:

| Field | Content |
|---|---|
| Start with | One skill or role and its method-owning skill |
| Add only if | The evidence that justifies another stage or role |
| Choices | Two to four concrete approaches, recommended first |
| Try this | A natural copy-ready request with no required control block |

For Tour mode, include a compact diagram or table only when it makes the relationships
clearer. For Practice mode, ask one scenario question at a time and give feedback after
the learner commits to a choice.

Do not perform, dispatch, or mutate the underlying task merely because it was used as a
lesson. If the user also requests execution, finish the short lesson and hand the task
to the chosen skill or role under the user's existing authority.

## Quality bar

The recommendation must use available skills and roles, preserve their boundaries, and
name why plausible alternatives are unnecessary. Avoid catalog dumps, orchestration
narration, vendor-specific syntax, model tiers, and claims that a role grants permission.

Done means the learner can state: “use this method now, add that role only if this
condition appears, and use these three controls for this reason.”
