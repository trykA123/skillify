# Selection contract

The caller should describe the outcome in normal language. Do not require a Weight,
Verbosity, Explanation, skill, or role configuration block.

After loading the applicable role or skill, substantial work must stop at **two to four
mutually exclusive entries** before subject inspection, task tools, dispatch, or
mutation. A request that needs multiple task actions, a durable artifact, or coordinated
work is substantial even when its scope is clear. Use the runtime's native choice UI
when it has one; otherwise return a numbered list. Each option contains:

- a plain label;
- one sentence describing the concrete impact;
- the inferred method or route, weight, verbosity, explanation, and topology in compact
  secondary text.

Put the recommended option first and mark it recommended. The last entry is
**Customize**, or the runtime's equivalent free-form entry; it opens
[the second-stage selector](customization.md) instead of starting work. Wait for the route
selection and any customization before dispatch or mutation. Do not add a duplicate
entry when the native UI already provides the equivalent control.

End the response after the card. Do not announce an inferred route and continue, and do
not replace user selection with a receipt.

A tiny, reversible, single-owner task with one obvious task action may skip the choice
and show a one-line receipt instead:

```text
Selected: Shipify · Light · Concise · Operational · Solo
```

Selection never grants authority. Destructive actions and material product, architecture,
or safety decisions still require their own explicit approval.

A delegated owner that receives a parent-confirmed receipt, assignment boundary, and
exact ownership topology inherits them and does not reopen selection. Reopen only when a
new material decision falls outside that confirmed boundary; name the decision and
return it to the parent or user before showing new routes.
