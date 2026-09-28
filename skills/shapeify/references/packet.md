# Standard packet

```markdown
# Plan — <slug>
**Weight:** Standard | Heavy

## Outcome
<one paragraph: what exists when done>

## Scope
- In: <components and behaviors>
- Out: <tempting adjacent work, excluded>

## Requirements and invariants
- R1: <one testable behavior>
- I1: <what stays true, including on failure paths>

## Constraints and priorities
<hard limits; X > Y > Z; anti-examples>

## Evidence
- [FACT] <fact> — <source>
- [ASSUMPTION] <assumption> — breaks if false: <…> — checked by: <step>
- [DECISION] <decision> — why — rules out: <…>

## Steps
- P1: <change> [ISOLATE | BATCH]
  - Depends on: <P* or none>
  - Location: `path` → `symbol`
  - Verify: <exact command or observation>
  - Fails if: <what disproves the step>
  - Trap: <likely wrong move, if any>

## Acceptance
- A1: <command or observation> → <expected> — proves R1, I1

## Stop conditions
<what makes the executor stop instead of improvising>

## Revision log
```

Tag `[ISOLATE]` for irreversible, public-contract, or high-risk steps: verify each one
alone. Tag `[BATCH]` for additive, low-risk steps that share one verification.

Slice the plan (S1, S2, …) when it has more than eight steps, several deployable units,
or cannot return to green in one sitting. Each slice is committable with its own
acceptance. Save sliced or multi-session plans to `plans/<YYYY-MM-DD>-<slug>.md`
unless the project already has a plans location.

## Heavy additions

- **Decision owner** for each destructive action, production change, and accepted risk.
- **Rollback:** what is protected, how to restore it, the trigger to roll back, the
  recovery check, and the point of no return.
- **Proof type** per acceptance check: static, fixture, live, or owner-observed. Never
  let static proof stand in for a live property.
- **Isolation:** a dedicated branch or worktree, one writer, and who integrates.
- **Stop** on missing authority, an untested backup, unexplained data drift, or a
  failed recovery drill.
