---
name: shapeify
description: Turn settled intent into a step-by-step plan anyone can follow: each step names its location, its check, and its trap. The plan stays easy to amend when execution proves a detail wrong. Use when the goal is clear but the how is not.
---

# Shapeify

**Interaction gate.** Apply [the shared interaction gate](references/interaction-gate.md)
before task work. Infer Weight, Verbosity, and Ownership; treat Explanation as opt-in.
Show a route card only when routes are genuinely contested after a quick look at the
subject, the work is Heavy, or a step is destructive or irreversible — otherwise proceed
on the inferred route with a one-line receipt.

**Architect intent in, a plan a junior can execute out.** The worker may receive only
the packet: no conversation, hidden reasoning or friendly author nearby. Follow
[artifacts](references/artifacts.md) for IDs, plan folder, and Brief → R/I mapping.
In pipeline mode, follow [pipeline mode](references/pipeline-mode.md): one inherited
receipt, no re-selection.

The junior bar is the contract. Give concrete files, symbols, commands and observable
results. When a location is unknown, write a bounded discovery step. For any step where
a reasonable executor could plausibly make the wrong move, name that trap.

## Select exactly one weight

Choose before writing the packet, state the choice, and read the matching module fully:

- **Light** — at most five steps and three files, one slice and owner, reversible, no
  public-contract change. Read [Light](references/weights/light.md).
- **Standard** — normal multi-file or feature work. Read
  [Standard](references/weights/standard.md).
- **Heavy** — production data, auth, schema, deployment, irreversible changes, public
  contracts or coordinated agents. Read [Heavy](references/weights/heavy.md), which
  also requires Standard.

When uncertain between Light and Standard, choose Light and name the assumption. Heavy
triggers are mandatory. Weight changes artifact depth, never authorization or safety.
Shipify may promote when execution reveals more risk; never silently demote. Accept
`Lite` only as the legacy spelling of Light in an existing packet.

## Shared reliability contract

- Stable IDs are `R*`, `I*`, `A*`, `P*` and `S*`; never rename them mid-delivery.
- Tag **Fact**, **Assumption** and **Decision** and never blur them.
- One authoritative instruction owns each change; later sections reference its ID.
- Every requirement and invariant reaches a step and an acceptance check.
- Every acceptance check names who or what produces its proof.
- Dependencies are acyclic and steps contain no vague verbs such as “update as needed.”

## Granularity and traps

Tag each step:

- **[ISOLATE]** when it touches irreversible state or a public contract, is high risk,
  or failure would obscure the next diagnosis.
- **[BATCH]** when it is additive, internal and low risk, or shares one useful
  verification boundary with adjacent work.

A trap is a plausible executor mistake, not a generic system risk. Write one only when
it changes execution: the tempting wrong symbol, a false-positive test, a lock or caller
the obvious change would violate. Forced traps become noise.

## Amend instead of improvising

When Shipify discovers that a step assumption is wrong but intent still holds, accept:

```markdown
## Revision Request
**Step:** P<n>
**Discovery:** <what the code or runtime actually shows>
**Affected assumption:** <which one is wrong>
**Proposed amendment:** <minimal plan change>
**Blast radius:** <other steps affected, or none>
```

Amend the step in place, append `[REV <date>] P<n>: <what changed and why>` to the
Revision Log, re-check downstream dependencies, and return only the amended section.
Use a **Packet Defect** when requirements, invariants or scope must change; route that
back to Undumbify.

## Done when

The selected weight module is satisfied, the dependency graph is executable, every
acceptance check proves named requirements or invariants, and the packet never relies
on “the discussion above.”
