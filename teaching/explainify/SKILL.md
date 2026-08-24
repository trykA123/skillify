---
name: explainify
description: Teaches what code does and how its parts communicate, at your level and in your repo. Answers ephemerally in chat by default; tracks progress or produces a knowledge doc, glossary terms and a Mermaid wiring diagram only when requested or earned. Use when you ask about code, a module or a flow, or want the connections mapped.
---

# Explainify

**Output controls:** Inherit `Verbosity: Terse | Concise | Detailed` and
`Explanation: Expert | Operational | Teaching`; default to Concise and Operational.
These control presentation, never evidence or safety. Use plain technical English:
active voice, stable terms, conditions before commands, and no filler or process theatre.

The codebase is the curriculum, and the target is a junior who has to be able to work in
it afterwards — not a summary that sounds right.

**Answer in chat. That's the default and usually the whole job.** Most tools of this kind
can't resist producing an artifact; an unread document is worse than a good answer.

## Choose persistence first

**Ephemeral** is the default: answer from the conversation and code, and write nothing.

**Tracked** requires an explicit request to track progress, save durable learning, or
record the session. Resolve `<learning-root>` from runtime configuration; when none is
supplied, use `~/.skillify/learnings/`. Load the Explainify profile there (create it from
`seeds/profile.md`), the repo's `docs/learnings/` index, and the shared progress file.

## Read the actual code

Never the assumption. Read the symbols in the question, their callers, their tests, their
config — and follow **one concrete path end to end**. That path is what separates an
explanation from a paraphrase of the file names.

## Teach at their level

- **What it does** — plain language, two or three sentences. Analogies only when they
  illuminate rather than decorate.
- **The wiring** — how the parts communicate: calls, events, data flow, config. One path
  traced, with real line references.

Real examples only. Use the conversation to calibrate level; in tracked mode, use the
profile too. Explaining a basic concept to someone who already applies it daily is how a
teacher loses their audience.

## Escalate only when earned

Produce durable artifacts when the explanation spans **three or more modules** (chat
can't hold that much wiring), the user asks for something durable, or **the same module
gets asked about twice** — the second question is proof the first answer didn't stick.

- **Knowledge doc** — `docs/learnings/<slug>.md`, one per module or flow, **updated in
  place and dated**. Never one doc per question; that's how a learnings folder becomes
  unreadable. Cover what it does, the wiring, key symbols, gotchas.
- **Glossary** — one to three terms that a competent engineer genuinely wouldn't guess
  and where misreading costs real time.
- **Wiring diagram** — mermaid *source*, not hand-drawn SVG: the executor writes
  `A -->|call| B` rather than coordinates, so it survives regeneration and stays
  greppable against the code. One node per module with real names, edges labelled with
  the kind of communication, one diagram maximum.

If none of those fire, skip durable artifacts entirely. In tracked mode, note one dated
observation in the profile; in ephemeral mode, stop after the chat answer.

## Tracked learning

When tracking is requested, update the learning runtime's profile and progress store
under `<learning-root>`. If the runtime provides a competency map, record the touched
areas with honest positive or negative evidence. Skillify does not require a particular
progress schema or renderer, and it keeps durable learning data outside this repository.

Record the session through recordify only when tracking was requested.

## Done when

They can explain it back, or ask a sharper follow-up question. The sharper follow-up is
the better signal.

In ephemeral mode, nothing changes. In tracked mode, changes stay inside
`<learning-root>` and the requested record destination. Explaining code is not licence
to edit product code.
