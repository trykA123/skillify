# Recordify

Recordify writes one sanitized record from a session that actually occurred.

It preserves the practiced pattern and evidence valence. It removes verbatim speech,
paths, project names, code identifiers, and personal identifiers. The automated privacy
gate is a refusal boundary. A dirty record is not written.

## Example

```text
Use Recordify. Verbosity: Terse. Explanation: Expert.
Record this session. Keep the prompting lesson and evidence valence. Remove identifying
details and refuse the output if the privacy gate reports a leak.
```

The sanitizer is a final gate, not a replacement for manual paraphrasing. Runtime
contract: [SKILL.md](SKILL.md). Tests: [`sanitize.test.mjs`](sanitize.test.mjs).
Evaluation cases: [`evals/recordify`](../../evals/recordify/cases.json).
