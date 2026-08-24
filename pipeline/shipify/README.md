# Shipify

Shipify executes an approved packet or decision-ready request.

It establishes a baseline before editing, respects one-writer ownership, executes
isolated and batched steps differently, verifies each step, classifies every deviation,
and stops when evidence disproves a plan premise.

## Weight behavior

- **Light:** inline micro-packet and targeted proof.
- **Standard:** full packet execution and slice evidence.
- **Heavy:** Standard plus recovery checks, isolated writers, and independent review.

## Example

```text
Use Shipify. Weight: Light. Verbosity: Terse. Explanation: Expert.
Apply this reversible two-file change. Run the direct test and inspect the final diff.
```

Runtime contract: [SKILL.md](SKILL.md). Weight modules:
[`references/weights`](references/weights). Evaluation cases:
[`evals/shipify`](../../evals/shipify/cases.json).
