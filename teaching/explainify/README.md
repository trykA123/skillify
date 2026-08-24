# Explainify

Explainify teaches what code does and how its parts communicate.

It reads real symbols, callers, tests, and configuration. It follows one concrete path
from entry to exit. Ephemeral mode answers in chat. Tracked mode can maintain a learning
profile after an explicit request. Durable diagrams or knowledge documents are created
only when the scope or recurrence justifies them.

## Example

```text
Use Explainify. Verbosity: Detailed. Explanation: Teaching.
Trace a request from the handler to persistence. Explain each boundary and one failure
path. Do not edit product code.
```

Runtime contract: [SKILL.md](SKILL.md). Evaluation cases:
[`evals/explainify`](../../evals/explainify/cases.json).
