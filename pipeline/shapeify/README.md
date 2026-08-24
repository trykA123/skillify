# Shapeify

Shapeify converts settled intent into an executable worker packet.

## Weight modules

- **Light:** inline plan for a small reversible change.
- **Standard:** requirements, invariants, evidence, risks, located steps, and acceptance.
- **Heavy:** Standard plus decision owners, proof owners, recovery, and writer topology.

Each step names its location, verification, failure signal, and any plausible executor
trap. A false assumption produces a Revision Request. A change to intent produces a
Packet Defect.

## Example

```text
Use Shapeify. Weight: Heavy. Verbosity: Terse. Explanation: Expert.
Plan this production schema migration. Require rollback, recovery proof, isolated writer
lanes, and independent review.
```

Runtime contract: [SKILL.md](SKILL.md). Weight modules:
[`references/weights`](references/weights). Evaluation cases:
[`evals/shapeify`](../../evals/shapeify/cases.json).
