---
name: skillify
description: Choose the right skill, agent, and output settings for your task, and learn how the pieces fit together. Use when asking how this system works.
---

# Skillify

**Interaction gate.** Apply [the shared interaction gate](references/interaction-gate.md)
before task work. Infer Weight, Verbosity, and Ownership; treat Explanation as opt-in.
Show a route card only when routes are genuinely contested after a quick look at the
subject, the work is Heavy, or a step is destructive or irreversible — otherwise proceed
on the inferred route with a one-line receipt.

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
4. Infer four independent axes: Weight for rigor, Verbosity for response length,
   Explanation for assumed knowledge, and Ownership for task topology. Express them
   through concrete choices, not an initial configuration form.
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
condition appears, and use these four axes for this reason.”
