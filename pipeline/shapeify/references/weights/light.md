# Light packet

Use this only after Shapeify selects Light. The packet is inline and is the complete
plan; do not create a plan folder, risk register or revision log.

Canonical template lives in [light-packet](../light-packet.md). Use it verbatim:

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

Keep IDs when the task has more than one requirement or invariant, or when Shipify will
need to refer to them during a repair. Concision is not permission to hide a safety or
authorization boundary. See [artifacts](../artifacts.md) for ID rules and
[pipeline mode](../pipeline-mode.md) for Light inheritance.
