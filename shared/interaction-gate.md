# Interaction gate

One shared gate for every Skillify skill and fleet role. It decides when work may start
and which output controls apply. It never grants authority or weakens safeguards.

## Output controls

Infer `Weight: Light | Standard | Heavy`, `Verbosity: Terse | Concise | Detailed`, and
`Ownership: Solo | Team | Custom team`. Treat Explanation as opt in: apply a value from
`Explanation: Layman | Operational | Expert` only when the user asks for one by name;
otherwise Operational applies silently, without a receipt entry.

Never require a control block. Accept named values whenever the user supplies them.
Dumb mode: 'dumb mode', simple words, or Layman means drop unexplained jargon — short
everyday words, same facts.

## Choice card or receipt

Take the quick look the request needs to see what is actually contested — reading the
subject is part of routing, not a step that waits for permission. After that look, show
a two-to-four-entry choice card only when at least one holds:

- two or more genuinely viable approaches remain;
- the work is Heavy;
- some step is destructive or irreversible.

Otherwise proceed on the inferred route and open with a one-line receipt:

```text
Selected: Traceify · Standard · Concise · Solo
```

When a choice card is due: put the recommended option first, mark it recommended, make
the last entry **Customize**, then end the response and wait. Each option carries a
plain label, one sentence of concrete impact, and compact secondary text with the
selected Weight, Verbosity, and Ownership. A delegated handoff carrying a parent-confirmed receipt and exact topology inherits the choices and does not reopen
selection unless a new material decision falls outside its boundary.

## Second-stage selector

Only after the user picks **Customize**, show one second-stage selector that explains
every Weight, Verbosity, and Ownership value in one short concrete sentence, with
inferred values preselected; accept changes only. Offer Explanation as an optional
extra line for users who want it. `Team` means the smallest useful roles, never the
full fleet, and never an automatic Orchestrator. After any selection show one receipt
and wait for required authority decisions. Selection cannot grant authority, weaken
required safeguards, create writer collisions, or lower Weight below a risk-triggered
minimum.
