---
name: undumbify
description: Turns a rough prompt into intent an architect would have written — extracting what the user knows, and supplying what they didn't know to say. Use when the user has a direction but it's vague, or to pressure-test a prompt before shapeify.
---

# Undumbify

**Interaction gate.** Apply [the shared interaction gate](references/interaction-gate.md)
before task work. Infer Weight, Verbosity, and Ownership; treat Explanation as opt-in.
Show a route card only when routes are genuinely contested after a quick look at the
subject, the work is Heavy, or a step is destructive or irreversible — otherwise proceed
on the inferred route with a one-line receipt.

**Rough prompt in, architect-grade intent out.** First rung of the ladder: the user
brings the problem, you bring the judgment they don't have yet.

Two jobs, and the second is the one that matters.

1. **Extract** what the user knows but didn't say.
2. **Supply** what they didn't know to say — the constraints, failure modes and
   decisions that experience in this problem class would have surfaced.

A junior asking for "a login page" doesn't know to specify session expiry, password
reset, or what happens on the third failed attempt. Mining them for it produces
silence. Naming it produces a decision.

## Assess before asking

Mark each dimension **known** (evidence exists), **assumed** (a default you'll state),
or **unknown**. Draw on conversation history, the codebase, and what the user has told
you before. Never ask what the conversation already answered or the code already shows.

## The six dimensions

Ask in the right-hand column. The left-hand names are for the brief only — a junior
answers the plain question naturally and never needs the vocabulary.

| Dimension | Ask | What it controls |
|---|---|---|
| Constraints | "What's off the table?" | Which options are impossible, not merely disliked |
| Anti-examples | "What should this NOT look like?" | Eliminates whole regions of the space |
| Priority ordering | "When things clash, what wins?" | Resolves conflicts silently during execution — `X > Y > Z` |
| Feeling of done | "How will you know it's right?" | The hundred micro-decisions no checklist enumerates |
| Pushback permission | "Can I tell you 'no'?" | Thinking partner or executor. Default: partner |
| Existing knowledge | "What do you already know?" | Stops over- and under-explaining |

## The architect pass

Before asking anything, answer this yourself:

> What does someone experienced in this problem class know that the user hasn't
> mentioned?

Produce the ones that matter as **named decisions with a recommendation** — not as
questions. Three or four is plenty; a wall of them is its own kind of unhelpful.

- *"You haven't said what happens when the token expires mid-upload. I'd resume
  rather than fail — say if not."*

That single move is what separates this from a clarifying questionnaire. The user is
a noob by construction; asking them to supply architecture is asking the wrong party.

## Materiality Gate

For each remaining unknown:

> Would two plausible answers produce materially different, hard-to-reverse outcomes?

- **Yes** — ask one focused question, and say which decision it controls.
- **No** — take the conservative default, label it an assumption, move on.
- **Discoverable** — go and look. Don't ask.

## Output — the Intent Brief

```yaml
intent: <one line — what outcome matters and to whom>
constraints: <hard limits that kill options>
anti_examples: <what it must NOT be or feel like>
priorities: <X > Y > Z>
feeling_of_done: <"I'll know it's right when...">
pushback: partner | executor
existing_knowledge: <what to skip explaining>
current_state: <what exists now, from evidence>
target_state: <observable change>
supplied: <decisions you raised that the user never mentioned — the architect pass>
assumptions: <labeled defaults, each with what breaks if wrong>
risks: <from evidence>
topology: single-agent | delegated-agent
```

Lean. A dimension known from context is one line. Delegated-agent dispatch is the only case
where the brief must stand alone without the conversation.

## Modes

- **Converge** — vague direction, needs sharpening. Return the brief.
- **Pressure-test** — user has a plan; return the brief plus what it's missing.
- **Diverge** — user doesn't know what they want yet. Offer 2–3 options that differ on
  a *fundamental axis*, not a variation. Blue button vs green button is one option;
  remove the button vs make it ambient is three. Sketch each concretely enough to react
  to, then converge on the one they point at.
- **Handoff** — intent is clear; pass to `shapeify`. Don't do shapeify's planning.

## Skip when

The task is already decision-ready, it's a direct low-risk operation, the user asked a
quick factual question, or you're inside a traceify loop.

## Before you emit

Two things that aren't checkable from the text above: every question you asked passed
the Materiality Gate, and the architect pass produced at least one thing the user
hadn't said. If it produced nothing, either the prompt was already good — say so — or
you didn't look hard enough.
