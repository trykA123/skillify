# Selection contract

The caller should describe the outcome in normal language. Do not require a Weight,
Verbosity, Explanation, skill, or role configuration block.

Before substantial work, offer **two to four mutually exclusive entries**. Use the
runtime's native choice UI when it has one; otherwise return a numbered list. Each option
contains:

- a plain label;
- one sentence describing the concrete impact;
- the inferred method or route, weight, verbosity, explanation, and topology in compact
  secondary text.

Put the recommended option first and mark it recommended. The last entry is
**Customize**, or the runtime's equivalent free-form entry; it opens
[the second-stage selector](customization.md) instead of starting work. Wait for the route
selection and any customization before dispatch or mutation. Do not add a duplicate
entry when the native UI already provides the equivalent control.

A tiny, reversible, single-owner task with one obvious method may skip the choice and
show a one-line receipt instead:

```text
Selected: Shipify · Light · Concise · Operational · Solo
```

Selection never grants authority. Destructive actions and material product, architecture,
or safety decisions still require their own explicit approval.
