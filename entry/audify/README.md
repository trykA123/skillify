# Audify

Audify evaluates a subject that has no written intent contract.

## Use it for

- Repository or configuration health.
- A discussion or plan with unclear decisions.
- A running system that needs an evidence-based condition report.

Audify defines three to six criteria before deep inspection. Each finding needs a
reproducible observation, provenance, severity, effort, location, and first action. The
final artifact is a self-contained HTML report with no runtime network dependency.

## Example

```text
Use Audify. Verbosity: Terse. Explanation: Operational.
Audit this repository for maintainability, verification quality, portability, and
security boundaries. Show me the proposed standard before the deep pass.
```

Use Reviewify instead when a packet already defines intent. Runtime contract:
[SKILL.md](SKILL.md). Evaluation cases: [`evals/audify`](../../evals/audify/cases.json).
