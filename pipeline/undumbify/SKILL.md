---
name: undumbify
description: Extracts intent from ambiguity using six dimensions (constraints, anti-examples, priorities, feeling of done, pushback permission, existing knowledge). Context-aware — assesses what's already known before asking. Use when the user has a direction but it's vague, or to pressure-test a prompt before shapeify.
---

# Undumbify

Converge intent into decisions. Unlike a generic "clarify" step, this skill extracts
**what matters for judgment** — not technical scope (that's shapeify's job).

## Context Awareness (Run First)

Before asking anything, assess what you already know from:
- Conversation history (prior decisions, stated preferences, established context)
- Codebase state (existing patterns, tech stack, architecture)
- The user's profile (expertise level, past feedback)

Mark each of the six dimensions as: **known** (evidence exists), **assumed** (reasonable
default), or **unknown** (genuinely needs input). Only ask about unknowns that pass the
Materiality Gate.

This is the core difference from v1: you do NOT start from zero. You start from what the
conversation already established and only probe the gaps.

## The Six Dimensions

Extract these from the user's input + context. These are what you need to make good
judgment calls during implementation.

**Plain-language aliases** — use these when talking to the user; keep the formal names
for the Intent Brief output only:

| Formal name | Ask the user… |
|-------------|---------------|
| Constraints | "What's off the table?" |
| Anti-examples | "What should this NOT look like?" |
| Priority ordering | "When things clash, what wins?" |
| Feeling of done | "How will you know it's right?" |
| Pushback permission | "Can I tell you 'no'?" |
| Existing knowledge | "What do you already know?" |

A junior doesn't need to know what "anti-examples" means — they answer the plain
question naturally.

### 1. Constraints — *"What's off the table?"*
What kills options? Tech, time, budget, compatibility, physical limits.
Not preferences — things that make an approach literally impossible.

### 2. Anti-examples — *"What should this NOT look like?"*
High-signal negation. "Not corporate." "Not like Spotify." "Don't make it feel heavy."
Each anti-example eliminates a region of possibility space.

### 3. Priority ordering — *"When things clash, what wins?"*
Speed vs polish. Simplicity vs power. Consistency vs novelty.
When two requirements conflict during implementation, this resolves it silently.
Format: `X > Y > Z` (most important first).

### 4. Feeling of done — *"How will you know it's right?"*
Not acceptance criteria — the *experience* of completion.
"I'll know it's right when..." / "It should feel like..."
This guides the 100 micro-decisions no checklist can enumerate.

### 5. Pushback permission — *"Can I tell you 'no'?"*
Can the agent say "I think that's wrong because..."?
Some users want execution; others want a thinking partner.
Default: collaborator (push back with evidence, not authority).

### 6. Existing knowledge — *"What do you already know?"*
What does the user already understand? Prevents over/under-explaining.
"I know React well, skip basics" vs "I'm a backend dev, explain frontend concepts."

## Materiality Gate

For each unknown dimension, ask:

> Would two plausible answers produce materially different, difficult-to-reverse outcomes?

- **Yes:** Ask one focused question. Explain which decisions it controls.
- **No:** Choose the conservative default, label it as assumption, continue.
- **Discoverable from context/code:** Investigate directly, don't ask.

Never ask a question the conversation already answered. Never ask a question whose answer
you can observe from the codebase.

## Produce The Intent Brief

```yaml
intent: <one line — what outcome matters and to whom>
constraints: <hard limits that kill options>
anti_examples: <what it must NOT be or feel like>
priorities: <X > Y > Z ordering for conflict resolution>
feeling_of_done: <the gestalt — "I'll know it's right when...">
pushback: collaborator | executor
existing_knowledge: <what to skip explaining>
current_state: <what exists now, from evidence>
target_state: <observable change>
assumptions: <labeled defaults for dimensions not confirmed>
risks: <what could go wrong, from evidence>
skill_map_signal: <one honest line about input quality, e.g. "asked 3 questions → constraints were buried", or "none">
topology: single-agent | subagent
```

Keep it lean. If a dimension is fully known from context, one line suffices. If unknown
and immaterial, it goes in assumptions with its default. No padding.

## Modes

| Mode | When | Output |
|------|------|--------|
| **Converge** | User has vague direction, needs it sharpened | Intent Brief |
| **Pressure-test** | User has a plan/proposal, wants it stress-tested | Intent Brief + gap analysis |
| **Handoff** | Intent is clear enough for shapeify | Intent Brief routed to shapeify |

Infer the mode. Honor explicit overrides.

## Routing

- **Converge / Pressure-test:** Return the brief. User reviews, may iterate.
- **Handoff:** Pass brief to `shapeify`. Do not duplicate shapeify's planning work.

Use Handoff only when the user approves or the work is reversible.

## Topology Behavior

- **Single-agent:** The brief is an internal working note. Keep it short — you already
  have the context. The value is in making implicit knowledge explicit for your future
  self (post-compaction) and for shapeify if dispatched to a subagent.
- **Subagent dispatch:** The brief must be self-contained. Include enough context that a
  fresh agent can plan without seeing the conversation. This is when the brief earns its
  full structure.

## Invocation Brake

Skip when: the task is already decision-ready, it's a direct low-risk operation, the user
asked a quick factual question, or you're in a traceify loop (traceify has its own
convergence path).

## Final Gate

- [ ] Context assessed before asking (no redundant questions)
- [ ] All six dimensions addressed (known, assumed, or asked)
- [ ] Materiality Gate applied to every question
- [ ] Anti-examples captured (or confirmed absent)
- [ ] Priority ordering exists (even if implicit from context)
- [ ] Feeling of done captured (or confirmed as "acceptance criteria suffice")
- [ ] Brief is lean — no padding, no restating what's obvious
- [ ] Topology declared
