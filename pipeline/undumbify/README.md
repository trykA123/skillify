# Undumbify

Undumbify turns a rough direction into decision-ready intent.

It extracts what the user already knows and supplies the decisions an experienced
practitioner would notice. It asks only questions whose plausible answers produce
materially different outcomes. Discoverable facts are inspected instead of asked.

## Modes

- **Converge:** sharpen a vague direction.
- **Pressure-test:** find gaps in an existing plan.
- **Diverge:** offer distinct directions before convergence.
- **Handoff:** pass settled intent to Shapeify.

## Example

```text
Use Undumbify. Weight: Standard. Verbosity: Concise. Explanation: Operational.
I want login to feel faster and safer. Supply the missing decisions and ask only
questions that can change the architecture.
```

Runtime contract: [SKILL.md](SKILL.md). Evaluation cases:
[`evals/undumbify`](../../evals/undumbify/cases.json).
