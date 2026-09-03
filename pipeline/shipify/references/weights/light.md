# Light execution

Use for a small, reversible change with one owner and targeted acceptance.
Canonical packet template lives in [light-packet](../light-packet.md) — Shipify
uses the same fields as Shapeify so IDs survive handoff.

When no packet exists, write this before editing (same canonical fields):

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

Keep evidence inline. Run the directly exercising check and inspect the diff. A separate
Reviewify pass may be skipped only for a trivial, reversible change with that check
passing. State any residual risk before the user declines review. See
[artifacts](../artifacts.md) and [pipeline mode](../pipeline-mode.md).
