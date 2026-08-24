# Reviewify

Reviewify judges work against its intended behavior.

It reads intent before the diff, maps requirements and invariants to proof, chooses a
small set of relevant review lenses, traces a real failure path, filters style-only
comments, and issues one verdict.

## Verdicts

- **Approve:** no Blocking finding and every Material risk is fixed or accepted.
- **Fix required:** a Blocking defect exists but the design holds.
- **Rework:** implementation is wrong and the plan is sound.
- **Replan:** the plan itself is wrong.

## Example

```text
Use Reviewify. Weight: Standard. Verbosity: Concise. Explanation: Operational.
Review this diff against its worker packet. Return only located findings and one verdict.
```

Runtime contract: [SKILL.md](SKILL.md). Weight modules:
[`references/weights`](references/weights). Evaluation cases:
[`evals/reviewify`](../../evals/reviewify/cases.json).
