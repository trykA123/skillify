# Orientify

Orientify builds a trustworthy codebase map before planning or editing starts.

## Use it when

- You inherited an unfamiliar repository.
- You returned after a long gap.
- A decision depends on understanding one real execution flow.

It traces an entry-to-exit path, tests module seams with the deletion test, and names
landmines. It does not fix them.

## Output

Small repositories receive a short orientation. Larger repositories receive a Codebase
Brief with vocabulary, architecture, hot spots, seams, landmines, open questions, and
the traced flow that supports the map.

## Example

```text
Use Orientify. Verbosity: Concise. Explanation: Operational.
Trace the main request flow and identify the first file a new developer must read.
Do not edit anything.
```

Runtime contract: [SKILL.md](SKILL.md). Evaluation cases:
[`evals/orientify`](../../evals/orientify/cases.json).
