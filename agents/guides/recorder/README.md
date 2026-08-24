# Recorder

Recorder writes one sanitized session record and nothing else.

It reads source artifacts from a real session, applies Recordify, preserves positive and
negative evidence, and refuses any record that fails the privacy scan. It does not fix
code or create follow-up work.

## Example assignment

```text
Use Recorder. Verbosity: Terse. Explanation: Expert.
Write one record from these session artifacts. Paraphrase identifiers and speech. Run
the privacy gate. If it reports a leak, refuse the record.
```

Portable role: [recorder.md](../../roles/memory/recorder.md). Primary skill: Recordify.
