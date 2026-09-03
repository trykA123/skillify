# Light packet (canonical)

Single canonical Light template for Shapeify and Shipify. Inline, no plan
folder, no risk register, no revision log. At most five steps, three files,
one slice, one owner, reversible, no public-contract change.

```markdown
## Light Packet
**Weight:** Light
**Outcome:** <what exists when done>
**Scope:** <in> | **Out:** <tempting adjacent work>
**Provenance:** <Intent Brief ID/field, or `[STANDALONE]` request/evidence/decision source>
**Requirements / invariants:** <R1/I1 with the provenance source above, inline when useful>
**Steps:**
1. <step> — `file` → `symbol` — verify: <command> — trap: <plausible wrong move, or omit>
**Done when:** <observable check proving the outcome>
**Risks:** <one line each, or none>
```

Keep `R*`/`I*` IDs when more than one requirement exists or Shipify will need
them during repair. Concision never hides a safety or authorization boundary.

Execution: run the directly exercising check, inspect the diff, keep evidence
inline. A separate Reviewify pass may be skipped only for a trivial reversible
change with that check passing. State residual risk before the user declines
review. Promote to Standard on any Heavy trigger.
