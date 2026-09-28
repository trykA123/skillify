---
name: shapeify
description: Turn settled intent into an executable plan. Every step names its file and symbol, its verification, and the likely wrong move, so another agent can execute it without the conversation. Use when the goal is clear but the approach is not, or before handing work to someone else.
---

# Shapeify

Intent in, a plan someone else can execute out. Assume the executor sees only the plan:
no conversation and no author to ask. If intent is still vague, run `undumbify` first.

## Pick the weight

- **Light:** up to five steps and three files, reversible, no public contract change.
  Write the inline packet below.
- **Standard:** multi-file or feature work. Use the packet in
  [references/packet.md](references/packet.md).
- **Heavy:** touches production data, auth, schema, deployment, public contracts, or
  anything irreversible. Use the Standard packet plus its Heavy additions.

When unsure between Light and Standard, choose Light and state the assumption. Heavy
triggers are mandatory.

## Light packet

```markdown
**Outcome:** <what exists when done>
**Scope:** <in> · **Out:** <tempting adjacent work>
**Steps:**
1. <change> — `path` → `symbol` — verify: <command> — trap: <likely wrong move, or omit>
**Done when:** <observable check>
**Risks:** <one line each, or none>
```

## Rules for every packet

- Read the code first. Name real files, symbols, and commands. Mark a location you
  could not confirm as a discovery step, not as fact.
- Label facts, assumptions, and decisions separately.
- Each requirement (`R1`) and invariant (`I1`) reaches a step and an acceptance check.
- No vague verbs ("update as needed", "handle errors"). Say what changes.
- A trap is a plausible executor mistake: the tempting wrong symbol, a test that passes
  for the wrong reason, a caller the obvious change breaks. Omit traps you have to force.
- Do not edit code while planning. An obvious fix becomes a step.

## Amendments

When execution finds a wrong step assumption and the intent still holds, amend that
step in place and log it: `[REV <date>] P3: <what changed and why>`. When requirements
conflict, scope must change, or a material decision is missing, send it back to the
user or `undumbify` instead.

Done when every requirement has a step and a check, dependencies are acyclic, and
nothing depends on "the discussion above".
