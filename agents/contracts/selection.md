# Selection contract

The caller should describe the outcome in normal language. Do not require a Weight,
Verbosity, Explanation, skill, or role configuration block.

The caller should describe the outcome in normal language. Do not require a Weight,
Verbosity, Explanation, skill, or role configuration block.

After loading the applicable role or skill, take whatever quick look the request needs
to see what is actually contested; reading the subject is part of routing. Stop at
**two to four mutually exclusive entries** only when at least one holds:

- two or more genuinely viable approaches remain after that look;
- the work is Heavy by its risk profile;
- some step is destructive or irreversible.

Use the runtime's native choice UI when it has one; otherwise return a numbered list.
Each option contains:

- a plain label;
- one sentence describing the concrete impact;
- the inferred method or route, weight, verbosity, and topology in compact
  secondary text.

Put the recommended option first and mark it recommended. The last entry is
**Customize**, or the runtime's equivalent free-form entry; it opens
[the second-stage selector](customization.md) instead of starting work. Wait for the route
selection and any customization before dispatch or mutation. Do not add a duplicate
entry when the native UI already provides the equivalent control.

End the response after the card. Do not announce an inferred route and continue, and do
not replace user selection with a receipt.

Everything else proceeds on the inferred route with a one-line receipt instead of a
card:

```text
Selected: Shipify · Standard · Concise · Solo
```

Selection never grants authority. Destructive actions and material product, architecture,
or safety decisions still require their own explicit approval.

A delegated owner that receives a parent-confirmed receipt, assignment boundary, and
exact ownership topology inherits them and does not reopen selection. Reopen only when a
new material decision falls outside that confirmed boundary; name the decision and
return it to the parent or user before showing new routes.
